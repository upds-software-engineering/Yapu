# Plan de pruebas — YAPU

**Proyecto:** YAPU — Plataforma PWA web y móvil para el aprendizaje de Quechua con IA determinista
**Rama:** `refactor/hexagonal`
**Stack:** Astro 5 · React 19 · TypeScript · Tailwind CSS · Vitest 5 · Playwright 1.63 · axe-core
**Documento:** Plan de pruebas (niveles, criterios de aceptación, entornos, evidencias y riesgos)

---

## 1. Introducción y alcance

Este documento describe la estrategia de verificación de YAPU: qué se prueba, con qué herramienta, en
qué nivel de la pirámide, con qué criterios de aceptación y con qué evidencias. La estrategia sigue la
arquitectura hexagonal del proyecto: el núcleo (`src/domain`, `src/application`) se prueba de forma pura
y aislada, y los adaptadores (`src/infrastructure`, `src/ui`) se prueban en los bordes.

### 1.1 Qué se prueba

| Área | Qué se verifica |
| --- | --- |
| Dominio | Entidades, objetos de valor, reglas de negocio `RN-01`…`RN-17` (desbloqueo, XP, racha, umbral 70, cloze, CSV, retos comunitarios) |
| Aplicación | Casos de uso (generar evaluación, calificar, registrar oración, moderar reto, sincronizar cola) con puertos sustituidos por dobles en memoria |
| Contratos | El mismo contrato de repositorio/puertos ejecutado contra los adaptadores en memoria y contra los de `localStorage` (jsdom) |
| Interfaz | Componentes React de `src/ui` con Testing Library: estados, accesibilidad por teclado y textos de la cultura quechua |
| Integración y E2E | Flujos completos del estudiante y del docente en navegador real (Chromium), en escritorio y móvil |
| Accesibilidad | 0 violaciones `serious`/`critical` de axe-core en las pantallas principales |
| Leyes UX | Mediciones automatizadas de Fitts, Hick, Jakob, Miller, Apogeo-Final y Estética-Usabilidad |
| PWA | Manifest, Service Worker, rutas con `base: '/Yapu/'` y funcionamiento offline tras la primera visita |
| Arquitectura | Reglas de capas hexagonales (`npm run lint:capas`) y rutas del build (`npm run verificar:paginas`) |

### 1.2 Qué NO se prueba (fuera de alcance)

- **Autenticación real con Firebase (`RF-001` y `RF-002`): SIMULADOS.** Por decisión de alcance
  (**ADR-003**), el registro y la gestión de roles se resuelven con `SesionLocalAdapter` sobre
  `localStorage` (`SesionPort`). Las pruebas validan el *contrato* del puerto y el adaptador local
  (identidad estable, cambio de rol, cierre de sesión), no un proveedor de identidad externo.
  En la matriz de trazabilidad estos requisitos aparecen con la nota **Simulado (SesionLocal)**.
- **Sincronización real con la nube**: la cola offline (`RN-15`) se prueba contra el puerto de
  sincronización; el adaptador remoto del MVP es *no-op* deliberado.
- **IA generativa o servicios LLM**: el motor es **determinista** y se prueba con semillas y relojes
  fijos (`AleatorioFijo`, `RelojFijo`); no se consumen APIs externas en ninguna prueba.
- **Rendimiento con usuarios reales**: se mide build, tamaño de bundle e hidratación diferida, no métricas
  de campo (RUM) ni pruebas de carga.
- **Navegadores distintos de Chromium**: la matriz E2E usa Chromium (`Desktop Chrome` y emulación `Pixel 5`);
  Safari/iOS y Firefox quedan como verificación manual y objetivo futuro de la matriz.

---

## 2. Pirámide de pruebas

| Nivel | Carpeta | Herramienta | Qué prueba | Cantidad aproximada | Cómo se ejecuta |
| --- | --- | --- | --- | --- | --- |
| 1. Unitaria (dominio y aplicación) | `tests/unit/**` | Vitest (jsdom) | Entidades, objetos de valor, políticas `RN-*`, casos de uso con dobles en memoria, motor determinista y reglas de capas | ~190–220 casos | `npm run test:unit` |
| 1b. Arquitectura | `tests/unit/arquitectura/**` | Vitest | Fronteras hexagonales: el dominio no importa infraestructura ni UI; sin `any`; sin `Date.now`/`Math.random` directos | ~5 casos | `npm run test:unit` (o `npm run lint:capas`) |
| 2. Contratos | `tests/contract/**` | Vitest (jsdom) | El mismo contrato de puertos y repositorios contra adaptadores en memoria **y** `localStorage` | ~30–50 casos | `npm run test:contract` |
| 3. Componentes | `tests/component/**` | Vitest + Testing Library (React 19) | Render, interacción, estados de error, textos y accesibilidad de `src/ui` | ~20–35 casos | `npm run test:component` |
| 4. Integración E2E (flujos) | `tests/e2e/flujos/**` | Playwright (Chromium) | Recorridos del estudiante y del docente sobre el build servido en `preview` | ~8–12 escenarios × 2 proyectos | `npm run test:e2e` |
| 5. E2E de accesibilidad | `tests/e2e/a11y/**` | Playwright + `@axe-core/playwright` | Violaciones WCAG 2.1 AA (`serious`/`critical`) en portada, mapa, lección, evaluación, tablero, comunidad y docente | ~6–8 escenarios × 2 proyectos | `npm run test:a11y` |
| 6. E2E de leyes UX | `tests/e2e/ux/**` | Playwright (mediciones DOM) | Fitts, Hick, Jakob, Miller, Apogeo-Final y Estética-Usabilidad | ~10–14 escenarios × 2 proyectos | `npm run test:e2e:ux` |
| Transversal. Cobertura | — | `@vitest/coverage-v8` | Umbrales de líneas/ramas/funciones por ruta | — | `npm run test:coverage` |
| Transversal. Build | — | Astro + script propio | 24+ páginas generadas y PWA coherente con `/Yapu/` | — | `npm run build && npm run verificar:paginas` |
| Transversal. Trazabilidad | — | Script propio (`node:`) | Estado requisito ↔ prueba a partir de los XML JUnit | 44 requisitos | `npm run reports:trazabilidad` |

Las cantidades son **orientativas** (orden de magnitud del estado actual de la suite) y se recalculan en
cada ejecución; la fuente de verdad de cuántas pruebas existen y cuáles pasan es la matriz de trazabilidad.

**Puertas de calidad rápidas vs. lentas.** Los niveles 1–3 corren en segundos/minutos y se ejecutan en cada
*push*; los niveles 4–6 requieren un `build` previo y navegador instalado, por lo que se reservan a la
validación de la rama principal.

---

## 3. Convención de nomenclatura y trazabilidad

Todo `describe` de nivel superior lleva el requisito funcional que ejercita y todo `it`/`test` que
verifica una regla de negocio o una ley UX lleva su tag entre corchetes al inicio del nombre:

```ts
describe('[RF-005] Generar evaluación', () => {
  it('[RN-09] cada pregunta tiene 4 opciones únicas', () => { /* ... */ });
  it('[RN-10] una evaluación tiene 10 preguntas y un mínimo de 5', () => { /* ... */ });
});

describe('[RF-007] Retos comunitarios', () => {
  it('[RN-13] exige doble aprobación de docentes distintos', () => { /* ... */ });
});

test.describe('[UX-FITTS] Ley de Fitts', () => {
  test('[UX-FITTS] los objetivos táctiles alcanzan 44 px en móvil', async ({ page }) => { /* ... */ });
});
```

Un mismo test puede cubrir varios requisitos: basta con incluir varios tags en el nombre
(`it('[RN-05][RN-08] el XP no se duplica al reaprobar', …)`).

### 3.1 Catálogo de tags

| Familia | Tags | Descripción |
| --- | --- | --- |
| Funcionales | `[RF-001]` … `[RF-010]` | Requisitos funcionales del SRS (10) |
| No funcionales | `[RNF-001]` … `[RNF-007]` | Usabilidad, accesibilidad, compatibilidad, seguridad, mantenibilidad, rendimiento, disponibilidad (7) |
| Sostenibilidad | `[RS-001]` … `[RS-004]` | Sostenibilidad técnica, eficiencia energética, gobernanza y datos abiertos (4) |
| Reglas de negocio | `[RN-01]` … `[RN-17]` | Desbloqueo, progreso, XP, racha, generación y calificación, offline, CSV, identificadores (17) |
| Leyes UX | `[UX-FITTS]`, `[UX-HICK]`, `[UX-JAKOB]`, `[UX-MILLER]`, `[UX-APOGEO]`, `[UX-ESTETICA]` | Las seis leyes de UX aplicadas al diseño (6) |

Total: **44 requisitos trazables**. Los tags se normalizan (mayúsculas y relleno numérico: `RN-9` → `RN-09`),
por lo que una errata de formato no rompe la matriz; los tags desconocidos se reportan como aviso.

### 3.2 Ciclo de trazabilidad

1. Ejecutar las suites: `npm test` (genera `reports/junit/vitest.xml`) y `npm run test:e2e && npm run test:a11y && npm run test:e2e:ux`
   (generan `reports/junit/playwright.xml`).
2. Ejecutar `npm run reports:trazabilidad` para regenerar `Docs/testing/matriz-trazabilidad.md`.
3. La matriz indica por requisito: ✅ cubierto, ⚠️ con fallos u omisiones, ❌ sin cobertura.
4. Todo requisito en ❌ debe justificarse (alcance, simulación) o cubrirse con pruebas antes de cerrar la entrega.

---

## 4. Criterios de aceptación

Una entrega se considera aceptada cuando se cumplen **todos** los criterios siguientes:

| # | Criterio | Cómo se verifica |
| --- | --- | --- |
| 1 | `npm run lint` termina con **0 errores y 0 warnings** (`eslint --max-warnings 0`, `tsc --noEmit` y `astro check`) | Job de lint |
| 2 | Cobertura de `src/domain/**` y `src/application/**` **≥ 90 %** en líneas y ramas (además de funciones y sentencias) | `npm run test:coverage` (umbrales en `vitest.config.ts`) |
| 3 | Cobertura **global ≥ 80 %** en líneas y ramas | `npm run test:coverage` |
| 4 | E2E de flujos en verde en **Desktop Chrome y Pixel 5** (estudiante 1→2, nivel bloqueado, reprobar→repasar, offline, docente, comunidad con doble moderación) | `npm run test:e2e` |
| 5 | **0 violaciones `serious`/`critical`** de axe-core en las pantallas auditadas, en ambos proyectos | `npm run test:a11y` |
| 6 | Leyes UX automatizadas en verde (Fitts, Hick, Jakob, Miller, Apogeo-Final, Estética-Usabilidad) en ambos proyectos | `npm run test:e2e:ux` |
| 7 | `npm run build` genera **24+ páginas** funcionales bajo `/Yapu/` y `npm run verificar:paginas` no reporta fallos | Job de build |
| 8 | La app funciona **offline tras la primera visita** (Service Worker activo, HTML en caché y cola offline operativa) | Escenario E2E de offline + inspección manual |
| 9 | La matriz de trazabilidad no deja requisitos ❌ sin justificar | `npm run reports:trazabilidad` |
| 10 | El historial JUnit no contiene pruebas omitidas (`.skip`) en rutas críticas | Revisión de `reports/junit/*.xml` |

---

## 5. Entornos y configuración

### 5.1 Requisitos de entorno

- **Node 22 LTS**, fijado en `.nvmrc` (el `engines` de `package.json` exige `>=22 <23`). Se usa
  `actions/setup-node@v4` con `node-version-file: .nvmrc` y **caché de npm** (`cache: 'npm'`) para acelerar el CI.
- **Instalación reproducible:** `npm ci --legacy-peer-deps`. El flag es necesario porque el árbol de
  dependencias de Astro/React 19 declara *peers* que npm 10 no resuelve por defecto; además está fijado en
  `.npmrc` (`legacy-peer-deps=true`), de modo que el comportamiento es idéntico en local y en CI.
- **Navegador de Playwright:** se instala explícitamente con `npx playwright install --with-deps chromium`.
  En runners con caché se define `PLAYWRIGHT_BROWSERS_PATH` para reutilizar los binarios descargados entre
  ejecuciones (por ejemplo `PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright`), lo que evita descargar Chromium
  en cada *push*.
- **Base URL local:** `http://localhost:9500/Yapu/`. Se configura en `playwright.config.ts` mediante
  `baseURL` y puede sobrescribirse con la variable `YAPU_BASE_URL`. El `webServer` de Playwright levanta
  `npm run preview` (puerto 9500, `--host`) y reutiliza el servidor existente fuera de CI.
- **Puerto del modo desarrollo:** `npm run dev` sirve en `http://localhost:9500/Yapu/`.

### 5.2 Comandos de referencia

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 9500 |
| `npm run build` | Build estático de Astro + generación del Service Worker |
| `npm run preview` | Sirve el build en `http://localhost:9500/Yapu/` |
| `npm run lint` | ESLint (0 warnings), `tsc --noEmit` y `astro check` |
| `npm run lint:capas` | Verifica las reglas de dependencia de la arquitectura hexagonal |
| `npm test` | Vitest completo (unitarias + contratos + componentes) |
| `npm run test:coverage` | Vitest con umbrales de cobertura |
| `npm run test:e2e` / `test:a11y` / `test:e2e:ux` | Suites Playwright por carpeta |
| `npm run verificar:paginas` | Valida rutas y artefactos PWA del `dist/` |
| `npm run reports:trazabilidad` | Regenera `Docs/testing/matriz-trazabilidad.md` |

Todo se ejecuta **sin red** (salvo la instalación de dependencias) y sin credenciales: no hay variables
de entorno obligatorias ni secretos (ver `RNF-004`); `.env.example` documenta valores puramente locales.

---

## 6. Suites E2E en detalle

Todas las suites viven en `tests/e2e/**` y se ejecutan contra el build de producción servido en
`http://localhost:9500/Yapu/`, en los dos proyectos configurados: **Desktop Chrome** (1280×900) y **Pixel 5**
(emulación móvil). Se ejecutan con `workers: 1` para evitar carreras sobre el `localStorage` compartido del
origen, y con 1 reintento automático en CI.

### 6.1 Flujos (`tests/e2e/flujos/`) — `npm run test:e2e`

| Escenario | Qué valida | Requisitos |
| --- | --- | --- |
| Estudiante 1 → 2 | Recorrido completo: portada → mapa → lección 1 → evaluación → aprobar → desbloqueo del nivel 2 y avance de progreso | `RF-003`, `RF-004`, `RF-005`, `RN-02`, `RN-03` |
| Nivel bloqueado | El nivel 3 no es accesible sin aprobar el 2 (bloqueo visible y navegación impedida) | `RN-01`, `RN-02` |
| Reprobar → repasar | Al reprobar (<70) se muestra el siguiente paso, no se desbloquea el nivel y las tarjetas marcadas alimentan el repaso | `RN-04`, `RN-16`, `UX-APOGEO` |
| Offline | Con la red caída tras la primera visita la app sigue operativa y la cola offline registra y sincroniza en orden al volver online | `RF-009`, `RN-15`, `RNF-003`, `RNF-007` |
| Docente | Alta de oración base con palabra clave del mismo nivel y exportación CSV de contenidos | `RF-006`, `RF-010`, `RN-12`, `RN-14`, `RS-004` |
| Comunidad | Propuesta de reto (nivel ≥7), doble aprobación por docentes distintos, cierre por rechazo, sin votos duplicados y sin automoderación | `RF-007`, `RN-13`, `RS-003` |
| Tablero y PWA | Racha, XP, palabras aprendidas e historial coherentes con lo jugado; navegación inferior en móvil y superior en escritorio | `RF-008`, `RN-05`, `RN-06`, `RN-08`, `UX-JAKOB` |

### 6.2 Accesibilidad (`tests/e2e/a11y/`) — `npm run test:a11y`

- Analiza cada pantalla principal (portada, mapa, lección, evaluación, tablero, comunidad, docente) con
  `@axe-core/playwright` y las reglas WCAG 2.1 A/AA.
- **Criterio de aceptación:** cero violaciones de impacto `serious` o `critical`; las de impacto `minor`/`moderate`
  se documentan como deuda técnica si no son corregibles en el MVP.
- Se comprueba además navegación por teclado en el flujo de evaluación (foco visible, orden lógico, cambios de
  contexto con `aria-live`) y contraste de texto sobre la paleta tokenizada.

### 6.3 Leyes UX automatizadas (`tests/e2e/ux/`) — `npm run test:e2e:ux`

Son **mediciones cuantitativas sobre el DOM renderizado**: se leen tamaños, separaciones, conteos y tokens
reales del layout, no inspecciones visuales subjetivas.

| Ley | Qué se mide en la suite |
| --- | --- |
| `[UX-FITTS]` | Área táctil/clicable de botones, enlaces y controles: **≥ 44 px** en móvil (Pixel 5) y **≥ 24 px** en escritorio; separación entre objetivos ≥ 8 px |
| `[UX-HICK]` | Número de opciones primarias por pantalla ≤ 7 y presencia de **un único CTA primario** por vista |
| `[UX-JAKOB]` | Patrones convencionales: navegación inferior en móvil / superior en escritorio, etiquetas y ubicaciones estables, pestaña **Docente** visible sólo con rol docente |
| `[UX-MILLER]` | El mapa de niveles se agrupa en 3 tramos (1–3, 4–7, 8–10) con sus encabezados, en lugar de 10 elementos sueltos |
| `[UX-APOGEO]` | Momento cumbre: al aprobar se celebra el logro y se ofrece el siguiente paso; al reprobar se indica qué repasar (nunca un callejón sin salida) |
| `[UX-ESTETICA]` | ≤ 3 tamaños tipográficos + estilo *caption*, espaciados múltiplos de 4 px y uso exclusivo de colores de la paleta tokenizada (sin colores sueltos) |

---

## 7. Evidencias y reportes

| Evidencia | Ruta | Contenido |
| --- | --- | --- |
| JUnit de Vitest | `reports/junit/vitest.xml` | Suites de unitarias, contratos y componentes con tiempos, fallos y omisiones |
| JUnit de Playwright | `reports/junit/playwright.xml` | Escenarios E2E por proyecto (`Desktop Chrome`, `Pixel 5`) |
| Cobertura | `reports/coverage/` | Informe HTML, `lcov`, resúmenes JSON y texto (`text-summary`) con umbrales aplicados |
| Informe HTML de Vitest | `reports/html/vitest/index.html` | Resultado navegable de las suites de Vitest |
| Informe HTML de Playwright | `playwright-report/` | Trazas, capturas de fallo y detalle por paso (`npx playwright show-report`) |
| Artefactos de fallo | `test-results/` | Trazas y capturas de los escenarios fallidos (`trace: on-first-retry`, `screenshot: only-on-failure`) |
| Build verificado | `dist/` | Sitio estático con Service Worker y manifest listos para `/Yapu/` |
| Matriz de trazabilidad | `Docs/testing/matriz-trazabilidad.md` | Estado de cada uno de los 44 requisitos frente a las pruebas que lo cubren |

### 7.1 Cómo leer la matriz de trazabilidad

`Docs/testing/matriz-trazabilidad.md` es un **artefacto autogenerado** por
`npm run reports:trazabilidad`, que parsea todos los `*.xml` de `reports/junit/` y asocia cada `<testcase>`
a los requisitos de sus tags. Contiene:

1. **Resumen**: requisitos totales, cubiertos (✅ + ⚠️), sin cobertura (❌), con fallos (⚠️), número de pruebas
   analizadas, fallos, omisiones, suites y reportes leídos; además del desglose porcentual por familia.
2. **Una tabla por familia** (`RF`, `RNF`, `RS`, `RN`, `UX`) con `| Requisito | Descripción | Tests que lo cubren | Estado |`.
   Los estados significan: ✅ todos los tests que lo cubren pasan; ⚠️ hay tests pero alguno falló, dio error o
   fue omitido; ❌ ningún test referencia el requisito (o no había reportes: *sin reportes*).
3. **Requisitos sin cobertura**, con la lista de los ❌ y la nota de alcance de **ADR-003** sobre
   `RF-001`/`RF-002` (**Simulado (SesionLocal)**).

Si no existe ningún XML, el script avisa, genera igualmente la matriz con todo en ❌ *sin reportes* y
termina con código 0 para no romper el pipeline (`--estricto` fuerza código 1 en ese caso). Un XML corrupto
genera un aviso y no impide procesar el resto.

---

## 8. Riesgos y limitaciones conocidos

Se documentan de forma honesta, ya que condicionan la interpretación de los resultados:

1. **Vocabulario semilla limitado.** El contenido base de algunos niveles es reducido (por ejemplo, niveles
   avanzados con pocas oraciones), lo que puede provocar `ContenidoInsuficienteError` en evaluaciones de 10
   preguntas (`RN-10`). Las pruebas cubren ese camino de error explícitamente; la ampliación depende de
   contenido, no de código.
2. **Sincronización con la nube no-op.** El adaptador remoto del MVP no persiste en un backend: la cola offline
   (`RN-15`) se prueba contra el puerto y un doble de sincronización. El comportamiento multi-dispositivo real
   queda pendiente de un backend fuera del alcance.
3. **Autenticación simulada.** `SesionLocalAdapter` (ADR-003) guarda la sesión en `localStorage`: no hay
   contraseñas, tokens ni verificación del lado servidor. Se verifica que **no existan credenciales** en el
   código (`RNF-004`), pero no hay seguridad de cuentas real.
4. **Las mediciones UX automatizadas son una aproximación cuantitativa de las heurísticas.** La suite de leyes
   UX mide tamaños, conteos, agrupaciones y tokens del DOM: detecta regresiones objetivas (un botón por debajo
   de 44 px, un segundo CTA primario, un cuarto tamaño tipográfico), pero **no sustituye** una evaluación de
   usabilidad con personas ni juicios de diseño sobre jerarquía, tono o adecuación cultural. `UX-APOGEO` y
   `UX-JAKOB` son las más dependientes de interpretación.
5. **Cobertura de navegadores.** Sólo se ejecuta Chromium (escritorio y emulación Pixel 5). Safari/iOS,
   Firefox y tablets requieren verificación manual; los riesgos típicos (PWA en iOS, `localStorage` en modo
   privado) no están cubiertos por la automatización.
6. **Umbrales de cobertura parciales.** Los umbrales de 90 % aplican a `src/domain/**` y `src/application/**`;
   `src/pages/**`, `src/layouts/**` y los `.tsx` de `src/ui` se excluyen de la métrica y se cubren por E2E y
   pruebas de componente, por lo que un porcentaje alto no implica ausencia total de huecos en la interfaz.
7. **Datos de prueba frente a datos reales.** Todas las suites usan semillas y relojes fijos (`AleatorioFijo`,
   `RelojFijo`) para ser deterministas; no reproducen la variabilidad de escritura o pronunciación de
   estudiantes reales.
8. **Licencia del contenido cultural.** La exactitud lingüística del vocabulario quechua (variante, ortografía,
   traducciones) requiere validación por hablantes o docentes: no es verificable por pruebas automatizadas.
