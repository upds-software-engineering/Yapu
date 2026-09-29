import { describe, it, expect } from 'vitest';
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
      expect(p70.esAprobatorio()).toBe(true);
      expect(p100.esAprobatorio()).toBe(true);
      expect(p69.esAprobatorio()).toBe(false);

      // Casos Invalidos deben lanzar error mediante Zod
      expect(() => PuntuacionVO.desde(-1)).toThrow(/Puntuacion invalida/);
      expect(() => PuntuacionVO.desde(101)).toThrow(/Puntuacion invalida/);
      expect(() => PuntuacionVO.desde(85.5)).toThrow(/Puntuacion invalida/);
    });

    it('NivelIdVO: debe restringir niveles estrictamente al rango de 1 a 10', () => {
      const nivel1 = NivelIdVO.desde(1);
      expect(nivel1.valor).toBe(1);
      expect(nivel1.siguiente().valor).toBe(2);

      const nivel10 = NivelIdVO.desde(10);
      expect(nivel10.tieneSiguiente()).toBe(false);
      expect(() => nivel10.siguiente()).toThrow(/No existe nivel superior/);

      expect(() => NivelIdVO.desde(0)).toThrow(/Nivel invalido/);
      expect(() => NivelIdVO.desde(11)).toThrow(/Nivel invalido/);
    });

    it('TerminoQuechuaVO: debe validar no vacio y normalizar', () => {
      const termino = TerminoQuechuaVO.desde('  Allianmi  ');
      expect(termino.texto).toBe('Allianmi');
      expect(termino.coincideCon('allianmi')).toBe(true);
      expect(() => TerminoQuechuaVO.desde('   ')).toThrow(/no puede estar vacio/);
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
      expect(evalCreada.puntuacion_obtenida).toBe(80);
      expect(evalCreada.estado_aprobacion).toBe('aprobado');
      expect(evalCreada.sincronizado_nube).toBe(false);
      expect(evalCreada.id_evaluacion.startsWith('eval_lvl1_')).toBe(true);
    });

    it('debe rechazar aciertos negativos o mayores al total de preguntas', () => {
      expect(() =>
        EvaluacionFactory.crear({ estudianteId: 'u1', nivelId: 1, totalAciertos: 12, totalPreguntas: 10 })
      ).toThrow(/debe estar entre 0 y el total/);
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
      expect(resultado.aprobado).toBe(true);
      expect(resultado.evaluacion.puntuacion_obtenida).toBe(100);
      // Verificamos que el repositorio recibio la entidad guardada (Mock Verification)
      expect(mockRepo.guardadas.length).toBe(1);
      expect(mockRepo.guardadas[0].id_estudiante).toBe('estudiante_emmanuel');
    });
  });

});
