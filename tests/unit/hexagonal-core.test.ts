import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PuntuacionVO } from '../../src/core/domain/value-objects/PuntuacionVO.ts';
import { NivelIdVO } from '../../src/core/domain/value-objects/NivelIdVO.ts';
import { TerminoQuechuaVO } from '../../src/core/domain/value-objects/TerminoQuechuaVO.ts';
import { EvaluacionFactory } from '../../src/core/domain/factories/EvaluacionFactory.ts';
import { CalificarEvaluacionUseCase } from '../../src/core/use-cases/CalificarEvaluacionUseCase.ts';
import type { IEvaluacionRepository } from '../../src/core/ports/IEvaluacionRepository.ts';
import type { Evaluacion, DetallePregunta } from '../../src/types/domain.ts';

// Doble de prueba (Mock Repository) para desacoplar de cualquier DB
class MockEvaluacionRepository implements IEvaluacionRepository {
  public guardadas: Evaluacion[] = [];

  async guardar(evaluacion: Evaluacion): Promise<void> {
    this.guardadas.push(evaluacion);
  }

  async obtenerPorEstudiante(estudianteId: string): Promise<Evaluacion[]> {
    return this.guardadas.filter((e) => e.id_estudiante === estudianteId);
  }

  async obtenerColaSincronizacionOffline(): Promise<Evaluacion[]> {
    return this.guardadas.filter((e) => !e.sincronizado_nube);
  }

  async limpiarColaSincronizacionOffline(): Promise<void> {
    this.guardadas = [];
  }
}

describe('Nivel 1: Arquitectura Hexagonal y Principios SOLID', () => {

  describe('Value Objects del Dominio', () => {
    it('PuntuacionVO: debe validar rango [0, 100] y umbral del 70%', () => {
      // 1. Arrange & Act: Caso Aprobatorio
      const p70 = PuntuacionVO.desde(70);
      const p100 = PuntuacionVO.desde(100);
      const p69 = PuntuacionVO.desde(69);

      // 3. Assert
      assert.equal(p70.esAprobatorio(), true, '70 debe ser aprobatorio');
      assert.equal(p100.esAprobatorio(), true, '100 debe ser aprobatorio');
      assert.equal(p69.esAprobatorio(), false, '69 debe ser reprobatorio');

      // Casos Invalidos deben lanzar error mediante Zod
      assert.throws(() => PuntuacionVO.desde(-1), /Puntuacion invalida/);
      assert.throws(() => PuntuacionVO.desde(101), /Puntuacion invalida/);
      assert.throws(() => PuntuacionVO.desde(85.5), /Puntuacion invalida/);
    });

    it('NivelIdVO: debe restringir niveles estrictamente al rango de 1 a 10', () => {
      const nivel1 = NivelIdVO.desde(1);
      assert.equal(nivel1.valor, 1);
      assert.equal(nivel1.siguiente().valor, 2);

      const nivel10 = NivelIdVO.desde(10);
      assert.equal(nivel10.tieneSiguiente(), false);
      assert.throws(() => nivel10.siguiente(), /No existe nivel superior/);

      assert.throws(() => NivelIdVO.desde(0), /Nivel invalido/);
      assert.throws(() => NivelIdVO.desde(11), /Nivel invalido/);
    });

    it('TerminoQuechuaVO: debe validar no vacio y normalizar', () => {
      const termino = TerminoQuechuaVO.desde('  Allianmi  ');
      assert.equal(termino.texto, 'Allianmi');
      assert.equal(termino.coincideCon('allianmi'), true);
      assert.throws(() => TerminoQuechuaVO.desde('   '), /no puede estar vacio/);
    });
  });

  describe('Factory Method: EvaluacionFactory', () => {
    it('debe crear una evaluacion valida con invariantes respetadas', () => {
      // 1. Arrange
      const params = {
        estudianteId: 'estudiante_jhoel',
        nivelId: 1,
        totalAciertos: 8,
        totalPreguntas: 10
      };

      // 2. Act
      const evalCreada = EvaluacionFactory.crear(params);

      // 3. Assert
      assert.equal(evalCreada.puntuacion_obtenida, 80);
      assert.equal(evalCreada.estado_aprobacion, 'aprobado');
      assert.equal(evalCreada.sincronizado_nube, false);
      assert.ok(evalCreada.id_evaluacion.startsWith('eval_lvl1_'));
    });

    it('debe rechazar aciertos negativos o mayores al total de preguntas', () => {
      assert.throws(
        () => EvaluacionFactory.crear({ estudianteId: 'u1', nivelId: 1, totalAciertos: 12, totalPreguntas: 10 }),
        /debe estar entre 0 y el total/
      );
    });
  });

  describe('Caso de Uso: CalificarEvaluacionUseCase con Inyeccion de Dependencias', () => {
    const mockPregunta: DetallePregunta = {
      id_pregunta: 'p_test_1',
      enunciado_pregunta: 'Significado de Inti',
      tipo_pregunta: 'traduccion_quechua',
      opcion_correcta: 'Sol',
      distractor_1: 'Luna',
      distractor_2: 'Agua',
      distractor_3: 'Fuego',
      opciones_mezcladas: ['Sol', 'Luna', 'Agua', 'Fuego'],
      explicacion_pedagogica: 'Inti representa al dios Sol en la cosmovision andina.'
    };

    it('debe calificar, delegar al repositorio a traves del puerto y retornar el resultado', async () => {
      // 1. Arrange: Inyectamos el Mock Repository (Dependency Inversion)
      const mockRepo = new MockEvaluacionRepository();
      const useCase = new CalificarEvaluacionUseCase(mockRepo);

      const dto = {
        estudianteId: 'estudiante_emmanuel',
        nivelId: 1,
        preguntas: [mockPregunta],
        respuestasUsuario: { p_test_1: 'Sol' }
      };

      // 2. Act
      const resultado = await useCase.ejecutar(dto);

      // 3. Assert
      assert.equal(resultado.aprobado, true);
      assert.equal(resultado.evaluacion.puntuacion_obtenida, 100);
      // Verificamos que el repositorio recibio la entidad guardada (Mock Verification)
      assert.equal(mockRepo.guardadas.length, 1);
      assert.equal(mockRepo.guardadas[0].id_estudiante, 'estudiante_emmanuel');
    });
  });

});
