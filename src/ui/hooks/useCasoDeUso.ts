import { useCallback, useEffect, useRef, useState } from 'react';
import { mensajeDeError } from '@ui/lib/mensajes';

/** Forma de estado que exponen las pantallas que ejecutan un caso de uso. */
export interface EstadoCasoDeUso<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  ejecutar: (...args: never[]) => void;
}

export interface OpcionesCasoDeUso<A extends unknown[]> {
  /** Argumentos con los que se ejecuta la operación al montar el componente. */
  ejecutarAlMontar?: A;
}

export interface RetornoCasoDeUso<T, A extends unknown[]> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  ejecutar: (...args: A) => Promise<T | null>;
  reiniciar: () => void;
}

/**
 * Hook genérico de estado asíncrono para ejecutar un caso de uso desde la UI.
 *
 * Garantías:
 *  - **Mensajes en español:** cualquier fallo se traduce con `mensajeDeError`; nunca se pinta un
 *    mensaje técnico ni el `message` crudo de un error del navegador.
 *  - **Sin fugas:** los resultados que llegan después del desmontaje se ignoran (bandera en
 *    `useRef`).
 *  - **Sin carreras:** un contador de petición descarta las respuestas obsoletas cuando el
 *    estudiante dispara la operación varias veces seguidas.
 */
export function useCasoDeUso<T, A extends unknown[]>(
  operacion: (...args: A) => Promise<T>,
  opciones?: OpcionesCasoDeUso<A>
): RetornoCasoDeUso<T, A> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montado = useRef(true);
  const peticionActual = useRef(0);
  const operacionRef = useRef(operacion);

  /** Se captura una sola vez: si el llamador pasa un array literal, no reinicia el efecto. */
  const argumentosDeMontaje = useRef<A | undefined>(opciones?.ejecutarAlMontar);

  // La operación se refresca en un efecto (nunca durante el render) para que `ejecutar` conserve
  // una identidad estable aunque el llamador pase una función nueva en cada render.
  useEffect(() => {
    operacionRef.current = operacion;
  }, [operacion]);

  const ejecutar = useCallback(async (...args: A): Promise<T | null> => {
    peticionActual.current += 1;
    const idPeticion = peticionActual.current;
    const vigente = () => montado.current && idPeticion === peticionActual.current;

    setCargando(true);
    setError(null);

    try {
      const resultado = await operacionRef.current(...args);
      if (!vigente()) return null;
      setDatos(resultado);
      setCargando(false);
      return resultado;
    } catch (fallo) {
      if (!vigente()) return null;
      setError(mensajeDeError(fallo));
      setCargando(false);
      return null;
    }
  }, []);

  const reiniciar = useCallback(() => {
    // Invalida cualquier petición en vuelo para que no reescriba el estado ya limpiado.
    peticionActual.current += 1;
    setDatos(null);
    setError(null);
    setCargando(false);
  }, []);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    const args = argumentosDeMontaje.current;
    if (args) void ejecutar(...args);
  }, [ejecutar]);

  return { datos, cargando, error, ejecutar, reiniciar };
}

export default useCasoDeUso;
