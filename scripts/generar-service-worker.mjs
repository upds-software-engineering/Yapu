#!/usr/bin/env node
/**
 * RF-009 / RNF-006 — Genera `dist/sw.js` DESPUÉS del build.
 *
 * Por qué un script y no un archivo estático en `public/`:
 *  - la lista de precache se enumera del propio `dist/`, así que ninguna ruta generada queda fuera;
 *  - el nombre de caché incluye un hash del contenido del build, de modo que cada despliegue invalida
 *    el caché anterior (y el handler `activate` borra las cachés viejas);
 *  - el `BASE_URL` se lee del `astro.config.mjs` para respetar la publicación en `/Yapu/`.
 *
 * Estrategias: network-first para HTML (con respaldo al shell), cache-first para assets.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
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

if (!existsSync(dist)) {
  console.error('[sw] No existe dist/. Ejecuta `npm run build` (astro build) antes del generador.');
  process.exit(1);
}

/** @returns {string[]} rutas de archivo relativas con separador `/` */
function listarArchivos(directorio) {
  const encontrados = [];
  for (const entrada of readdirSync(directorio)) {
    const completo = join(directorio, entrada);
    if (statSync(completo).isDirectory()) {
      encontrados.push(...listarArchivos(completo));
    } else {
      encontrados.push(relative(dist, completo).split('\\').join('/'));
    }
  }
  return encontrados.sort();
}

const archivos = listarArchivos(dist).filter((archivo) => archivo !== 'sw.js');

const hash = createHash('sha256');
for (const archivo of archivos) {
  const contenido = readFileSync(join(dist, archivo));
  hash.update(`${archivo}:${contenido.length}:`);
  hash.update(contenido);
}
const version = `yapu-${hash.digest('hex').slice(0, 12)}`;

/** Convierte una ruta de archivo del build en su URL pública bajo BASE. */
function aUrl(archivo) {
  if (archivo === 'index.html') return `${BASE}/`;
  if (archivo.endsWith('/index.html')) return `${BASE}/${archivo.slice(0, -'index.html'.length)}`;
  return `${BASE}/${archivo}`;
}

const urls = new Set();
for (const archivo of archivos) {
  urls.add(aUrl(archivo));
  // Variante sin barra final, porque la navegación puede llegar como /Yapu/quiz/1
  if (archivo.endsWith('/index.html')) {
    urls.add(`${BASE}/${archivo.slice(0, -'/index.html'.length)}`);
  }
}

const precache = [...urls].sort();
const rutasHtml = nuevosArchivosHtml(archivos);

function nuevosArchivosHtml(lista) {
  return lista.filter((archivo) => archivo.endsWith('.html'));
}

const contenidoSw = `/* Generado automáticamente por scripts/generar-service-worker.mjs — NO editar a mano. */
/* Build: ${version} | Rutas en precache: ${precache.length} | HTML: ${rutasHtml.length} */

const VERSION = ${JSON.stringify(version)};
const BASE = ${JSON.stringify(BASE)};
const PRECACHE_URLS = ${JSON.stringify(precache, null, 2)};
const CACHE_NAME = \`\${VERSION}\`;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // add() individual: una ruta ausente no invalida todo el precache.
      const resultados = await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      const fallidas = resultados.filter((r) => r.status === 'rejected').length;
      if (fallidas > 0) console.warn('[sw] Rutas no precacheadas:', fallidas);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(claves.filter((clave) => clave !== CACHE_NAME).map((clave) => caches.delete(clave)));
      await self.clients.claim();
    })()
  );
});

async function buscarEnCache(cache, peticion) {
  /*
   * ignoreVary es IMPRESCINDIBLE: el servidor de assets responde con cabeceras Vary (por ejemplo
   * Accept-Encoding) y, sin ignorarlas, un modulo cargado con import() dinamico —cuyas cabeceras
   * difieren de las del precache— NO casa con la copia guardada y la aplicacion se queda sin
   * hidratar cuando no hay red. El segundo intento compara solo por ruta, como red de seguridad
   * ante variantes de URL (barra final, cadena de consulta).
   */
  const opciones = { ignoreSearch: true, ignoreVary: true };
  const directa = await cache.match(peticion, opciones);
  if (directa) return directa;
  return (await cache.match(new URL(peticion.url).pathname, opciones)) ?? null;
}

async function redPrimero(peticion) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta && respuesta.ok) {
      await cache.put(peticion, respuesta.clone());
    }
    return respuesta;
  } catch {
    const enCache = await buscarEnCache(cache, peticion);
    if (enCache) return enCache;
    // Respaldos: la misma ruta con/sin barra final y, en último término, la portada.
    const url = new URL(peticion.url);
    const alternativas = [url.pathname.replace(/\\/$/, ''), \`\${url.pathname}/\`, \`\${BASE}/\`];
    for (const alternativa of alternativas) {
      const respaldo = await cache.match(alternativa, { ignoreSearch: true, ignoreVary: true });
      if (respaldo) return respaldo;
    }
    return new Response('Sin conexión y sin copia local de esta página.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function cachePrimero(peticion) {
  const cache = await caches.open(CACHE_NAME);
  const enCache = await buscarEnCache(cache, peticion);
  if (enCache) return enCache;
  const respuesta = await fetch(peticion);
  if (respuesta && respuesta.ok && new URL(peticion.url).origin === self.location.origin) {
    await cache.put(peticion, respuesta.clone());
  }
  return respuesta;
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  const aceptaHtml = (peticion.headers.get('accept') || '').includes('text/html');
  const esDocumento = peticion.mode === 'navigate' || aceptaHtml;
  evento.respondWith(esDocumento ? redPrimero(peticion) : cachePrimero(peticion));
});

self.addEventListener('message', (evento) => {
  if (evento.data === 'YAPU_VERSION') {
    evento.source?.postMessage({ tipo: 'YAPU_VERSION', version: VERSION, rutas: PRECACHE_URLS.length });
  }
});
`;

writeFileSync(join(dist, 'sw.js'), contenidoSw, 'utf8');
console.log(
  `[sw] dist/sw.js generado — versión ${version}, ${precache.length} rutas en precache (${rutasHtml.length} HTML), base "${BASE}".`
);
