import type { EvaluacionResumenDto, PalabraDto, TableroDto } from '@application/dto';
import type {
  CatalogoRepository,
  EvaluacionRepository,
  ProgresoRepository,
  SesionPort
} from '@application/ports';
import type { Palabra } from '@domain/aprendizaje/Palabra';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import type { Evaluacion } from '@domain/evaluacion/Evaluacion';
import { aEvaluacionResumenDto, aPalabraDto } from './mappers';

/** RN-08: el tablero muestra como mucho las 10 palabras pendientes de repaso más recientes. */
const MAXIMO_PALABRAS_PARA_REPASAR = 10;

/** RF-008: el historial se recorta a las 10 evaluaciones más recientes. */
const MAXIMO_EVALUACIONES_EN_HISTORIAL = 10;

/**
 * RF-008 — Tablero del estudiante (panel de progreso).
 *
 * Resume el avance del curso (RN-03, RN-06), las palabras que quedaron en `repasar` (RN-08) y el
 * historial de evaluaciones (RN-15). Como todos los casos de uso de lectura, no escribe nada: un
 * perfil sin progreso guardado se muestra limpio (RN-07).
 */
export class ObtenerTableroUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly evaluaciones: EvaluacionRepository,
    private readonly sesion: SesionPort
  ) {}

  /** RF-008, RN-03, RN-06. */
  async ejecutar(): Promise<TableroDto> {
    const { usuarioId } = await this.sesion.obtener();
    const progreso = (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    const [palabras, evaluaciones] = await Promise.all([
      this.catalogo.listarPalabras(),
      this.evaluaciones.listarPorEstudiante(usuarioId)
    ]);

    return {
      estudianteId: progreso.estudianteId,
      nivelActual: progreso.nivelActual.valor,
      cursoCompletado: progreso.cursoCompletado,
      porcentajeGlobal: progreso.porcentajeGlobal.valor,
      nivelesAprobados: progreso.nivelesAprobados.length,
      xp: progreso.xp,
      rachaDias: progreso.rachaDias,
      palabrasAprendidas: progreso.palabrasAprendidas,
      palabrasParaRepasar: seleccionarPalabrasParaRepasar(palabras, progreso),
      historial: construirHistorial(evaluaciones)
    };
  }
}

/**
 * RN-08: palabras del catálogo cuyo registro está en `repasar`, de la repasada más reciente a la
 * más antigua y como máximo diez.
 */
function seleccionarPalabrasParaRepasar(
  palabras: readonly Palabra[],
  progreso: ProgresoEstudiante
): PalabraDto[] {
  const enRepaso: Array<{ palabra: Palabra; fechaUltimoRepaso: string }> = [];

  for (const palabra of palabras) {
    const registro = progreso.obtenerRegistro(palabra.id);
    if (registro?.estado === 'repasar') {
      enRepaso.push({ palabra, fechaUltimoRepaso: registro.fechaUltimoRepaso });
    }
  }

  return enRepaso
    .sort((a, b) => b.fechaUltimoRepaso.localeCompare(a.fechaUltimoRepaso))
    .slice(0, MAXIMO_PALABRAS_PARA_REPASAR)
    .map((item) => aPalabraDto(item.palabra, 'repasar'));
}

/** RN-15: historial de evaluaciones de la más reciente a la más antigua, limitado a diez. */
function construirHistorial(evaluaciones: readonly Evaluacion[]): EvaluacionResumenDto[] {
  return evaluaciones
    .map((evaluacion) => aEvaluacionResumenDto(evaluacion))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, MAXIMO_EVALUACIONES_EN_HISTORIAL);
}
