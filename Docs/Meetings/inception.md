# Reunión del 8 sept 2026 a las 12:35 GMT-04:00
Registros de la reunión Transcripción

## Resumen
Definición del alcance y stack tecnológico con enfoque en desarrollo ágil y documentación estructurada.

## Alcance y tecnología inicial
Consenso en limitar alcance al nivel 10 de vocabulario y utilizar React con Next.js y Firebase.

## Infraestructura y documentación APA
Uso de VPS propio y separación de documentos en formato APA con diagramas Mermaid.

## Metodología y cierre Astro
Organización mediante sprints en GitHub y selección de Astro para el desarrollo del frontend.


## Decisiones

### Acordada
* **Infraestructura de alojamiento definida:** Se acuerda utilizar un Servidor Privado Virtual (VPS) para la infraestructura de alojamiento del proyecto.
* **Alcance funcional del proyecto definido:** El alcance de la aplicación se centrará en el aprendizaje de vocabulario y contenido generado por usuarios, excluyendo funciones de reconocimiento de voz, múltiples idiomas y competiciones en línea.
* **Metodología de documentación y gestión:** Se establece el uso de archivos Markdown en un repositorio de GitHub para gestionar tanto la documentación técnica como la organización de tareas del proyecto.
* **Framework de desarrollo frontend seleccionado:** Se selecciona Astro como el framework principal para el desarrollo de la interfaz de usuario de la aplicación.


## Próximos pasos
* **[El grupo] Documentar proyecto:** Redactar el documento con el objetivo, alcance y manifiesto inicial del proyecto. Asegurar que el contenido incluya una descripción del método de desarrollo, la arquitectura propuesta y la infraestructura seleccionada.
* **[El grupo] Investigar librerías:** Investigar librerías livianas para dispositivos móviles que permitan realizar traducciones deterministas y gestionar la lógica de aprendizaje dentro de la aplicación.
* **[El grupo] Subir documentación:** Subir todos los documentos en formato Word a la carpeta compartida en Drive con los nombres de los integrantes. Cumplir con esta entrega antes del plazo establecido para la revisión previa.
* **[Emmanuel Ponce Quiroga, JHOEL ALVARO CRUZ ZURITA, Luis Mario Rocha Vela] Configurar GitHub:** Configurar el repositorio de GitHub de la organización UPDS Software Engineer. Crear el tablero Kanban y organizar los pendientes y tareas del proyecto en tarjetas.
* **[El grupo] Definir paleta de colores:** Definir una paleta de colores basada en una temática andina para el diseño de la interfaz de la aplicación.
* **[Emmanuel Ponce Quiroga] Generar notas:** Generar la transcripción y el archivo en formato Markdown de esta reunión. Asegurar que el contenido sirva de contexto técnico para futuras fases del desarrollo.


## Detalles
* **Alcance Inicial del Proyecto:** Jhoel Alvaro Cruz Zurita propuso limitar el alcance inicial de la aplicación al aprendizaje de vocabulario, argumentando que la implementación de reglas gramaticales completas sería demasiado costosa y compleja para el tiempo disponible. Emmanuel Ponce Quiroga sugirió implementar los primeros 10 niveles de manera escalable, combinando vocabulario con algunos conceptos gramaticales básicos. El consenso alcanzado es enfocarse en crear una base sólida de vocabulario y oraciones escalables hasta el nivel 10, priorizando la viabilidad del proyecto (00:02:22).
* **Definición del Stack Tecnológico y Estilo Visual:** Los participantes discutieron la arquitectura de la aplicación, decidiendo descartar la idea de una aplicación nativa en Android a favor de una aplicación web progresiva (SPA) por ser más fácil y rápida de desarrollar. Se acordó utilizar React y Next.js para el desarrollo del frontend (00:08:16). Respecto a la interfaz, Emmanuel Ponce Quiroga propuso una estética de temática andina, facilitada por la disponibilidad de literatura, con un consenso grupal para priorizar una sola lengua originaria inicialmente antes de expandirse a otras (00:07:04).
* **Infraestructura y Funcionalidad Comunitaria:** El equipo decidió utilizar el VPS de Jhoel Alvaro Cruz Zurita para la infraestructura y Firebase para la gestión de la base de datos. Se definió que la plataforma debe permitir la realimentación por parte de los usuarios, quienes podrán publicar redacciones y crear sus propios retos o evaluaciones, fomentando un sistema donde la base de conocimiento crezca mediante la participación de docentes y estudiantes (00:07:04) (00:09:33).
* **Requisitos de Documentación:** Luis Mario Rocha Vela informó que, para cumplir con las exigencias del ingeniero, la documentación debe presentarse en archivos de Word en formato APA, separados por fases en lugar de un único documento integral (00:12:17) (00:15:28). Se estableció la obligatoriedad de utilizar Mermaid para la generación automática de diagramas técnicos (clases, casos de uso, etc.), integrando los enlaces a estos diagramas dentro de la documentación (00:14:26). El grupo acordó subir todos los documentos a carpetas específicas en Google Drive para su revisión previa (00:15:28).
* **Metodología de Planificación y Gestión:** El equipo determinó organizar el desarrollo mediante fases, las cuales se estructurarán como sprints para simular un flujo de trabajo ágil (00:12:17). Se acordó realizar reuniones breves de aproximadamente 15 minutos para el seguimiento de tareas. La documentación inicial, incluyendo el manifiesto del proyecto, los objetivos y los alcances, se gestionará a través de archivos Markdown, asegurando que toda la información quede registrada desde el inicio (00:13:25) (00:16:37).
* **Definición del Alcance (Incluido y Excluido):** Se definió claramente qué no incluirá la aplicación en esta fase inicial para mantener la simplicidad: se excluyó el reconocimiento de voz, traducciones de voz, competiciones online (tablas de posiciones), modos de juego complejos y la inclusión de múltiples idiomas (00:18:53). El objetivo principal es alcanzar un nivel básico de certificación A1 en un idioma específico, basándose en verbos y vocabulario fundamental (00:19:57).
* **Integración de Inteligencia Artificial:** Ante la necesidad de incluir IA según los requerimientos del curso, Emmanuel Ponce Quiroga propuso un enfoque determinista en lugar de utilizar modelos de lenguaje (LLM) abiertos. La propuesta consiste en utilizar la IA para generar opciones de respuesta o evaluaciones a partir de oraciones precargadas por usuarios, evitando el desarrollo de sistemas complejos de generación de texto. El equipo investigará librerías ligeras que puedan ejecutarse localmente en dispositivos móviles (00:21:20).
* **Configuración del Entorno de Desarrollo (GitHub):** Jhoel Alvaro Cruz Zurita creó la organización "UPDS Software Engineer" y gestionó las invitaciones a los miembros (00:25:28) (00:28:30). El grupo acordó centralizar toda la documentación, tareas y el backlog en un repositorio de GitHub utilizando Markdown. Se implementará un tablero Kanban dentro del proyecto para gestionar el flujo de trabajo, desde el backlog hasta la entrega final de cada sprint (00:24:00) (00:26:46).
* **Selección de Framework de Frontend y Cierre:** Tras evaluar opciones, el equipo decidió utilizar el framework Astro para el frontend, destacando su capacidad para soportar diversos componentes, HTML, JS y archivos Markdown, lo cual facilita la integración de la documentación con la interfaz de usuario (00:35:14). La reunión concluyó con el compromiso de trabajar en la documentación técnica y la estructura de la base de datos durante la sesión nocturna, cerrando las definiciones principales para el proyecto (00:33:16).


Revisa las notas de Gemini para asegurarte de que sean precisas. Obtén sugerencias y descubre cómo Gemini toma notas
Cómo es la calidad de estas notas específicas? Responde una breve encuesta para darnos tu opinión; por ejemplo, cuán útiles te resultaron las notas.