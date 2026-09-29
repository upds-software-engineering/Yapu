import type {
  PerfilEstudiante,
  Evaluacion,
  VocabularioEstudiante,
  OracionBase,
  RetoComunitario
} from '../../types/domain.ts';
import { SEED_VOCABULARIO, SEED_ORACIONES_BASE } from '../../data/seed-levels.ts';

const STORAGE_KEYS = {
  PROFILE: 'yapu_student_profile',
  VOCAB_PROGRESS: 'yapu_vocab_progress',
  EVALUATIONS: 'yapu_evaluations_history',
  SYNC_QUEUE: 'yapu_offline_sync_queue',
  DOCENTE_SENTENCES: 'yapu_docente_sentences',
  COMMUNITY_CHALLENGES: 'yapu_community_challenges'
};

const DEFAULT_PROFILE: PerfilEstudiante = {
  id_estudiante: 'estudiante_demo',
  nivel_actual: 1,
  racha_dias: 3,
  total_palabras_aprendidas: 6,
  fecha_ultima_sesion: new Date().toISOString(),
  puntos_experiencia: 120
};

export class LocalRepository {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // --- Perfil del Estudiante ---
  static getProfile(): PerfilEstudiante {
    if (!this.isBrowser()) return DEFAULT_PROFILE;
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!stored) {
      this.saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static saveProfile(profile: PerfilEstudiante): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  static unlockLevel(levelId: number): PerfilEstudiante {
    const profile = this.getProfile();
    if (levelId > profile.nivel_actual && levelId <= 10) {
      profile.nivel_actual = levelId;
      profile.puntos_experiencia = (profile.puntos_experiencia || 0) + 100;
      this.saveProfile(profile);
    }
    return profile;
  }

  // --- Vocabulario & Tarjetas de Estudio ---
  static getVocabProgress(): Record<string, VocabularioEstudiante> {
    if (!this.isBrowser()) return {};
    const stored = localStorage.getItem(STORAGE_KEYS.VOCAB_PROGRESS);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  static markWordStatus(wordId: string, status: 'aprendido' | 'repasar'): void {
    if (!this.isBrowser()) return;
    const progress = this.getVocabProgress();
    const existing = progress[wordId] || {
      id_registro: `reg_${wordId}`,
      id_estudiante: this.getProfile().id_estudiante,
      id_palabra: wordId,
      estado_aprendizaje: status,
      contador_aciertos: 0,
      fecha_ultimo_repaso: new Date().toISOString()
    };

    existing.estado_aprendizaje = status;
    existing.fecha_ultimo_repaso = new Date().toISOString();
    if (status === 'aprendido') {
      existing.contador_aciertos += 1;
    }

    progress[wordId] = existing;
    localStorage.setItem(STORAGE_KEYS.VOCAB_PROGRESS, JSON.stringify(progress));

    // Actualizar total aprendidas en perfil
    const totalAprendidas = Object.values(progress).filter(
      (v) => v.estado_aprendizaje === 'aprendido'
    ).length;
    const profile = this.getProfile();
    profile.total_palabras_aprendidas = totalAprendidas;
    this.saveProfile(profile);
  }

  // --- Historial de Evaluaciones y Cola Offline ---
  static saveEvaluation(evaluacion: Evaluacion): void {
    if (!this.isBrowser()) return;
    const evals = this.getEvaluations();
    evals.unshift(evaluacion);
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evals));

    // Agregar a la cola de sincronización offline (RF-009)
    if (!navigator.onLine) {
      this.enqueueOfflineSync(evaluacion);
    }
  }

  static getEvaluations(): Evaluacion[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static enqueueOfflineSync(evaluacion: Evaluacion): void {
    if (!this.isBrowser()) return;
    const queue = this.getOfflineQueue();
    queue.push(evaluacion);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  static getOfflineQueue(): Evaluacion[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static clearOfflineQueue(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  }

  // --- Oraciones de Docente & Semillas ---
  static getDocenteSentences(): OracionBase[] {
    if (!this.isBrowser()) return SEED_ORACIONES_BASE;
    const stored = localStorage.getItem(STORAGE_KEYS.DOCENTE_SENTENCES);
    if (!stored) {
      return SEED_ORACIONES_BASE;
    }
    try {
      const custom = JSON.parse(stored);
      return [...SEED_ORACIONES_BASE, ...custom];
    } catch {
      return SEED_ORACIONES_BASE;
    }
  }

  static addDocenteSentence(sentence: OracionBase): void {
    if (!this.isBrowser()) return;
    const stored = localStorage.getItem(STORAGE_KEYS.DOCENTE_SENTENCES);
    const list: OracionBase[] = stored ? JSON.parse(stored) : [];
    list.push(sentence);
    localStorage.setItem(STORAGE_KEYS.DOCENTE_SENTENCES, JSON.stringify(list));
  }

  // --- Retos Comunitarios (RF-007) ---
  static getCommunityChallenges(): RetoComunitario[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.COMMUNITY_CHALLENGES);
    if (!stored) {
      const initial: RetoComunitario[] = [
        {
          id_reto: 'reto_1',
          id_estudiante: 'est_maria',
          nombre_estudiante: 'María Condori',
          texto_quechua: 'Munakuywan wayk\'usqa mikhunaqa allin sumaqmi.',
          traduccion_sugerida: 'La comida cocinada con amor es sumamente buena.',
          pista_cultural: 'Cultura culinaria andina y la intención del cocinero.',
          nivel_sugerido: 6,
          estado_reto: 'aprobado',
          fecha_creacion: '2026-09-18'
        },
        {
          id_reto: 'reto_2',
          id_estudiante: 'est_carlos',
          nombre_estudiante: 'Carlos Mamani',
          texto_quechua: 'Ch\'askakunaqa ñankunata tutapi k\'ancharichinku.',
          traduccion_sugerida: 'Las estrellas iluminan los caminos durante la noche.',
          pista_cultural: 'Astronomía andina de los pastores.',
          nivel_sugerido: 10,
          estado_reto: 'aprobado',
          fecha_creacion: '2026-09-19'
        }
      ];
      this.saveCommunityChallenges(initial);
      return initial;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static saveCommunityChallenges(challenges: RetoComunitario[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_CHALLENGES, JSON.stringify(challenges));
  }

  static addCommunityChallenge(challenge: RetoComunitario): void {
    const list = this.getCommunityChallenges();
    list.unshift(challenge);
    this.saveCommunityChallenges(list);
  }

  static updateChallengeStatus(challengeId: string, status: 'aprobado' | 'rechazado'): void {
    const list = this.getCommunityChallenges();
    const target = list.find((c) => c.id_reto === challengeId);
    if (target) {
      target.estado_reto = status;
      this.saveCommunityChallenges(list);
    }
  }
}
