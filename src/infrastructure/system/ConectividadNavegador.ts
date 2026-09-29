import type { ConectividadPort } from '@application/ports';

/** Desuscripción inerte para entornos sin `window` (SSR, pruebas de Node). */
const SIN_SUSCRIPCION = (): void => {
  /* Sin navegador no hay evento `online` que observar. */
};

/**
 * Adaptador de producción de `ConectividadPort` (RF-009).
 *
 * Aísla `navigator.onLine` y el evento `online` de `window` para que los casos de uso de
 * sincronización offline sean agnósticos del entorno y testeables con un doble de prueba.
 */
export class ConectividadNavegador implements ConectividadPort {
  estaEnLinea(): boolean {
    if (typeof navigator === 'undefined') return true;
    // Si el navegador no expone el dato, se asume conexión: nunca bloquear el flujo de estudio.
    return navigator.onLine !== false;
  }

  alRecuperarConexion(manejador: () => void): () => void {
    if (typeof window === 'undefined') return SIN_SUSCRIPCION;

    const escucha = (): void => {
      manejador();
    };

    window.addEventListener('online', escucha);
    return () => {
      window.removeEventListener('online', escucha);
    };
  }
}
