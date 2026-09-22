import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowLeft,
  ChevronRight,
  Flame
} from 'lucide-react';
import { generateQuizForLevel, evaluateQuiz, type QuizSubmissionResult } from '../lib/ai/deterministic-engine';
import { LocalRepository } from '../lib/storage/local-repository';
import { SEED_NIVELES } from '../data/seed-levels';
import type { DetallePregunta } from '../types/domain';

interface QuizRunnerProps {
  levelId: number;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ levelId }) => {
  const [questions, setQuestions] = useState<DetallePregunta[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nivel = SEED_NIVELES.find((n) => n.id_nivel === levelId);

  const startNewQuiz = () => {
    const qList = generateQuizForLevel(levelId, 10);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmissionResult(null);
  };

  useEffect(() => {
    startNewQuiz();
  }, [levelId]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id_pregunta]: option
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsSubmitting(true);
    const profile = LocalRepository.getProfile();
    const result = evaluateQuiz(profile.id_estudiante, levelId, questions, selectedAnswers);

    LocalRepository.saveEvaluation(result.evaluacion);

    if (result.aprobado) {
      LocalRepository.unlockLevel(levelId + 1);
      // Trigger Andean celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#B94700', '#0D9488', '#38BDF8', '#FCD34D']
        });
      } catch (e) {
        // Fallback if browser blocks
      }
    }

    setSubmissionResult(result);
    setIsSubmitting(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Generando evaluación determinista con oraciones base...</p>
      </div>
    );
  }

  // --- Pantalla de Resultados ---
  if (submissionResult) {
    const isApproved = submissionResult.aprobado;
    const score = submissionResult.evaluacion.puntuacion_obtenida;
    const correctCount = submissionResult.evaluacion.total_aciertos;
    const totalCount = submissionResult.evaluacion.total_preguntas;

    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8">
        <div className={`p-6 sm:p-8 rounded-3xl border-2 text-center shadow-2xl relative overflow-hidden ${
          isApproved
            ? 'bg-gradient-to-b from-[#132822] to-[#0D1917] border-teal-500/60 shadow-teal-950/50'
            : 'bg-gradient-to-b from-[#2B1616] to-[#170E0E] border-rose-500/50 shadow-rose-950/50'
        }`}>
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 shadow-xl">
            {isApproved ? (
              <div className="w-full h-full rounded-full bg-teal-500/20 text-teal-400 border-2 border-teal-500 flex items-center justify-center animate-bounce">
                <Award className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-rose-500/20 text-rose-400 border-2 border-rose-500 flex items-center justify-center">
                <RotateCcw className="w-10 h-10" />
              </div>
            )}
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-black/40 inline-block mb-2">
            {isApproved ? '🎉 ¡Kusikuy! Has Aprobado' : '⚡ Sigue Practicando'}
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
            {score}% de Aciertos
          </h2>

          <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
            {isApproved
              ? `Has superado el umbral mínimo del 70% con ${correctCount} de ${totalCount} aciertos. ¡El nivel ${levelId + 1} está desbloqueado!`
              : `Obtuviste ${correctCount} de ${totalCount} aciertos. Necesitas al menos 70% para avanzar al siguiente nivel.`}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={startNewQuiz}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 min-h-[48px] active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar con Nuevas Preguntas</span>
            </button>

            <a
              href="/"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-andina-terracotta to-andina-gold hover:brightness-110 text-slate-950 text-sm font-bold shadow-lg shadow-andina-terracotta/30 min-h-[48px] active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Ver Mapa de Niveles</span>
            </a>
          </div>
        </div>

        {/* Desglose Pedagógico de Respuestas */}
        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
            Retroalimentación Pedagógica ({questions.length} preguntas)
          </h3>

          {submissionResult.detalle.map((item, idx) => (
            <div
              key={item.id_pregunta}
              className={`p-4 rounded-2xl border text-left text-xs ${
                item.es_correcta
                  ? 'bg-teal-950/20 border-teal-800/40 text-slate-200'
                  : 'bg-rose-950/20 border-rose-800/40 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {item.es_correcta ? (
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white whitespace-pre-line text-sm">
                    {idx + 1}. {item.enunciado_pregunta}
                  </p>
                  
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-black/40 text-slate-300">
                      Marcaste: <strong className={item.es_correcta ? 'text-teal-300' : 'text-rose-300'}>
                        {item.respuesta_marcada || '(Sin respuesta)'}
                      </strong>
                    </span>
                    {!item.es_correcta && (
                      <span className="px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-800/50">
                        Respuesta correcta: <strong>{item.opcion_correcta}</strong>
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-slate-400 italic">
                    💡 {item.explicacion_pedagogica}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Pantalla de Examen Activo ---
  const markedOption = selectedAnswers[currentQuestion.id_pregunta];

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-4">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir</span>
        </a>

        <div className="text-center">
          <span className="text-[11px] font-bold text-andina-gold uppercase tracking-wider">
            Evaluación IA — Nivel {levelId}
          </span>
          <p className="text-xs text-slate-400">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>70% para aprobar</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-andina-terracotta to-andina-gold h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-3xl bg-andina-night-card border border-slate-800 shadow-xl mb-6">
        <span className="text-[10px] uppercase font-bold tracking-widest text-andina-gold block mb-2">
          {currentQuestion.tipo_pregunta === 'completar_espacio'
            ? 'Oración Base — IA Determinista'
            : 'Vocabulario Contextual'}
        </span>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug whitespace-pre-line">
          {currentQuestion.enunciado_pregunta}
        </h2>
      </div>

      {/* 4 Multiple Choice Options (1 Correct + 3 Plausible Distractors) */}
      <div className="space-y-3">
        {currentQuestion.opciones_mezcladas.map((option, idx) => {
          const isSelected = markedOption === option;
          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(option)}
              className={`w-full p-4 rounded-2xl text-left font-medium text-sm sm:text-base flex items-center justify-between transition-all min-h-[52px] active:scale-[0.99] ${
                isSelected
                  ? 'bg-andina-gold text-slate-950 font-bold border-2 border-andina-gold shadow-lg shadow-andina-gold/20 scale-[1.01]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-black text-andina-gold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-slate-950" />}
            </button>
          );
        })}
      </div>

      {/* Next / Submit Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!markedOption || isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-andina-terracotta to-andina-gold hover:brightness-110 text-slate-950 text-base font-bold shadow-xl shadow-andina-terracotta/30 disabled:opacity-40 disabled:pointer-events-none transition-all min-h-[50px] active:scale-95"
        >
          <span>
            {currentQuestionIndex === questions.length - 1
              ? 'Calificar Evaluación'
              : 'Siguiente Pregunta'}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default QuizRunner;
