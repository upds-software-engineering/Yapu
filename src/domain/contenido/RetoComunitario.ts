import { ConflictoEstadoError, PermisoDenegadoError, ValidacionError } from '../errores';
import type { EstadoModeracion, RolUsuario } from '../shared/tipos';
import { FechaDia } from '../value-objects/FechaDia';
import { NivelId } from '../value-objects/NivelId';

/**
 * RN-13 (RF-007 / RS-003): reto comunitario propuesto por una o un estudiante avanzado.
 *
 * Es un agregado: la bitácora de moderación es la única fuente de verdad del estado, y el
 * reto no publica nada hasta reunir `APROBACIONES_REQUERIDAS` aprobaciones de docentes
 * DISTINTOS (doble moderación). Nadie modera su propio reto.
 */

/** Voto de una o un docente sobre un reto comunitario. */
export interface ModeracionReto {
  docenteId: string;
  decision: 'aprobado' | 'rechazado';
  fecha: string;
}

/** Forma persistida / serializada del agregado completo. */
export interface DatosReto {
  id: string;
  autorId: string;
  nombreAutor: string;
  textoQuechua: string;
  traduccionSugerida: string;
  pistaCultural?: string;
  nivelSugerido: number;
  estado: EstadoModeracion;
  fechaCreacion: string;
  moderaciones: ModeracionReto[];
}

/** Datos que aporta quien propone: el estado y la bitácora los decide el dominio. */
export interface PropuestaReto {
  id: string;
  autorId: string;
  nombreAutor: string;
  textoQuechua: string;
  traduccionSugerida: string;
  pistaCultural?: string;
  nivelSugerido: number;
  fechaCreacion: string;
}

export class RetoComunitario {
  /** RN-13: sólo el estudiantado del tramo de cosmovisión puede proponer. */
  static readonly NIVEL_MINIMO_PROPONER = 7;
  /** RN-13: doble moderación; dos docentes distintos deben aprobar. */
  static readonly APROBACIONES_REQUERIDAS = 2;

  private constructor(
    readonly id: string,
    readonly autorId: string,
    readonly nombreAutor: string,
    readonly textoQuechua: string,
    readonly traduccionSugerida: string,
    readonly pistaCultural: string,
    readonly nivelSugerido: NivelId,
    readonly fechaCreacion: FechaDia,
    private estadoActual: EstadoModeracion,
    private readonly bitacora: ModeracionReto[]
  ) {}

  /**
   * RN-13: alta de una propuesta. Exige rol `estudiante` y nivel actual >= 7; toda propuesta
   * nace `pendiente` y sin bitácora, aunque quien proponga sea docente en otro contexto.
   */
  static proponer(
    propuesta: PropuestaReto,
    contexto: { rol: RolUsuario; nivelActual: number }
  ): RetoComunitario {
    if (contexto.rol !== 'estudiante') {
      throw new PermisoDenegadoError('Sólo las y los estudiantes pueden proponer retos comunitarios.');
    }
    if (contexto.nivelActual < RetoComunitario.NIVEL_MINIMO_PROPONER) {
      throw new PermisoDenegadoError(
        `Para proponer un reto comunitario se requiere el nivel ${RetoComunitario.NIVEL_MINIMO_PROPONER} o superior (nivel actual: ${contexto.nivelActual}).`
      );
    }
    if (!propuesta.textoQuechua?.trim()) {
      throw new ValidacionError('El reto comunitario no puede estar vacío.', 'textoQuechua');
    }
    if (!propuesta.traduccionSugerida?.trim()) {
      throw new ValidacionError(
        'El reto comunitario requiere una traducción sugerida al español.',
        'traduccionSugerida'
      );
    }
    return new RetoComunitario(
      propuesta.id,
      propuesta.autorId,
      propuesta.nombreAutor,
      propuesta.textoQuechua.trim(),
      propuesta.traduccionSugerida.trim(),
      propuesta.pistaCultural?.trim() ?? '',
      NivelId.crear(propuesta.nivelSugerido),
      FechaDia.desdeIso(propuesta.fechaCreacion),
      'pendiente',
      []
    );
  }

  /**
   * Rehidratación desde persistencia: no revalida la bitácora, porque el repositorio es la
   * fuente de verdad del estado ya resuelto.
   */
  static reconstruir(datos: DatosReto): RetoComunitario {
    return new RetoComunitario(
      datos.id,
      datos.autorId,
      datos.nombreAutor,
      datos.textoQuechua.trim(),
      datos.traduccionSugerida.trim(),
      datos.pistaCultural?.trim() ?? '',
      NivelId.crear(datos.nivelSugerido),
      FechaDia.desdeIso(datos.fechaCreacion),
      datos.estado,
      datos.moderaciones.map((moderacion) => ({ ...moderacion }))
    );
  }

  /** RN-13: consulta sin efectos que la UI usa para habilitar o no el formulario de propuesta. */
  static puedeProponer(rol: RolUsuario, nivelActual: number): boolean {
    return rol === 'estudiante' && nivelActual >= RetoComunitario.NIVEL_MINIMO_PROPONER;
  }

  get estado(): EstadoModeracion {
    return this.estadoActual;
  }

  /** Copia defensiva: la bitácora sólo muta a través de `moderar`. */
  get moderaciones(): readonly ModeracionReto[] {
    return [...this.bitacora];
  }

  /** RN-13: nº de aprobaciones emitidas por docentes DISTINTOS. */
  get aprobaciones(): number {
    const docentesAprobadores = new Set<string>();
    for (const moderacion of this.bitacora) {
      if (moderacion.decision === 'aprobado') docentesAprobadores.add(moderacion.docenteId);
    }
    return docentesAprobadores.size;
  }

  get estaPendiente(): boolean {
    return this.estadoActual === 'pendiente';
  }

  esAutor(usuarioId: string): boolean {
    return this.autorId === usuarioId;
  }

  yaVoto(docenteId: string): boolean {
    return this.bitacora.some((moderacion) => moderacion.docenteId === docenteId);
  }

  /**
   * RN-13: registra un voto y resuelve el estado del agregado.
   *
   * Reglas:
   *  - un reto rechazado queda cerrado: no admite ninguna moderación más;
   *  - un reto ya aprobado y publicado no admite un voto de rechazo;
   *  - nadie modera su propio reto (PermisoDenegadoError);
   *  - cada docente vota una sola vez (ConflictoEstadoError);
   *  - el rechazo resuelve de inmediato; la aprobación publica al alcanzar 2 docentes distintos.
   *
   * La aprobación es idempotente: una aprobación extra se registra en la bitácora pero el
   * estado ya resuelto no retrocede ni se recalcula.
   */
  moderar(params: { docenteId: string; decision: 'aprobado' | 'rechazado'; fecha: string }): void {
    if (this.estadoActual === 'rechazado') {
      throw new ConflictoEstadoError(
        `El reto "${this.id}" ya fue rechazado y no admite más moderaciones.`
      );
    }
    if (this.estadoActual === 'aprobado' && params.decision === 'rechazado') {
      throw new ConflictoEstadoError(
        `El reto "${this.id}" ya fue aprobado y su publicación no puede revertirse.`
      );
    }
    if (this.esAutor(params.docenteId)) {
      throw new PermisoDenegadoError('Nadie puede moderar su propio reto comunitario.');
    }
    if (this.yaVoto(params.docenteId)) {
      throw new ConflictoEstadoError(
        `La o el docente ${params.docenteId} ya moderó el reto "${this.id}".`
      );
    }

    this.bitacora.push({
      docenteId: params.docenteId,
      decision: params.decision,
      fecha: params.fecha
    });

    if (params.decision === 'rechazado') {
      this.estadoActual = 'rechazado';
      return;
    }
    if (this.aprobaciones >= RetoComunitario.APROBACIONES_REQUERIDAS) {
      this.estadoActual = 'aprobado';
    }
  }

  toJSON(): DatosReto {
    return {
      id: this.id,
      autorId: this.autorId,
      nombreAutor: this.nombreAutor,
      textoQuechua: this.textoQuechua,
      traduccionSugerida: this.traduccionSugerida,
      pistaCultural: this.pistaCultural,
      nivelSugerido: this.nivelSugerido.valor,
      estado: this.estadoActual,
      fechaCreacion: this.fechaCreacion.toJSON(),
      moderaciones: this.moderaciones.map((moderacion) => ({ ...moderacion }))
    };
  }
}
