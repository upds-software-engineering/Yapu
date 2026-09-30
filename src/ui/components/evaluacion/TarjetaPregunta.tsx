import type { PreguntaDto } from '@application/dto';
import { Insignia, Tarjeta } from '@ui/design-system';
import { cn } from '@ui/lib/clases';

/**
 * Tarjeta de una pregunta del examen (RF-005).
 *
 * Miller: una sola pregunta a la vez, con su tipo y sus cuatro opciones, para no fragmentar la
 * atención. Fitts: cada opción es un `<button>` a ancho completo con el mínimo táctil de 44 px.
 * Accesibilidad: las opciones son botones reales (teclado y lector de pantalla) y la marcada se
 * anuncia con `aria-pressed`; las letras A–D son decorativas (`aria-hidden`).
 */
export interface PropsTarjetaPregunta {
  pregunta: PreguntaDto;
  /** Índice 0-based dentro de la evaluación; viaja en `data-indice` para las pruebas E2E. */
  indice: number;
  /** Opción marcada por el estudiante (RN-16: se puede cambiar hasta calificar). */
  opcionMarcada?: string;
  /** Marca una opción; la respuesta se guarda por `preguntaId` en la pantalla de evaluación. */
  onMarcar: (opcion: string) => void;
}

/** Letra de la opción (A–D): identifica la alternativa sin obligar a leerla entera. */
function letraDeOpcion(posicion: number): string {
  return String.fromCharCode(65 + posicion);
}

export function TarjetaPregunta({
  pregunta,
  indice,
  opcionMarcada,
  onMarcar
}: PropsTarjetaPregunta) {
  const idEnunciado = `enunciado-${pregunta.id}`;

  return (
    <section
      data-pregunta={pregunta.id}
      data-indice={indice}
      aria-labelledby={idEnunciado}
      className="flex flex-col gap-3"
    >
      <Tarjeta className="flex flex-col items-start gap-2">
        <Insignia tono="marca">{pregunta.etiquetaTipo}</Insignia>
        <h2
          id={idEnunciado}
          className="text-title font-semibold whitespace-pre-line text-tinta"
        >
          {pregunta.enunciado}
        </h2>
      </Tarjeta>

      <ul className="flex flex-col gap-2">
        {pregunta.opciones.map((opcion, posicion) => {
          const marcada = opcion === opcionMarcada;

          return (
            <li key={opcion}>
              <button
                type="button"
                data-opcion={opcion}
                aria-pressed={marcada}
                onClick={() => onMarcar(opcion)}
                className={cn(
                  'flex w-full min-h-tactil min-w-tactil items-center gap-3 rounded-2xl border px-4 py-3',
                  'text-left text-body transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte',
                  marcada
                    ? 'border-acento bg-acento font-semibold text-fondo'
                    : 'border-linea bg-superficie text-tinta hover:border-primario/60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-bold',
                    marcada ? 'bg-fondo text-acento' : 'bg-superficie-alta text-tinta-suave'
                  )}
                >
                  {letraDeOpcion(posicion)}
                </span>
                <span>{opcion}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default TarjetaPregunta;
