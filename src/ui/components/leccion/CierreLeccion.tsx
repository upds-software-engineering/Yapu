import React from 'react';
import { BarraProgreso, EnvoltorioCtaFijo, Insignia, Tarjeta } from '@ui/design-system';
import { rutaEvaluacion } from '@ui/lib/ruta';

export interface PropsCierreLeccion {
  /** Nivel cuya evaluación se ofrece como siguiente paso. */
  nivelId: number;
  /** Título del nivel: el cierre debe nombrar lo que se acaba de recorrer. */
  titulo: string;
  /** RN-08: palabras en estado `aprendido` según el caso de uso (no un contador local). */
  aprendidas: number;
  /** Total de palabras de la lección. */
  total: number;
  /** RN-05: XP ganado en esta sesión; `0` no se anuncia. */
  xpGanado?: number;
  /** RN-06: racha de días; `0` no se anuncia. */
  rachaDias?: number;
}

/**
 * Apogeo-Final — cierre de la lección.
 *
 * Cierra el recorrido con un resumen explícito del logro (`Aprendiste N de M palabras`), el
 * reconocimiento (XP y racha sólo cuando existen) y un único paso siguiente evidente: la
 * evaluación del nivel. Hick: en esta pantalla hay exactamente UN `data-cta="primario"`, así que
 * no compite con nada más.
 *
 * Fitts (BLOQUEANTE): el CTA viaja en `EnvoltorioCtaFijo`, pegado al borde inferior (zona del
 * pulgar) y a ancho completo en móvil.
 */
export function CierreLeccion({
  nivelId,
  titulo,
  aprendidas,
  total,
  xpGanado = 0,
  rachaDias = 0
}: PropsCierreLeccion) {
  const porcentaje = total > 0 ? Math.round((aprendidas / total) * 100) : 0;
  const animo =
    total > 0 && aprendidas >= total
      ? '¡Allillanmi! Dominaste todas las palabras de esta lección.'
      : 'Cada palabra que repites te acerca a hablar quechua con confianza.';

  return (
    <section data-pantalla="cierre-leccion" className="flex w-full flex-col gap-4">
      <Tarjeta className="flex flex-col items-center gap-3 text-center">
        <Insignia tono="exito">Lección completada</Insignia>
        <h2 className="text-title font-display font-bold text-sand">{titulo}</h2>
        <p className="text-body text-slate-300">
          Aprendiste {aprendidas} de {total} palabras
        </p>
        <p className="text-body text-slate-400">{animo}</p>

        {(xpGanado > 0 || rachaDias > 0) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {xpGanado > 0 && <Insignia tono="marca">+{xpGanado} XP</Insignia>}
            {rachaDias > 0 && (
              <Insignia tono="alerta">
                Racha de {rachaDias} {rachaDias === 1 ? 'día' : 'días'}
              </Insignia>
            )}
          </div>
        )}

        <BarraProgreso
          valor={porcentaje}
          max={100}
          etiqueta="Palabras aprendidas en esta lección"
          className="mt-1"
        />
      </Tarjeta>

      <EnvoltorioCtaFijo>
        {/*
          El CTA es un enlace (navega a otra pantalla), pero se viste con los tokens del `Boton`
          primario: mismo aspecto, misma área táctil y ninguna interacción anidada. Se escribe a
          mano porque no existe todavía un `EnlaceBoton` en el design system.
        */}
        <a
          href={rutaEvaluacion(nivelId)}
          data-cta="primario"
          className="inline-flex w-full min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2 text-body font-semibold text-white transition-colors duration-200 bg-andina-terracotta shadow-lg shadow-andina-terracotta/25 hover:bg-andina-terracotta-hover active:bg-andina-terracotta-dark md:min-h-tactil-escritorio md:min-w-tactil-escritorio focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold"
        >
          Ir a la evaluación
        </a>
      </EnvoltorioCtaFijo>
    </section>
  );
}

export default CierreLeccion;
