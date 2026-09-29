import type { AleatorioPort } from '@application/ports';

/** Semilla por defecto cuando no hay entropía disponible (borde de infraestructura). */
const SEMILLA_DE_RESPALDO = 20260315;

/**
 * PRNG mulberry32: rápido, determinista y con estado de 32 bits.
 *
 * Es el adaptador de producción de `AleatorioPort`. Comparte algoritmo con `AleatorioFijo`
 * (tests/helpers) a propósito: así una prueba puede comprobar que producción y doble de
 * prueba reproducen exactamente la misma secuencia con la misma semilla.
 */
export class AleatorioMulberry32 implements AleatorioPort {
  private estado: number;

  /** Semilla efectiva, expuesta para poder registrar/reproducir una partida concreta. */
  readonly semilla: number;

  constructor(semilla?: number) {
    this.semilla = semilla ?? sembrarDesdeEntropia();
    this.estado = this.semilla >>> 0;
  }

  /** Constructor explícito y legible para los puntos de composición y las pruebas. */
  static conSemilla(semilla: number): AleatorioMulberry32 {
    return new AleatorioMulberry32(semilla);
  }

  /** Siguiente valor pseudoaleatorio en el intervalo [0, 1). */
  siguiente(): number {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Entropía del borde: `crypto.getRandomValues` si existe y, si no (SSR/pruebas sin WebCrypto),
 * la marca de tiempo. Nunca lanza: sin semilla el PRNG debe seguir funcionando.
 */
function sembrarDesdeEntropia(): number {
  const cripto = typeof globalThis.crypto === 'undefined' ? undefined : globalThis.crypto;
  if (cripto !== undefined && typeof cripto.getRandomValues === 'function') {
    try {
      return cripto.getRandomValues(new Uint32Array(1))[0] ?? SEMILLA_DE_RESPALDO;
    } catch {
      return Date.now() >>> 0;
    }
  }
  return Date.now() >>> 0;
}
