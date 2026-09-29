import type { ProgresoRepository } from '@application/ports';
import { ProgresoEstudiante, type DatosProgreso } from '@domain/aprendizaje/ProgresoEstudiante';
import { clonar } from './clonar';

/**
 * Repositorio de progreso en memoria (tests y SSR).
 * Almacena la representación serializada del agregado: así el contrato es idéntico al del
 * repositorio de localStorage y la suite `tests/contract` puede ejecutarse contra ambos.
 */
export class ProgresoMemoriaRepository implements ProgresoRepository {
  private readonly datos = new Map<string, DatosProgreso>();

  async obtener(estudianteId: string): Promise<ProgresoEstudiante | null> {
    const almacenado = this.datos.get(estudianteId);
    if (!almacenado) return null;
    return ProgresoEstudiante.reconstruir(clonar(almacenado));
  }

  async guardar(progreso: ProgresoEstudiante): Promise<void> {
    this.datos.set(progreso.estudianteId, clonar(progreso.toJSON()));
  }

  async eliminar(estudianteId: string): Promise<void> {
    this.datos.delete(estudianteId);
  }
}
