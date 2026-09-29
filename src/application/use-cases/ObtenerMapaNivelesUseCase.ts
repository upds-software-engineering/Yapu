import type { EstadoNivelDto, MapaNivelesDto, NivelDto, TramoDto } from '@application/dto';
import type { CatalogoRepository, ProgresoRepository, SesionPort } from '@application/ports';
import type { Nivel } from '@domain/aprendizaje/Nivel';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { TRAMOS } from '@domain/shared/tipos';
import { aNivelDto } from './mappers';

/**
 * RF-003 — Mapa de niveles (el "camino" del curso).
 *
 * Devuelve los 10 niveles agrupados en los 3 tramos pedagógicos (Miller) con el estado de cada
 * uno según el progreso del estudiante. El mapa es SÓLO lectura: abrir la aplicación nunca
 * escribe nada, y un perfil sin progreso guardado se lee como perfil nuevo (RN-07).
 */
export class ObtenerMapaNivelesUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly sesion: SesionPort
  ) {}

  /** RF-003, RN-01, RN-03. */
  async ejecutar(): Promise<MapaNivelesDto> {
    const { usuarioId } = await this.sesion.obtener();
    const progreso = (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    const [niveles, palabras] = await Promise.all([
      this.catalogo.listarNiveles(),
      this.catalogo.listarPalabras()
    ]);

    const palabrasPorNivel = new Map<number, number>();
    for (const palabra of palabras) {
      const nivelId = palabra.nivelId.valor;
      palabrasPorNivel.set(nivelId, (palabrasPorNivel.get(nivelId) ?? 0) + 1);
    }

    const nivelesDto = [...niveles]
      .sort((a, b) => a.numero - b.numero)
      .map((nivel) =>
        aNivelDto(nivel, this.estadoDeNivel(nivel, progreso), palabrasPorNivel.get(nivel.numero) ?? 0)
      );

    return {
      nivelActual: progreso.nivelActual.valor,
      cursoCompletado: progreso.cursoCompletado,
      porcentajeGlobal: progreso.porcentajeGlobal.valor,
      nivelesAprobados: progreso.nivelesAprobados.length,
      xp: progreso.xp,
      rachaDias: progreso.rachaDias,
      tramos: this.agruparEnTramos(nivelesDto)
    };
  }

  /**
   * RN-01 / RN-02 / RN-03: aprobado, actual o bloqueado.
   *
   * El nivel actual es el primero sin aprobar; todo lo posterior está bloqueado y todo lo anterior
   * (aprobado o no) sigue siendo navegable.
   */
  private estadoDeNivel(nivel: Nivel, progreso: ProgresoEstudiante): EstadoNivelDto {
    if (progreso.esNivelAprobado(nivel.id)) return 'aprobado';
    if (nivel.numero === progreso.nivelActual.valor) return 'actual';
    return 'bloqueado';
  }

  /** Miller: los 10 niveles agrupados en 3 tramos (1–3, 4–7 y 8–10). */
  private agruparEnTramos(niveles: readonly NivelDto[]): TramoDto[] {
    return TRAMOS.map((tramo) => ({
      id: tramo.id,
      nombre: tramo.nombre,
      rango: tramo.rango,
      descripcion: tramo.descripcion,
      niveles: niveles.filter((nivel) => nivel.tramo === tramo.id)
    }));
  }
}
