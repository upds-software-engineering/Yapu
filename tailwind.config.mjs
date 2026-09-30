/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    /**
     * Tema ÚNICO de color (oscuro, "noche andina"). No hay modo claro ni conmutador: esta paleta
     * REEMPLAZA a la de Tailwind (no la extiende), así que `slate-*`, `amber-*`, `red-*`… no existen
     * y cada pantalla sólo puede usar estos tokens semánticos. Contrastes medidos (WCAG 2.1):
     *
     *  - `tinta` 15.1:1, `tinta-suave` 11.5:1 y `tinta-tenue` 7.6:1 sobre `superficie`
     *    (≥ 6.4:1 incluso sobre `superficie-alta`): todo texto supera AA (4.5:1).
     *  - `primario` con texto blanco 5.3:1; `acento` sobre `superficie` 10.2:1.
     *  - `linea-fuerte` ≥ 3.1:1 sobre `fondo` y `superficie` (1.4.11, borde de controles);
     *    `linea` es sólo separador decorativo.
     *  - estados (`exito`, `alerta`, `peligro`, `info`) ≥ 7.4:1 sobre su propio tinte al 10 %;
     *    las variantes `-solido` llevan texto blanco a ≥ 5.4:1.
     */
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      fondo: '#0B0F19',
      superficie: {
        DEFAULT: '#141C2E',
        alta: '#1E2A42'
      },
      linea: {
        DEFAULT: '#2A3752',
        fuerte: '#5B6B88'
      },
      tinta: {
        DEFAULT: '#F5F1EA',
        suave: '#CDD5E0',
        tenue: '#A3AEC0'
      },
      primario: {
        DEFAULT: '#B94700',
        hover: '#A03D00',
        activo: '#873200'
      },
      acento: {
        DEFAULT: '#FBBF24',
        fuerte: '#F59E0B'
      },
      exito: {
        DEFAULT: '#4ADE80',
        solido: '#047857',
        'solido-hover': '#065F46'
      },
      alerta: {
        DEFAULT: '#FCD34D',
        solido: '#92400E'
      },
      peligro: {
        DEFAULT: '#FCA5A5',
        solido: '#B91C1C',
        'solido-hover': '#991B1B',
        'solido-activo': '#7F1D1D'
      },
      info: {
        DEFAULT: '#5EEAD4',
        solido: '#0F766E'
      }
    },
    extend: {
      /**
       * Estética-Usabilidad: escala tipográfica de 4 pasos (3 tamaños + caption).
       * Las pantallas NO deben usar `text-xs/sm/lg/xl/...` de Tailwind: sólo estos tokens,
       * para que el test automático [UX-ESTETICA] (≤ 4 tamaños computados por pantalla) pase.
       */
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        body: ['0.9375rem', { lineHeight: '1.375rem' }],
        title: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        display: ['2rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }]
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      /**
       * Fitts: tamaños táctiles mínimos garantizados por token.
       * `min-h-11`/`min-w-11` = 44 px (móvil) y `min-h-6`/`min-w-6` = 24 px (escritorio).
       */
      minHeight: {
        tactil: '2.75rem',
        'tactil-escritorio': '1.5rem'
      },
      minWidth: {
        tactil: '2.75rem',
        'tactil-escritorio': '1.5rem'
      },
      spacing: {
        toque: '2.75rem',
        'separacion-objetivos': '0.5rem'
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    }
  },
  plugins: []
};
