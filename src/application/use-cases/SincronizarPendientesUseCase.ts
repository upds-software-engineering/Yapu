import type {
  ConectividadPort,
  EvaluacionRepository,
  SincronizacionRemotaPort
} from '@application/ports';
import type { EstadoSincronizacionDto } from '@application/dto';

/**
 * RF-009 / RN-15: vacía la cola de evaluaciones pendientes de subir a la nube.
 *
 * Reglas:
 *  - la cola es el propio historial (`listarPendientes()`), en orden FIFO de rendición;
 *  - sin conexión NO se llama al adaptador remoto: la cola se conserva intacta para el
 *    siguiente intento (el caso de uso se reejecuta al recuperar la conexión);
 *  - con conexión sólo se marcan como sincronizadas las evaluaciones cuyo id devolvió el
 *    adaptador, de modo que la operación es idempotente por id y un fallo parcial no pierde nada.
 */
export class SincronizarPendientesUseCase {
  constructor(
    private readonly evaluaciones: EvaluacionRepository,
    private readonly sincronizacion: SincronizacionRemotaPort,
    private readonly conectividad: ConectividadPort
  ) {}

  async ejecutar(): Promise<EstadoSincronizacionDto> {
    const pendientes = await this.evaluaciones.listarPendientes();

    // Cola vacía: no hace falta consultar la conectividad ni el adaptador remoto.
    if (pendientes.length === 0) {
      return { pendientes: 0, sincronizadas: 0, enLinea: this.conectividad.estaEnLinea() };
    }

    if (!this.conectividad.estaEnLinea()) {
      return { pendientes: pendientes.length, sincronizadas: 0, enLinea: false };
    }

    // FIFO: el repositorio devuelve la cola en orden de rendición.
    const ids = await this.sincronizacion.sincronizar(pendientes);
    for (const id of new Set(ids)) {
      await this.evaluaciones.marcarSincronizada(id);
    }

    const restantes = await this.evaluaciones.listarPendientes();

    return { pendientes: restantes.length, sincronizadas: ids.length, enLinea: true };
  }
}
