import { NivelBloqueadoError } from '../errores';
import { NivelId } from '../value-objects/NivelId';
import { Porcentaje } from '../value-objects/Porcentaje';

/**
 * RN-01 / RN-02 / RN-03: desbloqueo secuencial de los 10 niveles del curso.
 *
 * El curso es una cadena: sólo se desbloquea el nivel inmediatamente siguiente al aprobado.
 * Nadie salta de 1 a 7. La política es pura (recibe y devuelve un estado plano) para que el
 * agregado `ProgresoEstudiante` sea el único que muta y la infraestructura el único que persiste.
 */

/** Estado mínimo necesario para decidir el desbloqueo. */
export interface EstadoDesbloqueo {
  nivelActual: NivelId;
  cursoCompletado: boolean;
  nivelesAprobados: readonly number[];
}

export interface ResultadoAprobacionNivel {
  aprobacionNueva: boolean;
  nivelActual: NivelId;
  cursoCompletado: boolean;
  /** Nivel que se acaba de desbloquear, o `null`. Nunca devuelve 11. */
  desbloqueado: number | null;
}

export class PoliticaDesbloqueo {
  /** RN-01: un nivel es accesible si no supera el nivel actual del estudiante. */
  static puedeAcceder(nivelActual: NivelId, nivel: NivelId): boolean {
    return nivel.esAlcanzableDesde(nivelActual);
  }

  /** RN-01: lanza NivelBloqueadoError(nivelSolicitado, nivelActual) si no puede acceder. */
  static asegurarAcceso(nivelActual: NivelId, nivel: NivelId): void {
    if (!PoliticaDesbloqueo.puedeAcceder(nivelActual, nivel)) {
      throw new NivelBloqueadoError(nivel.valor, nivelActual.valor);
    }
  }

  /**
   * RN-02: aplica una aprobación sobre el estado y devuelve el nuevo estado.
   *
   * Reglas:
   *  - aprobar el nivel actual desbloquea exactamente el siguiente (`desbloqueado = n + 1`);
   *  - aprobar el nivel 10 completa el curso, sin desbloquear nada (nunca existe el nivel 11);
   *  - aprobar un nivel ya superado (n < nivelActual) no mueve el nivel actual y, al estar ya
   *    en `nivelesAprobados`, no es una aprobación nueva (por lo tanto tampoco reparte XP);
   *  - aprobar un nivel superior al actual está prohibido por RN-01: se lanza
   *    `NivelBloqueadoError` en lugar de saltar niveles.
   */
  static aplicarAprobacion(estado: EstadoDesbloqueo, nivel: NivelId): ResultadoAprobacionNivel {
    PoliticaDesbloqueo.asegurarAcceso(estado.nivelActual, nivel);

    const aprobacionNueva = !estado.nivelesAprobados.includes(nivel.valor);
    if (!aprobacionNueva) {
      return {
        aprobacionNueva: false,
        nivelActual: estado.nivelActual,
        cursoCompletado: estado.cursoCompletado,
        desbloqueado: null
      };
    }

    // Nivel ya superado: se registra la aprobación (es nueva) pero no se desbloquea nada.
    if (!nivel.igualA(estado.nivelActual)) {
      return {
        aprobacionNueva: true,
        nivelActual: estado.nivelActual,
        cursoCompletado: estado.cursoCompletado,
        desbloqueado: null
      };
    }

    if (nivel.esUltimo) {
      return {
        aprobacionNueva: true,
        nivelActual: nivel,
        cursoCompletado: true,
        desbloqueado: null
      };
    }

    const siguiente = nivel.siguiente();
    return {
      aprobacionNueva: true,
      nivelActual: siguiente,
      cursoCompletado: false,
      desbloqueado: siguiente.valor
    };
  }

  /** RN-03: `nivelesAprobados / 10 * 100` → 100% al completar los 10. */
  static progresoGlobal(nivelesAprobados: readonly number[]): Porcentaje {
    const nivelesValidos = new Set(
      nivelesAprobados.filter(
        (nivel) =>
          Number.isInteger(nivel) && nivel >= NivelId.PRIMERO && nivel <= NivelId.ULTIMO
      )
    );
    return Porcentaje.desdeNivelesAprobados(nivelesValidos.size);
  }
}
