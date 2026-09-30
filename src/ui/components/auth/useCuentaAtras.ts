import { useEffect, useState } from 'react';

/** Milisegundos que faltan para `instante`, actualizados cada segundo (nunca negativos). */
export function useCuentaAtras(instante: number): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(Date.now()), 1_000);
    return () => window.clearInterval(intervalo);
  }, []);

  return Math.max(0, instante - ahora);
}

/** `95_000` → `1:35`. */
export function formatearDuracion(milisegundos: number): string {
  const totalSegundos = Math.ceil(milisegundos / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${String(segundos).padStart(2, '0')}`;
}
