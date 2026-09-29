import { expect, test, type Locator } from '@playwright/test';
import { prepararHistorial, prepararPerfilEstudiante } from '../helpers/sesion';
import {
  MAXIMO_ENLACES_NAVEGACION,
  PANTALLAS_UX,
  abrirPantalla,
  contarCtasPrimarios,
  describirCtasPrimarios
} from '../helpers/ux';

/**
 * UX-HICK y UX-MILLER — cuántas decisiones se le presentan a la vez a quien usa la aplicación.
 *
 * Hick: como máximo 7 opciones primarias visibles y EXACTAMENTE un CTA primario por pantalla; la
 * navegación tampoco compite con la acción de la pantalla.
 * Miller: la información se agrupa en bloques de 7 elementos como máximo (los 3 tramos del mapa,
 * el corpus agrupado por nivel, el historial agrupado por nivel).
 */

/** Hick: máximo de campos visibles por paso del formulario docente. */
const MAXIMO_CAMPOS_POR_PASO = 7;

/** Miller: máximo de elementos visibles dentro de un grupo. */
const MAXIMO_POR_GRUPO = 7;

/** Cuenta los campos de formulario visibles dentro de un contenedor. */
async function contarCampos(contenedor: Locator): Promise<number> {
  return contenedor.locator('input:visible, select:visible, textarea:visible').count();
}

test.describe('[UX-HICK] Ley de Hick', () => {
  for (const ruta of PANTALLAS_UX) {
    test(`[UX-HICK] ${ruta} ofrece exactamente un CTA primario visible`, async ({ page }) => {
      // Dado el perfil que la pantalla necesita y la pantalla ya montada
      await abrirPantalla(page, ruta);

      // Cuando cuento sus acciones primarias
      const total = await contarCtasPrimarios(page);

      // Entonces hay una sola acción primaria (y el mensaje dice cuáles se encontraron)
      expect(
        total,
        `CTA primarios visibles en ${ruta}: ${(await describirCtasPrimarios(page)).join(' | ') || 'ninguno'}`
      ).toBe(1);
    });
  }

  test('[UX-HICK] la navegación visible no supera los 7 destinos', async ({ page }) => {
    // Dado un estudiante en el mapa
    await abrirPantalla(page, '/');

    /*
     * Las dos variantes de navegación conviven en el DOM y se alternan con `md:` (inferior en móvil,
     * superior en escritorio), así que se cuentan los destinos de la barra que de verdad está
     * visible: sumar las dos sería contar dos veces el mismo menú.
     */
    const destinos = page.locator('[data-nav-enlace]:visible');
    const total = await destinos.count();

    expect(total, 'La navegación siempre tiene destinos').toBeGreaterThan(0);
    expect(total, 'Destinos de navegación visibles').toBeLessThanOrEqual(MAXIMO_ENLACES_NAVEGACION);
  });

  test('[UX-HICK] cada paso del formulario docente muestra como máximo 7 campos', async ({ page }) => {
    // Dado un docente en su panel
    await abrirPantalla(page, '/docente');

    const formulario = page.locator('[data-formulario="oracion"]');
    const paso1 = formulario.locator('[data-paso="1"]');

    // Entonces el paso 1 no acumula campos: es un tramo de Miller, no un formulario largo
    await expect(paso1).toBeVisible();
    expect(await contarCampos(paso1), 'Campos del paso 1').toBeLessThanOrEqual(MAXIMO_CAMPOS_POR_PASO);

    // Cuando completo el paso 1 y avanzo
    await paso1.locator('select').selectOption('10');
    await paso1.locator('input').nth(0).fill('Inti llaqtapi kan');
    await paso1.locator('input').nth(1).fill('El sol está en el pueblo.');
    await formulario.locator('[data-cta="primario"]').click();

    // Entonces el paso 2 tampoco supera el límite
    const paso2 = formulario.locator('[data-paso="2"]');
    await expect(paso2).toBeVisible();
    expect(await contarCampos(paso2), 'Campos del paso 2').toBeLessThanOrEqual(MAXIMO_CAMPOS_POR_PASO);
  });
});

test.describe('[UX-MILLER] Ley de Miller', () => {
  test('[UX-MILLER] el mapa agrupa los 10 niveles en exactamente 3 tramos', async ({ page }) => {
    // Dado un estudiante en el mapa
    await abrirPantalla(page, '/');

    // Entonces el camino se presenta en los 3 tramos pedagógicos, cada uno dentro del límite
    const tramos = page.locator('[data-tramo]');
    await expect(tramos).toHaveCount(3);

    for (const tramo of await tramos.all()) {
      const niveles = await tramo.locator('[data-nivel]').count();
      expect(niveles, 'Niveles dentro de un tramo').toBeLessThanOrEqual(MAXIMO_POR_GRUPO);
    }
  });

  test('[UX-MILLER] el panel docente agrupa el corpus por nivel dentro del límite', async ({
    page
  }) => {
    // Dado un docente en su panel, con la pestaña de oraciones activa
    await abrirPantalla(page, '/docente');

    // Cuando miro el listado del corpus
    const grupos = page.locator('[data-grupo-nivel]');
    await expect(grupos.first()).toBeVisible();

    // Entonces está agrupado por nivel y ningún grupo vuelca más de 7 oraciones de golpe
    expect(await grupos.count(), 'Grupos de nivel en el corpus').toBeGreaterThanOrEqual(1);

    for (const grupo of await grupos.all()) {
      const visibles = await grupo.locator('[data-oracion]:visible').count();
      expect(visibles, 'Oraciones visibles dentro de un grupo de nivel').toBeLessThanOrEqual(
        MAXIMO_POR_GRUPO
      );
    }
  });

  test('[UX-MILLER] el tablero agrupa el historial por nivel dentro del límite', async ({ page }) => {
    // Dado un estudiante con historial de dos niveles distintos
    await prepararPerfilEstudiante(page, { nivelActual: 3, nivelesAprobados: [1, 2] });
    await prepararHistorial(page, [
      { nivelId: 2, puntuacion: 90, fecha: '2026-03-12T10:00:00.000Z' },
      { nivelId: 2, puntuacion: 70, fecha: '2026-03-11T10:00:00.000Z' },
      { nivelId: 2, puntuacion: 60, fecha: '2026-03-10T10:00:00.000Z' },
      { nivelId: 2, puntuacion: 80, fecha: '2026-03-09T10:00:00.000Z' },
      { nivelId: 2, puntuacion: 75, fecha: '2026-03-08T10:00:00.000Z' },
      { nivelId: 2, puntuacion: 55, fecha: '2026-03-07T10:00:00.000Z' },
      { nivelId: 1, puntuacion: 100, fecha: '2026-03-06T10:00:00.000Z' },
      { nivelId: 1, puntuacion: 85, fecha: '2026-03-05T10:00:00.000Z' }
    ]);

    // Cuando abro el tablero
    await abrirPantalla(page, '/dashboard');

    // Entonces el historial aparece agrupado por nivel…
    const grupos = page.locator('[data-grupo-nivel]');
    await expect(grupos).toHaveCount(2);

    // …y ningún grupo muestra más de 7 evaluaciones a la vez
    for (const grupo of await grupos.all()) {
      const visibles = await grupo.locator('[data-evaluacion]:visible').count();
      expect(visibles, 'Evaluaciones visibles dentro de un grupo de nivel').toBeLessThanOrEqual(
        MAXIMO_POR_GRUPO
      );
    }
  });
});
