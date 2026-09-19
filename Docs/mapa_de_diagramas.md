# UNIVERSIDAD PRIVADA DOMINGO SAVIO
## FACULTAD DE INGENIERÍA
### CARRERA DE INGENIERÍA DE SISTEMAS / INGENIERÍA DE SOFTWARE

---

**PROYECTO YAPU — PLATAFORMA DE APRENDIZAJE DE LENGUA QUECHUA**  
**MAPA DE DIAGRAMAS ARQUITECTÓNICOS, DE COMPORTAMIENTO Y MODELADO DE DATOS UML / ERD (BLOQUE 2)**  

- **Asignatura:** Ingeniería de Software  
- **Docente:** Ingeniero Jimmy Nataniel Requena / Ing. Fernando Pardo  
- **Equipo de Desarrollo (Autores):**
  - Emmanuel Ponce Quiroga (Líder Técnico & Gobernanza de IA)
  - Jhoel Álvaro Cruz Zurita (Arquitectura VPS & Gestión de Datos)
  - Luis Mario Rocha Vela (Aseguramiento de Calidad & Estándares APA)
- **Stakeholder Pedagógica:** Lic. María Elena Quispe Mamani (Docente Titular de Lengua Quechua — Unidad Educativa Simón Bolívar, Sucre)
- **Fecha de Emisión:** 18 de septiembre de 2026  
- **Ubicación:** Santa Cruz de la Sierra / Sucre, Bolivia  
- **Versión:** 2.1 (Consolidada con Modelo de Datos ERD, Relaciones Fuertes/Débiles, SRS APA 7 y Defensa Bloque 2)

---

## 1. Introducción y Contexto del Documento

El presente documento constituye el **Mapa Integral de Diagramas de Arquitectura, Modelado de Datos y Comportamiento UML** para el proyecto **YAPU** (*Sembradío* en lengua quechua), una Plataforma Web Progresiva (PWA) de alta eficiencia concebida para la enseñanza, democratización y revitalización de la lengua originaria quechua (variante sureña Collao/Chuquisaca) en el Estado Plurinacional de Bolivia.

Este compendio traduce formalmente los requerimientos especificados en el documento institucional `Docs/Informe_SRS_APA7_Bloque2.pdf` y expuestos en `Docs/presentacion_srs_bloque2.html`. Incorpora el rigor del estándar **IEEE Std 830-1998** adaptado al paradigma ágil, operacionalizando las historias de usuario, criterios de aceptación BDD (Gherkin), esquemas relacionales y de documentos NoSQL mediante modelos visuales ejecutables y auditables.

### Objetivos Específicos del Mapa:
1. **Modelar la Arquitectura Integral del Sistema:** Exponer la separación de capas entre el cliente PWA (Astro + Service Workers), los servicios distribuidos en la nube (Firebase) y la infraestructura VPS autogestionada (Nginx).
2. **Modelar la Estructura y Persistencia de Datos (ERD):** Definir el diagrama entidad-relación del dominio, clasificando taxónomicamente las relaciones fuertes, débiles por existencia y débiles por identificación, así como su equivalencia en Cloud Firestore e IndexedDB.
3. **Definir el Diagrama General de Casos de Uso:** Mapear la interacción de los tres actores del ecosistema (Estudiante, Docente y Administrador) frente a los 10 Requisitos Funcionales (RF-001 al RF-010).
4. **Detallar Casos de Uso Específicos:** Describir con granularidad técnica los módulos críticos (Motor de IA Determinista, Navegación con umbral del 70% y Moderación Docente).
5. **Modelar el Diagrama General de Actividades:** Diagramar el flujo de ejecución global del software, contemplando bifurcaciones de conectividad (online/offline) y decisiones pedagógicas.
6. **Presentar la Matriz de Auditoría de IA:** Registrar de forma verificable la gobernanza sobre los diagramas y componentes estructurales propuestos inicialmente por modelos de IA y ajustados por el equipo humano en función de las directrices del stakeholder pedagógico.

---

## 2. Diagrama 1: Arquitectura General del Sistema

### 2.1 Representación Arquitectónica (Mermaid)

```mermaid
graph TB
    subgraph CLIENT_TIER["Capa de Cliente: PWA Ligera - RAM menor a 150MB"]
        direction TB
        UI["Interfaz Gráfica con Diseño Andino<br/>Astro SSG más Islands y Estilos CSS"]
        SW["Service Worker y Workbox<br/>Cache Storage y Estrategias Offline"]
        IDB[("Almacenamiento Local<br/>IndexedDB y LocalStorage")]
        
        subgraph CORE_AI["Motor de IA Determinista en TypeScript"]
            GEN["Generador de Evaluaciones<br/>Permutación de oraciones base"]
            DIST["Selector de Distractores Verosímiles<br/>Filtro de misma categoría gramatical"]
            EVAL["Evaluador Local de Respuestas<br/>Cálculo inmediato de aciertos"]
        end
    end

    subgraph NET_TIER["Canal Seguro de Conectividad - HTTPS TLS 1.3"]
        NET_STAT{"¿Conectividad<br/>Disponible?"}
    end

    subgraph CLOUD_TIER["Servicios de Plataforma en la Nube - Firebase"]
        FAUTH["Firebase Authentication<br/>JWT y Roles: Estudiante, Docente, Admin"]
        FSTORE[("Cloud Firestore DB<br/>Colecciones de usuarios, oraciones y notas")]
        FSTORE_RULES["Reglas de Seguridad Firestore<br/>Validación estricta por rol"]
    end

    subgraph VPS_TIER["Infraestructura Autogestionada - VPS UPDS"]
        NGINX["Servidor Web y Reverse Proxy Nginx<br/>Compresión HTTP y Caché de Red"]
        STATIC_ASSETS["Repositorio de Assets WebP<br/>Imágenes léxicas menores a 100KB"]
        DATA_EXPORT["Servicio de Datos Abiertos RS-004<br/>Exportador CSV y JSON"]
    end

    UI --> SW
    SW --> IDB
    UI --> CORE_AI
    GEN --> DIST
    DIST --> EVAL
    
    SW --> NET_STAT
    
    NET_STAT -->|Online - Sync de progreso| FAUTH
    NET_STAT -->|Online - Lectura y Escritura| FSTORE
    FSTORE --> FSTORE_RULES
    
    NET_STAT -->|Online - Descarga inicial de assets| NGINX
    NGINX --> STATIC_ASSETS
    NGINX --> DATA_EXPORT
    
    EVAL -.->|Encola resultados offline| IDB
    IDB -.->|Sincronización diferida al reconectar| FSTORE

    classDef clientStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef aiStyle fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef cloudStyle fill:#0c4a6e,stroke:#0284c7,stroke-width:2px,color:#ffffff;
    classDef vpsStyle fill:#14532d,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef netStyle fill:#334155,stroke:#94a3b8,stroke-width:1px,color:#ffffff;

    class UI,SW,IDB clientStyle;
    class GEN,DIST,EVAL aiStyle;
    class FAUTH,FSTORE,FSTORE_RULES cloudStyle;
    class NGINX,STATIC_ASSETS,DATA_EXPORT vpsStyle;
    class NET_STAT netStyle;
```

### 2.2 Descripción Técnica y Mapeo con el SRS
- **Propósito:** Describir la topología física y lógica de la solución de software, garantizando que el sistema sea viable en entornos con infraestructura restringida.
- **Capa Cliente (PWA):** Construida sobre el framework Astro para maximizar la velocidad de carga (FCP < 1.8s, RNF-001) sirviendo HTML pre-renderizado con JavaScript mínimo. Opera como PWA gobernada por un Service Worker (RF-009) que gestiona Cache Storage e IndexedDB, consumiendo menos de 150 MB de memoria RAM en ejecución (RS-002) para permitir su uso en smartphones económicos Android 8.0+.
- **Motor de IA Determinista:** Aislado en el cliente en TypeScript (RF-005). No efectúa peticiones HTTP externas ni llamadas a LLMs comerciales (OpenAI/Anthropic), eliminando costos recurrentes ($0 en APIs) y garantizando ausencia absoluta de alucinaciones lingüísticas.
- **Capa de Servicios Cloud (Firebase):** Maneja la autenticación robusta de usuarios con hashing no accesible por código cliente (RNF-003, RF-001, RF-002) y la base de datos documental Cloud Firestore, configurada con clústeres capaces de absorber picos de hasta 500 usuarios concurrentes (RNF-005).
- **Capa de Servidor Privado Virtual (VPS):** Un VPS Linux Debian administrado por el equipo UPDS que actúa como origen confiable mediante Nginx (RNF-004), sirviendo activos gráficos comprimidos en WebP a menos de 100 KB por recurso (RS-001) y proporcionando un endpoint utilitario para la exportación de corpus en formatos abiertos CSV/JSON (RS-004).

---

## 3. Diagrama 2: Diagrama de Modelado de Datos (Entidad-Relación y Dominio)

### 3.1 Representación del Diagrama Entidad-Relación (Mermaid ERD)

```mermaid
erDiagram
    USUARIO ||--o| PERFIL_ESTUDIANTE : "posee_perfil"
    USUARIO ||--o{ ORACION_BASE : "crea_como_autor"
    USUARIO ||--o{ ORACION_BASE : "certifica_como_validador"
    
    PERFIL_ESTUDIANTE ||--o{ PROGRESO_NIVEL : "registra_avance"
    NIVEL ||--o{ PROGRESO_NIVEL : "determina_nivel"
    
    NIVEL ||--o{ PALABRA_VOCABULARIO : "contiene_lexico"
    
    PERFIL_ESTUDIANTE ||--o{ VOCABULARIO_ESTUDIANTE : "gestiona_estudio"
    PALABRA_VOCABULARIO ||--o{ VOCABULARIO_ESTUDIANTE : "es_clasificada"
    
    NIVEL ||--o{ ORACION_BASE : "asocia_nivel"
    
    PERFIL_ESTUDIANTE ||--o{ EVALUACION : "rinde_evaluacion"
    NIVEL ||--o{ EVALUACION : "evalua_nivel"
    
    EVALUACION ||--|{ DETALLE_PREGUNTA : "genera_preguntas"
    ORACION_BASE ||--o{ DETALLE_PREGUNTA : "sirve_de_semilla"
    
    PERFIL_ESTUDIANTE ||--o{ RETO_COMUNITARIO : "propone_reto"
    USUARIO ||--o{ RETO_COMUNITARIO : "modera_reto"

    USUARIO {
        string id_usuario PK
        string nombre_completo
        string correo_electronico
        string rol_sistema
        string estado_cuenta
        string fecha_registro
    }

    PERFIL_ESTUDIANTE {
        string id_estudiante PK
        int nivel_actual
        int racha_dias
        int total_palabras_aprendidas
        string fecha_ultima_sesion
    }

    NIVEL {
        int id_nivel PK
        string titulo_quechua
        string titulo_espanol
        int orden_secuencial
        int umbral_minimo_aprobacion
    }

    PROGRESO_NIVEL {
        string id_progreso PK
        string id_estudiante FK
        int id_nivel FK
        string estado_desbloqueo
        int calificacion_maxima
        string fecha_desbloqueo
    }

    PALABRA_VOCABULARIO {
        string id_palabra PK
        int id_nivel FK
        string termino_quechua
        string traduccion_espanol
        string categoria_gramatical
        string url_imagen_webp
        string contexto_cultural
    }

    VOCABULARIO_ESTUDIANTE {
        string id_registro PK
        string id_estudiante FK
        string id_palabra FK
        string estado_aprendizaje
        int contador_aciertos
        string fecha_ultimo_repaso
    }

    ORACION_BASE {
        string id_oracion PK
        int id_nivel FK
        string texto_quechua
        string traduccion_espanol
        string contexto_cultural
        string autor_id FK
        string validador_id FK
        string estado_moderacion
    }

    EVALUACION {
        string id_evaluacion PK
        string id_estudiante FK
        int id_nivel FK
        int puntuacion_obtenida
        int total_aciertos
        string estado_aprobacion
        boolean sincronizado_nube
    }

    DETALLE_PREGUNTA {
        string id_pregunta PK
        string id_evaluacion FK
        string id_oracion_base FK
        string enunciado_pregunta
        string opcion_correcta
        string distractor_1
        string distractor_2
        string distractor_3
        string respuesta_marcada
        boolean es_correcta
    }

    RETO_COMUNITARIO {
        string id_reto PK
        string id_estudiante FK
        string id_docente_validador FK
        string texto_quechua
        string traduccion_sugerida
        string pista_cultural
        string estado_reto
    }
```

---

### 3.2 Explicación Exhaustiva de las Relaciones de Datos

En el diseño de bases de datos para sistemas educativos resilientes, la categorización de las relaciones entre entidades determina la **integridad referencial**, las **reglas de cascada** en operaciones de borrado o actualización, y la **estrategia de particionamiento** entre el almacenamiento local (IndexedDB) y la nube (Cloud Firestore). A continuación se desglosa el significado conceptual y técnico de cada tipo de relación presente en el modelo:

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 TAXONOMÍA DE RELACIONES                     │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
    ┌─────────────────────────────┐                             ┌─────────────────────────────┐
    │     RELACIONES FUERTES      │                             │      RELACIONES DÉBILES     │
    │  (Existencia Independiente) │                             │  (Dependencia Estructural)  │
    └──────────────┬──────────────┘                             └──────────────┬──────────────┘
                   │                                                           │
        ┌──────────┴──────────┐                                     ┌──────────┴──────────┐
        ▼                     ▼                                     ▼                     ▼
 ┌──────────────┐      ┌──────────────┐                      ┌──────────────┐      ┌──────────────┐
 │ Asociación   │      │ Composición  │                      │ Por          │      │ Por          │
 │ Independiente│      │ Referencial  │                      │ Existencia   │      │Identificación│
 │ (USUARIO a   │      │ (NIVEL a     │                      │ (USUARIO a   │      │ (EVALUACION a│
 │ ORACION_BASE)│      │ PALABRA)     │                      │ PERFIL)      │      │ DETALLE)     │
 └──────────────┘      └──────────────┘                      └──────────────┘      └──────────────┘
```

#### A. Relaciones Fuertes (Existencia Independiente)
Una relación es **fuerte** cuando vincula dos entidades regulares (fuertes) que poseen identidad ontológica e histórica propia en el sistema. Ambas entidades disponen de claves primarias independientes y la desaparición de una no compromete necesariamente la existencia de la otra en el registro maestro:

1. **`USUARIO` $\rightarrow$ `ORACION_BASE` (Relación de Creación y Validación 1:N):**
   - *Tipo:* Relación Fuerte de Asociación.
   - *Significado:* Un usuario con rol Docente crea una oración base lingüística (`autor_id`), mientras que un segundo usuario docente diferente certifica su corrección (`validador_id`). 
   - *Comportamiento de Integridad:* Si el usuario docente es desactivado o pasa a estado inactivo, la `ORACION_BASE` **permanece intacta** en el banco de oraciones para no descalibrar el motor de IA determinista ni privar a los estudiantes de su material de estudio (integridad histórica).
2. **`NIVEL` $\rightarrow$ `PALABRA_VOCABULARIO` (Relación Estructural de Catálogo 1:N):**
   - *Tipo:* Relación Fuerte / Jerárquica de Catálogo.
   - *Significado:* El Nivel (del 1 al 10, según la progresión A1 del Marco Común Europeo) agrupa el léxico correspondiente. Cada palabra posee su propio identificador único y metadatos léxicos autónomos.
3. **`NIVEL` $\rightarrow$ `ORACION_BASE` (Relación de Agrupación Curricular 1:N):**
   - *Tipo:* Relación Fuerte.
   - *Significado:* Vincula cada estructura oracional al nivel lingüístico específico, permitiendo al motor de IA filtrar los bancos de reactivos de acuerdo al avance curricular del estudiante.

---

#### B. Relaciones Débiles por Existencia
Una entidad es **débil por existencia** cuando su permanencia en el sistema carece de sentido lógico si no existe la entidad fuerte de la cual depende. Si la entidad padre es dada de baja o purgada, la entidad débil dependiente debe ser eliminada en cascada (*ON DELETE CASCADE*):

1. **`USUARIO` $\rightarrow$ `PERFIL_ESTUDIANTE` (Relación de Especialización 1:0..1):**
   - *Tipo:* Relación Débil por Existencia.
   - *Significado:* Todo estudiante registrado posee un perfil específico donde se acumula su gamificación (racha de días, nivel máximo y palabras dominadas). No puede existir un `PERFIL_ESTUDIANTE` sin su correspondiente cuenta raíz en `USUARIO`. Si un estudiante solicita el ejercicio de su derecho de supresión de cuenta (Habeas Data / Privacidad RNF-003), su perfil académico queda eliminado de forma sincrónica.
2. **`PERFIL_ESTUDIANTE` $\rightarrow$ `EVALUACION` (Relación Histórica de Desempeño 1:N):**
   - *Tipo:* Relación Débil por Existencia.
   - *Significado:* Cada evaluación representa el evento temporal en que un estudiante rinde una prueba de nivel. No pueden registrarse evaluaciones anónimas o huérfanas sin asociarse al identificador del estudiante que contestó las preguntas.

---

#### C. Relaciones Débiles por Identificación (Entidades Asociativas e Hijas Puras)
Una entidad es **débil por identificación** cuando, además de depender de la existencia de otra entidad, **no puede identificarse unívocamente sin la clave foránea de su entidad padre o de sus entidades relacionadas**. Su clave primaria se compone total o sustancialmente de claves foráneas:

1. **`EVALUACION` $\rightarrow$ `DETALLE_PREGUNTA` (Relación Débil por Identificación 1:N):**
   - *Tipo:* **Relación Débil por Identificación Pura (Composición Estricta).**
   - *Significado:* Una evaluación se compone de exactamente 10 preguntas generadas de forma determinista. Cada `DETALLE_PREGUNTA` registra la combinación específica de oración base, la permutación morfológica, los 3 distractores generados por el algoritmo y la opción elegida por el alumno.
   - *Comportamiento de Integridad:* Las preguntas individuales no poseen valor autónomo fuera de la evaluación que las originó. Si una evaluación se elimina o recalcula, sus 10 preguntas asociadas se destruyen en cascada.
2. **`PERFIL_ESTUDIANTE` y `NIVEL` $\rightarrow$ `PROGRESO_NIVEL` (Relación Débil Asociativa N:M):**
   - *Tipo:* Relación Débil por Identificación / Tabla Asociativa de Estado.
   - *Significado:* Resuelve la relación de muchos a muchos entre estudiantes y los 10 niveles disponibles. Cada registro modela el estado de desbloqueo (bloqueado, en curso, aprobado con fecha y nota máxima obtenida). 
   - *Regla de Negocio Crítica:* La tupla `(id_estudiante, id_nivel)` es estrictamente única (*UNIQUE CONSTRAINT*), impidiendo duplicaciones en la progresión.
3. **`PERFIL_ESTUDIANTE` y `PALABRA_VOCABULARIO` $\rightarrow$ `VOCABULARIO_ESTUDIANTE` (Relación Débil Asociativa de Aprendizaje N:M):**
   - *Tipo:* Relación Débil Asociativa.
   - *Significado:* Materializa el estado de dominio léxico individual del estudiante (RF-004). Almacena el `contador_aciertos` (requiere acumular 3 aciertos consecutivos en repasos espaciados para transicionar el estado de `"repasar"` a `"aprendida"`).

---

### 3.3 Mapeo Arquitectónico: Del Modelo Entidad-Relación al Esquema NoSQL en Cloud Firestore

En virtud de que YAPU es una aplicación web progresiva orientada a operar en redes móviles 3G con conectividad intermitente (RF-009, RNF-001), el modelo Entidad-Relación relacional conceptual se implementa físicamente sobre **Cloud Firestore** y **IndexedDB** siguiendo el patrón de documentos y subcolecciones optimizadas para consulta offline:

| Entidad Lógica (DER) | Colección / Subcolección Física Firestore | Estrategia de Caché Local en PWA (IndexedDB) |
|---|---|---|
| `USUARIO` | `/users/{id_usuario}` | Almacena perfil activo del usuario autenticado en `session_user`. |
| `PERFIL_ESTUDIANTE` | Subdocumento embebido en `/users/{id_usuario}` | Caché local con persistencia inmediata para consultas de dashboard sin red (RF-008). |
| `NIVEL` | `/niveles/{id_nivel}` | Descargado íntegramente durante la instalación del Service Worker (Cache Storage estático). |
| `PALABRA_VOCABULARIO` | `/niveles/{id_nivel}/vocabulario/{id_palabra}` | Precargado por nivel mediante Workbox. Assets WebP asociados cacheados en disco local. |
| `PROGRESO_NIVEL` | `/users/{uid}/progreso_niveles/{id_nivel}` | Mutación inmediata en IndexedDB; encolado para *Background Sync* hacia Firestore al reconectar. |
| `ORACION_BASE` | `/oraciones_base/{id_oracion}` | Sincronizado localmente para servir de insumo directo al motor determinista en TypeScript. |
| `EVALUACION` y `DETALLE_PREGUNTA` | `/evaluaciones/{id_evaluacion}/preguntas/{id_pregunta}` | Grabación atómica en lote (*Firestore Batch Write*) para minimizar consumo de cuotas concurrentes (RNF-005). |

---

## 4. Diagrama 3: Diagrama General de Casos de Uso del Sistema

### 4.1 Representación UML de Casos de Uso (Mermaid)

```mermaid
graph LR
    subgraph ACTORS["Actores del Sistema"]
        EST["Estudiante<br/>Usuario Final"]
        DOC["Docente Quechua<br/>Validador Pedagógico"]
        ADM["Administrador<br/>Gestión de Infraestructura"]
    end

    subgraph SYSTEM_BOUNDARY["Sistema YAPU - PWA y Backend"]
        direction TB

        subgraph MOD_AUTH["Módulo de Acceso y Seguridad"]
            UC01(["RF-001: Registrar Cuenta"])
            UC02(["RF-002: Iniciar o Cerrar Sesión"])
            UC_VERIF(["Verificar Correo Electrónico"])
        end

        subgraph MOD_LEARN["Módulo Pedagógico y Gamificación"]
            UC03(["RF-003: Visualizar Mapa de Niveles A1"])
            UC04(["RF-004: Practicar Lecciones de Vocabulario"])
            UC05(["RF-005: Rendir Evaluación con IA Determinista"])
            UC08(["RF-008: Consultar Tablero de Progreso"])
            UC_DESB(["Desbloquear Siguiente Nivel al 70 por ciento"])
        end

        subgraph MOD_OFFLINE["Módulo de Resiliencia"]
            UC09(["RF-009: Descargar Lecciones en Modo Offline"])
            UC_SYNC(["Sincronizar Progreso al Reconectar"])
        end

        subgraph MOD_TEACHER["Módulo de Contenidos y Moderación"]
            UC06(["RF-006: Gestionar Oraciones y Contexto Cultural"])
            UC07(["RF-007: Proponer Retos Comunitarios Nivel 7"])
            UC_MOD(["Doble Validación y Moderación Docente"])
        end

        subgraph MOD_ADMIN["Módulo de Infraestructura y Datos Abiertos"]
            UC_EXPORT(["RS-004: Exportar Corpus Lingüístico CSV o JSON"])
            UC_HEALTH(["RNF-004: Monitorear Disponibilidad del VPS"])
        end
    end

    EST --> UC01
    EST --> UC02
    EST --> UC03
    EST --> UC04
    EST --> UC05
    EST --> UC08
    EST --> UC09
    EST -.->|Si alcanza Nivel 7 o mas| UC07

    DOC --> UC02
    DOC --> UC06
    DOC --> UC_MOD

    ADM --> UC02
    ADM --> UC_EXPORT
    ADM --> UC_HEALTH

    UC01 -.->|include| UC_VERIF
    UC05 -.->|extend si nota es 70 o mas| UC_DESB
    UC09 -.->|include| UC_SYNC
    UC07 -.->|include| UC_MOD
    UC06 -.->|include| UC_MOD

    classDef actorStyle fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef useCaseStyle fill:#0f172a,stroke:#38bdf8,stroke-width:1px,color:#f8fafc;
    classDef highlightUC fill:#0c4a6e,stroke:#10b981,stroke-width:2px,color:#ffffff;

    class EST,DOC,ADM actorStyle;
    class UC01,UC02,UC03,UC04,UC06,UC07,UC08,UC09,UC_VERIF,UC_SYNC,UC_EXPORT,UC_HEALTH useCaseStyle;
    class UC05,UC_DESB,UC_MOD highlightUC;
```

### 4.2 Descripción y Catálogo de Casos de Uso

| Caso de Uso | Requisito Trazable | Actor Primario | Precondición | Postcondición Crítica |
|---|---|---|---|---|
| **CU-01: Registrar Cuenta** | RF-001 | Estudiante / Docente | Dispositivo con conexión y navegador moderno. | Cuenta creada en Firebase Auth, documento inicializado en Firestore `/users` con rol seleccionado y correo de validación despachado. |
| **CU-02: Iniciar Sesión** | RF-002 | Todos los actores | Usuario registrado con correo y contraseña. | Token JWT emitido, carga de perfil según rol y restauración de progreso en el cliente. |
| **CU-03: Visualizar Mapa A1** | RF-003, RF-010 | Estudiante | Sesión activa de estudiante. | Renderizado del mapa de 10 niveles con estilo andino; niveles no alcanzados bloqueados con candado visual. |
| **CU-04: Practicar Vocabulario** | RF-004 | Estudiante | Nivel actual desbloqueado. | Despliegue de tarjetas interactivas con ilustración WebP, glosa en castellano, ortografía normalizada y opción de marcar para repaso. |
| **CU-05: Rendir Evaluación IA** | RF-005 | Estudiante | Vocabulario de la lección completado. | Generación algorítmica local de test de 10 ítems de opción múltiple; cálculo de nota inmediata sin latencia de red. |
| **CU-06: Desbloquear Nivel** | RF-003, RF-005 | Estudiante (Disparado por Sistema) | Calificación obtenida en la evaluación $\ge 70\%$. | Se escribe en Firestore la fecha de aprobación y el Nivel $N+1$ queda habilitado para el usuario. |
| **CU-07: Gestionar Oraciones Base** | RF-006, RS-003 | Docente Quechua | Sesión iniciada con rol docente certificado. | Oración creada con texto quechua, traducción, nivel y el campo obligatorio `contexto_cultural`. Queda en cuarentena (`pendiente`). |
| **CU-08: Doble Moderación** | RF-007, RS-003 | Docente Quechua | Existencia de oraciones o retos en estado `pendiente`. | Un segundo docente evalúa lingüísticamente el contenido; al aprobarlo se publica para el motor determinista. |
| **CU-09: Descargar Modo Offline** | RF-009 | Estudiante | Conexión a internet activa al momento de navegar. | El Service Worker almacena en Cache Storage las lecciones y recursos WebP del nivel activo para su uso posterior sin internet. |
| **CU-10: Exportar Corpus Lingüístico** | RS-004 | Administrador | Rol de Administrador en el VPS. | Generación de archivo descargable CSV/JSON con metadatos léxicos libres de datos personales (GDPR/Habeas Data). |

---

## 5. Diagrama 4: Diagramas de Casos de Uso Específicos por Módulo Clave

### 5.1 Módulo Pedagógico: Generación de Evaluaciones con IA Determinista (RF-005)

```mermaid
graph TB
    subgraph CU_DET_IA["Caso de Uso Detallado: Rendir Evaluación con IA Determinista - RF-005"]
        direction TB
        E["Estudiante"] -->|Paso 1: Solicita rendir test de nivel| CLI["Cliente PWA Astro"]
        
        CLI -->|Paso 2: Obtiene oraciones base del nivel| BANK[("Banco Local de Oraciones<br/>Caché o Firestore")]
        
        CLI -->|Paso 3: Invoca motor en TypeScript| ENGINE["Motor Determinista Local"]
        
        subgraph ALGORITMO["Algoritmo Determinista sin LLMs"]
            P1["1. Selección de oración base certificada"]
            P2["2. Extracción sintáctica: Sujeto, Objeto y Verbo"]
            P3["3. Permutación morfológica controlada: Sufijos -pi, -man, -manta"]
            P4["4. Extracción de 3 distractores del mismo campo semántico"]
            P5["5. Mezcla de opciones aleatorias con semilla determinista"]
            P1 --> P2 --> P3 --> P4 --> P5
        end
        
        ENGINE --- ALGORITMO
        
        ALGORITMO -->|Paso 4: Retorna test de 10 preguntas| CLI
        CLI -->|Paso 5: Estudiante responde cuestionario| E
        CLI -->|Paso 6: Corrige respuestas en local| EVAL_LOC["Evaluador de Aciertos"]
        
        EVAL_LOC -->|Comprueba calificación| CHECK{¿Nota es 70% o más?}
        CHECK -->|Aprobado| OK["Desbloquea Nivel Siguiente en Firestore<br/>Registra Nota y Fecha"]
        CHECK -->|Reprobado| FAIL["Muestra retroalimentación correctiva<br/>Permite reintento con nuevas permutaciones"]
    end

    classDef act fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    classDef nodeStyle fill:#0f172a,stroke:#38bdf8,stroke-width:1px,color:#ffffff;
    classDef passStyle fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef failStyle fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#ffffff;

    class E act;
    class CLI,BANK,ENGINE,P1,P2,P3,P4,P5,EVAL_LOC,CHECK nodeStyle;
    class OK passStyle;
    class FAIL failStyle;
```

---

### 5.2 Módulo Docente: Gestión y Doble Moderación de Contenidos (RF-006, RF-007, RS-003)

```mermaid
graph TD
    subgraph CU_MODERACION["Caso de Uso Detallado: Flujo de Doble Moderación Lingüística"]
        DOC1["Docente 1 o Estudiante Nivel 7"] -->|Paso 1: Envía propuesta de contenido| FORM["Formulario de Aporte"]
        
        FORM -->|Valida campos requeridos| VAL_INP{"¿Campos completos?<br/>Texto, Traducción y Contexto"}
        
        VAL_INP -->|Incompleto| REJ_INP["Rechazo formal en interfaz con advertencia"]
        VAL_INP -->|Completo| SAVE_PEND["Guarda en Firestore /oraciones<br/>estado = pendiente<br/>autor_id = Docente 1"]
        
        SAVE_PEND --> COLA["Cola de Aprobación Docente"]
        
        DOC2["Docente 2 - Hablante Certificado"] -->|Paso 2: Accede a cola de revisión| COLA
        
        COLA --> REV["Inspección Lingüística:<br/>1. Ortografía normalizada Sucre<br/>2. Pertinencia del Contexto Cultural<br/>3. Cero mezcla con otras lenguas"]
        
        REV --> DECISION{"Dictamen del<br/>Segundo Docente"}
        
        DECISION -->|Rechazado| RECHAZO["Estado = rechazado<br/>Registra motivo pedagógico para el autor"]
        DECISION -->|Corrección menor| EDITAR["Docente 2 edita texto o contexto<br/>y aprueba con observaciones"]
        DECISION -->|Aprobado| APROBADO["Estado = aprobado<br/>validador_id = Docente 2<br/>fecha_aprobacion = timestamp"]
        
        EDITAR --> APROBADO
        APROBADO --> LIVE["Integración Inmediata al Banco de IA<br/>Disponible para todos los estudiantes"]
    end

    classDef doc1Style fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    classDef doc2Style fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    classDef flowStyle fill:#0f172a,stroke:#94a3b8,stroke-width:1px,color:#ffffff;
    classDef okStyle fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef noStyle fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#ffffff;

    class DOC1 doc1Style;
    class DOC2 doc2Style;
    class FORM,VAL_INP,SAVE_PEND,COLA,REV,DECISION,EDITAR flowStyle;
    class APROBADO,LIVE okStyle;
    class REJ_INP,RECHAZO noStyle;
```

---

## 6. Diagrama 5: Diagrama General de Actividades del Sistema

```mermaid
sequenceDiagram
    autonumber
    actor U as Estudiante - Dispositivo Móvil
    participant SW as Service Worker y Caché PWA
    participant AI as Motor IA Determinista en TS
    participant DB as Cloud Firestore y Auth

    Note over U,DB: 1. CICLO DE AUTENTICACION Y CARGA INICIAL
    U->>SW: Abre YAPU en navegador móvil
    alt Está en Caché - Offline o red 3G
        SW-->>U: Sirve App Shell y recursos WebP desde Cache Storage
    else Primera Visita - Conexión Online
        SW->>DB: Solicita validación de token y bundle
        DB-->>SW: Retorna credenciales y estado del estudiante
        SW-->>U: Renderiza pantalla principal con temática andina
    end

    Note over U,DB: 2. EXPLORACION DEL MAPA Y ESTUDIO LEXICO (RF-003, RF-004)
    U->>SW: Selecciona Nivel Habilitado (ejemplo Nivel 1)
    SW-->>U: Presenta tarjetas de vocabulario con ilustración WebP y glosa
    U->>U: Marca palabras en estado Aprendida o Repasar

    Note over U,DB: 3. RENDICION DE EVALUACION DETERMINISTA (RF-005)
    U->>AI: Solicita inicio de evaluación del nivel
    AI->>SW: Obtiene oraciones base del nivel desde almacén local
    SW-->>AI: Retorna oraciones base certificadas
    AI->>AI: Ejecuta algoritmo de permutación y generación de distractores
    AI-->>U: Despliega 10 preguntas de selección múltiple
    
    U->>AI: Envía respuestas seleccionadas
    AI->>AI: Evalúa respuestas de forma determinista y calcula porcentaje

    Note over U,DB: 4. DECISION DE PROGRESION Y GESTION DE CONECTIVIDAD (RF-009)
    alt Calificación es 70 por ciento o más - Aprobado
        AI-->>U: Muestra pantalla de éxito y desbloqueo de Nivel siguiente
        alt Hay Conexión a Internet
            U->>DB: Escribe progreso, fecha y nivel desbloqueado
            DB-->>U: Confirma persistencia remota
        else Modo Sin Conexión - Offline
            U->>SW: Almacena resultado en cola local IndexedDB
            SW-->>U: Muestra aviso de guardado local para sincronizar luego
        end
    else Calificación es menor a 70 por ciento - Reprobado
        AI-->>U: Muestra desglose formativo de errores
        AI-->>U: Habilita botón de reintento con nuevas preguntas regeneradas
    end

    Note over U,DB: 5. RESINCRONIZACION EN SEGUNDO PLANO
    opt Cuando se detecta restablecimiento de red
        SW->>DB: Dispara Background Sync con registros pendientes de IndexedDB
        DB-->>SW: Confirma sincronización exitosa de métricas y niveles
        SW-->>U: Notificación silenciosa de progreso sincronizado
    end
```

### 6.1 Diagrama de Flujo de Estados del Sistema

```mermaid
stateDiagram-v2
    [*] --> AccesoPlataforma
    
    state AccesoPlataforma {
        [*] --> VerificacionConexion
        VerificacionConexion --> CargaCache : Modo Offline
        VerificacionConexion --> AutenticacionRemota : Modo Online
        AutenticacionRemota --> Dashboard
        CargaCache --> Dashboard
    }

    Dashboard --> SeleccionNivel
    
    state SeleccionNivel {
        [*] --> ValidarEstadoNivel
        ValidarEstadoNivel --> NivelBloqueado : Nota previa insuficiente
        ValidarEstadoNivel --> NivelHabilitado : Nivel 1 o nivel aprobado
        NivelBloqueado --> [*] : Muestra candado visual
    }

    NivelHabilitado --> SesionEstudio
    
    state SesionEstudio {
        [*] --> VisualizarTarjetasWebP
        VisualizarTarjetasWebP --> ClasificarPalabra : Repasar o Aprendida
        ClasificarPalabra --> FinalizarLeccion
    }

    FinalizarLeccion --> EvaluacionIA
    
    state EvaluacionIA {
        [*] --> GenerarPermutacionesLocal
        GenerarPermutacionesLocal --> ResponderCuestionario
        ResponderCuestionario --> CalcularPuntuacion
        CalcularPuntuacion --> DictamenEvaluacion
    }

    DictamenEvaluacion --> NivelHabilitado : Reprobado menor a 70 por ciento
    DictamenEvaluacion --> PersistenciaProgreso : Aprobado al 70 por ciento o mas

    state PersistenciaProgreso {
        [*] --> ComprobarRed
        ComprobarRed --> GuardarFirestore : Conexión activa
        ComprobarRed --> EncolarIndexedDB : Conexión nula
        EncolarIndexedDB --> EsperaReconexion
        EsperaReconexion --> GuardarFirestore : Evento reconexión
    }

    PersistenciaProgreso --> [*] : Nivel siguiente accesible
```

---

## 7. Diagramas de Actividades Específicos por Caso de Uso Clave

### 7.1 Actividad A: Ciclo de Vida del Motor Determinista de Preguntas (RF-005)

```mermaid
flowchart TD
    START([Inicio: Evaluación Solicitada]) --> FETCH[Obtener lista de oraciones base del nivel actual]
    FETCH --> CHECK_EMPTY{¿Existen oraciones<br/>aprobadas?}
    
    CHECK_EMPTY -->|No| ERROR_STATE[Mostrar aviso: Nivel sin contenido certificado]
    CHECK_EMPTY -->|Sí| LOOP_START[Iterar sobre el banco hasta completar 10 preguntas]
    
    LOOP_START --> SEL_SENTENCE[Seleccionar oración base disponible]
    SEL_SENTENCE --> EXTRACT_LEMMA[Extraer raíz verbal, sujeto y objeto]
    EXTRACT_LEMMA --> PERMUTE[Generar permutación morfológica controlada]
    
    PERMUTE --> QUERY_DISTRACTORS[Buscar en el léxico del nivel 3 distractores<br/>de la misma clase gramatical]
    
    QUERY_DISTRACTORS --> VALIDATE_DIST{¿Distractores pertenecen<br/>al mismo campo semántico?}
    VALIDATE_DIST -->|No| QUERY_DISTRACTORS
    VALIDATE_DIST -->|Sí| SHUFFLE[Mezclar aleatoriamente 1 opción correcta y 3 distractores]
    
    SHUFFLE --> COLLECT_ITEM[Añadir pregunta a la batería del test]
    COLLECT_ITEM --> COUNT_CHECK{¿Total de preguntas es 10?}
    
    COUNT_CHECK -->|No| LOOP_START
    COUNT_CHECK -->|Sí| DISPLAY_TEST[Desplegar cuestionario interactivo en pantalla]
    
    DISPLAY_TEST --> CAPTURE[Capturar selecciones del estudiante]
    CAPTURE --> SUBMIT[Envío de respuestas por el usuario]
    
    SUBMIT --> SCORE_CALC[Calcular total de aciertos sobre 10]
    SCORE_CALC --> THRESHOLD{¿Aciertos son 7 o más?}
    
    THRESHOLD -->|Aprobado| SAVE_SUCCESS[Registrar aprobación y habilitar nuevo nivel]
    THRESHOLD -->|Reprobado| RETRY_STATE[Ofrecer retroalimentación pedagógica y reintento]
    
    SAVE_SUCCESS --> END_NODE([Fin de Evaluación])
    RETRY_STATE --> END_NODE
    ERROR_STATE --> END_NODE

    classDef proc fill:#0f172a,stroke:#38bdf8,stroke-width:1px,color:#ffffff;
    classDef decision fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    classDef success fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef fail fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#ffffff;

    class FETCH,LOOP_START,SEL_SENTENCE,EXTRACT_LEMMA,PERMUTE,QUERY_DISTRACTORS,SHUFFLE,COLLECT_ITEM,DISPLAY_TEST,CAPTURE,SUBMIT,SCORE_CALC proc;
    class CHECK_EMPTY,VALIDATE_DIST,COUNT_CHECK,THRESHOLD decision;
    class SAVE_SUCCESS success;
    class ERROR_STATE,RETRY_STATE fail;
```

---

### 7.2 Actividad B: Funcionamiento Offline-First y Background Sync (RF-009)

```mermaid
flowchart TD
    A([Estudiante interactúa con la PWA]) --> B{¿Hay conexión de red activa?}
    
    B -->|Con Conexión| C[Petición estándar al servidor o Firebase]
    C --> D[Service Worker intercepta la respuesta]
    D --> E[Almacena copia en Cache Storage local]
    E --> F[Renderiza vista al usuario]
    
    B -->|Sin Conexión| G[Service Worker detecta fallo de red]
    G --> H[Inspecciona Cache Storage local]
    H --> I{¿Recurso disponible<br/>en caché?}
    
    I -->|Sí| J[Sirve lección y WebP desde Caché local]
    I -->|No| K[Despliega pantalla amigable de recurso no descargado]
    
    J --> L[Estudiante completa estudio o evaluación]
    L --> M[Intento de enviar nota a la nube]
    M --> N{¿Se logró comunicar<br/>con Firestore?}
    
    N -->|Sí| O[Progreso consolidado en la nube]
    N -->|No| P[Registrar transacción en tabla local IndexedDB]
    P --> Q[Registrar tarea de Background Sync en el navegador]
    
    Q --> R[Esperar evento de red online del navegador]
    R --> S[Disparador de Service Worker: vaciar cola de sincronización]
    S --> T[Transmitir lotes de respuestas a Cloud Firestore]
    T --> U[Eliminar registros sincronizados de IndexedDB]
    U --> V([Fin: Base de datos sincronizada])
    O --> V
    F --> V
    K --> V

    classDef normal fill:#0f172a,stroke:#38bdf8,stroke-width:1px,color:#ffffff;
    classDef cond fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    classDef ok fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef warn fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#ffffff;

    class A,C,D,E,F,G,H,J,L,M,P,Q,R,S,T,U normal;
    class B,I,N cond;
    class O,V ok;
    class K warn;
```

---

## 8. Matriz de Auditoría de Inteligencia Artificial (Gobernanza de Modelos UML y ERD)

De acuerdo con las exigencias académicas y éticas de la Universidad Privada Domingo Savio (UPDS), esta sección transparenta qué componentes estructurales, de modelado de datos y de comportamiento fueron generados o sugeridos por modelos de Inteligencia Artificial y de qué manera el equipo humano de desarrollo los adaptó y corrigió para ajustarse a los requerimientos del proyecto.

### Tabla 1
*Matriz de Auditoría de Componentes Estructurales, de Datos y de Comportamiento UML*

| Identificador | Componente / Diagrama | Propuesta Inicial de la IA | Ajuste Crítico Realizado por el Equipo Humano | Justificación y Fuente de Cambio |
|:---:|:---|:---|:---|:---|
| **AUD-01** | Diagrama de Arquitectura: Motor de IA (RF-005) | La IA propuso integrar una API externa REST de OpenAI/Gemini para generar preguntas mediante prompts en lenguaje natural. | **Se descartó la API externa.** Se sustituyó por un Motor Determinista local en TypeScript basado en permutaciones morfológicas y banco estático. | **Restricción de Presupuesto $0 (SRS 3.3)** y necesidad de ejecución offline en áreas rurales (RF-009). Cero alucinaciones lingüísticas. |
| **AUD-02** | Diagrama de Casos de Uso: Criterio de Aprobación (RF-003) | La IA propuso un umbral estándar de gamificación del 50% o simple avance por lectura lineal. | **Se impuso un umbral estricto del 70%** como precondición formal para el caso de uso `Desbloquear Nivel`. | **Validación con la Lic. Quispe Mamani (12/09/2026)**: El 70% asegura fijación cognitiva sin frustración pedagógica. |
| **AUD-03** | Diagrama de Casos de Uso: Contenido Comunitario (RF-007) | La IA propuso aprobación directa por cualquier usuario mediante un sistema de "votos positivos" tipo Reddit. | **Se estableció un flujo estricto de Doble Validación Docente** con cuarentena obligatoria en estado `pendiente`. | **Requisito de Sostenibilidad Cultural RS-003**: Evitar errores ortográficos, variantes no estandarizadas o préstamos forzados del castellano o aymara. |
| **AUD-04** | Diagrama de Actividades: Generador de Distractores | La IA propuso selección puramente aleatoria de palabras del diccionario global como distractores. | **Se implementó restricción semántica:** Los distractores deben pertenecer a la misma categoría gramatical y campo semántico del nivel en curso. | **Dictamen Pedagógico Stakeholder:** Previene que el estudiante identifique la respuesta correcta por simple descarte de opciones absurdas. |
| **AUD-05** | Diagrama de Datos (ERD): Entidad de Oraciones y Retos | La IA diseñó una sola relación simple `Usuario 1:N OracionBase` sin discriminar roles ni estados de revisión. | **Se diseñó doble relación de asociación independiente:** `autor_id` y `validador_id`, prohibiendo que coincidan. | **Principio de Doble Validación y Cuatro Ojos**: Ningún docente puede aprobar sus propios reactivos pedagógicos. |
| **AUD-06** | Diagrama de Datos (ERD): Detalle de Preguntas | La IA propuso almacenar las preguntas de evaluación como texto plano en un string JSON desnormalizado en la tabla de usuario. | **Se definió la entidad débil `DETALLE_PREGUNTA`** con cardinalidad 1:N hacia `EVALUACION` y claves foráneas tipadas. | **Rigor de Normalización e Integridad**: Permite auditar qué reactivos fallan con mayor frecuencia para mejora curricular continua. |
| **AUD-07** | Diagrama de Arquitectura: Capa de Presentación (RF-010) | La IA propuso un SPA tradicional en React pesado con Tailwind genérico y gráficos complejos de alta resolución. | **Se adoptó Astro SSG + Islands con tokens andinos**, limitando el consumo total a < 150MB de RAM y assets WebP < 100KB. | **Requisito No Funcional RNF-001 y RS-002**: Garantizar compatibilidad con dispositivos de gama de entrada (2GB RAM) frecuentes en Sucre. |
| **AUD-08** | Diagrama de Casos de Uso y Datos: Panel Docente (RF-006) | La IA omitió el contexto etnográfico, incluyendo únicamente los campos `palabra_quechua` y `traduccion_espanol`. | **Se añadió el campo obligatorio `contexto_cultural`** en el caso de uso y en la tabla de persistencia `ORACION_BASE`. | **Observación Docente (Minuta 12/09/2026)**: En quechua, la significación de la frase depende del ámbito de interacción comunitaria (*ayllu*, siembra, familia). |

*Nota.* Elaboración propia por el equipo de desarrollo UPDS en cumplimiento de las directrices de auditoría y gobernanza ética de IA para la materia de Ingeniería de Software.

---

## 9. Conclusiones y Trazabilidad con el Documento Formal

1. **Alineación con el Estándar IEEE Std 830-1998:** Cada diagrama presentado en este mapa se correlaciona de manera biunívoca con la especificación de requisitos formalizada en el informe `Docs/Informe_SRS_APA7_Bloque2.pdf` y la presentación `Docs/presentacion_srs_bloque2.html`.
2. **Factibilidad Técnica y Sostenibilidad:** El modelo arquitectónico y de modelado de datos no solo resuelve los requerimientos funcionales básicos de aprendizaje (RF-001 a RF-005), sino que blinda el sistema frente a contingencias reales del contexto boliviano: conectividad deficiente mediante Service Workers (RF-009), gratuidad operativa total con IA determinista ($0.00 de costos recurrentes) y ligereza en dispositivos móviles económicos (RS-002).
3. **Soberanía y Pertinencia Pedagógica:** La estructura de casos de uso, entidades asociativas y actividades asegura que la plataforma permanezca fiel a la variante dialectal Quechua Chanka/Collao de Chuquisaca, otorgando a los docentes el control absoluto sobre la moderación de los datos que nutren la inteligencia del sistema.

---

## 10. Referencias en Formato APA 7ma Edición

<div style="padding-left: 2em; text-indent: -2em;">

Cerrón-Palomino, R. (2003). *Lingüística quechua* (2.ª ed.). Centro de Estudios Regionales Andinos Bartolomé de Las Casas.

Constitución Política del Estado Plurinacional de Bolivia. (2009). *Gaceta Oficial del Estado Plurinacional de Bolivia*. La Paz, Bolivia.

Elmasri, R., & Navathe, S. B. (2017). *Fundamentals of database systems* (7.ª ed.). Pearson.

IEEE Computer Society. (2011). *IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications*. IEEE. https://doi.org/10.1109/IEEESTD.1998.88286

Ministerio de Educación del Estado Plurinacional de Bolivia. (2023). *Currículo Base del Sistema Educativo Plurinacional: Educación Intracultural, Intercultural y Plurilingüe*. La Paz, Bolivia.

Pressman, R. S., & Maxim, B. R. (2020). *Software engineering: A practitioner's approach* (9.ª ed.). McGraw-Hill Education.

Sommerville, I. (2016). *Software engineering* (10.ª ed.). Pearson Education.

Wynne, M., & Hellesøy, A. (2017). *The Cucumber book: Behaviour-driven development for testers and developers* (2.ª ed.). Pragmatic Bookshelf.

</div>
