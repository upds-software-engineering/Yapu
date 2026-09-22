import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Check, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { SEED_VOCABULARIO, SEED_NIVELES } from '../data/seed-levels';
import { LocalRepository } from '../lib/storage/local-repository';
import type { PalabraVocabulario } from '../types/domain';

interface FlashcardLessonProps {
  levelId: number;
}

export const FlashcardLesson: React.FC<FlashcardLessonProps> = ({ levelId }) => {
  const [words, setWords] = useState<PalabraVocabulario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);

  useEffect(() => {
    const filtered = SEED_VOCABULARIO.filter((w) => w.id_nivel === levelId);
    setWords(filtered);
  }, [levelId]);

  const currentWord = words[currentIndex];
  const nivel = SEED_NIVELES.find((n) => n.id_nivel === levelId);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMark = (status: 'aprendido' | 'repasar') => {
    if (!currentWord) return;
    LocalRepository.markWordStatus(currentWord.id_palabra, status);
    if (status === 'aprendido') {
      setLearnedCount((prev) => prev + 1);
    }
    // Auto advance if not last
    if (currentIndex < words.length - 1) {
      setTimeout(() => handleNext(), 250);
    }
  };

  if (!currentWord) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Cargando lecciones del nivel...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Mapa</span>
        </a>

        <div className="text-center">
          <span className="text-[11px] font-bold text-andina-gold uppercase tracking-wider">
            Nivel {levelId}: {nivel?.titulo_quechua}
          </span>
          <p className="text-xs text-slate-400">
            Tarjeta {currentIndex + 1} de {words.length}
          </p>
        </div>

        <div className="w-16 text-right">
          <span className="text-xs px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20">
            {learnedCount}/{words.length}
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-andina-gold h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-80 cursor-pointer perspective-1000 select-none group"
      >
        <div
          className={`w-full h-full relative duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Anverso: Quechua */}
          <div className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#131C2E] to-[#0D1322] border-2 border-slate-700/80 group-hover:border-andina-gold/50 shadow-2xl p-6 flex flex-col justify-between backface-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-1 rounded-full bg-andina-terracotta/20 text-andina-gold font-bold uppercase tracking-wider border border-andina-terracotta/40">
                {currentWord.categoria_gramatical}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                Toca para ver traducción
              </span>
            </div>

            <div className="text-center my-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display mb-2">
                {currentWord.termino_quechua}
              </h2>
              <p className="text-sm text-andina-gold/90 font-medium">
                🗣️ Pronunciación: [{currentWord.pronunciacion_aproximada}]
              </p>
            </div>

            <div className="text-center text-xs text-slate-400 bg-slate-900/60 py-2.5 px-3 rounded-xl border border-slate-800">
              💡 {currentWord.contexto_cultural}
            </div>
          </div>

          {/* Reverso: Español & Ejemplo */}
          <div className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-andina-aguayo/60 shadow-2xl p-6 flex flex-col justify-between rotate-y-180 backface-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold uppercase tracking-wider border border-teal-500/40">
                Significado en Español
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                Girar
              </span>
            </div>

            <div className="text-center my-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-teal-300 tracking-tight mb-3">
                {currentWord.traduccion_espanol}
              </h2>
              {currentWord.ejemplo_uso && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                    Ejemplo en oración:
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5 italic">
                    "{currentWord.ejemplo_uso}"
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400">
              {currentWord.contexto_cultural}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Repasar vs Aprendida) >= 44x44px */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => handleMark('repasar')}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition-colors min-h-[48px] active:scale-95"
        >
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>Necesito Repasar</span>
        </button>

        <button
          onClick={() => handleMark('aprendido')}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-teal-900/40 transition-all min-h-[48px] active:scale-95"
        >
          <Check className="w-5 h-5" />
          <span>¡Ya me la sé!</span>
        </button>
      </div>

      {/* Nav Controls */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <a
          href={`/quiz/${levelId}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-andina-terracotta hover:bg-andina-terracotta-light text-white text-xs font-bold transition-all shadow-md shadow-andina-terracotta/30 min-h-[44px]"
        >
          <Sparkles className="w-4 h-4 text-andina-gold" />
          <span>Ir a la Evaluación IA</span>
        </a>

        <button
          onClick={handleNext}
          disabled={currentIndex === words.length - 1}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default FlashcardLesson;
