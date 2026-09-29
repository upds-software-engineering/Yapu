import { describe, it, expect } from 'vitest';
import { NivelId, Puntuacion, Porcentaje, FechaDia, TerminoQuechua } from '@domain/value-objects';
import { ErrorDominio, ValidacionError, mensajeAmigable } from '@domain/errores';

/**
 * Pruebas de los objetos de valor del dominio (núcleo hexagonal).
 *
 * Cada prueba fija UN comportamiento observable y lleva el tag de la regla de negocio que cubre.
 * Las fechas se construyen siempre en hora LOCAL: `FechaDia` es un día calendario sin zona.
 */

describe('[RN-01] NivelId', () => {
  it('[RN-01] crear acepta los extremos del rango 1..10', () => {
    // Dado / Cuando
    const primero = NivelId.crear(1);
    const ultimo = NivelId.crear(10);

    // Entonces
    expect(primero.valor).toBe(1);
    expect(ultimo.valor).toBe(10);
  });

  it('[RN-01] crear lanza ValidacionError fuera del rango o con decimales', () => {
    // Dado / Cuando / Entonces
    expect(() => NivelId.crear(0)).toThrow(ValidacionError);
    expect(() => NivelId.crear(11)).toThrow(ValidacionError);
    expect(() => NivelId.crear(1.5)).toThrow(ValidacionError);
  });

  it('[RN-01] desdeTexto interpreta un parámetro de ruta numérico', () => {
    // Dado / Cuando
    const nivel = NivelId.desdeTexto('7');

    // Entonces
    expect(nivel.valor).toBe(7);
  });

  it('[RN-01] desdeTexto lanza ValidacionError si el texto no es un nivel', () => {
    // Dado / Cuando / Entonces
    expect(() => NivelId.desdeTexto('abc')).toThrow(ValidacionError);
  });

  it('[RN-02] siguiente se detiene en el último nivel: nunca existe el nivel 11', () => {
    // Dado
    const ultimo = NivelId.crear(10);
    const intermedio = NivelId.crear(4);

    // Cuando
    const siguienteDelUltimo = ultimo.siguiente();
    const siguienteIntermedio = intermedio.siguiente();

    // Entonces
    expect(siguienteDelUltimo.valor).toBe(10);
    expect(siguienteDelUltimo.igualA(ultimo)).toBe(true);
    expect(siguienteIntermedio.valor).toBe(5);
  });

  it('[RN-02] anterior se detiene en el primer nivel', () => {
    // Dado
    const primero = NivelId.crear(1);
    const intermedio = NivelId.crear(4);

    // Cuando
    const anteriorDelPrimero = primero.anterior();
    const anteriorIntermedio = intermedio.anterior();

    // Entonces
    expect(anteriorDelPrimero.valor).toBe(1);
    expect(anteriorIntermedio.valor).toBe(3);
  });

  it('[RN-01] esAlcanzableDesde admite el nivel ya aprobado y rechaza el superior', () => {
    // Dado
    const nivelActual = NivelId.crear(5);

    // Cuando / Entonces
    expect(NivelId.crear(3).esAlcanzableDesde(nivelActual)).toBe(true);
    expect(NivelId.crear(5).esAlcanzableDesde(nivelActual)).toBe(true);
    expect(NivelId.crear(6).esAlcanzableDesde(nivelActual)).toBe(false);
  });

  it('[RN-01] compararCon ordena dos niveles por su valor', () => {
    // Dado
    const tres = NivelId.crear(3);
    const cinco = NivelId.crear(5);

    // Cuando / Entonces
    expect(tres.compararCon(cinco)).toBeLessThan(0);
    expect(cinco.compararCon(tres)).toBeGreaterThan(0);
    expect(cinco.compararCon(NivelId.crear(5))).toBe(0);
  });

  it('[RN-01] igualA compara por valor y no por identidad de referencia', () => {
    // Dado
    const uno = NivelId.crear(1);
    const otroUno = NivelId.desdeTexto('1');
    const dos = NivelId.crear(2);

    // Cuando / Entonces
    expect(uno.igualA(otroUno)).toBe(true);
    expect(uno.igualA(dos)).toBe(false);
  });

  it('[RN-01] toString y toJSON exponen el nivel de forma serializable', () => {
    // Dado
    const nivel = NivelId.crear(7);

    // Cuando / Entonces
    expect(nivel.toString()).toBe('7');
    expect(nivel.toJSON()).toBe(7);
    expect(JSON.stringify({ nivel })).toBe('{"nivel":7}');
  });
});

describe('[RN-04] Puntuacion', () => {
  it('[RN-04] desdeAciertos calcula el porcentaje entero de aciertos', () => {
    // Dado / Cuando / Entonces
    expect(Puntuacion.desdeAciertos(7, 10).valor).toBe(70);
    expect(Puntuacion.desdeAciertos(6, 10).valor).toBe(60);
    expect(Puntuacion.desdeAciertos(10, 10).valor).toBe(100);
  });

  it('[RN-04] desdeAciertos devuelve cero cuando no hay preguntas', () => {
    // Dado / Cuando
    const puntuacion = Puntuacion.desdeAciertos(0, 0);

    // Entonces
    expect(puntuacion.valor).toBe(0);
  });

  it('[RN-04] desdeAciertos redondea al entero más cercano', () => {
    // Dado / Cuando
    const puntuacion = Puntuacion.desdeAciertos(2, 3);

    // Entonces
    expect(puntuacion.valor).toBe(67);
  });

  it('[RN-04] crear rechaza valores fuera de 0..100', () => {
    // Dado / Cuando / Entonces
    expect(() => Puntuacion.crear(101)).toThrow(ValidacionError);
    expect(() => Puntuacion.crear(-1)).toThrow(ValidacionError);
  });

  it('[RN-04] crear redondea los decimales dentro de rango', () => {
    // Dado / Cuando
    const puntuacion = Puntuacion.crear(70.6);

    // Entonces
    expect(puntuacion.valor).toBe(71);
  });

  it('[RN-04] esPerfecta sólo con la puntuación máxima', () => {
    // Dado / Cuando / Entonces
    expect(Puntuacion.crear(100).esPerfecta()).toBe(true);
    expect(Puntuacion.crear(99).esPerfecta()).toBe(false);
    expect(Puntuacion.cero().esPerfecta()).toBe(false);
  });

  it('[RN-04] toJSON expone la puntuación ya redondeada', () => {
    // Dado
    const puntuacion = Puntuacion.crear(70.4);

    // Cuando / Entonces
    expect(puntuacion.toJSON()).toBe(70);
    expect(JSON.stringify({ puntuacion })).toBe('{"puntuacion":70}');
  });
});

describe('[RN-03] Porcentaje', () => {
  it('[RN-03] desdeNivelesAprobados reparte el curso en 10 niveles', () => {
    // Dado / Cuando / Entonces
    expect(Porcentaje.desdeNivelesAprobados(0).valor).toBe(0);
    expect(Porcentaje.desdeNivelesAprobados(9).valor).toBe(90);
    expect(Porcentaje.desdeNivelesAprobados(10).valor).toBe(100);
  });

  it('[RN-03] esCompleto sólo cuando se aprobaron los 10 niveles', () => {
    // Dado / Cuando / Entonces
    expect(Porcentaje.desdeNivelesAprobados(10).esCompleto()).toBe(true);
    expect(Porcentaje.desdeNivelesAprobados(9).esCompleto()).toBe(false);
  });

  it('[RN-03] desdeNivelesAprobados recorta las entradas fuera de rango', () => {
    // Dado / Cuando / Entonces
    expect(Porcentaje.desdeNivelesAprobados(11).valor).toBe(100);
    expect(Porcentaje.desdeNivelesAprobados(-3).valor).toBe(0);
  });

  it('[RN-03] desdeParte devuelve cero si el total no es positivo', () => {
    // Dado / Cuando
    const porcentaje = Porcentaje.desdeParte(1, 0);

    // Entonces
    expect(porcentaje.valor).toBe(0);
  });

  it('[RN-03] desdeParte calcula la fracción porcentual', () => {
    // Dado / Cuando / Entonces
    expect(Porcentaje.desdeParte(1, 4).valor).toBe(25);
    expect(Porcentaje.desdeParte(1, 3).valor).toBe(33);
  });

  it('[RN-03] crear rechaza valores fuera de 0..100', () => {
    // Dado / Cuando / Entonces
    expect(() => Porcentaje.crear(150)).toThrow(ValidacionError);
    expect(() => Porcentaje.crear(-1)).toThrow(ValidacionError);
  });

  it('[RN-03] toString formatea el porcentaje para la interfaz', () => {
    // Dado / Cuando / Entonces
    expect(Porcentaje.crear(100).toString()).toBe('100%');
    expect(Porcentaje.crear(0).toString()).toBe('0%');
  });
});

describe('[RN-06] FechaDia', () => {
  it('[RN-06] desdeFecha usa la fecha LOCAL, no la UTC', () => {
    // Dado: 15 de marzo de 2026 a las 23:30 en hora local (un instante que en UTC puede ser otro día)
    const fecha = new Date(2026, 2, 15, 23, 30, 0);

    // Cuando
    const dia = FechaDia.desdeFecha(fecha);

    // Entonces
    expect(dia.toJSON()).toBe('2026-03-15');
    expect(dia.anio).toBe(2026);
    expect(dia.mes).toBe(3);
    expect(dia.dia).toBe(15);
  });

  it('[RN-06] desdeTexto interpreta el formato YYYY-MM-DD', () => {
    // Dado / Cuando
    const dia = FechaDia.desdeTexto('2026-03-15');

    // Entonces
    expect(dia.toJSON()).toBe('2026-03-15');
  });

  it('[RN-06] desdeTexto rechaza formatos no normalizados', () => {
    // Dado / Cuando / Entonces
    expect(() => FechaDia.desdeTexto('15/03/2026')).toThrow(ValidacionError);
    expect(() => FechaDia.desdeTexto('2026-13-01')).toThrow(ValidacionError);
  });

  it('[RN-06] desdeIso acepta tanto una fecha simple como un ISO con hora', () => {
    // Dado / Cuando
    const soloFecha = FechaDia.desdeIso('2026-03-15');
    const conHora = FechaDia.desdeIso('2026-03-15T23:30:00');

    // Entonces
    expect(soloFecha.toJSON()).toBe('2026-03-15');
    expect(conHora.toJSON()).toBe('2026-03-15');
  });

  it('[RN-06] diasHasta devuelve 0 para el mismo día', () => {
    // Dado
    const dia = FechaDia.desdeTexto('2026-03-15');
    const mismoDia = FechaDia.desdeTexto('2026-03-15');

    // Cuando
    const dias = dia.diasHasta(mismoDia);

    // Entonces
    expect(dias).toBe(0);
  });

  it('[RN-06] diasHasta cuenta los días calendario transcurridos', () => {
    // Dado
    const base = FechaDia.desdeTexto('2026-03-15');

    // Cuando / Entonces
    expect(base.diasHasta(FechaDia.desdeTexto('2026-03-16'))).toBe(1);
    expect(base.diasHasta(FechaDia.desdeTexto('2026-03-18'))).toBe(3);
    expect(base.diasHasta(FechaDia.desdeTexto('2026-03-14'))).toBe(-1);
  });

  it('[RN-06] diasHasta es coherente al cruzar el fin de mes', () => {
    // Dado
    const finDeFebrero = FechaDia.desdeTexto('2026-02-28');

    // Cuando
    const dias = finDeFebrero.diasHasta(FechaDia.desdeTexto('2026-03-01'));

    // Entonces
    expect(dias).toBe(1);
  });

  it('[RN-06] igualA compara la clave YYYY-MM-DD', () => {
    // Dado
    const dia = FechaDia.desdeTexto('2026-03-15');

    // Cuando / Entonces
    expect(dia.igualA(FechaDia.desdeTexto('2026-03-15'))).toBe(true);
    expect(dia.igualA(FechaDia.desdeTexto('2026-03-16'))).toBe(false);
  });

  it('[RN-06] esPosteriorA ordena los días con la semántica natural', () => {
    // Dado
    const anterior = FechaDia.desdeTexto('2026-03-14');
    const posterior = FechaDia.desdeTexto('2026-03-15');

    // Cuando / Entonces
    // Corregido: `esPosteriorA(otra)` responde «¿este día es posterior a `otra`?».
    expect(posterior.esPosteriorA(anterior)).toBe(true);
    expect(anterior.esPosteriorA(posterior)).toBe(false);
    expect(posterior.esPosteriorA(FechaDia.desdeTexto('2026-03-15'))).toBe(false);
  });
});

describe('[RN-09][RN-11] TerminoQuechua', () => {
  it('[RN-09] crear recorta los espacios sobrantes', () => {
    // Dado / Cuando
    const termino = TerminoQuechua.crear('  Inti  ');

    // Entonces
    expect(termino.valor).toBe('Inti');
    expect(termino.longitud).toBe(4);
  });

  it('[RN-09] crear rechaza términos vacíos o en blanco', () => {
    // Dado / Cuando / Entonces
    expect(() => TerminoQuechua.crear('')).toThrow(ValidacionError);
    expect(() => TerminoQuechua.crear('   ')).toThrow(ValidacionError);
  });

  it('[RN-09] igualA ignora mayúsculas y unifica apóstrofos tipográficos', () => {
    // Dado
    const termino = TerminoQuechua.crear("K'anchay");

    // Cuando / Entonces
    expect(termino.igualA(TerminoQuechua.crear('k’anchay'))).toBe(true);
    expect(termino.igualA(TerminoQuechua.crear('K’ANCHAY'))).toBe(true);
    expect(termino.igualA(TerminoQuechua.crear('kanchay'))).toBe(false);
  });

  it('[RN-09] coincideConTexto ignora mayúsculas y apóstrofos tipográficos', () => {
    // Dado
    const termino = TerminoQuechua.crear("k'anchay");

    // Cuando / Entonces
    expect(termino.coincideConTexto("K’ANCHAY")).toBe(true);
    expect(termino.coincideConTexto('  K’anchay  ')).toBe(true);
    expect(termino.coincideConTexto('inti')).toBe(false);
  });

  it('[RN-09] la normalización NO iguala la ñ con la n', () => {
    // Dado
    const termino = TerminoQuechua.crear('ñawi');

    // Cuando / Entonces
    expect(termino.coincideConTexto('nawi')).toBe(false);
    expect(termino.igualA(TerminoQuechua.crear('nawi'))).toBe(false);
    expect(termino.coincideConTexto('ÑAWI')).toBe(true);
  });

  it('[RN-11] estaContenidoEn encuentra el término dentro de la oración', () => {
    // Dado
    const termino = TerminoQuechua.crear('Inti');

    // Cuando / Entonces
    expect(termino.estaContenidoEn('Inti llaqta')).toBe(true);
  });

  it('[RN-11] estaContenidoEn ignora mayúsculas y acepta apóstrofos tipográficos', () => {
    // Dado
    const termino = TerminoQuechua.crear("k'anchay");

    // Cuando / Entonces
    expect(termino.estaContenidoEn('K’anchay llaqtapi')).toBe(true);
  });

  it('[RN-11] estaContenidoEn admite sufijos quechuas al inicio de palabra', () => {
    // Dado
    const termino = TerminoQuechua.crear('yachay');

    // Cuando / Entonces
    expect(termino.estaContenidoEn('yachaywasipi')).toBe(true);
    expect(termino.estaContenidoEn('kayachay')).toBe(false);
  });

  it('[RN-11] estaContenidoEn devuelve false si el término no aparece', () => {
    // Dado
    const termino = TerminoQuechua.crear('killa');

    // Cuando / Entonces
    expect(termino.estaContenidoEn('Inti llaqta')).toBe(false);
  });

  it('[RN-11] estaContenidoEn NO confunde palabras con apóstrofo interno', () => {
    // Dado: en runasimi `k’anchay` (brillar) y `anchay` (así) son palabras distintas.
    const termino = TerminoQuechua.crear('anchay');

    // Cuando
    const contenido = termino.estaContenidoEn("K'anchay");

    // Entonces
    // Corregido: el apóstrofo se trata como carácter de palabra, así que `k'anchay` no contiene
    // el término independiente `anchay`.
    expect(contenido).toBe(false);
  });

  it('[RN-09] toJSON y toString devuelven el término ya normalizado en espacios', () => {
    // Dado
    const termino = TerminoQuechua.crear('  Inti   llaqta  ');

    // Cuando / Entonces
    expect(termino.toJSON()).toBe('Inti llaqta');
    expect(termino.toString()).toBe('Inti llaqta');
    expect(termino.longitud).toBe(11);
  });
});

describe('Errores de dominio', () => {
  it('[RN-09] ValidacionError expone el código VALIDACION y su campo', () => {
    // Dado / Cuando
    const error = new ValidacionError('x', 'campo');

    // Entonces
    expect(error.codigo).toBe('VALIDACION');
    expect(error.campo).toBe('campo');
    expect(error.message).toBe('x');
  });

  it('[RN-09] ValidacionError es un ErrorDominio y un Error de JavaScript', () => {
    // Dado / Cuando
    const error = new ValidacionError('x');

    // Entonces
    expect(error).toBeInstanceOf(ValidacionError);
    expect(error).toBeInstanceOf(ErrorDominio);
    expect(error).toBeInstanceOf(Error);
  });

  it('[RN-09] mensajeAmigable oculta los errores técnicos tras un texto genérico', () => {
    // Dado / Cuando
    const mensaje = mensajeAmigable(new Error('boom'));

    // Entonces
    expect(mensaje).toBe('Ocurrió un problema inesperado. Vuelve a intentarlo.');
  });

  it('[RN-09] mensajeAmigable propaga el mensaje de los errores de dominio', () => {
    // Dado / Cuando
    const mensaje = mensajeAmigable(new ValidacionError('dato inválido'));

    // Entonces
    expect(mensaje).toBe('dato inválido');
  });
});
