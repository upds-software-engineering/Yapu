import { describe, expect, it } from 'vitest';
import type { SesionActual, SesionPort } from '@application/ports';
import {
  MarcarPalabraUseCase,
  ObtenerLeccionUseCase,
  ObtenerMapaNivelesUseCase,
  ObtenerTableroUseCase
} from '@application/use-cases';
import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { ProgresoEstudiante, type DatosProgreso, type RegistroPalabra } from '@domain/aprendizaje/ProgresoEstudiante';
import { NivelBloqueadoError, NoEncontradoError } from '@domain/errores';
import { Evaluacion } from '@domain/evaluacion/Evaluacion';
import { NivelId } from '@domain/value-objects/NivelId';
import { Puntuacion } from '@domain/value-objects/Puntuacion';
import {
  CatalogoMemoriaRepository,
  EvaluacionMemoriaRepository,
  ProgresoMemoriaRepository
} from '@infrastructure/persistence/memory';
import { RelojFijo } from '../../helpers';

/**
 * RF-003 / RF-004 / RF-008 — casos de uso de aprendizaje.
 *
 * Se montan los dobles REALES en memoria (los mismos que usan los tests de contrato) y un reloj
 * fijo, de modo que el comportamiento verificado sea el que la UI verá en producción.
 */

const ESTUDIANTE: SesionActual = { usuarioId: 'est-1', rol: 'estudiante', nombre: 'Ana' };

/** Sesión de prueba: no hay autenticación real (ADR-003), sólo el estudiante simulado. */
function unaSesion(actual: SesionActual = ESTUDIANTE): SesionPort {
  return {
    obtener: async () => ({ ...actual }),
    cambiarRol: async (rol) => ({ ...actual, rol }),
    establecerUsuario: async (usuarioId, nombre) => ({
      usuarioId,
      rol: actual.rol,
      nombre: nombre ?? actual.nombre
    })
  };
}

function nivelesDelCurso(): Nivel[] {
  return Array.from({ length: 10 }, (_, indice) =>
    Nivel.crear({
      id: indice + 1,
      tituloQuechua: `Yachay ${indice + 1}`,
      tituloEspanol: `Nivel ${indice + 1}`,
      descripcion: `Contenido del nivel ${indice + 1}.`,
      icono: 'Sparkles',
      colorAcento: '#B94700'
    })
  );
}

function palabrasDeNivel(nivelId: number, terminos: readonly (readonly [string, string])[]): Palabra[] {
  return terminos.map(([termino, traduccion], indice) =>
    Palabra.crear({
      id: `p${nivelId}-${indice + 1}`,
      nivelId,
      termino,
      traduccion,
      pronunciacion: termino,
      categoria: 'sustantivo',
      contextoCultural: `Uso de "${termino}" en la comunidad.`
    })
  );
}

/** RF-004: palabra con imagen y ejemplo, para comprobar los campos opcionales del DTO. */
const PALABRA_CON_IMAGEN = Palabra.crear({
  id: 'p2-imagen',
  nivelId: 2,
  termino: 'yana',
  traduccion: 'Negro',
  pronunciacion: 'ya-na',
  categoria: 'adjetivo',
  contextoCultural: 'Color del cóndor en la cosmovisión andina.',
  imagenUrl: '/imagenes/yana.svg',
  ejemploUso: 'Yana chukcha.'
});

const PALABRAS: readonly Palabra[] = [
  ...palabrasDeNivel(1, [
    ['napaykullayki', 'Hola (saludo respetuoso)'],
    ["allin p'unchay", 'Buenos días'],
    ['mama', 'Madre'],
    ['tayta', 'Padre'],
    ['wawa', 'Niño, bebé']
  ]),
  PALABRA_CON_IMAGEN,
  ...palabrasDeNivel(2, [['puka', 'Rojo']])
];

/** Genera N palabras de nivel 1 para los escenarios de límite (máximo 10 del tablero). */
function muchasPalabrasDeNivel1(cantidad: number): Palabra[] {
  const terminos: Array<readonly [string, string]> = [];
  for (let indice = 1; indice <= cantidad; indice += 1) {
    terminos.push([`simi${indice}`, `Palabra ${indice}`]);
  }
  return palabrasDeNivel(1, terminos);
}

/** Forma persistible de un progreso con valores por defecto sensatos. */
function datosDeProgreso(parcial: Partial<DatosProgreso> & { estudianteId: string }): DatosProgreso {
  return {
    nivelActual: 1,
    cursoCompletado: false,
    xp: 0,
    rachaDias: 0,
    fechaUltimaActividad: null,
    nivelesAprobados: [],
    palabras: {},
    ...parcial
  };
}

/** Registros en estado `repasar` para cada palabra, con la fecha que indique el test. */
function registrosEnRepaso(
  palabras: readonly Palabra[],
  fecha: (indice: number) => string
): Record<string, RegistroPalabra> {
  const registros: Record<string, RegistroPalabra> = {};
  palabras.forEach((palabra, indice) => {
    registros[palabra.id] = {
      palabraId: palabra.id,
      estado: 'repasar',
      contadorAciertos: 0,
      fechaUltimoRepaso: fecha(indice)
    };
  });
  return registros;
}

interface Escenario {
  catalogo: CatalogoMemoriaRepository;
  progreso: ProgresoMemoriaRepository;
  evaluaciones: EvaluacionMemoriaRepository;
  sesion: SesionPort;
  reloj: RelojFijo;
}

function unEscenario(reloj: RelojFijo = new RelojFijo('2026-03-15T12:00:00')): Escenario {
  return {
    catalogo: new CatalogoMemoriaRepository(nivelesDelCurso(), PALABRAS),
    progreso: new ProgresoMemoriaRepository(),
    evaluaciones: new EvaluacionMemoriaRepository(),
    sesion: unaSesion(),
    reloj
  };
}

/** Deja el progreso indicado ya guardado, como si el estudiante hubiera practicado antes. */
async function sembrarProgreso(escenario: Escenario, datos: DatosProgreso): Promise<void> {
  await escenario.progreso.guardar(ProgresoEstudiante.reconstruir(datos));
}

function unaEvaluacion(indice: number, fechaIso: string): Evaluacion {
  return Evaluacion.registrar({
    id: `eval-${indice}`,
    estudianteId: ESTUDIANTE.usuarioId,
    nivel: NivelId.crear(1),
    puntuacion: Puntuacion.crear(80),
    aciertos: 8,
    totalPreguntas: 10,
    fechaIso
  });
}

describe('[RF-003] Mapa de niveles', () => {
  it('[RN-07] un estudiante sin progreso guardado recibe el mapa limpio del perfil nuevo', async () => {
    // Dado un estudiante que abre la aplicación por primera vez
    const escenario = unEscenario();
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando pide el mapa de niveles
    const mapa = await caso.ejecutar();

    // Entonces ve el perfil limpio y la lectura no ha escrito nada
    expect(mapa.nivelActual).toBe(1);
    expect(mapa.xp).toBe(0);
    expect(mapa.rachaDias).toBe(0);
    expect(mapa.nivelesAprobados).toBe(0);
    expect(mapa.porcentajeGlobal).toBe(0);
    expect(mapa.cursoCompletado).toBe(false);
    expect(await escenario.progreso.obtener(ESTUDIANTE.usuarioId)).toBeNull();
  });

  it('[RN-03] sin niveles aprobados el progreso global es 0%', async () => {
    // Dado un estudiante en el nivel 1 sin aprobaciones
    const escenario = unEscenario();
    await sembrarProgreso(escenario, datosDeProgreso({ estudianteId: ESTUDIANTE.usuarioId }));
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();

    // Entonces el progreso global es 0
    expect(mapa.porcentajeGlobal).toBe(0);
    expect(mapa.nivelesAprobados).toBe(0);
  });

  it('[RN-03] con 9 niveles aprobados el progreso global es 90%', async () => {
    // Dado un estudiante que aprobó los 9 primeros niveles
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        nivelActual: 10,
        nivelesAprobados: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      })
    );
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();

    // Entonces el progreso global es 90 y el curso aún no está completo
    expect(mapa.porcentajeGlobal).toBe(90);
    expect(mapa.nivelesAprobados).toBe(9);
    expect(mapa.cursoCompletado).toBe(false);
  });

  it('[RN-03] con los 10 niveles aprobados el progreso global es 100% y el curso está completo', async () => {
    // Dado un estudiante que aprobó los 10 niveles del curso
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        nivelActual: 10,
        cursoCompletado: true,
        nivelesAprobados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      })
    );
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();

    // Entonces el curso está completo al 100%
    expect(mapa.porcentajeGlobal).toBe(100);
    expect(mapa.nivelesAprobados).toBe(10);
    expect(mapa.cursoCompletado).toBe(true);
  });

  it('[RN-01] el nivel 7 de un estudiante de nivel 2 está bloqueado', async () => {
    // Dado un estudiante de nivel 2 que aprobó el nivel 1
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        nivelActual: 2,
        nivelesAprobados: [1]
      })
    );
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();
    const nivel7 = mapa.tramos.flatMap((tramo) => tramo.niveles).find((nivel) => nivel.id === 7);

    // Entonces el nivel 7 está bloqueado y no es navegable
    expect(nivel7?.estado).toBe('bloqueado');
    expect(nivel7?.accesible).toBe(false);
  });

  it('[RN-01] todos los niveles hasta el actual siguen accesibles (navegación ilimitada hacia abajo)', async () => {
    // Dado un estudiante de nivel 3 que aprobó los niveles 1 y 2
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        nivelActual: 3,
        nivelesAprobados: [1, 2]
      })
    );
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();
    const niveles = mapa.tramos.flatMap((tramo) => tramo.niveles);

    // Entonces los niveles 1 y 2 están aprobados y accesibles, el 3 es el actual y el 4 está bloqueado
    expect(niveles.slice(0, 2).map((nivel) => [nivel.estado, nivel.accesible])).toEqual([
      ['aprobado', true],
      ['aprobado', true]
    ]);
    expect(niveles[2]?.estado).toBe('actual');
    expect(niveles[2]?.accesible).toBe(true);
    expect(niveles[3]?.estado).toBe('bloqueado');
    expect(niveles[3]?.accesible).toBe(false);
  });

  it('[RF-003] el mapa agrupa los 10 niveles en los 3 tramos pedagógicos', async () => {
    // Dado un estudiante con el perfil nuevo
    const escenario = unEscenario();
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();

    // Entonces los tramos son los de Miller, con su rango y descripción, y suman 10 niveles
    expect(mapa.tramos.map((tramo) => tramo.id)).toEqual([
      'fundamentos',
      'vida-cotidiana',
      'cosmovision'
    ]);
    expect(mapa.tramos.map((tramo) => tramo.niveles.length)).toEqual([3, 4, 3]);
    expect(mapa.tramos.map((tramo) => tramo.nombre)).toEqual([
      'Fundamentos',
      'Vida cotidiana',
      'Cosmovisión'
    ]);
    expect(mapa.tramos.every((tramo) => tramo.rango.length > 0)).toBe(true);
    expect(mapa.tramos.every((tramo) => tramo.descripcion.length > 0)).toBe(true);
    expect(mapa.tramos.flatMap((tramo) => tramo.niveles)).toHaveLength(10);
  });

  it('[RF-003] cada nivel del mapa informa cuántas palabras tiene en el catálogo', async () => {
    // Dado un catálogo con 5 palabras en el nivel 1 y 2 en el nivel 2
    const escenario = unEscenario();
    const caso = new ObtenerMapaNivelesUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion
    );

    // Cuando consulta el mapa
    const mapa = await caso.ejecutar();
    const niveles = mapa.tramos.flatMap((tramo) => tramo.niveles);

    // Entonces el conteo de palabras de cada nivel es el del catálogo
    expect(niveles.map((nivel) => nivel.palabrasTotal).slice(0, 3)).toEqual([5, 2, 0]);
  });
});

describe('[RF-004] Lección de un nivel', () => {
  it('[RN-07] un perfil nuevo recibe su lección con todas las palabras en estado "nuevo"', async () => {
    // Dado un estudiante sin progreso guardado
    const escenario = unEscenario();
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);

    // Cuando abre la lección del nivel 1
    const leccion = await caso.ejecutar({ nivel: 1 });

    // Entonces no es repaso, las palabras son las del nivel y ninguna está aprendida
    expect(leccion.nivelId).toBe(1);
    expect(leccion.esRepaso).toBe(false);
    expect(leccion.aprendidas).toBe(0);
    expect(leccion.palabras.map((palabra) => palabra.id)).toEqual([
      'p1-1',
      'p1-2',
      'p1-3',
      'p1-4',
      'p1-5'
    ]);
    expect(leccion.palabras.every((palabra) => palabra.estado === 'nuevo')).toBe(true);
    expect(leccion.palabras[0]).toEqual({
      id: 'p1-1',
      nivelId: 1,
      termino: 'napaykullayki',
      traduccion: 'Hola (saludo respetuoso)',
      pronunciacion: 'napaykullayki',
      categoria: 'sustantivo',
      etiquetaCategoria: 'Sustantivo',
      contextoCultural: 'Uso de "napaykullayki" en la comunidad.',
      estado: 'nuevo'
    });
  });

  it('[RF-004] una palabra con imagen y ejemplo conserva ambos campos en el DTO', async () => {
    // Dado un estudiante de nivel 2 que aprobó el nivel 1
    const escenario = unEscenario();
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);
    await sembrarProgreso(
      escenario,
      datosDeProgreso({ estudianteId: ESTUDIANTE.usuarioId, nivelActual: 2, nivelesAprobados: [1] })
    );

    // Cuando pide la lección del nivel 2
    const leccion = await caso.ejecutar({ nivel: 2 });

    // Entonces la primera palabra llega con su imagen y su ejemplo de uso
    expect(leccion.palabras[0]).toEqual({
      id: 'p2-imagen',
      nivelId: 2,
      termino: 'yana',
      traduccion: 'Negro',
      pronunciacion: 'ya-na',
      categoria: 'adjetivo',
      etiquetaCategoria: 'Adjetivo',
      imagenUrl: '/imagenes/yana.svg',
      contextoCultural: 'Color del cóndor en la cosmovisión andina.',
      ejemploUso: 'Yana chukcha.',
      estado: 'nuevo'
    });
  });

  it('[RN-01] pedir la lección de un nivel superior al actual lanza NivelBloqueadoError', async () => {
    // Dado un estudiante de nivel 1
    const escenario = unEscenario();
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);

    // Cuando pide la lección del nivel 5
    // Entonces el dominio lo rechaza
    await expect(caso.ejecutar({ nivel: 5 })).rejects.toBeInstanceOf(NivelBloqueadoError);
  });

  it('[RF-006] el rol docente puede consultar el vocabulario de un nivel bloqueado para el estudiante', async () => {
    // Dado un docente sin progreso propio que prepara una oración base del nivel 2
    const escenario = unEscenario();
    const sesionDocente: SesionPort = {
      obtener: async () => ({ usuarioId: 'doc-1', rol: 'docente' as const, nombre: 'Docente YAPU' }),
      cambiarRol: async (rol) => ({ usuarioId: 'doc-1', rol, nombre: 'Docente YAPU' }),
      establecerUsuario: async (usuarioId, nombre) => ({
        usuarioId,
        rol: 'docente' as const,
        nombre: nombre ?? 'Docente YAPU'
      })
    };
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, sesionDocente);

    // Cuando pide la lección de un nivel posterior a su (inexistente) avance
    const leccion = await caso.ejecutar({ nivel: 2 });

    // Entonces no hay bloqueo: el profesorado necesita el vocabulario de cualquier nivel
    expect(leccion.nivelId).toBe(2);
    expect(leccion.palabras.length).toBeGreaterThan(0);
  });

  it('[RN-01] la lección de un nivel ya superado sigue siendo accesible', async () => {
    // Dado un estudiante de nivel 3 que aprobó los niveles 1 y 2
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        nivelActual: 3,
        nivelesAprobados: [1, 2]
      })
    );
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);

    // Cuando vuelve a la lección del nivel 1
    const leccion = await caso.ejecutar({ nivel: 1 });

    // Entonces la lección se abre con normalidad
    expect(leccion.nivelId).toBe(1);
    expect(leccion.palabras).toHaveLength(5);
  });

  it('[RF-004] la lección de repaso filtra por las palabras falladas y respeta el orden recibido', async () => {
    // Dado un estudiante que viene de fallar las palabras p1-4 y p1-2
    const escenario = unEscenario();
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);

    // Cuando abre la lección en modo repaso
    const leccion = await caso.ejecutar({ nivel: 1, palabrasFalladas: ['p1-4', 'p1-2'] });

    // Entonces sólo ve esas dos, en el orden en que falló
    expect(leccion.esRepaso).toBe(true);
    expect(leccion.palabras.map((palabra) => palabra.id)).toEqual(['p1-4', 'p1-2']);
    expect(leccion.palabras.every((palabra) => palabra.estado === 'nuevo')).toBe(true);
  });

  it('[RF-004] la lección de repaso ignora los ids ajenos al nivel y no repite palabras', async () => {
    // Dado un estudiante que falla una palabra de otro nivel y repite otra dos veces
    const escenario = unEscenario();
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);

    // Cuando abre la lección de repaso del nivel 1
    const leccion = await caso.ejecutar({
      nivel: 1,
      palabrasFalladas: ['p2-1', 'p1-3', 'p1-3', 'p1-1']
    });

    // Entonces sólo quedan las palabras del nivel, sin duplicados
    expect(leccion.palabras.map((palabra) => palabra.id)).toEqual(['p1-3', 'p1-1']);
  });

  it('[RN-08] la lección informa el estado guardado de cada palabra y cuántas hay aprendidas', async () => {
    // Dado un estudiante con una palabra aprendida y otra marcada para repasar
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        palabras: {
          'p1-1': {
            palabraId: 'p1-1',
            estado: 'aprendido',
            contadorAciertos: 1,
            fechaUltimoRepaso: '2026-03-14'
          },
          'p1-2': {
            palabraId: 'p1-2',
            estado: 'repasar',
            contadorAciertos: 0,
            fechaUltimoRepaso: '2026-03-14'
          }
        }
      })
    );
    const caso = new ObtenerLeccionUseCase(escenario.catalogo, escenario.progreso, escenario.sesion);

    // Cuando abre la lección del nivel 1
    const leccion = await caso.ejecutar({ nivel: 1 });

    // Entonces cada palabra conserva su estado y el contador de aprendidas es 1
    expect(leccion.palabras.map((palabra) => palabra.estado)).toEqual([
      'aprendido',
      'repasar',
      'nuevo',
      'nuevo',
      'nuevo'
    ]);
    expect(leccion.aprendidas).toBe(1);
  });
});

describe('[RF-004] Marcar palabra', () => {
  it('[RN-05] la primera vez que una palabra se aprende otorga 2 XP', async () => {
    // Dado un estudiante con el perfil nuevo
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );

    // Cuando marca la palabra como aprendida
    const resultado = await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Entonces gana 2 XP y suma una palabra aprendida
    expect(resultado).toEqual({
      palabraId: 'p1-1',
      estado: 'aprendido',
      xpGanado: 2,
      palabrasAprendidas: 1,
      rachaDias: 1
    });
  });

  it('[RN-05] volver a marcar la misma palabra como aprendida otorga 0 XP', async () => {
    // Dado un estudiante que ya marcó la palabra como aprendida
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );
    await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Cuando la vuelve a marcar como aprendida
    const resultado = await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Entonces no recibe XP extra pero la palabra sigue contando una sola vez
    expect(resultado.xpGanado).toBe(0);
    expect(resultado.palabrasAprendidas).toBe(1);
    expect((await escenario.progreso.obtener(ESTUDIANTE.usuarioId))?.xp).toBe(2);
  });

  it('[RN-08] marcar dos veces la misma palabra no infla las palabras aprendidas', async () => {
    // Dado un estudiante que marca dos palabras distintas y repite la primera
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );
    await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });
    await caso.ejecutar({ palabraId: 'p1-2', estado: 'aprendido' });

    // Cuando vuelve a marcar la primera
    const resultado = await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Entonces el contador sigue siendo 2
    expect(resultado.palabrasAprendidas).toBe(2);
  });

  it('[RN-08] marcar una palabra para repasar la saca del conteo de aprendidas', async () => {
    // Dado un estudiante que tenía la palabra aprendida
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );
    await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Cuando la marca para repasar
    const resultado = await caso.ejecutar({ palabraId: 'p1-1', estado: 'repasar' });

    // Entonces deja de contar como aprendida y no gana XP
    expect(resultado.estado).toBe('repasar');
    expect(resultado.palabrasAprendidas).toBe(0);
    expect(resultado.xpGanado).toBe(0);
  });

  it('[RN-06] la primera actividad arranca la racha en 1', async () => {
    // Dado un estudiante sin actividad previa
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );

    // Cuando marca su primera palabra
    const resultado = await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Entonces la racha es 1
    expect(resultado.rachaDias).toBe(1);
  });

  it('[RN-06] una segunda actividad el mismo día no cambia la racha', async () => {
    // Dado un estudiante que ya practicó hoy
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );
    await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Cuando practica otra palabra dos horas después del mismo día
    escenario.reloj.avanzarHoras(2);
    const resultado = await caso.ejecutar({ palabraId: 'p1-2', estado: 'aprendido' });

    // Entonces la racha sigue siendo 1
    expect(resultado.rachaDias).toBe(1);
  });

  it('[RN-06] practicar al día siguiente suma un día de racha', async () => {
    // Dado un estudiante con racha 1 de hoy
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );
    await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Cuando vuelve a practicar al día siguiente
    escenario.reloj.avanzarDias(1);
    const resultado = await caso.ejecutar({ palabraId: 'p1-2', estado: 'aprendido' });

    // Entonces la racha pasa a 2
    expect(resultado.rachaDias).toBe(2);
  });

  it('[RN-07] marcar una palabra sin progreso guardado crea el perfil desde cero', async () => {
    // Dado un repositorio de progreso vacío
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );
    expect(await escenario.progreso.obtener(ESTUDIANTE.usuarioId)).toBeNull();

    // Cuando marca una palabra
    await caso.ejecutar({ palabraId: 'p1-1', estado: 'aprendido' });

    // Entonces el progreso queda persistido con la actividad del día
    const guardado = await escenario.progreso.obtener(ESTUDIANTE.usuarioId);
    expect(guardado?.estudianteId).toBe(ESTUDIANTE.usuarioId);
    expect(guardado?.nivelActual.valor).toBe(1);
    expect(guardado?.obtenerRegistro('p1-1')?.estado).toBe('aprendido');
    expect(guardado?.fechaUltimaActividad?.toJSON()).toBe('2026-03-15');
  });

  it('[RF-004] marcar una palabra inexistente lanza NoEncontradoError', async () => {
    // Dado un estudiante con un identificador que no está en el catálogo
    const escenario = unEscenario();
    const caso = new MarcarPalabraUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.sesion,
      escenario.reloj
    );

    // Cuando intenta marcarla
    // Entonces el caso de uso lanza NoEncontradoError y no guarda nada
    await expect(
      caso.ejecutar({ palabraId: 'palabra-fantasma', estado: 'aprendido' })
    ).rejects.toBeInstanceOf(NoEncontradoError);
    expect(await escenario.progreso.obtener(ESTUDIANTE.usuarioId)).toBeNull();
  });
});

describe('[RF-008] Tablero del estudiante', () => {
  it('[RN-07] el tablero de un perfil nuevo devuelve métricas en cero y sin historial', async () => {
    // Dado un estudiante sin progreso guardado ni evaluaciones
    const escenario = unEscenario();
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces todo está a cero
    expect(tablero).toEqual({
      estudianteId: ESTUDIANTE.usuarioId,
      nivelActual: 1,
      cursoCompletado: false,
      porcentajeGlobal: 0,
      nivelesAprobados: 0,
      xp: 0,
      rachaDias: 0,
      palabrasAprendidas: 0,
      palabrasParaRepasar: [],
      historial: []
    });
  });

  it('[RF-008] el tablero resume el progreso del curso', async () => {
    // Dado un estudiante de nivel 3 con 200 XP, racha 4 y dos niveles aprobados
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        nivelActual: 3,
        nivelesAprobados: [1, 2],
        xp: 200,
        rachaDias: 4,
        palabras: {
          'p1-1': {
            palabraId: 'p1-1',
            estado: 'aprendido',
            contadorAciertos: 1,
            fechaUltimoRepaso: '2026-03-15'
          }
        }
      })
    );
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces ve sus métricas reales
    expect(tablero.nivelActual).toBe(3);
    expect(tablero.nivelesAprobados).toBe(2);
    expect(tablero.porcentajeGlobal).toBe(20);
    expect(tablero.xp).toBe(200);
    expect(tablero.rachaDias).toBe(4);
    expect(tablero.palabrasAprendidas).toBe(1);
  });

  it('[RN-08] el tablero lista las palabras para repasar de la más reciente a la más antigua', async () => {
    // Dado un estudiante con tres palabras en repaso con fechas distintas
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        palabras: {
          'p1-2': {
            palabraId: 'p1-2',
            estado: 'repasar',
            contadorAciertos: 0,
            fechaUltimoRepaso: '2026-03-10'
          },
          'p1-1': {
            palabraId: 'p1-1',
            estado: 'repasar',
            contadorAciertos: 0,
            fechaUltimoRepaso: '2026-03-13'
          },
          'p2-1': {
            palabraId: 'p2-1',
            estado: 'repasar',
            contadorAciertos: 0,
            fechaUltimoRepaso: '2026-03-12'
          }
        }
      })
    );
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces las palabras llegan ordenadas por último repaso descendente y marcadas como repaso
    expect(tablero.palabrasParaRepasar.map((palabra) => palabra.id)).toEqual([
      'p1-1',
      'p2-1',
      'p1-2'
    ]);
    expect(tablero.palabrasParaRepasar.every((palabra) => palabra.estado === 'repasar')).toBe(true);
  });

  it('[RN-08] el tablero ignora las palabras aprendidas y las que no tienen registro', async () => {
    // Dado un estudiante con una palabra aprendida y otra sin registro
    const escenario = unEscenario();
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        palabras: {
          'p1-1': {
            palabraId: 'p1-1',
            estado: 'aprendido',
            contadorAciertos: 3,
            fechaUltimoRepaso: '2026-03-14'
          }
        }
      })
    );
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces no hay nada pendiente de repaso
    expect(tablero.palabrasParaRepasar).toEqual([]);
  });

  it('[RN-08] el tablero muestra como máximo 10 palabras para repasar', async () => {
    // Dado un estudiante con 12 palabras en repaso
    const escenario = unEscenario();
    const palabras = muchasPalabrasDeNivel1(12);
    escenario.catalogo = new CatalogoMemoriaRepository(nivelesDelCurso(), palabras);
    await sembrarProgreso(
      escenario,
      datosDeProgreso({
        estudianteId: ESTUDIANTE.usuarioId,
        palabras: registrosEnRepaso(
          palabras,
          (indice) => `2026-03-${String(indice + 1).padStart(2, '0')}`
        )
      })
    );
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces sólo ve las 10 más recientes
    expect(tablero.palabrasParaRepasar).toHaveLength(10);
    expect(tablero.palabrasParaRepasar[0]?.id).toBe('p1-12');
    expect(tablero.palabrasParaRepasar[9]?.id).toBe('p1-3');
  });

  it('[RF-008] el historial de evaluaciones se ordena por fecha descendente y se limita a 10', async () => {
    // Dado un estudiante con 11 evaluaciones guardadas desordenadas
    const escenario = unEscenario();
    for (let indice = 1; indice <= 11; indice += 1) {
      const dia = String(indice).padStart(2, '0');
      await escenario.evaluaciones.guardar(unaEvaluacion(indice, `2026-03-${dia}T10:00:00.000Z`));
    }
    await escenario.evaluaciones.guardar(unaEvaluacion(0, '2026-02-01T10:00:00.000Z'));
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces sólo quedan las 10 más recientes, de la más nueva a la más antigua
    expect(tablero.historial).toHaveLength(10);
    expect(tablero.historial.map((evaluacion) => evaluacion.id)).toEqual([
      'eval-11',
      'eval-10',
      'eval-9',
      'eval-8',
      'eval-7',
      'eval-6',
      'eval-5',
      'eval-4',
      'eval-3',
      'eval-2'
    ]);
  });

  it('[RF-008] el historial expone el resumen plano de cada evaluación', async () => {
    // Dado un estudiante con una evaluación aprobada
    const escenario = unEscenario();
    await escenario.evaluaciones.guardar(unaEvaluacion(1, '2026-03-15T10:00:00.000Z'));
    const caso = new ObtenerTableroUseCase(
      escenario.catalogo,
      escenario.progreso,
      escenario.evaluaciones,
      escenario.sesion
    );

    // Cuando abre el tablero
    const tablero = await caso.ejecutar();

    // Entonces el resumen trae los campos del DTO y el estado de sincronización (RN-15)
    expect(tablero.historial[0]).toEqual({
      id: 'eval-1',
      nivelId: 1,
      puntuacion: 80,
      aciertos: 8,
      totalPreguntas: 10,
      aprobado: true,
      fecha: '2026-03-15T10:00:00.000Z',
      sincronizada: false
    });
  });
});
