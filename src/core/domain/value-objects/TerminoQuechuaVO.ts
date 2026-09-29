import { z } from 'zod';

const TerminoQuechuaSchema = z
  .string()
  .trim()
  .min(1, 'El termino en quechua no puede estar vacio')
  .max(100, 'El termino excede la longitud maxima permitida');

/**
 * Value Object inmutable que representa un termino en lengua quechua (runasimi).
 * Aplica normalizacion de espacios y garantiza que el texto sea sintacticamente valido.
 */
export class TerminoQuechuaVO {
  private readonly _texto: string;

  private constructor(texto: string) {
    this._texto = texto;
  }

  public static desde(texto: string): TerminoQuechuaVO {
    const parseResult = TerminoQuechuaSchema.safeParse(texto);
    if (!parseResult.success) {
      throw new Error(`Termino quechua invalido: ${parseResult.error.issues[0]?.message}`);
    }
    return new TerminoQuechuaVO(parseResult.data);
  }

  public get texto(): string {
    return this._texto;
  }

  public coincideCon(otroTexto: string): boolean {
    return this._texto.trim().toLowerCase() === otroTexto.trim().toLowerCase();
  }

  public equals(otro: TerminoQuechuaVO): boolean {
    return this._texto.toLowerCase() === otro._texto.toLowerCase();
  }
}
