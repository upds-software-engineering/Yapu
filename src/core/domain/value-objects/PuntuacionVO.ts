import { z } from 'zod';

const PuntuacionSchema = z.number().int().min(0).max(100);

/**
 * Value Object inmutable que encapsula la puntuacion obtenida en una evaluacion.
 * Aplica reglas de negocio estrictas: rango [0, 100] y umbral minimo de aprobacion del 70%.
 */
export class PuntuacionVO {
  private readonly _valor: number;
  public static readonly UMBRAL_APROBACION = 70;

  private constructor(valor: number) {
    this._valor = valor;
  }

  public static desde(valor: number): PuntuacionVO {
    const parseResult = PuntuacionSchema.safeParse(valor);
    if (!parseResult.success) {
      throw new Error(`Puntuacion invalida: ${valor}. Debe ser un entero entre 0 y 100.`);
    }
    return new PuntuacionVO(parseResult.data);
  }

  public get valor(): number {
    return this._valor;
  }

  public esAprobatorio(): boolean {
    return this._valor >= PuntuacionVO.UMBRAL_APROBACION;
  }

  public equals(otra: PuntuacionVO): boolean {
    return this._valor === otra._valor;
  }
}
