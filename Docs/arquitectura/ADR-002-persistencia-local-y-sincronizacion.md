# ADR-002 — Persistencia local y sincronización de la cola offline

- **Estado:** Aceptado
- **Fecha:** 2026-09-29
- **Ámbito:** persistencia del progreso, del historial de evaluaciones, del contenido docente y de la cola offline
- **Requisitos relacionados:** RF-009 (modo offline y sincronización), RN-15 (cola FIFO idempotente), RN-17 (fecha inyectada), RNF-007 (tolerancia a fallos), RNF-004 (sin credenciales), hallazgo A6 (un repositorio por agregado)

---

## 1. Contexto

YAPU es una PWA **estática**, pensada para funcionar en teléfonos modestos y en zonas rurales con conectividad intermitente (RS-002, RNF-007). No hay servidor propio: el estado del estudiante vive en el navegador.

El estado previo tenía tres problemas concretos:

1. **Un solo punto de acceso.** `src/lib/storage/local-repository.ts` (clase `LocalRepository`) leía y escribía seis claves de `localStorage` para cinco funcionalidades distintas, con guardas `typeof window !== 'undefined'` repetidas en cada método:

   ```ts
   // src/lib/storage/local-repository.ts (estado previo)
   const STORAGE_KEYS = {
     PROFILE: 'yapu_student_profile',
     VOCAB_PROGRESS: 'yapu_vocab_progress',
     EVALUATIONS: 'yapu_evaluations_history',
     SYNC_QUEUE: 'yapu_offline_sync_queue',
     DOCENTE_SENTENCES: 'yapu_docente_sentences',
     COMMUNITY_CHALLENGES: 'yapu_community_challenges'
   };
   ```

   Las claves no tenían versión de esquema: cambiar la forma de un registro obligaba a escribir código defensivo disperso o a romper los datos de estudiantes reales.

2. **La respuesta correcta viajaba al cliente.** El historial completo de evaluaciones se guardaba en `localStorage`, incluyendo la opción correcta de cada pregunta. Cualquier persona con las herramientas de desarrollo del navegador podía leer las respuestas antes de calificar.

3. **La cola offline no terminaba nunca.** Existía una cola (`yapu_offline_sync_queue`) pero ningún adaptador que la vaciara: sin nube real, las evaluaciones quedaban encoladas indefinidamente y el contador de "pendientes" sólo crecía.

Además, los repositorios de prueba y el render en servidor de Astro necesitaban una implementación que **no** dependiera de `localStorage`, y no existía: los tests usaban mocks de `localStorage` en lugar de una implementación real del contrato.

## 2. Decisión

### 2.1 `localStorage` detrás de repositorios, nunca directo

Ninguna capa fuera de `src/infrastructure/persistence/local-storage/**` toca `localStorage`. La UI y los casos de uso hablan con las interfaces de `src/application/ports/`. ESLint refuerza esto: la capa de aplicación tiene prohibido el identificador `localStorage` (`no-restricted-syntax` en `eslint.config.js`), y `scripts/verificar-capas.mjs` lo comprueba también en el dominio y en la aplicación.

### 2.2 Versión de esquema y migración desde las claves antiguas `yapu_*`

Cada adaptador de almacenamiento usa **claves versionadas con el espacio de nombres `yapu:`** y un sufijo de versión, siguiendo el patrón ya implementado y verificable en `src/infrastructure/system/SesionLocalAdapter.ts`:

```ts
/** Clave de almacenamiento versionada: permite migrar el formato sin pisar datos antiguos. */
export const CLAVE_SESION = 'yapu:sesion:v1';
```

Al abrir la aplicación, el adaptador de migración:

1. busca las claves antiguas sin versión (`yapu_student_profile`, `yapu_vocab_progress`, `yapu_evaluations_history`, `yapu_offline_sync_queue`, `yapu_docente_sentences`, `yapu_community_challenges`);
2. las interpreta con un **mapeador** que traduce los nombres de columna SQL del esquema previo (`umbral_minimo_aprobacion`, `palabra_clave_id`) a los campos del dominio (`NivelId`, `PoliticaAprobacion.UMBRAL`, `palabraClaveId`);
3. escribe el resultado en las claves nuevas `yapu:<agregado>:vN`;
4. marca la migración como hecha para no repetirla, y **no borra** los datos antiguos de inmediato (permiten volver atrás si la migración falla).

La migración es **idempotente**: ejecutarla dos veces produce el mismo resultado porque el segundo intento encuentra la marca de migración y las claves nuevas ya escritas.

### 2.3 Repositorios en memoria para tests y SSR

Cada puerto de persistencia tiene un adaptador en memoria, implementado y verificable hoy en `src/infrastructure/persistence/memory/`:

| Puerto | Adaptador de memoria | Detalle |
| --- | --- | --- |
| `ProgresoRepository` | `ProgresoMemoriaRepository` | Guarda la representación serializada (`DatosProgreso`), igual que el adaptador de `localStorage`, para que la misma suite de contrato corra contra ambos |
| `EvaluacionRepository` | `EvaluacionMemoriaRepository` | `Map` que conserva el orden de inserción para que `listarPendientes()` respete el FIFO (RN-15) |
| `CatalogoRepository` | `CatalogoMemoriaRepository` | Reconstruye entidades al leer; nunca comparte referencias con el estado interno |
| `OracionRepository` | `OracionMemoriaRepository` | Se inicializa con un corpus existente y acumula lo que registra el docente |
| `RetoRepository` | `RetoMemoriaRepository` | Devuelve lo más nuevo primero (orden de creación descendente) |
| `BorradorEvaluacionPort` | `BorradorEvaluacionMemoria` | Ver 2.4 |

Los repositorios en memoria **clonan en profundidad al guardar y al leer** (`clonar.ts`, con `structuredClone` y respaldo a `JSON.parse(JSON.stringify(...))`). Así los tests y la UI trabajan con copias, exactamente como ocurriría con una base de datos real: mutar un agregado devuelto por el repositorio no corrompe el estado almacenado.

Esto habilita el segundo nivel de la pirámide: `tests/contract` ejecuta **la misma suite** contra los repositorios de memoria y contra los de `localStorage` (jsdom). Un adaptador nuevo sólo está terminado cuando pasa el contrato existente.

### 2.4 `BorradorEvaluacionPort` en memoria para no exponer la respuesta correcta

El borrador de la evaluación en curso contiene la opción correcta de cada pregunta y **a propósito no se persiste**: vive en memoria (`BorradorEvaluacionMemoria`) y no sobrevive a la sesión de examen.

```ts
// src/application/ports/BorradorEvaluacionPort.ts
export interface BorradorEvaluacion {
  nivelId: number;
  preguntas: readonly Pregunta[];   // incluye opcionCorrecta
  generadoEn: string;
}

export interface BorradorEvaluacionPort {
  guardar(borrador: BorradorEvaluacion): void;
  obtener(nivelId: number): BorradorEvaluacion | null;
  limpiar(nivelId: number): void;
}
```

El flujo es: `GenerarEvaluacionUseCase` guarda el borrador y devuelve a la UI un `PreguntaDto` **sin** `opcionCorrecta`; `CalificarEvaluacionUseCase` recupera las preguntas originales desde el borrador y **nunca** confía en los datos que vuelven del cliente. Si alguien manipulase el DOM, no conseguiría nada: la calificación se hace contra el borrador del servidor/cliente autoritativo, no contra lo enviado.

**Consecuencia asumida:** si el estudiante recarga la página a mitad del examen, el borrador se pierde y la evaluación se regenera desde cero. Se acepta a cambio de no guardar respuestas correctas en un almacenamiento legible por la persona examinada.

### 2.5 Sincronización con `SincronizacionRemotaPort` y `SincronizacionNoopAdapter`

```ts
// src/application/ports/SincronizacionRemotaPort.ts
export interface SincronizacionRemotaPort {
  /** Envía un lote en orden FIFO. Devuelve los ids efectivamente sincronizados. */
  sincronizar(evaluaciones: readonly Evaluacion[]): Promise<string[]>;
}
```

El adaptador de esta iteración es un **no-op real** (`src/infrastructure/sync/SincronizacionNoopAdapter.ts`): no hay red, pero el contrato es el de una nube de verdad.

```ts
export class SincronizacionNoopAdapter implements SincronizacionRemotaPort {
  async sincronizar(evaluaciones: readonly Evaluacion[]): Promise<string[]> {
    const sincronizadas: string[] = [];
    for (const evaluacion of evaluaciones) {
      evaluacion.marcarSincronizada();
      sincronizadas.push(evaluacion.id);
    }
    return sincronizadas;
  }
}
```

Qué consigue esto, exactamente:

- la cola **nunca queda encolada para siempre** (se vacía localmente);
- el comportamiento es **idempotente**: recibir la misma evaluación dos veces devuelve su id las dos veces y no produce efectos adicionales;
- sustituirlo por un adaptador HTTP no tocará los casos de uso, porque `SincronizarPendientesUseCase` dependerá de la interfaz, no de la clase.

### 2.6 Cola FIFO idempotente, al volver `online` y al iniciar la app

`EvaluacionRepository` es a la vez historial y cola:

```ts
// RN-15: toda evaluación se persiste con `sincronizada = false`
export interface EvaluacionRepository {
  guardar(evaluacion: Evaluacion): Promise<void>;
  obtener(id: string): Promise<Evaluacion | null>;
  listarPorEstudiante(estudianteId: string): Promise<Evaluacion[]>;
  listarPendientes(): Promise<Evaluacion[]>;   // en orden FIFO
  marcarSincronizada(id: string): Promise<void>;
}
```

`Evaluacion` nace con `sincronizada = false` en `Evaluacion.registrar(...)` (RN-15) y `marcarSincronizada()` es idempotente. La conectividad se abstrae con `ConectividadPort` (`estaEnLinea()` y `alRecuperarConexion(manejador)`), que en producción implementa `ConectividadNavegador` aislando `navigator.onLine` y el evento `online` de `window`.

`SincronizarPendientesUseCase` (previsto) se dispara en **dos** momentos:

1. **al iniciar la aplicación**, por si quedaron evaluaciones pendientes de una sesión anterior;
2. **al recuperar la conexión**, mediante la suscripción de `ConectividadPort.alRecuperarConexion`.

En ambos casos: lee `listarPendientes()` (FIFO), llama a `SincronizacionRemotaPort.sincronizar(lote)`, y marca como sincronizadas **sólo los ids que el adaptador confirmó**. Si el adaptador falla, el lote queda intacto y se reintentará en el siguiente disparo.

### 2.7 Degradación silenciosa, nunca excepción hacia la UI

Todos los adaptadores toleran la ausencia del entorno:

| Situación | Comportamiento verificado |
| --- | --- |
| Sin `localStorage` (SSR, modo privado, cuota agotada) | La sesión se conserva **en memoria**; `setItem` envuelto en `try/catch` |
| JSON corrupto en almacenamiento | Se descarta y se vuelve al valor por defecto en lugar de propagar la excepción |
| Sin `window` | `ConectividadNavegador.alRecuperarConexion` devuelve una desususcripción inerte |
| Sin `navigator` | `estaEnLinea()` devuelve `true`: nunca se bloquea el estudio por no saber si hay red |
| Sin entropía criptográfica | `GeneradorIdCrypto` cae en cascada y termina en un respaldo determinista |
| Sin `document`/`URL` (SSR) | `DescargaCsvAdapter.descargar` es un no-op silencioso |

## 3. Justificación

1. **La app tiene que funcionar en un bus sin señal.** RF-009 no es una función opcional: es la razón de ser de la PWA. Un adaptador no-op hace que la cola sea finita y observable hoy, y deja el contrato listo para una nube real mañana.
2. **La respuesta correcta no puede estar en el cliente en reposo.** Mover el borrador a memoria elimina una filtración de respuestas sin necesidad de criptografía ni de servidor.
3. **Sin versión de esquema no hay evolución posible.** Hay estudiantes con datos en `yapu_*`; el refactor cambia los nombres de los campos. Una migración idempotente y tolerante permite desplegar sin pedir a nadie que borre su progreso.
4. **Los repositorios en memoria son una inversión, no un atajo.** Permiten (a) probar los casos de uso sin jsdom, (b) renderizar en servidor sin `localStorage` y (c) ejecutar `tests/contract` una sola vez contra dos adaptadores, que es lo que garantiza que ambos cumplen el mismo contrato.
5. **La clonación profunda evita bugs imposibles de depurar.** Sin ella, un caso de uso que mutara el agregado devuelto por el repositorio de memoria "funcionaría" en tests y fallaría con `localStorage` (que serializa). El contrato debe ser idéntico en ambos.
6. **Defensa contra inyección de fórmulas en la exportación.** El corpus se exporta a CSV (RS-004) y se abre en Excel: `serializadorCsv.ts` antepone un apóstrofo a los valores que empiezan por `=`, `+`, `-`, `@`, tabulación o retorno de carro, **antes** de aplicar el escapado RFC 4180, y añade el BOM UTF-8 para que la hoja de cálculo no rompa los acentos del runasimi.

## 4. Consecuencias

### Positivas

- `localStorage` queda confinado a `src/infrastructure/persistence/local-storage/**` y a `SesionLocalAdapter`; el resto del sistema es agnóstico del almacenamiento.
- La cola offline es finita y su estado es consultable (`EstadoSincronizacionDto`: `pendientes`, `sincronizadas`, `enLinea`).
- La exportación CSV es testeable sin DOM ni `Blob` (`ExportadorArchivoPort` + `DescargaCsvAdapter`).
- La suite de contrato obliga a que memoria y `localStorage` se comporten igual.

### Costes y límites asumidos

- **`localStorage` es síncrono y tiene cuota (~5 MB por origen).** Un corpus grande de oraciones podría agotarla. Mitigación actual: cada `setItem` está en `try/catch` y la sesión degrada a memoria; el corpus sembrado es de solo lectura y no se reescribe. Si el corpus crece, la salida natural es IndexedDB detrás del mismo puerto.
- **El borrador se pierde al recargar.** Aceptado (ver 2.4).
- **La sincronización no sincroniza nada.** `SincronizacionNoopAdapter` marca sin enviar: **no hay copia de seguridad en la nube**. Está documentado como límite conocido en el README.
- **Sin resolución de conflictos.** No hay estrategia *last-write-wins* ni vector de versiones porque no hay dos escritores. Cuando exista una nube real habrá que decidirla en un ADR nuevo.
- **El espacio de nombres `yapu:` convive con `yapu_*`.** Mientras la migración no se considere consolidada, hay dos generaciones de claves en el navegador de los usuarios existentes.

## 5. Alternativas consideradas

| Alternativa | Por qué se descartó |
| --- | --- |
| **Seguir con `LocalRepository` y añadir métodos** | Es el estado previo: acopla cinco agregados, impide el contrato compartido y no admite un adaptador en memoria limpio. |
| **IndexedDB desde el primer día** | API asíncrona y más compleja; para el volumen actual (progreso de un estudiante, historial de evaluaciones) `localStorage` basta, y el puerto permite migrar sin tocar casos de uso. |
| **`sessionStorage` para el borrador de evaluación** | Sobrevive a la recarga dentro de la misma pestaña, pero sigue siendo legible por quien examine el navegador: no resuelve la filtración de respuestas. |
| **Guardar el borrador cifrado en `localStorage`** | Requiere gestionar una clave en el cliente; seguridad aparente, complejidad real. La memoria es más simple y más segura. |
| **Sin versión de esquema, con código defensivo en cada lectura** | Reparte la compatibilidad en decenas de `if` imposibles de eliminar y de probar. |
| **Borrar las claves antiguas tras migrar** | Impide volver atrás si la migración resulta defectuosa en producción. |
| **Cola separada del historial de evaluaciones** | Duplica el estado y abre la puerta a inconsistencias (una evaluación en el historial y otra distinta en la cola). Usar `sincronizada` como marca de cola mantiene una sola fuente de verdad (RN-15). |
| **Adaptador de sincronización que lance "no implementado"** | Rompería el flujo de estudio sin conexión y dejaría la cola creciendo para siempre. |
| **Un mock de `localStorage` en los tests en vez de repositorios en memoria** | Los mocks prueban el mock, no el contrato; y no sirven para el render en servidor. |

## 6. Estado

**Aceptado; implementado en memoria y en los adaptadores de sistema; pendiente el almacenamiento local persistente.**

| Elemento | Estado verificado |
| --- | --- |
| `src/infrastructure/persistence/memory/**` (6 adaptadores + `clonar`) | Implementado |
| `BorradorEvaluacionMemoria` | Implementado |
| `SincronizacionNoopAdapter` | Implementado |
| `ConectividadNavegador` | Implementado |
| `SesionLocalAdapter` con `yapu:sesion:v1` | Implementado |
| `serializadorCsv.ts` (BOM, RFC 4180, neutralización de fórmulas) | Implementado |
| `src/infrastructure/persistence/local-storage/**` | **Pendiente** |
| Migración desde las claves `yapu_*` | **Previsto** (diseñado aquí; sin código que lo ejecute todavía) |
| `SincronizarPendientesUseCase` | **Pendiente** |
| `tests/contract/**` ejecutando la misma suite contra memoria y `localStorage` | **Pendiente** (el directorio está declarado en `vitest.config.ts`) |

## 7. Referencias internas

- [`Docs/arquitectura/ADR-001-arquitectura-hexagonal.md`](ADR-001-arquitectura-hexagonal.md) — puertos, adaptadores y reglas de dependencia.
- [`Docs/arquitectura/ADR-003-autenticacion-simulada.md`](ADR-003-autenticacion-simulada.md) — por qué la sesión también vive en `localStorage`.
- [`Docs/arquitectura/ADR-004-despliegue-github-pages.md`](ADR-004-despliegue-github-pages.md) — Service Worker, precache y estrategias de caché.
- `src/application/ports/`, `src/infrastructure/persistence/memory/`, `src/infrastructure/sync/`, `src/domain/contenido/serializadorCsv.ts`, `vitest.config.ts`
