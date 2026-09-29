import { describe, expect, it } from 'vitest';
import { GeneradorEvaluacion } from '@domain/evaluacion/GeneradorEvaluacion';
import type { Pregunta } from '@domain/evaluacion/Pregunta';
import { normalizarTexto } from '@domain/shared/texto';
import { CATEGORIAS_GRAMATICALES } from '@domain/shared/tipos';
import { NivelId } from '@domain/value-objects/NivelId';
import {
  SEMILLA_CRUDA,
  cargarSemilla,
  crearCatalogoSemilla,
  crearOracionesSemilla,
  esquemaCorpus
} from '@infrastructure/catalog';
import { AleatorioFijo, GeneradorIdSecuencial } from '../../helpers';

/**
 * [RF-003] Corpus semilla del catálogo y [RN-10] capacidad de generación de evaluaciones.
 *
 * Estas pruebas son la red de seguridad de los datos: si alguien edita el vocabulario y rompe la
 * unicidad de los identificadores, la referencia al nivel o la cohesión de una oración (RN-11 /
 * RN-12), aquí se ve antes de llegar a la UI.
 *
 * Todas las comprobaciones son deterministas: `AleatorioFijo` y `GeneradorIdSecuencial` evitan
 * depender del azar real, igual que el resto de la suite del motor determinista.
 */

/** Semilla base del PRNG de prueba; cada nivel usa `SEMILLA_BASE + nivel`. */
const SEMILLA_BASE = 20260315;

/** Tamaño esperado del corpus sembrado (hallazgo verificado contra `src/data/seed-levels.ts`). */
const TOTAL_NIVELES = 10;
const TOTAL_PALABRAS = 48;
const TOTAL_ORACIONES = 19;

/**
 * Genera las preguntas de cada nivel 1..10 con las palabras del catálogo y las oraciones VÁLIDAS
 * del nivel. No captura excepciones a propósito: si un nivel no alcanzase el mínimo de preguntas
 * (RN-10), `generar` lanzaría y la prueba fallaría, que es justo lo que se quiere detectar.
 */
function generarPreguntasPorNivel(): Map<number, Pregunta[]> {
  const semilla = cargarSemilla();
  const porNivel = new Map<number, Pregunta[]>();

  for (let nivel = 1; nivel <= NivelId.TOTAL_NIVELES; nivel += 1) {
    const oracionesDelNivel = semilla.oraciones.filter((oracion) => oracion.nivelId.valor === nivel);
    const generador = new GeneradorEvaluacion(
      semilla.palabras,
      oracionesDelNivel,
      new AleatorioFijo(SEMILLA_BASE + nivel),
      new GeneradorIdSecuencial(`nivel-${nivel}`)
    );

    porNivel.set(nivel, generador.generar(NivelId.crear(nivel)));
  }

  return porNivel;
}

describe('[RF-003] Catálogo semilla', () => {
  it('[RNF-005] la semilla completa pasa la validación Zod', () => {
    // Dado el corpus crudo sembrado
    const resultado = esquemaCorpus.safeParse(SEMILLA_CRUDA);

    // Cuando se resume el resultado de la validación
    const problemas = resultado.success
      ? []
      : resultado.error.issues.map((problema) => `${problema.path.join('.')}: ${problema.message}`);

    // Entonces no hay ningún problema y el corpus tiene el tamaño declarado
    expect(problemas).toEqual([]);
    expect(SEMILLA_CRUDA.niveles).toHaveLength(TOTAL_NIVELES);
    expect(SEMILLA_CRUDA.palabras).toHaveLength(TOTAL_PALABRAS);
    expect(SEMILLA_CRUDA.oraciones).toHaveLength(TOTAL_ORACIONES);

    // Y la carga de la semilla tampoco lanza
    expect(() => cargarSemilla()).not.toThrow();
    expect(cargarSemilla().niveles).toHaveLength(TOTAL_NIVELES);
    expect(cargarSemilla().palabras).toHaveLength(TOTAL_PALABRAS);
  });

  it('[RNF-005] todos los ids son únicos dentro de cada colección', () => {
    // Dado el corpus crudo
    const idsNiveles = SEMILLA_CRUDA.niveles.map((nivel) => String(nivel.id));
    const idsPalabras = SEMILLA_CRUDA.palabras.map((palabra) => palabra.id);
    const idsOraciones = SEMILLA_CRUDA.oraciones.map((oracion) => oracion.id);

    // Cuando se cuentan los identificadores distintos de cada colección
    const distintos = [new Set(idsNiveles).size, new Set(idsPalabras).size, new Set(idsOraciones).size];

    // Entonces no hay ningún id repetido
    expect(distintos).toEqual([idsNiveles.length, idsPalabras.length, idsOraciones.length]);
  });

  it('[RNF-005] cada palabra pertenece a un nivel existente y cada oración también', () => {
    // Dado el conjunto de niveles declarados
    const niveles = new Set(SEMILLA_CRUDA.niveles.map((nivel) => nivel.id));

    // Cuando se buscan referencias huérfanas
    const palabrasHuerfanas = SEMILLA_CRUDA.palabras
      .filter((palabra) => !niveles.has(palabra.nivelId))
      .map((palabra) => `${palabra.id}→nivel ${palabra.nivelId}`);
    const oracionesHuerfanas = SEMILLA_CRUDA.oraciones
      .filter((oracion) => !niveles.has(oracion.nivelId))
      .map((oracion) => `${oracion.id}→nivel ${oracion.nivelId}`);

    // Entonces todas las referencias apuntan a un nivel del corpus
    expect(palabrasHuerfanas).toEqual([]);
    expect(oracionesHuerfanas).toEqual([]);
  });

  it('[RNF-005] cada categoría gramatical es válida', () => {
    // Dado el catálogo de categorías admitidas por el dominio
    const admitidas: readonly string[] = CATEGORIAS_GRAMATICALES;

    // Cuando se revisan las categorías del corpus
    const invalidas = [
      ...SEMILLA_CRUDA.palabras
        .filter((palabra) => !admitidas.includes(palabra.categoria))
        .map((palabra) => `${palabra.id}: ${palabra.categoria}`),
      ...SEMILLA_CRUDA.oraciones
        .filter((oracion) => !admitidas.includes(oracion.categoria))
        .map((oracion) => `${oracion.id}: ${oracion.categoria}`)
    ];

    // Entonces no queda ninguna categoría fuera de `CATEGORIAS_GRAMATICALES`
    expect(invalidas).toEqual([]);
  });

  it('[RN-12] cada oración declara una palabra clave que existe en el catálogo', () => {
    // Dado el índice de palabras del corpus
    const idsPalabras = new Set(SEMILLA_CRUDA.palabras.map((palabra) => palabra.id));

    // Cuando se buscan oraciones que apunten a una palabra clave inexistente
    const sinPalabraClave = SEMILLA_CRUDA.oraciones
      .filter((oracion) => !idsPalabras.has(oracion.palabraClaveId))
      .map((oracion) => `${oracion.id}→${oracion.palabraClaveId}`);

    // Entonces ninguna oración queda sin palabra clave (invariante del corpus, no del usuario)
    expect(sinPalabraClave).toEqual([]);
  });

  it('[RN-12] cada palabra clave pertenece al mismo nivel que su oración', () => {
    // Dado el nivel de cada palabra
    const nivelDePalabra = new Map(SEMILLA_CRUDA.palabras.map((palabra) => [palabra.id, palabra.nivelId]));

    // Cuando se comparan los niveles de la oración y de su palabra clave
    const desalineadas = SEMILLA_CRUDA.oraciones
      .filter((oracion) => nivelDePalabra.get(oracion.palabraClaveId) !== oracion.nivelId)
      .map((oracion) => `${oracion.id}→${oracion.palabraClaveId}`);

    // Entonces todas las parejas oración/palabra clave comparten nivel
    expect(desalineadas).toEqual([]);
  });

  it('[RN-11] las oraciones que no contienen su palabra clave se reportan en los avisos y NO se usan para cloze', () => {
    /*
     * HALLAZGO DE CALIDAD DE DATOS (RN-11) — corpus original `src/data/seed-levels.ts`:
     *  - `ora_9_1` ("Kunan p'unchay papata tarpunchik.") declara como palabra clave `voc_9_1`
     *    "Tarpuy" (sembrar), pero la oración usa la raíz verbal "tarpu-" en "tarpunchik"; el
     *    término "tarpuy" no aparece y RN-11 no puede verificarse.
     *  - `ora_9_2` ("Mamayqa aguayota sumaqta awachkan.") declara `voc_9_2` "Away" (tejer), pero el
     *    texto dice "aguayota" y "awachkan": el término exacto "away" tampoco aparece.
     * Consecuencia: el nivel 9 se queda sin oraciones de cloze (sólo con sus 4 palabras) y el
     * corpus aporta 17 de sus 19 oraciones. El contenido se conserva intacto; sólo se excluye del
     * generador y se avisa, en lugar de romper el arranque de la aplicación.
     */
    // Dado el catálogo sembrado
    const semilla = cargarSemilla();

    // Cuando se leen sus avisos y sus oraciones utilizables
    const { avisos, oraciones } = semilla;

    // Entonces hay exactamente dos avisos y cada uno identifica la oración, su palabra clave y el motivo
    expect(avisos).toHaveLength(2);
    expect(avisos.some((aviso) => aviso.includes('ora_9_1') && aviso.includes('voc_9_1') && aviso.includes('Tarpuy'))).toBe(true);
    expect(avisos.some((aviso) => aviso.includes('ora_9_2') && aviso.includes('voc_9_2') && aviso.includes('Away'))).toBe(true);
    expect(avisos.some((aviso) => aviso.includes('RN-11'))).toBe(true);

    // Y las dos oraciones inválidas quedan fuera: sólo 17 de las 19 llegan al generador de cloze
    const idsUtilizables = oraciones.map((oracion) => oracion.id);
    expect(oraciones).toHaveLength(TOTAL_ORACIONES - 2);
    expect(idsUtilizables).not.toContain('ora_9_1');
    expect(idsUtilizables).not.toContain('ora_9_2');
    expect(oraciones.filter((oracion) => oracion.nivelId.valor === 9)).toHaveLength(0);
  });

  it('[RNF-005] crearCatalogoSemilla sirve los 10 niveles y las 48 palabras sin compartir referencias', async () => {
    // Dado el catálogo de sólo lectura construido desde la semilla
    const catalogo = crearCatalogoSemilla();

    // Cuando se consultan niveles y palabras
    const niveles = await catalogo.listarNiveles();
    const palabras = await catalogo.listarPalabras();
    const palabrasDelNivelUno = await catalogo.listarPalabrasPorNivel(1);
    const primera = await catalogo.obtenerPalabra('voc_1_1');
    const segunda = await catalogo.obtenerPalabra('voc_1_1');

    // Entonces devuelve el corpus completo y cada lectura es un objeto nuevo
    expect(niveles).toHaveLength(TOTAL_NIVELES);
    expect(palabras).toHaveLength(TOTAL_PALABRAS);
    expect(palabrasDelNivelUno).toHaveLength(6);
    expect(primera?.id).toBe('voc_1_1');
    expect(primera).not.toBe(segunda);
    expect(await catalogo.obtenerNivel(3)).not.toBeNull();
    expect(await catalogo.obtenerNivel(11)).toBeNull();
    expect(await catalogo.obtenerPalabra('voc_inexistente')).toBeNull();
  });

  it('[RNF-005] crearOracionesSemilla entrega únicamente las oraciones válidas', () => {
    // Dado el corpus de oraciones listo para el generador
    const oraciones = crearOracionesSemilla();

    // Cuando se comprueba su tamaño y su estado de moderación
    const todasAprobadas = oraciones.every((oracion) => oracion.esAprobada());

    // Entonces sólo llegan las 17 oraciones que cumplen RN-11 y RN-12
    expect(oraciones).toHaveLength(TOTAL_ORACIONES - 2);
    expect(todasAprobadas).toBe(true);
  });
});

describe('[RN-10] Capacidad del corpus', () => {
  it('[RN-10] cada nivel permite generar al menos 5 preguntas válidas', () => {
    // Dado el catálogo semilla y su motor determinista de evaluación
    const porNivel = generarPreguntasPorNivel();

    // Cuando se recuenta la evaluación de cada nivel 1..10
    const tabla: Array<{ nivel: number; preguntas: number }> = [];
    for (let nivel = 1; nivel <= NivelId.TOTAL_NIVELES; nivel += 1) {
      const preguntas = porNivel.get(nivel) ?? [];
      tabla.push({ nivel, preguntas: preguntas.length });

      // Entonces ningún nivel se queda por debajo del mínimo de RN-10 ni supera el objetivo
      expect(preguntas.length).toBeGreaterThanOrEqual(GeneradorEvaluacion.PREGUNTAS_MINIMAS);
      expect(preguntas.length).toBeLessThanOrEqual(GeneradorEvaluacion.PREGUNTAS_OBJETIVO);
    }

    /*
     * Trazabilidad de capacidad (el orquestador reporta esta tabla):
     * los niveles 7, 8 y 9 NO alcanzan las 10 preguntas objetivo porque su vocabulario sembrado
     * tiene 4, 3 y 4 palabras: cada palabra sólo aporta 2 candidatas de traducción (quechua→español
     * y español→quechua) y el cloze depende de las oraciones válidas del nivel (1 en el nivel 7,
     * 1 en el nivel 8 y ninguna en el nivel 9, por el hallazgo RN-11 anterior).
     */
    console.log('[RN-10] Tabla nivel → nº de preguntas generadas (objetivo 10, mínimo 5):');
    for (const fila of tabla) {
      console.log(`  Nivel ${fila.nivel}: ${fila.preguntas} preguntas`);
    }
    console.table(tabla);

    expect(tabla).toHaveLength(TOTAL_NIVELES);
  });

  it('[RN-09] ninguna pregunta generada contiene distractores repetidos ni la opción correcta duplicada', () => {
    // Dado el conjunto de preguntas de todos los niveles
    const porNivel = generarPreguntasPorNivel();

    // Cuando se revisan las opciones de cada pregunta
    const conOpcionesRepetidas: string[] = [];
    const conCorrectaDuplicada: string[] = [];
    const conNumeroDeOpcionesIncorrecto: string[] = [];
    let total = 0;

    for (const [nivel, preguntas] of porNivel) {
      for (const pregunta of preguntas) {
        total += 1;
        const normalizadas = pregunta.opciones.map(normalizarTexto);
        const coincidencias = normalizadas.filter((opcion) => opcion === normalizarTexto(pregunta.opcionCorrecta));

        if (pregunta.opciones.length !== GeneradorEvaluacion.OPCIONES_POR_PREGUNTA) {
          conNumeroDeOpcionesIncorrecto.push(`${nivel}:${pregunta.id}`);
        }
        if (new Set(normalizadas).size !== normalizadas.length) conOpcionesRepetidas.push(`${nivel}:${pregunta.id}`);
        if (coincidencias.length !== 1) conCorrectaDuplicada.push(`${nivel}:${pregunta.id}`);
      }
    }

    // Entonces las 4 opciones son únicas y la correcta aparece exactamente una vez en cada pregunta
    expect(conNumeroDeOpcionesIncorrecto).toEqual([]);
    expect(conOpcionesRepetidas).toEqual([]);
    expect(conCorrectaDuplicada).toEqual([]);
    expect(total).toBeGreaterThanOrEqual(50);
  });
});
