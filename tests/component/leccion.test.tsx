import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Leccion } from '@ui/components/leccion';
import { crearAdaptadores, establecerContenedor, reiniciarContenedor } from '@infrastructure/container';
import { CatalogoMemoriaRepository } from '@infrastructure/persistence/memory';
import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { ruta } from '@ui/lib/ruta';
import type { CategoriaGramatical } from '@domain/shared/tipos';

/**
 * Pruebas de componente de la lección con flashcards (RF-004).
 *
 * Se trabaja contra el contenedor en memoria (`crearAdaptadores(null)`) para que el vocabulario sea
 * determinista: el doble se instala ANTES del primer render porque `useContenedor` captura el
 * composition root una sola vez por componente.
 */

const NIVEL = 1;

/** Palabra de prueba con valores por defecto razonables. */
function crearPalabra(
  id: string,
  termino: string,
  traduccion: string,
  extra: {
    imagenUrl?: string;
    categoria?: CategoriaGramatical;
    nivelId?: number;
    ejemploUso?: string;
  } = {}
): Palabra {
  return Palabra.crear({
    id,
    nivelId: extra.nivelId ?? NIVEL,
    termino,
    traduccion,
    pronunciacion: `${termino}-pronunciacion`,
    categoria: extra.categoria ?? 'sustantivo',
    contextoCultural: `Contexto cultural de ${termino}`,
    imagenUrl: extra.imagenUrl,
    ejemploUso: extra.ejemploUso
  });
}

function crearNivel(nivelId: number = NIVEL): Nivel {
  return Nivel.crear({
    id: nivelId,
    tituloQuechua: 'Ñawpaq Simikuna',
    tituloEspanol: 'Primeras palabras',
    descripcion: 'Saludos y palabras básicas del quechua.',
    icono: 'Sparkles',
    colorAcento: '#B94700'
  });
}

/** Tres palabras sin imagen: el caso por defecto del nivel. */
const PALABRAS_SIN_IMAGEN = [
  crearPalabra('p1', 'rimay', 'hablar', { ejemploUso: 'Rimay yachayta munani.' }),
  crearPalabra('p2', 'yaku', 'agua', { categoria: 'sustantivo' }),
  crearPalabra('p3', 'sumaq', 'hermoso', { categoria: 'adjetivo' })
];

/**
 * Monta el contenedor en memoria con el catálogo controlado.
 * Debe ejecutarse antes de `render(<Leccion />)`: `useContenedor` memoriza el contenedor.
 */
function instalarContenedor(
  palabras: readonly Palabra[] = PALABRAS_SIN_IMAGEN,
  nivelId: number = NIVEL
): void {
  establecerContenedor(
    crearAdaptadores(null, {
      catalogo: new CatalogoMemoriaRepository([crearNivel(nivelId)], palabras)
    })
  );
}

/** Atajo con el contenedor ya instalado. */
function montarLeccion(nivelId: number = NIVEL): HTMLElement {
  const { container } = render(<Leccion nivelId={nivelId} />);
  return container;
}

/**
 * Cara de la flashcard por su anclaje de pruebas (`data-cara`).
 *
 * Las dos caras están SIEMPRE en el DOM —la animación 3D gira sobre ellas— y la oculta sólo se
 * distingue por la clase `invisible` más `aria-hidden`, así que el test necesita un anclaje estable
 * en lugar de deducir la cara por el orden de los nodos.
 */
function caraDe(flashcard: HTMLElement, cara: 'anverso' | 'reverso'): HTMLElement {
  const encontrada = flashcard.querySelector<HTMLElement>(`[data-cara="${cara}"]`);
  if (encontrada === null) throw new Error(`La flashcard no tiene la cara "${cara}".`);
  return encontrada;
}

describe('[RF-004] Lección con flashcards', () => {
  beforeEach(() => {
    instalarContenedor();
  });

  afterEach(() => {
    reiniciarContenedor();
  });

  it('[RF-004] muestra el término en quechua con la traducción oculta al inicio', async () => {
    // Dado un nivel con tres palabras
    montarLeccion();

    // Cuando la lección termina de cargar
    const flashcard = await screen.findByLabelText('rimay — hablar');

    // Entonces la primera tarjeta está sin voltear, con el término a la vista y el contador a 0
    expect(flashcard).toHaveAttribute('aria-pressed', 'false');

    const anverso = caraDe(flashcard, 'anverso');
    const reverso = caraDe(flashcard, 'reverso');
    expect(anverso).toHaveTextContent('rimay');
    expect(anverso).not.toHaveClass('invisible');
    // El reverso vive en el DOM porque la animación 3D apila las dos caras: «oculto» para el
    // estudiante significa `invisible` (no se pinta) y `aria-hidden` (no se anuncia), no ausente.
    expect(reverso).toHaveTextContent('hablar');
    expect(reverso).toHaveClass('invisible');
    expect(reverso).toHaveAttribute('aria-hidden', 'true');

    expect(screen.getByText('Tarjeta 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0/3');
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Avance de la lección'
    );
  });

  it('[RF-004] voltea la flashcard y revela la traducción al pulsarla', async () => {
    // Dado la primera tarjeta de la lección, con el ejemplo aún oculto en el reverso
    montarLeccion();
    const flashcard = await screen.findByLabelText('rimay — hablar');
    expect(caraDe(flashcard, 'reverso')).toHaveClass('invisible');
    expect(caraDe(flashcard, 'reverso')).toHaveAttribute('aria-hidden', 'true');

    // Cuando el estudiante pulsa la flashcard
    fireEvent.click(flashcard);

    // Entonces se ve el reverso con la traducción y la tarjeta queda marcada como volteada
    expect(flashcard).toHaveAttribute('aria-pressed', 'true');
    expect(caraDe(flashcard, 'reverso')).not.toHaveClass('invisible');
    expect(caraDe(flashcard, 'reverso')).toHaveAttribute('aria-hidden', 'false');
    expect(caraDe(flashcard, 'anverso')).toHaveClass('invisible');
    expect(caraDe(flashcard, 'anverso')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Significado en español')).toBeInTheDocument();
    expect(screen.getByText('Ejemplo en oración')).toBeInTheDocument();
    expect(screen.getByText('Rimay yachayta munani.')).toBeInTheDocument();
  });

  it('[RF-004] navega con los botones siguiente y anterior', async () => {
    // Dado la primera tarjeta visible
    montarLeccion();
    await screen.findByLabelText('rimay — hablar');

    // Cuando se avanza y después se retrocede
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Tarjeta 2 de 3')).toBeInTheDocument();
    expect(screen.getByLabelText('yaku — agua')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    // Entonces se vuelve a la primera tarjeta
    expect(screen.getByText('Tarjeta 1 de 3')).toBeInTheDocument();
    expect(screen.getByLabelText('rimay — hablar')).toBeInTheDocument();
  });

  it('[RF-004] la flecha derecha avanza a la siguiente tarjeta', async () => {
    // Dado la primera tarjeta visible y enfocada
    montarLeccion();
    const flashcard = await screen.findByLabelText('rimay — hablar');

    // Cuando se pulsa ArrowRight sobre la tarjeta (el contenedor escucha el evento)
    fireEvent.keyDown(flashcard, { key: 'ArrowRight' });

    // Entonces avanza a la segunda tarjeta
    expect(screen.getByText('Tarjeta 2 de 3')).toBeInTheDocument();
    expect(screen.getByLabelText('yaku — agua')).toBeInTheDocument();
  });

  it('[RF-004] la flecha izquierda retrocede a la tarjeta anterior', async () => {
    // Dado la segunda tarjeta visible
    montarLeccion();
    await screen.findByLabelText('rimay — hablar');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Tarjeta 2 de 3')).toBeInTheDocument();

    // Cuando se pulsa ArrowLeft sobre la tarjeta visible
    fireEvent.keyDown(screen.getByLabelText('yaku — agua'), { key: 'ArrowLeft' });

    // Entonces vuelve a la primera tarjeta
    expect(screen.getByText('Tarjeta 1 de 3')).toBeInTheDocument();
    expect(screen.getByLabelText('rimay — hablar')).toBeInTheDocument();
  });

  it('[RF-004] pinta el respaldo SVG de la categoría cuando la palabra no tiene imagen', async () => {
    // Dado una palabra sin `imagenUrl`
    montarLeccion();

    // Cuando la tarjeta se pinta
    const respaldo = await screen.findByRole('img');

    // Entonces aparece la ilustración SVG accesible con el término
    expect(respaldo.tagName.toLowerCase()).toBe('svg');
    expect(respaldo).toHaveAttribute('aria-label', 'Ilustración de rimay');
    expect(document.querySelector('img')).toBeNull();
  });

  it('[RF-004] pinta la imagen diferida cuando la palabra tiene imagenUrl', async () => {
    // Dado una palabra con imagen asociada
    instalarContenedor([
      crearPalabra('p1', 'rimay', 'hablar', { imagenUrl: '/Yapu/img/rimay.png' }),
      crearPalabra('p2', 'yaku', 'agua')
    ]);
    montarLeccion();

    // Cuando la tarjeta se pinta
    await screen.findByLabelText('rimay — hablar');
    const imagen = document.querySelector('img');

    // Entonces la imagen es diferida y describe el término con su traducción
    expect(imagen).not.toBeNull();
    expect(imagen).toHaveAttribute('loading', 'lazy');
    expect(imagen).toHaveAttribute('decoding', 'async');
    expect(imagen?.getAttribute('alt')).toContain('rimay');
    expect(imagen?.getAttribute('alt')).toContain('hablar');
  });

  it('[RF-004] marca la palabra con el caso de uso y sube el contador de aprendidas', async () => {
    // Dado la primera tarjeta visible
    montarLeccion();
    await screen.findByLabelText('rimay — hablar');

    // Cuando el estudiante pulsa «¡Ya me la sé!»
    fireEvent.click(screen.getByRole('button', { name: '¡Ya me la sé!' }));

    // Entonces el caso de uso confirma una palabra aprendida sin contador local
    expect(await screen.findByRole('status')).toHaveTextContent('1/3');
  });

  it('[RN-08] marcar dos veces la misma palabra no infla el contador de aprendidas', async () => {
    // Dado una lección de DOS palabras: al marcar la primera la pantalla no cierra, así que la misma
    // palabra se puede volver a marcar. (Con una sola palabra, marcarla abre el cierre y el contador
    // desaparece: no habría nada que comprobar.)
    instalarContenedor([crearPalabra('p1', 'rimay', 'hablar'), crearPalabra('p2', 'yaku', 'agua')]);
    montarLeccion();
    await screen.findByLabelText('rimay — hablar');

    // Cuando se marca la primera palabra como aprendida
    const botonAprender = screen.getByRole('button', { name: '¡Ya me la sé!' });
    fireEvent.click(botonAprender);

    // El caso de uso viaja mientras los botones están deshabilitados; al rehabilitarse, ya llegó.
    await waitFor(() => {
      expect(botonAprender).not.toBeDisabled();
    });
    expect(screen.getByRole('status')).toHaveTextContent('1/2');

    // La lección auto-avanza 250 ms después de marcar (RF-004): se espera a la tarjeta siguiente.
    await screen.findByText('Tarjeta 2 de 2');

    // Y se vuelve a la primera tarjeta para marcar OTRA VEZ la misma palabra
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByText('Tarjeta 1 de 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '¡Ya me la sé!' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '¡Ya me la sé!' })).not.toBeDisabled();
    });

    // Entonces el agregado idempotente sigue informando una única palabra aprendida
    expect(screen.getByRole('status')).toHaveTextContent('1/2');
  });

  it('[UX-FITTS] los objetivos táctiles de la lección declaran 44x44 px', async () => {
    // Dado la lección cargada
    montarLeccion();
    const flashcard = await screen.findByLabelText('rimay — hablar');

    // Cuando se inspeccionan los botones de la pantalla
    const botones = document.querySelectorAll('button');

    // Entonces la flashcard y cada botón usan los tokens táctiles del proyecto
    expect(flashcard.className).toContain('min-h-tactil');
    expect(flashcard.className).toContain('min-w-tactil');
    expect(botones.length).toBeGreaterThanOrEqual(4);
    for (const boton of botones) {
      expect(boton.className).toContain('min-h-tactil');
    }
    expect(document.querySelector('[data-accion="anterior"]')?.className).toContain('min-h-tactil');
    expect(document.querySelector('[data-accion="siguiente"]')?.className).toContain('min-h-tactil');
  });

  it('[UX-FITTS] no declara utilidades tipográficas fuera de los tokens del design system', async () => {
    // Dado la lección cargada
    const contenedor = montarLeccion();
    await screen.findByLabelText('rimay — hablar');

    // Cuando se revisan las clases de la pantalla
    const marcado = contenedor.innerHTML;

    // Entonces no aparece ninguna utilidad cruda de tamaño de texto
    expect(marcado).not.toMatch(/text-(xs|sm|base|lg|xl|2xl|3xl)\b/);
  });

  it('[UX-APOGEO] al llegar a la última tarjeta muestra el cierre con un solo CTA primario', async () => {
    // Dado la primera tarjeta de una lección de tres palabras
    montarLeccion();
    await screen.findByLabelText('rimay — hablar');

    // Cuando se avanza hasta la última tarjeta y se pide terminar
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Tarjeta 3 de 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terminar la lección' }));

    // Entonces aparece el cierre con el resumen y exactamente un CTA primario hacia la evaluación
    expect(screen.getByText(/Aprendiste \d+ de 3 palabras/)).toBeInTheDocument();
    const cta = document.querySelector('[data-cta="primario"]');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('href')).toContain('quiz/1');
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
  });

  it('[RN-01] muestra la pantalla de nivel bloqueado con el CTA al nivel actual', async () => {
    // Dado un estudiante en el nivel 1 que intenta abrir la lección del nivel 4
    instalarContenedor([crearPalabra('p4', 'hatun', 'grande', { nivelId: 4 })], 4);
    montarLeccion(4);

    // Cuando el caso de uso rechaza la petición con `NivelBloqueadoError`
    //
    // El hook compartido sólo expone el mensaje YA traducido (no el código del error), así que la
    // pantalla se localiza por su selector y no por texto: «Nivel bloqueado» aparece en la insignia
    // y «bloqueado» vuelve a aparecer en el mensaje, de modo que un `findByText` encuentra varios
    // nodos. `data-pantalla` es justo el contrato que usan los E2E.
    await waitFor(() => {
      expect(document.querySelector('[data-pantalla="nivel-bloqueado"]')).not.toBeNull();
    });

    // Entonces se explica el bloqueo, se ofrece el CTA al nivel actual y no hay lección
    const pantalla = document.querySelector('[data-pantalla="nivel-bloqueado"]');
    expect(pantalla).toHaveTextContent('Nivel bloqueado');
    expect(pantalla).toHaveTextContent('Aprueba el nivel anterior');
    expect(pantalla).toHaveTextContent('Ir a mi nivel actual');

    // El destino del CTA es el mapa, que es donde vive el nivel actual: el mensaje traducido de
    // `NIVEL_BLOQUEADO` no incluye el número del nivel (lo arma `src/ui/lib/mensajes.ts`, fuera de
    // este cambio), así que la lección no puede construir la URL de la lección del nivel actual y
    // cae al respaldo documentado. Es el MISMO destino que usa la pantalla de nivel bloqueado de la
    // evaluación (`PantallaNivelBloqueado`).
    const cta = pantalla === null ? null : pantalla.querySelector('[data-cta="primario"]');
    expect(cta).toHaveTextContent('Ir a mi nivel actual');
    expect(cta?.getAttribute('href')).toBe(ruta('/'));
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    expect(document.querySelector('[data-pantalla="leccion"]')).toBeNull();
  });
});
