import type {
  CategoriaGramatical,
  EstadoAprendizaje,
  TramoNivel
} from '@domain/shared/tipos';

/**
 * DTOs planos de la capa de aplicación. La UI sólo conoce estos objetos:
 * nunca entidades de dominio ni adaptadores de infraestructura.
 */

/** RF-004: palabra lista para pintar una flashcard. */
export interface PalabraDto {
  id: string;
  nivelId: number;
  termino: string;
  traduccion: string;
  pronunciacion: string;
  categoria: CategoriaGramatical;
  etiquetaCategoria: string;
  /** RF-004: imagen opcional; si falta, la UI pinta un placeholder SVG por categoría. */
  imagenUrl?: string;
  contextoCultural: string;
  ejemploUso?: string;
  estado: EstadoAprendizaje;
}

/** RF-003: estado de un nivel dentro del mapa (Miller + RN-01/RN-03). */
export type EstadoNivelDto = 'aprobado' | 'actual' | 'bloqueado';

export interface NivelDto {
  id: number;
  tituloQuechua: string;
  tituloEspanol: string;
  descripcion: string;
  icono: string;
  colorAcento: string;
  tramo: TramoNivel;
  estado: EstadoNivelDto;
  palabrasTotal: number;
  /** RN-01: sólo tiene sentido navegar si el nivel no está bloqueado. */
  accesible: boolean;
}

export interface TramoDto {
  id: TramoNivel;
  nombre: string;
  rango: string;
  descripcion: string;
  niveles: NivelDto[];
}

export interface MapaNivelesDto {
  nivelActual: number;
  cursoCompletado: boolean;
  /** RN-03: nivelesAprobados / 10 * 100 (100% al completar). */
  porcentajeGlobal: number;
  nivelesAprobados: number;
  xp: number;
  rachaDias: number;
  /** Miller: los 10 niveles agrupados en 3 tramos. */
  tramos: TramoDto[];
}

export interface LeccionDto {
  nivelId: number;
  tituloQuechua: string;
  tituloEspanol: string;
  descripcion: string;
  palabras: PalabraDto[];
  /** Apogeo-Final: la lección se abre filtrada cuando el estudiante viene de reprobar. */
  esRepaso: boolean;
  /** Palabras ya aprendidas dentro de esta lección (contador idempotente, RN-08). */
  aprendidas: number;
}

export interface ResultadoMarcarPalabraDto {
  palabraId: string;
  estado: EstadoAprendizaje;
  /** RN-05: +2 XP sólo la primera vez que la palabra pasa a `aprendido`. */
  xpGanado: number;
  palabrasAprendidas: number;
  rachaDias: number;
}

export interface EvaluacionResumenDto {
  id: string;
  nivelId: number;
  puntuacion: number;
  aciertos: number;
  totalPreguntas: number;
  aprobado: boolean;
  fecha: string;
  sincronizada: boolean;
}

export interface TableroDto {
  estudianteId: string;
  nivelActual: number;
  cursoCompletado: boolean;
  porcentajeGlobal: number;
  nivelesAprobados: number;
  xp: number;
  rachaDias: number;
  palabrasAprendidas: number;
  palabrasParaRepasar: PalabraDto[];
  historial: EvaluacionResumenDto[];
}
