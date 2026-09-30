import { clsx } from 'clsx';
import { extendTailwindMerge, validators } from 'tailwind-merge';

/**
 * `tailwind-merge` no conoce los tokens propios del proyecto, así que la configuración se ajusta
 * en dos puntos:
 *
 *  1. `override` del grupo del ancho de contorno: en Tailwind 3 el `outline` a secas fija el ESTILO
 *     (`outline-style: solid`) y `outline-2` fija el ANCHO, pero la configuración por defecto mete
 *     ambos en el mismo grupo y borraría uno de los dos. Con el grupo restringido a números y
 *     medidas arbitrarias, `focus-visible:outline` y `focus-visible:outline-2` conviven.
 *  2. `extend` con los tokens del proyecto: sin registrar `text-body` como tamaño, `tailwind-merge`
 *     lo clasificaría como color de texto y eliminaría los colores de texto como `text-tinta`.
 */
const unirClases = extendTailwindMerge({
  override: {
    classGroups: {
      'outline-w': [{ outline: [validators.isNumber, validators.isArbitraryLength] }]
    }
  },
  extend: {
    classGroups: {
      // Estética-Usabilidad: escala tipográfica de 4 pasos de `tailwind.config.mjs`.
      'font-size': [{ text: ['caption', 'body', 'title', 'display'] }],
      // Fitts: tamaños táctiles mínimos (44 px móvil / 24 px escritorio).
      'min-h': [{ 'min-h': ['tactil', 'tactil-escritorio'] }],
      'min-w': [{ 'min-w': ['tactil', 'tactil-escritorio'] }]
    }
  }
});

/**
 * Une clases condicionales y resuelve los conflictos de Tailwind (gana la última).
 *
 * Uso: `cn('p-4', activo && 'bg-superficie', className)`
 *
 * Existe para que los componentes del design system acepten un `className` externo sin duplicar
 * utilidades contradictorias.
 */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return unirClases(clsx(clases));
}
