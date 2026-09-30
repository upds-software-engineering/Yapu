import type { Reloj } from '@domain/shared/puertos';
import { FechaDia } from '@domain/value-objects';

/**
 * Reloj determinista para tests.
 * Avanza sólo cuando el test lo pide, de modo que las reglas de racha (RN-06) y de
 * generación de identificadores (RN-17) sean reproducibles.
 */
export class RelojFijo implements Reloj {
  private actual: Date;

  constructor(isoInicial: string | Date = '2026-03-15T09:00:00.000Z') {
    this.actual = typeof isoInicial === 'string' ? new Date(isoInicial) : new Date(isoInicial.getTime());
  }

  ahora(): Date {
    return new Date(this.actual.getTime());
  }

  /** Desplaza el reloj `dias` días calendario y devuelve la nueva fecha. */
  avanzarDias(dias: number): Date {
    this.actual = new Date(this.actual.getTime() + dias * 86_400_000);
    return this.ahora();
  }

  avanzarHoras(horas: number): Date {
    this.actual = new Date(this.actual.getTime() + horas * 3_600_000);
    return this.ahora();
  }

  /** Desplaza el reloj `segundos` segundos (caducidad de tokens, RF-001). */
  avanzarSegundos(segundos: number): Date {
    this.actual = new Date(this.actual.getTime() + segundos * 1000);
    return this.ahora();
  }

  establecer(iso: string | Date): Date {
    this.actual = typeof iso === 'string' ? new Date(iso) : new Date(iso.getTime());
    return this.ahora();
  }

  get diaActual(): FechaDia {
    return FechaDia.desdeFecha(this.actual);
  }
}

export function unRelojFijo(iso?: string | Date): RelojFijo {
  return new RelojFijo(iso);
}
