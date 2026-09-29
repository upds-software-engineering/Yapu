/** Tipos base compartidos por todas las capas del dominio. */

export const CATEGORIAS_GRAMATICALES = [
  'sustantivo',
  'verbo',
  'adjetivo',
  'saludo',
  'numero',
  'pronombre',
  'interrogativo'
] as const;

export type CategoriaGramatical = (typeof CATEGORIAS_GRAMATICALES)[number];

export const ETIQUETAS_CATEGORIA: Record<CategoriaGramatical, string> = {
  sustantivo: 'Sustantivo',
  verbo: 'Verbo',
  adjetivo: 'Adjetivo',
  saludo: 'Saludo',
  numero: 'Número',
  pronombre: 'Pronombre',
  interrogativo: 'Interrogativo'
};

/** RN-09 / RN-10: los tres formatos de pregunta del motor determinista. */
export const TIPOS_PREGUNTA = [
  'completar_espacio',
  'traduccion_quechua',
  'traduccion_espanol'
] as const;

export type TipoPregunta = (typeof TIPOS_PREGUNTA)[number];

export const ETIQUETAS_TIPO_PREGUNTA: Record<TipoPregunta, string> = {
  completar_espacio: 'Completar la oración',
  traduccion_quechua: 'Quechua → Español',
  traduccion_espanol: 'Español → Quechua'
};

/** RF-001/002 simulado: los roles que la sesión local puede adoptar. */
export type RolUsuario = 'estudiante' | 'docente';

/** RN-08: estados de aprendizaje de una palabra para un estudiante. */
export type EstadoAprendizaje = 'nuevo' | 'repasar' | 'aprendido';

/** RN-12 / RN-13: estados de moderación de contenido aportado por la comunidad. */
export type EstadoModeracion = 'pendiente' | 'aprobado' | 'rechazado';

/** Miller: los 10 niveles se agrupan en 3 tramos pedagógicos. */
export type TramoNivel = 'fundamentos' | 'vida-cotidiana' | 'cosmovision';

export interface DescripcionTramo {
  id: TramoNivel;
  nombre: string;
  rango: string;
  descripcion: string;
}

export const TRAMOS: readonly DescripcionTramo[] = [
  {
    id: 'fundamentos',
    nombre: 'Fundamentos',
    rango: 'Niveles 1–3',
    descripcion: 'Saludos, familia y números: la base para sostener una conversación breve.'
  },
  {
    id: 'vida-cotidiana',
    nombre: 'Vida cotidiana',
    rango: 'Niveles 4–7',
    descripcion: 'Colores, animales, alimentos y el mundo del trabajo comunal.'
  },
  {
    id: 'cosmovision',
    nombre: 'Cosmovisión',
    rango: 'Niveles 8–10',
    descripcion: 'Tiempo, territorio y pensamiento andino en runasimi.'
  }
];

/** Miller: tramo al que pertenece un nivel (1–3 / 4–7 / 8–10). */
export function tramoDeNivel(nivel: number): TramoNivel {
  if (nivel <= 3) return 'fundamentos';
  if (nivel <= 7) return 'vida-cotidiana';
  return 'cosmovision';
}
