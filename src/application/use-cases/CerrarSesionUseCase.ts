import type {
  AlmacenTokensPort,
  AutenticacionPort,
  GeneradorIdPort,
  SesionPort
} from '@application/ports';
import { esFalloDeAutenticacion, volverAInvitado } from './sesionAutenticada';

/**
 * RF-001 — cierre de sesión.
 *
 * Revoca en el servidor la FAMILIA del token de refresco (así una copia robada tampoco sirve),
 * borra el par local y deja el perfil como invitado. Si el refresco ya estaba caducado o revocado
 * el cierre continúa igual: el objetivo es terminar sin sesión, no fallar.
 */
export class CerrarSesionUseCase {
  constructor(
    private readonly autenticacion: AutenticacionPort,
    private readonly tokens: AlmacenTokensPort,
    private readonly sesion: SesionPort,
    private readonly generadorId: GeneradorIdPort
  ) {}

  async ejecutar(): Promise<void> {
    const par = await this.tokens.leer();
    if (par !== null) {
      try {
        await this.autenticacion.cerrarSesion(par.tokenRefresco);
      } catch (fallo) {
        if (!esFalloDeAutenticacion(fallo)) throw fallo;
      }
    }
    await this.tokens.borrar();
    await volverAInvitado(this.sesion, this.generadorId);
  }
}
