/**
 * RN-14 / RS-004: serialización del corpus a CSV para su descarga y apertura en Excel.
 *
 * Se sigue RFC 4180 (comillas dobles para escapar y CRLF como separador de registro), se
 * antepone el BOM UTF-8 para que la hoja de cálculo detecte la codificación, y cada campo se
 * neutraliza contra inyección de fórmulas ANTES de escaparlo.
 */

/** Marca de orden de bytes UTF-8: sin ella Excel abre el archivo como Latin-1 y rompe los acentos. */
export const BOM_UTF8 = '\uFEFF';

/** Definición de una columna: `clave` indexa la fila y `titulo` es la cabecera visible. */
export interface ColumnaCsv {
  clave: string;
  titulo: string;
}

/** Caracteres con los que Excel/LibreOffice interpretan el inicio de una fórmula. */
const PREFIJOS_DE_FORMULA = /^[=+\-@\t\r]/;

/** Caracteres que obligan a entrecomillar el campo según RFC 4180. */
const REQUIERE_ENTRECOMILLADO = /[",\n\r]/;

/**
 * Neutraliza la inyección de fórmulas anteponiendo un apóstrofo al valor cuando empieza por
 * `=`, `+`, `-`, `@`, tabulación o retorno de carro.
 */
export function neutralizarFormula(valor: string): string {
  return PREFIJOS_DE_FORMULA.test(valor) ? `'${valor}` : valor;
}

/**
 * Escapado RFC 4180: entrecomilla el campo y duplica las comillas internas cuando contiene
 * comillas, coma, salto de línea (`\n`) o retorno de carro (`\r`).
 */
export function escaparCampoCsv(valor: string): string {
  if (!REQUIERE_ENTRECOMILLADO.test(valor)) return valor;
  return `"${valor.replace(/"/g, '""')}"`;
}

/** `null` y `undefined` se exportan como celda vacía; el resto se convierte a texto. */
function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return typeof valor === 'string' ? valor : String(valor);
}

/** Un registro CSV: todos los campos neutralizados y escapados, unidos por coma. */
function serializarFila(valores: readonly unknown[]): string {
  return valores.map((valor) => escaparCampoCsv(neutralizarFormula(aTexto(valor)))).join(',');
}

/**
 * Devuelve BOM UTF-8 + cabecera + filas separadas por CRLF, con CRLF final tras la última
 * fila. El orden de las columnas es el de `columnas`; los campos ausentes se escriben vacíos.
 */
export function serializarCsv(
  filas: readonly Record<string, unknown>[],
  columnas: readonly ColumnaCsv[]
): string {
  const lineas: string[] = [serializarFila(columnas.map((columna) => columna.titulo))];

  for (const fila of filas) {
    lineas.push(serializarFila(columnas.map((columna) => fila[columna.clave])));
  }

  return `${BOM_UTF8}${lineas.join('\r\n')}\r\n`;
}
