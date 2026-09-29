import type { Nivel } from '@domain/aprendizaje/Nivel';
import type { Palabra } from '@domain/aprendizaje/Palabra';

/**
 * Acceso de solo lectura al corpus lingüístico (niveles y vocabulario).
 * La implementación de producción sirve el seed validado con Zod (WP-I2);
 * en tests se usa un catálogo en memoria.
 */
export interface CatalogoRepository {
  listarNiveles(): Promise<Nivel[]>;
  listarPalabras(): Promise<Palabra[]>;
  obtenerNivel(nivelId: number): Promise<Nivel | null>;
  listarPalabrasPorNivel(nivelId: number): Promise<Palabra[]>;
  obtenerPalabra(palabraId: string): Promise<Palabra | null>;
}
