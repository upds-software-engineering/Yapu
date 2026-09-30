import React from 'react';
import { cn } from '@ui/lib/clases';

/** Tono semántico de la pastilla, siempre con la paleta `andina-*` o su equivalente de estado. */
export type TonoInsignia = 'neutro' | 'exito' | 'alerta' | 'error' | 'marca';

export interface PropsInsignia {
  children: React.ReactNode;
  tono?: TonoInsignia;
  className?: string;
}

const TONOS: Record<TonoInsignia, string> = {
  neutro: 'border-linea-fuerte bg-superficie-alta text-tinta-suave',
  exito: 'border-exito/40 bg-exito/10 text-exito',
  alerta: 'border-alerta/40 bg-alerta/10 text-alerta',
  error: 'border-peligro/40 bg-peligro/10 text-peligro',
  marca: 'border-primario/40 bg-primario/20 text-acento'
};

/**
 * Pastilla corta para estados (tramo, categoría gramatical, nivel desbloqueado).
 *
 * Estética-Usabilidad: usa siempre `text-caption`, nunca utilidades tipográficas crudas.
 */
export function Insignia({ children, tono = 'neutro', className }: PropsInsignia) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption font-semibold',
        TONOS[tono],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Insignia;
