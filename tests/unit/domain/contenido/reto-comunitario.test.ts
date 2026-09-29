import { describe, it, expect } from 'vitest';
import {
  RetoComunitario,
  type DatosReto,
  type ModeracionReto,
  type PropuestaReto
} from '@domain/contenido';
import { ConflictoEstadoError, PermisoDenegadoError, ValidacionError } from '@domain/errores';
import type { RolUsuario } from '@domain/shared/tipos';

const AUTOR = 'estudiante-1';
const DOCENTE_A = 'docente-a';
const DOCENTE_B = 'docente-b';
const DOCENTE_C = 'docente-c';

/** [RF-007] Propuesta de prueba de una o un estudiante del nivel 7. */
function unaPropuesta(sobrescribir: Partial<PropuestaReto> = {}): PropuestaReto {
  const base: PropuestaReto = {
    id: 'reto-1',
    autorId: AUTOR,
    nombreAutor: 'Sumaq',
    textoQuechua: 'Pachamama kawsay.',
    traduccionSugerida: 'La Madre Tierra da vida.',
    pistaCultural: 'Saludo a la tierra antes de la siembra.',
    nivelSugerido: 7,
    fechaCreacion: '2026-03-15'
  };
  return { ...base, ...sobrescribir };
}

function contexto(rol: RolUsuario, nivelActual: number): { rol: RolUsuario; nivelActual: number } {
  return { rol, nivelActual };
}

/** Reto pendiente propuesto por el estudiante autor. */
function unReto(sobrescribir: Partial<PropuestaReto> = {}): RetoComunitario {
  return RetoComunitario.proponer(unaPropuesta(sobrescribir), contexto('estudiante', 7));
}

/** Reto persistido con bitácora y estado ya resueltos. */
function datosPersistidos(sobrescribir: Partial<DatosReto> = {}): DatosReto {
  const base: DatosReto = {
    id: 'reto-1',
    autorId: AUTOR,
    nombreAutor: 'Sumaq',
    textoQuechua: 'Pachamama kawsay.',
    traduccionSugerida: 'La Madre Tierra da vida.',
    pistaCultural: 'Saludo a la tierra antes de la siembra.',
    nivelSugerido: 7,
    estado: 'pendiente',
    fechaCreacion: '2026-03-15',
    moderaciones: []
  };
  return { ...base, ...sobrescribir };
}

/** Voto de docente listo para usar en la bitácora. */
function voto(docenteId: string, decision: ModeracionReto['decision'], fecha: string): ModeracionReto {
  return { docenteId, decision, fecha };
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

describe('[RF-007] Retos comunitarios', () => {
  describe('RN-13: quién puede proponer', () => {
    it('[RN-13] una o un estudiante de nivel 6 no puede proponer retos', () => {
      // Dado
      const propuesta = unaPropuesta();
      // Cuando
      const accion = () => RetoComunitario.proponer(propuesta, contexto('estudiante', 6));
      // Entonces
      expect(accion).toThrow(PermisoDenegadoError);
      expect(capturarError(accion)).toMatchObject({ codigo: 'PERMISO_DENEGADO' });
      expect(capturarError(accion).message).toMatch(/nivel 7/);
      expect(RetoComunitario.puedeProponer('estudiante', 6)).toBe(false);
    });

    it('[RN-13] una o un estudiante de nivel 7 sí puede proponer retos', () => {
      // Dado
      const propuesta = unaPropuesta();
      // Cuando
      const reto = RetoComunitario.proponer(propuesta, contexto('estudiante', 7));
      // Entonces
      expect(reto.estado).toBe('pendiente');
      expect(reto.estaPendiente).toBe(true);
      expect(reto.moderaciones).toEqual([]);
      expect(reto.aprobaciones).toBe(0);
      expect(reto.nivelSugerido.valor).toBe(7);
      expect(RetoComunitario.puedeProponer('estudiante', 7)).toBe(true);
      expect(RetoComunitario.puedeProponer('estudiante', 9)).toBe(true);
    });

    it('[RN-13] una o un docente no puede proponer retos comunitarios', () => {
      // Dado
      const propuesta = unaPropuesta();
      // Cuando
      const accion = () => RetoComunitario.proponer(propuesta, contexto('docente', 10));
      // Entonces
      expect(accion).toThrow(PermisoDenegadoError);
      expect(capturarError(accion).message).toBe(
        'Sólo las y los estudiantes pueden proponer retos comunitarios.'
      );
      expect(RetoComunitario.puedeProponer('docente', 10)).toBe(false);
    });

    it('[RN-13] fija el nivel mínimo de propuesta y las aprobaciones requeridas', () => {
      // Dado / Cuando
      const nivelMinimo = RetoComunitario.NIVEL_MINIMO_PROPONER;
      const aprobacionesRequeridas = RetoComunitario.APROBACIONES_REQUERIDAS;
      // Entonces
      expect(nivelMinimo).toBe(7);
      expect(aprobacionesRequeridas).toBe(2);
    });
  });

  describe('RN-13: validación de la propuesta', () => {
    it('[RN-13] rechaza una propuesta sin texto quechua', () => {
      // Dado
      const accion = () => unReto({ textoQuechua: '   ' });
      // Cuando / Entonces
      expect(accion).toThrow(ValidacionError);
      expect(capturarError(accion)).toMatchObject({ codigo: 'VALIDACION', campo: 'textoQuechua' });
    });

    it('[RN-13] rechaza una propuesta sin traducción sugerida', () => {
      // Dado
      const accion = () => unReto({ traduccionSugerida: '' });
      // Cuando / Entonces
      expect(accion).toThrow(ValidacionError);
      expect(capturarError(accion)).toMatchObject({
        codigo: 'VALIDACION',
        campo: 'traduccionSugerida'
      });
    });

    it('[RN-13] rechaza un nivel sugerido fuera del rango del curso', () => {
      // Dado
      const propuesta = unaPropuesta({ nivelSugerido: 11 });
      // Cuando
      const accion = () => RetoComunitario.proponer(propuesta, contexto('estudiante', 7));
      // Entonces
      expect(accion).toThrow(ValidacionError);
    });

    it('[RN-13] normaliza los espacios y deja vacía la pista cultural opcional', () => {
      // Dado
      const reto = unReto({ textoQuechua: '  Pachamama kawsay.  ', pistaCultural: undefined });
      // Cuando / Entonces
      expect(reto.textoQuechua).toBe('Pachamama kawsay.');
      expect(reto.pistaCultural).toBe('');
    });
  });

  describe('RN-13: doble moderación', () => {
    it('[RN-13] una sola aprobación mantiene el reto pendiente', () => {
      // Dado
      const reto = unReto();
      // Cuando
      reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      // Entonces
      expect(reto.estado).toBe('pendiente');
      expect(reto.estaPendiente).toBe(true);
      expect(reto.aprobaciones).toBe(1);
    });

    it('[RN-13] dos aprobaciones de docentes distintos publican el reto', () => {
      // Dado
      const reto = unReto();
      // Cuando
      reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      reto.moderar({ docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' });
      // Entonces
      expect(reto.estado).toBe('aprobado');
      expect(reto.estaPendiente).toBe(false);
      expect(reto.aprobaciones).toBe(2);
    });

    it('[RN-13] tres aprobaciones distintas mantienen el reto aprobado y registran los votos', () => {
      // Dado
      const reto = unReto();
      // Cuando
      reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      reto.moderar({ docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' });
      reto.moderar({ docenteId: DOCENTE_C, decision: 'aprobado', fecha: '2026-03-18' });
      // Entonces
      expect(reto.estado).toBe('aprobado');
      expect(reto.aprobaciones).toBe(3);
      expect(reto.moderaciones).toHaveLength(3);
    });

    it('[RN-13] un rechazo resuelve el reto de inmediato', () => {
      // Dado
      const reto = unReto();
      // Cuando
      reto.moderar({ docenteId: DOCENTE_A, decision: 'rechazado', fecha: '2026-03-16' });
      // Entonces
      expect(reto.estado).toBe('rechazado');
      expect(reto.estaPendiente).toBe(false);
      expect(reto.aprobaciones).toBe(0);
      expect(reto.moderaciones).toHaveLength(1);
    });

    it('[RN-13] registra cada moderación con docente, decisión y fecha en orden de llegada', () => {
      // Dado
      const reto = unReto();
      // Cuando
      reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      reto.moderar({ docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' });
      // Entonces
      expect(reto.moderaciones).toEqual([
        voto(DOCENTE_A, 'aprobado', '2026-03-16'),
        voto(DOCENTE_B, 'aprobado', '2026-03-17')
      ]);
    });

    it('[RN-13] aprobaciones cuenta docentes distintos y no votos repetidos', () => {
      // Dado una bitácora persistida con el mismo docente aprobando dos veces
      const reto = RetoComunitario.reconstruir(
        datosPersistidos({
          moderaciones: [
            voto(DOCENTE_A, 'aprobado', '2026-03-16'),
            voto(DOCENTE_A, 'aprobado', '2026-03-17')
          ]
        })
      );
      // Cuando
      const aprobaciones = reto.aprobaciones;
      // Entonces
      expect(aprobaciones).toBe(1);
      expect(reto.estaPendiente).toBe(true);
    });
  });

  describe('RN-13: conflictos y permisos de la moderación', () => {
    it('[RN-13] el mismo docente no puede votar dos veces', () => {
      // Dado
      const reto = unReto();
      reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      // Cuando
      const accion = () =>
        reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-17' });
      // Entonces
      expect(accion).toThrow(ConflictoEstadoError);
      expect(capturarError(accion)).toMatchObject({ codigo: 'CONFLICTO_ESTADO' });
      expect(reto.moderaciones).toHaveLength(1);
      expect(reto.yaVoto(DOCENTE_A)).toBe(true);
    });

    it('[RN-13] el autor no puede moderar su propio reto', () => {
      // Dado
      const reto = unReto();
      // Cuando
      const accion = () =>
        reto.moderar({ docenteId: AUTOR, decision: 'aprobado', fecha: '2026-03-16' });
      // Entonces
      expect(accion).toThrow(PermisoDenegadoError);
      expect(capturarError(accion)).toMatchObject({ codigo: 'PERMISO_DENEGADO' });
      expect(reto.moderaciones).toHaveLength(0);
      expect(reto.esAutor(AUTOR)).toBe(true);
      expect(reto.esAutor(DOCENTE_A)).toBe(false);
    });

    it('[RN-13] un reto ya rechazado no admite más moderaciones', () => {
      // Dado
      const reto = unReto();
      reto.moderar({ docenteId: DOCENTE_A, decision: 'rechazado', fecha: '2026-03-16' });
      // Cuando
      const accion = () =>
        reto.moderar({ docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' });
      // Entonces
      expect(accion).toThrow(ConflictoEstadoError);
      expect(capturarError(accion)).toMatchObject({ codigo: 'CONFLICTO_ESTADO' });
      expect(reto.moderaciones).toHaveLength(1);
    });

    it('[RN-13] un reto ya aprobado no admite un voto de rechazo', () => {
      // Dado
      const reto = unReto();
      reto.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      reto.moderar({ docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' });
      // Cuando
      const accion = () =>
        reto.moderar({ docenteId: DOCENTE_C, decision: 'rechazado', fecha: '2026-03-18' });
      // Entonces
      expect(accion).toThrow(ConflictoEstadoError);
      expect(reto.moderaciones).toHaveLength(2);
      expect(reto.yaVoto(DOCENTE_C)).toBe(false);
    });
  });

  describe('RN-13: persistencia del agregado', () => {
    it('[RN-13] toJSON devuelve la forma persistible del reto', () => {
      // Dado
      const reto = unReto();
      // Cuando
      const datos = reto.toJSON();
      // Entonces
      expect(datos).toEqual(datosPersistidos());
    });

    it('[RN-13] reconstruye el reto con su bitácora y su estado persistidos', () => {
      // Dado
      const original = unReto();
      original.moderar({ docenteId: DOCENTE_A, decision: 'aprobado', fecha: '2026-03-16' });
      original.moderar({ docenteId: DOCENTE_B, decision: 'aprobado', fecha: '2026-03-17' });
      // Cuando
      const reconstruido = RetoComunitario.reconstruir(original.toJSON());
      // Entonces
      expect(reconstruido.estado).toBe('aprobado');
      expect(reconstruido.aprobaciones).toBe(2);
      expect(reconstruido.moderaciones).toEqual(original.moderaciones);
      expect(reconstruido.fechaCreacion.toJSON()).toBe('2026-03-15');
      expect(reconstruido.nivelSugerido.valor).toBe(7);
    });

    it('[RN-13] conserva la bitácora al reconstruir un reto rechazado', () => {
      // Dado
      const datos = datosPersistidos({
        estado: 'rechazado',
        pistaCultural: undefined,
        moderaciones: [voto(DOCENTE_A, 'rechazado', '2026-03-16')]
      });
      // Cuando
      const reto = RetoComunitario.reconstruir(datos);
      // Entonces
      expect(reto.estado).toBe('rechazado');
      expect(reto.estaPendiente).toBe(false);
      expect(reto.pistaCultural).toBe('');
      expect(reto.moderaciones).toEqual([voto(DOCENTE_A, 'rechazado', '2026-03-16')]);
    });
  });
});
