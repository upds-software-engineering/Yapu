import type { ReclamosToken } from '@application/ports';
import { AutenticacionError } from '@domain/errores';
import {
  base64Url,
  desdeBase64Url,
  hmacSha256,
  igualesEnTiempoConstante,
  utf8
} from './criptografia';

/**
 * JSON Web Token compacto firmado con HS256 (RFC 7519 / RFC 7515):
 * `base64url(cabecera).base64url(reclamos).base64url(HMAC-SHA256(cabecera.reclamos))`.
 *
 * Es un JWT estándar: cualquiera puede pegarlo en jwt.io y ver sus reclamos, y la firma sólo la
 * reproduce quien conoce la clave del servidor.
 */

const CABECERA = { alg: 'HS256', typ: 'JWT' } as const;
const CABECERA_CODIFICADA = base64Url(utf8(JSON.stringify(CABECERA)));

function firmar(entrada: string, clave: Uint8Array): string {
  return base64Url(hmacSha256(clave, utf8(entrada)));
}

/** Firma unos reclamos y devuelve el token compacto. */
export function firmarJwt(reclamos: ReclamosToken, clave: Uint8Array): string {
  const cuerpo = base64Url(utf8(JSON.stringify(reclamos)));
  const entrada = `${CABECERA_CODIFICADA}.${cuerpo}`;
  return `${entrada}.${firmar(entrada, clave)}`;
}

const invalido = (detalle: string) =>
  new AutenticacionError(`El token no es válido: ${detalle}.`, 'TOKEN_INVALIDO');

/**
 * Comprueba formato, cabecera y FIRMA, y devuelve los reclamos. No mira la caducidad: eso depende
 * del reloj y lo decide quien llama (`ServidorIdentidadSimulado`).
 */
export function verificarFirmaJwt(token: string, clave: Uint8Array): ReclamosToken {
  const partes = token.split('.');
  if (partes.length !== 3) throw invalido('no tiene tres segmentos');
  const [cabecera = '', cuerpo = '', firma = ''] = partes;

  if (cabecera !== CABECERA_CODIFICADA) throw invalido('la cabecera no es HS256');
  if (!igualesEnTiempoConstante(firma, firmar(`${cabecera}.${cuerpo}`, clave))) {
    throw invalido('la firma no coincide');
  }

  let reclamos: unknown;
  try {
    reclamos = JSON.parse(new TextDecoder().decode(desdeBase64Url(cuerpo)));
  } catch {
    throw invalido('los reclamos no son JSON');
  }
  if (!sonReclamosValidos(reclamos)) throw invalido('faltan reclamos obligatorios');
  return reclamos;
}

/** Lee los reclamos SIN verificar la firma (sólo para mostrarlos; nunca para autorizar). */
export function decodificarSinVerificar(token: string): unknown {
  const cuerpo = token.split('.')[1] ?? '';
  return JSON.parse(new TextDecoder().decode(desdeBase64Url(cuerpo)));
}

function sonReclamosValidos(dato: unknown): dato is ReclamosToken {
  if (typeof dato !== 'object' || dato === null) return false;
  const r = dato as Record<string, unknown>;
  return (
    typeof r['sub'] === 'string' &&
    typeof r['nombre'] === 'string' &&
    (r['rol'] === 'estudiante' || r['rol'] === 'docente') &&
    (r['tipo'] === 'acceso' || r['tipo'] === 'refresco') &&
    typeof r['iat'] === 'number' &&
    typeof r['exp'] === 'number' &&
    typeof r['jti'] === 'string' &&
    typeof r['fam'] === 'string'
  );
}
