/**
 * Claves de almacenamiento del adaptador persistente (`localStorage`).
 *
 * Las claves NUEVAS están versionadas (`yapu:<recurso>:v1`) para poder cambiar el formato sin
 * pisar datos antiguos ni exigir una migración destructiva (ADR-002). Las claves ANTIGUAS son
 * las que escribía el repositorio monolítico `src/lib/storage/local-repository.ts`: sólo se
 * LEEN una vez, desde `migrarClavesAntiguas`, y nunca se sobrescriben.
 */

/** Marcador de migración: vale `'1'` cuando las claves antiguas ya se procesaron. */
export const CLAVE_MIGRACION = 'yapu:migracion:v1';

/** Claves nuevas y versionadas, una por colección persistida. */
export const CLAVES_NUEVAS = {
  /** `Record<estudianteId, DatosProgreso>`: un documento por estudiante (RN-07, RN-08). */
  progreso: 'yapu:progreso:v1',
  /** `DatosEvaluacion[]` en orden de inserción: es también la cola offline FIFO (RN-15). */
  evaluaciones: 'yapu:evaluaciones:v1',
  /** `DatosOracion[]` aportadas por docentes (RF-006). */
  oraciones: 'yapu:oraciones:v1',
  /** `DatosReto[]` de la comunidad (RF-007). */
  retos: 'yapu:retos:v1'
} as const;

/** Las seis claves heredadas del repositorio anterior, tal cual se guardaban. */
export const CLAVES_ANTIGUAS = {
  perfilEstudiante: 'yapu_student_profile',
  progresoVocabulario: 'yapu_vocab_progress',
  historialEvaluaciones: 'yapu_evaluations_history',
  colaSincronizacion: 'yapu_offline_sync_queue',
  oracionesDocente: 'yapu_docente_sentences',
  retosComunitarios: 'yapu_community_challenges'
} as const;
