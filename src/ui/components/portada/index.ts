/**
 * Barrel de la portada.
 *
 * `src/pages/index.astro` monta `Portada` y `MapaNiveles` juntos; la portada no incluye ningún
 * CTA primario (Hick), el del nivel actual lo aporta el mapa.
 */
export { Portada, type PropsPortada } from './Portada';
export { TituloParticulas, type PropsTituloParticulas } from './TituloParticulas';
