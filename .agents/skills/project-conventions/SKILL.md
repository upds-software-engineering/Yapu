---
name: project-conventions
description: Convenciones reales del proyecto YAPU (PWA de quechua, Astro 5 + React 19 + TypeScript, arquitectura hexagonal): idioma español, nomenclatura, reglas de dependencia entre capas, convención de commits, convención de tests, design system y umbrales de las 6 leyes UX, y checklist antes de commitear.
version: 2.0.0
---

# Convenciones del proyecto YAPU

## Cuándo usar esta skill

- **SIEMPRE** que se escriba, modifique o revise código en `J:\www\Yapu`.
- **Antes de cada commit.**
- Al revisar un PR o al revisar código generado por otra herramienta.
- Al crear archivos nuevos: la ubicación del archivo **es** una decisión de arquitectura.

> **Nota:** esta skill describe el proyecto **YAPU**. Los archivos de `.agents/skills/project-conventions/rules/`
> (`git-flow.md`, `backend-patterns.md`, `frontend-patterns.md`) provienen de otro proyecto («Ojo Camba»,
> NestJS + pnpm) y **no aplican a YAPU**: descríbelos como obsoletos y no los sigas.

---

## 1. Idioma: español en todo

- **Identificadores de dominio en español:** clases, interfaces, tipos, propiedades, métodos, constantes y nombres de archivo del dominio y de la aplicación.
  Correcto: `Palabra`, `NivelId`, `ProgresoEstudiante`, `PoliticaAprobacion.UMBRAL`, `ListarOracionesUseCase`, `Repositorio` en los puertos (`ProgresoRepository` es la excepción heredada del vocabulario de patrones).
- **Comentarios, JSDoc, mensajes de error y textos de UI en español**, con acentos y `ñ` correctos (los archivos son UTF-8: `á`, `é`, `í`, `ó`, `ú`, `ñ`).
- **Los mensajes de error son parte de la interfaz.** Nunca expongas un mensaje técnico: usa `ErrorDominio` con su `codigo` y `mensajeAmigable(error)` para traducir cualquier fallo.
  ```ts
  // Bien: mensaje redactado para la persona que estudia
  throw new ValidacionError('El nivel debe ser un entero entre 1 y 10 (recibido: 11).', 'nivel');
  ```
- **El runasimi se escribe con respeto ortográfico.** `TerminoQuechua` normaliza apóstrofos tipográficos pero **nunca elimina la `ñ`** ni la diéresis: son letras propias de la lengua, no adornos.
- **Sólo se traducen los términos técnicos universales** (Dado/Cuando/Entonces, `use-case`, `port`, `adapter` en comentarios cuando son el nombre del patrón). El vocabulario del negocio va siempre en español.

---

## 2. Nomenclatura

| Elemento | Convención | Ejemplos reales |
| --- | --- | --- |
| Clases, interfaces, tipos, enums | `PascalCase` en español | `Palabra`, `NivelId`, `PoliticaXP`, `GeneradorEvaluacion`, `BorradorEvaluacionPort`, `SesionActual` |
| Métodos y funciones | `camelCase` en español, verbo primero | `crear`, `reconstruir`, `generar`, `calificar`, `marcarSincronizada`, `asegurarAccesoANivel`, `esAlcanzableDesde` |
| Propiedades y variables | `camelCase` en español | `nivelActual`, `rachaDias`, `palabrasAprendidas`, `opcionCorrecta` |
| Booleanos | Prefijo `es`/`tiene`/`puede`/`esta` | `esAprobado`, `esUltimo`, `tieneImagen`, `puedeAcceder`, `estaPendiente` |
| Constantes | `SCREAMING_SNAKE_CASE` en español | `UMBRAL`, `PREGUNTAS_OBJETIVO`, `XP_POR_APROBAR_NIVEL`, `NIVEL_MINIMO_PROPONER`, `APROBACIONES_REQUERIDAS` |
| Archivos | `PascalCase.ts` para la entidad/servicio que contienen — **un archivo, una responsabilidad** | `Palabra.ts`, `PoliticaAprobacion.ts`, `ProgresoEstudiante.ts` |
| Archivos de utilidades | `camelCase.ts` | `serializadorCsv.ts`, `clonar.ts`, `texto.ts`, `aleatorio.ts`, `ruta.ts` |
| Adaptadores de infraestructura | Sufijo por tecnología y por rol | `ProgresoMemoriaRepository`, `SesionLocalAdapter`, `RelojSistema`, `AleatorioMulberry32`, `GeneradorIdCrypto`, `ConectividadNavegador`, `DescargaCsvAdapter`, `SincronizacionNoopAdapter` |
| Puertos (interfaces) | Sufijo por capacidad, nunca `Impl` | `ProgresoRepository`, `CatalogoRepository`, `BorradorEvaluacionPort`, `ConectividadPort`, `RelojPort`, `AleatorioPort`, `GeneradorIdPort` |
| Casos de uso | Sufijo `UseCase`, verbo en infinitivo | `ObtenerMapaNivelesUseCase`, `MarcarPalabraUseCase`, `CalificarEvaluacionUseCase` |
| DTOs | Sufijo `Dto` | `PalabraDto`, `NivelDto`, `PreguntaDto`, `ResultadoEvaluacionDto`, `SesionDto` |
| Errores de dominio | Sufijo `Error`, con `codigo` tipado | `NivelBloqueadoError`, `ContenidoInsuficienteError`, `PermisoDenegadoError`, `ValidacionError`, `ConflictoEstadoError`, `NoEncontradoError` |
| Claves de almacenamiento | `yapu:<agregado>:vN`, versionadas | `yapu:sesion:v1` (`CLAVE_SESION`) |
| Archivos de prueba | `kebab-case.test.ts` / `kebab-case.spec.ts` | `progreso-estudiante.test.ts`, `reto-comunitario.test.ts`, `pwa-student-journey.spec.ts` |
| Eventos de UI | `on` + verbo en español | `handleCreateSentence` (legado) → preferir `alEnviarFormulario`, `alMarcarPalabra` |

---

## 3. Estructura hexagonal y reglas de dependencia

### 3.1 Dónde va cada cosa

```
src/
  domain/            TypeScript puro. Entidades con comportamiento, value objects,
                     políticas, servicios de dominio, errores tipados.
  application/       ports/ (interfaces) · use-cases/ · dto/ (DTOs planos)
  infrastructure/    persistence/ · catalog/ · system/ · sync/ · container.ts
  ui/                hooks/ · components/ (por feature) · design-system/ · lib/ruta.ts
  pages/ layouts/    Astro; montan componentes de ui/
```

### 3.2 Tabla de reglas (la que aplican las herramientas)

| Capa | Puede importar | Tiene prohibido |
| --- | --- | --- |
| `src/domain/**` | `domain/**`, `zod` | `application`, `infrastructure`, `ui`, `react`, `react-dom`, `astro` |
| `src/application/**` | `domain/**`, `application/**` | `infrastructure`, `ui`, `react`, `react-dom`, `astro` |
| `src/infrastructure/**` | `domain/**`, `application/**`, `infrastructure/**` | `ui`, `react`, `react-dom` |
| `src/ui/**` | `application/**`, `ui/**` | `domain/**` (directo), `infrastructure/**` |
| `src/pages/**`, `src/layouts/**` | componentes de `ui/**` | lógica de negocio y acceso a datos |

Prohibiciones de entorno: el **dominio** no puede usar `Math.random`, `Date.now()`, `new Date()`, `window`, `document`, `navigator`, `localStorage` ni `crypto`; la **aplicación** no puede usar `Math.random`, `localStorage` ni `window`.

### 3.3 Ejemplos de lo prohibido

```ts
// ❌ PROHIBIDO: el dominio importa React
// src/domain/aprendizaje/Palabra.ts
import React from 'react';

// ❌ PROHIBIDO: el dominio lee el entorno (RN-17, hallazgo A5)
const id = crypto.randomUUID();
const ahora = Date.now();
const semilla = Math.random();

// ❌ PROHIBIDO: el dominio importa una capa superior
import { container } from '@infrastructure/container';
import { useProgreso } from '@ui/hooks/useProgreso';

// ❌ PROHIBIDO: la aplicación conoce infraestructura
// src/application/use-cases/GenerarEvaluacionUseCase.ts
import { CatalogoMemoriaRepository } from '@infrastructure/persistence/memory';

// ❌ PROHIBIDO: la UI importa el dominio directamente
// src/ui/components/mapa/MapaNiveles.tsx
import { Nivel } from '@domain/aprendizaje/Nivel';

// ❌ PROHIBIDO: cualquier capa fuera de ui/hooks lee el contenedor
import { container } from '@infrastructure/container';
```

```ts
// ✅ CORRECTO: el dominio declara la necesidad como interfaz
// src/domain/shared/puertos.ts
export interface FuenteAleatoria { siguiente(): number; }
export interface GeneradorId { generar(): string; }
export interface Reloj { ahora(): Date; }

// ✅ CORRECTO: el servicio de dominio recibe sus dependencias por constructor
// src/domain/evaluacion/GeneradorEvaluacion.ts
export class GeneradorEvaluacion {
  constructor(
    private readonly palabras: readonly Palabra[],
    private readonly oraciones: readonly OracionBase[],
    private readonly aleatorio: FuenteAleatoria,
    private readonly generadorId: GeneradorId
  ) {}
}

// ✅ CORRECTO: la entidad se crea validando y se rehidrata reconstruyendo
static crear(datos: DatosPalabra): Palabra { /* valida invariantes */ }
static reconstruir(datos: DatosPalabra): Palabra { /* desde persistencia */ }
toJSON(): DatosPalabra { /* forma plana persistible */ }

// ✅ CORRECTO: la infraestructura mapea y la UI consume DTOs
// src/infrastructure/persistence/memory/ProgresoMemoriaRepository.ts
async obtener(estudianteId: string): Promise<ProgresoEstudiante | null> {
  const almacenado = this.datos.get(estudianteId);
  if (!almacenado) return null;
  return ProgresoEstudiante.reconstruir(clonar(almacenado));
}
```

### 3.4 Reglas de diseño que no son negociables

1. **Un repositorio por agregado.** No vuelvas a crear una clase que concentre el acceso a varios agregados (la clase `LocalRepository` es lo que el refactor vino a eliminar).
2. **`src/infrastructure/container.ts` es el único lugar con `new` de adaptadores**, y **sólo `src/ui/hooks/**` puede leerlo**. La UI recibe objetos que implementan puertos, nunca clases concretas.
3. **El umbral de aprobación existe una sola vez:** `PoliticaAprobacion.UMBRAL = 70`. Nunca escribas `70` en otro archivo (ni en un `Nivel`, ni en un DTO, ni en un componente).
4. **Los identificadores se generan con `GeneradorIdPort`.** Nunca `crypto.randomUUID()` ni `Date.now()` fuera de infraestructura.
5. **La fecha entra al dominio como `FechaDia`** (o como ISO), siempre por parámetro. `ProgresoEstudiante.registrarActividad(hoy)` nunca lee el reloj.
6. **Las entidades tienen comportamiento.** Prohibido el registro anémico con nombres de columna SQL (`umbral_minimo_aprobacion`, `palabra_clave_id`): eso es un mapper, y vive en infraestructura.
7. **La UI no recibe la opción correcta.** `PreguntaDto` no la incluye; el `BorradorEvaluacionPort` la custodia y la calificación se hace contra el borrador.
8. **Toda ruta se construye con `ruta()`** de `src/ui/lib/ruta.ts` (base `/Yapu`, ADR-004). Prohibido `href="/algo"` a mano.

---

## 4. Convención de commits

### 4.1 Formato

```
tipo(scope): mensaje en español

Qué y por qué (no cómo). Cita los IDs de requisito que cubre.

Refs: RN-09, RF-005
```

- **`tipo`** — uno de: `feat`, `fix`, `refactor`, `test`, `ci`, `docs`, `chore`, `build`.
- **`scope`** — el módulo o la capa afectada, en minúsculas y sin espacios: `domain`, `evaluacion`, `aprendizaje`, `contenido`, `application`, `infra`, `ui`, `pwa`, `ci`, `docs`, `deps`, `capas`.
- **`mensaje`** — en español, imperativo, en minúscula inicial, sin punto final, ≤ 72 caracteres.
- **Cuerpo** — explica **qué** cambia y **por qué**, no repite el diff. Es obligatorio cuando el commit toca reglas de negocio.
- **IDs** — cita `RN-xx`, `RF-xxx`, `RS-xxx`, `RNF-xxx` en el asunto o, preferentemente, en el cuerpo (`Refs: …`).

### 4.2 Tipos

| Tipo | Cuándo |
| --- | --- |
| `feat` | Funcionalidad nueva para quien usa la aplicación |
| `fix` | Corrección de un comportamiento incorrecto |
| `refactor` | Reestructuración **sin** cambiar el comportamiento observable |
| `test` | Añadir o modificar pruebas (incluye helpers y configuración de Vitest/Playwright) |
| `ci` | Workflows, jobs, cachés y puertas de calidad de GitHub Actions |
| `docs` | Documentación: ADR, README, checklists, comentarios de calado |
| `chore` | Tareas de mantenimiento sin impacto en el producto (configuración, `.gitignore`) |
| `build` | Compilación, bundling y dependencias (`package.json`, `tsconfig`, `astro.config.mjs`) |

### 4.3 Ejemplos correctos

```
feat(evaluacion): generar 10 preguntas con distractores por categoría

El generador prioriza pools del mismo nivel y categoría antes de caer al
vocabulario completo, de modo que los distractores sean plausibles y no
absurdos. La fuente aleatoria llega por constructor para que la evaluación
sea reproducible con una semilla.

Refs: RN-09, RN-10, RF-005
```

```
feat(aprendizaje): repartir los +100 XP de nivel sólo en la primera aprobación

`aprobacionNueva` lo decide PoliticaDesbloqueo; sin esa comprobación, repetir
una evaluación ya aprobada volvía a sumar los +100 XP del nivel.

Refs: RN-05, RN-02
```

```
fix(aprendizaje): corregir la racha cuando se practica a medianoche

La racha se medía en milisegundos, de modo que practicar a las 23:50 y volver
a las 00:10 no sumaba el día nuevo. Ahora se compara por días calendario
locales con FechaDia, tal como exige la regla.

Refs: RN-06
```

```
refactor(capas): sustituir LocalRepository por un repositorio por agregado

La clase concentraba el acceso a progreso, evaluaciones, oraciones, retos y
catálogo. Ahora cada agregado tiene su puerto y sus adaptadores, de modo que
memoria y localStorage compartan la misma suite de contrato.

Refs: RNF-005
```

```
ci(e2e): publicar un JUnit por suite para no perder evidencias

`PLAYWRIGHT_JUNIT_OUTPUT_NAME` separa flujos, a11y y ux; sin ello, la última
suite sobrescribía el reporte de las anteriores y la matriz de trazabilidad
quedaba incompleta.

Refs: RNF-002, RNF-005
```

```
test(contenido): cubrir la doble moderación de retos comunitarios

Refs: RN-13, RF-007
```

### 4.4 Ejemplos incorrectos

| Mal | Por qué |
| --- | --- |
| `update files` | Sin tipo, sin scope, sin intención |
| `feat: Added new feature.` | En inglés, en pasado, con punto final, sin scope |
| `fix(evaluacion): arreglar bug` | No dice qué bug ni cita el requisito |
| `wip` | No es un tipo válido y no describe nada |
| `feat: cambiar umbral a 80` | Cambia una regla de negocio sin citar RN-04 ni explicar el porqué |
| `refactor: reescribir todo el proyecto` | Un commit debe tener un propósito revisable |

### 4.5 Ramas

| Rama | Uso |
| --- | --- |
| `main` | Producción y **única rama que se despliega** en GitHub Pages (ADR-004) |
| `dev` | Integración de desarrollo |
| `refactor/hexagonal` | Rama del refactor a arquitectura hexagonal |
| `feat/<scope>-<descripcion>` · `fix/<scope>-<descripcion>` | Ramas de trabajo |

El CI se dispara en `push` a `main`, `dev` y `refactor/**`, y en `pull_request` a `main` y `dev`.

---

## 5. Convención de tests

### 5.1 Nombres: el requisito va entre corchetes

- El `describe` cita el requisito: `describe('[RF-005] Generar evaluación', …)`.
- Cada `it` cita la regla que verifica: `it('[RN-09] las cuatro opciones de una pregunta son únicas', …)`.
- Los corchetes son **obligatorios**: `scripts/generar-matriz-trazabilidad.mjs` los extrae de los JUnit para construir la matriz de trazabilidad. Un test sin etiqueta es invisible para la trazabilidad.
- Etiquetas válidas: `[RF-xxx]`, `[RNF-xxx]`, `[RS-xxx]`, `[RN-xx]` y las de UX `[UX-JAKOB]`, `[UX-HICK]`, `[UX-FITTS]`, `[UX-MILLER]`, `[UX-APOGEO]`, `[UX-ESTETICA]`.
- Nombres de `it` en español, descriptivos y en tercera persona del singular.

### 5.2 Estilo Dado / Cuando / Entonces, con comentarios

```ts
describe('[RN-01] Acceso a los niveles del curso', () => {
  it('[RN-01] un nivel superior al actual está bloqueado', () => {
    // Dado un estudiante cuyo nivel actual es 3
    const nivelActual = NivelId.crear(3);
    const solicitado = NivelId.crear(7);

    // Cuando se comprueba si puede acceder
    const puede = PoliticaDesbloqueo.puedeAcceder(nivelActual, solicitado);

    // Entonces el acceso queda denegado
    expect(puede).toBe(false);
  });
});
```

- Los comentarios `// Dado`, `// Cuando`, `// Entonces` **se escriben literalmente** (también `// Y`). No son decoración: obligan a que la prueba tenga un escenario, una acción y una expectativa.
- **Un comportamiento por `it`.** Si el nombre necesita un «y», probablemente son dos pruebas.

### 5.3 Determinismo: inyecta el reloj, la aleatoriedad y los ids

```ts
import { RelojFijo, AleatorioFijo, GeneradorIdSecuencial } from '../../helpers';

const reloj = new RelojFijo('2026-03-15T09:00:00.000Z');
const aleatorio = new AleatorioFijo(20260315);   // misma semilla = misma secuencia
const ids = new GeneradorIdSecuencial('pregunta'); // pregunta-1, pregunta-2, …
```

Prohibido en pruebas: `Math.random()`, `new Date()`, `Date.now()`, depender del huso horario o del orden de iteración de un `Record`.

### 5.4 Dónde va cada prueba

| Suite | Ubicación | Qué prueba | Herramientas |
| --- | --- | --- | --- |
| Unitaria | `tests/unit/**` | Dominio puro y adaptadores de sistema, sin navegador | Vitest |
| Contrato | `tests/contract/**` | **La misma suite** contra repositorios de memoria y de `localStorage` | Vitest + jsdom |
| Componente | `tests/component/**` | Componentes de `src/ui` | `@testing-library/react` |
| Regresión | `tests/regression/**` | Flujos críticos que no deben romperse | Vitest |
| E2E | `tests/e2e/flujos`, `tests/e2e/a11y`, `tests/e2e/ux` | Flujos, accesibilidad y leyes UX en Desktop Chrome y Pixel 5 | Playwright |

**Regla de la suite de contrato:** un adaptador nuevo no está terminado hasta que pasa el contrato existente. No dupliques la suite: hazla correr contra el adaptador nuevo.

### 5.5 Pruebas de arquitectura

Al tocar las reglas de capas hay que actualizar **las tres** barreras y ejecutarlas:

1. `eslint.config.js` — `no-restricted-imports` por carpeta, con el mensaje en español;
2. `scripts/verificar-capas.mjs` — matrices `PROHIBIDAS` y `ENTORNO_PROHIBIDO` (y sus violaciones sintéticas de auto-test);
3. `tests/unit/arquitectura/capas.test.ts` — `[RNF-005]`.

---

## 6. Design system y tokens

### 6.1 Antes de escribir un componente

1. **¿Existe ya un primitivo en `src/ui/design-system/`?** Si no existe, se crea ahí, no dentro de una feature.
2. **¿El componente pertenece a una feature?** Va en `src/ui/components/<feature>/` (`mapa`, `leccion`, `evaluacion`, `tablero`, `comunidad`, `docente`).
3. **¿Necesita datos?** El acceso pasa por `src/ui/hooks/**`; el componente recibe DTOs por props y no conoce puertos ni adaptadores.
4. **¿Escribe un enlace?** Usa `ruta()` de `src/ui/lib/ruta.ts`.

### 6.2 Tokens tipográficos (obligatorios)

En `tailwind.config.mjs` existen **exactamente cuatro** tamaños. Usa sólo estos:

| Token | Valor | Uso |
| --- | --- | --- |
| `text-caption` | 0.75 rem | Etiquetas, ayudas, metadatos |
| `text-body` | 0.9375 rem | Texto corriente |
| `text-title` | 1.25 rem | Títulos de sección |
| `text-display` | 2 rem | Titular de pantalla |

**Prohibido** usar `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl` ni valores arbitrarios (`text-[11px]`): rompen la medición automática de `[UX-ESTETICA]` (≤ 3 tamaños + caption por pantalla).

### 6.3 Tokens táctiles y de espaciado (Ley de Fitts)

| Token | Valor | Uso |
| --- | --- | --- |
| `min-h-tactil` · `min-w-tactil` | 2.75 rem (**44 px**) | Objetivo táctil mínimo en móvil |
| `min-h-tactil-escritorio` · `min-w-tactil-escritorio` | 1.5 rem (**24 px**) | Objetivo mínimo en escritorio |
| `spacing.toque` | 2.75 rem | Área de toque completa |
| `spacing['separacion-objetivos']` | 0.5 rem (**≥ 8 px**) | Separación mínima entre objetivos contiguos |

Prohibido fijar tamaños con literales (`min-h-[44px]`, `min-h-[48px]`): usa los tokens.

### 6.4 Paleta andina

Usa los colores de `theme.extend.colors.andina`: `andina-terracotta` (`#B94700`), `andina-gold` (`#F59E0B`), `andina-aguayo` (`#0D9488`), `andina-night` (`#0B0F19`) y `andina-sand` (`#FDFBF7`), con sus variantes. Evita colores arbitrarios sueltos.

---

## 7. Las 6 leyes UX y umbrales táctiles

Toda interfaz nueva o modificada debe cumplir, como mínimo:

| Ley | Umbral exigido |
| --- | --- |
| **Jakob** | Patrones convencionales: **navegación inferior en móvil y superior en escritorio**; la pestaña Docente sólo se muestra con rol docente |
| **Hick** | **≤ 7 opciones primarias** por pantalla y **exactamente 1 CTA** marcado con `data-cta="primario"` |
| **Fitts** | Objetivos **≥ 44 × 44 px en móvil** y **≥ 24 × 24 px en escritorio**, con separación **≥ 8 px** |
| **Miller** | Tramos **1–3 / 4–7 / 8–10**; ningún grupo de decisión supera 7 elementos |
| **Apogeo-Final** | Clímax en la aprobación y **próximo paso claro** al reprobar (por ejemplo, el CTA *«Repasar las N palabras falladas»* vía `rutaLeccion(nivel, palabrasFalladas)`) |
| **Estética-Usabilidad** | **≤ 3 tamaños tipográficos + caption** por pantalla, espaciado múltiplo de 4 y paleta tokenizada |

Reglas adicionales:

- **Animaciones decorativas**: el confeti y cualquier animación deben desactivarse con `prefers-reduced-motion`. Consulta `window.matchMedia('(prefers-reduced-motion: reduce)')` antes de disparar `canvas-confetti`.
- **Accesibilidad**: todo control interactivo tiene nombre accesible (texto o `aria-label`), el foco es visible y el contraste cumple WCAG 2.1 AA.
- **La validación de negocio no vive en la UI.** Ocultar un botón por permisos es usabilidad; la regla que impide la acción está en el dominio (`PermisoDenegadoError`, RN-12/RN-13).
- Checklist pantalla por pantalla con la evidencia de cada ley: `Docs/arquitectura/checklist-leyes-ux.md`.

---

## 8. Checklist antes de commitear

Ejecuta, en este orden, y **no commitees si algo falla**:

```bash
npm run lint        # eslint --max-warnings 0 + tsc --noEmit + astro check
npm run test        # vitest: unit + contrato + componente
npm run build       # astro build + generación del Service Worker
```

Comprobaciones adicionales según lo que hayas tocado:

| Si tocaste… | Ejecuta además |
| --- | --- |
| Reglas de dependencia, imports entre capas, `src/domain` | `npm run lint:capas` |
| Rutas, `astro.config.mjs`, `manifest.json`, Service Worker, enlaces | `npm run build` **y** `npm run verificar:paginas` |
| Pantallas, componentes o tokens de UI | `npm run build && npm run test:e2e:ux` y revisa `Docs/arquitectura/checklist-leyes-ux.md` |
| Accesibilidad (roles, etiquetas, contraste) | `npm run test:a11y` |
| Etiquetas de requisitos en pruebas | `npm run reports:trazabilidad` y revisa `Docs/testing/matriz-trazabilidad.md` |
| `package.json` | Comprueba que el script nuevo exista y que el CI lo pueda invocar |

Y antes de dar por bueno el cambio, verifica a mano:

- [ ] Los identificadores nuevos están **en español** y los tipos no usan `any` implícito.
- [ ] Ningún archivo de `domain` o `application` importa una capa superior ni toca el entorno.
- [ ] No has escrito `70` fuera de `PoliticaAprobacion`, ni `crypto.randomUUID()` fuera de infraestructura, ni `href="/..."` a mano.
- [ ] Los `describe`/`it` nuevos citan su requisito entre corchetes y usan Dado/Cuando/Entonces.
- [ ] Los componentes nuevos usan los tokens (`text-caption`/`text-body`/`text-title`/`text-display`, `min-h-tactil`, `separacion-objetivos`) y hay como máximo un `data-cta="primario"` por pantalla.
- [ ] No has modificado `Docs/**` existente (PDF/DOCX/PPTX y documentos del SRS son entregables académicos inmutables).
- [ ] El mensaje de commit sigue `tipo(scope): mensaje en español` y cita los IDs `RN-xx`/`RF-xxx` que correspondan.

---

## 9. Referencias

- [ADR-001 — Arquitectura hexagonal](../../../Docs/arquitectura/ADR-001-arquitectura-hexagonal.md) *(ruta relativa a la raíz del repositorio)*
- `Docs/arquitectura/diagrama-de-capas.md` · `Docs/arquitectura/checklist-leyes-ux.md`
- `Docs/arquitectura/ADR-002-persistencia-local-y-sincronizacion.md` · `ADR-003-autenticacion-simulada.md` · `ADR-004-despliegue-github-pages.md`
- `eslint.config.js` · `scripts/verificar-capas.mjs` · `tests/unit/arquitectura/capas.test.ts`
- `tailwind.config.mjs` (tokens) · `vitest.config.ts` (pirámide y umbrales) · `playwright.config.ts` (viewports)
- `README.md` — portada del proyecto, scripts, puertos, casos de uso y límites conocidos
