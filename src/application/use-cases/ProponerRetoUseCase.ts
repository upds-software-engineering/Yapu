import type { RetoDto } from '@application/dto';
import type {
  GeneradorIdPort,
  ProgresoRepository,
  RelojPort,
  RetoRepository,
  SesionPort
} from '@application/ports';
import { RetoComunitario } from '@domain/contenido';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';

/** RF-007: datos que aporta quien propone un reto comunitario. */
export interface EntradaReto {
  textoQuechua: string;
  traduccionSugerida: string;
  pistaCultural?: string;
  nivelSugerido: number;
}

/**
 * RF-007 / RN-13: propuesta de un reto comunitario.
 *
 * El caso de uso reúne el contexto que exige el agregado (rol y nivel actual del estudiante) y
 * delega la decisión en `RetoComunitario.proponer`: si el rol no es `estudiante` o el nivel es
 * inferior a 7, el dominio lanza `PermisoDenegadoError` y aquí se deja escapar tal cual.
 *
 * Toda propuesta nace `pendiente` y sin bitácora: publicarla exige dos aprobaciones de docentes
 * distintos, que se gestionan en `ModerarRetoUseCase`.
 */
export class ProponerRetoUseCase {
  constructor(
    private readonly retos: RetoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly sesion: SesionPort,
    private readonly reloj: RelojPort,
    private readonly generadorId: GeneradorIdPort
  ) {}

  async ejecutar(entrada: EntradaReto): Promise<RetoDto> {
    const { rol, usuarioId, nombre } = await this.sesion.obtener();

    // Un estudiante sin progreso guardado es un perfil nuevo (nivel 1) y no puede proponer.
    const progreso = (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    const reto = RetoComunitario.proponer(
      {
        id: this.generadorId.generar(),
        autorId: usuarioId,
        nombreAutor: nombre,
        textoQuechua: entrada.textoQuechua,
        traduccionSugerida: entrada.traduccionSugerida,
        pistaCultural: entrada.pistaCultural,
        nivelSugerido: entrada.nivelSugerido,
        fechaCreacion: this.reloj.ahora().toISOString()
      },
      { rol, nivelActual: progreso.nivelActual.valor }
    );

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
