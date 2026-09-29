import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { LocalRepository } from '../../src/lib/storage/local-repository.ts';
import type { Evaluacion } from '../../src/types/domain.ts';

// Doble de prueba (Mock / Stub de localStorage en entorno Node.js)
// Basado en el concepto de Dobles de Prueba de la diapositiva 4 de QA
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
    // Inyectamos el mock en el objeto global para simular el navegador en Node.js
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockStorage;
  });

  it('debe devolver el perfil por defecto y guardarlo si el almacenamiento esta vacio', () => {
    // 1. Arrange & Act
    const perfil = LocalRepository.getProfile();

    // 2. Assert
    assert.equal(perfil.id_estudiante, 'estudiante_demo');
    assert.equal(perfil.nivel_actual, 1);
    // Verificamos que se haya invocado setItem en el mock (comportamiento de Mock)
    const setCalls = mockStorage.calls.filter((c) => c.method === 'setItem');
    assert.ok(setCalls.length > 0, 'Debe haber guardado el perfil por defecto en storage');
  });

  it('debe desbloquear el nivel siguiente y sumar 100 puntos de experiencia', () => {
    // 1. Arrange
    const perfilInicial = LocalRepository.getProfile();
    const xpInicial = perfilInicial.puntos_experiencia || 0;

    // 2. Act
    const perfilActualizado = LocalRepository.unlockLevel(2);

    // 3. Assert
    assert.equal(perfilActualizado.nivel_actual, 2);
    assert.equal(perfilActualizado.puntos_experiencia, xpInicial + 100);
  });

  it('no debe permitir desbloquear niveles superiores al maximo permitido (nivel 10)', () => {
    // 1. Arrange
    LocalRepository.unlockLevel(10);

    // 2. Act: Intentar desbloquear un nivel invalido (nivel 11)
    const perfilInvalido = LocalRepository.unlockLevel(11);

    // 3. Assert: Debe mantenerse en nivel 10
    assert.equal(perfilInvalido.nivel_actual, 10);
  });

  it('debe marcar una palabra como aprendida e incrementar el contador de aciertos', () => {
    // 1. Arrange
    const palabraId = 'pal_01_allianmi';

    // 2. Act
    LocalRepository.markWordStatus(palabraId, 'aprendido');
    const progreso = LocalRepository.getVocabProgress();

    // 3. Assert
    assert.ok(progreso[palabraId], 'La palabra debe figurar en el mapa de progreso');
    assert.equal(progreso[palabraId].estado_aprendizaje, 'aprendido');
    assert.equal(progreso[palabraId].contador_aciertos, 1);
  });

  it('debe almacenar una evaluacion y encolarla en la cola de sincronizacion offline cuando no hay red', () => {
    // 1. Arrange: Simulamos que el dispositivo esta sin conexion (offline)
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
    assert.equal(evaluaciones.length, 1);
    assert.equal(evaluaciones[0].id_evaluacion, 'eval_test_999');
    assert.equal(offlineQueue.length, 1, 'Debe haber encolado la transaccion para sincronizacion offline');
    assert.equal(offlineQueue[0].id_evaluacion, 'eval_test_999');
  });
});
