import { describe, it, expect } from 'vitest';
import { PoliticaXP, ProgresoEstudiante } from '@domain/aprendizaje';
import { NivelBloqueadoError, ValidacionError } from '@domain/errores';
import { FechaDia, NivelId, Puntuacion } from '@domain/value-objects';
import { unRelojFijo } from '../../../helpers';

describe('[RN-07] Perfil nuevo y reconstrucción', () => {
  it('[RN-07] un perfil nuevo arranca en el nivel 1 sin XP, sin racha y sin palabras', () => {
    // Dado un estudiante que abre la aplicación por primera vez
    const progreso = ProgresoEstudiante.nuevo('est-1');

    // Cuando se consulta su estado inicial
    const datos = progreso.toJSON();

    // Entonces el perfil está limpio y la racha es 0 (no 3)
    expect(datos).toEqual({
      estudianteId: 'est-1',
      nivelActual: 1,
      cursoCompletado: false,
      xp: 0,
      rachaDias: 0,
      fechaUltimaActividad: null,
      nivelesAprobados: [],
      palabras: {}
    });
    expect(progreso.nivelActual.valor).toBe(1);
    expect(progreso.palabrasAprendidas).toBe(0);
    expect(progreso.fechaUltimaActividad).toBeNull();
  });

  it('[RN-07] reconstruir recupera exactamente el estado guardado', () => {
    // Dado un progreso con actividad, una palabra aprendida y el nivel 1 aprobado
    const original = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    original.marcarPalabra('p1', 'aprendido', hoy);
    original.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Cuando se rehidrata el agregado desde su forma persistida
    const recuperado = ProgresoEstudiante.reconstruir(original.toJSON());

    // Entonces el estado es idéntico (ida y vuelta sin pérdidas)
    expect(recuperado.toJSON()).toEqual(original.toJSON());
    expect(recuperado.xp).toBe(112);
    expect(recuperado.rachaDias).toBe(1);
    expect(recuperado.esNivelAprobado(NivelId.crear(1))).toBe(true);
  });

  it('[RN-07] un progreso sin identificador de estudiante es inválido', () => {
    // Dado un identificador vacío
    const estudianteId = '   ';

    // Cuando se intenta crear el perfil
    // Entonces el dominio lo rechaza
    expect(() => ProgresoEstudiante.nuevo(estudianteId)).toThrow(ValidacionError);
  });

  it('[RN-07] reconstruir sanea contadores negativos y niveles inválidos', () => {
    // Dado un estado persistido corrupto (XP negativa, racha negativa y niveles repetidos)
    const corrupto = {
      estudianteId: 'est-1',
      nivelActual: 2,
      cursoCompletado: false,
      xp: -40,
      rachaDias: -3,
      fechaUltimaActividad: '2026-03-15',
      nivelesAprobados: [1, 1, 11],
      palabras: {}
    };

    // Cuando se rehidrata el agregado
    const progreso = ProgresoEstudiante.reconstruir(corrupto);

    // Entonces los contadores quedan en 0 y sólo sobrevive el nivel 1
    expect(progreso.xp).toBe(0);
    expect(progreso.rachaDias).toBe(0);
    expect(progreso.nivelesAprobados).toEqual([1]);
    expect(progreso.porcentajeGlobal.valor).toBe(10);
  });

  it('[RN-07] reconstruir rechaza un nivel actual fuera del rango 1..10', () => {
    // Dado un estado persistido con un nivel fuera del rango 1..10
    const corrupto = {
      estudianteId: 'est-1',
      nivelActual: 11,
      cursoCompletado: false,
      xp: 0,
      rachaDias: 0,
      fechaUltimaActividad: null,
      nivelesAprobados: [],
      palabras: {}
    };

    // Cuando se intenta rehidratar
    // Entonces el dominio lo rechaza: no existen niveles fuera del rango 1..10
    expect(() => ProgresoEstudiante.reconstruir(corrupto)).toThrow(ValidacionError);
  });
});

describe('[RN-06] Racha y actividad del estudiante', () => {
  it('[RN-06] marcar una palabra registra actividad y arranca la racha en 1', () => {
    // Dado un perfil nuevo y su primer día de práctica
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando marca una palabra
    progreso.marcarPalabra('p1', 'repasar', hoy);

    // Entonces la racha arranca en 1 y queda registrado el día
    expect(progreso.rachaDias).toBe(1);
    expect(progreso.fechaUltimaActividad?.toJSON()).toBe('2026-03-15');
  });

  it('[RN-06] finalizar una evaluación cuenta como actividad aunque se repruebe', () => {
    // Dado un perfil nuevo y una evaluación reprobada
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando se aplica el resultado reprobado
    progreso.aplicarResultadoEvaluacion(NivelId.crear(1), false, hoy);

    // Entonces el día cuenta como actividad
    expect(progreso.rachaDias).toBe(1);
    expect(progreso.fechaUltimaActividad?.toJSON()).toBe('2026-03-15');
  });

  it('[RN-06] practicar en días consecutivos incrementa la racha', () => {
    // Dado un estudiante que practicó ayer
    const reloj = unRelojFijo('2026-03-15T09:00:00.000Z');
    const progreso = ProgresoEstudiante.nuevo('est-1');
    progreso.marcarPalabra('p1', 'aprendido', reloj.diaActual);

    // Cuando practica hoy (un día después)
    reloj.avanzarDias(1);
    progreso.marcarPalabra('p2', 'aprendido', reloj.diaActual);

    // Entonces la racha crece en uno
    expect(progreso.rachaDias).toBe(2);
  });

  it('[RN-06] una segunda práctica el mismo día no incrementa la racha', () => {
    // Dado un estudiante que ya practicó hoy
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Cuando marca otra palabra el mismo día
    progreso.marcarPalabra('p2', 'aprendido', hoy);

    // Entonces la racha se mantiene
    expect(progreso.rachaDias).toBe(1);
  });

  it('[RN-06] dos días sin practicar reinician la racha a 1', () => {
    // Dado un estudiante con una racha de 2 que deja pasar dos días
    const reloj = unRelojFijo('2026-03-15T09:00:00.000Z');
    const progreso = ProgresoEstudiante.nuevo('est-1');
    progreso.marcarPalabra('p1', 'aprendido', reloj.diaActual);
    reloj.avanzarDias(1);
    progreso.marcarPalabra('p2', 'aprendido', reloj.diaActual);

    // Cuando vuelve a practicar tras dos días de ausencia
    reloj.avanzarDias(2);
    progreso.marcarPalabra('p3', 'aprendido', reloj.diaActual);

    // Entonces la racha se reinicia
    expect(progreso.rachaDias).toBe(1);
  });

  it('[RN-06] la fecha de última actividad se guarda como YYYY-MM-DD', () => {
    // Dado un día concreto
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando el estudiante registra actividad
    const progreso = ProgresoEstudiante.nuevo('est-1');
    progreso.marcarPalabra('p1', 'repasar', hoy);

    // Entonces se persiste como fecha sin hora
    expect(progreso.toJSON().fechaUltimaActividad).toBe('2026-03-15');
  });
});

describe('[RN-05] XP acumulada del estudiante', () => {
  it('[RN-05] la primera aprobación del nivel actual suma 110 XP', () => {
    // Dado un perfil nuevo que rinde la evaluación del nivel 1
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando aprueba el nivel 1
    const resultado = progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Entonces se suman 10 + 100 XP una sola vez
    expect(resultado.xpGanado).toBe(110);
    expect(resultado.aprobacionNueva).toBe(true);
    expect(progreso.xp).toBe(110);
  });

  it('[RN-05] repetir la aprobación de un nivel ya superado sólo suma 10 XP', () => {
    // Dado un estudiante que ya aprobó el nivel 1 y está en el 2
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Cuando vuelve a rendir y aprobar el nivel 1
    const resultado = progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Entonces no recibe de nuevo los 100 XP de nivel
    expect(resultado.xpGanado).toBe(10);
    expect(resultado.aprobacionNueva).toBe(false);
    expect(progreso.xp).toBe(120);
  });

  it('[RN-05] rendir una evaluación reprobada suma 10 XP sin aprobar el nivel', () => {
    // Dado un perfil nuevo que reprueba la evaluación del nivel 1
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando se aplica el resultado reprobado
    const resultado = progreso.aplicarResultadoEvaluacion(NivelId.crear(1), false, hoy);

    // Entonces suma sólo la participación y el nivel sigue pendiente
    expect(resultado.xpGanado).toBe(PoliticaXP.XP_POR_EVALUACION);
    expect(resultado.desbloqueado).toBeNull();
    expect(progreso.xp).toBe(10);
    expect(progreso.esNivelAprobado(NivelId.crear(1))).toBe(false);
  });

  it('[RN-05] marcar una palabra aprendida por primera vez suma 2 XP', () => {
    // Dado un perfil nuevo y una palabra sin registrar
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando marca la palabra como aprendida
    const resultado = progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Entonces gana los 2 XP de la primera vez
    expect(resultado.esPrimeraVezAprendida).toBe(true);
    expect(resultado.xpGanado).toBe(2);
    expect(progreso.xp).toBe(2);
  });

  it('[RN-05] volver a marcar la misma palabra como aprendida no vuelve a sumar XP', () => {
    // Dado un estudiante que ya aprendió la palabra p1
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Cuando la vuelve a marcar como aprendida
    const resultado = progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Entonces no gana XP otra vez
    expect(resultado.esPrimeraVezAprendida).toBe(false);
    expect(resultado.xpGanado).toBe(0);
    expect(progreso.xp).toBe(2);
  });

  it('[RN-05] marcar una palabra como repasar no otorga XP', () => {
    // Dado un perfil nuevo
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando marca una palabra para repasar
    const resultado = progreso.marcarPalabra('p1', 'repasar', hoy);

    // Entonces no se otorga XP
    expect(resultado.xpGanado).toBe(0);
    expect(progreso.xp).toBe(0);
  });
});

describe('[RN-08] Palabras aprendidas y repaso', () => {
  it('[RN-08] la misma palabra aprendida dos veces cuenta una sola vez', () => {
    // Dado un estudiante que marca dos veces la misma palabra como aprendida
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Cuando repite el marcado
    const resultado = progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Entonces sólo cuenta una palabra única aprendida
    expect(resultado.palabrasAprendidas).toBe(1);
    expect(progreso.palabrasAprendidas).toBe(1);
  });

  it('[RN-08] dos palabras distintas aprendidas cuentan dos', () => {
    // Dado un estudiante que aprende dos palabras diferentes
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando marca ambas como aprendidas
    progreso.marcarPalabra('p1', 'aprendido', hoy);
    progreso.marcarPalabra('p2', 'aprendido', hoy);

    // Entonces el contador suma las dos
    expect(progreso.palabrasAprendidas).toBe(2);
  });

  it('[RN-08] marcar repasar una palabra aprendida la saca del conteo sin revocar el XP', () => {
    // Dado un estudiante que aprendió la palabra p1 (y ya ganó sus 2 XP)
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Cuando la marca para repasar
    progreso.marcarPalabra('p1', 'repasar', hoy);

    // Entonces deja de contar como aprendida pero conserva los XP ganados
    expect(progreso.palabrasAprendidas).toBe(0);
    expect(progreso.xp).toBe(2);
  });

  it('[RN-08] palabrasEnEstado devuelve sólo las palabras del estado pedido', () => {
    // Dado un estudiante con una palabra aprendida y otra para repasar
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.marcarPalabra('p1', 'aprendido', hoy);
    progreso.marcarPalabra('p2', 'repasar', hoy);

    // Cuando se filtran las palabras de cada estado
    const aprendidas = progreso.palabrasEnEstado('aprendido');
    const paraRepasar = progreso.palabrasEnEstado('repasar');

    // Entonces cada lista contiene lo suyo
    expect(aprendidas).toEqual(['p1']);
    expect(paraRepasar).toEqual(['p2']);
  });

  it('[RN-08] el registro guarda estado, aciertos y fecha del último repaso', () => {
    // Dado un estudiante que acierta una palabra el 15 de marzo
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando la marca como aprendida
    progreso.marcarPalabra('p1', 'aprendido', hoy);

    // Entonces el registro queda completo
    expect(progreso.obtenerRegistro('p1')).toEqual({
      palabraId: 'p1',
      estado: 'aprendido',
      contadorAciertos: 1,
      fechaUltimoRepaso: '2026-03-15'
    });
  });

  it('[RN-08] obtenerRegistro devuelve undefined para una palabra nunca vista', () => {
    // Dado un perfil sin actividad
    const progreso = ProgresoEstudiante.nuevo('est-1');

    // Cuando se consulta una palabra desconocida
    const registro = progreso.obtenerRegistro('p-inexistente');

    // Entonces no hay registro
    expect(registro).toBeUndefined();
  });
});

describe('[RN-01] Acceso a los niveles del estudiante', () => {
  it('[RN-01] un nivel superior al actual no es accesible', () => {
    // Dado un estudiante en el nivel 1
    const progreso = ProgresoEstudiante.nuevo('est-1');

    // Cuando consulta el acceso al nivel 2 y al nivel 1
    // Entonces el primero está bloqueado y el segundo no
    expect(progreso.puedeAccederANivel(NivelId.crear(2))).toBe(false);
    expect(progreso.puedeAccederANivel(NivelId.crear(1))).toBe(true);
  });

  it('[RN-01] asegurarAccesoANivel lanza NivelBloqueadoError con un nivel superior', () => {
    // Dado un estudiante en el nivel 1
    const progreso = ProgresoEstudiante.nuevo('est-1');

    // Cuando se asegura el acceso al nivel 3
    // Entonces el dominio lo rechaza
    expect(() => progreso.asegurarAccesoANivel(NivelId.crear(3))).toThrow(NivelBloqueadoError);
  });

  it('[RN-01] no se puede rendir la evaluación de un nivel bloqueado', () => {
    // Dado un estudiante en el nivel 1 que intenta rendir el nivel 2
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando se aplica el resultado de ese nivel bloqueado
    // Entonces se rechaza sin otorgar XP ni registrar actividad
    expect(() => progreso.aplicarResultadoEvaluacion(NivelId.crear(2), true, hoy)).toThrow(
      NivelBloqueadoError
    );
    expect(progreso.xp).toBe(0);
    expect(progreso.rachaDias).toBe(0);
  });
});

describe('[RN-02] Recorrido del curso', () => {
  it('[RN-02] aprobar el nivel 1 desbloquea el nivel 2 y avanza el progreso', () => {
    // Dado un estudiante en el nivel 1
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando aprueba el nivel 1
    const resultado = progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Entonces avanza al nivel 2 y el progreso global refleja la aprobación
    expect(resultado.nivelActual.valor).toBe(2);
    expect(resultado.desbloqueado).toBe(2);
    expect(progreso.nivelActual.valor).toBe(2);
    expect(progreso.nivelesAprobados).toEqual([1]);
    expect(progreso.porcentajeGlobal.valor).toBe(10);
  });

  it('[RN-02] aprobar un nivel ya superado no mueve el nivel actual', () => {
    // Dado un estudiante en el nivel 3 con los niveles 1 y 2 aprobados
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);
    progreso.aplicarResultadoEvaluacion(NivelId.crear(2), true, hoy);

    // Cuando vuelve a aprobar el nivel 1
    const resultado = progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Entonces no desbloquea nada ni retrocede el nivel actual
    expect(resultado.desbloqueado).toBeNull();
    expect(resultado.nivelActual.valor).toBe(3);
    expect(progreso.nivelActual.valor).toBe(3);
    expect(progreso.cursoCompletado).toBe(false);
  });

  it('[RN-02] completar el nivel 10 marca el curso como completado', () => {
    // Dado un estudiante que aprueba los diez niveles en orden
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    let ultimo: { desbloqueado: number | null } | null = null;
    for (let nivel = 1; nivel <= NivelId.TOTAL_NIVELES; nivel += 1) {
      ultimo = progreso.aplicarResultadoEvaluacion(NivelId.crear(nivel), true, hoy);
    }

    // Cuando termina el último nivel
    // Entonces el curso queda completo, sin desbloqueo pendiente y con el 100% del progreso
    expect(ultimo?.desbloqueado).toBeNull();
    expect(progreso.cursoCompletado).toBe(true);
    expect(progreso.nivelActual.valor).toBe(10);
    expect(progreso.porcentajeGlobal.valor).toBe(100);
  });

  it('[RN-02] esNivelAprobado distingue los niveles aprobados de los pendientes', () => {
    // Dado un estudiante que aprobó el nivel 1
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);

    // Cuando se consultan el nivel aprobado y el siguiente
    // Entonces sólo el primero figura como aprobado
    expect(progreso.esNivelAprobado(NivelId.crear(1))).toBe(true);
    expect(progreso.esNivelAprobado(NivelId.crear(2))).toBe(false);
  });
});

describe('[RN-03] Progreso global del agregado', () => {
  it('[RN-03] el porcentaje global crece con cada nivel aprobado', () => {
    // Dado un estudiante que aprobó los niveles 1 y 2
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    progreso.aplicarResultadoEvaluacion(NivelId.crear(1), true, hoy);
    progreso.aplicarResultadoEvaluacion(NivelId.crear(2), true, hoy);

    // Cuando se consulta su progreso global
    // Entonces es 2 de 10 niveles
    expect(progreso.porcentajeGlobal.valor).toBe(20);
    expect(progreso.cursoCompletado).toBe(false);
  });
});

describe('[RN-04] Decisión de aprobación sobre la evaluación', () => {
  it('[RN-04] la puntuación de la evaluación se calcula como porcentaje de aciertos', () => {
    // Dado un examen de 10 preguntas con 8 aciertos y otro sin preguntas
    const ochoDeDiez = Puntuacion.desdeAciertos(8, 10);
    const sinPreguntas = Puntuacion.desdeAciertos(0, 0);

    // Cuando se calcula la puntuación
    // Entonces el resultado es un porcentaje sobre 100
    expect(ochoDeDiez.toJSON()).toBe(80);
    expect(sinPreguntas.toJSON()).toBe(0);
  });

  it('[RN-04] el agregado aplica la aprobación ya decidida sin recalcular el umbral', () => {
    // Dado un estudiante con una puntuación baja y la decisión de "no aprobado"
    // (el umbral único vive en PoliticaAprobacion, no en el nivel ni en el agregado)
    const progreso = ProgresoEstudiante.nuevo('est-1');
    const hoy = FechaDia.desdeTexto('2026-03-15');
    const puntuacion = Puntuacion.desdeAciertos(3, 10);
    const aprobado = false;

    // Cuando el agregado aplica ese resultado
    const resultado = progreso.aplicarResultadoEvaluacion(NivelId.crear(1), aprobado, hoy);

    // Entonces respeta la decisión: no aprueba el nivel y sólo suma la participación
    expect(puntuacion.toJSON()).toBe(30);
    expect(resultado.aprobacionNueva).toBe(false);
    expect(resultado.desbloqueado).toBeNull();
    expect(progreso.esNivelAprobado(NivelId.crear(1))).toBe(false);
    expect(progreso.xp).toBe(PoliticaXP.XP_POR_EVALUACION);
  });
});
