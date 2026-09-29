import type { ListaRetosDto, PermisoRetoDto, RetoDto } from '@application/dto';
import type { ProgresoRepository, RetoRepository, SesionPort } from '@application/ports';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { RetoComunitario } from '@domain/contenido';
import type { RolUsuario } from '@domain/shared/tipos';

/**
 * RF-007: listado de retos comunitarios con el permiso de propuesta de quien consulta.
 *
 * Dos vistas en una:
 *  - docente: recibe TODOS los retos (aprobados, pendientes y rechazados) para poder moderarlos;
 *  - estudiante: recibe únicamente los `aprobado`, porque un reto pendiente aún no es contenido
 *    publicado (RN-13).
 *
 * El permiso viaja en el mismo DTO para que la interfaz pueda deshabilitar el formulario de
 * propuesta y explicar el motivo en español sin duplicar reglas de negocio.
 */
export class ListarRetosUseCase {
  constructor(
    private readonly retos: RetoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly sesion: SesionPort
  ) {}

  async ejecutar(): Promise<ListaRetosDto> {
    const { rol, usuarioId } = await this.sesion.obtener();
    const progreso = (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);
    const nivelActual = progreso.nivelActual.valor;

    const permiso: PermisoRetoDto = {
      puedeProponer: RetoComunitario.puedeProponer(rol, nivelActual),
      nivelActual,
      nivelRequerido: RetoComunitario.NIVEL_MINIMO_PROPONER,
      motivo: motivoDePropuesta(rol, nivelActual)
    };

    const todos = await this.retos.listar();
    const visibles = rol === 'docente' ? todos : todos.filter((reto) => reto.estado === 'aprobado');

    return {
      retos: visibles.map((reto) => aRetoDtoLocal(reto, usuarioId)),
      permiso
    };
  }
}

/** Explica en español por qué la sesión actual puede o no proponer retos (RF-007 / RN-13). */
function motivoDePropuesta(rol: RolUsuario, nivelActual: number): string {
  if (RetoComunitario.puedeProponer(rol, nivelActual)) {
    return `Ya puedes proponer retos comunitarios: estás en el nivel ${nivelActual}.`;
  }
  if (rol !== 'estudiante') {
    return 'Sólo las y los estudiantes pueden proponer retos comunitarios.';
  }
  return `Para proponer retos comunitarios necesitas el nivel ${RetoComunitario.NIVEL_MINIMO_PROPONER}; tu nivel actual es ${nivelActual}.`;
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
