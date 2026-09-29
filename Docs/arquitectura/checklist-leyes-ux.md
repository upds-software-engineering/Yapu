# Checklist de las 6 leyes UX por pantalla — YAPU

Verificación de las seis leyes de experiencia de usuario (**Jakob, Hick, Fitts, Miller, Apogeo-Final,
Estética-Usabilidad**) **pantalla por pantalla**, con la evidencia real de la UI que existe hoy: el
componente que implementa la ley, la medida concreta que se exige y **la prueba automatizada que la
verifica** (spec + etiqueta).

- **Rama:** `refactor/hexagonal` — refactor hexagonal **terminado y verde**.
- **Estado de este documento:** reescrito sobre la UI ya migrada. Los ❌ y la sección de «pendientes»
  de la versión anterior (design system inexistente, `data-cta` inexistente, suite `tests/e2e/ux/`
  inexistente, `prefers-reduced-motion` sin implementar, pantallas sin migrar) **ya no aplican** y se
  han retirado.
- **Documentos relacionados:** [ADR-001](ADR-001-arquitectura-hexagonal.md) · [ADR-002](ADR-002-persistencia-local-y-sincronizacion.md) · [ADR-003](ADR-003-autenticacion-simulada.md) · [ADR-004](ADR-004-despliegue-github-pages.md) · [Diagrama de capas](diagrama-de-capas.md)
- **Base normativa interna:** `.agents/skills/leyes-ux/SKILL.md` y `.agents/skills/leyes-ux/references/`.

### Evidencia de la última ejecución verificada

| Verificación | Resultado |
| --- | --- |
| Vitest 5 (unitarias + contrato + componente, jsdom) | **522 pruebas en verde** en **31 archivos**, 0 fallos, 0 omitidas (`reports/junit/vitest.xml`, ejecución de referencia del refactor). El último JUnit registra **532 pruebas en 32 suites** tras añadirse `tests/unit/arquitectura/sostenibilidad.test.ts` (10 pruebas de `RNF-001/003/004/006` y `RS-001/002/003`) |
| Playwright (Chromium) | **98 en verde de 98**, 0 fallos, 0 omitidas (`reports/junit/playwright.xml`): 49 por proyecto × 2 proyectos (`Desktop Chrome` 1280×900 y `Pixel 5`); reparto por proyecto: 12 flujos + 6 accesibilidad + 31 leyes UX |
| Accesibilidad | `@axe-core/playwright` con `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` en 6 pantallas × 2 proyectos: **0 violaciones** |
| Tipos y estilo | `npx tsc --noEmit` 0 errores · `npx eslint . --max-warnings 0` 0 errores y 0 warnings |
| Arquitectura | `npm run lint:capas` 0 violaciones, con auto-test del detector |
| Build | `npm run build` → **24 páginas** bajo `/Yapu/`; `dist/sw.js` con **111 rutas en precache** y versión con hash del build (`yapu-f4b64c2ced40`); `npm run verificar:paginas` en verde |
| Trazabilidad | [matriz-trazabilidad.md](../testing/matriz-trazabilidad.md) (autogenerada): **44 de 44 requisitos cubiertos (100 %)**, **0 ❌**, sobre **630 pruebas y 42 suites** leídas de los **2** informes JUnit; las **6 leyes UX al 100 %** |

---

## 0. Cómo leer este checklist

### 0.1 Símbolos

| Símbolo | Significado |
| --- | --- |
| ✅ | **Implementado y verificado por una prueba automatizada en verde** para esa pantalla: se citan el componente, la medida y el spec con su etiqueta. |
| ⚠️ | La medida **no tiene todavía comprobación automatizada en esa pantalla**: el componente la declara en el código, pero la validación final es **visual/manual**. Cada ⚠️ dice exactamente qué falta y quién lo cierra. |
| ❌ | **Eliminado en esta versión:** no queda ningún incumplimiento comprobado. |

Todas las filas declaran: **ley**, **pantalla**, **estado**, **componente** (ruta real del archivo),
**medida concreta** y **prueba que lo verifica** (ruta del spec + etiqueta).

### 0.2 Umbrales y tokens de referencia

| Ley | Medida exigida | Token / artefacto que la fija |
| --- | --- | --- |
| **Fitts** | Objetivos táctiles **≥ 44 × 44 px en móvil** y **≥ 24 × 24 px desde `md`**; **separación ≥ 8 px** entre objetivos adyacentes | `tailwind.config.mjs`: `minHeight`/`minWidth` `tactil` = `2.75rem` (44 px) y `tactil-escritorio` = `1.5rem` (24 px); `spacing.separacion-objetivos` = `0.5rem` (8 px) y `spacing.toque` = `2.75rem`. Umbrales de prueba en `tests/e2e/helpers/ux.ts` (`MINIMO_MOVIL = 44`, `MINIMO_ESCRITORIO = 24`, `SEPARACION_MINIMA = 8`, `TOLERANCIA_PX = 0.5`) |
| **Hick** | **≤ 7 opciones primarias** visibles y **exactamente 1 CTA primario** por pantalla | Marca semántica `data-cta="primario"` que propaga `src/ui/design-system/Boton.tsx` (`esCtaPrimario`); `MAXIMO_ENLACES_NAVEGACION = 7` en `tests/e2e/helpers/ux.ts` y `MAXIMO_CAMPOS_POR_PASO = 7` en `tests/e2e/ux/hick-miller.spec.ts` |
| **Miller** | Ningún bloque con más de **7** elementos; agrupación reconocible | `TRAMOS` / `tramoDeNivel()` en `src/domain/shared/tipos.ts`; `MAXIMO_POR_GRUPO = 7` en `tests/e2e/ux/hick-miller.spec.ts`; `LIMITE_POR_GRUPO = 5` en `src/ui/components/tablero/Tablero.tsx`; `MAXIMO_POR_NIVEL` en `src/ui/components/docente/ListaOraciones.tsx` |
| **Apogeo-Final** | Clímax al aprobar **con próximo paso** y, al reprobar, CTA hacia las palabras falladas | `PoliticaAprobacion.mensajeResultado()`; `ResultadoEvaluacionDto.palabrasFalladas`; `rutaLeccion(nivel, ids)` en `src/ui/lib/ruta.ts`; `src/ui/components/evaluacion/Confeti.tsx` + `src/ui/hooks/usePreferenciaReducida.ts` |
| **Estética-Usabilidad** | **≤ 4 tamaños tipográficos computados** por pantalla (escala de 4 pasos) | `tailwind.config.mjs`: `fontSize` `caption` (12 px), `body` (15 px), `title` (20 px), `display` (32 px); `MAXIMO_TAMANOS_TIPOGRAFICOS = 4` en `tests/e2e/helpers/ux.ts` |
| **Jakob** | Patrones convencionales: **barra inferior en móvil / cabecera superior en escritorio**, `tablist`/`tab`/`tabpanel` WAI-ARIA, tarjeta que es un `<button>`, `<select>` nativo, pestaña Docente sólo con rol docente | `src/ui/components/layout/Navegacion.tsx`, `src/ui/design-system/Tabs.tsx`, `src/ui/components/leccion/Flashcard.tsx`, `src/ui/components/layout/SelectorRol.tsx` |

### 0.3 Etiquetas de prueba y dónde viven

Las etiquetas van en el nombre del test y `scripts/generar-matriz-trazabilidad.mjs` las recoge para
[Docs/testing/matriz-trazabilidad.md](../testing/matriz-trazabilidad.md).

| Etiqueta | Ley | Specs / pruebas que la usan hoy |
| --- | --- | --- |
| `[UX-JAKOB]` | Jakob | `tests/component/navegacion.test.tsx` y `tests/component/design-system.test.tsx`. **No existe ningún spec E2E con esta etiqueta**: la ley se cubre en prueba de componente (jsdom) |
| `[UX-HICK]` | Hick | `tests/e2e/ux/hick-miller.spec.ts`; `tests/component/{design-system,mapa-niveles,tablero,docente,comunidad,navegacion}.test.tsx` |
| `[UX-FITTS]` | Fitts | `tests/e2e/ux/fitts.spec.ts`; `tests/component/{design-system,navegacion,mapa-niveles,leccion,docente,comunidad}.test.tsx` |
| `[UX-MILLER]` | Miller | `tests/e2e/ux/hick-miller.spec.ts`; `tests/component/{mapa-niveles,tablero,docente}.test.tsx` |
| `[UX-APOGEO]` | Apogeo-Final | `tests/e2e/ux/apogeo-estetica.spec.ts`, `tests/e2e/flujos/reprobar-y-repasar.spec.ts`; `tests/component/{design-system,evaluacion,leccion}.test.tsx` |
| `[UX-ESTETICA]` | Estética-Usabilidad | `tests/e2e/ux/apogeo-estetica.spec.ts`; `tests/component/{design-system,evaluacion}.test.tsx` |

### 0.4 Pantallas cubiertas

Portada/mapa de niveles · lección/flashcards · evaluación en curso · resultado de evaluación ·
tablero de progreso · comunidad/retos · panel docente (3 pestañas) · nivel bloqueado ·
navegación global · cierre de lección.

Las leyes **medidas en navegador real** por `tests/e2e/ux/**` se auditan sobre las seis rutas de
`PANTALLAS_UX` (`tests/e2e/helpers/ux.ts`): `/`, `/dashboard`, `/community`, `/docente`, `/lesson/1`
y `/quiz/1`, **en los dos proyectos** (`Desktop Chrome` y `Pixel 5`) porque los umbrales táctiles
dependen del viewport. Las pantallas que no son una ruta propia (resultado, cierre de lección, nivel
bloqueado) se verifican con las pruebas deterministas que sí las alcanzan, y por eso algunas filas
quedan en ⚠️.

---

## 1. Portada / mapa de niveles

**Ruta:** `/Yapu/` (`data-pantalla="mapa"`) · **Componentes:** `src/ui/components/portada/Portada.tsx` · `src/ui/components/niveles/MapaNiveles.tsx` · `src/ui/components/niveles/TarjetaNivel.tsx` · **Caso de uso:** `ObtenerMapaNivelesUseCase` (RF-003)

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | `/#mapa` | ✅ | `src/ui/components/niveles/TarjetaNivel.tsx`, `src/ui/components/niveles/MapaNiveles.tsx` | Camino secuencial de 10 niveles con estado explícito (`data-estado` = `aprobado`/`actual`/`bloqueado`), candado `lucide-react` en los no accesibles y **cero enlaces** en el nivel bloqueado (no se ofrece una acción que falle); navegación global con barra inferior en móvil y cabecera superior en escritorio | `tests/e2e/flujos/nivel-bloqueado.spec.ts` → `[RN-01]` (nivel 7 sin `href` ni `<a>`); `tests/component/mapa-niveles.test.tsx` → `[RF-003]` (bloqueado sin enlace, con candado); `tests/component/navegacion.test.tsx` → `[UX-JAKOB]` |
| **Hick** | `/#mapa` | ✅ | `src/ui/components/niveles/MapaNiveles.tsx`, `src/ui/components/niveles/TarjetaNivel.tsx`, `src/ui/components/portada/Portada.tsx` | **Exactamente 1** `[data-cta="primario"]` visible: el enlace «Estudiar Tarjetas» del nivel actual (o «Repasar el nivel 10» con el curso completo). `Portada` no añade ninguna acción primaria | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (`/` en ambos proyectos); `tests/component/mapa-niveles.test.tsx` → `[UX-HICK]` (portada + mapa = 1 CTA; curso completado) |
| **Fitts** | `/#mapa` | ✅ | `src/ui/components/niveles/TarjetaNivel.tsx` (`CLASES_ENLACE`), `src/ui/components/niveles/MapaNiveles.tsx` | Cada acción declara `min-h-tactil min-w-tactil` + `md:min-h-tactil-escritorio md:min-w-tactil-escritorio` (44 px móvil / 24 px escritorio) y la auditoría mide la **caja real** de todos los objetivos visibles del viewport, con separación ≥ 8 px entre adyacentes | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (mínimo por proyecto y separación, en `/`); `tests/component/mapa-niveles.test.tsx` → `[UX-FITTS]` |
| **Miller** | `/#mapa` | ✅ | `src/ui/components/niveles/MapaNiveles.tsx` (`ContenidoMapa` → `TramoNiveles`) | Los 10 niveles se agrupan en **exactamente 3 tramos** (`data-tramo`, de `MapaNivelesDto.tramos`), cada uno con encabezado/rango/descripción y **≤ 7** niveles dentro; el grupo se mide por conteo de `[data-nivel]` | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-MILLER]` (`toHaveCount(3)` + ≤ 7 por tramo); `tests/component/mapa-niveles.test.tsx` → `[UX-MILLER]` |
| **Apogeo-Final** | `/#mapa` | ✅ | `src/ui/components/niveles/MapaNiveles.tsx`, `src/ui/design-system/BarraProgreso.tsx` | Cierre del recorrido visible: insignia «¡Curso completado!» y progreso global al 100 % (RN-03) con `role="progressbar"` etiquetado; el CTA pasa a «Repasar el nivel 10», así que el final del curso nunca queda sin siguiente paso | `tests/component/mapa-niveles.test.tsx` → `[RN-03]` (100 % + insignia) y `[UX-HICK]` (CTA «Repasar el nivel 10»); `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-003]` |
| **Estética-Usabilidad** | `/#mapa` | ✅ | `src/ui/components/niveles/*`, `src/ui/components/portada/Portada.tsx` | ≤ **4** tamaños tipográficos **computados** (`getComputedStyle(...).fontSize` sobre nodos de texto visibles) en `/`, en los dos proyectos; los componentes sólo usan `text-caption`/`text-body`/`text-title`/`text-display` | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]` (adjunta los tamaños medidos al reporte) |

---

## 2. Lección / flashcards

**Ruta:** `/Yapu/lesson/[level]` (`data-pantalla="leccion"`) · **Componentes:** `src/ui/components/leccion/Leccion.tsx` · `src/ui/components/leccion/Flashcard.tsx` · `src/ui/design-system/PlaceholderCategoria.tsx` · **Casos de uso:** `ObtenerLeccionUseCase`, `MarcarPalabraUseCase` (RF-004)

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | `/lesson/1` | ✅ | `src/ui/components/leccion/Flashcard.tsx` | La tarjeta es un **`<button>` nativo** (no un `div` con `onClick`): se alcanza con `Tab`, se voltea con `Enter`/`Espacio` y anuncia su estado con `aria-pressed`; la cara oculta va `aria-hidden` y el respaldo es un SVG por categoría gramatical con `role="img"` | `tests/component/leccion.test.tsx` → `[RF-004]` (volteo al pulsar, flechas ←/→, respuesta SVG por categoría e imagen diferida); `tests/component/design-system.test.tsx` → `[UX-JAKOB]` (`PlaceholderCategoria` describe la ilustración) |
| **Hick** | `/lesson/1` | ✅ | `src/ui/components/leccion/Leccion.tsx`, `src/ui/design-system/Boton.tsx` | Por tarjeta hay 2 acciones de marcado («Necesito repasar» / «¡Ya me la sé!») y el avance; el CTA primario se marca con `esCtaPrimario` y la auditoría exige **exactamente 1** visible | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (`/lesson/1`); `tests/component/leccion.test.tsx` → `[UX-APOGEO]` (1 CTA en el cierre) |
| **Fitts** | `/lesson/1` | ✅ | `src/ui/components/leccion/Flashcard.tsx`, `src/ui/components/leccion/Leccion.tsx`, `src/ui/design-system/EnvoltorioCtaFijo.tsx` | Tarjeta, botones de marcado y navegación declaran los tokens táctiles; el avance vive en la franja inferior (`EnvoltorioCtaFijo`, `sticky bottom-0` con `env(safe-area-inset-bottom)`) y la medición de caja confirma 44 px (Pixel 5) y 24 px (Desktop Chrome) con huecos ≥ 8 px | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (`/lesson/1`); `tests/component/leccion.test.tsx` → `[UX-FITTS]`; `tests/component/design-system.test.tsx` → `[UX-FITTS]` (Boton 44 px y 24 px, `EnvoltorioCtaFijo` inferior) |
| **Miller** | `/lesson/1` | ✅ | `src/ui/components/leccion/Leccion.tsx` | Se presenta **una palabra por pantalla** (`LeccionDto.palabras` se recorre tarjeta a tarjeta) más una `BarraProgreso` («Avance de la lección», `role="progressbar"`): nunca hay un bloque de decisiones con más de 7 elementos | `tests/component/leccion.test.tsx` → `[RF-004]` (navegación tarjeta a tarjeta) y `[UX-FITTS]`; `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-004]` (recorrido completo hasta el cierre) |
| **Apogeo-Final** | `/lesson/1` | ✅ | `src/ui/components/leccion/Leccion.tsx`, `src/ui/components/leccion/CierreLeccion.tsx` | Refuerzo inmediato por palabra (`[RN-08]`, contador `Aprendidas N/M` con `role="status" aria-live="polite"`) y cierre de lección al llegar a la última tarjeta: `ResultadoMarcarPalabraDto.xpGanado` (RN-05) y `rachaDias` (RN-06) se anuncian sólo cuando existen | `tests/component/leccion.test.tsx` → `[UX-APOGEO]` (cierre con resumen y 1 CTA), `[RN-08]` (marcar dos veces no infla el contador); `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-004]` |
| **Estética-Usabilidad** | `/lesson/1` | ✅ | `src/ui/components/leccion/Flashcard.tsx` | ≤ **4** tamaños computados en `/lesson/1` en los dos proyectos; la flashcard usa `text-display` (término), `text-title` (traducción), `text-body` y `text-caption` | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]`; `tests/component/leccion.test.tsx` → `[UX-FITTS]` (sin utilidades tipográficas crudas) |

---

## 3. Evaluación en curso

**Ruta:** `/Yapu/quiz/[level]` (`data-pantalla="evaluacion"`) · **Componentes:** `src/ui/components/evaluacion/Evaluacion.tsx` · `src/ui/components/evaluacion/TarjetaPregunta.tsx` · **Casos de uso:** `GenerarEvaluacionUseCase`, `CalificarEvaluacionUseCase` (RF-005)

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | `/quiz/1` | ✅ | `src/ui/components/evaluacion/Evaluacion.tsx`, `src/ui/components/evaluacion/TarjetaPregunta.tsx` | Cuestionario convencional: «Pregunta N de M», 4 opciones A–D con `aria-pressed`, «N % para aprobar», barra de avance y acciones «Anterior»/«Siguiente» (esta última se convierte en «Calificar evaluación» al final) | `tests/component/evaluacion.test.tsx` → `[RN-16]` (marcado, `aria-pressed`, navegación atrás/adelante, `progressbar` «Avance de la evaluación»); `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-005]` |
| **Hick** | `/quiz/1` | ✅ | `src/ui/components/evaluacion/Evaluacion.tsx`, `src/ui/design-system/EnvoltorioCtaFijo.tsx` | Una pregunta a la vez con **4 opciones** (invariante de dominio: `GeneradorEvaluacion.OPCIONES_POR_PREGUNTA = 4`, RN-09) y **exactamente 1** CTA primario (avanzar/calificar) en la franja inferior | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (`/quiz/1`); `tests/component/evaluacion.test.tsx` → `[RN-16]` (4 opciones exactas) |
| **Fitts** | `/quiz/1` | ✅ | `src/ui/components/evaluacion/TarjetaPregunta.tsx` | Cada opción es un objetivo de ancho completo con `min-h-tactil min-w-tactil`; la auditoría mide la caja de `[data-opcion]` y exige separación ≥ 8 px entre opciones adyacentes (y confirma explícitamente que sólo la evaluación tiene opciones medibles) | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (mínimo + `separacionMinima(page, '[data-opcion]')`) |
| **Miller** | `/quiz/1` | ✅ | `src/ui/components/evaluacion/TarjetaPregunta.tsx`, `src/domain/evaluacion/Pregunta.ts` | **1 pregunta × 4 opciones** por pantalla: el tramo 1–3 / 4–7 nunca se supera; la regla de 4 opciones únicas es invariante del dominio | `tests/unit/domain/evaluacion/pregunta.test.ts` → `[RN-09]`; `tests/component/evaluacion.test.tsx` → `[RN-16]` |
| **Apogeo-Final** | `/quiz/1` | ✅ | `src/ui/components/evaluacion/Evaluacion.tsx` | El examen no adelanta el resultado: el clímax está reservado a `Resultado.tsx` (que sólo se monta tras calificar) y RN-16 impide avanzar sin marcar (`disabled` + `aria-disabled="true"`, se permite volver atrás conservando la respuesta) | `tests/component/evaluacion.test.tsx` → `[RN-16]` (avance bloqueado sin marcar y respuesta conservada); `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-005]` (la pantalla de resultado aparece al terminar las preguntas) |
| **Estética-Usabilidad** | `/quiz/1` | ✅ | `src/ui/components/evaluacion/Evaluacion.tsx`, `src/ui/components/evaluacion/TarjetaPregunta.tsx` | ≤ **4** tamaños computados en `/quiz/1` en los dos proyectos | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]` |

---

## 4. Resultado de evaluación

**Presentación:** estado de resultado de `/Yapu/quiz/[level]` (`data-pantalla="resultado"`, `data-resultado` = `aprobado`/`reprobado`) · **Componentes:** `src/ui/components/evaluacion/Resultado.tsx` · `src/ui/components/evaluacion/Confeti.tsx` · `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` (`EnlaceCtaPrimario`) · **DTO:** `ResultadoEvaluacionDto`

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | resultado | ✅ | `src/ui/components/evaluacion/Resultado.tsx` | Estructura convencional de resultado: insignia de aprobado/reprobado, porcentaje en `text-display`, «N de M respuestas correctas», mensaje de `PoliticaAprobacion.mensajeResultado()`, XP ganado y desglose pregunta a pregunta con la opción marcada, la correcta y la explicación pedagógica | `tests/component/evaluacion.test.tsx` → `[UX-APOGEO]` (aprobado y reprobado, con textos y porcentaje); `tests/e2e/flujos/reprobar-y-repasar.spec.ts` → `[RF-005]` |
| **Hick** | resultado | ✅ | `src/ui/components/evaluacion/Resultado.tsx` | **Exactamente 1** `data-cta="primario"`: al aprobar «Ver mi mapa de niveles»; al reprobar «Repasar las N palabras falladas» (o «Reintentar la evaluación» si no hay palabras); el reintento pasa a secundario | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-APOGEO]` (`toHaveCount(1)` en `[data-pantalla="resultado"] [data-cta="primario"]`); `tests/component/evaluacion.test.tsx` → `[UX-APOGEO]` y `[UX-ESTETICA]` |
| **Fitts** | resultado | ⚠️ | `src/ui/components/evaluacion/Resultado.tsx`, `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` (`EnlaceCtaPrimario`), `src/ui/design-system/Boton.tsx` | El CTA primario es un `<a data-cta="primario">` que **replica a mano** los tokens (`min-h-tactil min-w-tactil`) porque el design system sólo pinta `<button>`; el reintento sí usa `Boton`. Esta pantalla **no entra en la medición E2E de Fitts** (las 6 rutas de `PANTALLAS_UX` auditan el estado de examen en `/quiz/1`), así que no hay medida de caja del CTA del resultado: **queda como comprobación visual/manual** y como mejora, incluir el estado de resultado en la auditoría | Sin medición automática. Evidencia indirecta: `tests/component/design-system.test.tsx` → `[UX-FITTS]` garantiza los tokens en `Boton` (44/24 px) |
| **Miller** | resultado | ⚠️ | `src/ui/components/evaluacion/Resultado.tsx` | El desglose de 10 preguntas se pinta en una lista **contenida con scroll** (`max-h-96 overflow-y-auto`) bajo un encabezado que anuncia el número de preguntas, y las palabras falladas van en una sección aparte: la agrupación existe en el componente, pero **no hay medición automatizada de Miller en esta pantalla** (la suite `[UX-MILLER]` mide mapa, panel docente y tablero). Comprobación visual/manual | Sin medición automática. Evidencia indirecta: `tests/component/evaluacion.test.tsx` → `[UX-APOGEO]` (el detalle y la lista de palabras falladas se renderizan) |
| **Apogeo-Final** | resultado | ✅ | `src/ui/components/evaluacion/Resultado.tsx`, `src/ui/components/evaluacion/Confeti.tsx`, `src/ui/hooks/usePreferenciaReducida.ts` | Clímax completo y con salida siempre: al aprobar, confeti de la paleta andina + XP + insignia «¡Desbloqueaste el nivel N!» o «¡Curso completado!» y CTA al mapa; al reprobar, CTA hacia `rutaLeccion(nivel, idsFalladas)` (la URL lleva `?palabras=`). El confeti **no se dispara** con `prefers-reduced-motion`, ni en render sin `document`/canvas, ni dos veces para el mismo resultado | `tests/component/evaluacion.test.tsx` → `[UX-APOGEO]` (rama aprobada determinista: 100 %, XP, insignia, 1 CTA; rama reprobada; y `debeLanzarConfeti` con movimiento reducido); `tests/e2e/ux/apogeo-estetica.spec.ts` y `tests/e2e/flujos/reprobar-y-repasar.spec.ts` → `[UX-APOGEO]`; `src/styles/global.css` apaga además animaciones y transiciones con la misma media query |
| **Estética-Usabilidad** | resultado | ⚠️ | `src/ui/components/evaluacion/Resultado.tsx` | La pantalla declara sólo `text-display` (el porcentaje, único `.text-display`), `text-body` y `text-caption`, y una prueba de componente lo comprueba **por clases**; pero el estado de resultado **no está en la medición de tamaños computados** del bucle `[UX-ESTETICA]` (6 rutas). La percepción final de jerarquía la valida una persona | `tests/component/evaluacion.test.tsx` → `[UX-ESTETICA]` (prohibidas las utilidades crudas; 1 solo `text-display`) y `tests/unit/arquitectura/sostenibilidad.test.ts` → `[RNF-001]` (ningún archivo de `src/ui|pages|layouts` usa tamaños fuera de los tokens) |

---

## 5. Tablero de progreso

**Ruta:** `/Yapu/dashboard` (`data-pantalla="tablero"`) · **Componentes:** `src/ui/components/tablero/Tablero.tsx` · `src/ui/components/tablero/TarjetaEstadistica.tsx` · **Caso de uso:** `ObtenerTableroUseCase` (RF-008)

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | `/dashboard` | ✅ | `src/ui/components/tablero/Tablero.tsx`, `src/ui/components/tablero/TarjetaEstadistica.tsx` | Tablero convencional: cabecera con nombre y «Nivel N de 10», cuatro métricas en tarjetas (`[data-estadistica]` = `progreso`, `xp`, `racha`, `palabras`), lista de «Palabras para repasar» con enlaces directos y «Historial de evaluaciones» agrupado, más el CTA fijo de continuación | `tests/component/tablero.test.tsx` → `[RF-008]` (perfil nuevo en cero, historial vacío con salida, palabras con `data-palabra-repasar`); `tests/e2e/ux/hick-miller.spec.ts` → `[UX-MILLER]` (historial real sembrado) |
| **Hick** | `/dashboard` | ✅ | `src/ui/components/tablero/Tablero.tsx`, `src/ui/design-system/EnvoltorioCtaFijo.tsx` | **Exactamente 1** `[data-cta="primario"]` en la franja inferior («Continuar con el nivel N» o «Repasar mis palabras pendientes»); cada grupo del historial ofrece un solo control (`Ver más`/`Ver menos`) | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (`/dashboard`); `tests/component/tablero.test.tsx` → `[UX-HICK]` (1 CTA y un único control por grupo) |
| **Fitts** | `/dashboard` | ✅ | `src/ui/components/tablero/Tablero.tsx` (`CLASES_TACTIL`), `src/ui/components/tablero/TarjetaEstadistica.tsx` | Los enlaces de repaso por palabra y el CTA declaran los tokens táctiles (`min-h-tactil min-w-tactil` + `md:min-h-tactil-escritorio md:min-w-tactil-escritorio`); la auditoría mide la caja real de todos los objetivos del viewport en ambos proyectos | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (`/dashboard`); `tests/component/design-system.test.tsx` → `[UX-FITTS]` |
| **Miller** | `/dashboard` | ✅ | `src/ui/components/tablero/Tablero.tsx` (`LIMITE_POR_GRUPO = 5`), `src/ui/components/tablero/TarjetaEstadistica.tsx` | 4 métricas (tramo 4–7) y el historial **agrupado por nivel** (`[data-grupo-nivel]`) con **≤ 7** evaluaciones visibles por grupo: la prueba siembra 8 evaluaciones en 2 niveles y exige 2 grupos con ≤ 7 filas visibles cada uno | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-MILLER]` (2 grupos, ≤ 7 por grupo); `tests/component/tablero.test.tsx` → `[UX-MILLER]` («como mucho 5 por grupo» y «Ver más amplía de cinco en cinco») |
| **Apogeo-Final** | `/dashboard` | ✅ | `src/ui/components/tablero/Tablero.tsx`, `src/ui/design-system/BarraProgreso.tsx` | El tablero cierra el ciclo con el avance ya ganado: progreso global (RN-03) con barra etiquetada, XP (RN-05), racha (RN-06), insignia «¡Curso completado!» y siguiente paso siempre visible en el CTA fijo | `tests/component/tablero.test.tsx` → `[RN-03]` (100 % con 10 niveles) y `[RF-008]`; `tests/component/design-system.test.tsx` → `[UX-FITTS]` (`BarraProgreso` con rango accesible) |
| **Estética-Usabilidad** | `/dashboard` | ✅ | `src/ui/components/tablero/*` | ≤ **4** tamaños computados en `/dashboard` en los dos proyectos | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]` |

---

## 6. Comunidad / retos

**Ruta:** `/Yapu/community` (`data-pantalla="comunidad"`) · **Componentes:** `src/ui/components/comunidad/Comunidad.tsx` · `src/ui/components/comunidad/FormularioReto.tsx` · `src/ui/components/comunidad/TarjetaReto.tsx` · **Casos de uso:** `ListarRetosUseCase`, `ProponerRetoUseCase`, `ModerarRetoUseCase` (RF-007 / RS-003)

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | `/community` | ✅ | `src/ui/components/comunidad/Comunidad.tsx`, `src/ui/components/comunidad/FormularioReto.tsx` | Muro comunitario reconocible con formulario de propuesta, y cuando no hay permiso se muestra `[data-aviso="nivel-insuficiente"]` con el `motivo` en español **en lugar del formulario** (no un error técnico): patrón honesto y explicable | `tests/e2e/flujos/comunidad.spec.ts` → `[RN-13]` (nivel 3: aviso visible y 0 formularios); `tests/component/comunidad.test.tsx` → `[RN-13]` (aviso y ausencia de formulario; nivel 7 sí lo ve) |
| **Hick** | `/community` | ✅ | `src/ui/components/comunidad/FormularioReto.tsx`, `src/ui/components/comunidad/Comunidad.tsx`, `src/ui/components/comunidad/TarjetaReto.tsx` | **Exactamente 1** `data-cta="primario"` visible en ambos estados (con permiso: publicar; sin permiso: «Seguir aprendiendo» hacia el inicio, para no dejar un callejón sin salida) | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (`/community`); `tests/component/comunidad.test.tsx` → `[UX-HICK]` (1 CTA en los dos estados) |
| **Fitts** | `/community` | ✅ | `src/ui/components/comunidad/FormularioReto.tsx`, `src/ui/components/comunidad/Comunidad.tsx` | Los campos del formulario y el botón de publicación declaran los tokens táctiles; la auditoría mide la caja real de campos y botones en ambos proyectos | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (`/community`); `tests/component/comunidad.test.tsx` → `[UX-FITTS]` («todos los botones declaran `min-h-tactil`») |
| **Miller** | `/community` | ✅ | `src/ui/components/comunidad/Comunidad.tsx` | La lista de retos no se vuelca entera: con más de 6 retos se **agrupa por estado** y aparece «Ver más», de modo que ningún bloque visible supera el tramo de Miller | `tests/component/comunidad.test.tsx` → (test «con más de 6 retos agrupa por estado y ofrece Ver más», **hoy etiquetado `[UX-FITTS]`**: ver nota en la sección 12) |
| **Apogeo-Final** | `/community` | ✅ | `src/ui/components/comunidad/TarjetaReto.tsx`, `src/ui/design-system/BarraProgreso.tsx` | El ciclo de publicación se comunica con progreso explícito: «1 de 2 aprobaciones de docentes» con barra etiquetada, y el reto sigue visible como `pendiente` hasta la segunda aprobación (nunca se publica con una sola) | `tests/component/comunidad.test.tsx` → `[RN-13]` («un reto con una sola aprobación muestra "1 de 2"»); `tests/e2e/flujos/comunidad.spec.ts` → `[RF-007] [RN-13]` (tras 1 aprobación sigue `data-estado-reto="pendiente"`) |
| **Estética-Usabilidad** | `/community` | ✅ | `src/ui/components/comunidad/*` | ≤ **4** tamaños computados en `/community` en los dos proyectos | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]` |

---

## 7. Panel docente — pestañas Oraciones / Moderación / Datos abiertos

**Ruta:** `/Yapu/docente` (`data-pantalla="docente"`) · **Componentes:** `src/ui/components/docente/PanelDocente.tsx` · `src/ui/components/docente/FormularioOracion.tsx` · `src/ui/components/docente/ListaOraciones.tsx` · `src/ui/components/docente/ModeracionRetos.tsx` · `src/ui/components/docente/ExportacionCorpus.tsx` · `src/ui/components/docente/GuardiaDocente.tsx` · `src/ui/design-system/Tabs.tsx` · **Casos de uso:** `RegistrarOracionBaseUseCase`, `ListarOracionesUseCase`, `ModerarRetoUseCase`, `ExportarCorpusCsvUseCase` (RF-006, RF-007/RS-003, RS-004)

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | `/docente` | ✅ | `src/ui/design-system/Tabs.tsx`, `src/ui/components/docente/PanelDocente.tsx`, `src/ui/components/docente/GuardiaDocente.tsx` | Panel de administración con pestañas en el patrón **WAI-ARIA** `tablist`/`tab`/`tabpanel` (`aria-selected`, `aria-controls`, `aria-labelledby`, *roving tabindex*, flechas y Home/End) y guardia de rol: sin rol docente se monta `GuardiaDocente` (`[data-guardia="rol"]`) en lugar del panel | `tests/e2e/flujos/docente.spec.ts` → `[RF-006]` (tablist visible, 3 pestañas, `aria-selected`, ArrowRight cambia de panel, sin guardia con rol docente); `tests/component/design-system.test.tsx` → `[UX-JAKOB]` y `[UX-HICK]` (teclado y paneles); `tests/component/docente.test.tsx` → `[RF-001]` |
| **Hick** | `/docente` | ✅ | `src/ui/components/docente/FormularioOracion.tsx`, `src/ui/design-system/Tabs.tsx` | Una pestaña visible a la vez, **exactamente 1** CTA primario por pestaña activa y formulario en **2 pasos excluyentes**: paso 1 con 3 campos (nivel, texto, traducción) y paso 2 con 2 campos (palabra clave y contexto), muy por debajo de los 7 permitidos | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (`/docente`: 1 CTA y ≤ 7 campos en cada paso); `tests/component/docente.test.tsx` → `[UX-HICK]` (paso 1 bloquea el paso 2, 1 CTA por pestaña) |
| **Fitts** | `/docente` | ✅ | `src/ui/design-system/Tabs.tsx`, `src/ui/components/docente/FormularioOracion.tsx`, `src/ui/components/docente/GuardiaDocente.tsx` | Cada pestaña y cada botón declaran los tokens táctiles; la auditoría mide la caja real de pestañas, campos y botones en ambos proyectos | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (`/docente`); `tests/component/design-system.test.tsx` → `[UX-FITTS]` (pestañas 44×44); `tests/component/docente.test.tsx` → `[UX-FITTS]` |
| **Miller** | `/docente` | ✅ | `src/ui/components/docente/ListaOraciones.tsx`, `src/ui/design-system/Tabs.tsx` | 3 pestañas (tramo 1–3) y el corpus **agrupado por nivel** (`[data-grupo-nivel]`) con `Ver más`: la prueba comprueba que ningún grupo visible supera 7 oraciones y que el listado muestra 5 con «Ver más» | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-MILLER]` (grupos por nivel, ≤ 7 visibles); `tests/component/docente.test.tsx` → `[UX-MILLER]` («agrupa por nivel y muestra 5 con Ver más») |
| **Apogeo-Final** | `/docente` | ✅ | `src/ui/components/docente/FormularioOracion.tsx`, `src/ui/components/docente/ExportacionCorpus.tsx`, `src/ui/components/docente/ModeracionRetos.tsx` | Cierre con confirmación explícita: «Oración guardada y aprobada» + vuelta al paso 1 y la oración nueva dentro del listado (RN-12); la exportación confirma el número de filas y entrega el archivo con nombre y tipo MIME (RS-004); la moderación explica «1 de 2 aprobaciones de docentes» | `tests/e2e/flujos/docente.spec.ts` → `[RF-006]`, `[RF-010]`; `tests/component/docente.test.tsx` → `[RF-010]`, `[RN-13]`; `tests/e2e/flujos/comunidad.spec.ts` → `[RN-13]` |
| **Estética-Usabilidad** | `/docente` | ✅ | `src/ui/components/docente/*`, `src/ui/design-system/Tabs.tsx` | ≤ **4** tamaños computados en `/docente` en los dos proyectos | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]` |

---

## 8. Nivel bloqueado

**Presentación:** pantalla propia en `/Yapu/lesson/[level]` y `/Yapu/quiz/[level]` cuando el nivel no es accesible (`data-pantalla="nivel-bloqueado"`), y estado `bloqueado` dentro del mapa · **Componentes:** `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` (`EnlaceCtaPrimario`) · `src/ui/components/niveles/TarjetaNivel.tsx` · **Origen:** `NivelBloqueadoError` (`src/domain/errores.ts`), `PoliticaDesbloqueo` (RN-01), `NivelDto.accesible`

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | nivel bloqueado | ✅ | `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx`, `src/ui/components/niveles/TarjetaNivel.tsx` | El bloqueo se reconoce sin error técnico: insignia con candado, «El nivel N todavía no está desbloqueado» y la explicación de que hay que aprobar el nivel actual; en el mapa el nivel bloqueado **no es un enlace** | `tests/e2e/flujos/nivel-bloqueado.spec.ts` → `[RN-01]` (pantalla de bloqueo en `/quiz/7` y `/lesson/7`; nivel 7 sin `<a>` ni `href`); `tests/component/evaluacion.test.tsx` y `tests/component/leccion.test.tsx` → `[RN-01]` |
| **Hick** | nivel bloqueado | ✅ | `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` | **Cero decisiones inútiles**: no se ofrece la evaluación (no hay `[data-pregunta]`) y queda **exactamente 1** CTA primario, «Ir a mi nivel actual» | `tests/e2e/flujos/nivel-bloqueado.spec.ts` → `[RN-01]` (`toHaveCount(1)`); `tests/component/evaluacion.test.tsx` → `[RN-01]` (1 CTA y `[data-pregunta]` ausente) |
| **Fitts** | nivel bloqueado | ⚠️ | `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` (`EnlaceCtaPrimario`) | El CTA declara `min-h-tactil min-w-tactil` (`w-full`), pero la pantalla de nivel bloqueado **no entra en la medición E2E de Fitts** (`PANTALLAS_UX` audita `/lesson/1` y `/quiz/1` en su estado normal), así que no hay medida de caja de este objetivo: **comprobación visual/manual** | Sin medición automática. Evidencia indirecta: `tests/component/evaluacion.test.tsx` → `[RN-01]` (presencia y destino del CTA) |
| **Miller** | nivel bloqueado | ✅ | `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` | El estado bloqueado pertenece a **un** nivel dentro de su tramo (1–3 / 4–7 / 8–10): no añade ninguna lista de decisiones — sólo una tarjeta informativa y una salida | `tests/component/evaluacion.test.tsx` → `[RN-01]` (no hay preguntas ni opciones y sí una única salida); `tests/unit/domain/aprendizaje/politicas.test.ts` → `[RN-01]` |
| **Apogeo-Final** | nivel bloqueado | ✅ | `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx`, `src/ui/components/niveles/TarjetaNivel.tsx` | Nunca es un callejón sin salida: la pantalla indica el nivel actual y ofrece volver a él; en el mapa el nivel bloqueado explica qué nivel hay que aprobar para desbloquearlo | `tests/e2e/flujos/nivel-bloqueado.spec.ts` → `[RN-01]` (texto «bloqueado» y CTA presente); `tests/component/leccion.test.tsx` → `[RN-01]` (CTA al nivel actual) |
| **Estética-Usabilidad** | nivel bloqueado | ⚠️ | `src/ui/components/evaluacion/PantallaNivelBloqueado.tsx` | El componente sólo usa `text-title`, `text-body` y `text-caption`, pero al no ser una ruta de `PANTALLAS_UX` **no se mide** en el bucle `[UX-ESTETICA]`: la jerarquía visual de esta pantalla la valida una persona | Sin medición automática de tamaños computados. Evidencia indirecta: `tests/component/evaluacion.test.tsx` → `[RN-01]` (la pantalla se monta con su contenido) y `tests/unit/arquitectura/sostenibilidad.test.ts` → `[RNF-001]` |

---

## 9. Navegación global

**Componentes:** `src/ui/components/layout/Navegacion.tsx` · `src/ui/components/layout/SelectorRol.tsx` · `src/ui/components/layout/BannerConexion.tsx` · **Helpers:** `src/ui/lib/ruta.ts` (`ruta`, `rutaActiva`) · **Montaje:** cada página de `src/pages/**` (p. ej. `src/pages/index.astro`) monta `<Navegacion client:load rutaActual="…" />`

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | navegación | ✅ | `src/ui/components/layout/Navegacion.tsx`, `src/ui/components/layout/SelectorRol.tsx` | Patrón adaptativo convencional: **cabecera superior** en escritorio (`data-nav="escritorio"`, `md:block`) y **barra inferior** en móvil (`data-nav="movil"`, `fixed bottom-0`, `md:hidden`); etiquetas de texto junto al icono (el icono nunca sustituye a la palabra), destino activo con `aria-current="page"` y pestaña «Docente» sólo con rol docente | `tests/component/navegacion.test.tsx` → `[UX-JAKOB]` (cabecera superior vs. barra inferior, rutas canónicas); `[RF-002]` (pestaña sólo con rol docente, `aria-current` único por barra) |
| **Hick** | navegación | ✅ | `src/ui/components/layout/Navegacion.tsx` | Como máximo **4 destinos** (Niveles, Progreso, Comunidad y Docente sólo con ese rol) y **ningún** `data-cta="primario"`: la navegación no compite con el CTA de la pantalla | `tests/e2e/ux/hick-miller.spec.ts` → `[UX-HICK]` (destinos visibles ≤ 7); `tests/component/navegacion.test.tsx` → `[UX-HICK]` (≤ 4 por barra y 0 CTA en `[data-nav]`) |
| **Fitts** | navegación | ✅ | `src/ui/components/layout/Navegacion.tsx` | Cada enlace declara `min-h-tactil min-w-tactil` (44 px) y las listas usan `gap-2` (8 px); la barra móvil está anclada al borde inferior, en la zona del pulgar; medido en los dos proyectos | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (mínimo del proyecto y separación de `[data-nav="movil"]`); `tests/component/navegacion.test.tsx` → `[UX-FITTS]` (tokens, `gap-2`, `fixed bottom-0`) |
| **Miller** | navegación | ✅ | `src/ui/components/layout/Navegacion.tsx` | 3–4 destinos agrupados por frecuencia de uso: dentro de un tramo de Miller, sin insignias de racha/palabras que añadan ruido de decisión | `tests/component/navegacion.test.tsx` → `[UX-HICK]` (≤ 4 destinos por barra y sin `racha`/`palabras` en la cabecera) |
| **Apogeo-Final** | navegación | ✅ | `src/ui/components/layout/Navegacion.tsx` | La navegación no compite con el clímax: no lleva ninguna acción primaria y en la pantalla de resultado el retorno al mapa es el único `data-cta="primario"` de esa vista | `tests/component/navegacion.test.tsx` → `[UX-HICK]` (`[data-nav] [data-cta="primario"]` = 0); `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-APOGEO]` (1 CTA en el resultado) |
| **Estética-Usabilidad** | navegación | ✅ | `src/ui/components/layout/Navegacion.tsx`, `src/ui/components/layout/SelectorRol.tsx` | La navegación se pinta en las 6 rutas medidas y sólo usa `text-title` (marca) y `text-caption` (enlaces y selector), dentro del límite de 4 tamaños computados por pantalla | `tests/e2e/ux/apogeo-estetica.spec.ts` → `[UX-ESTETICA]` (las 6 rutas incluyen la navegación en la medición) |

---

## 10. Cierre de lección

**Presentación:** estado final de `/Yapu/lesson/[level]` (`data-pantalla="cierre-leccion"`) · **Componente:** `src/ui/components/leccion/CierreLeccion.tsx` (lo monta `Leccion.tsx`) · **DTO:** `LeccionDto` (`aprendidas`, `esRepaso`), `ResultadoMarcarPalabraDto` (`xpGanado`, `palabrasAprendidas`, `rachaDias`) · **Helper:** `rutaEvaluacion(nivel)`

| Ley | Pantalla | Estado | Componente | Medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- | --- | --- |
| **Jakob** | cierre de lección | ✅ | `src/ui/components/leccion/CierreLeccion.tsx` | Cierre reconocible de fin de recorrido: insignia «Lección completada», título del nivel, resumen «Aprendiste N de M palabras» y un único paso siguiente (la evaluación del mismo nivel) | `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-004]` (el cierre contiene «Lección completada» y su CTA apunta a `/quiz/1`); `tests/component/leccion.test.tsx` → `[UX-APOGEO]` |
| **Hick** | cierre de lección | ✅ | `src/ui/components/leccion/CierreLeccion.tsx`, `src/ui/design-system/EnvoltorioCtaFijo.tsx` | **Exactamente 1** CTA primario («Ir a la evaluación») dentro de la franja fija inferior, sin secundarios que compitan | `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-004]` (`cierre.locator('[data-cta="primario"]')` → 1); `tests/component/leccion.test.tsx` → `[UX-APOGEO]` |
| **Fitts** | cierre de lección | ⚠️ | `src/ui/components/leccion/CierreLeccion.tsx`, `src/ui/design-system/EnvoltorioCtaFijo.tsx` | El CTA es un enlace a ancho completo con los tokens táctiles y vive pegado al borde inferior (zona del pulgar), pero el cierre **no entra en la medición E2E de Fitts**: `abrirPantalla('/lesson/1')` mide el estado de flashcards (ancla `[data-flashcard]`). Queda como **comprobación visual/manual** | Sin medición automática. Evidencia indirecta: `tests/component/design-system.test.tsx` → `[UX-FITTS]` (`EnvoltorioCtaFijo` ancla el CTA al borde inferior) |
| **Miller** | cierre de lección | ⚠️ | `src/ui/components/leccion/CierreLeccion.tsx` | El resumen no vuelca la lista de palabras: usa el contador «Aprendiste N de M palabras» y una `BarraProgreso`. La prueba de componente **sí** comprueba el contador, pero no hay aserción sobre el agrupamiento ni medición automática de Miller en esta pantalla: la percepción del cierre la valida una persona | Sin medición automática de tamaños computados. Evidencia indirecta: `tests/component/leccion.test.tsx` → `[UX-APOGEO]` (contador «Aprendiste N de 3 palabras» y 1 CTA) y `tests/unit/arquitectura/sostenibilidad.test.ts` → `[RNF-001]` |
| **Apogeo-Final** | cierre de lección | ✅ | `src/ui/components/leccion/CierreLeccion.tsx` | Refuerzo inmediato y siguiente paso explícito: XP ganado (RN-05) y racha (RN-06) se muestran **sólo si existen** (nunca «+0 XP») y el CTA lleva a `rutaEvaluacion(nivelId)` | `tests/component/leccion.test.tsx` → `[UX-APOGEO]`, `[RN-08]` (el cierre aparece tras la última tarjeta con un solo CTA); `tests/e2e/flujos/estudiante-completo.spec.ts` → `[RF-004]` |
| **Estética-Usabilidad** | cierre de lección | ⚠️ | `src/ui/components/leccion/CierreLeccion.tsx` | El componente usa sólo `text-title`, `text-body` y `text-caption`, pero el cierre no es una ruta de `PANTALLAS_UX` y no se mide en el bucle `[UX-ESTETICA]`: la jerarquía visual del cierre la valida una persona | Sin medición automática. Evidencia indirecta: `tests/component/leccion.test.tsx` → `[UX-APOGEO]` |

---

## 11. Resumen por ley

| Ley | Filas ✅ | Filas ⚠️ | Observación |
| --- | ---: | ---: | --- |
| **Jakob** | 10 | 0 | Patrón adaptativo, WAI-ARIA, `<button>`/`<select>` nativos y guardia de rol verificados en prueba de componente (`tests/component/{navegacion,design-system,docente,evaluacion,leccion}.test.tsx`) |
| **Hick** | 10 | 0 | La marca `data-cta="primario"` existe y se mide: **exactamente 1** en las 6 rutas auditadas, además de en el resultado, el cierre y el nivel bloqueado |
| **Fitts** | 7 | 3 | Medido en navegador real en las 6 rutas y en prueba de componente. Las 3 ⚠️ (resultado, cierre de lección, nivel bloqueado) son pantallas que no están en `PANTALLAS_UX` y no tienen medida de caja |
| **Miller** | 8 | 2 | 3 tramos en el mapa, corpus e historial agrupados por nivel y 5 + «Ver más». Las 2 ⚠️ (resultado y cierre) no tienen medición automática de agrupamiento |
| **Apogeo-Final** | 10 | 0 | Clímax con confeti respetando `prefers-reduced-motion`, XP/racha/insignias y «próximo paso» tanto al aprobar como al reprobar; la rama aprobada se verifica de forma determinista en prueba de componente |
| **Estética-Usabilidad** | 7 | 3 | ≤ 4 tamaños tipográficos **computados** en las 6 rutas × 2 proyectos. Las 3 ⚠️ (resultado, cierre, nivel bloqueado) sólo tienen verificación por clases, no por medida computada |
| **Total** | **52** | **8** | 60 filas = 10 pantallas × 6 leyes. **0 filas ❌** |

### 11.1 Las 8 filas en ⚠️ y quién las cierra

| # | Ley | Pantalla | Por qué es ⚠️ | Qué falta exactamente |
| --- | --- | --- | --- | --- |
| 1 | Fitts | resultado de evaluación | La auditoría de Fitts recorre las 6 rutas de `PANTALLAS_UX` y en `/quiz/1` mide el estado de examen, no el resultado | Medir la caja del CTA del resultado (o añadir el estado de resultado a la auditoría) y confirmarlo visualmente en Pixel 5 |
| 2 | Miller | resultado de evaluación | No hay prueba de agrupamiento en esta pantalla | Revisar visualmente que el desglose con scroll y la sección de palabras falladas se perciben como bloques, no como una lista de 10 elementos |
| 3 | Estética-Usabilidad | resultado de evaluación | Sólo hay verificación por clases (`[UX-ESTETICA]` de componente), no de tamaños computados | Medir los tamaños computados del resultado o validar a ojo la jerarquía (porcentaje como único `display`) |
| 4 | Fitts | cierre de lección | El cierre no es una ruta auditada; `/lesson/1` se mide con la flashcard visible | Confirmar visualmente el tamaño del CTA fijo y su separación respecto de los botones de marcado |
| 5 | Miller | cierre de lección | No hay aserción de agrupamiento (sólo del contador) | Confirmar visualmente que el cierre resume sin volcar la lista de palabras |
| 6 | Estética-Usabilidad | cierre de lección | No se mide el cierre en el bucle de tamaños | Medir o validar a ojo que el cierre no introduce un cuarto/quinto tamaño |
| 7 | Fitts | nivel bloqueado | Pantalla fuera de `PANTALLAS_UX` | Medir la caja de «Ir a mi nivel actual» en móvil y escritorio (o incluir la ruta bloqueada en la auditoría) |
| 8 | Estética-Usabilidad | nivel bloqueado | Pantalla fuera del bucle de tamaños | Validar la jerarquía de la tarjeta de bloqueo (insignia, título, explicación) |

Además, y con independencia de las filas anteriores, hay dos juicios que **ninguna prueba automatizada puede
dar** y que la revisión humana debe cerrar: la **percepción estética global** (armonía de la paleta andina,
jerarquía, tono) y la **adecuación cultural y lingüística** del vocabulario quechua (variante, ortografía y
traducciones), que requiere hablantes o docentes.

---

## 12. Nota metodológica: cómo se midió cada cosa

1. **Fitts (Playwright midiendo cajas reales).** `tests/e2e/helpers/ux.ts` recorre
   `a, button, [role="button"], input, select, [role="tab"]` y mide `getBoundingClientRect()` **de los
   objetivos visibles dentro del viewport**, excluyendo cajas `0 × 0`, elementos `sr-only`, controles
   deshabilitados y todo lo que queda fuera de pantalla. El umbral se elige por proyecto
   (`Pixel 5` → 44 px, `Desktop Chrome` → 24 px) con `TOLERANCIA_PX = 0.5` por los subpíxeles, y la
   separación se mide entre parejas **adyacentes** de un mismo contenedor (`[data-nav="movil"]` y
   `[data-opcion]`) con distancia horizontal, vertical o diagonal según su disposición.
2. **Hick (conteos del DOM).** Se cuentan los `[data-cta="primario"]:visible` con `:visible` de
   Playwright (no los del DOM oculto) y se exige `toBe(1)` en las 6 rutas; el número de destinos de
   navegación se cuenta sobre `[data-nav-enlace]:visible`, sumando **una sola** de las dos variantes
   (inferior/superior), porque ambas conviven en el DOM y se alternan con `md:`. Los campos por paso
   del formulario docente se cuentan con `input:visible, select:visible, textarea:visible`.
3. **Miller (agrupación por contenedores).** Se cuentan los `[data-tramo]` (exactamente 3) y los
   `[data-nivel]` de cada tramo; en el panel docente y en el tablero se cuentan los
   `[data-oracion]:visible` / `[data-evaluacion]:visible` **dentro de cada** `[data-grupo-nivel]`.
   Para el tablero, la prueba siembra 8 evaluaciones en 2 niveles a través de `localStorage` para que
   la agrupación exista de verdad.
4. **Estética-Usabilidad (tamaños computados).** `tamanosTipograficos()` recorre los **nodos de texto**
   visibles con `createTreeWalker`, lee `getComputedStyle(padre).fontSize` y descarta `svg`, `canvas` y
   los subárboles `aria-hidden="true"` (caras ocultas de la flashcard, iconos, confeti) porque no son
   texto legible. El límite es `MAXIMO_TAMANOS_TIPOGRAFICOS = 4`; la lista medida y una muestra del
   texto de cada tamaño se **adjuntan al reporte** de Playwright para poder auditarla sin re-ejecutar.
5. **Accesibilidad (axe-core).** `tests/e2e/a11y/paginas.spec.ts` ejecuta `AxeBuilder` con las
   etiquetas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa` sobre el DOM **ya hidratado** de las 6
   pantallas, en los dos proyectos (parte de la UI —barra inferior en móvil, selector de rol en
   escritorio— existe sólo en uno de los dos), y exige **cero violaciones** de cualquier impacto; el
   detalle se adjunta al reporte. Las reglas de *mejores prácticas* quedan fuera porque RNF-002 se
   define como conformidad WCAG 2.1 A/AA. **Límite honesto:** axe no puede resolver el contraste
   efectivo sobre fondos con degradado (por ejemplo la portada o el reverso de la flashcard), así que
   esos casos concretos requieren una comprobación visual.
6. **Preferencias del sistema desactivando animaciones.** `usePreferenciaReducida()`
   (`src/ui/hooks/usePreferenciaReducida.ts`) se suscribe a `(prefers-reduced-motion: reduce)` con
   `useSyncExternalStore`; el confeti no se dispara con esa preferencia (y `canvas-confetti` la vuelve
   a consultar con `disableForReducedMotion`), y `src/styles/global.css` apaga animaciones,
   transiciones y `scroll-behavior` como red de seguridad CSS. La regla pura `debeLanzarConfeti()` se
   prueba sin lienzo en `tests/component/evaluacion.test.tsx` → `[UX-APOGEO]`.
7. **Qué NO mide esta suite.** Las mediciones son cuantitativas sobre el DOM: detectan regresiones
   objetivas (un objetivo por debajo del mínimo, un segundo CTA primario, un quinto tamaño de fuente,
   un grupo de 8 elementos), pero **no sustituyen** una evaluación de usabilidad con personas. De ahí
   que las 8 filas ⚠️ y los juicios estéticos/culturales queden asignados a revisión humana.

**Nota de coherencia de etiquetas.** El test de agrupación de retos de
`tests/component/comunidad.test.tsx` («con más de 6 retos agrupa por estado y ofrece Ver más») está
etiquetado `[UX-FITTS]` aunque lo que verifica es agrupamiento (Miller); se cita tal cual para no
falsear la trazabilidad, y conviene retaggearlo a `[UX-MILLER]`.

---

## 13. Referencias

- `.agents/skills/leyes-ux/SKILL.md` y `.agents/skills/leyes-ux/references/{jakob,hick,fitts,miller,apogeo-final,estetica-usabilidad}.md`
- [ADR-001 — Arquitectura hexagonal](ADR-001-arquitectura-hexagonal.md) · [ADR-002 — Persistencia local y sincronización](ADR-002-persistencia-local-y-sincronizacion.md) · [ADR-003 — Autenticación simulada](ADR-003-autenticacion-simulada.md) · [ADR-004 — Despliegue en GitHub Pages](ADR-004-despliegue-github-pages.md) · [Diagrama de capas](diagrama-de-capas.md)
- `tailwind.config.mjs` (tokens de Fitts y de la escala tipográfica) · `src/styles/global.css` (foco visible y `prefers-reduced-motion`) · `src/domain/shared/tipos.ts` (tramos de Miller) · `src/domain/evaluacion/PoliticaAprobacion.ts` · `src/ui/lib/ruta.ts` (`rutaLeccion` con palabras falladas)
- `playwright.config.ts` (proyectos `Desktop Chrome` y `Pixel 5`; reporter JUnit en `reports/junit/playwright.xml`) · `vitest.config.ts` (umbrales de cobertura) · `tests/e2e/helpers/ux.ts` (todas las medidas)
- [Plan de pruebas](../testing/plan-de-pruebas.md) · [Matriz de trazabilidad](../testing/matriz-trazabilidad.md) (artefacto autogenerado por `npm run reports:trazabilidad`)
