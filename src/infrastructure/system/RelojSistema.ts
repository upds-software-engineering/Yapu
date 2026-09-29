import type { RelojPort } from '@application/ports';

/**
 * Adaptador de producción de `RelojPort`.
 *
 * Es el único punto del sistema autorizado a leer el reloj real: el dominio recibe siempre
 * la fecha por parámetro (`FechaDia`) y los casos de uso dependen de la interfaz, de modo que
 * las pruebas sigan siendo deterministas con `RelojFijo` (RN-17).
 */
export class RelojSistema implements RelojPort {
  ahora(): Date {
    return new Date();
  }
}
