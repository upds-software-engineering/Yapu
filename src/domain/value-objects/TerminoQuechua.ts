import { ValidacionError } from '../errores';
import { contienePalabraClave, normalizarTexto } from '../shared/texto';

/**
 * Término en runasimi.
 *
 * Normaliza apóstrofos tipográficos y mayúsculas para que las comparaciones del dominio
 * (RN-09: unicidad de opciones; RN-11: oración contiene la palabra clave) sean estables.
 * Nunca elimina la `ñ`, que es una letra propia del quechua y no una tilde decorativa.
 */
export class TerminoQuechua {
  private constructor(
    readonly valor: string,
    readonly normalizado: string
  ) {}

  static crear(valor: string): TerminoQuechua {
    const limpio = valor.normalize('NFC').replace(/[\u2018\u2019\u02BC`´]/g, "'").replace(/\s+/g, ' ').trim();
    if (limpio.length === 0) {
      throw new ValidacionError('El término en quechua no puede estar vacío.', 'termino');
    }
    return new TerminoQuechua(limpio, normalizarTexto(limpio));
  }

  igualA(otro: TerminoQuechua): boolean {
    return this.normalizado === otro.normalizado;
  }

  /** RN-09: ¿la opción candidata es el mismo término que este (ignorando caso y apóstrofos)? */
  coincideConTexto(candidato: string): boolean {
    return this.normalizado === normalizarTexto(candidato);
  }

  /** RN-11: ¿el texto (oración) contiene este término al inicio de palabra, admitiendo sufijos? */
  estaContenidoEn(texto: string): boolean {
    return contienePalabraClave(texto, this.valor);
  }

  get longitud(): number {
    return this.valor.length;
  }

  toString(): string {
    return this.valor;
  }

  toJSON(): string {
    return this.valor;
  }
}
