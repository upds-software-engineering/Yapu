import type { RolUsuario } from '@domain/shared/tipos';

/**
 * Cuentas de DEMOSTRACIÓN del servidor de identidad simulado (ADR-003).
 *
 * No son credenciales reales de ningún servicio: existen para poder presentar el flujo de inicio
 * de sesión con token y refresco sin backend. La pantalla de inicio de sesión las muestra tal
 * cual. Hay dos docentes porque RN-13 exige dos aprobaciones distintas para publicar un reto.
 */
export interface CuentaDemo {
  id: string;
  usuario: string;
  contrasena: string;
  nombre: string;
  rol: RolUsuario;
}

export const CUENTAS_DEMO: readonly CuentaDemo[] = [
  { id: 'usr-docente-1', usuario: 'docente', contrasena: 'yapu2026', nombre: 'Docente Mamani', rol: 'docente' },
  { id: 'usr-docente-2', usuario: 'docente2', contrasena: 'yapu2026', nombre: 'Docente Quispe', rol: 'docente' },
  { id: 'usr-estudiante-1', usuario: 'estudiante', contrasena: 'yapu2026', nombre: 'Estudiante Condori', rol: 'estudiante' }
];
