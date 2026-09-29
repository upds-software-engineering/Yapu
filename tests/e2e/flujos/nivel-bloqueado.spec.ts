import { expect, test } from '@playwright/test';
import { esperarPantalla, irA, prepararPerfilEstudiante } from '../helpers/sesion';

/**
 * RN-01 — el recorrido es secuencial: un estudiante sólo puede abrir su nivel actual o los
 * anteriores. Pedir un nivel posterior NUNCA deja un error técnico ni un callejón sin salida.
 */

test.describe('[RN-01] Nivel bloqueado', () => {
  test('[RN-01] el nivel 7 está bloqueado para un estudiante de nivel 2', async ({ page }) => {
    // Dado un estudiante de nivel 2 con el nivel 1 aprobado
    await prepararPerfilEstudiante(page, { nivelActual: 2, nivelesAprobados: [1] });

    // Cuando intenta abrir la EVALUACIÓN del nivel 7
    await irA(page, '/quiz/7');

    // Entonces ve la pantalla de nivel bloqueado, con una única salida hacia su nivel actual
    await esperarPantalla(page, 'nivel-bloqueado');
    await expect(page.locator('[data-pantalla="nivel-bloqueado"] [data-cta="primario"]')).toHaveCount(1);

    // Y lo mismo ocurre con la LECCIÓN del mismo nivel
    await irA(page, '/lesson/7');
    await esperarPantalla(page, 'nivel-bloqueado');
    await expect(page.locator('[data-pantalla="nivel-bloqueado"]')).toContainText('bloqueado');
  });

  test('[RN-01] el mapa muestra el nivel 7 bloqueado y sin enlace', async ({ page }) => {
    // Dado un estudiante de nivel 2
    await prepararPerfilEstudiante(page, { nivelActual: 2, nivelesAprobados: [1] });

    // Cuando abro el mapa
    await irA(page, '/');
    await esperarPantalla(page, 'mapa');

    // Entonces el nivel 7 declara su estado y no ofrece ninguna acción de navegación
    const nivelBloqueado = page.locator('[data-nivel="7"]');
    await expect(nivelBloqueado).toHaveAttribute('data-estado', 'bloqueado');
    await expect(nivelBloqueado.locator('a')).toHaveCount(0);
    expect(await nivelBloqueado.getAttribute('href')).toBeNull();
  });
});
