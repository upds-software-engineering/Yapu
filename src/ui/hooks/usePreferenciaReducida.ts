import { useSyncExternalStore } from 'react';

const CONSULTA_MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)';

/** ¿Hay un `matchMedia` utilizable? (falso durante el build de Astro, donde no hay `window`). */
function hayConsultaDeMedios(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

/** Suscripción al cambio de la preferencia del sistema. Devuelve la función de limpieza. */
function suscribir(alCambiar: () => void): () => void {
  if (!hayConsultaDeMedios()) return () => {};
  const consulta = window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO);
  consulta.addEventListener('change', alCambiar);
  return () => consulta.removeEventListener('change', alCambiar);
}

/** Lectura actual en el navegador. */
function leerEnCliente(): boolean {
  if (!hayConsultaDeMedios()) return false;
  return window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO).matches;
}

/** En el render de servidor no se puede consultar el sistema: se asume movimiento permitido. */
function leerEnServidor(): boolean {
  return false;
}

/**
 * ¿El sistema pide reducir el movimiento?
 *
 * Apogeo-Final / accesibilidad: el confeti de aprobación y cualquier animación decorativa deben
 * consultar esta preferencia antes de dispararse (`global.css` además apaga animaciones y
 * transiciones con la misma media query, como red de seguridad).
 *
 * Se implementa con `useSyncExternalStore` —el API de React 19 para suscribirse a un almacén
 * externo como `matchMedia`— en lugar de un efecto con `setState`, de modo que no haya estados
 * intermedios ni renders en cascada. En el render de servidor devuelve `false`.
 */
export function usePreferenciaReducida(): boolean {
  return useSyncExternalStore(suscribir, leerEnCliente, leerEnServidor);
}

export default usePreferenciaReducida;
