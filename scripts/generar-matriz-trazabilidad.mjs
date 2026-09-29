#!/usr/bin/env node
/**
 * Genera la matriz de trazabilidad requisitos ↔ pruebas de YAPU.
 *
 * Lee TODOS los reportes JUnit de `reports/junit/*.xml` (Vitest y Playwright), extrae de cada
 * `<testcase>` su nombre y los tags `[RF-xxx]`, `[RNF-xxx]`, `[RS-xxx]`, `[RN-xx]` y `[UX-*]`
 * presentes en el nombre (y en el `classname` de su `<testsuite>`), y escribe
 * `Docs/testing/matriz-trazabilidad.md` con una tabla por familia de requisitos.
 *
 * Sin dependencias externas: sólo módulos `node:` y expresiones regulares sobre el texto del XML
 * (no se añade ningún parser al proyecto).
 *
 * Uso:
 *   node scripts/generar-matriz-trazabilidad.mjs              → avisa y genera igualmente si no hay reportes (código 0)
 *   node scripts/generar-matriz-trazabilidad.mjs --estricto   → código 1 si no hay reportes (útil en CI)
 *
 * @typedef {'paso' | 'fallo' | 'omitido'} EstadoPrueba
 * @typedef {{ id: string, descripcion: string, nota?: string }} Requisito
 * @typedef {{ nombre: string, suite: string, archivo: string, estado: EstadoPrueba, tags: string[] }} Prueba
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIR_REPORTES = join(RAIZ, 'reports', 'junit');
const RUTA_MATRIZ = join(RAIZ, 'Docs', 'testing', 'matriz-trazabilidad.md');
const ESTRICTO = process.argv.slice(2).includes('--estricto');

/** Máximo de nombres de prueba listados por requisito antes de resumir con "(+N más)". */
const MAX_PRUEBAS_POR_REQUISITO = 8;
/** Longitud máxima de un nombre de prueba dentro de la celda de la tabla. */
const MAX_LARGO_NOMBRE = 130;

/**
 * Familias de requisitos, en el orden en que se publican las tablas y el desglose.
 * @type {ReadonlyArray<{ clave: string, titulo: string }>}
 */
const FAMILIAS = [
  { clave: 'RF', titulo: 'Requisitos funcionales (RF)' },
  { clave: 'RNF', titulo: 'Requisitos no funcionales (RNF)' },
  { clave: 'RS', titulo: 'Requisitos de sostenibilidad (RS)' },
  { clave: 'RN', titulo: 'Reglas de negocio (RN)' },
  { clave: 'UX', titulo: 'Leyes UX (UX)' }
];

/**
 * Catálogo de requisitos del proyecto con su descripción en español.
 * @type {ReadonlyArray<Requisito>}
 */
const CATALOGO = [
  { id: 'RF-001', descripcion: 'Registro e inicio de sesión de estudiantes', nota: 'Simulado (SesionLocal)' },
  { id: 'RF-002', descripcion: 'Gestión de roles (estudiante/docente)', nota: 'Simulado (SesionLocal)' },
  { id: 'RF-003', descripcion: 'Visualización del mapa de niveles y progreso' },
  {
    id: 'RF-004',
    descripcion:
      'Lecciones con flashcards (término, traducción, pronunciación, imagen y contexto cultural)'
  },
  { id: 'RF-005', descripcion: 'Evaluación con IA determinista (generación y calificación)' },
  { id: 'RF-006', descripcion: 'Registro de oraciones base por el docente' },
  { id: 'RF-007', descripcion: 'Retos comunitarios con moderación docente' },
  { id: 'RF-008', descripcion: 'Tablero de progreso, racha, XP e historial' },
  { id: 'RF-009', descripcion: 'Modo offline y sincronización de la cola' },
  { id: 'RF-010', descripcion: 'Panel docente de gestión de contenidos y exportación' },
  { id: 'RNF-001', descripcion: 'Usabilidad y arquitectura de información' },
  { id: 'RNF-002', descripcion: 'Accesibilidad WCAG 2.1 AA' },
  { id: 'RNF-003', descripcion: 'Compatibilidad con navegadores móviles (PWA)' },
  { id: 'RNF-004', descripcion: 'Seguridad y ausencia de credenciales' },
  { id: 'RNF-005', descripcion: 'Mantenibilidad (arquitectura hexagonal y reglas de capas)' },
  { id: 'RNF-006', descripcion: 'Rendimiento (carga, hidratación diferida, Service Worker)' },
  { id: 'RNF-007', descripcion: 'Disponibilidad y tolerancia a fallos' },
  { id: 'RS-001', descripcion: 'Sostenibilidad técnica (documentación y ADRs)' },
  { id: 'RS-002', descripcion: 'Eficiencia energética / rendimiento en dispositivos modestos' },
  { id: 'RS-003', descripcion: 'Participación comunitaria y gobernanza del contenido' },
  { id: 'RS-004', descripcion: 'Datos abiertos y transparencia (exportación CSV)' },
  { id: 'RN-01', descripcion: 'Acceso sólo al nivel actual o inferior (NivelBloqueadoError)' },
  {
    id: 'RN-02',
    descripcion:
      'Desbloqueo secuencial: aprobar n con n === nivelActual desbloquea n+1; nivel 10 marca cursoCompletado; nunca se saltan niveles'
  },
  { id: 'RN-03', descripcion: 'Progreso global = nivelesAprobados/10*100 (100% al completar)' },
  { id: 'RN-04', descripcion: 'Umbral de aprobación 70 (constante única PoliticaAprobacion.UMBRAL)' },
  {
    id: 'RN-05',
    descripcion:
      'XP: +100 la primera aprobación de cada nivel, +10 por evaluación rendida, +2 por palabra aprendida la primera vez (idempotente)'
  },
  {
    id: 'RN-06',
    descripcion:
      'Racha por días calendario locales (mismo día 0, día siguiente +1, hueco >1 día → 1, perfil nuevo 0)'
  },
  { id: 'RN-07', descripcion: 'Perfil inicial limpio: nivel 1, racha 0, 0 palabras, 0 XP, cursoCompletado false' },
  { id: 'RN-08', descripcion: 'Palabras aprendidas = palabras ÚNICAS en estado aprendido' },
  {
    id: 'RN-09',
    descripcion:
      'Pregunta válida: 4 opciones únicas, sin distractores hardcodeados, prioridad de pools de distractores'
  },
  {
    id: 'RN-10',
    descripcion: 'Tamaño de evaluación: objetivo 10, mínimo 5, ContenidoInsuficienteError por debajo'
  },
  {
    id: 'RN-11',
    descripcion:
      'Cloze: la oración debe contener la palabra clave (regex escapado, case-insensitive, admite sufijos)'
  },
  {
    id: 'RN-12',
    descripcion:
      'Oraciones del docente: rol docente, palabra clave obligatoria del mismo nivel, quedan aprobadas y alimentan al generador'
  },
  {
    id: 'RN-13',
    descripcion:
      'Retos comunitarios: sólo estudiantes de nivel ≥7 proponen; doble aprobación de docentes distintos; un rechazo cierra el reto; sin votos duplicados; el autor no modera'
  },
  { id: 'RN-14', descripcion: 'CSV RFC 4180 + neutralización de fórmulas + BOM UTF-8' },
  { id: 'RN-15', descripcion: 'Cola offline FIFO e idempotente, sincronizada al volver online y al iniciar' },
  { id: 'RN-16', descripcion: 'No se avanza sin marcar respuesta y se puede volver a la pregunta anterior' },
  { id: 'RN-17', descripcion: 'Identificadores únicos vía GeneradorIdPort (no Date.now)' },
  {
    id: 'UX-FITTS',
    descripcion:
      'Ley de Fitts: objetivos táctiles ≥44px en móvil y ≥24px en escritorio, con separación ≥8px entre objetivos'
  },
  {
    id: 'UX-HICK',
    descripcion: 'Ley de Hick: ≤7 opciones primarias por pantalla y 1 solo CTA primario'
  },
  {
    id: 'UX-JAKOB',
    descripcion:
      'Ley de Jakob: patrones convencionales, navegación inferior en móvil / superior en escritorio, pestaña Docente sólo con rol docente'
  },
  {
    id: 'UX-MILLER',
    descripcion: 'Ley de Miller: mapa agrupado en 3 tramos (1–3 / 4–7 / 8–10)'
  },
  {
    id: 'UX-APOGEO',
    descripcion:
      'Apogeo-Final: clímax en la aprobación y próximo paso claro al reprobar'
  },
  {
    id: 'UX-ESTETICA',
    descripcion:
      'Estética-Usabilidad: ≤3 tamaños tipográficos + caption, espaciado múltiplo de 4 y paleta tokenizada'
  }
];

const IDS_VALIDOS = new Set(CATALOGO.map((requisito) => requisito.id));

// ---------------------------------------------------------------------------
// Parseo del XML JUnit
// ---------------------------------------------------------------------------

/**
 * Bloque de apertura de un `<testcase>`: atributos (respetando comillas) y cuerpo opcional.
 * Cubre tanto `<testcase ... />` como `<testcase ...>…</testcase>`.
 */
const RE_TESTCASE = /<testcase\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
/** Bloque de un `<testsuite>` con su cuerpo, para conocer el archivo/proyecto contenedor. */
const RE_TESTSUITE = /<testsuite\b((?:[^>"']|"[^"]*"|'[^']*')*?)>([\s\S]*?)<\/testsuite>/g;

/**
 * Lee un atributo XML de un bloque de atributos, admitiendo comillas dobles o simples.
 * @param {string} bloque Atributos del elemento.
 * @param {string} nombre Nombre del atributo.
 * @returns {string} Valor desescapado, o cadena vacía si no existe.
 */
function leerAtributo(bloque, nombre) {
  const patron = new RegExp(`\\b${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`);
  const coincidencia = patron.exec(bloque);
  if (!coincidencia) return '';
  return desescaparXml(coincidencia[1] ?? coincidencia[2] ?? '');
}

/**
 * Deshace las entidades XML habituales en nombres de prueba y clasificadores.
 * @param {string} texto Texto posiblemente escapado.
 * @returns {string} Texto legible.
 */
function desescaparXml(texto) {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
    .replace(/&amp;/g, '&');
}

/**
 * Normaliza un tag de requisito: mayúsculas y relleno numérico (`RN-9` → `RN-09`, `RF-5` → `RF-005`).
 * @param {string} bruto Contenido interno de los corchetes.
 * @returns {string} Tag normalizado.
 */
function normalizarTag(bruto) {
  const tag = bruto.trim().toUpperCase();
  const coincidencia = /^(RF|RNF|RS|RN)-(\d+)$/.exec(tag);
  if (!coincidencia) return tag;
  const [, prefijo, numero] = coincidencia;
  return `${prefijo}-${numero.padStart(prefijo === 'RN' ? 2 : 3, '0')}`;
}

/**
 * Extrae los tags `[...]` de un texto y los normaliza.
 * @param {string} texto Texto donde buscar (nombre de prueba o classname).
 * @returns {string[]} Tags normalizados, sin duplicados.
 */
function extraerTags(texto) {
  const encontrados = new Set();
  for (const coincidencia of texto.matchAll(/\[([A-Za-z0-9_-]+)\]/g)) {
    encontrados.add(normalizarTag(coincidencia[1]));
  }
  return [...encontrados];
}

/**
 * Determina el estado de un `<testcase>` a partir de su cuerpo.
 * @param {string} cuerpo Contenido interno del testcase (vacío si es autocerrado).
 * @returns {EstadoPrueba} Estado de la prueba.
 */
function estadoDelCaso(cuerpo) {
  if (/<(failure|error)\b/.test(cuerpo)) return 'fallo';
  if (/<skipped\b/.test(cuerpo)) return 'omitido';
  return 'paso';
}

/**
 * Parsea el contenido de un reporte JUnit.
 * @param {string} contenido Texto XML del reporte.
 * @param {string} archivo Ruta del archivo, para trazabilidad de errores.
 * @returns {{ pruebas: Prueba[], suites: Set<string>, avisos: string[] }} Resultado del parseo.
 */
function parsearReporte(contenido, archivo) {
  /** @type {Prueba[]} */
  const pruebas = [];
  const suites = new Set();
  const avisos = [];

  let casosConSuites = 0;

  for (const suite of contenido.matchAll(RE_TESTSUITE)) {
    const atributosSuite = suite[1] ?? '';
    const nombreSuite = leerAtributo(atributosSuite, 'name') || '(suite sin nombre)';
    const classnameSuite = leerAtributo(atributosSuite, 'classname');
    const tagsDeSuite = extraerTags(`${nombreSuite} ${classnameSuite}`);
    suites.add(nombreSuite);

    for (const caso of (suite[2] ?? '').matchAll(RE_TESTCASE)) {
      casosConSuites += 1;
      const atributosCaso = caso[1] ?? '';
      const cuerpo = caso[3] ?? '';
      const nombre = leerAtributo(atributosCaso, 'name');
      if (!nombre) continue;

      const tags = new Set([...extraerTags(nombre), ...tagsDeSuite]);
      pruebas.push({
        nombre,
        suite: nombreSuite,
        archivo,
        estado: estadoDelCaso(cuerpo),
        tags: [...tags]
      });
    }
  }

  // Red de seguridad: XML mal formado sin cierres de <testsuite> pero con <testcase>.
  const totalCasos = (contenido.match(/<testcase\b/g) ?? []).length;
  if (totalCasos > casosConSuites) {
    const sueltos = totalCasos - casosConSuites;
    avisos.push(
      `${archivo}: ${sueltos} <testcase> fuera de un <testsuite> cerrado; se procesan igualmente.`
    );
    for (const caso of contenido.matchAll(RE_TESTCASE)) {
      const atributosCaso = caso[1] ?? '';
      const cuerpo = caso[3] ?? '';
      const nombre = leerAtributo(atributosCaso, 'name');
      if (!nombre) continue;
      if (pruebas.some((prueba) => prueba.nombre === nombre && prueba.archivo === archivo)) continue;
      suites.add('(suite no declarada)');
      pruebas.push({
        nombre,
        suite: '(suite no declarada)',
        archivo,
        estado: estadoDelCaso(cuerpo),
        tags: extraerTags(nombre)
      });
    }
  }

  if (totalCasos === 0 && !/<testsuite\b/.test(contenido)) {
    avisos.push(`${archivo}: no contiene <testsuite> ni <testcase>; parece un XML corrupto o vacío.`);
  } else if (suites.size === 0) {
    avisos.push(
      `${archivo}: se detectaron etiquetas JUnit pero ninguna suite cerrada; el XML parece truncado o corrupto.`
    );
  } else {
    const abiertas = (contenido.match(/<testsuite\b/g) ?? []).length;
    const cerradas = (contenido.match(/<\/testsuite>/g) ?? []).length;
    if (abiertas !== cerradas) {
      avisos.push(
        `${archivo}: ${abiertas} <testsuite> abiertas frente a ${cerradas} cerradas; posible XML truncado.`
      );
    }
  }

  return { pruebas, suites, avisos };
}

// ---------------------------------------------------------------------------
// Lectura de reportes
// ---------------------------------------------------------------------------

/**
 * Lista los archivos `*.xml` de `reports/junit/`.
 * @returns {string[]} Rutas absolutas ordenadas alfabéticamente.
 */
function listarReportes() {
  if (!existsSync(DIR_REPORTES) || !statSync(DIR_REPORTES).isDirectory()) return [];
  return readdirSync(DIR_REPORTES)
    .filter((entrada) => entrada.toLowerCase().endsWith('.xml'))
    .map((entrada) => join(DIR_REPORTES, entrada))
    .filter((ruta) => statSync(ruta).isFile())
    .sort();
}

/**
 * Lee y parsea todos los reportes disponibles.
 * @returns {{ pruebas: Prueba[], suites: Set<string>, avisos: string[], archivos: string[], corruptos: string[] }}
 */
function leerReportes() {
  /** @type {Prueba[]} */
  const pruebas = [];
  const suites = new Set();
  const avisos = [];
  const corruptos = [];
  const archivos = listarReportes();

  for (const ruta of archivos) {
    const nombre = relative(RAIZ, ruta).split('\\').join('/');
    let contenido;
    try {
      contenido = readFileSync(ruta, 'utf8');
    } catch (error) {
      corruptos.push(nombre);
      avisos.push(`${nombre}: no se pudo leer (${error instanceof Error ? error.message : String(error)}).`);
      continue;
    }
    if (contenido.trim() === '') {
      corruptos.push(nombre);
      avisos.push(`${nombre}: está vacío; se ignora.`);
      continue;
    }
    try {
      const resultado = parsearReporte(contenido, nombre);
      pruebas.push(...resultado.pruebas);
      for (const suite of resultado.suites) suites.add(`${nombre} :: ${suite}`);
      if (resultado.avisos.length > 0) {
        corruptos.push(nombre);
        avisos.push(...resultado.avisos);
      }
    } catch (error) {
      corruptos.push(nombre);
      avisos.push(
        `${nombre}: XML no procesable (${error instanceof Error ? error.message : String(error)}); se continúa.`
      );
    }
  }

  return { pruebas, suites, avisos, archivos, corruptos };
}

// ---------------------------------------------------------------------------
// Agregación por requisito
// ---------------------------------------------------------------------------

/**
 * Agrupa las pruebas por requisito del catálogo, descartando tags desconocidos.
 * @param {Prueba[]} pruebas Pruebas extraídas de todos los reportes.
 * @returns {{ cubiertos: Map<string, Prueba[]>, tagsDesconocidos: Map<string, number> }}
 */
function agruparPorRequisito(pruebas) {
  /** @type {Map<string, Prueba[]>} */
  const cubiertos = new Map(CATALOGO.map((requisito) => [requisito.id, []]));
  /** @type {Map<string, number>} */
  const tagsDesconocidos = new Map();
  const vistos = new Set();

  for (const prueba of pruebas) {
    for (const tag of prueba.tags ?? []) {
      if (!IDS_VALIDOS.has(tag)) {
        tagsDesconocidos.set(tag, (tagsDesconocidos.get(tag) ?? 0) + 1);
        continue;
      }
      const clave = `${tag}|${prueba.archivo}|${prueba.suite}|${prueba.nombre}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      cubiertos.get(tag)?.push(prueba);
    }
  }

  return { cubiertos, tagsDesconocidos };
}

/**
 * Calcula el estado agregado de un requisito.
 * @param {Prueba[]} pruebas Pruebas que cubren el requisito.
 * @returns {'cubierto' | 'con-fallos' | 'sin-cobertura'} Estado agregado.
 */
function estadoRequisito(pruebas) {
  if (pruebas.length === 0) return 'sin-cobertura';
  if (pruebas.some((prueba) => prueba.estado === 'fallo')) return 'con-fallos';
  if (pruebas.every((prueba) => prueba.estado === 'omitido')) return 'con-fallos';
  return 'cubierto';
}

/** Símbolo y etiqueta por estado agregado. */
const ETIQUETAS_ESTADO = {
  cubierto: { icono: '✅', texto: 'Cubierto' },
  'con-fallos': { icono: '⚠️', texto: 'Con fallos u omisiones' },
  'sin-cobertura': { icono: '❌', texto: 'Sin cobertura' }
};

// ---------------------------------------------------------------------------
// Utilidades de formato
// ---------------------------------------------------------------------------

/**
 * Escapa el contenido de una celda de tabla Markdown.
 * @param {string} texto Texto a escapar.
 * @returns {string} Texto seguro para una celda.
 */
function celda(texto) {
  return String(texto).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/**
 * Recorta un texto largo añadiendo puntos suspensivos.
 * @param {string} texto Texto original.
 * @param {number} maximo Longitud máxima.
 * @returns {string} Texto recortado.
 */
function recortar(texto, maximo) {
  const limpio = String(texto).replace(/\s+/g, ' ').trim();
  return limpio.length <= maximo ? limpio : `${limpio.slice(0, maximo - 1)}…`;
}

/**
 * Fecha local en formato `YYYY-MM-DD HH:mm`.
 * @param {Date} fecha Momento a formatear.
 * @returns {string} Fecha legible.
 */
function fechaLegible(fecha) {
  const dos = (valor) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(
    fecha.getHours()
  )}:${dos(fecha.getMinutes())}`;
}

/**
 * Prefijo visual de una prueba según su estado.
 * @param {EstadoPrueba} estado Estado de la prueba.
 * @returns {string} Prefijo para la celda.
 */
function prefijoEstado(estado) {
  if (estado === 'fallo') return '❌ ';
  if (estado === 'omitido') return '⏭️ ';
  return '';
}

// ---------------------------------------------------------------------------
// Generación del Markdown
// ---------------------------------------------------------------------------

/**
 * Construye el documento Markdown completo de la matriz de trazabilidad.
 * @param {object} datos Datos agregados.
 * @param {Prueba[]} datos.pruebas Todas las pruebas analizadas.
 * @param {Set<string>} datos.suites Suites identificadas.
 * @param {Map<string, Prueba[]>} datos.cubiertos Pruebas por requisito.
 * @param {Map<string, number>} datos.tagsDesconocidos Tags fuera del catálogo.
 * @param {string[]} datos.archivos Reportes analizados.
 * @param {string[]} datos.avisos Avisos de parseo.
 * @param {Date} datos.fecha Momento de generación.
 * @returns {string} Documento Markdown.
 */
function construirMatriz({ pruebas, suites, cubiertos, tagsDesconocidos, archivos, avisos, fecha }) {
  const totalRequisitos = CATALOGO.length;
  const estados = new Map(CATALOGO.map((r) => [r.id, estadoRequisito(cubiertos.get(r.id) ?? [])]));
  const cubiertosCount = [...estados.values()].filter((estado) => estado !== 'sin-cobertura').length;
  const conFallos = [...estados.values()].filter((estado) => estado === 'con-fallos').length;
  const sinCobertura = CATALOGO.filter((r) => estados.get(r.id) === 'sin-cobertura');
  const porcentaje = totalRequisitos === 0 ? 0 : (cubiertosCount / totalRequisitos) * 100;
  const totalFallos = pruebas.filter((prueba) => prueba.estado === 'fallo').length;
  const totalOmitidos = pruebas.filter((prueba) => prueba.estado === 'omitido').length;
  /** Sin reportes no se puede hablar de "sin cobertura": el catálogo completo figura como "sin reportes". */
  const sinReportes = archivos.length === 0;
  const textoVacio = sinReportes ? 'Sin reportes' : 'Sin cobertura';

  const lineas = [];

  lineas.push('# Matriz de trazabilidad requisitos ↔ pruebas — YAPU');
  lineas.push('');
  lineas.push(
    `**Fecha de generación:** ${fechaLegible(fecha)}  `
  );
  lineas.push(
    '**Artefacto AUTOGENERADO**: no editar a mano. Se regenera con `npm run reports:trazabilidad` ' +
      '(o `node scripts/generar-matriz-trazabilidad.mjs`) a partir de los reportes JUnit de `reports/junit/*.xml`.'
  );
  lineas.push('');
  lineas.push('## Resumen');
  lineas.push('');
  if (sinReportes) {
    lineas.push(
      '> ❌ **Sin reportes JUnit disponibles.** No existe ningún `*.xml` en `reports/junit/`, por lo que ' +
        'todos los requisitos figuran como **❌ sin reportes**. Ejecuta `npm test` (Vitest) y `npm run test:e2e` ' +
        '(Playwright) y vuelve a lanzar `npm run reports:trazabilidad` para obtener la matriz real.'
    );
    lineas.push('');
  }
  lineas.push('| Métrica | Valor |');
  lineas.push('| --- | --- |');
  lineas.push(`| Requisitos en el catálogo | ${totalRequisitos} |`);
  lineas.push(
    `| Requisitos cubiertos (✅ + ⚠️) | ${cubiertosCount} (${porcentaje.toFixed(1)}%) |`
  );
  lineas.push(
    `| Requisitos ${sinReportes ? 'sin reportes' : 'sin cobertura'} (❌) | ${sinCobertura.length} |`
  );
  lineas.push(`| Requisitos con tests fallidos u omitidos (⚠️) | ${conFallos} |`);
  lineas.push(`| Pruebas analizadas | ${pruebas.length} |`);
  lineas.push(`| Pruebas fallidas | ${totalFallos} |`);
  lineas.push(`| Pruebas omitidas | ${totalOmitidos} |`);
  lineas.push(`| Suites / archivos de prueba | ${suites.size} |`);
  lineas.push(`| Reportes JUnit leídos | ${archivos.length} |`);
  lineas.push('');
  lineas.push(
    '**Criterio de estado:** ✅ cuando todos los tests que cubren el requisito pasan; ' +
      '⚠️ cuando hay tests pero alguno falló, dio error o fue omitido; ' +
      '❌ cuando ningún test referencia el requisito (o, si no hay reportes, cuando el requisito figura como ' +
      '**sin reportes**). Las pruebas se asocian por los tags entre corchetes ' +
      'del nombre del test y del `classname` de su `<testsuite>`: un `<testcase>` sin tags propios hereda los de ' +
      'su suite, y si tampoco los hay se ignora. Un mismo test puede cubrir varios requisitos.'
  );
  lineas.push('');

  lineas.push('### Desglose por familia');
  lineas.push('');
  lineas.push('| Familia | Requisitos | Cubiertos | Sin cobertura | Cobertura |');
  lineas.push('| --- | ---: | ---: | ---: | ---: |');
  for (const familia of FAMILIAS) {
    const deFamilia = CATALOGO.filter((r) => r.id.startsWith(`${familia.clave}-`));
    const cubiertosFamilia = deFamilia.filter((r) => estados.get(r.id) !== 'sin-cobertura').length;
    const proporcion = deFamilia.length === 0 ? 0 : (cubiertosFamilia / deFamilia.length) * 100;
    lineas.push(
      `| ${familia.titulo} | ${deFamilia.length} | ${cubiertosFamilia} | ${
        deFamilia.length - cubiertosFamilia
      } | ${proporcion.toFixed(1)}% |`
    );
  }
  lineas.push('');

  if (archivos.length > 0) {
    lineas.push('### Reportes analizados');
    lineas.push('');
    for (const archivo of archivos) lineas.push(`- \`${archivo}\``);
    lineas.push('');
  }

  if (tagsDesconocidos.size > 0) {
    const lista = [...tagsDesconocidos.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, veces]) => `\`[${tag}]\` (${veces})`)
      .join(', ');
    lineas.push(`> ℹ️ Tags fuera del catálogo (ignorados en la matriz): ${lista}.`);
    lineas.push('');
  }

  for (const familia of FAMILIAS) {
    const deFamilia = CATALOGO.filter((r) => r.id.startsWith(`${familia.clave}-`));
    if (deFamilia.length === 0) continue;

    lineas.push(`## ${familia.titulo}`);
    lineas.push('');
    lineas.push('| Requisito | Descripción | Tests que lo cubren | Estado |');
    lineas.push('| --- | --- | --- | --- |');

    for (const requisito of deFamilia) {
      const pruebasRequisito = cubiertos.get(requisito.id) ?? [];
      const estado = estados.get(requisito.id) ?? 'sin-cobertura';
      const etiqueta = ETIQUETAS_ESTADO[estado];
      const textoEstado = estado === 'sin-cobertura' ? textoVacio : etiqueta.texto;
      const descripcion = requisito.nota
        ? `${requisito.descripcion} — **${requisito.nota}**`
        : requisito.descripcion;
      let celdaPruebas = '—';

      if (pruebasRequisito.length > 0) {
        const visibles = pruebasRequisito.slice(0, MAX_PRUEBAS_POR_REQUISITO).map(
          (prueba) => `${prefijoEstado(prueba.estado)}${recortar(prueba.nombre, MAX_LARGO_NOMBRE)}`
        );
        const restantes = pruebasRequisito.length - visibles.length;
        if (restantes > 0) visibles.push(`_… (+${restantes} pruebas más)_`);
        celdaPruebas = visibles.join('<br>');
      }

      lineas.push(
        `| \`${requisito.id}\` | ${celda(descripcion)} | ${celdaPruebas} | ${etiqueta.icono} ${textoEstado} |`
      );
    }
    lineas.push('');
  }

  lineas.push('## Requisitos sin cobertura');
  lineas.push('');
  if (sinCobertura.length === 0) {
    lineas.push('🎉 Todos los requisitos del catálogo tienen al menos una prueba asociada.');
  } else {
    lineas.push(
      sinReportes
        ? `No se encontraron reportes JUnit, por lo que los ${sinCobertura.length} requisitos del catálogo ` +
            'aparecen como **❌ sin reportes**:'
        : `Los siguientes ${sinCobertura.length} requisitos no tienen ninguna prueba que los referencie:`
    );
    lineas.push('');
    lineas.push('| Requisito | Descripción |');
    lineas.push('| --- | --- |');
    for (const requisito of sinCobertura) {
      lineas.push(`| \`${requisito.id}\` | ${celda(requisito.descripcion)} |`);
    }
  }
  lineas.push('');
  lineas.push(
    '> **Nota de alcance (ADR-003):** `RF-001` (registro e inicio de sesión) y `RF-002` (gestión de roles) ' +
      'aparecen como **Simulado (SesionLocal)**: la autenticación real con Firebase está fuera del alcance del MVP, ' +
      'por lo que se implementan con `SesionLocalAdapter` sobre `localStorage` y se validan mediante pruebas ' +
      'de infraestructura, no con una suite de autenticación real.'
  );
  lineas.push('');

  if (avisos.length > 0) {
    lineas.push('## Avisos del generador');
    lineas.push('');
    for (const aviso of avisos) lineas.push(`- ${aviso}`);
    lineas.push('');
  }

  return `${lineas.join('\n').trimEnd()}\n`;
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------

function principal() {
  console.log('[trazabilidad] Generando matriz de trazabilidad a partir de reports/junit/...');

  const { pruebas, suites, avisos, archivos, corruptos } = leerReportes();

  if (archivos.length === 0) {
    console.warn(
      '[trazabilidad] AVISO: no hay reportes JUnit en reports/junit/ (directorio inexistente o vacío).'
    );
    console.warn(
      '[trazabilidad] AVISO: genera los XML con `npm test` y `npm run test:e2e`. ' +
        'La matriz se generará igualmente con TODOS los requisitos en ❌ "sin reportes".'
    );
  } else if (pruebas.length === 0) {
    console.warn(
      `[trazabilidad] AVISO: se encontraron ${archivos.length} archivo(s) XML pero ningún <testcase> legible.`
    );
  }

  for (const aviso of avisos) console.warn(`[trazabilidad] AVISO: ${aviso}`);
  if (corruptos.length > 0) {
    console.warn(`[trazabilidad] ${corruptos.length} reporte(s) con problemas; se continúa con el resto.`);
  }

  const { cubiertos, tagsDesconocidos } = agruparPorRequisito(pruebas);
  const fecha = new Date();
  const markdown = construirMatriz({
    pruebas,
    suites,
    cubiertos,
    tagsDesconocidos,
    archivos: archivos.map((ruta) => relative(RAIZ, ruta).split('\\').join('/')),
    avisos,
    fecha
  });

  mkdirSync(join(RAIZ, 'Docs', 'testing'), { recursive: true });
  writeFileSync(RUTA_MATRIZ, markdown, 'utf8');

  const totalRequisitos = CATALOGO.length;
  const cubiertosCount = CATALOGO.filter((r) => (cubiertos.get(r.id) ?? []).length > 0).length;
  const sinCobertura = totalRequisitos - cubiertosCount;
  const porcentaje = totalRequisitos === 0 ? 0 : (cubiertosCount / totalRequisitos) * 100;
  const totalFallos = pruebas.filter((prueba) => prueba.estado === 'fallo').length;
  const totalOmitidos = pruebas.filter((prueba) => prueba.estado === 'omitido').length;

  console.log(
    `[trazabilidad] Reportes: ${archivos.length} XML | pruebas: ${pruebas.length} ` +
      `(fallos: ${totalFallos}, omitidas: ${totalOmitidos}) | suites: ${suites.size}`
  );
  console.log(
    `[trazabilidad] Requisitos: ${totalRequisitos} | cubiertos: ${cubiertosCount} (${porcentaje.toFixed(
      1
    )}%) | sin cobertura: ${sinCobertura}`
  );
  if (tagsDesconocidos.size > 0) {
    console.log(`[trazabilidad] Tags fuera del catálogo ignorados: ${tagsDesconocidos.size}`);
  }
  console.log(`[trazabilidad] Matriz escrita en ${relative(RAIZ, RUTA_MATRIZ).split('\\').join('/')}`);

  if (archivos.length === 0 && ESTRICTO) {
    console.error('[trazabilidad] Modo --estricto: no hay reportes JUnit; se sale con código 1.');
    process.exit(1);
  }
  process.exit(0);
}

principal();
