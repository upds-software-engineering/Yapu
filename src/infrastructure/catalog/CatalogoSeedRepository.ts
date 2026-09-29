import type { CatalogoRepository } from '@application/ports/CatalogoRepository';
import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';

/**
 * WP-I2 / RF-003: catálogo lingüístico de sólo lectura servido desde la semilla validada.
 *
 * Igual que un catálogo persistente, NUNCA entrega referencias a su estado interno: cada llamada
 * reconstruye el agregado con `Nivel.crear` / `Palabra.crear` sobre su propia representación
 * plana (`toJSON`), de modo que quien consuma el repositorio no pueda mutar el corpus compartido.
 */
export class CatalogoSeedRepository implements CatalogoRepository {
  private readonly niveles: readonly Nivel[];
  private readonly palabras: readonly Palabra[];

  constructor(corpus: readonly Nivel[] = [], palabras: readonly Palabra[] = []) {
    this.niveles = corpus.map((nivel) => Nivel.crear(nivel.toJSON()));
    this.palabras = palabras.map((palabra) => Palabra.crear(palabra.toJSON()));
  }

  async listarNiveles(): Promise<Nivel[]> {
    return this.niveles.map((nivel) => Nivel.crear(nivel.toJSON()));
  }

  async listarPalabras(): Promise<Palabra[]> {
    return this.palabras.map((palabra) => Palabra.crear(palabra.toJSON()));
  }

  async obtenerNivel(nivelId: number): Promise<Nivel | null> {
    const encontrado = this.niveles.find((nivel) => nivel.numero === nivelId);
    return encontrado ? Nivel.crear(encontrado.toJSON()) : null;
  }

  async listarPalabrasPorNivel(nivelId: number): Promise<Palabra[]> {
    return this.palabras
      .filter((palabra) => palabra.nivelId.valor === nivelId)
      .map((palabra) => Palabra.crear(palabra.toJSON()));
  }

  async obtenerPalabra(palabraId: string): Promise<Palabra | null> {
    const encontrada = this.palabras.find((palabra) => palabra.id === palabraId);
    return encontrada ? Palabra.crear(encontrada.toJSON()) : null;
  }
}
