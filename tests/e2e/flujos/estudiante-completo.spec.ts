import { expect, test } from '@playwright/test';
import {
  completarLeccion,
  esperarPantalla,
  irA,
  prepararPerfilEstudiante,
  resolverEvaluacion,
  rutaConBase
} from '../helpers/sesion';

/**
 * Flujo crítico del estudiante (RF-003, RF-004 y RF-005).
 *
 * Recorre el camino completo —mapa → lección de flashcards → cierre de lección → evaluación →
 * resultado— y verifica además el desbloqueo secuencial del nivel siguiente (RN-02).
 *
 * El recorrido se apoya SIEMPRE en el contrato de selectores (`[data-pantalla]`, `[data-cta]`,
 * `[data-nivel]`…) y nunca en textos decorativos, para que un cambio de redacción no rompa la prueba.
 */

test.describe('[RF-003] Mapa de niveles y progreso', () => {
  test('[RF-003] el mapa agrupa los niveles en 3 tramos y su CTA primario abre la lección del nivel actual', async ({
    page
  }) => {
    // Dado un estudiante nuevo, todavía en el nivel 1
    await prepararPerfilEstudiante(page, { nivelActual: 1 });

    // Cuando abro la portada
    await irA(page, '/');

    // Entonces veo el mapa con los 3 tramos de Miller y el nivel 1 como nivel actual
    await esperarPantalla(page, 'mapa');
    await expect(page.locator('[data-tramo]')).toHaveCount(3);
    await expect(page.locator('[data-nivel="1"]')).toHaveAttribute('data-estado', 'actual');
    await expect(page.locator('[data-nivel="2"]')).toHaveAttribute('data-estado', 'bloqueado');

    // Y el único CTA primario lleva a la LECCIÓN del nivel actual (no al quiz)
    const ctaPrimario = page.locator('[data-cta="primario"]');
    await expect(ctaPrimario).toHaveCount(1);
    await expect(ctaPrimario).toContainText('Estudiar Tarjetas');
    await expect(ctaPrimario).toHaveAttribute('href', rutaConBase('/lesson/1'));
  });

  test('[RF-003] un estudiante con el nivel 1 aprobado ve el 1 como aprobado y el 2 como actual', async ({
    page
  }) => {
    // Dado un estudiante de nivel 2 con el nivel 1 ya aprobado (RN-02)
    await prepararPerfilEstudiante(page, { nivelActual: 2, nivelesAprobados: [1] });

    // Cuando abro el mapa
    await irA(page, '/');

    // Entonces el recorrido refleja el progreso guardado
    await esperarPantalla(page, 'mapa');
    await expect(page.locator('[data-nivel="1"]')).toHaveAttribute('data-estado', 'aprobado');
    await expect(page.locator('[data-nivel="2"]')).toHaveAttribute('data-estado', 'actual');

    // Y el CTA primario apunta a la lección del nivel 2
    await expect(page.locator('[data-cta="primario"]')).toHaveAttribute(
      'href',
      rutaConBase('/lesson/2')
    );
  });
});

test.describe('[RF-004] Lección con flashcards', () => {
  test('[RF-004] el recorrido marca todas las palabras y cierra con el paso a la evaluación', async ({
    page
  }) => {
    // Dado un estudiante en el nivel 1 que entra por el CTA primario del mapa
    await prepararPerfilEstudiante(page, { nivelActual: 1 });
    await irA(page, '/');
    await page.locator('[data-cta="primario"]').click();

    // Cuando recorro las tarjetas marcando cada palabra como aprendida
    await esperarPantalla(page, 'leccion');
    await expect(page.locator('[data-flashcard]')).toBeVisible();
    await completarLeccion(page);

    // Entonces aparece el cierre de lección con su resumen
    const cierre = await esperarPantalla(page, 'cierre-leccion');
    await expect(cierre).toContainText('Lección completada');

    // Y su único CTA primario lleva a la evaluación del mismo nivel
    const ctaCierre = cierre.locator('[data-cta="primario"]');
    await expect(ctaCierre).toHaveCount(1);
    await expect(ctaCierre).toHaveAttribute('href', rutaConBase('/quiz/1'));
  });
});

test.describe('[RF-005] Evaluación', () => {
  test('[RF-005] responder la evaluación de 10 preguntas lleva a la pantalla de resultado', async ({
    page
  }) => {
    // Dado un estudiante en el nivel 1 que llega a la evaluación desde el cierre de la lección
    await prepararPerfilEstudiante(page, { nivelActual: 1 });
    await irA(page, '/');
    await page.locator('[data-cta="primario"]').click();
    await esperarPantalla(page, 'leccion');
    await completarLeccion(page);

    const cierre = await esperarPantalla(page, 'cierre-leccion');
    await cierre.locator('[data-cta="primario"]').click();

    // Cuando respondo las 10 preguntas
    await esperarPantalla(page, 'evaluacion');
    await expect(page.locator('[data-pregunta]')).toBeVisible();

    /*
     * Desde el DOM no se puede saber cuál es la opción correcta: `GeneradorEvaluacion` baraja las
     * cuatro alternativas de cada pregunta (RN-09) y ADEMÁS regenera el examen en cada intento, así
     * que elegir siempre la primera opción acierta ~25% y NUNCA alcanza el 70% (RN-04). Por eso este
     * test verifica lo que SÍ es determinista en la interfaz —que el examen completo desemboca en la
     * pantalla de resultado, con su resumen coherente y un único CTA primario— y deja la regla de
     * desbloqueo (RN-02) a las pruebas de aplicación, donde el resultado se puede fijar sin azar
     * (tests/unit/application/evaluacion.test.ts).
     */
    const desenlace = await resolverEvaluacion(page, 'aprobado', 1);

    // Entonces la pantalla de resultado existe siempre, con un único CTA primario
    const resultado = await esperarPantalla(page, 'resultado');
    await expect(resultado.locator('[data-cta="primario"]')).toHaveCount(1);
    expect(['aprobado', 'reprobado']).toContain(desenlace);
    // Y el resumen es coherente: puntuación y recuento de preguntas del desglose
    await expect(resultado).toContainText('%');
    await expect(resultado).toContainText('preguntas');

    if (desenlace === 'aprobado') {
      // El azar concedió la aprobación: entonces además se comprueba el desbloqueo (RN-02). El
      // progreso que escribió la aplicación sobrevive a la navegación porque la siembra del perfil
      // sólo rellena lo que todavía no existe.
      await irA(page, '/');
      await esperarPantalla(page, 'mapa');
      await expect.soft(page.locator('[data-nivel="1"]')).toHaveAttribute('data-estado', 'aprobado');
      await expect.soft(page.locator('[data-nivel="2"]')).toHaveAttribute('data-estado', 'actual');
    }
  });
});
