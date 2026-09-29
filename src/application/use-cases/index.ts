/**
 * Barrel (punto de entrada único) de los casos de uso de la capa de aplicación.
 *
 * La UI importa siempre desde `@application/use-cases` (o por ruta directa cuando necesita un
 * tipo de entrada concreto). Los casos de uso reciben sus puertos por constructor: el cableado
 * vive en `src/infrastructure/container.ts` y se consume con `useServicios()`.
 */

// Aprendizaje
export { ObtenerMapaNivelesUseCase } from './ObtenerMapaNivelesUseCase';
export { ObtenerLeccionUseCase } from './ObtenerLeccionUseCase';
export { MarcarPalabraUseCase } from './MarcarPalabraUseCase';
export { ObtenerTableroUseCase } from './ObtenerTableroUseCase';

// Evaluación
export { GenerarEvaluacionUseCase } from './GenerarEvaluacionUseCase';
export { CalificarEvaluacionUseCase } from './CalificarEvaluacionUseCase';
export { SincronizarPendientesUseCase } from './SincronizarPendientesUseCase';

// Contenido y sesión
export { RegistrarOracionBaseUseCase, type EntradaOracion } from './RegistrarOracionBaseUseCase';
export { ListarOracionesUseCase } from './ListarOracionesUseCase';
export { ExportarCorpusCsvUseCase } from './ExportarCorpusCsvUseCase';
export { ProponerRetoUseCase, type EntradaReto } from './ProponerRetoUseCase';
export { ModerarRetoUseCase } from './ModerarRetoUseCase';
export { ListarRetosUseCase } from './ListarRetosUseCase';
export { ObtenerSesionUseCase } from './ObtenerSesionUseCase';
export { CambiarRolUseCase } from './CambiarRolUseCase';

// Mapeos de dominio a DTO compartidos por los casos de uso y los tests.
export { aPalabraDto, aNivelDto, aEvaluacionResumenDto } from './mappers';
