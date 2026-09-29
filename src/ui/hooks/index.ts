/**
 * Barrel de los hooks de presentación.
 *
 * `src/ui/hooks/**` es el único lugar autorizado para leer `src/infrastructure/container.ts`;
 * el resto de la UI consume estos hooks.
 */
export { useContenedor } from './useContenedor';
export { useCasoDeUso, type EstadoCasoDeUso, type OpcionesCasoDeUso, type RetornoCasoDeUso } from './useCasoDeUso';
export { usePreferenciaReducida } from './usePreferenciaReducida';
export { useSincronizacion, type EstadoSincronizacion } from './useSincronizacion';
export { useServicios, crearServicios, type Servicios } from './useServicios';
