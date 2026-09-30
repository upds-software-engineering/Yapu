import React from 'react';
import { Boton } from './Boton';
import { cn } from '@ui/lib/clases';

export interface PropsEstadoCarga {
  /** Texto que se anuncia; siempre en español y sin jerga técnica. */
  mensaje?: string;
  className?: string;
}

/**
 * Estado de carga anunciado por el lector de pantalla (`role="status"` + `aria-live="polite"`).
 *
 * Apogeo-Final: evita pantallas en blanco; el estudiante siempre ve que el sistema está trabajando.
 */
export function EstadoCarga({ mensaje = 'Cargando…', className }: PropsEstadoCarga) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-linea border-t-acento"
      />
      <p className="text-body text-tinta-tenue">{mensaje}</p>
    </div>
  );
}

export interface PropsMensajeError {
  mensaje: string;
  /** Si se pasa, se ofrece un botón para volver a intentar la operación. */
  onReintentar?: () => void;
  textoReintentar?: string;
  className?: string;
}

/**
 * Error anunciado de inmediato (`role="alert"`) con una salida clara.
 *
 * Jakob: bloque de error reconocible; Apogeo-Final: nunca deja al estudiante en un callejón sin
 * salida porque ofrece *Reintentar*.
 */
export function MensajeError({
  mensaje,
  onReintentar,
  textoReintentar = 'Reintentar',
  className
}: PropsMensajeError) {
  return (
    <div
      role="alert"
      className={cn('rounded-2xl border border-peligro/40 bg-peligro/10 p-4 sm:p-5', className)}
    >
      <p className="text-body text-peligro">{mensaje}</p>
      {onReintentar && (
        <Boton variante="secundario" tamano="compacto" className="mt-3" onClick={onReintentar}>
          {textoReintentar}
        </Boton>
      )}
    </div>
  );
}

export interface PropsEstadoVacio {
  titulo: string;
  descripcion?: string;
  /** Acción sugerida (un `Boton`, por ejemplo) para salir del estado vacío. */
  children?: React.ReactNode;
  className?: string;
}

/** Estado vacío: explica qué falta y ofrece el siguiente paso (Apogeo-Final). */
export function EstadoVacio({ titulo, descripcion, children, className }: PropsEstadoVacio) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-linea bg-superficie/60 p-6 text-center',
        className
      )}
    >
      <p className="text-title font-semibold text-tinta">{titulo}</p>
      {descripcion && <p className="text-body text-tinta-tenue">{descripcion}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
