import { expect, test } from '@playwright/test';
import { esperarPantalla, irA, prepararPerfilEstudiante } from '../helpers/sesion';

/**
 * RF-009 + RNF-007 — la aplicación sigue funcionando sin conexión (PWA con Service Worker).
 *
 * Se comprueba el recorrido de estudio real (lección y evaluación) con la red cortada, que es el
 * escenario que exige el modo offline: el contenido ya está precargado y no se pide nada al servidor.
 */

test.describe('[RF-009] Funcionamiento sin conexión', () => {
  test('[RF-009] [RNF-007] la lección y la evaluación siguen disponibles sin conexión', async ({
    page,
    context
  }) => {
    // El recorrido offline encadena instalación del Service Worker, recarga y tres navegaciones.
    test.slow();

    // Dado un estudiante en el nivel 1 y una primera visita CON conexión
    await prepararPerfilEstudiante(page, { nivelActual: 1 });
    await irA(page, '/');
    await esperarPantalla(page, 'mapa');

    // Cuando el Service Worker termina de registrarse y pasa a controlar la página
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    /*
     * Se recarga UNA vez a propósito: la primera visita sólo instala y activa el Service Worker
     * (que aprovecha para precachear todo el build), de modo que es esta segunda carga la que ya
     * nace controlada y servida desde el precache —documento y chunks de JavaScript incluidos—,
     * que es exactamente la situación que se quiere medir cuando después se corta la red.
     */
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    // Y entonces me quedo sin conexión
    await context.setOffline(true);

    // Entonces la lección del nivel 1 sigue abriéndose y avisa del modo sin conexión
    await irA(page, '/lesson/1');
    await esperarPantalla(page, 'leccion');
    await expect(page.locator('[data-banner="conexion"]')).toBeVisible();

    // Y la evaluación del nivel 1 también, con sus preguntas ya generadas en local
    await irA(page, '/quiz/1');
    await esperarPantalla(page, 'evaluacion');
    await expect(page.locator('[data-banner="conexion"]')).toBeVisible();
    await expect(page.locator('[data-pregunta]')).toBeVisible();
  });
});
