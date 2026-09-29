#!/usr/bin/env node
/**
 * Verifica el artefacto de build (CI, job `build`).
 *
 * Comprueba, sin listas escritas a mano:
 *  - que se generaron TODAS las rutas esperadas de forma estructural (portada + dashboard + comunidad
 *    + docente + 10 lecciones + 10 evaluaciones = 24 páginas mínimas);
 *  - que el Service Worker y el manifest existen y respetan el `base` de Astro;
 *  - que ningún HTML referencia assets con ruta absoluta sin el prefijo de despliegue.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dist = join(raiz, 'dist');

function leerBase() {
  if (process.env.YAPU_BASE) return process.env.YAPU_BASE.replace(/\/+$/, '');
  const config = readFileSync(join(raiz, 'astro.config.mjs'), 'utf8');
  const coincidencia = /base:\s*'([^']+)'/.exec(config);
  return (coincidencia?.[1] ?? '').replace(/\/+$/, '');
}

const BASE = leerBase();
const fallos = [];

if (!existsSync(dist)) {
  console.error('[paginas] No existe dist/. Ejecuta `npm run build` primero.');
  process.exit(1);
}

function listarArchivos(directorio) {
  const encontrados = [];
  for (const entrada of readdirSync(directorio)) {
    const completo = join(directorio, entrada);
    if (statSync(completo).isDirectory()) encontrados.push(...listarArchivos(completo));
    else encontrados.push(relative(dist, completo).split('\\').join('/'));
  }
  return encontrados.sort();
}

const archivos = listarArchivos(dist);
const htmls = archivos.filter((archivo) => archivo.endsWith('.html'));
const rutas = htmls.map((archivo) =>
  archivo === 'index.html' ? '/' : `/${archivo.replace(/index\.html$/, '')}`
);

const esperadas = [
  '/',
  '/dashboard/',
  '/community/',
  '/docente/',
  ...Array.from({ length: 10 }, (_, i) => `/lesson/${i + 1}/`),
  ...Array.from({ length: 10 }, (_, i) => `/quiz/${i + 1}/`)
];

for (const esperada of esperadas) {
  if (!rutas.includes(esperada)) fallos.push(`Falta la ruta ${esperada}`);
}

if (rutas.length < 24) {
  fallos.push(`Se esperaban al menos 24 páginas y se generaron ${rutas.length}`);
}

for (const requerido of ['sw.js', 'manifest.json', 'favicon.svg']) {
  if (!archivos.includes(requerido)) fallos.push(`Falta el artefacto ${requerido}`);
}

if (BASE) {
  const manifest = existsSync(join(dist, 'manifest.json'))
    ? JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'))
    : {};
  if (manifest.start_url !== `${BASE}/`) {
    fallos.push(`manifest.start_url debe ser "${BASE}/" y es "${manifest.start_url}"`);
  }
  if (manifest.scope !== `${BASE}/`) {
    fallos.push(`manifest.scope debe ser "${BASE}/" y es "${manifest.scope}"`);
  }
  const sw = existsSync(join(dist, 'sw.js')) ? readFileSync(join(dist, 'sw.js'), 'utf8') : '';
  if (!sw.includes(`"${BASE}"`)) fallos.push(`El Service Worker no usa el base "${BASE}"`);
  if (!sw.includes('network-first') && !sw.includes('redPrimero')) {
    fallos.push('El Service Worker no implementa estrategia network-first para HTML');
  }
}

// Ningún HTML puede enlazar assets con "/_astro/..." sin el prefijo del base.
for (const html of htmls) {
  const contenido = readFileSync(join(dist, html), 'utf8');
  if (BASE && /(href|src)="\/_astro\//.test(contenido)) {
    fallos.push(`${html} referencia assets sin el prefijo "${BASE}"`);
  }
}

console.log(`[paginas] ${rutas.length} páginas generadas, ${archivos.length} archivos en dist/.`);
console.log(`[paginas] Rutas: ${rutas.join(' ')}`);

if (fallos.length > 0) {
  console.error('[paginas] FALLOS:');
  for (const fallo of fallos) console.error(`  - ${fallo}`);
  process.exit(1);
}
console.log('[paginas] OK: todas las rutas y artefactos esperados están presentes.');
