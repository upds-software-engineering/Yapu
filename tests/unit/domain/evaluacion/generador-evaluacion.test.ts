import { describe, expect, it } from 'vitest';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { OracionBase, type DatosOracion } from '@domain/contenido/OracionBase';
import { ContenidoInsuficienteError } from '@domain/errores';
import { GeneradorEvaluacion } from '@domain/evaluacion';
import { normalizarTexto } from '@domain/shared/texto';
import type { CategoriaGramatical, EstadoModeracion } from '@domain/shared/tipos';
import { NivelId } from '@domain/value-objects/NivelId';
import { unAleatorioFijo, unGeneradorId } from '../../../helpers';

/**
 * RN-09 / RN-10 / RN-11: motor determinista de evaluación.
 * Todas las pruebas son puras: vocabulario en memoria, `AleatorioFijo` y `GeneradorIdSecuencial`.
 */

const NIVEL_UNO = NivelId.crear(1);

function palabra(datos: {
  id: string;
  termino: string;
  traduccion: string;
  nivel?: number;
  categoria?: CategoriaGramatical;
  pronunciacion?: string;
  contextoCultural?: string;
  ejemploUso?: string;
}): Palabra {
  return Palabra.crear({
    id: datos.id,
    nivelId: datos.nivel ?? 1,
    termino: datos.termino,
    traduccion: datos.traduccion,
    pronunciacion: datos.pronunciacion ?? `${datos.termino}`,
    categoria: datos.categoria ?? 'sustantivo',
    contextoCultural: datos.contextoCultural ?? `Contexto de ${datos.termino}`,
    ejemploUso: datos.ejemploUso
  });
}

/**
 * Construye una oración rehidratada (como si viniera del corpus persistido), de modo que el test
 * pueda sembrar oraciones inválidas y comprobar que el generador las ignora (RN-11).
 */
function oracion(datos: {
  id: string;
  palabraClave: Palabra;
  textoQuechua: string;
  traduccionEspanol?: string;
  estado?: EstadoModeracion;
  contextoCultural?: string;
}): OracionBase {
  const datosOracion: DatosOracion = {
    id: datos.id,
    nivelId: datos.palabraClave.nivelId.valor,
    textoQuechua: datos.textoQuechua,
    traduccionEspanol: datos.traduccionEspanol ?? 'Traducción de prueba.',
    palabraClaveId: datos.palabraClave.id,
    categoria: datos.palabraClave.categoria,
    contextoCultural: datos.contextoCultural ?? '',
    autorId: 'docente-1',
    estado: datos.estado ?? 'aprobado',
    fechaCreacion: '2026-03-15'
  };
  return OracionBase.reconstruir(datosOracion);
}

function generador(
  palabras: readonly Palabra[],
  oraciones: readonly OracionBase[] = [],
  semilla = 20260315
): GeneradorEvaluacion {
  return new GeneradorEvaluacion(palabras, oraciones, unAleatorioFijo(semilla), unGeneradorId('pregunta'));
}

/** Seis palabras del nivel 1 con términos y traducciones únicos: permiten 12 candidatas. */
function vocabularioAbundante(): Palabra[] {
  return [
    palabra({ id: 'p-inti', termino: 'inti', traduccion: 'sol' }),
    palabra({ id: 'p-nina', termino: 'nina', traduccion: 'fuego' }),
    palabra({ id: 'p-yaku', termino: 'yaku', traduccion: 'agua' }),
    palabra({ id: 'p-urqu', termino: 'urqu', traduccion: 'cerro' }),
    palabra({ id: 'p-mayu', termino: 'mayu', traduccion: 'río' }),
    palabra({ id: 'p-qucha', termino: 'qucha', traduccion: 'lago' })
  ];
}

/** Tres palabras del nivel 1: ninguna candidata puede reunir tres distractores únicos. */
function vocabularioEscaso(): Palabra[] {
  return [
    palabra({ id: 'p-inti', termino: 'inti', traduccion: 'sol' }),
    palabra({ id: 'p-nina', termino: 'nina', traduccion: 'fuego' }),
    palabra({ id: 'p-yaku', termino: 'yaku', traduccion: 'agua' })
  ];
}

describe('[RF-005] Generar evaluación', () => {
  describe('[RN-09] Preguntas con cuatro opciones únicas', () => {
    it('[RN-09] cada pregunta tiene exactamente 4 opciones únicas', () => {
      // Dado un vocabulario suficiente del nivel 1
      const motorEvaluacion = generador(vocabularioAbundante());

      // Cuando se genera la evaluación
      const preguntas = motorEvaluacion.generar(NIVEL_UNO);

      // Entonces ninguna pregunta repite opciones y todas traen cuatro alternativas
      expect(preguntas.length).toBeGreaterThan(0);
      for (const pregunta of preguntas) {
        expect(pregunta.opciones).toHaveLength(4);
        expect(new Set(pregunta.opciones.map(normalizarTexto)).size).toBe(4);
      }
    });

    it('[RN-09] ninguna opción repite ni iguala a la opción correcta', () => {
      // Dado un vocabulario suficiente del nivel 1
      const preguntas = generador(vocabularioAbundante()).generar(NIVEL_UNO);

      // Cuando se revisa cada pregunta
      // Entonces la opción correcta aparece exactamente una vez entre las opciones
      for (const pregunta of preguntas) {
        const coincidencias = pregunta.opciones.filter((opcion) => pregunta.esCorrecta(opcion));
        expect(coincidencias).toHaveLength(1);
        expect(pregunta.esCorrecta(pregunta.opcionCorrecta)).toBe(true);
      }
    });

    it('[RN-09] todas las opciones provienen del vocabulario sembrado', () => {
      // Dado un vocabulario conocido y sin distractores hardcodeados
      const palabras = vocabularioAbundante();
      const permitidas = new Set(
        palabras.flatMap((palabra) => [
          normalizarTexto(palabra.terminoTexto),
          normalizarTexto(palabra.traduccion)
        ])
      );

      // Cuando se generan más preguntas que las que caben en la evaluación estándar
      const preguntas = generador(palabras).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces ningún distractor es un valor ajeno al vocabulario
      expect(preguntas.length).toBeGreaterThan(0);
      for (const pregunta of preguntas) {
        for (const opcion of pregunta.opciones) {
          expect(permitidas.has(normalizarTexto(opcion))).toBe(true);
        }
      }
    });

    it('[RN-09] no genera la pregunta cuando el vocabulario no alcanza para tres distractores', () => {
      // Dado un vocabulario tan pequeño que ninguna pareja (palabra, tipo) reúne 3 distractores
      const palabras = vocabularioEscaso();

      // Cuando se intenta generar la evaluación
      // Entonces se descartan todas las candidatas y se informa contenido insuficiente
      expect(() => generador(palabras).generar(NIVEL_UNO)).toThrow(ContenidoInsuficienteError);
    });

    it('[RN-09] descarta la candidata en silencio en vez de inventar distractores de respaldo', () => {
      // Dado el vocabulario escaso
      const palabras = vocabularioEscaso();
      let capturado: unknown;

      // Cuando se intenta generar la evaluación
      try {
        generador(palabras).generar(NIVEL_UNO);
      } catch (error) {
        capturado = error;
      }

      // Entonces hay cero preguntas válidas y el mensaje no menciona distractores inventados
      expect(capturado).toBeInstanceOf(ContenidoInsuficienteError);
      const insuficiente = capturado as ContenidoInsuficienteError;
      expect(insuficiente.preguntasDisponibles).toBe(0);
      expect(insuficiente.message).not.toMatch(/\b(ari|mana|casa|sol|inti|fuego|agua)\b/i);
    });

    it('[RN-09] toma los distractores del pool de misma categoría y nivel antes que de otros pools', () => {
      // Dado cinco sustantivos del nivel 1 y verbos de otro nivel como vocabulario ajeno al pool
      const palabras = [
        palabra({ id: 'p-inti', termino: 'inti', traduccion: 'sol' }),
        palabra({ id: 'p-nina', termino: 'nina', traduccion: 'fuego' }),
        palabra({ id: 'p-yaku', termino: 'yaku', traduccion: 'agua' }),
        palabra({ id: 'p-urqu', termino: 'urqu', traduccion: 'cerro' }),
        palabra({ id: 'p-mayu', termino: 'mayu', traduccion: 'río' }),
        palabra({ id: 'p-yachay', termino: 'yachay', traduccion: 'aprender', nivel: 2, categoria: 'verbo' }),
        palabra({ id: 'p-rimay', termino: 'rimay', traduccion: 'hablar', nivel: 2, categoria: 'verbo' })
      ];
      const porId = new Map(palabras.map((candidata) => [candidata.id, candidata]));

      // Cuando se genera la evaluación del nivel 1
      const preguntas = generador(palabras).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces todos los distractores pertenecen al pool prioritario (misma categoría y nivel)
      expect(preguntas).toHaveLength(10);
      for (const pregunta of preguntas) {
        const objetivo = porId.get(pregunta.palabraId);
        expect(objetivo).toBeDefined();
        const poolPrioritario = palabras
          .filter(
            (candidata) =>
              candidata.id !== objetivo?.id &&
              candidata.categoria === objetivo?.categoria &&
              candidata.nivelId.valor === NIVEL_UNO.valor
          )
          .map((candidata) =>
            pregunta.tipo === 'traduccion_quechua' ? candidata.traduccion : candidata.terminoTexto
          )
          .map(normalizarTexto);

        for (const opcion of pregunta.opciones) {
          if (pregunta.esCorrecta(opcion)) continue;
          expect(poolPrioritario).toContain(normalizarTexto(opcion));
        }
      }
    });
  });

  describe('[RN-10] Cantidad de preguntas y unicidad de parejas', () => {
    it('[RN-10] genera 10 preguntas cuando el vocabulario es abundante', () => {
      // Dado un vocabulario con 12 candidatas posibles
      // Cuando se genera la evaluación sin opciones explícitas
      const preguntas = generador(vocabularioAbundante()).generar(NIVEL_UNO);

      // Entonces se obtiene el objetivo exacto de la regla
      expect(preguntas).toHaveLength(10);
    });

    it('[RN-10] genera 7 preguntas cuando el nivel sólo permite 7 candidatas válidas', () => {
      // Dado tres palabras del nivel 1 más una oración cloze válida, con un cuarto término de apoyo
      const palabras = [
        palabra({ id: 'p-inti', termino: 'inti', traduccion: 'sol' }),
        palabra({ id: 'p-nina', termino: 'nina', traduccion: 'fuego' }),
        palabra({ id: 'p-yaku', termino: 'yaku', traduccion: 'agua' }),
        palabra({ id: 'p-yachay', termino: 'yachay', traduccion: 'aprender', nivel: 2, categoria: 'verbo' })
      ];
      const oraciones = [
        oracion({
          id: 'o-inti',
          palabraClave: palabras[0]!,
          textoQuechua: "Inti k'anchan.",
          traduccionEspanol: 'El sol brilla.'
        })
      ];

      // Cuando se pide el objetivo de 10 preguntas
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO);

      // Entonces se entregan las 7 válidas, sin rellenar con preguntas de relleno
      expect(preguntas).toHaveLength(7);
    });

    it('[RN-10] lanza ContenidoInsuficienteError cuando el nivel sólo permite 4 candidatas', () => {
      // Dado dos palabras del nivel 1 y dos de otro nivel que sirven de distractores
      const palabras = [
        palabra({ id: 'p-inti', termino: 'inti', traduccion: 'sol' }),
        palabra({ id: 'p-nina', termino: 'nina', traduccion: 'fuego' }),
        palabra({ id: 'p-yachay', termino: 'yachay', traduccion: 'aprender', nivel: 2, categoria: 'verbo' }),
        palabra({ id: 'p-rimay', termino: 'rimay', traduccion: 'hablar', nivel: 2, categoria: 'verbo' })
      ];
      let capturado: unknown;

      // Cuando se intenta generar la evaluación
      try {
        generador(palabras).generar(NIVEL_UNO);
      } catch (error) {
        capturado = error;
      }

      // Entonces el error informa las 4 preguntas disponibles frente al mínimo de 5
      expect(capturado).toBeInstanceOf(ContenidoInsuficienteError);
      expect((capturado as ContenidoInsuficienteError).preguntasDisponibles).toBe(4);
    });

    it('[RN-10] no repite la pareja (palabra, tipo) entre preguntas', () => {
      // Dado un vocabulario que produce más candidatas que el objetivo
      const palabras = vocabularioAbundante();

      // Cuando se generan 10 preguntas
      const preguntas = generador(palabras).generar(NIVEL_UNO);

      // Entonces cada pareja palabra/tipo aparece una sola vez
      const parejas = preguntas.map((pregunta) => `${pregunta.palabraId}::${pregunta.tipo}`);
      expect(new Set(parejas).size).toBe(preguntas.length);
    });

    it('[RN-10] descarta la segunda oración cloze de la misma palabra clave', () => {
      // Dado dos oraciones aprobadas que comparten la palabra clave
      const palabras = vocabularioAbundante();
      const oraciones = [
        oracion({
          id: 'o-inti-1',
          palabraClave: palabras[0]!,
          textoQuechua: "Inti k'anchan.",
          traduccionEspanol: 'El sol brilla.'
        }),
        oracion({
          id: 'o-inti-2',
          palabraClave: palabras[0]!,
          textoQuechua: 'Inti hatun.',
          traduccionEspanol: 'El sol es grande.'
        })
      ];

      // Cuando se generan todas las candidatas posibles
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces sólo una pregunta cloze sobrevive para esa palabra
      const cloze = preguntas.filter((pregunta) => pregunta.tipo === 'completar_espacio');
      expect(cloze).toHaveLength(1);
      expect(cloze[0]?.palabraId).toBe('p-inti');
    });
  });

  describe('[RN-11] Oraciones válidas del corpus', () => {
    it('[RN-11] ignora una oración que no contiene la palabra clave', () => {
      // Dado una oración aprobada cuyo texto no menciona la palabra clave
      const palabras = vocabularioAbundante();
      const oraciones = [
        oracion({
          id: 'o-invalida',
          palabraClave: palabras[0]!,
          textoQuechua: "Nina k'anchan.",
          traduccionEspanol: 'El fuego brilla.'
        })
      ];

      // Cuando se generan todas las candidatas posibles
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces no hay ninguna pregunta cloze y quedan sólo las de vocabulario
      expect(preguntas.some((pregunta) => pregunta.tipo === 'completar_espacio')).toBe(false);
      expect(preguntas).toHaveLength(12);
    });

    it('[RN-11] ignora una oración que todavía no está aprobada', () => {
      // Dado una oración pendiente de moderación que sí contiene la palabra clave
      const palabras = vocabularioAbundante();
      const oraciones = [
        oracion({
          id: 'o-pendiente',
          palabraClave: palabras[0]!,
          textoQuechua: "Inti k'anchan.",
          estado: 'pendiente'
        })
      ];

      // Cuando se generan todas las candidatas posibles
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces la oración pendiente no produce pregunta cloze
      expect(preguntas.some((pregunta) => pregunta.tipo === 'completar_espacio')).toBe(false);
    });

    it('[RN-11] ignora una oración cuya palabra clave no existe en el vocabulario', () => {
      // Dado una oración aprobada del nivel 1 que referencia una palabra clave ausente del vocabulario
      const palabras = vocabularioAbundante();
      const huerfana = palabra({ id: 'p-sami', termino: 'sami', traduccion: 'ánimo' });
      const oraciones = [
        oracion({
          id: 'o-huerfana',
          palabraClave: huerfana,
          textoQuechua: 'Samiykiwan kani.',
          traduccionEspanol: 'Estoy con tu ánimo.'
        })
      ];

      // Cuando se generan las candidatas del nivel 1
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces la oración huérfana se descarta
      expect(preguntas.some((pregunta) => pregunta.tipo === 'completar_espacio')).toBe(false);
    });

    it('[RN-11] ignora una oración aprobada que pertenece a otro nivel', () => {
      // Dado una oración válida de nivel 2 mientras se genera la evaluación del nivel 1
      const palabras = vocabularioAbundante();
      const claveNivelDos = palabra({
        id: 'p-yachay-nivel-dos',
        termino: 'yachay',
        traduccion: 'aprender',
        nivel: 2,
        categoria: 'verbo'
      });
      const oraciones = [
        oracion({ id: 'o-nivel-dos', palabraClave: claveNivelDos, textoQuechua: 'Yachaywasipi kani.' })
      ];

      // Cuando se generan todas las candidatas del nivel 1
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces la oración de otro nivel no produce pregunta cloze
      expect(preguntas.some((pregunta) => pregunta.tipo === 'completar_espacio')).toBe(false);
      expect(preguntas).toHaveLength(12);
    });

    it('[RN-11] genera la pregunta cloze cuando la palabra clave aparece con sufijo quechua', () => {
      // Dado una oración donde la clave "yachay" aparece dentro de "yachaywasipi"
      const palabras = [
        palabra({ id: 'p-yachay', termino: 'yachay', traduccion: 'aprender', categoria: 'verbo' }),
        palabra({ id: 'p-rimay', termino: 'rimay', traduccion: 'hablar', categoria: 'verbo' }),
        palabra({ id: 'p-inti', termino: 'inti', traduccion: 'sol' }),
        palabra({ id: 'p-yaku', termino: 'yaku', traduccion: 'agua' })
      ];
      const oraciones = [
        oracion({
          id: 'o-sufijo',
          palabraClave: palabras[0]!,
          textoQuechua: 'Yachaywasipi yachakuni.',
          traduccionEspanol: 'Aprendo en la escuela.'
        })
      ];

      // Cuando se generan todas las candidatas posibles
      const preguntas = generador(palabras, oraciones).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces la oración con sufijo sí produce una pregunta cloze
      const cloze = preguntas.filter((pregunta) => pregunta.tipo === 'completar_espacio');
      expect(cloze).toHaveLength(1);
      expect(cloze[0]?.palabraId).toBe('p-yachay');
      expect(cloze[0]?.enunciado).toContain('_______wasipi');
    });

    it('[RN-11] explica el cloze con el contexto cultural de la oración o con un texto por defecto', () => {
      // Dado una oración con contexto cultural y otra sin él
      const palabras = vocabularioAbundante();
      const conContexto = [
        oracion({
          id: 'o-con-contexto',
          palabraClave: palabras[0]!,
          textoQuechua: "Inti k'anchan.",
          contextoCultural: 'El sol ordena el calendario agrícola.'
        })
      ];
      const sinContexto = [
        oracion({ id: 'o-sin-contexto', palabraClave: palabras[0]!, textoQuechua: 'Inti hatun.' })
      ];

      // Cuando se genera cada evaluación
      const preguntasConContexto = generador(palabras, conContexto).generar(NIVEL_UNO, { objetivo: 20 });
      const preguntasSinContexto = generador(palabras, sinContexto).generar(NIVEL_UNO, { objetivo: 20 });

      // Entonces la explicación usa el contexto cultural o el texto por defecto (nunca el nivel 11)
      const clozeConContexto = preguntasConContexto.find((pregunta) => pregunta.tipo === 'completar_espacio');
      const clozeSinContexto = preguntasSinContexto.find((pregunta) => pregunta.tipo === 'completar_espacio');
      expect(clozeConContexto?.explicacion).toBe('Contexto cultural: El sol ordena el calendario agrícola.');
      expect(clozeSinContexto?.explicacion).toBe('Oración base del nivel 1.');
    });
  });
});
