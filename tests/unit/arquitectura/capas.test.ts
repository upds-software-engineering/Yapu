import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [RNF-005] Mantenibilidad: las reglas de dependencia de la arquitectura hexagonal se
 * comprueban automáticamente. Este test demuestra dos cosas:
 *  1. el detector SÍ marca una importación prohibida (si no, sería un falso verde);
 *  2. el código real de `src/**` no tiene ninguna violación.
 *
 * ESLint aplica las mismas reglas con `no-restricted-imports` (error) en `npm run lint`.
 */

/** Raíz del proyecto: Vitest se ejecuta siempre desde la raíz del repositorio (ver package.json). */
const raiz = resolve(process.cwd());

const PROHIBIDAS: Record<string, string[]> = {
  domain: ['application', 'infrastructure', 'ui', 'react', 'react-dom', 'astro'],
  application: ['infrastructure', 'ui', 'react', 'react-dom', 'astro'],
  infrastructure: ['ui', 'react', 'react-dom'],
  ui: ['domain']
};

const ENTORNO_PROHIBIDO: Record<string, string[]> = {
  domain: ['Math.random', 'Date.now', 'window.', 'localStorage', 'navigator.', 'crypto.'],
  application: ['Math.random', 'localStorage', 'window.'],
  infrastructure: [],
  ui: []
};

function capaDe(rutaRelativa: string): string | null {
  const partes = rutaRelativa.split('/');
  if (partes[0] !== 'src') return null;
  const capa = partes[1] ?? '';
  return Object.prototype.hasOwnProperty.call(PROHIBIDAS, capa) ? capa : null;
}

/** Elimina comentarios para no marcar como violación lo que sólo se documenta. */
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

function detectar(archivos: Array<{ ruta: string; codigo: string }>): string[] {
  const violaciones: string[] = [];
  for (const { ruta, codigo } of archivos) {
    const capa = capaDe(ruta);
    if (!capa) continue;
    for (const coincidencia of codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const especificador = coincidencia[1];
      if (!especificador) continue;
      for (const prohibida of PROHIBIDAS[capa] ?? []) {
        const esAlias = especificador.startsWith(`@${prohibida}/`) || especificador === `@${prohibida}`;
        const esRelativo = new RegExp(`(^|/)(\\.\\./)+${prohibida}/`).test(especificador);
        if (esAlias || esRelativo || especificador === prohibida || especificador.startsWith(`${prohibida}/`)) {
          violaciones.push(`${ruta} → ${especificador}`);
        }
      }
    }
    const soloCodigo = sinComentarios(codigo);
    for (const patron of ENTORNO_PROHIBIDO[capa] ?? []) {
      if (soloCodigo.includes(patron)) violaciones.push(`${ruta} → ${patron}`);
    }

    // La UI sólo puede tocar el composition root, y únicamente desde `ui/hooks`.
    if (capa === 'ui') {
      const enHooks = ruta.includes('/ui/hooks/');
      for (const coincidencia of codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const especificador = coincidencia[1] ?? '';
        const apuntaAInfra =
          especificador.startsWith('@infrastructure/') || /(^|\/)infrastructure\//.test(especificador);
        if (!apuntaAInfra) continue;
        const esContainer = /(^|\/)(@)?infrastructure\/container(\.ts)?$/.test(especificador);
        if (!esContainer) violaciones.push(`${ruta} → ${especificador} (sólo container)`);
        else if (!enHooks) violaciones.push(`${ruta} → ${especificador} (sólo desde ui/hooks)`);
      }
    }
  }
  return violaciones;
}

function listarFuentes(directorio: string): string[] {
  const encontrados: string[] = [];
  for (const entrada of readdirSync(directorio)) {
    const completo = join(directorio, entrada);
    if (statSync(completo).isDirectory()) encontrados.push(...listarFuentes(completo));
    else if (/\.(ts|tsx)$/.test(entrada)) encontrados.push(completo);
  }
  return encontrados;
}

describe('[RNF-005] Reglas de dependencia entre capas', () => {
  it('[RNF-005] el detector marca una importación prohibida de dominio a React', () => {
    // Dado un archivo de dominio que importa React y usa Math.random
    const archivos = [
      { ruta: 'src/domain/aprendizaje/EjemploInvalido.ts', codigo: "import React from 'react';\nconst x = Math.random();" }
    ];

    // Cuando se analiza
    const violaciones = detectar(archivos);

    // Entonces se detectan ambas violaciones
    expect(violaciones.length).toBeGreaterThanOrEqual(2);
    expect(violaciones.some((v) => v.includes('react'))).toBe(true);
    expect(violaciones.some((v) => v.includes('Math.random'))).toBe(true);
  });

  it('[RNF-005] el detector marca la UI importando el dominio y la aplicación importando infraestructura', () => {
    // Dado
    const archivos = [
      { ruta: 'src/ui/components/Prueba.tsx', codigo: "import { Nivel } from '@domain/aprendizaje/Nivel';" },
      { ruta: 'src/application/use-cases/Prueba.ts', codigo: "import { repo } from '@infrastructure/persistence/memory';" }
    ];

    // Cuando
    const violaciones = detectar(archivos);

    // Entonces
    expect(violaciones).toHaveLength(2);
  });

  it('[RNF-005] ninguna capa real de src/** viola las reglas de dependencia', () => {
    // Dado el código real del repositorio
    const archivos = listarFuentes(join(raiz, 'src')).map((completo) => ({
      ruta: relative(raiz, completo).split('\\').join('/'),
      codigo: readFileSync(completo, 'utf8')
    }));

    // Cuando se analiza
    const violaciones = detectar(archivos);

    // Entonces no hay ninguna violación
    expect(archivos.length).toBeGreaterThan(20);
    expect(violaciones).toEqual([]);
  });
});
