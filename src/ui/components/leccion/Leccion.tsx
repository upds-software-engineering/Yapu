import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LeccionDto, PalabraDto } from '@application/dto/aprendizaje';
import {
  BarraProgreso,
  Boton,
  EnvoltorioCtaFijo,
  EstadoCarga,
  EstadoVacio,
  Insignia,
  MensajeError,
  Tarjeta
} from '@ui/design-system';
import { useCasoDeUso, usePreferenciaReducida, useServicios } from '@ui/hooks';
import { ruta, rutaLeccion } from '@ui/lib/ruta';
import { CierreLeccion } from './CierreLeccion';
import { Flashcard } from './Flashcard';

export interface PropsLeccion {
  /** Nivel que se practica (1..10). */
  nivelId: number;
  /** Apogeo-Final: si el estudiante viene de reprobar, la lección se filtra a esas palabras. */
  palabrasFalladas?: readonly string[];
}

/** RF-004: retardo del auto-avance tras marcar, para que el estudiante vea la confirmación. */
const MS_AUTO_AVANCE = 250;

/** Entrada del caso de uso de lección. */
type EntradaLeccion = { nivel: number; palabrasFalladas?: readonly string[] };

/** Teclas cuyo comportamiento nativo (escribir, elegir, mover el cursor) nunca se intercepta. */
const ETIQUETAS_ESCRITURA = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

/** ¿El foco está dentro de un control de escritura? Entonces las flechas son suyas. */
function esControlDeEscritura(objetivo: EventTarget | null): boolean {
  if (!(objetivo instanceof HTMLElement)) return false;
  return ETIQUETAS_ESCRITURA.has(objetivo.tagName) || objetivo.isContentEditable;
}

/**
 * `useCasoDeUso` entrega el error ya traducido a texto, así que el nivel actual se lee del propio
 * mensaje del dominio (`… primero aprueba el nivel 3.`). Si ese texto cambiara, el destino sigue
 * siendo válido porque el respaldo es el mapa de niveles.
 */
function nivelActualDelMensaje(mensaje: string): number | null {
  const coincidencia = /nivel\s+(\d{1,2})/i.exec(mensaje);
  const valor = coincidencia?.[1];
  if (valor === undefined) return null;
  const numero = Number.parseInt(valor, 10);
  return Number.isInteger(numero) && numero >= 1 && numero <= 10 ? numero : null;
}

/** Traduce cualquier fallo de marcado a un mensaje en español, sin jerga técnica. */
function mensajeDeFallo(fallo: unknown): string {
  const mensaje = fallo instanceof Error ? fallo.message.trim() : '';
  return mensaje.length > 0 ? mensaje : 'No pudimos guardar tu marca. Inténtalo otra vez.';
}

/** CTA primario escrito a mano: el design system todavía no expone un `EnlaceBoton`. */
const CLASES_CTA = [
  'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2',
  'text-body font-semibold text-white transition-colors duration-200',
  'bg-andina-terracotta shadow-lg shadow-andina-terracotta/25',
  'hover:bg-andina-terracotta-hover active:bg-andina-terracotta-dark',
  'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold'
].join(' ');

/** Botón de marcado escrito a mano porque necesita un color propio (`emerald`/`slate`). */
const CLASES_MARCADO = [
  'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2',
  'text-body font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
  'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold'
].join(' ');

/** RN-01: todo lo que puede pasar al pedir una lección. */
type EstadoLeccion =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'bloqueado'; mensaje: string; destino: string }
  | { tipo: 'vacia'; mensaje: string }
  | { tipo: 'lista'; leccion: LeccionDto };

/** Resume la pantalla a partir del caso de uso: una sola rama de render por caso. */
function describirEstado({
  leccion,
  error,
  nivelId
}: {
  leccion: LeccionDto | null;
  error: string | null;
  nivelId: number;
}): EstadoLeccion {
  if (error !== null) {
    if (/bloqueado/i.test(error)) {
      const nivelActual = nivelActualDelMensaje(error);
      return {
        tipo: 'bloqueado',
        mensaje: error,
        destino: nivelActual === null ? ruta('/') : rutaLeccion(nivelActual)
      };
    }
    return { tipo: 'error', mensaje: error };
  }

  if (leccion === null) return { tipo: 'cargando' };

  if (leccion.palabras.length === 0) {
    return { tipo: 'vacia', mensaje: `El nivel ${nivelId} todavía no tiene palabras publicadas.` };
  }

  return { tipo: 'lista', leccion };
}

/**
 * RF-004 — Pantalla de lección con flashcards.
 *
 * Este componente sólo resuelve la carga y sus estados límite (cargando, error, nivel bloqueado,
 * nivel sin palabras). El recorrido interactivo vive en `ContenidoLeccion`, que se monta ÚNICAMENTE
 * cuando la lección llegó: así el contador de aprendidas y el temporizador de auto-avance nacen y
 * mueren con cada lección, sin efectos que sincronicen estado (React: «you might not need an
 * effect») y sin fugas de temporizadores.
 *
 * Fitts (BLOQUEANTE): la flashcard y todos los controles respetan 44×44 px.
 * Estética-Usabilidad: sólo se usan los tokens `text-caption|body|title|display`.
 */
export function Leccion({ nivelId, palabrasFalladas }: PropsLeccion) {
  const servicios = useServicios();

  const { datos, error, ejecutar } = useCasoDeUso<LeccionDto, [EntradaLeccion]>(
    async (entrada: EntradaLeccion) => servicios.leccion.ejecutar(entrada),
    { ejecutarAlMontar: [{ nivel: nivelId, palabrasFalladas }] }
  );

  const estado = describirEstado({ leccion: datos, error, nivelId });

  if (estado.tipo === 'cargando') {
    return (
      <div data-pantalla="leccion" className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        <EstadoCarga mensaje="Preparando tus flashcards…" />
      </div>
    );
  }

  if (estado.tipo === 'bloqueado') {
    return (
      <div
        data-pantalla="nivel-bloqueado"
        className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6"
      >
        <Tarjeta className="flex flex-col items-center gap-3 text-center">
          <Insignia tono="alerta">Nivel bloqueado</Insignia>
          <h1 className="text-title font-display font-bold text-sand">
            Todavía no puedes entrar aquí
          </h1>
          <p className="text-body text-slate-300">{estado.mensaje}</p>
          <p className="text-body text-slate-400">
            Sigue practicando tu nivel actual: este se abrirá solo cuando lo apruebes.
          </p>
          <a href={estado.destino} data-cta="primario" className={CLASES_CTA}>
            Ir a mi nivel actual
          </a>
        </Tarjeta>
      </div>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <div data-pantalla="leccion" className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        <MensajeError
          mensaje={estado.mensaje}
          onReintentar={() => void ejecutar({ nivel: nivelId, palabrasFalladas })}
        />
      </div>
    );
  }

  if (estado.tipo === 'vacia') {
    return (
      <div data-pantalla="leccion" className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        <EstadoVacio titulo="Este nivel aún no tiene palabras" descripcion={estado.mensaje}>
          <Boton
            variante="secundario"
            onClick={() => void ejecutar({ nivel: nivelId, palabrasFalladas })}
          >
            Volver a intentar
          </Boton>
        </EstadoVacio>
      </div>
    );
  }

  return <ContenidoLeccion leccion={estado.leccion} />;
}

export interface PropsContenidoLeccion {
  /** Lección ya cargada: sólo se monta con datos válidos. */
  leccion: LeccionDto;
}

/**
 * Recorrido interactivo de la lección: una tarjeta a la vez, con marcado y cierre.
 *
 * Apogeo-Final: al pedir `siguiente` en la última tarjeta (o al marcarla) aparece `CierreLeccion`
 * con el resumen y el paso a la evaluación.
 * Accesibilidad: `Enter`/`Espacio` voltean la tarjeta de forma nativa y `ArrowLeft`/`ArrowRight`
 * navegan entre tarjetas, rindiéndose ante cualquier control de escritura.
 */
export function ContenidoLeccion({ leccion }: PropsContenidoLeccion) {
  const servicios = useServicios();
  const movimientoReducido = usePreferenciaReducida();

  const [indice, setIndice] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const [enCierre, setEnCierre] = useState(false);
  const [aprendidas, setAprendidas] = useState(leccion.aprendidas);
  const [xpGanado, setXpGanado] = useState(0);
  const [rachaDias, setRachaDias] = useState(0);
  const [marcando, setMarcando] = useState(false);
  const [errorMarcado, setErrorMarcado] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const palabras: readonly PalabraDto[] = leccion.palabras;
  const total = palabras.length;
  const palabraActual = palabras[indice];
  const esUltima = indice >= total - 1;
  const yaAprendidas = palabras.some((palabra) => palabra.estado === 'aprendido');

  /** Auto-avance: el temporizador se cancela siempre al desmontar. */
  const cancelarTemporizador = useCallback(() => {
    if (temporizador.current !== null) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  }, []);

  useEffect(() => cancelarTemporizador, [cancelarTemporizador]);

  const abrirCierre = useCallback(() => {
    cancelarTemporizador();
    setEnCierre(true);
  }, [cancelarTemporizador]);

  const irA = useCallback(
    (destino: number) => {
      cancelarTemporizador();
      setIndice(destino);
      setVolteada(false);
    },
    [cancelarTemporizador]
  );

  const irAnterior = useCallback(() => {
    cancelarTemporizador();
    setIndice((actual) => {
      const destino = Math.max(actual - 1, 0);
      if (destino !== actual) setVolteada(false);
      return destino;
    });
  }, [cancelarTemporizador]);

  const irSiguiente = useCallback(() => {
    if (esUltima) {
      // Apogeo-Final: no queda tarjeta siguiente, así que la lección cierra con su resumen.
      abrirCierre();
      return;
    }
    irA(indice + 1);
  }, [abrirCierre, esUltima, indice, irA]);

  const marcar = useCallback(
    async (estado: 'aprendido' | 'repasar') => {
      if (palabraActual === undefined || marcando) return;
      cancelarTemporizador();
      setMarcando(true);
      setErrorMarcado(null);

      try {
        const resultado = await servicios.marcarPalabra.ejecutar({
          palabraId: palabraActual.id,
          estado
        });

        // RN-08: el contador de aprendidas lo dicta el caso de uso, no un acumulador local.
        setAprendidas(resultado.palabrasAprendidas);
        if (resultado.xpGanado > 0) setXpGanado((acumulado) => acumulado + resultado.xpGanado);
        setRachaDias(resultado.rachaDias);

        if (esUltima) {
          abrirCierre();
          return;
        }

        temporizador.current = setTimeout(() => {
          temporizador.current = null;
          setIndice((actual) => Math.min(actual + 1, total - 1));
          setVolteada(false);
        }, MS_AUTO_AVANCE);
      } catch (fallo) {
        setErrorMarcado(mensajeDeFallo(fallo));
      } finally {
        setMarcando(false);
      }
    },
    [
      abrirCierre,
      cancelarTemporizador,
      esUltima,
      marcando,
      palabraActual,
      servicios.marcarPalabra,
      total
    ]
  );

  const alTeclear = useCallback(
    (evento: React.KeyboardEvent<HTMLElement>) => {
      // Las flechas dentro de un formulario pertenecen al control, no a la navegación de tarjetas.
      if (esControlDeEscritura(evento.target)) return;
      if (enCierre) return;

      if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        irAnterior();
        return;
      }

      if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        irSiguiente();
      }
      // `Enter` y `Espacio` ya los maneja de forma nativa el `<button data-flashcard>`.
    },
    [enCierre, irAnterior, irSiguiente]
  );

  if (enCierre) {
    return (
      <div data-pantalla="leccion" className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        <CierreLeccion
          nivelId={leccion.nivelId}
          titulo={leccion.tituloEspanol || leccion.tituloQuechua}
          aprendidas={aprendidas}
          total={total}
          xpGanado={xpGanado}
          rachaDias={rachaDias}
        />
      </div>
    );
  }

  return (
    <div
      data-pantalla="leccion"
      className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6"
    >
      <div className="flex items-center justify-between gap-3">
        <a
          href={ruta('/')}
          className="inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2 text-body text-slate-400 underline-offset-4 hover:text-sand hover:underline md:min-h-tactil-escritorio md:min-w-tactil-escritorio"
        >
          Volver al mapa
        </a>
        <Insignia tono="marca">Nivel {leccion.nivelId}</Insignia>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-title font-display font-bold text-sand">
          {leccion.tituloQuechua || `Nivel ${leccion.nivelId}`}
        </h1>
        <p className="text-body text-slate-400">{leccion.tituloEspanol}</p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-slate-300">
          Tarjeta {indice + 1} de {total}
        </p>
        <p className="flex items-center gap-2 text-body text-slate-300" role="status" aria-live="polite">
          Aprendidas <Insignia tono="exito">{`${aprendidas}/${total}`}</Insignia>
        </p>
      </div>

      <BarraProgreso valor={indice + 1} max={total} etiqueta="Avance de la lección" />

      {palabraActual !== undefined && (
        <Flashcard
          palabra={palabraActual}
          volteada={volteada}
          alVoltear={() => setVolteada((actual) => !actual)}
          movimientoReducido={movimientoReducido}
          // Las flechas se escuchan sobre la superficie interactiva real (la tarjeta, un `<button>`
          // nativo) y ascienden hasta este componente, así que ningún `div` genérico queda con
          // manejadores de teclado y el modo navegación del lector de pantalla sigue intacto.
          onKeyDown={alTeclear}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          data-accion="repasar"
          disabled={marcando}
          onClick={() => void marcar('repasar')}
          className={`${CLASES_MARCADO} border border-andina-night-border bg-andina-night-card text-slate-100 hover:bg-andina-night-muted/40 active:bg-andina-night-muted/60`}
        >
          Necesito repasar
        </button>
        <button
          type="button"
          data-accion="aprender"
          disabled={marcando}
          onClick={() => void marcar('aprendido')}
          className={`${CLASES_MARCADO} border border-emerald-700/60 bg-emerald-600/80 text-white hover:bg-emerald-600 active:bg-emerald-700`}
        >
          ¡Ya me la sé!
        </button>
      </div>

      {errorMarcado !== null && <MensajeError mensaje={errorMarcado} />}

      {/*
        Fitts + Hick: el avance de la lección es la ACCIÓN PRINCIPAL de esta pantalla, así que vive
        en la franja inferior alcanzable en móvil y es el ÚNICO `data-cta="primario"` visible
        mientras se estudian tarjetas (el cierre y el bloqueo tienen el suyo propio).
      */}
      <EnvoltorioCtaFijo className="mt-2">
        <div className="flex w-full items-center justify-between gap-3">
          <Boton
            data-accion="anterior"
            variante="secundario"
            disabled={indice === 0}
            onClick={irAnterior}
          >
            Anterior
          </Boton>
          <Boton
            data-accion="siguiente"
            variante="primario"
            esCtaPrimario
            onClick={irSiguiente}
            // Nombre accesible DEFINITIVO (en español y coherente con el texto visible, WCAG 2.5.3):
            // «Siguiente» en todas las tarjetas menos la última, donde la acción ya no es avanzar sino
            // cerrar la lección («Terminar la lección», que contiene el texto visible «Terminar»).
            aria-label={esUltima ? 'Terminar la lección' : 'Siguiente'}
          >
            {esUltima ? 'Terminar' : 'Siguiente'}
          </Boton>
        </div>
      </EnvoltorioCtaFijo>

      {yaAprendidas && (
        <Tarjeta className="text-center">
          <p className="text-body text-slate-300">
            Ya marcaste palabras en este nivel. Cuando termines de repasar, mide lo aprendido.
          </p>
        </Tarjeta>
      )}
    </div>
  );
}

export default Leccion;
