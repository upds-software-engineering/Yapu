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
  neutro: 'border-slate-700 bg-slate-800/60 text-slate-300',
  exito: 'border-emerald-700/60 bg-emerald-500/10 text-emerald-300',
  alerta: 'border-amber-700/60 bg-amber-500/10 text-amber-300',
  error: 'border-red-800/60 bg-red-500/10 text-red-300',
  marca: 'border-andina-terracotta/40 bg-andina-terracotta/20 text-andina-gold'
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
