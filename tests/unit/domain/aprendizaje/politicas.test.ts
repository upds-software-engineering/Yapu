import { describe, it, expect } from 'vitest';
import {
  PoliticaDesbloqueo,
  PoliticaRacha,
  PoliticaXP,
  type EstadoDesbloqueo
} from '@domain/aprendizaje';
import { NivelBloqueadoError } from '@domain/errores';
import { FechaDia, NivelId } from '@domain/value-objects';
import { unRelojFijo } from '../../../helpers';

/** Estado de desbloqueo de apoyo: los niveles 1..nivelActual ya están aprobados. */
function estadoConNivel(nivelActual: number, nivelesAprobados: readonly number[]): EstadoDesbloqueo {
  return {
    nivelActual: NivelId.crear(nivelActual),
    cursoCompletado: false,
    nivelesAprobados
  };
}

describe('[RN-05] XP por evaluación y por palabra aprendida', () => {
  it('[RN-05] rendir una evaluación sin aprobar otorga sólo los 10 XP de participación', () => {
    // Dado que la evaluación no representa una aprobación nueva
    const aprobacionNueva = false;

    // Cuando la política calcula los XP de esa evaluación
    const xp = PoliticaXP.porEvaluacion(aprobacionNueva);

    // Entonces sólo se suman los 10 XP por rendirla
    expect(xp).toBe(10);
    expect(xp).toBe(PoliticaXP.XP_POR_EVALUACION);
  });

  it('[RN-05] aprobar un nivel por primera vez otorga 10 XP más 100 XP de nivel', () => {
    // Dado que la aprobación del nivel es nueva
    const aprobacionNueva = true;

    // Cuando la política calcula los XP de esa evaluación
    const xp = PoliticaXP.porEvaluacion(aprobacionNueva);

    // Entonces se suman los 10 de la evaluación y los 100 del nivel
    expect(xp).toBe(110);
    expect(xp).toBe(PoliticaXP.XP_POR_EVALUACION + PoliticaXP.XP_POR_APROBAR_NIVEL);
  });

  it('[RN-05] los 100 XP del nivel no se repiten en una segunda aprobación', () => {
    // Dado que el nivel ya estaba aprobado (la política recibe aprobacionNueva = false)
    const segundaAprobacion = false;

    // Cuando se calculan los XP de esa segunda aprobación
    const xp = PoliticaXP.porEvaluacion(segundaAprobacion);

    // Entonces no se vuelve a pagar el bono de nivel
    expect(xp).toBe(PoliticaXP.XP_POR_EVALUACION);
    expect(xp).not.toBe(PoliticaXP.porEvaluacion(true));
  });

  it('[RN-05] la primera vez que una palabra pasa a aprendido otorga 2 XP', () => {
    // Dado que es la primera vez que la palabra queda en estado aprendido
    const esPrimeraVezAprendida = true;

    // Cuando la política calcula los XP de ese marcado
    const xp = PoliticaXP.porPalabraAprendida(esPrimeraVezAprendida);

    // Entonces se suman los 2 XP de palabra aprendida
    expect(xp).toBe(2);
    expect(xp).toBe(PoliticaXP.XP_POR_PALABRA_APRENDIDA);
  });

  it('[RN-05] volver a marcar una palabra ya aprendida no otorga XP', () => {
    // Dado que la palabra ya estaba aprendida
    const esPrimeraVezAprendida = false;

    // Cuando la política calcula los XP de ese marcado repetido
    const xp = PoliticaXP.porPalabraAprendida(esPrimeraVezAprendida);

    // Entonces no se otorga XP
    expect(xp).toBe(0);
  });
});

describe('[RN-06] Racha por días calendario', () => {
  it('[RN-06] un perfil sin actividad previa arranca la racha en 1', () => {
    // Dado un perfil que nunca registró actividad
    const ultimaActividad = null;
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando se calcula la racha del primer día de práctica
    const racha = PoliticaRacha.calcular(0, ultimaActividad, hoy);

    // Entonces la racha arranca en 1
    expect(racha).toBe(1);
  });

  it('[RN-06] el mismo día no incrementa la racha', () => {
    // Dado que la última actividad fue hoy mismo
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando se vuelve a practicar el mismo día
    const racha = PoliticaRacha.calcular(4, hoy, hoy);

    // Entonces la racha se mantiene igual
    expect(racha).toBe(4);
  });

  it('[RN-06] el día siguiente incrementa la racha en uno', () => {
    // Dado que la última actividad fue el día anterior
    const ayer = FechaDia.desdeTexto('2026-03-15');
    const hoy = FechaDia.desdeTexto('2026-03-16');

    // Cuando se practica hoy
    const racha = PoliticaRacha.calcular(4, ayer, hoy);

    // Entonces la racha crece en uno
    expect(racha).toBe(5);
  });

  it('[RN-06] un hueco de dos días reinicia la racha a 1', () => {
    // Dado que la última actividad fue hace dos días
    const anteayer = FechaDia.desdeTexto('2026-03-15');
    const hoy = FechaDia.desdeTexto('2026-03-17');

    // Cuando se vuelve a practicar
    const racha = PoliticaRacha.calcular(7, anteayer, hoy);

    // Entonces la racha se reinicia
    expect(racha).toBe(1);
  });

  it('[RN-06] un hueco de una semana reinicia la racha a 1', () => {
    // Dado que la última actividad fue hace una semana
    const haceUnaSemana = FechaDia.desdeTexto('2026-03-08');
    const hoy = FechaDia.desdeTexto('2026-03-15');

    // Cuando se vuelve a practicar
    const racha = PoliticaRacha.calcular(30, haceUnaSemana, hoy);

    // Entonces la racha se reinicia aunque el valor anterior fuera alto
    expect(racha).toBe(1);
  });

  it('[RN-06] practicar antes y después de la medianoche cuenta como dos días', () => {
    // Dado un reloj fijo a las 23:50 del día 15 (hora local)
    const reloj = unRelojFijo();
    reloj.establecer(new Date(2026, 2, 15, 23, 50, 0));
    const antesDeMedianoche = reloj.diaActual;

    // Cuando el estudiante vuelve a practicar 20 minutos después (00:10 del día 16)
    reloj.avanzarHoras(1 / 3);
    const despuesDeMedianoche = reloj.diaActual;

    // Entonces la racha cuenta dos días calendario, no 20 minutos
    expect(despuesDeMedianoche.diasHasta(antesDeMedianoche)).toBe(-1);
    expect(PoliticaRacha.calcular(1, antesDeMedianoche, despuesDeMedianoche)).toBe(2);
  });
});

describe('[RN-01] Acceso a los niveles del curso', () => {
  it('[RN-01] el nivel actual del estudiante es accesible', () => {
    // Dado un estudiante en el nivel 3
    const nivelActual = NivelId.crear(3);

    // Cuando se consulta el acceso al propio nivel actual
    const accesible = PoliticaDesbloqueo.puedeAcceder(nivelActual, NivelId.crear(3));

    // Entonces el acceso está permitido
    expect(accesible).toBe(true);
  });

  it('[RN-01] los niveles ya superados siguen siendo accesibles', () => {
    // Dado un estudiante en el nivel 5
    const nivelActual = NivelId.crear(5);

    // Cuando se consulta el acceso a un nivel anterior
    const accesible = PoliticaDesbloqueo.puedeAcceder(nivelActual, NivelId.crear(1));

    // Entonces el acceso está permitido
    expect(accesible).toBe(true);
  });

  it('[RN-01] un nivel superior al actual está bloqueado', () => {
    // Dado un estudiante en el nivel 2
    const nivelActual = NivelId.crear(2);

    // Cuando se consulta el acceso al nivel 4
    const accesible = PoliticaDesbloqueo.puedeAcceder(nivelActual, NivelId.crear(4));

    // Entonces el acceso está denegado
    expect(accesible).toBe(false);
  });

  it('[RN-01] asegurarAcceso lanza NivelBloqueadoError con el nivel solicitado y el actual', () => {
    // Dado un estudiante en el nivel 2 que intenta entrar al nivel 5
    const nivelActual = NivelId.crear(2);
    const solicitado = NivelId.crear(5);
    let capturado: unknown;

    // Cuando se asegura el acceso al nivel bloqueado
    try {
      PoliticaDesbloqueo.asegurarAcceso(nivelActual, solicitado);
    } catch (error) {
      capturado = error;
    }

    // Entonces el error de dominio informa ambos niveles
    expect(capturado).toBeInstanceOf(NivelBloqueadoError);
    if (!(capturado instanceof NivelBloqueadoError)) {
      throw new Error('Se esperaba un NivelBloqueadoError al acceder a un nivel superior.');
    }
    expect(capturado.codigo).toBe('NIVEL_BLOQUEADO');
    expect(capturado.nivelSolicitado).toBe(5);
    expect(capturado.nivelActual).toBe(2);
  });
});

describe('[RN-02] Aprobación de nivel y desbloqueo', () => {
  it('[RN-02] aprobar el nivel actual desbloquea exactamente el siguiente', () => {
    // Dado un estudiante en el nivel 3 con los niveles 1 y 2 aprobados
    const estado = estadoConNivel(3, [1, 2]);

    // Cuando aprueba el nivel 3
    const resultado = PoliticaDesbloqueo.aplicarAprobacion(estado, NivelId.crear(3));

    // Entonces avanza al 4, se registra como aprobación nueva y se desbloquea el 4
    expect(resultado.aprobacionNueva).toBe(true);
    expect(resultado.nivelActual.valor).toBe(4);
    expect(resultado.desbloqueado).toBe(4);
    expect(resultado.cursoCompletado).toBe(false);
  });

  it('[RN-02] aprobar el último nivel completa el curso sin desbloquear nada', () => {
    // Dado un estudiante en el nivel 10 con los nueve niveles previos aprobados
    const estado = estadoConNivel(10, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Cuando aprueba el nivel 10
    const resultado = PoliticaDesbloqueo.aplicarAprobacion(estado, NivelId.crear(10));

    // Entonces el curso queda completo, se queda en el 10 y no se desbloquea nada más
    expect(resultado.aprobacionNueva).toBe(true);
    expect(resultado.cursoCompletado).toBe(true);
    expect(resultado.nivelActual.valor).toBe(10);
    expect(resultado.desbloqueado).toBeNull();
  });

  it('[RN-02] aprobar un nivel ya superado no es una aprobación nueva', () => {
    // Dado un estudiante en el nivel 5 que vuelve a rendir el nivel 3 (ya aprobado)
    const estado = estadoConNivel(5, [1, 2, 3, 4]);

    // Cuando aplica esa aprobación repetida
    const resultado = PoliticaDesbloqueo.aplicarAprobacion(estado, NivelId.crear(3));

    // Entonces el nivel actual no cambia y la aprobación no es nueva (sin +100 XP)
    expect(resultado.aprobacionNueva).toBe(false);
    expect(resultado.nivelActual.valor).toBe(5);
    expect(resultado.desbloqueado).toBeNull();
  });

  it('[RN-02] nunca se salta de nivel: aprobar un nivel superior está prohibido', () => {
    // Dado un estudiante en el nivel 1
    const estado = estadoConNivel(1, []);

    // Cuando se intenta aplicar la aprobación del nivel 7
    // Entonces RN-01 lo impide en lugar de saltar de 1 a 7
    expect(() => PoliticaDesbloqueo.aplicarAprobacion(estado, NivelId.crear(7))).toThrow(
      NivelBloqueadoError
    );
  });
});

describe('[RN-03] Progreso global del curso', () => {
  it('[RN-03] sin niveles aprobados el progreso global es 0%', () => {
    // Dado un estudiante que no aprobó ningún nivel
    const nivelesAprobados: number[] = [];

    // Cuando se calcula el progreso global
    const progreso = PoliticaDesbloqueo.progresoGlobal(nivelesAprobados);

    // Entonces el avance es 0%
    expect(progreso.valor).toBe(0);
  });

  it('[RN-03] nueve niveles aprobados equivalen al 90%', () => {
    // Dado un estudiante con nueve niveles aprobados
    const nivelesAprobados = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Cuando se calcula el progreso global
    const progreso = PoliticaDesbloqueo.progresoGlobal(nivelesAprobados);

    // Entonces el avance es 90%
    expect(progreso.valor).toBe(90);
  });

  it('[RN-03] los diez niveles aprobados equivalen al 100%', () => {
    // Dado un estudiante que completó el curso
    const nivelesAprobados = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Cuando se calcula el progreso global
    const progreso = PoliticaDesbloqueo.progresoGlobal(nivelesAprobados);

    // Entonces el avance es 100% y no existe ningún nivel adicional
    expect(progreso.valor).toBe(100);
    expect(nivelesAprobados).toHaveLength(NivelId.TOTAL_NIVELES);
  });

  it('[RN-03] los niveles duplicados no inflan el progreso', () => {
    // Dado un estado con el nivel 1 y el 2 repetidos
    const nivelesAprobados = [1, 1, 2];

    // Cuando se calcula el progreso global
    const progreso = PoliticaDesbloqueo.progresoGlobal(nivelesAprobados);

    // Entonces sólo cuentan los niveles únicos (2 de 10)
    expect(progreso.valor).toBe(20);
  });

  it('[RN-03] los niveles fuera del rango 1..10 no cuentan', () => {
    // Dado un estado con niveles inválidos además del nivel 1
    const nivelesAprobados = [0, 1, 11];

    // Cuando se calcula el progreso global
    const progreso = PoliticaDesbloqueo.progresoGlobal(nivelesAprobados);

    // Entonces sólo cuenta el nivel 1
    expect(progreso.valor).toBe(10);
  });
});
