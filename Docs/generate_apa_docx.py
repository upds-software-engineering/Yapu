# Fecha: 2026-09-15 | Hora: 19:43 | Motivo: Script para compilar informe SRS en Word (.docx) formato APA 7 - Emmanuel Ponce
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def style_apa_table(table):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    # APA 7: Border top, border bottom header, border bottom table. No vertical borders.
    for r_idx, row in enumerate(table.rows):
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            tcBorders = OxmlElement('w:tcBorders')
            
            # top border
            top = OxmlElement('w:top')
            if r_idx == 0:
                top.set(qn('w:val'), 'single')
                top.set(qn('w:sz'), '12') # 1.5 pt
                top.set(qn('w:space'), '0')
                top.set(qn('w:color'), '000000')
            else:
                top.set(qn('w:val'), 'none')
            tcBorders.append(top)
            
            # bottom border
            bottom = OxmlElement('w:bottom')
            if r_idx == 0:
                bottom.set(qn('w:val'), 'single')
                bottom.set(qn('w:sz'), '6') # 0.75 pt
                bottom.set(qn('w:space'), '0')
                bottom.set(qn('w:color'), '000000')
            elif r_idx == len(table.rows) - 1:
                bottom.set(qn('w:val'), 'single')
                bottom.set(qn('w:sz'), '12') # 1.5 pt
                bottom.set(qn('w:space'), '0')
                bottom.set(qn('w:color'), '000000')
            else:
                bottom.set(qn('w:val'), 'none')
            tcBorders.append(bottom)
            
            # left and right none
            for side in ['left', 'right']:
                b = OxmlElement(f'w:{side}')
                b.set(qn('w:val'), 'none')
                tcBorders.append(b)
                
            tcPr.append(tcBorders)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

def create_apa_srs_doc(output_path):
    doc = docx.Document()
    
    # 1. Configurar márgenes APA 7 (2.54 cm = 1 inch)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
    # Estilo base
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(12)
    font_normal.color.rgb = RGBColor(0, 0, 0)
    
    # Helper para párrafos dobles
    def add_p(text="", bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=6, space_before=0, line_spacing=1.5):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        if text:
            run = p.add_run(text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12)
            run.font.bold = bold
            run.font.italic = italic
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.font.bold = True
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.bold = True
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.italic = True
        return p

    def add_gherkin(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_shading(cell, "F8FAFC")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        
        # Borde fino izquierdo
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = OxmlElement('w:tcBorders')
        left = OxmlElement('w:left')
        left.set(qn('w:val'), 'single')
        left.set(qn('w:sz'), '18') # ~2.25pt
        left.set(qn('w:color'), '0284C7')
        tcBorders.append(left)
        for s in ['top', 'bottom', 'right']:
            b = OxmlElement(f'w:{s}')
            b.set(qn('w:val'), 'none')
            tcBorders.append(b)
        tcPr.append(tcBorders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        lines = code_text.strip().split('\n')
        for i, line in enumerate(lines):
            if i > 0:
                p = cell.add_paragraph()
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
            run = p.add_run(line)
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)
            if any(line.strip().startswith(kw) for kw in ["Escenario:", "Dado que", "Cuando", "Entonces", "Y"]):
                run.font.bold = True
                run.font.color.rgb = RGBColor(15, 23, 42)
            else:
                run.font.color.rgb = RGBColor(51, 65, 85)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # PORTADA APA 7
    # -------------------------------------------------------------
    for _ in range(3):
        doc.add_paragraph()
        
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(24)
    run_t = p_title.add_run("Especificación de Requisitos de Software (SRS):\nProyecto YAPU — Plataforma de Aprendizaje de Lengua Quechua")
    run_t.font.name = 'Times New Roman'
    run_t.font.size = Pt(15)
    run_t.font.bold = True
    
    p_authors = doc.add_paragraph()
    p_authors.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_authors.paragraph_format.space_after = Pt(36)
    p_authors.paragraph_format.line_spacing = 1.5
    r = p_authors.add_run("Jhoel Álvaro Cruz Zurita\nLuis Mario Rocha Vela\nEmmanuel Ponce Quiroga")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    
    p_aff = doc.add_paragraph()
    p_aff.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_aff.paragraph_format.space_after = Pt(24)
    p_aff.paragraph_format.line_spacing = 1.5
    r = p_aff.add_run("Facultad de Ciencias de la Computación y Telecomunicaciones\nUniversidad Privada Domingo Savio (UPDS)\nIngeniería de Software\nDocente de la Materia")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_after = Pt(0)
    r = p_date.add_run("Sucre, Bolivia\n15 de septiembre de 2026")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # RESUMEN / ABSTRACT
    # -------------------------------------------------------------
    add_h1("Resumen")
    add_p("El presente documento constituye la Especificación de Requisitos de Software (SRS) para el Proyecto YAPU (Sembradío en quechua), una plataforma web progresiva (PWA) orientada a la enseñanza y revitalización de la lengua originaria quechua en el Estado Plurinacional de Bolivia. En cumplimiento de las directrices académicas de la asignatura de Ingeniería de Software de la Universidad Privada Domingo Savio (UPDS), se adopta un enfoque basado en historias de usuario con criterios de aceptación formulados en lenguaje formal Gherkin (Dado que / Cuando / Entonces). La especificación abarca diez requisitos funcionales (RF-001 a RF-010), siete requisitos no funcionales (RNF-001 a RNF-007) y cuatro requisitos de sostenibilidad (RS-001 a RS-004), integrando una matriz de trazabilidad bidireccional y la evidencia formal de socialización con la Lic. María Elena Quispe Mamani, docente de lengua quechua de la Unidad Educativa Simón Bolívar de Sucre. Los acuerdos alcanzados garantizan la viabilidad técnica y pertinencia pedagógica del sistema bajo un modelo de Inteligencia Artificial determinista y ejecución local para zonas con conectividad intermitente.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p("Palabras clave: Especificación de Requisitos, Historias de Usuario, Gherkin, Lengua Quechua, IA Determinista, PWA, Sostenibilidad de Software, Validación con Stakeholders.", italic=True)
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # 1. INTRODUCCIÓN
    # -------------------------------------------------------------
    add_h1("1. Introducción")
    add_p("El quechua (runasimi) representa una de las manifestaciones culturales y lingüísticas más significativas del área andina, con más de dos millones de hablantes en el territorio boliviano reconocidos constitucionalmente bajo el Artículo 5 de la Constitución Política del Estado de 2009. No obstante, las dinámicas demográficas de migración urbana y la hegemonía de medios digitales han desencadenado un proceso alarmante de interrupción intergeneracional en la transmisión del idioma. De acuerdo con los lineamientos de la Ley Avelino Siñani - Elizardo Pérez (Ley 070) y el Currículo Base del Sistema Educativo Plurinacional, resulta imperativo diseñar herramientas pedagógicas modernas que rescaten, preserven y democraticen el acceso al aprendizaje del quechua.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p("El Proyecto YAPU surge como respuesta concreta a este desafío sociolingüístico. Concebido como una plataforma web progresiva (PWA) construida sobre el framework Astro y respaldada por Firebase, el sistema se enfoca en democratizar el aprendizaje de vocabulario y estructuras oracionales básicas correspondientes al nivel A1 certificable, escalable del Nivel 1 al Nivel 10.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p("El objetivo primordial de este documento es establecer los límites de ingeniería, los compromisos de calidad y los criterios de aceptación formales que regirán el ciclo de vida del producto. A través de la técnica de desarrollo guiado por comportamiento (Behavior-Driven Development - BDD) mediante sintaxis Gherkin, se elimina la ambigüedad tradicional de las especificaciones en lenguaje natural, facilitando la validación unívoca por parte del equipo de desarrollo, docentes evaluadores y los stakeholders del sector educativo.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    # -------------------------------------------------------------
    # 2. MARCO TEÓRICO Y REFERENCIAL
    # -------------------------------------------------------------
    add_h1("2. Marco Teórico y Referencial")
    add_h2("2.1 Estándar IEEE Std 830-1998 y Enfoque Ágil")
    add_p("El estándar IEEE 830 define las prácticas recomendadas para la redacción de especificaciones de requisitos de software (SRS), enfatizando propiedades como no ambigüedad, completitud, verificabilidad, consistencia y modificabilidad (IEEE, 2011). En la presente propuesta, el estándar se adapta e hibrida con metodologías ágiles mediante el modelado de historias de usuario bajo el patrón INVEST (Independiente, Negociable, Valiosa, Estimable, Pequeña y Comprobable).", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_h2("2.2 Formato Gherkin y Criterios de Aceptación (BDD)")
    add_p("Para operacionalizar los criterios de aceptación se utiliza la gramática formal Gherkin (Wynne & Hellesøy, 2017). Cada historia de usuario cuenta con escenarios expresados en cláusulas estructuradas en español: 'Dado que' (precondición y contexto del sistema), 'Cuando' (acción disparadora del usuario o evento) y 'Entonces' (postcondición o resultado esperado verificable). Esta formulación permite construir pruebas automatizadas y asegurar que los casos de prueba reflejen directamente los requerimientos del usuario.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    add_h2("2.3 Paradigma de Inteligencia Artificial Determinista")
    add_p("A diferencia del uso de grandes modelos de lenguaje generativo (LLMs) que acarrean riesgos de alucinación semántica, costos recurrentes de API y dependencia de conectividad constante, YAPU adopta un modelo de IA determinista basado en algoritmos de permutación y generación controlada de distractores a partir de un banco de oraciones lingüísticamente verificado por docentes. Esto viabiliza la ejecución en el cliente móvil y minimiza los tiempos de respuesta sin incurrir en costos operativos.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    # -------------------------------------------------------------
    # 3. DESCRIPCIÓN GENERAL DEL SISTEMA
    # -------------------------------------------------------------
    add_h1("3. Descripción General del Sistema")
    add_h2("3.1 Perspectiva del Producto")
    add_p("YAPU opera como un sistema autónomo en el cliente bajo arquitectura PWA, comunicándose asíncronamente con un Servidor Privado Virtual (VPS) autogestionado y con servicios en la nube de Firebase (Authentication y Firestore) para persistencia y sincronización de perfiles.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_h2("3.2 Clases de Usuarios")
    add_p("Se identifican tres perfiles principales con responsabilidades diferenciadas:")
    add_p("1. Estudiante: Usuario final en proceso de aprendizaje que interactúa con las lecciones, evaluaciones y retos comunitarios.", space_before=2, space_after=2)
    add_p("2. Docente: Educador certificado de lengua quechua facultado para crear, enriquecer y moderar oraciones base y desafíos propuestos por la comunidad.", space_before=2, space_after=2)
    add_p("3. Administrador de Plataforma: Encargado de la gestión técnica de infraestructura, respaldo de bases de datos y monitoreo del VPS.", space_before=2, space_after=6)

    add_h2("3.3 Restricciones Generales de Diseño")
    add_p("• Exclusión de reconocimiento y síntesis de voz en el MVP inicial para garantizar alta confiabilidad pedagógica sin latencias de red.\n• Monolingüismo inicial circunscrito al quechua variante Sucre/Chuquisaca (Collao), previendo escalabilidad futura a aymara y guaraní.\n• Arquitectura offline-first mediante Service Workers para soportar conectividad nula o intermitente en áreas periféricas.\n• Presupuesto cero en APIs de terceros.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    # -------------------------------------------------------------
    # 4. REQUISITOS FUNCIONALES (RF)
    # -------------------------------------------------------------
    add_h1("4. Requisitos Funcionales (RF)")
    add_p("A continuación se detallan los 10 requisitos funcionales del sistema, acompañados de su historia de usuario y escenarios de prueba Gherkin.")

    rf_data = [
        ("RF-001: Registro de Usuarios",
         "Como estudiante o docente, quiero registrarme con mi correo electrónico para acceder al contenido de aprendizaje.",
         """Escenario: Registro exitoso de estudiante
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
  Y sugiere la opción de iniciar sesión o recuperar contraseña"""),

        ("RF-002: Autenticación e Inicio de Sesión",
         "Como usuario registrado, quiero iniciar sesión con mis credenciales para continuar mi progreso desde donde lo dejé.",
         """Escenario: Inicio de sesión exitoso
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
  Y permite reintentar sin bloqueo hasta el tercer intento consecutivo"""),

        ("RF-003: Navegación y Progresión por Niveles",
         "Como estudiante, quiero ver los 10 niveles disponibles con indicador visual para conocer mi avance.",
         """Escenario: Visualización del mapa de niveles
  Dado que el estudiante ha iniciado sesión
  Cuando accede a la pantalla principal
  Entonces ve los 10 niveles representados visualmente con estética andina
  Y los niveles completados muestran un indicador de aprobación
  Y el nivel actual está resaltado y es accesible
  Y los niveles futuros aparecen bloqueados con un candado

Escenario: Desbloqueo de nivel
  Dado que el estudiante completó todas las lecciones del nivel actual
  Y obtuvo una puntuación mínima del 70% en la evaluación final del nivel
  Cuando el sistema procesa la completitud
  Entonces desbloquea el siguiente nivel
  Y registra la fecha de desbloqueo en Firestore"""),

        ("RF-004: Lecciones de Vocabulario Interactivas",
         "Como estudiante, quiero aprender vocabulario mediante tarjetas interactivas con imágenes para contextualizar palabras.",
         """Escenario: Presentación de nueva palabra
  Dado que el estudiante inicia una lección de vocabulario del nivel 3
  Cuando el sistema carga la lección
  Entonces presenta cada palabra con su escritura en quechua, traducción al español y una imagen representativa
  Y permite al estudiante marcar la palabra como "aprendida" o "repasar"

Escenario: Repaso de palabras difíciles
  Dado que el estudiante marcó palabras como "repasar"
  Cuando accede a la sección de repaso
  Entonces el sistema presenta solo las palabras marcadas en orden aleatorio
  Y requiere que el estudiante las identifique correctamente 3 veces antes de moverlas a "aprendidas\""""),

        ("RF-005: Evaluaciones con IA Determinista",
         "Como estudiante, quiero evaluaciones con distractores automáticos generados por IA determinista para evaluar mi aprendizaje.",
         """Escenario: Generación de evaluación de opción múltiple
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
  Y si obtiene menos del 70%, permite reintentar con preguntas regeneradas"""),

        ("RF-006: Panel de Gestión Docente de Contenidos",
         "Como docente de quechua, quiero crear y gestionar oraciones base para alimentar el motor de IA determinista.",
         """Escenario: Creación de oración base con contexto cultural
  Dado que el docente ha iniciado sesión con rol "Docente"
  Cuando accede al panel de gestión de contenido
  Y crea una nueva oración con campos: texto en quechua, traducción al español, nivel asociado y contexto cultural
  Entonces la oración se guarda en Firestore con estado "pendiente de revisión"
  Y queda disponible para uso del motor de IA tras la aprobación

Escenario: Edición de contenido existente
  Dado que el docente visualiza la lista de oraciones del nivel 5
  Cuando selecciona una oración para editar
  Entonces puede modificar el texto, la traducción y la categoría gramatical
  Y el sistema registra la fecha de modificación y el autor del cambio"""),

        ("RF-007: Contenido y Retos Generados por la Comunidad",
         "Como estudiante avanzado (nivel 7+), quiero proponer retos de vocabulario para expandir la base colaborativa.",
         """Escenario: Publicación de reto comunitario
  Dado que el estudiante alcanzó el nivel 7 o superior
  Cuando accede a la sección "Comunidad" y crea un nuevo reto
  Y completa los campos: oración en quechua, traducción, pista contextual y nivel sugerido
  Entonces el reto se publica con estado "en revisión"
  Y un docente debe aprobar el reto antes de que esté disponible para otros estudiantes

Escenario: Moderación de contenido comunitario
  Dado que un docente revisa los retos pendientes
  Cuando selecciona un reto para evaluar
  Entonces puede aprobarlo, rechazarlo con comentario de retroalimentación, o editarlo antes de aprobar"""),

        ("RF-008: Tablero de Métricas y Progreso",
         "Como estudiante, quiero consultar mis estadísticas de aprendizaje para monitorear mi desempeño.",
         """Escenario: Visualización de estadísticas
  Dado que el estudiante accede a su perfil
  Cuando selecciona la pestaña "Mi Progreso"
  Entonces ve un resumen con: niveles completados, palabras aprendidas, evaluaciones aprobadas y racha de días
  Y cada métrica incluye un gráfico visual con la paleta de la plataforma

Escenario: Detalle por nivel
  Dado que el estudiante selecciona un nivel específico en su tablero
  Cuando hace clic en el nivel 4
  Entonces ve el desglose: lecciones completadas vs pendientes, palabras dominadas vs en repaso, y nota final"""),

        ("RF-009: Modo de Operación Offline Parcial",
         "Como estudiante en área rural con conectividad limitada, quiero estudiar lecciones previamente descargadas.",
         """Escenario: Caché de lecciones para uso offline
  Dado que el estudiante tiene conexión a internet
  Cuando accede a un nivel por primera vez
  Entonces la PWA almacena en caché las lecciones de ese nivel mediante Service Workers
  Y muestra un indicador "Disponible sin conexión" junto al nivel

Escenario: Uso sin conexión
  Dado que el estudiante perdió la conexión a internet
  Cuando intenta acceder a una lección previamente cacheada
  Entonces la lección carga correctamente desde el caché local
  Y las respuestas de evaluación se almacenan localmente
  Y se sincronizan con Firestore cuando se restablece la conexión"""),

        ("RF-010: Interfaz con Identidad y Estética Andina",
         "Como usuario, quiero una interfaz visualmente coherente con los patrones andinos para generar pertenencia cultural.",
         """Escenario: Elementos visuales culturales
  Dado que el usuario accede a cualquier pantalla de la plataforma
  Cuando el sistema renderiza la interfaz
  Entonces utiliza la paleta de colores basada en la temática andina definida por el equipo
  Y los iconos de navegación y logros incorporan motivos textiles andinos estilizados
  Y la tipografía es legible en dispositivos móviles (mínimo 16px para cuerpo de texto)""")
    ]

    for title, story, gherkin in rf_data:
        add_h2(title)
        add_p(f"Historia de Usuario: {story}", italic=True)
        add_gherkin(gherkin)

    # -------------------------------------------------------------
    # 5. REQUISITOS NO FUNCIONALES (RNF)
    # -------------------------------------------------------------
    add_h1("5. Requisitos No Funcionales (RNF)")
    rnf_data = [
        ("RNF-001: Rendimiento y Tiempos de Carga",
         "Tiempo de carga inicial inferior a 3 segundos sobre conexiones móviles 3G estándar (1.6 Mbps).",
         """Escenario: Carga inicial en conexión lenta
  Dado que un estudiante accede a YAPU desde un dispositivo móvil con conexión 3G
  Cuando el navegador solicita la página principal
  Entonces el contenido visible (First Contentful Paint) se renderiza en menos de 2 segundos
  Y la aplicación es completamente interactiva (Time to Interactive) en menos de 3 segundos"""),

        ("RNF-002: Compatibilidad Multiplataforma",
         "Soporte estricto para navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) en móviles y desktop.",
         """Escenario: Acceso desde navegador móvil
  Dado que un estudiante accede desde Chrome en Android 10
  Cuando navega por todas las secciones de la aplicación
  Entonces todas las funcionalidades son accesibles y visualmente correctas
  Y los elementos táctiles tienen un área mínima de 44x44 píxeles"""),

        ("RNF-003: Seguridad y Privacidad de Datos",
         "Canal de comunicación encriptado mediante HTTPS/TLS 1.2+ y protección de contraseñas mediante hashing en Firebase Auth.",
         """Escenario: Transmisión segura de datos
  Dado que un usuario envía sus credenciales de inicio de sesión
  Cuando la solicitud viaja al servidor
  Entonces la comunicación se realiza exclusivamente a través de HTTPS con TLS 1.2 o superior
  Y Firebase Authentication gestiona el hash de contraseñas sin intervención del código de la aplicación"""),

        ("RNF-004: Disponibilidad del Sistema",
         "Disponibilidad mínima garantizada del 95% mensual, limitando la indisponibilidad a ventanas nocturnas controladas.",
         """Escenario: Monitoreo de disponibilidad
  Dado que el sistema está en producción en el VPS
  Cuando se mide la disponibilidad durante un mes calendario
  Entonces el uptime registrado es igual o superior al 95%
  Y las ventanas de mantenimiento planificado se programan en horarios de bajo tráfico (2:00–5:00 AM BOT)"""),

        ("RNF-005: Concurrencia y Escalabilidad",
         "Capacidad para sostener hasta 500 sesiones concurrentes sin degradación superior a 2 segundos en respuestas de base de datos.",
         """Escenario: Carga concurrente
  Dado que 500 estudiantes acceden simultáneamente a la plataforma
  Cuando realizan operaciones de lectura de lecciones y escritura de evaluaciones
  Entonces el tiempo de respuesta promedio no supera los 2 segundos
  Y Firestore gestiona las lecturas/escrituras sin errores de cuota"""),

        ("RNF-006: Usabilidad y Facilidad de Aprendizaje",
         "Curva de aprendizaje intuitiva que permite completar la primera lección en menos de 5 minutos desde el registro.",
         """Escenario: Experiencia del primer uso
  Dado que un estudiante acaba de registrarse
  Cuando completa el registro y accede al dashboard
  Entonces el sistema presenta un flujo de onboarding de máximo 3 pasos
  Y el estudiante puede iniciar su primera lección en menos de 2 clics desde el dashboard"""),

        ("RNF-007: Mantenibilidad y Calidad de Código",
         "Arquitectura orientada a componentes modulares Astro con una longitud máxima recomendada de 300 líneas por archivo.",
         """Escenario: Estructura del código
  Dado que un desarrollador nuevo se incorpora al equipo
  Cuando revisa la estructura del proyecto
  Entonces cada componente Astro tiene una única responsabilidad
  Y los archivos no superan las 300 líneas de código
  Y existen archivos README en cada directorio principal explicando su propósito""")
    ]

    for title, desc, gherkin in rnf_data:
        add_h2(title)
        add_p(f"Criterio de Calidad: {desc}", italic=True)
        add_gherkin(gherkin)

    # -------------------------------------------------------------
    # 6. REQUISITOS DE SOSTENIBILIDAD (RS)
    # -------------------------------------------------------------
    add_h1("6. Requisitos de Sostenibilidad (RS)")
    rs_data = [
        ("RS-001: Eficiencia Energética (Green Computing)",
         "Optimización del ciclo de CPU en VPS (idle < 5%) y uso de imágenes WebP comprimidas (< 100KB) para reducir la huella de carbono.",
         """Escenario: Optimización de recursos del servidor
  Dado que el VPS ejecuta YAPU en producción
  Cuando no hay usuarios activos durante 30 minutos
  Entonces los procesos de background se reducen al mínimo
  Y el consumo de CPU del servidor no supera el 5% en estado idle

Escenario: Eficiencia en el cliente
  Dado que un estudiante usa YAPU en su dispositivo móvil
  Cuando la aplicación está en primer plano
  Entonces no ejecuta animaciones innecesarias en segundo plano
  Y las imágenes se sirven en formato WebP con compresión optimizada (menos de 100KB por imagen)"""),

        ("RS-002: Inclusión Digital y Accesibilidad en Dispositivos Económicos",
         "Garantizar operatividad fluida en smartphones de gama de entrada con 2GB de RAM y consumo máximo de 150MB de memoria en ejecución.",
         """Escenario: Dispositivo de gama baja
  Dado que un estudiante accede desde un dispositivo con 2GB de RAM y procesador de 4 núcleos a 1.2GHz
  Cuando navega por la plataforma
  Entonces la aplicación consume menos de 150MB de RAM
  Y no presenta bloqueos ni lags perceptibles durante la interacción normal"""),

        ("RS-003: Preservación Cultural y Validación Dialectal",
         "Mecanismo de doble validación pedagógica por docentes nativos para asegurar fidelidad lingüística y respeto a variantes regionales.",
         """Escenario: Validación lingüística
  Dado que un docente crea una nueva oración en quechua
  Cuando la envía para publicación
  Entonces la oración queda en estado "pendiente" hasta que al menos un segundo docente la revise y apruebe
  Y el sistema registra quién aprobó y la fecha de aprobación"""),

        ("RS-004: Datos Abiertos y Reutilización Académica",
         "Capacidad de exportación del banco de frases y vocabulario en formato estructurado abierto (CSV/JSON) para fines educativos y de investigación.",
         """Escenario: Exportación de datos
  Dado que un administrador accede al panel de gestión
  Cuando solicita la exportación de la base de datos lingüística
  Entonces el sistema genera un archivo CSV con todas las oraciones, traducciones y metadatos
  Y el archivo no incluye datos personales de los usuarios""")
    ]

    for title, desc, gherkin in rs_data:
        add_h2(title)
        add_p(f"Fundamentación de Sostenibilidad: {desc}", italic=True)
        add_gherkin(gherkin)

    # -------------------------------------------------------------
    # 7. MATRIZ DE TRAZABILIDAD
    # -------------------------------------------------------------
    add_h1("7. Matriz de Trazabilidad Integral")
    add_p("La Tabla 1 expone la trazabilidad bidireccional entre los requisitos identificados, su tipología, los componentes arquitectónicos de software encargados de su satisfacción, su prioridad y el estado formal de validación.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    add_p("Tabla 1\nMatriz de Trazabilidad y Validación de Requisitos", bold=True, italic=False)
    
    matrix_table = doc.add_table(rows=22, cols=6)
    style_apa_table(matrix_table)
    headers = ["ID", "Tipo", "Nombre del Requisito", "Componente", "Prioridad", "Validación"]
    for col_idx, h in enumerate(headers):
        cell = matrix_table.cell(0, col_idx)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_shading(cell, "F1F5F9")

    matrix_rows = [
        ("RF-001", "Funcional", "Registro de Usuarios", "Firebase Auth / Register Component", "Alta", "Conforme"),
        ("RF-002", "Funcional", "Autenticación e Inicio", "Firebase Auth / Login Form", "Alta", "Conforme"),
        ("RF-003", "Funcional", "Mapa y Progresión Niveles", "LevelMap (Astro Component)", "Alta", "Conforme"),
        ("RF-004", "Funcional", "Lecciones Vocabulario", "LessonCard (Astro Island)", "Alta", "Conforme"),
        ("RF-005", "Funcional", "Evaluaciones IA Determinista", "Deterministic AI Engine", "Alta", "Conforme"),
        ("RF-006", "Funcional", "Panel Gestión Docente", "TeacherPanel / Content Manager", "Media", "Conforme"),
        ("RF-007", "Funcional", "Retos Comunitarios", "CommunityModule / Moderation", "Media", "Conforme"),
        ("RF-008", "Funcional", "Tablero de Progreso", "StudentDashboard / Metrics View", "Media", "Conforme"),
        ("RF-009", "Funcional", "Operación Offline Parcial", "Service Worker / Cache Storage", "Alta", "Conforme"),
        ("RF-010", "Funcional", "Estética e Identidad Andina", "Design System / Andean Tokens", "Media", "Conforme"),
        ("RNF-001", "No Funcional", "Rendimiento Móvil 3G", "Astro SSG / Bundle Optimizer", "Alta", "Conforme"),
        ("RNF-002", "No Funcional", "Compatibilidad Navegadores", "Standard Web APIs / CSS Grid", "Alta", "Conforme"),
        ("RNF-003", "No Funcional", "Seguridad HTTPS y Cifrado", "TLS 1.2+ / Firebase Rules", "Alta", "Conforme"),
        ("RNF-004", "No Funcional", "Disponibilidad VPS 95%", "Nginx Reverse Proxy / VPS", "Media", "Conforme"),
        ("RNF-005", "No Funcional", "Escalabilidad 500 Usuarios", "Firestore Scalable Clusters", "Media", "Conforme"),
        ("RNF-006", "No Funcional", "Usabilidad Onboarding <5min", "UX Guidance Module", "Alta", "Conforme"),
        ("RNF-007", "No Funcional", "Mantenibilidad de Código", "Modular Astro Architecture", "Media", "Conforme"),
        ("RS-001", "Sostenibilidad", "Eficiencia Energética", "WebP Assets / Idle CPU Tuning", "Media", "Conforme"),
        ("RS-002", "Sostenibilidad", "Inclusión Digital RAM <150MB", "Lightweight Client Bundle", "Alta", "Conforme"),
        ("RS-003", "Sostenibilidad", "Preservación Cultural", "Double Teacher Validation", "Alta", "Conforme"),
        ("RS-004", "Sostenibilidad", "Datos Abiertos y CSV", "Data Export Utility", "Baja", "Conforme")
    ]

    for row_idx, row_data in enumerate(matrix_rows, start=1):
        for col_idx, text in enumerate(row_data):
            cell = matrix_table.cell(row_idx, col_idx)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            run = p.add_run(text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(9.5)
            if col_idx in [0, 1, 4, 5]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if col_idx == 5:
                run.font.bold = True
                run.font.color.rgb = RGBColor(4, 120, 87)

    add_p("Nota. Elaboración propia a partir de los acuerdos de socialización con la stakeholder docente del 12 de septiembre de 2026.", italic=True, space_before=4)

    # -------------------------------------------------------------
    # 8. EVIDENCIA DE SOCIALIZACIÓN CON STAKEHOLDER
    # -------------------------------------------------------------
    add_h1("8. Evidencia de Socialización con Stakeholder")
    add_p("En cumplimiento de la ingeniería de requisitos rigurosa, se llevó a cabo una sesión formal de socialización y validación pedagógica con una docente activa en la enseñanza de lenguas originarias en el departamento de Chuquisaca.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_p("Tabla 2\nFicha Técnica de la Sesión de Socialización", bold=True)
    f_table = doc.add_table(rows=6, cols=2)
    style_apa_table(f_table)
    ficha_data = [
        ("Fecha y Hora", "12 de septiembre de 2026 | 10:00 - 10:45 AM (BOT, GMT-4)"),
        ("Modalidad", "Videoconferencia virtual sincrónica mediante Google Meet"),
        ("Stakeholder Participante", "Lic. María Elena Quispe Mamani (Docente Titular de Lengua Quechua)"),
        ("Institución Educativa", "Unidad Educativa Simón Bolívar (Sucre, Chuquisaca, Bolivia)"),
        ("Equipo Evaluador UPDS", "Emmanuel Ponce Quiroga (Facilitador), Jhoel Álvaro Cruz Zurita, Luis Mario Rocha Vela"),
        ("Objetivo de la Sesión", "Revisión sistemática de pertinencia pedagógica, viabilidad técnica y priorización de requisitos")
    ]
    for r_idx, (k, v) in enumerate(ficha_data):
        cell_k = f_table.cell(r_idx, 0)
        cell_v = f_table.cell(r_idx, 1)
        p_k = cell_k.paragraphs[0]
        run_k = p_k.add_run(k)
        run_k.font.name = 'Times New Roman'
        run_k.font.size = Pt(10)
        run_k.font.bold = True
        
        p_v = cell_v.paragraphs[0]
        run_v = p_v.add_run(v)
        run_v.font.name = 'Times New Roman'
        run_v.font.size = Pt(10)
    
    add_p("Nota. Registro de sesión archivado en las actas de gestión del Proyecto YAPU.", italic=True, space_before=4, space_after=12)

    add_h2("8.1 Observaciones del Stakeholder y Acciones de Ingeniería")
    add_p("Durante la revisión interactiva de las historias de usuario, la Lic. Quispe Mamani aportó observaciones críticas fundamentadas en su experiencia directa en aulas fiscales y periurbanas de Sucre. La Tabla 3 compendia el dictamen pedagógico recibido y las decisiones de diseño adoptadas por el equipo de desarrollo.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    add_p("Tabla 3\nMatriz de Observaciones de la Stakeholder y Acciones Tomadas en el SRS", bold=True)
    obs_table = doc.add_table(rows=9, cols=3)
    style_apa_table(obs_table)
    obs_headers = ["Requisito", "Dictamen y Observación de la Stakeholder", "Decisión y Acción de Ingeniería"]
    for c_idx, h in enumerate(obs_headers):
        cell = obs_table.cell(0, c_idx)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_shading(cell, "F1F5F9")

    obs_data = [
        ("RF-003", "El umbral del 70% de aprobación para desbloquear niveles es pedagógicamente óptimo; previene la frustración y afianza la memoria a largo plazo.", "Se ratificó formalmente la regla de negocio con nota mínima de corte de 70%."),
        ("RF-004", "En zonas bilingües la imagen contextual es indispensable; los estudiantes asocian el concepto gráfico antes que la traducción castellana.", "Se estableció la obligatoriedad de imagen contextual en cada tarjeta de vocabulario."),
        ("RF-005", "Los distractores de opción múltiple generados automáticamente no deben ser absurdos ni ridículos; deben compartir campos semánticos reales.", "Se incorporó restricción algorítmica de permutación semántica en la IA determinista."),
        ("RF-006", "Una oración desprovista de contexto cultural pierde su valor formativo en quechua; es vital registrar el entorno de uso (campo, fiesta, familia).", "Se añadió el campo 'contexto cultural' como atributo obligatorio en el panel docente."),
        ("RF-007", "El contenido comunitario debe ser doblemente filtrado; de lo contrario circulan errores ortográficos o mezclas indebidas con aymara.", "Se instauró el flujo de moderación con doble aprobación docente antes de publicar."),
        ("RF-009", "En distritos periurbanos de Sucre el internet es discontinuo; los alumnos no pueden depender de conectividad constante para hacer tareas.", "Se elevó la prioridad de la arquitectura offline Service Worker de Media a Alta."),
        ("RS-002", "Los celulares que poseen los estudiantes son de gama baja o usados; una aplicación pesada que sobrecaliente el móvil será desinstalada.", "Se impuso un umbral técnico restrictivo de consumo de RAM menor a 150 MB."),
        ("RS-003", "El quechua de Chuquisaca tiene variaciones frente al de Cochabamba o Potosí; debe respetarse la fonología y morfología local.", "Se fijó la variante dialectal Quechua Chanka/Collao de Chuquisaca como estándar base.")
    ]

    for r_idx, row in enumerate(obs_data, start=1):
        for c_idx, val in enumerate(row):
            cell = obs_table.cell(r_idx, c_idx)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            run = p.add_run(val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(9.5)
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run.font.bold = True

    add_p("Nota. Observaciones registradas textualmente en la minuta de validación del 12 de septiembre de 2026.", italic=True, space_before=4, space_after=12)

    add_h2("8.2 Acta de Conformidad y Firmas Digitales")
    add_p("Habiendo revisado y ajustado la totalidad de los requisitos especificados, las partes firmantes otorgan su plena conformidad a la presente versión 2.0 del SRS del Proyecto YAPU, autorizando el inicio de la Fase de Construcción de Software.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    add_p("Tabla 4\nRegistro de Firmas de Conformidad", bold=True)
    sign_table = doc.add_table(rows=5, cols=4)
    style_apa_table(sign_table)
    sign_headers = ["Nombre y Apellidos", "Rol en el Proyecto", "Firma", "Fecha"]
    for c_idx, h in enumerate(sign_headers):
        cell = sign_table.cell(0, c_idx)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_shading(cell, "F1F5F9")

    sign_rows = [
        ("Lic. María Elena Quispe Mamani", "Stakeholder Pedagógica — Docente Quechua", "[Firmado Digitalmente]", "12/09/2026"),
        ("Emmanuel Ponce Quiroga", "Líder Técnico & Gobernanza de IA", "[Firmado Digitalmente]", "12/09/2026"),
        ("Jhoel Álvaro Cruz Zurita", "Arquitectura VPS & Gestión de Datos", "[Firmado Digitalmente]", "12/09/2026"),
        ("Luis Mario Rocha Vela", "Aseguramiento de Calidad & Estándares APA", "[Firmado Digitalmente]", "12/09/2026")
    ]

    for r_idx, row in enumerate(sign_rows, start=1):
        for c_idx, val in enumerate(row):
            cell = sign_table.cell(r_idx, c_idx)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.space_before = Pt(3)
            run = p.add_run(val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(9.5)
            if c_idx in [1, 2, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if c_idx == 2:
                run.font.italic = True
                run.font.color.rgb = RGBColor(3, 105, 161)

    # -------------------------------------------------------------
    # 9. CONCLUSIONES
    # -------------------------------------------------------------
    add_h1("9. Conclusiones")
    add_p("La formalización de la Especificación de Requisitos de Software (SRS) para el Proyecto YAPU constituye un hito fundamental en la garantía de calidad del software. El empleo articulado del estándar IEEE 830, las historias de usuario y la semántica formal Gherkin ha permitido reconciliar los requerimientos pedagógicos de revitalización lingüística con las restricciones de ingeniería de software de bajo costo y alta disponibilidad.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p("La inclusión de requisitos de sostenibilidad garantiza que la plataforma no solo sea técnicamente viable, sino socialmente inclusiva y respetuosa del medio ambiente y del patrimonio cultural andino. La validación presencial-virtual con la Lic. María Elena Quispe consolida la legitimidad pedagógica de YAPU y allana el camino para la ejecución inmediata del Bolt 01 en el framework Astro.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    # -------------------------------------------------------------
    # 10. REFERENCIAS APA 7
    # -------------------------------------------------------------
    add_h1("10. Referencias")
    
    refs = [
        "Cerrón-Palomino, R. (2003). Lingüística quechua (2a ed.). Centro de Estudios Regionales Andinos Bartolomé de Las Casas.",
        "Constitución Política del Estado Plurinacional de Bolivia. (2009). Gaceta Oficial del Estado Plurinacional de Bolivia. La Paz, Bolivia.",
        "IEEE Computer Society. (2011). IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications. IEEE.",
        "Ministerio de Educación de Bolivia. (2023). Currículo Base del Sistema Educativo Plurinacional: Educación Intracultural, Intercultural y Plurilingüe. La Paz, Bolivia.",
        "Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner's approach (9a ed.). McGraw-Hill Education.",
        "Sommerville, I. (2016). Software engineering (10a ed.). Pearson Education.",
        "Wynne, M., & Hellesøy, A. (2017). The Cucumber book: Behaviour-driven development for testers and developers (2a ed.). Pragmatic Bookshelf."
    ]

    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.left_indent = Inches(0.5)
        p.paragraph_format.first_line_indent = Inches(-0.5) # Sangría francesa APA 7
        run = p.add_run(ref)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)

    # Guardar documento
    doc.save(output_path)
    print(f"Documento Word APA 7 guardado exitosamente en: {output_path}")

if __name__ == "__main__":
    out_dir = r"D:\Desarrollo\Yapu\Docs"
    os.makedirs(out_dir, exist_ok=True)
    target = os.path.join(out_dir, "Informe_SRS_APA7_Bloque2.docx")
    create_apa_srs_doc(target)
