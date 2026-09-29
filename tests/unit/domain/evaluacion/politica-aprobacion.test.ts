import { describe, expect, it } from 'vitest';
import { Evaluacion, PoliticaAprobacion } from '@domain/evaluacion';
import { NivelId } from '@domain/value-objects/NivelId';
import { Puntuacion } from '@domain/value-objects/Puntuacion';

/**
 * RN-04 (umbral único de aprobación) y RN-15 (la evaluación nace sin sincronizar).
 * El agregado `Evaluacion` se prueba aquí porque su campo `aprobado` se deriva de esta política.
 */

function registrar(aciertos: number, totalPreguntas: number): Evaluacion {
  return Evaluacion.registrar({
    id: 'eval-1',
    estudianteId: 'estudiante-1',
    nivel: NivelId.crear(3),
    puntuacion: Puntuacion.desdeAciertos(aciertos, totalPreguntas),
    aciertos,
    totalPreguntas,
    fechaIso: '2026-03-15T12:00:00.000Z'
  });
}

describe('[RF-005] Generar evaluación', () => {
  describe('PoliticaAprobacion (RN-04)', () => {
    it('[RN-04] reprueba con 69 puntos', () => {
      // Dado un puntaje una unidad por debajo del umbral
      // Cuando se consulta la política con número y con objeto de valor
      // Entonces ninguna de las dos formas aprueba
      expect(PoliticaAprobacion.esAprobado(69)).toBe(false);
      expect(PoliticaAprobacion.esAprobado(Puntuacion.crear(69))).toBe(false);
    });

    it('[RN-04] aprueba justo en el umbral de 70 puntos', () => {
      // Dado un puntaje exactamente igual al umbral
      // Cuando se consulta la política
      // Entonces la comparación es inclusiva
      expect(PoliticaAprobacion.esAprobado(70)).toBe(true);
      expect(PoliticaAprobacion.esAprobado(Puntuacion.crear(70))).toBe(true);
    });

    it('[RN-04] expone el umbral como constante única y como lectura pública', () => {
      // Dado la política de aprobación
      // Cuando se lee su umbral
      // Entonces coincide con el estándar del curso
      expect(PoliticaAprobacion.UMBRAL).toBe(70);
      expect(PoliticaAprobacion.umbral).toBe(70);
    });

    it('[RN-04] aprueba con 100 puntos', () => {
      // Dado un puntaje perfecto
      // Cuando se consulta la política
      // Entonces aprueba
      expect(PoliticaAprobacion.esAprobado(100)).toBe(true);
      expect(PoliticaAprobacion.esAprobado(Puntuacion.crear(100))).toBe(true);
    });

    it('[RN-04] 7 aciertos sobre 10 dan exactamente el umbral y aprueban', () => {
      // Dado una evaluación de 10 preguntas con 7 aciertos
      const puntuacion = Puntuacion.desdeAciertos(7, 10);

      // Cuando se lee la puntuación
      // Entonces vale 70 y aprueba
      expect(puntuacion.valor).toBe(70);
      expect(PoliticaAprobacion.esAprobado(puntuacion)).toBe(true);
    });

    it('[RN-04] 6 aciertos sobre 10 quedan por debajo del umbral y reprueban', () => {
      // Dado una evaluación de 10 preguntas con 6 aciertos
      const puntuacion = Puntuacion.desdeAciertos(6, 10);

      // Cuando se lee la puntuación
      // Entonces vale 60 y reprueba
      expect(puntuacion.valor).toBe(60);
      expect(PoliticaAprobacion.esAprobado(puntuacion)).toBe(false);
    });

    it('[RN-04] con 0 preguntas la puntuación es 0 y reprueba', () => {
      // Dado un total de preguntas igual a cero (por ejemplo, contenido insuficiente)
      const puntuacion = Puntuacion.desdeAciertos(0, 0);

      // Cuando se consulta la política
      // Entonces no se divide por cero y el resultado reprueba
      expect(puntuacion.valor).toBe(0);
      expect(PoliticaAprobacion.esAprobado(puntuacion)).toBe(false);
    });

    it('[RN-04] el mensaje de aprobado informa la puntuación sin prometer un nivel inexistente', () => {
      // Dado un resultado aprobado
      const mensaje = PoliticaAprobacion.mensajeResultado(true, 100);

      // Cuando se lee el mensaje
      // Entonces está en español, incluye la puntuación y no habla de un nivel 11
      expect(mensaje).toContain('100');
      expect(mensaje).toContain('Aprobaste');
      expect(mensaje).not.toMatch(/nivel\s*11/i);
    });

    it('[RN-04] el mensaje de reprobado indica el umbral vigente', () => {
      // Dado un resultado reprobado
      const mensaje = PoliticaAprobacion.mensajeResultado(false, 40);

      // Cuando se lee el mensaje
      // Entonces incluye la puntuación obtenida, el umbral y no habla de un nivel 11
      expect(mensaje).toContain('40');
      expect(mensaje).toContain('70');
      expect(mensaje).not.toMatch(/nivel\s*11/i);
    });
  });

  describe('Evaluacion (RN-04, RN-15)', () => {
    it('[RN-15] una evaluación registrada nace sin sincronizar', () => {
      // Dado una evaluación recién registrada
      const evaluacion = registrar(8, 10);

      // Cuando se consulta su estado de sincronización
      // Entonces forma parte de la cola offline
      expect(evaluacion.sincronizada).toBe(false);
      expect(evaluacion.toJSON().sincronizada).toBe(false);
    });

    it('[RN-15] marcarSincronizada es idempotente', () => {
      // Dado una evaluación pendiente
      const evaluacion = registrar(8, 10);

      // Cuando se marca dos veces como sincronizada
      evaluacion.marcarSincronizada();
      evaluacion.marcarSincronizada();

      // Entonces queda sincronizada una sola vez, sin errores
      expect(evaluacion.sincronizada).toBe(true);
      expect(evaluacion.toJSON().sincronizada).toBe(true);
    });

    it('[RN-04] aprobado se deriva del umbral de la política', () => {
      // Dado dos evaluaciones a un punto de distancia del umbral
      const aprobada = registrar(7, 10);
      const reprobada = registrar(6, 10);

      // Cuando se leen sus resultados
      // Entonces el aprobado sale de la política, no de un campo recibido
      expect(aprobada.aprobado).toBe(true);
      expect(reprobada.aprobado).toBe(false);
      expect(aprobada.puntuacion.valor).toBe(70);
    });

    it('[RN-04] reconstruir conserva puntuación, nivel y sincronización', () => {
      // Dado una evaluación ya sincronizada
      const original = registrar(7, 10);
      original.marcarSincronizada();

      // Cuando se rehidrata desde su JSON
      const reconstruida = Evaluacion.reconstruir(original.toJSON());

      // Entonces los datos persistidos se conservan intactos
      expect(reconstruida.toJSON()).toEqual(original.toJSON());
      expect(reconstruida.nivelId.valor).toBe(3);
      expect(reconstruida.puntuacion.valor).toBe(70);
      expect(reconstruida.sincronizada).toBe(true);
    });

    it('[RN-06] expone la fecha como día calendario', () => {
      // Dado una evaluación registrada con fecha ISO
      const evaluacion = registrar(7, 10);

      // Cuando se consulta su día
      // Entonces se obtiene el día calendario sin hora
      expect(evaluacion.dia.toJSON()).toBe('2026-03-15');
      expect(evaluacion.fecha).toBe('2026-03-15T12:00:00.000Z');
    });

    it('[RN-10] rechaza aciertos mayores que el total de preguntas', () => {
      // Dado una evaluación imposible con una puntuación válida
      // Cuando se intenta registrar
      // Entonces se rechaza la invariante
      expect(() =>
        Evaluacion.registrar({
          id: 'eval-imposible',
          estudianteId: 'estudiante-1',
          nivel: NivelId.crear(3),
          puntuacion: Puntuacion.crear(100),
          aciertos: 11,
          totalPreguntas: 10,
          fechaIso: '2026-03-15T12:00:00.000Z'
        })
      ).toThrow(/no pueden superar/);
    });

    it('[RN-04] rechaza un número de aciertos negativo', () => {
      // Dado un registro con aciertos negativos
      // Cuando se intenta registrar
      // Entonces se rechaza la invariante
      expect(() =>
        Evaluacion.registrar({
          id: 'eval-negativa',
          estudianteId: 'estudiante-1',
          nivel: NivelId.crear(3),
          puntuacion: Puntuacion.cero(),
          aciertos: -1,
          totalPreguntas: 10,
          fechaIso: '2026-03-15T12:00:00.000Z'
        })
      ).toThrow(/aciertos deben ser un entero/);
    });

    it('[RN-04] rechaza un total de preguntas no entero', () => {
      // Dado un registro con un total fraccionario
      // Cuando se intenta registrar
      // Entonces se rechaza la invariante
      expect(() =>
        Evaluacion.registrar({
          id: 'eval-fraccionaria',
          estudianteId: 'estudiante-1',
          nivel: NivelId.crear(3),
          puntuacion: Puntuacion.cero(),
          aciertos: 0,
          totalPreguntas: 2.5,
          fechaIso: '2026-03-15T12:00:00.000Z'
        })
      ).toThrow(/total de preguntas debe ser un entero/);
    });
  });
});
