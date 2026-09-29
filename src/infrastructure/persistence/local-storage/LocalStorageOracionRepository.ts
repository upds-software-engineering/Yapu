import type { OracionRepository } from '@application/ports';
import { OracionBase, type DatosOracion } from '@domain/contenido/OracionBase';
import { CLAVES_NUEVAS } from './claves';
import { escribirJson, esquemaOraciones, leerJson, resolverAlmacen, type Almacen } from './esquema';

/**
 * RF-006: oraciones base en `localStorage`.
 *
 * El corpus sembrado (el que trae la aplicación) vive en memoria y se devuelve SIEMPRE primero;
 * lo que registra el docente se persiste bajo `yapu:oraciones:v1`. Al combinar se resuelve por
 * `id`, de modo que una oración del docente con el mismo id que una sembrada la reemplaza en su
 * misma posición, igual que hace el repositorio en memoria.
 */
export class LocalStorageOracionRepository implements OracionRepository {
  private readonly semilla: readonly DatosOracion[];
  private readonly almacen: Almacen;
  private readonly clave: string;

  constructor(
    semilla: readonly OracionBase[] = [],
    opciones: { almacen?: Almacen; clave?: string } = {}
  ) {
    this.semilla = semilla.map((oracion) => oracion.toJSON());
    this.almacen = resolverAlmacen(opciones.almacen);
    this.clave = opciones.clave ?? CLAVES_NUEVAS.oraciones;
  }

  async listar(): Promise<OracionBase[]> {
    return this.combinar(this.leerDelDocente()).map((datos) => OracionBase.reconstruir({ ...datos }));
  }

  async listarPorNivel(nivelId: number): Promise<OracionBase[]> {
    return (await this.listar()).filter((oracion) => oracion.nivelId.valor === nivelId);
  }

  async listarAprobadasPorNivel(nivelId: number): Promise<OracionBase[]> {
    return (await this.listarPorNivel(nivelId)).filter((oracion) => oracion.esAprobada());
  }

  async guardar(oracion: OracionBase): Promise<void> {
    const datos = oracion.toJSON();
    const delDocente = this.leerDelDocente();
    const indice = delDocente.findIndex((almacenada) => almacenada.id === datos.id);
    if (indice === -1) delDocente.push(datos);
    else delDocente.splice(indice, 1, datos);
    escribirJson(this.almacen, this.clave, delDocente);
  }

  /** Corpus sembrado primero y, a continuación, lo aportado por docentes. */
  private combinar(delDocente: readonly DatosOracion[]): DatosOracion[] {
    const combinadas = new Map<string, DatosOracion>();
    for (const datos of this.semilla) {
      if (!combinadas.has(datos.id)) combinadas.set(datos.id, datos);
    }
    for (const datos of delDocente) combinadas.set(datos.id, datos);
    return [...combinadas.values()];
  }

  private leerDelDocente(): DatosOracion[] {
    return leerJson<DatosOracion[]>(this.almacen, this.clave, esquemaOraciones, []);
  }
}
