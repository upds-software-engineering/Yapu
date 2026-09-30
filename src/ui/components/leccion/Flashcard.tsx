import React from 'react';
import { PlayCircle } from 'lucide-react';
import type { PalabraDto } from '@application/dto/aprendizaje';
import { Insignia, PlaceholderCategoria } from '@ui/design-system';
import { cn } from '@ui/lib/clases';

export interface PropsFlashcard {
  /** RF-004: palabra que se practica (DTO plano de la capa de aplicación). */
  palabra: PalabraDto;
  /** ¿Está mostrando ya la traducción? */
  volteada: boolean;
  /** Alterna entre término y traducción (toque, clic, `Enter` o `Espacio`). */
  alVoltear: () => void;
  /** `prefers-reduced-motion`: sin giro 3D, se pinta directamente la cara vigente. */
  movimientoReducido?: boolean;
  /**
   * Teclado de la lección (`←`/`→`). Vive en la tarjeta, y no en el contenedor, porque la tarjeta
   * es el `<button>` nativo que recibe el foco: el `<section>`/`<div>` de la pantalla no puede
   * llevar manejadores de teclado sin un rol interactivo (y forzarlo rompería el modo navegación
   * del lector de pantalla). El evento sube igualmente hasta la pantalla que orquesta la lección.
   */
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  className?: string;
}

/** RF-004: alto de la tarjeta, cómodo al tacto sin invadir la franja del CTA fijo. */
const ALTO_TARJETA = 'h-72 sm:h-80';

/** Caras apiladas: sólo una queda visible (`invisible`) sin sacar la otra del DOM. */
const CARA = 'absolute inset-0 flex h-full w-full flex-col gap-3 rounded-3xl p-5';
const CARA_3D = 'backface-hidden';
const CARA_APAGADA = 'invisible';

/**
 * RF-004 — La flashcard: el término en quechua al anverso y su traducción al reverso.
 *
 * Accesibilidad: la tarjeta es un `<button>`, no un `<div>` con `onClick`. Así se alcanza con `Tab`
 * y se voltea con `Enter` y con `Espacio` de forma nativa (sin `preventDefault` que rompa el
 * control), y el lector de pantalla anuncia su estado con `aria-pressed`. La cara oculta se marca
 * `aria-hidden` para no adelantar la respuesta.
 *
 * `prefers-reduced-motion`: se cambia de estrategia. En lugar de animar un giro 3D —que marea y
 * además el sistema pide evitar—, se pinta directamente la cara correspondiente.
 *
 * Fitts (BLOQUEANTE): `min-h-tactil min-w-tactil` garantiza 44×44 px en móvil.
 * Estética-Usabilidad: la tipografía sale siempre de `text-caption|body|title|display`.
 */
export function Flashcard({
  palabra,
  volteada,
  alVoltear,
  movimientoReducido = false,
  onKeyDown,
  className
}: PropsFlashcard) {
  const etiqueta = `${palabra.termino} — ${palabra.traduccion}`;
  const pista = volteada ? 'Toca para ver el quechua' : 'Toca para ver la traducción';
  const conGiro = !movimientoReducido;

  return (
    <button
      type="button"
      data-flashcard=""
      aria-pressed={volteada}
      aria-label={etiqueta}
      onClick={alVoltear}
      onKeyDown={onKeyDown}
      className={cn(
        // Fitts (BLOQUEANTE): objetivo táctil de 44×44 px como mínimo.
        'perspective-1000 block w-full min-h-tactil min-w-tactil cursor-pointer select-none rounded-3xl text-left',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte',
        ALTO_TARJETA,
        className
      )}
    >
      <div
        className={cn(
          'relative h-full w-full',
          conGiro
            ? cn('transform-style-3d transition-transform duration-500', volteada && 'rotate-y-180')
            : // Sin giro 3D: la cara vigente se muestra tal cual, sin transformación alguna.
              'transform-none'
        )}
      >
        {/*
          Anverso: el término en quechua, su pronunciación y el respaldo ilustrado.

          `data-cara` es el anclaje de pruebas de cada cara: las dos viven SIEMPRE en el DOM (la 3D
          gira sobre ellas) y la oculta sólo se distingue por `invisible` + `aria-hidden`, así que
          sin este atributo las pruebas no podrían apuntar a una cara concreta sin depender del
          orden de los nodos.
        */}
        <div
          data-cara="anverso"
          aria-hidden={volteada}
          className={cn(
            CARA,
            CARA_3D,
            'justify-between border-2 border-linea bg-gradient-to-br from-superficie to-fondo',
            volteada && CARA_APAGADA
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Insignia tono="marca">{palabra.etiquetaCategoria}</Insignia>
            <span className="flex items-center gap-1 text-caption text-tinta-tenue">
              <PlayCircle aria-hidden="true" className="h-4 w-4" />
              {pista}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center">
            {palabra.imagenUrl ? (
              // RF-004: imagen real de la palabra, diferida y con texto alternativo con sentido.
              <img
                src={palabra.imagenUrl}
                alt={etiqueta}
                loading="lazy"
                decoding="async"
                className="max-h-full w-auto rounded-2xl object-contain"
              />
            ) : (
              // RF-004: respaldo SVG inline por categoría gramatical, sin descargas nuevas.
              <PlaceholderCategoria
                categoria={palabra.categoria}
                termino={palabra.termino}
                className="max-h-full w-auto"
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-display font-display font-extrabold tracking-tight text-tinta">
              {palabra.termino}
            </p>
            {palabra.pronunciacion.length > 0 && (
              <p className="text-body text-acento">
                Pronunciación: [{palabra.pronunciacion}]
              </p>
            )}
          </div>

          {palabra.contextoCultural.length > 0 && (
            <p className="rounded-xl border border-linea bg-fondo/60 px-3 py-2 text-center text-caption text-tinta-tenue">
              {palabra.contextoCultural}
            </p>
          )}
        </div>

        {/* Reverso: la traducción al español con su ejemplo de uso (mismo anclaje `data-cara`). */}
        <div
          data-cara="reverso"
          aria-hidden={!volteada}
          className={cn(
            CARA,
            'justify-between border-2 border-info/60 bg-gradient-to-br from-superficie-alta to-fondo',
            conGiro ? cn(CARA_3D, 'rotate-y-180') : undefined,
            !volteada && CARA_APAGADA
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Insignia tono="exito">Significado en español</Insignia>
            <span className="text-caption text-tinta-tenue">{pista}</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-title font-display font-extrabold tracking-tight text-info">
              {palabra.traduccion}
            </p>
            {palabra.ejemploUso !== undefined && palabra.ejemploUso.length > 0 && (
              <div className="w-full rounded-xl border border-linea bg-fondo/70 p-3 text-left">
                <span className="block text-caption font-semibold uppercase tracking-widest text-tinta-tenue">
                  Ejemplo en oración
                </span>
                <p className="mt-1 text-body italic text-tinta">{palabra.ejemploUso}</p>
              </div>
            )}
          </div>

          <p className="text-center text-caption text-tinta-tenue">{palabra.termino}</p>
        </div>
      </div>
    </button>
  );
}

export default Flashcard;
