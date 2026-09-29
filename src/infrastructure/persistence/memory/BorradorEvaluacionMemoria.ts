import type { BorradorEvaluacion, BorradorEvaluacionPort } from '@application/ports';
import { clonar } from './clonar';

/**
 * Borrador de la evaluación en curso.
 *
 * Se mantiene en memoria (no en localStorage) a propósito: contiene la opción correcta de cada
 * pregunta y no debe sobrevivir a la sesión de examen. El `GenerarEvaluacionUseCase` lo guarda y
 * el `CalificarEvaluacionUseCase` lo consume, de modo que la respuesta correcta nunca viaja al cliente.
 */
export class BorradorEvaluacionMemoria implements BorradorEvaluacionPort {
  private readonly borradores = new Map<number, BorradorEvaluacion>();

  guardar(borrador: BorradorEvaluacion): void {
    this.borradores.set(borrador.nivelId, clonar(borrador));
  }

  obtener(nivelId: number): BorradorEvaluacion | null {
    const borrador = this.borradores.get(nivelId);
    return borrador ? clonar(borrador) : null;
  }

  limpiar(nivelId: number): void {
    this.borradores.delete(nivelId);
  }
}
