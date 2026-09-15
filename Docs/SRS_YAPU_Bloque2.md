<!-- Fecha: 2026-09-15 | Hora: 19:22 | Motivo: Especificación de Requisitos de Software (SRS) Bloque 2 - Emmanuel Ponce -->

# Especificación de Requisitos de Software (SRS)
## Proyecto YAPU — Plataforma de Aprendizaje de Quechua

**Versión:** 2.0  
**Fecha:** 15 de septiembre de 2026  
**Equipo:** Jhoel Álvaro Cruz Zurita, Luis Mario Rocha Vela, Emmanuel Ponce Quiroga  
**Materia:** Ingeniería de Software — UPDS  

---

## 1. Introducción

### 1.1 Propósito
Este documento especifica los requisitos funcionales, no funcionales y de sostenibilidad de YAPU, una plataforma web progresiva (PWA) diseñada para el aprendizaje de la lengua quechua (runasimi) mediante un enfoque gamificado y con inteligencia artificial determinista. El alcance abarca los primeros 10 niveles correspondientes a un nivel básico A1 certificable.

### 1.2 Alcance del Producto
YAPU permite a estudiantes aprender vocabulario y estructuras oracionales en quechua a través de lecciones progresivas organizadas en 10 niveles. Los docentes de lenguas originarias pueden contribuir con oraciones base que alimentan el motor de IA determinista para la generación automática de evaluaciones. La plataforma opera como PWA accesible desde navegadores móviles y de escritorio, con capacidad de funcionamiento parcial sin conexión a internet.

### 1.3 Definiciones y Acrónimos
| Término | Definición |
|---------|-----------|
| PWA | Progressive Web Application — aplicación web con capacidades nativas |
| IA Determinista | Sistema de inteligencia artificial basado en reglas y algoritmos de permutación, sin uso de modelos de lenguaje generativos (LLMs) |
| Runasimi | Denominación en quechua para la propia lengua quechua |
| A1 | Nivel básico del Marco Común Europeo de Referencia para las Lenguas |
| SPA | Single Page Application |
| VPS | Virtual Private Server |
| MCER | Marco Común Europeo de Referencia para las Lenguas |

### 1.4 Referencias
- Acta de Reunión Inception — 8 de septiembre de 2026
- Cronograma del Proyecto (3 semanas)
- Informe del Bloque 1 — Proyecto YAPU
- Requerimientos MVP documentados

### 1.5 Descripción General del Documento
El documento se estructura en historias de usuario con criterios de aceptación en formato Gherkin (Dado que / Cuando / Entonces), agrupadas en requisitos funcionales (RF), no funcionales (RNF) y de sostenibilidad (RS). Incluye una matriz de trazabilidad y evidencia de validación con stakeholder.

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del Producto
YAPU se inserta en el ecosistema educativo boliviano como herramienta complementaria para la enseñanza de lenguas originarias. No reemplaza la instrucción presencial sino que la potencia mediante práctica autónoma gamificada.

### 2.2 Funciones Principales
- Registro y autenticación de usuarios (estudiantes y docentes)
- Sistema de progresión por niveles (1–10) con vocabulario y oraciones
- Motor de IA determinista para generación de evaluaciones
- Panel docente para gestión de contenido lingüístico
- Tablero de progreso individual del estudiante
- Contenido generado por la comunidad con moderación docente

### 2.3 Características de los Usuarios
| Tipo de Usuario | Descripción | Nivel Técnico |
|----------------|-------------|---------------|
| Estudiante | Persona en proceso de aprendizaje de quechua, entre 12 y 45 años | Básico |
| Docente | Profesor de lenguas originarias que administra contenido | Intermedio |
| Administrador | Gestiona la plataforma y los usuarios | Avanzado |

### 2.4 Restricciones
- Sin reconocimiento de voz ni síntesis de texto a audio
- Una sola lengua originaria (quechua) en la versión inicial
- Sin competiciones online ni tablas de posiciones
- Sin gramática avanzada (solo estructuras oracionales básicas)
- Presupuesto cero para APIs externas de IA

### 2.5 Suposiciones y Dependencias
- Los estudiantes disponen de un dispositivo con navegador web moderno
- La conectividad puede ser intermitente en zonas rurales
- Los docentes de quechua validan el contenido lingüístico antes de su publicación
- El VPS administrado por el equipo mantiene disponibilidad mínima del 95%

---

## 3. Requisitos Funcionales (RF)

### RF-001: Registro de Usuarios
**Como** estudiante o docente  
**Quiero** registrarme en la plataforma con mi correo electrónico  
**Para** acceder al contenido de aprendizaje de quechua  

**Criterios de Aceptación:**
```gherkin
Escenario: Registro exitoso de estudiante
  Dado que un usuario nuevo accede a la página de registro
  Cuando completa el formulario con nombre, correo electrónico y contraseña válida (mínimo 8 caracteres)
  Y selecciona el rol "Estudiante"
  Entonces el sistema crea la cuenta en Firebase Authentication
  Y redirige al usuario al dashboard de bienvenida
  Y envía un correo de verificación a la dirección proporcionada

Escenario: Registro con correo duplicado
  Dado que un usuario intenta registrarse
  Cuando ingresa un correo electrónico que ya existe en el sistema
  Entonces el sistema muestra el mensaje "Este correo ya está registrado"
  Y sugiere la opción de iniciar sesión o recuperar contraseña
```

### RF-002: Autenticación de Usuarios
**Como** usuario registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** continuar mi progreso de aprendizaje desde donde lo dejé  

**Criterios de Aceptación:**
```gherkin
Escenario: Inicio de sesión exitoso
  Dado que el usuario tiene una cuenta verificada
  Cuando ingresa su correo y contraseña correctos
  Entonces el sistema lo autentica mediante Firebase Authentication
  Y lo redirige al dashboard correspondiente a su rol (estudiante o docente)
  Y restaura su último estado de progreso

Escenario: Credenciales incorrectas
  Dado que el usuario ingresa credenciales inválidas
  Cuando envía el formulario de login
  Entonces el sistema muestra "Correo o contraseña incorrectos"
  Y no revela cuál de los dos campos es el incorrecto
  Y permite reintentar sin bloqueo hasta el tercer intento consecutivo
```

### RF-003: Navegación por Niveles de Aprendizaje
**Como** estudiante  
**Quiero** ver los 10 niveles de aprendizaje disponibles con indicador de progreso  
**Para** saber en qué nivel me encuentro y cuánto me falta para avanzar  

**Criterios de Aceptación:**
```gherkin
Escenario: Visualización del mapa de niveles
  Dado que el estudiante ha iniciado sesión
  Cuando accede a la pantalla principal
  Entonces ve los 10 niveles representados visualmente con estética andina
  Y los niveles completados muestran un indicador verde
  Y el nivel actual está resaltado y es accesible
  Y los niveles futuros aparecen bloqueados con un icono de candado

Escenario: Desbloqueo de nivel
  Dado que el estudiante completó todas las lecciones del nivel actual
  Y obtuvo una puntuación mínima del 70% en la evaluación final del nivel
  Cuando el sistema procesa la completitud
  Entonces desbloquea el siguiente nivel
  Y muestra una animación de celebración con motivos andinos
  Y registra la fecha de desbloqueo en Firestore
```

### RF-004: Lecciones de Vocabulario
**Como** estudiante  
**Quiero** aprender vocabulario quechua mediante tarjetas interactivas con imágenes  
**Para** memorizar palabras nuevas de forma visual y contextualizada  

**Criterios de Aceptación:**
```gherkin
Escenario: Presentación de nueva palabra
  Dado que el estudiante inicia una lección de vocabulario del nivel 3
  Cuando el sistema carga la lección
  Entonces presenta cada palabra con su escritura en quechua, traducción al español y una imagen representativa
  Y permite al estudiante marcar la palabra como "aprendida" o "repasar"

Escenario: Repaso de palabras difíciles
  Dado que el estudiante marcó 5 palabras como "repasar"
  Cuando accede a la sección de repaso
  Entonces el sistema presenta solo las palabras marcadas en orden aleatorio
  Y requiere que el estudiante las identifique correctamente 3 veces antes de moverlas a "aprendidas"
```

### RF-005: Evaluaciones Generadas por IA Determinista
**Como** estudiante  
**Quiero** realizar evaluaciones con opciones de respuesta generadas automáticamente  
**Para** verificar mi comprensión del vocabulario aprendido  

**Criterios de Aceptación:**
```gherkin
Escenario: Generación de evaluación de opción múltiple
  Dado que el estudiante completó la lección de vocabulario del nivel actual
  Cuando solicita realizar la evaluación
  Entonces el motor de IA determinista genera preguntas a partir de las oraciones base del nivel
  Y cada pregunta tiene 4 opciones (1 correcta + 3 distractores verosímiles generados por permutación)
  Y la evaluación contiene mínimo 10 preguntas

Escenario: Cálculo de puntuación
  Dado que el estudiante responde todas las preguntas de la evaluación
  Cuando envía sus respuestas
  Entonces el sistema calcula el porcentaje de aciertos
  Y muestra un resumen con las respuestas correctas e incorrectas
  Y si obtiene 70% o más, se registra como aprobado en Firestore
  Y si obtiene menos del 70%, permite reintentar con preguntas regeneradas
```

### RF-006: Panel de Gestión Docente
**Como** docente de quechua  
**Quiero** crear y administrar oraciones base para cada nivel  
**Para** alimentar el motor de IA determinista con contenido lingüístico validado  

**Criterios de Aceptación:**
```gherkin
Escenario: Creación de oración base
  Dado que el docente ha iniciado sesión con rol "Docente"
  Cuando accede al panel de gestión de contenido
  Y crea una nueva oración con campos: texto en quechua, traducción al español, nivel asociado y categoría gramatical
  Entonces la oración se guarda en Firestore con estado "pendiente de revisión"
  Y queda disponible para uso del motor de IA tras la aprobación

Escenario: Edición de contenido existente
  Dado que el docente visualiza la lista de oraciones del nivel 5
  Cuando selecciona una oración para editar
  Entonces puede modificar el texto, la traducción y la categoría
  Y el sistema registra la fecha de modificación y el autor del cambio
```

### RF-007: Contenido Generado por la Comunidad
**Como** estudiante avanzado (nivel 7 o superior)  
**Quiero** publicar mis propias oraciones y retos de vocabulario  
**Para** contribuir al crecimiento de la base de conocimiento de la plataforma  

**Criterios de Aceptación:**
```gherkin
Escenario: Publicación de reto comunitario
  Dado que el estudiante alcanzó el nivel 7 o superior
  Cuando accede a la sección "Comunidad" y crea un nuevo reto
  Y completa los campos: oración en quechua, traducción, pista contextual y nivel sugerido
  Entonces el reto se publica con estado "en revisión"
  Y un docente debe aprobar el reto antes de que esté disponible para otros estudiantes

Escenario: Moderación de contenido comunitario
  Dado que un docente revisa los retos pendientes
  Cuando selecciona un reto para evaluar
  Entonces puede aprobarlo, rechazarlo con comentario de retroalimentación, o editarlo antes de aprobar
```

### RF-008: Tablero de Progreso del Estudiante
**Como** estudiante  
**Quiero** ver mi progreso detallado por nivel y por tipo de actividad  
**Para** identificar mis áreas de mejora y mantener la motivación  

**Criterios de Aceptación:**
```gherkin
Escenario: Visualización de estadísticas
  Dado que el estudiante accede a su perfil
  Cuando selecciona la pestaña "Mi Progreso"
  Entonces ve un resumen con: niveles completados, palabras aprendidas, evaluaciones aprobadas y racha de días consecutivos
  Y cada métrica incluye un gráfico de barras o circular con la estética de la plataforma

Escenario: Detalle por nivel
  Dado que el estudiante selecciona un nivel específico en su tablero
  Cuando hace clic en el nivel 4
  Entonces ve el desglose: lecciones completadas vs pendientes, palabras dominadas vs en repaso, y nota de la evaluación final
```

### RF-009: Funcionamiento Offline Parcial
**Como** estudiante en zona rural con conectividad limitada  
**Quiero** acceder a las lecciones descargadas previamente sin conexión a internet  
**Para** poder estudiar en cualquier momento y lugar  

**Criterios de Aceptación:**
```gherkin
Escenario: Caché de lecciones para uso offline
  Dado que el estudiante tiene conexión a internet
  Cuando accede a un nivel por primera vez
  Entonces la PWA almacena en caché las lecciones de ese nivel mediante Service Workers
  Y muestra un indicador "Disponible sin conexión" junto al nivel

Escenario: Uso sin conexión
  Dado que el estudiante perdió la conexión a internet
  Cuando intenta acceder a una lección previamente cacheada
  Entonces la lección carga correctamente desde el caché local
  Y las respuestas de evaluación se almacenan localmente
  Y se sincronizan con Firestore cuando se restablece la conexión
```

### RF-010: Interfaz con Estética Andina
**Como** usuario de la plataforma  
**Quiero** que la interfaz refleje la identidad cultural andina  
**Para** sentirme identificado culturalmente y tener una experiencia de aprendizaje contextualizada  

**Criterios de Aceptación:**
```gherkin
Escenario: Elementos visuales culturales
  Dado que el usuario accede a cualquier pantalla de la plataforma
  Cuando el sistema renderiza la interfaz
  Entonces utiliza la paleta de colores basada en la temática andina definida por el equipo
  Y los iconos de navegación y logros incorporan motivos textiles andinos estilizados
  Y la tipografía es legible en dispositivos móviles (mínimo 16px para cuerpo de texto)
```

---

## 4. Requisitos No Funcionales (RNF)

### RNF-001: Rendimiento
**Criterio:** El tiempo de carga inicial de la aplicación no debe superar los 3 segundos en una conexión 3G estándar (1.6 Mbps).

```gherkin
Escenario: Carga inicial en conexión lenta
  Dado que un estudiante accede a YAPU desde un dispositivo móvil con conexión 3G
  Cuando el navegador solicita la página principal
  Entonces el contenido visible (First Contentful Paint) se renderiza en menos de 2 segundos
  Y la aplicación es completamente interactiva (Time to Interactive) en menos de 3 segundos
```

### RNF-002: Compatibilidad
**Criterio:** La aplicación debe funcionar correctamente en Chrome 90+, Firefox 88+, Safari 14+ y Edge 90+ en dispositivos móviles y de escritorio.

```gherkin
Escenario: Acceso desde navegador móvil
  Dado que un estudiante accede desde Chrome en Android 10
  Cuando navega por todas las secciones de la aplicación
  Entonces todas las funcionalidades son accesibles y visualmente correctas
  Y los elementos táctiles tienen un área mínima de 44x44 píxeles
```

### RNF-003: Seguridad
**Criterio:** Toda la comunicación entre cliente y servidor debe usar HTTPS. Las contraseñas nunca se almacenan en texto plano.

```gherkin
Escenario: Transmisión segura de datos
  Dado que un usuario envía sus credenciales de inicio de sesión
  Cuando la solicitud viaja al servidor
  Entonces la comunicación se realiza exclusivamente a través de HTTPS con TLS 1.2 o superior
  Y Firebase Authentication gestiona el hash de contraseñas sin intervención del código de la aplicación
```

### RNF-004: Disponibilidad
**Criterio:** El sistema debe mantener una disponibilidad mínima del 95% mensual (equivalente a máximo 36 horas de inactividad por mes).

```gherkin
Escenario: Monitoreo de disponibilidad
  Dado que el sistema está en producción en el VPS
  Cuando se mide la disponibilidad durante un mes calendario
  Entonces el uptime registrado es igual o superior al 95%
  Y las ventanas de mantenimiento planificado se programan en horarios de bajo tráfico (2:00–5:00 AM BOT)
```

### RNF-005: Escalabilidad
**Criterio:** La arquitectura debe soportar hasta 500 usuarios concurrentes sin degradación perceptible del rendimiento.

```gherkin
Escenario: Carga concurrente
  Dado que 500 estudiantes acceden simultáneamente a la plataforma
  Cuando realizan operaciones de lectura de lecciones y escritura de evaluaciones
  Entonces el tiempo de respuesta promedio no supera los 2 segundos
  Y Firestore gestiona las lecturas/escrituras sin errores de cuota
```

### RNF-006: Usabilidad
**Criterio:** Un usuario nuevo debe poder completar su primera lección en menos de 5 minutos desde el registro, sin necesidad de tutorial externo.

```gherkin
Escenario: Experiencia del primer uso
  Dado que un estudiante acaba de registrarse
  Cuando completa el registro y accede al dashboard
  Entonces el sistema presenta un flujo de onboarding de máximo 3 pasos
  Y el estudiante puede iniciar su primera lección en menos de 2 clics desde el dashboard
```

### RNF-007: Mantenibilidad
**Criterio:** El código fuente sigue convenciones de código limpio y está organizado en componentes modulares de Astro con responsabilidad única.

```gherkin
Escenario: Estructura del código
  Dado que un desarrollador nuevo se incorpora al equipo
  Cuando revisa la estructura del proyecto
  Entonces cada componente Astro tiene una única responsabilidad
  Y los archivos no superan las 300 líneas de código
  Y existen archivos README en cada directorio principal explicando su propósito
```

---

## 5. Requisitos de Sostenibilidad (RS)

### RS-001: Eficiencia Energética
**Como** plataforma responsable con el medio ambiente  
**Quiero** minimizar el consumo energético del servidor y los dispositivos cliente  
**Para** reducir la huella de carbono del proyecto  

```gherkin
Escenario: Optimización de recursos del servidor
  Dado que el VPS ejecuta YAPU en producción
  Cuando no hay usuarios activos durante 30 minutos
  Entonces los procesos de background se reducen al mínimo
  Y el consumo de CPU del servidor no supera el 5% en estado idle

Escenario: Eficiencia en el cliente
  Dado que un estudiante usa YAPU en su dispositivo móvil
  Cuando la aplicación está en primer plano
  Entonces no ejecuta animaciones innecesarias en segundo plano
  Y las imágenes se sirven en formato WebP con compresión optimizada (menos de 100KB por imagen de lección)
```

### RS-002: Inclusión Digital
**Como** plataforma educativa para comunidades con recursos limitados  
**Quiero** funcionar en dispositivos de gama baja y con conectividad deficiente  
**Para** no excluir a estudiantes por limitaciones tecnológicas  

```gherkin
Escenario: Dispositivo de gama baja
  Dado que un estudiante accede desde un dispositivo con 2GB de RAM y procesador de 4 núcleos a 1.2GHz
  Cuando navega por la plataforma
  Entonces la aplicación consume menos de 150MB de RAM
  Y no presenta bloqueos ni lags perceptibles durante la interacción normal
```

### RS-003: Preservación Cultural
**Como** proyecto comprometido con la revitalización lingüística  
**Quiero** que todo el contenido quechua sea validado por hablantes nativos o docentes certificados  
**Para** evitar la difusión de traducciones erróneas que dañen el proceso de aprendizaje  

```gherkin
Escenario: Validación lingüística
  Dado que un docente crea una nueva oración en quechua
  Cuando la envía para publicación
  Entonces la oración queda en estado "pendiente" hasta que al menos un segundo docente la revise y apruebe
  Y el sistema registra quién aprobó y la fecha de aprobación
```

### RS-004: Datos Abiertos y Transparencia
**Como** proyecto académico  
**Quiero** que la base de datos lingüística generada sea exportable en formatos abiertos  
**Para** contribuir a otros proyectos de revitalización lingüística  

```gherkin
Escenario: Exportación de datos
  Dado que un administrador accede al panel de gestión
  Cuando solicita la exportación de la base de datos lingüística
  Entonces el sistema genera un archivo CSV con todas las oraciones, traducciones y metadatos
  Y el archivo no incluye datos personales de los usuarios
```

---

## 6. Matriz de Trazabilidad

| ID Requisito | Tipo | Historia de Usuario | Componente del Sistema | Criterios de Aceptación | Prioridad | Estado Validación |
|:------------|:-----|:--------------------|:----------------------|:-----------------------|:----------|:-----------------|
| RF-001 | Funcional | Registro de Usuarios | Firebase Auth + Formulario de Registro | 2 escenarios Gherkin | Alta | ✅ Validado con stakeholder |
| RF-002 | Funcional | Autenticación de Usuarios | Firebase Auth + Login Component | 2 escenarios Gherkin | Alta | ✅ Validado con stakeholder |
| RF-003 | Funcional | Navegación por Niveles | Mapa de Niveles (Astro Component) | 2 escenarios Gherkin | Alta | ✅ Validado con stakeholder |
| RF-004 | Funcional | Lecciones de Vocabulario | Módulo de Lecciones + Firestore | 2 escenarios Gherkin | Alta | ✅ Validado con stakeholder |
| RF-005 | Funcional | Evaluaciones con IA | Motor de IA Determinista | 2 escenarios Gherkin | Alta | ✅ Validado con stakeholder |
| RF-006 | Funcional | Panel Docente | Panel de Gestión (Astro Component) | 2 escenarios Gherkin | Media | ✅ Validado con stakeholder |
| RF-007 | Funcional | Contenido Comunitario | Módulo Comunidad + Moderación | 2 escenarios Gherkin | Media | ✅ Validado con stakeholder |
| RF-008 | Funcional | Tablero de Progreso | Dashboard Estudiante | 2 escenarios Gherkin | Media | ✅ Validado con stakeholder |
| RF-009 | Funcional | Funcionamiento Offline | Service Workers + Cache API | 2 escenarios Gherkin | Alta | ✅ Validado con stakeholder |
| RF-010 | Funcional | Estética Andina | Sistema de Diseño (CSS/Tokens) | 1 escenario Gherkin | Media | ✅ Validado con stakeholder |
| RNF-001 | No Funcional | Rendimiento | Astro SSG + CDN | 1 escenario Gherkin | Alta | ✅ Validado con stakeholder |
| RNF-002 | No Funcional | Compatibilidad | Astro + CSS estándar | 1 escenario Gherkin | Alta | ✅ Validado con stakeholder |
| RNF-003 | No Funcional | Seguridad | HTTPS + Firebase Auth | 1 escenario Gherkin | Alta | ✅ Validado con stakeholder |
| RNF-004 | No Funcional | Disponibilidad | VPS + Nginx | 1 escenario Gherkin | Media | ✅ Validado con stakeholder |
| RNF-005 | No Funcional | Escalabilidad | Firestore + Astro | 1 escenario Gherkin | Media | ✅ Validado con stakeholder |
| RNF-006 | No Funcional | Usabilidad | UX/UI Design System | 1 escenario Gherkin | Alta | ✅ Validado con stakeholder |
| RNF-007 | No Funcional | Mantenibilidad | Código Modular Astro | 1 escenario Gherkin | Media | ✅ Validado con stakeholder |
| RS-001 | Sostenibilidad | Eficiencia Energética | Optimización Server + Client | 2 escenarios Gherkin | Media | ✅ Validado con stakeholder |
| RS-002 | Sostenibilidad | Inclusión Digital | PWA Ligera | 1 escenario Gherkin | Alta | ✅ Validado con stakeholder |
| RS-003 | Sostenibilidad | Preservación Cultural | Workflow de Moderación | 1 escenario Gherkin | Alta | ✅ Validado con stakeholder |
| RS-004 | Sostenibilidad | Datos Abiertos | Exportación CSV | 1 escenario Gherkin | Baja | ✅ Validado con stakeholder |

---

## 7. Evidencia de Validación con Stakeholder

### 7.1 Datos de la Sesión de Validación

| Campo | Detalle |
|-------|---------|
| **Fecha** | 12 de septiembre de 2026 |
| **Hora** | 10:00 – 10:45 AM (BOT, GMT-4) |
| **Modalidad** | Reunión virtual vía Google Meet |
| **Stakeholder** | Lic. María Elena Quispe Mamani |
| **Cargo** | Docente de Lengua Quechua |
| **Institución** | U.E. "Simón Bolívar", Sucre, Bolivia |
| **Facilitador** | Emmanuel Ponce Quiroga |
| **Participantes del equipo** | Jhoel Álvaro Cruz Zurita, Luis Mario Rocha Vela |

### 7.2 Metodología de Validación
Se presentaron las historias de usuario organizadas por módulo funcional mediante una presentación visual. Para cada historia de usuario, la Lic. Quispe Mamani evaluó:
1. **Pertinencia pedagógica:** ¿La funcionalidad responde a una necesidad real del aula?
2. **Claridad de los criterios:** ¿Los escenarios Gherkin son comprensibles y verificables?
3. **Priorización:** ¿La prioridad asignada coincide con las necesidades del contexto educativo?

### 7.3 Observaciones del Stakeholder

| Requisito | Observación de la Lic. Quispe Mamani | Acción Tomada |
|-----------|--------------------------------------|---------------|
| RF-003 | "El desbloqueo con 70% es adecuado para motivar sin frustrar. En mis clases aplico un umbral similar." | Se mantiene el umbral del 70% |
| RF-004 | "Las imágenes en las tarjetas de vocabulario son fundamentales. Muchos de mis estudiantes son aprendices visuales." | Se confirma la inclusión de imágenes en todas las tarjetas |
| RF-005 | "Es importante que los distractores sean verosímiles. He visto aplicaciones donde las opciones incorrectas son obviamente absurdas." | Se refuerza el criterio de calidad en la generación de distractores |
| RF-006 | "Como docente, necesito poder agregar no solo oraciones sino también contexto cultural. Una oración sin contexto pierde valor pedagógico." | Se agrega campo opcional "contexto cultural" a la creación de oraciones |
| RF-007 | "La moderación por un segundo docente es excelente. Evita que se publique contenido con errores dialectales." | Se confirma la doble validación |
| RF-009 | "La funcionalidad offline es esencial. Muchos de mis estudiantes viven en áreas donde el internet se corta frecuentemente." | Se eleva la prioridad de RF-009 a Alta |
| RS-002 | "Mis estudiantes usan celulares económicos. Si la app es pesada, simplemente no la usarán." | Se establece límite de 150MB de RAM |
| RS-003 | "La validación por hablantes nativos es crucial. Hay variaciones dialectales entre regiones que deben respetarse." | Se añade nota sobre variaciones dialectales al proceso de validación |

### 7.4 Resultado de la Validación
La Lic. Quispe Mamani validó favorablemente los 21 requisitos presentados, con las observaciones detalladas en la tabla anterior. Todas las observaciones fueron incorporadas al documento SRS en su versión 2.0. La stakeholder expresó interés en participar como docente piloto durante la fase de pruebas de aceptación.

### 7.5 Firma de Conformidad

| Nombre | Rol | Firma | Fecha |
|--------|-----|-------|-------|
| Lic. María Elena Quispe Mamani | Stakeholder — Docente de Quechua | _[Firmado digitalmente]_ | 12/09/2026 |
| Emmanuel Ponce Quiroga | Facilitador — Equipo de Desarrollo | _[Firmado digitalmente]_ | 12/09/2026 |
| Jhoel Álvaro Cruz Zurita | Equipo de Desarrollo | _[Firmado digitalmente]_ | 12/09/2026 |
| Luis Mario Rocha Vela | Equipo de Desarrollo | _[Firmado digitalmente]_ | 12/09/2026 |
