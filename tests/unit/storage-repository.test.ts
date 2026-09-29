import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRepository } from '../../src/lib/storage/local-repository.ts';
import type { Evaluacion } from '../../src/types/domain.ts';

// Doble de prueba (Mock / Stub de localStorage en entorno de test)
class LocalStorageMock {
  private store: Record<string, string> = {};
  public calls: { method: string; key?: string }[] = [];

  getItem(key: string): string | null {
    this.calls.push({ method: 'getItem', key });
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.calls.push({ method: 'setItem', key });
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    this.calls.push({ method: 'removeItem', key });
    delete this.store[key];
  }

  clear(): void {
    this.calls.push({ method: 'clear' });
    this.store = {};
  }
}

describe('Nivel 1: Pruebas con Mocks y Stubs - LocalRepository (IndexedDB / LocalStorage)', () => {
  let mockStorage: LocalStorageMock;

  beforeEach(() => {
    mockStorage = new LocalStorageMock();
    Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true, configurable: true });
  });

  it('debe devolver el perfil por defecto y guardarlo si el almacenamiento esta vacio', () => {
    // 1. Arrange & Act
    const perfil = LocalRepository.getProfile();

    // 2. Assert
    expect(perfil.id_estudiante).toBe('estudiante_demo');
    expect(perfil.nivel_actual).toBe(1);
    const setCalls = mockStorage.calls.filter((c) => c.method === 'setItem');
    expect(setCalls.length).toBeGreaterThan(0);
  });

  it('debe desbloquear el nivel siguiente y sumar 100 puntos de experiencia', () => {
    // 1. Arrange
    const perfilInicial = LocalRepository.getProfile();
    const xpInicial = perfilInicial.puntos_experiencia || 0;

    // 2. Act
    const perfilActualizado = LocalRepository.unlockLevel(2);

    // 3. Assert
    expect(perfilActualizado.nivel_actual).toBe(2);
    expect(perfilActualizado.puntos_experiencia).toBe(xpInicial + 100);
  });

  it('no debe permitir desbloquear niveles superiores al maximo permitido (nivel 10)', () => {
    // 1. Arrange
    LocalRepository.unlockLevel(10);

    // 2. Act
    const perfilInvalido = LocalRepository.unlockLevel(11);

    // 3. Assert
    expect(perfilInvalido.nivel_actual).toBe(10);
  });

  it('debe marcar una palabra como aprendida e incrementar el contador de aciertos', () => {
    // 1. Arrange
    const palabraId = 'pal_01_allianmi';

    // 2. Act
    LocalRepository.markWordStatus(palabraId, 'aprendido');
    const progreso = LocalRepository.getVocabProgress();

    // 3. Assert
    expect(progreso[palabraId]).toBeTruthy();
    expect(progreso[palabraId].estado_aprendizaje).toBe('aprendido');
    expect(progreso[palabraId].contador_aciertos).toBe(1);
  });

  it('debe almacenar una evaluacion y encolarla en la cola de sincronizacion offline cuando no hay red', () => {
    // 1. Arrange
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true
    });
    const nuevaEvaluacion: Evaluacion = {
      id_evaluacion: 'eval_test_999',
      id_estudiante: 'estudiante_demo',
      id_nivel: 1,
      puntuacion_obtenida: 90,
      total_aciertos: 9,
      total_preguntas: 10,
      estado_aprobacion: 'aprobado',
      fecha_evaluacion: new Date().toISOString(),
      sincronizado_nube: false
    };

    // 2. Act
    LocalRepository.saveEvaluation(nuevaEvaluacion);
    const evaluaciones = LocalRepository.getEvaluations();
    const offlineQueue = LocalRepository.getOfflineQueue();

    // 3. Assert
    expect(evaluaciones.length).toBe(1);
    expect(evaluaciones[0].id_evaluacion).toBe('eval_test_999');
    expect(offlineQueue.length).toBe(1);
    expect(offlineQueue[0].id_evaluacion).toBe('eval_test_999');
  });
});
