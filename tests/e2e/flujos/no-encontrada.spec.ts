import { expect, test } from '@playwright/test';
import { esperarPantalla, prepararPerfilEstudiante, rutaConBase } from '../helpers/sesion';

/**
 * RNF-006 — una dirección inexistente muestra la página 404 propia de YAPU, en español, en lugar
 * de la genérica en inglés de GitHub Pages. Nunca es un callejón sin salida (Apogeo-Final).
 */

test.describe('[RNF-006] Página no encontrada', () => {
  test('[RNF-006] [UX-APOGEO] una dirección inexistente muestra la 404 en español y vuelve al mapa', async ({ page }) => {
    // Dado un estudiante con sesión
    await prepararPerfilEstudiante(page, { nivelActual: 1 });

    // Cuando abre una dirección que no existe
    const respuesta = await page.goto(rutaConBase('/esta-pagina-no-existe'));

    // Entonces el servidor responde 404 y la pantalla explica el problema en español
    expect(respuesta?.status()).toBe(404);
    await expect(page).toHaveTitle(/Página no encontrada — YAPU/);
    const pantalla = page.locator('[data-pantalla="no-encontrada"]');
    await expect(pantalla.getByRole('heading', { level: 1 })).toHaveText('Este camino no existe');

    // Y su único CTA primario lo devuelve al mapa de niveles
    const cta = pantalla.locator('[data-cta="primario"]');
    await expect(cta).toHaveCount(1);
    await cta.click();
    await esperarPantalla(page, 'mapa');
  });
});
