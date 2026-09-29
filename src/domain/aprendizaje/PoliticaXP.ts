/**
 * RN-05: reglas de experiencia (XP) del curso.
 *
 * Es una política sin estado: sólo traduce hechos de negocio ("¿es una aprobación nueva?",
 * "¿es la primera vez que esta palabra llega a `aprendido`?") en puntos. Así la
 * idempotencia vive en un único lugar y ni el agregado ni la persistencia reparten XP
 * por su cuenta.
 */
export class PoliticaXP {
  /** Recompensa única por aprobar un nivel del curso A1. */
  static readonly XP_POR_APROBAR_NIVEL = 100;

  /** Recompensa por rendir una evaluación, se apruebe o no. */
  static readonly XP_POR_EVALUACION = 10;

  /** Recompensa única por la primera vez que una palabra pasa a `aprendido`. */
  static readonly XP_POR_PALABRA_APRENDIDA = 2;

  /**
   * +10 por rendir la evaluación y +100 la PRIMERA vez que se aprueba ese nivel. Idempotente.
   *
   * `aprobacionNueva` lo decide `PoliticaDesbloqueo`: es `false` cuando el nivel ya estaba
   * en `nivelesAprobados`, y en ese caso la evaluación sólo deja los 10 XP de participación.
   */
  static porEvaluacion(aprobacionNueva: boolean): number {
    const bono = aprobacionNueva ? PoliticaXP.XP_POR_APROBAR_NIVEL : 0;
    return PoliticaXP.XP_POR_EVALUACION + bono;
  }

  /** +2 sólo la primera vez que la palabra pasa a `aprendido`. */
  static porPalabraAprendida(esPrimeraVezAprendida: boolean): number {
    return esPrimeraVezAprendida ? PoliticaXP.XP_POR_PALABRA_APRENDIDA : 0;
  }
}
