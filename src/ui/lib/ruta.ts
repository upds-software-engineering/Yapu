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

/**
 * Convierte una ruta lógica (`/quiz/1`) en su URL real (`/Yapu/quiz/1/`).
 *
 * Las páginas terminan SIEMPRE en barra: el build genera `quiz/1/index.html` y GitHub Pages
 * responde a `/Yapu/quiz/1` con un 301 hacia `/Yapu/quiz/1/`, lo que suma un viaje de red a cada
 * navegación (RS-002: redes lentas). Los archivos (`/manifest.json`, `/favicon.svg`) no llevan
 * barra, y la consulta o el ancla se conservan detrás de ella (`/lesson/1/?palabras=…`).
 */
export function ruta(destino: string): string {
  if (!destino || destino === '/') return `${BASE}/`;
  const limpio = destino.startsWith('/') ? destino : `/${destino}`;
  const corte = limpio.search(/[?#]/);
  const camino = corte === -1 ? limpio : limpio.slice(0, corte);
  const resto = corte === -1 ? '' : limpio.slice(corte);
  const esArchivo = (camino.split('/').pop() ?? '').includes('.');
  const conBarra = camino.endsWith('/') || esArchivo ? camino : `${camino}/`;
  return `${BASE}${conBarra}${resto}`;
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
