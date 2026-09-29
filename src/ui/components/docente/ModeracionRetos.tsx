import { useState } from 'react';
import type { RetoDto } from '@application/dto/contenido';
import {
  BarraProgreso,
  Boton,
  EstadoVacio,
  Insignia,
  MensajeError,
  Tarjeta,
  type TonoInsignia
} from '@ui/design-system';

export interface PropsModeracionRetos {
  retos: readonly RetoDto[];
  /**
   * RF-007: ejecuta `ModerarRetoUseCase`. Devuelve el reto actualizado o `null` si la moderación
   * no se guardó; en ese caso el panel ya deja el mensaje de error en `error`.
   */
  alModerar: (retoId: string, decision: 'aprobado' | 'rechazado') => Promise<RetoDto | null>;
  /** Errores de dominio (`CONFLICTO_ESTADO`, `PERMISO_DENEGADO`) ya traducidos a español. */
  error: string | null;
}

/** Estado de moderación del reto en la pastilla del design system. */
function insigniaEstado(estado: RetoDto['estado']): { texto: string; tono: TonoInsignia } {
  switch (estado) {
    case 'aprobado':
      return { texto: 'Publicado', tono: 'exito' };
    case 'rechazado':
      return { texto: 'Rechazado', tono: 'error' };
    default:
      return { texto: 'Pendiente', tono: 'alerta' };
  }
}

/**
 * RN-13 — explica en español por qué este docente no puede votar este reto.
 *
 * Devuelve `null` cuando la moderación SÍ está disponible. El orden importa: primero el estado ya
 * resuelto, después la autoría y por último el voto ya emitido.
 */
function motivoSinModerar(reto: RetoDto): string | null {
  if (reto.estado === 'rechazado') {
    return 'Este reto ya fue rechazado por un docente: la moderación quedó cerrada (RN-13).';
  }
  if (reto.estado === 'aprobado') {
    return 'Este reto ya reunió las dos aprobaciones y está publicado en la comunidad (RN-13).';
  }
  if (reto.esMiAutoría) {
    return 'Nadie puede moderar su propio reto comunitario (RN-13).';
  }
  if (reto.votadoPorMi) {
    return 'Ya emitiste tu voto en este reto: cada docente modera una sola vez (RN-13).';
  }
  return null;
}

/**
 * RF-007 / RS-003 / RN-13 — moderación de los retos comunitarios.
 *
 * Cada tarjeta muestra el estado del reto, su bitácora y el progreso
 * `aprobaciones de aprobacionesRequeridas`, porque el dominio exige DOS aprobaciones de docentes
 * distintos. Los botones se deshabilitan —con una explicación en español— cuando el reto ya está
 * resuelto, cuando este docente ya votó o cuando el reto es de su propia autoría.
 *
 * Hick: `Aprobar` es la única acción primaria cuando la moderación está disponible; con varios
 * retos abiertos sólo la primera tarjeta lleva el CTA primario, para no repartir la jerarquía.
 */
export function ModeracionRetos({ retos, alModerar, error }: PropsModeracionRetos) {
  const [enCurso, setEnCurso] = useState<string | null>(null);

  if (retos.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay retos que moderar"
        descripcion="Cuando el estudiantado proponga retos comunitarios, aparecerán aquí para su doble moderación (RN-13)."
      />
    );
  }

  const primerRetoModerable = retos.findIndex((reto) => motivoSinModerar(reto) === null);

  async function moderar(retoId: string, decision: 'aprobado' | 'rechazado'): Promise<void> {
    setEnCurso(retoId);
    try {
      await alModerar(retoId, decision);
    } finally {
      setEnCurso(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-amber-200">
        Cada reto necesita DOS aprobaciones de docentes distintos para publicarse. Un solo rechazo
        cierra la moderación (RN-13).
      </p>

      {/* El error de dominio se muestra sin desmontar la lista: se puede seguir moderando el resto. */}
      {error !== null && <MensajeError mensaje={error} />}

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        {retos.map((reto, indice) => {
          const motivo = motivoSinModerar(reto);
          const estado = insigniaEstado(reto.estado);
          const moderando = enCurso === reto.id;
          const habilita = motivo === null && !moderando;
          const esCtaPrimario = indice === primerRetoModerable && motivo === null;

          return (
            <div key={reto.id} data-reto={reto.id}>
              <Tarjeta className="flex h-full flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-body font-semibold text-sand">
                      Propuesta de {reto.nombreAutor}
                    </p>
                    <Insignia tono={estado.tono}>{estado.texto}</Insignia>
                  </div>

                  <p className="text-body font-semibold text-andina-gold">{reto.textoQuechua}</p>
                  <p className="text-body text-slate-300">
                    Traducción propuesta: {reto.traduccionSugerida}
                  </p>
                  <p className="text-caption text-slate-400">
                    Nivel sugerido: {reto.nivelSugerido}
                    {reto.pistaCultural.length > 0 ? ` · Pista cultural: ${reto.pistaCultural}` : ''}
                  </p>

                  <div className="flex flex-col gap-1">
                    <p className="text-caption text-slate-300">
                      {reto.aprobaciones} de {reto.aprobacionesRequeridas} aprobaciones de docentes
                    </p>
                    <BarraProgreso
                      valor={reto.aprobaciones}
                      max={reto.aprobacionesRequeridas}
                      etiqueta="Progreso de moderación del reto"
                    />
                  </div>

                  <p className="text-caption text-slate-400">
                    {reto.moderaciones.length === 0
                      ? 'Todavía no hay votos registrados en la bitácora.'
                      : `Bitácora: ${reto.moderaciones
                          .map((moderacion) => `${moderacion.docenteId} → ${moderacion.decision}`)
                          .join(' · ')}`}
                  </p>

                  {motivo !== null && (
                    <p data-motivo-sin-moderar className="text-body text-amber-200">
                      {motivo}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Boton
                    variante="peligro"
                    tamano="compacto"
                    data-accion="rechazar"
                    disabled={!habilita}
                    cargando={moderando}
                    onClick={() => void moderar(reto.id, 'rechazado')}
                  >
                    Rechazar
                  </Boton>
                  {/* Accesibilidad: los botones siempre existen, deshabilitados con su motivo visible. */}
                  <Boton
                    variante="primario"
                    tamano="compacto"
                    esCtaPrimario={esCtaPrimario}
                    data-accion="aprobar"
                    disabled={!habilita}
                    cargando={moderando}
                    onClick={() => void moderar(reto.id, 'aprobado')}
                  >
                    Aprobar
                  </Boton>
                </div>
              </Tarjeta>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModeracionRetos;
