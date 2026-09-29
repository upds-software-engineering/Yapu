import type { DetallePregunta, PalabraVocabulario } from '../../../types/domain.ts';
import { TerminoQuechuaVO } from '../value-objects/TerminoQuechuaVO.ts';

function barajar<T>(array: T[]): T[] {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export class PreguntaQuizFactory {
  /**
   * Crea una pregunta léxica de Quechua a Español garantizando 4 opciones homogéneas.
   */
  public static crearTraduccionQuechua(
    idPregunta: string,
    palabra: PalabraVocabulario,
    distractores: string[]
  ): DetallePregunta {
    TerminoQuechuaVO.desde(palabra.termino_quechua);

    if (distractores.length < 3) {
      throw new Error('Se requieren al menos 3 distractores para generar la pregunta.');
    }

    const opciones = barajar([palabra.traduccion_espanol, distractores[0], distractores[1], distractores[2]]);

    return {
      id_pregunta: idPregunta,
      enunciado_pregunta: `¿Cual es el significado del termino quechua "${palabra.termino_quechua}"?`,
      tipo_pregunta: 'traduccion_quechua',
      opcion_correcta: palabra.traduccion_espanol,
      distractor_1: distractores[0],
      distractor_2: distractores[1],
      distractor_3: distractores[2],
      opciones_mezcladas: opciones,
      explicacion_pedagogica: `${palabra.termino_quechua} (${palabra.pronunciacion_aproximada}): ${palabra.contexto_cultural}`
    };
  }

  /**
   * Crea una pregunta tipo Cloze (completar espacio en blanco en una oración).
   */
  public static crearCloze(
    idPregunta: string,
    oracionQuechua: string,
    palabraClave: string,
    traduccionEspanol: string,
    distractores: string[],
    contextoCultural: string
  ): DetallePregunta {
    TerminoQuechuaVO.desde(palabraClave);

    const regex = new RegExp(palabraClave, 'i');
    const enunciado = oracionQuechua.replace(regex, '_______');
    const opciones = barajar([palabraClave, distractores[0], distractores[1], distractores[2]]);

    return {
      id_pregunta: idPregunta,
      enunciado_pregunta: `Completa la oracion en quechua:\n"${enunciado}"\n(Traduccion: ${traduccionEspanol})`,
      tipo_pregunta: 'completar_espacio',
      opcion_correcta: palabraClave,
      distractor_1: distractores[0],
      distractor_2: distractores[1],
      distractor_3: distractores[2],
      opciones_mezcladas: opciones,
      explicacion_pedagogica: `Contexto cultural: ${contextoCultural}`
    };
  }
}
