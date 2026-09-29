# Plan de pruebas — YAPU

| | |
| --- | --- |
| **Proyecto** | YAPU — Plataforma PWA web y móvil para el aprendizaje de Quechua con IA determinista |
| **Rama** | `refactor/hexagonal` (refactor terminado y verde) |
| **Stack de pruebas** | Astro 5 · React 19 · TypeScript · Tailwind CSS · Vitest 5 (jsdom) · Playwright 1.63 (Chromium) · `@axe-core/playwright` · `@vitest/coverage-v8` |
| **Última ejecución de referencia** | Vitest: **522/522** pruebas en verde, 31 archivos, 0 fallos, 0 omitidas (`reports/junit/vitest.xml`). Playwright: **98/98** en verde (49 × 2 proyectos), 0 fallos, 0 omitidas (`reports/junit/playwright.xml`). Cobertura global: **93.56 % sentencias · 81.5 % ramas · 95.31 % funciones · 95.29 % líneas**. `tsc --noEmit` y `eslint --max-warnings 0`: 0 errores. `lint:capas`: 0 violaciones. Build: 24 páginas, `dist/sw.js` con 111 rutas en precache |
| **Estado más reciente de los artefactos** | La suite sigue creciendo: el último JUnit registra **532 pruebas en 32 suites** (se añadió `tests/unit/arquitectura/sostenibilidad.test.ts`, 10 pruebas de `RNF-001`, `RNF-003`, `RNF-004`, `RNF-006`, `RS-001`, `RS-002` y `RS-003`) y la matriz regenerada ya lee **2 informes, 630 pruebas y 42 suites, con 44/44 requisitos cubiertos**. Las cifras de este documento se recalculan en cada ejecución: la fuente de verdad son `reports/junit/*.xml` y [matriz-trazabilidad.md](matriz-trazabilidad.md) |

Este documento es la fuente de verdad de la estrategia de verificación: **cuántas pruebas hay, dónde
viven, qué verifican, con qué criterios se aceptan y con qué evidencias se demuestran**. Todas las
cifras son conteos reales de la suite actual, no estimaciones.

---

## 1. Introducción y alcance

La estrategia sigue la arquitectura hexagonal del proyecto: el núcleo (`src/domain`, `src/application`)
se prueba de forma pura y aislada; los adaptadores (`src/infrastructure`, `src/ui`) se prueban en los
bordes; y los recorridos completos se comprueban en un navegador real sobre el build de producción.

### 1.1 Qué se prueba

| Área | Qué se verifica |
| --- | --- |
| Dominio | Entidades, objetos de valor, políticas y reglas de negocio `RN-01`…`RN-17` (desbloqueo secuencial, XP, racha, umbral 70, generación de 10 preguntas con 4 opciones, cloze, CSV, retos comunitarios) |
| Aplicación | Casos de uso (mapa, lección, evaluación, calificación, tablero, sesión, oraciones, moderación, exportación, sincronización) con puertos sustituidos por dobles en memoria |
| Contratos | El **mismo** contrato de repositorios y puertos ejecutado contra los adaptadores en memoria **y** contra los de `localStorage` (jsdom) |
| Interfaz | Componentes React de `src/ui` con Testing Library: estados de carga/error/vacío, interacción, textos en español y quechua, accesibilidad por teclado y leyes UX a nivel de componente |
| Integración y E2E | Flujos completos del estudiante y del docente en Chromium, en escritorio (`Desktop Chrome`) y móvil (`Pixel 5`) |
| Accesibilidad | Cero violaciones de `axe-core` con las reglas WCAG 2.0/2.1 A y AA en las 6 pantallas del recorrido crítico |
| Leyes UX | Mediciones automatizadas de Fitts, Hick, Miller, Apogeo-Final y Estética-Usabilidad sobre el DOM renderizado, más Jakob en prueba de componente |
| PWA | Manifest, Service Worker, rutas bajo `base: '/Yapu/'` y funcionamiento sin conexión tras la primera visita |
| Arquitectura | Reglas de dependencias hexagonales (`npm run lint:capas`, con auto-test del detector) y rutas/artefactos del build (`npm run verificar:paginas`) |

### 1.2 Qué NO se prueba (fuera de alcance)

- **Autenticación real (RF-001 / RF-002): SIMULADA.** Por decisión de alcance
  ([ADR-003](../arquitectura/ADR-003-autenticacion-simulada.md)), el registro y los roles se resuelven
  con `SesionLocalAdapter` sobre `localStorage` (`SesionPort`). Se valida el *contrato* del puerto y el
  adaptador local (identidad estable, cambio de rol, persistencia), no un proveedor de identidad
  externo. En la matriz de trazabilidad estos requisitos aparecen como **Simulado (SesionLocal)**.
- **Sincronización real con la nube.** La cola offline (RN-15) se prueba contra el puerto de
  sincronización; el adaptador remoto es `SincronizacionNoopAdapter`, un *no-op* deliberado
  ([ADR-002](../arquitectura/ADR-002-persistencia-local-y-sincronizacion.md)).
- **IA generativa o servicios LLM.** El motor es **determinista** y se prueba con semillas y relojes
  fijos (`AleatorioFijo`, `RelojFijo`); ninguna prueba consume APIs externas ni red.
- **Rendimiento de campo y carga.** Se verifica el build (páginas generadas, precache del Service
  Worker y rutas), no métricas RUM ni pruebas de carga.
- **Navegadores distintos de Chromium.** La matriz E2E usa Chromium en escritorio y emulación de
  `Pixel 5`; Safari/iOS, Firefox y tabletas quedan como verificación manual.
- **Instalación y despliegue reales.** El plan verifica `dist/` y el Service Worker, no el pipeline de
  GitHub Pages ni la instalación de la PWA en un dispositivo físico.

---

## 2. Pirámide de pruebas

La pirámide del proyecto se apoya en tres niveles de Vitest —unitarias (dominio, aplicación,
infraestructura y arquitectura), contratos y componentes— y en tres suites E2E sobre Chromium. Todas las
cifras de esta sección son conteos reales de los informes JUnit, no estimaciones.

### 2.1 Conteo real por nivel y carpeta

Todas las cifras salen de `reports/junit/vitest.xml` (31 `<testsuite>`, 522 `<testcase>`) y del conteo
de `test(`/bucles de los `*.spec.ts` de Playwright.

| Nivel | Carpeta | Herramienta | Archivos | Pruebas | Cómo se ejecuta |
| --- | --- | --- | ---: | ---: | --- |
| 1. Unitaria de dominio | `tests/unit/domain/**` | Vitest (jsdom) | 11 | **234** | `npm run test:unit` |
| 1. Unitaria de aplicación | `tests/unit/application/**` | Vitest (jsdom) | 5 | **99** | `npm run test:unit` |
| 1. Unitaria de infraestructura | `tests/unit/infrastructure/**` | Vitest (jsdom) | 4 | **63** | `npm run test:unit` |
| 1b. Arquitectura y sostenibilidad | `tests/unit/arquitectura/**` | Vitest | 2 | **13** | `npm run test:unit` (o `npm run lint:capas`) |
| 2. Contratos | `tests/contract/**` | Vitest (jsdom) | 2 | **30** | `npm run test:contract` |
| 3. Componentes | `tests/component/**` | Vitest + Testing Library (React 19) | 8 | **93** | `npm run test:component` |
| **Subtotal Vitest** | `tests/unit` + `tests/contract` + `tests/component` | — | **32** | **532** | `npm test` · `npm run test:coverage` |
| 4. E2E de flujos | `tests/e2e/flujos/**` | Playwright (Chromium) | 6 | **12 × 2 proyectos = 24** | `npm run test:e2e` |
| 5. E2E de accesibilidad | `tests/e2e/a11y/**` | Playwright + `@axe-core/playwright` | 1 | **6 × 2 = 12** | `npm run test:a11y` |
| 6. E2E de leyes UX | `tests/e2e/ux/**` | Playwright (mediciones del DOM) | 3 | **31 × 2 = 62** | `npm run test:e2e:ux` |
| **Subtotal Playwright** | `tests/e2e/**` | — | **10** | **49 × 2 = 98** | `npm run test:all` |
| Transversal. Cobertura | — | `@vitest/coverage-v8` | — | — | `npm run test:coverage` |
| Transversal. Build | — | Astro + script propio | — | — | `npm run build && npm run verificar:paginas` |
| Transversal. Trazabilidad | — | Script propio (`node:`) | — | 44 requisitos | `npm run reports:trazabilidad` |

**Cómo se cuentan.** En Vitest, cada `<testcase>` del JUnit es una prueba (532 en total en el informe
más reciente). En Playwright, un `test()` dentro de un bucle
`for (const ruta of PANTALLAS_UX)` genera **una prueba por ruta y por proyecto**: por eso el conteo de
líneas `test(` de los specs (24) es menor que las pruebas ejecutadas (98). Los archivos de ayuda
(`tests/e2e/helpers/sesion.ts`, `tests/e2e/helpers/ux.ts`, `tests/helpers/*`,
`tests/contract/persistence.contract.ts`) no cuentan como suites: son el contrato y los recorridos
compartidos. Las cifras se recalculan en cada ejecución: la fuente de verdad son `reports/junit/*.xml`
y la matriz de trazabilidad.

### 2.2 Reparto del núcleo (409 unitarias)

| Carpeta | Archivos destacados (pruebas) |
| --- | --- |
| `tests/unit/domain/` (234) | `value-objects.test.ts` (48) · `aprendizaje/progreso-estudiante.test.ts` (33) · `aprendizaje/politicas.test.ts` (24) · `texto.test.ts` (21) · `contenido/reto-comunitario.test.ts` (21) · `contenido/serializador-csv.test.ts` (17) · `evaluacion/generador-evaluacion.test.ts` (17) · `evaluacion/politica-aprobacion.test.ts` (17) · `contenido/oracion-base.test.ts` (15) · `evaluacion/pregunta.test.ts` (13) · `evaluacion/calificador.test.ts` (8) |
| `tests/unit/application/` (99) | `aprendizaje.test.ts` (32) · `contenido.test.ts` (32) · `evaluacion.test.ts` (22, incluye el desbloqueo `RN-02`) · `sesion.test.ts` (7) · `sincronizacion.test.ts` (6) |
| `tests/unit/infrastructure/` (63) | `system.test.ts` (21) · `aleatorio-helper.test.ts` (19) · `migracion.test.ts` (12) · `catalogo-semilla.test.ts` (11) |
| `tests/unit/arquitectura/` (13) | `capas.test.ts` (3): el dominio no importa infraestructura ni UI; sin `any`; sin `Date.now`/`Math.random` directos. `sostenibilidad.test.ts` (10): sin credenciales ni SDK en la nube (`RNF-004`), una sola escala tipográfica en `src/ui|pages|layouts` (`RNF-001`), manifest PWA y proyecto Pixel 5 (`RNF-003`), Service Worker con hash y estrategias por tipo (`RNF-006`), doble moderación y bitácora (`RS-003`), degradación del título animado (`RS-002`) y existencia/contenido de los ADR y de los documentos de pruebas y de leyes UX (`RS-001`) |

> En la tabla anterior, los nombres de la segunda columna son **rutas relativas a la carpeta de la
> primera columna** (por ejemplo `aprendizaje/politicas.test.ts` es
> `tests/unit/domain/aprendizaje/politicas.test.ts`).

### 2.3 Componentes (93 pruebas, 8 archivos)

| Archivo | Pruebas | Qué cubre |
| --- | ---: | --- |
| `tests/component/design-system.test.tsx` | 21 | `Boton`, `Tabs`, `EnvoltorioCtaFijo`, `BarraProgreso`, `Tarjeta`, `Insignia`, `MensajeError`, `EstadoCarga`/`EstadoVacio` y `PlaceholderCategoria` |
| `tests/component/docente.test.tsx` | 13 | Guardia de rol, formulario en 2 pasos, listado agrupado, moderación y exportación |
| `tests/component/leccion.test.tsx` | 13 | Flashcard (volteo, flechas, imagen y SVG de respaldo), marcado y cierre de lección |
| `tests/component/tablero.test.tsx` | 11 | Métricas, palabras para repasar, historial agrupado y contador de sincronización |
| `tests/component/comunidad.test.tsx` | 10 | Aviso por nivel insuficiente, propuesta de reto y estados de moderación |
| `tests/component/navegacion.test.tsx` | 10 | Navegación adaptativa, `SelectorRol`, `BannerConexion` y contrato de selectores |
| `tests/component/mapa-niveles.test.tsx` | 9 | 3 tramos, estados de nivel, CTA primario único y estados de carga/error |
| `tests/component/evaluacion.test.tsx` | 6 | RN-16 (marcar antes de avanzar), nivel bloqueado, clímax aprobado/reprobado, confeti y tipografía |

### 2.4 Contratos (30 pruebas, 2 archivos)

`tests/contract/memory.contract.test.ts` (15) y `tests/contract/local-storage.contract.test.ts` (15)
ejecutan **la misma** batería definida en `tests/contract/persistence.contract.ts` contra los
repositorios en memoria y contra los de `localStorage`: progreso, evaluaciones y oraciones, incluida la
reconstrucción de entidades, el aislamiento entre estudiantes y la cola pendiente (RN-15).

### 2.5 Puertas de calidad rápidas vs. lentas

Los niveles 1–3 corren en segundos (`reports/junit/vitest.xml` registra el tiempo acumulado de tests) y
pueden ejecutarse en cada cambio. Los niveles 4–6 requieren un `npm run build` previo y el navegador
instalado, por lo que se reservan a la validación de la rama.

---

## 3. Convención de nomenclatura y trazabilidad

Todo `describe` de nivel superior lleva el requisito funcional que ejercita y todo `it`/`test` que
verifica una regla de negocio o una ley UX lleva su etiqueta entre corchetes **al inicio** del nombre:

```ts
describe('[RF-005] Evaluación con IA determinista', () => {
  it('[RN-16] exige marcar una respuesta para avanzar y conserva los cambios al volver atrás', () => {});
  it('[UX-APOGEO] al aprobar celebra el clímax con XP, insignia y un único CTA primario', () => {});
});

test.describe('[UX-FITTS] Ley de Fitts', () => {
  test(`[UX-FITTS] los objetivos táctiles de ${ruta} respetan el mínimo del proyecto`, async ({ page }) => {});
});
```

Un mismo test puede cubrir varios requisitos: basta con incluir varias etiquetas
(`test('[RF-005] [UX-APOGEO] reprobar ofrece el repaso de las palabras falladas')`).

### 3.1 Catálogo de etiquetas (44 requisitos trazables)

| Familia | Etiquetas | Descripción |
| --- | --- | --- |
| Funcionales | `[RF-001]` … `[RF-010]` | Requisitos funcionales del SRS (10) — los 10 tienen pruebas |
| No funcionales | `[RNF-001]` … `[RNF-007]` | Usabilidad, accesibilidad, compatibilidad, seguridad, mantenibilidad, rendimiento y disponibilidad (7) — los 7 tienen pruebas: `RNF-001`, `RNF-003`, `RNF-004`, `RNF-006` y `RS-*` en `tests/unit/arquitectura/sostenibilidad.test.ts`; `RNF-002` en la suite de accesibilidad; `RNF-005` en los contratos y en la semilla; `RNF-007` en el flujo sin conexión |
| Sostenibilidad | `[RS-001]` … `[RS-004]` | Sostenibilidad técnica, eficiencia energética, gobernanza y datos abiertos (4) — los 4 tienen pruebas: `RS-001`, `RS-002` y `RS-003` en `tests/unit/arquitectura/sostenibilidad.test.ts`, y `RS-004` en la exportación CSV |
| Reglas de negocio | `[RN-01]` … `[RN-17]` | Desbloqueo, progreso, XP, racha, generación y calificación, offline, CSV, identificadores (17) — las 17 tienen pruebas |
| Leyes UX | `[UX-JAKOB]`, `[UX-HICK]`, `[UX-FITTS]`, `[UX-MILLER]`, `[UX-APOGEO]`, `[UX-ESTETICA]` | Las seis leyes (6) — las 6 tienen pruebas. `[UX-JAKOB]` vive en `tests/component/navegacion.test.tsx` y `tests/component/design-system.test.tsx`, no en un spec E2E |

Las etiquetas se normalizan (mayúsculas y relleno numérico: `RN-9` → `RN-09`), así que una errata de
formato no rompe la matriz. Las etiquetas fuera del catálogo se reportan como aviso y se ignoran: hoy
sólo ocurre con `[A5]` (19 apariciones) en `tests/unit/infrastructure/aleatorio-helper.test.ts`.

### 3.2 Ciclo de trazabilidad

1. Ejecutar las suites: `npm test` (genera `reports/junit/vitest.xml`) y
   `npm run test:e2e && npm run test:a11y && npm run test:e2e:ux` (generan
   `reports/junit/playwright.xml`, según el reporter de `playwright.config.ts`).
2. Ejecutar `npm run reports:trazabilidad` para regenerar
   [matriz-trazabilidad.md](matriz-trazabilidad.md).
3. La matriz indica por requisito: ✅ cubierto, ⚠️ con fallos u omisiones, ❌ sin cobertura.
4. Todo requisito en ❌ debe justificarse por alcance o cubrirse antes de cerrar la entrega.

> **Nota de coherencia de evidencias.** La matriz sólo ve lo que hay en `reports/junit/*.xml`. Con los
> dos informes presentes (`vitest.xml` + `playwright.xml`) la última matriz regenerada analiza
> **630 pruebas en 42 suites, lee 2 reportes y cubre los 44 requisitos (100 %)**: cada familia queda
> completa (`RF` 10/10, `RNF` 7/7, `RS` 4/4, `RN` 17/17, `UX` 6/6). Las etiquetas de las suites E2E son
> las que aportan `RNF-002` (accesibilidad) y `RNF-007` (disponibilidad), que sin el JUnit de Playwright
> aparecerían como ❌ *sin reportes* aunque sus pruebas existan y pasen. Rutina correcta: **ejecutar las
> suites de Playwright antes de regenerar la matriz**.

---

## 4. Criterios de aceptación (verificados)

Una entrega se acepta cuando se cumplen **todos** estos criterios. La columna de resultado refleja la
última verificación real:

| # | Criterio | Cómo se verifica | Resultado verificado |
| --- | --- | --- | --- |
| 1 | `eslint . --max-warnings 0` y `tsc --noEmit` sin errores ni warnings (astro check forma parte de `npm run lint`) | `npm run lint` | ✅ **0 errores, 0 warnings** (`npx eslint . --max-warnings 0`, `npx tsc --noEmit`). `astro check` no se re-ejecutó en la última pasada |
| 2 | Cobertura de `src/domain/**` y `src/application/**` **≥ 90 %** en líneas, ramas, funciones y sentencias | `npm run test:coverage` (umbrales en `vitest.config.ts`) | ✅ Se cumple (umbral por ruta en `vitest.config.ts`) |
| 3 | Cobertura **global ≥ 80 %** en líneas y ramas | `npm run test:coverage` | ✅ **93.56 % sentencias · 81.5 % ramas · 95.31 % funciones · 95.29 % líneas** |
| 4 | E2E de flujos en verde en **Desktop Chrome y Pixel 5** (mapa, lección, evaluación, nivel bloqueado, reprobar→repasar, docente, comunidad, offline) | `npm run test:e2e` | ✅ 24 ejecuciones verdes (12 × 2), 0 fallos |
| 5 | **0 violaciones** de axe-core en las pantallas auditadas, en ambos proyectos | `npm run test:a11y` | ✅ 0 violaciones (el spec exige cero para **cualquier** impacto, no sólo `serious`/`critical`) |
| 6 | Leyes UX automatizadas en verde (Fitts, Hick, Miller, Apogeo-Final, Estética-Usabilidad) en ambos proyectos | `npm run test:e2e:ux` | ✅ 62 ejecuciones verdes (31 × 2), 0 fallos |
| 7 | `npm run build` genera las 24 páginas bajo `/Yapu/` y `npm run verificar:paginas` no reporta fallos | Job de build | ✅ **24 páginas** (`/`, `/dashboard/`, `/community/`, `/docente/`, `/lesson/1..10/`, `/quiz/1..10/`), `dist/sw.js` con **111 rutas en precache** y versión con hash (`yapu-f4b64c2ced40`) |
| 8 | La app funciona **sin conexión** tras la primera visita (Service Worker activo, HTML y chunks en caché) | `tests/e2e/flujos/offline.spec.ts` | ✅ Escenario verde en ambos proyectos, con el banner de conexión visible |
| 9 | La matriz de trazabilidad no deja requisitos ❌ sin justificar | `npm run reports:trazabilidad` | ✅ **44/44 cubiertos (100 %)**, 0 ❌: `RF` 10/10, `RNF` 7/7, `RS` 4/4, `RN` 17/17 y `UX` 6/6 |
| 10 | No hay pruebas omitidas ni enfocadas en rutas críticas | Revisión de `reports/junit/*.xml` y de `tests/**` | ✅ `vitest.xml` y `playwright.xml` informan **0 omitidas**, y no existe ningún `.skip`/`.only`/`xit`/`xdescribe` en `tests/**` |
| 11 | Ninguna capa viola las reglas de dependencia hexagonales | `npm run lint:capas` | ✅ 0 violaciones, con auto-test del detector (marca una violación sintética antes de analizar `src/`) |

---

## 5. Entornos y configuración

### 5.1 Requisitos de entorno

- **Node 22 LTS**, fijado en `.nvmrc` (el `engines` de `package.json` exige `>=22 <23`).
- **Instalación reproducible:** `npm ci --legacy-peer-deps` (el flag está fijado también en `.npmrc`),
  necesario porque el árbol de Astro/React 19 declara *peers* que npm 10 no resuelve por defecto.
- **Navegador de Playwright:** `npx playwright install --with-deps chromium`.
- **Base URL local:** `http://localhost:9500/Yapu/` (ADR-004), configurable con `YAPU_BASE_URL`. El
  `webServer` de Playwright levanta `npm run preview` en el puerto 9500 y lo reutiliza fuera de CI.
- **Sin red y sin credenciales:** ninguna prueba consume servicios externos ni variables de entorno
  obligatorias; `.env.example` documenta valores puramente locales (RNF-004).

### 5.2 Comandos de referencia

| Comando | Propósito | Alcance |
| --- | --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:9500/Yapu/` | — |
| `npm run build` | Build estático de Astro + generación del Service Worker | — |
| `npm run preview` | Sirve el build en la base del despliegue | — |
| `npm run lint` | `eslint . --max-warnings 0` + `tsc --noEmit` + `astro check` | — |
| `npm run lint:capas` | Reglas de dependencia de la arquitectura hexagonal (con auto-test) | `src/**` |
| `npm test` | Vitest completo (unitarias + contratos + componentes) | 522 pruebas, 31 archivos |
| `npm run test:unit` / `test:contract` / `test:component` | Una sola capa de Vitest | 399 / 30 / 93 |
| `npm run test:coverage` | Vitest con umbrales de cobertura (`reports/coverage/`) | — |
| `npm run test:e2e` / `test:a11y` / `test:e2e:ux` | Suites Playwright por carpeta | 24 / 12 / 62 ejecuciones |
| `npm run test:all` | `test` + las tres suites Playwright | Todo |
| `npm run verificar:paginas` | Valida rutas y artefactos PWA de `dist/` | — |
| `npm run reports:trazabilidad` | Regenera `Docs/testing/matriz-trazabilidad.md` | 44 requisitos |

---

## 6. Detalle de las suites

Todas las suites E2E viven en `tests/e2e/**` y se ejecutan contra el build servido en
`http://localhost:9500/Yapu/`, en los dos proyectos declarados en `playwright.config.ts`
(**Desktop Chrome** 1280×900 y **Pixel 5**), con `workers: 1` —para no competir por el `localStorage`
del origen— y 1 reintento automático en CI (`trace: on-first-retry`, `screenshot: only-on-failure`).

### 6.1 Flujos (`tests/e2e/flujos/`) — `npm run test:e2e` — 12 pruebas por proyecto

| Spec | Pruebas | Qué valida | Etiquetas |
| --- | ---: | --- | --- |
| `estudiante-completo.spec.ts` | 4 | Mapa con 3 tramos y CTA primario hacia la lección del nivel actual; estado aprobado/actual; recorrido de flashcards con marcado de todas las palabras; cierre de lección con su CTA a la evaluación; examen de 10 preguntas hasta la pantalla de resultado | `[RF-003]`, `[RF-004]`, `[RF-005]` |
| `nivel-bloqueado.spec.ts` | 2 | Pedir `/quiz/7` o `/lesson/7` con nivel 2 lleva a la pantalla de bloqueo con una única salida; en el mapa el nivel 7 está `bloqueado`, sin `<a>` ni `href` | `[RN-01]` |
| `reprobar-y-repasar.spec.ts` | 1 | Al reprobar, el CTA primario del resultado ofrece repasar las palabras falladas y enlaza a `/lesson/1?palabras=…` | `[RF-005]`, `[UX-APOGEO]` |
| `docente.spec.ts` | 2 | Con rol docente se monta el panel (no la guardia), las pestañas cumplen `tablist`/`tab`/`tabpanel` con `ArrowRight`, el alta de oración en 2 pasos confirma «Oración guardada y aprobada» y la exportación CSV se completa | `[RF-006]`, `[RF-010]` |
| `comunidad.spec.ts` | 2 | Nivel 3 no puede proponer (aviso con motivo y sin formulario, 1 CTA); el reto propuesto queda `pendiente` y tras **una** aprobación docente sigue pendiente («1 de 2 aprobaciones de docentes») | `[RF-007]`, `[RN-13]` |
| `offline.spec.ts` | 1 | Tras registrar el Service Worker, recargar y cortar la red, la lección y la evaluación del nivel 1 siguen abriéndose con el banner de conexión visible | `[RF-009]`, `[RNF-007]` |

### 6.2 Accesibilidad (`tests/e2e/a11y/`) — `npm run test:a11y` — 6 pruebas por proyecto

`paginas.spec.ts` audita una vez cada ruta de `PANTALLAS_UX` (`/`, `/dashboard`, `/community`,
`/docente`, `/lesson/1`, `/quiz/1`):

- `AxeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])` sobre el DOM **ya hidratado**
  (`abrirPantalla()` espera un ancla de contenido real, no el `[data-pantalla]` de carga).
- **Criterio:** `expect(violaciones).toEqual([])`, es decir **cero violaciones de cualquier impacto**
  (más estricto que el «0 `serious`/`critical`» habitual). Las reglas de *mejores prácticas* quedan
  fuera porque RNF-002 se define como conformidad WCAG 2.1 A/AA.
- El detalle de cada auditoría (id, impacto, nodos afectados) se adjunta al reporte de Playwright.
- Durante la implantación se corrigieron dos defectos reales de contraste detectados por esta suite:
  `text-slate-500` → `text-slate-400` en `src/ui/components/layout/SelectorRol.tsx` y en el estado
  bloqueado de `src/ui/components/niveles/TarjetaNivel.tsx`, y se retiró `opacity-70` de las tarjetas
  de nivel bloqueado (la opacidad bajaba el contraste efectivo por debajo de 4.5:1).
- **Límite:** axe no resuelve el contraste sobre fondos con degradado; esos casos concretos exigen
  comprobación visual.

### 6.3 Leyes UX (`tests/e2e/ux/`) — `npm run test:e2e:ux` — 31 pruebas por proyecto

Son **mediciones cuantitativas sobre el DOM renderizado** con `getBoundingClientRect()` y
`getComputedStyle()`, nunca sobre las clases de Tailwind. Las medidas viven en `tests/e2e/helpers/ux.ts`.

| Spec | Pruebas | Qué mide | Etiquetas |
| --- | ---: | --- | --- |
| `fitts.spec.ts` | 12 | Por cada una de las 6 rutas y en cada proyecto: (a) que ningún objetivo visible baje del mínimo táctil (44 px en Pixel 5, 24 px en Desktop) y (b) que los objetivos adyacentes de la barra móvil y de las opciones del examen se separen ≥ 8 px. Verifica también los casos de ausencia (la barra móvil no se mide en escritorio; las opciones sólo existen en la evaluación) | `[UX-FITTS]` |
| `hick-miller.spec.ts` | 11 | Hick: exactamente 1 `[data-cta="primario"]` visible en las 6 rutas, ≤ 7 destinos de navegación visibles y ≤ 7 campos en cada paso del formulario docente. Miller: 3 tramos en el mapa con ≤ 7 niveles cada uno, corpus docente agrupado por nivel con ≤ 7 oraciones visibles y tablero con historial agrupado por nivel con ≤ 7 evaluaciones visibles | `[UX-HICK]`, `[UX-MILLER]` |
| `apogeo-estetica.spec.ts` | 8 | Estética: ≤ 4 tamaños tipográficos computados por ruta y proyecto (la lista medida se adjunta al reporte). Apogeo-Final: al reprobar, el CTA primario del resultado menciona «palabras falladas» y enlaza con `?palabras=`; al aprobar, el resultado se declara `data-resultado="aprobado"` y su CTA primario vuelve al mapa | `[UX-ESTETICA]`, `[UX-APOGEO]` |

**Jakob** no tiene spec E2E: se verifica en `tests/component/navegacion.test.tsx` (cabecera superior en
escritorio y barra inferior en móvil, rutas canónicas, pestaña Docente sólo con ese rol y
`aria-current="page"` único) y en `tests/component/design-system.test.tsx` (`Tabs` con identificadores
WAI-ARIA).

---

## 7. Evidencias y reportes

| Evidencia | Ruta | Contenido | Estado en el árbol |
| --- | --- | --- | --- |
| JUnit de Vitest | `reports/junit/vitest.xml` | 32 suites, 532 pruebas, 0 omitidas; en la ejecución de referencia del refactor fueron 31 suites y 522 pruebas, todas en verde | Presente |
| JUnit de Playwright | `reports/junit/playwright.xml` | **98 pruebas (49 × 2 proyectos), 0 fallos, 0 omitidas**, ~59 s; es el informe que conecta las leyes UX y la accesibilidad con la matriz | Presente (lo regenera cualquier suite de Playwright, según el reporter de `playwright.config.ts`) |
| Cobertura | `reports/coverage/` | Informe HTML + `lcov` + `coverage-summary.json` + `coverage-final.json` con los umbrales aplicados | Presente |
| Informe HTML de Vitest | `reports/html/vitest/index.html` | Resultado navegable de las suites de Vitest | **Configurado** en `vitest.config.ts` (`reporters: ['default', 'junit', 'html']`); el directorio aún no está generado en el árbol actual |
| Informe HTML de Playwright | `playwright-report/` | Detalle por paso, adjuntos (medidas tipográficas y auditorías de axe) y capturas de fallo | Presente |
| Artefactos de fallo | `test-results/` | Salida por prueba con `trace` (primer reintento) y `screenshot` (sólo en fallo); `.last-run.json` resume el último resultado (`status: passed`) | Presente |
| Build verificado | `dist/` | 24 páginas, `sw.js` (precache de 111 rutas + versión con hash) y manifest listos para `/Yapu/` | Presente |
| Matriz de trazabilidad | [matriz-trazabilidad.md](matriz-trazabilidad.md) | Estado de los 44 requisitos frente a las pruebas que los cubren; la última regeneración lee **2 informes JUnit, 630 pruebas y 42 suites** y deja **44/44 requisitos cubiertos** | Autogenerada |

### 7.1 Cómo leer la matriz de trazabilidad

`Docs/testing/matriz-trazabilidad.md` es un **artefacto autogenerado** por
`npm run reports:trazabilidad` (`scripts/generar-matriz-trazabilidad.mjs`), que parsea todos los
`*.xml` de `reports/junit/` y asocia cada `<testcase>` a los requisitos de sus etiquetas (heredando las
del `classname` de su suite cuando el test no lleva ninguna). Contiene:

1. **Resumen** con requisitos totales (44), cubiertos, sin cobertura, fallos, número de pruebas
   analizadas, suites, reportes leídos y desglose por familia.
2. **Una tabla por familia** (`RF`, `RNF`, `RS`, `RN`, `UX`) con `| Requisito | Descripción | Tests que
   lo cubren | Estado |`. Estados: ✅ todos los tests pasan; ⚠️ hay tests pero alguno falló, dio error o
   fue omitido; ❌ ningún test referencia el requisito (o no había reportes: *sin reportes*).
3. **Requisitos sin cobertura**, con la nota de alcance de ADR-003 sobre `RF-001`/`RF-002`
   (**Simulado (SesionLocal)**) y el aviso de etiquetas fuera del catálogo (`[A5]`).

Si no existe ningún XML, el script avisa, genera la matriz con todo en ❌ *sin reportes* y termina con
código 0 para no romper el pipeline (`--estricto` fuerza código 1). Un XML corrupto genera un aviso y
no impide procesar el resto.

---

## 8. Riesgos y limitaciones conocidos

Se documentan de forma honesta porque condicionan la interpretación de los resultados.

1. **La aprobación de la evaluación no se puede forzar desde el DOM.** `GeneradorEvaluacion` baraja las
   cuatro opciones de cada pregunta (RN-09) **y regenera el examen en cada intento**, así que elegir
   siempre la primera opción acierta ~25 % y nunca alcanza el 70 % de RN-04. En consecuencia, las
   pruebas E2E de ese camino verifican lo que **sí** es determinista —que el examen completo desemboca
   en la pantalla de resultado, con su resumen coherente, un único CTA primario y, al reprobar, el
   repaso de las palabras falladas— y dejan la rama **aprobada** del clímax (confeti, XP, insignia de
   nivel desbloqueado o de curso completado) y la regla de desbloqueo (**RN-02**) a las pruebas
   deterministas: `tests/component/evaluacion.test.tsx` (`[UX-APOGEO]` al aprobar) y
   `tests/unit/application/evaluacion.test.ts` (`[RN-02]`). Cuando el azar concede la aprobación, la
   E2E comprueba además el desbloqueo del nivel 2 en el mapa.
2. **Los niveles 7, 8 y 9 no llegan a las 10 preguntas objetivo de RN-10.** Su vocabulario sembrado
   tiene 4, 3 y 4 palabras y, respectivamente, 1, 1 y 0 oraciones de cloze válidas (cada palabra aporta
   2 candidatas de traducción, quechua→español y español→quechua, y el cloze depende de las oraciones
   válidas del nivel). El resultado son **9, 7 y 8 preguntas**: por encima del **mínimo de 5** que exige
   RN-10 y por debajo del **objetivo de 10**, que se cumple en los demás niveles. Es una limitación de
   **contenido**, no de código: la red de seguridad es
   `tests/unit/infrastructure/catalogo-semilla.test.ts` → `[RN-10]` (para los 10 niveles comprueba
   `5 ≤ preguntas ≤ 10` y reporta la tabla nivel → nº de preguntas) más `[RN-09]` (ninguna pregunta con
   distractores repetidos ni opción correcta duplicada).
3. **Dos oraciones del corpus original incumplen RN-11 y el sistema las excluye avisando.** `ora_9_1`
   («Kunan p'unchay papata tarpunchik.») declara la palabra clave `voc_9_1` «Tarpuy» (sembrar) pero usa
   la raíz verbal «tarpu-» en «tarpunchik»; `ora_9_2` («Mamayqa aguayota sumaqta awachkan.») declara
   `voc_9_2` «Away» (tejer) pero el texto dice «aguayota» y «awachkan». Ninguna de las dos contiene su
   término exacto, así que `cargarSemilla()` las deja **fuera del generador de cloze** (el corpus aporta
   17 de sus 19 oraciones y el nivel 9 se queda sin cloze) y las registra en `avisos`;
   `src/infrastructure/container.ts` los publica por consola
   (`[yapu] Corpus sembrado con N aviso(s)`). El contenido se conserva intacto y la aplicación no se
   rompe al arrancar; la corrección depende de un docente. Está cubierto por
   `tests/unit/infrastructure/catalogo-semilla.test.ts` → `[RN-11]`.
4. **La sincronización con la nube es un adaptador no-op y la autenticación es simulada.** El adaptador
   remoto del MVP (`SincronizacionNoopAdapter`) no persiste en ningún backend, así que la cola offline
   (RN-15) se prueba contra el puerto y un doble de sincronización; el comportamiento multi-dispositivo
   real queda fuera del alcance ([ADR-002](../arquitectura/ADR-002-persistencia-local-y-sincronizacion.md)).
   La sesión (`SesionLocalAdapter`) guarda usuario y rol en `localStorage`, sin contraseñas, tokens ni
   verificación del lado servidor ([ADR-003](../arquitectura/ADR-003-autenticacion-simulada.md)): se
   verifica el contrato del puerto y que no existan credenciales en el código (`RNF-004`), no una
   seguridad de cuentas real.
5. **La cobertura del núcleo es alta, pero la interfaz se excluye del informe.** Los umbrales de 90 %
   aplican a `src/domain/**` y `src/application/**`, y el umbral global (80 %) incluye
   `src/infrastructure/**`. Quedan **fuera** de la métrica, por configuración explícita en
   `vitest.config.ts`, `src/pages/**`, `src/layouts/**`, `src/ui/**/*.tsx` y los `src/**/index.ts`
   (barrel files): su garantía son las **93 pruebas de componente** y los E2E. Sí se miden, en cambio,
   los `.ts` de `src/ui/hooks/**` y `src/ui/lib/**`, que aparecen en `reports/coverage/`. Un porcentaje
   global alto **no** implica ausencia de huecos en la interfaz.
6. **La cobertura E2E sólo aparece en la matriz si su JUnit está presente.** La matriz lee
   `reports/junit/*.xml`; con `vitest.xml` + `playwright.xml` (630 pruebas, 42 suites) reconoce `RNF-002`
   y `RNF-007`, pero si el directorio se limpia y sólo queda el informe de Vitest, ambos vuelven a
   figurar como ❌ *sin reportes* aunque sus pruebas existan y pasen. Es un riesgo de **coherencia de
   evidencias**, no de cobertura: la rutina correcta es ejecutar las suites de Playwright **antes** de
   `npm run reports:trazabilidad`.
7. **Una etiqueta no coincide con la ley que verifica.** En `tests/component/comunidad.test.tsx`, el
   test «con más de 6 retos agrupa por estado y ofrece Ver más» está etiquetado `[UX-FITTS]` cuando lo
   que comprueba es agrupación (Miller). Se documenta tal cual para no falsear la trazabilidad; lo
   correcto es retaggearlo a `[UX-MILLER]`.
8. **Las mediciones UX automatizadas son una aproximación cuantitativa de las heurísticas.** Detectan
   regresiones objetivas (un objetivo por debajo del mínimo, un segundo CTA primario, un quinto tamaño
   tipográfico, un grupo de 8 elementos), pero **no sustituyen** una evaluación de usabilidad con
   personas. En [checklist-leyes-ux.md](../arquitectura/checklist-leyes-ux.md) quedan 8 filas marcadas
   ⚠️ precisamente por eso: las pantallas que no son una ruta de `PANTALLAS_UX` (resultado de
   evaluación, cierre de lección y nivel bloqueado) no tienen medición de caja ni de tamaños computados.
9. **Cobertura de navegadores.** Sólo se ejecuta Chromium (escritorio y emulación de Pixel 5).
   Safari/iOS, Firefox y tabletas requieren verificación manual; riesgos típicos como la PWA en iOS o
   `localStorage` en modo privado no están cubiertos por la automatización.
10. **Datos de prueba frente a datos reales.** Todas las suites usan semillas y relojes fijos
    (`AleatorioFijo`, `RelojFijo`) y perfiles sembrados directamente en `localStorage`; no reproducen
    la variabilidad de escritura o pronunciación de estudiantes reales.
11. **Licencia del contenido cultural.** La exactitud lingüística del vocabulario quechua (variante,
    ortografía y traducciones) requiere validación por hablantes o docentes: no es verificable por
    pruebas automatizadas.

---

## 9. Referencias

- [Checklist de las 6 leyes UX por pantalla](../arquitectura/checklist-leyes-ux.md)
- [Matriz de trazabilidad](matriz-trazabilidad.md) (autogenerada) · `.agents/skills/leyes-ux/SKILL.md`
- [ADR-001 — Arquitectura hexagonal](../arquitectura/ADR-001-arquitectura-hexagonal.md) · [ADR-002 — Persistencia local y sincronización](../arquitectura/ADR-002-persistencia-local-y-sincronizacion.md) · [ADR-003 — Autenticación simulada](../arquitectura/ADR-003-autenticacion-simulada.md) · [ADR-004 — Despliegue en GitHub Pages](../arquitectura/ADR-004-despliegue-github-pages.md)
- Configuración: `vitest.config.ts` · `playwright.config.ts` · `eslint.config.js` · `.nvmrc` · `.npmrc` · `.env.example`
- Scripts: `scripts/generar-matriz-trazabilidad.mjs` · `scripts/verificar-capas.mjs` · `scripts/verificar-paginas.mjs` · `scripts/generar-service-worker.mjs`
- Ayudas de la suite: `tests/e2e/helpers/sesion.ts` (perfiles, rutas y recorridos) · `tests/e2e/helpers/ux.ts` (medidas de las leyes UX)
