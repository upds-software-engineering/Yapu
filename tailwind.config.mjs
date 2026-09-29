/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
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
      colors: {
        andina: {
          terracotta: {
            DEFAULT: '#B94700',
            light: '#E05A00',
            dark: '#873200',
            hover: '#A03D00'
          },
          gold: {
            DEFAULT: '#F59E0B',
            light: '#FCD34D',
            dark: '#B45309',
            glow: '#FDE68A'
          },
          aguayo: {
            DEFAULT: '#0D9488',
            cyan: '#0284C7',
            sky: '#38BDF8',
            dark: '#0F766E'
          },
          night: {
            DEFAULT: '#0B0F19',
            card: '#131C2E',
            border: '#1E293B',
            muted: '#334155'
          },
          sand: {
            DEFAULT: '#FDFBF7',
            warm: '#F5EFE6',
            card: '#EDE4D5'
          }
        }
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
