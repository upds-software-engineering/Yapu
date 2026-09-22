import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  BookOpen
} from 'lucide-react';
import { SEED_NIVELES } from '../data/seed-levels';
import { LocalRepository } from '../lib/storage/local-repository';
import type { PerfilEstudiante } from '../types/domain';

export const LevelMap: React.FC = () => {
  const [profile, setProfile] = useState<PerfilEstudiante | null>(null);

  useEffect(() => {
    setProfile(LocalRepository.getProfile());
  }, []);

  const currentLevel = profile?.nivel_actual || 1;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header Info Banner */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-andina-night-card to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-andina-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-andina-gold font-bold">
              Camino de Aprendizaje A1
            </span>
            <h2 className="text-2xl font-bold font-display text-white mt-0.5">
              Nivel {currentLevel} de 10
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Completa cada evaluación con al menos 70% para desbloquear el siguiente nivel.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-right">
              <span className="text-2xl font-black text-andina-gold font-display">
                {Math.round(((currentLevel - 1) / 10) * 100)}%
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Progreso Global</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800/80 h-2.5 rounded-full mt-4 overflow-hidden p-0.5 border border-slate-700/50">
          <div 
            className="bg-gradient-to-r from-andina-terracotta via-andina-gold to-andina-aguayo h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(5, ((currentLevel - 1) / 10) * 100)}%` }}
          />
        </div>
      </div>

      {/* Levels Path */}
      <div className="space-y-4 relative">
        {/* Subtle connector line */}
        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-800 -z-0" />

        {SEED_NIVELES.map((nivel) => {
          const isCompleted = nivel.id_nivel < currentLevel;
          const isCurrent = nivel.id_nivel === currentLevel;
          const isLocked = nivel.id_nivel > currentLevel;

          return (
            <div
              key={nivel.id_nivel}
              className={`relative z-10 rounded-2xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-gradient-to-br from-[#182235] to-[#121928] border-2 border-andina-gold/70 shadow-xl shadow-andina-gold/10 scale-[1.02]'
                  : isCompleted
                  ? 'bg-andina-night-card/80 border border-teal-500/30 hover:border-teal-500/50'
                  : 'bg-slate-900/50 border border-slate-800/60 opacity-60'
              }`}
            >
              <div className="p-4 sm:p-5 flex items-start gap-4">
                {/* Number / Status Node */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg shrink-0 transition-transform ${
                    isCurrent
                      ? 'bg-gradient-to-br from-andina-gold to-andina-terracotta text-black shadow-lg shadow-andina-gold/30 animate-pulse-slow'
                      : isCompleted
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-teal-400" />
                  ) : isLocked ? (
                    <Lock className="w-5 h-5 text-slate-500" />
                  ) : (
                    <span>{nivel.id_nivel}</span>
                  )}
                </div>

                {/* Level Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-white tracking-tight">
                      {nivel.titulo_quechua}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                      {nivel.titulo_espanol}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-andina-gold/20 text-andina-gold border border-andina-gold/40">
                        Nivel Activo
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {nivel.descripcion}
                  </p>

                  {/* Actions (Only for unlocked levels) */}
                  {!isLocked && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <a
                        href={`/lesson/${nivel.id_nivel}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 min-h-[44px]"
                      >
                        <BookOpen className="w-4 h-4 text-andina-aguayo" />
                        <span>Estudiar Tarjetas</span>
                      </a>

                      <a
                        href={`/quiz/${nivel.id_nivel}`}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                          isCurrent
                            ? 'bg-gradient-to-r from-andina-terracotta to-andina-gold text-slate-950 hover:brightness-110 shadow-md shadow-andina-terracotta/30'
                            : 'bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 border border-teal-500/30'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isCompleted ? 'Repetir Examen IA' : 'Evaluación IA'}</span>
                      </a>
                    </div>
                  )}

                  {/* Locked indicator */}
                  {isLocked && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Desbloquea aprobando el nivel {nivel.id_nivel - 1}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default LevelMap;
