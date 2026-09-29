import { expect, test } from '@playwright/test';
import {
  esperarPantalla,
  irA,
  prepararPerfilEstudiante,
  resolverEvaluacion,
  rutaConBase
} from '../helpers/sesion';

/**
 * RF-005 + UX-APOGEO — reprobar no puede dejar al estudiante sin siguiente paso.
 *
 * Al reprobar, la pantalla de resultado debe ofrecer como CTA primario el repaso de las palabras
 * falladas, ya filtrado en la URL de la lección (`?palabras=`), que es lo que enlaza la evaluación
 * con el refuerzo inmediato (Apogeo-Final).
 */

/** Reintentos acotados: el generador baraja las opciones, así que el acierto es azar (RN-09). */
const INTENTOS = 3;

test.describe('[RF-005] Reprobación y repaso', () => {
  test('[RF-005] [UX-APOGEO] reprobar ofrece el repaso de las palabras falladas', async ({ page }) => {
    // Dado un estudiante en el nivel 1
    await prepararPerfilEstudiante(page, { nivelActual: 1 });

    // Cuando responde mal toda la evaluación (siempre la primera opción de cada pregunta)
    await irA(page, '/quiz/1');
    await esperarPantalla(page, 'evaluacion');
    const desenlace = await resolverEvaluacion(page, 'reprobado', INTENTOS);

    // Entonces la pantalla de resultado existe y expone UN único CTA primario
    await esperarPantalla(page, 'resultado');
    const ctaPrimario = page.locator('[data-pantalla="resultado"] [data-cta="primario"]');
    await expect(ctaPrimario).toHaveCount(1);

    /*
     * Elegir siempre la primera opción acierta aproximadamente una de cada cuatro veces, así que
     * reprobar es lo esperable pero no está garantizado: se deja como comprobación BLANDA para que
     * un azar afortunado no se confunda con un fallo de la aplicación. El resto de la prueba sólo se
     * evalúa cuando el desenlace es realmente el reprobado.
     */
    expect
      .soft(desenlace, 'Tras 3 intentos el azar aprobó la evaluación: no se pudo verificar el repaso.')
      .toBe('reprobado');

    if (desenlace === 'reprobado') {
      // Y el CTA primario lleva a repasar exactamente las palabras falladas
      await expect(ctaPrimario).toContainText(/palabras falladas/i);
      await expect(ctaPrimario).toHaveAttribute('href', /\?palabras=/);
      await expect(ctaPrimario).toHaveAttribute(
        'href',
        new RegExp(`^${rutaConBase('/lesson/1')}\\?palabras=`)
      );
    }
  });
});
