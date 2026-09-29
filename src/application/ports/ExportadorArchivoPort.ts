/**
 * RS-004: entrega de archivos al usuario (descarga del corpus CSV).
 * Se abstrae para que el caso de uso de exportación sea testeable sin DOM ni Blob.
 */
export interface ExportadorArchivoPort {
  descargar(nombreArchivo: string, contenido: string, tipoMime: string): void;
}
