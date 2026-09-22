<div align="center">

# 🌾 YAPU — Runasimi Yachay
### Plataforma Web Progresiva (PWA) de Aprendizaje de Lengua Quechua con IA Determinista

[![Astro](https://img.shields.io/badge/Astro-5.4-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-0D9488?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

<p align="center">
  <strong>YAPU</strong> (<em>Sembradío</em> en runasimi) es una plataforma educativa de alta eficiencia diseñada para la enseñanza, democratización y revitalización de la lengua originaria quechua (variante sureña Collao/Chuquisaca) en el Estado Plurinacional de Bolivia.
</p>

[Ver Documentación (SRS Bloque 2)](Docs/SRS_YAPU_Bloque2.md) • [Mapa de Diagramas UML/ERD](Docs/mapa_de_diagramas.md) • [Presentación del Proyecto](presentacion_ai_dlc_inception.html)

</div>

---

## 📋 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Características Principales](#-características-principales)
3. [Motor de IA Determinista](#-motor-de-ia-determinista-0-en-apis)
4. [Malla Curricular A1 (10 Niveles)](#-malla-curricular-a1-10-niveles)
5. [Estructura de Puertos (Rango ≥ 9500)](#-estructura-de-puertos-rango--9500)
6. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
7. [Infraestructura de Base de Datos (Docker Compose)](#-infraestructura-de-base-de-datos-docker-compose)
8. [Estructura del Proyecto](#-estructura-del-proyecto)
9. [Pruebas Automatizadas](#-pruebas-automatizadas)
10. [Equipo y Créditos Académicos](#-equipo-y-créditos-académicos)

---

## 🌟 Descripción General

YAPU nace dentro de la carrera de **Ingeniería de Sistemas / Ingeniería de Software** de la **Universidad Privada Domingo Savio (UPDS)**. Cumple con el estándar **IEEE Std 830-1998** adaptado al paradigma ágil y cuenta con validación pedagógica en campo por la docente de quechua **Lic. María Elena Quispe Mamani** (Unidad Educativa Simón Bolívar, Sucre).

### Objetivos Pedagógicos y Técnicos
- **Nivel Certificable A1**: Abarca los primeros 10 niveles fundamentales de vocabulario, parentesco, números, colores, fauna, gastronomía, cuerpo humano, hogar, verbos de acción y cosmovisión andina.
- **Inclusión Digital y Sostenibilidad (RS-002)**: Diseñada para funcionar fluidamente en teléfonos móviles económicos (consumo de RAM menor a 150 MB).
- **Funcionamiento Offline-First (RF-009)**: Capacidad de estudio y resolución de evaluaciones sin conexión a internet en zonas rurales mediante Service Workers y almacenamiento local reactivo.

---

## 🚀 Características Principales

- **✨ Animación Reactiva de Partículas (React Bits)**:
  - Hero interactivo con física de partículas en tiempo real sobre Canvas HTML5 basado en [React Bits Particle Text](https://reactbits.dev/text-animations/particle-text).
  - Efectos de resorte y dispersión táctil/cursor con paleta andina (oro inti `#F59E0B`, aguayo turquesa `#0D9488` y terracota `#B94700`).
- **🃏 Tarjetas de Estudio 3D (Flashcards)**:
  - Tarjetas interactivas con giro 3D (anverso: término quechua + pronunciación fonética, reverso: traducción al español, ejemplos contextualizados y notas culturales).
  - Marcado ágil de palabras: *"¡Ya me la sé!"* vs *"Necesito Repasar"*.
- **📊 Tablero del Estudiante (Dashboard)**:
  - Métricas visuales de racha diaria de estudio, total de vocabulario dominado, porcentaje de avance y cola inteligente de repaso espaciado.
- **👥 Ayllu Virtual (Comunidad de Retos)**:
  - Estudiantes con nivel 7 o superior pueden proponer retos y redacciones en runasimi, que pasan por moderación docente antes de publicarse.
- **🎓 Panel Docente & Datos Abiertos (RS-004)**:
  - Creación de nuevas oraciones base para alimentar la IA, cola de moderación y exportación libre del corpus lingüístico en formato CSV para investigadores.

---

## 🤖 Motor de IA Determinista ($0 en APIs)

A diferencia de las soluciones dependientes de LLMs comerciales con costos recurrentes y riesgo de alucinación lingüística, YAPU incorpora un **Motor de IA Determinista** ejecutado 100% en el cliente en TypeScript (`src/lib/ai/deterministic-engine.ts`):

```
┌─────────────────────────────────────────────────────────────┐
│                 MOTOR DE IA DETERMINISTA                    │
│                                                             │
│  [ Oraciones Base ] ──> Permutación Cloze (Espacios vacíos) │
│  [ Vocabulario    ] ──> Traducción Directa e Inversa        │
│                                │                            │
│                                ▼                            │
│               Filtro de Misma Categoría Gramatical           │
│        (Distractores verosímiles: sustantivo con sustantivo)│
│                                │                            │
│                                ▼                            │
│           Evaluación de 10 Preguntas (4 Opciones)           │
│                                │                            │
│                                ▼                            │
│                Calificación Local Inmediata                 │
│         • Aprobado: ≥ 70% (Desbloquea Siguiente Nivel)      │
│         • Reprobado: < 70% (Retroalimentación Pedagógica)   │
└─────────────────────────────────────────────────────────────┘
```

- **Distractores Verosímiles**: Evita opciones absurdas seleccionando candidatos de la **misma categoría gramatical** (sustantivo, verbo, adjetivo, número, etc.).
- **Umbral de Aprobación del 70%**: Calificación estricta acordada con la stakeholder pedagógica.

---

## 📚 Malla Curricular A1 (10 Niveles)

| Nivel | Título Quechua | Título Español | Enfoque Temático |
| :---: | :--- | :--- | :--- |
| **1** | **Rimaykuna** | Saludos y Cortesía | Fórmulas de saludo, agradecimiento (*Sulpayki*) y despedida (*Tinkunakama*). |
| **2** | **Ayllu** | Familia y Comunidad | Parentesco andino (*Mama*, *Tata*, *Wawa*, *Wawqi*, *Pana*). |
| **3** | **Yupaykuna** | Números y Cantidades | Sistema decimal del 1 al 10 y dualidad complementaria (*Yanantin*). |
| **4** | **Llimp'ikuna** | Colores y Textiles | Colores del arte textil del aguayo (*Puka*, *Q'illu*, *Anqas*, *Q'umir*). |
| **5** | **Uywakuna** | Animales Andinos | Fauna de la cordillera y valles (*Kuntur*, *Llama*, *Allqo*, *Wisk'acha*). |
| **6** | **Mikhuna** | Alimentos y Cosecha | Frutos de la tierra (*Sara*, *Papa*, *Kinwa*, *Yaku*, elaboración de chuño). |
| **7** | **Kurku** | Cuerpo y Bienestar | Anatomía y cooperación comunitaria (*Uma*, *Maki*, *Chaki*, *Sonqo*). |
| **8** | **Wasinchik** | La Casa y el Entorno | Espacios del hogar andino (*Wasi*, *Punku*, *Tawna*). |
| **9** | **Ruwaykuna** | Acciones y Trabajo | Verbos agrícolas y faena comunitaria (*Tarpuy*, *Away*, *Llamk'ay*). |
| **10** | **Pacha** | Cosmovisión y Tiempo | Fuerzas sagradas y cosmos (*Inti*, *Killa*, *Pachamama*, *Ch'aska*). |

---

## 🔌 Estructura de Puertos (Rango ≥ 9500)

Para evitar colisiones con otros entornos de desarrollo locales, todos los servicios de YAPU se mapean a partir del puerto **9500**:

| Servicio | Puerto Host | Descripción | URL Local |
| :--- | :---: | :--- | :--- |
| **YAPU PWA (Frontend)** | **`9500`** | Servidor web Astro / React (Dev y Preview) | [`http://localhost:9500`](http://localhost:9500) |
| **API Microservicio** | **`9501`** | Endpoint para servicios adicionales | `http://localhost:9501` |
| **PostgreSQL 16** | **`9532`** | Base de datos relacional principal (`yapu_db`) | `localhost:9532` |
| **MySQL 8.0** | **`9506`** | Base de datos relacional alternativa (`yapu_db`) | `localhost:9506` |
| **Adminer** | **`9580`** | Administrador web gráfico de bases de datos | [`http://localhost:9580`](http://localhost:9580) |
| **Redis 7** | **`9579`** | Motor de caché en memoria | `localhost:9579` |

---

## 💻 Instalación y Puesta en Marcha

### Requisitos Previos
- **Node.js**: `v20.0.0` o superior (probado en Node `v22.23.2`)
- **npm**: `v10.0.0` o superior
- **Docker & Docker Compose** *(opcional, para bases de datos SQL)*

### 1. Clonar el Repositorio
```bash
git clone https://github.com/upds-software-engineering/Yapu.git
cd Yapu
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre en tu navegador:
👉 **[http://localhost:9500](http://localhost:9500)**

Para acceder desde tu smartphone conectado a la misma red WiFi, utiliza la dirección IP de tu máquina en el puerto `9500` (ej: `http://192.168.1.X:9500`).

### 4. Compilar para Producción
```bash
npm run build
```
Genera la distribución optimizada en la carpeta `dist/` con las 24 rutas estáticas pre-renderizadas.

---

## 🐳 Infraestructura de Base de Datos (Docker Compose)

El proyecto incluye un archivo [`docker-compose.yml`](docker-compose.yml) listo para producción o desarrollo local:

```bash
# Levantar PostgreSQL, MySQL, Adminer y Redis
docker compose up -d

# Detener los servicios
docker compose down
```

- **Acceso a Adminer**: [`http://localhost:9580`](http://localhost:9580)
- **Credenciales por defecto**:
  - Sistema: PostgreSQL (servidor: `postgres`) o MySQL (servidor: `mysql`)
  - Usuario: `yapu_user`
  - Contraseña: `yapu_secure_password`
  - Base de datos: `yapu_db`

---

## 📁 Estructura del Proyecto

```
Yapu/
├── .github/                   # Workflows y configuración de GitHub
├── Docs/                      # Especificación SRS APA 7, actas Inception y diagramas
│   ├── Meetings/              # Minutas de reuniones y decisiones técnicas
│   ├── mapa_de_diagramas.md   # Modelado de datos ERD y diagramas UML
│   └── SRS_YAPU_Bloque2.md    # Especificación IEEE Std 830 con Gherkin BDD
├── public/                    # Archivos públicos estáticos
│   ├── icons/                 # Iconos PWA (192px y 512px con Chakana)
│   ├── favicon.svg            # Favicon SVG temático
│   ├── manifest.json          # Manifiesto de instalación PWA
│   └── sw.js                  # Service Worker para funcionamiento offline
├── scripts/                   # Scripts utilitarios y de verificación
│   ├── generate-icons.py      # Generador de iconos PWA
│   └── test-engine.mjs        # Suite de pruebas automatizadas de IA determinista
├── src/                       # Código fuente de la aplicación
│   ├── components/            # Componentes interactivos de UI (React)
│   │   ├── CommunitySection.tsx  # Ayllu virtual y publicación de retos
│   │   ├── Dashboard.tsx         # Tablero de progreso del estudiante
│   │   ├── DocentePanel.tsx      # Gestión docente y moderación
│   │   ├── FlashcardLesson.tsx   # Tarjetas interactivas de vocabulario 3D
│   │   ├── LevelMap.tsx          # Mapa visual de los 10 niveles
│   │   ├── Navigation.tsx        # Barra de navegación adaptable (Desktop & Mobile)
│   │   ├── ParticleText.tsx      # Animación de partículas Canvas (React Bits)
│   │   └── QuizRunner.tsx        # Examen interactivo de IA determinista
│   ├── data/                  # Semillas y corpus lingüístico
│   │   └── seed-levels.ts     # Corpus de 10 niveles, palabras y oraciones base
│   ├── layouts/               # Plantillas base
│   │   └── Layout.astro       # Layout principal HTML5 / PWA con banner offline
│   ├── lib/                   # Librerías de lógica de negocio y persistencia
│   │   ├── ai/                # Motor de IA determinista (TypeScript)
│   │   │   └── deterministic-engine.ts
│   │   └── storage/           # Capa de almacenamiento local reactivo
│   │       └── local-repository.ts
│   ├── pages/                 # Rutas de la aplicación (Astro SSG)
│   │   ├── community.astro    # Página de comunidad y retos
│   │   ├── dashboard.astro    # Tablero de progreso del estudiante
│   │   ├── docente.astro      # Panel de administración docente
│   │   ├── index.astro        # Portada / Hero y Mapa de Niveles
│   │   ├── lesson/            # Rutas dinámicas de lecciones (/lesson/[level])
│   │   └── quiz/              # Rutas dinámicas de exámenes (/quiz/[level])
│   ├── styles/                # Estilos globales y utilidades
│   │   └── global.css         # Directivas Tailwind y estilos 3D
│   └── types/                 # Definiciones de tipos TypeScript
│       └── domain.ts          # Interfaces según diagrama ERD
├── .env.example               # Plantilla de variables de entorno y puertos
├── .gitignore                 # Reglas de exclusión de Git
├── astro.config.mjs           # Configuración de Astro, React y Tailwind
├── docker-compose.yml         # Contenedores para PostgreSQL, MySQL, Adminer y Redis
├── package.json               # Dependencias y scripts del proyecto
├── tailwind.config.mjs        # Paleta de colores andinos y tokens de diseño
└── tsconfig.json              # Configuración TypeScript estricta
```

---

## 🧪 Pruebas Automatizadas

El motor de IA determinista cuenta con una suite completa de pruebas unitarias que evalúa:
1. Generación de 10 preguntas con 4 opciones únicas por cada uno de los 10 niveles.
2. Inclusión de la respuesta correcta sin duplicación de distractores.
3. Compatibilidad de categorías gramaticales en los distractores.
4. Cumplimiento del umbral del 70% para aprobación.

Para ejecutar las pruebas:
```bash
node --experimental-strip-types scripts/test-engine.mjs
```
**Resultado actual**: `304 de 304 pruebas exitosas (100% de aprobación)`.

---

## 👥 Equipo y Créditos Académicos

Proyecto desarrollado en la materia de **Ingeniería de Software** — **Universidad Privada Domingo Savio (UPDS)**:

- **Docente de la Materia**: Ing. Jimmy Nataniel Requena / Ing. Fernando Pardo
- **Equipo de Desarrollo**:
  - **Emmanuel Ponce Quiroga** — *Líder Técnico & Gobernanza de IA*
  - **Jhoel Álvaro Cruz Zurita** — *Arquitectura VPS & Gestión de Datos*
  - **Luis Mario Rocha Vela** — *Aseguramiento de Calidad & Estándares APA*
- **Stakeholder Pedagógica**:
  - **Lic. María Elena Quispe Mamani** — *Docente Titular de Lengua Quechua (U.E. "Simón Bolívar", Sucre, Bolivia)*

---

<div align="center">
  <sub>YAPU — Runasimita yachakuna kusisqa kawsanapaq (Aprendamos quechua para vivir en armonía).</sub>
</div>
