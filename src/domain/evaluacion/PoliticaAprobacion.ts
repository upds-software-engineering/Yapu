import type { Puntuacion } from '../value-objects/Puntuacion';

/**
 * RN-04: FUENTE ÚNICA del umbral de aprobación del curso.
 *
 * El umbral era antes un campo repetido en cada registro del corpus (`umbral_minimo_aprobacion`).
 * Ese número sólo puede existir aquí: cualquier otra capa (aplicación, infraestructura, UI)
 * pregunta a esta política si una puntuación aprueba y cuál es el umbral vigente.
 *
 * Las evaluaciones son sobre 10 preguntas, por lo que aprobar exige acertar al menos
 * `Math.ceil(UMBRAL * 10 / 100)` preguntas; la política no calcula ese valor: lo hace
 * `Puntuacion.desdeAciertos`, que redondea al entero más cercano.
 */
export class PoliticaAprobacion {
  /** Puntaje mínimo (0..100) que aprueba una evaluación. */
  static readonly UMBRAL = 70;

  /** RN-04: aprobar es alcanzar el umbral (comparación inclusiva). */
  static esAprobado(puntuacion: Puntuacion | number): boolean {
    const valor = typeof puntuacion === 'number' ? puntuacion : puntuacion.valor;
    return valor >= PoliticaAprobacion.UMBRAL;
  }

  /** Acceso de lectura al umbral para las capas que lo muestran en pantalla. */
  static get umbral(): number {
    return PoliticaAprobacion.UMBRAL;
  }

  /**
   * Mensaje de resultado en español apto para la interfaz.
   * Nunca habla de "nivel 11" ni de niveles siguientes: la política sólo conoce la puntuación,
   * y el avance de nivel es responsabilidad de las reglas de progreso (RN-01/RN-02).
   */
  static mensajeResultado(aprobado: boolean, puntuacion: number): string {
    if (aprobado) {
      return `¡Felicidades! Aprobaste con ${puntuacion} puntos (umbral: ${PoliticaAprobacion.UMBRAL}).`;
    }
    return `Obtuviste ${puntuacion} puntos y necesitas al menos ${PoliticaAprobacion.UMBRAL} para aprobar. ¡Sigue practicando!`;
  }
}
