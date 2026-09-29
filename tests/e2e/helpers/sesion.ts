import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Perfiles de sesión, rutas y recorridos compartidos de la suite E2E de YAPU.
 *
 * ADR-004: el sitio se publica bajo `/Yapu/`, así que NINGUNA prueba navega con una ruta absoluta
 * sin el prefijo (`page.goto('/dashboard')` apuntaría a la raíz del servidor y fallaría). Todo pasa
 * por `irA()`, que replica el helper `ruta()` de `src/ui/lib/ruta.ts`.
 *
 * ADR-002 / ADR-003: los perfiles se siembran directamente en `localStorage` con las claves
 * versionadas del esquema nuevo (`yapu:sesion:v1`, `yapu:progreso:v1`, `yapu:evaluaciones:v1`) y se
 * marca la migración como hecha (`yapu:migracion:v1 = '1'`) para que `migrarClavesAntiguas` salga de
 * inmediato y no interfiera.
 *
 * Estrategia de siembra (dos pasos, sin depender del orden de los init scripts):
 *  1. `page.addInitScript`: en cada documento NUEVO rellena sólo las claves que faltan, de modo que
 *     lo que la propia aplicación haya escrito (nivel desbloqueado, palabras marcadas, retos…) se
 *     conserve al navegar y las pruebas puedan verificar transiciones reales de estado;
 *  2. si la página ya tiene un documento con origen utilizable, la siembra se aplica EN EL ACTO y
 *     con `forzar`, así la última preparación gana aunque Playwright evalúe los init scripts en
 *     orden no definido (documentado en su API). Es lo que permite cambiar de rol a mitad de una
 *     prueba (estudiante que propone un reto → docente que lo modera).
 */

/** Prefijo de despliegue (`astro.config.mjs`: `base: '/Yapu'`). */
const BASE = '/Yapu';

/** Día fijo de última actividad: las pruebas nunca dependen de la fecha real del equipo (RN-17). */
const FECHA_ACTIVIDAD = '2026-03-15';

/** RN-10: la evaluación objetivo siempre son 10 preguntas. */
const PREGUNTAS_EVALUACION = 10;

/** RN-04: umbral único de aprobación (`PoliticaAprobacion.UMBRAL`). */
const UMBRAL_APROBACION = 70;

/** Identificador del estudiante de prueba (clave del documento de progreso). */
export const ID_ESTUDIANTE = 'e2e-estudiante';

/** Identificador del docente de prueba. */
export const ID_DOCENTE = 'e2e-docente';

/**
 * Claves de `localStorage` del esquema versionado (ADR-002).
 *
 * Se documentan aquí para las pruebas; las funciones que se serializan al navegador repiten los
 * literales a propósito, porque Playwright sólo transfiere el código de la propia función y no las
 * referencias a este módulo. Deben coincidir con `src/infrastructure/persistence/local-storage/claves.ts`.
 */
export const CLAVES_ALMACEN = {
  sesion: 'yapu:sesion:v1',
  progreso: 'yapu:progreso:v1',
  evaluaciones: 'yapu:evaluaciones:v1',
  migracion: 'yapu:migracion:v1'
} as const;

export type RolSemilla = 'estudiante' | 'docente';

export type EstadoAprendizajeSemilla = 'nuevo' | 'repasar' | 'aprendido';

/** Sesión simulada (ADR-003): usuario, rol y nombre, tal cual los guarda `SesionLocalAdapter`. */
export interface SesionSemilla {
  usuarioId: string;
  rol: RolSemilla;
  nombre: string;
}

/** RN-08: forma persistida de un registro de palabra. */
export interface RegistroPalabraSemilla {
  palabraId: string;
  estado: EstadoAprendizajeSemilla;
  contadorAciertos: number;
  fechaUltimoRepaso: string;
}

/** Forma persistida del agregado de progreso (`DatosProgreso`). */
export interface ProgresoSemilla {
  estudianteId: string;
  nivelActual: number;
  cursoCompletado: boolean;
  xp: number;
  rachaDias: number;
  fechaUltimaActividad: string | null;
  nivelesAprobados: number[];
  palabras: Record<string, RegistroPalabraSemilla>;
}

/** Forma persistida de una evaluación rendida (`DatosEvaluacion`, RN-15). */
export interface EvaluacionSemilla {
  id: string;
  estudianteId: string;
  nivelId: number;
  puntuacion: number;
  aciertos: number;
  totalPreguntas: number;
  aprobado: boolean;
  fecha: string;
  sincronizada: boolean;
}

/** Datos que se escriben en `localStorage` antes de que arranque la aplicación. */
interface SemillaAlmacen {
  sesion: SesionSemilla;
  /** `Record<estudianteId, ProgresoSemilla>` bajo `yapu:progreso:v1`. */
  progreso?: Record<string, ProgresoSemilla>;
  /** `EvaluacionSemilla[]` bajo `yapu:evaluaciones:v1`. */
  evaluaciones?: EvaluacionSemilla[];
  /** `true` sobrescribe lo ya guardado (cambio de rol en mitad de una prueba). */
  forzar?: boolean;
}

/**
 * Escribe la semilla en `localStorage`.
 *
 * Es una función AUTOCONTENIDA porque Playwright la serializa: no puede referenciar constantes ni
 * funciones de este módulo.
 */
function sembrarAlmacen(semilla: SemillaAlmacen): void {
  const forzar = semilla.forzar === true;

  const escribir = (clave: string, valor: string, sobrescribir: boolean): void => {
    try {
      if (sobrescribir || window.localStorage.getItem(clave) === null) {
        window.localStorage.setItem(clave, valor);
      }
    } catch {
      // Almacenamiento bloqueado: la prueba fallará de forma visible al no encontrar el perfil.
    }
  };

  escribir('yapu:sesion:v1', JSON.stringify(semilla.sesion), forzar);
  if (semilla.progreso !== undefined) {
    escribir('yapu:progreso:v1', JSON.stringify(semilla.progreso), forzar);
  }
  if (semilla.evaluaciones !== undefined) {
    escribir('yapu:evaluaciones:v1', JSON.stringify(semilla.evaluaciones), forzar);
  }
  // El marcador de migración se escribe siempre: `migrarClavesAntiguas` devuelve 0 en cuanto vale '1'.
  escribir('yapu:migracion:v1', '1', true);
}

/** Instala la semilla para los documentos futuros y la aplica al documento actual si ya existe. */
async function sembrar(page: Page, semilla: SemillaAlmacen): Promise<void> {
  await page.addInitScript(sembrarAlmacen, semilla);

  if (/^https?:/.test(page.url())) {
    await page.evaluate(sembrarAlmacen, { ...semilla, forzar: true });
  }
}

/** Sesión simulada del estudiante de prueba (RF-001, ADR-003). */
function sesionEstudiante(): SesionSemilla {
  return { usuarioId: ID_ESTUDIANTE, rol: 'estudiante', nombre: 'Estudiante E2E' };
}

/** RN-02: el curso es una cadena sin saltos, así que los niveles aprobados son 1..nivelActual-1. */
function nivelesAprobadosHasta(nivelActual: number): number[] {
  return Array.from({ length: Math.max(0, nivelActual - 1) }, (_, indice) => indice + 1);
}

export interface OpcionesEstudiante {
  /** Nivel en el que está el estudiante (RN-01: sólo puede abrir éste o los anteriores). */
  nivelActual: number;
  /** Niveles ya aprobados; por defecto 1..nivelActual-1 (RN-02). */
  nivelesAprobados?: readonly number[];
  rachaDias?: number;
  xp?: number;
  /** Día de la última actividad (`YYYY-MM-DD`); por defecto una fecha fija. */
  fechaUltimaActividad?: string;
  /** ¿El curso está terminado? Por defecto `false`. */
  cursoCompletado?: boolean;
  /** Registros de palabras ya marcadas (`palabras` del progreso, RN-08). */
  palabras?: Record<string, RegistroPalabraSemilla>;
}

/**
 * Deja un perfil de estudiante listo en `localStorage` (RF-001 / RF-003 / RN-07).
 *
 * Se llama ANTES de navegar: la primera navegación ya encuentra la sesión y el progreso.
 */
export async function prepararPerfilEstudiante(
  page: Page,
  opciones: OpcionesEstudiante
): Promise<void> {
  const progreso: ProgresoSemilla = {
    estudianteId: ID_ESTUDIANTE,
    nivelActual: opciones.nivelActual,
    cursoCompletado: opciones.cursoCompletado ?? false,
    xp: opciones.xp ?? 0,
    rachaDias: opciones.rachaDias ?? 0,
    fechaUltimaActividad: opciones.fechaUltimaActividad ?? FECHA_ACTIVIDAD,
    nivelesAprobados: [
      ...(opciones.nivelesAprobados ?? nivelesAprobadosHasta(opciones.nivelActual))
    ],
    palabras: opciones.palabras ?? {}
  };

  await sembrar(page, {
    sesion: sesionEstudiante(),
    progreso: { [ID_ESTUDIANTE]: progreso }
  });
}

/** Deja la sesión simulada de docente lista en `localStorage` (RF-002, ADR-003). */
export async function prepararPerfilDocente(page: Page): Promise<void> {
  await sembrar(page, {
    sesion: { usuarioId: ID_DOCENTE, rol: 'docente', nombre: 'Docente E2E' }
  });
}

export interface FilaHistorialSemilla {
  nivelId: number;
  /** Puntuación 0..100 (RN-04: `aprobado` se deriva del umbral de 70). */
  puntuacion: number;
  /** Fecha ISO de la evaluación; el tablero ordena de la más reciente a la más antigua. */
  fecha: string;
  sincronizada?: boolean;
}

/**
 * Siembra el historial de evaluaciones del estudiante (RN-15 / RF-008).
 *
 * El tablero sólo agrupa el historial cuando existe contenido: sin datos, `[data-grupo-nivel]` no
 * se pinta. Esta siembra es lo que permite verificar la agrupación por nivel que exige Miller.
 */
export async function prepararHistorial(
  page: Page,
  filas: readonly FilaHistorialSemilla[]
): Promise<void> {
  const evaluaciones: EvaluacionSemilla[] = filas.map((fila, indice) => ({
    id: `e2e-evaluacion-${indice + 1}`,
    estudianteId: ID_ESTUDIANTE,
    nivelId: fila.nivelId,
    puntuacion: fila.puntuacion,
    aciertos: Math.round((fila.puntuacion / 100) * PREGUNTAS_EVALUACION),
    totalPreguntas: PREGUNTAS_EVALUACION,
    aprobado: fila.puntuacion >= UMBRAL_APROBACION,
    fecha: fila.fecha,
    sincronizada: fila.sincronizada ?? false
  }));

  await sembrar(page, { sesion: sesionEstudiante(), evaluaciones });
}

/**
 * Traduce una ruta lógica (`/quiz/1`) a su URL real bajo el `base` de Astro (ADR-004).
 *
 * Se replica `src/ui/lib/ruta.ts` en lugar de importarlo: ese módulo lee `import.meta.env.BASE_URL`,
 * que sólo existe dentro del build de Vite/Astro, no en el proceso de Playwright.
 */
export function rutaConBase(rutaLogica: string): string {
  const limpia = rutaLogica.startsWith('/') ? rutaLogica : `/${rutaLogica}`;
  if (limpia === '/') return `${BASE}/`;
  return `${BASE}${limpia}`;
}

/** Navega a una ruta LÓGICA (`/`, `/dashboard`, `/lesson/1`, …), siempre bajo `base` (ADR-004). */
export async function irA(page: Page, rutaLogica: string): Promise<void> {
  await page.goto(rutaConBase(rutaLogica));
}

/** Identificadores de pantalla publicados por el contrato de selectores. */
export type IdPantalla =
  | 'mapa'
  | 'leccion'
  | 'cierre-leccion'
  | 'evaluacion'
  | 'resultado'
  | 'tablero'
  | 'comunidad'
  | 'docente'
  | 'nivel-bloqueado'
  | 'nivel-no-valido';

/**
 * Espera a que la pantalla indicada esté visible y la devuelve.
 *
 * Se apoya en el contrato `[data-pantalla="…"]`, que cada pantalla pinta en TODOS sus estados
 * (carga, error, vacío…), así que sirve como ancla estable de sincronización.
 */
export async function esperarPantalla(page: Page, id: IdPantalla): Promise<Locator> {
  const pantalla = page.locator(`[data-pantalla="${id}"]`);
  await expect(pantalla).toBeVisible();
  return pantalla;
}

// ---------------------------------------------------------------------------
// Recorridos compartidos (RF-004 / RF-005)
//
// Viven en este archivo —y no en un tercero— porque el plan de pruebas fija exactamente dos
// módulos de ayuda para la suite E2E: `sesion.ts` (perfiles, rutas y recorridos) y `ux.ts` (medidas).
// ---------------------------------------------------------------------------

/** Máximo de tarjetas que se marcan en una lección antes de dar el recorrido por atascado. */
const MAXIMO_TARJETAS_LEIDAS = 12;

/**
 * RF-004: recorre la lección marcando TODAS las palabras con «¡Ya me la sé!».
 *
 * La lección auto-avanza 250 ms después de marcar, así que entre tarjeta y tarjeta se espera a que
 * la flashcard mostrada sea OTRA: sin esa espera se volvería a marcar la misma palabra (el botón se
 * rehabilita antes de que dispare el temporizador de auto-avance).
 */
export async function completarLeccion(page: Page): Promise<void> {
  const cierre = page.locator('[data-pantalla="cierre-leccion"]');
  const flashcard = page.locator('[data-flashcard]');

  for (let tarjeta = 0; tarjeta < MAXIMO_TARJETAS_LEIDAS; tarjeta += 1) {
    if (await cierre.isVisible()) return;

    const terminoMostrado = await flashcard.getAttribute('aria-label');
    await page.locator('[data-accion="aprender"]').click();

    /*
     * Tras marcar, la lección auto-avanza a los 250 ms: se espera a que aparezca el cierre de la
     * lección o a que la tarjeta mostrada sea OTRA. Sin esa espera se volvería a marcar la misma
     * palabra, porque el botón se rehabilita antes de que dispare el temporizador de auto-avance.
     */
    await expect(async () => {
      if (await cierre.isVisible()) return;
      const ahora = await flashcard
        .getAttribute('aria-label', { timeout: 2_000 })
        .catch(() => null);
      expect(ahora).not.toBe(terminoMostrado);
    }).toPass({ timeout: 5_000 });

    if (await cierre.isVisible()) return;
  }

  await expect(cierre).toBeVisible();
}

/** Desenlace posible de una evaluación (`data-resultado`). */
export type Desenlace = 'aprobado' | 'reprobado';

/** RF-005: responde las 10 preguntas eligiendo SIEMPRE la primera opción de cada una. */
export async function responderEvaluacionCompleta(page: Page): Promise<void> {
  for (let pregunta = 0; pregunta < PREGUNTAS_EVALUACION; pregunta += 1) {
    const idPregunta = await page.locator('[data-pregunta]').first().getAttribute('data-pregunta');

    await page.locator('[data-opcion]').first().click();
    await page.locator('[data-accion="siguiente"]').click();

    if (pregunta < PREGUNTAS_EVALUACION - 1) {
      // La pregunta siguiente sustituye a la anterior: esperar al cambio evita marcar dos veces la misma.
      await expect(
        page.locator(`[data-pregunta]:not([data-pregunta="${idPregunta ?? ''}"])`)
      ).toBeVisible();
    }
  }

  await esperarPantalla(page, 'resultado');
}

/** Lee el desenlace ya pintado en la pantalla de resultado. */
export async function leerDesenlace(page: Page): Promise<Desenlace | null> {
  const valor = await page.locator('[data-pantalla="resultado"]').getAttribute('data-resultado');
  return valor === 'aprobado' || valor === 'reprobado' ? valor : null;
}

/**
 * Resuelve la evaluación con un bucle ACOTADO de intentos hasta obtener el desenlace buscado.
 *
 * Motivo: el generador baraja las opciones (`barajar` en `GeneradorEvaluacion`, RN-09), así que
 * desde el DOM no se puede saber cuál es la correcta: elegir siempre la primera opción acierta
 * únicamente por azar. Si el intento no da el desenlace buscado se reintenta con el botón
 * «Reintentar» de la propia pantalla de resultado (sin recargar, para no perder el contexto).
 */
export async function resolverEvaluacion(
  page: Page,
  buscar: Desenlace,
  intentos = 3
): Promise<Desenlace | null> {
  let desenlace: Desenlace | null = null;

  for (let intento = 1; intento <= intentos; intento += 1) {
    await responderEvaluacionCompleta(page);
    desenlace = await leerDesenlace(page);
    if (desenlace === buscar) return desenlace;

    if (intento < intentos) {
      await page.getByRole('button', { name: /^Reintentar/ }).click();
      await esperarPantalla(page, 'evaluacion');
    }
  }

  return desenlace;
}
