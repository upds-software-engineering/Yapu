import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('.', import.meta.url));

const alias = {
  '@': `${raiz}src`,
  '@domain': `${raiz}src/domain`,
  '@application': `${raiz}src/application`,
  '@infrastructure': `${raiz}src/infrastructure`,
  '@ui': `${raiz}src/ui`
};

/**
 * Pirámide de pruebas:
 *  - tests/unit       → dominio puro y casos de uso (repos en memoria, RelojFijo, AleatorioFijo)
 *  - tests/contract   → la misma suite contra los repos de memoria y los de localStorage (jsdom)
 *  - tests/component  → @testing-library/react sobre los componentes de `src/ui`
 */
export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/helpers/setup.ts'],
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/contract/**/*.{test,spec}.{ts,tsx}',
      'tests/component/**/*.{test,spec}.{ts,tsx}'
    ],
    reporters: ['default', 'junit', 'html'],
    outputFile: {
      junit: 'reports/junit/vitest.xml',
      html: 'reports/html/vitest/index.html'
    },
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**', 'src/ui/**'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/pages/**',
        'src/layouts/**',
        'src/ui/**/*.tsx'
      ],
      reporter: ['text', 'text-summary', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: 'reports/coverage',
      thresholds: {
        // Cobertura exigida al núcleo hexagonal.
        'src/domain/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        'src/application/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        // Umbral global (incluye infraestructura).
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    }
  }
});
