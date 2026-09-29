import { describe, it, expect } from 'vitest';
import {
  generateQuizForLevel,
  evaluateQuiz,
  type QuizSubmissionResult
} from '../../src/lib/ai/deterministic-engine.ts';
import type { DetallePregunta } from '../../src/types/domain.ts';

describe('Nivel 1: Pruebas Unitarias - Motor de IA Determinista YAPU', () => {

  describe('Generador de Evaluaciones (generateQuizForLevel)', () => {
    it('deberia generar exactamente 10 preguntas para el Nivel 1', () => {
      // 1. Arrange
      const nivelId = 1;
      const cantidadEsperada = 10;

      // 2. Act
      const preguntas = generateQuizForLevel(nivelId, cantidadEsperada);

      // 3. Assert
      expect(preguntas.length).toBe(cantidadEsperada);
    });

    it('cada pregunta debe tener 4 opciones mezcladas y contener la opcion correcta', () => {
      // 1. Arrange
      const nivelId = 1;

      // 2. Act
      const preguntas = generateQuizForLevel(nivelId, 5);

      // 3. Assert
      for (const p of preguntas) {
        expect(p.id_pregunta).toBeTruthy();
        expect(p.enunciado_pregunta.length).toBeGreaterThan(0);
        expect(p.opcion_correcta.length).toBeGreaterThan(0);
        expect(p.opciones_mezcladas.length).toBe(4);
        expect(p.opciones_mezcladas).toContain(p.opcion_correcta);
      }
    });

    it('los distractores no deben ser identicos a la opcion correcta', () => {
      // 1. Arrange
      const nivelId = 1;

      // 2. Act
      const preguntas = generateQuizForLevel(nivelId, 10);

      // 3. Assert
      for (const p of preguntas) {
        expect(p.distractor_1).not.toBe(p.opcion_correcta);
        expect(p.distractor_2).not.toBe(p.opcion_correcta);
        expect(p.distractor_3).not.toBe(p.opcion_correcta);
      }
    });
  });

  describe('Calificador Determinista (evaluateQuiz)', () => {
    const mockPreguntas: DetallePregunta[] = [
      {
        id_pregunta: 'p1',
        enunciado_pregunta: 'Significado de Allianmi',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Bien / Estoy bien',
        distractor_1: 'Casa',
        distractor_2: 'Sol',
        distractor_3: 'Agua',
        opciones_mezcladas: ['Bien / Estoy bien', 'Casa', 'Sol', 'Agua'],
        explicacion_pedagogica: 'Saludo comun en quechua.'
      },
      {
        id_pregunta: 'p2',
        enunciado_pregunta: 'Significado de Inti',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Sol',
        distractor_1: 'Luna',
        distractor_2: 'Tierra',
        distractor_3: 'Agua',
        opciones_mezcladas: ['Sol', 'Luna', 'Tierra', 'Agua'],
        explicacion_pedagogica: 'Inti es el sol.'
      },
      {
        id_pregunta: 'p3',
        enunciado_pregunta: 'Significado de Yaku',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Agua',
        distractor_1: 'Fuego',
        distractor_2: 'Aire',
        distractor_3: 'Tierra',
        opciones_mezcladas: ['Agua', 'Fuego', 'Aire', 'Tierra'],
        explicacion_pedagogica: 'Yaku es agua.'
      },
      {
        id_pregunta: 'p4',
        enunciado_pregunta: 'Significado de Wasi',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Casa',
        distractor_1: 'Camino',
        distractor_2: 'Puente',
        distractor_3: 'Cerro',
        opciones_mezcladas: ['Casa', 'Camino', 'Puente', 'Cerro'],
        explicacion_pedagogica: 'Wasi es casa.'
      },
      {
        id_pregunta: 'p5',
        enunciado_pregunta: 'Significado de Allqo',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Perro',
        distractor_1: 'Gato',
        distractor_2: 'Caballo',
        distractor_3: 'Oveja',
        opciones_mezcladas: ['Perro', 'Gato', 'Caballo', 'Oveja'],
        explicacion_pedagogica: 'Allqo es perro.'
      },
      {
        id_pregunta: 'p6',
        enunciado_pregunta: 'Significado de Urqu',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Cerro / Montaña',
        distractor_1: 'Río',
        distractor_2: 'Lago',
        distractor_3: 'Valle',
        opciones_mezcladas: ['Cerro / Montaña', 'Río', 'Lago', 'Valle'],
        explicacion_pedagogica: 'Urqu es cerro.'
      },
      {
        id_pregunta: 'p7',
        enunciado_pregunta: 'Significado de Killa',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Luna / Mes',
        distractor_1: 'Estrella',
        distractor_2: 'Nube',
        distractor_3: 'Cielo',
        opciones_mezcladas: ['Luna / Mes', 'Estrella', 'Nube', 'Cielo'],
        explicacion_pedagogica: 'Killa es luna.'
      },
      {
        id_pregunta: 'p8',
        enunciado_pregunta: 'Significado de Nina',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Fuego',
        distractor_1: 'Hielo',
        distractor_2: 'Viento',
        distractor_3: 'Lluvia',
        opciones_mezcladas: ['Fuego', 'Hielo', 'Viento', 'Lluvia'],
        explicacion_pedagogica: 'Nina es fuego.'
      },
      {
        id_pregunta: 'p9',
        enunciado_pregunta: 'Significado de Mayu',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Río',
        distractor_1: 'Mar',
        distractor_2: 'Pozo',
        distractor_3: 'Nieve',
        opciones_mezcladas: ['Río', 'Mar', 'Pozo', 'Nieve'],
        explicacion_pedagogica: 'Mayu es rio.'
      },
      {
        id_pregunta: 'p10',
        enunciado_pregunta: 'Significado de Tuta',
        tipo_pregunta: 'traduccion_quechua',
        opcion_correcta: 'Noche',
        distractor_1: 'Día',
        distractor_2: 'Tarde',
        distractor_3: 'Mañana',
        opciones_mezcladas: ['Noche', 'Día', 'Tarde', 'Mañana'],
        explicacion_pedagogica: 'Tuta es noche.'
      }
    ];

    it('debe aprobar con 100% cuando todas las respuestas son correctas', () => {
      // 1. Arrange: 10 de 10 correctas
      const respuestasUsuario = {
        p1: 'Bien / Estoy bien',
        p2: 'Sol',
        p3: 'Agua',
        p4: 'Casa',
        p5: 'Perro',
        p6: 'Cerro / Montaña',
        p7: 'Luna / Mes',
        p8: 'Fuego',
        p9: 'Río',
        p10: 'Noche'
      };

      // 2. Act
      const resultado: QuizSubmissionResult = evaluateQuiz(
        'estudiante_01',
        1,
        mockPreguntas,
        respuestasUsuario
      );

      // 3. Assert
      expect(resultado.evaluacion.puntuacion_obtenida).toBe(100);
      expect(resultado.evaluacion.total_aciertos).toBe(10);
      expect(resultado.aprobado).toBe(true);
      expect(resultado.evaluacion.estado_aprobacion).toBe('aprobado');
    });

    it('debe aprobar en el caso limite exacto del 70% (7 aciertos de 10)', () => {
      // 1. Arrange: 7 correctas, 3 incorrectas
      const respuestasUsuario = {
        p1: 'Bien / Estoy bien',
        p2: 'Sol',
        p3: 'Agua',
        p4: 'Casa',
        p5: 'Perro',
        p6: 'Cerro / Montaña',
        p7: 'Luna / Mes',
        p8: 'INCORRECTO',
        p9: 'INCORRECTO',
        p10: 'INCORRECTO'
      };

      // 2. Act
      const resultado = evaluateQuiz('estudiante_02', 1, mockPreguntas, respuestasUsuario);

      // 3. Assert
      expect(resultado.evaluacion.puntuacion_obtenida).toBe(70);
      expect(resultado.evaluacion.total_aciertos).toBe(7);
      expect(resultado.aprobado).toBe(true);
      expect(resultado.evaluacion.estado_aprobacion).toBe('aprobado');
    });

    it('debe reprobar con 60% (6 aciertos de 10, por debajo del umbral del 70%)', () => {
      // 1. Arrange: 6 correctas, 4 incorrectas
      const respuestasUsuario = {
        p1: 'Bien / Estoy bien',
        p2: 'Sol',
        p3: 'Agua',
        p4: 'Casa',
        p5: 'Perro',
        p6: 'Cerro / Montaña',
        p7: 'INCORRECTO',
        p8: 'INCORRECTO',
        p9: 'INCORRECTO',
        p10: 'INCORRECTO'
      };

      // 2. Act
      const resultado = evaluateQuiz('estudiante_03', 1, mockPreguntas, respuestasUsuario);

      // 3. Assert
      expect(resultado.evaluacion.puntuacion_obtenida).toBe(60);
      expect(resultado.evaluacion.total_aciertos).toBe(6);
      expect(resultado.aprobado).toBe(false);
      expect(resultado.evaluacion.estado_aprobacion).toBe('reprobado');
    });

    it('debe ser tolerante a mayusculas/minusculas y espacios en blanco accidentales', () => {
      // 1. Arrange: respuestas con variaciones de casing y espacios
      const respuestasUsuario = {
        p1: '  bien / estoy bien  ',
        p2: 'SOL',
        p3: '  agua  ',
        p4: 'casa',
        p5: 'PERRO',
        p6: 'Cerro / Montaña',
        p7: 'luna / mes',
        p8: 'fuego',
        p9: 'río',
        p10: 'noche'
      };

      // 2. Act
      const resultado = evaluateQuiz('estudiante_04', 1, mockPreguntas, respuestasUsuario);

      // 3. Assert
      expect(resultado.evaluacion.puntuacion_obtenida).toBe(100);
      expect(resultado.aprobado).toBe(true);
    });
  });

});
