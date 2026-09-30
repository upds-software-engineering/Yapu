import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [RNF-002] Tema ÚNICO de color con contraste calibrado.
 *
 * `tailwind.config.mjs` reemplaza la paleta de Tailwind por tokens semánticos (`fondo`,
 * `superficie`, `tinta`, `primario`, `acento`, `exito`, `alerta`, `peligro`, `info`…). Una clase de la
 * paleta por defecto (`text-slate-400`, `bg-amber-600`) o de la paleta retirada (`andina-*`,
 * `text-sand`) ya NO genera CSS: el texto heredaría un color cualquiera sin avisar. Este test
 * convierte ese fallo silencioso en rojo, y tampoco admite variantes `dark:` porque no hay modo claro.
 */

const raiz = resolve(process.cwd());

function listarArchivos(directorio: string): string[] {
  return readdirSync(directorio).flatMap((entrada) => {
    const completo = join(directorio, entrada);
    return statSync(completo).isDirectory() ? listarArchivos(completo) : [completo];
  });
}

const ARCHIVOS_DE_INTERFAZ = ['src/ui', 'src/pages', 'src/layouts']
  .flatMap((carpeta) => listarArchivos(join(raiz, carpeta)))
  .filter((archivo) => /\.(tsx|astro)$/.test(archivo));

const PALETAS_RETIRADAS =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|andina|sand';

const CLASE_DE_PALETA_RETIRADA = new RegExp(
  `(?<![\\w-])(?:[a-z-]+:)*(?:text|bg|border|from|via|to|ring|shadow|outline|divide|placeholder|fill|stroke|decoration|accent|caret)-(?:${PALETAS_RETIRADAS})(?:-[\\w/.-]+)?(?![\\w-])`,
  'g'
);

/** Busca clases de paletas retiradas o variantes `dark:` en un fragmento de código. */
function hallazgosEn(codigo: string): string[] {
  const clases = codigo.match(CLASE_DE_PALETA_RETIRADA) ?? [];
  const oscuras = codigo.match(/(?<![\w-])dark:[\w-]+/g) ?? [];
  return [...clases, ...oscuras];
}

describe('[RNF-002] Tema único de color', () => {
  it('[RNF-002] el detector reconoce clases fuera del tema (sin falso verde)', () => {
    // Dado un fragmento con clases prohibidas y otro sólo con tokens del tema
    const prohibido = `className="text-slate-400 hover:bg-amber-600 bg-andina-night-card text-sand dark:bg-fondo"`;
    const permitido = `className="text-tinta-tenue hover:bg-superficie-alta border-linea-fuerte text-acento"`;

    // Entonces el detector marca las primeras y deja pasar las segundas
    expect(hallazgosEn(prohibido)).toEqual([
      'text-slate-400',
      'hover:bg-amber-600',
      'bg-andina-night-card',
      'text-sand',
      'dark:bg-fondo'
    ]);
    expect(hallazgosEn(permitido)).toEqual([]);
  });

  it('[RNF-002] ninguna pantalla usa colores fuera de los tokens del tema', () => {
    // Dado todo el código de interfaz
    const hallazgos = ARCHIVOS_DE_INTERFAZ.flatMap((archivo) =>
      hallazgosEn(readFileSync(archivo, 'utf8')).map(
        (clase) => `${relative(raiz, archivo)}: ${clase}`
      )
    );

    // Entonces sólo aparecen tokens semánticos
    expect(hallazgos).toEqual([]);
  });
});
