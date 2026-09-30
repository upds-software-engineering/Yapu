import type { RolUsuario } from '@domain/shared/tipos';

/**
 * RF-001 / RF-002 — autenticación por tokens (ADR-003, revisión 2).
 *
 * El puerto tiene la forma de un servidor de identidad real (OAuth 2.0 / JWT): se canjean
 * credenciales por un PAR de tokens, el de acceso se verifica en cada uso y, cuando caduca, se
 * renueva con el de refresco. Hoy lo implementa `ServidorIdentidadSimulado` dentro del navegador;
 * mañana un adaptador HTTP podría hablar con un backend sin que cambie un solo caso de uso.
 */

/** Tipo de token: el de acceso autoriza operaciones; el de refresco sólo sirve para renovar. */
export type TipoToken = 'acceso' | 'refresco';

/** Reclamos (claims) firmados dentro de cada token. Tiempos en SEGUNDOS desde epoch, como en JWT. */
export interface ReclamosToken {
  /** Identificador del usuario (`sub`). */
  sub: string;
  nombre: string;
  rol: RolUsuario;
  tipo: TipoToken;
  /** Emitido en (`iat`). */
  iat: number;
  /** Expira en (`exp`). */
  exp: number;
  /** Identificador único del token (`jti`): permite detectar la reutilización de un refresco. */
  jti: string;
  /** Familia de la sesión: todos los tokens rotados desde un mismo inicio de sesión la comparten. */
  fam: string;
}

/** Par de tokens entregado al iniciar sesión y en cada renovación. Tiempos en MILISEGUNDOS. */
export interface ParTokens {
  tokenAcceso: string;
  tokenRefresco: string;
  expiraAccesoEn: number;
  expiraRefrescoEn: number;
}

/** Servidor de identidad. Todos los fallos se señalan con `AutenticacionError` (dominio). */
export interface AutenticacionPort {
  /** Canjea credenciales por un par de tokens nuevo (nueva familia). */
  iniciarSesion(usuario: string, contrasena: string): Promise<ParTokens>;
  /** Verifica firma, tipo y caducidad de un token de ACCESO y devuelve sus reclamos. */
  verificarAcceso(tokenAcceso: string): Promise<ReclamosToken>;
  /**
   * Rota el token de refresco: lo marca como usado y emite un par nuevo de la misma familia.
   * Presentar un refresco ya usado revoca la familia entera (detección de reutilización).
   */
  refrescar(tokenRefresco: string): Promise<ParTokens>;
  /** Revoca la familia del token de refresco: ninguno de sus tokens vuelve a renovarse. */
  cerrarSesion(tokenRefresco: string): Promise<void>;
}

/** Dónde guarda el cliente su par de tokens (hoy `localStorage`). */
export interface AlmacenTokensPort {
  leer(): Promise<ParTokens | null>;
  guardar(par: ParTokens): Promise<void>;
  borrar(): Promise<void>;
}
