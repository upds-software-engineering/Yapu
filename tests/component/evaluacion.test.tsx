import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import {
  crearAdaptadores,
  establecerContenedor,
  reiniciarContenedor
} from '@infrastructure/container';
import {
  BorradorEvaluacionMemoria,
  CatalogoMemoriaRepository,
  ProgresoMemoriaRepository
} from '@infrastructure/persistence/memory';
import { Evaluacion, debeLanzarConfeti } from '@ui/components/evaluacion';
import { ruta } from '@ui/lib/ruta';

/**
 * [RF-005] Pruebas de componente de la evaluación determinista con IA.
 *
 * Se monta el composition root real (`crearAdaptadores(null)`) sobre adaptadores en memoria: el
 * mismo camino que usa la aplicación, cambiando sólo el catálogo (vocabulario controlado) y el
 * progreso (nivel del estudiante). Las respuestas correctas se leen del borrador, que es la única
 * copia que las conoce, igual que hace el caso de uso al calificar.
 */

const NIVEL_EVALUADO = 1;
/** Nivel fuera del alcance de un estudiante nuevo: dispara RN-01. */
const NIVEL_LEJANO = 7;

/** Utilidades tipográficas crudas prohibidas: la escala del proyecto tiene cuatro pasos. */
const TIPOGRAFIA_CRUDA = /text-(xs|sm|base|lg|xl|2xl|3xl)\b/;
/** Tamaños admitidos por la escala de `tailwind.config.mjs`. */
const TAMANOS_PERMITIDOS = new Set(['text-caption', 'text-body', 'text-title', 'text-display']);

/**
 * Seis palabras del MISMO nivel y categoría: producen 12 candidatas (dos formatos por palabra) y
 * siempre tres distractores únicos, así que el generador alcanza las 10 preguntas objetivo
 * (RN-09 y RN-10) sin necesitar oraciones base.
 */
const PALABRAS: readonly Palabra[] = Array.from({ length: 6 }, (_sinUso, posicion) =>
  Palabra.crear({
    id: `practica-${posicion + 1}`,
    nivelId: NIVEL_EVALUADO,
    termino: `rimay${posicion + 1}`,
    traduccion: `conversar ${posicion + 1}`,
    pronunciacion: `rimay${posicion + 1}`,
    categoria: 'verbo',
    contextoCultural: `Contexto cultural de rimay${posicion + 1}.`,
    ejemploUso: `Rimay${posicion + 1} rimay.`
  })
);

const NIVELES: readonly Nivel[] = [
  Nivel.crear({
    id: NIVEL_EVALUADO,
    tituloQuechua: 'Huk',
    tituloEspanol: 'Uno',
    descripcion: 'Saludos y verbos de uso diario.',
    icono: 'Sparkles',
    colorAcento: '#E05A00'
  })
];

interface Entorno {
  borrador: BorradorEvaluacionMemoria;
  progreso: ProgresoMemoriaRepository;
}

/** Monta la pantalla con el nivel pedido y el nivel actual del estudiante. */
async function montarEvaluacion(nivelId: number, nivelActual = 1): Promise<Entorno> {
  const base = crearAdaptadores(null);
  const { usuarioId } = await base.sesion.obtener();

  const progreso = new ProgresoMemoriaRepository();
  await progreso.guardar(
    ProgresoEstudiante.reconstruir({
      estudianteId: usuarioId,
      nivelActual,
      cursoCompletado: false,
      xp: 0,
      rachaDias: 0,
      fechaUltimaActividad: null,
      nivelesAprobados: [],
      palabras: {}
    })
  );

  const borrador = new BorradorEvaluacionMemoria();

  establecerContenedor({
    ...base,
    catalogo: new CatalogoMemoriaRepository(NIVELES, PALABRAS),
    progreso,
    borrador
  });

  render(<Evaluacion nivelId={nivelId} />);

  return { borrador, progreso };
}

function botonDeAccion(accion: 'siguiente' | 'anterior'): HTMLButtonElement {
  const boton = document.querySelector<HTMLButtonElement>(`[data-accion="${accion}"]`);
  if (boton === null) throw new Error(`No se encontró el botón "${accion}".`);
  return boton;
}

function opcionesDeLaPregunta(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[data-opcion]'));
}

function marcarOpcion(texto: string): void {
  const objetivo = opcionesDeLaPregunta().find(
    (opcion) => opcion.getAttribute('data-opcion') === texto
  );
  if (objetivo === undefined) throw new Error(`No se encontró la opción "${texto}".`);
  fireEvent.click(objetivo);
}

async function esperarPregunta(): Promise<void> {
  await waitFor(() => {
    expect(document.querySelector('[data-pregunta]')).not.toBeNull();
  });
}

async function esperarResultado(): Promise<void> {
  await waitFor(() => {
    expect(document.querySelector('[data-pantalla="resultado"]')).not.toBeNull();
  });
}

/** Enunciado que se está mostrando, para localizar su pregunta en el borrador. */
function enunciadoVisible(): string {
  return document.querySelector('[data-pregunta] h2')?.textContent ?? '';
}

/** Marca la opción correcta (o una incorrecta) de la pregunta visible. */
function responderPregunta(borrador: BorradorEvaluacionMemoria, acertar: boolean): void {
  const guardado = borrador.obtener(NIVEL_EVALUADO);
  const enunciado = enunciadoVisible();
  const pregunta = guardado?.preguntas.find((item) => item.enunciado === enunciado);

  if (pregunta === undefined) {
    throw new Error('La pregunta visible no está en el borrador de la evaluación.');
  }

  const incorrecta = pregunta.opciones.find((opcion) => opcion !== pregunta.opcionCorrecta);
  const elegida = acertar ? pregunta.opcionCorrecta : incorrecta;

  if (elegida === undefined) {
    throw new Error('La pregunta no ofrece ninguna opción con la que responder.');
  }

  marcarOpcion(elegida);
}

/** Responde el examen completo y pulsa «Calificar evaluación» en la última pregunta. */
function responderTodo(borrador: BorradorEvaluacionMemoria, acertar: boolean): void {
  const total = borrador.obtener(NIVEL_EVALUADO)?.preguntas.length ?? 0;
  expect(total).toBeGreaterThanOrEqual(5);

  for (let posicion = 0; posicion < total; posicion += 1) {
    responderPregunta(borrador, acertar);
    fireEvent.click(botonDeAccion('siguiente'));
  }
}

describe('[RF-005] Evaluación con IA determinista', () => {
  afterEach(() => {
    reiniciarContenedor();
  });

  it('[RN-16] exige marcar una respuesta para avanzar y conserva los cambios al volver atrás', async () => {
    // Dado un examen del nivel 1 recién generado
    await montarEvaluacion(NIVEL_EVALUADO);
    await esperarPregunta();

    // Cuando se mira el avance sin ninguna respuesta marcada
    expect(document.querySelector('[data-pantalla="evaluacion"]')).not.toBeNull();
    expect(screen.getByText(/^Pregunta 1 de \d+$/)).toBeInTheDocument();
    expect(screen.getByText(/^\d+% para aprobar$/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Avance de la evaluación' })).toBeInTheDocument();
    expect(botonDeAccion('siguiente')).toBeDisabled();
    expect(botonDeAccion('siguiente')).toHaveAttribute('aria-disabled', 'true');
    expect(botonDeAccion('anterior')).toBeDisabled();

    // Y se pulsa el avance por código: la regla se aplica también en la lógica, no sólo en el atributo
    fireEvent.click(botonDeAccion('siguiente'));
    expect(document.querySelector('[data-pregunta]')).toHaveAttribute('data-indice', '0');

    // Y se marcan las cuatro opciones (letras A–D) de la primera pregunta
    const primera = opcionesDeLaPregunta();
    expect(primera).toHaveLength(4);
    expect(primera[0]?.textContent?.startsWith('A')).toBe(true);
    expect(primera[3]?.textContent?.startsWith('D')).toBe(true);

    const primeraOpcion = primera[0];
    if (primeraOpcion === undefined) throw new Error('La pregunta no tiene opciones.');
    fireEvent.click(primeraOpcion);

    // Entonces el avance queda habilitado y la opción se anuncia como marcada
    expect(botonDeAccion('siguiente')).not.toBeDisabled();
    expect(botonDeAccion('siguiente')).toHaveAttribute('aria-disabled', 'false');
    expect(primeraOpcion).toHaveAttribute('aria-pressed', 'true');

    // Cuando avanza a la segunda pregunta y vuelve atrás
    fireEvent.click(botonDeAccion('siguiente'));
    expect(document.querySelector('[data-pregunta]')).toHaveAttribute('data-indice', '1');
    fireEvent.click(botonDeAccion('anterior'));
    expect(document.querySelector('[data-pregunta]')).toHaveAttribute('data-indice', '0');

    // Entonces la respuesta marcada sigue guardada
    const recuperada = opcionesDeLaPregunta().find(
      (opcion) => opcion.getAttribute('aria-pressed') === 'true'
    );
    if (recuperada === undefined) throw new Error('La respuesta marcada no se conservó.');
    expect(recuperada.getAttribute('data-opcion')).toBe(primeraOpcion.getAttribute('data-opcion'));

    // Cuando cambia la respuesta antes de calificar
    const otra = opcionesDeLaPregunta().find(
      (opcion) => opcion.getAttribute('data-opcion') !== recuperada.getAttribute('data-opcion')
    );
    if (otra === undefined) throw new Error('La pregunta no tiene una segunda opción.');
    fireEvent.click(otra);

    // Entonces la marca se mueve a la nueva opción y la anterior queda libre
    expect(otra).toHaveAttribute('aria-pressed', 'true');
    expect(recuperada).toHaveAttribute('aria-pressed', 'false');
  });

  it('[RN-01] bloquea la evaluación de un nivel superior y ofrece volver al nivel actual', async () => {
    // Dado un estudiante en el nivel 1 que abre la evaluación del nivel 7
    await montarEvaluacion(NIVEL_LEJANO, 1);

    // Cuando la generación falla con el código NIVEL_BLOQUEADO
    await waitFor(() => {
      expect(document.querySelector('[data-pantalla="nivel-bloqueado"]')).not.toBeNull();
    });

    // Entonces se explica el bloqueo, se indica el nivel actual y hay un único CTA primario
    const pantalla = document.querySelector('[data-pantalla="nivel-bloqueado"]');
    expect(pantalla).toHaveTextContent('nivel 1');
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);

    const cta = document.querySelector('[data-cta="primario"]');
    expect(cta).toHaveTextContent('Ir a mi nivel actual');
    expect(cta).toHaveAttribute('href', ruta('/'));
    expect(document.querySelector('[data-pregunta]')).toBeNull();
  });

  it('[UX-APOGEO] al aprobar celebra el clímax con XP, insignia y un único CTA primario', async () => {
    // Dado un examen del nivel 1 que se responde entero y bien
    const entorno = await montarEvaluacion(NIVEL_EVALUADO);
    await esperarPregunta();

    // Cuando se califica con las diez respuestas correctas
    responderTodo(entorno.borrador, true);
    await esperarResultado();

    // Entonces la pantalla es de aprobación y muestra el apogeo completo
    expect(document.querySelector('[data-pantalla="resultado"]')).not.toBeNull();
    expect(document.querySelector('[data-resultado="aprobado"]')).not.toBeNull();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/^\+\d+ XP$/)).toBeInTheDocument();
    expect(screen.getByText('XP ganado en esta evaluación')).toBeInTheDocument();
    expect(screen.getByText('¡Desbloqueaste el nivel 2!')).toBeInTheDocument();
    expect(screen.getByText(/Aprobaste con 100%/)).toBeInTheDocument();

    // Y sólo hay un CTA primario, que devuelve al mapa de niveles
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    const cta = document.querySelector('[data-cta="primario"]');
    expect(cta).toHaveTextContent('Ver mi mapa de niveles');
    expect(cta).toHaveAttribute('href', ruta('/'));
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('[UX-APOGEO] al reprobar el CTA primario repasa las palabras falladas', async () => {
    // Dado un examen del nivel 1 que se responde entero y mal
    const entorno = await montarEvaluacion(NIVEL_EVALUADO);
    await esperarPregunta();

    // Cuando se califica con las diez respuestas incorrectas
    responderTodo(entorno.borrador, false);
    await esperarResultado();

    // Entonces la pantalla es de suspenso
    expect(document.querySelector('[data-resultado="reprobado"]')).not.toBeNull();

    // Y el único CTA primario lleva a la lección filtrada por las palabras falladas
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    const cta = document.querySelector('[data-cta="primario"]');
    expect(cta).toHaveTextContent(/Repasar las \d+ palabras falladas/);
    expect(cta?.getAttribute('href')).toContain('palabras=');
    expect(cta?.getAttribute('href')).toContain('/lesson/1');

    // Y se listan las palabras falladas con su término y su traducción
    expect(screen.getAllByText(/^rimay\d$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^conversar \d$/).length).toBeGreaterThan(0);

    // Y se puede reintentar desde el CTA secundario
    expect(
      screen.getByRole('button', { name: 'Reintentar la evaluación' })
    ).toBeInTheDocument();
  });

  it('[UX-APOGEO] el confeti respeta el movimiento reducido, el render sin canvas y el mismo resultado', () => {
    // Dado un resultado que todavía no se ha celebrado en un entorno capaz de animar
    const base = {
      claveCelebrada: null,
      clave: 'eval-1',
      movimientoReducido: false,
      puedeAnimar: true
    };

    // Cuando se evalúan las reglas de la celebración
    // Entonces se celebra una vez, y nunca con movimiento reducido, sin canvas ni repetida
    expect(debeLanzarConfeti(base)).toBe(true);
    expect(debeLanzarConfeti({ ...base, movimientoReducido: true })).toBe(false);
    expect(debeLanzarConfeti({ ...base, puedeAnimar: false })).toBe(false);
    expect(debeLanzarConfeti({ ...base, claveCelebrada: 'eval-1' })).toBe(false);
    expect(debeLanzarConfeti({ ...base, claveCelebrada: 'eval-2' })).toBe(true);
  });

  it('[UX-ESTETICA] el resultado sólo usa los cuatro tamaños de la escala tipográfica', async () => {
    // Dado un resultado aprobado en pantalla
    const entorno = await montarEvaluacion(NIVEL_EVALUADO);
    await esperarPregunta();
    responderTodo(entorno.borrador, true);
    await esperarResultado();

    // Cuando se inspeccionan las clases del contenedor raíz y de sus hijos directos
    const raiz = document.querySelector<HTMLElement>('[data-pantalla="resultado"]');
    if (raiz === null) throw new Error('No se encontró el contenedor del resultado.');

    const tamanos = new Set<string>();

    // Entonces ninguno de ellos usa utilidades tipográficas fuera de la escala del proyecto
    for (const elemento of [raiz, ...Array.from(raiz.children)]) {
      for (const clase of Array.from(elemento.classList)) {
        expect(clase).not.toMatch(TIPOGRAFIA_CRUDA);
        if (TAMANOS_PERMITIDOS.has(clase)) tamanos.add(clase);
      }
    }
    expect(tamanos.size).toBeLessThanOrEqual(4);

    // Y ningún descendiente de la pantalla usa un tamaño crudo
    for (const elemento of Array.from(raiz.querySelectorAll('*'))) {
      for (const clase of Array.from(elemento.classList)) {
        expect(clase).not.toMatch(TIPOGRAFIA_CRUDA);
      }
    }

    // Y el porcentaje es el único `text-display` de la pantalla
    expect(raiz.querySelectorAll('.text-display')).toHaveLength(1);
  });
});
