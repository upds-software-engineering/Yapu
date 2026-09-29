# ADR-001 — Arquitectura hexagonal (puertos y adaptadores) para YAPU

- **Estado:** Aceptado
- **Fecha:** 2026-09-29
- **Ámbito:** estructura completa de `src/`, reglas de dependencia y *composition root*
- **Requisitos relacionados:** RNF-005 (mantenibilidad), RNF-007 (tolerancia a fallos), RN-17 (identificadores y tiempo inyectables), hallazgo A5 (aleatoriedad dispersa), hallazgo A6 (repositorios por agregado)

---

## 1. Contexto

Antes del refactor, `src/` mezclaba capas sin ninguna frontera verificable:

- `src/lib/storage/local-repository.ts` era una **clase Dios**: un único `LocalRepository` concentraba el acceso a `localStorage` de progreso, evaluaciones, oraciones, retos y catálogo. Cualquier cambio en una consulta obligaba a tocar el mismo archivo que servía a cinco funcionalidades distintas (hallazgo A6).
- `src/lib/ai/deterministic-engine.ts` generaba y calificaba evaluaciones llamando a `Math.random()` directamente (hallazgo A5): la misma evaluación **no era reproducible**, y los tests sólo podían comprobar propiedades estadísticas (`>= 5` opciones, `length === 10`), nunca un resultado exacto.
- Las entidades eran **registros anémicos** con nombres de columna SQL (`umbral_minimo_aprobacion`, `palabra_clave_id`): la regla de negocio del umbral de aprobación estaba repetida en cada registro del corpus semilla.
- El umbral `70` aparecía duplicado en el motor, en la UI y en los datos sembrados: tres fuentes de verdad para una sola regla del negocio (RN-04).
- El dominio leía el entorno: `Date.now()` y `new Date()` dentro de la lógica de negocio hacían que rachas (RN-06) e identificadores (RN-17) dependieran del reloj real de la máquina.
- Nada impedía que un archivo de dominio importara React, o que un componente accediera a `localStorage` sin pasar por ninguna abstracción. No existía forma automática de detectarlo: la única barrera era la disciplina del equipo.

El sistema sigue siendo una PWA **estática** (`output: 'static'` en `astro.config.mjs`), sin servidor propio: todo el cálculo ocurre en el navegador. Eso hace doblemente importante separar el *qué* (reglas del curso A1) del *cómo* (localStorage, WebCrypto, `navigator.onLine`, `window`).

## 2. Decisión

Se adopta **arquitectura hexagonal (puertos y adaptadores)** con **cuatro capas** dentro de `src/` y reglas de dependencia **unidireccionales y enforzadas automáticamente**.

### 2.1 Capas y reglas de dependencia

| Capa | Ruta | Puede importar | Tiene prohibido |
| --- | --- | --- | --- |
| Dominio | `src/domain/**` | `domain/**` y `zod` | `application`, `infrastructure`, `ui`, `react`, `react-dom`, `astro` |
| Aplicación | `src/application/**` | `domain/**`, `application/**` | `infrastructure`, `ui`, `react`, `react-dom`, `astro` |
| Infraestructura | `src/infrastructure/**` | `domain/**`, `application/**`, `infrastructure/**` | `ui`, `react`, `react-dom` |
| Interfaz | `src/ui/**` | `application/**`, `ui/**` | `domain/**` (directo), `infrastructure/**` |
| Composición Astro | `src/pages/**`, `src/layouts/**` | componentes de `ui/**` y `layouts/**` | lógica de negocio y acceso a datos |

Además, el dominio es **agnóstico del entorno**: tiene prohibido `window`, `document`, `navigator`, `localStorage`, `crypto`, `Math.random`, `Date.now()` y `new Date()`. La capa de aplicación también tiene prohibido `Math.random`, `localStorage` y `window`.

### 2.2 Separación por intención

- El **dominio** contiene entidades **con comportamiento** (`Palabra`, `Nivel`, `ProgresoEstudiante`, `Pregunta`, `Evaluacion`, `OracionBase`, `RetoComunitario`), objetos de valor (`NivelId`, `Puntuacion`, `Porcentaje`, `FechaDia`, `TerminoQuechua`), políticas puras (`PoliticaAprobacion`, `PoliticaDesbloqueo`, `PoliticaRacha`, `PoliticaXP`), servicios de dominio (`GeneradorEvaluacion`, `Calificador`) y errores tipados (`src/domain/errores.ts`).
- La **aplicación** declara los puertos en `src/application/ports/` y expone DTOs planos en `src/application/dto/`. La UI sólo conoce DTOs.
- La **infraestructura** implementa los puertos y contiene el **mapeo** entre el mundo externo y el dominio. Aquí viven `localStorage`, `crypto`, el reloj real, `navigator.onLine`, `Blob`/`URL.createObjectURL` y la serialización CSV.
- La **UI** consume casos de uso y DTOs a través de *hooks*.

### 2.3 Un repositorio por agregado (elimina la clase Dios)

`LocalRepository` desaparece. Cada agregado raíz tiene su propio puerto y sus propios adaptadores:

| Agregado raíz | Puerto | Adaptadores |
| --- | --- | --- |
| Progreso del estudiante | `ProgresoRepository` | `ProgresoMemoriaRepository`; adaptador de `localStorage` (previsto, ver ADR-002) |
| Evaluación rendida (historial + cola offline) | `EvaluacionRepository` | `EvaluacionMemoriaRepository`; adaptador de `localStorage` (previsto) |
| Catálogo lingüístico (solo lectura) | `CatalogoRepository` | `CatalogoMemoriaRepository`; adaptador del corpus sembrado (previsto) |
| Oración base | `OracionRepository` | `OracionMemoriaRepository` |
| Reto comunitario | `RetoRepository` | `RetoMemoriaRepository` |

### 2.4 Entidades con comportamiento y mappers en infraestructura

Cada entidad expone `crear`/`registrar` (alta validada) y `reconstruir` (rehidratación desde persistencia), más `toJSON()` para la forma plana persistible. Ejemplos verificables:

- `Palabra.crear(datos)` valida identificador y traducción y delega el término en `TerminoQuechua.crear`.
- `Pregunta.crear(datos)` exige exactamente 4 opciones únicas y una sola coincidencia con la correcta (RN-09).
- `OracionBase.crear(datos, palabraClave)` valida RN-11 y RN-12 en el constructor y es el único camino de alta.
- `RetoComunitario.moderar({...})` resuelve el estado del agregado; la bitácora sólo muta por ese método.
- `ProgresoEstudiante.reconstruir(datos)` sanea contadores y filtra niveles fuera de rango.

El mapeo desde/hacia el formato de almacenamiento (nombres de columnas, versiones de esquema, migraciones) es responsabilidad exclusiva de `src/infrastructure/persistence/**`, nunca de la entidad.

### 2.5 Aleatoriedad y reloj inyectables

Las tres dependencias técnicas que atraviesan el cálculo de negocio se declaran como interfaces mínimas en `src/domain/shared/puertos.ts` y se reexportan con el sufijo `Port` desde `src/application/ports/index.ts`:

```ts
// src/domain/shared/puertos.ts
export interface Reloj { ahora(): Date; }
export interface FuenteAleatoria { siguiente(): number; } // valores en [0, 1)
export interface GeneradorId { generar(): string; }
```

```ts
// src/application/ports/index.ts
export type { Reloj as RelojPort, FuenteAleatoria as AleatorioPort, GeneradorId as GeneradorIdPort }
  from '@domain/shared/puertos';
```

- `GeneradorEvaluacion` recibe `FuenteAleatoria` y `GeneradorId` **por constructor**, no los busca en un contenedor global.
- `ProgresoEstudiante.registrarActividad(hoy: FechaDia)` recibe el día por parámetro; nunca lo lee del sistema.
- `Evaluacion` recibe `fechaIso` en `registrar(...)`; su `dia` se deriva de ese ISO.

Adaptadores de producción y dobles de prueba:

| Puerto | Producción (`src/infrastructure/system/`) | Prueba (`tests/helpers/`) |
| --- | --- | --- |
| `RelojPort` | `RelojSistema` | `RelojFijo` (con `avanzarDias`, `avanzarHoras`) |
| `AleatorioPort` | `AleatorioMulberry32` (PRNG sembrable) | `AleatorioFijo` (mismo algoritmo), `AleatorioGuionado` |
| `GeneradorIdPort` | `GeneradorIdCrypto` | `GeneradorIdSecuencial` (`prefijo-1`, `prefijo-2`, …) |

`AleatorioMulberry32` y `AleatorioFijo` comparten a propósito el mismo algoritmo mulberry32 para que una prueba pueda demostrar que producción y doble reproducen **la misma secuencia** con la misma semilla (helper `mismaSecuencia`).

### 2.6 Identificadores con `GeneradorIdPort`

`GeneradorIdCrypto` usa `crypto.randomUUID()` con una cascada que **nunca lanza**: (1) `randomUUID()`, (2) UUID v4 construido con `getRandomValues`, (3) respaldo determinista con marca de tiempo y contador monotónico con formato UUID. Un fallo al generar un identificador no puede romper un flujo de estudio sin conexión.

### 2.7 Umbral de aprobación como constante única

```ts
// src/domain/evaluacion/PoliticaAprobacion.ts
export class PoliticaAprobacion {
  static readonly UMBRAL = 70;                     // RN-04: fuente única
  static esAprobado(puntuacion: Puntuacion | number): boolean { /* >= UMBRAL */ }
  static get umbral(): number { return PoliticaAprobacion.UMBRAL; }
  static mensajeResultado(aprobado: boolean, puntuacion: number): string { /* texto en español */ }
}
```

`Puntuacion` **no** conoce el umbral; `Nivel` **no** guarda `umbral_minimo_aprobacion`; la UI pregunta a la política (`umbralAprobacion` en los DTO de evaluación) en lugar de repetir el número.

### 2.8 Composition root

`src/infrastructure/container.ts` es el **único** lugar donde se construyen adaptadores concretos con `new`. La UI no instancia adaptadores: los *hooks* de `src/ui/hooks/**` piden el contenedor y trabajan siempre contra las interfaces de los puertos.

> **Estado de verificación:** `src/infrastructure/container.ts`, `src/ui/hooks/**`, `src/application/use-cases/**` y `src/infrastructure/persistence/local-storage/**` forman parte de la estructura objetivo y **aún no existen** en el árbol verificado (ver "Consecuencias" y el apartado de pendientes del *checklist* de UX).

### 2.9 Enforzamiento automático

La arquitectura no se sostiene con buena voluntad: se comprueba en dos lugares independientes.

**(a) ESLint `no-restricted-imports` por carpeta** (`eslint.config.js`). Cada bloque de configuración declara los patrones prohibidos *con su propio mensaje en español*, `no-restricted-syntax` bloquea `Math.random`, `Date.now`, `new Date()`, `window`, `localStorage`, `document`, `navigator` y `crypto` en el dominio, y `no-restricted-globals` añade `window` y `localStorage`.

**(b) `scripts/verificar-capas.mjs`** — se ejecuta con `npm run lint:capas` y en el job `quality` del CI. Recorre `src/**`, aplica las mismas matrices de prohibición y, sobre todo, **se auto-testea**:

```js
// scripts/verificar-capas.mjs (extracto)
const sinteticas = detectarViolaciones([
  { ruta: 'src/domain/aprendizaje/EjemploInvalido.ts', codigo: "import React from 'react';\nconst x = Math.random();" },
  { ruta: 'src/ui/EjemploInvalido.tsx', codigo: "import { Nivel } from '@domain/aprendizaje/Nivel';" },
  { ruta: 'src/application/EjemploInvalido.ts', codigo: "import { repo } from '@infrastructure/persistence/memory';" }
]);

if (sinteticas.length < 3) {
  console.error('[capas] El detector no está funcionando: sólo detectó ...');
  process.exit(1);   // falla en vez de dar un falso verde
}
```

**(c) `tests/unit/arquitectura/capas.test.ts`** — `[RNF-005]` replica el mismo detector desde Vitest con tres casos: el detector SÍ marca una importación prohibida, marca también UI→dominio y aplicación→infraestructura, y **el código real de `src/**` no tiene ninguna violación** (con `expect(archivos.length).toBeGreaterThan(20)` para que el test no pase por vacío).

### 2.10 Alias de importación

`tsconfig.json` y `vitest.config.ts` declaran los mismos alias, de modo que el código y las pruebas hablan el mismo idioma:

| Alias | Destino |
| --- | --- |
| `@/*` | `src/*` |
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@ui/*` | `src/ui/*` |

El detector de capas reconoce tanto el alias (`@domain/...`) como la ruta relativa (`../../domain/...`), así que no hay forma de esquivarlo escribiendo rutas a mano.

## 3. Justificación

1. **Testabilidad sin navegador.** Al inyectar `RelojPort`, `AleatorioPort` y `GeneradorIdPort`, el dominio se prueba con `RelojFijo` y `AleatorioFijo` en un entorno Node puro. Sin esta inversión, cada test de RN-06 (racha) sería dependiente del huso horario de la máquina de CI.
2. **Reproducibilidad del motor de evaluación.** Con la misma semilla, `GeneradorEvaluacion` produce la misma evaluación. Esto convierte una prueba estadística en una prueba determinista y permite registrar la semilla de una partida concreta (`AleatorioMulberry32.semilla`).
3. **Un cambio, un lugar.** El umbral (RN-04), los precios de XP (RN-05) y las reglas de desbloqueo (RN-01/RN-02/RN-03) existen una sola vez. Antes el mismo número vivía en el seed, en el motor y en la UI.
4. **Sustituibilidad de la persistencia.** Cambiar `localStorage` por IndexedDB, por SQLite o por una API HTTP es escribir un adaptador nuevo: ni el dominio ni los casos de uso cambian (es exactamente lo que ya ocurre entre los repositorios de memoria y los de almacenamiento local, ver ADR-002).
5. **Fronteras verificables, no aspiracionales.** El enforzamiento doble (ESLint + script de capas con auto-test + test de Vitest) convierte "no importes React en el dominio" en un fallo de CI. Sin el auto-test, un detector roto daría un verde falso y la arquitectura se degradaría en silencio.
6. **SSR seguro.** Al no tocar `window` ni `localStorage` fuera de infraestructura, el dominio y la aplicación se pueden ejecutar durante el render estático de Astro sin guardas `typeof window !== 'undefined'` desperdigadas.

## 4. Consecuencias

### Positivas

- El núcleo (`src/domain/**`) tiene cobertura exigida al **90 %** en líneas, ramas, funciones y sentencias; el umbral global (incluida infraestructura) es del **80 %** (`vitest.config.ts`).
- La pirámide de pruebas tiene tres niveles con contratos compartidos: `tests/unit` (dominio puro y casos de uso), `tests/contract` (la misma suite contra repositorios de memoria y de `localStorage`) y `tests/component` (`@testing-library/react` sobre `src/ui`).
- Un adaptador nuevo no obliga a tocar casos de uso: los puertos ya fijan el contrato (`SincronizacionRemotaPort`, `SesionPort`, `ExportacionCorpusDto`).
- Los errores de dominio son tipados y hablan al usuario: `ErrorDominio` expone `codigo` y `mensajeAmigable(error)` traduce cualquier fallo a español, de modo que la UI nunca muestra un mensaje técnico.

### Costes y límites asumidos

- **Más archivos y más indirección.** Un caso de uso atraviesa DTO → puerto → adaptador. Es el precio de la sustituibilidad.
- **Riesgo de sobre-ingeniería inversa:** se acepta que el dominio crezca con políticas puras en lugar de meter lógica en la UI "porque es más rápido".
- **Reglas duplicadas a propósito.** Las matrices de `eslint.config.js`, `scripts/verificar-capas.mjs` y `tests/unit/arquitectura/capas.test.ts` describen lo mismo tres veces. Es intencional (defensa en profundidad), pero cualquier cambio de política debe aplicarse en las tres.
- **Regla de la UI para acceder a infraestructura.** La decisión es que **sólo `src/ui/hooks/**`** puede importar `src/infrastructure/container.ts`. En el `eslint.config.js` verificado, el bloque de `src/ui/hooks/**` restringe `@domain`, `@domain/*`, `**/domain/**` y `**/infrastructure/**`; para materializar la regla tal como se decidió, ese bloque debe **exceptuar explícitamente** `container.ts`. Queda marcado como pendiente de verificación humana (ver *Pendiente de verificación por el revisor* del checklist de UX).
- **Deuda viva:** conviven el árbol hexagonal nuevo (`src/domain`, `src/application`, `src/infrastructure`) con el legado (`src/components`, `src/core`, `src/data`, `src/lib`, `src/types`). Mientras exista `src/lib/storage/local-repository.ts`, la clase Dios no está eliminada del repositorio, sólo sustituida por los puertos nuevos.

## 5. Alternativas consideradas

| Alternativa | Por qué se descartó |
| --- | --- |
| **Mantener el monolito por capas técnicas** (`components`, `lib`, `data`) sin puertos | Es el estado previo: `LocalRepository` seguiría siendo el punto único de acoplamiento y no habría forma automática de verificar fronteras. |
| **MVC / "carpetas por tipo"** (controllers, services, models) | No expresa la dirección de las dependencias ni permite invertirlas; el dominio seguiría conociendo el entorno. |
| **Clean Architecture completa con 5+ anillos y entidades de frontera** | Coste desproporcionado para una PWA estática sin backend. Cuatro capas cubren el mismo riesgo con menos ceremonia. |
| **Contenedor de inyección de dependencias con decoradores** (`tsyringe`, `InversifyJS`) | Añade dependencias y exige `reflect-metadata`; el árbol de objetos de YAPU es pequeño y un *composition root* explícito es suficiente y más legible. |
| **Inyectar `Math.random` y `Date` directamente como parámetros** en cada servicio | Contamina las firmas con tipos de la plataforma y no permite nombrar la intención (`Reloj`, `FuenteAleatoria`, `GeneradorId`). |
| **Verificar las capas sólo con ESLint** | ESLint no cubre archivos `.astro` ni rutas que se le escapen por configuración, y un `eslint-disable` puntual desactivaría la frontera sin dejar rastro. El script con auto-test y el test `[RNF-005]` cierran ese hueco. |
| **Un único repositorio genérico con genéricos** (`Repository<T>`) en vez de un puerto por agregado | Un repositorio genérico no puede expresar consultas del negocio como `listarPendientes()` (cola offline, RN-15) o `listarAprobadasPorNivel()` (RN-12), y vuelve a concentrar el acceso a datos en un solo punto. |

## 6. Estado

**Aceptado e implementado en el núcleo; en curso en los bordes.**

| Elemento | Estado verificado |
| --- | --- |
| `src/domain/**` (entidades, VO, políticas, servicios, errores) | Implementado |
| `src/application/ports/**` (13 puertos) | Implementado |
| `src/application/dto/**` | Implementado |
| `src/infrastructure/persistence/memory/**` | Implementado |
| `src/infrastructure/system/**` (reloj, aleatorio, ids, conectividad, sesión, CSV) | Implementado |
| `src/infrastructure/sync/SincronizacionNoopAdapter.ts` | Implementado |
| `src/ui/lib/ruta.ts` | Implementado |
| `src/application/use-cases/**` | **Pendiente** (directorio aún vacío en el árbol verificado) |
| `src/infrastructure/persistence/local-storage/**` | **Pendiente** |
| `src/infrastructure/catalog/**` | **Pendiente** |
| `src/infrastructure/container.ts` (*composition root*) | **Pendiente** |
| `src/ui/hooks/**`, `src/ui/components/**`, `src/ui/design-system/**` | **Pendiente** |
| Retirada del legado (`src/components`, `src/core`, `src/data`, `src/lib`, `src/types`) | **Pendiente** |

## 7. Referencias internas

- [`Docs/arquitectura/diagrama-de-capas.md`](diagrama-de-capas.md) — diagramas Mermaid de capas, dependencias y flujo de una petición.
- [`Docs/arquitectura/ADR-002-persistencia-local-y-sincronizacion.md`](ADR-002-persistencia-local-y-sincronizacion.md)
- [`Docs/arquitectura/ADR-003-autenticacion-simulada.md`](ADR-003-autenticacion-simulada.md)
- [`Docs/arquitectura/ADR-004-despliegue-github-pages.md`](ADR-004-despliegue-github-pages.md)
- `eslint.config.js`, `scripts/verificar-capas.mjs`, `tests/unit/arquitectura/capas.test.ts`, `vitest.config.ts`, `tsconfig.json`
