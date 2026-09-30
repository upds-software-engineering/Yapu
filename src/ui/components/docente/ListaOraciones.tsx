import { useState } from 'react';
import type { OracionDto } from '@application/dto/contenido';
import { Boton, EstadoVacio, Insignia, Tarjeta, type TonoInsignia } from '@ui/design-system';

/** Miller: máximo de oraciones visibles por nivel antes de ofrecer `Ver más`. */
const MAXIMO_POR_NIVEL = 5;
/** Miller: cuántas oraciones añade cada pulsación de `Ver más`. */
const INCREMENTO_NIVEL = 5;

export interface PropsListaOraciones {
  oraciones: readonly OracionDto[];
  /** Título legible de cada nivel (`NivelDto.tituloEspanol`), para la cabecera del grupo. */
  titulosPorNivel: Readonly<Record<number, string>>;
}

interface GrupoNivel {
  nivelId: number;
  oraciones: OracionDto[];
}

/**
 * Miller: agrupa por nivel conservando el orden recibido (lo más reciente primero). Los niveles se
 * recorren de mayor a menor porque el corpus crece hacia los niveles altos y así lo nuevo queda
 * arriba, con cabeceras en lugar de una lista plana de decenas de tarjetas.
 */
function construirGrupos(oraciones: readonly OracionDto[]): GrupoNivel[] {
  const porNivel = new Map<number, OracionDto[]>();
  for (const oracion of oraciones) {
    const grupo = porNivel.get(oracion.nivelId);
    if (grupo) grupo.push(oracion);
    else porNivel.set(oracion.nivelId, [oracion]);
  }

  return [...porNivel.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([nivelId, delNivel]) => ({ nivelId, oraciones: delNivel }));
}

/** Traduce el estado de moderación a la pastilla del design system, sin jerga técnica. */
function insigniaEstado(estado: OracionDto['estado']): { texto: string; tono: TonoInsignia } {
  switch (estado) {
    case 'aprobado':
      return { texto: 'Aprobada', tono: 'exito' };
    case 'rechazado':
      return { texto: 'Rechazada', tono: 'error' };
    default:
      return { texto: 'Pendiente de moderación', tono: 'alerta' };
  }
}

/**
 * RF-006 — listado del corpus de oraciones base, agrupado por nivel.
 *
 * Miller (BLOQUEANTE): cada grupo muestra como máximo 5 oraciones y ofrece un control `Ver más`
 * para el resto, en lugar de volcar todo el corpus en una sola lista.
 */
export function ListaOraciones({ oraciones, titulosPorNivel }: PropsListaOraciones) {
  const [limites, setLimites] = useState<Record<number, number>>({});
  const grupos = construirGrupos(oraciones);

  if (oraciones.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay oraciones base"
        descripcion="Cuando registres la primera oración, aparecerá aquí agrupada por nivel y alimentará al generador de preguntas."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {grupos.map((grupo) => {
        const visible = limites[grupo.nivelId] ?? MAXIMO_POR_NIVEL;
        const mostradas = grupo.oraciones.slice(0, visible);
        const quedan = grupo.oraciones.length - mostradas.length;
        const titulo = titulosPorNivel[grupo.nivelId] ?? '';

        return (
          <section
            key={grupo.nivelId}
            data-grupo-nivel={grupo.nivelId}
            className="flex flex-col gap-3"
          >
            <h3 className="text-title font-display font-bold text-tinta">
              Nivel {grupo.nivelId}
              {titulo.length > 0 ? `: ${titulo}` : ''} ({grupo.oraciones.length})
            </h3>

            <div className="flex flex-col gap-3">
              {mostradas.map((oracion) => (
                <div key={oracion.id} data-oracion={oracion.id}>
                  <Tarjeta className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Insignia tono="marca">{`Palabra clave: ${oracion.palabraClaveTermino}`}</Insignia>
                      <Insignia tono="neutro">{oracion.categoria}</Insignia>
                      <Insignia tono={insigniaEstado(oracion.estado).tono}>
                        {insigniaEstado(oracion.estado).texto}
                      </Insignia>
                    </div>

                    <p className="text-body font-semibold text-tinta">{oracion.textoQuechua}</p>
                    <p className="text-body text-tinta-suave italic">{oracion.traduccionEspanol}</p>

                    {oracion.contextoCultural.length > 0 && (
                      <p className="text-caption text-tinta-tenue">
                        Contexto cultural: {oracion.contextoCultural}
                      </p>
                    )}
                  </Tarjeta>
                </div>
              ))}
            </div>

            {quedan > 0 && (
              <Boton
                variante="secundario"
                data-accion="ver-mas"
                onClick={() =>
                  setLimites((previos) => ({
                    ...previos,
                    [grupo.nivelId]: visible + INCREMENTO_NIVEL
                  }))
                }
              >
                Ver más oraciones del nivel {grupo.nivelId} ({quedan} restantes)
              </Boton>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default ListaOraciones;
