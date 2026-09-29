/**
 * Normalización de texto quechua/español del dominio (RN-09, RN-11).
 *
 * Reglas:
 *  - Se preserva la `ñ` y las vocales con diéresis propias del runasimi boliviano.
 *  - Se unifican los apóstrofos tipográficos (`’`, `‘`, `` ` ``) al apóstrofo ASCII, porque el
 *    vocabulario sembrado mezcla ambos.
 *  - Toda comparación de opciones se hace con `normalizarTexto` (equivale a
 *    `trim().toLocaleLowerCase('es')` con normalización Unicode NFC).
 */

const APOSTROFOS = /[\u2018\u2019\u02BC`´]/g;

/** Normaliza para comparar: NFC + minúsculas en español + apóstrofos unificados + espacios colapsados. */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFC')
    .replace(APOSTROFOS, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

/** Escapa un literal para poder usarlo dentro de un `RegExp` sin que sus metacaracteres actúen. */
export function escaparRegex(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * RN-11: ¿la oración contiene la palabra clave como inicio de palabra, admitiendo sufijos quechuas?
 *
 * Ej.: palabra clave `yachay` coincide en `yachaywasipi` (sufijo `-wasi`), pero no en `kayachay`.
 * La búsqueda es case-insensitive y tolera los apóstrofos tipográficos del corpus.
 *
 * El apóstrofo cuenta como carácter de palabra: en runasimi `k'anchay` (brillar) y `anchay` (así)
 * son términos distintos, así que la frontera de palabra NO puede ser un apóstrofo.
 */
export function contienePalabraClave(texto: string, termino: string): boolean {
  const objetivo = normalizarTexto(termino);
  if (objetivo.length === 0) return false;

  const patron = new RegExp(`(^|[^\\p{L}\\p{N}'])${escaparRegex(objetivo)}\\p{L}*`, 'iu');
  return patron.test(normalizarTexto(texto));
}

/**
 * Compara dos términos ignorando mayúsculas, espacios y variantes de apóstrofo.
 * Es la comparación usada por RN-09 para decidir si dos opciones son la misma.
 */
export function mismosTerminos(a: string, b: string): boolean {
  return normalizarTexto(a) === normalizarTexto(b);
}

/** `true` si la cadena, ya normalizada, aparece como opción dentro de la colección. */
export function contieneTermino(coleccion: readonly string[], candidato: string): boolean {
  const objetivo = normalizarTexto(candidato);
  return coleccion.some((item) => normalizarTexto(item) === objetivo);
}
