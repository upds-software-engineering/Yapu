import { useCallback, useEffect } from 'react';
import { SincronizarPendientesUseCase } from '@application/use-cases/SincronizarPendientesUseCase';
import type { EstadoSincronizacionDto } from '@application/dto';
import type { ConectividadPort } from '@application/ports';
import { useCasoDeUso } from './useCasoDeUso';
import { useContenedor } from './useContenedor';

/** Estado que consumen las pantallas para mostrar la cola offline (RF-009 / RN-15). */
export interface EstadoSincronizacion {
  pendientes: number;
  sincronizadas: number;
  enLinea: boolean;
}

/** Lee la conectividad sin dejar que un fallo del puerto rompa la pantalla. */
function leerConexion(conectividad: ConectividadPort): boolean {
  try {
    return conectividad.estaEnLinea();
  } catch {
    return false;
  }
}

/**
 * RF-009 / RN-15: sincroniza la cola de evaluaciones pendientes.
 *
 * Se ejecuta al montar la pantalla y cada vez que el `ConectividadPort` avisa de que la conexión
 * volvió. Reutiliza `useCasoDeUso` para heredar el guardado contra desmontajes y carreras y la
 * traducción de errores a español.
 *
 * Es deliberadamente resiliente: si la sincronización falla, el estado tiene `datos === null` y el
 * hook devuelve los contadores en cero con el estado real de conexión, sin romper la pantalla.
 */
export function useSincronizacion(): EstadoSincronizacion {
  const contenedor = useContenedor();

  const operacion = useCallback(async (): Promise<EstadoSincronizacionDto> => {
    const casoDeUso = new SincronizarPendientesUseCase(
      contenedor.evaluaciones,
      contenedor.sincronizacion,
      contenedor.conectividad
    );
    return casoDeUso.ejecutar();
  }, [contenedor]);

  const { datos, ejecutar } = useCasoDeUso(operacion, { ejecutarAlMontar: [] });

  useEffect(() => {
    return contenedor.conectividad.alRecuperarConexion(() => {
      void ejecutar();
    });
  }, [contenedor, ejecutar]);

  if (!datos) {
    return { pendientes: 0, sincronizadas: 0, enLinea: leerConexion(contenedor.conectividad) };
  }

  return {
    pendientes: datos.pendientes,
    sincronizadas: datos.sincronizadas,
    enLinea: datos.enLinea
  };
}

export default useSincronizacion;
