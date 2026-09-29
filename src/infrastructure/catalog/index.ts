/**
 * WP-I2: adaptadores de infraestructura del catálogo lingüístico (semilla validada con Zod).
 */
export { CatalogoSeedRepository } from './CatalogoSeedRepository';
export { cargarSemilla, crearCatalogoSemilla, crearOracionesSemilla } from './cargarSemilla';
export type { SemillaCargada } from './cargarSemilla';
export { esquemaCorpus, esquemaNivelCrudo, esquemaOracionCruda, esquemaPalabraCruda } from './esquemas';
export type { CorpusCrudo, NivelCrudo, OracionCruda, PalabraCruda } from './esquemas';
export { FECHA_SIEMBRA_CORPUS, SEMILLA_CRUDA } from './semilla/datos-semilla';
