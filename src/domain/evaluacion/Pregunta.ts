import { ValidacionError } from '../errores';
import { mismosTerminos, normalizarTexto } from '../shared/texto';
import { TIPOS_PREGUNTA, type TipoPregunta } from '../shared/tipos';
import { NivelId } from '../value-objects/NivelId';

/**
 * RN-09: una pregunta del motor determinista de evaluación.
 *
 * Invariantes (validadas en `crear`):
 *  - exactamente 4 opciones (la correcta + 3 distractores);
 *  - las 4 opciones son únicas según `normalizarTexto`;
 *  - exactamente una opción equivale a la correcta.
 *
 * La entidad es inmutable: la selección aleatoria y el barajado de opciones los hace
 * `GeneradorEvaluacion`, que es quien conoce la `FuenteAleatoria`.
 */
export interface DatosPregunta {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  opcionCorrecta: string;
  /** Exactamente 4 y ya barajadas por el generador. */
  opciones: readonly string[];
  explicacion: string;
  nivelId: number;
  palabraId: string;
}

/** RN-09: el motor siempre ofrece cuatro alternativas, ni una más ni una menos. */
const OPCIONES_POR_PREGUNTA = 4;

export class Pregunta {
  private constructor(
    readonly id: string,
    readonly tipo: TipoPregunta,
    readonly enunciado: string,
    readonly opcionCorrecta: string,
    readonly opciones: readonly string[],
    readonly explicacion: string,
    readonly nivelId: NivelId,
    readonly palabraId: string
  ) {}

  static crear(datos: DatosPregunta): Pregunta {
    const nivel = NivelId.crear(datos.nivelId);

    if (!TIPOS_PREGUNTA.includes(datos.tipo)) {
      throw new ValidacionError(`El tipo de pregunta "${datos.tipo}" no es válido.`, 'tipo');
    }
    if (!datos.enunciado || datos.enunciado.trim().length === 0) {
      throw new ValidacionError('La pregunta requiere un enunciado.', 'enunciado');
    }
    if (!datos.opcionCorrecta || datos.opcionCorrecta.trim().length === 0) {
      throw new ValidacionError('La pregunta requiere una opción correcta.', 'opcionCorrecta');
    }

    const opciones = [...datos.opciones];
    if (opciones.length !== OPCIONES_POR_PREGUNTA) {
      throw new ValidacionError(
        `La pregunta debe tener exactamente ${OPCIONES_POR_PREGUNTA} opciones (recibidas: ${opciones.length}).`,
        'opciones'
      );
    }
    if (opciones.some((opcion) => !opcion || opcion.trim().length === 0)) {
      throw new ValidacionError('Ninguna opción de la pregunta puede estar vacía.', 'opciones');
    }

    // RN-09: la correcta aparece exactamente una vez. Se comprueba antes de la unicidad global
    // para que un duplicado de la propia respuesta correcta se diagnostique como tal.
    const coincidencias = opciones.filter((opcion) => mismosTerminos(opcion, datos.opcionCorrecta));
    if (coincidencias.length === 0) {
      throw new ValidacionError('La opción correcta debe estar entre las opciones de la pregunta.', 'opciones');
    }
    if (coincidencias.length > 1) {
      throw new ValidacionError('Sólo una opción puede coincidir con la opción correcta.', 'opciones');
    }
    if (new Set(opciones.map(normalizarTexto)).size !== opciones.length) {
      throw new ValidacionError('Las opciones de la pregunta deben ser únicas.', 'opciones');
    }

    return new Pregunta(
      datos.id,
      datos.tipo,
      datos.enunciado.trim(),
      datos.opcionCorrecta.trim(),
      opciones,
      datos.explicacion?.trim() ?? '',
      nivel,
      datos.palabraId
    );
  }

  /** RN-09: compara con `normalizarTexto` (trim + minúsculas es + apóstrofos unificados). */
  esCorrecta(opcion: string): boolean {
    return mismosTerminos(this.opcionCorrecta, opcion);
  }

  toJSON(): DatosPregunta {
    return {
      id: this.id,
      tipo: this.tipo,
      enunciado: this.enunciado,
      opcionCorrecta: this.opcionCorrecta,
      opciones: [...this.opciones],
      explicacion: this.explicacion,
      nivelId: this.nivelId.valor,
      palabraId: this.palabraId
    };
  }
}
