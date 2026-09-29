/**
 * Barrel de los componentes de layout.
 *
 * Las páginas de `src/pages/**` montan la navegación y el banner de conexión desde aquí:
 * `import { BannerConexion, Navegacion } from '@ui/components/layout';`
 *
 * Contrato de selectores que consumen los E2E: `data-nav="escritorio|movil"`,
 * `data-nav-enlace="niveles|progreso|comunidad|docente"`, `aria-current="page"` en el destino
 * activo, `data-selector-rol` con `data-rol` y `data-banner="conexion"` fuera de línea.
 */
export { Navegacion, type PropsNavegacion } from './Navegacion';
export { SelectorRol, type PropsSelectorRol, type RolSesion } from './SelectorRol';
export { BannerConexion } from './BannerConexion';
export { LeccionConFiltro, type PropsLeccionConFiltro } from './LeccionConFiltro';
