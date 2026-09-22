import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Download, 
  AlertCircle
} from 'lucide-react';
import { LocalRepository } from '../lib/storage/local-repository';
import { SEED_NIVELES, SEED_VOCABULARIO } from '../data/seed-levels';
import type { OracionBase, RetoComunitario, CategoriaGramatical } from '../types/domain';

export const DocentePanel: React.FC = () => {
  const [sentences, setSentences] = useState<OracionBase[]>([]);
  const [challenges, setChallenges] = useState<RetoComunitario[]>([]);
  const [activeTab, setActiveTab] = useState<'oraciones' | 'retos' | 'exportar'>('oraciones');

  // Form State
  const [nivelId, setNivelId] = useState<number>(1);
  const [textoQuechua, setTextoQuechua] = useState('');
  const [traduccionEspanol, setTraduccionEspanol] = useState('');
  const [palabraClaveId, setPalabraClaveId] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGramatical>('sustantivo');
  const [contextoCultural, setContextoCultural] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setSentences(LocalRepository.getDocenteSentences());
    setChallenges(LocalRepository.getCommunityChallenges());
  }, []);

  const handleCreateSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoQuechua || !traduccionEspanol) return;

    const newSentence: OracionBase = {
      id_oracion: `ora_doc_${Date.now()}`,
      id_nivel: Number(nivelId),
      texto_quechua: textoQuechua,
      traduccion_espanol: traduccionEspanol,
      palabra_clave_id: palabraClaveId || 'voc_1_1',
      categoria_gramatical: categoria,
      contexto_cultural: contextoCultural || 'Validado por docente de lengua originaria.',
      autor_id: 'docente_activo',
      validador_id: 'docente_activo',
      estado_moderacion: 'aprobado'
    };

    LocalRepository.addDocenteSentence(newSentence);
    setSentences(LocalRepository.getDocenteSentences());
    setTextoQuechua('');
    setTraduccionEspanol('');
    setContextoCultural('');
    setSuccessMsg('¡Oración base registrada y lista para alimentar el motor de IA determinista!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleModerateChallenge = (challengeId: string, status: 'aprobado' | 'rechazado') => {
    LocalRepository.updateChallengeStatus(challengeId, status);
    setChallenges(LocalRepository.getCommunityChallenges());
  };

  const exportCorpusCSV = () => {
    const header = 'ID,Nivel,Texto Quechua,Traducción Español,Categoría Gramatical,Contexto Cultural\n';
    const rows = sentences.map((s) => 
      `"${s.id_oracion}",${s.id_nivel},"${s.texto_quechua}","${s.traduccion_espanol}","${s.categoria_gramatical}","${s.contexto_cultural.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yapu_corpus_quechua_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availableVocab = SEED_VOCABULARIO.filter((v) => v.id_nivel === Number(nivelId));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#182235] to-slate-900 border border-slate-800 shadow-2xl mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-andina-terracotta/20 text-andina-gold border border-andina-terracotta/40 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              Panel de Gestión Docente (RF-006 / RF-007)
            </h1>
            <p className="text-xs text-slate-400">
              Administración de oraciones base para el motor de IA y moderación comunitaria.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('oraciones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'oraciones'
                ? 'bg-andina-terracotta text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Oraciones Base ({sentences.length})
          </button>
          <button
            onClick={() => setActiveTab('retos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'retos'
                ? 'bg-andina-terracotta text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Moderación de Retos ({challenges.filter(c => c.estado_reto === 'pendiente').length} pendientes)
          </button>
          <button
            onClick={() => setActiveTab('exportar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'exportar'
                ? 'bg-andina-terracotta text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Datos Abiertos (RS-004)
          </button>
        </div>
      </div>

      {/* Tab: Oraciones Base */}
      {activeTab === 'oraciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-andina-night-card border border-slate-800 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-andina-gold" />
              Nueva Oración Base
            </h2>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateSentence} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nivel Asociado</label>
                <select
                  value={nivelId}
                  onChange={(e) => setNivelId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  {SEED_NIVELES.map((n) => (
                    <option key={n.id_nivel} value={n.id_nivel}>
                      Nivel {n.id_nivel}: {n.titulo_quechua}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Texto en Quechua</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mamayqa sumaq mut'ita wayk'un."
                  value={textoQuechua}
                  onChange={(e) => setTextoQuechua(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Traducción al Español</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mi madre cocina un mote delicioso."
                  value={traduccionEspanol}
                  onChange={(e) => setTraduccionEspanol(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Categoría Gramatical</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaGramatical)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="sustantivo">Sustantivo</option>
                  <option value="verbo">Verbo</option>
                  <option value="adjetivo">Adjetivo</option>
                  <option value="saludo">Saludo</option>
                  <option value="numero">Número</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contexto Cultural</label>
                <textarea
                  rows={2}
                  placeholder="Explicación del uso o valor cultural andino..."
                  value={contextoCultural}
                  onChange={(e) => setContextoCultural(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-andina-terracotta hover:bg-andina-terracotta-light text-white font-bold transition-all shadow-md shadow-andina-terracotta/30 active:scale-95"
              >
                Guardar Oración
              </button>
            </form>
          </div>

          {/* List of Sentences */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-base font-bold text-white mb-2">
              Oraciones Validadas en la Plataforma
            </h2>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {sentences.map((sentence) => (
                <div
                  key={sentence.id_oracion}
                  className="p-4 rounded-2xl bg-andina-night-card border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-andina-gold/15 text-andina-gold border border-andina-gold/30">
                      Nivel {sentence.id_nivel} • {sentence.categoria_gramatical}
                    </span>
                    <span className="text-[11px] text-teal-400 font-medium">
                      ✓ Validado por docente
                    </span>
                  </div>

                  <p className="text-sm font-bold text-white mt-1">
                    {sentence.texto_quechua}
                  </p>
                  <p className="text-slate-300 italic mt-0.5">
                    "{sentence.traduccion_espanol}"
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    💡 {sentence.contexto_cultural}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Moderación de Retos Comunitarios */}
      {activeTab === 'retos' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              Los estudiantes de nivel 7+ pueden proponer nuevos retos en lengua originaria. Cada reto debe ser moderado por un docente antes de publicarse en la comunidad (RF-007, RS-003).
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id_reto}
                className="p-5 rounded-3xl bg-andina-night-card border border-slate-800 shadow-xl text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">
                      Estudiante: {challenge.nombre_estudiante}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      challenge.estado_reto === 'aprobado'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : challenge.estado_reto === 'rechazado'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {challenge.estado_reto}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-andina-gold mt-2">
                    {challenge.texto_quechua}
                  </p>
                  <p className="text-slate-300 mt-1">
                    Traducción propuesta: "{challenge.traduccion_sugerida}"
                  </p>
                  <p className="text-slate-400 text-[11px] mt-2 italic">
                    Pista cultural: {challenge.pista_cultural}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleModerateChallenge(challenge.id_reto, 'rechazado')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>

                  <button
                    onClick={() => handleModerateChallenge(challenge.id_reto, 'aprobado')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-md shadow-teal-900/30"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Aprobar Reto</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Exportación de Datos Abiertos RS-004 */}
      {activeTab === 'exportar' && (
        <div className="p-6 rounded-3xl bg-andina-night-card border border-slate-800 shadow-xl text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white font-display">
            Exportar Corpus Lingüístico Quechua
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Cumplimiento del requisito de sostenibilidad <strong>RS-004 (Datos Abiertos y Transparencia)</strong>. Permite descargar todas las oraciones validadas y categorizaciones en formato CSV abierto sin datos personales.
          </p>

          <button
            onClick={exportCorpusCSV}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-110 text-white text-sm font-bold shadow-xl shadow-teal-950/50 mx-auto min-h-[48px] active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Descargar Corpus en CSV (.csv)</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default DocentePanel;
