/**
 * Superficie pública del dominio de evaluación (motor determinista, RN-04 / RN-09 / RN-10 / RN-11 / RN-15).
 *
 * La aplicación importa siempre desde aquí (`@domain/evaluacion`), nunca desde los archivos sueltos.
 */
export { PoliticaAprobacion } from './PoliticaAprobacion';
export { Pregunta, type DatosPregunta } from './Pregunta';
export { GeneradorEvaluacion, type OpcionesGeneracion } from './GeneradorEvaluacion';
export {
  Calificador,
  type RespuestaMarcada,
  type RespuestaCalificada,
  type ResultadoCalificacion
} from './Calificador';
export { Evaluacion, type DatosEvaluacion } from './Evaluacion';
