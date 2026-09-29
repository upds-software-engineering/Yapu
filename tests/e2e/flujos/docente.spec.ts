import { expect, test } from '@playwright/test';
import { esperarPantalla, irA, prepararPerfilDocente } from '../helpers/sesion';

/**
 * RF-006 + RF-010 — panel docente: registro de oraciones base y exportación del corpus.
 *
 * ADR-003: la autenticación es simulada, así que el rol se siembra en `localStorage` antes de
 * abrir la pantalla; el panel sólo se monta con rol docente (RF-002), que es justamente lo que se
 * comprueba aquí en lugar de aceptar la guardia de rol.
 */

test.describe('[RF-006] [RF-010] Panel docente', () => {
  test('[RF-006] el docente registra una oración base en dos pasos', async ({ page }) => {
    // Dado un docente con sesión simulada
    await prepararPerfilDocente(page);

    // Cuando entra al panel
    await irA(page, '/docente');
    await esperarPantalla(page, 'docente');

    // Entonces ve el panel completo y NO la guardia de rol
    await expect(page.locator('[data-panel="docente"]')).toBeVisible();
    await expect(page.locator('[data-guardia="rol"]')).toHaveCount(0);

    // Y las pestañas cumplen el patrón WAI-ARIA (tablist / tab / tabpanel)
    const pestanas = page.getByRole('tab');
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(pestanas).toHaveCount(3);

    const primera = pestanas.first();
    await expect(primera).toHaveAttribute('aria-selected', 'true');
    const idPrimera = await primera.getAttribute('id');
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', idPrimera ?? '');

    // Y con la flecha derecha el foco pasa a la pestaña siguiente, que queda seleccionada
    await primera.focus();
    await page.keyboard.press('ArrowRight');
    const segunda = pestanas.nth(1);
    await expect(segunda).toHaveAttribute('aria-selected', 'true');
    await expect(primera).toHaveAttribute('aria-selected', 'false');
    const idSegunda = await segunda.getAttribute('id');
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', idSegunda ?? '');

    // Cuando registro una oración desde la pestaña de oraciones
    await primera.click();
    const formulario = page.locator('[data-formulario="oracion"]');
    const paso1 = formulario.locator('[data-paso="1"]');
    await expect(paso1).toBeVisible();

    /*
     * El contrato de selectores fija el contenedor de cada paso, pero no un selector por campo, así
     * que se usan los controles que el paso pinta en orden de documento: nivel, texto y traducción.
     */
    await paso1.locator('select').selectOption('10');
    await paso1.locator('input').nth(0).fill('Inti llaqtapi kan');
    await paso1.locator('input').nth(1).fill('El sol está en el pueblo.');
    await formulario.locator('[data-cta="primario"]').click();

    // Entonces avanza al paso 2 y el paso 1 deja de existir
    const paso2 = formulario.locator('[data-paso="2"]');
    await expect(paso2).toBeVisible();
    await expect(formulario.locator('[data-indicador-paso]')).toContainText('Paso 2 de 2');
    await expect(paso1).toHaveCount(0);

    // Y guardo la oración con la palabra clave que contiene (RN-11 / RN-12)
    const selectorPalabra = paso2.locator('select');
    await expect.poll(async () => selectorPalabra.locator('option').count()).toBeGreaterThan(1);

    const valorPalabraClave = await selectorPalabra.locator('option').evaluateAll((opciones) => {
      const elegida = opciones.find((opcion) => (opcion.textContent ?? '').trim().startsWith('Inti'));
      return elegida instanceof HTMLOptionElement ? elegida.value : '';
    });
    expect(valorPalabraClave, 'El corpus debe incluir la palabra clave "Inti" en el nivel 10').not.toBe('');

    // El corpus sembrado ya trae oraciones, así que se cuenta cuántas hay antes de guardar.
    const oracionesAntes = await page.locator('[data-oracion]').count();

    await selectorPalabra.selectOption(valorPalabraClave);
    await formulario.locator('[data-cta="primario"]').click();

    // Entonces la pantalla confirma el alta (RN-12: la oración queda aprobada) y vuelve al paso 1
    await expect(page.getByText(/Oración guardada y aprobada/)).toBeVisible();
    await expect(formulario.locator('[data-paso="1"]')).toBeVisible();

    // Y la oración nueva aparece en el listado del corpus, agrupada por nivel
    await expect(page.locator('[data-oracion]')).toHaveCount(oracionesAntes + 1);
    await expect(page.locator('[data-grupo-nivel]').first()).toBeVisible();
  });

  test('[RF-010] el docente exporta el corpus a CSV', async ({ page }) => {
    // Dado un docente con sesión simulada en el panel
    await prepararPerfilDocente(page);
    await irA(page, '/docente');
    await esperarPantalla(page, 'docente');

    // Cuando abre la pestaña de datos abiertos
    await page.getByRole('tab', { name: /Datos abiertos/ }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();

    // Y pulsa la exportación del corpus
    const descarga = page.waitForEvent('download', { timeout: 5_000 }).catch(() => null);
    await page.locator('[data-accion="exportar-csv"]').click();
    const archivo = await descarga;

    /*
     * RS-004: el caso de uso entrega el CSV al puerto de exportación, que en el navegador dispara
     * una descarga real. Si el navegador no emite el evento (por ejemplo, porque bloquea la
     * descarga programática), la propia pantalla confirma el número de filas exportadas: cualquiera
     * de las dos evidencias vale como prueba de que la exportación se completó.
     */
    if (archivo !== null) {
      expect(archivo.suggestedFilename()).toMatch(/\.csv$/i);
    } else {
      await expect(page.getByText(/Se exportaron \d+ filas/)).toBeVisible();
    }
  });
});
