import type { OracionRepository } from '@application/ports';
import { OracionBase, type DatosOracion } from '@domain/contenido/OracionBase';
import { clonar } from './clonar';

/**
 * RF-006: oraciones base en memoria. Se inicializa con un corpus ya existente (por ejemplo el
 * sembrado de infraestructura) y acumula las oraciones que registra el docente.
 */
export class OracionMemoriaRepository implements OracionRepository {
  private readonly oraciones = new Map<string, DatosOracion>();

  constructor(iniciales: readonly OracionBase[] = []) {
    for (const oracion of iniciales) {
      this.oraciones.set(oracion.id, clonar(oracion.toJSON()));
    }
  }

  async listar(): Promise<OracionBase[]> {
    return [...this.oraciones.values()].map((datos) => OracionBase.reconstruir(clonar(datos)));
  }

  async listarPorNivel(nivelId: number): Promise<OracionBase[]> {
    return (await this.listar()).filter((oracion) => oracion.nivelId.valor === nivelId);
  }

  async listarAprobadasPorNivel(nivelId: number): Promise<OracionBase[]> {
    return (await this.listarPorNivel(nivelId)).filter((oracion) => oracion.esAprobada());
  }

  async guardar(oracion: OracionBase): Promise<void> {
    this.oraciones.set(oracion.id, clonar(oracion.toJSON()));
  }
}
