import { ValidacionError } from '../errores';
import { FechaDia } from '../value-objects/FechaDia';
import { NivelId } from '../value-objects/NivelId';
import { Puntuacion } from '../value-objects/Puntuacion';
import { PoliticaAprobacion } from './PoliticaAprobacion';

/**
 * Agregado raíz `Evaluacion`: el resultado de una evaluación rendida por un estudiante.
 *
 *  - RN-04: `aprobado` NO se recibe: se deriva siempre de `PoliticaAprobacion`.
 *  - RN-15: toda evaluación nace con `sincronizada = false` y forma parte de la cola offline.
 *  - RN-17: la fecha llega como ISO desde la capa que tiene el reloj; el dominio no la genera.
 */
export interface DatosEvaluacion {
  id: string;
  estudianteId: string;
  nivelId: number;
  puntuacion: number;
  aciertos: number;
  totalPreguntas: number;
  aprobado: boolean;
  fecha: string;
  sincronizada: boolean;
}

export class Evaluacion {
  private estaSincronizada: boolean;

  private constructor(
    readonly id: string,
    readonly estudianteId: string,
    readonly nivelId: NivelId,
    readonly puntuacion: Puntuacion,
    readonly aciertos: number,
    readonly totalPreguntas: number,
    readonly aprobado: boolean,
    readonly fecha: string,
    sincronizadaInicial: boolean
  ) {
    this.estaSincronizada = sincronizadaInicial;
  }

  /** Alta de una evaluación recién rendida: aprobado derivado y cola offline en `false`. */
  static registrar(params: {
    id: string;
    estudianteId: string;
    nivel: NivelId;
    puntuacion: Puntuacion;
    aciertos: number;
    totalPreguntas: number;
    fechaIso: string;
  }): Evaluacion {
    if (!Number.isInteger(params.aciertos) || params.aciertos < 0) {
      throw new ValidacionError('Los aciertos deben ser un entero no negativo.', 'aciertos');
    }
    if (!Number.isInteger(params.totalPreguntas) || params.totalPreguntas < 0) {
      throw new ValidacionError('El total de preguntas debe ser un entero no negativo.', 'totalPreguntas');
    }
    if (params.aciertos > params.totalPreguntas) {
      throw new ValidacionError('Los aciertos no pueden superar el total de preguntas.', 'aciertos');
    }

    return new Evaluacion(
      params.id,
      params.estudianteId,
      params.nivel,
      params.puntuacion,
      params.aciertos,
      params.totalPreguntas,
      PoliticaAprobacion.esAprobado(params.puntuacion),
      params.fechaIso,
      false
    );
  }

  /** Rehidratación desde persistencia: respeta el estado de sincronización guardado. */
  static reconstruir(datos: DatosEvaluacion): Evaluacion {
    return new Evaluacion(
      datos.id,
      datos.estudianteId,
      NivelId.crear(datos.nivelId),
      Puntuacion.crear(datos.puntuacion),
      datos.aciertos,
      datos.totalPreguntas,
      datos.aprobado,
      datos.fecha,
      datos.sincronizada
    );
  }

  /** RN-15: estado dentro de la cola de sincronización offline. */
  get sincronizada(): boolean {
    return this.estaSincronizada;
  }

  /** RN-15: idempotente; volver a marcarla no cambia nada. */
  marcarSincronizada(): void {
    this.estaSincronizada = true;
  }

  /** RN-06: día calendario local de la evaluación, para rachas y estadísticas. */
  get dia(): FechaDia {
    return FechaDia.desdeIso(this.fecha);
  }

  toJSON(): DatosEvaluacion {
    return {
      id: this.id,
      estudianteId: this.estudianteId,
      nivelId: this.nivelId.valor,
      puntuacion: this.puntuacion.valor,
      aciertos: this.aciertos,
      totalPreguntas: this.totalPreguntas,
      aprobado: this.aprobado,
      fecha: this.fecha,
      sincronizada: this.estaSincronizada
    };
  }
}
