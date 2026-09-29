import type { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';

/**
 * A6: un repositorio por agregado. El progreso del estudiante es el agregado raíz del
 * aprendizaje (nivel actual, XP, racha y palabras en un único documento coherente).
 */
export interface ProgresoRepository {
  obtener(estudianteId: string): Promise<ProgresoEstudiante | null>;
  guardar(progreso: ProgresoEstudiante): Promise<void>;
  eliminar(estudianteId: string): Promise<void>;
}
