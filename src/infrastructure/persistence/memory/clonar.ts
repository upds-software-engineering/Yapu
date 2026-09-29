/**
 * Utilidad compartida por los repositorios en memoria.
 *
 * Se clona en profundidad al guardar y al leer para que los agregados que devuelve el
 * repositorio NO compartan referencias con el estado interno: los tests y la UI trabajan
 * con copias, igual que ocurriría con una base de datos real.
 */
export function clonar<T>(valor: T): T {
  if (typeof structuredClone === 'function') return structuredClone(valor);
  return JSON.parse(JSON.stringify(valor)) as T;
}
