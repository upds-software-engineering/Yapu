import type { RetoComunitario } from '@domain/contenido/RetoComunitario';

/** RF-007 / RS-003: retos comunitarios y su bitácora de moderación (RN-13). */
export interface RetoRepository {
  listar(): Promise<RetoComunitario[]>;
  obtener(id: string): Promise<RetoComunitario | null>;
  guardar(reto: RetoComunitario): Promise<void>;
}
