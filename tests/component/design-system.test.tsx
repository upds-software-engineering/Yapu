import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  BarraProgreso,
  Boton,
  EnvoltorioCtaFijo,
  EstadoCarga,
  EstadoVacio,
  Insignia,
  MensajeError,
  PlaceholderCategoria,
  Tabs,
  Tarjeta
} from '@ui/design-system';

/**
 * Pruebas de componente del design system de YAPU.
 *
 * Cada caso lleva su etiqueta de ley UX entre corchetes para que
 * `scripts/generar-matriz-trazabilidad.mjs` la recoja en la matriz de trazabilidad.
 */

/** Utilidades tipográficas crudas prohibidas: sólo se admiten los tokens del proyecto. */
const TIPOGRAFIA_CRUDA = /text-(xs|sm|base|lg|xl|2xl|3xl)\b/;

/** Pestañas de ejemplo (patrón del panel docente: Oraciones / Moderación). */
const PESTANAS = [
  { id: 'oraciones', etiqueta: 'Oraciones', contenido: <p>Panel de oraciones base</p> },
  { id: 'moderacion', etiqueta: 'Moderación', contenido: <p>Panel de moderación de retos</p> }
];

describe('[UX-FITTS] Design system', () => {
  it('[UX-FITTS] Boton garantiza 44x44 px en móvil con los tokens táctiles', () => {
    // Dado un botón del design system
    render(<Boton>Continuar</Boton>);

    // Cuando se lee su lista de clases
    const clase = screen.getByRole('button', { name: 'Continuar' }).className;

    // Entonces declara el mínimo táctil de 44 px en ambos ejes
    expect(clase).toContain('min-h-tactil');
    expect(clase).toContain('min-w-tactil');
  });

  it('[UX-FITTS] Boton declara el mínimo de escritorio (24 px) en el punto de ruptura md', () => {
    // Dado un botón renderizado en un ancho de escritorio
    render(<Boton variante="primario">Calificar evaluación</Boton>);

    // Cuando se lee su lista de clases
    const clase = screen.getByRole('button', { name: 'Calificar evaluación' }).className;

    // Entonces la relajación a 24 px sólo ocurre a partir de `md`
    expect(clase).toContain('md:min-h-tactil-escritorio');
    expect(clase).toContain('md:min-w-tactil-escritorio');
  });

  it('[UX-FITTS] cada pestaña de Tabs es un objetivo táctil de 44x44 px', () => {
    // Dado un panel con dos pestañas
    render(<Tabs pestanas={PESTANAS} />);

    // Cuando se inspeccionan sus clases
    const pestanas = screen.getAllByRole('tab');

    // Entonces todas respetan el mínimo táctil
    expect(pestanas).toHaveLength(2);
    for (const pestana of pestanas) {
      expect(pestana.className).toContain('min-h-tactil');
      expect(pestana.className).toContain('min-w-tactil');
    }
  });

  it('[UX-FITTS] EnvoltorioCtaFijo ancla el CTA al borde inferior alcanzable con el pulgar', () => {
    // Dado un CTA envuelto para quedar fijo en la franja inferior
    const { container } = render(
      <EnvoltorioCtaFijo>
        <Boton esCtaPrimario anchoCompleto>
          Empezar lección
        </Boton>
      </EnvoltorioCtaFijo>
    );

    // Cuando se inspecciona el contenedor
    const envoltorio = container.firstElementChild as HTMLElement;

    // Entonces es pegajoso abajo, ocupa el ancho en móvil y respeta el área segura del notch
    expect(envoltorio.className).toContain('sticky');
    expect(envoltorio.className).toContain('bottom-0');
    expect(envoltorio.className).toContain('w-full');
    expect(envoltorio.className).toContain('sm:w-auto');
    expect(envoltorio.className).toContain('env(safe-area-inset-bottom)');
  });

  it('[UX-FITTS] BarraProgreso expone un rango accesible coherente con el valor', () => {
    // Dado un progreso de 3 sobre 10
    render(<BarraProgreso valor={3} max={10} etiqueta="Avance del nivel 1" />);

    // Cuando se consulta el elemento de progreso
    const barra = screen.getByRole('progressbar');

    // Entonces informa valor, mínimo, máximo y etiqueta
    expect(barra).toHaveAttribute('aria-valuenow', '3');
    expect(barra).toHaveAttribute('aria-valuemin', '0');
    expect(barra).toHaveAttribute('aria-valuemax', '10');
    expect(barra).toHaveAttribute('aria-label', 'Avance del nivel 1');
  });
});

describe('[UX-HICK] Design system', () => {
  it('[UX-HICK] Boton con esCtaPrimario se marca con data-cta="primario"', () => {
    // Dado el CTA principal de una pantalla
    render(<Boton esCtaPrimario>Empezar evaluación</Boton>);

    // Cuando se inspecciona el botón
    const boton = screen.getByRole('button', { name: 'Empezar evaluación' });

    // Entonces queda marcado como el único CTA primario medible
    expect(boton).toHaveAttribute('data-cta', 'primario');
  });

  it('[UX-HICK] Boton secundario no emite data-cta y no compite con el CTA', () => {
    // Dado un botón secundario
    render(<Boton variante="secundario">Volver al mapa</Boton>);

    // Cuando se inspecciona el botón
    const boton = screen.getByRole('button', { name: 'Volver al mapa' });

    // Entonces no lleva marca de CTA primario
    expect(boton).not.toHaveAttribute('data-cta');
  });

  it('[UX-HICK] Tabs renderiza el tablist, una pestaña por entrada y sólo el panel activo', () => {
    // Dado un panel con dos pestañas
    render(<Tabs pestanas={PESTANAS} />);

    // Cuando se consulta la estructura accesible
    const tablist = screen.getByRole('tablist');
    const pestanas = screen.getAllByRole('tab');

    // Entonces hay un tablist, dos pestañas, sólo la primera activa y un único panel visible
    expect(tablist).toBeInTheDocument();
    expect(pestanas).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Oraciones' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Moderación' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel de oraciones base');
  });

  it('[UX-HICK] Tabs cambia el panel visible al pulsar otra pestaña', () => {
    // Dado un panel con la primera pestaña activa
    render(<Tabs pestanas={PESTANAS} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel de oraciones base');

    // Cuando se pulsa la segunda pestaña
    fireEvent.click(screen.getByRole('tab', { name: 'Moderación' }));

    // Entonces sólo se pinta el panel de la pestaña elegida
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel de moderación de retos');
    expect(screen.getByRole('tab', { name: 'Moderación' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Oraciones' })).toHaveAttribute('aria-selected', 'false');
  });

  it('[UX-HICK] Tabs responde a la tecla ArrowRight con roving tabindex', () => {
    // Dado un panel con la primera pestaña activa y enfocada
    render(<Tabs pestanas={PESTANAS} />);
    const primera = screen.getByRole('tab', { name: 'Oraciones' });
    expect(primera).toHaveAttribute('tabindex', '0');

    // Cuando se pulsa la flecha derecha
    fireEvent.keyDown(primera, { key: 'ArrowRight' });

    // Entonces la segunda pestaña queda activa y es la única tabulable
    expect(screen.getByRole('tab', { name: 'Moderación' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Moderación' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Oraciones' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel de moderación de retos');
  });

  it('[UX-HICK] Tabs vuelve a la primera pestaña con la tecla Home', () => {
    // Dado un panel con la segunda pestaña activa
    render(<Tabs pestanas={PESTANAS} idInicial="moderacion" />);
    expect(screen.getByRole('tab', { name: 'Moderación' })).toHaveAttribute('aria-selected', 'true');

    // Cuando se pulsa Home
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Moderación' }), { key: 'Home' });

    // Entonces vuelve la primera
    expect(screen.getByRole('tab', { name: 'Oraciones' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('[UX-JAKOB] Design system', () => {
  it('[UX-JAKOB] Tabs enlaza pestaña y panel con los identificadores WAI-ARIA', () => {
    // Dado un panel con pestañas
    render(<Tabs pestanas={PESTANAS} />);

    // Cuando se consultan las relaciones entre pestaña y panel
    const panel = screen.getByRole('tabpanel');

    // Entonces cada pestaña controla su panel y el panel está rotulado por su pestaña
    expect(screen.getByRole('tab', { name: 'Oraciones' })).toHaveAttribute('aria-controls', 'panel-oraciones');
    expect(panel).toHaveAttribute('id', 'panel-oraciones');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-oraciones');
    expect(panel).toHaveAttribute('tabindex', '0');
  });

  it('[UX-JAKOB] Boton en estado cargando se anuncia y queda deshabilitado', () => {
    // Dado un botón que está procesando la operación
    render(<Boton cargando>Calificando…</Boton>);

    // Cuando se inspecciona el botón
    const boton = screen.getByRole('button', { name: 'Calificando…' });

    // Entonces está ocupado para el lector de pantalla y no se puede volver a pulsar
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(boton).toBeDisabled();
  });

  it('[UX-JAKOB] MensajeError anuncia el fallo con role="alert"', () => {
    // Dado un error de carga
    render(<MensajeError mensaje="No se pudo cargar el nivel." />);

    // Cuando se consulta el contenedor del mensaje
    const alerta = screen.getByRole('alert');

    // Entonces el lector de pantalla lo anuncia de inmediato
    expect(alerta).toHaveTextContent('No se pudo cargar el nivel.');
  });

  it('[UX-JAKOB] EstadoCarga anuncia la espera con role="status"', () => {
    // Dado un estado de carga
    render(<EstadoCarga mensaje="Cargando el mapa de niveles…" />);

    // Cuando se consulta el contenedor del estado
    const estado = screen.getByRole('status');

    // Entonces se anuncia de forma cortés sin bloquear la lectura
    expect(estado).toHaveAttribute('aria-live', 'polite');
    expect(estado).toHaveTextContent('Cargando el mapa de niveles…');
  });

  it('[UX-JAKOB] PlaceholderCategoria describe la ilustración con el término', () => {
    // Dado un respaldo de imagen para una palabra sin `imagenUrl`
    render(<PlaceholderCategoria categoria="verbo" termino="rimay" />);

    // Cuando se consulta la imagen
    const ilustracion = screen.getByRole('img');

    // Entonces lleva el término en su etiqueta accesible
    expect(ilustracion).toHaveAttribute('aria-label', 'Ilustración de rimay');
  });

  it('[UX-JAKOB] PlaceholderCategoria usa la ilustración genérica si la categoría es desconocida', () => {
    // Dado un respaldo con una categoría fuera del mapa
    const { container } = render(
      <PlaceholderCategoria categoria="categoria-desconocida" termino="yapu" />
    );

    // Cuando se consulta el SVG
    const ilustracion = screen.getByRole('img');

    // Entonces se pinta igualmente una ilustración con su etiqueta
    expect(container.querySelector('svg')).not.toBeNull();
    expect(ilustracion).toHaveAttribute('aria-label', 'Ilustración de yapu');
  });
});

describe('[UX-ESTETICA] Design system', () => {
  it('[UX-ESTETICA] Boton no usa utilidades tipográficas fuera de los tokens', () => {
    // Dado un botón del design system
    render(<Boton variante="peligro">Eliminar oración</Boton>);

    // Cuando se lee su lista de clases
    const clase = screen.getByRole('button', { name: 'Eliminar oración' }).className;

    // Entonces usa el token `text-body` y ninguna utilidad cruda de tamaño
    expect(clase).toContain('text-body');
    expect(clase).not.toMatch(TIPOGRAFIA_CRUDA);
  });

  it('[UX-ESTETICA] Tarjeta e Insignia comparten la superficie y la escala tipográfica', () => {
    // Dado un bloque de contenido con una pastilla de estado
    const { container } = render(
      <Tarjeta interactiva etiqueta="Nivel 1">
        <Insignia tono="marca">Fundamentos</Insignia>
      </Tarjeta>
    );

    // Cuando se inspeccionan sus clases
    const tarjeta = container.firstElementChild as HTMLElement;
    const pastilla = screen.getByText('Fundamentos');

    // Entonces la tarjeta es interactiva y accesible y la pastilla usa el token de caption
    expect(tarjeta.className).toContain('rounded-2xl');
    expect(tarjeta.className).toContain('bg-superficie');
    expect(tarjeta).toHaveAttribute('tabindex', '0');
    expect(tarjeta).toHaveAttribute('aria-label', 'Nivel 1');
    expect(pastilla.className).toContain('text-caption');
    expect(pastilla.className).not.toMatch(TIPOGRAFIA_CRUDA);
  });
});

describe('[UX-APOGEO] Design system', () => {
  it('[UX-APOGEO] MensajeError ofrece el siguiente paso con Reintentar', () => {
    // Dado un error con acción de reintento
    const alReintentar = vi.fn();
    render(<MensajeError mensaje="No se pudo cargar el nivel." onReintentar={alReintentar} />);

    // Cuando el estudiante pulsa Reintentar
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    // Entonces se relanza la operación sin recargar la pantalla
    expect(alReintentar).toHaveBeenCalledTimes(1);
  });

  it('[UX-APOGEO] EstadoVacio explica qué falta sin dejar un callejón sin salida', () => {
    // Dado un tablero sin evaluaciones todavía
    render(
      <EstadoVacio
        titulo="Aún no hay evaluaciones"
        descripcion="Completa una lección para ver aquí tu historial."
      >
        <Boton esCtaPrimario>Ir al mapa de niveles</Boton>
      </EstadoVacio>
    );

    // Cuando se lee el estado vacío
    const titulo = screen.getByText('Aún no hay evaluaciones');
    const cta = screen.getByRole('button', { name: 'Ir al mapa de niveles' });

    // Entonces explica el motivo y ofrece exactamente una acción primaria
    expect(titulo).toBeInTheDocument();
    expect(screen.getByText('Completa una lección para ver aquí tu historial.')).toBeInTheDocument();
    expect(cta).toHaveAttribute('data-cta', 'primario');
  });
});
