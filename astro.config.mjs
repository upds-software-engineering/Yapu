import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

/**
 * CD (ADR-004): el sitio se publica en GitHub Pages bajo el subdirectorio `/Yapu/`.
 * TODOS los enlaces, `fetch` y rutas del Service Worker deben construirse con
 * `import.meta.env.BASE_URL` (helper `ruta()` en `src/ui/lib/ruta.ts`).
 */
export default defineConfig({
  site: 'https://upds-software-engineering.github.io',
  base: '/Yapu',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: true
    })
  ],
  output: 'static',
  server: {
    port: 9500,
    host: true
  },
  preview: {
    port: 9500,
    host: true
  },
  build: {
    // Los nombres con hash permiten estrategia cache-first en el Service Worker.
    assets: '_astro'
  }
});
