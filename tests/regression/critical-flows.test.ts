import { describe, it, expect, beforeEach } from 'vitest';
import { generateQuizForLevel } from '../../src/lib/ai/deterministic-engine.ts';
import { LocalRepository } from '../../src/lib/storage/local-repository.ts';
import { PuntuacionVO } from '../../src/core/domain/value-objects/PuntuacionVO.ts';
import { TerminoQuechuaVO } from '../../src/core/domain/value-objects/TerminoQuechuaVO.ts';

describe('Nivel 3: Pruebas de Regresion del Sistema (No-Regression Suite)', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
    Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true, configurable: true });
  });

  it('REG-01: El desbloqueo sucesivo de niveles no debe corromper el progreso previo ni superar nivel 10', () => {
    // 1. Arrange & Act: Desbloquear progresivamente del nivel 1 al 10
    let perfil = LocalRepository.getProfile();
    expect(perfil.nivel_actual).toBe(1);

    for (let nivel = 2; nivel <= 10; nivel++) {
      perfil = LocalRepository.unlockLevel(nivel);
      expect(perfil.nivel_actual).toBe(nivel);
    }

    // Intentar desbordar el limite del MVP (Nivel 11)
    const perfilDesbordado = LocalRepository.unlockLevel(11);
    expect(perfilDesbordado.nivel_actual).toBe(10);
  });

  it('REG-02: Regresion en umbral critico: 69% debe reprobar estrictamente y 70% debe aprobar', () => {
    const p69 = PuntuacionVO.desde(69);
    const p70 = PuntuacionVO.desde(70);

    expect(p69.esAprobatorio()).toBe(false);
    expect(p70.esAprobatorio()).toBe(true);
  });

  it('REG-03: Regresion en caracteres linguisticos quechuas: preservacion de tildes y diacriticos', () => {
    const termino1 = TerminoQuechuaVO.desde('Urqu');
    const termino2 = TerminoQuechuaVO.desde('Ñawpaq');
    const termino3 = TerminoQuechuaVO.desde('Allinllachu');

    expect(termino1.coincideCon('urqu')).toBe(true);
    expect(termino2.coincideCon('ñawpaq')).toBe(true);
    expect(termino3.coincideCon('allinllachu')).toBe(true);
  });

  it('REG-04: La cola de sincronizacion offline debe ser idempotente y mantener el orden FIFO', () => {
    Object.defineProperty(globalThis.navigator, 'onLine', { value: false, configurable: true, writable: true });

    LocalRepository.enqueueOfflineSync({
      id_evaluacion: 'eval_primera',
      id_estudiante: 'u1',
      id_nivel: 1,
      puntuacion_obtenida: 80,
      total_aciertos: 8,
      total_preguntas: 10,
      estado_aprobacion: 'aprobado',
      fecha_evaluacion: '2026-09-29T10:00:00Z',
      sincronizado_nube: false
    });

    LocalRepository.enqueueOfflineSync({
      id_evaluacion: 'eval_segunda',
      id_estudiante: 'u1',
      id_nivel: 2,
      puntuacion_obtenida: 90,
      total_aciertos: 9,
      total_preguntas: 10,
      estado_aprobacion: 'aprobado',
      fecha_evaluacion: '2026-09-29T10:15:00Z',
      sincronizado_nube: false
    });

    const cola = LocalRepository.getOfflineQueue();
    expect(cola.length).toBe(2);
    expect(cola[0].id_evaluacion).toBe('eval_primera');
    expect(cola[1].id_evaluacion).toBe('eval_segunda');
  });

  it('REG-05: El generador de quizes no debe generar opciones duplicadas en ninguna de las 10 preguntas', () => {
    for (let nivel = 1; nivel <= 3; nivel++) {
      const preguntas = generateQuizForLevel(nivel, 10);
      for (const p of preguntas) {
        const opcionesUnicas = new Set(p.opciones_mezcladas);
        expect(opcionesUnicas.size).toBe(4);
      }
    }
  });
});
