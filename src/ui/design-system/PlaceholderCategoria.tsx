import React from 'react';
import { cn } from '@ui/lib/clases';

/**
 * RF-004: ilustración SVG de respaldo cuando la palabra no trae `imagenUrl`.
 *
 * Los dibujos son SVG inline (sin descargas nuevas) y hay uno distinto por categoría gramatical.
 * La categoría llega como `string` a propósito: la capa `ui` tiene prohibido importar tipos de
 * `@domain`, así que el mapa se tipa con `Record<string, React.ReactNode>` y cae en un respaldo
 * genérico cuando la categoría no está en el mapa.
 *
 * Accesibilidad: el SVG es `role="img"` con `aria-label={`Ilustración de ${termino}`}`, de modo que
 * nunca queda un gráfico sin nombre.
 */

const FONDO = (
  <circle cx="60" cy="60" r="52" fill="#131C2E" stroke="#1E293B" strokeWidth="2" />
);

/** Respaldo genérico (llama andina) para categorías desconocidas. */
const ILUSTRACION_GENERICA: React.ReactNode = (
  <>
    {FONDO}
    <path d="M60 22 C74 42 86 52 86 68 A26 26 0 0 1 34 68 C34 52 46 42 60 22 Z" fill="#E05A00" />
    <path d="M60 52 C68 62 72 68 72 74 A12 12 0 0 1 48 74 C48 68 52 62 60 52 Z" fill="#F59E0B" />
  </>
);

const ILUSTRACIONES: Record<string, React.ReactNode> = {
  // Sustantivo: el Apu, la montaña que nombra las cosas del mundo.
  sustantivo: (
    <>
      {FONDO}
      <path d="M20 88 L48 40 L64 66 L78 48 L100 88 Z" fill="#0D9488" />
      <path d="M48 40 L64 66 L52 88 L34 88 Z" fill="#0F766E" />
      <circle cx="86" cy="34" r="9" fill="#F59E0B" />
    </>
  ),
  // Verbo: la acción, representada como movimiento hacia adelante.
  verbo: (
    <>
      {FONDO}
      <path d="M34 60 H76" stroke="#E05A00" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M62 40 L88 60 L62 80"
        stroke="#E05A00"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M28 40 H46" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
      <path d="M24 80 H42" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  // Adjetivo: la cualidad, ese brillo que califica al sustantivo.
  adjetivo: (
    <>
      {FONDO}
      <path d="M60 20 L71 49 L100 60 L71 71 L60 100 L49 71 L20 60 L49 49 Z" fill="#F59E0B" />
      <circle cx="60" cy="60" r="7" fill="#FDFBF7" />
    </>
  ),
  // Saludo: la conversación, burbuja de diálogo.
  saludo: (
    <>
      {FONDO}
      <rect x="22" y="34" width="76" height="48" rx="14" fill="#0D9488" />
      <path d="M42 80 L42 98 L62 80 Z" fill="#0D9488" />
      <circle cx="46" cy="58" r="4.5" fill="#FDFBF7" />
      <circle cx="60" cy="58" r="4.5" fill="#FDFBF7" />
      <circle cx="74" cy="58" r="4.5" fill="#FDFBF7" />
    </>
  ),
  // Número: tres cuentas del yupana.
  numero: (
    <>
      {FONDO}
      <circle cx="38" cy="60" r="11" fill="#F59E0B" />
      <circle cx="60" cy="60" r="11" fill="#E05A00" />
      <circle cx="82" cy="60" r="11" fill="#0D9488" />
    </>
  ),
  // Pronombre: la persona que habla y a quien se nombra.
  pronombre: (
    <>
      {FONDO}
      <circle cx="60" cy="46" r="15" fill="#38BDF8" />
      <path d="M30 94 A30 26 0 0 1 90 94 Z" fill="#0D9488" />
    </>
  ),
  // Interrogativo: la pregunta.
  interrogativo: (
    <>
      {FONDO}
      <path
        d="M44 50 A18 18 0 1 1 66 66 L66 72"
        stroke="#F59E0B"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="66" cy="90" r="6.5" fill="#F59E0B" />
    </>
  )
};

export interface PropsPlaceholderCategoria {
  /** Categoría gramatical como texto (`PalabraDto.etiquetaCategoria` o `PalabraDto.categoria`). */
  categoria: string;
  /** Término que se ilustra; se usa en la etiqueta accesible. */
  termino: string;
  className?: string;
}

/** Ilustración accesible por categoría gramatical, usada como respaldo de la flashcard. */
export function PlaceholderCategoria({ categoria, termino, className }: PropsPlaceholderCategoria) {
  return (
    <svg
      role="img"
      aria-label={`Ilustración de ${termino}`}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
    >
      {ILUSTRACIONES[categoria] ?? ILUSTRACION_GENERICA}
    </svg>
  );
}

export default PlaceholderCategoria;
