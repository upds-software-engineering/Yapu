import { z } from 'zod';
import { CATEGORIAS_GRAMATICALES, type EstadoModeracion } from '@domain/shared/tipos';

/**
 * WP-I2 / RF-003: esquemas Zod de las formas CRUDAS del corpus semilla.
 *
 * "Crudo" significa: la forma plana tal como se siembra o se persiste (sin objetos de valor, sin
 * fechas convertidas). `cargarSemilla()` valida con estos esquemas y sólo después construye las
 * entidades de dominio; así un error de estructura se detecta como error de programación y no
 * como dato inválido del usuario.
 *
 * Qué SÍ se valida aquí (estructura e integridad referencial del corpus):
 *  - `nivelId` entero entre 1 y 10 y con un nivel existente en `niveles`;
 *  - `categoria` dentro de `CATEGORIAS_GRAMATICALES`;
 *  - textos obligatorios no vacíos y opcionales no vacíos si se declaran;
 *  - `palabraClaveId` no vacío;
 *  - `estado` dentro de `pendiente | aprobado | rechazado`;
 *  - `id` no vacío y único dentro de cada colección.
 *
 * Qué NO se valida aquí (es contenido, no estructura): si la oración contiene su palabra clave
 * (RN-11) o si su palabra clave existe y es del mismo nivel (RN-12). Esos casos se reportan como
 * avisos en `cargarSemilla()` para no romper la carga del catálogo.
 *
 * Los mensajes de error están en español porque se muestran tal cual en la trazabilidad de datos.
 */

/** Estados de moderación admitidos; `satisfies` garantiza que siguen el tipo del dominio. */
const ESTADOS_MODERACION = ['pendiente', 'aprobado', 'rechazado'] as const satisfies readonly EstadoModeracion[];

/** RN-12: identificador del nivel del curso (1..10). */
const nivelIdCrudo = z
  .number({
    required_error: 'Falta el campo "nivelId" en el corpus.',
    invalid_type_error: 'El campo "nivelId" debe ser un número entero entre 1 y 10.'
  })
  .int('El campo "nivelId" debe ser un número entero, sin decimales.')
  .min(1, 'El campo "nivelId" debe estar entre 1 y 10 (recibido por debajo de 1).')
  .max(10, 'El campo "nivelId" debe estar entre 1 y 10 (recibido por encima de 10).');

/** Categoría gramatical cerrada: cualquier otro valor es un error del corpus. */
const categoriaCruda = z.enum(CATEGORIAS_GRAMATICALES, {
  errorMap: () => ({
    message: `Categoría gramatical inválida: se espera una de ${CATEGORIAS_GRAMATICALES.join(', ')}.`
  })
});

/** Estado de moderación (RN-12 / RN-13). */
const estadoCrudo = z.enum(ESTADOS_MODERACION, {
  errorMap: () => ({ message: `Estado de moderación inválido: se espera uno de ${ESTADOS_MODERACION.join(', ')}.` })
});

/** Texto obligatorio: presente, de tipo texto y sin quedarse vacío tras recortar espacios. */
function textoObligatorio(campo: string): z.ZodString {
  return z
    .string({
      required_error: `Falta el campo "${campo}" en el corpus.`,
      invalid_type_error: `El campo "${campo}" debe ser texto.`
    })
    .trim()
    .min(1, `El campo "${campo}" no puede estar vacío.`);
}

/** Texto opcional: puede faltar, pero si se declara no puede estar vacío. */
function textoOpcional(campo: string): z.ZodOptional<z.ZodString> {
  return z
    .string({ invalid_type_error: `El campo "${campo}" debe ser texto.` })
    .trim()
    .min(1, `El campo "${campo}" no puede estar vacío si se declara.`)
    .optional();
}

/** Nivel crudo del curso (1..10). No guarda umbral: el umbral es único (RN-04, PoliticaAprobacion). */
export const esquemaNivelCrudo = z.object({
  id: nivelIdCrudo,
  tituloQuechua: textoObligatorio('tituloQuechua'),
  tituloEspanol: textoObligatorio('tituloEspanol'),
  descripcion: textoObligatorio('descripcion'),
  icono: textoObligatorio('icono'),
  colorAcento: textoObligatorio('colorAcento')
});

/** Palabra cruda del vocabulario (RF-003 / RF-004). */
export const esquemaPalabraCruda = z.object({
  id: textoObligatorio('id'),
  nivelId: nivelIdCrudo,
  termino: textoObligatorio('termino'),
  traduccion: textoObligatorio('traduccion'),
  pronunciacion: textoObligatorio('pronunciacion'),
  categoria: categoriaCruda,
  imagenUrl: textoOpcional('imagenUrl'),
  contextoCultural: textoObligatorio('contextoCultural'),
  ejemploUso: textoOpcional('ejemploUso')
});

/**
 * Oración base cruda (RF-006).
 *
 * `fechaCreacion` es opcional porque el corpus original no fecha cada oración: cuando falta,
 * `cargarSemilla()` aplica `FECHA_SIEMBRA_CORPUS` para poder construir la entidad de dominio.
 */
export const esquemaOracionCruda = z.object({
  id: textoObligatorio('id'),
  nivelId: nivelIdCrudo,
  textoQuechua: textoObligatorio('textoQuechua'),
  traduccionEspanol: textoObligatorio('traduccionEspanol'),
  palabraClaveId: textoObligatorio('palabraClaveId'),
  categoria: categoriaCruda,
  contextoCultural: textoOpcional('contextoCultural'),
  autorId: textoObligatorio('autorId'),
  estado: estadoCrudo,
  fechaCreacion: z
    .string({ invalid_type_error: 'El campo "fechaCreacion" debe ser texto en formato YYYY-MM-DD.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'El campo "fechaCreacion" debe tener el formato YYYY-MM-DD.')
    .optional()
});

/** Añade un problema si algún `id` se repite dentro de la colección indicada. */
function verificarIdsUnicos(
  coleccion: readonly { id: string | number }[],
  nombre: string,
  contexto: z.RefinementCtx
): void {
  const vistos = new Set<string>();
  const duplicados = new Set<string>();

  for (const elemento of coleccion) {
    const clave = String(elemento.id);
    if (vistos.has(clave)) duplicados.add(clave);
    vistos.add(clave);
  }

  if (duplicados.size > 0) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: [nombre],
      message: `Identificadores duplicados en "${nombre}": ${[...duplicados].join(', ')}. Cada id debe ser único.`
    });
  }
}

/**
 * Corpus completo. Además de la estructura, comprueba la integridad referencial hacia los niveles
 * y la unicidad de identificadores dentro de cada colección.
 */
export const esquemaCorpus = z
  .object({
    niveles: z.array(esquemaNivelCrudo),
    palabras: z.array(esquemaPalabraCruda),
    oraciones: z.array(esquemaOracionCruda)
  })
  .superRefine((corpus, contexto) => {
    verificarIdsUnicos(corpus.niveles, 'niveles', contexto);
    verificarIdsUnicos(corpus.palabras, 'palabras', contexto);
    verificarIdsUnicos(corpus.oraciones, 'oraciones', contexto);

    const idsNiveles = new Set(corpus.niveles.map((nivel) => nivel.id));

    corpus.palabras.forEach((palabra, indice) => {
      if (!idsNiveles.has(palabra.nivelId)) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['palabras', indice, 'nivelId'],
          message: `La palabra "${palabra.id}" apunta al nivel ${palabra.nivelId}, que no existe en "niveles".`
        });
      }
    });

    corpus.oraciones.forEach((oracion, indice) => {
      if (!idsNiveles.has(oracion.nivelId)) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['oraciones', indice, 'nivelId'],
          message: `La oración "${oracion.id}" apunta al nivel ${oracion.nivelId}, que no existe en "niveles".`
        });
      }
    });
  });

/** Forma cruda de un nivel. */
export type NivelCrudo = z.infer<typeof esquemaNivelCrudo>;
/** Forma cruda de una palabra del vocabulario. */
export type PalabraCruda = z.infer<typeof esquemaPalabraCruda>;
/** Forma cruda de una oración base. */
export type OracionCruda = z.infer<typeof esquemaOracionCruda>;
/** Forma cruda del corpus semilla completo. */
export type CorpusCrudo = z.infer<typeof esquemaCorpus>;
