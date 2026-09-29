import { expect, type Page } from '@playwright/test';
import { irA, prepararPerfilDocente, prepararPerfilEstudiante } from './sesion';

/**
 * Medidas automáticas de las leyes UX (Fitts, Hick, Miller, Apogeo-Final, Estética-Usabilidad).
 *
 * Todo se mide sobre el DOM real ya pintado, con `getBoundingClientRect()` y
 * `getComputedStyle()` —las mismas medidas que percibe quien usa la aplicación—, nunca sobre las
 * clases de Tailwind. Las funciones son autocontenidas dentro de `page.evaluate` porque Playwright
 * serializa el código: no pueden referenciar constantes de este módulo.
 *
 * Fitts: los umbrales son 44 px en móvil y 24 px en escritorio; la separación mínima entre
 * objetivos adyacentes es de 8 px (`spacing['separacion-objetivos']` en `tailwind.config.mjs`).
 */

/** Objetivos interactivos que audita la ley de Fitts. */
const SELECTOR_OBJETIVOS = 'a, button, [role="button"], input, select, [role="tab"]';

/** Fitts: separación mínima exigida entre objetivos adyacentes del mismo contenedor. */
export const SEPARACION_MINIMA = 8;

/** Fitts: mínimo táctil en móvil (token `min-h-tactil` / `min-w-tactil` = 2.75rem). */
export const MINIMO_MOVIL = 44;

/** Fitts: mínimo en escritorio (token `min-h-tactil-escritorio` / `min-w-tactil-escritorio`). */
export const MINIMO_ESCRITORIO = 24;

/** Estética-Usabilidad: máximo de tamaños tipográficos computados por pantalla. */
export const MAXIMO_TAMANOS_TIPOGRAFICOS = 4;

/**
 * Tolerancia de redondeo, en px, para las comparaciones de Fitts.
 *
 * `getBoundingClientRect()` devuelve subpíxeles (44 px reales pueden medirse como 43.9999), así que
 * las comparaciones contra un umbral exacto admiten medio píxel de holgura.
 */
export const TOLERANCIA_PX = 0.5;

/** Hick: máximo de destinos de navegación visibles. */
export const MAXIMO_ENLACES_NAVEGACION = 7;

/**
 * Rutas LÓGICAS auditadas por las leyes UX.
 *
 * Son las seis pantallas del recorrido crítico y se auditan en los DOS proyectos de
 * `playwright.config.ts` (Pixel 5 y Desktop Chrome), porque los umbrales táctiles cambian con el
 * viewport.
 */
export const PANTALLAS_UX: readonly string[] = [
  '/',
  '/dashboard',
  '/community',
  '/docente',
  '/lesson/1',
  '/quiz/1'
];

/**
 * Deja preparado el perfil que cada pantalla necesita antes de abrirla.
 *
 * El panel docente sólo se monta con rol docente (RF-002); el resto de pantallas se auditan con un
 * perfil de estudiante en el nivel 1, con XP y racha no nulos para que las métricas del tablero
 * tengan contenido real y no sólo estados vacíos.
 */
export async function prepararPerfilParaRuta(page: Page, rutaLogica: string): Promise<void> {
  if (rutaLogica === '/docente') {
    await prepararPerfilDocente(page);
    return;
  }

  await prepararPerfilEstudiante(page, {
    nivelActual: 1,
    nivelesAprobados: [],
    xp: 120,
    rachaDias: 3
  });
}

/**
 * Elemento que confirma que la pantalla TERMINÓ de montar.
 *
 * `[data-pantalla]` existe también durante la carga, así que medir con ese ancla tomaría medidas de
 * un estado intermedio. Cada ancla es contenido que sólo aparece con los datos ya resueltos.
 */
const ANCLA_POR_RUTA: Record<string, string> = {
  '/': '[data-tramo]',
  '/dashboard': '[data-estadistica="progreso"]',
  '/community': '[data-aviso="nivel-insuficiente"], [data-formulario="reto"]',
  '/docente': '[data-formulario="oracion"]',
  '/lesson/1': '[data-flashcard]',
  '/quiz/1': '[data-opcion]'
};

/**
 * Prepara el perfil que la pantalla necesita, la abre y espera a que su contenido esté montado.
 *
 * Es el punto de entrada de las pruebas de leyes UX y de accesibilidad: medir o auditar antes de que
 * la pantalla termine de cargar daría resultados de un estado que nadie llega a ver.
 */
export async function abrirPantalla(page: Page, rutaLogica: string): Promise<void> {
  await prepararPerfilParaRuta(page, rutaLogica);
  await irA(page, rutaLogica);

  const ancla = ANCLA_POR_RUTA[rutaLogica];
  if (ancla !== undefined) {
    await expect(page.locator(ancla).first()).toBeVisible();
  }
}

/** Medida de un objetivo táctil visible: su caja real y una descripción legible para el reporte. */
export interface MedidaObjetivo {
  /** `tag[data-…] "texto"`: permite localizar el objetivo incumplidor en el reporte. */
  descripcion: string;
  ancho: number;
  alto: number;
}

/** Separación entre objetivos adyacentes de un contenedor. */
export interface SeparacionObjetivos {
  /** Hueco mínimo en px; `null` cuando no hay dos objetivos visibles que comparar. */
  minima: number | null;
  /** Pares adyacentes medidos. */
  pares: number;
}

/** Tamaños tipográficos computados distintos de una pantalla, con una muestra de texto por tamaño. */
export interface TamanosTipograficos {
  /** Tamaños (`px`) de menor a mayor. */
  tamanos: string[];
  /** Ejemplo de texto por tamaño, para adjuntarlo al reporte. */
  muestras: Array<{ tamano: string; texto: string }>;
}

/**
 * Fitts — mide los objetivos interactivos VISIBLES que caben en el viewport.
 *
 * Criterio de exclusión (documentado porque es el que decide qué se audita):
 *  - elementos sin caja (`0 × 0`) o con `display: none` / `visibility: hidden`;
 *  - elementos `sr-only` (caja de 1×1 recortada): existen para lectores de pantalla, no son
 *    objetivos táctiles de verdad, así que no se les puede exigir 44 px;
 *  - elementos deshabilitados (`disabled` o `aria-disabled="true"`): no reciben toques;
 *  - elementos fuera del viewport: no son alcanzables sin desplazar la pantalla.
 */
export async function medirObjetivosTactiles(page: Page): Promise<MedidaObjetivo[]> {
  return page.evaluate((selector): MedidaObjetivo[] => {
    const ATRIBUTOS_MEDIBLES = [
      'data-cta',
      'data-accion',
      'data-nav-enlace',
      'data-opcion',
      'data-flashcard',
      'data-ver-mas',
      'data-palabra-repasar',
      'data-indicador-paso'
    ];

    const esVisible = (nodo: Element): boolean => {
      const estilo = window.getComputedStyle(nodo);
      if (estilo.display === 'none' || estilo.visibility === 'hidden') return false;
      if (nodo.classList.contains('sr-only')) return false;
      const recorte = `${estilo.clipPath} ${estilo.clip}`;
      if (recorte.includes('inset(50%)') || recorte.includes('rect(0px, 0px, 0px, 0px)')) return false;
      return nodo.getClientRects().length > 0;
    };

    const estaDeshabilitado = (nodo: Element): boolean => {
      if (nodo instanceof HTMLButtonElement || nodo instanceof HTMLInputElement) return nodo.disabled;
      if (nodo instanceof HTMLSelectElement) return nodo.disabled;
      return nodo.getAttribute('aria-disabled') === 'true';
    };

    const descripcionDe = (nodo: Element): string => {
      const marcas = ATRIBUTOS_MEDIBLES.filter((clave) => nodo.hasAttribute(clave))
        .map((clave) => `[${clave}="${nodo.getAttribute(clave) ?? ''}"]`)
        .join('');
      const texto = (nodo.getAttribute('aria-label') ?? nodo.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 48);
      return `${nodo.tagName.toLowerCase()}${marcas} "${texto}"`;
    };

    const medidas: MedidaObjetivo[] = [];

    for (const nodo of document.querySelectorAll(selector)) {
      if (!esVisible(nodo) || estaDeshabilitado(nodo)) continue;

      const caja = nodo.getBoundingClientRect();
      if (caja.width <= 0 || caja.height <= 0) continue;

      const dentroDelViewport =
        caja.bottom > 0 &&
        caja.right > 0 &&
        caja.top < window.innerHeight &&
        caja.left < window.innerWidth;
      if (!dentroDelViewport) continue;

      medidas.push({
        descripcion: descripcionDe(nodo),
        ancho: Math.round(caja.width * 100) / 100,
        alto: Math.round(caja.height * 100) / 100
      });
    }

    return medidas;
  }, SELECTOR_OBJETIVOS);
}

/** Hick — cuenta los `[data-cta="primario"]` realmente visibles de la pantalla. */
export async function contarCtasPrimarios(page: Page): Promise<number> {
  return page.locator('[data-cta="primario"]:visible').count();
}

/** Descripción legible de los CTA primarios visibles, para los mensajes de fallo. */
export async function describirCtasPrimarios(page: Page): Promise<string[]> {
  return page.locator('[data-cta="primario"]:visible').evaluateAll((nodos) =>
    nodos.map((nodo) => {
      const texto = (nodo.getAttribute('aria-label') ?? nodo.textContent ?? '').replace(/\s+/g, ' ').trim();
      return `${nodo.tagName.toLowerCase()} "${texto.slice(0, 48)}"`;
    })
  );
}

/**
 * Estética-Usabilidad — tamaños tipográficos COMPUTADOS distintos entre los nodos de texto visibles.
 *
 * Se recorren los nodos de texto reales (no los elementos contenedores) para no contar tamaños
 * heredados que nadie lee. Se excluyen `<svg>` y `<canvas>` (ilustraciones y confeti, sin texto
 * legible), los subárboles `aria-hidden="true"` (caras ocultas de la flashcard, iconos) y los nodos
 * cuyo texto está vacío. El resultado se ordena de menor a mayor para que el reporte sea legible.
 */
export async function tamanosTipograficos(page: Page): Promise<TamanosTipograficos> {
  const muestras = await page.evaluate((): Array<{ tamano: string; texto: string }> => {
    const EXCLUIDOS = 'svg, canvas, [aria-hidden="true"]';

    const esVisible = (nodo: Element): boolean => {
      const estilo = window.getComputedStyle(nodo);
      if (estilo.display === 'none' || estilo.visibility === 'hidden') return false;
      return nodo.getClientRects().length > 0;
    };

    const encontrados = new Map<string, string>();
    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    for (let nodo = caminante.nextNode(); nodo !== null; nodo = caminante.nextNode()) {
      const texto = (nodo.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (texto.length === 0) continue;

      const padre = nodo.parentElement;
      if (padre === null) continue;
      if (padre.closest(EXCLUIDOS) !== null) continue;
      if (!esVisible(padre)) continue;

      const tamano = window.getComputedStyle(padre).fontSize;
      if (!encontrados.has(tamano)) encontrados.set(tamano, texto.slice(0, 40));
    }

    return [...encontrados.entries()].map(([tamano, texto]) => ({ tamano, texto }));
  });

  const ordenadas = [...muestras].sort(
    (a, b) => Number.parseFloat(a.tamano) - Number.parseFloat(b.tamano)
  );

  return { tamanos: ordenadas.map((muestra) => muestra.tamano), muestras: ordenadas };
}

/**
 * Fitts — separación mínima entre objetivos ADYACENTES.
 *
 * `selector` identifica el contenedor que se audita (`[data-nav="movil"]`) o, directamente, los
 * propios objetivos (`[data-opcion]`). En ambos casos se toman los objetivos visibles en orden de
 * documento y se mide el hueco entre cada pareja consecutiva: la distancia horizontal si están uno
 * al lado del otro, la vertical si están apilados y la distancia real entre esquinas si están en
 * diagonal. Devuelve `minima: null` cuando no hay parejas que medir (por ejemplo, `[data-opcion]` en
 * una pantalla sin evaluación, o la barra móvil en escritorio, donde está `display: none`).
 */
export async function separacionMinima(page: Page, selector: string): Promise<SeparacionObjetivos> {
  return page.evaluate(
    ({ contenedor, objetivos }): SeparacionObjetivos => {
      const esVisibleConTamano = (nodo: Element): boolean => {
        if (nodo.classList.contains('sr-only')) return false;
        const estilo = window.getComputedStyle(nodo);
        if (estilo.display === 'none' || estilo.visibility === 'hidden') return false;
        const caja = nodo.getBoundingClientRect();
        return caja.width > 0 && caja.height > 0;
      };

      const visibles = [...document.querySelectorAll(contenedor)]
        .flatMap((nodo) => (nodo.matches(objetivos) ? [nodo] : [...nodo.querySelectorAll(objetivos)]))
        .filter(esVisibleConTamano);

      let minima: number | null = null;
      let pares = 0;

      for (let indice = 1; indice < visibles.length; indice += 1) {
        const anterior = visibles[indice - 1];
        const siguiente = visibles[indice];
        if (anterior === undefined || siguiente === undefined) continue;

        const cajaAnterior = anterior.getBoundingClientRect();
        const cajaSiguiente = siguiente.getBoundingClientRect();
        const huecoHorizontal = Math.max(
          0,
          Math.max(cajaAnterior.left, cajaSiguiente.left) -
            Math.min(cajaAnterior.right, cajaSiguiente.right)
        );
        const huecoVertical = Math.max(
          0,
          Math.max(cajaAnterior.top, cajaSiguiente.top) -
            Math.min(cajaAnterior.bottom, cajaSiguiente.bottom)
        );
        const hueco =
          huecoHorizontal > 0 && huecoVertical > 0
            ? Math.hypot(huecoHorizontal, huecoVertical)
            : Math.max(huecoHorizontal, huecoVertical);

        pares += 1;
        const redondeado = Math.round(hueco * 100) / 100;
        if (minima === null || redondeado < minima) minima = redondeado;
      }

      return { minima, pares };
    },
    { contenedor: selector, objetivos: SELECTOR_OBJETIVOS }
  );
}
