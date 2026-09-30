import type { AlmacenTokensPort, ParTokens } from '@application/ports';
import { AlmacenMemoria, type Almacen } from '@infrastructure/persistence/local-storage';

/** Clave versionada del par de tokens del cliente. */
export const CLAVE_TOKENS = 'yapu:auth:tokens:v1';

/**
 * `AlmacenTokensPort` sobre `localStorage` (o memoria en SSR/pruebas).
 *
 * Lo leído se valida: un valor corrupto o incompleto se trata como «sin sesión» en vez de
 * propagar una excepción a la interfaz.
 */
export class AlmacenTokensLocal implements AlmacenTokensPort {
  private readonly almacen: Almacen;

  constructor(almacen?: Almacen | null) {
    this.almacen = almacen ?? new AlmacenMemoria();
  }

  async leer(): Promise<ParTokens | null> {
    try {
      const crudo = this.almacen.getItem(CLAVE_TOKENS);
      if (crudo === null) return null;
      const dato: unknown = JSON.parse(crudo);
      return esParTokens(dato) ? dato : null;
    } catch {
      return null;
    }
  }

  async guardar(par: ParTokens): Promise<void> {
    this.almacen.setItem(CLAVE_TOKENS, JSON.stringify(par));
  }

  async borrar(): Promise<void> {
    try {
      this.almacen.removeItem(CLAVE_TOKENS);
    } catch {
      // Almacenamiento bloqueado: no queda nada que borrar que la app pueda leer.
    }
  }
}

function esParTokens(dato: unknown): dato is ParTokens {
  if (typeof dato !== 'object' || dato === null) return false;
  const par = dato as Record<string, unknown>;
  return (
    typeof par['tokenAcceso'] === 'string' &&
    typeof par['tokenRefresco'] === 'string' &&
    typeof par['expiraAccesoEn'] === 'number' &&
    typeof par['expiraRefrescoEn'] === 'number'
  );
}
