import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  BookOpen, 
  Award, 
  Clock, 
  HelpCircle,
  Compass
} from 'lucide-react';
import { LocalRepository } from '../lib/storage/local-repository';
import { SEED_VOCABULARIO, SEED_NIVELES } from '../data/seed-levels';
import type { PerfilEstudiante, Evaluacion, VocabularioEstudiante } from '../types/domain';

export const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<PerfilEstudiante | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluacion[]>([]);
  const [vocabProgress, setVocabProgress] = useState<Record<string, VocabularioEstudiante>>({});

  useEffect(() => {
    setProfile(LocalRepository.getProfile());
    setEvaluations(LocalRepository.getEvaluations());
    setVocabProgress(LocalRepository.getVocabProgress());
  }, []);

  const wordsNeedingReview = Object.values(vocabProgress)
    .filter((v) => v.estado_aprendizaje === 'repasar')
    .map((v) => SEED_VOCABULARIO.find((w) => w.id_palabra === v.id_palabra))
    .filter(Boolean);

  const currentLevel = profile?.nivel_actual || 1;
  const totalLevels = 10;
  const progressPercent = Math.round(((currentLevel - 1) / totalLevels) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-andina-night-card to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-andina-gold">
              Tablero del Estudiante (RF-008)
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display mt-1">
              Allianllachu, Yachaq!
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Mantén tu constancia diaria en el aprendizaje de runasimi y revisa tus estadísticas pedagógicas.
            </p>
          </div>

          <a
            href="/"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-andina-terracotta to-andina-gold text-slate-950 font-bold text-xs shadow-lg shadow-andina-terracotta/30 min-h-[44px]"
          >
            <Compass className="w-4 h-4" />
            <span>Continuar Nivel {currentLevel}</span>
          </a>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-andina-night-card border border-amber-500/30 text-left">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
            <Flame className="w-4 h-4 fill-amber-500" />
          </div>
          <span className="text-2xl font-black text-white font-display">
            {profile?.racha_dias || 3}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Días de Racha</p>
        </div>

        <div className="p-4 rounded-2xl bg-andina-night-card border border-teal-500/30 text-left">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-display">
            {profile?.total_palabras_aprendidas || 6}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Palabras Aprendidas</p>
        </div>

        <div className="p-4 rounded-2xl bg-andina-night-card border border-sky-500/30 text-left">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-display">
            {progressPercent}%
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Avance Curricular</p>
        </div>

        <div className="p-4 rounded-2xl bg-andina-night-card border border-rose-500/30 text-left">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-display">
            {wordsNeedingReview.length}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Para Repaso</p>
        </div>
      </div>

      {/* Words Needing Review (RF-004 Repaso) */}
      {wordsNeedingReview.length > 0 && (
        <div className="p-6 rounded-3xl bg-andina-night-card border border-amber-500/30 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Palabras en Lista de Repaso</h2>
            </div>
            <span className="text-xs text-amber-400 font-semibold">
              {wordsNeedingReview.length} por reforzar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wordsNeedingReview.map((word) => (
              <div
                key={word?.id_palabra}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-andina-gold text-sm">
                    {word?.termino_quechua}
                  </span>
                  <p className="text-xs text-slate-300">
                    {word?.traduccion_espanol}
                  </p>
                </div>
                <a
                  href={`/lesson/${word?.id_nivel}`}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                >
                  Repasar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation History */}
      <div className="p-6 rounded-3xl bg-andina-night-card border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">Historial de Evaluaciones IA</h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {evaluations.length} realizadas
          </span>
        </div>

        {evaluations.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            Aún no has completado evaluaciones. Ingresa a un nivel y pon a prueba tu runasimi.
          </p>
        ) : (
          <div className="space-y-2.5">
            {evaluations.slice(0, 5).map((ev) => (
              <div
                key={ev.id_evaluacion}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    ev.estado_aprobacion === 'aprobado'
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {ev.puntuacion_obtenida}%
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      Nivel {ev.id_nivel}: {SEED_NIVELES.find(n => n.id_nivel === ev.id_nivel)?.titulo_quechua}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {ev.total_aciertos} de {ev.total_preguntas} aciertos • {new Date(ev.fecha_evaluacion).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  ev.estado_aprobacion === 'aprobado'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {ev.estado_aprobacion}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
