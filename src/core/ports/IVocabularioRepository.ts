import type { PalabraVocabulario, VocabularioEstudiante } from '../../types/domain.ts';

/**
 * Puerto de Salida para el acceso y actualizacion del vocabulario quechua.
 */
export interface IVocabularioRepository {
  obtenerVocabularioPorNivel(nivelId: number): Promise<PalabraVocabulario[]>;
  obtenerTodoVocabulario(): Promise<PalabraVocabulario[]>;
  obtenerProgresoEstudiante(estudianteId: string): Promise<Record<string, VocabularioEstudiante>>;
  actualizarEstadoPalabra(
    estudianteId: string,
    palabraId: string,
    estado: 'aprendido' | 'repasar'
  ): Promise<void>;
}
