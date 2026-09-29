import type { SesionDto } from '@application/dto';
import type { SesionPort } from '@application/ports';

/**
 * RF-001 / RF-002 — SIMULADO (ADR-003): sesión actual de la aplicación.
 *
 * La autenticación real con Firebase queda fuera de esta iteración. La interfaz sólo necesita
 * saber quién es la persona usuaria y con qué rol, así que el caso de uso proyecta la sesión del
 * puerto a un DTO plano y añade el atajo `esDocente` que usan los guards de la UI.
 */
export class ObtenerSesionUseCase {
  constructor(private readonly sesion: SesionPort) {}

  async ejecutar(): Promise<SesionDto> {
    const { usuarioId, rol, nombre } = await this.sesion.obtener();
    return { usuarioId, rol, nombre, esDocente: rol === 'docente' };
  }
}
