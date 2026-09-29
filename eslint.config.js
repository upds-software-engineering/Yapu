import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * Enforcement de la arquitectura hexagonal mediante `no-restricted-imports` por carpeta.
 *
 * Reglas de dependencia:
 *   domain/**         → sólo domain/** (+ zod). Nada de application/infrastructure/ui/react/astro.
 *   application/**    → sólo domain/** y application/**.
 *   infrastructure/** → domain/**, application/** e infrastructure/**.
 *   ui/**             → application/** y ui/**; SÓLO `ui/hooks` puede tocar `infrastructure/container`.
 *   pages/layouts     → montan componentes de ui/ (Astro).
 */

const TEXTO_DOMINIO =
  'El dominio es TypeScript puro: no puede depender de otras capas (arquitectura hexagonal).';
const TEXTO_APLICACION =
  'La capa de aplicación no puede depender de infraestructura ni de la UI (arquitectura hexagonal).';
const TEXTO_UI =
  'La UI sólo consume casos de uso y DTOs; el acceso a infraestructura se hace vía src/infrastructure/container.ts desde ui/hooks.';

const RUTAS_PROHIBIDAS_DOMINIO = [
  '@application',
  '@application/*',
  '@infrastructure',
  '@infrastructure/*',
  '@ui',
  '@ui/*',
  'react',
  'react-dom',
  'astro',
  'astro/*',
  '**/application/**',
  '**/infrastructure/**',
  '**/ui/**'
];

const RUTAS_PROHIBIDAS_APLICACION = [
  '@infrastructure',
  '@infrastructure/*',
  '@ui',
  '@ui/*',
  'react',
  'react-dom',
  'astro',
  'astro/*',
  '**/infrastructure/**',
  '**/ui/**'
];

const RUTAS_PROHIBIDAS_UI = [
  '@domain',
  '@domain/*',
  '**/domain/**',
  // Todo el acceso a infraestructura está vetado salvo el composition root, que sólo pueden
  // importar los hooks (ver el override de `src/ui/hooks/**`).
  '@infrastructure/persistence',
  '@infrastructure/persistence/*',
  '@infrastructure/catalog',
  '@infrastructure/catalog/*',
  '@infrastructure/system',
  '@infrastructure/system/*',
  '@infrastructure/sync',
  '@infrastructure/sync/*',
  '**/infrastructure/persistence/**',
  '**/infrastructure/catalog/**',
  '**/infrastructure/system/**',
  '**/infrastructure/sync/**'
];

/** Fuera de `ui/hooks`, ni siquiera el composition root es accesible. */
const RUTAS_PROHIBIDAS_UI_SIN_CONTAINER = [
  ...RUTAS_PROHIBIDAS_UI,
  '@infrastructure/container',
  '**/infrastructure/container*'
];

/** El dominio no puede leer el entorno ni obtener entropía/tiempo de forma implícita (A5, RN-17). */
const SINTAXIS_PROHIBIDA_DOMINIO = [
  {
    selector: "MemberExpression[object.name='Math'][property.name='random']",
    message: 'El dominio usa AleatorioPort/FuenteAleatoria en lugar de Math.random (hallazgo A5).'
  },
  {
    selector: "MemberExpression[object.name='Date'][property.name='now']",
    message: 'El dominio recibe la fecha por parámetro (FechaDia) en lugar de usar Date.now (RN-17).'
  },
  {
    selector: 'NewExpression[callee.name=/^Date$/]',
    message: 'El dominio no construye fechas: recibe FechaDia desde un Reloj inyectado.'
  },
  {
    selector: "Identifier[name='window']",
    message: 'El dominio no puede acceder a window.'
  },
  {
    selector: "Identifier[name='localStorage']",
    message: 'El dominio no puede acceder a localStorage.'
  },
  {
    selector: "Identifier[name='document']",
    message: 'El dominio no puede acceder a document.'
  },
  {
    selector: "Identifier[name='navigator']",
    message: 'El dominio no puede acceder a navigator.'
  },
  {
    selector: "MemberExpression[object.name='crypto']",
    message: 'El dominio usa GeneradorId en lugar de crypto.'
  }
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.cache/**',
      'node_modules/**',
      'reports/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
      'scripts/**/*.py'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs,astro}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module'
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error'
    }
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'no-restricted-imports': ['error', { patterns: RUTAS_PROHIBIDAS_UI.map((group) => ({ group: [group], message: TEXTO_UI })) }]
    }
  },
  {
    // Único punto autorizado para que la UI obtenga adaptadores concretos: `ui/hooks`.
    files: ['src/ui/components/**/*.{ts,tsx}', 'src/ui/design-system/**/*.{ts,tsx}', 'src/ui/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: RUTAS_PROHIBIDAS_UI_SIN_CONTAINER.map((group) => ({ group: [group], message: TEXTO_UI })) }
      ]
    }
  },
  {
    // Los hooks son el único lugar que puede leer `src/infrastructure/container.ts`.
    files: ['src/ui/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: RUTAS_PROHIBIDAS_UI.map((group) => ({ group: [group], message: TEXTO_UI })) }
      ]
    }
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: RUTAS_PROHIBIDAS_DOMINIO.map((group) => ({ group: [group], message: TEXTO_DOMINIO })) }
      ],
      'no-restricted-syntax': ['error', ...SINTAXIS_PROHIBIDA_DOMINIO],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'El dominio es agnóstico del entorno.' },
        { name: 'localStorage', message: 'El dominio es agnóstico del entorno.' }
      ]
    }
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: RUTAS_PROHIBIDAS_APLICACION.map((group) => ({ group: [group], message: TEXTO_APLICACION })) }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: 'La aplicación usa AleatorioPort en lugar de Math.random.'
        },
        {
          selector: "Identifier[name='localStorage']",
          message: 'La aplicación no accede a localStorage: usa un repositorio (puerto).'
        },
        {
          selector: "Identifier[name='window']",
          message: 'La aplicación no accede a window: usa ConectividadPort.'
        }
      ]
    }
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  }
);
