/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
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
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
