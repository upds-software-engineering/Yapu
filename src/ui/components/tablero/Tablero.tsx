import { useMemo, useState, type ReactNode } from 'react';
import type { EvaluacionResumenDto } from '@application/dto/aprendizaje';
import {
  BarraProgreso,
  Boton,
  EnvoltorioCtaFijo,
  EstadoCarga,
  EstadoVacio,
  Insignia,
  MensajeError
} from '@ui/design-system';
import { useCasoDeUso, useServicios, useSincronizacion } from '@ui/hooks';
import { cn } from '@ui/lib/clases';
import { rutaLeccion } from '@ui/lib/ruta';
import { TarjetaEstadistica } from './TarjetaEstadistica';

/** Miller: máximo de evaluaciones visibles por nivel antes de que el estudiante amplíe el grupo. */
const LIMITE_POR_GRUPO = 5;

/** Fechas guardadas como `YYYY-MM-DD`; el resto se interpreta como instante ISO. */
const FECHA_SIMPLE = /^(\d{4})-(\d{2})-(\d{2})$/;

const CLASES_RAIZ = 'mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6';

/** Fitts: todo objetivo táctil del tablero mide al menos 44 px en móvil (24 px en escritorio). */
const CLASES_TACTIL = 'min-h-tactil min-w-tactil md:min-h-tactil-escritorio md:min-w-tactil-escritorio';

const CLASES_FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold';

const CLASES_CTA_PRIMARIO = cn(
  'inline-flex items-center justify-center gap-2 rounded-xl bg-andina-terracotta px-4 py-2 text-body font-semibold text-white shadow-lg shadow-andina-terracotta/25 transition-colors duration-200 hover:bg-andina-terracotta-hover active:bg-andina-terracotta-dark',
  CLASES_FOCO,
  CLASES_TACTIL
);

const CLASES_ENLACE_SECUNDARIO = cn(
  'inline-flex items-center justify-center gap-2 rounded-xl border border-andina-night-border bg-andina-night-card px-4 py-2 text-body font-semibold text-slate-100 transition-colors duration-200 hover:bg-andina-night-muted/40',
  CLASES_FOCO,
  CLASES_TACTIL
);

const CLASES_SUPERFICIE = 'rounded-2xl border border-slate-800 bg-andina-night-card p-4 sm:p-5';

interface GrupoHistorial {
  nivelId: number;
  evaluaciones: EvaluacionResumenDto[];
}

/**
 * Miller: agrupa el historial por nivel.
 *
 * No reordena nada: el caso de uso entrega las evaluaciones de la más reciente a la más antigua, así
 * que el primer grupo que aparece es el último nivel practicado y cada grupo conserva su cronología.
 */
function agruparPorNivel(historial: readonly EvaluacionResumenDto[]): GrupoHistorial[] {
  const grupos = new Map<number, EvaluacionResumenDto[]>();

  for (const evaluacion of historial) {
    const existentes = grupos.get(evaluacion.nivelId);
    if (existentes === undefined) grupos.set(evaluacion.nivelId, [evaluacion]);
    else existentes.push(evaluacion);
  }

  return [...grupos].map(([nivelId, evaluaciones]) => ({ nivelId, evaluaciones }));
}

/**
 * Fecha legible en español de Bolivia sin depender del formato ISO guardado.
 *
 * Una fecha `YYYY-MM-DD` se construye en hora local a propósito: interpretarla como UTC mostraría el
 * día anterior en Bolivia (UTC−4). Cualquier valor inservible cae al respaldo en español.
 */
function fechaLegible(fechaIso: string): string {
  const coincidencia = FECHA_SIMPLE.exec(fechaIso.trim());
  const fecha =
    coincidencia === null
      ? new Date(fechaIso)
      : new Date(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3]));

  if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible';
  return fecha.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Contenedor raíz del tablero: mantiene los selectores de pantalla en todos los estados. */
function Contenedor({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-pantalla="tablero" data-tablero="tablero" className={cn(CLASES_RAIZ, className)}>
      {children}
    </div>
  );
}

/** RF-008 / RN-15: una fila del historial, con su resultado, su fecha y su estado de sincronización. */
function FilaEvaluacion({ evaluacion }: { evaluacion: EvaluacionResumenDto }) {
  return (
    <li
      data-evaluacion={evaluacion.id}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-andina-night px-3 py-2"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-body font-semibold text-sand">
          Nivel {evaluacion.nivelId}: {evaluacion.puntuacion} %
        </span>
        <span className="text-caption text-slate-400">
          {evaluacion.aciertos} de {evaluacion.totalPreguntas} aciertos · {fechaLegible(evaluacion.fecha)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Insignia tono={evaluacion.aprobado ? 'exito' : 'error'}>
          {evaluacion.aprobado ? 'Aprobado' : 'Reprobado'}
        </Insignia>
        <Insignia tono={evaluacion.sincronizada ? 'neutro' : 'alerta'}>
          {evaluacion.sincronizada ? 'Sincronizado' : 'Pendiente de sincronizar'}
        </Insignia>
      </div>
    </li>
  );
}

export interface PropsTablero {
  /**
   * Rótulo de la cabecera. La sesión simulada (ADR-003) sólo aporta un identificador opaco, así que
   * por defecto se pinta el rótulo genérico «Estudiante».
   */
  nombreEstudiante?: string;
  className?: string;
}

/**
 * RF-008 — Tablero de progreso del estudiante.
 *
 * Reúne cuatro métricas (RN-03, RN-05, RN-06, RN-08), las palabras que quedaron en repaso (RN-08) y
 * el historial de evaluaciones con su cola offline (RN-15). Todo el estado sale del caso de uso
 * `ObtenerTableroUseCase` y de `useSincronizacion()`: la pantalla no calcula reglas de negocio.
 *
 * Miller (BLOQUEANTE): el historial nunca se pinta como una lista larga; se agrupa por nivel y cada
 * grupo muestra como mucho cinco evaluaciones hasta que el estudiante pida ver más, momento en el
 * que se amplía de cinco en cinco (paginación incremental).
 * Hick: cada grupo tiene un único control (`Ver más` / `Ver menos`); el resto de la fila es
 * informativo. En toda la pantalla existe exactamente un `data-cta="primario"`.
 * Fitts: CTA, enlaces de palabra y controles de grupo respetan el mínimo táctil de 44 px, y el CTA
 * principal vive en la franja inferior alcanzable con el pulgar (`EnvoltorioCtaFijo`).
 * Estética-Usabilidad: sólo se usan los tokens `text-caption|body|title|display`.
 */
export function Tablero({ nombreEstudiante = 'Estudiante', className }: PropsTablero) {
  const servicios = useServicios();
  const { datos, error, ejecutar } = useCasoDeUso(servicios.tablero.ejecutar.bind(servicios.tablero), {
    ejecutarAlMontar: []
  });
  const sincronizacion = useSincronizacion();

  const historial = datos?.historial;
  const grupos = useMemo(() => agruparPorNivel(historial ?? []), [historial]);
  const [visiblesPorNivel, setVisiblesPorNivel] = useState<Record<number, number>>({});

  /** Paginación incremental por grupo: 5 → 10 → … y de vuelta a 5 cuando ya se ve todo. */
  const alternarGrupo = (nivelId: number, total: number): void => {
    setVisiblesPorNivel((previos) => {
      const visibles = previos[nivelId] ?? LIMITE_POR_GRUPO;
      const siguientes =
        visibles < total ? Math.min(visibles + LIMITE_POR_GRUPO, total) : LIMITE_POR_GRUPO;
      return { ...previos, [nivelId]: siguientes };
    });
  };

  if (error !== null) {
    return (
      <Contenedor className={className}>
        <MensajeError mensaje={error} onReintentar={() => void ejecutar()} />
      </Contenedor>
    );
  }

  if (datos === null) {
    return (
      <Contenedor className={className}>
        <EstadoCarga mensaje="Cargando tu tablero…" />
      </Contenedor>
    );
  }

  const hayPalabrasPendientes = datos.palabrasParaRepasar.length > 0;
  const idsPendientes = datos.palabrasParaRepasar.map((palabra) => palabra.id);
  const textoPendientes = `${sincronizacion.pendientes} ${
    sincronizacion.pendientes === 1 ? 'pendiente' : 'pendientes'
  } de sincronizar`;

  return (
    <Contenedor className={className}>
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-title font-bold text-sand">{nombreEstudiante}</h1>
          {datos.cursoCompletado && <Insignia tono="exito">¡Curso completado!</Insignia>}
        </div>
        <p className="text-caption text-slate-400">Nivel {datos.nivelActual} de 10</p>
      </header>

      <section aria-label="Estadísticas del estudiante" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TarjetaEstadistica
          tipo="progreso"
          etiqueta="Progreso global"
          valor={`${datos.porcentajeGlobal} %`}
          detalle={`${datos.nivelesAprobados} de 10 niveles aprobados`}
        >
          <BarraProgreso valor={datos.porcentajeGlobal} etiqueta="Progreso global del curso" />
        </TarjetaEstadistica>
        <TarjetaEstadistica tipo="xp" etiqueta="Experiencia" valor={`${datos.xp} XP`} />
        <TarjetaEstadistica tipo="racha" etiqueta="Racha" valor={`${datos.rachaDias} días`} />
        <TarjetaEstadistica
          tipo="palabras"
          etiqueta="Palabras aprendidas"
          valor={String(datos.palabrasAprendidas)}
        />
      </section>

      <section aria-label="Palabras para repasar" className="flex flex-col gap-3">
        <h2 className="font-display text-title font-semibold text-sand">Palabras para repasar</h2>

        {hayPalabrasPendientes ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {datos.palabrasParaRepasar.map((palabra) => (
              <li key={palabra.id}>
                <a
                  data-palabra-repasar={palabra.id}
                  href={rutaLeccion(palabra.nivelId, [palabra.id])}
                  className={cn(
                    'flex min-h-tactil min-w-tactil flex-col justify-center gap-0.5 rounded-2xl border border-amber-700/50 bg-andina-night-card p-3 transition-colors duration-200 hover:border-andina-gold/70 md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
                    CLASES_FOCO
                  )}
                >
                  <span className="text-body font-semibold text-andina-gold">{palabra.termino}</span>
                  <span className="text-caption text-slate-300">{palabra.traduccion}</span>
                  <span className="text-caption text-slate-400">{palabra.etiquetaCategoria}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EstadoVacio
            titulo="¡Nada pendiente!"
            descripcion="Todas tus palabras están al día. Sigue practicando para no perder la racha."
          />
        )}
      </section>

      <section aria-label="Historial de evaluaciones" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-title font-semibold text-sand">Historial de evaluaciones</h2>
          <span data-sincronizacion-pendientes={String(sincronizacion.pendientes)}>
            <Insignia tono={sincronizacion.pendientes > 0 ? 'alerta' : 'exito'}>{textoPendientes}</Insignia>
          </span>
        </div>

        {datos.historial.length === 0 ? (
          <EstadoVacio
            titulo="Aún no hay evaluaciones"
            descripcion="Cuando rindas tu primera evaluación verás aquí tu puntuación y su estado de sincronización."
          >
            <a href={rutaLeccion(datos.nivelActual)} className={CLASES_ENLACE_SECUNDARIO}>
              Ir a la lección del nivel {datos.nivelActual}
            </a>
          </EstadoVacio>
        ) : (
          <div className="flex flex-col gap-3">
            {grupos.map((grupo) => {
              const visibles = visiblesPorNivel[grupo.nivelId] ?? LIMITE_POR_GRUPO;
              const mostradas = grupo.evaluaciones.slice(0, visibles);
              const hayMas = visibles < grupo.evaluaciones.length;
              const idTitulo = `historial-nivel-${grupo.nivelId}`;

              return (
                <section
                  key={grupo.nivelId}
                  data-grupo-nivel={grupo.nivelId}
                  aria-labelledby={idTitulo}
                  className={cn(CLASES_SUPERFICIE, 'flex flex-col gap-3')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={idTitulo} className="text-body font-semibold text-sand">
                      Nivel {grupo.nivelId}
                    </h3>
                    <span className="text-caption text-slate-400">
                      {grupo.evaluaciones.length === 1
                        ? '1 evaluación'
                        : `${grupo.evaluaciones.length} evaluaciones`}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {mostradas.map((evaluacion) => (
                      <FilaEvaluacion key={evaluacion.id} evaluacion={evaluacion} />
                    ))}
                  </ul>

                  {grupo.evaluaciones.length > LIMITE_POR_GRUPO && (
                    <Boton
                      variante="terciario"
                      tamano="compacto"
                      data-ver-mas={grupo.nivelId}
                      aria-expanded={hayMas}
                      onClick={() => alternarGrupo(grupo.nivelId, grupo.evaluaciones.length)}
                    >
                      {hayMas ? 'Ver más' : 'Ver menos'}
                    </Boton>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <EnvoltorioCtaFijo>
        <a
          href={
            hayPalabrasPendientes
              ? rutaLeccion(datos.nivelActual, idsPendientes)
              : rutaLeccion(datos.nivelActual)
          }
          data-cta="primario"
          className={cn(CLASES_CTA_PRIMARIO, 'w-full sm:w-auto')}
        >
          {hayPalabrasPendientes
            ? 'Repasar mis palabras pendientes'
            : `Continuar con el nivel ${datos.nivelActual}`}
        </a>
      </EnvoltorioCtaFijo>
    </Contenedor>
  );
}

export default Tablero;
