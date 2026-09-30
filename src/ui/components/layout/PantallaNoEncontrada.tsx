import { Compass } from 'lucide-react';
import { Insignia, Tarjeta } from '@ui/design-system';
import { EnlaceCtaPrimario } from '@ui/components/evaluacion/PantallaNivelBloqueado';
import { ruta } from '@ui/lib/ruta';

/**
 * Página 404: la dirección no existe (enlace roto, URL mal escrita o un nivel inexistente).
 *
 * Reemplaza la página genérica en inglés de GitHub Pages. Se pinta como HTML estático, sin
 * hidratar, para que funcione aunque el JavaScript no cargue.
 * Jakob: el mensaje explica el problema con palabras de la persona, no con un código técnico.
 * Apogeo-Final: nunca es un callejón sin salida. Hick: un único CTA primario, al mapa de niveles.
 */
export function PantallaNoEncontrada() {
  return (
    <div
      data-pantalla="no-encontrada"
      className="mx-auto flex w-full max-w-[40rem] flex-col gap-4 px-4 py-6"
    >
      <Tarjeta className="flex flex-col items-start gap-3">
        <Insignia tono="alerta">
          <Compass aria-hidden="true" className="h-4 w-4" />
          Página no encontrada
        </Insignia>

        <h1 className="text-title font-semibold text-tinta">Este camino no existe</h1>

        <p className="text-body text-tinta-suave">
          La dirección que abriste no corresponde a ninguna página de YAPU. Puede que el enlace esté
          mal escrito o que la página se haya movido.
        </p>

        <p className="text-caption text-tinta-tenue">
          Tu progreso está a salvo: vuelve al mapa de niveles para seguir aprendiendo.
        </p>
      </Tarjeta>

      <EnlaceCtaPrimario href={ruta('/')}>Volver al mapa de niveles</EnlaceCtaPrimario>
    </div>
  );
}

export default PantallaNoEncontrada;
