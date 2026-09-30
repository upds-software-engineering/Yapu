import type {
  AutenticacionPort,
  GeneradorIdPort,
  ParTokens,
  ReclamosToken,
  RelojPort,
  TipoToken
} from '@application/ports';
import { AutenticacionError } from '@domain/errores';
import type { RolUsuario } from '@domain/shared/tipos';
import { AlmacenMemoria, type Almacen } from '@infrastructure/persistence/local-storage';
import { aHex, sha256, utf8 } from './criptografia';
import { CUENTAS_DEMO, type CuentaDemo } from './cuentasDemo';
import { firmarJwt, verificarFirmaJwt } from './jwt';

/** RF-001: el token de acceso vive 2 minutos (corto a propósito: así se ve la renovación). */
export const DURACION_ACCESO_S = 120;
/** RF-001: el token de refresco vive 7 días. */
export const DURACION_REFRESCO_S = 7 * 24 * 60 * 60;

/** Clave versionada donde el servidor recuerda refrescos usados y familias revocadas. */
export const CLAVE_REVOCACIONES = 'yapu:auth:revocaciones:v1';

/** Tope de identificadores recordados (los más antiguos ya habrían caducado). */
const MAXIMO_USADOS = 500;

/**
 * Clave de firma de DEMOSTRACIÓN. Vive en el cliente porque el servidor también: en una PWA
 * estática no existe un lugar secreto (ADR-003). Un adaptador HTTP real la dejaría en el backend.
 */
const CLAVE_FIRMA_DEMO = 'yapu-servidor-identidad-simulado:hs256';

/** Sal fija de las contraseñas de demostración: se guardan como SHA-256, nunca en claro. */
const SAL_CONTRASENA = 'yapu:sal:v1';

interface Revocaciones {
  refrescosUsados: string[];
  familiasRevocadas: string[];
}

interface CuentaRegistrada {
  id: string;
  usuario: string;
  hashContrasena: string;
  nombre: string;
  rol: RolUsuario;
}

export interface OpcionesServidor {
  reloj: RelojPort;
  generadorId: GeneradorIdPort;
  /** Persistencia de revocaciones (por defecto, memoria). */
  almacen?: Almacen;
  cuentas?: readonly CuentaDemo[];
  duracionAccesoS?: number;
  duracionRefrescoS?: number;
  claveFirma?: string;
}

const hashContrasena = (contrasena: string) => aHex(sha256(utf8(`${SAL_CONTRASENA}:${contrasena}`)));

/**
 * Servidor de identidad SIMULADO que implementa `AutenticacionPort` (RF-001, ADR-003 rev. 2).
 *
 * Reproduce el comportamiento de un servidor OAuth 2.0 con JWT:
 *  - canjea credenciales por un par acceso + refresco firmados con HS256;
 *  - verifica firma, tipo y caducidad de cada token;
 *  - ROTA el refresco en cada renovación (un refresco sólo sirve una vez) y, si alguien presenta
 *    uno ya usado, revoca la familia completa: el ladrón y la víctima pierden la sesión y la
 *    víctima vuelve a iniciar sesión (detección de reutilización, RFC 6819 §5.2.2.3);
 *  - revoca la familia al cerrar sesión.
 *
 * El reloj y el generador de ids se inyectan: las pruebas controlan la caducidad sin esperar.
 */
export class ServidorIdentidadSimulado implements AutenticacionPort {
  private readonly reloj: RelojPort;
  private readonly generadorId: GeneradorIdPort;
  private readonly almacen: Almacen;
  private readonly cuentas: readonly CuentaRegistrada[];
  private readonly duracionAccesoS: number;
  private readonly duracionRefrescoS: number;
  private readonly clave: Uint8Array;

  constructor(opciones: OpcionesServidor) {
    this.reloj = opciones.reloj;
    this.generadorId = opciones.generadorId;
    this.almacen = opciones.almacen ?? new AlmacenMemoria();
    this.cuentas = (opciones.cuentas ?? CUENTAS_DEMO).map((cuenta) => ({
      id: cuenta.id,
      usuario: cuenta.usuario.toLowerCase(),
      hashContrasena: hashContrasena(cuenta.contrasena),
      nombre: cuenta.nombre,
      rol: cuenta.rol
    }));
    this.duracionAccesoS = opciones.duracionAccesoS ?? DURACION_ACCESO_S;
    this.duracionRefrescoS = opciones.duracionRefrescoS ?? DURACION_REFRESCO_S;
    this.clave = utf8(opciones.claveFirma ?? CLAVE_FIRMA_DEMO);
  }

  async iniciarSesion(usuario: string, contrasena: string): Promise<ParTokens> {
    const cuenta = this.cuentas.find((candidata) => candidata.usuario === usuario.trim().toLowerCase());
    // Mismo mensaje para usuario inexistente y contraseña errónea: no se revela qué cuentas existen.
    if (cuenta === undefined || cuenta.hashContrasena !== hashContrasena(contrasena)) {
      throw new AutenticacionError('Usuario o contraseña incorrectos.', 'CREDENCIALES_INVALIDAS');
    }
    return this.emitirPar(cuenta, this.generadorId.generar());
  }

  async verificarAcceso(tokenAcceso: string): Promise<ReclamosToken> {
    return this.verificar(tokenAcceso, 'acceso');
  }

  async refrescar(tokenRefresco: string): Promise<ParTokens> {
    const reclamos = this.verificar(tokenRefresco, 'refresco');
    const revocaciones = this.leerRevocaciones();

    if (revocaciones.familiasRevocadas.includes(reclamos.fam)) {
      throw new AutenticacionError('La sesión fue cerrada. Inicia sesión de nuevo.', 'SESION_REVOCADA');
    }
    if (revocaciones.refrescosUsados.includes(reclamos.jti)) {
      revocaciones.familiasRevocadas.push(reclamos.fam);
      this.guardarRevocaciones(revocaciones);
      throw new AutenticacionError(
        'Se reutilizó un token de refresco: por seguridad se cerró la sesión.',
        'TOKEN_REUTILIZADO'
      );
    }

    revocaciones.refrescosUsados.push(reclamos.jti);
    this.guardarRevocaciones(revocaciones);

    const cuenta: Pick<CuentaRegistrada, 'id' | 'nombre' | 'rol'> = {
      id: reclamos.sub,
      nombre: reclamos.nombre,
      rol: reclamos.rol
    };
    return this.emitirPar(cuenta, reclamos.fam);
  }

  async cerrarSesion(tokenRefresco: string): Promise<void> {
    const reclamos = this.verificar(tokenRefresco, 'refresco', { ignorarCaducidad: true });
    const revocaciones = this.leerRevocaciones();
    if (!revocaciones.familiasRevocadas.includes(reclamos.fam)) {
      revocaciones.familiasRevocadas.push(reclamos.fam);
      this.guardarRevocaciones(revocaciones);
    }
  }

  private emitirPar(cuenta: Pick<CuentaRegistrada, 'id' | 'nombre' | 'rol'>, familia: string): ParTokens {
    const ahoraS = Math.floor(this.reloj.ahora().getTime() / 1000);
    const base = { sub: cuenta.id, nombre: cuenta.nombre, rol: cuenta.rol, iat: ahoraS, fam: familia };

    const expAcceso = ahoraS + this.duracionAccesoS;
    const expRefresco = ahoraS + this.duracionRefrescoS;

    return {
      tokenAcceso: firmarJwt({ ...base, tipo: 'acceso', exp: expAcceso, jti: this.generadorId.generar() }, this.clave),
      tokenRefresco: firmarJwt(
        { ...base, tipo: 'refresco', exp: expRefresco, jti: this.generadorId.generar() },
        this.clave
      ),
      expiraAccesoEn: expAcceso * 1000,
      expiraRefrescoEn: expRefresco * 1000
    };
  }

  private verificar(
    token: string,
    tipo: TipoToken,
    opciones: { ignorarCaducidad?: boolean } = {}
  ): ReclamosToken {
    const reclamos = verificarFirmaJwt(token, this.clave);
    if (reclamos.tipo !== tipo) {
      throw new AutenticacionError(
        `El token no es válido: se esperaba un token de ${tipo}.`,
        'TOKEN_INVALIDO'
      );
    }
    if (opciones.ignorarCaducidad !== true && this.reloj.ahora().getTime() >= reclamos.exp * 1000) {
      throw new AutenticacionError(
        tipo === 'acceso'
          ? 'El token de acceso expiró.'
          : 'Tu sesión expiró. Inicia sesión de nuevo.',
        'TOKEN_EXPIRADO'
      );
    }
    return reclamos;
  }

  private leerRevocaciones(): Revocaciones {
    try {
      const crudo = this.almacen.getItem(CLAVE_REVOCACIONES);
      if (crudo === null) return { refrescosUsados: [], familiasRevocadas: [] };
      const dato = JSON.parse(crudo) as Partial<Revocaciones>;
      return {
        refrescosUsados: Array.isArray(dato.refrescosUsados) ? dato.refrescosUsados.map(String) : [],
        familiasRevocadas: Array.isArray(dato.familiasRevocadas) ? dato.familiasRevocadas.map(String) : []
      };
    } catch {
      return { refrescosUsados: [], familiasRevocadas: [] };
    }
  }

  private guardarRevocaciones(revocaciones: Revocaciones): void {
    const recortadas: Revocaciones = {
      refrescosUsados: revocaciones.refrescosUsados.slice(-MAXIMO_USADOS),
      familiasRevocadas: revocaciones.familiasRevocadas.slice(-MAXIMO_USADOS)
    };
    try {
      this.almacen.setItem(CLAVE_REVOCACIONES, JSON.stringify(recortadas));
    } catch {
      // Almacenamiento lleno o bloqueado: la rotación sigue funcionando mientras dure la página.
    }
  }
}
