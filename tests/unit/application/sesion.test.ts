import { describe, expect, it } from 'vitest';
import type { SesionActual, SesionPort } from '@application/ports';
import { CambiarRolUseCase } from '@application/use-cases/CambiarRolUseCase';
import { ObtenerSesionUseCase } from '@application/use-cases/ObtenerSesionUseCase';
import type { RolUsuario } from '@domain/shared/tipos';

/**
 * [RF-001] [RF-002] Sesión simulada (ADR-003): la autenticación real queda fuera de esta
 * iteración, así que los casos de uso se prueban contra un puerto de sesión falso y configurable
 * que conserva el rol igual que lo haría el adaptador de producción.
 */

const ESTUDIANTE = 'estudiante-1';
const DOCENTE = 'docente-1';

/** [RF-001] Sesión simulada configurable: `cambiarRol` muta el rol que devuelve el puerto. */
function sesionFalsa(
  opciones: { rol?: RolUsuario; usuarioId?: string; nombre?: string } = {}
): SesionPort {
  let actual: SesionActual = {
    usuarioId: opciones.usuarioId ?? ESTUDIANTE,
    rol: opciones.rol ?? 'estudiante',
    nombre: opciones.nombre ?? 'Sumaq Quispe'
  };

  return {
    obtener: async () => ({ ...actual }),
    cambiarRol: async (rol: RolUsuario) => {
      actual = { ...actual, rol };
      return { ...actual };
    },
    establecerUsuario: async (usuarioId: string, nombre?: string) => {
      actual = { usuarioId, rol: actual.rol, nombre: nombre ?? actual.nombre };
      return { ...actual };
    }
  };
}

describe('[RF-001] Sesión simulada', () => {
  describe('ObtenerSesionUseCase', () => {
    it('[RF-001] la sesión simulada arranca en el rol por defecto del puerto', async () => {
      // Dado un puerto de sesión sin configuración explícita
      const caso = new ObtenerSesionUseCase(sesionFalsa());

      // Cuando se consulta la sesión actual
      const dto = await caso.ejecutar();

      // Entonces el DTO describe al estudiante con su nombre
      expect(dto.usuarioId).toBe(ESTUDIANTE);
      expect(dto.rol).toBe('estudiante');
      expect(dto.nombre).toBe('Sumaq Quispe');
    });

    it('[RF-001] el rol de estudiante no se marca como docente', async () => {
      // Dado un puerto de sesión con rol estudiante
      const caso = new ObtenerSesionUseCase(sesionFalsa({ rol: 'estudiante' }));

      // Cuando se consulta la sesión actual
      const dto = await caso.ejecutar();

      // Entonces `esDocente` es falso
      expect(dto.esDocente).toBe(false);
    });

    it('[RF-001] el rol docente se marca como docente', async () => {
      // Dado un puerto de sesión con rol docente
      const caso = new ObtenerSesionUseCase(
        sesionFalsa({ rol: 'docente', usuarioId: DOCENTE, nombre: 'Yachaq' })
      );

      // Cuando se consulta la sesión actual
      const dto = await caso.ejecutar();

      // Entonces `esDocente` es verdadero
      expect(dto.rol).toBe('docente');
      expect(dto.esDocente).toBe(true);
      expect(dto.usuarioId).toBe(DOCENTE);
    });
  });

  describe('CambiarRolUseCase', () => {
    it('[RF-002] el cambio de rol devuelve el DTO ya actualizado', async () => {
      // Dado un estudiante que cambia a la vista de docente
      const caso = new CambiarRolUseCase(sesionFalsa({ rol: 'estudiante' }));

      // Cuando cambia su rol a docente
      const dto = await caso.ejecutar({ rol: 'docente' });

      // Entonces el DTO refleja el nuevo rol
      expect(dto.rol).toBe('docente');
      expect(dto.esDocente).toBe(true);
    });

    it('[RF-002] el cambio de rol conserva el usuario y el nombre', async () => {
      // Dado un estudiante identificado
      const caso = new CambiarRolUseCase(
        sesionFalsa({ rol: 'estudiante', usuarioId: ESTUDIANTE, nombre: 'Sumaq Quispe' })
      );

      // Cuando cambia de rol
      const dto = await caso.ejecutar({ rol: 'docente' });

      // Entonces sigue siendo la misma persona usuaria
      expect(dto.usuarioId).toBe(ESTUDIANTE);
      expect(dto.nombre).toBe('Sumaq Quispe');
    });

    it('[RF-002] el rol persiste a través del puerto de sesión', async () => {
      // Dado un puerto de sesión compartido entre dos consultas
      const sesion = sesionFalsa({ rol: 'estudiante' });
      await new CambiarRolUseCase(sesion).ejecutar({ rol: 'docente' });

      // Cuando otra parte de la aplicación vuelve a consultar la sesión
      const dto = await new ObtenerSesionUseCase(sesion).ejecutar();

      // Entonces el rol docente se mantiene
      expect(dto.rol).toBe('docente');
      expect(dto.esDocente).toBe(true);
    });

    it('[RF-002] se puede volver al rol de estudiante', async () => {
      // Dado un docente en una sesión simulada
      const caso = new CambiarRolUseCase(sesionFalsa({ rol: 'docente', usuarioId: DOCENTE }));
      await caso.ejecutar({ rol: 'docente' });

      // Cuando vuelve al rol de estudiante
      const dto = await caso.ejecutar({ rol: 'estudiante' });

      // Entonces el DTO deja de marcar la sesión como docente
      expect(dto.rol).toBe('estudiante');
      expect(dto.esDocente).toBe(false);
    });
  });
});
