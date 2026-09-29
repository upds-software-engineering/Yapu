/**
 * Adaptadores de sistema: implementaciones de borde de los puertos técnicos
 * (reloj, aleatoriedad, identificadores, conectividad, sesión simulada y descarga de archivos).
 */
export { RelojSistema } from './RelojSistema';
export { AleatorioMulberry32 } from './AleatorioMulberry32';
export { GeneradorIdCrypto } from './GeneradorIdCrypto';
export { ConectividadNavegador } from './ConectividadNavegador';
export { SesionLocalAdapter, CLAVE_SESION } from './SesionLocalAdapter';
export { DescargaCsvAdapter } from './DescargaCsvAdapter';
