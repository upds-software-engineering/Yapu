import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { SesionActual, SesionPort } from '@application/ports';
import type { RolUsuario } from '@domain/shared/tipos';
import { RetoComunitario } from '@domain/contenido/RetoComunitario';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { crearAdaptadores, establecerContenedor, reiniciarContenedor } from '@infrastructure/container';
import { ProgresoMemoriaRepository, RetoMemoriaRepository } from '@infrastructure/persistence/memory';
import { Comunidad } from '@ui/components/comunidad';

/**
 * Pruebas de componente de la pantalla de retos comunitarios (RF-007 / RN-13).
 *
 * Se sustituyen `retos`, `progreso` y `sesion` por dobles en memoria para controlar el nivel del
 * estudiante —el gate de RN-13— y la bitácora de moderación de cada reto. El resto de adaptadores
 * vienen del composition root neutralizado (`crearAdaptadores(null)`): sin `localStorage`, como en
 * el render de servidor.
 */

/** Doble en memoria de `SesionPort`: rol y nivel se controlan desde cada caso. */
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

/** Nivel en el que el estudiante YA puede proponer retos (RN-13). */
const NIVEL_HABILITADO = 7;
/** Nivel en el que el estudiante todavía NO puede proponer retos (RN-13). */
const NIVEL_BLOQUEADO = 3;

function progresoConNivel(usuarioId: string, nivel: number): ProgresoEstudiante {
  return ProgresoEstudiante.reconstruir({
    estudianteId: usuarioId,
    nivelActual: nivel,
    cursoCompletado: false,
    xp: 0,
    rachaDias: 0,
    fechaUltimaActividad: null,
    nivelesAprobados: [],
    palabras: {}
  });
}

interface Escenario {
  contenedor: ReturnType<typeof crearAdaptadores>;
  retos: RetoMemoriaRepository;
}

/**
 * Monta el contenedor con los dobles pedidos. `retos` y `progreso` son repositorios en memoria
 * reales de `@infrastructure/persistence/memory`; sólo la sesión es un doble propio porque no
 * existe un adaptador de sesión en memoria en la infraestructura.
 */
async function montarEscenario(opciones: {
  usuarioId: string;
  rol: RolUsuario;
  nivel: number;
  retos?: RetoComunitario[];
}): Promise<Escenario> {
  const base = crearAdaptadores(null);
  const retos = new RetoMemoriaRepository();
  const progreso = new ProgresoMemoriaRepository();

  for (const reto of opciones.retos ?? []) {
    await retos.guardar(reto);
  }
  await progreso.guardar(progresoConNivel(opciones.usuarioId, opciones.nivel));

  const contenedor: ReturnType<typeof crearAdaptadores> = {
    ...base,
    retos,
    progreso,
    sesion: new SesionMemoria(opciones.usuarioId, opciones.rol, 'Estudiante YAPU')
  };
  establecerContenedor(contenedor);

  return { contenedor, retos };
}

/**
 * Pinta la pantalla. El componente sólo usa el helper `ruta()` para construir sus enlaces, así que
 * no necesita ningún proveedor de enrutado: en Astro la navegación es un `<a href>` normal.
 */
function pintarComunidad() {
  return render(<Comunidad />);
}

/** Reto aprobado (2 docentes distintos) listo para publicarse. */
function retoAprobado(id: string, fechaCreacion: string): RetoComunitario {
  return RetoComunitario.reconstruir({
    id,
    autorId: `autor-${id}`,
    nombreAutor: `Aporte de ${id}`,
    textoQuechua: `Rimay ${id}`,
    traduccionSugerida: `Hablar ${id}`,
    pistaCultural: `Pista de ${id}`,
    nivelSugerido: 7,
    estado: 'aprobado',
    fechaCreacion,
    moderaciones: [
      { docenteId: `docente-a-${id}`, decision: 'aprobado', fecha: fechaCreacion },
      { docenteId: `docente-b-${id}`, decision: 'aprobado', fecha: fechaCreacion }
    ]
  });
}

/** Reto con una sola aprobación: sigue pendiente y su progreso es «1 de 2». */
function retoConUnaAprobacion(id: string, fechaCreacion: string): RetoComunitario {
  return RetoComunitario.reconstruir({
    id,
    autorId: `autor-${id}`,
    nombreAutor: `Aporte de ${id}`,
    textoQuechua: `Yachay ${id}`,
    traduccionSugerida: `Aprender ${id}`,
    pistaCultural: `Pista de ${id}`,
    nivelSugerido: 8,
    estado: 'pendiente',
    fechaCreacion,
    moderaciones: [{ docenteId: `docente-a-${id}`, decision: 'aprobado', fecha: fechaCreacion }]
  });
}

/** Reto rechazado por un docente: sólo lo ve el profesorado. */
function retoRechazado(id: string, fechaCreacion: string): RetoComunitario {
  return RetoComunitario.reconstruir({
    id,
    autorId: `autor-${id}`,
    nombreAutor: `Aporte de ${id}`,
    textoQuechua: `Pantay ${id}`,
    traduccionSugerida: `Equivocarse ${id}`,
    pistaCultural: '',
    nivelSugerido: 9,
    estado: 'rechazado',
    fechaCreacion,
    moderaciones: [{ docenteId: `docente-a-${id}`, decision: 'rechazado', fecha: fechaCreacion }]
  });
}

/** Reto pendiente recién propuesto por un estudiante. */
function retoPendiente(id: string, fechaCreacion: string): RetoComunitario {
  return RetoComunitario.reconstruir({
    id,
    autorId: `autor-${id}`,
    nombreAutor: `Aporte de ${id}`,
    textoQuechua: `Munakuy ${id}`,
    traduccionSugerida: `Amar ${id}`,
    pistaCultural: '',
    nivelSugerido: 7,
    estado: 'pendiente',
    fechaCreacion,
    moderaciones: []
  });
}

afterEach(() => {
  reiniciarContenedor();
});

describe('[RF-007] Retos comunitarios', () => {
  it('[RN-13] un estudiante de nivel 3 ve el aviso data-aviso="nivel-insuficiente" y NO el formulario', async () => {
    // Dado un estudiante en el nivel 3, por debajo del nivel 7 que exige RN-13
    await montarEscenario({ usuarioId: 'est-3', rol: 'estudiante', nivel: NIVEL_BLOQUEADO });

    // Cuando se abre la pantalla de comunidad
    const { container } = pintarComunidad();
    await screen.findByText('Todavía no hay retos publicados');

    // Entonces aparece el aviso de nivel insuficiente con el motivo del caso de uso
    const aviso = container.querySelector('[data-aviso="nivel-insuficiente"]');
    expect(aviso).not.toBeNull();
    expect(aviso).toHaveTextContent('nivel 7');
    expect(aviso).toHaveTextContent('nivel 3');
    // Y el formulario de propuesta no se pinta en absoluto
    expect(container.querySelector('[data-formulario="reto"]')).toBeNull();
  });

  it('[RN-13] un estudiante de nivel 7 sí ve el formulario de propuesta', async () => {
    // Dado un estudiante que ya alcanzó el nivel 7
    await montarEscenario({ usuarioId: 'est-7', rol: 'estudiante', nivel: NIVEL_HABILITADO });

    // Cuando se abre la pantalla de comunidad
    const { container } = pintarComunidad();
    await screen.findByText('Todavía no hay retos publicados');

    // Entonces el formulario aparece y el aviso de bloqueo no existe
    expect(container.querySelector('[data-formulario="reto"]')).not.toBeNull();
    expect(container.querySelector('[data-aviso="nivel-insuficiente"]')).toBeNull();
  });

  it('[RN-13] el formulario no envía con campos vacíos y avisa en español', async () => {
    // Dado un estudiante habilitado con el formulario abierto y vacío
    const { contenedor } = await montarEscenario({
      usuarioId: 'est-7',
      rol: 'estudiante',
      nivel: NIVEL_HABILITADO
    });
    const { container } = pintarComunidad();
    await screen.findByText('Todavía no hay retos publicados');

    // Cuando se envía sin escribir nada (el formulario desactiva la validación nativa)
    const formulario = container.querySelector('[data-formulario="reto"]');
    expect(formulario).not.toBeNull();
    fireEvent.submit(formulario as HTMLFormElement);

    // Entonces se anuncia el problema en español y no se guarda ningún reto
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Escribe la oración o frase en quechua');
    await expect(contenedor.retos.listar()).resolves.toHaveLength(0);
  });

  it('[RN-13] al proponer con éxito aparece el aviso de moderación pendiente', async () => {
    // Dado un estudiante habilitado con el formulario abierto
    const { contenedor } = await montarEscenario({
      usuarioId: 'est-7',
      rol: 'estudiante',
      nivel: NIVEL_HABILITADO
    });
    pintarComunidad();
    await screen.findByText('Todavía no hay retos publicados');

    // Cuando completa los campos obligatorios y envía el reto
    fireEvent.change(screen.getByLabelText(/Oración o frase en quechua/i), {
      target: { value: 'Sumaq p\'unchaw' }
    });
    fireEvent.change(screen.getByLabelText(/Traducción sugerida al español/i), {
      target: { value: 'Buenos días' }
    });
    fireEvent.submit(document.querySelector('[data-formulario="reto"]') as HTMLFormElement);

    // Entonces se confirma que el reto queda pendiente de DOS docentes distintos (RN-13); el aviso
    // sigue visible después del refresco de la lista, porque recargar no desmonta el formulario
    expect(
      await screen.findByText(/pendiente de moderación por dos docentes distintos/i)
    ).toBeInTheDocument();

    /*
     * Y el reto queda guardado como pendiente y sin ninguna aprobación. La tarjeta
     * `data-estado-reto="pendiente"` NO puede aparecer en esta pantalla: el listado del estudiante
     * sólo publica retos APROBADOS (RN-13) —el E2E comprueba ese estado desde la sesión docente—,
     * así que aquí se verifica contra el repositorio y se fija la ausencia de la tarjeta.
     */
    const guardados = await contenedor.retos.listar();
    expect(guardados).toHaveLength(1);
    expect(guardados[0]?.estado).toBe('pendiente');
    expect(guardados[0]?.aprobaciones).toBe(0);
    expect(document.querySelector('[data-estado-reto="pendiente"]')).toBeNull();
  });

  it('[RN-13] un reto con una sola aprobación muestra "1 de 2"', async () => {
    // Dado un reto aprobado por un único docente
    await montarEscenario({
      usuarioId: 'doc-1',
      rol: 'docente',
      nivel: 1,
      retos: [retoConUnaAprobacion('reto-1-aprobacion', '2024-03-01')]
    });
    const { container } = pintarComunidad();

    // Cuando se inspecciona el progreso de moderación del reto
    await screen.findByText('1 de 2 aprobaciones de docentes');

    // Entonces se informa de una de las dos aprobaciones requeridas y de la barra de progreso
    expect(screen.getByText('1 de 2 aprobaciones de docentes')).toBeInTheDocument();
    expect(container.querySelector('[data-reto="reto-1-aprobacion"]')).not.toBeNull();
    expect(
      screen.getByRole('progressbar', { name: 'Progreso de moderación del reto' })
    ).toHaveAttribute('aria-valuenow', '1');
  });

  it('[RN-13] un reto rechazado se muestra con data-estado-reto="rechazado"', async () => {
    // Dado un docente con un reto rechazado en su lista de moderación
    await montarEscenario({
      usuarioId: 'doc-1',
      rol: 'docente',
      nivel: 1,
      retos: [retoRechazado('reto-rechazado', '2024-02-10')]
    });
    const { container } = pintarComunidad();

    // Cuando se inspecciona la tarjeta del reto
    await screen.findByText('Rechazado');

    // Entonces la tarjeta declara el estado rechazado para el contrato de selectores
    const tarjeta = container.querySelector('[data-reto="reto-rechazado"]');
    expect(tarjeta).not.toBeNull();
    expect(tarjeta).toHaveAttribute('data-estado-reto', 'rechazado');
  });
});

describe('[UX-HICK] Comunidad', () => {
  it('[UX-HICK] la pantalla tiene exactamente un data-cta="primario"', async () => {
    // Dado un estudiante habilitado con dos retos publicados
    await montarEscenario({
      usuarioId: 'est-7',
      rol: 'estudiante',
      nivel: NIVEL_HABILITADO,
      retos: [retoAprobado('reto-a', '2024-01-01'), retoAprobado('reto-b', '2024-01-02')]
    });
    const { container } = pintarComunidad();

    // Cuando termina la carga de la lista
    await screen.findByText('Retos publicados por la comunidad (2)');

    // Entonces sólo hay un CTA primario en toda la pantalla
    expect(container.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Proponer un reto' })).toHaveAttribute(
      'data-cta',
      'primario'
    );
  });

  it('[UX-HICK] sin permiso, el CTA primario es Seguir aprendiendo hacia el inicio', async () => {
    // Dado un estudiante de nivel 3, que no puede proponer retos
    await montarEscenario({ usuarioId: 'est-3', rol: 'estudiante', nivel: NIVEL_BLOQUEADO });

    // Cuando se abre la pantalla
    const { container } = pintarComunidad();
    await screen.findByText('Todavía no hay retos publicados');

    // Entonces el único CTA primario es un enlace al inicio construido con `ruta()`
    const cta = container.querySelector('[data-cta="primario"]');
    expect(cta).not.toBeNull();
    expect(cta).toHaveTextContent('Seguir aprendiendo');
    expect(cta).toHaveAttribute('href', expect.stringContaining('/'));
  });
});

describe('[UX-FITTS] Comunidad', () => {
  it('[UX-FITTS] todos los botones de la pantalla declaran min-h-tactil', async () => {
    // Dado un docente que ve aprobados pendientes y rechazados
    await montarEscenario({
      usuarioId: 'doc-1',
      rol: 'docente',
      nivel: 1,
      retos: [
        retoAprobado('reto-a', '2024-01-01'),
        retoConUnaAprobacion('reto-b', '2024-01-02'),
        retoRechazado('reto-c', '2024-01-03')
      ]
    });
    pintarComunidad();

    /*
     * Cuando la lista ya está pintada. Texto definitivo del encabezado con 3 retos: «Retos
     * publicados por la comunidad (3)». Miller/Hick sólo agrupan por estado POR ENCIMA de 6 retos
     * (`MAXIMO_SIN_AGRUPAR`), así que «Primero los aprobados (1)» no existe aquí; ese encabezado lo
     * cubre el caso «con más de 6 retos agrupa por estado y ofrece Ver más».
     */
    await screen.findByText('Retos publicados por la comunidad (3)');

    // Entonces cada objetivo táctil conserva los 44 px del design system
    const botones = screen.getAllByRole('button');
    expect(botones.length).toBeGreaterThan(0);
    for (const boton of botones) {
      expect(boton.className).toContain('min-h-tactil');
    }
  });

  it('[UX-FITTS] con más de 6 retos agrupa por estado y ofrece Ver más', async () => {
    // Dado un docente con más de 6 retos repartidos entre aprobados y pendientes
    const retos: RetoComunitario[] = [];
    for (let indice = 0; indice < 5; indice += 1) {
      retos.push(retoAprobado(`reto-aprobado-${indice}`, `2024-01-0${indice + 1}`));
    }
    for (let indice = 0; indice < 5; indice += 1) {
      retos.push(retoPendiente(`reto-pendiente-${indice}`, `2024-02-0${indice + 1}`));
    }
    await montarEscenario({ usuarioId: 'doc-1', rol: 'docente', nivel: 1, retos });
    pintarComunidad();

    // Cuando se pinta la lista completa (Miller: 6 por grupo)
    await screen.findByText('Primero los aprobados (5)');

    // Entonces se agrupa por estado, primero los aprobados y después los pendientes
    expect(screen.getByText('Primero los aprobados (5)')).toBeInTheDocument();
    expect(screen.getByText('Después los pendientes (5)')).toBeInTheDocument();
    // Y ningún grupo supera las 6 tarjetas visibles
    expect(document.querySelectorAll('[data-reto]')).toHaveLength(10);
  });
});
