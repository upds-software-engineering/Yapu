import { describe, expect, it } from 'vitest';
import { SincronizarPendientesUseCase } from '@application/use-cases/SincronizarPendientesUseCase';
import type { ConectividadPort, SincronizacionRemotaPort } from '@application/ports';
import { Evaluacion } from '@domain/evaluacion';
import { Puntuacion } from '@domain/value-objects/Puntuacion';
import { NivelId } from '@domain/value-objects/NivelId';
import { EvaluacionMemoriaRepository } from '@infrastructure/persistence/memory';
import { RelojFijo } from '../../helpers';

/**
 * [RF-009] Cola offline de evaluaciones (RN-15).
 *
 * La cola es el propio historial: toda evaluación nace `sincronizada = false`. El caso de uso
 * sólo la vacía cuando hay conexión y el adaptador confirma qué ids subió, de modo que la
 * operación sea idempotente y un fallo parcial no descarte evaluaciones sin sincronizar.
 */

const ESTUDIANTE = 'estudiante-offline';
const FECHA_FIJA = '2026-03-15T09:00:00.000Z';

// ---------------------------------------------------------------------------
// Dobles de conectividad y nube
// ---------------------------------------------------------------------------

class ConectividadFija implements ConectividadPort {
  private enLinea: boolean;

  constructor(enLinea: boolean) {
    this.enLinea = enLinea;
  }

  estaEnLinea(): boolean {
    return this.enLinea;
  }

  alRecuperarConexion(): () => void {
    return () => undefined;
  }

  /** El adaptador de producción debe consultar de nuevo el estado en cada llamada. */
  cambiarEstado(enLinea: boolean): void {
    this.enLinea = enLinea;
  }
}

class SincronizacionRemotaFalsa implements SincronizacionRemotaPort {
  readonly lotes: string[][] = [];
  private idsConfirmados: readonly string[] | null = null;

  /** `null` = el adaptador confirma todo lo que recibe (comportamiento por defecto). */
  confirmarSolo(ids: readonly string[] | null): void {
    this.idsConfirmados = ids;
  }

  async sincronizar(evaluaciones: readonly Evaluacion[]): Promise<string[]> {
    this.lotes.push(evaluaciones.map((evaluacion) => evaluacion.id));
    if (this.idsConfirmados !== null) return [...this.idsConfirmados];
    return evaluaciones.map((evaluacion) => evaluacion.id);
  }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Evaluación pendiente de subir: `Evaluacion.registrar` siempre nace con `sincronizada = false`. */
function evaluacionPendiente(id: string, nivelId: number, reloj: RelojFijo): Evaluacion {
  return Evaluacion.registrar({
    id,
    estudianteId: ESTUDIANTE,
    nivel: NivelId.crear(nivelId),
    puntuacion: Puntuacion.crear(80),
    aciertos: 8,
    totalPreguntas: 10,
    fechaIso: reloj.ahora().toISOString()
  });
}

interface Entorno {
  sincronizar: SincronizarPendientesUseCase;
  evaluaciones: EvaluacionMemoriaRepository;
  remoto: SincronizacionRemotaFalsa;
  conectividad: ConectividadFija;
}

async function entorno(
  opciones: { enLinea: boolean; pendientes: readonly string[] }
): Promise<Entorno> {
  const evaluaciones = new EvaluacionMemoriaRepository();
  const reloj = new RelojFijo(FECHA_FIJA);

  for (const [indice, id] of opciones.pendientes.entries()) {
    await evaluaciones.guardar(evaluacionPendiente(id, indice + 1, reloj));
  }

  const remoto = new SincronizacionRemotaFalsa();
  const conectividad = new ConectividadFija(opciones.enLinea);

  return {
    sincronizar: new SincronizarPendientesUseCase(evaluaciones, remoto, conectividad),
    evaluaciones,
    remoto,
    conectividad
  };
}

// ---------------------------------------------------------------------------
// Pruebas
// ---------------------------------------------------------------------------

describe('[RF-009] Cola offline', () => {
  it('[RN-15] sin conexión conserva la cola y no llama al adaptador remoto', async () => {
    // Dado un estudiante sin conexión con dos evaluaciones pendientes
    const escenario = await entorno({ enLinea: false, pendientes: ['e-1', 'e-2'] });

    // Cuando se intenta sincronizar
    const estado = await escenario.sincronizar.ejecutar();

    // Entonces el adaptador no se invoca y las dos evaluaciones siguen pendientes
    expect(escenario.remoto.lotes).toHaveLength(0);
    expect(estado).toEqual({ pendientes: 2, sincronizadas: 0, enLinea: false });
    expect(await escenario.evaluaciones.listarPendientes()).toHaveLength(2);
  });

  it('[RN-15] en línea sincroniza el lote FIFO y marca los ids devueltos', async () => {
    // Dado un estudiante con conexión y dos evaluaciones pendientes
    const escenario = await entorno({ enLinea: true, pendientes: ['e-1', 'e-2'] });

    // Cuando se sincroniza
    const estado = await escenario.sincronizar.ejecutar();

    // Entonces el lote respeta el orden de rendición y la cola queda vacía
    expect(escenario.remoto.lotes).toEqual([['e-1', 'e-2']]);
    expect(estado).toEqual({ pendientes: 0, sincronizadas: 2, enLinea: true });
    expect(await escenario.evaluaciones.listarPendientes()).toEqual([]);
  });

  it('[RN-15] con la cola vacía no consulta el adaptador y devuelve el estado actual', async () => {
    // Dado un estudiante sin evaluaciones pendientes
    const escenario = await entorno({ enLinea: true, pendientes: [] });

    // Cuando se sincroniza
    const estado = await escenario.sincronizar.ejecutar();

    // Entonces no hay nada que enviar
    expect(escenario.remoto.lotes).toHaveLength(0);
    expect(estado).toEqual({ pendientes: 0, sincronizadas: 0, enLinea: true });
  });

  it('[RN-15] ejecutarlo dos veces es idempotente: la segunda no encuentra pendientes', async () => {
    // Dado un estudiante que ya sincronizó su única evaluación
    const escenario = await entorno({ enLinea: true, pendientes: ['e-1'] });
    const primera = await escenario.sincronizar.ejecutar();

    // Cuando se vuelve a ejecutar
    const segunda = await escenario.sincronizar.ejecutar();

    // Entonces el primer envío subió la evaluación y el segundo no envía nada
    expect(primera).toEqual({ pendientes: 0, sincronizadas: 1, enLinea: true });
    expect(segunda).toEqual({ pendientes: 0, sincronizadas: 0, enLinea: true });
    expect(escenario.remoto.lotes).toEqual([['e-1']]);
    expect((await escenario.evaluaciones.obtener('e-1'))?.sincronizada).toBe(true);
  });

  it('[RN-15] sólo se marcan las evaluaciones que el adaptador confirma (fallo parcial)', async () => {
    // Dado un adaptador que sólo confirma la primera evaluación del lote
    const escenario = await entorno({ enLinea: true, pendientes: ['e-1', 'e-2'] });
    escenario.remoto.confirmarSolo(['e-1']);

    // Cuando se sincroniza
    const estado = await escenario.sincronizar.ejecutar();

    // Entonces la segunda evaluación permanece en la cola para el siguiente intento
    expect(estado).toEqual({ pendientes: 1, sincronizadas: 1, enLinea: true });
    const pendientes = await escenario.evaluaciones.listarPendientes();
    expect(pendientes.map((evaluacion) => evaluacion.id)).toEqual(['e-2']);
    expect((await escenario.evaluaciones.obtener('e-1'))?.sincronizada).toBe(true);
  });

  it('[RN-15] al recuperar la conexión vuelve a intentarlo con la cola intacta', async () => {
    // Dado un estudiante que intentó sincronizar sin conexión
    const escenario = await entorno({ enLinea: false, pendientes: ['e-1'] });
    const sinConexion = await escenario.sincronizar.ejecutar();

    // Cuando recupera la conexión y se reejecuta el caso de uso
    escenario.conectividad.cambiarEstado(true);
    const conConexion = await escenario.sincronizar.ejecutar();

    // Entonces la evaluación que quedó encolada ahora sí se sube
    expect(sinConexion).toEqual({ pendientes: 1, sincronizadas: 0, enLinea: false });
    expect(conConexion).toEqual({ pendientes: 0, sincronizadas: 1, enLinea: true });
    expect(escenario.remoto.lotes).toEqual([['e-1']]);
  });
});
