/**
 * Traducción de errores a mensajes en español para la interfaz.
 *
 * La UI tiene prohibido importar `@domain` (regla de dependencias de la arquitectura hexagonal),
 * así que no puede usar `mensajeAmigable` de `src/domain/errores.ts`. Esta función local lee el
 * campo `codigo` de forma defensiva (el error puede venir de cualquier capa) y lo mapea a un
 * mensaje apto para el estudiante.
 */

/** Mensajes por código de error de dominio (`CodigoError` en `src/domain/errores.ts`). */
const MENSAJES_POR_CODIGO: Record<string, string> = {
  NIVEL_BLOQUEADO:
    'Ese nivel todavía está bloqueado. Aprueba el nivel anterior y podrás continuar.',
  CONTENIDO_INSUFICIENTE:
    'Todavía no hay suficientes palabras en este nivel para armar la actividad. Inténtalo más tarde.',
  PERMISO_DENEGADO: 'No tienes permiso para realizar esta acción.',
  VALIDACION: 'Revisa los datos: hay algo que no cumple las reglas. Corrígelo e inténtalo otra vez.',
  NO_ENCONTRADO: 'No encontramos lo que buscabas. Vuelve al inicio e inténtalo otra vez.',
  CONFLICTO_ESTADO:
    'El contenido cambió mientras trabajabas. Actualiza la pantalla e inténtalo otra vez.',
  NO_AUTENTICADO: 'Tu sesión no es válida o ya venció. Inicia sesión de nuevo.'
};

/** Respaldo para cualquier error sin código conocido. */
export const MENSAJE_ERROR_GENERICO = 'Ocurrió un problema inesperado. Vuelve a intentarlo.';

/** Mensajes técnicos en inglés que nunca deben llegar al estudiante. */
const TEXTO_TECNICO = /(TypeError|ReferenceError|SyntaxError|NetworkError|Failed to fetch|Cannot read|is not a function|undefined|null is not)/i;

/** Extrae `error.codigo` sin asumir la forma del error. */
function leerCodigo(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  if (!('codigo' in error)) return null;
  const codigo = (error as { codigo?: unknown }).codigo;
  return typeof codigo === 'string' ? codigo : null;
}

/** ¿El mensaje del error se puede mostrar tal cual al estudiante? */
function esMensajeMostrable(mensaje: string): boolean {
  const limpio = mensaje.trim();
  if (limpio.length < 4 || limpio.length > 180) return false;
  return !TEXTO_TECNICO.test(limpio);
}

/**
 * Convierte cualquier fallo en un mensaje en español listo para pintar en pantalla.
 * Nunca lanza y nunca devuelve una cadena vacía.
 */
export function mensajeDeError(error: unknown): string {
  const codigo = leerCodigo(error);
  if (codigo !== null) {
    const traducido = MENSAJES_POR_CODIGO[codigo];
    if (traducido) return traducido;
  }

  if (error instanceof Error && esMensajeMostrable(error.message)) return error.message.trim();

  return MENSAJE_ERROR_GENERICO;
}
