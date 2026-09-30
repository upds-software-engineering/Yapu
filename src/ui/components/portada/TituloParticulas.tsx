import { useEffect, useRef, useState } from 'react';
import { usePreferenciaReducida } from '@ui/hooks';
import { cn } from '@ui/lib/clases';

export interface PropsTituloParticulas {
  className?: string;
}

/** RS-002: el título institucional se dibuja con partículas sobre `<canvas>`. */
const TEXTO = 'YAPU';

/** Paleta andina del proyecto (misma que el resto del design system). */
const COLORES = ['#FBBF24', '#E05A00', '#2DD4BF', '#38BDF8', '#FCD34D'] as const;

/** Semilla fija: el mismo texto produce siempre el mismo enjambre (render estable, sin parpadeo). */
const SEMILLA = 20250915;

/** RNF-006: techo de partículas para que la animación no dependa del tamaño de la pantalla. */
const MAX_PARTICULAS = 4200;

/** Separación, en px, entre muestras del texto (menor = más partículas y más coste). */
const PASO_MUESTREO = 3;

/** Por debajo de este número de núcleos no se anima: se pinta el texto estático. */
const NUCLEOS_MINIMOS = 4;

interface Particula {
  x: number;
  y: number;
  origenX: number;
  origenY: number;
  vx: number;
  vy: number;
  tamano: number;
  color: string;
  alfa: number;
  fase: number;
}

/**
 * Generador congruencial lineal (LCG) con semilla fija.
 *
 * Determinismo: `Math.random` haría que cada render (o cada cambio de estado del padre) barajara
 * las partículas y el título parpadearía. Con esta secuencia, el mismo texto y el mismo tamaño de
 * lienzo producen exactamente el mismo enjambre en cualquier ejecución.
 */
function crearGenerador(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

/** RNF-006: en equipos modestos (≤ 4 núcleos) se prefiere el título estático. */
function equipoAptoParaAnimar(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nucleos = navigator.hardwareConcurrency;
  return typeof nucleos === 'number' && nucleos > NUCLEOS_MINIMOS;
}

/** ¿Existe `canvas` y se puede obtener un contexto 2D? */
function hayLienzoConContexto(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const lienzo = document.createElement('canvas');
    return typeof lienzo.getContext === 'function' && Boolean(lienzo.getContext('2d'));
  } catch {
    // Entornos sin canvas (SSR, jsdom sin el paquete `canvas`): se degrada al texto estático.
    return false;
  }
}

/**
 * Título "YAPU" dibujado con partículas (RS-002, RNF-006).
 *
 * Reglas de degradación — la pantalla NUNCA queda en blanco:
 *  1. si el sistema pide movimiento reducido (`usePreferenciaReducida`), si el equipo tiene
 *     ≤ 4 núcleos o si no hay contexto 2D, se pinta el `<h1>YAPU</h1>` estático con `text-display`;
 *  2. el texto real vive SIEMPRE en el `<h1>` (accesible para lectores de pantalla) y el `<canvas>`
 *     es decorativo (`aria-hidden="true"`); el `<h1>` sólo se oculta visualmente cuando ya se ha
 *     dibujado el primer fotograma de partículas, es decir, cuando hay algo que mirar;
 *  3. `IntersectionObserver` pausa el `requestAnimationFrame` fuera del viewport (no se anima lo
 *     que nadie ve) y el fotograma se cancela al desmontar.
 */
export function TituloParticulas({ className }: PropsTituloParticulas) {
  const reducida = usePreferenciaReducida();
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const lienzoRef = useRef<HTMLCanvasElement | null>(null);
  const [pintado, setPintado] = useState(false);

  useEffect(() => {
    // Movimiento reducido, equipo modesto o falta de canvas → se queda el `<h1>` estático.
    // La capacidad se consulta aquí (y no durante el render) para que el marcado del servidor y
    // el del cliente sean idénticos y la hidratación de Astro no se rompa.
    if (reducida || !equipoAptoParaAnimar() || !hayLienzoConContexto()) return;

    const contenedor = contenedorRef.current;
    const lienzo = lienzoRef.current;
    if (!contenedor || !lienzo) return;
    const contexto = lienzo.getContext('2d');
    if (!contexto) return;

    let particulas: Particula[] = [];
    let ancho = 0;
    let alto = 0;
    let marco = 0;
    let animando = false;
    let visible = true;
    let primerFotograma = false;
    let temporizadorRedimension: number | null = null;

    /** Muestrea el texto en un lienzo oculto y siembra una partícula por píxel opaco. */
    const preparar = (): boolean => {
      ancho = contenedor.clientWidth || 320;
      alto = contenedor.clientHeight || 160;
      const densidad = Math.min(window.devicePixelRatio || 1, 2);

      lienzo.width = Math.max(1, Math.floor(ancho * densidad));
      lienzo.height = Math.max(1, Math.floor(alto * densidad));
      lienzo.style.width = `${ancho}px`;
      lienzo.style.height = `${alto}px`;
      contexto.setTransform(densidad, 0, 0, densidad, 0, 0);

      const medidor = document.createElement('canvas');
      medidor.width = ancho;
      medidor.height = alto;
      const contextoMedidor = medidor.getContext('2d');
      if (!contextoMedidor) return false;

      // El tamaño sale del ancho REAL del texto: las letras ocupan ~84 % del ancho disponible (y
      // como mucho ~78 % del alto), en lugar de una fracción fija que las dejaba pequeñas.
      const fuente = (tamano: number) => `700 ${tamano}px "Space Grotesk", system-ui, sans-serif`;
      contextoMedidor.font = fuente(100);
      const anchoA100 = contextoMedidor.measureText(TEXTO).width || 100 * TEXTO.length * 0.6;
      const tamanoFuente = Math.min((100 * ancho * 0.84) / anchoA100, alto * 0.78);
      contextoMedidor.font = fuente(tamanoFuente);
      contextoMedidor.textAlign = 'center';
      contextoMedidor.textBaseline = 'middle';
      contextoMedidor.fillStyle = '#ffffff';
      contextoMedidor.fillText(TEXTO, ancho / 2, alto / 2);
      // Trazo extra: engrosa las letras para que el título se lea en negrita aun hecho de partículas.
      contextoMedidor.strokeStyle = '#ffffff';
      contextoMedidor.lineJoin = 'round';
      contextoMedidor.lineWidth = Math.max(1.5, tamanoFuente * 0.03);
      contextoMedidor.strokeText(TEXTO, ancho / 2, alto / 2);

      const pixeles = contextoMedidor.getImageData(0, 0, ancho, alto).data;
      const azar = crearGenerador(SEMILLA);
      const sembradas: Particula[] = [];

      for (let y = 0; y < alto && sembradas.length < MAX_PARTICULAS; y += PASO_MUESTREO) {
        for (let x = 0; x < ancho && sembradas.length < MAX_PARTICULAS; x += PASO_MUESTREO) {
          const opacidad = pixeles[(y * ancho + x) * 4 + 3] ?? 0;
          if (opacidad <= 128) continue;

          // Orden fijo de consumo del LCG: mantiene la siembra reproducible.
          const desplazamientoX = azar();
          const desplazamientoY = azar();
          const grosor = azar();
          const tono = azar();
          const transparencia = azar();

          sembradas.push({
            x: x + (desplazamientoX - 0.5) * ancho * 0.7,
            y: y + (desplazamientoY - 0.5) * alto * 0.9,
            origenX: x,
            origenY: y,
            vx: 0,
            vy: 0,
            tamano: grosor > 0.75 ? 2.6 : 1.9,
            color: COLORES[Math.floor(tono * COLORES.length)] ?? COLORES[0],
            alfa: 0.75 + transparencia * 0.25,
            fase: (desplazamientoX + desplazamientoY) * Math.PI * 2
          });
        }
      }

      particulas = sembradas;
      return sembradas.length > 0;
    };

    const dibujar = () => {
      marco = requestAnimationFrame(dibujar);
      const tiempo = performance.now() / 1000;

      contexto.clearRect(0, 0, ancho, alto);
      for (const particula of particulas) {
        // Muelle hacia el origen + roce: las partículas vuelven solas a formar las letras.
        particula.vx = (particula.vx + (particula.origenX - particula.x) * 0.06) * 0.86;
        particula.vy = (particula.vy + (particula.origenY - particula.y) * 0.06) * 0.86;
        particula.x += particula.vx;
        particula.y += particula.vy;

        const ondulacion = Math.sin(tiempo * 1.2 + particula.fase) * 0.6;
        contexto.globalAlpha = particula.alfa;
        contexto.fillStyle = particula.color;
        contexto.fillRect(particula.x, particula.y + ondulacion, particula.tamano, particula.tamano);
      }
      contexto.globalAlpha = 1;

      // Sólo cuando hay algo dibujado se puede ocultar el texto estático (nunca pantalla en blanco).
      if (!primerFotograma) {
        primerFotograma = true;
        setPintado(true);
      }
    };

    const iniciar = () => {
      if (animando || particulas.length === 0) return;
      animando = true;
      marco = requestAnimationFrame(dibujar);
    };

    const detener = () => {
      if (!animando) return;
      animando = false;
      cancelAnimationFrame(marco);
      marco = 0;
    };

    const reiniciar = () => {
      detener();
      if (preparar() && visible) iniciar();
    };

    /** RNF-006: fuera del viewport no se dibuja nada. */
    const observador =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            (entradas) => {
              const entrada = entradas[0];
              visible = entrada ? entrada.isIntersecting : true;
              if (visible) iniciar();
              else detener();
            },
            { threshold: 0.1 }
          )
        : null;
    observador?.observe(contenedor);

    const alRedimensionar = () => {
      if (temporizadorRedimension !== null) window.clearTimeout(temporizadorRedimension);
      temporizadorRedimension = window.setTimeout(() => {
        temporizadorRedimension = null;
        reiniciar();
      }, 200);
    };

    reiniciar();
    window.addEventListener('resize', alRedimensionar);

    return () => {
      detener();
      observador?.disconnect();
      window.removeEventListener('resize', alRedimensionar);
      if (temporizadorRedimension !== null) window.clearTimeout(temporizadorRedimension);
    };
  }, [reducida]);

  return (
    <div
      ref={contenedorRef}
      className={cn(
        'relative flex h-40 w-full items-center justify-center overflow-hidden sm:h-52',
        className
      )}
    >
      {/*
        El lienzo es decoración: se pinta siempre (marcado idéntico en servidor y cliente) pero
        sólo se anima cuando el entorno lo permite. Con `prefers-reduced-motion` Tailwind lo
        oculta directamente.
      */}
      <canvas
        ref={lienzoRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden"
      />

      <h1
        className={cn(
          'font-display text-display font-bold tracking-tight text-tinta',
          // Sólo se oculta el texto real cuando ya hay partículas dibujadas en su lugar.
          pintado && 'sr-only'
        )}
      >
        {TEXTO}
      </h1>
    </div>
  );
}

export default TituloParticulas;
