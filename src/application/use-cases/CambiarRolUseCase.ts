import type { SesionDto } from '@application/dto';
import type { SesionPort } from '@application/ports';
import type { RolUsuario } from '@domain/shared/tipos';

/**
 * RF-001 / RF-002 — SIMULADO (ADR-003): cambio de rol de la sesión local.
 *
 * Permite alternar entre la vista de estudiante y la de docente sin autenticación real. El caso
 * de uso no guarda estado propio: delega el cambio en el puerto y devuelve el DTO actualizado,
 * de modo que el rol persiste donde la implementación del puerto lo decida.
 */
export class CambiarRolUseCase {
  constructor(private readonly sesion: SesionPort) {}

  async ejecutar(entrada: { rol: RolUsuario }): Promise<SesionDto> {
    const { usuarioId, rol, nombre } = await this.sesion.cambiarRol(entrada.rol);
    return { usuarioId, rol, nombre, esDocente: rol === 'docente' };
  }
}
