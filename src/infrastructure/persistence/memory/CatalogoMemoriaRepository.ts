import type { CatalogoRepository } from '@application/ports';
import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { clonar } from './clonar';

/**
 * Catálogo lingüístico en memoria, útil para tests de casos de uso con vocabulario controlado.
 * Las palabras se guardan como datos y se reconstruyen al devolverlas (mismo contrato que el catálogo real).
 */
export class CatalogoMemoriaRepository implements CatalogoRepository {
  private readonly niveles: Nivel[];
  private readonly palabras: Palabra[];

  constructor(niveles: readonly Nivel[] = [], palabras: readonly Palabra[] = []) {
    this.niveles = niveles.map((nivel) => Nivel.crear(clonar(nivel.toJSON())));
    this.palabras = palabras.map((palabra) => Palabra.crear(clonar(palabra.toJSON())));
  }

  async listarNiveles(): Promise<Nivel[]> {
    return this.niveles.map((nivel) => Nivel.crear(clonar(nivel.toJSON())));
  }

  async listarPalabras(): Promise<Palabra[]> {
    return this.palabras.map((palabra) => Palabra.crear(clonar(palabra.toJSON())));
  }

  async obtenerNivel(nivelId: number): Promise<Nivel | null> {
    const encontrado = this.niveles.find((nivel) => nivel.numero === nivelId);
    return encontrado ? Nivel.crear(clonar(encontrado.toJSON())) : null;
  }

  async listarPalabrasPorNivel(nivelId: number): Promise<Palabra[]> {
    return this.palabras
      .filter((palabra) => palabra.nivelId.valor === nivelId)
      .map((palabra) => Palabra.crear(clonar(palabra.toJSON())));
  }

  async obtenerPalabra(palabraId: string): Promise<Palabra | null> {
    const encontrada = this.palabras.find((palabra) => palabra.id === palabraId);
    return encontrada ? Palabra.crear(clonar(encontrada.toJSON())) : null;
  }
}
