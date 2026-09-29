import { describe, expect, it } from 'vitest';
import { Calificador, Pregunta, PoliticaAprobacion } from '@domain/evaluacion';

/**
 * RN-04: calificación determinista y derivación del aprobado desde la política única.
 */

const RESPUESTAS = [
  'sol',
  'fuego',
  'agua',
  'tierra',
  'cerro',
  'río',
  'luna',
  'estrella',
  'viento',
  'lago'
];

/** Traducciones que nunca coinciden con las respuestas correctas: sirven de distractores. */
const OTRAS = ['flor', 'nube', 'piedra', 'camino', 'árbol', 'pájaro', 'lluvia', 'noche', 'mañana', 'semilla'];

function pregunta(indice: number): Pregunta {
  const correcta = RESPUESTAS[indice % RESPUESTAS.length]!;
  return Pregunta.crear({
    id: `pregunta-${indice + 1}`,
    tipo: 'traduccion_quechua',
    enunciado: `¿Cuál es el significado de "palabra-${indice + 1}"?`,
    opcionCorrecta: correcta,
    opciones: [correcta, ...OTRAS.slice(0, 3)],
    explicacion: `Explicación de "${correcta}".`,
    nivelId: 1,
    palabraId: `palabra-${indice + 1}`
  });
}

function diezPreguntas(): Pregunta[] {
  return RESPUESTAS.map((_respuesta, indice) => pregunta(indice));
}

/** Marca como correctas las primeras `cantidad` preguntas, con una capitalización distinta. */
function respuestasCorrectas(cantidad: number) {
  return diezPreguntas()
    .slice(0, cantidad)
    .map((unaPregunta) => ({
      preguntaId: unaPregunta.id,
      opcion: `  ${unaPregunta.opcionCorrecta.toLocaleUpperCase('es')}  `
    }));
}

describe('[RF-005] Generar evaluación', () => {
  describe('Calificador (RN-04)', () => {
    it('[RN-04] cuenta como acierto la respuesta correcta ignorando mayúsculas y espacios', () => {
      // Dado diez preguntas y siete respuestas correctas escritas con otra capitalización
      const preguntas = diezPreguntas();
      const respuestas = respuestasCorrectas(7);

      // Cuando se califica
      const resultado = Calificador.calificar(preguntas, respuestas);

      // Entonces se cuentan siete aciertos sobre diez
      expect(resultado.aciertos).toBe(7);
      expect(resultado.total).toBe(10);
      expect(resultado.puntuacion.valor).toBe(70);
    });

    it('[RN-04] con 7 aciertos de 10 la puntuación alcanza el umbral y aprueba', () => {
      // Dado diez preguntas con siete aciertos
      const resultado = Calificador.calificar(diezPreguntas(), respuestasCorrectas(7));

      // Cuando se lee el resultado agregado
      // Entonces queda aprobado justo en el umbral
      expect(resultado.aprobado).toBe(true);
      expect(resultado.umbral).toBe(PoliticaAprobacion.umbral);
      expect(resultado.puntuacion.valor).toBe(PoliticaAprobacion.umbral);
    });

    it('[RN-04] con 6 aciertos de 10 la puntuación es 60 y reprueba', () => {
      // Dado diez preguntas con seis aciertos
      const resultado = Calificador.calificar(diezPreguntas(), respuestasCorrectas(6));

      // Cuando se lee el resultado agregado
      // Entonces queda reprobado por debajo del umbral
      expect(resultado.puntuacion.valor).toBe(60);
      expect(resultado.aprobado).toBe(false);
    });

    it('[RN-04] con 10 aciertos de 10 la puntuación es perfecta y aprueba', () => {
      // Dado diez preguntas respondidas todas correctamente
      const resultado = Calificador.calificar(diezPreguntas(), respuestasCorrectas(10));

      // Cuando se lee el resultado agregado
      // Entonces la puntuación es perfecta
      expect(resultado.puntuacion.valor).toBe(100);
      expect(resultado.puntuacion.esPerfecta()).toBe(true);
      expect(resultado.aprobado).toBe(true);
    });

    it('[RN-04] una pregunta sin respuesta marcada cuenta como incorrecta con respuesta vacía', () => {
      // Dado una pregunta que el estudiante no respondió
      const preguntas = [pregunta(0)];

      // Cuando se califica sin respuestas
      const resultado = Calificador.calificar(preguntas, []);

      // Entonces el detalle expone la respuesta vacía y ningún acierto
      expect(resultado.detalle).toHaveLength(1);
      expect(resultado.detalle[0]?.respuestaMarcada).toBe('');
      expect(resultado.detalle[0]?.esCorrecta).toBe(false);
      expect(resultado.aciertos).toBe(0);
    });

    it('[RN-04] una respuesta que no corresponde a ninguna pregunta no contamina el resultado', () => {
      // Dado diez preguntas y una respuesta con un identificador desconocido
      const respuestas = [{ preguntaId: 'pregunta-inexistente', opcion: RESPUESTAS[0]! }];

      // Cuando se califica
      const resultado = Calificador.calificar(diezPreguntas(), respuestas);

      // Entonces no se otorga ningún acierto
      expect(resultado.aciertos).toBe(0);
      expect(resultado.puntuacion.valor).toBe(0);
    });

    it('[RN-04] con 0 preguntas la puntuación es 0 y reprueba', () => {
      // Dado una evaluación sin preguntas
      // Cuando se califica
      const resultado = Calificador.calificar([], []);

      // Entonces el resultado es cero y reprobado, sin lanzar errores
      expect(resultado.total).toBe(0);
      expect(resultado.aciertos).toBe(0);
      expect(resultado.puntuacion.valor).toBe(0);
      expect(resultado.aprobado).toBe(false);
      expect(resultado.detalle).toEqual([]);
    });

    it('[RN-04] el detalle respeta el orden de las preguntas y expone la palabra evaluada', () => {
      // Dado tres preguntas respondidas sólo la primera y la tercera
      const preguntas = [pregunta(0), pregunta(1), pregunta(2)];
      const respuestas = [
        { preguntaId: preguntas[0]!.id, opcion: preguntas[0]!.opcionCorrecta },
        { preguntaId: preguntas[2]!.id, opcion: OTRAS[0]! }
      ];

      // Cuando se califica
      const resultado = Calificador.calificar(preguntas, respuestas);

      // Entonces el detalle conserva el orden y cada respuesta calificada
      expect(resultado.detalle.map((linea) => linea.pregunta.id)).toEqual([
        preguntas[0]!.id,
        preguntas[1]!.id,
        preguntas[2]!.id
      ]);
      expect(resultado.detalle.map((linea) => linea.esCorrecta)).toEqual([true, false, false]);
      expect(resultado.detalle.map((linea) => linea.palabraId)).toEqual([
        'palabra-1',
        'palabra-2',
        'palabra-3'
      ]);
      expect(resultado.detalle[0]?.opcionCorrecta).toBe(preguntas[0]!.opcionCorrecta);
      expect(resultado.aciertos).toBe(1);
      expect(resultado.total).toBe(3);
    });
  });
});
