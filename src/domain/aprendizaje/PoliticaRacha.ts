import type { FechaDia } from '../value-objects/FechaDia';

/**
 * RN-06: racha de días calendario consecutivos con actividad.
 *
 * La racha se mide en días calendario locales (`FechaDia`), nunca en milisegundos: practicar
 * a las 23:50 y volver a las 00:10 cuenta como dos días distintos y suma uno. Es una política
 * pura: recibe la racha anterior, el último día con actividad y el día de hoy.
 */
export class PoliticaRacha {
  /**
   * Calcula la racha resultante de registrar actividad el día `hoy`:
   *  - perfil sin actividad previa (`ultimaActividad === null`) → 1;
   *  - mismo día → sin cambio;
   *  - exactamente el día siguiente → +1;
   *  - hueco de dos o más días → se reinicia en 1.
   */
  static calcular(rachaActual: number, ultimaActividad: FechaDia | null, hoy: FechaDia): number {
    if (ultimaActividad === null) return 1;

    const diasTranscurridos = ultimaActividad.diasHasta(hoy);
    if (diasTranscurridos <= 0) return rachaActual;
    if (diasTranscurridos === 1) return rachaActual + 1;
    return 1;
  }
}
