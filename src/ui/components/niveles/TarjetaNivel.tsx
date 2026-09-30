import {
  Binary,
  BookOpen,
  CheckCircle2,
  Hammer,
  HeartPulse,
  House,
  Lock,
  Palette,
  PawPrint,
  Sparkles,
  Sun,
  Users,
  Utensils,
  type LucideIcon
} from 'lucide-react';
import type { NivelDto } from '@application/dto';
import { Insignia, Tarjeta } from '@ui/design-system';
import { cn } from '@ui/lib/clases';
import { rutaEvaluacion, rutaLeccion } from '@ui/lib/ruta';

export interface PropsTarjetaNivel {
  /** RF-003: nivel del mapa con su estado de recorrido (`aprobado` | `actual` | `bloqueado`). */
  nivel: NivelDto;
  /**
   * Hick: marca este nivel como el CTA primario de la pantalla (`data-cta="primario"`).
   * `MapaNiveles` lo activa en un único nivel, así que nunca compiten dos acciones primarias.
   */
  esCtaPrimario?: boolean;
}

/**
 * Clases de las acciones de la tarjeta.
 *
 * Fitts (BLOQUEANTE): cada enlace mide como mínimo 44×44 px en móvil (`min-h-tactil min-w-tactil`)
 * y 24×24 px desde `md`, exactamente los mismos tokens que usa `Boton`. Aquí no se puede usar
 * `Boton`: la acción es una navegación real, así que debe ser un `<a href>` (Jakob: enlace
 * reconocible y compartible, con el botón "atrás" del navegador funcionando).
 */
const CLASES_ENLACE = cn(
  'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2 text-body font-semibold',
  'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
  'transition-colors duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte'
);

/** Estética-Usabilidad: la acción primaria usa el terracota institucional; el resto, superficie neutra. */
const CLASES_CTA_PRIMARIO =
  'bg-primario text-white shadow-lg shadow-primario/25 hover:bg-primario-hover active:bg-primario-activo';

const CLASES_ACCION_SECUNDARIA =
  'border border-linea bg-superficie text-tinta hover:bg-superficie-alta active:bg-superficie-alta';

/**
 * El catálogo guarda el icono de cada nivel como NOMBRE de Lucide (`NivelDto.icono`). Pintarlo tal
 * cual mostraba la palabra "Sparkles" desbordando el recuadro; aquí se traduce al componente real y
 * un nombre desconocido cae en `BookOpen`, de modo que nunca aparece texto crudo.
 */
const ICONOS_NIVEL: Record<string, LucideIcon> = {
  Sparkles,
  Users,
  Binary,
  Palette,
  PawPrint,
  Utensils,
  HeartPulse,
  Home: House,
  House,
  Hammer,
  Sun
};

/** Jakob: el candado y el estado del nivel comparten color con el resto del design system. */
const CLASES_ESTADO: Record<NivelDto['estado'], string> = {
  aprobado: 'border-exito/40 bg-exito/10 text-exito',
  actual: 'border-acento/60 bg-acento/15 text-acento',
  bloqueado: 'border-linea bg-fondo/60 text-tinta-tenue'
};

/** Texto del estado, para la etiqueta accesible de la tarjeta. */
const TEXTO_ESTADO: Record<NivelDto['estado'], string> = {
  aprobado: 'aprobado',
  actual: 'nivel actual',
  bloqueado: 'bloqueado'
};

/**
 * Tarjeta de un nivel del mapa (RF-003 · RN-01).
 *
 * Hick: como máximo **dos** acciones (lección y evaluación); todo lo demás es informativo
 * (título, descripción, número de palabras y estado).
 * RN-01: un nivel `bloqueado` NO es un enlace: no tiene `href`, muestra el candado y explica qué
 * nivel hay que aprobar para desbloquearlo.
 */
export function TarjetaNivel({ nivel, esCtaPrimario = false }: PropsTarjetaNivel) {
  const bloqueado = nivel.estado === 'bloqueado';
  // `accesible` ya viene derivado del caso de uso, pero se comprueba también el estado para que
  // ningún dato incoherente convierta un nivel bloqueado en un enlace (RN-01, defensa en la UI).
  const navegable = nivel.accesible && !bloqueado;
  const nivelRequerido = Math.max(1, nivel.id - 1);

  return (
    <article
      data-nivel={nivel.id}
      data-estado={nivel.estado}
      aria-label={`Nivel ${nivel.id}: ${nivel.tituloQuechua} (${nivel.tituloEspanol}), ${TEXTO_ESTADO[nivel.estado]}`}
      className="h-full"
    >
      <Tarjeta
        className={cn(
          'flex h-full flex-col gap-3',
          nivel.estado === 'actual' && 'border-acento/50 shadow-lg shadow-acento/10',
          bloqueado && 'border-dashed bg-fondo/60'
        )}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              CLASES_ESTADO[nivel.estado]
            )}
          >
            {bloqueado ? <Lock className="h-5 w-5" /> : <IconoNivel nombre={nivel.icono} />}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-title font-semibold text-tinta">{nivel.tituloQuechua}</h3>
            <p className="text-caption text-tinta-tenue">{nivel.tituloEspanol}</p>
          </div>

          {nivel.estado === 'aprobado' && (
            <Insignia tono="exito">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
              Aprobado
            </Insignia>
          )}
          {nivel.estado === 'actual' && <Insignia tono="marca">Nivel actual</Insignia>}
        </div>

        <p className="text-body text-tinta-tenue">{nivel.descripcion}</p>

        <p className="text-caption text-tinta-tenue">{`${nivel.palabrasTotal} palabras en este nivel`}</p>

        {navegable && (
          // Hick: dos acciones como máximo; Fitts: ambas por encima del mínimo táctil.
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <a
              href={rutaLeccion(nivel.id)}
              data-cta={esCtaPrimario ? 'primario' : undefined}
              aria-label={`Estudiar Tarjetas del nivel ${nivel.id}: ${nivel.tituloEspanol}`}
              className={cn(CLASES_ENLACE, esCtaPrimario ? CLASES_CTA_PRIMARIO : CLASES_ACCION_SECUNDARIA)}
            >
              <BookOpen aria-hidden="true" className="h-4 w-4" />
              Estudiar Tarjetas
            </a>

            <a
              href={rutaEvaluacion(nivel.id)}
              aria-label={`Evaluación IA del nivel ${nivel.id}: ${nivel.tituloEspanol}`}
              className={cn(CLASES_ENLACE, CLASES_ACCION_SECUNDARIA)}
            >
              <Sparkles aria-hidden="true" className="h-4 w-4 text-acento" />
              Evaluación IA
            </a>
          </div>
        )}

        {bloqueado && (
          <p className="mt-auto flex items-center gap-2 text-caption text-tinta-tenue">
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            {`Desbloquea aprobando el nivel ${nivelRequerido}`}
          </p>
        )}
      </Tarjeta>
    </article>
  );
}

/** Icono decorativo del nivel (el nombre accesible ya lo aporta el `aria-label` del artículo). */
function IconoNivel({ nombre }: { nombre: string }) {
  const Icono = ICONOS_NIVEL[nombre] ?? BookOpen;
  return <Icono aria-hidden="true" className="h-5 w-5" />;
}

export default TarjetaNivel;
