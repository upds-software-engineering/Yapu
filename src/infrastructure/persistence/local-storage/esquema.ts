import { z } from 'zod';
import {
  CATEGORIAS_GRAMATICALES,
  type CategoriaGramatical,
  type EstadoAprendizaje,
  type EstadoModeracion
} from '@domain/shared/tipos';
import { NivelId, Puntuacion } from '@domain/value-objects';

/**
 * Esquemas de validación y acceso seguro al almacenamiento local.
 *
 * Reglas de la capa:
 *  - toda lectura pasa por `leerJson`, que NUNCA lanza: JSON corrupto o forma inválida
 *    devuelven el respaldo y limpian la clave dañada;
 *  - toda escritura pasa por `escribirJson`, que tampoco lanza (cuota agotada, ciclos…);
 *  - `localStorage` no existe durante el render de servidor de Astro, así que los
 *    repositorios usan un almacén en memoria interna cuando no hay navegador.
 */

/**
 * Contrato mínimo de almacenamiento que necesitan los repositorios.
 * Lo cumple `localStorage` (subconjunto de `Storage`) y también `AlmacenMemoria`.
 */
export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
}

/** Almacén en memoria: respaldo cuando no hay `localStorage` (SSR) o está bloqueado. */
export class AlmacenMemoria implements Almacen {
  private readonly datos = new Map<string, string>();

  getItem(clave: string): string | null {
    return this.datos.get(clave) ?? null;
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(clave, valor);
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }
}

/** `localStorage` si el entorno lo ofrece; `null` en el render de servidor de Astro. */
function almacenDelNavegador(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Acceso bloqueado (modo privado, cookies restringidas): se usa el almacén en memoria.
    return null;
  }
}

/** Resuelve el almacén a usar: el inyectado, el del navegador o uno en memoria (SSR). */
export function resolverAlmacen(almacen?: Almacen): Almacen {
  if (almacen !== undefined) return almacen;
  return almacenDelNavegador() ?? new AlmacenMemoria();
}

/** Lectura en crudo tolerante a fallos del propio almacén. */
export function leerCrudo(almacen: Almacen, clave: string): string | null {
  try {
    return almacen.getItem(clave);
  } catch {
    // Almacén bloqueado o corrupto a nivel de plataforma: se comporta como clave ausente.
    return null;
  }
}

/** Escritura en crudo tolerante a fallos (cuota agotada, almacén bloqueado…). */
export function escribirCrudo(almacen: Almacen, clave: string, valor: string): void {
  try {
    almacen.setItem(clave, valor);
  } catch {
    // La persistencia es «best effort»: nunca se propaga el fallo a la UI.
  }
}

function eliminarCrudo(almacen: Almacen, clave: string): void {
  try {
    almacen.removeItem(clave);
  } catch {
    // No hay nada que hacer si el almacén rechaza el borrado.
  }
}

/**
 * Lee y valida una clave. Nunca lanza:
 *  - clave ausente → devuelve `respaldo` sin escribir nada;
 *  - JSON corrupto o forma inválida → limpia la clave y devuelve `respaldo`.
 */
export function leerJson<T>(
  almacen: Almacen,
  clave: string,
  esquema: z.ZodType<T>,
  respaldo: T
): T {
  const crudo = leerCrudo(almacen, clave);
  if (crudo === null) return respaldo;

  let dato: unknown;
  try {
    dato = JSON.parse(crudo) as unknown;
  } catch {
    eliminarCrudo(almacen, clave);
    return respaldo;
  }

  const resultado = esquema.safeParse(dato);
  if (!resultado.success) {
    eliminarCrudo(almacen, clave);
    return respaldo;
  }
  return resultado.data;
}

/** Serializa y guarda. Nunca lanza: un valor no serializable simplemente no se persiste. */
export function escribirJson<T>(almacen: Almacen, clave: string, valor: T): void {
  try {
    escribirCrudo(almacen, clave, JSON.stringify(valor));
  } catch {
    // Estructuras cíclicas o valores no serializables: se descarta la escritura.
  }
}

/** `[RNF-005]` Enumeraciones del dominio, reutilizadas por los esquemas y por la migración. */
export const ESTADOS_APRENDIZAJE = ['nuevo', 'repasar', 'aprendido'] as const satisfies
  readonly EstadoAprendizaje[];

export const ESTADOS_MODERACION = ['pendiente', 'aprobado', 'rechazado'] as const satisfies
  readonly EstadoModeracion[];

/** Decisiones posibles de una moderación (RN-13). */
export const DECISIONES_MODERACION = ['aprobado', 'rechazado'] as const;

export function esEstadoAprendizaje(valor: unknown): valor is EstadoAprendizaje {
  return typeof valor === 'string' && (ESTADOS_APRENDIZAJE as readonly string[]).includes(valor);
}

export function esEstadoModeracion(valor: unknown): valor is EstadoModeracion {
  return typeof valor === 'string' && (ESTADOS_MODERACION as readonly string[]).includes(valor);
}

export function esCategoriaGramatical(valor: unknown): valor is CategoriaGramatical {
  return typeof valor === 'string' && (CATEGORIAS_GRAMATICALES as readonly string[]).includes(valor);
}

/**
 * Fecha `YYYY-MM-DD` con mes y día plausibles, admitiendo además el ISO completo
 * (con hora y zona) del que `FechaDia.desdeIso` sabe extraer el día.
 */
const PATRON_FECHA_ISO =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** RN-08: seguimiento serializado de una palabra concreta. */
export const esquemaRegistroPalabra = z.object({
  palabraId: z.string().min(1),
  estado: z.enum(ESTADOS_APRENDIZAJE),
  contadorAciertos: z.number().int().nonnegative(),
  fechaUltimoRepaso: z.string()
});

/** Forma persistida del agregado `ProgresoEstudiante`. */
export const esquemaProgreso = z.object({
  estudianteId: z.string().min(1),
  nivelActual: z.number().int().min(NivelId.PRIMERO).max(NivelId.ULTIMO),
  cursoCompletado: z.boolean(),
  xp: z.number().int().nonnegative(),
  rachaDias: z.number().int().nonnegative(),
  fechaUltimaActividad: z.string().regex(PATRON_FECHA_ISO).nullable(),
  nivelesAprobados: z.array(z.number().int().min(NivelId.PRIMERO).max(NivelId.ULTIMO)),
  palabras: z.record(z.string().min(1), esquemaRegistroPalabra)
});

/** Forma persistida del agregado `Evaluacion` (RN-04, RN-15). */
export const esquemaEvaluacion = z.object({
  id: z.string().min(1),
  estudianteId: z.string(),
  nivelId: z.number().int().min(NivelId.PRIMERO).max(NivelId.ULTIMO),
  puntuacion: z.number().min(Puntuacion.MINIMA).max(Puntuacion.MAXIMA),
  aciertos: z.number().int().nonnegative(),
  totalPreguntas: z.number().int().nonnegative(),
  aprobado: z.boolean(),
  fecha: z.string(),
  sincronizada: z.boolean()
});

/** Forma persistida de `OracionBase` (RF-006, RN-11, RN-12). */
export const esquemaOracion = z.object({
  id: z.string().min(1),
  nivelId: z.number().int().min(NivelId.PRIMERO).max(NivelId.ULTIMO),
  textoQuechua: z.string(),
  traduccionEspanol: z.string(),
  palabraClaveId: z.string(),
  categoria: z.enum(CATEGORIAS_GRAMATICALES),
  contextoCultural: z.string().optional(),
  autorId: z.string(),
  estado: z.enum(ESTADOS_MODERACION),
  fechaCreacion: z.string().regex(PATRON_FECHA_ISO)
});

/** Voto de una o un docente sobre un reto comunitario (RN-13). */
export const esquemaModeracion = z.object({
  docenteId: z.string().min(1),
  decision: z.enum(DECISIONES_MODERACION),
  fecha: z.string()
});

/** Forma persistida del agregado `RetoComunitario`, con su bitácora (RN-13). */
export const esquemaReto = z.object({
  id: z.string().min(1),
  autorId: z.string(),
  nombreAutor: z.string(),
  textoQuechua: z.string(),
  traduccionSugerida: z.string(),
  pistaCultural: z.string().optional(),
  nivelSugerido: z.number().int().min(NivelId.PRIMERO).max(NivelId.ULTIMO),
  estado: z.enum(ESTADOS_MODERACION),
  fechaCreacion: z.string().regex(PATRON_FECHA_ISO),
  moderaciones: z.array(esquemaModeracion)
});

/** Colecciones tal cual se guardan bajo cada clave nueva. */
export const esquemaProgresos = z.record(z.string().min(1), esquemaProgreso);
export const esquemaEvaluaciones = z.array(esquemaEvaluacion);
export const esquemaOraciones = z.array(esquemaOracion);
export const esquemaRetos = z.array(esquemaReto);
