import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { usePreferenciaReducida } from '@ui/hooks';

/**
 * Apogeo-Final: celebración de la aprobación con confeti de la paleta andina.
 *
 * El disparo es SIEMPRE decorativo y nunca puede romper la pantalla ni dejar trabajo vivo:
 *  - con `prefers-reduced-motion: reduce` no se dispara: lo comprueba `usePreferenciaReducida()` y
 *    lo vuelve a comprobar `canvas-confetti` (`disableForReducedMotion`), porque el hook sólo
 *    conoce la preferencia real en su primer efecto;
 *  - en el render de servidor (build de Astro, sin `document`) no se dispara;
 *  - el mismo resultado no se celebra dos veces (la clave del resultado queda memorizada);
 *  - al desmontar se cancelan los temporizadores y se limpia el lienzo de `canvas-confetti`.
 */

/** Paleta andina del estallido: oro, terracota andina, aguayo, cielo andino y oro claro. */
export const COLORES_ANDINOS: readonly string[] = [
  '#F59E0B',
  '#E05A00',
  '#0D9488',
  '#38BDF8',
  '#FCD34D'
];

/** Apertura angular del estallido central y del lateral, en grados. */
const APERTURA_CENTRAL = 75;
const APERTURA_LATERAL = 55;

/** Retardo del segundo estallido, para que la celebración tenga dos tiempos (ms). */
const RETARDO_LATERAL = 260;

export interface PropsConfeti {
  /** Clave del resultado celebrado: el mismo resultado NUNCA se celebra dos veces. */
  clave: string;
  /** Partículas del estallido central. */
  particleCount?: number;
}

export interface DecisionConfeti {
  /** Clave ya celebrada por esta instancia (o `null` si todavía no celebró nada). */
  claveCelebrada: string | null;
  /** Clave del resultado que se está mostrando ahora. */
  clave: string;
  /** `usePreferenciaReducida()`: el sistema pide no animar. */
  movimientoReducido: boolean;
  /** ¿Hay DOM y soporte de canvas 2D? (falso en el render de servidor). */
  puedeAnimar: boolean;
}

/**
 * Regla pura de la celebración, para poder probarla sin lienzo.
 *
 * Se separa del efecto porque las tres prohibiciones (movimiento reducido, render sin DOM y
 * repetición del mismo resultado) son reglas de negocio de la pantalla, no detalles de pintado.
 */
export function debeLanzarConfeti(decision: DecisionConfeti): boolean {
  if (decision.movimientoReducido) return false;
  if (!decision.puedeAnimar) return false;
  return decision.claveCelebrada !== decision.clave;
}

/**
 * ¿Este entorno puede animar confeti?
 *
 * En el render de servidor no existe `document`; y sin implementación de canvas 2D
 * (`CanvasRenderingContext2D`) no hay nada que pintar, así que es mejor no disparar nada.
 */
export function puedeAnimarConfeti(): boolean {
  if (typeof document === 'undefined') return false;
  return typeof CanvasRenderingContext2D !== 'undefined';
}

export function Confeti({ clave, particleCount = 120 }: PropsConfeti) {
  const movimientoReducido = usePreferenciaReducida();
  const claveCelebrada = useRef<string | null>(null);
  const temporizadores = useRef<number[]>([]);

  useEffect(() => {
    const puedeLanzar = debeLanzarConfeti({
      claveCelebrada: claveCelebrada.current,
      clave,
      movimientoReducido,
      puedeAnimar: puedeAnimarConfeti()
    });
    if (!puedeLanzar) return;

    claveCelebrada.current = clave;

    try {
      confetti({
        particleCount,
        spread: APERTURA_CENTRAL,
        origin: { y: 0.6 },
        colors: [...COLORES_ANDINOS],
        // Segunda barrera: `usePreferenciaReducida()` sólo conoce la preferencia en su primer
        // efecto, así que `canvas-confetti` la vuelve a consultar de forma síncrona antes de
        // crear el lienzo. Con movimiento reducido no se crea ningún canvas.
        disableForReducedMotion: true
      });
    } catch {
      // Un navegador puede bloquear el lienzo: la celebración es decorativa y nunca bloquea.
    }

    const lateral = window.setTimeout(() => {
      try {
        confetti({
          particleCount: Math.round(particleCount / 2),
          angle: 60,
          spread: APERTURA_LATERAL,
          origin: { x: 0, y: 0.7 },
          colors: [...COLORES_ANDINOS],
          disableForReducedMotion: true
        });
      } catch {
        // Idem: si el lienzo no está disponible, no hay nada que animar.
      }
    }, RETARDO_LATERAL);

    temporizadores.current.push(lateral);

    return () => {
      for (const temporizador of temporizadores.current) window.clearTimeout(temporizador);
      temporizadores.current = [];
      try {
        confetti.reset();
      } catch {
        // `reset` sólo existe en la instancia de navegador; sin ella no hay nada que limpiar.
      }
    };
  }, [clave, movimientoReducido, particleCount]);

  return null;
}

export default Confeti;
