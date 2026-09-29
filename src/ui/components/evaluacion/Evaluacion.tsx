import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EvaluacionGeneradaDto, RespuestaDto, ResultadoEvaluacionDto } from '@application/dto';
import {
  BarraProgreso,
  Boton,
  EnvoltorioCtaFijo,
  EstadoCarga,
  Insignia,
  MensajeError
} from '@ui/design-system';
import { useServicios } from '@ui/hooks';
import { mensajeDeError } from '@ui/lib/mensajes';
import { ruta } from '@ui/lib/ruta';
import { EnlaceCtaPrimario, PantallaNivelBloqueado } from './PantallaNivelBloqueado';
import { Resultado } from './Resultado';
import { TarjetaPregunta } from './TarjetaPregunta';

/**
 * RF-005: pantalla de la evaluación determinista de un nivel.
 *
 * Orquesta el examen completo:
 *  - al montar genera la evaluación con `generarEvaluacion` (RF-005);
 *  - traduce los fallos de dominio a una pantalla con salida (RN-01, RN-10, borrador caducado);
 *  - guarda las respuestas en un `Record<preguntaId, opcion>` y permite navegar hacia atrás y
 *    cambiar la marca (RN-16) sin perder nada;
 *  - en la última pregunta califica con `calificarEvaluacion` y delega el cierre en `Resultado`.
 *
 * Hick: la pantalla tiene UN solo CTA primario (avanzar/calificar) dentro de `EnvoltorioCtaFijo`.
 * Estética-Usabilidad: sólo usa los tokens `text-caption`, `text-body` y `text-title` (el
 * `text-display` está reservado a la pantalla de resultado).
 */
export interface PropsEvaluacion {
  /** Nivel cuya evaluación se rinde. */
  nivelId: number;
}

/** Fallo de la generación o de la calificación, ya traducido a algo pintable. */
interface Fallo {
  codigo: string | null;
  mensaje: string;
  nivelActual: number | null;
}

/** Lee una propiedad del error sin asumir su forma: la UI no puede importar el dominio. */
function leerPropiedad(fallo: unknown, clave: string): unknown {
  if (typeof fallo !== 'object' || fallo === null) return undefined;
  return (fallo as Record<string, unknown>)[clave];
}

/** Normaliza cualquier fallo al contrato mínimo que necesita la pantalla. */
function aFallo(fallo: unknown): Fallo {
  const codigo = leerPropiedad(fallo, 'codigo');
  const nivelActual = leerPropiedad(fallo, 'nivelActual');

  return {
    codigo: typeof codigo === 'string' ? codigo : null,
    mensaje: mensajeDeError(fallo),
    nivelActual: typeof nivelActual === 'number' ? nivelActual : null
  };
}

const CLASES_PANTALLA = 'mx-auto flex w-full max-w-[40rem] flex-col gap-4 px-4 py-4';

export function Evaluacion({ nivelId }: PropsEvaluacion) {
  const { generarEvaluacion, calificarEvaluacion } = useServicios();

  const [evaluacion, setEvaluacion] = useState<EvaluacionGeneradaDto | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvaluacionDto | null>(null);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [calificando, setCalificando] = useState(false);

  const montado = useRef(true);
  /** Descarta respuestas obsoletas si el estudiante reintenta antes de que llegue la anterior. */
  const peticion = useRef(0);

  const limpiar = useCallback(() => {
    setEvaluacion(null);
    setResultado(null);
    setFallo(null);
    setIndice(0);
    setRespuestas({});
    setCalificando(false);
  }, []);

  /**
   * Genera la evaluación del nivel.
   *
   * No reinicia estado de forma síncrona: el reinicio vive en `reintentar` (manejador de evento),
   * porque tocar el estado dentro del cuerpo de un efecto provoca renders en cascada.
   */
  const generar = useCallback((): Promise<void> => {
    peticion.current += 1;
    const actual = peticion.current;

    return generarEvaluacion
      .ejecutar({ nivel: nivelId })
      .then((generada) => {
        if (!montado.current || peticion.current !== actual) return;
        setEvaluacion(generada);
      })
      .catch((error: unknown) => {
        if (!montado.current || peticion.current !== actual) return;
        setFallo(aFallo(error));
      });
  }, [generarEvaluacion, nivelId]);

  useEffect(() => {
    montado.current = true;
    void generar();

    return () => {
      montado.current = false;
    };
  }, [generar]);

  const calificar = useCallback(
    async (lista: readonly RespuestaDto[]) => {
      setCalificando(true);

      try {
        const salida = await calificarEvaluacion.ejecutar({ nivel: nivelId, respuestas: lista });
        if (!montado.current) return;
        setResultado(salida);
      } catch (error: unknown) {
        if (!montado.current) return;
        setFallo(aFallo(error));
      } finally {
        if (montado.current) setCalificando(false);
      }
    },
    [calificarEvaluacion, nivelId]
  );

  /** Reintenta el examen: limpia la pantalla y vuelve a generar la evaluación del nivel. */
  const reintentar = useCallback(() => {
    limpiar();
    void generar();
  }, [generar, limpiar]);

  if (fallo !== null) {
    // RN-01: el nivel está bloqueado → se explica y se ofrece el nivel actual del estudiante.
    if (fallo.codigo === 'NIVEL_BLOQUEADO') {
      return (
        <PantallaNivelBloqueado nivelId={nivelId} nivelActual={fallo.nivelActual ?? 1} />
      );
    }

    // RN-10 y borrador caducado: mensaje del caso de uso con una salida clara (Apogeo-Final).
    return (
      <div data-pantalla="evaluacion" className={CLASES_PANTALLA}>
        <MensajeError mensaje={fallo.mensaje} />
        {fallo.codigo === 'NO_ENCONTRADO' ? (
          <Boton esCtaPrimario anchoCompleto onClick={reintentar}>
            Generar una nueva evaluación
          </Boton>
        ) : (
          <EnlaceCtaPrimario href={ruta('/')}>Volver al mapa</EnlaceCtaPrimario>
        )}
      </div>
    );
  }

  const total = evaluacion?.preguntas.length ?? 0;
  const pregunta = evaluacion === null ? undefined : evaluacion.preguntas[indice];
  const marcada = pregunta === undefined ? undefined : respuestas[pregunta.id];
  const esUltima = total > 0 && indice === total - 1;
  const puedeAvanzar = typeof marcada === 'string' && marcada.length > 0;

  const marcar = (opcion: string) => {
    if (pregunta === undefined) return;
    const id = pregunta.id;
    setRespuestas((previas) => ({ ...previas, [id]: opcion }));
  };

  const retroceder = () => {
    setIndice((actual) => Math.max(actual - 1, 0));
  };

  const avanzar = () => {
    // RN-16: sin respuesta marcada no se avanza, aunque el botón se pulse por código.
    if (!puedeAvanzar || evaluacion === null) return;

    if (!esUltima) {
      setIndice((actual) => Math.min(actual + 1, total - 1));
      return;
    }

    const lista: RespuestaDto[] = evaluacion.preguntas.map((item) => ({
      preguntaId: item.id,
      opcion: respuestas[item.id] ?? ''
    }));

    void calificar(lista);
  };

  if (resultado !== null) {
    return <Resultado resultado={resultado} onReintentar={reintentar} />;
  }

  if (evaluacion === null || pregunta === undefined) {
    return (
      <div data-pantalla="evaluacion" className={CLASES_PANTALLA}>
        <EstadoCarga mensaje="Generando tu evaluación…" />
      </div>
    );
  }

  return (
    <div data-pantalla="evaluacion" className={CLASES_PANTALLA}>
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <a
            href={ruta('/')}
            className="inline-flex min-h-tactil min-w-tactil items-center justify-center gap-1 rounded-2xl border border-andina-night-border bg-andina-night-card px-3 text-caption font-semibold text-slate-300 transition-colors hover:bg-andina-night-muted/40"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Salir
          </a>

          <p className="text-caption font-semibold uppercase tracking-wide text-andina-gold">
            {`Pregunta ${indice + 1} de ${total}`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-caption text-slate-400">{evaluacion.tituloNivel}</p>
          <Insignia tono="alerta">{`${evaluacion.umbralAprobacion}% para aprobar`}</Insignia>
        </div>
      </header>

      <BarraProgreso
        valor={indice + 1}
        max={total}
        etiqueta="Avance de la evaluación"
      />

      <TarjetaPregunta
        pregunta={pregunta}
        indice={indice}
        opcionMarcada={marcada}
        onMarcar={marcar}
      />

      <EnvoltorioCtaFijo>
        <div className="flex w-full items-center gap-2">
          <Boton
            data-accion="anterior"
            variante="secundario"
            disabled={indice === 0}
            onClick={retroceder}
          >
            Anterior
          </Boton>

          <Boton
            data-accion="siguiente"
            variante="primario"
            esCtaPrimario
            anchoCompleto
            aria-disabled={!puedeAvanzar}
            disabled={!puedeAvanzar}
            cargando={calificando}
            onClick={avanzar}
          >
            {esUltima ? 'Calificar evaluación' : 'Siguiente'}
          </Boton>
        </div>
      </EnvoltorioCtaFijo>
    </div>
  );
}

export default Evaluacion;
