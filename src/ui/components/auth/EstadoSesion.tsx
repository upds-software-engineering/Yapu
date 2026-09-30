import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useSesionAutenticada } from '@ui/hooks';
import { cn } from '@ui/lib/clases';
import { ruta } from '@ui/lib/ruta';
import { formatearDuracion, useCuentaAtras } from './useCuentaAtras';

export interface PropsEstadoSesion {
  className?: string;
}

const CLASES_ACCION =
  'inline-flex min-h-tactil min-w-tactil items-center justify-center gap-1.5 rounded-xl px-3 text-caption font-semibold transition-colors duration-200 md:min-h-tactil-escritorio focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte';

/**
 * RF-001 — estado de la sesión en la cabecera (sustituye al antiguo selector de rol simulado).
 *
 * Invitado: enlace «Iniciar sesión». Autenticado: nombre y rol verificados en el token, cuenta
 * atrás del token de acceso (que se renueva solo) y «Salir». El enlace del nombre abre `/login`,
 * donde se ven los detalles de ambos tokens.
 */
export function EstadoSesion({ className }: PropsEstadoSesion) {
  const { sesion, comprobando, cerrar } = useSesionAutenticada();
  const restante = useCuentaAtras(sesion?.expiraAccesoEn ?? 0);

  if (comprobando) {
    return <span aria-hidden="true" className={cn('h-8 w-24 rounded-xl bg-superficie-alta', className)} />;
  }

  if (sesion === null) {
    return (
      <a
        href={ruta('/login')}
        data-sesion="invitado"
        className={cn(CLASES_ACCION, 'border border-linea-fuerte text-tinta hover:bg-superficie-alta', className)}
      >
        <LogIn aria-hidden="true" className="h-4 w-4" />
        Iniciar sesión
      </a>
    );
  }

  return (
    <div data-sesion={sesion.rol} className={cn('flex items-center gap-2', className)}>
      <a
        href={ruta('/login')}
        aria-label={`Sesión de ${sesion.nombre} (${sesion.rol}); el token vence en ${formatearDuracion(restante)}`}
        className={cn(CLASES_ACCION, 'border border-exito/40 bg-exito/10 text-tinta hover:bg-exito/20')}
      >
        <ShieldCheck aria-hidden="true" className="h-4 w-4 text-exito" />
        <span className="max-w-[9rem] truncate">{sesion.nombre}</span>
        <span className="font-mono text-exito">{formatearDuracion(restante)}</span>
      </a>
      <button
        type="button"
        onClick={() => void cerrar()}
        data-accion="salir"
        className={cn(CLASES_ACCION, 'text-tinta-tenue hover:bg-superficie-alta hover:text-tinta')}
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Salir
      </button>
    </div>
  );
}

export default EstadoSesion;
