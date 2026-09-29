import type { RetoDto } from '@application/dto';
import type { RelojPort, RetoRepository, SesionPort } from '@application/ports';
import { RetoComunitario } from '@domain/contenido';
import { NoEncontradoError, PermisoDenegadoError } from '@domain/errores';

/**
 * RF-007 / RS-003 / RN-13: moderación de un reto comunitario por parte de una o un docente.
 *
 * El caso de uso comprueba el rol, recupera el agregado y delega la decisión en el método
 * `moderar` del agregado, que es quien conoce las reglas: nadie modera su propio reto,
 * cada docente vota una sola vez (`ConflictoEstadoError`), un rechazo cierra el reto y la segunda
 * aprobación de un docente distinto lo publica.
 */
export class ModerarRetoUseCase {
  constructor(
    private readonly retos: RetoRepository,
    private readonly sesion: SesionPort,
    private readonly reloj: RelojPort
  ) {}

  async ejecutar(entrada: {
    retoId: string;
    decision: 'aprobado' | 'rechazado';
  }): Promise<RetoDto> {
    const { rol, usuarioId } = await this.sesion.obtener();
    if (rol !== 'docente') {
      throw new PermisoDenegadoError('Sólo el rol docente puede moderar retos comunitarios (RF-007).');
    }

    const reto = await this.retos.obtener(entrada.retoId);
    if (!reto) {
      throw new NoEncontradoError(`El reto comunitario "${entrada.retoId}" no existe.`);
    }

    reto.moderar({
      docenteId: usuarioId,
      decision: entrada.decision,
      fecha: this.reloj.ahora().toISOString()
    });

    await this.retos.guardar(reto);

    return aRetoDtoLocal(reto, usuarioId);
  }
}

/**
 * Proyección local del agregado a DTO: `mappers.ts` es de otro módulo y puede no exponer
 * todavía un `aRetoDto`, así que cada caso de uso mantiene su propio mapeo privado.
 */
function aRetoDtoLocal(reto: RetoComunitario, usuarioId: string): RetoDto {
  return {
    id: reto.id,
    autorId: reto.autorId,
    nombreAutor: reto.nombreAutor,
    textoQuechua: reto.textoQuechua,
    traduccionSugerida: reto.traduccionSugerida,
    pistaCultural: reto.pistaCultural,
    nivelSugerido: reto.nivelSugerido.valor,
    estado: reto.estado,
    fechaCreacion: reto.fechaCreacion.toJSON(),
    moderaciones: reto.moderaciones.map((moderacion) => ({ ...moderacion })),
    aprobaciones: reto.aprobaciones,
    aprobacionesRequeridas: RetoComunitario.APROBACIONES_REQUERIDAS,
    votadoPorMi: reto.yaVoto(usuarioId),
    esMiAutoría: reto.esAutor(usuarioId)
  };
}
