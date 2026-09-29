/**
 * RF-009: estado de conectividad. Abstrae `navigator.onLine` y el evento `online`
 * para que los casos de uso se puedan probar sin navegador.
 */
export interface ConectividadPort {
  estaEnLinea(): boolean;
  /** Suscribe una reacción al retorno de la conexión. Devuelve la función para desuscribirse. */
  alRecuperarConexion(manejador: () => void): () => void;
}
