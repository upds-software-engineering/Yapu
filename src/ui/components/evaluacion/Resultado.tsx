import { CheckCircle, RotateCcw, Trophy, XCircle } from 'lucide-react';
import type { DetalleRespuestaDto, PalabraDto, ResultadoEvaluacionDto } from '@application/dto';
import { Boton, Insignia, Tarjeta } from '@ui/design-system';
import { ruta, rutaLeccion } from '@ui/lib/ruta';
import { Confeti } from './Confeti';
import { EnlaceCtaPrimario } from './PantallaNivelBloqueado';

/**
 * Resultado de la evaluación (RF-005).
 *
 * Apogeo-Final (BLOQUEANTE): la aprobación es el clímax del nivel, así que la pantalla celebra
 * (confeti si el sistema no pide movimiento reducido), muestra el porcentaje en `text-display` y
 * los XP ganados. Al reprobar NO deja al estudiante sin salida: el CTA primario lleva a la lección
 * filtrada por las palabras falladas (`rutaLeccion`) y el secundario reintenta el examen.
 *
 * Hick: exactamente un `data-cta="primario"`. Estética-Usabilidad: sólo `text-display`,
 * `text-body` y `text-caption` (tres tamaños, uno de ellos el porcentaje).
 */
export interface PropsResultado {
  resultado: ResultadoEvaluacionDto;
  /** Vuelve a generar la evaluación del mismo nivel (CTA secundario). */
  onReintentar: () => void;
}

/**
 * Etiquetas de los formatos de pregunta.
 *
 * La UI no puede importar `@domain` (regla de dependencias de la arquitectura hexagonal), así que
 * repite aquí las tres etiquetas que `DetalleRespuestaDto` ya no trae resueltas.
 */
const ETIQUETAS_TIPO: Record<string, string> = {
  completar_espacio: 'Completar la oración',
  traduccion_quechua: 'Quechua → Español',
  traduccion_espanol: 'Español → Quechua'
};

function etiquetaDeTipo(tipo: DetalleRespuestaDto['tipo']): string {
  return ETIQUETAS_TIPO[tipo] ?? 'Pregunta';
}

/** Fila de retroalimentación pedagógica de una pregunta rendida. */
function LineaDetalle({ linea, posicion }: { linea: DetalleRespuestaDto; posicion: number }) {
  return (
    <li className="flex items-start gap-3 p-4">
      {linea.esCorrecta ? (
        <CheckCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-exito" />
      ) : (
        <XCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-peligro" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-caption text-tinta-tenue">
          {`${posicion + 1}. ${etiquetaDeTipo(linea.tipo)}`}
        </p>

        <p className="text-body whitespace-pre-line text-tinta">{linea.enunciado}</p>

        <p className="text-body text-tinta-suave">{`Marcaste: ${linea.respuestaMarcada}`}</p>

        {!linea.esCorrecta && (
          <p className="text-body text-exito">{`Respuesta correcta: ${linea.opcionCorrecta}`}</p>
        )}

        <p className="text-body text-tinta-tenue">{linea.explicacion}</p>
      </div>
    </li>
  );
}

/** Palabra fallada con su término y su traducción (lo que se va a repasar). */
function PalabraFallada({ palabra }: { palabra: PalabraDto }) {
  return (
    <li>
      <Tarjeta className="flex items-center justify-between gap-3">
        <span className="text-body font-semibold text-tinta">{palabra.termino}</span>
        <span className="text-body text-tinta-suave">{palabra.traduccion}</span>
      </Tarjeta>
    </li>
  );
}

export function Resultado({ resultado, onReintentar }: PropsResultado) {
  const aprobado = resultado.aprobado;
  const falladas = resultado.palabrasFalladas;
  const puedeRepasar = !aprobado && falladas.length > 0;
  const reintentoEsPrimario = !aprobado && !puedeRepasar;
  const idsFalladas = falladas.map((palabra) => palabra.id);

  return (
    <div
      data-pantalla="resultado"
      data-resultado={aprobado ? 'aprobado' : 'reprobado'}
      className="mx-auto flex w-full max-w-[40rem] flex-col gap-4 px-4 py-4 pb-10"
    >
      {aprobado && <Confeti clave={resultado.evaluacionId} particleCount={140} />}

      <Tarjeta
        className={
          aprobado
            ? 'flex flex-col items-center gap-3 border-acento/60 text-center'
            : 'flex flex-col items-center gap-3 border-peligro/40 text-center'
        }
      >
        <Insignia tono={aprobado ? 'exito' : 'alerta'}>
          {aprobado ? '¡Kusikuy! Aprobaste' : 'Sigue practicando'}
        </Insignia>

        <p className="text-display font-bold text-tinta">{`${resultado.puntuacion}%`}</p>

        <p className="text-body text-tinta-suave">
          {`${resultado.aciertos} de ${resultado.totalPreguntas} respuestas correctas`}
        </p>

        <p className="text-body text-tinta">{resultado.mensaje}</p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Insignia tono="marca">{`+${resultado.xpGanado} XP`}</Insignia>
          <span className="text-caption text-tinta-tenue">XP ganado en esta evaluación</span>

          {aprobado && resultado.cursoCompletado && (
            <Insignia tono="exito">¡Curso completado!</Insignia>
          )}

          {aprobado && !resultado.cursoCompletado && resultado.nivelDesbloqueado !== null && (
            <Insignia tono="exito">
              {`¡Desbloqueaste el nivel ${resultado.nivelDesbloqueado}!`}
            </Insignia>
          )}
        </div>
      </Tarjeta>

      {aprobado && (
        <EnlaceCtaPrimario href={ruta('/')}>
          <Trophy aria-hidden="true" className="h-5 w-5" />
          Ver mi mapa de niveles
        </EnlaceCtaPrimario>
      )}

      {puedeRepasar && (
        <EnlaceCtaPrimario href={rutaLeccion(resultado.nivelId, idsFalladas)}>
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
          {`Repasar las ${falladas.length} palabras falladas`}
        </EnlaceCtaPrimario>
      )}

      {reintentoEsPrimario && (
        <Boton esCtaPrimario anchoCompleto onClick={onReintentar}>
          Reintentar la evaluación
        </Boton>
      )}

      {!reintentoEsPrimario && (
        <Boton variante="secundario" anchoCompleto onClick={onReintentar}>
          {aprobado ? 'Reintentar' : 'Reintentar la evaluación'}
        </Boton>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-caption font-semibold uppercase tracking-wide text-tinta-tenue">
          {`Retroalimentación pedagógica (${resultado.detalle.length} preguntas)`}
        </h2>

        <ul className="max-h-96 divide-y divide-linea overflow-y-auto rounded-2xl border border-linea bg-superficie/60">
          {resultado.detalle.map((linea, posicion) => (
            <LineaDetalle key={linea.preguntaId} linea={linea} posicion={posicion} />
          ))}
        </ul>
      </section>

      {falladas.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-caption font-semibold uppercase tracking-wide text-tinta-tenue">
            {`Palabras para repasar (${falladas.length})`}
          </h2>

          <ul className="flex flex-col gap-2">
            {falladas.map((palabra) => (
              <PalabraFallada key={palabra.id} palabra={palabra} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default Resultado;
