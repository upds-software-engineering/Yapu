import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  Send, 
  Lock, 
  Award, 
  CheckCircle2, 
  MessageSquare
} from 'lucide-react';
import { LocalRepository } from '../lib/storage/local-repository';
import type { RetoComunitario, PerfilEstudiante } from '../types/domain';

export const CommunitySection: React.FC = () => {
  const [challenges, setChallenges] = useState<RetoComunitario[]>([]);
  const [profile, setProfile] = useState<PerfilEstudiante | null>(null);
  
  // Submission Form
  const [textoQuechua, setTextoQuechua] = useState('');
  const [traduccion, setTraduccion] = useState('');
  const [pista, setPista] = useState('');
  const [nivelSugerido, setNivelSugerido] = useState(7);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setChallenges(LocalRepository.getCommunityChallenges());
    setProfile(LocalRepository.getProfile());
  }, []);

  const currentLevel = profile?.nivel_actual || 1;
  const canSubmit = currentLevel >= 7;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoQuechua || !traduccion) return;

    const newChallenge: RetoComunitario = {
      id_reto: `reto_${Date.now()}`,
      id_estudiante: profile?.id_estudiante || 'estudiante_demo',
      nombre_estudiante: 'Estudiante Yapu',
      texto_quechua: textoQuechua,
      traduccion_sugerida: traduccion,
      pista_cultural: pista || 'Aporte de la comunidad de estudiantes.',
      nivel_sugerido: Number(nivelSugerido),
      estado_reto: 'pendiente',
      fecha_creacion: new Date().toISOString().split('T')[0]
    };

    LocalRepository.addCommunityChallenge(newChallenge);
    setChallenges(LocalRepository.getCommunityChallenges());
    setTextoQuechua('');
    setTraduccion('');
    setPista('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const approvedChallenges = challenges.filter((c) => c.estado_reto === 'aprobado');

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-andina-night-card to-slate-900 border border-slate-800 shadow-2xl mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-andina-gold">
              Ayllu Virtual (RF-007)
            </span>
            <h1 className="text-2xl font-bold text-white font-display">
              Retos de la Comunidad
            </h1>
            <p className="text-xs text-slate-400">
              Aprende con redacciones y retos creados por compañeros y validados por docentes.
            </p>
          </div>
        </div>
      </div>

      {/* Form or Lock message for Level 7+ */}
      <div className="mb-8 p-6 rounded-3xl bg-andina-night-card border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-andina-gold" />
            Publicar un Reto Lingüístico
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
            Requiere Nivel 7+
          </span>
        </div>

        {canSubmit ? (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {submitted && (
              <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-medium">
                ¡Tu reto ha sido enviado a la cola de moderación docente! Una vez aprobado será visible para todos.
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Oración o Frase en Runasimi
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Munaspaqa tukuy imata yachankiman."
                value={textoQuechua}
                onChange={(e) => setTextoQuechua(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Traducción Sugerida al Español
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Si quieres, puedes aprender todo."
                value={traduccion}
                onChange={(e) => setTraduccion(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Pista o Contexto Cultural
              </label>
              <input
                type="text"
                placeholder="Ej: Dicho popular de aliento andino."
                value={pista}
                onChange={(e) => setPista(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-andina-terracotta to-andina-gold hover:brightness-110 text-slate-950 font-bold shadow-md shadow-andina-terracotta/30 min-h-[44px] active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Revisión Docente</span>
            </button>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
            <Lock className="w-6 h-6 text-andina-gold shrink-0" />
            <div>
              <p className="font-semibold text-slate-300">
                Funcionalidad reservada para estudiantes avanzados (Nivel 7+)
              </p>
              <p className="text-[11px] mt-0.5">
                Te encuentras en el Nivel {currentLevel}. Completa las lecciones y evaluaciones previas para desbloquear la creación comunitaria.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Community Feed */}
      <div>
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-400" />
          Retos Aprobados por la Comunidad ({approvedChallenges.length})
        </h2>

        <div className="space-y-3">
          {approvedChallenges.map((challenge) => (
            <div
              key={challenge.id_reto}
              className="p-5 rounded-3xl bg-andina-night-card border border-slate-800 text-xs shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300">
                  Aporte de: <strong className="text-white">{challenge.nombre_estudiante}</strong>
                </span>
                <span className="text-[10px] text-teal-400 font-semibold px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  Nivel {challenge.nivel_sugerido} • Validado
                </span>
              </div>

              <h3 className="text-base font-black text-andina-gold mt-1 font-display">
                "{challenge.texto_quechua}"
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                Traducción: {challenge.traduccion_sugerida}
              </p>
              <p className="text-slate-500 mt-2 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                💡 {challenge.pista_cultural}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default CommunitySection;
