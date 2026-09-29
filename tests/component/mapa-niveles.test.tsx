import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import type { ProgresoRepository } from '@application/ports';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { cargarSemilla } from '@infrastructure/catalog';
import { crearAdaptadores, establecerContenedor, reiniciarContenedor } from '@infrastructure/container';
import { CatalogoMemoriaRepository, ProgresoMemoriaRepository } from '@infrastructure/persistence/memory';
import { MapaNiveles } from '@ui/components/niveles';
import { Portada } from '@ui/components/portada';
import { MENSAJE_ERROR_GENERICO } from '@ui/lib/mensajes';

/**
 * Pruebas de componente del mapa de niveles (RF-003) y de la portada.
 *
 * `src/ui` tiene prohibido importar infraestructura, pero las PRUEBAS sí pueden: aquí se inyecta
 * el contenedor en memoria (`crearAdaptadores(null)`) y se fuerza el progreso con
 * `ProgresoMemoriaRepository`, de modo que cada escenario (nivel 3 desbloqueado, curso completado)
 * sea determinista y no dependa de `localStorage`.
 *
 * Nota sobre `href`: en Vitest `import.meta.env.BASE_URL` vale `/`, mientras que en producción es
 * `/Yapu/`. Por eso se asevera el sufijo lógico (`/lesson/…`, `/quiz/…`) y no la URL absoluta.
 */

/** Los 10 niveles del curso, en orden (RN-03: 10 aprobados = 100%). */
const TODOS_LOS_NIVELES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** RF-001 simulado: usuario fijo para que el progreso guardado sea el que lee el caso de uso. */
const ESTUDIANTE = 'estudiante-de-prueba';

interface EscenarioProgreso {
  nivelActual: number;
  nivelesAprobados: number[];
  cursoCompletado?: boolean;
  xp?: number;
  rachaDias?: number;
}

/** Construye el contenedor en memoria con el progreso pedido (`null` = perfil recién creado). */
async function prepararContenedor(escenario: EscenarioProgreso | null): Promise<void> {
  const base = crearAdaptadores(null);
  await base.sesion.establecerUsuario(ESTUDIANTE, 'Estudiante de prueba');

  const progreso = new ProgresoMemoriaRepository();
  if (escenario) {
    await progreso.guardar(
      ProgresoEstudiante.reconstruir({
        estudianteId: ESTUDIANTE,
        nivelActual: escenario.nivelActual,
        cursoCompletado: escenario.cursoCompletado ?? false,
        xp: escenario.xp ?? 0,
        rachaDias: escenario.rachaDias ?? 0,
        fechaUltimaActividad: null,
        nivelesAprobados: escenario.nivelesAprobados,
        palabras: {}
      })
    );
  }

  const semilla = cargarSemilla();
  const catalogo = new CatalogoMemoriaRepository(semilla.niveles, semilla.palabras);

  establecerContenedor({ ...base, progreso, catalogo });
}

/** Monta el mapa y espera a que los 10 niveles estén pintados. */
async function montarMapa(escenario: EscenarioProgreso | null): Promise<void> {
  await prepararContenedor(escenario);
  render(<MapaNiveles />);
  await waitFor(() => expect(document.querySelectorAll('[data-nivel]')).toHaveLength(10));
}

/** Tarjeta de un nivel: falla con un mensaje claro si el nivel no está en el DOM. */
function tarjeta(nivel: number): HTMLElement {
  const elemento = document.querySelector<HTMLElement>(`[data-nivel="${nivel}"]`);
  if (!elemento) throw new Error(`No se encontró la tarjeta del nivel ${nivel} en el mapa.`);
  return elemento;
}

/** Repositorio de progreso que nunca responde: sirve para congelar el estado de carga. */
function progresoQueNuncaResponde(): ProgresoRepository {
  return {
    obtener: () => new Promise<ProgresoEstudiante | null>(() => {}),
    guardar: async () => {},
    eliminar: async () => {}
  };
}

/** Repositorio de progreso que falla con un error técnico del navegador. */
function progresoQueFalla(): ProgresoRepository {
  return {
    obtener: async () => {
      throw new TypeError('Failed to fetch');
    },
    guardar: async () => {},
    eliminar: async () => {}
  };
}

describe('[RF-003] Mapa de niveles', () => {
  afterEach(() => {
    reiniciarContenedor();
  });

  it('[UX-MILLER] agrupa los 10 niveles en los 3 tramos con su encabezado y su rango', async () => {
    // Dado un estudiante que todavía no aprobó ningún nivel
    await montarMapa(null);

    // Cuando se lee la estructura del mapa
    const tramos = document.querySelectorAll<HTMLElement>('[data-tramo]');
    const [fundamentos, vidaCotidiana, cosmovision] = [...tramos];

    // Entonces la pantalla raíz es la del mapa y hay 3 tramos (no una lista plana de 10)
    expect(document.querySelector('[data-pantalla="mapa"]')).not.toBeNull();
    expect(tramos).toHaveLength(3);
    expect([...tramos].map((tramo) => tramo.dataset['tramo'])).toEqual([
      'fundamentos',
      'vida-cotidiana',
      'cosmovision'
    ]);

    // Y cada tramo trae su cabecera, su rango y su descripción
    expect(within(fundamentos!).getByRole('heading', { name: 'Fundamentos' })).toBeInTheDocument();
    expect(within(fundamentos!).getByText('Niveles 1–3')).toBeInTheDocument();
    expect(within(vidaCotidiana!).getByRole('heading', { name: 'Vida cotidiana' })).toBeInTheDocument();
    expect(within(vidaCotidiana!).getByText('Niveles 4–7')).toBeInTheDocument();
    expect(within(cosmovision!).getByRole('heading', { name: 'Cosmovisión' })).toBeInTheDocument();
    expect(within(cosmovision!).getByText('Niveles 8–10')).toBeInTheDocument();

    // Y los 10 niveles quedan repartidos 3 + 4 + 3 dentro de esos tramos
    expect(fundamentos!.querySelectorAll('[data-nivel]')).toHaveLength(3);
    expect(vidaCotidiana!.querySelectorAll('[data-nivel]')).toHaveLength(4);
    expect(cosmovision!.querySelectorAll('[data-nivel]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-nivel]')).toHaveLength(10);
  });

  it('[RF-003] un nivel bloqueado no es un enlace y muestra el candado', async () => {
    // Dado un estudiante que aprobó los niveles 1 y 2 y va por el nivel 3
    await montarMapa({ nivelActual: 3, nivelesAprobados: [1, 2], xp: 220, rachaDias: 2 });

    // Cuando se inspecciona el nivel 4, que sigue bloqueado
    const bloqueado = tarjeta(4);

    // Entonces no navega a ninguna parte y explica qué nivel hay que aprobar
    expect(bloqueado).toHaveAttribute('data-estado', 'bloqueado');
    expect(within(bloqueado).queryAllByRole('link')).toHaveLength(0);
    expect(bloqueado.querySelectorAll('[href]')).toHaveLength(0);
    expect(bloqueado.querySelector('svg')).not.toBeNull();
    expect(bloqueado).toHaveTextContent('Desbloquea aprobando el nivel 3');
  });

  it('[RN-01] el nivel actual y los aprobados son enlaces a su lección y su evaluación', async () => {
    // Dado un estudiante con los niveles 1 y 2 aprobados
    await montarMapa({ nivelActual: 3, nivelesAprobados: [1, 2], xp: 220, rachaDias: 2 });

    // Cuando se leen las acciones de un nivel aprobado y del nivel actual
    const aprobado = tarjeta(1);
    const actual = tarjeta(3);

    // Entonces ambos estados quedan marcados como navegables
    expect(aprobado).toHaveAttribute('data-estado', 'aprobado');
    expect(actual).toHaveAttribute('data-estado', 'actual');

    // Y cada uno lleva a SU lección y a SU evaluación (una sola acción por destino)
    expect(within(aprobado).getByRole('link', { name: /Estudiar/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/lesson/1')
    );
    expect(within(aprobado).getByRole('link', { name: /Evaluación IA/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/quiz/1')
    );
    expect(within(actual).getByRole('link', { name: /Estudiar/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/lesson/3')
    );
    expect(within(actual).getByRole('link', { name: /Evaluación IA/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/quiz/3')
    );
  });

  it('[UX-HICK] la portada y el mapa juntos muestran exactamente 1 CTA primario', async () => {
    // Dado un estudiante nuevo
    await prepararContenedor(null);

    // Cuando se pinta la pantalla combinada portada + mapa
    render(
      <>
        <Portada />
        <MapaNiveles />
      </>
    );
    await waitFor(() => expect(document.querySelectorAll('[data-nivel]')).toHaveLength(10));

    // Entonces sólo hay una acción primaria en toda la pantalla
    const ctas = document.querySelectorAll<HTMLElement>('[data-cta="primario"]');
    expect(ctas).toHaveLength(1);

    // Y es la del nivel actual, que es el único que puede estrenarse
    expect(ctas[0]!.closest('[data-nivel="1"]')).not.toBeNull();

    // Y el título accesible sigue presente aunque no se pueda animar (Apogeo-Final: nunca en blanco)
    expect(screen.getByRole('heading', { level: 1, name: 'YAPU' })).toBeInTheDocument();
  });

  it('[UX-HICK] con el curso completado el CTA primario es Repasar el nivel 10', async () => {
    // Dado un estudiante que ya aprobó los 10 niveles
    await montarMapa({
      nivelActual: 10,
      nivelesAprobados: TODOS_LOS_NIVELES,
      cursoCompletado: true,
      xp: 1234,
      rachaDias: 7
    });

    // Cuando se busca la acción primaria de la pantalla
    const ctas = document.querySelectorAll<HTMLAnchorElement>('[data-cta="primario"]');

    // Entonces hay exactamente una, invita a repasar y apunta a la lección del nivel 10
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveTextContent('Repasar el nivel 10');
    expect(ctas[0]).toHaveAttribute('href', expect.stringContaining('/lesson/10'));
  });

  it('[UX-FITTS] los enlaces de acción respetan el mínimo táctil de 44 px', async () => {
    // Dado un estudiante con tres niveles navegables (1, 2 y el actual)
    await montarMapa({ nivelActual: 3, nivelesAprobados: [1, 2], xp: 220, rachaDias: 2 });

    // Cuando se inspeccionan las acciones de las tarjetas
    const enlaces = document.querySelectorAll<HTMLAnchorElement>('[data-nivel] a');

    // Entonces son 2 por nivel navegable y todas declaran el mínimo táctil en ambos ejes
    expect(enlaces).toHaveLength(6);
    for (const enlace of enlaces) {
      expect(enlace.className).toContain('min-h-tactil');
      expect(enlace.className).toContain('min-w-tactil');
    }
  });

  it('[RN-03] con 10 niveles aprobados se muestra 100% y la insignia de curso completado', async () => {
    // Dado un estudiante que completó el curso
    await montarMapa({
      nivelActual: 10,
      nivelesAprobados: TODOS_LOS_NIVELES,
      cursoCompletado: true,
      xp: 1234,
      rachaDias: 7
    });

    // Cuando se lee la cabecera y las tarjetas
    const tarjetas = document.querySelectorAll<HTMLElement>('[data-nivel]');

    // Entonces los 10 niveles figuran aprobados y siguen siendo navegables
    expect(tarjetas).toHaveLength(10);
    for (const tarjetaNivel of tarjetas) {
      expect(tarjetaNivel).toHaveAttribute('data-estado', 'aprobado');
    }

    // Y el porcentaje lo aporta el caso de uso (100), no un cálculo de la interfaz
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progreso global del curso' })).toHaveAttribute(
      'aria-valuenow',
      '100'
    );
    expect(screen.getByText('¡Curso completado!')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-nivel] a')).toHaveLength(20);
  });

  it('[RF-003] anuncia la carga mientras el caso de uso no responde', () => {
    // Dado un repositorio de progreso que nunca responde
    establecerContenedor({ ...crearAdaptadores(null), progreso: progresoQueNuncaResponde() });

    // Cuando se monta el mapa
    render(<MapaNiveles />);

    // Entonces se anuncia la espera en español y no queda ninguna pantalla en blanco
    expect(screen.getByRole('status')).toHaveTextContent('Cargando tu camino de aprendizaje…');
    expect(document.querySelectorAll('[data-nivel]')).toHaveLength(0);
  });

  it('[RF-003] muestra el error en español con opción de reintentar', async () => {
    // Dado un repositorio de progreso que falla con un error técnico en inglés
    establecerContenedor({ ...crearAdaptadores(null), progreso: progresoQueFalla() });

    // Cuando se monta el mapa
    render(<MapaNiveles />);

    // Entonces se anuncia un fallo entendible, sin jerga técnica, y con salida
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(MENSAJE_ERROR_GENERICO);
    expect(alerta).not.toHaveTextContent('Failed to fetch');
    expect(within(alerta).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
