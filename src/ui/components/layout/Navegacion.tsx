import { BarChart3, Compass, GraduationCap, Sparkles, Users, type LucideIcon } from 'lucide-react';
import type { SesionDto } from '@application/dto';
import { useCasoDeUso, useServicios } from '@ui/hooks';
import { cn } from '@ui/lib/clases';
import { ruta, rutaActiva } from '@ui/lib/ruta';
import { SelectorRol } from './SelectorRol';

export interface PropsNavegacion {
  /** Ruta lógica actual (`/`, `/dashboard`, …); la aporta cada página de Astro. */
  rutaActual: string;
}

/** Claves del contrato de selectores que consumen los E2E. */
type ClaveDestino = 'niveles' | 'progreso' | 'comunidad' | 'docente';

interface Destino {
  clave: ClaveDestino;
  etiqueta: string;
  /** Ruta lógica: la URL real la construye `ruta()` con el `base` de Astro (ADR-004). */
  destino: string;
  Icono: LucideIcon;
  /** RF-002: el destino de docente sólo existe para quien tiene ese rol. */
  soloDocente?: boolean;
}

/**
 * Hick / Miller: exactamente 4 destinos, agrupados por frecuencia de uso (Jakob: primero el mapa de
 * niveles, que es la pantalla de estudio). La navegación NO lleva ningún `data-cta="primario"`: las
 * acciones primarias viven dentro de cada pantalla, así nunca compiten dos CTA en la misma vista.
 */
const DESTINOS: readonly Destino[] = [
  { clave: 'niveles', etiqueta: 'Niveles', destino: '/', Icono: Compass },
  { clave: 'progreso', etiqueta: 'Progreso', destino: '/dashboard', Icono: BarChart3 },
  { clave: 'comunidad', etiqueta: 'Comunidad', destino: '/community', Icono: Users },
  { clave: 'docente', etiqueta: 'Docente', destino: '/docente', Icono: GraduationCap, soloDocente: true }
];

/** Jakob: la barra conserva las etiquetas de texto; el icono nunca sustituye a la palabra. */
const ETIQUETA_ESCRITORIO = 'Navegación principal';
const ETIQUETA_MOVIL = 'Navegación principal móvil';

/**
 * RF-001 / RF-002 — navegación principal adaptativa.
 *
 * Jakob (BLOQUEANTE de patrón): en móvil los destinos van en una barra inferior, al alcance del
 * pulgar; en escritorio, en una cabecera superior. Las dos variantes existen en el DOM y se
 * alternan con `md:` (el contrato de selectores publica `data-nav` para cada una).
 *
 * Fitts (BLOQUEANTE): cada enlace declara `min-h-tactil min-w-tactil` (44×44 px) y las listas usan
 * `gap-2` (8 px) de separación mínima entre objetivos adyacentes.
 *
 * Hick: 4 destinos como máximo y ninguna insignia de racha/palabras — esos datos tienen su propia
 * pantalla y aquí sólo añadirían ruido de decisión.
 */
export function Navegacion({ rutaActual }: PropsNavegacion) {
  const { obtenerSesion } = useServicios();

  // RF-002: la sesión decide si la pestaña de docente existe. Se consulta al montar y cada vez que
  // `SelectorRol` avisa de un cambio de rol.
  const { datos: sesion, ejecutar } = useCasoDeUso<SesionDto, []>(() => obtenerSesion.ejecutar(), {
    ejecutarAlMontar: []
  });

  const esDocente = sesion?.esDocente === true;
  const destinos = DESTINOS.filter((destino) => destino.soloDocente !== true || esDocente);

  return (
    <>
      <header
        data-nav="escritorio"
        className="sticky top-0 z-40 hidden border-b border-andina-night-border bg-andina-night/90 backdrop-blur-md md:block"
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <Marca />

          <nav aria-label={ETIQUETA_ESCRITORIO} className="flex items-center gap-2">
            <EnlacesNav destinos={destinos} rutaActual={rutaActual} vertical={false} />
          </nav>

          <SelectorRol alCambiarRol={() => void ejecutar()} />
        </div>
      </header>

      <nav
        data-nav="movil"
        aria-label={ETIQUETA_MOVIL}
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around gap-2 border-t border-andina-night-border bg-andina-night/95 px-2 pt-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <EnlacesNav destinos={destinos} rutaActual={rutaActual} vertical />
      </nav>
    </>
  );
}

/** Marca de la aplicación: informativa, sin enlace (el destino «Niveles» ya está en la barra). */
function Marca() {
  return (
    <div data-nav-marca="yapu" className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-andina-terracotta to-andina-gold"
      >
        <Sparkles aria-hidden="true" className="h-5 w-5 text-andina-night" />
      </span>
      <span className="font-display text-title font-bold tracking-tight text-sand">YAPU</span>
    </div>
  );
}

interface PropsEnlacesNav {
  destinos: readonly Destino[];
  rutaActual: string;
  /** Jakob: en móvil la etiqueta va bajo el icono; en escritorio, a su lado. */
  vertical: boolean;
}

/** Enlaces compartidos por las dos variantes: una sola definición de tamaño y estado activo. */
function EnlacesNav({ destinos, rutaActual, vertical }: PropsEnlacesNav) {
  return (
    <>
      {destinos.map(({ clave, etiqueta, destino, Icono }) => {
        const activo = rutaActiva(rutaActual, destino);

        return (
          <a
            key={clave}
            href={ruta(destino)}
            data-nav-enlace={clave}
            aria-current={activo ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-1 rounded-xl px-2',
              'text-caption font-semibold transition-colors duration-200',
              vertical ? 'flex-col' : 'flex-row',
              activo
                ? 'border border-andina-terracotta/40 bg-andina-terracotta/20 text-andina-gold'
                : 'border border-transparent text-slate-400 hover:bg-andina-night-muted/40 hover:text-sand',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold'
            )}
          >
            <Icono aria-hidden="true" className="h-5 w-5" />
            <span>{etiqueta}</span>
          </a>
        );
      })}
    </>
  );
}

export default Navegacion;
