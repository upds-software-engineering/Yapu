import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AutenticacionError, type MotivoAutenticacion } from '@domain/errores';
import {
  AlmacenTokensLocal,
  CLAVE_TOKENS,
  DURACION_ACCESO_S,
  DURACION_REFRESCO_S,
  ServidorIdentidadSimulado,
  aHex,
  base64Url,
  desdeBase64Url,
  firmarJwt,
  hmacSha256,
  sha256,
  verificarFirmaJwt
} from '@infrastructure/auth';
import { AlmacenMemoria } from '@infrastructure/persistence/local-storage';
import type { ReclamosToken } from '@application/ports';
import { RelojFijo, unGeneradorId } from '../../helpers';

/**
 * [RF-001] Autenticación por tokens — pruebas UNITARIAS de infraestructura.
 *
 * 1. Criptografía: SHA-256 y HMAC-SHA256 se contrastan byte a byte con `node:crypto`.
 * 2. JWT: firma, verificación y rechazo de cualquier manipulación.
 * 3. Servidor de identidad simulado: credenciales, caducidad, rotación del token de refresco,
 *    detección de reutilización y revocación al cerrar sesión, con un reloj fijo (sin esperas).
 */

const utf8 = (texto: string) => new TextEncoder().encode(texto);
const CONTRASENA = 'yapu2026';

/** Ejecuta `accion` y devuelve el motivo del `AutenticacionError` que lanza. */
async function motivoDe(accion: () => Promise<unknown> | unknown): Promise<MotivoAutenticacion> {
  try {
    await accion();
  } catch (fallo) {
    expect(fallo).toBeInstanceOf(AutenticacionError);
    return (fallo as AutenticacionError).motivo;
  }
  throw new Error('Se esperaba un AutenticacionError y la operación terminó bien.');
}

function montarServidor(opciones: { almacen?: AlmacenMemoria } = {}) {
  const reloj = new RelojFijo('2026-09-29T12:00:00.000Z');
  const servidor = new ServidorIdentidadSimulado({
    reloj,
    generadorId: unGeneradorId('tok'),
    almacen: opciones.almacen ?? new AlmacenMemoria()
  });
  return { reloj, servidor };
}

/** Cambia un reclamo del cuerpo del token SIN volver a firmarlo (ataque de manipulación). */
function manipular(token: string, cambios: Partial<ReclamosToken>): string {
  const [cabecera, cuerpo, firma] = token.split('.');
  const reclamos = JSON.parse(new TextDecoder().decode(desdeBase64Url(cuerpo!))) as ReclamosToken;
  return [cabecera, base64Url(utf8(JSON.stringify({ ...reclamos, ...cambios }))), firma].join('.');
}

describe('[RF-001] Criptografía del servidor de identidad', () => {
  it.each([
    ['vacío', ''],
    ['abc (vector FIPS 180-4)', 'abc'],
    ['UTF-8 con tildes y ñ', 'Allianllachu, ñuqa Qhichwata yachakuni: ¿imaynallam?'],
    ['mensaje de varios bloques', 'yapu'.repeat(300)]
  ])('[RF-001] SHA-256 coincide con node:crypto (%s)', (_nombre, mensaje) => {
    // Dado un mensaje / Cuando se resume con ambas implementaciones / Entonces coinciden
    expect(aHex(sha256(utf8(mensaje)))).toBe(createHash('sha256').update(mensaje, 'utf8').digest('hex'));
  });

  it.each([
    ['clave corta', 'clave', 'mensaje firmado'],
    ['clave mayor que el bloque (se resume antes)', 'k'.repeat(100), 'otro mensaje'],
    ['mensaje vacío', 'yapu', '']
  ])('[RF-001] HMAC-SHA256 coincide con node:crypto (%s)', (_nombre, clave, mensaje) => {
    expect(aHex(hmacSha256(utf8(clave), utf8(mensaje)))).toBe(
      createHmac('sha256', clave).update(mensaje, 'utf8').digest('hex')
    );
  });

  it('[RF-001] Base64URL ida y vuelta sin relleno ni caracteres + /', () => {
    // Dados bytes que en Base64 normal producen "+", "/" y "="
    const bytes = new Uint8Array([251, 255, 191, 0, 1]);

    // Cuando se codifican y decodifican
    const texto = base64Url(bytes);

    // Entonces el texto es seguro para URL y vuelve a los mismos bytes
    expect(texto).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Array.from(desdeBase64Url(texto))).toEqual(Array.from(bytes));
  });
});

describe('[RF-001] JWT HS256', () => {
  const clave = utf8('clave-de-prueba');
  const reclamos: ReclamosToken = {
    sub: 'usr-1',
    nombre: 'Docente Prueba',
    rol: 'docente',
    tipo: 'acceso',
    iat: 1_790_000_000,
    exp: 1_790_000_120,
    jti: 'jti-1',
    fam: 'fam-1'
  };

  it('[RF-001] un token firmado se verifica y devuelve los mismos reclamos', () => {
    // Dado un token firmado
    const token = firmarJwt(reclamos, clave);

    // Entonces tiene tres segmentos y su firma es un HMAC-SHA256 estándar
    const [cabecera, cuerpo, firma] = token.split('.');
    expect(token.split('.')).toHaveLength(3);
    expect(firma).toBe(createHmac('sha256', clave).update(`${cabecera}.${cuerpo}`).digest('base64url'));
    expect(verificarFirmaJwt(token, clave)).toEqual(reclamos);
  });

  it('[RF-001] cambiar un reclamo sin volver a firmar invalida el token (escalada de rol)', async () => {
    // Dado el token de un estudiante al que alguien le cambia el rol a mano
    const token = firmarJwt({ ...reclamos, rol: 'estudiante' }, clave);
    const alterado = manipular(token, { rol: 'docente' });

    // Entonces la firma ya no coincide
    expect(await motivoDe(() => verificarFirmaJwt(alterado, clave))).toBe('TOKEN_INVALIDO');
  });

  it('[RF-001] se rechazan: otra clave, cabecera "alg: none", segmentos de menos y basura', async () => {
    const token = firmarJwt(reclamos, clave);
    const [, cuerpo] = token.split('.');
    const sinAlgoritmo = `${base64Url(utf8(JSON.stringify({ alg: 'none', typ: 'JWT' })))}.${cuerpo}.`;

    expect(await motivoDe(() => verificarFirmaJwt(token, utf8('otra-clave')))).toBe('TOKEN_INVALIDO');
    expect(await motivoDe(() => verificarFirmaJwt(sinAlgoritmo, clave))).toBe('TOKEN_INVALIDO');
    expect(await motivoDe(() => verificarFirmaJwt('a.b', clave))).toBe('TOKEN_INVALIDO');
    expect(await motivoDe(() => verificarFirmaJwt('no-es-un-token', clave))).toBe('TOKEN_INVALIDO');
  });
});

describe('[RF-001] ServidorIdentidadSimulado', () => {
  it('[RF-001] credenciales correctas → par de tokens con acceso de 2 min y refresco de 7 días', async () => {
    // Dado el servidor con las cuentas de demostración
    const { reloj, servidor } = montarServidor();

    // Cuando el docente inicia sesión
    const par = await servidor.iniciarSesion('docente', CONTRASENA);

    // Entonces recibe dos tokens distintos con sus caducidades
    const ahora = reloj.ahora().getTime();
    expect(par.tokenAcceso).not.toBe(par.tokenRefresco);
    expect(par.expiraAccesoEn - ahora).toBe(DURACION_ACCESO_S * 1000);
    expect(par.expiraRefrescoEn - ahora).toBe(DURACION_REFRESCO_S * 1000);

    // Y el de acceso identifica al docente
    const reclamos = await servidor.verificarAcceso(par.tokenAcceso);
    expect(reclamos).toMatchObject({ sub: 'usr-docente-1', rol: 'docente', tipo: 'acceso' });
  });

  it('[RF-001] el usuario no distingue mayúsculas y los espacios se ignoran', async () => {
    const { servidor } = montarServidor();
    const par = await servidor.iniciarSesion('  DOCENTE ', CONTRASENA);
    expect((await servidor.verificarAcceso(par.tokenAcceso)).sub).toBe('usr-docente-1');
  });

  it('[RF-001] contraseña errónea y usuario inexistente fallan con el MISMO mensaje', async () => {
    const { servidor } = montarServidor();

    const fallos = await Promise.allSettled([
      servidor.iniciarSesion('docente', 'incorrecta'),
      servidor.iniciarSesion('nadie', CONTRASENA)
    ]);

    // Entonces ambos son CREDENCIALES_INVALIDAS y no revelan qué cuentas existen
    const mensajes = fallos.map((fallo) => {
      expect(fallo.status).toBe('rejected');
      const motivo = (fallo as PromiseRejectedResult).reason as AutenticacionError;
      expect(motivo.motivo).toBe('CREDENCIALES_INVALIDAS');
      return motivo.message;
    });
    expect(mensajes[0]).toBe(mensajes[1]);
  });

  it('[RF-001] el token de acceso caduca a los 120 s exactos', async () => {
    // Dado un par recién emitido
    const { reloj, servidor } = montarServidor();
    const par = await servidor.iniciarSesion('estudiante', CONTRASENA);

    // Cuando pasan 119 s sigue siendo válido
    reloj.avanzarSegundos(DURACION_ACCESO_S - 1);
    await expect(servidor.verificarAcceso(par.tokenAcceso)).resolves.toMatchObject({ rol: 'estudiante' });

    // Y al cumplirse 120 s caduca
    reloj.avanzarSegundos(1);
    expect(await motivoDe(() => servidor.verificarAcceso(par.tokenAcceso))).toBe('TOKEN_EXPIRADO');
  });

  it('[RF-001] un token no sirve para el uso del otro tipo (acceso ↔ refresco)', async () => {
    const { servidor } = montarServidor();
    const par = await servidor.iniciarSesion('docente', CONTRASENA);

    expect(await motivoDe(() => servidor.verificarAcceso(par.tokenRefresco))).toBe('TOKEN_INVALIDO');
    expect(await motivoDe(() => servidor.refrescar(par.tokenAcceso))).toBe('TOKEN_INVALIDO');
  });

  it('[RF-001] refrescar ROTA el par: tokens nuevos, misma familia, y el acceso caducado vuelve a valer', async () => {
    // Dado un acceso ya caducado
    const { reloj, servidor } = montarServidor();
    const original = await servidor.iniciarSesion('docente', CONTRASENA);
    reloj.avanzarSegundos(DURACION_ACCESO_S + 30);

    // Cuando se renueva con el token de refresco
    const renovado = await servidor.refrescar(original.tokenRefresco);

    // Entonces ambos tokens cambian y el nuevo acceso es válido y de la misma familia
    expect(renovado.tokenAcceso).not.toBe(original.tokenAcceso);
    expect(renovado.tokenRefresco).not.toBe(original.tokenRefresco);
    const antes = verificarFirmaJwt(original.tokenRefresco, utf8('yapu-servidor-identidad-simulado:hs256'));
    const despues = await servidor.verificarAcceso(renovado.tokenAcceso);
    expect(despues.fam).toBe(antes.fam);
    expect(despues.sub).toBe('usr-docente-1');
    expect(renovado.expiraAccesoEn).toBe(reloj.ahora().getTime() + DURACION_ACCESO_S * 1000);
  });

  it('[RF-001] reutilizar un refresco ya usado revoca TODA la familia (detección de robo)', async () => {
    // Dado un refresco que ya se usó una vez
    const { servidor } = montarServidor();
    const original = await servidor.iniciarSesion('docente', CONTRASENA);
    const legitimo = await servidor.refrescar(original.tokenRefresco);

    // Cuando alguien vuelve a presentar el refresco viejo
    expect(await motivoDe(() => servidor.refrescar(original.tokenRefresco))).toBe('TOKEN_REUTILIZADO');

    // Entonces tampoco sirve el refresco legítimo más reciente: la familia quedó revocada
    expect(await motivoDe(() => servidor.refrescar(legitimo.tokenRefresco))).toBe('SESION_REVOCADA');
  });

  it('[RF-001] cerrar sesión revoca la familia, pero otra sesión del mismo usuario sigue viva', async () => {
    const { servidor } = montarServidor();
    const movil = await servidor.iniciarSesion('docente', CONTRASENA);
    const escritorio = await servidor.iniciarSesion('docente', CONTRASENA);

    // Cuando se cierra la sesión del móvil
    await servidor.cerrarSesion(movil.tokenRefresco);

    // Entonces el móvil ya no renueva y el escritorio sí
    expect(await motivoDe(() => servidor.refrescar(movil.tokenRefresco))).toBe('SESION_REVOCADA');
    await expect(servidor.refrescar(escritorio.tokenRefresco)).resolves.toHaveProperty('tokenAcceso');
  });

  it('[RF-001] el token de refresco caduca a los 7 días', async () => {
    const { reloj, servidor } = montarServidor();
    const par = await servidor.iniciarSesion('estudiante', CONTRASENA);

    reloj.avanzarSegundos(DURACION_REFRESCO_S);

    expect(await motivoDe(() => servidor.refrescar(par.tokenRefresco))).toBe('TOKEN_EXPIRADO');
  });

  it('[RF-001] las revocaciones sobreviven a recargar la página (se guardan en el almacén)', async () => {
    // Dado un servidor que usó un refresco, y otro creado después sobre el MISMO almacén
    const almacen = new AlmacenMemoria();
    const primero = montarServidor({ almacen }).servidor;
    const par = await primero.iniciarSesion('docente', CONTRASENA);
    await primero.refrescar(par.tokenRefresco);
    const trasRecargar = montarServidor({ almacen }).servidor;

    // Entonces el servidor nuevo también detecta la reutilización
    expect(await motivoDe(() => trasRecargar.refrescar(par.tokenRefresco))).toBe('TOKEN_REUTILIZADO');
  });
});

describe('[RF-001] AlmacenTokensLocal', () => {
  it('[RF-001] guarda, lee y borra el par; un valor corrupto se trata como «sin sesión»', async () => {
    const almacen = new AlmacenMemoria();
    const tokens = new AlmacenTokensLocal(almacen);
    const par = { tokenAcceso: 'a.b.c', tokenRefresco: 'd.e.f', expiraAccesoEn: 1, expiraRefrescoEn: 2 };

    await tokens.guardar(par);
    expect(await tokens.leer()).toEqual(par);

    almacen.setItem(CLAVE_TOKENS, '{"tokenAcceso": 42');
    expect(await tokens.leer()).toBeNull();

    await tokens.guardar(par);
    await tokens.borrar();
    expect(await tokens.leer()).toBeNull();
  });
});
