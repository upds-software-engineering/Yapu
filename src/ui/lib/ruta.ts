/**
 * Helper de rutas bajo `base: '/Yapu'` (ADR-004).
 *
 * El sitio se publica en GitHub Pages dentro de `/Yapu/`. Cualquier enlace, `fetch`,
 * `start_url` del manifest o ruta del Service Worker DEBE construirse con este helper;
 * está prohibido escribir `href="/algo"` a mano.
 */

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

/** Prefijo de despliegue, sin barra final (`''` en local si base es `/`). */
export const baseUrl = BASE;

/** Convierte una ruta lógica (`/quiz/1`) en su URL real (`/Yapu/quiz/1`). */
export function ruta(destino: string): string {
  if (!destino || destino === '/') return `${BASE}/`;
  const limpio = destino.startsWith('/') ? destino : `/${destino}`;
  return `${BASE}${limpio}`;
}

/** ¿La ruta actual corresponde a este destino? (para resaltar la navegación) */
export function rutaActiva(pathActual: string, destino: string): boolean {
  const normalizar = (valor: string) => valor.replace(BASE, '').replace(/\/+$/, '') || '/';
  return normalizar(pathActual) === normalizar(destino);
}

/** Ruta canónica de la evaluación de un nivel. */
export function rutaEvaluacion(nivel: number): string {
  return ruta(`/quiz/${nivel}`);
}

/** Ruta canónica de la lección de un nivel, opcionalmente filtrada a las palabras falladas. */
export function rutaLeccion(nivel: number, palabrasFalladas?: readonly string[]): string {
  const base = ruta(`/lesson/${nivel}`);
  if (!palabrasFalladas || palabrasFalladas.length === 0) return base;
  return `${base}?palabras=${encodeURIComponent(palabrasFalladas.join(','))}`;
}
