import { expect, test } from '@playwright/test';
import {
  MINIMO_ESCRITORIO,
  MINIMO_MOVIL,
  PANTALLAS_UX,
  SEPARACION_MINIMA,
  TOLERANCIA_PX,
  abrirPantalla,
  medirObjetivosTactiles,
  separacionMinima
} from '../helpers/ux';

/**
 * UX-FITTS — ley de Fitts: los objetivos táctiles se miden sobre la caja real del elemento.
 *
 * Los umbrales salen de los tokens del design system y cambian con el viewport, así que cada
 * pantalla se audita en los DOS proyectos: 44 × 44 px en Pixel 5 (`min-h-tactil`/`min-w-tactil`) y
 * 24 × 24 px en Desktop Chrome (`md:min-h-tactil-escritorio`). Además, los objetivos adyacentes de
 * un mismo contenedor deben quedar separados al menos 8 px (token `separacion-objetivos`).
 *
 * Qué se excluye de la medición —y por qué— está documentado en `medirObjetivosTactiles()`: cajas
 * de 0 × 0, elementos `sr-only`, controles deshabilitados y todo lo que queda fuera del viewport.
 */

/** Fitts: umbral táctil del proyecto en curso (`playwright.config.ts`). */
function minimoTactil(proyecto: string): number {
  return proyecto === 'Pixel 5' ? MINIMO_MOVIL : MINIMO_ESCRITORIO;
}

test.describe('[UX-FITTS] Ley de Fitts', () => {
  for (const ruta of PANTALLAS_UX) {
    test(`[UX-FITTS] los objetivos táctiles de ${ruta} respetan el mínimo del proyecto`, async ({
      page
    }, testInfo) => {
      // Dado el perfil que la pantalla necesita y la pantalla ya montada
      await abrirPantalla(page, ruta);

      // Cuando mido cada objetivo visible dentro del viewport
      const objetivos = await medirObjetivosTactiles(page);
      const minimo = minimoTactil(testInfo.project.name);

      const incumplidores = objetivos.filter(
        (objetivo) =>
          objetivo.ancho < minimo - TOLERANCIA_PX || objetivo.alto < minimo - TOLERANCIA_PX
      );

      // Entonces ninguno baja del mínimo táctil del proyecto
      expect(
        incumplidores,
        `Objetivos por debajo de ${minimo} px en ${ruta} (${testInfo.project.name})`
      ).toEqual([]);
    });

    test(`[UX-FITTS] los objetivos adyacentes de ${ruta} respetan la separación mínima`, async ({
      page
    }, testInfo) => {
      // Dado el perfil que la pantalla necesita y la pantalla ya montada
      await abrirPantalla(page, ruta);

      // Cuando mido los huecos entre objetivos consecutivos
      const navegacion = await separacionMinima(page, '[data-nav="movil"]');
      const opciones = await separacionMinima(page, '[data-opcion]');

      /*
       * Las dos comprobaciones se contrastan también en su ausencia: la barra inferior sólo se pinta
       * en móvil (`md:hidden`) y las opciones de examen sólo existen en la pantalla de evaluación.
       * Así el caso "no hay nada que medir" queda verificado y no se confunde con un descarte.
       */
      expect(navegacion.minima === null, `La barra móvil de ${ruta} debería poder medirse`).toBe(
        testInfo.project.name !== 'Pixel 5'
      );
      expect(opciones.minima === null, `Sólo la evaluación tiene opciones en ${ruta}`).toBe(
        ruta !== '/quiz/1'
      );

      // Entonces cada contenedor con objetivos separa los suyos al menos 8 px
      if (navegacion.minima !== null) {
        expect(
          navegacion.minima,
          `Separación mínima en la barra móvil de ${ruta}`
        ).toBeGreaterThanOrEqual(SEPARACION_MINIMA - TOLERANCIA_PX);
      }

      if (opciones.minima !== null) {
        expect(
          opciones.minima,
          `Separación mínima entre las opciones de ${ruta}`
        ).toBeGreaterThanOrEqual(SEPARACION_MINIMA - TOLERANCIA_PX);
      }
    });
  }
});
