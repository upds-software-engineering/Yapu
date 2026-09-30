/**
 * Primitivas criptográficas del servidor de identidad simulado (RF-001, ADR-003).
 *
 * SHA-256 y HMAC-SHA256 implementados en TypeScript puro (FIPS 180-4 y RFC 2104) en lugar de
 * `crypto.subtle` por tres motivos:
 *  1. son SÍNCRONOS, así que firmar y verificar un token no obliga a encadenar promesas;
 *  2. se comportan igual en el navegador, en Node (build de Astro) y en jsdom (pruebas), donde
 *     `crypto.subtle` no siempre existe;
 *  3. las pruebas unitarias los contrastan byte a byte con `node:crypto`, de modo que la
 *     implementación está verificada contra una referencia estándar.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const rotar = (valor: number, bits: number): number => (valor >>> bits) | (valor << (32 - bits));

/** Lectura segura de un `Uint32Array` (el índice siempre está en rango; `?? 0` satisface al tipado). */
const leer = (palabras: Uint32Array, indice: number): number => palabras[indice] ?? 0;

/** Codifica texto en UTF-8. */
export function utf8(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

/** SHA-256 de un mensaje binario (32 bytes). */
export function sha256(mensaje: Uint8Array): Uint8Array {
  const longitudBits = mensaje.length * 8;
  const totalBloques = Math.ceil((mensaje.length + 9) / 64);
  const relleno = new Uint8Array(totalBloques * 64);
  relleno.set(mensaje);
  relleno[mensaje.length] = 0x80;
  const vista = new DataView(relleno.buffer);
  // Longitud en bits como entero de 64 bits big-endian (mensajes < 2^53 bits).
  vista.setUint32(relleno.length - 8, Math.floor(longitudBits / 0x100000000));
  vista.setUint32(relleno.length - 4, longitudBits >>> 0);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const w = new Uint32Array(64);

  for (let bloque = 0; bloque < totalBloques; bloque += 1) {
    for (let t = 0; t < 16; t += 1) w[t] = vista.getUint32(bloque * 64 + t * 4);
    for (let t = 16; t < 64; t += 1) {
      const w15 = w[t - 15] ?? 0;
      const w2 = w[t - 2] ?? 0;
      const s0 = rotar(w15, 7) ^ rotar(w15, 18) ^ (w15 >>> 3);
      const s1 = rotar(w2, 17) ^ rotar(w2, 19) ^ (w2 >>> 10);
      w[t] = ((w[t - 16] ?? 0) + s0 + (w[t - 7] ?? 0) + s1) >>> 0;
    }

    let a = leer(h, 0);
    let b = leer(h, 1);
    let c = leer(h, 2);
    let d = leer(h, 3);
    let e = leer(h, 4);
    let f = leer(h, 5);
    let g = leer(h, 6);
    let hh = leer(h, 7);
    for (let t = 0; t < 64; t += 1) {
      const S1 = rotar(e, 6) ^ rotar(e, 11) ^ rotar(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + (K[t] ?? 0) + (w[t] ?? 0)) >>> 0;
      const S0 = rotar(a, 2) ^ rotar(a, 13) ^ rotar(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    [a, b, c, d, e, f, g, hh].forEach((valor, indice) => {
      h[indice] = (leer(h, indice) + valor) >>> 0;
    });
  }

  const salida = new Uint8Array(32);
  const vistaSalida = new DataView(salida.buffer);
  h.forEach((palabra, indice) => vistaSalida.setUint32(indice * 4, palabra));
  return salida;
}

/** HMAC-SHA256 (RFC 2104) con bloque de 64 bytes. */
export function hmacSha256(clave: Uint8Array, mensaje: Uint8Array): Uint8Array {
  const claveBloque = new Uint8Array(64);
  claveBloque.set(clave.length > 64 ? sha256(clave) : clave);

  const interna = new Uint8Array(64 + mensaje.length);
  const externa = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i += 1) {
    interna[i] = (claveBloque[i] ?? 0) ^ 0x36;
    externa[i] = (claveBloque[i] ?? 0) ^ 0x5c;
  }
  interna.set(mensaje, 64);
  externa.set(sha256(interna), 64);
  return sha256(externa);
}

/** Bytes → hexadecimal en minúsculas (para comparar con `node:crypto` y para los hash de contraseña). */
export function aHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Bytes → Base64URL sin relleno (RFC 7515, formato de los segmentos de un JWT). */
export function base64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64URL → bytes. Lanza si el texto no es Base64URL válido. */
export function desdeBase64Url(texto: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(texto)) throw new Error('Base64URL no válido');
  const normalizado = texto.replace(/-/g, '+').replace(/_/g, '/');
  const conRelleno = normalizado + '='.repeat((4 - (normalizado.length % 4)) % 4);
  const binario = atob(conRelleno);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
}

/**
 * Comparación en tiempo constante: evita que el tiempo de respuesta revele cuántos caracteres de
 * una firma coinciden (buena práctica aunque el servidor sea simulado).
 */
export function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}
