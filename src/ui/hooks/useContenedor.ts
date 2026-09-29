import { useState } from 'react';
import { obtenerContenedor } from '@infrastructure/container';
import type { AdaptadoresContenedor } from '@infrastructure/container';

/**
 * Devuelve el contenedor de adaptadores (composition root, ADR-001).
 *
 * Es el ÚNICO punto por el que la UI toca infraestructura: el resto de componentes y hooks
 * consumen casos de uso y DTOs. Se memoriza con el inicializador perezoso de `useState` para que
 * `obtenerContenedor()` se llame una sola vez por componente y no en cada render; además es seguro
 * en el render de servidor, porque el contenedor cae a los repositorios en memoria cuando no hay
 * `localStorage` (durante el build de Astro).
 */
export function useContenedor(): AdaptadoresContenedor {
  const [contenedor] = useState<AdaptadoresContenedor>(() => obtenerContenedor());
  return contenedor;
}

export default useContenedor;
