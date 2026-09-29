import type {
  BorradorEvaluacionPort,
  CatalogoRepository,
  EvaluacionRepository,
  GeneradorIdPort,
  ProgresoRepository,
  RelojPort,
  SesionPort
} from '@application/ports';
import type { DetalleRespuestaDto, PalabraDto, ResultadoEvaluacionDto, RespuestaDto } from '@application/dto';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { Calificador, Evaluacion, PoliticaAprobacion, Pregunta } from '@domain/evaluacion';
import type { DatosPregunta } from '@domain/evaluacion/Pregunta';
import { NoEncontradoError } from '@domain/errores';
import { FechaDia, NivelId } from '@domain/value-objects';
import { aPalabraDto } from './mappers';

/**
 * RF-005 / RN-02 / RN-04 / RN-05 / RN-06 / RN-15 / RN-17: califica una evaluación rendida.
 *
 * Flujo:
 *  1. recuperar el borrador generado (fuente única de la opción correcta) o fallar con
 *     `NoEncontradoError`;
 *  2. calificar con `Calificador` (RN-04) — nunca se confía en datos que vuelven del cliente;
 *  3. registrar la evaluación con el id del `GeneradorIdPort` (RN-17) y `sincronizada = false`
 *     (RN-15);
 *  4. aplicar el resultado al progreso: desbloqueo (RN-02), XP (RN-05) y racha (RN-06);
 *  5. limpiar el borrador (una evaluación se rinde una sola vez) y redactar el mensaje.
 */
export class CalificarEvaluacionUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly progreso: ProgresoRepository,
    private readonly evaluaciones: EvaluacionRepository,
    private readonly sesion: SesionPort,
    private readonly reloj: RelojPort,
    private readonly generadorId: GeneradorIdPort,
    private readonly borrador: BorradorEvaluacionPort
  ) {}

  async ejecutar(entrada: {
    nivel: number;
    respuestas: readonly RespuestaDto[];
  }): Promise<ResultadoEvaluacionDto> {
    const nivel = NivelId.crear(entrada.nivel);
    const { usuarioId } = await this.sesion.obtener();

    // Sin borrador no hay opciones correctas verificables: el examen caducó o ya se calificó.
    const borrador = this.borrador.obtener(nivel.valor);
    if (!borrador) {
      throw new NoEncontradoError('La evaluación ya no está disponible. Vuelve a generarla.');
    }

    const progreso =
      (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    // RN-04: calificación determinista contra las preguntas originales.
    const resultado = Calificador.calificar(this.rehidratarPreguntas(borrador.preguntas), entrada.respuestas);
    const puntuacion = resultado.puntuacion.valor;
    const ahora = this.reloj.ahora();

    // RN-15: toda evaluación nace en la cola offline (`sincronizada = false`).
    // RN-17: el id lo aporta el `GeneradorIdPort`, nunca una marca de tiempo.
    const evaluacion = Evaluacion.registrar({
      id: this.generadorId.generar(),
      estudianteId: usuarioId,
      nivel,
      puntuacion: resultado.puntuacion,
      aciertos: resultado.aciertos,
      totalPreguntas: resultado.total,
      fechaIso: ahora.toISOString()
    });
    await this.evaluaciones.guardar(evaluacion);

    // RN-02 / RN-05 / RN-06: desbloqueo secuencial, XP idempotente y racha del día.
    const hoy = FechaDia.desdeFecha(ahora);
    const aplicado = progreso.aplicarResultadoEvaluacion(nivel, resultado.aprobado, hoy);
    await this.progreso.guardar(progreso);

    // El borrador se consume: volver a calificar el mismo examen ya no es posible.
    this.borrador.limpiar(nivel.valor);

    const palabrasFalladas = await this.reunirPalabrasFalladas(resultado.detalle, progreso);
    const detalle: DetalleRespuestaDto[] = resultado.detalle.map((linea) => ({
      preguntaId: linea.pregunta.id,
      enunciado: linea.pregunta.enunciado,
      tipo: linea.pregunta.tipo,
      opcionCorrecta: linea.opcionCorrecta,
      respuestaMarcada: linea.respuestaMarcada,
      esCorrecta: linea.esCorrecta,
      explicacion: linea.pregunta.explicacion,
      palabraId: linea.palabraId
    }));

    return {
      evaluacionId: evaluacion.id,
      nivelId: nivel.valor,
      puntuacion,
      aciertos: resultado.aciertos,
      totalPreguntas: resultado.total,
      aprobado: resultado.aprobado,
      umbralAprobacion: PoliticaAprobacion.UMBRAL,
      xpGanado: aplicado.xpGanado,
      nivelDesbloqueado: aplicado.desbloqueado,
      cursoCompletado: aplicado.cursoCompletado,
      nivelActual: aplicado.nivelActual.valor,
      rachaDias: progreso.rachaDias,
      porcentajeGlobal: progreso.porcentajeGlobal.valor,
      palabrasFalladas,
      detalle,
      mensaje: this.redactarMensaje(resultado.aprobado, puntuacion, palabrasFalladas.length, aplicado)
    };
  }

  /**
   * El borrador viaja en su forma serializada (`DatosPregunta`), así que al recuperarlo hay datos
   * planos y no entidades. Se reconstruyen con `Pregunta.crear` —el alta validada del dominio—
   * para que el calificador reciba entidades con su comportamiento (`esCorrecta`, normalización de
   * opciones) y se vuelvan a comprobar las invariantes de RN-09.
   *
   * Si el puerto ya devolviese entidades (otro adaptador), se respetan tal cual.
   */
  private rehidratarPreguntas(preguntas: readonly Pregunta[]): Pregunta[] {
    return preguntas.map((pregunta) => Pregunta.crear(this.aDatosPregunta(pregunta)));
  }

  /** Forma serializada de una pregunta, venga ya como datos planos o como entidad de dominio. */
  private aDatosPregunta(pregunta: Pregunta): DatosPregunta {
    if (typeof pregunta.toJSON === 'function') return pregunta.toJSON();

    const plana = pregunta as unknown as Omit<DatosPregunta, 'nivelId'> & {
      nivelId: number | NivelId;
    };
    return {
      id: plana.id,
      tipo: plana.tipo,
      enunciado: plana.enunciado,
      opcionCorrecta: plana.opcionCorrecta,
      opciones: plana.opciones,
      explicacion: plana.explicacion,
      nivelId: typeof plana.nivelId === 'number' ? plana.nivelId : plana.nivelId.valor,
      palabraId: plana.palabraId
    };
  }

  /**
   * Apogeo-Final: las palabras que el estudiante falló, sin repetir (una palabra puede evaluarse
   * con varios formatos de pregunta, RN-09) y con su estado de aprendizaje actual.
   */
  private async reunirPalabrasFalladas(
    detalle: readonly { esCorrecta: boolean; palabraId: string }[],
    progreso: ProgresoEstudiante
  ): Promise<PalabraDto[]> {
    const idsFallados = new Set<string>();
    for (const linea of detalle) {
      if (!linea.esCorrecta) idsFallados.add(linea.palabraId);
    }

    const palabras: PalabraDto[] = [];
    for (const palabraId of idsFallados) {
      const palabra = await this.catalogo.obtenerPalabra(palabraId);
      // Si el catálogo ya no sirve esa palabra (corpus actualizado) simplemente no se lista.
      if (palabra === null) continue;
      palabras.push(aPalabraDto(palabra, progreso.obtenerRegistro(palabra.id)?.estado ?? 'nuevo'));
    }
    return palabras;
  }

  /**
   * Mensaje de resultado en español.
   *
   * RN-03: el nivel 10 es el último del curso; aprobarlo NUNCA produce "nivel 11".
   */
  private redactarMensaje(
    aprobado: boolean,
    puntuacion: number,
    palabrasFalladas: number,
    aplicado: {
      desbloqueado: number | null;
      cursoCompletado: boolean;
    }
  ): string {
    if (aprobado) {
      if (aplicado.cursoCompletado) {
        return '¡Curso completado! Dominaste los 10 niveles de runasimi.';
      }
      if (aplicado.desbloqueado !== null) {
        return `¡Kusikuy! Aprobaste con ${puntuacion}% y desbloqueaste el nivel ${aplicado.desbloqueado}.`;
      }
      return `¡Aprobaste con ${puntuacion}%! Puedes repasar o avanzar al siguiente nivel disponible.`;
    }

    return `Obtuviste ${puntuacion}%. Necesitas al menos ${PoliticaAprobacion.UMBRAL}% para avanzar: repasa las ${palabrasFalladas} palabras falladas y vuelve a intentarlo.`;
  }
}
