import { useState } from 'react';
import type { ExportacionCorpusDto } from '@application/dto/contenido';
import { Boton, MensajeError, Tarjeta } from '@ui/design-system';

export interface PropsExportacionCorpus {
  /** RS-004: ejecuta `ExportarCorpusCsvUseCase` y devuelve el resumen de la descarga. */
  alExportar: () => Promise<ExportacionCorpusDto | null>;
  /** Nº de oraciones que hoy entrarían en el archivo (lo informa el listado del corpus). */
  oracionesDisponibles: number;
}

/**
 * RS-004 / RN-14 — exportación del corpus lingüístico a CSV abierto.
 *
 * Explica en español qué se descarga y con qué garantías (RFC 4180, neutralización de fórmulas y
 * BOM UTF-8 para Excel) y, tras exportar, informa del nombre del archivo y del número de filas.
 * La descarga la ejecuta el caso de uso a través del puerto de exportación: la interfaz no toca
 * `Blob` ni `URL.createObjectURL`.
 */
export function ExportacionCorpus({ alExportar, oracionesDisponibles }: PropsExportacionCorpus) {
  const [exportacion, setExportacion] = useState<ExportacionCorpusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  async function exportar(): Promise<void> {
    setExportando(true);
    setError(null);
    try {
      const resultado = await alExportar();
      if (resultado === null) {
        setError('No pudimos preparar el archivo CSV. Vuelve a intentarlo en un momento.');
        return;
      }
      setExportacion(resultado);
    } finally {
      setExportando(false);
    }
  }

  return (
    <Tarjeta className="flex flex-col gap-4">
      <h2 className="text-title font-display font-bold text-sand">
        Datos abiertos: corpus quechua en CSV (RS-004)
      </h2>

      <p className="text-body text-slate-300">
        El requisito de sostenibilidad RS-004 pide que el corpus lingüístico sea un dato abierto y
        transparente. Este botón descarga todas las oraciones base con su nivel, su palabra clave,
        su categoría gramatical y su contexto cultural, sin ningún dato personal del estudiantado.
      </p>

      <ul className="flex flex-col gap-1 text-body text-slate-400">
        <li>· Sigue el estándar RFC 4180 (comas y comillas escapadas, fin de línea CRLF).</li>
        <li>
          · Neutraliza las fórmulas de hoja de cálculo (RN-14): ningún texto puede empezar con
          caracteres que Excel interprete como fórmula.
        </li>
        <li>· Incluye BOM UTF-8 para que Excel abra el quechua con sus tildes y apóstrofos.</li>
      </ul>

      <p className="text-body text-slate-300">
        Oraciones listas para exportar ahora mismo: {oracionesDisponibles}.
      </p>

      {error !== null && <MensajeError mensaje={error} />}

      {exportacion !== null && (
        <div role="status" aria-live="polite" className="flex flex-col gap-1">
          <p className="text-body font-semibold text-emerald-300">
            Archivo preparado: {exportacion.nombreArchivo}
          </p>
          <p className="text-body text-slate-300">
            Se exportaron {exportacion.filas} filas (más la cabecera de columnas).
          </p>
        </div>
      )}

      {/* Hick: el CTA primario de la pestaña es la exportación, la única acción de la pestaña. */}
      <div>
        <Boton
          variante="primario"
          esCtaPrimario
          data-accion="exportar-csv"
          cargando={exportando}
          disabled={exportando}
          onClick={() => void exportar()}
        >
          Exportar corpus CSV
        </Boton>
      </div>
    </Tarjeta>
  );
}

export default ExportacionCorpus;
