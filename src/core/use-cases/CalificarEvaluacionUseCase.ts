import { EvaluacionFactory } from '../domain/factories/EvaluacionFactory.ts';
import { PuntuacionVO } from '../domain/value-objects/PuntuacionVO.ts';
import { NivelIdVO } from '../domain/value-objects/NivelIdVO.ts';
import type { IEvaluacionRepository } from '../ports/IEvaluacionRepository.ts';
import type { DetallePregunta, Evaluacion } from '../../types/domain.ts';

export interface CalificarEvaluacionDTO {
  estudianteId: string;
  nivelId: number;
  preguntas: DetallePregunta[];
  respuestasUsuario: Record<string, string>;
}

export interface ResultadoEvaluacionDTO {
  evaluacion: Evaluacion;
  aprobado: boolean;
  umbralMinimo: number;
  detalle: DetallePregunta[];
}

/**
 * Caso de Uso: Calificar Evaluacion Determinista (CU-04 / RF-003).
 * Aplica Arquitectura Hexagonal: interactua unicamente con el dominio (Value Objects y Factory)
 * y persiste mediante el puerto inyectado IEvaluacionRepository (Inversion de Dependencias).
 */
export class CalificarEvaluacionUseCase {
  private readonly evaluacionRepo: IEvaluacionRepository;

  constructor(evaluacionRepo: IEvaluacionRepository) {
    this.evaluacionRepo = evaluacionRepo;
  }

  public async ejecutar(dto: CalificarEvaluacionDTO): Promise<ResultadoEvaluacionDTO> {
    const nivelVO = NivelIdVO.desde(dto.nivelId);

    let aciertos = 0;
    const preguntasProcesadas: DetallePregunta[] = dto.preguntas.map((p) => {
      const marcada = (dto.respuestasUsuario[p.id_pregunta] || '').trim();
      const esCorrecta = marcada.toLowerCase() === p.opcion_correcta.trim().toLowerCase();
      if (esCorrecta) aciertos++;

      return {
        ...p,
        respuesta_marcada: marcada,
        es_correcta: esCorrecta
      };
    });

    const total = dto.preguntas.length;

    // Uso de Factory Method para garantizar invariantes
    const evaluacion = EvaluacionFactory.crear({
      estudianteId: dto.estudianteId,
      nivelId: nivelVO.valor,
      totalAciertos: aciertos,
      totalPreguntas: total
    });

    // Persistencia a traves del puerto (sin acoplar a base de datos concreta)
    await this.evaluacionRepo.guardar(evaluacion);

    return {
      evaluacion,
      aprobado: evaluacion.estado_aprobacion === 'aprobado',
      umbralMinimo: PuntuacionVO.UMBRAL_APROBACION,
      detalle: preguntasProcesadas
    };
  }
}
