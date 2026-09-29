import { ValidacionError } from '../errores';
import { normalizarTexto } from '../shared/texto';
import type { CategoriaGramatical } from '../shared/tipos';
import { NivelId } from '../value-objects/NivelId';
import { TerminoQuechua } from '../value-objects/TerminoQuechua';

/**
 * A4: entidad de dominio con comportamiento (no un registro anémico con nombres de columna SQL).
 * El mapeo a/desde la forma persistida vive en `infrastructure/persistence/**`.
 */
export interface DatosPalabra {
  id: string;
  nivelId: number;
  termino: string;
  traduccion: string;
  pronunciacion: string;
  categoria: CategoriaGramatical;
  /** RF-004: imagen opcional. Si falta, la UI pinta un placeholder SVG por categoría. */
  imagenUrl?: string;
  contextoCultural: string;
  ejemploUso?: string;
}

export class Palabra {
  private constructor(
    readonly id: string,
    readonly nivelId: NivelId,
    readonly termino: TerminoQuechua,
    readonly traduccion: string,
    readonly pronunciacion: string,
    readonly categoria: CategoriaGramatical,
    readonly contextoCultural: string,
    readonly imagenUrl?: string,
    readonly ejemploUso?: string
  ) {}

  static crear(datos: DatosPalabra): Palabra {
    if (!datos.id || datos.id.trim().length === 0) {
      throw new ValidacionError('La palabra requiere un identificador.', 'id');
    }
    if (!datos.traduccion || datos.traduccion.trim().length === 0) {
      throw new ValidacionError(`La palabra "${datos.termino}" no tiene traducción al español.`, 'traduccion');
    }
    return new Palabra(
      datos.id,
      NivelId.crear(datos.nivelId),
      TerminoQuechua.crear(datos.termino),
      datos.traduccion.trim(),
      datos.pronunciacion?.trim() ?? '',
      datos.categoria,
      datos.contextoCultural?.trim() ?? '',
      datos.imagenUrl,
      datos.ejemploUso
    );
  }

  get terminoTexto(): string {
    return this.termino.valor;
  }

  get traduccionNormalizada(): string {
    return normalizarTexto(this.traduccion);
  }

  get tieneImagen(): boolean {
    return typeof this.imagenUrl === 'string' && this.imagenUrl.length > 0;
  }

  esDelNivel(nivel: NivelId): boolean {
    return this.nivelId.igualA(nivel);
  }

  /** RN-09: dos palabras son la misma opción si sus términos coinciden normalizados. */
  comparteTerminoCon(otra: Palabra): boolean {
    return this.termino.igualA(otra.termino);
  }

  toJSON(): DatosPalabra {
    return {
      id: this.id,
      nivelId: this.nivelId.valor,
      termino: this.termino.valor,
      traduccion: this.traduccion,
      pronunciacion: this.pronunciacion,
      categoria: this.categoria,
      imagenUrl: this.imagenUrl,
      contextoCultural: this.contextoCultural,
      ejemploUso: this.ejemploUso
    };
  }
}
