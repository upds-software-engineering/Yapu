/**
 * Adaptadores persistentes de `localStorage` (ADR-002).
 *
 * Aquí vive todo lo que toca el almacenamiento del navegador: las claves versionadas, los
 * esquemas Zod que validan lo leído, la migración desde las claves antiguas `yapu_*` y los
 * cuatro repositorios que implementan los puertos de la capa de aplicación.
 *
 * El composition root (`src/infrastructure/container.ts`) es el único que construye estas
 * clases; cuando no hay `localStorage` (render de servidor de Astro) los repositorios siguen
 * funcionando sobre un almacén en memoria interno.
 */
export { CLAVES_ANTIGUAS, CLAVES_NUEVAS, CLAVE_MIGRACION } from './claves';
export {
  AlmacenMemoria,
  escribirJson,
  leerJson,
  resolverAlmacen,
  type Almacen
} from './esquema';
export { migrarClavesAntiguas } from './migracion';
export { LocalStorageProgresoRepository } from './LocalStorageProgresoRepository';
export { LocalStorageEvaluacionRepository } from './LocalStorageEvaluacionRepository';
export { LocalStorageOracionRepository } from './LocalStorageOracionRepository';
export { LocalStorageRetoRepository } from './LocalStorageRetoRepository';
