/**
 * Módulo de aprendizaje: entidades del curso y políticas de progreso.
 *
 * Único punto de entrada del dominio de aprendizaje para las capas de aplicación e
 * infraestructura (`@domain/aprendizaje/...`).
 */
export { Palabra, type DatosPalabra } from './Palabra';
export { Nivel, type DatosNivel } from './Nivel';
export { PoliticaXP } from './PoliticaXP';
export { PoliticaRacha } from './PoliticaRacha';
export {
  PoliticaDesbloqueo,
  type EstadoDesbloqueo,
  type ResultadoAprobacionNivel
} from './PoliticaDesbloqueo';
export {
  ProgresoEstudiante,
  type RegistroPalabra,
  type DatosProgreso,
  type ResultadoMarcado,
  type ResultadoEvaluacionProgreso
} from './ProgresoEstudiante';
