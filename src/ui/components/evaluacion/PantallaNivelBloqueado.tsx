import { LockKeyhole } from 'lucide-react';
import React from 'react';
import { Insignia, Tarjeta } from '@ui/design-system';
import { cn } from '@ui/lib/clases';
import { ruta } from '@ui/lib/ruta';

/**
 * RN-01: pantalla que explica por qué un nivel todavía no está disponible.
 *
 * Jakob: el estudiante reconoce el bloqueo (candado + nivel que intentó abrir) en lugar de ver un
 * error técnico. Apogeo-Final: nunca es un callejón sin salida, siempre ofrece volver al mapa.
 * Hick: un único CTA primario, marcado con `data-cta="primario"`.
 */
export interface PropsPantallaNivelBloqueado {
  /** Nivel que el estudiante intentó abrir (RN-01). */
  nivelId: number;
  /** Nivel en el que sí puede continuar ahora mismo. */
  nivelActual: number;
}

/**
 * CTA navegable del feature.
 *
 * `Boton` sólo pinta `<button>` y el examen necesita enlaces reales (`href` con el helper de
 * rutas, ADR-004), así que el enlace replica las clases del botón primario: Fitts (44 px mínimos
 * con los tokens táctiles) y un único objetivo primario por pantalla.
 */
export function EnlaceCtaPrimario({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      data-cta="primario"
      className={cn(
        'inline-flex min-h-tactil min-w-tactil w-full items-center justify-center gap-2 rounded-2xl px-4 py-2',
        'bg-primario text-body font-semibold text-white shadow-lg shadow-primario/25',
        'transition-colors hover:bg-primario-hover active:bg-primario-activo',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte'
      )}
    >
      {children}
    </a>
  );
}

export function PantallaNivelBloqueado({ nivelId, nivelActual }: PropsPantallaNivelBloqueado) {
  return (
    <div
      data-pantalla="nivel-bloqueado"
      className="mx-auto flex w-full max-w-[40rem] flex-col gap-4 px-4 py-6"
    >
      <Tarjeta className="flex flex-col items-start gap-3">
        <Insignia tono="alerta">
          <LockKeyhole aria-hidden="true" className="h-4 w-4" />
          Nivel bloqueado
        </Insignia>

        <h1 className="text-title font-semibold text-tinta">
          {`El nivel ${nivelId} todavía no está desbloqueado`}
        </h1>

        <p className="text-body text-tinta-suave">
          {`Para rendir esta evaluación primero debes aprobar el nivel ${nivelActual}. En YAPU los niveles se abren en orden: cada aprobación desbloquea el siguiente.`}
        </p>

        <p className="text-caption text-tinta-tenue">
          {`Tu nivel actual es el ${nivelActual}.`}
        </p>
      </Tarjeta>

      <EnlaceCtaPrimario href={ruta('/')}>Ir a mi nivel actual</EnlaceCtaPrimario>
    </div>
  );
}

export default PantallaNivelBloqueado;
