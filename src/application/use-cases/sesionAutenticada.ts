import type { SesionAutenticadaDto } from '@application/dto';
import type { GeneradorIdPort, ParTokens, ReclamosToken, SesionPort } from '@application/ports';
import { AutenticacionError } from '@domain/errores';

/** Nombre del perfil anónimo con el que se sigue estudiando tras cerrar sesión (ADR-003). */
export const NOMBRE_INVITADO = 'Estudiante YAPU';

/** Proyecta los reclamos verificados y el par vigente al DTO que consume la UI. */
export function aSesionAutenticadaDto(
  reclamos: ReclamosToken,
  par: ParTokens,
  refrescado: boolean
): SesionAutenticadaDto {
  return {
    usuarioId: reclamos.sub,
    nombre: reclamos.nombre,
    rol: reclamos.rol,
    esDocente: reclamos.rol === 'docente',
    expiraAccesoEn: par.expiraAccesoEn,
    expiraRefrescoEn: par.expiraRefrescoEn,
    refrescado
  };
}

/** ¿El fallo es de autenticación (y no, por ejemplo, un almacenamiento roto)? */
export function esFalloDeAutenticacion(fallo: unknown): fallo is AutenticacionError {
  return fallo instanceof AutenticacionError;
}

/**
 * Sin token válido no hay privilegios: el perfil local vuelve a ser un estudiante invitado con un
 * identificador nuevo (el progreso del usuario autenticado queda guardado bajo su propio id).
 */
export async function volverAInvitado(sesion: SesionPort, generadorId: GeneradorIdPort): Promise<void> {
  await sesion.establecerUsuario(generadorId.generar(), NOMBRE_INVITADO);
  await sesion.cambiarRol('estudiante');
}
