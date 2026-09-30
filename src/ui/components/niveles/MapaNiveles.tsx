import type { MapaNivelesDto, NivelDto } from '@application/dto';
import { BarraProgreso, EstadoCarga, Insignia, MensajeError } from '@ui/design-system';
import { useCasoDeUso, useServicios } from '@ui/hooks';
import { cn } from '@ui/lib/clases';
import { rutaLeccion } from '@ui/lib/ruta';
import { TarjetaNivel } from './TarjetaNivel';

export interface PropsMapaNiveles {
  className?: string;
}

/** RN-03: el DTO ya trae el porcentaje calculado; aquí sólo se muestra. */
const TOTAL_NIVELES = 10;

/**
 * RF-003 — Mapa de niveles: el "camino" completo del curso.
 *
 * Miller (BLOQUEANTE): los 10 niveles nunca se pintan como una lista plana; se agrupan en los
 * 3 tramos pedagógicos que entrega `MapaNivelesDto.tramos` (1–3 Fundamentos, 4–7 Vida cotidiana,
 * 8–10 Cosmovisión), cada uno con su encabezado, su rango y su descripción.
 *
 * Hick: existe **exactamente un** `data-cta="primario"` en la pantalla. Normalmente es el enlace
 * "Estudiar Tarjetas" del nivel actual; cuando el curso está completo, el CTA es
 * "Repasar el nivel 10" (el nivel 10 ya está aprobado y ninguna tarjeta queda como actual).
 *
 * El componente sólo consume casos de uso y DTOs a través de `useServicios`/`useCasoDeUso`: no
 * conoce adaptadores ni entidades de dominio (arquitectura hexagonal, capa `ui`).
 */
export function MapaNiveles({ className }: PropsMapaNiveles) {
  const { mapaNiveles } = useServicios();
  const { datos, cargando, error, ejecutar } = useCasoDeUso<MapaNivelesDto, []>(
    () => mapaNiveles.ejecutar(),
    { ejecutarAlMontar: [] }
  );

  return (
    <div
      data-pantalla="mapa"
      className={cn('mx-auto w-full max-w-5xl px-4 py-6', className)}
    >
      {cargando && <EstadoCarga mensaje="Cargando tu camino de aprendizaje…" />}

      {!cargando && error !== null && (
        <MensajeError mensaje={error} onReintentar={() => void ejecutar()} />
      )}

      {/* Apogeo-Final: sin datos, sin error y sin carga todavía no se deja la pantalla en blanco. */}
      {!cargando && error === null && datos === null && (
        <EstadoCarga mensaje="Cargando tu camino de aprendizaje…" />
      )}

      {!cargando && error === null && datos !== null && <ContenidoMapa mapa={datos} />}
    </div>
  );
}

/** Cabecera informativa + los 3 tramos de niveles. */
function ContenidoMapa({ mapa }: { mapa: MapaNivelesDto }) {
  const nivelCta = mapa.cursoCompletado ? TOTAL_NIVELES : mapa.nivelActual;

  return (
    <div className="flex flex-col gap-8">
      <header className="rounded-2xl border border-linea bg-superficie p-4 sm:p-5">
        <p className="text-caption font-semibold uppercase tracking-[0.2em] text-acento">
          Camino de aprendizaje A1
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-title font-semibold text-tinta">
              {`Nivel ${mapa.nivelActual} de ${TOTAL_NIVELES}`}
            </h2>
            <p className="text-body text-tinta-tenue">
              {`${mapa.nivelesAprobados} de ${TOTAL_NIVELES} niveles aprobados`}
            </p>
          </div>

          {/* RN-03: el número sale del DTO (`porcentajeGlobal`), nunca se recalcula en la UI. */}
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-caption text-tinta-tenue">Progreso global del curso</span>
              <span className="text-title font-bold text-acento">{`${mapa.porcentajeGlobal}%`}</span>
            </div>
            <BarraProgreso
              valor={mapa.porcentajeGlobal}
              etiqueta="Progreso global del curso"
              className="mt-2"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Insignia tono="marca">{`${mapa.xp} XP`}</Insignia>
          <Insignia tono="neutro">{`${mapa.rachaDias} ${mapa.rachaDias === 1 ? 'día' : 'días'} de racha`}</Insignia>
          {mapa.cursoCompletado && <Insignia tono="exito">¡Curso completado!</Insignia>}
        </div>

        {mapa.cursoCompletado && (
          // Hick: el único CTA primario de la pantalla cuando ya no queda nivel por estrenar.
          <a
            href={rutaLeccion(nivelCta)}
            data-cta="primario"
            aria-label={`Repasar el nivel ${nivelCta}`}
            className={cn(
              'mt-4 inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2 text-body font-semibold',
              'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
              'bg-primario text-white shadow-lg shadow-primario/25',
              'transition-colors duration-200 hover:bg-primario-hover active:bg-primario-activo',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte'
            )}
          >
            {`Repasar el nivel ${nivelCta}`}
          </a>
        )}
      </header>

      {mapa.tramos.map((tramo) => (
        <TramoNiveles
          key={tramo.id}
          id={tramo.id}
          nombre={tramo.nombre}
          rango={tramo.rango}
          descripcion={tramo.descripcion}
          niveles={tramo.niveles}
          nivelCta={mapa.cursoCompletado ? null : nivelCta}
        />
      ))}
    </div>
  );
}

interface PropsTramoNiveles {
  id: string;
  nombre: string;
  rango: string;
  descripcion: string;
  niveles: readonly NivelDto[];
  /** Nivel que recibe el CTA primario, o `null` si el curso ya está completo. */
  nivelCta: number | null;
}

/** Miller: un tramo = un encabezado con nombre, rango y descripción, y sus niveles dentro. */
function TramoNiveles({
  id,
  nombre,
  rango,
  descripcion,
  niveles,
  nivelCta
}: PropsTramoNiveles) {
  return (
    <section
      data-tramo={id}
      aria-labelledby={`tramo-${id}`}
      className="flex flex-col gap-4"
    >
      <div className="border-l-2 border-primario/60 pl-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={`tramo-${id}`} className="text-title font-semibold text-tinta">
            {nombre}
          </h2>
          <Insignia tono="neutro">{rango}</Insignia>
        </div>
        <p className="text-body text-tinta-tenue">{descripcion}</p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {niveles.map((nivel) => (
          <li key={nivel.id}>
            <TarjetaNivel nivel={nivel} esCtaPrimario={nivelCta === nivel.id} />
          </li>
        ))}
      </ol>
    </section>
  );
}

export default MapaNiveles;
