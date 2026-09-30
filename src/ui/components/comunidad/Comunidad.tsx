import { useCallback, useRef, useState } from 'react';
import type { ListaRetosDto, RetoDto } from '@application/dto/contenido';
import type { EntradaReto } from '@application/use-cases/ProponerRetoUseCase';
import { Boton, EstadoCarga, EstadoVacio, MensajeError, Tarjeta } from '@ui/design-system';
import { useCasoDeUso, useServicios } from '@ui/hooks';
import { cn } from '@ui/lib/clases';
import { mensajeDeError } from '@ui/lib/mensajes';
import { ruta } from '@ui/lib/ruta';

import { FormularioReto } from './FormularioReto';
import { TarjetaReto } from './TarjetaReto';

/**
 * Miller: por encima de 6 retos la pantalla se agrupa por estado (primero los aprobados, después
 * los pendientes) y cada grupo muestra como máximo 6 tarjetas con un control `Ver más`.
 */
const MAXIMO_POR_GRUPO = 6;

/** Miller: en cuanto hay más de 6 retos hay que agrupar; con menos, una lista plana basta. */
const MAXIMO_SIN_AGRUPAR = 6;

/** Miller: cuántas tarjetas se ven por grupo en cada pulsación de `Ver más`. */
const INCREMENTO_GRUPO = 6;

interface GrupoRetos {
  clave: 'aprobado' | 'pendiente';
  titulo: string;
  retos: RetoDto[];
}

/**
 * Orden de lectura (Miller): primero los aprobados —contenido ya publicado— y después los
 * pendientes de moderación. Dentro de cada grupo se respeta el orden del caso de uso
 * (lo más nuevo primero), así que la función es un `sort` estable.
 */
function ordenarPorEstado(retos: readonly RetoDto[]): RetoDto[] {
  const prioridad = (reto: RetoDto): number => (reto.estado === 'aprobado' ? 0 : 1);
  return [...retos].sort((a, b) => prioridad(a) - prioridad(b));
}

/**
 * Agrupa los retos por estado conservando el orden de entrada. Devuelve un único grupo cuando la
 * lista es pequeña, para no añadir cabeceras innecesarias (Hick/Miller).
 */
function construirGrupos(retos: readonly RetoDto[]): GrupoRetos[] {
  const ordenados = ordenarPorEstado(retos);
  if (ordenados.length <= MAXIMO_SIN_AGRUPAR) {
    return [{ clave: 'aprobado', titulo: 'Retos publicados por la comunidad', retos: ordenados }];
  }

  const aprobados = ordenados.filter((reto) => reto.estado === 'aprobado');
  const pendientes = ordenados.filter((reto) => reto.estado !== 'aprobado');
  const grupos: GrupoRetos[] = [];

  if (aprobados.length > 0) {
    grupos.push({ clave: 'aprobado', titulo: 'Primero los aprobados', retos: aprobados });
  }
  if (pendientes.length > 0) {
    grupos.push({ clave: 'pendiente', titulo: 'Después los pendientes', retos: pendientes });
  }
  return grupos;
}

/**
 * RF-007 / RN-13 — pantalla de retos comunitarios.
 *
 * Una sola pantalla con dos modos, decididos por `permiso.puedeProponer` del DTO (la UI no
 * reimplementa la regla de negocio):
 *  - puede proponer: se ofrece el formulario y el ÚNICO `data-cta="primario"` es `Proponer un reto`;
 *  - no puede: el formulario NO se pinta; en su lugar aparece el aviso
 *    `data-aviso="nivel-insuficiente"` con el `motivo` del caso de uso, y el CTA primario pasa a
 *    ser `Seguir aprendiendo` (Apogeo-Final: nunca un callejón sin salida).
 *
 * Hick: exactamente UN CTA primario por pantalla, en cualquier estado de carga, error o vacío.
 *
 * Dos detalles del contrato de selectores que el E2E comprueba sobre el DOM real:
 *  - `data-aviso="nivel-insuficiente"` se marca en un envoltorio propio, porque `Tarjeta` no
 *    reenvía props arbitrarias al `div` que pinta;
 *  - una recarga no desmonta el contenido ya cargado, de modo que la confirmación de RN-13 del
 *    formulario (`role="status"` dentro de `[data-formulario="reto"]`) sobrevive al refresco.
 */
export function Comunidad() {
  const { listarRetos, proponerReto } = useServicios();

  const listar = useCallback((): Promise<ListaRetosDto> => listarRetos.ejecutar(), [listarRetos]);
  const { datos, cargando, error, ejecutar } = useCasoDeUso(listar, { ejecutarAlMontar: [] });

  const [formularioAbierto, setFormularioAbierto] = useState(true);
  const [errorPropuesta, setErrorPropuesta] = useState<string | null>(null);
  const [limites, setLimites] = useState<Record<string, number>>({});
  const referenciaFormulario = useRef<HTMLDivElement | null>(null);
  const referenciaPrimerCampo = useRef<HTMLInputElement | null>(null);

  const recargar = useCallback((): void => {
    void ejecutar();
  }, [ejecutar]);

  /**
   * RF-007: enlaza el formulario con `ProponerRetoUseCase` sin que el componente lo construya.
   * El fallo se traduce aquí a español (`mensajeDeError`) y se devuelve `null` para que el
   * formulario NO limpie los campos ni refresque la lista cuando la propuesta no llegó a guardarse.
   */
  const proponer = useCallback(
    async (entrada: EntradaReto): Promise<RetoDto | null> => {
      setErrorPropuesta(null);
      try {
        return await proponerReto.ejecutar(entrada);
      } catch (fallo) {
        setErrorPropuesta(mensajeDeError(fallo));
        return null;
      }
    },
    [proponerReto]
  );

  /** Hick: el CTA primario abre el formulario y deja el foco en el primer campo obligatorio. */
  function abrirFormulario(): void {
    setFormularioAbierto(true);
    referenciaFormulario.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    referenciaPrimerCampo.current?.focus();
  }

  const permiso = datos?.permiso ?? null;
  const puedeProponer = permiso?.puedeProponer ?? false;

  return (
    <section data-pantalla="comunidad" className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-display font-display font-bold text-tinta">Retos de la Comunidad</h1>
        <p className="text-body text-tinta-tenue">
          Aprende con retos creados por otras y otros estudiantes y validados por docentes.
        </p>
      </header>

      {/*
       * Jakob/Fitts: el cargador sólo sustituye a la pantalla en la PRIMERA carga, mientras todavía
       * no hay datos. Una recarga —«Actualizar lista» o el refresco posterior a proponer un reto— NO
       * desmonta el contenido: si lo hiciera se perderían los campos ya escritos y, sobre todo, la
       * confirmación de RN-13 («pendiente de moderación por dos docentes distintos»), que el E2E
       * exige seguir encontrando dentro de `[data-formulario="reto"]` con `getByRole('status')`.
       */}
      {cargando && datos === null && <EstadoCarga mensaje="Cargando los retos de la comunidad…" />}

      {!cargando && error !== null && (
        <MensajeError
          mensaje={error}
          onReintentar={recargar}
          textoReintentar="Volver a cargar los retos"
        />
      )}

      {error === null && datos !== null && permiso !== null && (
        <>
          {puedeProponer ? (
            <Tarjeta className="flex flex-col gap-3">
              <h2 className="text-title font-display font-bold text-tinta">
                Publicar un Reto Lingüístico
              </h2>
              <p className="text-body text-tinta-tenue">{permiso.motivo}</p>

              {formularioAbierto && (
                <div ref={referenciaFormulario} className="flex flex-col gap-3">
                  <FormularioReto
                    alProponer={proponer}
                    error={errorPropuesta}
                    alLimpiarError={() => setErrorPropuesta(null)}
                    alRefrescar={recargar}
                    alCerrar={() => setFormularioAbierto(false)}
                    referenciaPrimerCampo={referenciaPrimerCampo}
                  />
                </div>
              )}
            </Tarjeta>
          ) : (
            /*
             * El contrato de selectores (E2E: `[data-aviso="nivel-insuficiente"]` visible) exige que
             * la marca sea un atributo REAL del DOM. `Tarjeta` es un contenedor del design system que
             * sólo acepta `className`/`interactiva`/`etiqueta` y no reenvía el resto de props, así que
             * el aviso se marca en este envoltorio y no en el componente.
             */
            <div data-aviso="nivel-insuficiente">
              <Tarjeta className="flex flex-col gap-2 border-alerta/40 bg-alerta/10">
                <h2 className="text-title font-display font-bold text-alerta">
                  Aún no puedes proponer retos
                </h2>
                <p className="text-body text-alerta">{permiso.motivo}</p>
                <p className="text-body text-alerta">
                  Se requiere el nivel {permiso.nivelRequerido} y tú estás en el nivel{' '}
                  {permiso.nivelActual}. Sigue avanzando: cada nivel aprobado te acerca a proponer
                  tus propios retos.
                </p>
              </Tarjeta>
            </div>
          )}

          {datos.retos.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no hay retos publicados"
              descripcion="Cuando la comunidad proponga y los docentes aprueben un reto, aparecerá aquí."
            />
          ) : (
            <ListaRetos
              retos={datos.retos}
              limites={limites}
              alVerMas={(clave, siguiente) =>
                setLimites((previos) => ({ ...previos, [clave]: siguiente }))
              }
            />
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {puedeProponer ? (
          <Boton esCtaPrimario variante="primario" onClick={abrirFormulario}>
            Proponer un reto
          </Boton>
        ) : (
          <a
            href={ruta('/')}
            data-cta="primario"
            className="inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl bg-primario px-4 py-2 text-body font-semibold text-white shadow-lg shadow-primario/25 transition-colors duration-200 hover:bg-primario-hover active:bg-primario-activo md:min-h-tactil-escritorio md:min-w-tactil-escritorio focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
          >
            Seguir aprendiendo
          </a>
        )}

        {!cargando && (
          <Boton variante="secundario" onClick={recargar}>
            Actualizar lista
          </Boton>
        )}
      </div>
    </section>
  );
}

interface PropsListaRetos {
  retos: readonly RetoDto[];
  limites: Record<string, number>;
  alVerMas: (clave: string, siguiente: number) => void;
}

/** Miller: agrupa por estado y recorta cada grupo con un `Ver más` de 6 en 6. */
function ListaRetos({ retos, limites, alVerMas }: PropsListaRetos) {
  const grupos = construirGrupos(retos);

  return (
    <div className="flex flex-col gap-6">
      {grupos.map((grupo) => {
        const visible = limites[grupo.clave] ?? MAXIMO_POR_GRUPO;
        const mostrados = grupo.retos.slice(0, visible);
        const quedan = grupo.retos.length - mostrados.length;

        return (
          <div key={grupo.clave} className="flex flex-col gap-3">
            <h2
              className={cn(
                'text-title font-display font-bold',
                grupo.clave === 'aprobado' ? 'text-tinta' : 'text-alerta'
              )}
            >
              {grupo.titulo} ({grupo.retos.length})
            </h2>

            <div className="flex flex-col gap-3">
              {mostrados.map((reto) => (
                <TarjetaReto key={reto.id} reto={reto} />
              ))}
            </div>

            {quedan > 0 && (
              <Boton
                variante="secundario"
                onClick={() => alVerMas(grupo.clave, visible + INCREMENTO_GRUPO)}
              >
                Ver más retos ({quedan} restantes)
              </Boton>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Comunidad;
