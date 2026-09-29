import type { Pregunta } from '@domain/evaluacion/Pregunta';

/**
 * Borrador de la evaluación en curso.
 *
 * Por qué existe: `PreguntaDto` que viaja a la UI NO incluye la opción correcta (la UI no puede
 * filtrar respuestas). Al calificar, el caso de uso recupera las preguntas originales desde este
 * borrador en lugar de confiar en datos que vuelven del cliente.
 */
export interface BorradorEvaluacion {
  nivelId: number;
  preguntas: readonly Pregunta[];
  generadoEn: string;
}

export interface BorradorEvaluacionPort {
  guardar(borrador: BorradorEvaluacion): void;
  obtener(nivelId: number): BorradorEvaluacion | null;
  limpiar(nivelId: number): void;
}
