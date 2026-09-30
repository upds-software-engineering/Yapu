import { useCallback, useEffect, useRef, useState } from 'react';
import type { SesionAutenticadaDto } from '@application/dto';
import { MARGEN_RENOVACION_MS } from '@application/use-cases/ValidarSesionUseCase';
import { mensajeDeError } from '@ui/lib/mensajes';
import { useServicios } from './useServicios';

/** Evento de ventana con el que las islas de Astro se avisan de un cambio de sesión. */
export const EVENTO_SESION = 'yapu:sesion-cambiada';

/** Avisa a TODAS las islas de la página (navegación, panel docente, login) de que la sesión cambió. */
export function anunciarCambioDeSesion(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO_SESION));
}

/**
 * Vuelo único de validación compartido por las islas de la página.
 *
 * La navegación y el panel docente son islas distintas y validan a la vez al montar. Si ambas
 * renovaran en paralelo presentarían el MISMO token de refresco dos veces y el servidor lo tomaría
 * por una reutilización (y revocaría la sesión). Con una sola promesa en vuelo, la segunda isla
 * recibe el resultado de la primera.
 */
let validacionEnVuelo: Promise<SesionAutenticadaDto | null> | null = null;

function validarUnaVez(
  validar: (opciones: { forzarRefresco?: boolean }) => Promise<SesionAutenticadaDto | null>,
  forzarRefresco: boolean
): Promise<SesionAutenticadaDto | null> {
  if (validacionEnVuelo !== null) return validacionEnVuelo;
  validacionEnVuelo = validar({ forzarRefresco }).finally(() => {
    validacionEnVuelo = null;
  });
  return validacionEnVuelo;
}

export interface EstadoSesionAutenticada {
  /** Sesión verificada, o `null` si se navega como invitado. */
  sesion: SesionAutenticadaDto | null;
  /** `true` hasta que termina la primera validación (evita parpadeos de la guardia). */
  comprobando: boolean;
  error: string | null;
  /** Renueva el par de tokens ahora mismo (demostración del refresco). */
  renovar: () => Promise<void>;
  cerrar: () => Promise<void>;
}

/**
 * RF-001 — sesión autenticada con renovación automática.
 *
 * Valida al montar, programa la renovación para `MARGEN_RENOVACION_MS` antes de que caduque el
 * token de acceso y escucha `EVENTO_SESION` (otras islas) y `storage` (otras pestañas).
 */
export function useSesionAutenticada(): EstadoSesionAutenticada {
  const { validarSesion, cerrarSesion } = useServicios();
  const [sesion, setSesion] = useState<SesionAutenticadaDto | null>(null);
  const [comprobando, setComprobando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const montado = useRef(true);

  const validar = useCallback(
    async (forzarRefresco = false): Promise<void> => {
      try {
        const resultado = await validarUnaVez((opciones) => validarSesion.ejecutar(opciones), forzarRefresco);
        if (!montado.current) return;
        setSesion(resultado);
        setError(null);
        // Una renovación cambia los tokens de todas las islas: se les avisa para que no usen el viejo.
        if (resultado?.refrescado === true) anunciarCambioDeSesion();
      } catch (fallo) {
        if (montado.current) setError(mensajeDeError(fallo));
      } finally {
        if (montado.current) setComprobando(false);
      }
    },
    [validarSesion]
  );

  useEffect(() => {
    montado.current = true;
    queueMicrotask(() => {
      if (montado.current) void validar();
    });
    const alCambiar = () => void validar();
    window.addEventListener(EVENTO_SESION, alCambiar);
    window.addEventListener('storage', alCambiar);
    return () => {
      montado.current = false;
      window.removeEventListener(EVENTO_SESION, alCambiar);
      window.removeEventListener('storage', alCambiar);
    };
  }, [validar]);

  // Renovación automática: se despierta justo cuando el token entra en el margen de renovación.
  const expiraAccesoEn = sesion?.expiraAccesoEn ?? null;
  useEffect(() => {
    if (expiraAccesoEn === null) return;
    const espera = Math.max(1_000, expiraAccesoEn - MARGEN_RENOVACION_MS - Date.now());
    const temporizador = window.setTimeout(() => void validar(), espera);
    return () => window.clearTimeout(temporizador);
  }, [expiraAccesoEn, validar]);

  const renovar = useCallback(() => validar(true), [validar]);

  const cerrar = useCallback(async () => {
    try {
      await cerrarSesion.ejecutar();
      if (montado.current) setSesion(null);
    } catch (fallo) {
      if (montado.current) setError(mensajeDeError(fallo));
    }
    anunciarCambioDeSesion();
  }, [cerrarSesion]);

  return { sesion, comprobando, error, renovar, cerrar };
}

export default useSesionAutenticada;
