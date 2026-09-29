import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PANTALLAS_UX, abrirPantalla } from '../helpers/ux';

/**
 * RNF-002 — accesibilidad WCAG 2.1 niveles A y AA en las seis pantallas del recorrido crítico.
 *
 * La auditoría la ejecuta `axe-core` sobre el DOM ya hidratado y en los DOS proyectos declarados en
 * `playwright.config.ts` (Pixel 5 y Desktop Chrome), porque parte de la interfaz —la barra de
 * navegación inferior en móvil, el selector de rol en la cabecera de escritorio— sólo existe en uno
 * de los dos viewports. `abrirPantalla()` espera a que cada pantalla termine de cargar, de modo que
 * nunca se audita un estado intermedio.
 *
 * Se auditan exactamente las reglas de WCAG 2.0 y 2.1 de niveles A y AA: las de mejores prácticas
 * quedan fuera porque RNF-002 se define como conformidad WCAG, no como recomendación de estilo.
 */

/** RNF-002: reglas WCAG auditadas (2.0 y 2.1, niveles A y AA). */
const ETIQUETAS_WCAG: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Nombre de archivo adjunto seguro a partir de una ruta lógica (`/lesson/1` → `lesson-1`). */
function slug(ruta: string): string {
  return ruta.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'portada';
}

test.describe('[RNF-002] Accesibilidad WCAG 2.1 AA', () => {
  for (const ruta of PANTALLAS_UX) {
    test(`[RNF-002] ${ruta} no presenta violaciones de accesibilidad`, async ({ page }, testInfo) => {
      // Dado el perfil que la pantalla necesita y la pantalla ya montada
      await abrirPantalla(page, ruta);

      // Cuando la audito con axe-core
      const resultado = await new AxeBuilder({ page }).withTags([...ETIQUETAS_WCAG]).analyze();

      const violaciones = resultado.violations.map((violacion) => ({
        id: violacion.id,
        impacto: violacion.impact ?? 'sin impacto declarado',
        ayuda: violacion.help,
        nodos: violacion.nodes.map((nodo) => ({
          objetivo: JSON.stringify(nodo.target),
          html: nodo.html.slice(0, 200)
        }))
      }));

      // El detalle queda adjunto al reporte para que el arreglo no dependa de la consola del CI.
      await testInfo.attach(`axe-${slug(ruta)}`, {
        body: JSON.stringify({ ruta, proyecto: testInfo.project.name, violaciones }, null, 2),
        contentType: 'application/json'
      });

      // Entonces no hay ninguna violación
      expect(
        violaciones,
        `Violaciones WCAG 2.1 AA en ${ruta} (${testInfo.project.name}): ${JSON.stringify(violaciones)}`
      ).toEqual([]);
    });
  }
});
