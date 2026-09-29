import { Nivel } from '@domain/aprendizaje/Nivel';
import { Palabra } from '@domain/aprendizaje/Palabra';
import { OracionBase, type DatosOracion } from '@domain/contenido/OracionBase';
import { CatalogoSeedRepository } from './CatalogoSeedRepository';
import { esquemaCorpus } from './esquemas';
import { FECHA_SIEMBRA_CORPUS, SEMILLA_CRUDA } from './semilla/datos-semilla';

/**
 * WP-I2 / RF-003: carga del corpus semilla.
 *
 * Dos niveles de validación, deliberadamente distintos:
 *  1. ESTRUCTURA (Zod): si `SEMILLA_CRUDA` no cumple `esquemaCorpus` se LANZA un `Error`. Un corpus
 *     mal formado es un error de programación, no un dato del usuario, y debe romper el arranque.
 *  2. CONTENIDO (RN-11 / RN-12): una oración que no contiene su palabra clave o cuya palabra clave
 *     no existe (o es de otro nivel) NO rompe la carga: se registra en `avisos` y queda FUERA de
 *     `oraciones`, porque el generador de cloze no puede construir una pregunta válida con ella.
 *
 * `avisos` es la trazabilidad de calidad de datos que consume el composition root.
 */
export interface SemillaCargada {
  niveles: Nivel[];
  palabras: Palabra[];
  /** Sólo las oraciones que cumplen RN-11 y RN-12 (las descartadas se describen en `avisos`). */
  oraciones: OracionBase[];
  /** Motivos, en español, de las oraciones descartadas. */
  avisos: string[];
}

/** Convierte los problemas de Zod en líneas legibles para el mensaje de error. */
function describirProblemas(problemas: readonly { path: readonly (string | number)[]; message: string }[]): string {
  return problemas
    .map((problema) => `  - ${problema.path.join('.') || '(raíz)'}: ${problema.message}`)
    .join('\n');
}

/** Valida la semilla cruda, construye las entidades del catálogo y reporta los avisos de contenido. */
export function cargarSemilla(): SemillaCargada {
  const validacion = esquemaCorpus.safeParse(SEMILLA_CRUDA);

  if (!validacion.success) {
    throw new Error(
      'La semilla del catálogo no cumple el esquema esperado (error de programación, no de datos del usuario):\n' +
        describirProblemas(validacion.error.issues)
    );
  }

  const corpus = validacion.data;
  const niveles = corpus.niveles.map((nivel) => Nivel.crear(nivel));
  const palabras = corpus.palabras.map((palabra) => Palabra.crear(palabra));
  const palabrasPorId = new Map(palabras.map((palabra) => [palabra.id, palabra]));

  const oraciones: OracionBase[] = [];
  const avisos: string[] = [];

  for (const cruda of corpus.oraciones) {
    const datos: DatosOracion = {
      ...cruda,
      contextoCultural: cruda.contextoCultural ?? '',
      fechaCreacion: cruda.fechaCreacion ?? FECHA_SIEMBRA_CORPUS
    };
    const oracion = OracionBase.reconstruir(datos);
    const palabraClave = palabrasPorId.get(oracion.palabraClaveId);

    if (!palabraClave) {
      avisos.push(
        `La oración "${oracion.id}" ("${oracion.textoQuechua}") declara la palabra clave "${oracion.palabraClaveId}", ` +
          'que no existe en el catálogo (RN-12); se excluye del generador de cloze.'
      );
      continue;
    }

    if (!palabraClave.esDelNivel(oracion.nivelId)) {
      avisos.push(
        `La oración "${oracion.id}" ("${oracion.textoQuechua}") es del nivel ${oracion.nivelId.valor}, pero su palabra clave ` +
          `"${palabraClave.id}" ("${palabraClave.terminoTexto}") es del nivel ${palabraClave.nivelId.valor} (RN-12); ` +
          'se excluye del generador de cloze.'
      );
      continue;
    }

    if (!oracion.contienePalabraClave(palabraClave)) {
      avisos.push(
        `La oración "${oracion.id}" ("${oracion.textoQuechua}") no contiene su palabra clave ` +
          `"${oracion.palabraClaveId}" ("${palabraClave.terminoTexto}") (RN-11); se excluye del generador de cloze.`
      );
      continue;
    }

    oraciones.push(oracion);
  }

  return { niveles, palabras, oraciones, avisos };
}

/** Catálogo de sólo lectura listo para inyectar en los casos de uso. */
export function crearCatalogoSemilla(): CatalogoSeedRepository {
  const semilla = cargarSemilla();
  return new CatalogoSeedRepository(semilla.niveles, semilla.palabras);
}

/** Oraciones base válidas (RN-11 y RN-12) del corpus semilla. */
export function crearOracionesSemilla(): OracionBase[] {
  return cargarSemilla().oraciones;
}
