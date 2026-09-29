import React from 'react';
import { cn } from '@ui/lib/clases';

export interface PropsTarjeta {
  children: React.ReactNode;
  className?: string;
  /** Miller/Jakob: si la tarjeta es un objetivo navegable, entra en el orden de tabulación. */
  interactiva?: boolean;
  /** Etiqueta accesible de la tarjeta cuando es interactiva. */
  etiqueta?: string;
}

/**
 * Contenedor base de contenido (métricas, tarjetas de nivel, bloques de resultado).
 *
 * Estética-Usabilidad: superficie y borde únicos (`rounded-2xl`, `border-slate-800`,
 * `bg-andina-night-card`) para que todas las pantallas compartan la misma jerarquía visual.
 */
export function Tarjeta({ children, className, interactiva = false, etiqueta }: PropsTarjeta) {
  return (
    <div
      aria-label={interactiva ? etiqueta : undefined}
      // La tarjeta interactiva es un objetivo táctil grande y focusable (Fitts). No recibe
      // role="button" a propósito: agrupa varios objetivos hijos (enlace del nivel, botón de
      // repaso) y anunciarla como botón confundiría al lector de pantalla.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- contenedor focusable deliberado
      tabIndex={interactiva ? 0 : undefined}
      className={cn(
        'rounded-2xl border border-slate-800 bg-andina-night-card p-4 sm:p-5',
        interactiva &&
          'cursor-pointer transition-colors hover:border-andina-terracotta/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Tarjeta;
