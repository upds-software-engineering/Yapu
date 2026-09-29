import React from 'react';
import { cn } from '@ui/lib/clases';

export interface PropsEnvoltorioCtaFijo {
  children: React.ReactNode;
  className?: string;
}

/**
 * Zona fija inferior para el CTA principal.
 *
 * Fitts (BLOQUEANTE): deja la acción más importante en el borde inferior de la pantalla, que es la
 * zona alcanzable con el pulgar en móvil, en lugar de obligar a estirar la mano hasta el centro.
 * Hick: al ser un contenedor fijo, suele alojar el ÚNICO `data-cta="primario"` de la pantalla.
 *
 * Respeta el *safe area* de los móviles con notch mediante `env(safe-area-inset-bottom)`.
 */
export function EnvoltorioCtaFijo({ children, className }: PropsEnvoltorioCtaFijo) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-30 w-full border-t border-andina-night-border bg-andina-night',
        'px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] sm:w-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export default EnvoltorioCtaFijo;
