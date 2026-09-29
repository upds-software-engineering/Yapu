import { describe, expect, it } from 'vitest';
import { ValidacionError } from '@domain/errores';
import { Pregunta, type DatosPregunta } from '@domain/evaluacion';
import type { TipoPregunta } from '@domain/shared/tipos';

/**
 * RN-09: invariantes de una pregunta del motor determinista.
 * Un solo comportamiento por `it`, con la estructura Dado / Cuando / Entonces.
 */

function datosPregunta(parcial: Partial<DatosPregunta> = {}): DatosPregunta {
  return {
    id: 'pregunta-1',
    tipo: 'traduccion_quechua',
    enunciado: '¿Cuál es el significado de "inti"?',
    opcionCorrecta: 'sol',
    opciones: ['sol', 'fuego', 'agua', 'cerro'],
    explicacion: 'Inti es el sol en runasimi.',
    nivelId: 1,
    palabraId: 'p-inti',
    ...parcial
  };
}

describe('[RF-005] Generar evaluación', () => {
  describe('Pregunta (RN-09)', () => {
    it('[RN-09] crea una pregunta válida con exactamente 4 opciones', () => {
      // Dado un conjunto válido de datos de pregunta
      const datos = datosPregunta();

      // Cuando se crea la pregunta
      const pregunta = Pregunta.crear(datos);

      // Entonces conserva sus datos y expone el nivel como objeto de valor
      expect(pregunta.opciones).toHaveLength(4);
      expect(pregunta.nivelId.valor).toBe(1);
      expect(pregunta.tipo).toBe('traduccion_quechua');
      expect(pregunta.palabraId).toBe('p-inti');
    });

    it('[RN-09] rechaza una pregunta con menos de 4 opciones', () => {
      // Dado un conjunto con sólo tres opciones
      const datos = datosPregunta({ opciones: ['sol', 'fuego', 'agua'] });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza con ValidacionError
      expect(() => Pregunta.crear(datos)).toThrow(ValidacionError);
    });

    it('[RN-09] rechaza una pregunta con más de 4 opciones', () => {
      // Dado un conjunto con cinco opciones
      const datos = datosPregunta({ opciones: ['sol', 'fuego', 'agua', 'cerro', 'luna'] });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza con ValidacionError
      expect(() => Pregunta.crear(datos)).toThrow(ValidacionError);
    });

    it('[RN-09] rechaza opciones repetidas ignorando mayúsculas y espacios', () => {
      // Dado un conjunto donde el distractor "fuego" aparece dos veces con otra capitalización
      const datos = datosPregunta({ opciones: ['sol', 'fuego', ' FUEGO ', 'agua'] });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza por opciones no únicas
      expect(() => Pregunta.crear(datos)).toThrow(/únicas/);
    });

    it('[RN-09] rechaza una pregunta cuya opción correcta no está entre las opciones', () => {
      // Dado un conjunto donde ninguna opción equivale a la correcta
      const datos = datosPregunta({ opciones: ['fuego', 'agua', 'cerro', 'luna'] });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza
      expect(() => Pregunta.crear(datos)).toThrow(/opción correcta debe estar/);
    });

    it('[RN-09] rechaza una pregunta con dos opciones que equivalen a la correcta', () => {
      // Dado un conjunto con "sol" y "Sol" a la vez
      const datos = datosPregunta({ opciones: ['sol', 'Sol', 'agua', 'cerro'] });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza: sólo una opción puede ser la correcta
      expect(() => Pregunta.crear(datos)).toThrow(/Sólo una opción/);
    });

    it('[RN-09] rechaza una pregunta con enunciado vacío', () => {
      // Dado un enunciado en blanco
      const datos = datosPregunta({ enunciado: '   ' });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza
      expect(() => Pregunta.crear(datos)).toThrow(/enunciado/);
    });

    it('[RN-09] rechaza una pregunta con opción correcta vacía', () => {
      // Dado un conjunto sin texto en la opción correcta
      const datos = datosPregunta({ opcionCorrecta: '' });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza
      expect(() => Pregunta.crear(datos)).toThrow(/opción correcta/);
    });

    it('[RN-09] rechaza una pregunta con una opción vacía', () => {
      // Dado un conjunto con una alternativa en blanco
      const datos = datosPregunta({ opciones: ['sol', 'fuego', '   ', 'cerro'] });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza
      expect(() => Pregunta.crear(datos)).toThrow(/vacía/);
    });

    it('[RN-09] rechaza un nivel fuera del rango 1..10', () => {
      // Dado un nivel inexistente
      const datos = datosPregunta({ nivelId: 11 });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza
      expect(() => Pregunta.crear(datos)).toThrow(ValidacionError);
    });

    it('[RN-09] rechaza un tipo de pregunta fuera del catálogo del motor', () => {
      // Dado un tipo que no pertenece a TIPOS_PREGUNTA
      const datos = datosPregunta({ tipo: 'ordenar_oracion' as unknown as TipoPregunta });

      // Cuando se intenta crear la pregunta
      // Entonces se rechaza con ValidacionError
      expect(() => Pregunta.crear(datos)).toThrow(/tipo de pregunta/);
    });

    it('[RN-09] esCorrecta ignora mayúsculas, espacios y apóstrofos tipográficos', () => {
      // Dado una pregunta cuyo término correcto lleva apóstrofo ASCII
      const datos = datosPregunta({
        opcionCorrecta: "k'uchi",
        opciones: ["k'uchi", 'nina', 'yaku', 'urqu']
      });

      // Cuando se compara con la respuesta escrita con apóstrofo tipográfico
      const pregunta = Pregunta.crear(datos);

      // Entonces la comparación normalizada las considera iguales
      expect(pregunta.esCorrecta('  K’UCHI  ')).toBe(true);
      expect(pregunta.esCorrecta('nina')).toBe(false);
    });

    it('[RN-09] toJSON devuelve una representación reconstruible', () => {
      // Dado una pregunta creada
      const datos = datosPregunta();
      const pregunta = Pregunta.crear(datos);

      // Cuando se serializa
      const serializada = pregunta.toJSON();

      // Entonces los datos coinciden con los de alta
      expect(serializada).toEqual(datos);
    });
  });
});
