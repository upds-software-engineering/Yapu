import { describe, it, expect } from 'vitest';
import {
  normalizarTexto,
  escaparRegex,
  contienePalabraClave,
  mismosTerminos,
  contieneTermino
} from '@domain/shared/texto';

/**
 * Pruebas de la normalización de texto quechua/español del dominio.
 *
 * Regla de oro: la comparación ignora mayúsculas, espacios sobrantes y variantes de apóstrofo,
 * pero NUNCA confunde la `ñ` con la `n` (la `ñ` es letra propia del runasimi).
 */

describe('[RN-09][RN-11] Normalización de texto', () => {
  it('[RN-09] mismosTerminos ignora espacios y mayúsculas', () => {
    // Dado / Cuando
    const iguales = mismosTerminos(' Casa ', 'CASA');

    // Entonces
    expect(iguales).toBe(true);
  });

  it('[RN-09] mismosTerminos distingue términos distintos', () => {
    // Dado / Cuando
    const iguales = mismosTerminos('allqu', 'allqo');

    // Entonces
    expect(iguales).toBe(false);
  });

  it('[RN-09] mismosTerminos unifica los apóstrofos tipográficos', () => {
    // Dado / Cuando
    const iguales = mismosTerminos('k’anchay', "K'ANCHAY");

    // Entonces
    expect(iguales).toBe(true);
  });

  it('[RN-09] mismosTerminos NO iguala la ñ con la n', () => {
    // Dado / Cuando
    const iguales = mismosTerminos('ñawi', 'nawi');

    // Entonces
    expect(iguales).toBe(false);
  });

  it('[RN-09] contieneTermino encuentra la opción normalizada en la colección', () => {
    // Dado
    const opciones = ['Inti', 'Killa'];

    // Cuando / Entonces
    expect(contieneTermino(opciones, 'inti')).toBe(true);
    expect(contieneTermino(opciones, '  KILLA ')).toBe(true);
  });

  it('[RN-09] contieneTermino devuelve false si la opción no está en la colección', () => {
    // Dado
    const opciones = ['Inti', 'Killa'];

    // Cuando / Entonces
    expect(contieneTermino(opciones, 'yaku')).toBe(false);
  });

  it('[RN-10] contieneTermino devuelve false con una colección vacía', () => {
    // Dado
    const opciones: string[] = [];

    // Cuando / Entonces
    expect(contieneTermino(opciones, 'inti')).toBe(false);
  });

  it('[RN-11] contienePalabraClave admite sufijos quechuas al inicio de palabra', () => {
    // Dado / Cuando
    const contiene = contienePalabraClave('Munakuywan', 'munakuy');

    // Entonces
    expect(contiene).toBe(true);
  });

  it('[RN-11] contienePalabraClave tolera apóstrofos tipográficos en la oración', () => {
    // Dado / Cuando
    const contiene = contienePalabraClave('Munakuy’wan', 'munakuy');

    // Entonces
    expect(contiene).toBe(true);
  });

  it('[RN-11] contienePalabraClave cruza apóstrofos tipográficos y ASCII en ambos sentidos', () => {
    // Dado
    const texto = "K'anchay llaqtapi";
    const terminoTipografico = 'k’anchay';

    // Cuando / Entonces
    expect(contienePalabraClave(texto, terminoTipografico)).toBe(true);
    expect(contienePalabraClave('K’anchay llaqtapi', "k'anchay")).toBe(true);
  });

  it('[RN-11] contienePalabraClave ignora mayúsculas', () => {
    // Dado / Cuando
    const contiene = contienePalabraClave('INTI LLAQTA', 'inti');

    // Entonces
    expect(contiene).toBe(true);
  });

  it('[RN-11] contienePalabraClave acepta la palabra delimitada por signos de puntuación', () => {
    // Dado / Cuando
    const contiene = contienePalabraClave('inti, llaqta', 'inti');

    // Entonces
    expect(contiene).toBe(true);
  });

  it('[RN-11] contienePalabraClave devuelve false si la palabra no está', () => {
    // Dado / Cuando
    const contiene = contienePalabraClave('Inti llaqta', 'KILLA');

    // Entonces
    expect(contiene).toBe(false);
  });

  it('[RN-11] contienePalabraClave no confunde un sufijo con un prefijo', () => {
    // Dado / Cuando
    const conSufijo = contienePalabraClave('Yachaywasipi', 'yachay');
    const conPrefijo = contienePalabraClave('Kayachay', 'yachay');

    // Entonces
    expect(conSufijo).toBe(true);
    expect(conPrefijo).toBe(false);
  });

  it('[RN-11] contienePalabraClave devuelve false con texto o término vacíos', () => {
    // Dado / Cuando / Entonces
    expect(contienePalabraClave('', 'inti')).toBe(false);
    expect(contienePalabraClave('inti llaqta', '')).toBe(false);
  });

  it('[RN-09] escaparRegex escapa los metacaracteres de la expresión regular', () => {
    // Dado / Cuando
    const escapado = escaparRegex('a.b*c');

    // Entonces
    expect(escapado).toBe('a\\.b\\*c');
  });

  it('[RN-09] escaparRegex permite buscar el texto de forma literal, sin comodines', () => {
    // Dado
    const patron = new RegExp(escaparRegex('a.b*c'));

    // Cuando
    const coincideLiteral = patron.test('a.b*c');
    const coincideComodin = patron.test('aXbYc');

    // Entonces
    expect(coincideLiteral).toBe(true);
    expect(coincideComodin).toBe(false);
  });

  it('[RN-09] escaparRegex escapa también paréntesis, corchetes, llaves y barras', () => {
    // Dado / Cuando
    const escapado = escaparRegex('(x)[y]{z}|^$+?\\');

    // Entonces
    expect(() => new RegExp(escapado)).not.toThrow();
    expect(new RegExp(escapado).test('(x)[y]{z}|^$+?\\')).toBe(true);
    expect(new RegExp(escapado).test('x')).toBe(false);
  });

  it('[RN-09] normalizarTexto recorta, colapsa espacios y pasa a minúsculas', () => {
    // Dado / Cuando
    const normalizado = normalizarTexto('  CASA   LLAQTA  ');

    // Entonces
    expect(normalizado).toBe('casa llaqta');
  });

  it('[RN-09] normalizarTexto unifica los apóstrofos tipográficos al ASCII', () => {
    // Dado / Cuando / Entonces
    expect(normalizarTexto('K’ANCHAY')).toBe("k'anchay");
    expect(normalizarTexto('K‘anchay')).toBe("k'anchay");
    expect(normalizarTexto('K`anchay')).toBe("k'anchay");
  });

  it('[RN-09] normalizarTexto conserva la ñ y unifica las formas Unicode NFC', () => {
    // Dado: 'n' + tilde combinante (U+0303) es la misma letra que 'ñ' precompuesta
    const descompuesto = 'n\u0303awi';

    // Cuando / Entonces
    expect(normalizarTexto('ÑAWI')).toBe('ñawi');
    expect(normalizarTexto(descompuesto)).toBe('ñawi');
    expect(normalizarTexto(descompuesto)).toBe(normalizarTexto('ñawi'));
  });
});
