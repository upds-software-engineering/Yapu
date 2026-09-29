import { expect, test } from '@playwright/test';
import {
  esperarPantalla,
  irA,
  prepararPerfilEstudiante,
  resolverEvaluacion,
  rutaConBase
} from '../helpers/sesion';
import {
  MAXIMO_TAMANOS_TIPOGRAFICOS,
  PANTALLAS_UX,
  abrirPantalla,
  tamanosTipograficos
} from '../helpers/ux';

/**
 * UX-APOGEO y UX-ESTETICA.
 *
 * Apogeo-Final: la pantalla de resultado es el clímax del nivel, así que siempre tiene una acción
 * primaria clara; al aprobar devuelve al mapa y al reprobar ofrece repasar exactamente las palabras
 * falladas, de modo que el cierre nunca es un callejón sin salida.
 *
 * Estética-Usabilidad: cada pantalla usa como máximo 4 tamaños tipográficos computados (los tokens
 * `caption` 12 px, `body` 15 px, `title` 20 px y `display` 32 px), y la lista medida se adjunta al
 * reporte para poder compararla sin volver a ejecutar la suite.
 */

/** Reintentos acotados: el generador baraja las opciones, así que el acierto es azar (RN-09). */
const INTENTOS = 3;

/** Nombre de archivo adjunto seguro a partir de una ruta lógica (`/lesson/1` → `lesson-1`). */
function slug(ruta: string): string {
  return ruta.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'portada';
}

test.describe('[UX-ESTETICA] Estética y usabilidad', () => {
  for (const ruta of PANTALLAS_UX) {
    test(`[UX-ESTETICA] ${ruta} usa como máximo 4 tamaños tipográficos`, async ({
      page
    }, testInfo) => {
      // Dado el perfil que la pantalla necesita y la pantalla ya montada
      await abrirPantalla(page, ruta);

      // Cuando mido el tamaño computado de cada nodo de texto visible
      const { tamanos, muestras } = await tamanosTipograficos(page);

      // La evidencia queda adjunta al reporte: qué tamaños aparecieron y con qué texto
      await testInfo.attach(`tipografia-${slug(ruta)}`, {
        body: JSON.stringify({ ruta, proyecto: testInfo.project.name, tamanos, muestras }, null, 2),
        contentType: 'application/json'
      });

      // Entonces la escala no se dispara más allá de los tokens del design system
      expect(
        tamanos.length,
        `Tamaños tipográficos computados en ${ruta} (${testInfo.project.name}): ${tamanos.join(', ')}`
      ).toBeLessThanOrEqual(MAXIMO_TAMANOS_TIPOGRAFICOS);
    });
  }
});

test.describe('[UX-APOGEO] Apogeo-Final', () => {
  test('[UX-APOGEO] al reprobar, el CTA primario del resultado ofrece repasar las palabras falladas', async ({
    page
  }) => {
    // Dado un estudiante en el nivel 1
    await prepararPerfilEstudiante(page, { nivelActual: 1 });

    // Cuando responde mal la evaluación (siempre la primera opción, que acierta sólo por azar)
    await irA(page, '/quiz/1');
    await esperarPantalla(page, 'evaluacion');
    const desenlace = await resolverEvaluacion(page, 'reprobado', INTENTOS);

    // Entonces la pantalla de resultado existe con al menos un CTA primario
    await esperarPantalla(page, 'resultado');
    const ctaPrimario = page.locator('[data-pantalla="resultado"] [data-cta="primario"]');
    await expect(ctaPrimario).toHaveCount(1);

    /*
     * Reprobar no está garantizado (la primera opción acierta por azar), así que el desenlace se
     * comprueba en BLANDO y el repaso concreto sólo se exige cuando de verdad se reprobó.
     */
    expect
      .soft(desenlace, 'Tras 3 intentos el azar aprobó la evaluación: no se pudo verificar el repaso.')
      .toBe('reprobado');

    if (desenlace === 'reprobado') {
      await expect(ctaPrimario).toContainText(/palabras falladas/i);
      await expect(ctaPrimario).toHaveAttribute('href', /\?palabras=/);
    }
  });

  test('[UX-APOGEO] al aprobar, el resultado cierra el nivel y devuelve al mapa', async ({ page }) => {
    // Dado un estudiante en el nivel 1
    await prepararPerfilEstudiante(page, { nivelActual: 1 });

    // Cuando consigue aprobar la evaluación (bucle acotado: las opciones se barajan)
    await irA(page, '/quiz/1');
    await esperarPantalla(page, 'evaluacion');
    const desenlace = await resolverEvaluacion(page, 'aprobado', INTENTOS);

    // Entonces el resultado se declara aprobado, con un único CTA primario hacia el mapa
    await esperarPantalla(page, 'resultado');
    const ctaPrimario = page.locator('[data-pantalla="resultado"] [data-cta="primario"]');
    await expect(ctaPrimario).toHaveCount(1);

    expect
      .soft(desenlace, 'Tras 3 intentos el azar no dio la aprobación: el cierre queda sin verificar.')
      .toBe('aprobado');

    if (desenlace === 'aprobado') {
      await expect(page.locator('[data-pantalla="resultado"]')).toHaveAttribute(
        'data-resultado',
        'aprobado'
      );
      await expect(ctaPrimario).toHaveAttribute('href', rutaConBase('/'));
    }
  });
});
