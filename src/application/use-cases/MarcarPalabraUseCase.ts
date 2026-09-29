import type { ResultadoMarcarPalabraDto } from '@application/dto';
import type {
  CatalogoRepository,
  ProgresoRepository,
  RelojPort,
  SesionPort
} from '@application/ports';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { NoEncontradoError } from '@domain/errores';
import { FechaDia } from '@domain/value-objects/FechaDia';

/**
 * RF-004 — Marcar una palabra como aprendida o para repasar.
 *
 * RN-05: +2 XP sólo la primera vez que la palabra pasa a `aprendido` (idempotente).
 * RN-06: la actividad de hoy se registra con la fecha del reloj inyectado, nunca del sistema.
 * RN-08: el agregado es el único que decide, y aquí sólo se persiste el resultado.
 */
export class MarcarPalabraUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly sesion: SesionPort,
    private readonly reloj: RelojPort
  ) {}

  /** RF-004, RN-05, RN-06, RN-08. */
  async ejecutar(entrada: {
    palabraId: string;
    estado: 'aprendido' | 'repasar';
  }): Promise<ResultadoMarcarPalabraDto> {
    const { usuarioId } = await this.sesion.obtener();
    const progreso = (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    const palabra = await this.catalogo.obtenerPalabra(entrada.palabraId);
    if (palabra === null) {
      throw new NoEncontradoError(
        `La palabra "${entrada.palabraId}" no existe en el catálogo.`
      );
    }

    const hoy = FechaDia.desdeFecha(this.reloj.ahora());
    const resultado = progreso.marcarPalabra(palabra.id, entrada.estado, hoy);
    await this.progreso.guardar(progreso);

    return {
      palabraId: resultado.palabraId,
      estado: resultado.estado,
      xpGanado: resultado.xpGanado,
      palabrasAprendidas: resultado.palabrasAprendidas,
      rachaDias: progreso.rachaDias
    };
  }
}
