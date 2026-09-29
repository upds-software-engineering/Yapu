# ADR-004 — Despliegue en GitHub Pages bajo `/Yapu/`

- **Estado:** Aceptado (con un requisito operativo manual pendiente)
- **Fecha:** 2026-09-29
- **Ámbito:** compilación estática, rutas, Service Worker, publicación y verificación posterior al despliegue
- **Requisitos relacionados:** RNF-003 (compatibilidad PWA), RNF-006 (rendimiento y Service Worker), RF-009 (funcionamiento offline), RS-001 (sostenibilidad técnica), RS-002 (dispositivos modestos)

---

## 1. Contexto

YAPU debe publicarse sin coste de infraestructura, en un alojamiento estático, y seguir funcionando **sin conexión** (RF-009). Las opciones de despliegue gratuito para un proyecto de curso son GitHub Pages, Netlify, Vercel o Cloudflare Pages.

GitHub Pages impone dos restricciones que marcan todas las decisiones de este ADR:

1. **El sitio no vive en la raíz del dominio.** El proyecto se publica en un subdirectorio: `https://upds-software-engineering.github.io/Yapu/`. Esto es exactamente lo que declara `astro.config.mjs`:

   ```js
   export default defineConfig({
     site: 'https://upds-software-engineering.github.io',
     base: '/Yapu',
     output: 'static',
     build: { assets: '_astro' }
   });
   ```

2. **El repositorio es público, pero la publicación no se activa sola.** La opción *Source: GitHub Actions* de Pages es un ajuste manual del repositorio que ningún workflow puede habilitar por sí mismo.

En el estado previo del proyecto, las rutas se escribían a mano (`href="/dashboard"`, `register('/sw.js')`, `link rel="icon" href="/favicon.svg"`). Bajo `base: '/Yapu'` eso produce enlaces a `https://.../dashboard` — **404** — porque la ruta real es `/Yapu/dashboard/`. Además, el Service Worker estaba en `public/sw.js` como archivo estático con una lista de precache escrita a mano, de modo que cualquier ruta nueva del build quedaba fuera del precache sin que nadie se enterara hasta que un estudiante sin conexión abría una página en blanco.

## 2. Decisión

### 2.1 `base: '/Yapu'` y un helper `ruta()` obligatorio

El prefijo de despliegue se lee de `import.meta.env.BASE_URL` en un único lugar, `src/ui/lib/ruta.ts`:

```ts
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

/** Convierte una ruta lógica (`/quiz/1`) en su URL real (`/Yapu/quiz/1`). */
export function ruta(destino: string): string { /* ... */ }

/** ¿La ruta actual corresponde a este destino? (para resaltar la navegación) */
export function rutaActiva(pathActual: string, destino: string): boolean { /* ... */ }

export function rutaEvaluacion(nivel: number): string { return ruta(`/quiz/${nivel}`); }
export function rutaLeccion(nivel: number, fallas?: readonly string[]): string { /* ... */ }
```

**Regla dura: está prohibido escribir `href="/algo"` a mano.** Todo enlace, `fetch`, `start_url` del manifest y ruta del Service Worker se construye con `ruta()` o con `import.meta.env.BASE_URL`. La verificación de esta regla no depende de la disciplina del equipo:

- `scripts/verificar-paginas.mjs` recorre **todos** los HTML del build y falla si alguno referencia assets con ruta absoluta sin el prefijo:

  ```js
  if (BASE && /(href|src)="\/_astro\//.test(contenido)) {
    fallos.push(`${html} referencia assets sin el prefijo "${BASE}"`);
  }
  ```

- el mismo script exige que `manifest.json` tenga `start_url` y `scope` exactamente iguales a `${BASE}/` y que `dist/sw.js` contenga el base.

### 2.2 Service Worker generado en build, con precache de todas las rutas

`public/sw.js` desaparece como archivo escrito a mano. El Service Worker se **genera** con `scripts/generar-service-worker.mjs`, encadenado en el script `build`:

```json
"build": "astro build && node scripts/generar-service-worker.mjs"
```

Por qué un script y no un archivo estático:

| Motivo | Cómo se resuelve |
| --- | --- |
| La lista de precache se enumeraba a mano y se quedaba obsoleta | El script enumera `dist/**` completo, así que **ninguna ruta generada queda fuera** |
| El caché anterior no se invalidaba entre despliegues | El nombre de caché incluye un **hash del contenido del build**: `const version = \`yapu-${hash.digest('hex').slice(0, 12)}\``; el handler `activate` borra las cachés cuyo nombre no coincide |
| El base hardcodeado en el SW rompía al cambiar de subdirectorio | El base se lee de `astro.config.mjs` (o de `process.env.YAPU_BASE`) |
| Un `addAll` fallaba completo por una sola ruta ausente | Se usa `Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))` con `add()` individual: una ruta ausente no invalida todo el precache |

Además se añaden variantes de URL para rutas con `index.html`, porque la navegación puede llegar con o sin barra final (`/Yapu/quiz/1` y `/Yapu/quiz/1/`).

### 2.3 Versión con hash del build, expuesta en tiempo de ejecución

```js
const VERSION = "yapu-<12 hex del hash sha256 del build>";
const BASE = "/Yapu";
const PRECACHE_URLS = [ /* ... */ ];
const CACHE_NAME = `${VERSION}`;
```

El Service Worker responde a un `postMessage('YAPU_VERSION')` con `{ tipo, version, rutas }`, lo que permite mostrar en la UI la versión realmente cacheada y detectar que un estudiante está ejecutando un build antiguo.

### 2.4 Estrategias de caché: *network-first* para HTML, *cache-first* para assets

```js
self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;            // no se cachea nada de terceros

  const aceptaHtml = (peticion.headers.get('accept') || '').includes('text/html');
  const esDocumento = peticion.mode === 'navigate' || aceptaHtml;
  evento.respondWith(esDocumento ? redPrimero(peticion) : cachePrimero(peticion));
});
```

| Tipo de petición | Estrategia | Razón |
| --- | --- | --- |
| Documento HTML (navegación o `Accept: text/html`) | **network-first** con respaldo al caché | Contenido siempre fresco cuando hay red; sin conexión, responde desde el precache |
| Assets (`_astro/*`, iconos, fuentes locales) | **cache-first** | Los nombres llevan hash de contenido: si el nombre no cambió, el contenido no cambió |
| Origen distinto (Google Fonts) | **Sin interceptar** | El SW no cachea terceros; evita servir recursos ajenos obsoletos |

`redPrimero` incluye respaldos encadenados cuando no hay red: primero la misma ruta con/sin barra final y, en último término, la portada (`${BASE}/`). Si nada existe en caché, devuelve `503` con un mensaje en español (`'Sin conexión y sin copia local de esta página.'`) en lugar de dejar la pantalla en blanco.

### 2.5 Estructura del manifest y rutas canónicas bajo `/Yapu/`

`public/manifest.json` declara todas sus rutas con el prefijo de despliegue:

```json
{
  "start_url": "/Yapu/",
  "scope": "/Yapu/",
  "id": "/Yapu/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0B0F19",
  "theme_color": "#B94700",
  "icons": [
    { "src": "/Yapu/favicon.svg", "sizes": "any", "type": "image/svg+xml" },
    { "src": "/Yapu/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/Yapu/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Las 24 rutas esperadas del sitio son portada, tablero, comunidad, panel docente, 10 lecciones y 10 evaluaciones. `scripts/verificar-paginas.mjs` las deduce estructuralmente (no de una lista escrita a mano de resultados) y falla si falta alguna.

### 2.6 Publicación: CI como puerta y `deploy.yml` como publicador

El despliegue está partido en dos workflows con responsabilidades disjuntas:

**`.github/workflows/ci.yml`** — cinco jobs encadenados:

| Job | Depende de | Qué hace |
| --- | --- | --- |
| `quality` | — | `npm run lint` (ESLint + `tsc --noEmit` + `astro check`) y `npm run lint:capas` |
| `test` | `quality` | `npm run test:coverage`; sube `reports/coverage` y `reports/junit` y publica el resumen en la pestaña Summary |
| `build` | `quality` | `npm run build` + `npm run verificar:paginas`; sube el artefacto `dist` |
| `e2e` | `build`, `test` | Playwright sobre `dist/` servido con `npm run preview` en `http://localhost:9500/Yapu/`: flujos, a11y y UX, cada uno con su propio JUnit |
| `trazabilidad` | `test`, `e2e` | `npm run reports:trazabilidad` → `Docs/testing/matriz-trazabilidad.md`, subido como artefacto y publicado en el Summary |

El CI se dispara en `push` a `main`, `dev` y `refactor/**`, y en `pull_request` a `main` y `dev`, con `concurrency` que cancela la ejecución anterior de la misma ref.

**`.github/workflows/deploy.yml`** — publica en Pages:

- se dispara con `workflow_run` cuando el workflow **CI** termina con `conclusion == 'success'` en `main`, y también con `workflow_dispatch` para republicar manualmente;
- **recompila desde el commit exacto** (`ref: github.event.workflow_run.head_sha`) en lugar de reutilizar el artefacto `dist` del CI: garantiza que el sitio servido corresponde a ese SHA;
- usa OIDC sin secretos: `permissions: { contents: read, pages: write, id-token: write }`;
- `concurrency: { group: pages, cancel-in-progress: false }`: un despliegue simultáneo, sin cancelar el que esté en curso;
- tras `actions/deploy-pages@v4`, ejecuta un **smoke test post-despliegue** con `curl --retry-all-errors` sobre la portada y `quiz/1/`:
  ```bash
  for ruta in "" "quiz/1/"; do
    url="${base}${ruta}"
    if curl -fsS --retry 5 --retry-delay 5 --retry-all-errors -o /dev/null "$url"; then ...
  ```
  porque una publicación correcta con la CDN aún propagándose es un falso negativo clásico.

### 2.7 Nota operativa: un humano debe habilitar Pages

> **Requisito manual, una sola vez:** en **Settings → Pages → Source** debe seleccionarse **«GitHub Actions»**.

Está escrito en el encabezado de `.github/workflows/deploy.yml`. Mientras no se habilite, `deploy.yml` puede ejecutarse y `deploy-pages` **fallará** porque el sitio de Pages no está inicializado. No es un error del workflow ni algo que el repositorio pueda resolver por sí solo: requiere a una persona con permisos de administración sobre el repositorio.

## 3. Justificación

1. **Coste cero y disponibilidad alta.** GitHub Pages sirve un sitio estático desde una CDN global sin factura ni operación. Para un proyecto académico con presupuesto nulo, es la opción natural.
2. **El subdirectorio es una restricción, no un detalle.** Centralizar el prefijo en `ruta()` y verificar `dist/**` convierte un error de despliegue silencioso (404 en producción, todo bien en local con `base: '/'`) en un fallo de CI.
3. **Un Service Worker escrito a mano se pudre.** El precache enumerado del propio build y el hash de contenido eliminan dos clases enteras de bugs: "ruta nueva no cacheada" y "caché viejo servido".
4. **`network-first` para HTML y `cache-first` para assets** es la combinación correcta cuando los assets llevan hash: máxima frescura del documento sin descargar de nuevo recursos inmutables.
5. **No cachear terceros** evita el escenario en el que la aplicación sirve una versión antigua de Google Fonts o, peor, contenido de otro origen bajo la apariencia de YAPU.
6. **El smoke test es la única prueba de que "desplegado" significa "accesible".** El CI prueba `dist/` en local; sólo un `curl` contra la URL publicada demuestra que Pages está sirviendo el sitio.
7. **Reproducir el build en el deploy** evita el riesgo (pequeño pero real) de publicar un artefacto que no corresponde al commit que pasó las puertas de calidad.

## 4. Consecuencias

### Positivas

- El sitio se publica en `https://upds-software-engineering.github.io/Yapu/` de forma automática al integrar en `main`.
- La PWA es instalable y funciona sin conexión: el precache cubre todas las rutas generadas y el HTML se refresca al recuperar la red.
- Cualquier enlace roto por `base` rompe el CI (`verificar:paginas`), no la experiencia del estudiante.
- Cada despliegue tiene una versión identificable (`yapu-<hash>`) consultable desde la página.
- Los reportes de pruebas y la matriz de trazabilidad quedan como artefactos descargables de cada ejecución.

### Costes y límites asumidos

- **La publicación no se activa sola.** Requiere que un humano habilite *Pages → Source: GitHub Actions* (ver 2.7). Es un bloqueo de una sola vez, pero bloqueo al fin.
- **Sólo se publica `main`.** Un cambio validado en `refactor/**` o `dev` no es visible en Pages hasta integrarse en `main`.
- **`base: '/Yapu'` está escrito en `astro.config.mjs` y en `public/manifest.json`.** El scripts de verificación lo detectan, pero renombrar el repositorio o mover el sitio a la raíz obliga a tocar ambos archivos y a revisar el manifest.
- **Rutas con hash = caché por build completo.** Cualquier cambio en cualquier archivo cambia el hash y obliga a revalidar todo el precache en el siguiente arranque. Aceptado: el build es pequeño.
- **Sin cabeceras HTTP propias.** En Pages no se pueden fijar `Cache-Control`, `Content-Security-Policy` ni cabeceras de seguridad; la estrategia de caché queda enteramente en manos del Service Worker.
- **Sin *rollback* automático.** Revertir un despliegue defectuoso implica `workflow_dispatch` sobre un commit anterior o un *revert* en `main`.
- **El smoke test comprueba dos rutas, no todas.** Es un indicador de disponibilidad, no una verificación funcional completa (esa es responsabilidad del job `e2e`).

## 5. Alternativas consideradas

| Alternativa | Por qué se descartó |
| --- | --- |
| **Netlify / Vercel / Cloudflare Pages** | Permiten raíz de dominio, cabeceras propias y *preview* por PR, pero requieren una cuenta de terceros y un vínculo externo al repositorio institucional. Pages ya está en el ecosistema de GitHub y no añade proveedores. |
| **Publicar en la raíz (`base: '/'`) con un dominio propio** | Elimina el problema del prefijo, pero exige comprar y configurar un dominio, y `site`/`base` seguirían siendo configuración. No aporta valor pedagógico. |
| **Mantener `public/sw.js` escrito a mano** | Es el estado previo: precache obsoleto silencioso, caché que no se invalida y base hardcodeado. |
| **`cache-first` también para HTML** | Serviría documentos obsoletos a estudiantes con conexión: el peor síntoma posible (una función nueva "no aparece"). |
| **`network-first` también para assets** | Descargaría de nuevo recursos inmutables con hash: desperdicio de datos móviles, contrario a RS-002. |
| **Plugin de Service Worker de terceros** (`vite-plugin-pwa`, Workbox) | Añade dependencias y configuración opaca para un caso que cabe en ~90 líneas de script generado, auditables y sin dependencias. |
| **GitHub Actions con `actions/deploy-pages` sin smoke test** | Un despliegue "verde" que sirve 404 es indistinguible del éxito sin comprobar la URL publicada. |
| **Reutilizar el artefacto `dist` del CI en el deploy** | Más rápido, pero publica un binario cuyo origen exacto hay que confiar; recompilar desde el SHA elimina la duda a cambio de ~1 minuto. |
| **Hospedar la app con `dynamic`/SSR en un servidor** | Contradice la decisión de PWA estática (ADR-001) y añade coste y operación. El producto no necesita servidor. |

## 6. Estado

**Aceptado; compilación, Service Worker, CI y workflow de despliegue implementados. La activación de Pages es un requisito operativo pendiente de una persona.**

| Elemento | Estado verificado |
| --- | --- |
| `base: '/Yapu'` y `site` en `astro.config.mjs` | Implementado |
| `src/ui/lib/ruta.ts` (`ruta`, `rutaActiva`, `rutaEvaluacion`, `rutaLeccion`) | Implementado |
| `scripts/generar-service-worker.mjs` encadenado en `build` | Implementado |
| Estrategias *network-first* / *cache-first* y versión con hash | Implementado |
| `public/manifest.json` con `start_url` y `scope` bajo `/Yapu/` | Implementado |
| `scripts/verificar-paginas.mjs` (24 rutas, SW, manifest, prefijo de assets) | Implementado |
| `.github/workflows/ci.yml` (calidad, pruebas, build, e2e, trazabilidad) | Implementado |
| `.github/workflows/deploy.yml` (publicación + smoke test) | Implementado |
| Migración de todos los `href="/..."` del legado a `ruta()` | **Pendiente** (los componentes de `src/components` aún usan rutas absolutas; ver el apartado de pendientes del checklist de UX) |
| Pages habilitado con *Source: GitHub Actions* | **Pendiente de acción humana** |

## 7. Referencias internas

- [`Docs/arquitectura/ADR-001-arquitectura-hexagonal.md`](ADR-001-arquitectura-hexagonal.md)
- [`Docs/arquitectura/ADR-002-persistencia-local-y-sincronizacion.md`](ADR-002-persistencia-local-y-sincronizacion.md)
- `astro.config.mjs`, `scripts/generar-service-worker.mjs`, `scripts/verificar-paginas.mjs`, `src/ui/lib/ruta.ts`, `public/manifest.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
