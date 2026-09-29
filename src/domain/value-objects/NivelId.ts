import { ValidacionError } from '../errores';

/**
 * RN-01 / RN-02: nivel del estudiante. Rango cerrado 1..10.
 * Es un objeto de valor inmutable: no existen niveles fuera de rango en el dominio.
 */
export class NivelId {
  static readonly TOTAL_NIVELES = 10;
  static readonly PRIMERO = 1;
  static readonly ULTIMO = 10;

  private constructor(readonly valor: number) {}

  static crear(valor: number): NivelId {
    if (!Number.isInteger(valor) || valor < NivelId.PRIMERO || valor > NivelId.ULTIMO) {
      throw new ValidacionError(
        `El nivel debe ser un entero entre ${NivelId.PRIMERO} y ${NivelId.ULTIMO} (recibido: ${valor}).`,
        'nivel'
      );
    }
    return new NivelId(valor);
  }

  /** Interpreta un parámetro de ruta; lanza `ValidacionError` si no es un nivel válido. */
  static desdeTexto(texto: string | undefined | null): NivelId {
    const numero = Number.parseInt(String(texto ?? ''), 10);
    return NivelId.crear(numero);
  }

  get esPrimero(): boolean {
    return this.valor === NivelId.PRIMERO;
  }

  get esUltimo(): boolean {
    return this.valor === NivelId.ULTIMO;
  }

  /** RN-02: el siguiente nivel nunca se sale del curso. */
  siguiente(): NivelId {
    return this.esUltimo ? this : NivelId.crear(this.valor + 1);
  }

  anterior(): NivelId {
    return this.esPrimero ? this : NivelId.crear(this.valor - 1);
  }

  /** RN-01: el nivel es alcanzable si no supera el nivel actual del estudiante. */
  esAlcanzableDesde(nivelActual: NivelId): boolean {
    return this.valor <= nivelActual.valor;
  }

  igualA(otro: NivelId): boolean {
    return this.valor === otro.valor;
  }

  compararCon(otro: NivelId): number {
    return this.valor - otro.valor;
  }

  toString(): string {
    return String(this.valor);
  }

  toJSON(): number {
    return this.valor;
  }
}
