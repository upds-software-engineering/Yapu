import type {
  AleatorioPort,
  BorradorEvaluacionPort,
  CatalogoRepository,
  GeneradorIdPort,
  OracionRepository,
  ProgresoRepository,
  RelojPort,
  SesionPort
} from '@application/ports';
import type { EvaluacionGeneradaDto, PreguntaDto } from '@application/dto';
import { GeneradorEvaluacion, PoliticaAprobacion, type Pregunta } from '@domain/evaluacion';
import { ProgresoEstudiante } from '@domain/aprendizaje/ProgresoEstudiante';
import { ETIQUETAS_TIPO_PREGUNTA } from '@domain/shared/tipos';
import { NivelId } from '@domain/value-objects';

/**
 * RF-005 / RN-01 / RN-09 / RN-10 / RN-11: genera la evaluación de un nivel.
 *
 * Responsabilidades del caso de uso (la lógica pedagógica vive en el dominio):
 *  1. resolver al estudiante desde `SesionPort` y su progreso (RN-01);
 *  2. comprobar el acceso al nivel solicitado ANTES de tocar nada (RN-01);
 *  3. reunir el corpus: TODAS las palabras como pool de distractores y las oraciones aprobadas
 *     del nivel (RN-11, RN-12);
 *  4. delegar la generación en `GeneradorEvaluacion` (RN-09, RN-10) y dejar escapar
 *     `ContenidoInsuficienteError` tal cual;
 *  5. guardar el borrador con la opción correcta y devolver a la UI preguntas SIN ella.
 *
 * El borrador nunca sale de la aplicación: `PreguntaDto` no incluye la respuesta correcta.
 */
export class GenerarEvaluacionUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly oraciones: OracionRepository,
    private readonly progreso: ProgresoRepository,
    private readonly sesion: SesionPort,
    private readonly aleatorio: AleatorioPort,
    private readonly generadorId: GeneradorIdPort,
    private readonly borrador: BorradorEvaluacionPort,
    private readonly reloj: RelojPort
  ) {}

  async ejecutar(entrada: { nivel: number }): Promise<EvaluacionGeneradaDto> {
    const nivel = NivelId.crear(entrada.nivel);
    const { usuarioId } = await this.sesion.obtener();

    // RN-07: un estudiante sin progreso guardado arranca en el nivel 1.
    const progreso =
      (await this.progreso.obtener(usuarioId)) ?? ProgresoEstudiante.nuevo(usuarioId);

    // RN-01: si el nivel está bloqueado se lanza `NivelBloqueadoError` y no se guarda NADA.
    progreso.asegurarAccesoANivel(nivel);

    // El generador necesita el vocabulario completo: las palabras de otros niveles son
    // distractores plausibles; las oraciones, en cambio, sólo del nivel evaluado (RN-11).
    const palabras = await this.catalogo.listarPalabras();
    const oracionesNivel = await this.oraciones.listarAprobadasPorNivel(nivel.valor);

    const generador = new GeneradorEvaluacion(
      palabras,
      oracionesNivel,
      this.aleatorio,
      this.generadorId
    );

    // RN-10: deja escapar `ContenidoInsuficienteError` si el nivel no reúne 5 preguntas válidas.
    const preguntas = generador.generar(nivel);

    // El borrador es la única copia con la opción correcta: se queda en la capa de aplicación.
    this.borrador.guardar({
      nivelId: nivel.valor,
      preguntas,
      generadoEn: this.reloj.ahora().toISOString()
    });

    const totalPreguntas = preguntas.length;

    return {
      nivelId: nivel.valor,
      tituloNivel: await this.tituloDelNivel(nivel.valor),
      preguntas: preguntas.map((pregunta) => this.aPreguntaDto(pregunta)),
      totalPreguntas,
      objetivoPreguntas: GeneradorEvaluacion.PREGUNTAS_OBJETIVO,
      umbralAprobacion: PoliticaAprobacion.UMBRAL
    };
  }

  /** Título del nivel para la cabecera del examen; si el catálogo no lo tiene, no se rompe la UI. */
  private async tituloDelNivel(nivelId: number): Promise<string> {
    const nivel = await this.catalogo.obtenerNivel(nivelId);
    return nivel === null ? `Nivel ${nivelId}` : nivel.tituloQuechua;
  }

  /** RF-005: DTO de pregunta SIN `opcionCorrecta` ni `palabraId` (no viajan al cliente). */
  private aPreguntaDto(pregunta: Pregunta): PreguntaDto {
    return {
      id: pregunta.id,
      tipo: pregunta.tipo,
      etiquetaTipo: ETIQUETAS_TIPO_PREGUNTA[pregunta.tipo],
      enunciado: pregunta.enunciado,
      opciones: [...pregunta.opciones],
      explicacion: pregunta.explicacion,
      nivelId: pregunta.nivelId.valor
    };
  }
}
