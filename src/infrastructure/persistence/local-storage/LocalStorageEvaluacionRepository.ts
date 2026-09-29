import type { EvaluacionRepository } from '@application/ports';
import { Evaluacion, type DatosEvaluacion } from '@domain/evaluacion/Evaluacion';
import { CLAVES_NUEVAS } from './claves';
import {
  escribirJson,
  esquemaEvaluaciones,
  leerJson,
  resolverAlmacen,
  type Almacen
} from './esquema';

/**
 * RN-15: historial de evaluaciones y cola de sincronización offline en `localStorage`.
 *
 * Se guarda un array en ORDEN DE INSERCIÓN (no un objeto indexado por id) porque los objetos de
 * JavaScript reordenan las claves con forma de entero: con un `Record` el FIFO de
 * `listarPendientes()` podría romperse. Volver a guardar una evaluación ya existente respeta su
 * posición original, igual que el repositorio en memoria.
 */
export class LocalStorageEvaluacionRepository implements EvaluacionRepository {
  private readonly almacen: Almacen;
  private readonly clave: string;

  constructor(opciones: { almacen?: Almacen; clave?: string } = {}) {
    this.almacen = resolverAlmacen(opciones.almacen);
    this.clave = opciones.clave ?? CLAVES_NUEVAS.evaluaciones;
  }

  async guardar(evaluacion: Evaluacion): Promise<void> {
    const datos = evaluacion.toJSON();
    const evaluaciones = this.leerTodas();
    const indice = evaluaciones.findIndex((almacenada) => almacenada.id === datos.id);
    if (indice === -1) evaluaciones.push(datos);
    else evaluaciones.splice(indice, 1, datos);
    this.escribirTodas(evaluaciones);
  }

  async obtener(id: string): Promise<Evaluacion | null> {
    const almacenada = this.leerTodas().find((evaluacion) => evaluacion.id === id);
    return almacenada === undefined ? null : Evaluacion.reconstruir(almacenada);
  }

  async listarPorEstudiante(estudianteId: string): Promise<Evaluacion[]> {
    return this.aAgregados(this.leerTodas().filter((datos) => datos.estudianteId === estudianteId));
  }

  /** RN-15: orden FIFO de la cola offline (orden de inserción persistido). */
  async listarPendientes(): Promise<Evaluacion[]> {
    return this.aAgregados(this.leerTodas().filter((datos) => !datos.sincronizada));
  }

  /** RN-15: idempotente; marcar dos veces la misma evaluación no cambia nada. */
  async marcarSincronizada(id: string): Promise<void> {
    const evaluaciones = this.leerTodas();
    const indice = evaluaciones.findIndex((datos) => datos.id === id);
    const almacenada = evaluaciones[indice];
    if (almacenada === undefined || almacenada.sincronizada) return;

    evaluaciones.splice(indice, 1, { ...almacenada, sincronizada: true });
    this.escribirTodas(evaluaciones);
  }

  private aAgregados(datos: readonly DatosEvaluacion[]): Evaluacion[] {
    return datos.map((evaluacion) => Evaluacion.reconstruir(evaluacion));
  }

  private leerTodas(): DatosEvaluacion[] {
    return leerJson<DatosEvaluacion[]>(this.almacen, this.clave, esquemaEvaluaciones, []);
  }

  private escribirTodas(evaluaciones: readonly DatosEvaluacion[]): void {
    escribirJson(this.almacen, this.clave, evaluaciones);
  }
}
