import type { ReactNode } from 'react';
import { Tarjeta } from '@ui/design-system';
import { cn } from '@ui/lib/clases';

/**
 * Métricas del tablero. Cada valor es también el selector de contrato que consumen las pruebas
 * (`[data-estadistica="progreso"]`, `…="xp"`, `…="racha"`, `…="palabras"`).
 */
export type TipoEstadistica = 'progreso' | 'xp' | 'racha' | 'palabras';

export interface PropsTarjetaEstadistica {
  /** Qué métrica se pinta; define el `data-estadistica` de la tarjeta. */
  tipo: TipoEstadistica;
  /** Rótulo corto en español («Progreso global», «Experiencia»…). */
  etiqueta: string;
  /** Valor ya formateado y legible («100 %», «250 XP», «3 días»). */
  valor: string;
  /** Aclaración opcional bajo el valor (por ejemplo, «4 de 10 niveles aprobados»). */
  detalle?: string;
  /** Contenido extra al pie: `BarraProgreso` en la métrica de progreso. */
  children?: ReactNode;
  className?: string;
}

/**
 * RF-008 — Tarjeta de una métrica del tablero (progreso, XP, racha o palabras aprendidas).
 *
 * Miller: cada métrica es un bloque cerrado con un rótulo y un único número destacado, así que el
 * estudiante lee cuatro cifras en lugar de una lista de datos sueltos. No es interactiva: el
 * tablero reserva sus objetivos táctiles para el CTA, los enlaces de repaso y los controles de
 * grupo del historial (Hick).
 *
 * Estética-Usabilidad: sólo usa los tokens `text-caption` y `text-title`; el valor es informativo,
 * nunca un control.
 */
export function TarjetaEstadistica({
  tipo,
  etiqueta,
  valor,
  detalle,
  children,
  className
}: PropsTarjetaEstadistica) {
  return (
    <div data-estadistica={tipo} className="h-full">
      <Tarjeta className={cn('flex h-full flex-col gap-2', className)}>
        <p className="text-caption font-semibold tracking-wide text-tinta-tenue uppercase">{etiqueta}</p>
        <p className="font-display text-title font-bold text-tinta">{valor}</p>
        {detalle !== undefined && <p className="text-caption text-tinta-tenue">{detalle}</p>}
        {children !== undefined && <div className="mt-auto pt-1">{children}</div>}
      </Tarjeta>
    </div>
  );
}

export default TarjetaEstadistica;
