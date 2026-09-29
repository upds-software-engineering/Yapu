import type { SincronizacionRemotaPort } from '@application/ports';
import type { Evaluacion } from '@domain/evaluacion/Evaluacion';

/**
 * Adaptador de sincronización de esta iteración (ADR-002).
 *
 * No hay nube real: el adaptador acepta el lote FIFO, marca cada evaluación como sincronizada y
 * devuelve los ids efectivamente sincronizados. Se comporta de forma idempotente (recibir la
 * misma evaluación dos veces devuelve su id las dos veces y no produce efectos adicionales),
 * de modo que la cola offline nunca queda encolada para siempre. El contrato ya es el de una
 * nube real, así que sustituirlo por un adaptador HTTP no tocará los casos de uso.
 */
export class SincronizacionNoopAdapter implements SincronizacionRemotaPort {
  async sincronizar(evaluaciones: readonly Evaluacion[]): Promise<string[]> {
    const sincronizadas: string[] = [];

    for (const evaluacion of evaluaciones) {
      evaluacion.marcarSincronizada();
      sincronizadas.push(evaluacion.id);
    }

    return sincronizadas;
  }
}
