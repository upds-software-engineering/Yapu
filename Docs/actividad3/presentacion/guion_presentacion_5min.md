# Guion de defensa: Álbum de Modelos UML, Bloque 3 (5 minutos)

**Proyecto:** YAPU, plataforma web progresiva para aprender quechua
**Asignatura:** Ingeniería de Software I · **Docente:** Ing. Jimmy Nataniel Requena Llorentty
**Diapositivas:** [presentacion_album_bloque3.pptx](presentacion_album_bloque3.pptx) (PDF de respaldo: `presentacion_album_bloque3.pdf`). El texto de cada expositor también está en las notas del orador de cada diapositiva.
**Documento de respaldo:** [Album_Modelos_Bloque3_YAPU.docx](../Album_Modelos_Bloque3_YAPU.docx)

## Reparto y tiempos

| Diapositiva | Tema | Tiempo | Acumulado | Expositor |
|---|---|---|---|---|
| 1 | Portada | 15 s | 0:15 | Emmanuel Ponce Quiroga |
| 2 | YAPU enseña quechua incluso sin internet | 40 s | 0:55 | Emmanuel Ponce Quiroga |
| 3 | Especificaciones y diagramas como código | 40 s | 1:35 | Emmanuel Ponce Quiroga |
| 4 | Cinco casos de uso, del login al tablero | 45 s | 2:20 | Luis Mario Rocha Vela |
| 5 | Arquitectura en tres capas | 45 s | 3:05 | Jhoel Álvaro Cruz Zurita |
| 6 | Evaluación sin conexión | 50 s | 3:55 | Jhoel Álvaro Cruz Zurita |
| 7 | Trazabilidad y auditoría de IA | 45 s | 4:40 | Luis Mario Rocha Vela |

Quedan 20 segundos de margen. El reparto es una propuesta y se puede cambiar.

**Consejo:** usa la Vista del Moderador de PowerPoint (Alt+F5) para ver las notas y el cronómetro mientras el público solo ve la diapositiva.

---

## Diapositiva 1: Portada (15 s)
**Emmanuel**

> Buenos días, ingeniero Requena. Somos Emmanuel Ponce, Jhoel Cruz y Luis Mario Rocha, y les presentamos el Álbum de Modelos UML del Bloque 3 de YAPU, nuestra plataforma para aprender quechua.

## Diapositiva 2: YAPU enseña quechua incluso sin internet (40 s)
**Emmanuel**

> El problema que atacamos es la pérdida del quechua en comunidades de Chuquisaca donde la señal se corta seguido y los estudiantes usan teléfonos económicos.
>
> Nuestra respuesta es una PWA: una aplicación web que se instala como app y sigue funcionando sin conexión. Tiene lecciones, niveles y rachas para motivar, y un motor de IA determinista, es decir, basado en reglas y no en un modelo de lenguaje.
>
> El objetivo de este álbum fue tomar los requisitos que aprobamos en el SRS y convertirlos en modelos que el equipo ya puede programar.

## Diapositiva 3: Modelamos con especificaciones y diagramas como código (40 s)
**Emmanuel**

> Trabajamos con desarrollo guiado por especificaciones: si algo cambia, primero se cambia el documento y después el código.
>
> Los 15 diagramas del álbum están escritos como código en Mermaid y guardados en el repositorio, así que cada cambio queda en el historial.
>
> Usamos IA para obtener borradores, pero ninguno pasó directo. El equipo revisó cada uno, y las nueve correcciones importantes están registradas en el Anexo B. El proceso fue este: requisitos, borrador con IA y auditoría, modelado y, al final, prototipos de pantalla.

## Diapositiva 4: El estudiante recorre 5 casos de uso, del login al tablero (45 s)
**Luis Mario**

> Para el MVP nos concentramos en el estudiante. Este es su recorrido: inicia sesión y llega a su tablero; desde ahí abre el mapa de niveles, entra a una lección de vocabulario y rinde la evaluación.
>
> La regla central es el 70 %: si el estudiante acierta 7 de 10 preguntas, se desbloquea el siguiente nivel y el tablero se actualiza. Si no llega, ve sus errores y puede reintentar con preguntas nuevas.
>
> Estas tres pantallas son parte de los prototipos: el tablero, el mapa con los niveles bloqueados y la evaluación de opción múltiple.

## Diapositiva 5: La arquitectura se organiza en tres capas (45 s)
**Jhoel**

> En la vista estructural, el sistema tiene tres capas. Arriba está la interfaz, hecha en Astro, con las pantallas del estudiante, el panel docente y la comunidad.
>
> En el medio están los módulos centrales: gestión de usuarios, gamificación, el motor de IA y el módulo que maneja el trabajo sin conexión.
>
> Abajo están los servicios: Firebase para autenticar, Firestore como base en la nube e IndexedDB como base dentro del teléfono.
>
> En el diagrama de clases, la relación clave es que una evaluación se compone de exactamente 10 preguntas. Si la evaluación se descarta, sus preguntas desaparecen con ella.

## Diapositiva 6: La evaluación se genera y se califica sin conexión (50 s)
**Jhoel**

> Este es el flujo más importante del sistema. Uno: el motor lee las oraciones base que ya están guardadas en el teléfono. Dos: con ellas genera 10 preguntas ahí mismo, sin internet. Tres: califica las respuestas; por ejemplo, 8 de 10 es 80 %, aprobado. Cuatro: guarda el resultado en IndexedDB y, cuando vuelve la señal, lo sincroniza con Firestore en segundo plano.
>
> La decisión de fondo fue no usar un modelo de lenguaje como ChatGPT. Así el costo de API es cero, todo funciona sin conexión y el sistema no inventa palabras en quechua, porque solo usa oraciones que aprobaron docentes hablantes.

## Diapositiva 7: Cada requisito está trazado y cada aporte de la IA, auditado (45 s)
**Luis Mario**

> Para asegurar que no quedara nada sin diseñar, armamos una matriz de trazabilidad. Aquí ven tres filas: cada requisito tiene su caso de uso, sus clases, su módulo y su pantalla. En el álbum están los 13 requisitos.
>
> Y un ejemplo de la auditoría de IA: la IA propuso calificar las evaluaciones en un servidor en la nube. Lo cambiamos para que la nota se calcule en el teléfono, porque si no, el estudiante sin señal no podría rendir.
>
> Con esto, el diseño está listo para implementarse y la autoría humana queda documentada. ¿Tienen alguna pregunta?

---

## Preguntas probables del docente

**¿Por qué el desbloqueo del nivel es un «extend» y no un «include»?**
Porque un «include» se ejecuta siempre. El desbloqueo solo ocurre si la nota es 70 % o más; si el estudiante saca 40 %, no pasa. Esa condición es justamente la guarda de un «extend» (Figura 2 del álbum).

**¿Por qué la relación entre Evaluation y Question es composición y no agregación?**
Porque cada pregunta se genera para un intento concreto y no tiene uso fuera de él. Si se descarta la evaluación, sus 10 preguntas se descartan también (Figura 9).

**¿Cómo manejan dos bases de datos en el diagrama de clases?**
Separamos el dominio de los esquemas de cada base. Hay esquemas para IndexedDB y para Firestore, dos mappers que traducen entre el dominio y cada esquema, y un repositorio que guarda primero en el teléfono y después sincroniza (Figura 10).

**¿Por qué no hay un rombo de «¿hay internet?» en la arquitectura?**
Porque un diagrama de arquitectura muestra componentes y conexiones, no decisiones. Esa decisión la toma el Service Worker y está modelada en el diagrama de actividades del modo sin conexión (Figura 15).

**¿Son tres capas o cuatro?**
Lógicamente son tres: interfaz, módulos y servicios (Figura 11). Físicamente, el sistema se despliega en el teléfono, que incluye el motor de IA, en Firebase y en un VPS de la universidad (Figura 1).
