import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { SincronizacionRemotaPort } from '@application/ports';
import { ProgresoEstudiante, type RegistroPalabra } from '@domain/aprendizaje/ProgresoEstudiante';
import { Evaluacion } from '@domain/evaluacion/Evaluacion';
import { FechaDia } from '@domain/value-objects/FechaDia';
import { NivelId } from '@domain/value-objects/NivelId';
import { Puntuacion } from '@domain/value-objects/Puntuacion';
import { crearAdaptadores, establecerContenedor, reiniciarContenedor } from '@infrastructure/container';
import { EvaluacionMemoriaRepository } from '@infrastructure/persistence/memory/EvaluacionMemoriaRepository';
import { ProgresoMemoriaRepository } from '@infrastructure/persistence/memory/ProgresoMemoriaRepository';
import { Tablero } from '@ui/components/tablero';

/**
 * Pruebas de componente del tablero de progreso (RF-008).
 *
 * Los tests SÍ pueden tocar dominio e infraestructura: montan el contenedor completo con los
 * repositorios en memoria y guardan entidades reales (`Evaluacion.registrar`, `ProgresoEstudiante`),
 * de modo que el caso de uso `ObtenerTableroUseCase` se ejercita de extremo a extremo y la UI se
 * prueba contra su DTO real, no contra un doble inventado.
 */

const ESTUDIANTE = 'estudiante-tablero';
const TOTAL_PREGUNTAS = 10;
const LIMITE_POR_GRUPO = 5;

/** RN-02: el curso completo son diez niveles. */
const LOS_DIEZ_NIVELES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const HOY = FechaDia.desdeTexto('2026-03-15');

/**
 * Nube simulada que NO sincroniza nada: conserva la cola offline intacta para poder observar
 * RN-15 sin depender del orden en que resuelven el tablero y la sincronización.
 */
const NUBE_QUE_NO_SUBE: SincronizacionRemotaPort = {
  async sincronizar(): Promise<string[]> {
    return [];
  }
};

interface EscenarioEvaluacion {
  id: string;
  nivel: number;
  puntuacion: number;
  /** Día de la evaluación: `YYYY-MM-DD`, o cualquier texto para probar el respaldo de fecha. */
  dia: string;
  sincronizada?: boolean;
}

interface Escenario {
  /** Palabras del progreso persistido: id del catálogo semilla → estado de aprendizaje (RN-08). */
  palabras?: Record<string, 'aprendido' | 'repasar'>;
  nivelesAprobados?: readonly number[];
  nivelActual?: number;
  cursoCompletado?: boolean;
  xp?: number;
  rachaDias?: number;
  evaluaciones?: readonly Evaluacion[];
}

/** Una evaluación real del dominio: `aprobado` lo deriva `PoliticaAprobacion` (RN-04). */
function crearEvaluacion(datos: EscenarioEvaluacion): Evaluacion {
  const evaluacion = Evaluacion.registrar({
    id: datos.id,
    estudianteId: ESTUDIANTE,
    nivel: NivelId.crear(datos.nivel),
    puntuacion: Puntuacion.crear(datos.puntuacion),
    aciertos: Math.round((datos.puntuacion / 100) * TOTAL_PREGUNTAS),
    totalPreguntas: TOTAL_PREGUNTAS,
    fechaIso: datos.dia
  });

  // RN-15: una evaluación sincronizada es la que ya salió de la cola offline.
  if (datos.sincronizada === true) evaluacion.marcarSincronizada();
  return evaluacion;
}

/** Historial de un mismo nivel: días consecutivos desde `diaInicial` para que el orden sea estable. */
function evaluacionesDeNivel(nivel: number, cantidad: number, diaInicial: number): Evaluacion[] {
  return Array.from({ length: cantidad }, (_, indice) =>
    crearEvaluacion({
      id: `ev-${nivel}-${indice + 1}`,
      nivel,
      puntuacion: indice % 2 === 0 ? 80 : 60,
      dia: `2026-03-${String(diaInicial + indice).padStart(2, '0')}`
    })
  );
}

function registrosDePalabras(
  palabras: Record<string, 'aprendido' | 'repasar'>
): Record<string, RegistroPalabra> {
  const registros: Record<string, RegistroPalabra> = {};

  for (const [palabraId, estado] of Object.entries(palabras)) {
    registros[palabraId] = {
      palabraId,
      estado,
      contadorAciertos: estado === 'aprendido' ? 1 : 0,
      fechaUltimoRepaso: HOY.toJSON()
    };
  }

  return registros;
}

/**
 * Monta el contenedor real (catálogo semilla + repositorios en memoria), guarda el progreso y el
 * historial del escenario y renderiza el tablero. El progreso se rehidrata con `reconstruir` en
 * lugar de simularse con un reloj: lo que se prueba es la lectura del tablero, no la racha.
 */
async function montarTablero(escenario: Escenario = {}): Promise<void> {
  const contenedor = crearAdaptadores(null);
  const progreso = new ProgresoMemoriaRepository();
  const evaluaciones = new EvaluacionMemoriaRepository();

  // RF-001 simulado: fija el usuario para que el progreso guardado sea el que lee el caso de uso.
  await contenedor.sesion.establecerUsuario(ESTUDIANTE, 'Estudiante de prueba');

  const nivelesAprobados = escenario.nivelesAprobados ?? [];
  const nivelActual = escenario.nivelActual ?? Math.min(nivelesAprobados.length + 1, NivelId.ULTIMO);

  await progreso.guardar(
    ProgresoEstudiante.reconstruir({
      estudianteId: ESTUDIANTE,
      nivelActual,
      cursoCompletado: escenario.cursoCompletado ?? nivelesAprobados.includes(NivelId.ULTIMO),
      xp: escenario.xp ?? 0,
      rachaDias: escenario.rachaDias ?? 0,
      fechaUltimaActividad: null,
      nivelesAprobados: [...nivelesAprobados],
      palabras: registrosDePalabras(escenario.palabras ?? {})
    })
  );

  for (const evaluacion of escenario.evaluaciones ?? []) {
    await evaluaciones.guardar(evaluacion);
  }

  establecerContenedor({ ...contenedor, progreso, evaluaciones, sincronizacion: NUBE_QUE_NO_SUBE });
  render(<Tablero />);
}

/** Busca un elemento por selector CSS y falla con un mensaje claro si no existe. */
function elemento(selector: string): HTMLElement {
  const encontrado = document.querySelector<HTMLElement>(selector);
  if (encontrado === null) throw new Error(`No se encontró el elemento ${selector}.`);
  return encontrado;
}

/** Bloque de una métrica concreta del tablero. */
function estadistica(tipo: 'progreso' | 'xp' | 'racha' | 'palabras'): HTMLElement {
  return elemento(`[data-estadistica="${tipo}"]`);
}

/** Fila del historial de una evaluación concreta. */
function fila(id: string): HTMLElement {
  return elemento(`[data-evaluacion="${id}"]`);
}

afterEach(() => {
  reiniciarContenedor();
});

describe('[RF-008] Tablero de progreso', () => {
  it('[RF-008] un perfil nuevo muestra 0 % de progreso, 0 XP, racha 0 y 0 palabras (RN-07)', async () => {
    // Dado un estudiante que nunca practicó ni rindió una evaluación
    await montarTablero();

    // Cuando se carga su tablero
    await screen.findByText('0 %');

    // Entonces las cuatro métricas arrancan en cero y sin historial previo
    expect(document.querySelectorAll('[data-estadistica]')).toHaveLength(4);
    expect(within(estadistica('progreso')).getByText('0 %')).toBeInTheDocument();
    expect(within(estadistica('xp')).getByText('0 XP')).toBeInTheDocument();
    expect(within(estadistica('racha')).getByText('0 días')).toBeInTheDocument();
    expect(within(estadistica('palabras')).getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Nivel 1 de 10')).toBeInTheDocument();
  });

  it('[RF-008] sin evaluaciones el historial queda vacío con salida a la lección del nivel actual', async () => {
    // Dado un perfil nuevo, sin evaluaciones rendidas
    await montarTablero();

    // Cuando se mira la sección de historial
    const titulo = await screen.findByText('Aún no hay evaluaciones');

    // Entonces explica la situación y ofrece el siguiente paso dentro de la lección vigente
    expect(titulo).toBeInTheDocument();
    expect(document.querySelectorAll('[data-evaluacion]')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Ir a la lección del nivel 1' }).getAttribute('href')).toContain(
      '/lesson/1'
    );
  });

  it('[RF-008] las palabras en repaso se listan con su selector data-palabra-repasar', async () => {
    // Dado un estudiante con dos palabras que necesitan refuerzo (RN-08)
    await montarTablero({ palabras: { voc_1_1: 'repasar', voc_1_2: 'repasar' } });

    // Cuando se carga la sección de repaso
    await screen.findByText('Palabras para repasar');

    // Entonces cada palabra aparece con término, traducción y categoría, y enlaza a su lección
    const palabras = document.querySelectorAll('[data-palabra-repasar]');
    expect(palabras).toHaveLength(2);

    const primera = elemento('[data-palabra-repasar="voc_1_1"]');
    expect(primera.textContent).toContain('Allianllachu');
    expect(primera.textContent).toContain('¿Cómo estás? / ¿Estás bien?');
    expect(primera.textContent).toContain('Saludo');
    expect(primera.getAttribute('href')).toContain('palabras=voc_1_1');
  });

  it('[RF-008] una fecha inválida del historial se muestra con un respaldo legible', async () => {
    // Dado un historial con una fecha que el navegador no puede interpretar
    await montarTablero({
      evaluaciones: [crearEvaluacion({ id: 'ev-rara', nivel: 1, puntuacion: 80, dia: 'sin-fecha' })]
    });

    // Cuando se pinta su fila
    const respaldo = await screen.findByText(/Fecha no disponible/);

    // Entonces se informa el respaldo en lugar de «Invalid Date»
    expect(respaldo).toBeInTheDocument();
    expect(fila('ev-rara')).toHaveTextContent('8 de 10 aciertos');
    expect(fila('ev-rara')).toHaveTextContent('Fecha no disponible');
  });

  it('[RN-03] los 10 niveles aprobados llevan el progreso global al 100 %', async () => {
    // Dado un estudiante que aprobó los diez niveles del curso
    await montarTablero({
      nivelesAprobados: LOS_DIEZ_NIVELES,
      evaluaciones: [crearEvaluacion({ id: 'ev-10', nivel: 10, puntuacion: 90, dia: '2026-03-12' })]
    });

    // Cuando se consulta la métrica de progreso global
    const barra = await screen.findByRole('progressbar', { name: 'Progreso global del curso' });

    // Entonces el curso queda al 100 % y se anuncia el final del recorrido
    expect(within(estadistica('progreso')).getByText('100 %')).toBeInTheDocument();
    expect(within(estadistica('progreso')).getByText('10 de 10 niveles aprobados')).toBeInTheDocument();
    expect(barra).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('¡Curso completado!')).toBeInTheDocument();
  });
});

describe('[UX-MILLER] Tablero de progreso', () => {
  it('[UX-MILLER] el historial se agrupa por nivel y muestra como mucho 5 evaluaciones por grupo', async () => {
    // Dado un historial con siete evaluaciones del nivel 1 y tres del nivel 2
    await montarTablero({
      evaluaciones: [...evaluacionesDeNivel(1, 7, 1), ...evaluacionesDeNivel(2, 3, 8)]
    });

    // Cuando se pinta el historial
    await screen.findByText('Historial de evaluaciones');

    // Entonces se agrupa por nivel y ningún grupo desborda el límite de Miller
    expect(document.querySelectorAll('[data-grupo-nivel]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-grupo-nivel="1"] [data-evaluacion]')).toHaveLength(
      LIMITE_POR_GRUPO
    );
    expect(document.querySelectorAll('[data-grupo-nivel="2"] [data-evaluacion]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-evaluacion]')).toHaveLength(8);
  });

  it('[UX-MILLER] Ver más amplía el grupo de cinco en cinco sin salir de su nivel', async () => {
    // Dado el historial agrupado del caso anterior
    await montarTablero({
      evaluaciones: [...evaluacionesDeNivel(1, 7, 1), ...evaluacionesDeNivel(2, 3, 8)]
    });
    await screen.findByText('Historial de evaluaciones');
    expect(elemento('[data-ver-mas="1"]').textContent).toBe('Ver más');

    // Cuando el estudiante amplía el nivel 1
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));

    // Entonces ve las siete evaluaciones de ese nivel y puede volver a contraerlo
    expect(document.querySelectorAll('[data-grupo-nivel="1"] [data-evaluacion]')).toHaveLength(7);
    expect(document.querySelectorAll('[data-evaluacion]')).toHaveLength(10);
    expect(elemento('[data-ver-mas="1"]').textContent).toBe('Ver menos');

    // Y al contraerlo vuelve al límite de cinco
    fireEvent.click(screen.getByRole('button', { name: 'Ver menos' }));
    expect(document.querySelectorAll('[data-grupo-nivel="1"] [data-evaluacion]')).toHaveLength(
      LIMITE_POR_GRUPO
    );
  });
});

describe('[UX-HICK] Tablero de progreso', () => {
  it('[UX-HICK] el tablero expone exactamente un CTA primario', async () => {
    // Dado un estudiante con palabras pendientes e historial
    await montarTablero({
      palabras: { voc_1_1: 'repasar' },
      evaluaciones: [crearEvaluacion({ id: 'ev-1', nivel: 1, puntuacion: 80, dia: '2026-03-10' })]
    });

    // Cuando se cuentan las llamadas a la acción primarias
    const cta = await screen.findByRole('link', { name: 'Repasar mis palabras pendientes' });

    // Entonces sólo hay una y lleva a la lección filtrada por las palabras pendientes
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    expect(cta).toHaveAttribute('data-cta', 'primario');
    expect(cta.getAttribute('href')).toContain('/lesson/1');
    expect(cta.getAttribute('href')).toContain('palabras=voc_1_1');
  });

  it('[UX-HICK] sin palabras pendientes el CTA primario continúa el nivel actual', async () => {
    // Dado un estudiante al día: sin palabras en repaso y con dos niveles aprobados
    await montarTablero({
      palabras: { voc_1_1: 'aprendido' },
      nivelesAprobados: [1, 2],
      evaluaciones: [crearEvaluacion({ id: 'ev-2', nivel: 2, puntuacion: 90, dia: '2026-03-12' })]
    });

    // Cuando se busca la acción principal de la pantalla
    const cta = await screen.findByRole('link', { name: 'Continuar con el nivel 3' });

    // Entonces es la única primaria, invita a seguir avanzando y ya no hay nada que repasar
    expect(document.querySelectorAll('[data-cta="primario"]')).toHaveLength(1);
    expect(cta).toHaveAttribute('data-cta', 'primario');
    expect(cta.getAttribute('href')).toContain('/lesson/3');
    expect(screen.getByText('¡Nada pendiente!')).toBeInTheDocument();
  });

  it('[UX-HICK] cada grupo del historial tiene un solo control', async () => {
    // Dado un historial con un grupo largo (nivel 1) y otro corto (nivel 2)
    await montarTablero({
      evaluaciones: [...evaluacionesDeNivel(1, 7, 1), ...evaluacionesDeNivel(2, 3, 8)]
    });
    await screen.findByText('Historial de evaluaciones');

    // Cuando se cuentan los controles de cada grupo
    const grupoLargo = elemento('[data-grupo-nivel="1"]');
    const grupoCorto = elemento('[data-grupo-nivel="2"]');

    // Entonces el grupo largo ofrece exactamente un control y el corto ninguno
    expect(within(grupoLargo).getAllByRole('button')).toHaveLength(1);
    expect(within(grupoLargo).getByRole('button', { name: 'Ver más' })).toBeInTheDocument();
    expect(within(grupoCorto).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('[RN-15] Tablero de progreso', () => {
  it('[RN-15] el contador de sincronización pendiente aparece con el estado de cada evaluación', async () => {
    // Dado un historial con una evaluación ya sincronizada y otra todavía en la cola offline
    await montarTablero({
      palabras: { voc_1_1: 'repasar' },
      evaluaciones: [
        crearEvaluacion({
          id: 'ev-sincronizada',
          nivel: 1,
          puntuacion: 80,
          dia: '2026-03-10',
          sincronizada: true
        }),
        crearEvaluacion({ id: 'ev-pendiente', nivel: 1, puntuacion: 60, dia: '2026-03-11' })
      ]
    });

    // Cuando se carga la cabecera del historial
    const contador = await screen.findByText('1 pendiente de sincronizar');

    // Entonces el contador global y la marca de cada fila coinciden con la cola real
    expect(contador).toBeInTheDocument();
    expect(elemento('[data-sincronizacion-pendientes="1"]')).toBeInTheDocument();
    expect(within(fila('ev-sincronizada')).getByText('Sincronizado')).toBeInTheDocument();
    expect(within(fila('ev-pendiente')).getByText('Pendiente de sincronizar')).toBeInTheDocument();
  });
});
