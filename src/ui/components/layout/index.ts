/**
 * Barrel de los componentes de layout.
 *
 * Las páginas de `src/pages/**` montan la navegación y el banner de conexión desde aquí:
 * `import { BannerConexion, Navegacion } from '@ui/components/layout';`
 *
 * Contrato de selectores que consumen los E2E: `data-nav="escritorio|movil"`,
 * `data-nav-enlace="niveles|progreso|comunidad|docente"`, `aria-current="page"` en el destino
 * activo, `data-sesion` (estado de la sesión autenticada, RF-001) y `data-banner="conexion"` fuera de línea.
 */
export { Navegacion, type PropsNavegacion } from './Navegacion';
export { BannerConexion } from './BannerConexion';
export { LeccionConFiltro, type PropsLeccionConFiltro } from './LeccionConFiltro';
export { SelectorRol, type PropsSelectorRol } from './SelectorRol';
export { PantallaNoEncontrada } from './PantallaNoEncontrada';
