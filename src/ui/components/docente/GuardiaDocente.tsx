import { GraduationCap, LogIn } from 'lucide-react';
import { Tarjeta } from '@ui/design-system';
import { ruta } from '@ui/lib/ruta';

export interface PropsGuardiaDocente {
  /**
   * RF-001: nombre de la sesión autenticada que llegó sin rol docente, o `null` si se navega como
   * invitado. Sólo se usa para explicar en español por qué no se puede entrar.
   */
  nombreSesion: string | null;
  /** Acción de conveniencia para cambiar de rol inmediatamente (pruebas / demo rápida). */
  alCambiarRolDocente?: () => void | Promise<void>;
}

const CLASES_ENLACE = [
  'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-2 rounded-xl px-4 py-2',
  'text-body font-semibold transition-colors duration-200',
  'md:min-h-tactil-escritorio md:min-w-tactil-escritorio',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte'
].join(' ');

/**
 * RF-001 / RF-002 — guardia del panel docente.
 *
 * El panel exige un rol docente. Sin él, el panel no se monta (ningún caso de uso de RF-006/RF-007
 * llega a ejecutarse) y se ofrece iniciar sesión como docente, con vuelta automática a `/docente`.
 *
 * Hick: una sola acción primaria —iniciar sesión— y salidas secundarias (Apogeo-Final).
 */
export function GuardiaDocente({ nombreSesion, alCambiarRolDocente }: PropsGuardiaDocente) {
  return (
    <section
      data-pantalla="docente"
      data-guardia="rol"
      className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:py-16 sm:px-6"
    >
      <Tarjeta className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primario/15 text-acento"
        >
          <GraduationCap className="h-7 w-7" />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="text-display font-display font-bold text-tinta">Panel docente</h1>
          <p className="max-w-md text-body text-tinta-suave">
            Esta pantalla es sólo para docentes: aquí se registran las oraciones base del corpus y se
            moderan los retos de la comunidad (RF-006 y RF-007).
          </p>
          <p className="text-body text-tinta-tenue">
            {nombreSesion !== null
              ? `Iniciaste sesión como ${nombreSesion}, que no tiene rol docente.`
              : 'No has iniciado sesión.'}{' '}
            Entra con una cuenta docente para continuar.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {/* Hick: el ÚNICO `data-cta="primario"` de la guardia es iniciar sesión. */}
          <a
            href={`${ruta('/login')}?siguiente=/docente`}
            data-cta="primario"
            className={`${CLASES_ENLACE} bg-primario text-white shadow-lg shadow-primario/25 hover:bg-primario-hover active:bg-primario-activo`}
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Iniciar sesión como docente
          </a>

          {alCambiarRolDocente && (
            <button
              type="button"
              onClick={() => void alCambiarRolDocente()}
              className={`${CLASES_ENLACE} border border-linea bg-superficie text-tinta hover:bg-superficie-alta`}
            >
              Cambiar a rol docente
            </button>
          )}

          <a
            href={ruta('/')}
            className={`${CLASES_ENLACE} border border-linea bg-superficie text-tinta hover:bg-superficie-alta`}
          >
            Volver al mapa
          </a>
        </div>
      </Tarjeta>
    </section>
  );
}

export default GuardiaDocente;

