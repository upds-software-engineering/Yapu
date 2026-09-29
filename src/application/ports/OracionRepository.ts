import type { OracionBase } from '@domain/contenido/OracionBase';

/**
 * RF-006: oraciones base aportadas por docentes. Las aprobadas alimentan al generador
 * determinista (RN-12), por eso el puerto expone una consulta específica de aprobadas por nivel.
 */
export interface OracionRepository {
  listar(): Promise<OracionBase[]>;
  listarPorNivel(nivelId: number): Promise<OracionBase[]>;
  listarAprobadasPorNivel(nivelId: number): Promise<OracionBase[]>;
  guardar(oracion: OracionBase): Promise<void>;
}
