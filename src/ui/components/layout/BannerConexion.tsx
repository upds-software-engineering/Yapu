import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import { useSincronizacion } from '@ui/hooks';

/**
 * ¿Ya estamos en el cliente? El estado de conexión sólo se conoce en el navegador, así que el
 * primer render del cliente debe coincidir con el del servidor (sin banner) para no provocar un
 * error de hidratación de React. `useSyncExternalStore` es la forma canónica de exponer esa
 * diferencia (instantánea del servidor = `false`) sin `setState` dentro de un efecto.
 */
const sinSuscripcion = () => () => {};
const enCliente = () => true;
const enServidor = () => false;

/** RN-15: plural correcto en español para el conteo de la cola offline. */
function textoPendientes(pendientes: number): string {
  return pendientes === 1
    ? '1 evaluación pendiente por sincronizar'
    : `${pendientes} evaluaciones pendientes por sincronizar`;
}

/**
 * RF-009 / RN-15 — aviso de modo sin conexión.
 *
 * El banner SÓLO existe cuando de verdad no hay conexión: se apoya en `useSincronizacion`, que a su
 * vez lee el `ConectividadPort` a través del contenedor. Cuando hay red, el componente no pinta
 * nada (ni un hueco vacío en el flujo).
 *
 * Miller: un único mensaje, siempre el mismo, más el contador de la cola. Sin acciones: el banner
 * informa, no compite con las decisiones de la pantalla (Hick).
 * Accesibilidad: es una región `status` con `aria-live="polite"`, así que el cambio de conexión se
 * anuncia sin robar el foco. El icono es decorativo (`aria-hidden`).
 *
 * El aviso NO es `sticky`: la cabecera de escritorio y la barra móvil ya están ancladas, y un
 * tercer elemento fijo en `top-0` las taparía (WCAG 2.4.11, el foco quedaría oculto al navegar).
 */
export function BannerConexion() {
  const { enLinea, pendientes } = useSincronizacion();
  const montado = useSyncExternalStore(sinSuscripcion, enCliente, enServidor);

  if (!montado || enLinea) return null;

  return (
    <div
      data-banner="conexion"
      role="status"
      aria-live="polite"
      className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-alerta/40 bg-alerta-solido px-4 py-2 text-center text-caption font-semibold text-white"
    >
      <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
      <p>Sin conexión: puedes seguir estudiando y tus avances se guardan en este dispositivo.</p>
      {pendientes > 0 && <p>{textoPendientes(pendientes)}.</p>}
    </div>
  );
}

export default BannerConexion;
