# Checklist de las 6 leyes UX por pantalla — YAPU

Verificación de las seis leyes de experiencia de usuario (**Jakob, Hick, Fitts, Miller, Apogeo-Final,
Estética-Usabilidad**) **pantalla por pantalla**, con la evidencia concreta: qué componente la
implementa, qué medida se exige y qué prueba lo verifica.

- **Documento relacionado:** [ADR-001](ADR-001-arquitectura-hexagonal.md) · [ADR-004](ADR-004-despliegue-github-pages.md) · [Diagrama de capas](diagrama-de-capas.md)
- **Base normativa interna:** `.agents/skills/leyes-ux/SKILL.md` y sus referencias en `.agents/skills/leyes-ux/references/`.
- **Estado:** el refactor de UI está **en curso**. Todo lo que no se pudo verificar leyendo el código se marca con ⚠️ y se recoge en la sección final [Pendiente de verificación por el revisor](#pendiente-de-verificación-por-el-revisor).

---

## 0. Cómo leer este checklist

### 0.1 Símbolos

| Símbolo | Significado |
| --- | --- |
| ✅ | **Implementado y verificable en el código** que existe hoy en el repositorio |
| ⚠️ | **No verificable todavía** (componente previsto, aún no creado) o implementación parcial que no cumple la medida exigida |
| ❌ | **Incumplido de forma comprobada** en el código actual, con el motivo indicado |

### 0.2 Umbrales y medidas de referencia

| Ley | Medida exigida | Token / artefacto que la fija |
| --- | --- | --- |
| **Fitts** | Objetivos táctiles **≥ 44 × 44 px en móvil** y **≥ 24 × 24 px en escritorio**; **separación ≥ 8 px** entre objetivos | `tailwind.config.mjs` → `minHeight.minWidth.tactil = 2.75rem` (44 px), `tactil-escritorio = 1.5rem` (24 px), `spacing.toque = 2.75rem`, `spacing['separacion-objetivos'] = 0.5rem` (8 px) |
| **Hick** | **≤ 7 opciones primarias** por pantalla y **exactamente 1 CTA** con `data-cta="primario"` | Marca semántica `data-cta="primario"`; el componente base es `src/ui/design-system/Boton.tsx` (previsto) |
| **Miller** | Tramos **1–3 / 4–7 / 8–10**; ningún grupo de opciones supera 7 elementos | `src/domain/shared/tipos.ts` → `TRAMOS`, `tramoDeNivel()`; `NivelDto.tramo` en `src/application/dto/aprendizaje.ts` |
| **Apogeo-Final** | Clímax en la aprobación y **próximo paso claro** al reprobar | `PoliticaAprobacion.mensajeResultado()`; `ResultadoEvaluacionDto.palabrasFalladas`; `rutaLeccion(nivel, palabrasFalladas)` en `src/ui/lib/ruta.ts` |
| **Estética-Usabilidad** | **≤ 3 tamaños tipográficos** por pantalla **+ caption**; sólo los tokens, nunca `text-xs/sm/lg/xl…` | `tailwind.config.mjs` → `fontSize`: `caption` (0.75 rem), `body` (0.9375 rem), `title` (1.25 rem), `display` (2 rem) |
| **Jakob** | Patrones convencionales: **navegación inferior en móvil / superior en escritorio**, iconografía reconocible, pestaña Docente sólo con rol docente | `src/components/Navigation.tsx` (legado; migrará a `src/ui/components/Navigation.tsx`) |

### 0.3 Etiquetas de prueba

Las pruebas de UX se etiquetan en el nombre del test y `scripts/generar-matriz-trazabilidad.mjs` las
recoge para la matriz de trazabilidad:

| Etiqueta | Ley |
| --- | --- |
| `[UX-JAKOB]` | Jakob |
| `[UX-HICK]` | Hick |
| `[UX-FITTS]` | Fitts |
| `[UX-MILLER]` | Miller |
| `[UX-APOGEO]` | Apogeo-Final |
| `[UX-ESTETICA]` | Estética-Usabilidad |

Su ubicación prevista es `tests/e2e/ux/*.spec.ts`. **En el árbol verificado todavía no existe el
directorio `tests/e2e/ux/`**: las pruebas se escriben en paralelo al refactor de UI, por lo que en
todas las tablas la prueba aparece como *prevista* y ninguna pantalla puede darse por verificada
hasta que exista el archivo correspondiente.

### 0.4 Pantallas cubiertas

Portada/mapa de niveles · lección/flashcards · evaluación en curso · resultado de evaluación ·
tablero de progreso · comunidad/retos · panel docente (3 pestañas) · nivel bloqueado ·
navegación global · cierre de lección.

---

## 1. Portada / mapa de niveles

**Ruta:** `/Yapu/` · **Archivos:** `src/pages/index.astro`, `src/components/LevelMap.tsx` (legado) → `src/ui/components/mapa/**` (previsto) · **Caso de uso:** `ObtenerMapaNivelesUseCase` (RF-003, previsto)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | `src/components/LevelMap.tsx` presenta los 10 niveles como camino secuencial con candado en los no accesibles e icono por nivel (`lucide-react`), patrón convencional de mapa de progreso. Falta confirmar la migración a `src/ui/components/mapa/` y que la navegación cumpla inferior-móvil / superior-escritorio | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | La portada ofrece 10 niveles; se agrupan en **3 tramos** (`TRAMOS` en `src/domain/shared/tipos.ts`) para no presentar 10 decisiones simultáneas. El número de opciones primarias por pantalla y la existencia de **exactamente 1** `data-cta="primario"` no se pueden comprobar: `data-cta` no aparece todavía en el código | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | `LevelMap.tsx` usa `min-h-[44px]` en los botones de acción del nivel; el token `min-h-tactil` (= 44 px) y `min-w-tactil` existen en `tailwind.config.mjs` pero los componentes aún usan valores literales. Falta verificar la separación ≥ 8 px (`spacing['separacion-objetivos']`) entre objetivos contiguos en móvil | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ✅ | `src/domain/shared/tipos.ts` define `TRAMOS`: Fundamentos (1–3), Vida cotidiana (4–7), Cosmovisión (8–10); `tramoDeNivel(nivel)` asigna cada nivel y `MapaNivelesDto.tramos: TramoDto[]` agrupa los 10 niveles en 3 bloques ≤ 7 elementos | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto); hoy la regla se prueba indirectamente en `tests/unit/domain/value-objects.test.ts` |
| **Apogeo-Final** | ⚠️ | El mapa muestra `porcentajeGlobal` (RN-03) y la racha, y la portada cierra con un footer institucional. No se puede verificar aún el clímax visual al completar el curso (`cursoCompletado = true`) | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `src/pages/index.astro` y `src/components/LevelMap.tsx` usan **utilidades Tailwind crudas** (`text-xs`, `text-sm`, `text-2xl`, `text-lg`, `text-[11px]`) en lugar de los tokens `text-caption`/`text-body`/`text-title`/`text-display`. `index.astro` acumula además `text-xs`, `text-sm` y `text-[11px]` en una misma pantalla: supera el límite de 3 tamaños + caption. Los tokens **sí existen** en `tailwind.config.mjs`; falta migrar los componentes | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 2. Lección / flashcards

**Ruta:** `/Yapu/lesson/[level]` · **Archivos:** `src/pages/lesson/[level].astro`, `src/components/FlashcardLesson.tsx` (legado) → `src/ui/components/leccion/**` (previsto) · **Casos de uso:** `ObtenerLeccionUseCase`, `MarcarPalabraUseCase` (RF-004, previstos)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | Tarjeta que se voltea al tocar ("Toca para ver traducción" / "Significado en Español") y dos acciones con etiquetas explícitas: *«¡Ya me la sé!»* y *«Necesito Repasar»*. Patrón de flashcard reconocible, pendiente de migración a `src/ui/components/leccion/` | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | Por tarjeta hay **2 opciones** de marcado (aprendida / repasar) más la navegación: dentro del límite de 7 opciones primarias. Falta confirmar la marca `data-cta="primario"` (hoy inexistente) para garantizar un único CTA por pantalla | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | `FlashcardLesson.tsx` declara `min-h-[48px]` en los botones de marcado y `min-h-[44px]` en el botón de avance; toda la tarjeta es además un objetivo táctil grande para voltearla. Los literales deben sustituirse por `min-h-tactil`/`min-w-tactil` (44 px) del design system | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | La lección se recorre de una palabra en una: `LeccionDto.palabras: PalabraDto[]` se presenta de a una tarjeta, de modo que nunca se despliegan más de 7 elementos de decisión a la vez. Requiere confirmación visual | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | `LeccionDto.aprendidas` cuenta las palabras ya aprendidas y `esRepaso` marca la lección abierta tras reprobar (Apogeo-Final). Falta verificar el refuerzo visual al completar la última tarjeta | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `FlashcardLesson.tsx` combina `text-xs`, `text-sm`, `text-2xl`, `text-3xl`, `text-4xl` en la misma pantalla: **5 tamaños**, por encima del máximo de 3 + caption. Debe migrarse a `text-caption` / `text-body` / `text-title` / `text-display` | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 3. Evaluación en curso

**Ruta:** `/Yapu/quiz/[level]` · **Archivos:** `src/pages/quiz/[level].astro`, `src/components/QuizRunner.tsx` (legado) → `src/ui/components/evaluacion/**` (previsto) · **Casos de uso:** `GenerarEvaluacionUseCase`, `CalificarEvaluacionUseCase` (RF-005, previstos)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | `QuizRunner.tsx` muestra "Pregunta N de 10", opciones seleccionables con confirmación visual, contador de progreso y botón *«Siguiente Pregunta»* / *«Calificar Evaluación»*: patrón de cuestionario convencional. Pendiente de migración a `src/ui/components/evaluacion/` | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | Sólo se presenta **una pregunta a la vez** con **4 opciones** (`GeneradorEvaluacion.OPCIONES_POR_PREGUNTA = 4`, RN-09) más un botón de avance: muy por debajo de 7 opciones primarias. Falta la marca `data-cta="primario"` para el botón de avance | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | Las opciones ocupan el ancho completo con `min-h-[52px]` y el CTA declara `min-h-[50px]`, por encima del mínimo de 44 px. Falta estandarizar a los tokens del design system y verificar la separación ≥ 8 px entre opciones | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ✅ | **1 pregunta × 4 opciones** por pantalla: el tramo de Miller 1–3 / 4–7 nunca se supera. La regla de 4 opciones es además una invariante del dominio (`Pregunta.crear` exige exactamente 4 opciones únicas, RN-09) | `tests/unit/domain/evaluacion/pregunta.test.ts`; `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | La evaluación mantiene el suspenso hasta el final: no adelanta el resultado, de modo que el clímax queda reservado a la pantalla de resultado. RN-16 permite volver a la pregunta anterior y exige marcar antes de avanzar (`disabled:opacity-40` en el CTA de avance). Falta verificar el refuerzo de cierre | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `QuizRunner.tsx` usa `text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`: **7 tamaños** en una sola pantalla, muy por encima del máximo de 3 + caption. Es la pantalla con mayor incumplimiento y la primera que debe migrar a los tokens tipográficos | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 4. Resultado de evaluación

**Ruta:** misma que la evaluación, estado de resultado · **Archivos:** `src/components/QuizRunner.tsx` (legado) → `src/ui/components/evaluacion/ResultadoEvaluacion.tsx` (previsto) · **DTO:** `ResultadoEvaluacionDto`

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | Estructura convencional de resultado: puntuación, porcentaje de aciertos, detalle pregunta a pregunta con la opción correcta, la marcada y la explicación pedagógica (`DetalleRespuestaDto`), más el retorno a la lección o al mapa | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | Deben convivir como máximo **1 CTA primario** (continuar o repasar) y un secundario (volver al mapa). El `ResultadoEvaluacionDto` expone `nivelDesbloqueado`, `cursoCompletado`, `xpGanado` y `palabrasFalladas`, que son los candidatos a CTA; falta fijar cuál es el primario con `data-cta="primario"` | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | Los botones de retorno (*«Ver Mapa de Niveles»*) y de repaso deben respetar ≥ 44 px en móvil y ≥ 24 px en escritorio con separación ≥ 8 px. Pendiente de verificar en `ResultadoEvaluacion.tsx` | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | El detalle de 10 preguntas debe presentarse agrupado o plegable: 10 elementos en una lista plana supera el tramo 8–10 de Miller. Requiere confirmación de la agrupación (por ejemplo, aciertos y errores en dos bloques) | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | Es el clímax del recorrido: al aprobar se muestra el mensaje de `PoliticaAprobacion.mensajeResultado(aprobado, puntuacion)` con el umbral (70) y se comunica el nivel desbloqueado. Al reprobar, el DTO aporta `palabrasFalladas` para el CTA *«Repasar las N palabras falladas»* vía `rutaLeccion(nivel, palabrasFalladas)`. `QuizRunner.tsx` dispara confeti (`canvas-confetti`) al aprobar. **Falta comprobar que el confeti se desactiva con `prefers-reduced-motion`**: no se encontró ninguna consulta de esa media query en el código | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | La pantalla de resultado comparte el archivo `QuizRunner.tsx`, con los mismos 7 tamaños tipográficos detectados. Además, el confeti es una animación decorativa que debe respetar `prefers-reduced-motion` (⚠️ no implementado) | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 5. Tablero de progreso

**Ruta:** `/Yapu/dashboard` · **Archivos:** `src/pages/dashboard.astro`, `src/components/Dashboard.tsx` (legado) → `src/ui/components/tablero/**` (previsto) · **Caso de uso:** `ObtenerTableroUseCase` (RF-008, previsto)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | `Dashboard.tsx` replica el patrón convencional de tablero: título *«Tablero del Estudiante»*, saludo en runasimi (*«Allianllachu, Yachaq!»*), cuatro métricas en tarjetas, lista de repaso e historial de evaluaciones | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | Cuatro métricas + dos listas + botón de continuar: dentro del límite de 7 opciones primarias. Falta confirmar que el botón de continuar sea el único `data-cta="primario"` | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | Los botones de acción declarados usan `min-h-[44px]`; el botón de repaso por palabra es pequeño (`px-2.5 py-1.5`) y **debe verificarse** que alcance 44 × 44 px en móvil. Los tokens `min-h-tactil`/`min-w-tactil` permiten fijarlo sin literales | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | Las métricas son **4** (`TableroDto`: `xp`, `rachaDias`, `palabrasAprendidas`, `porcentajeGlobal`) y las listas deben acotarse (historial de evaluaciones y palabras para repasar). Requiere confirmar que ni el historial ni la lista de repaso muestren más de 7 elementos sin paginar o plegar | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | El tablero es el cierre del ciclo: debe mostrar el avance tras la aprobación (nivel actual, `porcentajeGlobal` con RN-03 y racha de RN-06) y ofrecer el siguiente paso. Falta verificar el refuerzo visual del progreso recién ganado | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `Dashboard.tsx` usa `text-xs`, `text-sm`, `text-lg`, `text-2xl`, `text-3xl`: **5 tamaños** en la misma pantalla. Debe migrarse a `text-caption` / `text-body` / `text-title` / `text-display` | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 6. Comunidad / retos

**Ruta:** `/Yapu/community` · **Archivos:** `src/pages/community.astro`, `src/components/CommunitySection.tsx` (legado) → `src/ui/components/comunidad/**` (previsto) · **Casos de uso:** `ListarRetosUseCase`, `ProponerRetoUseCase`, `ModerarRetoUseCase` (RF-007 / RS-003, previstos)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | Formulario de propuesta (*«Publicar un Reto Lingüístico»*) + listado de retos con su estado, patrón de muro comunitario. El formulario **sólo se habilita** si `PermisoRetoDto.puedeProponer` (rol estudiante y nivel ≥ 7, RN-13), y `PermisoRetoDto.motivo` explica en español por qué no se puede: reconocible y honesto | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | La lista de retos y su estado de moderación no deben superar 7 elementos primarios visibles; el formulario tiene campos acotados (texto, traducción, pista, nivel). Falta fijar el `data-cta="primario"` del botón de publicación | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | Los campos del formulario y los botones de acción deben respetar ≥ 44 px en móvil y separación ≥ 8 px. Pendiente de verificar tras la migración al design system | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | La lista de retos puede crecer indefinidamente: debe acotarse o agruparse por estado (`pendiente` / `aprobado` / `rechazado`) para no superar 7 elementos por bloque. Requiere confirmación | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | El cierre del ciclo comunitario es la publicación del reto al alcanzar 2 aprobaciones de docentes distintos (`RetoComunitario.APROBACIONES_REQUERIDAS = 2`). Falta verificar que ese momento se celebre visualmente en la UI | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `CommunitySection.tsx` combina `text-xs`, `text-sm`, `text-base`, `text-2xl`: **4 tamaños** (uno por encima del máximo de 3 + caption). Debe migrarse a los tokens | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 7. Panel docente — pestañas Oraciones / Moderación / Exportación

**Ruta:** `/Yapu/docente` · **Archivos:** `src/pages/docente.astro`, `src/components/DocentePanel.tsx` (legado) → `src/ui/components/docente/**` (previsto) · **Casos de uso:** `RegistrarOracionBaseUseCase`, `ListarOracionesUseCase`, `ModerarRetoUseCase`, `ExportarCorpusCsvUseCase` (RF-006, RF-007/RS-003, RS-004, previstos)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | `DocentePanel.tsx` usa **pestañas** (*«Oraciones Base»*, moderación y exportación) con el patrón estándar de panel de administración: contenido en columnas, formulario de alta y estado de cada elemento. La pestaña Docente sólo debe ser visible con rol docente (`SesionDto.esDocente`, ADR-003) | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | Las pestañas reducen las opciones primarias por vista (una sección activa a la vez). El formulario de oración combina varios campos; debe verificarse que no se presenten más de 7 decisiones primarias simultáneas ni más de un `data-cta="primario"` por pestaña | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | Los botones de pestaña (`px-4 py-2`) pueden quedar por debajo de 44 px de alto en móvil: **debe verificarse y corregirse** con `min-h-tactil`/`min-w-tactil`. Los botones de acción del formulario declaran `min-h-[48px]` | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | Tres pestañas (dentro del tramo 1–3) y tres acciones de gestión, correcto. El listado de oraciones y la cola de moderación **sí** pueden crecer: deben paginarse o filtrarse para no superar 7 elementos visibles por bloque | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | El cierre del ciclo docente es la confirmación de la oración registrada (`RN-12`, queda aprobada y alimenta al generador) y la exportación completada (RN-14, RS-004: `ExportacionCorpusDto` con `nombreArchivo`, `filas` y `tipoMime`). Falta verificar la confirmación visual de ambas | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `DocentePanel.tsx` usa `text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`: **5 tamaños** en la misma pantalla. Debe migrarse a `text-caption` / `text-body` / `text-title` / `text-display` | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 8. Nivel bloqueado

**Presentación:** estado dentro de la portada/mapa y de las rutas `/lesson/[level]` y `/quiz/[level]` · **Origen:** `NivelBloqueadoError` (`src/domain/errores.ts`), `PoliticaDesbloqueo.asegurarAcceso` (RN-01), `NivelDto.accesible`

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | El nivel no accesible se muestra con candado y sin acción de navegación (`NivelDto.accesible = false`), en lugar de ofrecer un botón que falle: el patrón esperado en una ruta de aprendizaje. El mensaje del error ya está en español (`NivelBloqueadoError`: *«El nivel N está bloqueado: primero aprueba el nivel M.»*) y `mensajeAmigable(error)` evita mostrar texto técnico | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | Un nivel bloqueado no debe ofrecer acciones primarias: 0 decisiones en lugar de un botón inútil. **Debe verificarse** que no quede ningún `data-cta="primario"` en el estado bloqueado (la ausencia de acción es la decisión) | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | Si el nivel bloqueado conserva un botón (por ejemplo *«Ir al nivel actual»*), debe respetar ≥ 44 px en móvil y ≥ 24 px en escritorio con separación ≥ 8 px. Requiere verificación | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ✅ | El estado bloqueado pertenece a **un** nivel dentro de su tramo (1–3 / 4–7 / 8–10): no añade decisiones ni elementos a la pantalla | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto); la regla de acceso se prueba en `tests/unit/domain/aprendizaje/politicas.test.ts` (`[RN-01]`) |
| **Apogeo-Final** | ⚠️ | El estado bloqueado debe orientar al siguiente paso posible (*«primero aprueba el nivel M»*), no dejar al estudiante en un callejón sin salida. El mensaje del error ya lo hace en el dominio; falta el refuerzo visual en la UI | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ⚠️ | Al ser un estado dentro de otra pantalla, hereda su escala tipográfica. Quedará conforme cuando la pantalla contenedora migre a los tokens; no se puede verificar por separado | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 9. Navegación global

**Archivos:** `src/components/Navigation.tsx` (legado) → `src/ui/components/Navigation.tsx` (previsto) · **Helpers:** `src/ui/lib/ruta.ts` (`ruta`, `rutaActiva`)

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | `Navigation.tsx` presenta la marca YAPU, los enlaces principales y la ruta activa resaltada (`rutaActiva(pathActual, destino)`); se espera **navegación inferior en móvil y superior en escritorio**. El código actual usa `md:` para alternar la disposición, pero **falta confirmar** que sea exactamente inferior/superior y que la pestaña Docente sólo aparezca con rol docente | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | La barra muestra un conjunto reducido de destinos (Inicio/mapa, tablero, comunidad y Docente cuando corresponde): dentro del límite. **Debe verificarse** que en móvil no se acumulen más de 7 destinos primarios y que ninguno lleve `data-cta="primario"` (la navegación no compite con el CTA de la pantalla) | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | En móvil la barra inferior debe ofrecer objetivos de **≥ 44 × 44 px** con separación **≥ 8 px** entre destinos; en escritorio basta **≥ 24 × 24 px**. Los enlaces usan `px-3.5 py-2 text-sm` y **no declaran altura mínima**: es el punto de mayor riesgo de incumplimiento de Fitts | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | Debe comprobarse que los destinos de navegación se mantengan dentro de un tramo de Miller (1–3 idealmente en móvil). Requiere confirmación tras la migración | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | La navegación no debe competir con el clímax: en la pantalla de resultado el retorno debe ser visible pero no más prominente que el CTA de repaso o de continuación. Requiere verificación | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ❌ | `Navigation.tsx` usa `text-xl`, `text-sm`, `text-xs`: 3 tamaños + potencialmente `text-body` en los enlaces. Está cerca del límite y debe migrarse a `text-caption` / `text-body` / `text-title` / `text-display` para que la medición automática de tamaños computados por pantalla pase | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 10. Cierre de lección

**Presentación:** estado final de `/Yapu/lesson/[level]` · **DTO:** `LeccionDto` (`aprendidas`, `esRepaso`), `ResultadoMarcarPalabraDto` (`xpGanado`, `palabrasAprendidas`, `rachaDias`) · **Helper:** `rutaEvaluacion(nivel)` en `src/ui/lib/ruta.ts`

| Ley | Estado | Evidencia: componente y medida concreta | Prueba que lo verifica |
| --- | --- | --- | --- |
| **Jakob** | ⚠️ | Al terminar las tarjetas, el patrón esperado es un resumen de la lección con el progreso y un enlace directo a la evaluación del mismo nivel (`rutaEvaluacion(nivel)`). Requiere confirmar el componente de cierre | `tests/e2e/ux/jakob.spec.ts` → `[UX-JAKOB]` (previsto) |
| **Hick** | ⚠️ | El estado de cierre debe ofrecer **exactamente 1 CTA primario** (ir a la evaluación o repetir las tarjetas falladas) y un secundario (volver al mapa). Debe marcarse con `data-cta="primario"` | `tests/e2e/ux/hick.spec.ts` → `[UX-HICK]` (previsto) |
| **Fitts** | ⚠️ | El CTA de cierre debe ser el objetivo más grande de la pantalla: ≥ 44 px de alto en móvil, ≥ 24 px en escritorio, con separación ≥ 8 px respecto del secundario | `tests/e2e/ux/fitts.spec.ts` → `[UX-FITTS]` (previsto) |
| **Miller** | ⚠️ | El resumen de cierre no debe listar las 10+ palabras de la lección en un bloque: conviene un contador (`aprendidas`) y, si se listan, agruparlas por estado (`nuevo` / `repasar` / `aprendido`). Requiere verificación | `tests/e2e/ux/miller.spec.ts` → `[UX-MILLER]` (previsto) |
| **Apogeo-Final** | ⚠️ | Es el punto donde se comunica el refuerzo inmediato: `ResultadoMarcarPalabraDto.xpGanado` (+2 por palabra aprendida la primera vez, RN-05) y `rachaDias` (RN-06). Falta verificar que el cierre celebre el avance y marque con claridad el siguiente paso (`rutaEvaluacion(nivel)`) | `tests/e2e/ux/apogeo.spec.ts` → `[UX-APOGEO]` (previsto) |
| **Estética-Usabilidad** | ⚠️ | Al ser un estado del componente de lección (`FlashcardLesson.tsx`), hereda sus **5 tamaños tipográficos** actuales. Quedará conforme cuando la lección migre a los tokens; no se puede verificar por separado | `tests/e2e/ux/estetica.spec.ts` → `[UX-ESTETICA]` (previsto) |

---

## 11. Resumen por ley

| Ley | ✅ | ⚠️ | ❌ | Observación |
| --- | ---: | ---: | ---: | --- |
| **Jakob** | 0 | 11 | 0 | Ningún incumplimiento detectado; todo pendiente de confirmar en la UI nueva |
| **Hick** | 0 | 11 | 0 | `data-cta="primario"` **no existe todavía** en el código: sin esa marca no hay medición automática posible |
| **Fitts** | 0 | 11 | 0 | Los componentes usan literales (`min-h-[44px]`, `min-h-[48px]`, `min-h-[52px]`) en lugar de los tokens `min-h-tactil`/`min-w-tactil` |
| **Miller** | 4 | 7 | 0 | La agrupación en 3 tramos es una regla de **dominio** ya implementada y probada |
| **Apogeo-Final** | 0 | 11 | 0 | El texto de resultado existe en el dominio; `prefers-reduced-motion` para el confeti **no está implementado** |
| **Estética-Usabilidad** | 0 | 4 | 7 | Incumplimiento generalizado: utilidades Tailwind crudas en lugar de los tokens tipográficos |

---

## 12. Pendiente de verificación por el revisor

Los siguientes puntos **no se pudieron verificar leyendo el código** en el momento de redactar este
documento, porque el refactor de UI y la suite E2E de UX están en curso. Cada uno queda asignado a
la evidencia que lo resolvería.

### 12.1 Componentes que aún no existen

| # | Punto pendiente | Evidencia que lo resolvería |
| --- | --- | --- |
| 1 | `src/ui/design-system/**` no existe: no hay `Boton.tsx` ni ningún otro primitivo que fije las medidas táctiles o la marca `data-cta` | Existencia de `src/ui/design-system/Boton.tsx` que aplique `min-h-tactil`/`min-w-tactil` y propague `data-cta` |
| 2 | `src/ui/components/**` por feature no existe: las pantallas viven todavía en `src/components/**` (legado) | Migración de `LevelMap`, `FlashcardLesson`, `QuizRunner`, `Dashboard`, `CommunitySection`, `DocentePanel` y `Navigation` a `src/ui/components/**` |
| 3 | `src/ui/hooks/**` no existe: no se puede comprobar que sea el único punto que lee `src/infrastructure/container.ts` | Existencia de los *hooks* y de la excepción explícita a `container.ts` en el bloque `src/ui/hooks/**` de `eslint.config.js` |
| 4 | El atributo `data-cta="primario"` **no aparece en ninguna parte del código**: no se puede medir "exactamente 1 CTA primario por pantalla" | Búsqueda de `data-cta="primario"` con exactamente una coincidencia por pantalla en la UI nueva |

### 12.2 Suite de pruebas de UX ausente

| # | Punto pendiente | Evidencia que lo resolvería |
| --- | --- | --- |
| 5 | `tests/e2e/ux/` **no existe**: no hay ningún `.spec.ts` con las etiquetas `[UX-JAKOB]`, `[UX-HICK]`, `[UX-FITTS]`, `[UX-MILLER]`, `[UX-APOGEO]` ni `[UX-ESTETICA]` | Creación de `tests/e2e/ux/*.spec.ts` y ejecución de `npm run test:e2e:ux` en verde |
| 6 | `tests/e2e/a11y/` **no existe**, aunque `package.json` declara `test:a11y` y el CI lo ejecuta | Creación de la suite de accesibilidad con `@axe-core/playwright` |
| 7 | `tests/e2e/flujos/` **no existe**, aunque `package.json` declara `test:e2e` apuntando a esa carpeta (hoy la única prueba E2E del árbol es `tests/e2e/pwa-student-journey.spec.ts`) | Reubicación de la prueba existente o creación de la carpeta con los flujos críticos |
| 8 | Los reportes JUnit de UX no existen, por lo que la matriz de trazabilidad muestra las 6 leyes UX como *«❌ Sin cobertura»* | Regenerar `Docs/testing/matriz-trazabilidad.md` con `npm run reports:trazabilidad` tras ejecutar la suite |

### 12.3 Comportamientos no implementados o no comprobados

| # | Punto pendiente | Evidencia que lo resolvería |
| --- | --- | --- |
| 9 | **`prefers-reduced-motion` no se consulta en ninguna parte del código.** `QuizRunner.tsx` dispara `canvas-confetti` al aprobar sin comprobar la preferencia del sistema | Una consulta `window.matchMedia('(prefers-reduced-motion: reduce)')` que desactive el confeti y una prueba `[UX-APOGEO]` que la verifique |
| 10 | La **navegación inferior en móvil / superior en escritorio** no se ha podido confirmar como patrón explícito (se detectó alternancia por `md:` pero sin comprobar la disposición final) | Prueba `[UX-JAKOB]` que compruebe la posición de la barra en los dos *viewports* (Pixel 5 y Desktop Chrome, que ya están declarados en `playwright.config.ts`) |
| 11 | La **separación ≥ 8 px** entre objetivos táctiles contiguos no se ha medido en ninguna pantalla | Prueba `[UX-FITTS]` que mida `getBoundingClientRect()` de objetivos hermanos y verifique el hueco |
| 12 | El número de **opciones primarias ≤ 7** por pantalla no se ha contado en ninguna pantalla real | Prueba `[UX-HICK]` que cuente los objetivos interactivos primarios visibles |
| 13 | Los **tamaños tipográficos computados** por pantalla no se han medido: el límite es ≤ 3 + caption y hoy 7 de 11 pantallas usan utilidades Tailwind crudas | Prueba `[UX-ESTETICA]` que lea `getComputedStyle(...).fontSize` y compruebe ≤ 4 valores distintos |
| 14 | La visibilidad de la **pestaña Docente sólo con rol docente** no se puede comprobar hasta que existan `ObtenerSesionUseCase` y `CambiarRolUseCase` | Prueba `[UX-JAKOB]` con dos sesiones (estudiante y docente) |
| 15 | El **estado de sincronización** (`EstadoSincronizacionDto`) no tiene pantalla asignada en este checklist; si el contador de pendientes se muestra en el tablero, debería evaluarse también contra Hick y Miller | Decisión de diseño y, si aplica, fila añadida a la tabla del tablero |

### 12.4 Cómo cerrar estos pendientes

1. Completar el design system y migrar las 6 pantallas a `src/ui/components/**` con los **tokens** (`text-caption`/`text-body`/`text-title`/`text-display`, `min-h-tactil`/`min-w-tactil`, `separacion-objetivos`) y la marca `data-cta="primario"`.
2. Escribir `tests/e2e/ux/*.spec.ts` con las seis etiquetas, en los dos *viewports* ya configurados.
3. Añadir la consulta de `prefers-reduced-motion` antes de disparar el confeti.
4. Ejecutar `npm run test:e2e:ux` y `npm run reports:trazabilidad`, y comprobar que las 6 leyes UX pasan de *«❌ Sin cobertura»* a *«✅ Cubierto»* en `Docs/testing/matriz-trazabilidad.md`.
5. Volver a este documento y sustituir cada ⚠️ y cada ❌ por la evidencia real (componente + medida + test en verde).

## 13. Referencias

- `.agents/skills/leyes-ux/SKILL.md` y `.agents/skills/leyes-ux/references/{jakob,hick,fitts,miller,apogeo-final,estetica-usabilidad}.md`
- [ADR-001 — Arquitectura hexagonal](ADR-001-arquitectura-hexagonal.md)
- [ADR-004 — Despliegue en GitHub Pages](ADR-004-despliegue-github-pages.md)
- [Diagrama de capas](diagrama-de-capas.md)
- `tailwind.config.mjs` (tokens de Fitts y Estética-Usabilidad) · `src/domain/shared/tipos.ts` (tramos de Miller) · `src/domain/evaluacion/PoliticaAprobacion.ts` (mensaje de Apogeo-Final) · `src/ui/lib/ruta.ts` (`rutaLeccion` con palabras falladas) · `playwright.config.ts` (viewports Desktop Chrome y Pixel 5)
- Matriz de trazabilidad (artefacto generado por `npm run reports:trazabilidad`): `Docs/testing/matriz-trazabilidad.md`
