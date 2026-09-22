// Script de prueba y verificación automatizada del Motor de IA Determinista
import { generateQuizForLevel, evaluateQuiz } from '../src/lib/ai/deterministic-engine.ts';
import { SEED_NIVELES } from '../src/data/seed-levels.ts';

console.log('=== VERIFICANDO MOTOR DE IA DETERMINISTA YAPU ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

// 1. Probar generación de cuestionarios en los 10 niveles
for (let lvl = 1; lvl <= 10; lvl++) {
  const questions = generateQuizForLevel(lvl, 10);
  assert(questions.length > 0, `Nivel ${lvl}: Generó ${questions.length} preguntas`);

  for (const [idx, q] of questions.entries()) {
    // 4 opciones en total
    assert(q.opciones_mezcladas.length === 4, `Nivel ${lvl} Pregunta ${idx + 1}: Tiene 4 opciones`);
    
    // Contiene la respuesta correcta
    assert(q.opciones_mezcladas.includes(q.opcion_correcta), `Nivel ${lvl} Pregunta ${idx + 1}: Opciones incluyen respuesta correcta`);
    
    // Sin duplicados
    const uniqueOptions = new Set(q.opciones_mezcladas);
    assert(uniqueOptions.size === 4, `Nivel ${lvl} Pregunta ${idx + 1}: Las 4 opciones son únicas`);
  }
}

// 2. Probar calificación determinista con umbral 70%
const mockQuestions = generateQuizForLevel(1, 10);

// Caso 1: 100% correctas
const perfectAnswers = {};
mockQuestions.forEach(q => { perfectAnswers[q.id_pregunta] = q.opcion_correcta; });
const resultPerfect = evaluateQuiz('test_user', 1, mockQuestions, perfectAnswers);
assert(resultPerfect.aprobado === true, 'Evaluación con 100% aprueba');
assert(resultPerfect.evaluacion.puntuacion_obtenida === 100, 'Puntuación es 100%');

// Caso 2: 70% correctas (7 de 10)
const thresholdAnswers = {};
mockQuestions.forEach((q, idx) => {
  thresholdAnswers[q.id_pregunta] = idx < 7 ? q.opcion_correcta : 'RESPUESTA_INCORRECTA';
});
const resultThreshold = evaluateQuiz('test_user', 1, mockQuestions, thresholdAnswers);
assert(resultThreshold.aprobado === true, 'Evaluación con 70% aprueba en el umbral exacto');
assert(resultThreshold.evaluacion.puntuacion_obtenida === 70, 'Puntuación es exactamente 70%');

// Caso 3: 60% correctas (6 de 10) -> Reprueba
const failAnswers = {};
mockQuestions.forEach((q, idx) => {
  failAnswers[q.id_pregunta] = idx < 6 ? q.opcion_correcta : 'RESPUESTA_INCORRECTA';
});
const resultFail = evaluateQuiz('test_user', 1, mockQuestions, failAnswers);
assert(resultFail.aprobado === false, 'Evaluación con 60% reprueba (< 70%)');
assert(resultFail.evaluacion.puntuacion_obtenida === 60, 'Puntuación es 60%');

console.log(`\n==============================================`);
console.log(`Pruebas ejecutadas: ${totalTests} | Exitosas: ${passedTests}`);
console.log(`==============================================\n`);

if (totalTests !== passedTests) {
  process.exit(1);
}
