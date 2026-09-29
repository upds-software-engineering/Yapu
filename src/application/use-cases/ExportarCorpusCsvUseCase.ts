import type { ExportacionCorpusDto } from '@application/dto';
import type {
  CatalogoRepository,
  ExportadorArchivoPort,
  OracionRepository
} from '@application/ports';
import { serializarCsv, type ColumnaCsv } from '@domain/contenido/serializadorCsv';
import { ETIQUETAS_CATEGORIA } from '@domain/shared/tipos';

/** RS-004: nombre del archivo que recibe el usuario. */
const NOMBRE_ARCHIVO = 'yapu_corpus_quechua.csv';
/** RS-004: sin `charset=utf-8` la hoja de cálculo volvería a abrir el archivo como Latin-1. */
const TIPO_MIME = 'text/csv;charset=utf-8';

/**
 * RS-004 / RN-14: exporta el corpus completo de oraciones base a CSV.
 *
 * El caso de uso no conoce el navegador: serializa con el serializador puro del dominio (que ya
 * antepone el BOM UTF-8, usa CRLF y neutraliza la inyección de fórmulas) y entrega el texto al
 * puerto `ExportadorArchivoPort`, cuya implementación vive en infraestructura.
 *
 * `palabraClave` y `categoria` se escriben en su forma legible (término en runasimi y etiqueta en
 * español) porque el archivo está pensado para abrirse en una hoja de cálculo.
 */
export class ExportarCorpusCsvUseCase {
  constructor(
    private readonly catalogo: CatalogoRepository,
    private readonly oraciones: OracionRepository,
    private readonly exportador: ExportadorArchivoPort
  ) {}

  async ejecutar(): Promise<ExportacionCorpusDto> {
    const [oraciones, palabras] = await Promise.all([
      this.oraciones.listar(),
      this.catalogo.listarPalabras()
    ]);

    const terminos = new Map(palabras.map((palabra) => [palabra.id, palabra.terminoTexto]));

    const filas = oraciones.map(
      (oracion): Record<string, unknown> => ({
        id: oracion.id,
        nivel: oracion.nivelId.valor,
        textoQuechua: oracion.textoQuechua,
        traduccionEspanol: oracion.traduccionEspanol,
        palabraClave: terminos.get(oracion.palabraClaveId) ?? '',
        categoria: ETIQUETAS_CATEGORIA[oracion.categoria],
        contextoCultural: oracion.contextoCultural,
        autorId: oracion.autorId,
        estado: oracion.estado,
        fechaCreacion: oracion.fechaCreacion.toJSON()
      })
    );

    const contenido = serializarCsv(filas, COLUMNAS_CORPUS);
    this.exportador.descargar(NOMBRE_ARCHIVO, contenido, TIPO_MIME);

    return {
      nombreArchivo: NOMBRE_ARCHIVO,
      filas: filas.length,
      tipoMime: TIPO_MIME
    };
  }
}

/** Orden de columnas del corpus exportado (RS-004). */
const COLUMNAS_CORPUS: readonly ColumnaCsv[] = [
  { clave: 'id', titulo: 'id' },
  { clave: 'nivel', titulo: 'nivel' },
  { clave: 'textoQuechua', titulo: 'textoQuechua' },
  { clave: 'traduccionEspanol', titulo: 'traduccionEspanol' },
  { clave: 'palabraClave', titulo: 'palabraClave' },
  { clave: 'categoria', titulo: 'categoria' },
  { clave: 'contextoCultural', titulo: 'contextoCultural' },
  { clave: 'autorId', titulo: 'autorId' },
  { clave: 'estado', titulo: 'estado' },
  { clave: 'fechaCreacion', titulo: 'fechaCreacion' }
];
