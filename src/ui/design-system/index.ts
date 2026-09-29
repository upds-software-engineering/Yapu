/**
 * Barrel del design system de YAPU.
 *
 * La UI por feature (`src/ui/components/**`) importa los primitivos desde aquí:
 * `import { Boton, Tarjeta, BarraProgreso } from '@ui/design-system';`
 */
export { Boton, type PropsBoton, type VarianteBoton, type TamanoBoton } from './Boton';
export { Tarjeta, type PropsTarjeta } from './Tarjeta';
export { Insignia, type PropsInsignia, type TonoInsignia } from './Insignia';
export { BarraProgreso, type PropsBarraProgreso } from './BarraProgreso';
export { Tabs, type PropsTabs, type Pestana } from './Tabs';
export {
  EstadoCarga,
  MensajeError,
  EstadoVacio,
  type PropsEstadoCarga,
  type PropsMensajeError,
  type PropsEstadoVacio
} from './EstadoCarga';
export { PlaceholderCategoria, type PropsPlaceholderCategoria } from './PlaceholderCategoria';
export { EnvoltorioCtaFijo, type PropsEnvoltorioCtaFijo } from './EnvoltorioCtaFijo';
