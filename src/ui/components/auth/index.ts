/**
 * Autenticación (RF-001): pantalla de inicio de sesión y estado de la sesión en la cabecera.
 *
 * Contrato de selectores: `data-pantalla="login"`, `data-formulario="login"`,
 * `data-cuenta-demo`, `data-sesion="invitado|estudiante|docente"`, `data-accion="entrar|salir|
 * renovar-token|cerrar-sesion"` y `data-vence-acceso`.
 */
export { PantallaLogin, CUENTAS_VISIBLES } from './PantallaLogin';
export { EstadoSesion, type PropsEstadoSesion } from './EstadoSesion';
export { useCuentaAtras, formatearDuracion } from './useCuentaAtras';
