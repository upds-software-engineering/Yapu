import type { TipoPregunta } from '@domain/shared/tipos';
import type { PalabraDto } from './aprendizaje';

/** RF-005: pregunta ya validada (4 opciones únicas, RN-09) lista para renderizar. */
export interface PreguntaDto {
  id: string;
  tipo: TipoPregunta;
  etiquetaTipo: string;
  enunciado: string;
  opciones: string[];
  /** Sólo para mostrar la explicación pedagógica al final (nunca antes de calificar). */
  explicacion: string;
  nivelId: number;
}

export interface EvaluacionGeneradaDto {
  nivelId: number;
  tituloNivel: string;
  preguntas: PreguntaDto[];
  /** RN-10: objetivo 10, mínimo 5. */
  totalPreguntas: number;
  objetivoPreguntas: number;
  umbralAprobacion: number;
}

/** RN-16: la respuesta se puede cambiar mientras no se califique. */
export interface RespuestaDto {
  preguntaId: string;
  opcion: string;
}

export interface DetalleRespuestaDto {
  preguntaId: string;
  enunciado: string;
  tipo: TipoPregunta;
  opcionCorrecta: string;
  respuestaMarcada: string;
  esCorrecta: boolean;
  explicacion: string;
  palabraId: string;
}

export interface ResultadoEvaluacionDto {
  evaluacionId: string;
  nivelId: number;
  puntuacion: number;
  aciertos: number;
  totalPreguntas: number;
  aprobado: boolean;
  umbralAprobacion: number;
  /** RN-05: XP total ganado por esta evaluación (+10 rendir, +100 primera aprobación). */
  xpGanado: number;
  /** RN-02: nivel que se desbloqueó con esta aprobación, o `null`. */
  nivelDesbloqueado: number | null;
  cursoCompletado: boolean;
  nivelActual: number;
  rachaDias: number;
  porcentajeGlobal: number;
  /** Apogeo-Final: palabras falladas que alimentan el CTA "Repasar las N palabras falladas". */
  palabrasFalladas: PalabraDto[];
  detalle: DetalleRespuestaDto[];
  /** Mensaje ya redactado en español; nunca menciona un "nivel 11" (RN-03). */
  mensaje: string;
}

export interface EstadoSincronizacionDto {
  pendientes: number;
  sincronizadas: number;
  enLinea: boolean;
}
