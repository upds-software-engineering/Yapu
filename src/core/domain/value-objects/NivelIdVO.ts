import { z } from 'zod';

const NivelIdSchema = z.number().int().min(1).max(10);

/**
 * Value Object inmutable que representa el identificador de nivel del curso.
 * Delimita estrictamente el alcance del MVP (niveles 1 a 10 para certificacion A1).
 */
export class NivelIdVO {
  private readonly _valor: number;
  public static readonly MIN_NIVEL = 1;
  public static readonly MAX_NIVEL = 10;

  private constructor(valor: number) {
    this._valor = valor;
  }

  public static desde(valor: number): NivelIdVO {
    const parseResult = NivelIdSchema.safeParse(valor);
    if (!parseResult.success) {
      throw new Error(`Nivel invalido: ${valor}. Debe estar en el rango de 1 a 10.`);
    }
    return new NivelIdVO(parseResult.data);
  }

  public get valor(): number {
    return this._valor;
  }

  public tieneSiguiente(): boolean {
    return this._valor < NivelIdVO.MAX_NIVEL;
  }

  public siguiente(): NivelIdVO {
    if (!this.tieneSiguiente()) {
      throw new Error(`No existe nivel superior al maximo permitido (${NivelIdVO.MAX_NIVEL}).`);
    }
    return new NivelIdVO(this._valor + 1);
  }

  public equals(otro: NivelIdVO): boolean {
    return this._valor === otro._valor;
  }
}
