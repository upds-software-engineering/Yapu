import { describe, it, expect } from 'vitest';
import { OracionBase, type DatosOracion } from '@domain/contenido';
import { ValidacionError } from '@domain/errores';
import { Palabra, type DatosPalabra } from '@domain/aprendizaje/Palabra';
import { NivelId } from '@domain/value-objects';

/** [RF-006] Palabra clave de prueba: por defecto `yachay`, del nivel 1. */
function unaPalabra(sobrescribir: Partial<DatosPalabra> = {}): Palabra {
  const base: DatosPalabra = {
    id: 'palabra-1',
    nivelId: 1,
    termino: 'yachay',
    traduccion: 'saber',
    pronunciacion: 'ya-chay',
    categoria: 'verbo',
    contextoCultural: 'Verbo del saber comunitario.',
    ejemploUso: 'Yachaywasipi yachakuni.'
  };
  return Palabra.crear({ ...base, ...sobrescribir });
}

/** [RF-006] Oración base de prueba, del nivel 1 y con la palabra clave `yachay` contenida. */
function datosDeOracion(sobrescribir: Partial<DatosOracion> = {}): DatosOracion {
  const base: DatosOracion = {
    id: 'oracion-1',
    nivelId: 1,
    textoQuechua: 'Yachaywasipi yachakuni.',
    traduccionEspanol: 'Aprendo en la escuela.',
    palabraClaveId: 'palabra-1',
    categoria: 'verbo',
    contextoCultural: 'La escuela como espacio de aprendizaje comunitario.',
    autorId: 'docente-1',
    estado: 'pendiente',
    fechaCreacion: '2026-03-15'
  };
  return { ...base, ...sobrescribir };
}

/** Ejecuta una acción que debe fallar y devuelve el error lanzado, ya tipado como Error. */
function capturarError(ejecutar: () => unknown): Error {
  try {
    ejecutar();
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
  throw new Error('Se esperaba un error de dominio y no se lanzó ninguno.');
}

describe('[RF-006] Oraciones base del docente', () => {
  describe('RN-11: la oración debe contener la palabra clave', () => {
    it('[RN-11] rechaza la oración que no contiene la palabra clave', () => {
      // Dado
      const palabraClave = unaPalabra({ termino: 'yachay' });
      const datos = datosDeOracion({ textoQuechua: 'Wasipi tiyakuni.' });
      // Cuando
      const accion = () => OracionBase.crear(datos, palabraClave);
      // Entonces
      expect(accion).toThrow(ValidacionError);
      expect(capturarError(accion)).toMatchObject({ codigo: 'VALIDACION', campo: 'textoQuechua' });
      expect(capturarError(accion).message).toMatch(/RN-11/);
    });

    it('[RN-11] acepta la palabra clave con sufijo quechua al inicio de palabra', () => {
      // Dado
      const palabraClave = unaPalabra({ termino: 'yachay' });
      const datos = datosDeOracion({ textoQuechua: 'Yachaywasipi yachakuni.' });
      // Cuando
      const oracion = OracionBase.crear(datos, palabraClave);
      // Entonces
      expect(oracion.contienePalabraClave(palabraClave)).toBe(true);
      expect(oracion.textoQuechua).toBe('Yachaywasipi yachakuni.');
    });

    it('[RN-11] no acepta una palabra que sólo termina con la clave', () => {
      // Dado: "kayachay" contiene las letras de "yachay" pero no la palabra al inicio
      const palabraClave = unaPalabra({ termino: 'yachay' });
      const datos = datosDeOracion({ textoQuechua: 'Kayachay wasipi tiyakuni.' });
      // Cuando
      const oracion = OracionBase.reconstruir(datos);
      // Entonces
      expect(oracion.contienePalabraClave(palabraClave)).toBe(false);
      expect(() => OracionBase.crear(datos, palabraClave)).toThrow(ValidacionError);
    });

    it('[RN-11] contienePalabraClave ignora mayúsculas y minúsculas', () => {
      // Dado
      const palabraClave = unaPalabra({ termino: 'yachay' });
      const datos = datosDeOracion({ textoQuechua: 'YACHAYWASIPI YACHAKUNI.' });
      // Cuando
      const oracion = OracionBase.crear(datos, palabraClave);
      // Entonces
      expect(oracion.contienePalabraClave(palabraClave)).toBe(true);
    });

    it('[RN-11] contienePalabraClave tolera los apóstrofos tipográficos', () => {
      // Dado
      const palabraClave = unaPalabra({ nivelId: 2, termino: "p'unchaw", traduccion: 'día' });
      const datos = datosDeOracion({ nivelId: 2, textoQuechua: 'P’unchawpi rimani.' });
      // Cuando
      const oracion = OracionBase.crear(datos, palabraClave);
      // Entonces
      expect(oracion.contienePalabraClave(palabraClave)).toBe(true);
    });

    it('[RN-11] contienePalabraClave es falso cuando no hay palabra clave', () => {
      // Dado
      const oracion = OracionBase.crear(datosDeOracion(), unaPalabra());
      // Cuando
      const resultado = oracion.contienePalabraClave(undefined);
      // Entonces
      expect(resultado).toBe(false);
    });
  });

  describe('RN-12: la palabra clave es obligatoria y del mismo nivel', () => {
    it('[RN-12] exige que la palabra clave sea del mismo nivel', () => {
      // Dado: la oración es del nivel 1 y la palabra clave del nivel 2
      const palabraClave = unaPalabra({ nivelId: 2 });
      const datos = datosDeOracion({ nivelId: 1 });
      // Cuando
      const accion = () => OracionBase.crear(datos, palabraClave);
      // Entonces
      expect(accion).toThrow(ValidacionError);
      expect(capturarError(accion).message).toMatch(/RN-12/);
      expect(capturarError(accion)).toMatchObject({ campo: 'palabraClaveId' });
    });

    it('[RN-12] exige una palabra clave: sin ella no se crea la oración', () => {
      // Dado
      const datos = datosDeOracion();
      // Cuando
      const accion = () => OracionBase.crear(datos, undefined as unknown as Palabra);
      // Entonces
      expect(accion).toThrow(ValidacionError);
      expect(capturarError(accion)).toMatchObject({ campo: 'palabraClaveId' });
    });

    it('[RN-12] rechaza la oración sin texto quechua', () => {
      // Dado
      const datos = datosDeOracion({ textoQuechua: '   ' });
      // Cuando
      const accion = () => OracionBase.crear(datos, unaPalabra());
      // Entonces
      expect(capturarError(accion)).toMatchObject({ codigo: 'VALIDACION', campo: 'textoQuechua' });
    });

    it('[RN-12] rechaza la oración sin traducción al español', () => {
      // Dado
      const datos = datosDeOracion({ traduccionEspanol: '' });
      // Cuando
      const accion = () => OracionBase.crear(datos, unaPalabra());
      // Entonces
      expect(capturarError(accion)).toMatchObject({
        codigo: 'VALIDACION',
        campo: 'traduccionEspanol'
      });
    });
  });

  describe('creación, reconstrucción y proyección', () => {
    it('[RF-006] crea la oración normalizando espacios y con la palabra clave recibida', () => {
      // Dado
      const palabraClave = unaPalabra();
      const datos = datosDeOracion({ textoQuechua: '  Yachaywasipi yachakuni.  ' });
      // Cuando
      const oracion = OracionBase.crear(datos, palabraClave);
      // Entonces
      expect(oracion.textoQuechua).toBe('Yachaywasipi yachakuni.');
      expect(oracion.palabraClaveId).toBe('palabra-1');
      expect(oracion.estado).toBe('pendiente');
      expect(oracion.fechaCreacion.toJSON()).toBe('2026-03-15');
    });

    it('[RF-006] reconstruye la oración desde su forma persistida sin revalidar la clave', () => {
      // Dado un registro ya moderado cuya oración no contiene la clave
      const datos = datosDeOracion({
        textoQuechua: 'Wasipi tiyakuni.',
        contextoCultural: undefined,
        estado: 'aprobado'
      });
      // Cuando
      const oracion = OracionBase.reconstruir(datos);
      // Entonces
      expect(oracion.estado).toBe('aprobado');
      expect(oracion.contextoCultural).toBe('');
      expect(oracion.toJSON()).toEqual({
        ...datos,
        textoQuechua: 'Wasipi tiyakuni.',
        contextoCultural: '',
        estado: 'aprobado'
      });
    });

    it('[RF-006] deja vacío el contexto cultural cuando no se aporta', () => {
      // Dado
      const datos = datosDeOracion({ contextoCultural: undefined });
      // Cuando
      const oracion = OracionBase.crear(datos, unaPalabra());
      // Entonces
      expect(oracion.contextoCultural).toBe('');
    });

    it('[RF-006] genera el enunciado cloze con el hueco en la palabra clave', () => {
      // Dado
      const palabraClave = unaPalabra({ termino: 'yachay' });
      const oracion = OracionBase.crear(datosDeOracion(), palabraClave);
      // Cuando
      const enunciado = oracion.textoConHueco(palabraClave);
      // Entonces
      expect(enunciado).toBe('_______wasipi yachakuni.');
    });

    it('[RF-006] expone nivel, autoría y estado de moderación', () => {
      // Dado
      const oracion = OracionBase.crear(datosDeOracion({ estado: 'aprobado' }), unaPalabra());
      // Cuando
      const esDelNivelUno = oracion.esDelNivel(NivelId.crear(1));
      const esDelNivelDos = oracion.esDelNivel(NivelId.crear(2));
      // Entonces
      expect(esDelNivelUno).toBe(true);
      expect(esDelNivelDos).toBe(false);
      expect(oracion.esAprobada()).toBe(true);
      expect(oracion.autorId).toBe('docente-1');
      expect(oracion.categoria).toBe('verbo');
    });
  });
});
