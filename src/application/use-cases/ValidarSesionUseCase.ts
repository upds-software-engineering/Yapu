import type { SesionAutenticadaDto } from '@application/dto';
import type {
  AlmacenTokensPort,
  AutenticacionPort,
  GeneradorIdPort,
  RelojPort,
  SesionPort
} from '@application/ports';
import { aSesionAutenticadaDto, esFalloDeAutenticacion, volverAInvitado } from './sesionAutenticada';

/**
 * Margen de renovación anticipada: si al token de acceso le quedan menos de 15 s se renueva ya,
 * para que ninguna operación arranque con un token a punto de caducar.
 */
export const MARGEN_RENOVACION_MS = 15_000;

export interface OpcionesValidacion {
  /** Renueva el par aunque el token de acceso siga vigente (botón «Renovar ahora», pruebas). */
  forzarRefresco?: boolean;
}

/**
 * RF-001 — valida la sesión autenticada y renueva el token cuando hace falta.
 *
 * - Sin tokens guardados → `null` (invitado): el estudiante puede seguir estudiando sin cuenta.
 * - Token de acceso vigente y con firma válida → la sesión, sin tocar nada.
 * - Token de acceso caducado (o dentro del margen) → se ROTA con el de refresco: se guarda el par
 *   nuevo y se devuelve la sesión con `refrescado: true`.
 * - Token manipulado, refresco caducado, reutilizado o revocado → se descartan los tokens, el perfil
 *   vuelve a invitado (sin privilegios de docente) y se devuelve `null`.
 *
 * Cualquier fallo que NO sea de autenticación (por ejemplo, almacenamiento roto) se propaga.
 */
export class ValidarSesionUseCase {
  constructor(
    private readonly autenticacion: AutenticacionPort,
    private readonly tokens: AlmacenTokensPort,
    private readonly sesion: SesionPort,
    private readonly reloj: RelojPort,
    private readonly generadorId: GeneradorIdPort
  ) {}

  async ejecutar(opciones: OpcionesValidacion = {}): Promise<SesionAutenticadaDto | null> {
    const par = await this.tokens.leer();
    if (par === null) return null;

    const restanteMs = par.expiraAccesoEn - this.reloj.ahora().getTime();
    const renovarYa = opciones.forzarRefresco === true || restanteMs <= MARGEN_RENOVACION_MS;

    if (!renovarYa) {
      try {
        const reclamos = await this.autenticacion.verificarAcceso(par.tokenAcceso);
        return aSesionAutenticadaDto(reclamos, par, false);
      } catch (fallo) {
        if (!esFalloDeAutenticacion(fallo)) throw fallo;
        // Sólo la caducidad se arregla renovando; una firma manipulada invalida la sesión.
        if (fallo.motivo !== 'TOKEN_EXPIRADO') return this.descartar();
      }
    }

    try {
      const nuevo = await this.autenticacion.refrescar(par.tokenRefresco);
      const reclamos = await this.autenticacion.verificarAcceso(nuevo.tokenAcceso);
      await this.tokens.guardar(nuevo);
      return aSesionAutenticadaDto(reclamos, nuevo, true);
    } catch (fallo) {
      if (!esFalloDeAutenticacion(fallo)) throw fallo;
      return this.descartar();
    }
  }

  private async descartar(): Promise<null> {
    await this.tokens.borrar();
    await volverAInvitado(this.sesion, this.generadorId);
    return null;
  }
}
