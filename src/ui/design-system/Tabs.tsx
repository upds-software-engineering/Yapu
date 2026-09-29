import React, { useRef, useState } from 'react';
import { cn } from '@ui/lib/clases';

export interface Pestana {
  id: string;
  etiqueta: string;
  contenido: React.ReactNode;
}

export interface PropsTabs {
  pestanas: Pestana[];
  idInicial?: string;
}

/**
 * Pestañas con el patrón WAI-ARIA *tabs* (Jakob: patrón estándar de panel de administración;
 * Hick: una sola sección visible a la vez).
 *
 * Accesibilidad y teclado:
 *  - el contenedor de botones es `role="tablist"` y cada botón `role="tab"` con `aria-selected`,
 *    `aria-controls` e `id`;
 *  - el panel es `role="tabpanel"` con `aria-labelledby` y `tabIndex={0}`;
 *  - flechas izquierda/derecha y Home/End mueven el foco con *roving tabindex* (sólo la pestaña
 *    activa tiene `tabIndex={0}`);
 *  - sólo se renderiza el panel activo.
 *
 * Fitts: cada pestaña respeta el mínimo táctil de 44×44 px en móvil.
 */
export function Tabs({ pestanas, idInicial }: PropsTabs) {
  const primerId = pestanas[0]?.id ?? '';
  const [activaId, setActivaId] = useState<string>(() =>
    idInicial && pestanas.some((pestana) => pestana.id === idInicial) ? idInicial : primerId
  );
  const botones = useRef<Array<HTMLButtonElement | null>>([]);

  const indiceEncontrado = pestanas.findIndex((pestana) => pestana.id === activaId);
  const indiceActivo = indiceEncontrado >= 0 ? indiceEncontrado : 0;
  const pestanaActiva = pestanas[indiceActivo];

  const mover = (destino: number) => {
    const total = pestanas.length;
    if (total === 0) return;
    const indice = ((destino % total) + total) % total;
    const siguiente = pestanas[indice];
    if (!siguiente) return;
    setActivaId(siguiente.id);
    botones.current[indice]?.focus();
  };

  const alTeclear = (evento: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (evento.key) {
      case 'ArrowRight':
        evento.preventDefault();
        mover(indiceActivo + 1);
        break;
      case 'ArrowLeft':
        evento.preventDefault();
        mover(indiceActivo - 1);
        break;
      case 'Home':
        evento.preventDefault();
        mover(0);
        break;
      case 'End':
        evento.preventDefault();
        mover(pestanas.length - 1);
        break;
      default:
        break;
    }
  };

  if (!pestanaActiva) return null;

  return (
    <div className="w-full">
      {/*
        El manejador de teclado vive en cada pestaña (no en el `tablist`) porque sólo la pestaña
        activa es tabulable: el foco siempre está dentro de una pestaña cuando llega la tecla.
      */}
      <div
        role="tablist"
        className="flex gap-2 overflow-x-auto border-b border-andina-night-border pb-1"
      >
        {pestanas.map((pestana, indice) => {
          const esActiva = pestana.id === pestanaActiva.id;
          return (
            <button
              key={pestana.id}
              ref={(elemento) => {
                botones.current[indice] = elemento;
              }}
              type="button"
              role="tab"
              id={`tab-${pestana.id}`}
              aria-selected={esActiva}
              aria-controls={`panel-${pestana.id}`}
              tabIndex={esActiva ? 0 : -1}
              onClick={() => setActivaId(pestana.id)}
              onKeyDown={alTeclear}
              className={cn(
                'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-t-xl px-4 py-2 text-body font-semibold',
                'transition-colors duration-200',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold',
                esActiva
                  ? 'border-b-2 border-andina-gold bg-andina-terracotta/15 text-andina-gold'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-100'
              )}
            >
              {pestana.etiqueta}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${pestanaActiva.id}`}
        aria-labelledby={`tab-${pestanaActiva.id}`}
        tabIndex={0}
        className="pt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold"
      >
        {pestanaActiva.contenido}
      </div>
    </div>
  );
}

export default Tabs;
