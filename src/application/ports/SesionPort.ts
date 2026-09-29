import type { RolUsuario } from '@domain/shared/tipos';

/**
 * RF-001 / RF-002 — SIMULADO.
 *
 * Decisión de diseño (ADR-003): la autenticación real con Firebase queda fuera del alcance de
 * esta iteración. Este puerto abstrae la sesión para que el día que exista un `SesionFirebaseAdapter`
 * la UI no cambie una sola línea.
 */
export interface SesionActual {
  usuarioId: string;
  rol: RolUsuario;
  nombre: string;
}

export interface SesionPort {
  obtener(): Promise<SesionActual>;
  cambiarRol(rol: RolUsuario): Promise<SesionActual>;
  establecerUsuario(usuarioId: string, nombre?: string): Promise<SesionActual>;
}
