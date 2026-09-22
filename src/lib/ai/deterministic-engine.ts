import {
  SEED_NIVELES,
  SEED_VOCABULARIO,
  SEED_ORACIONES_BASE
} from '../../data/seed-levels.ts';
import type {
  DetallePregunta,
  Evaluacion,
  PalabraVocabulario,
  OracionBase,
  CategoriaGramatical
} from '../../types/domain.ts';

// Algoritmo Fisher-Yates para barajar arreglos de forma determinista
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Genera distractores verosímiles filtrando términos de la misma categoría gramatical
 * según el requerimiento pedagógico RF-005 y la observación del stakeholder.
 */
function findPlausibleDistractors(
  targetWord: PalabraVocabulario,
  allVocabulary: PalabraVocabulario[],
  count: number = 3,
  mode: 'quechua' | 'espanol' = 'quechua'
): string[] {
  // 1. Filtrar por misma categoría gramatical y excluir la palabra objetivo
  let candidates = allVocabulary.filter(
    (w) =>
      w.id_palabra !== targetWord.id_palabra &&
      w.categoria_gramatical === targetWord.categoria_gramatical
  );

  // Si no hay suficientes en la misma categoría, ampliar a categorías compatibles
  if (candidates.length < count) {
    const additional = allVocabulary.filter(
      (w) =>
        w.id_palabra !== targetWord.id_palabra &&
        !candidates.some((c) => c.id_palabra === w.id_palabra)
    );
    candidates = [...candidates, ...additional];
  }

  const shuffled = shuffleArray(candidates);
  const selected = shuffled.slice(0, count);

  return selected.map((item) =>
    mode === 'quechua' ? item.termino_quechua : item.traduccion_espanol
  );
}

/**
 * Genera una evaluación determinista para un nivel específico.
 * Combina oraciones base (cloze test) y preguntas léxicas contextualizadas.
 */
export function generateQuizForLevel(
  levelId: number,
  targetQuestionCount: number = 10
): DetallePregunta[] {
  const levelVocab = SEED_VOCABULARIO.filter((v) => v.id_nivel === levelId);
  const levelSentences = SEED_ORACIONES_BASE.filter((s) => s.id_nivel === levelId);
  const allVocab = SEED_VOCABULARIO;

  const questions: DetallePregunta[] = [];
  let questionIndex = 1;

  // 1. Preguntas tipo Cloze (completar espacio en oración base)
  for (const sentence of levelSentences) {
    const targetWord = allVocab.find((w) => w.id_palabra === sentence.palabra_clave_id);
    if (!targetWord) continue;

    // Crear enunciado con espacio en blanco
    // Reemplaza la palabra exacta o con sufijos básicos
    const regex = new RegExp(targetWord.termino_quechua, 'i');
    const blankSentence = sentence.texto_quechua.replace(regex, '_______');

    const distractors = findPlausibleDistractors(targetWord, allVocab, 3, 'quechua');
    const options = shuffleArray([targetWord.termino_quechua, ...distractors]);

    questions.push({
      id_pregunta: `preg_${levelId}_${questionIndex++}`,
      enunciado_pregunta: `Completa la oración en quechua:\n"${blankSentence}"\n(Traducción: ${sentence.traduccion_espanol})`,
      tipo_pregunta: 'completar_espacio',
      opcion_correcta: targetWord.termino_quechua,
      distractor_1: distractors[0] || 'Ari',
      distractor_2: distractors[1] || 'Mana',
      distractor_3: distractors[2] || 'Allianmi',
      opciones_mezcladas: options,
      explicacion_pedagogica: `Contexto cultural: ${sentence.contexto_cultural}`
    });
  }

  // 2. Preguntas de traducción directa (Quechua -> Español)
  for (const vocab of levelVocab) {
    if (questions.length >= targetQuestionCount) break;

    const distractors = findPlausibleDistractors(vocab, allVocab, 3, 'espanol');
    const options = shuffleArray([vocab.traduccion_espanol, ...distractors]);

    questions.push({
      id_pregunta: `preg_${levelId}_${questionIndex++}`,
      enunciado_pregunta: `¿Cuál es el significado de "${vocab.termino_quechua}"?`,
      tipo_pregunta: 'traduccion_quechua',
      opcion_correcta: vocab.traduccion_espanol,
      distractor_1: distractors[0] || 'Casa',
      distractor_2: distractors[1] || 'Sol',
      distractor_3: distractors[2] || 'Agua',
      opciones_mezcladas: options,
      explicacion_pedagogica: `${vocab.termino_quechua} (${vocab.pronunciacion_aproximada}): ${vocab.contexto_cultural}`
    });
  }

  // 3. Preguntas de traducción inversa (Español -> Quechua) si faltan preguntas para llegar a targetQuestionCount
  for (const vocab of shuffleArray(levelVocab)) {
    if (questions.length >= targetQuestionCount) break;

    const distractors = findPlausibleDistractors(vocab, allVocab, 3, 'quechua');
    const options = shuffleArray([vocab.termino_quechua, ...distractors]);

    questions.push({
      id_pregunta: `preg_${levelId}_${questionIndex++}`,
      enunciado_pregunta: `¿Cómo se dice "${vocab.traduccion_espanol}" en runasimi?`,
      tipo_pregunta: 'traduccion_espanol',
      opcion_correcta: vocab.termino_quechua,
      distractor_1: distractors[0] || 'Allqo',
      distractor_2: distractors[1] || 'Sara',
      distractor_3: distractors[2] || 'Inti',
      opciones_mezcladas: options,
      explicacion_pedagogica: `Pronunciación: "${vocab.pronunciacion_aproximada}". Ejemplo: ${vocab.ejemplo_uso || ''}`
    });
  }

  return shuffleArray(questions).slice(0, targetQuestionCount);
}

export interface QuizSubmissionResult {
  evaluacion: Evaluacion;
  detalle: DetallePregunta[];
  aprobado: boolean;
  umbralMinimo: number;
}

/**
 * Calificación determinista inmediata de las respuestas del estudiante.
 * Umbral pedagógico del 70% (SRS RF-003, RF-005).
 */
export function evaluateQuiz(
  studentId: string,
  levelId: number,
  questions: DetallePregunta[],
  userAnswers: Record<string, string>
): QuizSubmissionResult {
  let aciertos = 0;
  const processedQuestions: DetallePregunta[] = questions.map((q) => {
    const marked = userAnswers[q.id_pregunta] || '';
    const esCorrecta = marked.trim().toLowerCase() === q.opcion_correcta.trim().toLowerCase();
    if (esCorrecta) aciertos++;

    return {
      ...q,
      respuesta_marcada: marked,
      es_correcta: esCorrecta
    };
  });

  const total = questions.length;
  const puntuacion = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const aprobado = puntuacion >= 70;

  const evaluacion: Evaluacion = {
    id_evaluacion: `eval_${levelId}_${Date.now()}`,
    id_estudiante: studentId,
    id_nivel: levelId,
    puntuacion_obtenida: puntuacion,
    total_aciertos: aciertos,
    total_preguntas: total,
    estado_aprobacion: aprobado ? 'aprobado' : 'reprobado',
    fecha_evaluacion: new Date().toISOString(),
    sincronizado_nube: false
  };

  return {
    evaluacion,
    detalle: processedQuestions,
    aprobado,
    umbralMinimo: 70
  };
}
