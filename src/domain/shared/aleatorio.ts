import type { FuenteAleatoria } from './puertos';

/**
 * Utilidades de aleatoriedad determinista.
 *
 * Reemplazan los usos dispersos de `Math.random` (hallazgo A5): toda la aleatoriedad del motor
 * de evaluación pasa por una `FuenteAleatoria` inyectable, lo que hace reproducibles los tests.
 */

/** Fisher-Yates usando la fuente inyectada. No muta la entrada. */
export function barajar<T>(items: readonly T[], fuente: FuenteAleatoria): T[] {
  const resultado = [...items];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(fuente.siguiente() * (i + 1));
    const temporal = resultado[i]!;
    resultado[i] = resultado[j]!;
    resultado[j] = temporal;
  }
  return resultado;
}

/** Toma una copia barajada y recorta a `cantidad` elementos. */
export function elegirVarios<T>(items: readonly T[], cantidad: number, fuente: FuenteAleatoria): T[] {
  if (cantidad <= 0) return [];
  return barajar(items, fuente).slice(0, Math.min(cantidad, items.length));
}

/** Devuelve un elemento al azar o `undefined` si la colección está vacía. */
export function elegir<T>(items: readonly T[], fuente: FuenteAleatoria): T | undefined {
  if (items.length === 0) return undefined;
  const indice = Math.min(items.length - 1, Math.floor(fuente.siguiente() * items.length));
  return items[indice];
}
