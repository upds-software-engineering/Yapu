import type { RetoRepository } from '@application/ports';
import { RetoComunitario, type DatosReto } from '@domain/contenido/RetoComunitario';
import { clonar } from './clonar';

/** RF-007: retos comunitarios en memoria, en orden de creación descendente (lo más nuevo primero). */
export class RetoMemoriaRepository implements RetoRepository {
  private readonly retos = new Map<string, DatosReto>();

  async listar(): Promise<RetoComunitario[]> {
    return [...this.retos.values()]
      .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1))
      .map((datos) => RetoComunitario.reconstruir(clonar(datos)));
  }

  async obtener(id: string): Promise<RetoComunitario | null> {
    const almacenado = this.retos.get(id);
    return almacenado ? RetoComunitario.reconstruir(clonar(almacenado)) : null;
  }

  async guardar(reto: RetoComunitario): Promise<void> {
    this.retos.set(reto.id, clonar(reto.toJSON()));
  }
}
