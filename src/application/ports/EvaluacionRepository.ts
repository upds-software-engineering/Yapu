import type { Evaluacion } from '@domain/evaluacion/Evaluacion';

/**
 * RN-15: el historial de evaluaciones es también la cola de sincronización offline.
 * Toda evaluación se persiste con `sincronizada = false`; el caso de uso de sincronización
 * la recorre en orden FIFO y la marca como sincronizada de forma idempotente por id.
 */
export interface EvaluacionRepository {
  guardar(evaluacion: Evaluacion): Promise<void>;
  obtener(id: string): Promise<Evaluacion | null>;
  listarPorEstudiante(estudianteId: string): Promise<Evaluacion[]>;
  listarPendientes(): Promise<Evaluacion[]>;
  marcarSincronizada(id: string): Promise<void>;
}
