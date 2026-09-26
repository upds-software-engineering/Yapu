# UNIVERSIDAD PRIVADA DOMINGO SAVIO — SEDE SANTA CRUZ
## FACULTAD DE INGENIERÍA — INGENIERÍA EN SISTEMAS
### ASIGNATURA: INGENIERÍA DE SOFTWARE I
### DOCENTE: ING. REQUENA LLORENTTY JIMMY NATANIEL

---

# PROYECTO YAPU — ÁLBUM DE MODELOS UML (ACTIVIDAD 03)
## GUIÓN TÉCNICO DE DEFENSA ORAL CRONOMETRADA (5 MINUTOS / 300 SEGUNDOS)
### Criterio de Verificación #2 (30 Puntos) — Gate 3 del SDLC

- **Equipo de Expositores (2 Integrantes):**
  - **Expositor 1:** Emmanuel Ponce Quiroga — *Bloques 1 y 3 (0:00 - 0:45 y 2:00 - 3:15)*
  - **Expositor 2:** Jhoel Alvaro Cruz Zurita — *Bloques 2 y 4 (0:45 - 2:00 y 3:15 - 4:15)*
  - **Cierre Conjunto:** Jhoel Alvaro Cruz & Emmanuel Ponce — *Bloque 5 (4:15 - 5:00)*
- **Tiempo Total Asignado:** 5 minutos exactos (300 segundos).
- **Herramienta de Soporte:** Diapositivas interactivas en `Docs/Presentations/presentacion_actividad03_5min.html`.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CRONOGRAMA DE DEFENSA ORAL (5 MINUTOS)                         │
├────────────────────┬──────────────────────────────────────────┬────────────────────────┤
│ Intervalo Temporal │ Módulo / Diagrama Expuesto               │ Estudiante Responsable │
├────────────────────┼──────────────────────────────────────────┼────────────────────────┤
│ Minuto 0:00 - 0:45 │ Contexto Territorial & Arquitectura PWA  │ Emmanuel Ponce Quiroga │
│ Minuto 0:45 - 2:00 │ Diagramas de Clases (Dominio & Multibase)│ Jhoel Alvaro Cruz      │
│ Minuto 2:00 - 3:15 │ Motor IA Determinista & Doble Moderación │ Emmanuel Ponce Quiroga │
│ Minuto 3:15 - 4:15 │ Secuencia, Estados & Background Sync     │ Jhoel Alvaro Cruz      │
│ Minuto 4:15 - 5:00 │ Matriz de Auditoría de IA & Conclusiones │ Jhoel & Emmanuel       │
└────────────────────┴──────────────────────────────────────────┴────────────────────────┘
```

---

## BLOQUE 1: Introducción, Contexto Territorial y Arquitectura General
**Tiempo:** 0:00 - 0:45 (45 segundos)  
**Expositor:** Emmanuel Ponce Quiroga  
**Diapositivas:** 1, 2 y 3  

> *"Buenos días, ingeniero Requena y compañeros. Presentamos la Actividad 03: el Álbum de Modelos UML para el proyecto YAPU, formalizado bajo el estándar IEEE Std 1016.*
>
> *YAPU nace para combatir la pérdida intergeneracional del quechua sureño en Chuquisaca. Al diseñar el software, enfrentamos una restricción crítica: en las comunidades periurbanas y rurales, los estudiantes cuentan con teléfonos inteligentes de gama baja con Android 8.0 y sufren conectividad intermitente 2G y 3G.*
>
> *Para resolverlo sin obligar al usuario a descargar un instalador pesado de más de 40 MB, diseñamos una Arquitectura de 4 Capas basada en Progressive Web App (PWA) con Astro SSG y Architecture Islands. La interfaz descarga cero JavaScript bloqueante, logrando un consumo de RAM menor a 150 MB y carga inicial en menos de 1.8 segundos. La comunicación hacia Firebase y nuestro VPS con Nginx es desacoplada mediante HTTPS TLS 1.3: el Service Worker intercepta las peticiones y opera de forma transparente entre la memoria local y la nube sin requerir conexión constante."*

---

## BLOQUE 2: Vista Estructural — Clases del Dominio y Persistencia Multibase de Datos
**Tiempo:** 0:45 - 2:00 (75 segundos)  
**Expositor:** Jhoel Alvaro Cruz Zurita  
**Diapositivas:** 4, 5 y 6  

> *"Continuando con la Vista Estructural, en el Diagrama de Clases del Dominio aplicamos estrictamente los principios SOLID, en particular el Principio de Inversión de Dependencias (DIP). La controladora `EvaluationController` depende de la abstracción `IEvaluationEngine` y no de una clase concreta, lo que permite intercambiar el motor o inyectar pruebas unitarias sin tocar la interfaz.*
>
> *Un aspecto central de nuestro diseño es la resolución del problema de múltiples bases de datos: YAPU maneja almacenamiento local en IndexedDB y almacenamiento remoto en Cloud Firestore NoSQL. Para modelarlo en UML sin acoplar el dominio, implementamos el patrón Data Mapper y un Repositorio Unificado:*
>
> *1. En el cliente, modelamos los Schemas de IndexedDB con `EvaluationStoreRecord` y `SyncQueueRecord`, definiendo sus `keyPath` e índices secundarios para búsquedas instantáneas en memoria flash.*
> *2. En la nube, modelamos los Schemas Documentales de Firestore con `FirestoreEvaluationDocument` y su subcolección `FirestoreQuestionSubdocument` para auditoría docente.*
> *3. Los mappers `EvaluationLocalMapper` y `EvaluationRemoteMapper` transforman las entidades, mientras que el repositorio `OfflineFirstEvaluationRepository` orquesta la persistencia local inmediata y la sincronización remota diferida.*
>
> *Asimismo, en nuestro Modelo Entidad-Relación (ERD), clasificamos las relaciones en Fuertes (como el catálogo de niveles), Débiles por Existencia con eliminación en cascada (como el perfil del estudiante ligado a su usuario), y Débiles por Identificación, donde las 10 preguntas de un examen son una composición pura que no tiene sentido sin su evaluación padre."*

---

## BLOQUE 3: Vista Funcional — Motor IA Determinista y Doble Moderación
**Tiempo:** 2:00 - 3:15 (75 segundos)  
**Expositor:** Emmanuel Ponce Quiroga  
**Diapositivas:** 7, 8 y 9  

> *"En la Vista Funcional, mapeamos los 10 Requisitos Funcionales del sistema. En el caso de uso `Rendir Evaluación`, el desbloqueo del siguiente nivel se modela como una relación `<<extend>>` condicionada a la guarda de obtener 70% o más de calificación, respetando la recomendación pedagógica de nuestra stakeholder, la Licenciada María Elena Quispe.*
>
> *Un pilar de innovación en YAPU es nuestro Motor de IA Determinista. A diferencia de soluciones convencionales que recurren a APIs externas como ChatGPT, nuestro motor se ejecuta íntegramente en el navegador móvil en TypeScript:*
>
> *1. Toma oraciones base certificadas y descompone su estructura Sujeto-Objeto-Verbo.*
> *2. Aplica permutaciones morfológicas controladas con sufijos quechuas como `-pi`, `-man` o `-manta`.*
> *3. Extrae exactamente 3 distractores verosímiles pertenecientes a la misma categoría gramatical y campo semántico, mezclándolos mediante el algoritmo Fisher-Yates.*
>
> *Esto nos otorga tres beneficios insustituibles: coste cero en servidores, latencia cero en la corrección y cero alucinaciones lingüísticas. Además, para la creación de contenidos comunitarios, implementamos el principio de cuatro ojos: ningún docente puede aprobar sus propias oraciones (`autor_id != validador_id`), asegurando la pureza dialectal del quechua Collao."*

---

## BLOQUE 4: Vista Dinámica — Secuencia Temporal, Estados y Background Sync
**Tiempo:** 3:15 - 4:15 (60 segundos)  
**Expositor:** Jhoel Alvaro Cruz Zurita  
**Diapositivas:** 10 y 11  

> *"En la Vista Dinámica, el Diagrama de Secuencia y el Diagrama de Máquina de Estados describen la resiliencia del software:*
>
> *Cuando un estudiante inicia una lección en el campo sin internet, el Service Worker sirve el App Shell y los recursos gráficos WebP directamente desde Cache Storage. El examen se genera, se responde y se califica en el dispositivo móvil en menos de 50 milisegundos.*
>
> *Al obtener una nota mayor o igual al 70%, el resultado se persiste de forma síncrona en IndexedDB y el nivel siguiente se desbloquea en la interfaz. Si no hay conexión de red, la evaluación se encola en `SyncQueueRecord` mediante la API de Background Sync.*
>
> *En el momento exacto en que el teléfono detecta señal Wi-Fi o datos móviles, el navegador despierta el Service Worker, el cual lee la cola pendiente y transmite un lote atómico (Batch Write) hacia Cloud Firestore. Si la transacción es confirmada, los registros locales se marcan como sincronizados sin que el estudiante deba recargar la pantalla ni perder su racha de estudio."*

---

## BLOQUE 5: Gobernanza de IA, Conclusiones y Defensa
**Tiempo:** 4:15 - 5:00 (45 segundos)  
**Expositores:** Jhoel Alvaro Cruz Zurita & Emmanuel Ponce Quiroga  
**Diapositiva:** 12  

> *(Emmanuel Ponce)*: *"Finalmente, en cumplimiento de los estándares éticos de la UPDS, presentamos la Matriz de Auditoría de IA con decisiones críticas donde el criterio humano corrigió propuestas de IA: descartamos APIs comerciales para garantizar gratuidad y funcionamiento offline, establecimos el umbral del 70%, e introdujimos el campo obligatorio de contexto cultural.*
>
> *(Jhoel Cruz)*: *En conclusión, este Álbum de Modelos UML no es un ejercicio meramente visual: es una especificación ejecutable bajo IEEE Std 1016 que demuestra la viabilidad técnica, pedagógica y social de YAPU para democratizar el quechua en Bolivia. Quedamos a disposición del docente para la ronda de preguntas. Muchas gracias."*

---

## BANCO DE PREGUNTAS TRAMPA DEL DOCENTE (DEFENSA RÁPIDA)

### P1: ¿Por qué en el diagrama de arquitectura no colocaron un rombo para validar si hay internet?
- **Respuesta Técnica:** Porque un diagrama de arquitectura describe topología de componentes y canales físicos/lógicos de comunicación (HTTPS, WebSockets, Cache API), no un algoritmo procedural. En una PWA, el cliente siempre emite llamadas HTTP estándar que son interceptadas de forma transparente por el Service Worker; modelar un rombo en la red es un error de abstracción conceptual que mezcla arquitectura con un diagrama de actividades.

### P2: ¿Cómo modelaron la relación entre IndexedDB y Firestore en el diagrama de clases?
- **Respuesta Técnica:** Aplicamos el patrón Data Mapper y Repository. En lugar de ensuciar las clases de negocio con llamadas a Firebase o IndexedDB, creamos schemas dedicados (`EvaluationStoreRecord` para IndexedDB con keyPaths e índices, y `FirestoreEvaluationDocument` con subcolecciones para Firestore). Mappers puros traducen entre el dominio y cada base de datos, mientras que `OfflineFirstEvaluationRepository` maneja la estrategia de persistir primero en local y sincronizar luego en la nube.

### P3: ¿Por qué la relación entre Evaluación y Pregunta es Composición (*--) y no Agregación (o--)?
- **Respuesta Técnica:** Porque las preguntas son sintetizadas dinámicamente con permutaciones específicas para ese intento evaluativo particular. No tienen existencia conceptual, clave primaria natural ni sentido de negocio fuera de la evaluación que las originó. Si la evaluación se descarta o se reinicia, sus 10 preguntas se destruyen en cascada en memoria.
