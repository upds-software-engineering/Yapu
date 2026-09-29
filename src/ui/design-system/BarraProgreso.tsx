import { cn } from '@ui/lib/clases';

export interface PropsBarraProgreso {
  /** Valor actual; se acota al rango `[0, max]`. */
  valor: number;
  /** Máximo del rango. Por defecto 100 (porcentajes de RN-03). */
  max?: number;
  /** Etiqueta accesible: el número NUNCA se muestra sin ella. */
  etiqueta: string;
  className?: string;
}

/**
 * Barra de progreso accesible (RN-03: porcentaje global, avance de lección y de evaluación).
 *
 * Miller/Apogeo-Final: comunica el avance con un solo elemento en lugar de listar cifras sueltas.
 * Accesibilidad: expone `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
 * y `aria-label`, así que el porcentaje siempre viaja con su etiqueta.
 */
export function BarraProgreso({ valor, max = 100, etiqueta, className }: PropsBarraProgreso) {
  const maximo = max > 0 ? max : 1;
  const actual = Number.isFinite(valor) ? Math.min(Math.max(valor, 0), maximo) : 0;
  const porcentaje = Math.round((actual / maximo) * 100);

  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuenow={actual}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuetext={`${porcentaje} %`}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full border border-andina-night-border bg-andina-night-muted/40',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-andina-terracotta to-andina-gold transition-[width] duration-500"
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}

export default BarraProgreso;
