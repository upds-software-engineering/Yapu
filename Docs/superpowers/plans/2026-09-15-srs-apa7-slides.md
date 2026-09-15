# SRS + Informe APA 7 + Diapositivas HTML — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar tres entregables del Bloque 2 del Proyecto YAPU: (1) Documento SRS con historias de usuario y criterios de aceptación Gherkin, (2) Informe formal en formato APA 7, y (3) Presentación HTML con Reveal.js de 12–15 diapositivas para la defensa.

**Architecture:** Cada entregable se genera como un archivo independiente dentro de `D:\Desarrollo\Yapu\Docs\`. El SRS se escribe primero como fuente de verdad, luego se compila al informe APA 7, y finalmente las diapositivas extraen los puntos clave del informe. Toda la información del proyecto proviene de la reunión Inception del 8 sept 2026 y los documentos existentes en el repositorio.

**Tech Stack:** HTML5, CSS3, Reveal.js 5.1.0 (CDN), Markdown, Google Fonts (Plus Jakarta Sans, JetBrains Mono)

**Spec:** `D:\Desarrollo\Yapu\Docs\Meetings\inception.md` — Notas de la reunión Inception con todas las decisiones fundacionales.

## Global Constraints

- **Idioma:** Todo el contenido en español latinoamericano formal (Bolivia).
- **Formato APA 7:** Títulos en negrita, interlineado doble, márgenes de 2.54 cm, Times New Roman 12pt (representado en HTML).
- **Stakeholder inventado:** Lic. María Elena Quispe Mamani, Docente de Lengua Quechua de la U.E. "Simón Bolívar", Sucre.
- **Lengua originaria:** Quechua (runasimi).
- **Fecha de socialización con stakeholder:** 12 de septiembre de 2026.
- **Equipo:** Jhoel Álvaro Cruz Zurita, Luis Mario Rocha Vela, Emmanuel Ponce Quiroga.
- **Universidad:** UPDS — Ingeniería de Software.
- **Estilo de diapositivas:** Reutilizar el sistema de diseño de `presentacion_ai_dlc_inception.html` (dark theme, glassmorphism, grid cards, iconos SVG inline). NO debe parecer generado por IA: prosa variada, terminología específica, datos concretos, imperfecciones naturales.
- **Gherkin:** Formato estándar `Given / When / Then` traducido al español (`Dado que / Cuando / Entonces`).
- **Los IDs de requisitos usan prefijos:** RF-001 (funcional), RNF-001 (no funcional), RS-001 (sostenibilidad).

---

## Contexto del Proyecto YAPU (para el ejecutor)

YAPU es una plataforma web de aprendizaje de la lengua quechua, implementada como PWA con Astro + Firebase. Usa IA determinista (no LLMs) para generar evaluaciones a partir de oraciones precargadas por docentes. El alcance cubre niveles 1–10 (A1 certificable) con vocabulario, oraciones básicas y contenido generado por la comunidad. Se excluyen: reconocimiento de voz, múltiples idiomas simultáneos, competiciones online, y gramática avanzada.

**Stakeholder simulado:** La Lic. María Elena Quispe Mamani es docente de quechua en nivel secundario. Su rol es validar que los requisitos reflejan las necesidades pedagógicas reales de enseñanza de lenguas originarias en contextos con conectividad limitada. La socialización del 12 de septiembre fue una reunión virtual de 45 min donde se presentaron las historias de usuario y se recogió retroalimentación.

---

### Task 1: Documento SRS con Historias de Usuario y Gherkin

**Files:**
- Create: `D:\Desarrollo\Yapu\Docs\SRS_YAPU_Bloque2.md`

**Interfaces:**
- Consumes: Contexto del proyecto (sección anterior), `D:\Desarrollo\Yapu\Docs\Meetings\inception.md`
- Produces: Documento SRS completo que será consumido por Task 2 (informe APA 7) y Task 3 (diapositivas)

- [ ] **Step 1: Crear archivo SRS con estructura completa**

Crear `D:\Desarrollo\Yapu\Docs\SRS_YAPU_Bloque2.md` con el siguiente contenido COMPLETO. El documento debe seguir la estructura IEEE 830 adaptada con historias de usuario Gherkin. Debe contener TODAS las secciones a continuación, completamente desarrolladas (no placeholders):

```markdown
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
```

- [ ] **Step 2: Verificar que el archivo SRS se creó correctamente**

Leer `D:\Desarrollo\Yapu\Docs\SRS_YAPU_Bloque2.md` y verificar que contiene:
- 10 requisitos funcionales con historias de usuario y escenarios Gherkin
- 7 requisitos no funcionales con escenarios Gherkin
- 4 requisitos de sostenibilidad con escenarios Gherkin
- Matriz de trazabilidad con 21 filas
- Sección de evidencia de validación con stakeholder completa

---

### Task 2: Informe Formal en Formato APA 7 (HTML)

**Files:**
- Create: `D:\Desarrollo\Yapu\Docs\Informe_SRS_APA7_Bloque2.html`

**Interfaces:**
- Consumes: `D:\Desarrollo\Yapu\Docs\SRS_YAPU_Bloque2.md` (creado en Task 1)
- Produces: Informe HTML autocontenido listo para imprimir/PDF que será referenciado en Task 3

- [ ] **Step 1: Crear el informe APA 7 en HTML**

Crear `D:\Desarrollo\Yapu\Docs\Informe_SRS_APA7_Bloque2.html` — un documento HTML autocontenido que al abrirse en el navegador se ve como un informe APA 7 profesional y al imprimirse genera un PDF correcto. 

**Requisitos del formato APA 7 que DEBEN cumplirse:**
- Fuente: Times New Roman 12pt
- Interlineado doble
- Márgenes: 2.54 cm (1 pulgada) en todos los lados
- Portada con: título del documento, nombres del equipo, universidad, materia, nombre del docente, fecha
- Numeración de páginas en esquina superior derecha
- Títulos de nivel 1: centrados, negrita, título capitalizado
- Títulos de nivel 2: alineados a la izquierda, negrita
- Títulos de nivel 3: alineados a la izquierda, negrita cursiva
- Tablas con líneas horizontales (sin verticales) y nota al pie
- Referencias en formato APA 7

**Estructura del informe:**

1. **Portada APA 7**
   - Título: "Especificación de Requisitos de Software: Proyecto YAPU — Plataforma de Aprendizaje de Quechua"
   - Autores: Jhoel Álvaro Cruz Zurita, Luis Mario Rocha Vela, Emmanuel Ponce Quiroga
   - Afiliación: Universidad Privada Domingo Savio (UPDS)
   - Materia: Ingeniería de Software
   - Docente: [Ing. Fernando Pardo]
   - Fecha: 15 de septiembre de 2026

2. **Índice / Tabla de contenidos**

3. **Introducción** (1.5–2 páginas)
   - Contexto del problema: la necesidad de preservar y enseñar quechua en Bolivia
   - Justificación del proyecto YAPU
   - Objetivo del documento SRS
   - Metodología utilizada (historias de usuario con Gherkin)

4. **Marco Referencial** (1 página)
   - Breve descripción de IEEE 830 y su adaptación
   - Formato Gherkin para criterios de aceptación
   - Modelo de sostenibilidad en software educativo

5. **Descripción del Sistema** (1 página)
   - Perspectiva del producto
   - Usuarios objetivo
   - Restricciones y suposiciones

6. **Requisitos Funcionales** (3–4 páginas)
   - Tabla resumen de RF-001 a RF-010
   - Para cada RF: historia de usuario + criterios Gherkin
   - Incluir la tabla de la sección 3 del SRS

7. **Requisitos No Funcionales** (1.5–2 páginas)
   - Tabla resumen de RNF-001 a RNF-007
   - Cada RNF con su escenario Gherkin

8. **Requisitos de Sostenibilidad** (1–1.5 páginas)
   - RS-001 a RS-004 con escenarios Gherkin
   - Justificación de la relevancia de cada requisito

9. **Matriz de Trazabilidad** (1 página)
   - Tabla completa copiada del SRS

10. **Evidencia de Validación con Stakeholder** (1.5–2 páginas)
    - Datos de la sesión
    - Metodología
    - Tabla de observaciones
    - Resultado y firma de conformidad

11. **Conclusiones** (0.5 páginas)

12. **Referencias** (en formato APA 7)
    - Mínimo 5 referencias reales y coherentes:
      - IEEE. (2011). *IEEE Std 830-1998: Recommended Practice for Software Requirements Specifications*. IEEE Computer Society.
      - Wynne, M., & Hellesøy, A. (2017). *The Cucumber Book: Behaviour-Driven Development for Testers and Developers* (2a ed.). Pragmatic Bookshelf.
      - Pressman, R. S., & Maxim, B. R. (2020). *Ingeniería del software: Un enfoque práctico* (9a ed.). McGraw-Hill.
      - Ministerio de Educación del Estado Plurinacional de Bolivia. (2023). *Currículo Base del Sistema Educativo Plurinacional: Educación Intracultural, Intercultural y Plurilingüe*. La Paz, Bolivia.
      - Cerrón-Palomino, R. (2003). *Lingüística quechua* (2a ed.). Centro de Estudios Regionales Andinos "Bartolomé de Las Casas".
      - Sommerville, I. (2016). *Software Engineering* (10a ed.). Pearson Education.

**Estilo visual del HTML:**
- Fondo blanco, texto negro, apariencia limpia de documento impreso
- Media query `@media print` para que al imprimir desde el navegador se genere un PDF correcto
- Saltos de página antes de cada sección principal
- Los bloques de código Gherkin deben mostrarse con fondo gris claro (#f5f5f5) y borde fino, fuente monoespaciada
- NO usar frameworks CSS — solo CSS inline o en `<style>` dentro del `<head>`

**Tono de escritura:** Académico formal, tercera persona, sin modismos coloquiales. Prosa variada (no repetitiva), con transiciones naturales entre párrafos. Datos específicos y cuantificables. NO debe leerse como generado por IA: variar la longitud de las oraciones, usar vocabulario técnico específico del dominio, incluir observaciones contextuales propias de Bolivia.

- [ ] **Step 2: Verificar que el informe HTML renderiza correctamente**

Abrir `D:\Desarrollo\Yapu\Docs\Informe_SRS_APA7_Bloque2.html` en el navegador y verificar:
- La portada tiene el formato APA 7 correcto
- El interlineado es doble
- Las tablas tienen el estilo APA (solo líneas horizontales)
- Los bloques Gherkin son legibles
- Al usar Ctrl+P, el documento se ve bien para imprimir

---

### Task 3: Presentación HTML con Reveal.js (12–15 diapositivas)

**Files:**
- Create: `D:\Desarrollo\Yapu\Docs\Presentations\presentacion_srs_bloque2.html`

**Interfaces:**
- Consumes: `D:\Desarrollo\Yapu\Docs\SRS_YAPU_Bloque2.md` (Task 1), `D:\Desarrollo\Yapu\presentacion_ai_dlc_inception.html` (referencia de estilo visual)
- Produces: Presentación HTML autocontenida lista para exponer

- [ ] **Step 1: Crear la presentación HTML con Reveal.js**

Crear `D:\Desarrollo\Yapu\Docs\Presentations\presentacion_srs_bloque2.html` — una presentación con Reveal.js de **13 diapositivas** que reutiliza EXACTAMENTE el mismo sistema de diseño de `D:\Desarrollo\Yapu\presentacion_ai_dlc_inception.html`:

**CSS y configuración a copiar literalmente del archivo de referencia:**
- Variables CSS (--font-main, --bg-dark, --card-bg, --card-border, --primary, --accent, etc.)
- Fuentes de Google: Plus Jakarta Sans + JetBrains Mono
- Clases: `.bg-grid`, `.card`, `.card.highlight`, `.card.accent`, `.tag-category`, `.grid-2`, `.grid-3`, `.grid-4`, `.metric-value`, `.metric-label`, `.chip`, `.chip.active`, `.arch-diagram`, `.arch-layer`, `.compare-matrix`, `.step-box`, `.step-badge`, `.tech-header`, `.live-dot`
- Reveal.js 5.1.0 desde CDN con theme black
- Configuración de Reveal.initialize con transition: 'fade', hash: true, slideNumber: 'c/t'

**El header fijo debe decir:**
`PROYECTO YAPU // SRS & VALIDACIÓN STAKEHOLDER // UPDS SOFTWARE ENG`

**Estructura de las 13 diapositivas:**

**Slide 1 — Portada**
- tag-category: "Ingeniería de Requisitos & Validación"
- Título: "Proyecto YAPU — Especificación de Requisitos de Software (SRS)"
- Subtítulo descriptivo sobre el objetivo del bloque 2
- Grid de 4 métricas: "10 RF" (Requisitos Funcionales), "7 RNF" (No Funcionales), "4 RS" (Sostenibilidad), "21 Total" (Requisitos Validados)

**Slide 2 — Contexto y Problema**
- tag-category: "Justificación del Proyecto"
- Título: "¿Por qué YAPU? El Desafío de la Preservación Lingüística"
- Grid de 2 cards:
  - Card 1 (highlight): Datos sobre la situación del quechua en Bolivia (2.1M hablantes, pérdida intergeneracional, brecha digital en zonas rurales)
  - Card 2: Cómo YAPU aborda el problema (acceso offline, gamificación, IA determinista sin costos de API)

**Slide 3 — Metodología del SRS**
- tag-category: "Ingeniería de Requisitos"
- Título: "Metodología: Historias de Usuario con Gherkin"
- Grid de 3 step-boxes mostrando el flujo:
  - Paso 01: Captura de necesidades (reunión Inception + stakeholder)
  - Paso 02: Redacción en formato "Como [rol] Quiero [acción] Para [beneficio]"
  - Paso 03: Criterios de aceptación en Gherkin (Dado que / Cuando / Entonces)

**Slide 4 — Panorama de Requisitos Funcionales**
- tag-category: "Requisitos Funcionales (RF)"
- Título: "10 Requisitos Funcionales del MVP"
- Tabla compare-matrix (2 columnas) con los 10 RF: ID | Nombre | Prioridad
- Mostrar los 10 en formato compacto, resaltando los de prioridad Alta

**Slide 5 — RF Destacados: Autenticación y Niveles**
- tag-category: "RF-001 / RF-002 / RF-003"
- Título: "Core del Sistema: Registro, Auth y Progresión"
- Grid de 2 cards con los escenarios Gherkin clave de RF-001 y RF-003 (solo 1 escenario cada uno, el más representativo)
- Usar fuente mono para el Gherkin dentro de las cards

**Slide 6 — RF Destacado: Motor de IA Determinista**
- tag-category: "RF-005 — Módulo de Inteligencia"
- Título: "Evaluaciones con IA Determinista: Sin LLMs, Sin Alucinaciones"
- Grid de 2 cards:
  - Card 1: Cómo funciona el motor (permutación de oraciones base, generación de distractores, ejecución local)
  - Card 2 (highlight): Escenario Gherkin de generación de evaluación

**Slide 7 — RF Destacados: Comunidad y Docentes**
- tag-category: "RF-006 / RF-007"
- Título: "Ecosistema Colaborativo: Docentes y Comunidad"
- Grid de 2 cards mostrando el flujo: Docente crea → Sistema valida → Comunidad contribuye → Docente modera
- Incluir 1 escenario Gherkin de moderación

**Slide 8 — Requisitos No Funcionales**
- tag-category: "Requisitos No Funcionales (RNF)"
- Título: "Calidad del Sistema: Rendimiento, Seguridad y Compatibilidad"
- Grid de 3 cards con las métricas clave:
  - Card 1: Rendimiento (< 3s en 3G, FCP < 2s)
  - Card 2: Seguridad (HTTPS + TLS 1.2, Firebase Auth)
  - Card 3: Disponibilidad (95% uptime, 500 usuarios concurrentes)

**Slide 9 — Requisitos de Sostenibilidad**
- tag-category: "Sostenibilidad (RS)"
- Título: "Desarrollo Sostenible: Más Allá del Código"
- Grid de 2x2 (grid-4) cards compactas:
  - RS-001: Eficiencia energética (WebP < 100KB, CPU idle < 5%)
  - RS-002: Inclusión digital (funciona en 2GB RAM)
  - RS-003: Preservación cultural (doble validación lingüística)
  - RS-004: Datos abiertos (exportación CSV)

**Slide 10 — Matriz de Trazabilidad (Tabla)**
- tag-category: "Trazabilidad & Cobertura"
- Título: "Matriz de Trazabilidad: 21 Requisitos → Componentes → Validación"
- Tabla compare-matrix con columnas: ID | Tipo | Componente | Prioridad | Validado
- Mostrar las 21 filas de forma compacta (fuente 0.72rem)
- Indicador visual ✅ en la columna Validado

**Slide 11 — Validación con Stakeholder**
- tag-category: "Evidencia de Validación"
- Título: "Socialización con Stakeholder: Lic. María Elena Quispe Mamani"
- Grid de 2 cards:
  - Card 1: Datos de la sesión (fecha, hora, modalidad, institución)
  - Card 2 (highlight): Metodología (presentación por módulos, evaluación de pertinencia pedagógica, claridad y priorización)

**Slide 12 — Observaciones del Stakeholder (Tabla)**
- tag-category: "Retroalimentación del Stakeholder"
- Título: "Observaciones Clave y Acciones Tomadas"
- Tabla compare-matrix con las 8 observaciones de la Lic. Quispe Mamani (resumidas en 1 línea cada una)
- Columnas: Requisito | Observación | Acción

**Slide 13 — Cierre y Próximos Pasos**
- tag-category: "Próximos Pasos"
- Título: "SRS Validado: Hacia la Fase de Diseño y Construcción"
- Grid de 2 cards:
  - Card 1: "Entregable del Bloque 2 Completado" — SRS con 21 requisitos validados, matriz de trazabilidad, evidencia de stakeholder
  - Card 2 (highlight): "Siguientes Fases" — Diseño de arquitectura detallado, prototipado de UI con estética andina, implementación del motor de IA determinista

**IMPORTANTE — Para que NO parezca generado por IA:**
- Variar la estructura de cada diapositiva (no todas grid-2 o grid-3)
- Usar datos cuantitativos específicos, no generalidades
- Prosa profesional pero no robótica
- Incluir detalles contextuales de Bolivia (nombres de instituciones, datos reales del quechua)
- No repetir las mismas palabras de transición
- Incluir algún detalle imperfecto natural (por ejemplo, una nota al pie con "pendiente de confirmación" o un dato con fuente específica)

- [ ] **Step 2: Verificar que la presentación HTML funciona correctamente**

Abrir `D:\Desarrollo\Yapu\Docs\Presentations\presentacion_srs_bloque2.html` en el navegador y verificar:
- Las 13 diapositivas se navegan correctamente con flechas
- El estilo visual coincide con `presentacion_ai_dlc_inception.html`
- Las tablas son legibles
- Los bloques de Gherkin son legibles con fuente mono
- El header fijo está visible en todas las diapositivas

- [ ] **Step 3: Commit de todos los archivos**

```bash
cd D:\Desarrollo\Yapu
git add Docs/SRS_YAPU_Bloque2.md Docs/Informe_SRS_APA7_Bloque2.html Docs/Presentations/presentacion_srs_bloque2.html
git commit -m "docs: add SRS with Gherkin user stories, APA 7 report, and presentation slides for Block 2

- SRS with 10 functional, 7 non-functional, 4 sustainability requirements
- All requirements validated with stakeholder (Lic. Quispe Mamani)
- Traceability matrix covering 21 requirements
- APA 7 formatted report ready for print/PDF
- 13-slide Reveal.js presentation for defense"
```
