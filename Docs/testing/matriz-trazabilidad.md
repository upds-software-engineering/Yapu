# Matriz de trazabilidad requisitos ↔ pruebas — YAPU

**Fecha de generación:** 2026-09-29 11:43  
**Artefacto AUTOGENERADO**: no editar a mano. Se regenera con `npm run reports:trazabilidad` (o `node scripts/generar-matriz-trazabilidad.mjs`) a partir de los reportes JUnit de `reports/junit/*.xml`.

## Resumen

> ❌ **Sin reportes JUnit disponibles.** No existe ningún `*.xml` en `reports/junit/`, por lo que todos los requisitos figuran como **❌ sin reportes**. Ejecuta `npm test` (Vitest) y `npm run test:e2e` (Playwright) y vuelve a lanzar `npm run reports:trazabilidad` para obtener la matriz real.

| Métrica | Valor |
| --- | --- |
| Requisitos en el catálogo | 44 |
| Requisitos cubiertos (✅ + ⚠️) | 0 (0.0%) |
| Requisitos sin reportes (❌) | 44 |
| Requisitos con tests fallidos u omitidos (⚠️) | 0 |
| Pruebas analizadas | 0 |
| Pruebas fallidas | 0 |
| Pruebas omitidas | 0 |
| Suites / archivos de prueba | 0 |
| Reportes JUnit leídos | 0 |

**Criterio de estado:** ✅ cuando todos los tests que cubren el requisito pasan; ⚠️ cuando hay tests pero alguno falló, dio error o fue omitido; ❌ cuando ningún test referencia el requisito (o, si no hay reportes, cuando el requisito figura como **sin reportes**). Las pruebas se asocian por los tags entre corchetes del nombre del test y del `classname` de su `<testsuite>`: un `<testcase>` sin tags propios hereda los de su suite, y si tampoco los hay se ignora. Un mismo test puede cubrir varios requisitos.

### Desglose por familia

| Familia | Requisitos | Cubiertos | Sin cobertura | Cobertura |
| --- | ---: | ---: | ---: | ---: |
| Requisitos funcionales (RF) | 10 | 0 | 10 | 0.0% |
| Requisitos no funcionales (RNF) | 7 | 0 | 7 | 0.0% |
| Requisitos de sostenibilidad (RS) | 4 | 0 | 4 | 0.0% |
| Reglas de negocio (RN) | 17 | 0 | 17 | 0.0% |
| Leyes UX (UX) | 6 | 0 | 6 | 0.0% |

## Requisitos funcionales (RF)

| Requisito | Descripción | Tests que lo cubren | Estado |
| --- | --- | --- | --- |
| `RF-001` | Registro e inicio de sesión de estudiantes — **Simulado (SesionLocal)** | — | ❌ Sin reportes |
| `RF-002` | Gestión de roles (estudiante/docente) — **Simulado (SesionLocal)** | — | ❌ Sin reportes |
| `RF-003` | Visualización del mapa de niveles y progreso | — | ❌ Sin reportes |
| `RF-004` | Lecciones con flashcards (término, traducción, pronunciación, imagen y contexto cultural) | — | ❌ Sin reportes |
| `RF-005` | Evaluación con IA determinista (generación y calificación) | — | ❌ Sin reportes |
| `RF-006` | Registro de oraciones base por el docente | — | ❌ Sin reportes |
| `RF-007` | Retos comunitarios con moderación docente | — | ❌ Sin reportes |
| `RF-008` | Tablero de progreso, racha, XP e historial | — | ❌ Sin reportes |
| `RF-009` | Modo offline y sincronización de la cola | — | ❌ Sin reportes |
| `RF-010` | Panel docente de gestión de contenidos y exportación | — | ❌ Sin reportes |

## Requisitos no funcionales (RNF)

| Requisito | Descripción | Tests que lo cubren | Estado |
| --- | --- | --- | --- |
| `RNF-001` | Usabilidad y arquitectura de información | — | ❌ Sin reportes |
| `RNF-002` | Accesibilidad WCAG 2.1 AA | — | ❌ Sin reportes |
| `RNF-003` | Compatibilidad con navegadores móviles (PWA) | — | ❌ Sin reportes |
| `RNF-004` | Seguridad y ausencia de credenciales | — | ❌ Sin reportes |
| `RNF-005` | Mantenibilidad (arquitectura hexagonal y reglas de capas) | — | ❌ Sin reportes |
| `RNF-006` | Rendimiento (carga, hidratación diferida, Service Worker) | — | ❌ Sin reportes |
| `RNF-007` | Disponibilidad y tolerancia a fallos | — | ❌ Sin reportes |

## Requisitos de sostenibilidad (RS)

| Requisito | Descripción | Tests que lo cubren | Estado |
| --- | --- | --- | --- |
| `RS-001` | Sostenibilidad técnica (documentación y ADRs) | — | ❌ Sin reportes |
| `RS-002` | Eficiencia energética / rendimiento en dispositivos modestos | — | ❌ Sin reportes |
| `RS-003` | Participación comunitaria y gobernanza del contenido | — | ❌ Sin reportes |
| `RS-004` | Datos abiertos y transparencia (exportación CSV) | — | ❌ Sin reportes |

## Reglas de negocio (RN)

| Requisito | Descripción | Tests que lo cubren | Estado |
| --- | --- | --- | --- |
| `RN-01` | Acceso sólo al nivel actual o inferior (NivelBloqueadoError) | — | ❌ Sin reportes |
| `RN-02` | Desbloqueo secuencial: aprobar n con n === nivelActual desbloquea n+1; nivel 10 marca cursoCompletado; nunca se saltan niveles | — | ❌ Sin reportes |
| `RN-03` | Progreso global = nivelesAprobados/10*100 (100% al completar) | — | ❌ Sin reportes |
| `RN-04` | Umbral de aprobación 70 (constante única PoliticaAprobacion.UMBRAL) | — | ❌ Sin reportes |
| `RN-05` | XP: +100 la primera aprobación de cada nivel, +10 por evaluación rendida, +2 por palabra aprendida la primera vez (idempotente) | — | ❌ Sin reportes |
| `RN-06` | Racha por días calendario locales (mismo día 0, día siguiente +1, hueco >1 día → 1, perfil nuevo 0) | — | ❌ Sin reportes |
| `RN-07` | Perfil inicial limpio: nivel 1, racha 0, 0 palabras, 0 XP, cursoCompletado false | — | ❌ Sin reportes |
| `RN-08` | Palabras aprendidas = palabras ÚNICAS en estado aprendido | — | ❌ Sin reportes |
| `RN-09` | Pregunta válida: 4 opciones únicas, sin distractores hardcodeados, prioridad de pools de distractores | — | ❌ Sin reportes |
| `RN-10` | Tamaño de evaluación: objetivo 10, mínimo 5, ContenidoInsuficienteError por debajo | — | ❌ Sin reportes |
| `RN-11` | Cloze: la oración debe contener la palabra clave (regex escapado, case-insensitive, admite sufijos) | — | ❌ Sin reportes |
| `RN-12` | Oraciones del docente: rol docente, palabra clave obligatoria del mismo nivel, quedan aprobadas y alimentan al generador | — | ❌ Sin reportes |
| `RN-13` | Retos comunitarios: sólo estudiantes de nivel ≥7 proponen; doble aprobación de docentes distintos; un rechazo cierra el reto; sin votos duplicados; el autor no modera | — | ❌ Sin reportes |
| `RN-14` | CSV RFC 4180 + neutralización de fórmulas + BOM UTF-8 | — | ❌ Sin reportes |
| `RN-15` | Cola offline FIFO e idempotente, sincronizada al volver online y al iniciar | — | ❌ Sin reportes |
| `RN-16` | No se avanza sin marcar respuesta y se puede volver a la pregunta anterior | — | ❌ Sin reportes |
| `RN-17` | Identificadores únicos vía GeneradorIdPort (no Date.now) | — | ❌ Sin reportes |

## Leyes UX (UX)

| Requisito | Descripción | Tests que lo cubren | Estado |
| --- | --- | --- | --- |
| `UX-FITTS` | Ley de Fitts: objetivos táctiles ≥44px en móvil y ≥24px en escritorio, con separación ≥8px entre objetivos | — | ❌ Sin reportes |
| `UX-HICK` | Ley de Hick: ≤7 opciones primarias por pantalla y 1 solo CTA primario | — | ❌ Sin reportes |
| `UX-JAKOB` | Ley de Jakob: patrones convencionales, navegación inferior en móvil / superior en escritorio, pestaña Docente sólo con rol docente | — | ❌ Sin reportes |
| `UX-MILLER` | Ley de Miller: mapa agrupado en 3 tramos (1–3 / 4–7 / 8–10) | — | ❌ Sin reportes |
| `UX-APOGEO` | Apogeo-Final: clímax en la aprobación y próximo paso claro al reprobar | — | ❌ Sin reportes |
| `UX-ESTETICA` | Estética-Usabilidad: ≤3 tamaños tipográficos + caption, espaciado múltiplo de 4 y paleta tokenizada | — | ❌ Sin reportes |

## Requisitos sin cobertura

No se encontraron reportes JUnit, por lo que los 44 requisitos del catálogo aparecen como **❌ sin reportes**:

| Requisito | Descripción |
| --- | --- |
| `RF-001` | Registro e inicio de sesión de estudiantes |
| `RF-002` | Gestión de roles (estudiante/docente) |
| `RF-003` | Visualización del mapa de niveles y progreso |
| `RF-004` | Lecciones con flashcards (término, traducción, pronunciación, imagen y contexto cultural) |
| `RF-005` | Evaluación con IA determinista (generación y calificación) |
| `RF-006` | Registro de oraciones base por el docente |
| `RF-007` | Retos comunitarios con moderación docente |
| `RF-008` | Tablero de progreso, racha, XP e historial |
| `RF-009` | Modo offline y sincronización de la cola |
| `RF-010` | Panel docente de gestión de contenidos y exportación |
| `RNF-001` | Usabilidad y arquitectura de información |
| `RNF-002` | Accesibilidad WCAG 2.1 AA |
| `RNF-003` | Compatibilidad con navegadores móviles (PWA) |
| `RNF-004` | Seguridad y ausencia de credenciales |
| `RNF-005` | Mantenibilidad (arquitectura hexagonal y reglas de capas) |
| `RNF-006` | Rendimiento (carga, hidratación diferida, Service Worker) |
| `RNF-007` | Disponibilidad y tolerancia a fallos |
| `RS-001` | Sostenibilidad técnica (documentación y ADRs) |
| `RS-002` | Eficiencia energética / rendimiento en dispositivos modestos |
| `RS-003` | Participación comunitaria y gobernanza del contenido |
| `RS-004` | Datos abiertos y transparencia (exportación CSV) |
| `RN-01` | Acceso sólo al nivel actual o inferior (NivelBloqueadoError) |
| `RN-02` | Desbloqueo secuencial: aprobar n con n === nivelActual desbloquea n+1; nivel 10 marca cursoCompletado; nunca se saltan niveles |
| `RN-03` | Progreso global = nivelesAprobados/10*100 (100% al completar) |
| `RN-04` | Umbral de aprobación 70 (constante única PoliticaAprobacion.UMBRAL) |
| `RN-05` | XP: +100 la primera aprobación de cada nivel, +10 por evaluación rendida, +2 por palabra aprendida la primera vez (idempotente) |
| `RN-06` | Racha por días calendario locales (mismo día 0, día siguiente +1, hueco >1 día → 1, perfil nuevo 0) |
| `RN-07` | Perfil inicial limpio: nivel 1, racha 0, 0 palabras, 0 XP, cursoCompletado false |
| `RN-08` | Palabras aprendidas = palabras ÚNICAS en estado aprendido |
| `RN-09` | Pregunta válida: 4 opciones únicas, sin distractores hardcodeados, prioridad de pools de distractores |
| `RN-10` | Tamaño de evaluación: objetivo 10, mínimo 5, ContenidoInsuficienteError por debajo |
| `RN-11` | Cloze: la oración debe contener la palabra clave (regex escapado, case-insensitive, admite sufijos) |
| `RN-12` | Oraciones del docente: rol docente, palabra clave obligatoria del mismo nivel, quedan aprobadas y alimentan al generador |
| `RN-13` | Retos comunitarios: sólo estudiantes de nivel ≥7 proponen; doble aprobación de docentes distintos; un rechazo cierra el reto; sin votos duplicados; el autor no modera |
| `RN-14` | CSV RFC 4180 + neutralización de fórmulas + BOM UTF-8 |
| `RN-15` | Cola offline FIFO e idempotente, sincronizada al volver online y al iniciar |
| `RN-16` | No se avanza sin marcar respuesta y se puede volver a la pregunta anterior |
| `RN-17` | Identificadores únicos vía GeneradorIdPort (no Date.now) |
| `UX-FITTS` | Ley de Fitts: objetivos táctiles ≥44px en móvil y ≥24px en escritorio, con separación ≥8px entre objetivos |
| `UX-HICK` | Ley de Hick: ≤7 opciones primarias por pantalla y 1 solo CTA primario |
| `UX-JAKOB` | Ley de Jakob: patrones convencionales, navegación inferior en móvil / superior en escritorio, pestaña Docente sólo con rol docente |
| `UX-MILLER` | Ley de Miller: mapa agrupado en 3 tramos (1–3 / 4–7 / 8–10) |
| `UX-APOGEO` | Apogeo-Final: clímax en la aprobación y próximo paso claro al reprobar |
| `UX-ESTETICA` | Estética-Usabilidad: ≤3 tamaños tipográficos + caption, espaciado múltiplo de 4 y paleta tokenizada |

> **Nota de alcance (ADR-003):** `RF-001` (registro e inicio de sesión) y `RF-002` (gestión de roles) aparecen como **Simulado (SesionLocal)**: la autenticación real con Firebase está fuera del alcance del MVP, por lo que se implementan con `SesionLocalAdapter` sobre `localStorage` y se validan mediante pruebas de infraestructura, no con una suite de autenticación real.
