import { cn } from '@ui/lib/clases';
import { TituloParticulas } from './TituloParticulas';

export interface PropsPortada {
  className?: string;
}

/** Descripción del producto, en español y sin jerga técnica (Jakob: propuesta clara). */
const DESCRIPCION =
  'Aprende vocabulario y estructuras en quechua con evaluaciones generadas por IA determinista local, tarjetas interactivas y soporte sin conexión a internet.';

/**
 * Portada de la aplicación (RF-001 / RF-002).
 *
 * Composición: el título `YAPU` en `text-display` (lo pinta `TituloParticulas`, con su `<h1>`
 * accesible), el subtítulo `RUNASIMI YACHAY` en `text-caption` y la descripción en `text-body`.
 *
 * Hick (BLOQUEANTE): la portada es informativa y **no** añade ninguna acción primaria; el único
 * `data-cta="primario"` de la pantalla combinada lo pone `MapaNiveles` en el nivel actual, así que
 * nunca hay dos CTA compitiendo por la misma decisión.
 */
export function Portada({ className }: PropsPortada) {
  return (
    <section
      aria-label="YAPU, curso de quechua"
      className={cn(
        'bg-gradient-to-b from-andina-night via-andina-night-card to-andina-night px-4 pt-6 pb-8 text-center',
        className
      )}
    >
      <p className="text-caption font-bold uppercase tracking-[0.35em] text-andina-gold">
        RUNASIMI YACHAY
      </p>

      <TituloParticulas className="my-2" />

      <p className="mx-auto max-w-prose text-body leading-relaxed text-slate-300">{DESCRIPCION}</p>

      <p className="mt-2 text-caption text-slate-500">
        Nivel A1 certificable · Universidad Privada Domingo Savio
      </p>
    </section>
  );
}

export default Portada;
