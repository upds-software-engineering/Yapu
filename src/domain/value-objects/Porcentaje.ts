import { ValidacionError } from '../errores';
import { NivelId } from './NivelId';

/**
 * RN-03: porcentaje de progreso global del curso (0..100).
 * Se calcula sobre 10 niveles, por lo que al completar el curso vale exactamente 100.
 */
export class Porcentaje {
  static readonly MINIMO = 0;
  static readonly MAXIMO = 100;

  private constructor(readonly valor: number) {}

  static crear(valor: number): Porcentaje {
    const redondeado = Math.round(valor);
    if (!Number.isFinite(redondeado) || redondeado < Porcentaje.MINIMO || redondeado > Porcentaje.MAXIMO) {
      throw new ValidacionError(
        `El porcentaje debe estar entre ${Porcentaje.MINIMO} y ${Porcentaje.MAXIMO} (recibido: ${valor}).`,
        'porcentaje'
      );
    }
    return new Porcentaje(redondeado);
  }

  /** RN-03: `nivelesAprobados / 10 * 100`. */
  static desdeNivelesAprobados(nivelesAprobados: number): Porcentaje {
    const aprobados = Math.max(0, Math.min(NivelId.TOTAL_NIVELES, nivelesAprobados));
    return Porcentaje.crear((aprobados / NivelId.TOTAL_NIVELES) * 100);
  }

  static desdeParte(parte: number, total: number): Porcentaje {
    if (total <= 0) return Porcentaje.crear(0);
    return Porcentaje.crear((parte / total) * 100);
  }

  esCompleto(): boolean {
    return this.valor === Porcentaje.MAXIMO;
  }

  toString(): string {
    return `${this.valor}%`;
  }

  toJSON(): number {
    return this.valor;
  }
}
