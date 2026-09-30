import React from 'react';
import { cn } from '@ui/lib/clases';

/** Variantes semánticas del botón, siempre con la paleta `andina-*`. */
export type VarianteBoton = 'primario' | 'secundario' | 'terciario' | 'peligro';

/** `normal` = acción principal; `compacto` = acción secundaria dentro de listas. */
export type TamanoBoton = 'normal' | 'compacto';

export interface PropsBoton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  /** Hick: marca el ÚNICO CTA primario de la pantalla (`data-cta="primario"`). */
  esCtaPrimario?: boolean;
  cargando?: boolean;
}

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-primario text-white shadow-lg shadow-primario/25 hover:bg-primario-hover active:bg-primario-activo',
  secundario:
    'border border-linea bg-superficie text-tinta hover:bg-superficie-alta active:bg-superficie-alta',
  terciario:
    'border border-transparent bg-transparent text-acento hover:bg-primario/10 active:bg-primario/20',
  peligro: 'bg-peligro-solido text-white hover:bg-peligro-solido-hover active:bg-peligro-solido-activo'
};

const TAMANOS: Record<TamanoBoton, string> = {
  normal: 'px-4 py-2 text-body',
  compacto: 'px-3 py-1.5 text-body'
};

/**
 * Botón del design system.
 *
 * Fitts (BLOQUEANTE): garantiza 44×44 px en móvil (`min-h-tactil min-w-tactil`) y como mínimo
 * 24×24 px en escritorio (`md:min-h-tactil-escritorio md:min-w-tactil-escritorio`), de modo que
 * ninguna pantalla pueda encoger un objetivo táctil por debajo del mínimo.
 *
 * Estética-Usabilidad: la tipografía sale siempre del token `text-body`; está prohibido usar
 * `text-xs|sm|base|lg|…` para que la medición de tamaños computados por pantalla pase.
 */
export function Boton({
  variante = 'secundario',
  tamano = 'normal',
  anchoCompleto = false,
  esCtaPrimario = false,
  cargando = false,
  type = 'button',
  className,
  disabled,
  children,
  ...resto
}: PropsBoton) {
  const deshabilitado = Boolean(disabled) || cargando;

  return (
    <button
      {...resto}
      type={type}
      data-cta={esCtaPrimario ? 'primario' : undefined}
      aria-busy={cargando ? true : undefined}
      disabled={deshabilitado}
      className={cn(
        // Fitts: tamaño táctil mínimo garantizado por token (44 px móvil / 24 px escritorio).
        'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl font-semibold',
        'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
        'transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAMANOS[tamano],
        anchoCompleto && 'w-full',
        className
      )}
    >
      {cargando && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

export default Boton;
