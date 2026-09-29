import { ValidacionError } from '../errores';

/**
 * RN-04: puntuación entera 0..100 obtenida en una evaluación.
 * El umbral de aprobación NO vive aquí: es responsabilidad de `PoliticaAprobacion` (fuente única).
 */
export class Puntuacion {
  static readonly MINIMA = 0;
  static readonly MAXIMA = 100;

  private constructor(readonly valor: number) {}

  static crear(valor: number): Puntuacion {
    if (!Number.isFinite(valor)) {
      throw new ValidacionError('La puntuación debe ser un número finito.', 'puntuacion');
    }
    const redondeado = Math.round(valor);
    if (redondeado < Puntuacion.MINIMA || redondeado > Puntuacion.MAXIMA) {
      throw new ValidacionError(
        `La puntuación debe estar entre ${Puntuacion.MINIMA} y ${Puntuacion.MAXIMA} (recibido: ${valor}).`,
        'puntuacion'
      );
    }
    return new Puntuacion(redondeado);
  }

  static cero(): Puntuacion {
    return new Puntuacion(0);
  }

  /** RN-04: `Math.round(aciertos / total * 100)`, con `total = 0` → 0. */
  static desdeAciertos(aciertos: number, total: number): Puntuacion {
    if (total <= 0) return Puntuacion.cero();
    return Puntuacion.crear((aciertos / total) * 100);
  }

  esPerfecta(): boolean {
    return this.valor === Puntuacion.MAXIMA;
  }

  toJSON(): number {
    return this.valor;
  }
}
