import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PantallaNoEncontrada } from '@ui/components/layout';
import { ruta } from '@ui/lib/ruta';

/** Utilidades tipográficas crudas prohibidas: la escala del proyecto tiene cuatro pasos. */
const TIPOGRAFIA_CRUDA = /text-(xs|sm|base|lg|xl|2xl|3xl)\b/;

/**
 * [RNF-006] Página 404 propia en español.
 *
 * Reemplaza la página genérica en inglés de GitHub Pages («Page not found · GitHub Pages»).
 */
describe('[RNF-006] Página no encontrada (404)', () => {
  it('[RNF-006] explica en español que la dirección no existe', () => {
    // Dado una dirección inexistente, Cuando se muestra la pantalla 404
    render(<PantallaNoEncontrada />);

    // Entonces el título y el mensaje están en español y sin jerga técnica
    expect(screen.getByRole('heading', { level: 1, name: 'Este camino no existe' })).toBeInTheDocument();
    expect(screen.getByText(/no corresponde a ninguna página de YAPU/)).toBeInTheDocument();
    expect(screen.queryByText(/404|not found/i)).not.toBeInTheDocument();
  });

  it('[UX-APOGEO] [UX-HICK] ofrece un único CTA primario que vuelve al mapa de niveles', () => {
    // Dado la pantalla 404
    const { container } = render(<PantallaNoEncontrada />);

    // Entonces no es un callejón sin salida: hay exactamente un CTA primario hacia la portada
    const ctas = container.querySelectorAll('[data-cta="primario"]');
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveAttribute('href', ruta('/'));
    expect(ctas[0]).toHaveTextContent('Volver al mapa de niveles');
  });

  it('[UX-FITTS] [UX-ESTETICA] el CTA usa los tokens táctiles y la escala tipográfica del proyecto', () => {
    // Dado la pantalla 404
    const { container } = render(<PantallaNoEncontrada />);

    // Entonces el objetivo táctil mide al menos 44 px (tokens) y no hay tamaños de letra crudos
    const cta = container.querySelector('[data-cta="primario"]');
    expect(cta?.className).toMatch(/min-h-tactil/);
    expect(cta?.className).toMatch(/min-w-tactil/);
    expect(container.innerHTML).not.toMatch(TIPOGRAFIA_CRUDA);
  });
});
