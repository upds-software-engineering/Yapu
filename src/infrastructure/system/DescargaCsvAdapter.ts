import type { ExportadorArchivoPort } from '@application/ports';

/**
 * Adaptador de producción de `ExportadorArchivoPort` (RS-004: exportar el corpus CSV).
 *
 * El contenido llega ya serializado y con el BOM incluido (responsabilidad del serializador de
 * aplicación), aquí sólo se entrega al navegador. En SSR es un no-op silencioso: no hay usuario
 * al que descargar nada y exportar no debe romper el render del servidor.
 */
export class DescargaCsvAdapter implements ExportadorArchivoPort {
  descargar(nombreArchivo: string, contenido: string, tipoMime: string): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;

    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.rel = 'noopener';
    enlace.style.display = 'none';

    document.body.appendChild(enlace);
    try {
      enlace.click();
    } finally {
      URL.revokeObjectURL(url);
      enlace.remove();
    }
  }
}
