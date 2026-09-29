import type { Evaluacion } from '../../types/domain.ts';

/**
 * Puerto de Salida (Output Port) para la persistencia de Evaluaciones.
 * Desacopla los Casos de Uso del mecanismo de persistencia concreto (IndexedDB o Firestore).
 */
export interface IEvaluacionRepository {
  guardar(evaluacion: Evaluacion): Promise<void>;
  obtenerPorEstudiante(estudianteId: string): Promise<Evaluacion[]>;
  obtenerColaSincronizacionOffline(): Promise<Evaluacion[]>;
  limpiarColaSincronizacionOffline(): Promise<void>;
}
