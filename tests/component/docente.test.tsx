import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ExportadorArchivoPort, SesionActual, SesionPort } from '@application/ports';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { OracionBase, RetoComunitario, type ModeracionReto } from '@domain/contenido';
import type { RolUsuario } from '@domain/shared/tipos';
import { cargarSemilla } from '@infrastructure/catalog';
import { crearAdaptadores, establecerContenedor, reiniciarContenedor } from '@infrastructure/container';
import {
  CatalogoMemoriaRepository,
  OracionMemoriaRepository,
  ProgresoMemoriaRepository,
  RetoMemoriaRepository
} from '@infrastructure/persistence/memory';
import { PanelDocente } from '@ui/components/docente';

/**
 * Pruebas de componente del panel docente (RF-001, RF-006, RF-007 y RS-004).
 *
 * `src/ui` tiene prohibido importar dominio e infraestructura, pero las PRUEBAS sí pueden: aquí se
 * inyecta un contenedor en memoria (`crearAdaptadores(null)`) y se sustituyen `sesion`, `oraciones`,
 * `retos`, `catalogo` y `exportador` por dobles deterministas.
 *
 * Nota sobre `href`: en Vitest `import.meta.env.BASE_URL` vale `/`, así que se asevera el sufijo
 * lógico (`/`) y no la URL absoluta de producción (`/Yapu/`).
 */

/** RF-001 simulado: usuario con el que se firma cada escenario. */
const DOCENTE_ID = 'doc-1';
const ESTUDIANTE_ID = 'est-1';

/** RN-10 del mapa: en los escenarios docentes se abre el curso completo para poder elegir nivel. */
const NIVEL_DESBLOQUEADO = 10;

/** RS-004: el adaptador real de descarga toca `Blob` y `URL`; en pruebas basta con espiarlo. */
class ExportadorEspia implements ExportadorArchivoPort {
  readonly llamadas: Array<{ nombreArchivo: string; tipoMime: string; contenido: string }> = [];

  descargar(nombreArchivo: string, contenido: string, tipoMime: string): void {
    this.llamadas.push({ nombreArchivo, contenido, tipoMime });
  }
}

/** Doble en memoria de `SesionPort`: el rol se controla desde cada caso (RF-001 / ADR-003). */
class SesionMemoria implements SesionPort {
  private actual: SesionActual;

  constructor(usuarioId: string, rol: RolUsuario, nombre: string) {
    this.actual = { usuarioId, rol, nombre };
  }

  async obtener(): Promise<SesionActual> {
    return { ...this.actual };
  }

  async cambiarRol(rol: RolUsuario): Promise<SesionActual> {
    this.actual = { ...this.actual, rol };
    return { ...this.actual };
  }

  async establecerUsuario(usuarioId: string, nombre?: string): Promise<SesionActual> {
    this.actual = { ...this.actual, usuarioId, nombre: nombre ?? this.actual.nombre };
    return { ...this.actual };
  }
}

/** Palabra real del catálogo semilla, para no inventar datos lingüísticos en las pruebas. */
function palabraSemilla(id: string) {
  const palabra = cargarSemilla().palabras.find((candidata) => candidata.id === id);
  if (!palabra) throw new Error(`La semilla no contiene la palabra ${id}.`);
  return palabra;
}

/** RN-11 / RN-12: oración válida del nivel de la palabra clave. */
function oracionDe(nivelId: number, palabraClaveId: string, textoQuechua: string, id?: string): OracionBase {
  const palabra = palabraSemilla(palabraClaveId);
  return OracionBase.crear(
    {
      id: id ?? `oracion-${nivelId}-${palabraClaveId}-${textoQuechua.length}`,
      nivelId,
      textoQuechua,
      traduccionEspanol: `Traducción de ${textoQuechua}`,
      palabraClaveId,
      categoria: palabra.categoria,
      contextoCultural: 'Contexto cultural de prueba.',
      autorId: DOCENTE_ID,
      estado: 'aprobado',
      fechaCreacion: '2024-03-01'
    },
    palabra
  );
}

/** Reto comunitario con su bitácora de moderación (RN-13). */
function retoDe(
  id: string,
  moderaciones: ModeracionReto[],
  estado: 'pendiente' | 'aprobado' | 'rechazado',
  autorId = 'autor-1'
): RetoComunitario {
  return RetoComunitario.reconstruir({
    id,
    autorId,
    nombreAutor: `Aporte de ${autorId}`,
    textoQuechua: `Rimay ${id}`,
    traduccionSugerida: `Hablar ${id}`,
    pistaCultural: `Pista de ${id}`,
    nivelSugerido: 7,
    estado,
    fechaCreacion: '2024-02-01',
    moderaciones
  });
}

interface Escenario {
  sesion: SesionMemoria;
  oraciones: OracionMemoriaRepository;
  retos: RetoMemoriaRepository;
  exportador: ExportadorEspia;
}

/**
 * Monta el contenedor con los dobles pedidos. `sesion` y `exportador` son dobles propios (no hay
 * adaptador en memoria para ellos); el catálogo y los repositorios son los reales de memoria.
 */
async function montarEscenario(opciones: {
  usuarioId?: string;
  rol: RolUsuario;
  /** Nivel de progreso del usuario; en docente se abre el curso completo por defecto. */
  nivel?: number;
  oraciones?: OracionBase[];
  retos?: RetoComunitario[];
}): Promise<Escenario> {
  const base = crearAdaptadores(null);
  const semilla = cargarSemilla();
  const usuarioId = opciones.usuarioId ?? (opciones.rol === 'docente' ? DOCENTE_ID : ESTUDIANTE_ID);
  const nivel = opciones.nivel ?? (opciones.rol === 'docente' ? NIVEL_DESBLOQUEADO : 1);

  const oraciones = new OracionMemoriaRepository();
  for (const oracion of opciones.oraciones ?? []) await oraciones.guardar(oracion);

  const retos = new RetoMemoriaRepository();
  for (const reto of opciones.retos ?? []) await retos.guardar(reto);

  const progreso = new ProgresoMemoriaRepository();
  await progreso.guardar(
    ProgresoEstudiante.reconstruir({
      estudianteId: usuarioId,
      nivelActual: nivel,
      cursoCompletado: false,
      xp: 0,
      rachaDias: 0,
      fechaUltimaActividad: null,
      nivelesAprobados: [],
      palabras: {}
    })
  );

  const exportador = new ExportadorEspia();
  const sesion = new SesionMemoria(
    usuarioId,
    opciones.rol,
    opciones.rol === 'docente' ? 'Docente YAPU' : 'Estudiante YAPU'
  );

  establecerContenedor({
    ...base,
    sesion,
    exportador,
    oraciones,
    retos,
    progreso,
    catalogo: new CatalogoMemoriaRepository(semilla.niveles, semilla.palabras)
  });

  return { sesion, oraciones, retos, exportador };
}

/** Pinta el panel y espera a que el rol ya esté resuelto (panel o guardia). */
function pintarPanel(): HTMLElement {
  const { container } = render(<PanelDocente />);
  return container;
}

/**
 * Espera a que el panel esté montado y devuelve el `tabpanel` activo: el contrato de selectores
 * exige UN `data-cta="primario"` por pestaña activa, así que las aserciones se acotan ahí.
 */
async function panelActivo(): Promise<HTMLElement> {
  await screen.findByRole('tab', { name: /Oraciones base/ });
  return screen.getByRole('tabpanel');
}

/** Rellena el paso 1 del formulario y avanza al paso 2. */
async function irAlPasoDos(): Promise<void> {
  fireEvent.change(screen.getByLabelText(/Texto en quechua/), {
    target: { value: 'Sulpayki, masiy' }
  });
  fireEvent.change(screen.getByLabelText(/Traducción al español/), {
    target: { value: 'Gracias, amigo mío' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByLabelText(/Palabra clave/);
}

/**
 * RN-12: el catálogo del paso 2 lo trae `ObtenerLeccionUseCase`, así que la opción no está en el
 * primer render del paso. Hay que esperarla antes de elegirla: con el `select` todavía en su
 * marcador, asignar el valor se pierde, el campo queda vacío y la prueba acabaría comprobando el
 * aviso de «palabra clave obligatoria» en lugar del error del caso de uso.
 */
async function elegirPalabraClave(valor: string, termino: RegExp): Promise<void> {
  const selector = await screen.findByLabelText(/Palabra clave/);
  await waitFor(() => {
    expect(within(selector).getByRole('option', { name: termino })).toBeInTheDocument();
  });
  fireEvent.change(selector, { target: { value: valor } });
}

afterEach(() => {
  reiniciarContenedor();
});

describe('[RF-006] Panel docente', () => {
  it('[RF-001] con rol estudiante aparece la guardia y NO el panel', async () => {
    // Dado un usuario con rol estudiante
    await montarEscenario({ rol: 'estudiante' });

    // Cuando se abre la pantalla del panel docente
    const container = pintarPanel();
    await screen.findByText(/es sólo para docentes/i);

    // Entonces se muestra la guardia de rol con su mensaje y su salida al mapa
    expect(container.querySelector('[data-guardia="rol"]')).not.toBeNull();
    expect(container.querySelector('[data-panel="docente"]')).toBeNull();
    expect(container.querySelector('[data-pantalla="docente"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute(
      'href',
      expect.stringContaining('/')
    );
  });

  it('[RF-001] pulsar "Cambiar a rol docente" muestra el panel', async () => {
    // Dado un usuario estudiante en la guardia de rol
    await montarEscenario({ rol: 'estudiante' });
    const container = pintarPanel();
    await screen.findByText(/es sólo para docentes/i);

    // Cuando pulsa el CTA de cambio de rol
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a rol docente' }));
    await screen.findByRole('tab', { name: /Oraciones base/ });

    // Entonces el panel docente queda montado y la guardia desaparece
    expect(container.querySelector('[data-panel="docente"]')).not.toBeNull();
    expect(container.querySelector('[data-guardia="rol"]')).toBeNull();
  });

  it('[UX-HICK] el formulario arranca en el paso 1 y no permite pasar al paso 2 sin los campos obligatorios', async () => {
    // Dado un docente con el panel abierto
    await montarEscenario({ rol: 'docente' });
    const container = pintarPanel();
    await panelActivo();

    // Cuando se inspecciona el paso inicial sin escribir nada
    expect(container.querySelector('[data-formulario="oracion"]')).not.toBeNull();
    expect(container.querySelector('[data-paso="1"]')).not.toBeNull();
    expect(container.querySelector('[data-paso="2"]')).toBeNull();
    expect(container.querySelector('[data-indicador-paso]')).not.toBeNull();
    expect(container.querySelector('[data-indicador-paso]')).toHaveTextContent('Paso 1 de 2');

    // Y se intenta continuar con el formulario vacío
    fireEvent.submit(container.querySelector('[data-formulario="oracion"]') as HTMLFormElement);

    // Entonces se avisa en español y el paso 2 sigue sin existir
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/Escribe la oración en quechua/i);
    expect(container.querySelector('[data-paso="2"]')).toBeNull();
  });

  it('[UX-HICK] el paso 2 exige la palabra clave del nivel', async () => {
    // Dado un docente que ya completó el paso 1
    await montarEscenario({ rol: 'docente' });
    const container = pintarPanel();
    await panelActivo();
    await irAlPasoDos();

    // Cuando intenta guardar sin elegir palabra clave
    expect(container.querySelector('[data-paso="2"]')).not.toBeNull();
    fireEvent.submit(container.querySelector('[data-formulario="oracion"]') as HTMLFormElement);

    // Entonces se explica en español que la palabra clave es obligatoria (RN-12)
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/palabra clave/i);
    expect(alerta).toHaveTextContent(/obligatoria/i);
  });

  it('[RN-11] una oración que no contiene la palabra clave muestra el error del caso de uso', async () => {
    // Dado un docente en el paso 2 con una oración que NO contiene la palabra clave elegida
    const { oraciones } = await montarEscenario({ rol: 'docente' });
    const container = pintarPanel();
    await panelActivo();

    fireEvent.change(screen.getByLabelText(/Texto en quechua/), {
      target: { value: 'Allianmi kachkani' }
    });
    fireEvent.change(screen.getByLabelText(/Traducción al español/), {
      target: { value: 'Estoy bien' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Cuando elige la palabra clave "Sulpayki", que no aparece en la oración, y guarda
    await elegirPalabraClave('voc_1_3', /Sulpayki/);
    fireEvent.submit(container.querySelector('[data-formulario="oracion"]') as HTMLFormElement);

    // Entonces se muestra el mensaje del caso de uso y no se guarda nada (RN-11)
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/no contiene la palabra clave/i);
    expect(alerta).toHaveTextContent(/Sulpayki/i);
    await expect(oraciones.listar()).resolves.toHaveLength(0);
  });

  it('[RF-006] al guardar con éxito la oración se confirma, se limpia el formulario y entra al listado', async () => {
    // Dado un docente con el corpus vacío
    const { oraciones } = await montarEscenario({ rol: 'docente' });
    const container = pintarPanel();
    await panelActivo();
    await irAlPasoDos();

    // Cuando elige la palabra clave que sí contiene su oración, rellena el contexto cultural
    // (opcional, pero es lo que el listado muestra bajo la oración) y guarda
    await elegirPalabraClave('voc_1_3', /Sulpayki/);
    fireEvent.change(screen.getByLabelText(/Contexto cultural/i), {
      target: { value: 'Se usa al agradecer a la Pachamama después de la cosecha.' }
    });
    fireEvent.submit(container.querySelector('[data-formulario="oracion"]') as HTMLFormElement);

    // Entonces se confirma que queda aprobada y alimenta al generador de preguntas
    expect(await screen.findByRole('status')).toHaveTextContent(/aprobada/i);
    expect(screen.getByRole('status')).toHaveTextContent(/generador/i);

    // Y el formulario vuelve limpio al paso 1
    expect(container.querySelector('[data-paso="1"]')).not.toBeNull();
    expect(container.querySelector('[data-paso="2"]')).toBeNull();
    expect(screen.getByLabelText(/Texto en quechua/)).toHaveValue('');

    // Y la oración aparece en el listado agrupada por su nivel, con la palabra clave y la categoría
    const grupo = await screen.findByRole('heading', { name: /Nivel 1/ });
    const seccion = grupo.closest('[data-grupo-nivel="1"]') as HTMLElement;
    expect(seccion).not.toBeNull();
    expect(within(seccion).getByText('Sulpayki, masiy')).toBeInTheDocument();
    expect(within(seccion).getByText(/Palabra clave: Sulpayki/)).toBeInTheDocument();
    expect(within(seccion).getByText('saludo')).toBeInTheDocument();
    expect(within(seccion).getByText('Aprobada')).toBeInTheDocument();
    expect(within(seccion).getByText(/Contexto cultural/)).toBeInTheDocument();
    await expect(oraciones.listar()).resolves.toHaveLength(1);
  });

  it('[UX-MILLER] el listado agrupa por nivel y muestra 5 con Ver más', async () => {
    // Dado un docente con 7 oraciones del nivel 3 y 2 del nivel 2
    const delNivelTres = [1, 2, 3, 4, 5, 6, 7].map((indice) =>
      oracionDe(3, 'voc_3_1', `Juk yachay ${indice}`, `oracion-3-${indice}`)
    );
    const delNivelDos = [1, 2].map((indice) =>
      oracionDe(2, 'voc_2_1', `Mama ${indice}`, `oracion-2-${indice}`)
    );
    await montarEscenario({ rol: 'docente', oraciones: [...delNivelTres, ...delNivelDos] });

    // Cuando se pinta el listado del corpus
    const container = pintarPanel();
    await panelActivo();
    const grupoTres = await waitFor(() => {
      const encontrado = container.querySelector('[data-grupo-nivel="3"]');
      if (!encontrado) throw new Error('El grupo del nivel 3 todavía no está pintado.');
      return encontrado as HTMLElement;
    });

    // Entonces el grupo del nivel 3 muestra como máximo 5 oraciones y ofrece Ver más
    expect(grupoTres.querySelectorAll('[data-oracion]')).toHaveLength(5);
    expect(
      container.querySelector('[data-grupo-nivel="2"] [data-oracion]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-grupo-nivel="2"]')?.querySelectorAll('[data-oracion]')
    ).toHaveLength(2);

    // Y al pulsar Ver más se revelan las 7 del grupo
    fireEvent.click(within(grupoTres).getByRole('button', { name: /Ver más/ }));
    expect(grupoTres.querySelectorAll('[data-oracion]')).toHaveLength(7);
  });

  it('[RN-13] los botones de moderación se deshabilitan cuando el docente ya votó', async () => {
    // Dado un docente que ya emitió su voto en el reto
    await montarEscenario({
      rol: 'docente',
      retos: [
        retoDe('reto-votado', [{ docenteId: DOCENTE_ID, decision: 'aprobado', fecha: '2024-02-02' }], 'pendiente')
      ]
    });

    // Cuando se abre la pestaña de moderación
    const container = pintarPanel();
    await panelActivo();
    fireEvent.click(screen.getByRole('tab', { name: /Moderación de retos/ }));

    // Entonces la tarjeta del reto explica el motivo y sus dos botones quedan deshabilitados
    const tarjeta = await waitFor(() => {
      const encontrado = container.querySelector('[data-reto="reto-votado"]');
      if (!encontrado) throw new Error('La tarjeta del reto todavía no está pintada.');
      return encontrado as HTMLElement;
    });
    expect(within(tarjeta).getByText(/una sola vez/i)).toBeInTheDocument();
    expect(within(tarjeta).getByRole('button', { name: 'Aprobar' })).toBeDisabled();
    expect(within(tarjeta).getByRole('button', { name: 'Rechazar' })).toBeDisabled();

    // Y el progreso de moderación del reto se anuncia con su barra accesible
    expect(within(tarjeta).getByText('1 de 2 aprobaciones de docentes')).toBeInTheDocument();
    expect(
      within(tarjeta).getByRole('progressbar', { name: 'Progreso de moderación del reto' })
    ).toHaveAttribute('aria-valuenow', '1');
  });

  it('[RN-13] un reto del propio docente tampoco se puede moderar', async () => {
    // Dado un docente que es autor del reto que intenta moderar
    await montarEscenario({
      rol: 'docente',
      retos: [retoDe('reto-propio', [], 'pendiente', DOCENTE_ID)]
    });

    // Cuando se abre la pestaña de moderación
    const container = pintarPanel();
    await panelActivo();
    fireEvent.click(screen.getByRole('tab', { name: /Moderación de retos/ }));

    // Entonces ambos botones quedan deshabilitados con el motivo en español
    const tarjeta = await waitFor(() => {
      const encontrado = container.querySelector('[data-reto="reto-propio"]');
      if (!encontrado) throw new Error('La tarjeta del reto todavía no está pintada.');
      return encontrado as HTMLElement;
    });
    expect(within(tarjeta).getByText(/su propio reto/i)).toBeInTheDocument();
    expect(within(tarjeta).getByRole('button', { name: 'Aprobar' })).toBeDisabled();
    expect(within(tarjeta).getByRole('button', { name: 'Rechazar' })).toBeDisabled();
  });

  it('[UX-HICK] la pestaña activa tiene exactamente un data-cta="primario"', async () => {
    // Dado un docente con el panel abierto
    await montarEscenario({ rol: 'docente' });

    // Cuando se inspecciona la pestaña activa
    const container = pintarPanel();
    const panel = await panelActivo();

    // Entonces sólo hay un CTA primario y es el avance del formulario
    expect(container.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    const cta = panel.querySelector('[data-cta="primario"]');
    expect(cta).not.toBeNull();
    expect(cta).toHaveTextContent('Continuar');
  });

  it('[UX-FITTS] los botones de la pantalla declaran min-h-tactil', async () => {
    // Dado un docente con un reto pendiente en la pestaña de moderación
    await montarEscenario({
      rol: 'docente',
      retos: [retoDe('reto-a', [], 'pendiente')]
    });

    // Cuando la pestaña de moderación ya está pintada
    pintarPanel();
    await panelActivo();
    fireEvent.click(screen.getByRole('tab', { name: /Moderación de retos/ }));
    await screen.findByRole('button', { name: 'Aprobar' });

    // Entonces todos los objetivos táctiles conservan los 44 px del design system
    const botones = screen.getAllByRole('button');
    expect(botones.length).toBeGreaterThan(0);
    for (const boton of botones) {
      expect(boton.className).toContain('min-h-tactil');
    }
  });
});

describe('[RF-010] Exportación de datos abiertos', () => {
  it('[RF-010] la pestaña de datos abiertos exporta el CSV y muestra archivo y filas', async () => {
    // Dado un docente con dos oraciones en el corpus
    const { exportador } = await montarEscenario({
      rol: 'docente',
      oraciones: [
        oracionDe(3, 'voc_3_1', 'Juk yachay', 'oracion-3-1'),
        oracionDe(2, 'voc_2_1', 'Mama mikhun', 'oracion-2-1')
      ]
    });
    const container = pintarPanel();
    await panelActivo();

    // Cuando se abre la pestaña de datos abiertos
    fireEvent.click(screen.getByRole('tab', { name: /Datos abiertos/ }));
    const panel = await screen.findByRole('tabpanel');
    expect(panel).toHaveTextContent(/RFC 4180/);
    expect(panel).toHaveTextContent(/BOM UTF-8/);

    // Y se pulsa el botón de exportar
    const cta = container.querySelector('[data-accion="exportar-csv"]');
    expect(cta).not.toBeNull();
    fireEvent.click(cta as HTMLButtonElement);

    // Entonces el caso de uso descargó el archivo y la pantalla informa del nombre y de las filas
    await waitFor(() => expect(exportador.llamadas).toHaveLength(1));
    expect(exportador.llamadas[0]?.nombreArchivo).toBe('yapu_corpus_quechua.csv');
    expect(exportador.llamadas[0]?.tipoMime).toBe('text/csv;charset=utf-8');
    expect(await screen.findByText(/yapu_corpus_quechua\.csv/)).toBeInTheDocument();
    expect(screen.getByText(/Se exportaron 2 filas/)).toBeInTheDocument();
  });

  it('[UX-HICK] la pestaña de datos abiertos tiene un único CTA primario', async () => {
    // Dado un docente en el panel
    await montarEscenario({ rol: 'docente' });

    // Cuando abre la pestaña de datos abiertos
    pintarPanel();
    await panelActivo();
    fireEvent.click(screen.getByRole('tab', { name: /Datos abiertos/ }));

    // Entonces el único CTA primario es la exportación
    const panel = await screen.findByRole('tabpanel');
    const ctas = panel.querySelectorAll('[data-cta="primario"]');
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveAttribute('data-accion', 'exportar-csv');
  });
});
