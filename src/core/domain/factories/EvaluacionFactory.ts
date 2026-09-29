import { PuntuacionVO } from '../value-objects/PuntuacionVO.ts';
import { NivelIdVO } from '../value-objects/NivelIdVO.ts';
import type { Evaluacion } from '../../../types/domain.ts';

export interface ParametrosCreacionEvaluacion {
  estudianteId: string;
  nivelId: number;
  totalAciertos: number;
  totalPreguntas: number;
}

/**
 * Patron Factory Method: Construye instancias validas de la entidad Evaluacion,
 * garantizando que el estado de aprobacion, puntaje y metadatos respeten las invariantes del negocio.
 */
export class EvaluacionFactory {
  public static crear(params: ParametrosCreacionEvaluacion): Evaluacion {
    const nivelVO = NivelIdVO.desde(params.nivelId);

    if (params.totalPreguntas <= 0) {
      throw new Error('El total de preguntas de la evaluacion debe ser mayor a cero.');
    }
    if (params.totalAciertos < 0 || params.totalAciertos > params.totalPreguntas) {
      throw new Error('El total de aciertos debe estar entre 0 y el total de preguntas.');
    }

    const porcentaje = Math.round((params.totalAciertos / params.totalPreguntas) * 100);
    const puntuacionVO = PuntuacionVO.desde(porcentaje);
    const aprobado = puntuacionVO.esAprobatorio();

    const timestamp = Date.now();
    const idEvaluacion = `eval_lvl${nivelVO.valor}_${timestamp}`;

    return {
      id_evaluacion: idEvaluacion,
      id_estudiante: params.estudianteId.trim(),
      id_nivel: nivelVO.valor,
      puntuacion_obtenida: puntuacionVO.valor,
      total_aciertos: params.totalAciertos,
      total_preguntas: params.totalPreguntas,
      estado_aprobacion: aprobado ? 'aprobado' : 'reprobado',
      fecha_evaluacion: new Date(timestamp).toISOString(),
      sincronizado_nube: false
    };
  }
}
