import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import { BannerConexion, Navegacion, SelectorRol } from '@ui/components/layout';
import {
  crearAdaptadores,
  establecerContenedor,
  reiniciarContenedor,
  type AdaptadoresContenedor
} from '@infrastructure/container';
import type { ConectividadPort, EvaluacionRepository } from '@application/ports';
import type { Evaluacion } from '@domain/evaluacion/Evaluacion';
import { ruta } from '@ui/lib/ruta';

/**
 * Pruebas de componente de la navegación (RF-001 / RF-002 / RF-009 / RN-15).
 *
 * Se trabaja contra el contenedor en memoria (`crearAdaptadores(null)`) y, cuando la prueba lo
 * necesita, se sustituyen adaptadores concretos del propio contenedor antes del primer render:
 * `useContenedor` captura el composition root una sola vez por componente.
 *
 * Nota de contrato: las dos variantes de la navegación (escritorio y móvil) existen SIEMPRE en el
 * DOM y se alternan con `md:`; por eso cada `data-nav-enlace` aparece dos veces. Los cuatro destinos
 * son los mismos en ambas barras.
 */

interface AjustesContenedor {
  /** Estado de conexión simulado; por defecto, el navegador de jsdom (en línea). */
  enLinea?: boolean;
  /** Tamaño de la cola offline simulada (RN-15). */
  pendientes?: number;
}

/** Doble de `ConectividadPort`: jsdom siempre reporta conexión, así que el offline se inyecta. */
function conectividadFija(enLinea: boolean): ConectividadPort {
  return {
    estaEnLinea: () => enLinea,
    alRecuperarConexion: () => () => {
      /* Sin evento `online` que observar en el doble. */
    }
  };
}

/** Doble de la cola de evaluaciones pendientes: sólo se usa sin conexión (nunca se sincroniza). */
function evaluacionesEnCola(pendientes: number): EvaluacionRepository {
  const cola = Array.from({ length: pendientes }, (_, indice) => ({
    id: `evaluacion-${indice + 1}`
  })) as unknown as Evaluacion[];

  return {
    guardar: async () => undefined,
    obtener: async () => null,
    listarPorEstudiante: async () => [],
    listarPendientes: async () => cola,
    marcarSincronizada: async () => undefined
  };
}

/** Contenedor vigente de la prueba; permite comprobar qué guardó la sesión simulada. */
let contenedor: AdaptadoresContenedor;

function instalarContenedor(ajustes: AjustesContenedor = {}): AdaptadoresContenedor {
  const nuevo = crearAdaptadores(null);
  if (ajustes.enLinea !== undefined) nuevo.conectividad = conectividadFija(ajustes.enLinea);
  if (ajustes.pendientes !== undefined) nuevo.evaluaciones = evaluacionesEnCola(ajustes.pendientes);

  contenedor = nuevo;
  establecerContenedor(nuevo);
  return nuevo;
}

/** Busca un elemento por selector y falla con un mensaje claro si no existe. */
function exigir(selector: string): HTMLElement {
  const elemento = document.querySelector<HTMLElement>(selector);
  if (elemento === null) throw new Error(`No se encontró ningún elemento para "${selector}".`);
  return elemento;
}

/**
 * Deja correr los efectos y los casos de uso asíncronos: una vuelta de macrotarea garantiza que
 * todas las microtareas pendientes (las cadenas de `await` de los casos de uso) se resuelvan.
 */
async function esperarEfectos(): Promise<void> {
  await act(async () => {
    await new Promise((resolver) => setTimeout(resolver, 0));
  });
}

describe('[UX-JAKOB] Navegación', () => {
  beforeEach(() => {
    instalarContenedor();
  });

  afterEach(() => {
    reiniciarContenedor();
  });

  it('[UX-JAKOB] publica la cabecera superior en escritorio y la barra inferior en móvil', async () => {
    // Dado la navegación de la portada
    render(<Navegacion rutaActual="/" />);
    await esperarEfectos();

    // Cuando se inspeccionan los dos puntos de navegación del patrón adaptativo
    const escritorio = exigir('[data-nav="escritorio"]');
    const movil = exigir('[data-nav="movil"]');

    // Entonces cada uno es un destino principal con su etiqueta accesible y su icono
    expect(escritorio.tagName).toBe('HEADER');
    expect(movil.tagName).toBe('NAV');
    expect(
      within(escritorio).getByRole('navigation', { name: 'Navegación principal' })
    ).toBeInTheDocument();
    expect(movil).toHaveAttribute('aria-label', 'Navegación principal móvil');
    expect(within(movil).getAllByRole('link')).toHaveLength(3);
    expect(exigir('[data-nav-enlace="niveles"]')).toHaveTextContent('Niveles');
    expect(exigir('[data-nav-enlace="progreso"]')).toHaveTextContent('Progreso');
    expect(exigir('[data-nav-enlace="comunidad"]')).toHaveTextContent('Comunidad');
  });

  it('[UX-JAKOB] los destinos apuntan a las rutas canónicas bajo el base del despliegue', async () => {
    // Dado la navegación montada
    render(<Navegacion rutaActual="/" />);
    await esperarEfectos();

    // Cuando se leen los enlaces
    const destinos = ['niveles', 'progreso', 'comunidad'].map(
      (clave) => exigir(`[data-nav-enlace="${clave}"]`).getAttribute('href') ?? ''
    );

    // Entonces todos pasan por `ruta()` (ADR-004): nunca hay un `href="/…"` escrito a mano
    expect(destinos).toEqual([ruta('/'), ruta('/dashboard'), ruta('/community')]);
  });

  it('[UX-HICK] con rol estudiante la pestaña de docente no existe y nunca hay CTA en la navegación', async () => {
    // Dado un estudiante en la portada
    render(<Navegacion rutaActual="/" />);
    await esperarEfectos();

    // Cuando se cuentan los destinos de cada barra
    const escritorio = exigir('[data-nav="escritorio"]');
    const movil = exigir('[data-nav="movil"]');
    const enlacesEscritorio = escritorio.querySelectorAll('[data-nav-enlace]');
    const enlacesMovil = movil.querySelectorAll('[data-nav-enlace]');

    // Entonces hay 4 destinos como máximo, sin la pestaña de docente y sin acciones primarias
    expect(document.querySelectorAll('[data-nav-enlace="docente"]')).toHaveLength(0);
    expect(enlacesEscritorio.length).toBeLessThanOrEqual(4);
    expect(enlacesMovil.length).toBeLessThanOrEqual(4);
    expect(document.querySelectorAll('[data-nav] [data-cta="primario"]')).toHaveLength(0);
    expect(escritorio.textContent ?? '').not.toMatch(/racha|palabras/i);
  });

  it('[RF-002] con rol docente la pestaña aparece y enlaza al portal docente', async () => {
    // Dado un contenedor con la sesión simulada en rol docente
    await contenedor.sesion.cambiarRol('docente');

    // Cuando se monta la navegación
    render(<Navegacion rutaActual="/" />);

    // Entonces el destino de docente existe en ambas barras y apunta a su ruta
    await waitFor(() =>
      expect(document.querySelectorAll('[data-nav-enlace="docente"]')).toHaveLength(2)
    );
    const enlaces = document.querySelectorAll('[data-nav-enlace="docente"]');
    for (const enlace of enlaces) {
      expect(enlace.getAttribute('href')).toBe(ruta('/docente'));
    }
  });

  it('[RF-002] el destino activo se marca con aria-current="page" y sólo uno por barra', async () => {
    // Dado la navegación abierta en el tablero de progreso
    render(<Navegacion rutaActual="/dashboard" />);
    await esperarEfectos();

    // Cuando se revisan los destinos
    const activosEscritorio = exigir('[data-nav="escritorio"]').querySelectorAll(
      '[aria-current="page"]'
    );
    const activosMovil = exigir('[data-nav="movil"]').querySelectorAll('[aria-current="page"]');

    // Entonces el activo es «Progreso» y ningún otro destino se declara como página actual
    expect(activosEscritorio).toHaveLength(1);
    expect(activosMovil).toHaveLength(1);
    expect(exigir('[data-nav-enlace="progreso"]')).toHaveAttribute('aria-current', 'page');
    expect(exigir('[data-nav-enlace="niveles"]')).not.toHaveAttribute('aria-current');
  });

  it('[UX-FITTS] cada enlace mide al menos 44x44 px y los objetivos se separan 8 px', async () => {
    // Dado la navegación montada
    render(<Navegacion rutaActual="/" />);
    await esperarEfectos();

    // Cuando se inspeccionan los objetivos táctiles de las dos barras
    for (const barra of ['escritorio', 'movil']) {
      const enlaces = Array.from(
        exigir(`[data-nav="${barra}"]`).querySelectorAll('[data-nav-enlace]')
      );
      expect(enlaces.length).toBeGreaterThan(0);

      // Entonces cada enlace declara los tokens táctiles del design system (44 px)
      for (const enlace of enlaces) {
        expect(enlace.className).toContain('min-h-tactil');
        expect(enlace.className).toContain('min-w-tactil');
      }
    }

    // Y la separación entre objetivos adyacentes es `gap-2` (8 px) como mínimo
    expect(exigir('[data-nav="movil"]').className).toMatch(/\bgap-2\b/);
    expect(exigir('[data-nav="escritorio"] nav').className).toMatch(/\bgap-2\b/);
  });

  it('[UX-FITTS] la barra móvil está fija en el borde inferior, en la zona del pulgar', async () => {
    // Dado la navegación montada
    render(<Navegacion rutaActual="/" />);
    await esperarEfectos();

    // Cuando se revisa la posición de la barra móvil
    const movil = exigir('[data-nav="movil"]');

    // Entonces queda anclada abajo y sólo se oculta a partir de `md:`
    expect(movil.className).toContain('fixed');
    expect(movil.className).toContain('bottom-0');
    expect(movil.className).toContain('md:hidden');
    expect(exigir('[data-nav="escritorio"]').className).toContain('md:block');
  });

  it('[RF-002] el selector de rol llama a cambiarRol y el rol mostrado cambia', async () => {
    // Dado el selector de rol de la cabecera de escritorio
    let avisos = 0;
    render(<SelectorRol alCambiarRol={() => (avisos += 1)} />);
    const selector = exigir('[data-selector-rol]');
    expect(selector).toHaveAttribute('data-rol', 'estudiante');

    // Cuando se elige el rol docente en el desplegable
    fireEvent.change(within(selector).getByLabelText('Rol de la sesión (simulado)'), {
      target: { value: 'docente' }
    });

    // Entonces la sesión simulada guarda el rol, el selector lo refleja y avisa al contenedor
    await waitFor(() => expect(avisos).toBe(1));
    expect(selector).toHaveAttribute('data-rol', 'docente');
    expect((await contenedor.sesion.obtener()).rol).toBe('docente');
  });

  it('[RF-002] cambiar de rol desde la navegación hace aparecer la pestaña de docente', async () => {
    // Dado un estudiante en la navegación, sin pestaña de docente
    render(<Navegacion rutaActual="/" />);
    await esperarEfectos();
    expect(document.querySelectorAll('[data-nav-enlace="docente"]')).toHaveLength(0);

    // Cuando cambia el rol a docente desde el selector de la cabecera
    fireEvent.change(within(exigir('[data-selector-rol]')).getByLabelText('Rol de la sesión (simulado)'), {
      target: { value: 'docente' }
    });

    // Entonces la navegación vuelve a consultar la sesión y publica el destino de docente
    await waitFor(() =>
      expect(exigir('[data-selector-rol]')).toHaveAttribute('data-rol', 'docente')
    );
    await waitFor(() =>
      expect(document.querySelectorAll('[data-nav-enlace="docente"]')).toHaveLength(2)
    );
  });

  it('[RN-15] el banner no aparece con conexión y sí aparece sin conexión con la cola pendiente', async () => {
    // Dado un dispositivo con conexión
    instalarContenedor({ enLinea: true });

    // Cuando se monta el aviso de conexión y termina la sincronización
    const { unmount } = render(<BannerConexion />);
    await esperarEfectos();

    // Entonces no hay banner: sólo existe cuando de verdad falta la conexión
    expect(document.querySelector('[data-banner="conexion"]')).toBeNull();
    unmount();

    // Y dado un dispositivo sin conexión con dos evaluaciones en la cola
    instalarContenedor({ enLinea: false, pendientes: 2 });

    // Cuando se monta el aviso
    render(<BannerConexion />);
    await esperarEfectos();

    // Entonces el banner informa el modo sin conexión y cuánto queda por sincronizar
    const banner = exigir('[data-banner="conexion"]');
    expect(banner).toHaveAttribute('data-banner', 'conexion');
    expect(banner).toHaveTextContent('Sin conexión');
    await waitFor(() =>
      expect(banner).toHaveTextContent('2 evaluaciones pendientes por sincronizar')
    );
  });
});
