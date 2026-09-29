import { Puntuacion } from '../value-objects/Puntuacion';
import { PoliticaAprobacion } from './PoliticaAprobacion';
import type { Pregunta } from './Pregunta';

/**
 * RN-04: calificación determinista de una evaluación.
 *
 * El calificador no conoce el almacenamiento ni el reloj: recibe las preguntas generadas y las
 * respuestas marcadas por el estudiante, y devuelve el detalle pregunta a pregunta más el
 * resultado agregado. Una pregunta sin respuesta marcada cuenta como incorrecta.
 */
export interface RespuestaMarcada {
  preguntaId: string;
  opcion: string;
}

export interface RespuestaCalificada {
  pregunta: Pregunta;
  opcionCorrecta: string;
  /** Cadena vacía cuando el estudiante no respondió esa pregunta. */
  respuestaMarcada: string;
  esCorrecta: boolean;
  palabraId: string;
}

export interface ResultadoCalificacion {
  aciertos: number;
  total: number;
  puntuacion: Puntuacion;
  aprobado: boolean;
  detalle: RespuestaCalificada[];
  umbral: number;
}

export class Calificador {
  /** Compara cada opción marcada con `normalizarTexto` y deriva aprobado de la política (RN-04). */
  static calificar(
    preguntas: readonly Pregunta[],
    respuestas: readonly RespuestaMarcada[]
  ): ResultadoCalificacion {
    const marcadas = new Map(respuestas.map((respuesta) => [respuesta.preguntaId, respuesta.opcion]));

    const detalle: RespuestaCalificada[] = preguntas.map((pregunta) => {
      const respuestaMarcada = marcadas.get(pregunta.id) ?? '';
      return {
        pregunta,
        opcionCorrecta: pregunta.opcionCorrecta,
        respuestaMarcada,
        esCorrecta: pregunta.esCorrecta(respuestaMarcada),
        palabraId: pregunta.palabraId
      };
    });

    const aciertos = detalle.filter((respuesta) => respuesta.esCorrecta).length;
    const total = preguntas.length;
    const puntuacion = Puntuacion.desdeAciertos(aciertos, total);

    return {
      aciertos,
      total,
      puntuacion,
      aprobado: PoliticaAprobacion.esAprobado(puntuacion),
      detalle,
      umbral: PoliticaAprobacion.umbral
    };
  }
}
