/**
 * Primitivas de infraestructura que el dominio necesita SIN depender de ella.
 *
 * El dominio es TypeScript puro: no puede importar de `application`, `infrastructure` ni `ui`.
 * Por eso las tres dependencias técnicas que atraviesan el cálculo de reglas de negocio
 * (reloj, aleatoriedad, identificadores) se declaran aquí como interfaces mínimas.
 * `application/ports/*` las re-exporta con el sufijo `Port` para el resto de la aplicación.
 */

/** Fuente de tiempo inyectable. Producción: reloj del sistema. Tests: reloj fijo. */
export interface Reloj {
  ahora(): Date;
}

/** Fuente pseudoaleatoria inyectable con valores en [0, 1). Producción: mulberry32 con semilla. */
export interface FuenteAleatoria {
  siguiente(): number;
}

/** Generador de identificadores únicos. Producción: `crypto.randomUUID()`. */
export interface GeneradorId {
  generar(): string;
}
