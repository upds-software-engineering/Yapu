/**
 * Autenticación por tokens (RF-001, ADR-003 rev. 2): servidor de identidad simulado con JWT HS256,
 * rotación de tokens de refresco y almacén local del par de tokens.
 */
export {
  ServidorIdentidadSimulado,
  CLAVE_REVOCACIONES,
  DURACION_ACCESO_S,
  DURACION_REFRESCO_S,
  type OpcionesServidor
} from './ServidorIdentidadSimulado';
export { AlmacenTokensLocal, CLAVE_TOKENS } from './AlmacenTokensLocal';
export { CUENTAS_DEMO, type CuentaDemo } from './cuentasDemo';
export { firmarJwt, verificarFirmaJwt, decodificarSinVerificar } from './jwt';
export { sha256, hmacSha256, aHex, base64Url, desdeBase64Url } from './criptografia';
