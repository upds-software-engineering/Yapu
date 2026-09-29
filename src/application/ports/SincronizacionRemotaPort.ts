import type { Evaluacion } from '@domain/evaluacion/Evaluacion';

/**
 * RF-009: sincronización con la nube. El adaptador de producción de esta iteración es un no-op
 * que marca las evaluaciones como sincronizadas (ADR-002), de modo que la cola offline nunca
 * queda encolada para siempre y el contrato con una nube real ya está definido.
 */
export interface SincronizacionRemotaPort {
  /** Envía un lote en orden FIFO. Devuelve los ids efectivamente sincronizados. */
  sincronizar(evaluaciones: readonly Evaluacion[]): Promise<string[]>;
}
