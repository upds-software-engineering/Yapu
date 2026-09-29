import type { FuenteAleatoria, GeneradorId } from '@domain/shared/puertos';

/**
 * PRNG mulberry32 sembrado: la misma semilla produce la misma secuencia.
 * Es el equivalente de test del adaptador de producción `AleatorioMulberry32`,
 * pero sin depender de infraestructura (los tests de dominio son puros).
 */
export class AleatorioFijo implements FuenteAleatoria {
  private estado: number;

  constructor(readonly semilla: number = 20260315) {
    this.estado = semilla >>> 0;
  }

  siguiente(): number {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** Fuente aleatoria que devuelve siempre los mismos valores, en orden, de forma cíclica. */
export class AleatorioGuionado implements FuenteAleatoria {
  private indice = 0;

  constructor(private readonly valores: readonly number[] = [0]) {}

  siguiente(): number {
    const valor = this.valores[this.indice % this.valores.length] ?? 0;
    this.indice += 1;
    return valor;
  }
}

/** Generador de ids determinista: `prefijo-1`, `prefijo-2`, ... */
export class GeneradorIdSecuencial implements GeneradorId {
  private contador = 0;

  constructor(private readonly prefijo = 'id') {}

  generar(): string {
    this.contador += 1;
    return `${this.prefijo}-${this.contador}`;
  }
}

export function unAleatorioFijo(semilla?: number): AleatorioFijo {
  return new AleatorioFijo(semilla);
}

export function unGeneradorId(prefijo = 'id'): GeneradorIdSecuencial {
  return new GeneradorIdSecuencial(prefijo);
}

/**
 * Reproduce la misma secuencia que el adaptador de producción (mulberry32),
 * para poder comparar comportamiento sin duplicar el algoritmo en los tests.
 */
export function mismaSecuencia(a: FuenteAleatoria, b: FuenteAleatoria, cantidad = 5): boolean {
  for (let i = 0; i < cantidad; i++) {
    if (a.siguiente() !== b.siguiente()) return false;
  }
  return true;
}
