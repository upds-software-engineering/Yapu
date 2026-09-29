import { ValidacionError } from '../errores';

/**
 * RN-06: día calendario LOCAL de actividad, sin hora ni zona horaria.
 *
 * La racha depende de días calendario, no de diferencias en milisegundos: si un estudiante
 * practica a las 23:50 y luego a las 00:10, son dos días distintos (racha +1). Por eso el
 * objeto de valor se reduce a `YYYY-MM-DD` en hora local.
 */
export class FechaDia {
  private static readonly PATRON = /^(\d{4})-(\d{2})-(\d{2})$/;

  private constructor(
    readonly anio: number,
    readonly mes: number,
    readonly dia: number
  ) {}

  /** Construye desde un `Date` usando los getters locales (nunca UTC). */
  static desdeFecha(fecha: Date): FechaDia {
    if (Number.isNaN(fecha.getTime())) {
      throw new ValidacionError('La fecha proporcionada no es válida.', 'fecha');
    }
    return new FechaDia(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
  }

  /** Construye desde `YYYY-MM-DD` (o desde un ISO completo, del que toma la parte de fecha local). */
  static desdeTexto(texto: string): FechaDia {
    const coincidencia = FechaDia.PATRON.exec(texto.trim());
    if (!coincidencia) {
      throw new ValidacionError(`Formato de fecha inválido: "${texto}". Se espera YYYY-MM-DD.`, 'fecha');
    }
    const anio = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]);
    const dia = Number(coincidencia[3]);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      throw new ValidacionError(`Fecha fuera de rango: "${texto}".`, 'fecha');
    }
    return new FechaDia(anio, mes, dia);
  }

  /** Interpreta un ISO con hora: si trae zona, se respeta el instante; si no, se toma la parte de fecha. */
  static desdeIso(iso: string): FechaDia {
    const conHora = /^\d{4}-\d{2}-\d{2}T/.test(iso);
    if (!conHora) return FechaDia.desdeTexto(iso);
    return FechaDia.desdeFecha(new Date(iso));
  }

  /** Días calendario transcurridos entre `this` y `otra` (positivo si `otra` es posterior). */
  diasHasta(otra: FechaDia): number {
    const origen = Date.UTC(this.anio, this.mes - 1, this.dia);
    const destino = Date.UTC(otra.anio, otra.mes - 1, otra.dia);
    return Math.round((destino - origen) / 86_400_000);
  }

  get clave(): string {
    return this.toJSON();
  }

  igualA(otra: FechaDia): boolean {
    return this.clave === otra.clave;
  }

  /** `true` si este día es posterior a `otra` (orden calendario natural). */
  esPosteriorA(otra: FechaDia): boolean {
    return this.diasHasta(otra) < 0;
  }

  toJSON(): string {
    const mes = String(this.mes).padStart(2, '0');
    const dia = String(this.dia).padStart(2, '0');
    return `${this.anio}-${mes}-${dia}`;
  }

  toString(): string {
    return this.toJSON();
  }
}
