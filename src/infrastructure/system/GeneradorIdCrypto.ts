import type { GeneradorIdPort } from '@application/ports';

/**
 * Adaptador de producción de `GeneradorIdPort`.
 *
 * Estrategia en cascada, sin lanzar nunca (un fallo al generar un id no debe romper un flujo
 * de estudio offline):
 *   1. `crypto.randomUUID()` (navegadores modernos y Node ≥ 19).
 *   2. UUID v4 construido con `crypto.getRandomValues`.
 *   3. Respaldo determinista: marca de tiempo + contador monotónico con formato UUID.
 */
export class GeneradorIdCrypto implements GeneradorIdPort {
  private contador = 0;

  generar(): string {
    const cripto = obtenerCripto();

    if (cripto !== undefined) {
      if (typeof cripto.randomUUID === 'function') {
        try {
          const id = cripto.randomUUID();
          if (id.length > 0) return id;
        } catch {
          // Sin WebCrypto fiable: se intenta la siguiente estrategia.
        }
      }

      if (typeof cripto.getRandomValues === 'function') {
        try {
          return uuidV4DesdeBytes(cripto.getRandomValues(new Uint8Array(16)));
        } catch {
          // Sin entropía disponible: se usa el respaldo determinista.
        }
      }
    }

    return uuidDeRespaldo(Date.now(), this.contador++);
  }
}

function obtenerCripto(): Crypto | undefined {
  return typeof globalThis.crypto === 'undefined' ? undefined : globalThis.crypto;
}

/** Formatea 16 bytes aleatorios como UUID versión 4 (bits de versión y variante incluidos). */
function uuidV4DesdeBytes(bytes: Uint8Array): string {
  const octetos = Array.from(bytes, (octeto) => octeto.toString(16).padStart(2, '0'));
  octetos[6] = `4${(octetos[6] ?? '00').slice(1)}`;
  const variante = Number.parseInt((octetos[8] ?? '00').slice(0, 1), 16);
  octetos[8] = `${((variante & 0x3) | 0x8).toString(16)}${(octetos[8] ?? '00').slice(1)}`;
  return formatearUuid(octetos.join(''));
}

/**
 * Último recurso sin criptografía: 32 dígitos hexadecimales derivados de la marca de tiempo y
 * de un contador monotónico, con mezcla xorshift para repartir la entropía.
 */
function uuidDeRespaldo(marca: number, contador: number): string {
  let mezcla = (marca ^ Math.imul(contador + 1, 0x9e3779b1)) >>> 0;
  let hex = '';
  for (let i = 0; i < 32; i++) {
    mezcla ^= mezcla << 13;
    mezcla >>>= 0;
    mezcla ^= mezcla >>> 17;
    mezcla ^= mezcla << 5;
    mezcla >>>= 0;
    hex += (mezcla % 16).toString(16);
  }
  const marcaHex = (marca >>> 0).toString(16).padStart(8, '0');
  const contadorHex = (contador >>> 0).toString(16).padStart(8, '0');
  return formatearUuid(`${marcaHex}${contadorHex}${hex.slice(16, 32)}`);
}

/** Ensambla 32 caracteres hexadecimales con la disposición 8-4-4-4-12 de un UUID. */
function formatearUuid(hex32: string): string {
  const hex = hex32.padEnd(32, '0').slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}
