import { useEffect, useState } from 'react';
import { Leccion } from '@ui/components/leccion';

export interface PropsLeccionConFiltro {
  /** Nivel que se practica (1..10); lo aporta `lesson/[level].astro`. */
  nivelId: number;
}

/**
 * Lee `?palabras=a,b` de la barra de direcciones.
 *
 * Devuelve `undefined` cuando no hay filtro, para que el caso de uso use la lección completa: un
 * arreglo vacío y la ausencia de parámetro significan lo mismo, pero `undefined` deja el contrato
 * explícito.
 */
function leerPalabrasDeLaUrl(): readonly string[] | undefined {
  const crudo = new URLSearchParams(window.location.search).get('palabras') ?? '';
  const ids = crudo
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return ids.length > 0 ? ids : undefined;
}

/**
 * RF-004 — envoltorio de la lección que aplica el filtro de repaso (Apogeo-Final).
 *
 * El parámetro `palabras` lo escribe la pantalla de resultados de la evaluación con las palabras
 * que el estudiante falló, así que aquí sólo se traduce la URL a props.
 *
 * La lectura ocurre en un `useEffect` y nunca durante el render: la página se genera de forma
 * estática en el servidor, donde `window` no existe. Mientras el efecto no ha corrido, el
 * componente no pinta la lección, de modo que `Leccion` nace ya con el filtro correcto (su caso de
 * uso captura los argumentos de montaje una sola vez).
 */
export function LeccionConFiltro({ nivelId }: PropsLeccionConFiltro) {
  const [palabrasFalladas, setPalabrasFalladas] = useState<readonly string[] | undefined | null>(
    null
  );

  useEffect(() => {
    // Lectura de una sola vez de un sistema externo (la barra de direcciones) después del montaje:
    // no es un estado derivado, así que no hay alternativa sin efecto (un inicializador perezoso
    // leería la URL en el servidor y rompería la hidratación). La regla `set-state-in-effect`
    // persigue renders en cascada por estado derivado; aquí el efecto es de un solo disparo.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de `window.location`
    setPalabrasFalladas(leerPalabrasDeLaUrl());
  }, []);

  if (palabrasFalladas === null) return null;

  return <Leccion nivelId={nivelId} palabrasFalladas={palabrasFalladas} />;
}

export default LeccionConFiltro;
