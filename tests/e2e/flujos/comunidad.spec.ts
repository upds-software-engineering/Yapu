import { expect, test } from '@playwright/test';
import {
  esperarPantalla,
  irA,
  prepararPerfilDocente,
  prepararPerfilEstudiante
} from '../helpers/sesion';

/**
 * RF-007 + RN-13 — retos comunitarios con doble moderación docente.
 *
 * Dos reglas se verifican aquí de punta a punta:
 *  - sólo las y los estudiantes de nivel 7 o superior pueden proponer retos;
 *  - un reto no se publica con UNA aprobación: hacen falta DOS docentes distintos.
 */

test.describe('[RF-007] Retos comunitarios', () => {
  test('[RN-13] un estudiante de nivel 3 no puede proponer retos', async ({ page }) => {
    // Dado un estudiante por debajo del nivel requerido para proponer
    await prepararPerfilEstudiante(page, { nivelActual: 3 });

    // Cuando abre la comunidad
    await irA(page, '/community');
    await esperarPantalla(page, 'comunidad');

    // Entonces ve el título de la pantalla y el aviso con el motivo, nunca el formulario
    await expect(
      page.getByRole('heading', { level: 1, name: 'Retos de la Comunidad' })
    ).toBeVisible();
    await expect(page.locator('[data-aviso="nivel-insuficiente"]')).toBeVisible();
    await expect(page.locator('[data-formulario="reto"]')).toHaveCount(0);

    // Y sigue habiendo un único CTA primario, que ofrece una salida (Apogeo-Final)
    await expect(page.locator('[data-cta="primario"]')).toHaveCount(1);
  });

  test('[RF-007] [RN-13] un reto propuesto queda pendiente hasta reunir dos aprobaciones', async ({
    page
  }) => {
    // Dado un estudiante con el nivel suficiente para proponer
    await prepararPerfilEstudiante(page, { nivelActual: 8 });
    await irA(page, '/community');
    await esperarPantalla(page, 'comunidad');

    // Cuando propone un reto
    const formulario = page.locator('[data-formulario="reto"]');
    await expect(formulario).toBeVisible();
    await formulario.locator('input').nth(0).fill('Sumaq punchaw, yachaq masiy.');
    await formulario.locator('input').nth(1).fill('Buenos días, compañero de estudio.');
    await formulario.locator('[data-accion="proponer"]').click();

    // Entonces se confirma que el reto queda pendiente de moderación
    await expect(formulario.getByRole('status')).toContainText('pendiente de moderación');

    /*
     * El listado del estudiante sólo publica retos APROBADOS (RN-13), así que su propia propuesta
     * todavía no aparece en su pantalla. La comprobación del estado se hace, por tanto, desde la
     * sesión docente, que sí recibe los retos pendientes para poder moderarlos.
     */
    await prepararPerfilDocente(page);
    await irA(page, '/community');
    await esperarPantalla(page, 'comunidad');

    const pendientes = page.locator('[data-reto][data-estado-reto="pendiente"]');
    await expect(pendientes).toHaveCount(1);
    const idReto = await pendientes.first().getAttribute('data-reto');

    // Cuando el docente aprueba el reto UNA sola vez
    await irA(page, '/docente');
    await esperarPantalla(page, 'docente');
    await page.getByRole('tab', { name: /Moderación/ }).click();

    const tarjetaEnModeracion = page.locator(`[data-reto="${idReto ?? ''}"]`);
    await expect(tarjetaEnModeracion).toBeVisible();
    await tarjetaEnModeracion.locator('[data-accion="aprobar"]').click();

    // Entonces el voto queda registrado pero el reto NO se publica: falta el segundo docente
    await expect(tarjetaEnModeracion).toContainText('1 de 2 aprobaciones de docentes');

    await irA(page, '/community');
    await esperarPantalla(page, 'comunidad');
    const tarjetaPublica = page.locator(`[data-reto="${idReto ?? ''}"]`);
    await expect(tarjetaPublica).toHaveAttribute('data-estado-reto', 'pendiente');
    await expect(tarjetaPublica).toContainText('1 de 2 aprobaciones de docentes');
  });
});
