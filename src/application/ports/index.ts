/**
 * Puertos (interfaces) de la capa de aplicación.
 *
 * Regla de dependencias: `application` puede importar `domain`, nunca `infrastructure` ni `ui`.
 * Las primitivas técnicas (`Reloj`, `FuenteAleatoria`, `GeneradorId`) se declaran en el dominio
 * para que los servicios de dominio puros puedan usarlas sin invertir la dependencia.
 */
export type { Reloj as RelojPort, FuenteAleatoria as AleatorioPort, GeneradorId as GeneradorIdPort } from '@domain/shared/puertos';
export type { ProgresoRepository } from './ProgresoRepository';
export type { EvaluacionRepository } from './EvaluacionRepository';
export type { CatalogoRepository } from './CatalogoRepository';
export type { OracionRepository } from './OracionRepository';
export type { RetoRepository } from './RetoRepository';
export type { SesionPort, SesionActual } from './SesionPort';
export type { SincronizacionRemotaPort } from './SincronizacionRemotaPort';
export type { ConectividadPort } from './ConectividadPort';
export type { ExportadorArchivoPort } from './ExportadorArchivoPort';
export type { BorradorEvaluacion, BorradorEvaluacionPort } from './BorradorEvaluacionPort';
