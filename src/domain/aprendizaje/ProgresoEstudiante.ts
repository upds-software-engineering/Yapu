import { ValidacionError } from '../errores';
import type { EstadoAprendizaje } from '../shared/tipos';
import { FechaDia } from '../value-objects/FechaDia';
import { NivelId } from '../value-objects/NivelId';
import type { Porcentaje } from '../value-objects/Porcentaje';
import {
  PoliticaDesbloqueo,
  type EstadoDesbloqueo,
  type ResultadoAprobacionNivel
} from './PoliticaDesbloqueo';
import { PoliticaRacha } from './PoliticaRacha';
import { PoliticaXP } from './PoliticaXP';

/**
 * Progreso de un estudiante: agregado raíz del aprendizaje.
 *
 * Concentra las reglas del recorrido del curso (RN-01, RN-02, RN-03, RN-05, RN-06, RN-07 y
 * RN-08) y delega los cálculos puros en las políticas (`PoliticaXP`, `PoliticaRacha`,
 * `PoliticaDesbloqueo`). Los XP, la racha y los niveles aprobados sólo cambian a través de
 * sus métodos, de modo que la persistencia nunca tenga que recalcular nada.
 */

/** RN-08: seguimiento de una palabra concreta para un estudiante. */
export interface RegistroPalabra {
  palabraId: string;
  estado: EstadoAprendizaje;
  contadorAciertos: number;
  fechaUltimoRepaso: string;
}

/** Forma plana y persistible del agregado (es lo que guarda `ProgresoRepository`). */
export interface DatosProgreso {
  estudianteId: string;
  nivelActual: number;
  cursoCompletado: boolean;
  xp: number;
  rachaDias: number;
  /** 'YYYY-MM-DD' o null si nunca hubo actividad. */
  fechaUltimaActividad: string | null;
  nivelesAprobados: number[];
  /** clave: palabraId */
  palabras: Record<string, RegistroPalabra>;
}

export interface ResultadoMarcado {
  palabraId: string;
  estado: EstadoAprendizaje;
  xpGanado: number;
  esPrimeraVezAprendida: boolean;
  palabrasAprendidas: number;
}

export interface ResultadoEvaluacionProgreso extends ResultadoAprobacionNivel {
  xpGanado: number;
}

/** Normaliza un contador: los valores no finitos o negativos se leen como 0. */
function contadorNoNegativo(valor: number): number {
  return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : 0;
}

/** Deja sólo los niveles aprobados válidos (1..10), sin duplicados y en orden ascendente. */
function nivelesAprobadosValidos(niveles: readonly number[]): number[] {
  const unicos = new Set(
    niveles.filter(
      (nivel) => Number.isInteger(nivel) && nivel >= NivelId.PRIMERO && nivel <= NivelId.ULTIMO
    )
  );
  return [...unicos].sort((a, b) => a - b);
}

export class ProgresoEstudiante {
  private constructor(
    private readonly idEstudiante: string,
    private nivel: NivelId,
    private completado: boolean,
    private xpAcumulada: number,
    private racha: number,
    private ultimaActividad: FechaDia | null,
    private aprobados: readonly number[],
    private readonly registros: Record<string, RegistroPalabra>
  ) {}

  /** RN-07: perfil nuevo → nivel 1, racha 0, sin palabras, 0 XP y el curso sin empezar. */
  static nuevo(estudianteId: string): ProgresoEstudiante {
    return ProgresoEstudiante.reconstruir({
      estudianteId,
      nivelActual: NivelId.PRIMERO,
      cursoCompletado: false,
      xp: 0,
      rachaDias: 0,
      fechaUltimaActividad: null,
      nivelesAprobados: [],
      palabras: {}
    });
  }

  /** Rehidrata el agregado desde su forma persistida, saneando contadores y niveles. */
  static reconstruir(datos: DatosProgreso): ProgresoEstudiante {
    const estudianteId = String(datos.estudianteId ?? '').trim();
    if (estudianteId.length === 0) {
      throw new ValidacionError(
        'El progreso necesita el identificador del estudiante.',
        'estudianteId'
      );
    }

    const registros: Record<string, RegistroPalabra> = {};
    for (const [palabraId, registro] of Object.entries(datos.palabras ?? {})) {
      registros[palabraId] = {
        palabraId: registro.palabraId,
        estado: registro.estado,
        contadorAciertos: contadorNoNegativo(registro.contadorAciertos),
        fechaUltimoRepaso: registro.fechaUltimoRepaso
      };
    }

    return new ProgresoEstudiante(
      estudianteId,
      NivelId.crear(datos.nivelActual),
      datos.cursoCompletado === true,
      contadorNoNegativo(datos.xp),
      contadorNoNegativo(datos.rachaDias),
      datos.fechaUltimaActividad === null ? null : FechaDia.desdeIso(datos.fechaUltimaActividad),
      nivelesAprobadosValidos(datos.nivelesAprobados ?? []),
      registros
    );
  }

  get estudianteId(): string {
    return this.idEstudiante;
  }

  get nivelActual(): NivelId {
    return this.nivel;
  }

  get cursoCompletado(): boolean {
    return this.completado;
  }

  get xp(): number {
    return this.xpAcumulada;
  }

  get rachaDias(): number {
    return this.racha;
  }

  get fechaUltimaActividad(): FechaDia | null {
    return this.ultimaActividad;
  }

  get nivelesAprobados(): readonly number[] {
    return this.aprobados;
  }

  /** RN-08: nº de palabras ÚNICAS en estado `aprendido`. */
  get palabrasAprendidas(): number {
    return Object.values(this.registros).filter((registro) => registro.estado === 'aprendido')
      .length;
  }

  /** RN-03: niveles aprobados sobre los 10 del curso. */
  get porcentajeGlobal(): Porcentaje {
    return PoliticaDesbloqueo.progresoGlobal(this.aprobados);
  }

  /** RN-01 */
  puedeAccederANivel(nivel: NivelId): boolean {
    return PoliticaDesbloqueo.puedeAcceder(this.nivel, nivel);
  }

  /** Lanza NivelBloqueadoError (RN-01). */
  asegurarAccesoANivel(nivel: NivelId): void {
    PoliticaDesbloqueo.asegurarAcceso(this.nivel, nivel);
  }

  /** RN-06: registra actividad del día y recalcula la racha. */
  registrarActividad(hoy: FechaDia): void {
    this.racha = PoliticaRacha.calcular(this.racha, this.ultimaActividad, hoy);
    this.ultimaActividad = hoy;
  }

  /**
   * RN-05, RN-06, RN-08: marca una palabra con su nuevo estado.
   *
   * Los +2 XP se otorgan sólo la primera vez que la palabra pasa a `aprendido`; volver a
   * marcarla no los repite. `contadorAciertos` acumula los recuerdos correctos y marcar
   * `repasar` conserva el histórico (sólo saca la palabra del conteo de aprendidas).
   */
  marcarPalabra(
    palabraId: string,
    estado: EstadoAprendizaje,
    hoy: FechaDia
  ): ResultadoMarcado {
    const anterior = this.registros[palabraId];
    const estabaAprendida = anterior?.estado === 'aprendido';
    const esPrimeraVezAprendida = estado === 'aprendido' && !estabaAprendida;
    const xpGanado = PoliticaXP.porPalabraAprendida(esPrimeraVezAprendida);

    this.registros[palabraId] = {
      palabraId,
      estado,
      contadorAciertos: (anterior?.contadorAciertos ?? 0) + (estado === 'aprendido' ? 1 : 0),
      fechaUltimoRepaso: hoy.toJSON()
    };
    this.xpAcumulada += xpGanado;
    this.registrarActividad(hoy);

    return {
      palabraId,
      estado,
      xpGanado,
      esPrimeraVezAprendida,
      palabrasAprendidas: this.palabrasAprendidas
    };
  }

  /**
   * RN-02, RN-05, RN-06: aplica el resultado de una evaluación del `nivel`.
   *
   * Aprobado o no, la evaluación siempre suma los +10 XP de participación y registra la
   * actividad del día. Los +100 XP extra se otorgan sólo si la aprobación es nueva, y
   * RN-01 impide rendir un nivel superior al actual.
   */
  aplicarResultadoEvaluacion(
    nivel: NivelId,
    aprobado: boolean,
    hoy: FechaDia
  ): ResultadoEvaluacionProgreso {
    this.asegurarAccesoANivel(nivel);
    this.registrarActividad(hoy);

    if (!aprobado) {
      const xpGanado = PoliticaXP.porEvaluacion(false);
      this.xpAcumulada += xpGanado;
      return {
        aprobacionNueva: false,
        nivelActual: this.nivel,
        cursoCompletado: this.completado,
        desbloqueado: null,
        xpGanado
      };
    }

    const resultado = PoliticaDesbloqueo.aplicarAprobacion(this.estadoDesbloqueo(), nivel);
    const xpGanado = PoliticaXP.porEvaluacion(resultado.aprobacionNueva);

    if (resultado.aprobacionNueva && !this.esNivelAprobado(nivel)) {
      this.aprobados = nivelesAprobadosValidos([...this.aprobados, nivel.valor]);
    }
    this.nivel = resultado.nivelActual;
    this.completado = resultado.cursoCompletado;
    this.xpAcumulada += xpGanado;

    return { ...resultado, xpGanado };
  }

  /** Ids de palabras en un estado dado (para "palabras para repasar" y filtros de lección). */
  palabrasEnEstado(estado: EstadoAprendizaje): string[] {
    return Object.entries(this.registros)
      .filter(([, registro]) => registro.estado === estado)
      .map(([palabraId]) => palabraId);
  }

  /** Copia del registro de la palabra, para que nadie mutile el agregado desde fuera. */
  obtenerRegistro(palabraId: string): RegistroPalabra | undefined {
    const registro = this.registros[palabraId];
    return registro === undefined ? undefined : { ...registro };
  }

  esNivelAprobado(nivel: NivelId): boolean {
    return this.aprobados.includes(nivel.valor);
  }

  toJSON(): DatosProgreso {
    const palabras: Record<string, RegistroPalabra> = {};
    for (const [palabraId, registro] of Object.entries(this.registros)) {
      palabras[palabraId] = { ...registro };
    }

    return {
      estudianteId: this.idEstudiante,
      nivelActual: this.nivel.valor,
      cursoCompletado: this.completado,
      xp: this.xpAcumulada,
      rachaDias: this.racha,
      fechaUltimaActividad: this.ultimaActividad === null ? null : this.ultimaActividad.toJSON(),
      nivelesAprobados: [...this.aprobados],
      palabras
    };
  }

  private estadoDesbloqueo(): EstadoDesbloqueo {
    return {
      nivelActual: this.nivel,
      cursoCompletado: this.completado,
      nivelesAprobados: this.aprobados
    };
  }
}
