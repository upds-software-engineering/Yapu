import { describe, it, expect } from 'vitest';
import {
  BOM_UTF8,
  escaparCampoCsv,
  neutralizarFormula,
  serializarCsv,
  type ColumnaCsv
} from '@domain/contenido';

const COLUMNAS: readonly ColumnaCsv[] = [
  { clave: 'id', titulo: 'Identificador' },
  { clave: 'termino', titulo: 'Término en quechua' },
  { clave: 'nivel', titulo: 'Nivel' },
  { clave: 'aprobada', titulo: 'Aprobada' }
];

describe('[RS-004] Exportación CSV', () => {
  describe('neutralizarFormula', () => {
    it('[RN-14] neutraliza un valor que empieza por igual', () => {
      // Dado
      const valor = '=1+1';
      // Cuando
      const neutralizado = neutralizarFormula(valor);
      // Entonces
      expect(neutralizado).toBe("'=1+1");
      expect(neutralizado.startsWith("'")).toBe(true);
    });

    it('[RN-14] neutraliza los valores que empiezan por más, menos y arroba', () => {
      // Dado / Cuando / Entonces
      expect(neutralizarFormula('+34')).toBe("'+34");
      expect(neutralizarFormula('-5')).toBe("'-5");
      expect(neutralizarFormula('@cmd')).toBe("'@cmd");
    });

    it('[RN-14] neutraliza los valores que empiezan por tabulación o retorno de carro', () => {
      // Dado / Cuando / Entonces
      expect(neutralizarFormula('\tvalor')).toBe("'\tvalor");
      expect(neutralizarFormula('\rvalor')).toBe("'\rvalor");
    });

    it('[RN-14] deja intacto el texto que no inicia una fórmula', () => {
      // Dado / Cuando / Entonces
      expect(neutralizarFormula('achachay')).toBe('achachay');
      expect(neutralizarFormula('Yachaywasipi yachakuni.')).toBe('Yachaywasipi yachakuni.');
      expect(neutralizarFormula('')).toBe('');
    });
  });

  describe('escaparCampoCsv', () => {
    it('[RN-14] entrecomilla el campo que contiene una coma', () => {
      // Dado / Cuando / Entonces
      expect(escaparCampoCsv('Quito, Ecuador')).toBe('"Quito, Ecuador"');
    });

    it('[RN-14] duplica las comillas internas y entrecomilla el campo', () => {
      // Dado / Cuando / Entonces
      expect(escaparCampoCsv('dijo "hola"')).toBe('"dijo ""hola"""');
    });

    it('[RN-14] entrecomilla el campo que contiene un salto de línea', () => {
      // Dado / Cuando / Entonces
      expect(escaparCampoCsv('linea1\nlinea2')).toBe('"linea1\nlinea2"');
      expect(escaparCampoCsv('linea1\r\nlinea2')).toBe('"linea1\r\nlinea2"');
    });

    it('[RN-14] no entrecomilla el campo que no lo necesita', () => {
      // Dado / Cuando / Entonces
      expect(escaparCampoCsv('achachay')).toBe('achachay');
      expect(escaparCampoCsv("'=1+1")).toBe("'=1+1");
    });
  });

  describe('serializarCsv', () => {
    it('[RN-14] empieza por el BOM UTF-8 y termina la última fila con CRLF', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [
        { id: 'p-1', termino: 'yachay', nivel: 1, aprobada: true },
        { id: 'p-2', termino: 'wasi', nivel: 1, aprobada: false }
      ];
      // Cuando
      const csv = serializarCsv(filas, COLUMNAS);
      // Entonces
      expect(csv.startsWith(BOM_UTF8)).toBe(true);
      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv.endsWith('\r\n')).toBe(true);
      expect(csv).toBe(
        `${BOM_UTF8}Identificador,Término en quechua,Nivel,Aprobada\r\n` +
          'p-1,yachay,1,true\r\n' +
          'p-2,wasi,1,false\r\n'
      );
    });

    it('[RN-14] usa CRLF como único separador de línea', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [{ id: 'p-1', termino: 'yachay' }];
      // Cuando
      const csv = serializarCsv(filas, COLUMNAS);
      // Entonces
      expect(csv.split('\r\n')).toEqual([
        `${BOM_UTF8}Identificador,Término en quechua,Nivel,Aprobada`,
        'p-1,yachay,,',
        ''
      ]);
      expect(/[^\r]\n/.test(csv)).toBe(false);
    });

    it('[RN-14] respeta el orden de las columnas y vacía los campos ausentes', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [{ nivel: 3, id: 'p-3' }];
      // Cuando
      const csv = serializarCsv(filas, COLUMNAS);
      // Entonces
      expect(csv).toBe(
        `${BOM_UTF8}Identificador,Término en quechua,Nivel,Aprobada\r\np-3,,3,\r\n`
      );
    });

    it('[RN-14] exporta null y undefined como celdas vacías', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [
        { id: 'p-1', termino: null, nivel: undefined, aprobada: true }
      ];
      // Cuando
      const csv = serializarCsv(filas, COLUMNAS);
      // Entonces
      expect(csv).toBe(`${BOM_UTF8}Identificador,Término en quechua,Nivel,Aprobada\r\np-1,,,true\r\n`);
    });

    it('[RN-14] neutraliza la fórmula antes de escapar el campo', () => {
      // Dado un valor peligroso que además contiene una coma
      const filas: readonly Record<string, unknown>[] = [{ valor: '@cmd, x' }];
      const columnas: readonly ColumnaCsv[] = [{ clave: 'valor', titulo: 'Valor' }];
      // Cuando
      const csv = serializarCsv(filas, columnas);
      // Entonces
      expect(csv).toBe(`${BOM_UTF8}Valor\r\n"'@cmd, x"\r\n`);
    });

    it('[RN-14] neutraliza una fórmula sencilla y la entrecomilla sólo si lo requiere', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [
        { formula: '=1+1', apariencia: '+34' },
        { formula: '-5', apariencia: '@cmd' }
      ];
      const columnas: readonly ColumnaCsv[] = [
        { clave: 'formula', titulo: 'Fórmula' },
        { clave: 'apariencia', titulo: 'Apariencia' }
      ];
      // Cuando
      const csv = serializarCsv(filas, columnas);
      // Entonces
      expect(csv).toBe(`${BOM_UTF8}Fórmula,Apariencia\r\n'=1+1,'+34\r\n'-5,'@cmd\r\n`);
    });

    it('[RN-14] entrecomilla los campos con comillas y con salto de línea', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [
        { id: 'p-1', termino: 'dijo "hola"', nivel: 1, aprobada: true },
        { id: 'p-2', termino: 'linea1\nlinea2', nivel: 2, aprobada: false }
      ];
      // Cuando
      const csv = serializarCsv(filas, COLUMNAS);
      // Entonces
      expect(csv).toBe(
        `${BOM_UTF8}Identificador,Término en quechua,Nivel,Aprobada\r\n` +
          'p-1,"dijo ""hola""",1,true\r\n' +
          'p-2,"linea1\nlinea2",2,false\r\n'
      );
    });

    it('[RN-14] exporta sólo la cabecera cuando el corpus está vacío', () => {
      // Dado
      const filas: readonly Record<string, unknown>[] = [];
      // Cuando
      const csv = serializarCsv(filas, COLUMNAS);
      // Entonces
      expect(csv).toBe(`${BOM_UTF8}Identificador,Término en quechua,Nivel,Aprobada\r\n`);
    });

    it('[RN-14] neutraliza también los títulos de las columnas', () => {
      // Dado
      const columnas: readonly ColumnaCsv[] = [{ clave: 'id', titulo: '=cabecera' }];
      // Cuando
      const csv = serializarCsv([{ id: 'p-1' }], columnas);
      // Entonces
      expect(csv).toBe(`${BOM_UTF8}'=cabecera\r\np-1\r\n`);
    });
  });
});
