#!/usr/bin/env node
/**
 * Enforzamiento de las reglas de dependencia de la arquitectura hexagonal.
 *
 * ESLint ya las aplica con `no-restricted-imports` (error) por carpeta, pero este script:
 *  1. recorre `src/**` y comprueba que NO exista ninguna violación;
 *  2. se AUTO-TESTEA: verifica que el detector sí marca una violación sintética
 *     (si el detector no marcara nada, el script falla en vez de dar un falso verde).
 *
 * Se ejecuta con `npm run lint:capas` y en el job `quality` del CI.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(raiz, 'src');

/** Capas que cada capa tiene PROHIBIDO importar (además de las prohibiciones de entorno). */
const PROHIBIDAS = {
  domain: ['application', 'infrastructure', 'ui', 'react', 'react-dom', 'astro'],
  application: ['infrastructure', 'ui', 'react', 'react-dom', 'astro'],
  infrastructure: ['ui', 'react', 'react-dom'],
  ui: ['domain']
};

/** Patrones de entorno prohibidos por capa (RN-17, A5, RNF-005). */
const ENTORNO_PROHIBIDO = {
  domain: ['Math.random', 'Date.now', 'window.', 'localStorage', 'navigator.', 'crypto.'],
  application: ['Math.random', 'localStorage', 'window.'],
  infrastructure: [],
  ui: []
};

/** Subrutas de infraestructura vetadas a la UI; el composition root sólo se permite en `ui/hooks`. */
const SUBRUTAS_INFRA_VETADAS = ['persistence', 'catalog', 'system', 'sync'];

export function capaDe(rutaRelativa) {
  const partes = rutaRelativa.split('/');
  if (partes[0] !== 'src') return null;
  const capa = partes[1];
  return Object.prototype.hasOwnProperty.call(PROHIBIDAS, capa) ? capa : null;
}

/** Detecta violaciones en el código fuente. Exportado para poder testearlo desde Vitest. */
export function detectarViolaciones(archivos) {
  const violaciones = [];
  for (const { ruta, codigo } of archivos) {
    const capa = capaDe(ruta);
    if (!capa) continue;
    const prohibidas = PROHIBIDAS[capa];

    for (const coincidencia of codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const especificador = coincidencia[1];
      if (!especificador) continue;
      for (const prohibida of prohibidas) {
        const esAlias = especificador.startsWith(`@${prohibida}/`) || especificador === `@${prohibida}`;
        const esRelativo = new RegExp(`(^|/)(\\.\\./)+${prohibida}/`).test(especificador);
        if (esAlias || esRelativo || especificador === prohibida || especificador.startsWith(`${prohibida}/`)) {
          violaciones.push(`${ruta}: la capa "${capa}" no puede importar "${especificador}"`);
        }
      }
    }

    for (const patron of ENTORNO_PROHIBIDO[capa]) {
      if (codigo.includes(patron)) {
        violaciones.push(`${ruta}: la capa "${capa}" no puede usar "${patron}"`);
      }
    }

    // La UI sólo puede tocar el composition root, y únicamente desde `ui/hooks`.
    if (capa === 'ui') {
      const enHooks = ruta.includes('/ui/hooks/');
      for (const coincidencia of codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const especificador = coincidencia[1] ?? '';
        const apuntaAInfra =
          especificador.startsWith('@infrastructure/') || /(^|\/)infrastructure\//.test(especificador);
        if (!apuntaAInfra) continue;
        const esContainer = /(^|\/)infrastructure\/container(\.ts)?$/.test(especificador);
        if (!esContainer) {
          violaciones.push(`${ruta}: la UI sólo puede importar @infrastructure/container`);
        } else if (!enHooks) {
          violaciones.push(`${ruta}: sólo ui/hooks puede importar @infrastructure/container`);
        }
      }
    }
  }
  return violaciones;
}

function listarFuentes(directorio) {
  const encontrados = [];
  for (const entrada of readdirSync(directorio)) {
    const completo = join(directorio, entrada);
    if (statSync(completo).isDirectory()) encontrados.push(...listarFuentes(completo));
    else if (/\.(ts|tsx)$/.test(entrada)) encontrados.push(completo);
  }
  return encontrados;
}

const archivos = listarFuentes(SRC).map((completo) => ({
  ruta: relative(raiz, completo).split('\\').join('/'),
  codigo: readFileSync(completo, 'utf8')
}));

// 1) Auto-test del detector: si no marca esta violación sintética, el script no sirve.
const sinteticas = detectarViolaciones([
  { ruta: 'src/domain/aprendizaje/EjemploInvalido.ts', codigo: "import React from 'react';\nconst x = Math.random();\n" },
  { ruta: 'src/ui/EjemploInvalido.tsx', codigo: "import { Nivel } from '@domain/aprendizaje/Nivel';" },
  { ruta: 'src/application/EjemploInvalido.ts', codigo: "import { repo } from '@infrastructure/persistence/memory';" }
]);

if (sinteticas.length < 3) {
  console.error(
    `[capas] El detector no está funcionando: sólo detectó ${sinteticas.length} de 3 violaciones sintéticas.`
  );
  process.exit(1);
}

// 2) Comprobación real sobre `src/**`.
const violaciones = detectarViolaciones(archivos);

console.log(`[capas] ${archivos.length} archivos analizados en src/.`);
console.log(`[capas] Auto-test del detector: ${sinteticas.length} violaciones sintéticas detectadas correctamente.`);

if (violaciones.length > 0) {
  console.error('[capas] VIOLACIONES DE DEPENDENCIA:');
  for (const violacion of violaciones) console.error(`  - ${violacion}`);
  process.exit(1);
}

console.log('[capas] OK: ninguna capa viola las reglas de dependencia.');
