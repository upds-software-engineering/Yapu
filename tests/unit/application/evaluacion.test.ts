import { describe, expect, it } from 'vitest';
import { CalificarEvaluacionUseCase } from '@application/use-cases/CalificarEvaluacionUseCase';
import { GenerarEvaluacionUseCase } from '@application/use-cases/GenerarEvaluacionUseCase';
import type { ProgresoRepository, SesionPort } from '@application/ports';
import type { RespuestaDto } from '@application/dto';
import type { DatosProgreso as ProgresoPlano } from '@domain/aprendizaje/ProgresoEstudiante';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { Evaluacion, PoliticaAprobacion } from '@domain/evaluacion';
import { NivelId } from '@domain/value-objects/NivelId';
import { Puntuacion } from '@domain/value-objects/Puntuacion';
import {
  ContenidoInsuficienteError,
  NivelBloqueadoError,
  NoEncontradoError
} from '@domain/errores';
import type { CategoriaGramatical } from '@domain/shared/tipos';
import {
  BorradorEvaluacionMemoria,
  CatalogoMemoriaRepository,
  EvaluacionMemoriaRepository,
  OracionMemoriaRepository,
  ProgresoMemoriaRepository
} from '@infrastructure/persistence/memory';
import { AleatorioFijo, GeneradorIdSecuencial, RelojFijo } from '../../helpers';

/**
 * [RF-005] Casos de uso de evaluación.
 *
 * Cubre la generación (RN-01, RN-09, RN-10), la calificación (RN-04) y sus efectos sobre el
 * progreso: desbloqueo secuencial (RN-02), XP idempotente (RN-05), cola offline (RN-15) e
 * identidad de la evaluación (RN-17).
 */

const ESTUDIANTE = 'estudiante-1';
const FECHA_FIJA = '2026-03-15T09:00:00.000Z';

// ---------------------------------------------------------------------------
// Dobles de puertos que no viven en la infraestructura (sesión, conectividad, nube)
// ---------------------------------------------------------------------------

class SesionFija implements SesionPort {
  constructor(private readonly usuarioId: string, private readonly nombre = 'Wayra') {}

  async obtener() {
    return { usuarioId: this.usuarioId, rol: 'estudiante' as const, nombre: this.nombre };
  }

  async cambiarRol() {
    return this.obtener();
  }

  async establecerUsuario(usuarioId: string, nombre?: string) {
    return { usuarioId, rol: 'estudiante' as const, nombre: nombre ?? this.nombre };
  }
}

// ---------------------------------------------------------------------------
// Vocabulario de prueba
// ---------------------------------------------------------------------------

interface OpcionesPalabra {
  id: string;
  nivelId: number;
  termino: string;
  traduccion: string;
  categoria?: CategoriaGramatical;
}

/** Construye vocabulario de prueba por el camino validado del dominio (`Palabra.crear`). */
function palabra(opciones: OpcionesPalabra): Palabra {
  return Palabra.crear({
    id: opciones.id,
    nivelId: opciones.nivelId,
    termino: opciones.termino,
    traduccion: opciones.traduccion,
    pronunciacion: `${opciones.termino} (pronunciación)`,
    categoria: opciones.categoria ?? 'sustantivo',
    contextoCultural: `Contexto cultural de ${opciones.termino}.`,
    ejemploUso: `Ejemplo de uso de ${opciones.termino}.`
  });
}

const CANTIDAD_TERMINOS = 10;
const RAIZ_TERMINO = 'yupay';
const PALABRAS_POR_NIVEL = 6;

/**
 * Reserva de vocabulario: seis palabras por cada uno de los 10 niveles.
 *
 * Hace falta para los niveles altos (el 9 y el 10), donde el generador necesita 3 distractores
 * únicos del mismo nivel y categoría para cada pregunta (RN-09). Todas llevan la misma categoría
 * (`sustantivo`) justamente para que el primer pool de distractores sea suficiente.
 */
const PALABRAS_TODOS_LOS_NIVELES: readonly Palabra[] = Array.from(
  { length: CANTIDAD_TERMINOS },
  (_sinUso, indice) => indice + 1
).flatMap((nivelId) =>
  Array.from({ length: PALABRAS_POR_NIVEL }, (_sinUso, indice) => {
    const termino = `${RAIZ_TERMINO}${nivelId}${indice + 1}`;
    return palabra({
      id: `palabra-${nivelId}-${indice + 1}`,
      nivelId,
      termino,
      traduccion: `significado ${nivelId}-${indice + 1}`
    });
  })
);

const NIVELES = Array.from({ length: CANTIDAD_TERMINOS }, (_sinUso, indice) =>
  Nivel.crear({
    id: indice + 1,
    tituloQuechua: `Nivel quechua ${indice + 1}`,
    tituloEspanol: `Nivel español ${indice + 1}`,
    descripcion: `Descripción del nivel ${indice + 1}.`,
    icono: 'Sparkles',
    colorAcento: '#B94700'
  })
);

/** Seis palabras del nivel 1 con la misma categoría: garantizan 10 preguntas con 3 distractores. */
function vocabularioRico(): readonly Palabra[] {
  const propias = Array.from({ length: 6 }, (_sinUso, indice) =>
    palabra({
      id: `p1-${indice + 1}`,
      nivelId: 1,
      termino: `rimay${indice + 1}`,
      traduccion: `vocablo ${indice + 1}`
    })
  );
  return [...propias, ...PALABRAS_TODOS_LOS_NIVELES];
}

/**
 * Dos palabras en el nivel 2: ninguna pregunta puede reunir 3 distractores únicos, así que no se
 * alcanza el mínimo de 5 preguntas válidas de RN-10.
 */
function vocabularioInsuficiente(): readonly Palabra[] {
  return Array.from({ length: 2 }, (_sinUso, indice) =>
    palabra({
      id: `p2-${indice + 1}`,
      nivelId: 2,
      termino: `suyu${indice + 1}`,
      traduccion: `región ${indice + 1}`
    })
  );
}

// ---------------------------------------------------------------------------
// Escenario
// ---------------------------------------------------------------------------

interface Escenario {
  generar: GenerarEvaluacionUseCase;
  calificar: CalificarEvaluacionUseCase;
  progreso: ProgresoMemoriaRepository;
  evaluaciones: EvaluacionMemoriaRepository;
  borrador: BorradorEvaluacionMemoria;
  generadorId: GeneradorIdSecuencial;
  reloj: RelojFijo;
}

interface OpcionesEscenario {
  palabras?: readonly Palabra[];
  progresoInicial?: ProgresoPlano;
  historial?: readonly { id: string; nivelId: number; puntuacion: number }[];
}

/** Fecha y hora local del reloj fijo, para construir el ISO real que guarda el caso de uso. */
function isoDelReloj(reloj: RelojFijo): string {
  return reloj.ahora().toISOString();
}

function estadoInicial(
  sobrescrituras: Partial<ProgresoPlano> = {}
): ProgresoPlano {
  return {
    estudianteId: ESTUDIANTE,
    nivelActual: 1,
    cursoCompletado: false,
    xp: 0,
    rachaDias: 0,
    fechaUltimaActividad: null,
    nivelesAprobados: [],
    palabras: {},
    ...sobrescrituras
  };
}

function escenario(opciones: OpcionesEscenario = {}): Escenario {
  const catalogo = new CatalogoMemoriaRepository(
    NIVELES,
    opciones.palabras ?? vocabularioRico()
  );
  const oraciones = new OracionMemoriaRepository();
  const progreso = new ProgresoMemoriaRepository();
  const evaluaciones = new EvaluacionMemoriaRepository();
  const borrador = new BorradorEvaluacionMemoria();
  const sesion = new SesionFija(ESTUDIANTE);
  const aleatorio = new AleatorioFijo();
  const generadorId = new GeneradorIdSecuencial('eval');
  const reloj = new RelojFijo(FECHA_FIJA);

  if (opciones.progresoInicial) {
    void progreso.guardar(ProgresoEstudiante.reconstruir(opciones.progresoInicial));
  }

  for (const registro of opciones.historial ?? []) {
    void evaluaciones.guardar(
      // RN-17: el id del historial lo aporta la capa que tiene el generador de identificadores.
      evaluacionDePrueba(registro.id, registro.nivelId, registro.puntuacion, reloj)
    );
  }

  return {
    generar: new GenerarEvaluacionUseCase(
      catalogo,
      oraciones,
      progreso,
      sesion,
      aleatorio,
      generadorId,
      borrador,
      reloj
    ),
    calificar: new CalificarEvaluacionUseCase(
      catalogo,
      progreso,
      evaluaciones,
      sesion,
      reloj,
      generadorId,
      borrador
    ),
    progreso,
    evaluaciones,
    borrador,
    generadorId,
    reloj
  };
}

/** Evaluación ya rendida del historial, para preparar estados de progreso con XP previos. */
function evaluacionDePrueba(
  id: string,
  nivelId: number,
  puntuacion: number,
  reloj: RelojFijo
): ReturnType<typeof Evaluacion.registrar> {
  return Evaluacion.registrar({
    id,
    estudianteId: ESTUDIANTE,
    nivel: NivelId.crear(nivelId),
    puntuacion: Puntuacion.crear(puntuacion),
    aciertos: puntuacion,
    totalPreguntas: 100,
    fechaIso: isoDelReloj(reloj)
  });
}

// ---------------------------------------------------------------------------
// Utilidades de aserción
// ---------------------------------------------------------------------------

/**
 * El repositorio en memoria guarda la forma serializada del agregado. Como el caso de uso no
 * expone el progreso persistido, el test lo inspecciona por el mismo camino que la persistencia.
 */
function clavesPersistidas(repositorio: ProgresoRepository): string[] {
  const interno = repositorio as unknown as { datos: Map<string, ProgresoPlano> };
  return [...interno.datos.keys()];
}

interface HojaRespuestas {
  respuestas: RespuestaDto[];
  palabrasFalladas: string[];
}

/**
 * Responde el examen: acierta los índices marcados y falla el resto.
 *
 * Las opciones correctas se leen del BORRADOR (no del DTO), que es justo la copia que el
 * caso de uso usa para calificar.
 */
function responder(
  borrador: BorradorEvaluacionMemoria,
  nivelId: number,
  correctas: ReadonlySet<number>
): HojaRespuestas {
  const guardado = borrador.obtener(nivelId);
  if (!guardado) throw new Error('El borrador de la evaluación no se guardó.');

  const respuestas: RespuestaDto[] = [];
  const palabrasFalladas = new Set<string>();

  guardado.preguntas.forEach((pregunta, indice) => {
    if (correctas.has(indice)) {
      respuestas.push({ preguntaId: pregunta.id, opcion: pregunta.opcionCorrecta });
      return;
    }
    const incorrecta = pregunta.opciones.find(
      (opcion) => opcion !== pregunta.opcionCorrecta
    );
    respuestas.push({ preguntaId: pregunta.id, opcion: incorrecta ?? '' });
    palabrasFalladas.add(pregunta.palabraId);
  });

  return { respuestas, palabrasFalladas: [...palabrasFalladas] };
}

/** Índices 0..cantidad-1: respuestas acertadas consecutivas desde la primera pregunta. */
function primeros(cantidad: number): Set<number> {
  return new Set(Array.from({ length: cantidad }, (_sinUso, indice) => indice));
}

function todosLosIndices(): Set<number> {
  return primeros(10);
}

// ---------------------------------------------------------------------------
// Pruebas
// ---------------------------------------------------------------------------

describe('[RF-005] Generar evaluación', () => {
  it('[RN-01] rechaza un nivel superior al actual con NivelBloqueadoError y no guarda nada', async () => {
    // Dado un estudiante con nivel actual 2 y un progreso ya guardado
    const entorno = escenario({ progresoInicial: estadoInicial({ nivelActual: 2 }) });
    const antes = clavesPersistidas(entorno.progreso);

    // Cuando intenta generar la evaluación del nivel 7
    const ejecucion = entorno.generar.ejecutar({ nivel: 7 });

    // Entonces se lanza NivelBloqueadoError y no se escribe nada nuevo
    await expect(ejecucion).rejects.toBeInstanceOf(NivelBloqueadoError);
    await expect(ejecucion).rejects.toMatchObject({ nivelSolicitado: 7, nivelActual: 2 });
    expect(clavesPersistidas(entorno.progreso)).toEqual(antes);
    expect(entorno.borrador.obtener(7)).toBeNull();
  });

  it('[RN-10] genera 10 preguntas en un nivel con vocabulario suficiente', async () => {
    // Dado un estudiante nuevo y un nivel rico en vocabulario
    const entorno = escenario();

    // Cuando genera la evaluación del nivel 1
    const evaluacion = await entorno.generar.ejecutar({ nivel: 1 });

    // Entonces obtiene el objetivo de 10 preguntas, todas con 4 opciones y etiqueta en español
    expect(evaluacion.preguntas).toHaveLength(10);
    expect(evaluacion.totalPreguntas).toBe(10);
    expect(evaluacion.objetivoPreguntas).toBe(10);
    expect(evaluacion.nivelId).toBe(1);
    expect(evaluacion.tituloNivel).toBe('Nivel quechua 1');
    expect(evaluacion.umbralAprobacion).toBe(PoliticaAprobacion.UMBRAL);
    for (const pregunta of evaluacion.preguntas) {
      expect(pregunta.opciones).toHaveLength(4);
      expect(pregunta.etiquetaTipo.length).toBeGreaterThan(0);
      expect(pregunta.nivelId).toBe(1);
      expect(pregunta.enunciado.length).toBeGreaterThan(0);
    }
  });

  it('[RN-09] las preguntas que viajan a la UI no exponen la opción correcta ni la palabra evaluada', async () => {
    // Dado un examen generado
    const entorno = escenario();
    const evaluacion = await entorno.generar.ejecutar({ nivel: 1 });

    // Cuando se inspecciona el DTO de la primera pregunta
    const dto = evaluacion.preguntas[0];

    // Entonces no hay campos de respuesta ni identificadores de palabra
    expect(dto).toBeDefined();
    expect(Object.keys(dto ?? {})).not.toContain('opcionCorrecta');
    expect(Object.keys(dto ?? {})).not.toContain('palabraId');
    expect(Object.keys(dto ?? {})).toEqual([
      'id',
      'tipo',
      'etiquetaTipo',
      'enunciado',
      'opciones',
      'explicacion',
      'nivelId'
    ]);
  });

  it('[RN-10] lanza ContenidoInsuficienteError cuando el nivel no reúne 5 preguntas válidas', async () => {
    // Dado un nivel 2 con sólo dos palabras: sin 3 distractores únicos no hay preguntas válidas
    const entorno = escenario({
      palabras: vocabularioInsuficiente(),
      progresoInicial: estadoInicial({ nivelActual: 2 })
    });

    // Cuando intenta generar la evaluación del nivel 2
    const ejecucion = entorno.generar.ejecutar({ nivel: 2 });

    // Entonces falla por contenido insuficiente y no deja borrador
    await expect(ejecucion).rejects.toBeInstanceOf(ContenidoInsuficienteError);
    await expect(ejecucion).rejects.toMatchObject({ nivelId: 2, preguntasDisponibles: 0 });
    expect(entorno.borrador.obtener(2)).toBeNull();
  });

  it('[RF-005] guarda el borrador con las opciones correctas fuera del alcance de la UI', async () => {
    // Dado un examen generado
    const entorno = escenario();
    const evaluacion = await entorno.generar.ejecutar({ nivel: 1 });

    // Cuando se consulta el borrador guardado
    const guardado = entorno.borrador.obtener(1);

    // Entonces contiene exactamente las preguntas generadas y su fecha de generación
    expect(guardado?.nivelId).toBe(1);
    expect(guardado?.preguntas.map((pregunta) => pregunta.id)).toEqual(
      evaluacion.preguntas.map((pregunta) => pregunta.id)
    );
    expect(guardado?.preguntas[0]?.opcionCorrecta.length).toBeGreaterThan(0);
    expect(guardado?.generadoEn).toBe(isoDelReloj(entorno.reloj));
  });

  it('[RF-005] usa el nivel 1 como respaldo cuando el catálogo no conoce el nivel pedido', async () => {
    // Dado un estudiante nuevo cuyo catálogo no registra el nivel solicitado
    const catalogoSinNivel = new CatalogoMemoriaRepository([], vocabularioRico());
    const oraciones = new OracionMemoriaRepository();
    const progreso = new ProgresoMemoriaRepository();
    const generador = new GenerarEvaluacionUseCase(
      catalogoSinNivel,
      oraciones,
      progreso,
      new SesionFija(ESTUDIANTE),
      new AleatorioFijo(),
      new GeneradorIdSecuencial('eval'),
      new BorradorEvaluacionMemoria(),
      new RelojFijo(FECHA_FIJA)
    );

    // Cuando genera la evaluación del nivel 1
    const evaluacion = await generador.ejecutar({ nivel: 1 });

    // Entonces el título cae al respaldo en español
    expect(evaluacion.tituloNivel).toBe('Nivel 1');
    expect(evaluacion.preguntas).toHaveLength(10);
  });
});

describe('[RF-005] Calificar evaluación', () => {
  it('[RN-04] sin borrador lanza NoEncontradoError y pide volver a generar el examen', async () => {
    // Dado un estudiante con progreso pero sin borrador guardado
    const entorno = escenario({ progresoInicial: estadoInicial() });

    // Cuando califica un examen que ya no existe
    const ejecucion = entorno.calificar.ejecutar({ nivel: 1, respuestas: [] });

    // Entonces falla con un mensaje accionable en español
    await expect(ejecucion).rejects.toBeInstanceOf(NoEncontradoError);
    await expect(ejecucion).rejects.toThrow(
      'La evaluación ya no está disponible. Vuelve a generarla.'
    );
    expect(clavesPersistidas(entorno.progreso)).toHaveLength(1);
  });

  it('[RN-04] con 7 aciertos de 10 la puntuación es 70 y aprueba justo en el umbral', async () => {
    // Dado un examen del nivel actual y 7 respuestas correctas
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, primeros(7));

    // Cuando se califica
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces la puntuación alcanza el umbral y queda aprobado
    expect(resultado.aciertos).toBe(7);
    expect(resultado.totalPreguntas).toBe(10);
    expect(resultado.puntuacion).toBe(70);
    expect(resultado.puntuacion).toBe(PoliticaAprobacion.UMBRAL);
    expect(resultado.aprobado).toBe(true);
    expect(resultado.umbralAprobacion).toBe(PoliticaAprobacion.UMBRAL);
  });

  it('[RN-04] con 6 aciertos de 10 la puntuación es 60 y reprueba', async () => {
    // Dado un examen del nivel actual y 6 respuestas correctas
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, primeros(6));

    // Cuando se califica
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces la puntuación queda por debajo del umbral
    expect(resultado.puntuacion).toBe(60);
    expect(resultado.aprobado).toBe(false);
    expect(resultado.nivelDesbloqueado).toBeNull();
    expect(resultado.cursoCompletado).toBe(false);
  });

  it('[RN-15] la evaluación calificada queda pendiente de sincronizar', async () => {
    // Dado un examen aprobado
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());

    // Cuando se califica
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces la evaluación nace en la cola offline y el progreso avanza un nivel
    const pendientes = await entorno.evaluaciones.listarPendientes();
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]?.id).toBe(resultado.evaluacionId);
    expect(pendientes[0]?.sincronizada).toBe(false);
    expect(pendientes[0]?.aprobado).toBe(true);
    expect(pendientes[0]?.nivelId.valor).toBe(1);
  });

  it('[RN-17] el identificador de la evaluación lo aporta el GeneradorIdPort', async () => {
    // Dado un examen aprobado con un generador determinista
    const entorno = escenario({ progresoInicial: estadoInicial() });
    const evaluacionGenerada = await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());

    // Cuando se califica
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces el id sigue el patrón del puerto determinista y NO es una marca de tiempo:
    // los ids del examen llevan otro prefijo, así que la evaluación no reutiliza ninguno.
    expect(resultado.evaluacionId).toMatch(/^eval-\d+$/);
    expect(resultado.evaluacionId).not.toContain(String(new Date(FECHA_FIJA).getTime()));
    expect(evaluacionGenerada.preguntas.map((pregunta) => pregunta.id)).not.toContain(
      resultado.evaluacionId
    );
    expect(await entorno.evaluaciones.obtener(resultado.evaluacionId)).not.toBeNull();
  });
});

describe('[RN-02] Desbloqueo secuencial de niveles', () => {
  it('[RN-02] aprobar el nivel actual desbloquea el siguiente', async () => {
    // Dado un estudiante en el nivel 1 que aprueba su evaluación
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());

    // Cuando se califica la aprobación
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces se desbloquea el nivel 2 y el progreso persistido lo refleja
    expect(resultado.nivelDesbloqueado).toBe(2);
    expect(resultado.nivelActual).toBe(2);
    expect(resultado.cursoCompletado).toBe(false);
    expect(clavesPersistidas(entorno.progreso)).toEqual([ESTUDIANTE]);
    const guardado = await entorno.progreso.obtener(ESTUDIANTE);
    expect(guardado?.nivelActual.valor).toBe(2);
    expect(guardado?.nivelesAprobados).toEqual([1]);
  });

  it('[RN-02] reprobar no desbloquea el siguiente nivel', async () => {
    // Dado un estudiante en el nivel 1 que reprueba
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, primeros(6));

    // Cuando se califica el suspenso
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces el nivel actual no se mueve y nada queda aprobado
    expect(resultado.nivelDesbloqueado).toBeNull();
    expect(resultado.nivelActual).toBe(1);
    const guardado = await entorno.progreso.obtener(ESTUDIANTE);
    expect(guardado?.nivelActual.valor).toBe(1);
    expect(guardado?.nivelesAprobados).toEqual([]);
  });

  it('[RN-02] un segundo intento aprobado del mismo nivel no vuelve a desbloquear nada', async () => {
    // Dado un estudiante que ya aprobó el nivel 1 (historial con XP acumulada)
    const entorno = escenario({
      progresoInicial: estadoInicial({ xp: 110, nivelesAprobados: [1] }),
      historial: [{ id: 'historial-1', nivelId: 1, puntuacion: 100 }]
    });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());

    // Cuando vuelve a aprobar el mismo nivel
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces no hay desbloqueo: ya estaba superado
    expect(resultado.aprobado).toBe(true);
    expect(resultado.nivelDesbloqueado).toBeNull();
    expect(resultado.nivelActual).toBe(1);
    expect(resultado.porcentajeGlobal).toBe(10);
  });
});

describe('[RN-05] Experiencia ganada', () => {
  it('[RN-05] la primera aprobación suma 110 XP (100 + 10)', async () => {
    // Dado un estudiante nuevo que aprueba por primera vez el nivel 1
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());

    // Cuando se califica la aprobación
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces los XP son 100 por el nivel más 10 por rendir
    expect(resultado.xpGanado).toBe(110);
    const guardado = await entorno.progreso.obtener(ESTUDIANTE);
    expect(guardado?.xp).toBe(110);
  });

  it('[RN-05] una segunda aprobación del mismo nivel sólo suma 10 XP', async () => {
    // Dado un estudiante que ya aprobó el nivel 1 y acumula 110 XP
    const entorno = escenario({
      progresoInicial: estadoInicial({ xp: 110, nivelesAprobados: [1] }),
      historial: [{ id: 'historial-1', nivelId: 1, puntuacion: 100 }]
    });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());

    // Cuando vuelve a aprobar el mismo nivel
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces la recompensa del nivel es idempotente y el total queda en 120
    expect(resultado.xpGanado).toBe(10);
    const guardado = await entorno.progreso.obtener(ESTUDIANTE);
    expect(guardado?.xp).toBe(120);
  });

  it('[RN-05] reprobar también suma los 10 XP de participación', async () => {
    // Dado un estudiante nuevo que reprueba
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, primeros(6));

    // Cuando se califica el suspenso
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces recibe 10 XP por rendir y su racha empieza en 1
    expect(resultado.xpGanado).toBe(10);
    expect(resultado.rachaDias).toBe(1);
    expect((await entorno.progreso.obtener(ESTUDIANTE))?.xp).toBe(10);
  });
});

describe('[RF-005] Mensaje de resultado', () => {
  it('[RN-03] menciona "Curso completado" al aprobar el nivel 10 y nunca el nivel 11', async () => {
    // Dado un estudiante en el nivel 10, el último del curso
    const entorno = escenario({
      progresoInicial: estadoInicial({
        nivelActual: 10,
        nivelesAprobados: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      })
    });
    await entorno.generar.ejecutar({ nivel: 10 });
    const hoja = responder(entorno.borrador, 10, todosLosIndices());

    // Cuando aprueba la evaluación final
    const resultado = await entorno.calificar.ejecutar({ nivel: 10, respuestas: hoja.respuestas });

    // Entonces el curso queda completo, sin desbloqueo y con un mensaje sin "nivel 11"
    expect(resultado.cursoCompletado).toBe(true);
    expect(resultado.nivelDesbloqueado).toBeNull();
    expect(resultado.mensaje).toContain('Curso completado');
    expect(resultado.mensaje).toContain('10 niveles');
    expect(resultado.mensaje).not.toContain('11');
    expect(resultado.porcentajeGlobal).toBe(100);
  });

  it('[RN-02] al aprobar el nivel 9 desbloquea el nivel 10 sin prometer un nivel 11', async () => {
    // Dado un estudiante en el nivel 9 con los ocho niveles previos aprobados
    const entorno = escenario({
      progresoInicial: estadoInicial({
        nivelActual: 9,
        nivelesAprobados: [1, 2, 3, 4, 5, 6, 7, 8]
      })
    });
    await entorno.generar.ejecutar({ nivel: 9 });
    const hoja = responder(entorno.borrador, 9, todosLosIndices());

    // Cuando aprueba el nivel 9
    const resultado = await entorno.calificar.ejecutar({ nivel: 9, respuestas: hoja.respuestas });

    // Entonces se desbloquea exactamente el nivel 10
    expect(resultado.nivelDesbloqueado).toBe(10);
    expect(resultado.mensaje).toBe('¡Kusikuy! Aprobaste con 100% y desbloqueaste el nivel 10.');
    expect(resultado.mensaje).not.toContain('nivel 11');
  });

  it('[RN-04] al reprobar indica cuántas palabras falladas hay que repasar', async () => {
    // Dado un estudiante que reprueba con 6 aciertos
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, primeros(6));

    // Cuando se califica el suspenso
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces el mensaje enumera las palabras falladas y el detalle las señala
    const falladas = hoja.palabrasFalladas.length;
    expect(resultado.mensaje).toBe(
      `Obtuviste 60%. Necesitas al menos ${PoliticaAprobacion.UMBRAL}% para avanzar: repasa las ${falladas} palabras falladas y vuelve a intentarlo.`
    );
    expect(resultado.palabrasFalladas).toHaveLength(falladas);
    expect(resultado.detalle.filter((linea) => !linea.esCorrecta)).toHaveLength(4);
    for (const palabra of resultado.palabrasFalladas) {
      expect(palabra.estado).toBe('nuevo');
    }
  });

  it('[RF-005] el detalle conserva el orden de las preguntas y expone la respuesta correcta', async () => {
    // Dado un examen respondido por completo
    const entorno = escenario({ progresoInicial: estadoInicial() });
    const evaluacion = await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, primeros(7));

    // Cuando se califica
    const resultado = await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces el detalle sigue el orden del examen y marca 7 aciertos
    expect(resultado.detalle.map((linea) => linea.preguntaId)).toEqual(
      evaluacion.preguntas.map((pregunta) => pregunta.id)
    );
    expect(resultado.detalle.filter((linea) => linea.esCorrecta)).toHaveLength(7);
    expect(resultado.palabrasFalladas).toHaveLength(hoja.palabrasFalladas.length);
    expect(resultado.detalle[0]?.opcionCorrecta.length).toBeGreaterThan(0);
    expect(resultado.detalle[0]?.explicacion.length).toBeGreaterThan(0);
  });

  it('[RF-005] limpiar el borrador impide calificar dos veces el mismo examen', async () => {
    // Dado un examen ya calificado
    const entorno = escenario({ progresoInicial: estadoInicial() });
    await entorno.generar.ejecutar({ nivel: 1 });
    const hoja = responder(entorno.borrador, 1, todosLosIndices());
    await entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Cuando se reintenta calificar el mismo nivel
    const reintento = entorno.calificar.ejecutar({ nivel: 1, respuestas: hoja.respuestas });

    // Entonces el borrador ya no existe y el examen debe regenerarse
    await expect(reintento).rejects.toBeInstanceOf(NoEncontradoError);
    expect(entorno.borrador.obtener(1)).toBeNull();
    expect(await entorno.evaluaciones.listarPendientes()).toHaveLength(1);
  });
});
