import type { SesionAutenticadaDto } from '@application/dto';
import type { AlmacenTokensPort, AutenticacionPort, SesionPort } from '@application/ports';
import { ValidacionError } from '@domain/errores';
import { aSesionAutenticadaDto } from './sesionAutenticada';

export interface CredencialesInicio {
  usuario: string;
  contrasena: string;
}

/**
 * RF-001 — inicio de sesión con credenciales.
 *
 * 1. Valida que haya usuario y contraseña (sin viajar al servidor con datos vacíos).
 * 2. Canjea las credenciales por un par de tokens (`AutenticacionPort`).
 * 3. VERIFICA el token de acceso recibido antes de confiar en él (firma + caducidad) y sólo
 *    entonces lo guarda: un servidor comprometido no puede colar un token sin firma válida.
 * 4. Sincroniza el perfil local (`SesionPort`) con la identidad del token, de modo que el resto de
 *    casos de uso (progreso, retos, corpus) trabajen ya con el usuario y el rol autenticados.
 */
export class IniciarSesionUseCase {
  constructor(
    private readonly autenticacion: AutenticacionPort,
    private readonly tokens: AlmacenTokensPort,
    private readonly sesion: SesionPort
  ) {}

  async ejecutar(credenciales: CredencialesInicio): Promise<SesionAutenticadaDto> {
    const usuario = credenciales.usuario.trim();
    const contrasena = credenciales.contrasena;
    if (usuario.length === 0 || contrasena.length === 0) {
      throw new ValidacionError('Escribe tu usuario y tu contraseña.', usuario.length === 0 ? 'usuario' : 'contrasena');
    }

    const par = await this.autenticacion.iniciarSesion(usuario, contrasena);
    const reclamos = await this.autenticacion.verificarAcceso(par.tokenAcceso);

    await this.tokens.guardar(par);
    await this.sesion.establecerUsuario(reclamos.sub, reclamos.nombre);
    await this.sesion.cambiarRol(reclamos.rol);

    return aSesionAutenticadaDto(reclamos, par, false);
  }
}
