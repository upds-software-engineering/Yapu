import type { ProgresoRepository } from '@application/ports';
import { ProgresoEstudiante, type DatosProgreso } from '@domain/aprendizaje/ProgresoEstudiante';
import { CLAVES_NUEVAS } from './claves';
import { escribirJson, esquemaProgresos, leerJson, resolverAlmacen, type Almacen } from './esquema';

/**
 * RN-07 / RN-08: progreso del estudiante en `localStorage`, con un documento por estudiante.
 *
 * Guarda la forma serializada del agregado (`DatosProgreso`) y lo rehidrata con
 * `ProgresoEstudiante.reconstruir`, de modo que su contrato sea idéntico al del repositorio en
 * memoria: la misma suite `tests/contract` se ejecuta contra ambos adaptadores.
 *
 * Es un adaptador tolerante: una clave corrupta o con forma inválida se limpia y la lectura
 * devuelve `null` en lugar de propagar el error. Durante el render de servidor de Astro no
 * existe `localStorage`, así que trabaja sobre un almacén en memoria interno.
 */
export class LocalStorageProgresoRepository implements ProgresoRepository {
  private readonly almacen: Almacen;
  private readonly clave: string;

  constructor(opciones: { almacen?: Almacen; clave?: string } = {}) {
    this.almacen = resolverAlmacen(opciones.almacen);
    this.clave = opciones.clave ?? CLAVES_NUEVAS.progreso;
  }

  async obtener(estudianteId: string): Promise<ProgresoEstudiante | null> {
    const almacenado = this.leerTodos()[estudianteId];
    if (almacenado === undefined) return null;
    return ProgresoEstudiante.reconstruir(almacenado);
  }

  async guardar(progreso: ProgresoEstudiante): Promise<void> {
    const progresos = this.leerTodos();
    progresos[progreso.estudianteId] = progreso.toJSON();
    this.escribirTodos(progresos);
  }

  async eliminar(estudianteId: string): Promise<void> {
    const progresos = this.leerTodos();
    delete progresos[estudianteId];
    this.escribirTodos(progresos);
  }

  private leerTodos(): Record<string, DatosProgreso> {
    return leerJson<Record<string, DatosProgreso>>(
      this.almacen,
      this.clave,
      esquemaProgresos,
      {}
    );
  }

  private escribirTodos(progresos: Record<string, DatosProgreso>): void {
    escribirJson(this.almacen, this.clave, progresos);
  }
}
