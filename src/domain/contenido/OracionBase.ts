import type { Palabra } from '../aprendizaje/Palabra';
import { ValidacionError } from '../errores';
import type { CategoriaGramatical, EstadoModeracion } from '../shared/tipos';
import { FechaDia } from '../value-objects/FechaDia';
import { NivelId } from '../value-objects/NivelId';

/**
 * RF-006: oración base en runasimi que alimenta al generador de preguntas cloze.
 *
 * RN-11: la oración DEBE contener la palabra clave (al inicio de palabra, admitiendo sufijos
 * quechuas). Si no la contiene es inválida y se rechaza en `crear`.
 * RN-12: la palabra clave es obligatoria y debe ser del MISMO nivel que la oración.
 */
export interface DatosOracion {
  id: string;
  nivelId: number;
  textoQuechua: string;
  traduccionEspanol: string;
  palabraClaveId: string;
  categoria: CategoriaGramatical;
  contextoCultural?: string;
  autorId: string;
  estado: EstadoModeracion;
  fechaCreacion: string;
}

export class OracionBase {
  private constructor(
    readonly id: string,
    readonly nivelId: NivelId,
    readonly textoQuechua: string,
    readonly traduccionEspanol: string,
    readonly palabraClaveId: string,
    readonly categoria: CategoriaGramatical,
    readonly contextoCultural: string,
    readonly autorId: string,
    readonly estado: EstadoModeracion,
    readonly fechaCreacion: FechaDia
  ) {}

  /**
   * Alta validada (RN-11 + RN-12). `crear` es el único camino para incorporar una oración nueva.
   */
  static crear(datos: DatosOracion, palabraClave: Palabra): OracionBase {
    const nivel = NivelId.crear(datos.nivelId);
    if (!datos.textoQuechua?.trim()) {
      throw new ValidacionError('La oración no puede estar vacía.', 'textoQuechua');
    }
    if (!datos.traduccionEspanol?.trim()) {
      throw new ValidacionError('La oración requiere traducción al español.', 'traduccionEspanol');
    }
    if (!palabraClave) {
      throw new ValidacionError('La palabra clave es obligatoria (RN-12).', 'palabraClaveId');
    }
    if (!palabraClave.esDelNivel(nivel)) {
      throw new ValidacionError(
        `La palabra clave "${palabraClave.terminoTexto}" pertenece al nivel ${palabraClave.nivelId.valor} y no al nivel ${nivel.valor} (RN-12).`,
        'palabraClaveId'
      );
    }
    if (!palabraClave.termino.estaContenidoEn(datos.textoQuechua)) {
      throw new ValidacionError(
        `La oración no contiene la palabra clave "${palabraClave.terminoTexto}" (RN-11).`,
        'textoQuechua'
      );
    }
    return new OracionBase(
      datos.id,
      nivel,
      datos.textoQuechua.trim(),
      datos.traduccionEspanol.trim(),
      palabraClave.id,
      datos.categoria,
      datos.contextoCultural?.trim() ?? '',
      datos.autorId,
      datos.estado,
      FechaDia.desdeIso(datos.fechaCreacion)
    );
  }

  /**
   * Rehidratación desde persistencia o desde el corpus sembrado: no revalida contenido,
   * porque el generador vuelve a verificar RN-11 antes de usar la oración.
   */
  static reconstruir(datos: DatosOracion): OracionBase {
    return new OracionBase(
      datos.id,
      NivelId.crear(datos.nivelId),
      datos.textoQuechua.trim(),
      datos.traduccionEspanol.trim(),
      datos.palabraClaveId,
      datos.categoria,
      datos.contextoCultural?.trim() ?? '',
      datos.autorId,
      datos.estado,
      FechaDia.desdeIso(datos.fechaCreacion)
    );
  }

  /** RN-11: validación consultiva usada por el generador para descartar oraciones inválidas. */
  contienePalabraClave(palabraClave: Palabra | undefined): boolean {
    if (!palabraClave) return false;
    return palabraClave.termino.estaContenidoEn(this.textoQuechua);
  }

  esAprobada(): boolean {
    return this.estado === 'aprobado';
  }

  esDelNivel(nivel: NivelId): boolean {
    return this.nivelId.igualA(nivel);
  }

  /** Enunciado cloze con el hueco ya insertado (RN-11 usa el mismo criterio de coincidencia). */
  textoConHueco(palabraClave: Palabra): string {
    const termino = palabraClave.terminoTexto;
    const escapado = termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const apostrofos = "[\\u2018\\u2019\\u02BC`´']";
    const patron = new RegExp(escapado.replace(/'/g, apostrofos), 'iu');
    return this.textoQuechua.replace(patron, '_______');
  }

  toJSON(): DatosOracion {
    return {
      id: this.id,
      nivelId: this.nivelId.valor,
      textoQuechua: this.textoQuechua,
      traduccionEspanol: this.traduccionEspanol,
      palabraClaveId: this.palabraClaveId,
      categoria: this.categoria,
      contextoCultural: this.contextoCultural,
      autorId: this.autorId,
      estado: this.estado,
      fechaCreacion: this.fechaCreacion.toJSON()
    };
  }
}
