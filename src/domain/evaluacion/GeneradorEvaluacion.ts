import type { Palabra } from '../aprendizaje/Palabra';
import type { OracionBase } from '../contenido/OracionBase';
import { ContenidoInsuficienteError } from '../errores';
import { barajar } from '../shared/aleatorio';
import type { FuenteAleatoria, GeneradorId } from '../shared/puertos';
import { normalizarTexto } from '../shared/texto';
import type { TipoPregunta } from '../shared/tipos';
import type { NivelId } from '../value-objects/NivelId';
import { Pregunta } from './Pregunta';

/**
 * RN-09 / RN-10 / RN-11: generador determinista de evaluaciones.
 *
 * Es un servicio de dominio PURO: recibe el vocabulario, las oraciones, la fuente aleatoria y el
 * generador de identificadores por constructor. No consulta repositorios ni colecciones globales,
 * de modo que los tests reproducen exactamente la misma evaluación con la misma semilla.
 *
 * Reglas que implementa:
 *  - RN-09: tres formatos de pregunta con 4 opciones únicas y distractores plausibles.
 *  - RN-10: 10 preguntas objetivo y 5 mínimas; sin repetir la pareja (palabra, tipo).
 *  - RN-11: sólo usan oraciones aprobadas que contengan su palabra clave (admitiendo sufijos).
 */
export interface OpcionesGeneracion {
  objetivo?: number;
  minimo?: number;
}

/** Idioma en el que se ofrecen las opciones, según el formato de pregunta. */
type ModoOpciones = 'quechua' | 'espanol';

/** Candidata todavía sin distractores resueltos: si no reúne 3, se descarta en silencio. */
interface CandidataPregunta {
  tipo: TipoPregunta;
  enunciado: string;
  opcionCorrecta: string;
  explicacion: string;
  palabraId: string;
  palabraObjetivo: Palabra;
  modo: ModoOpciones;
}

export class GeneradorEvaluacion {
  static readonly PREGUNTAS_OBJETIVO = 10;
  static readonly PREGUNTAS_MINIMAS = 5;
  static readonly OPCIONES_POR_PREGUNTA = 4;

  constructor(
    private readonly palabras: readonly Palabra[],
    private readonly oraciones: readonly OracionBase[],
    private readonly aleatorio: FuenteAleatoria,
    private readonly generadorId: GeneradorId
  ) {}

  /** RN-10: genera la evaluación del nivel; lanza `ContenidoInsuficienteError` si no llega al mínimo. */
  generar(nivel: NivelId, opciones: OpcionesGeneracion = {}): Pregunta[] {
    const objetivo = Math.max(
      0,
      Math.floor(opciones.objetivo ?? GeneradorEvaluacion.PREGUNTAS_OBJETIVO)
    );
    const minimo = Math.max(0, Math.floor(opciones.minimo ?? GeneradorEvaluacion.PREGUNTAS_MINIMAS));

    const palabrasNivel = this.palabras.filter((palabra) => palabra.esDelNivel(nivel));
    const candidatas = this.reunirCandidatas(nivel, palabrasNivel);

    const preguntasValidas = candidatas
      .map((candidata) => this.construirPregunta(candidata, nivel))
      .filter((pregunta): pregunta is Pregunta => pregunta !== undefined);

    if (preguntasValidas.length < minimo) {
      throw new ContenidoInsuficienteError(nivel.valor, preguntasValidas.length, minimo);
    }

    const cantidad = Math.min(objetivo, preguntasValidas.length);
    return barajar(preguntasValidas, this.aleatorio).slice(0, cantidad);
  }

  /**
   * Paso 4 del algoritmo: reúne candidatas de los tres formatos sin repetir la pareja
   * (palabra, tipo). Una oración inválida (RN-11) nunca llega a producir candidata.
   */
  private reunirCandidatas(nivel: NivelId, palabrasNivel: readonly Palabra[]): CandidataPregunta[] {
    const candidatas: CandidataPregunta[] = [];
    const parejas = new Set<string>();
    const palabrasPorId = new Map(this.palabras.map((palabra) => [palabra.id, palabra]));

    const agregar = (candidata: CandidataPregunta): void => {
      const clave = `${candidata.palabraId}::${candidata.tipo}`;
      if (parejas.has(clave)) return;
      parejas.add(clave);
      candidatas.push(candidata);
    };

    // a) Cloze sobre las oraciones válidas del nivel (RN-11).
    for (const oracion of this.oraciones) {
      if (!oracion.esDelNivel(nivel) || !oracion.esAprobada()) continue;
      const palabraClave = palabrasPorId.get(oracion.palabraClaveId);
      if (!palabraClave || !oracion.contienePalabraClave(palabraClave)) continue;

      agregar({
        tipo: 'completar_espacio',
        enunciado: `Completa la oración en quechua:\n"${oracion.textoConHueco(palabraClave)}"\n(Traducción: ${oracion.traduccionEspanol})`,
        opcionCorrecta: palabraClave.terminoTexto,
        explicacion:
          oracion.contextoCultural.length > 0
            ? `Contexto cultural: ${oracion.contextoCultural}`
            : `Oración base del nivel ${nivel.valor}.`,
        palabraId: palabraClave.id,
        palabraObjetivo: palabraClave,
        modo: 'quechua'
      });
    }

    // b) y c) Traducción en ambos sentidos, por cada palabra del nivel.
    for (const palabra of palabrasNivel) {
      agregar({
        tipo: 'traduccion_quechua',
        enunciado: `¿Cuál es el significado de "${palabra.terminoTexto}"?`,
        opcionCorrecta: palabra.traduccion,
        explicacion: `${palabra.terminoTexto} (${palabra.pronunciacion}): ${palabra.contextoCultural}`,
        palabraId: palabra.id,
        palabraObjetivo: palabra,
        modo: 'espanol'
      });

      agregar({
        tipo: 'traduccion_espanol',
        enunciado: `¿Cómo se dice "${palabra.traduccion}" en runasimi?`,
        opcionCorrecta: palabra.terminoTexto,
        explicacion: `Pronunciación: "${palabra.pronunciacion}". Ejemplo: ${palabra.ejemploUso || 'Sin ejemplo registrado.'}`,
        palabraId: palabra.id,
        palabraObjetivo: palabra,
        modo: 'quechua'
      });
    }

    return candidatas;
  }

  /** Convierte una candidata en pregunta; devuelve `undefined` si no reúne 3 distractores únicos. */
  private construirPregunta(candidata: CandidataPregunta, nivel: NivelId): Pregunta | undefined {
    const distractores = this.reunirDistractores(candidata);
    if (distractores.length !== GeneradorEvaluacion.OPCIONES_POR_PREGUNTA - 1) return undefined;

    const opciones = barajar([candidata.opcionCorrecta, ...distractores], this.aleatorio);

    return Pregunta.crear({
      id: this.generadorId.generar(),
      tipo: candidata.tipo,
      enunciado: candidata.enunciado,
      opcionCorrecta: candidata.opcionCorrecta,
      opciones,
      explicacion: candidata.explicacion,
      nivelId: nivel.valor,
      palabraId: candidata.palabraId
    });
  }

  /**
   * Paso 5 del algoritmo: prioridad estricta de pools (misma categoría y nivel → misma categoría →
   * mismo nivel → todo el vocabulario). No existe ningún distractor de respaldo: si no se reúnen
   * tres valores únicos, la candidata se descarta.
   */
  private reunirDistractores(candidata: CandidataPregunta): string[] {
    const objetivo = candidata.palabraObjetivo;
    const requeridos = GeneradorEvaluacion.OPCIONES_POR_PREGUNTA - 1;
    const distractores: string[] = [];
    const usados = new Set<string>([normalizarTexto(candidata.opcionCorrecta)]);

    const pools: readonly (readonly Palabra[])[] = [
      this.palabras.filter(
        (palabra) => palabra.categoria === objetivo.categoria && palabra.esDelNivel(objetivo.nivelId)
      ),
      this.palabras.filter((palabra) => palabra.categoria === objetivo.categoria),
      this.palabras.filter((palabra) => palabra.esDelNivel(objetivo.nivelId)),
      this.palabras
    ];

    for (const pool of pools) {
      if (distractores.length >= requeridos) break;
      for (const candidato of barajar(pool, this.aleatorio)) {
        if (distractores.length >= requeridos) break;
        if (candidato.id === objetivo.id) continue;

        const valor = candidata.modo === 'espanol' ? candidato.traduccion : candidato.terminoTexto;
        const normalizado = normalizarTexto(valor);
        if (normalizado.length === 0 || usados.has(normalizado)) continue;

        usados.add(normalizado);
        distractores.push(valor);
      }
    }

    return distractores;
  }
}
