import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [RNF-004] Seguridad y [RS-001] Sostenibilidad técnica.
 *
 * Estas dos comprobaciones no encajan en ninguna otra suite: verifican propiedades del REPOSITORIO
 * (que no se filtren credenciales y que la documentación de arquitectura exista y siga siendo
 * coherente con las decisiones tomadas) en lugar del comportamiento en ejecución.
 */

const raiz = resolve(process.cwd());

function listarArchivos(directorio: string): string[] {
  const encontrados: string[] = [];
  for (const entrada of readdirSync(directorio)) {
    if (['node_modules', 'dist', '.git', '.astro', '.cache', 'reports', 'playwright-report', 'test-results'].includes(entrada)) {
      continue;
    }
    const completo = join(directorio, entrada);
    if (statSync(completo).isDirectory()) encontrados.push(...listarArchivos(completo));
    else encontrados.push(completo);
  }
  return encontrados;
}

const ARCHIVOS_DE_CODIGO = listarArchivos(join(raiz, 'src'))
  .concat(listarArchivos(join(raiz, 'tests')))
  .filter((archivo) => /\.(ts|tsx|astro|mjs|js)$/.test(archivo));

describe('[RNF-004] Seguridad: sin credenciales ni servicios reales', () => {
  it('[RNF-004] el código no contiene credenciales ni claves de API embebidas', () => {
    // Dado el árbol de código de la aplicación (src y tests)
    const patronesDeSecreto = [
      /AIza[0-9A-Za-z_-]{35}/, // clave de API de Google/Firebase
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /(api[_-]?key|apikey|secret|password|passwd|token)\s*[:=]\s*['"][^'"]{12,}['"]/i,
      /Bearer\s+[A-Za-z0-9._-]{20,}/
    ];

    // Cuando se revisa cada archivo
    const hallazgos: string[] = [];
    for (const archivo of ARCHIVOS_DE_CODIGO) {
      const contenido = readFileSync(archivo, 'utf8');
      for (const patron of patronesDeSecreto) {
        if (patron.test(contenido)) {
          hallazgos.push(`${relative(raiz, archivo)} coincide con ${String(patron)}`);
        }
      }
    }

    // Entonces no aparece ningún secreto
    expect(hallazgos).toEqual([]);
  });

  it('[RNF-004] no se usa Firebase real: la sesión es local y simulada', () => {
    // Dado el manifiesto de dependencias
    const manifiesto = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencias = { ...manifiesto.dependencies, ...manifiesto.devDependencies };

    // Cuando se buscan SDK de autenticación en la nube
    const sdkEnLaNube = Object.keys(dependencias).filter((nombre) =>
      /firebase|firebase-admin|@auth0|supabase|aws-amplify/i.test(nombre)
    );

    // Entonces no hay ninguno y la sesión vive en localStorage (ADR-003)
    expect(sdkEnLaNube).toEqual([]);
    const sesionLocal = readFileSync(
      join(raiz, 'src/infrastructure/system/SesionLocalAdapter.ts'),
      'utf8'
    );
    expect(sesionLocal).toContain('yapu:sesion:v1');
    expect(sesionLocal).toContain('localStorage');
  });
});

/** Elimina comentarios para no marcar como incumplimiento lo que sólo se documenta. */
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

describe('[RNF-001] Usabilidad: una sola escala tipográfica en toda la interfaz', () => {
  it('[RNF-001] ninguna pantalla usa tamaños de fuente fuera de los tokens del sistema', () => {
    // Dado el código de presentación (componentes, páginas y layout)
    const archivosDeUi = ARCHIVOS_DE_CODIGO.filter((archivo) =>
      /[\\/]src[\\/](ui|pages|layouts)[\\/]/.test(archivo)
    );

    // Cuando se buscan utilidades tipográficas crudas de Tailwind
    const infracciones: string[] = [];
    for (const archivo of archivosDeUi) {
      const lineas = sinComentarios(readFileSync(archivo, 'utf8')).split('\n');
      lineas.forEach((linea, indice) => {
        if (/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\b/.test(linea)) {
          infracciones.push(`${relative(raiz, archivo)}:${indice + 1}`);
        }
      });
    }

    // Entonces sólo se usan text-caption/body/title/display
    expect(archivosDeUi.length).toBeGreaterThan(20);
    expect(infracciones).toEqual([]);
  });
});

describe('[RNF-003] Compatibilidad móvil y PWA', () => {
  it('[RNF-003] el manifest publica la PWA bajo /Yapu/ con iconos any y maskable separados', () => {
    // Dado el manifest que se sirve en producción
    const manifest = JSON.parse(readFileSync(join(raiz, 'public/manifest.json'), 'utf8')) as {
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ purpose: string }>;
    };

    // Entonces respeta el subdirectorio del despliegue y no combina any+maskable en un mismo icono
    expect(manifest.start_url).toBe('/Yapu/');
    expect(manifest.scope).toBe('/Yapu/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.some((icono) => icono.purpose === 'any')).toBe(true);
    expect(manifest.icons.some((icono) => icono.purpose === 'maskable')).toBe(true);
    expect(manifest.icons.every((icono) => !icono.purpose.includes(' '))).toBe(true);
  });

  it('[RNF-003] la suite E2E se ejecuta también en un dispositivo móvil (Pixel 5)', () => {
    // Dado el archivo de configuración de Playwright
    const configuracion = readFileSync(join(raiz, 'playwright.config.ts'), 'utf8');

    // Entonces existe un proyecto móvil real, no sólo una vista de escritorio reducida
    expect(configuracion).toContain("devices['Pixel 5']");
    expect(configuracion).toContain("devices['Desktop Chrome']");
  });
});

describe('[RNF-006] Rendimiento y [RS-002] eficiencia energética', () => {
  it('[RNF-006] el Service Worker se genera con precache, versión con hash y estrategias por tipo', () => {
    // Dado el generador del Service Worker que se ejecuta después del build
    const generador = readFileSync(join(raiz, 'scripts/generar-service-worker.mjs'), 'utf8');

    // Entonces versiona la caché con un hash del build, precachea todo y separa las estrategias
    expect(generador).toContain('createHash');
    expect(generador).toContain('PRECACHE_URLS');
    expect(generador).toContain('redPrimero');
    expect(generador).toContain('cachePrimero');
    expect(generador).toContain('ignoreVary: true');
    expect(generador).toContain('caches.delete');
  });

  it('[RS-002] el titulo animado se degrada con movimiento reducido o hardware modesto y se pausa fuera del viewport', () => {
    // Dado el componente de partículas de la portada
    const titulo = readFileSync(
      join(raiz, 'src/ui/components/portada/TituloParticulas.tsx'),
      'utf8'
    );

    // Entonces consulta la preferencia del sistema, la potencia del equipo y pausa el bucle
    expect(titulo).toContain('usePreferenciaReducida');
    expect(titulo).toContain('hardwareConcurrency');
    expect(titulo).toContain('IntersectionObserver');
    expect(titulo).toContain('cancelAnimationFrame');
    // Y no usa aleatoriedad global: la siembra es determinista para no repintar distinto
    expect(sinComentarios(titulo)).not.toContain('Math.random');
  });
});

describe('[RS-003] Gobernanza del contenido comunitario', () => {
  it('[RS-003] el agregado exige dos aprobaciones de docentes distintos y registra la bitácora', () => {
    // Dado el agregado de retos comunitarios
    const reto = readFileSync(join(raiz, 'src/domain/contenido/RetoComunitario.ts'), 'utf8');

    // Entonces codifica la doble moderación y prohíbe que el autor se modere a sí mismo
    expect(reto).toContain('APROBACIONES_REQUERIDAS = 2');
    expect(reto).toContain('NIVEL_MINIMO_PROPONER = 7');
    expect(reto).toContain('moderaciones');
    expect(reto).toContain('PermisoDenegadoError');
    expect(reto).toContain('ConflictoEstadoError');
  });
});

describe('[RS-001] Sostenibilidad: documentación de arquitectura y de pruebas', () => {
  it('[RS-001] los cuatro ADR y los documentos de pruebas y de leyes UX existen con su contenido', () => {
    // Dado el conjunto de documentos exigidos por la sostenibilidad del proyecto
    const documentos: Array<{ ruta: string; fragmentosEsperados: string[] }> = [
      {
        ruta: 'Docs/arquitectura/ADR-001-arquitectura-hexagonal.md',
        fragmentosEsperados: ['Contexto', 'Decisión', 'Consecuencias']
      },
      {
        ruta: 'Docs/arquitectura/ADR-002-persistencia-local-y-sincronizacion.md',
        fragmentosEsperados: ['localStorage', 'migraci']
      },
      {
        ruta: 'Docs/arquitectura/ADR-003-autenticacion-simulada.md',
        fragmentosEsperados: ['SesionLocalAdapter', 'Firebase']
      },
      {
        ruta: 'Docs/arquitectura/ADR-004-despliegue-github-pages.md',
        fragmentosEsperados: ['/Yapu', 'deploy-pages']
      },
      {
        ruta: 'Docs/arquitectura/diagrama-de-capas.md',
        fragmentosEsperados: ['mermaid', 'domain', 'application', 'infrastructure', 'ui']
      },
      {
        ruta: 'Docs/arquitectura/checklist-leyes-ux.md',
        fragmentosEsperados: ['Fitts', 'Hick', 'Miller', 'Jakob']
      },
      {
        ruta: 'Docs/testing/plan-de-pruebas.md',
        fragmentosEsperados: ['Pirámide', 'cobertura', 'Playwright']
      }
    ];

    // Cuando se lee cada documento
    for (const documento of documentos) {
      const contenido = readFileSync(join(raiz, documento.ruta), 'utf8');

      // Entonces existe y menciona las decisiones que debe registrar
      expect(contenido.length, `${documento.ruta} está vacío`).toBeGreaterThan(400);
      for (const fragmento of documento.fragmentosEsperados) {
        expect(contenido, `${documento.ruta} no menciona "${fragmento}"`).toContain(fragmento);
      }
    }
  });

  it('[RS-001] las convenciones del proyecto describen YAPU y no otro proyecto', () => {
    // Dado el archivo de convenciones del repositorio
    const convenciones = readFileSync(
      join(raiz, '.agents/skills/project-conventions/SKILL.md'),
      'utf8'
    );

    // Entonces documenta YAPU y la arquitectura hexagonal
    expect(convenciones).toContain('YAPU');
    expect(convenciones.toLowerCase()).toContain('hexagonal');
    expect(convenciones).toContain('RN-');
  });
});
