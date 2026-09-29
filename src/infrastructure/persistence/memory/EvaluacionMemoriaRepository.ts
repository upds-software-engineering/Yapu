import type { EvaluacionRepository } from '@application/ports';
import { Evaluacion, type DatosEvaluacion } from '@domain/evaluacion/Evaluacion';
import { clonar } from './clonar';

/**
 * RN-15: historial de evaluaciones y cola de sincronización offline en memoria.
 * Conserva el orden de inserción para que `listarPendientes()` respete el FIFO.
 */
export class EvaluacionMemoriaRepository implements EvaluacionRepository {
  private readonly evaluaciones = new Map<string, DatosEvaluacion>();

  async guardar(evaluacion: Evaluacion): Promise<void> {
    this.evaluaciones.set(evaluacion.id, clonar(evaluacion.toJSON()));
  }

  async obtener(id: string): Promise<Evaluacion | null> {
    const almacenada = this.evaluaciones.get(id);
    return almacenada ? Evaluacion.reconstruir(clonar(almacenada)) : null;
  }

  async listarPorEstudiante(estudianteId: string): Promise<Evaluacion[]> {
    return [...this.evaluaciones.values()]
      .filter((datos) => datos.estudianteId === estudianteId)
      .map((datos) => Evaluacion.reconstruir(clonar(datos)));
  }

  async listarPendientes(): Promise<Evaluacion[]> {
    return [...this.evaluaciones.values()]
      .filter((datos) => !datos.sincronizada)
      .map((datos) => Evaluacion.reconstruir(clonar(datos)));
  }

  async marcarSincronizada(id: string): Promise<void> {
    const almacenada = this.evaluaciones.get(id);
    if (!almacenada) return;
    this.evaluaciones.set(id, { ...almacenada, sincronizada: true });
  }
}
