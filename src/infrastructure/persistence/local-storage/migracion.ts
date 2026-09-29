import type { DatosProgreso, RegistroPalabra } from '@domain/aprendizaje/ProgresoEstudiante';
import type { DatosOracion } from '@domain/contenido/OracionBase';
import type { DatosReto } from '@domain/contenido/RetoComunitario';
import type { DatosEvaluacion } from '@domain/evaluacion/Evaluacion';
import type { EstadoAprendizaje, EstadoModeracion } from '@domain/shared/tipos';
import { NivelId, Puntuacion } from '@domain/value-objects';
import { CLAVES_ANTIGUAS, CLAVES_NUEVAS, CLAVE_MIGRACION } from './claves';
import {
  esCategoriaGramatical,
  esEstadoAprendizaje,
  esEstadoModeracion,
  escribirCrudo,
  escribirJson,
  esquemaEvaluaciones,
  esquemaOraciones,
  esquemaProgresos,
  esquemaRetos,
  leerCrudo,
  leerJson,
  type Almacen
} from './esquema';

/**
 * ADR-002: migración de los datos del repositorio monolítico anterior (`yapu_*`) al formato
 * nuevo, versionado y validado con Zod (`yapu:*:v1`).
 *
 * Garantías:
 *  - **idempotente**: el marcador `yapu:migracion:v1` corta la segunda ejecución (devuelve 0);
 *  - **no destructiva**: si la clave nueva ya tiene contenido, NO se sobrescribe; las claves
 *    antiguas se conservan intactas por si hay que volver atrás;
 *  - **tolerante**: cualquier JSON corrupto o forma inesperada se ignora sin lanzar.
 *
 * Devuelve el número de agregados migrados (progreso, evaluaciones, oraciones y retos).
 */

/** Estudiante que asumía el repositorio antiguo cuando no había perfil guardado. */
const ESTUDIANTE_POR_DEFECTO = 'estudiante_demo';

/** Tope defensivo para contadores heredados: nunca se escribe un número no finito. */
const MAXIMO_CONTADOR = Number.MAX_SAFE_INTEGER;

/**
 * Migra las claves antiguas. Es seguro llamarla en cada arranque: la segunda vez no hace nada.
 */
export function migrarClavesAntiguas(almacen: Almacen): number {
  if (leerCrudo(almacen, CLAVE_MIGRACION) === '1') return 0;

  const migrados =
    migrarProgreso(almacen) +
    migrarEvaluaciones(almacen) +
    migrarOraciones(almacen) +
    migrarRetos(almacen);

  escribirCrudo(almacen, CLAVE_MIGRACION, '1');
  return migrados;
}

// ---------------------------------------------------------------------------
// Progreso (perfil + vocabulario)
// ---------------------------------------------------------------------------

function migrarProgreso(almacen: Almacen): number {
  const perfil = leerObjeto(almacen, CLAVES_ANTIGUAS.perfilEstudiante);
  const vocabulario = leerObjeto(almacen, CLAVES_ANTIGUAS.progresoVocabulario);
  if (perfil === null && vocabulario === null) return 0;

  const progresos = leerJson<Record<string, DatosProgreso>>(
    almacen,
    CLAVES_NUEVAS.progreso,
    esquemaProgresos,
    {}
  );
  if (Object.keys(progresos).length > 0) return 0;

  const estudianteId =
    texto(perfil?.['id_estudiante']) ?? primerEstudiante(vocabulario) ?? ESTUDIANTE_POR_DEFECTO;
  const nivelActual = entero(
    perfil?.['nivel_actual'],
    NivelId.PRIMERO,
    NivelId.ULTIMO,
    NivelId.PRIMERO
  );

  progresos[estudianteId] = {
    estudianteId,
    nivelActual,
    cursoCompletado: nivelActual === NivelId.ULTIMO,
    xp: entero(perfil?.['puntos_experiencia'], 0, MAXIMO_CONTADOR, 0),
    rachaDias: entero(perfil?.['racha_dias'], 0, MAXIMO_CONTADOR, 0),
    fechaUltimaActividad: parteDeFecha(perfil?.['fecha_ultima_sesion']),
    nivelesAprobados: nivelesAprobadosHasta(nivelActual),
    palabras: migrarPalabras(vocabulario)
  };

  escribirJson(almacen, CLAVES_NUEVAS.progreso, progresos);
  return 1;
}

/** El vocabulario antiguo se guardaba como `Record<idPalabra, VocabularioEstudiante>`. */
function migrarPalabras(
  vocabulario: Record<string, unknown> | null
): Record<string, RegistroPalabra> {
  const palabras: Record<string, RegistroPalabra> = {};
  if (vocabulario === null) return palabras;

  for (const [clave, valor] of Object.entries(vocabulario)) {
    const registro = objeto(valor);
    if (registro === null) continue;

    const palabraId = texto(registro['id_palabra']) ?? texto(clave);
    if (palabraId === null) continue;

    palabras[palabraId] = {
      palabraId,
      estado: estadoAprendizaje(registro['estado_aprendizaje']),
      contadorAciertos: entero(registro['contador_aciertos'], 0, MAXIMO_CONTADOR, 0),
      fechaUltimoRepaso: fechaDeRepaso(registro['fecha_ultimo_repaso'])
    };
  }
  return palabras;
}

/** `nivelesAprobados` = 1..nivelActual-1: el curso es una cadena sin saltos (RN-02). */
function nivelesAprobadosHasta(nivelActual: number): number[] {
  return Array.from({ length: nivelActual - NivelId.PRIMERO }, (_, indice) => indice + 1);
}

function primerEstudiante(vocabulario: Record<string, unknown> | null): string | null {
  if (vocabulario === null) return null;
  for (const valor of Object.values(vocabulario)) {
    const registro = objeto(valor);
    if (registro === null) continue;
    const id = texto(registro['id_estudiante']);
    if (id !== null) return id;
  }
  return null;
}

function estadoAprendizaje(valor: unknown): EstadoAprendizaje {
  return esEstadoAprendizaje(valor) ? valor : 'nuevo';
}

function fechaDeRepaso(valor: unknown): string {
  return parteDeFecha(valor) ?? texto(valor) ?? '';
}

// ---------------------------------------------------------------------------
// Evaluaciones (historial + cola offline)
// ---------------------------------------------------------------------------

function migrarEvaluaciones(almacen: Almacen): number {
  const historial = leerArreglo(almacen, CLAVES_ANTIGUAS.historialEvaluaciones);
  const cola = leerArreglo(almacen, CLAVES_ANTIGUAS.colaSincronizacion);
  if (historial.length === 0 && cola.length === 0) return 0;

  const existentes = leerJson<DatosEvaluacion[]>(
    almacen,
    CLAVES_NUEVAS.evaluaciones,
    esquemaEvaluaciones,
    []
  );
  if (existentes.length > 0) return 0;

  // Unión por `id_evaluacion`: la cola offline repite evaluaciones del historial (RF-009).
  const porId = new Map<string, DatosEvaluacion>();
  for (const item of [...historial, ...cola]) {
    const evaluacion = convertirEvaluacion(item);
    if (evaluacion === null || porId.has(evaluacion.id)) continue;
    porId.set(evaluacion.id, evaluacion);
  }

  const unificadas = [...porId.values()];
  if (unificadas.length === 0) return 0;

  escribirJson(almacen, CLAVES_NUEVAS.evaluaciones, unificadas);
  return unificadas.length;
}

function convertirEvaluacion(item: unknown): DatosEvaluacion | null {
  const registro = objeto(item);
  if (registro === null) return null;

  const id = texto(registro['id_evaluacion']);
  if (id === null) return null;

  return {
    id,
    estudianteId: texto(registro['id_estudiante']) ?? '',
    nivelId: entero(registro['id_nivel'], NivelId.PRIMERO, NivelId.ULTIMO, NivelId.PRIMERO),
    puntuacion: puntuacion(registro['puntuacion_obtenida']),
    aciertos: entero(registro['total_aciertos'], 0, MAXIMO_CONTADOR, 0),
    totalPreguntas: entero(registro['total_preguntas'], 0, MAXIMO_CONTADOR, 0),
    aprobado: registro['estado_aprobacion'] === 'aprobado',
    fecha: texto(registro['fecha_evaluacion']) ?? '',
    sincronizada: registro['sincronizado_nube'] === true
  };
}

// ---------------------------------------------------------------------------
// Oraciones del docente
// ---------------------------------------------------------------------------

function migrarOraciones(almacen: Almacen): number {
  const antiguas = leerArreglo(almacen, CLAVES_ANTIGUAS.oracionesDocente);
  if (antiguas.length === 0) return 0;

  const existentes = leerJson<DatosOracion[]>(
    almacen,
    CLAVES_NUEVAS.oraciones,
    esquemaOraciones,
    []
  );
  if (existentes.length > 0) return 0;

  // El formato antiguo no guardaba la fecha de alta: se sella con el día de la migración.
  const fechaCreacion = fechaDeHoy();
  const migradas = new Map<string, DatosOracion>();
  for (const item of antiguas) {
    const oracion = convertirOracion(item, fechaCreacion);
    if (oracion !== null && !migradas.has(oracion.id)) migradas.set(oracion.id, oracion);
  }
  if (migradas.size === 0) return 0;

  escribirJson(almacen, CLAVES_NUEVAS.oraciones, [...migradas.values()]);
  return migradas.size;
}

function convertirOracion(item: unknown, fechaCreacion: string): DatosOracion | null {
  const registro = objeto(item);
  if (registro === null) return null;

  const id = texto(registro['id_oracion']);
  if (id === null) return null;

  return {
    id,
    nivelId: entero(registro['id_nivel'], NivelId.PRIMERO, NivelId.ULTIMO, NivelId.PRIMERO),
    textoQuechua: texto(registro['texto_quechua']) ?? '',
    traduccionEspanol: texto(registro['traduccion_espanol']) ?? '',
    palabraClaveId: texto(registro['palabra_clave_id']) ?? '',
    categoria: esCategoriaGramatical(registro['categoria_gramatical'])
      ? registro['categoria_gramatical']
      : 'sustantivo',
    contextoCultural: texto(registro['contexto_cultural']) ?? '',
    autorId: texto(registro['autor_id']) ?? '',
    estado: estadoModeracion(registro['estado_moderacion']),
    fechaCreacion
  };
}

// ---------------------------------------------------------------------------
// Retos comunitarios
// ---------------------------------------------------------------------------

function migrarRetos(almacen: Almacen): number {
  const antiguos = leerArreglo(almacen, CLAVES_ANTIGUAS.retosComunitarios);
  if (antiguos.length === 0) return 0;

  const existentes = leerJson<DatosReto[]>(almacen, CLAVES_NUEVAS.retos, esquemaRetos, []);
  if (existentes.length > 0) return 0;

  const migrados = new Map<string, DatosReto>();
  for (const item of antiguos) {
    const reto = convertirReto(item);
    if (reto !== null && !migrados.has(reto.id)) migrados.set(reto.id, reto);
  }
  if (migrados.size === 0) return 0;

  escribirJson(almacen, CLAVES_NUEVAS.retos, [...migrados.values()]);
  return migrados.size;
}

function convertirReto(item: unknown): DatosReto | null {
  const registro = objeto(item);
  if (registro === null) return null;

  const id = texto(registro['id_reto']);
  if (id === null) return null;

  return {
    id,
    autorId: texto(registro['id_estudiante']) ?? '',
    nombreAutor: texto(registro['nombre_estudiante']) ?? '',
    textoQuechua: texto(registro['texto_quechua']) ?? '',
    traduccionSugerida: texto(registro['traduccion_sugerida']) ?? '',
    pistaCultural: texto(registro['pista_cultural']) ?? '',
    nivelSugerido: entero(
      registro['nivel_sugerido'],
      NivelId.PRIMERO,
      NivelId.ULTIMO,
      NivelId.PRIMERO
    ),
    estado: estadoModeracion(registro['estado_reto']),
    fechaCreacion: parteDeFecha(registro['fecha_creacion']) ?? fechaDeHoy(),
    // El formato antiguo no guardaba bitácora: el estado heredado se respeta tal cual (RN-13).
    moderaciones: []
  };
}

function estadoModeracion(valor: unknown): EstadoModeracion {
  return esEstadoModeracion(valor) ? valor : 'pendiente';
}

// ---------------------------------------------------------------------------
// Utilidades de saneado
// ---------------------------------------------------------------------------

/** Texto no vacío y recortado; `null` para cualquier otra cosa. */
function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
}

function objeto(valor: unknown): Record<string, unknown> | null {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return null;
  return valor as Record<string, unknown>;
}

/** Entero acotado al rango indicado; los valores ausentes o no finitos usan el respaldo. */
function entero(valor: unknown, minimo: number, maximo: number, porDefecto: number): number {
  const numero =
    typeof valor === 'number' && Number.isFinite(valor) ? Math.trunc(valor) : porDefecto;
  if (numero < minimo) return minimo;
  if (numero > maximo) return maximo;
  return numero;
}

/** RN-04: puntuación entera 0..100 (`Puntuacion.crear` redondea igual). */
function puntuacion(valor: unknown): number {
  const numero = typeof valor === 'number' && Number.isFinite(valor) ? Math.round(valor) : 0;
  return Math.min(Puntuacion.MAXIMA, Math.max(Puntuacion.MINIMA, numero));
}

/** Parte `YYYY-MM-DD` de un ISO, sin depender de la zona horaria del equipo. */
const PATRON_PARTE_FECHA = /^(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))(?:[T\s].*)?$/;

function parteDeFecha(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const coincidencia = PATRON_PARTE_FECHA.exec(valor.trim());
  return coincidencia?.[1] ?? null;
}

/** Día local actual en `YYYY-MM-DD` (RN-17: la fecha la aporta la capa que tiene el reloj). */
function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function leerArreglo(almacen: Almacen, clave: string): unknown[] {
  const crudo = leerCrudo(almacen, clave);
  if (crudo === null) return [];
  try {
    const dato: unknown = JSON.parse(crudo);
    return Array.isArray(dato) ? dato : [];
  } catch {
    // JSON corrupto: no hay nada que migrar en esta clave.
    return [];
  }
}

function leerObjeto(almacen: Almacen, clave: string): Record<string, unknown> | null {
  const crudo = leerCrudo(almacen, clave);
  if (crudo === null) return null;
  try {
    const dato: unknown = JSON.parse(crudo);
    return objeto(dato);
  } catch {
    // JSON corrupto: se ignora la clave antigua.
    return null;
  }
}
