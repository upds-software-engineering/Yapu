import type { RetoRepository } from '@application/ports';
import { RetoComunitario, type DatosReto } from '@domain/contenido/RetoComunitario';
import { CLAVES_NUEVAS } from './claves';
import { escribirJson, esquemaRetos, leerJson, resolverAlmacen, type Almacen } from './esquema';

/**
 * RF-007 / RS-003: retos comunitarios en `localStorage`, en orden de creación descendente
 * (lo más nuevo primero), igual que el repositorio en memoria. La bitácora de moderación se
 * persiste entera porque es la fuente de verdad del estado (RN-13).
 */
export class LocalStorageRetoRepository implements RetoRepository {
  private readonly almacen: Almacen;
  private readonly clave: string;

  constructor(opciones: { almacen?: Almacen; clave?: string } = {}) {
    this.almacen = resolverAlmacen(opciones.almacen);
    this.clave = opciones.clave ?? CLAVES_NUEVAS.retos;
  }

  async listar(): Promise<RetoComunitario[]> {
    return this.leerTodos()
      .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1))
      .map((datos) => RetoComunitario.reconstruir(datos));
  }

  async obtener(id: string): Promise<RetoComunitario | null> {
    const almacenado = this.leerTodos().find((reto) => reto.id === id);
    return almacenado === undefined ? null : RetoComunitario.reconstruir(almacenado);
  }

  async guardar(reto: RetoComunitario): Promise<void> {
    const datos = reto.toJSON();
    const retos = this.leerTodos();
    const indice = retos.findIndex((almacenado) => almacenado.id === datos.id);
    if (indice === -1) retos.push(datos);
    else retos.splice(indice, 1, datos);
    escribirJson(this.almacen, this.clave, retos);
  }

  private leerTodos(): DatosReto[] {
    return leerJson<DatosReto[]>(this.almacen, this.clave, esquemaRetos, []);
  }
}
