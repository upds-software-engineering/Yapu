// YAPU — Modelo de Dominio y Datos (ERD Bloque 2)

export type UserRole = 'estudiante' | 'docente' | 'admin';

export interface Usuario {
  id_usuario: string;
  nombre_completo: string;
  correo_electronico: string;
  rol_sistema: UserRole;
  estado_cuenta: 'activo' | 'suspendido' | 'pendiente';
  fecha_registro: string;
}

export interface PerfilEstudiante {
  id_estudiante: string;
  nivel_actual: number; // 1 a 10
  racha_dias: number;
  total_palabras_aprendidas: number;
  fecha_ultima_sesion: string;
  puntos_experiencia?: number;
}

export interface Nivel {
  id_nivel: number;
  titulo_quechua: string;
  titulo_espanol: string;
  descripcion: string;
  orden_secuencial: number;
  umbral_minimo_aprobacion: number; // 70%
  icono: string;
  color_acento?: string;
}

export type CategoriaGramatical = 
  | 'sustantivo' 
  | 'verbo' 
  | 'adjetivo' 
  | 'saludo' 
  | 'numero' 
  | 'pronombre' 
  | 'interrogativo';

export interface PalabraVocabulario {
  id_palabra: string;
  id_nivel: number;
  termino_quechua: string;
  traduccion_espanol: string;
  pronunciacion_aproximada: string;
  categoria_gramatical: CategoriaGramatical;
  url_imagen_webp?: string;
  contexto_cultural: string;
  ejemplo_uso?: string;
}

export interface VocabularioEstudiante {
  id_registro: string;
  id_estudiante: string;
  id_palabra: string;
  estado_aprendizaje: 'nuevo' | 'repasar' | 'aprendido';
  contador_aciertos: number;
  fecha_ultimo_repaso: string;
}

export interface OracionBase {
  id_oracion: string;
  id_nivel: number;
  texto_quechua: string;
  traduccion_espanol: string;
  palabra_clave_id: string; // Palabra a evaluar o completar
  categoria_gramatical: CategoriaGramatical;
  contexto_cultural: string;
  autor_id: string;
  validador_id?: string;
  estado_moderacion: 'aprobado' | 'pendiente' | 'rechazado';
}

export interface Evaluacion {
  id_evaluacion: string;
  id_estudiante: string;
  id_nivel: number;
  puntuacion_obtenida: number; // 0 - 100
  total_aciertos: number;
  total_preguntas: number;
  estado_aprobacion: 'aprobado' | 'reprobado';
  fecha_evaluacion: string;
  sincronizado_nube: boolean;
}

export interface DetallePregunta {
  id_pregunta: string;
  id_evaluacion?: string;
  enunciado_pregunta: string;
  tipo_pregunta: 'completar_espacio' | 'traduccion_quechua' | 'traduccion_espanol';
  opcion_correcta: string;
  distractor_1: string;
  distractor_2: string;
  distractor_3: string;
  opciones_mezcladas: string[];
  respuesta_marcada?: string;
  es_correcta?: boolean;
  explicacion_pedagogica: string;
}

export interface RetoComunitario {
  id_reto: string;
  id_estudiante: string;
  nombre_estudiante: string;
  id_docente_validador?: string;
  texto_quechua: string;
  traduccion_sugerida: string;
  pista_cultural: string;
  nivel_sugerido: number;
  estado_reto: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_creacion: string;
}
