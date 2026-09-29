import { useState } from 'react';
import type { SesionDto } from '@application/dto/contenido';
import { Boton, MensajeError, Tarjeta } from '@ui/design-system';
import { ruta } from '@ui/lib/ruta';

export interface PropsGuardiaDocente {
  /** RF-001: sesión actual; se usa para explicar en español con qué rol se llegó aquí. */
  sesion: SesionDto | null;
  /**
   * RF-001 / ADR-003: ejecuta `CambiarRolUseCase`. Devuelve la sesión nueva o `null` cuando el
   * cambio falló; en ese caso `error` ya trae el mensaje en español.
   */
  alCambiarRol: () => Promise<SesionDto | null>;
  /** Error del caso de uso, ya traducido a español, o `null` mientras no haya fallo. */
  error?: string | null;
}

/** CTA primario escrito a mano: el design system todavía no expone un `EnlaceBoton`. */
const CLASES_ENLACE_SECUNDARIO = [
  'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2',
  'text-body font-semibold',
  'border border-andina-night-border bg-andina-night-card text-slate-100',
  'transition-colors duration-200 hover:bg-andina-night-muted/40 active:bg-andina-night-muted/60',
  'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold'
].join(' ');

/**
 * RF-001 / ADR-003 — guardia de rol del panel docente.
 *
 * Se pinta ÚNICAMENTE cuando la sesión activa no es docente: el panel completo queda fuera del
 * árbol (no basta con ocultarlo), así que ningún caso de uso de RF-006/RF-007 llega a ejecutarse.
 *
 * Hick: una sola acción primaria —`Cambiar a rol docente`— y una salida secundaria hacia el mapa,
 * para que la pantalla no sea un callejón sin salida (Apogeo-Final).
 */
export function GuardiaDocente({ sesion, alCambiarRol, error }: PropsGuardiaDocente) {
  const [cambiando, setCambiando] = useState(false);

  const nombre = sesion?.nombre?.trim() ?? '';
  const etiquetaRol = sesion === null ? 'invitada o invitado' : sesion.rol;

  async function cambiar(): Promise<void> {
    setCambiando(true);
    try {
      await alCambiarRol();
    } finally {
      setCambiando(false);
    }
  }

  return (
    <section
      data-pantalla="docente"
      data-guardia="rol"
      className="mx-auto flex w-full max-w-xl flex-col gap-4"
    >
      <Tarjeta className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-display font-display font-bold text-sand">Panel docente</h1>
        <p className="text-body text-slate-300">
          Esta pantalla es sólo para docentes: aquí se registran las oraciones base del corpus y se
          moderan los retos de la comunidad (RF-006 y RF-007).
        </p>
        <p className="text-body text-slate-400">
          {nombre.length > 0
            ? `Tu sesión actual es de ${etiquetaRol} y se llama ${nombre}.`
            : `Tu sesión actual no tiene el rol docente (rol: ${etiquetaRol}).`}{' '}
          Cambia a rol docente para entrar; puedes volver cuando quieras.
        </p>

        {error !== null && error !== undefined && <MensajeError mensaje={error} />}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {/* Hick: el ÚNICO `data-cta="primario"` de la guardia es el cambio de rol. */}
          <Boton
            esCtaPrimario
            variante="primario"
            cargando={cambiando}
            disabled={cambiando}
            onClick={() => void cambiar()}
          >
            Cambiar a rol docente
          </Boton>
          <a href={ruta('/')} className={CLASES_ENLACE_SECUNDARIO}>
            Volver al mapa
          </a>
        </div>
      </Tarjeta>
    </section>
  );
}

export default GuardiaDocente;
