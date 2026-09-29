import type { GeneradorIdPort, SesionActual, SesionPort } from '@application/ports';
import type { RolUsuario } from '@domain/shared/tipos';

/** Clave de almacenamiento versionada: permite migrar el formato sin pisar datos antiguos. */
export const CLAVE_SESION = 'yapu:sesion:v1';

/** RF-001 simulado: sin autenticación real (ADR-003) todo usuario entra como estudiante. */
const ROL_POR_DEFECTO: RolUsuario = 'estudiante';
const NOMBRE_POR_DEFECTO = 'Estudiante YAPU';

/**
 * Adaptador de producción de `SesionPort` (RF-001 / RF-002, ADR-003).
 *
 * Persiste la sesión simulada en `localStorage`. Es tolerante a fallos: sin `localStorage`
 * (SSR o modo privado) mantiene la sesión en memoria, y ante un JSON corrupto vuelve a la
 * sesión por defecto en lugar de propagar la excepción a la UI.
 */
export class SesionLocalAdapter implements SesionPort {
  private readonly clave: string;
  private sesionEnMemoria: SesionActual | null = null;

  constructor(
    private readonly generadorId: GeneradorIdPort,
    clave: string = CLAVE_SESION
  ) {
    this.clave = clave;
  }

  async obtener(): Promise<SesionActual> {
    const persistida = this.leerDeAlmacenamiento();
    if (persistida !== null) {
      this.sesionEnMemoria = persistida;
      return clonar(persistida);
    }

    if (this.sesionEnMemoria !== null) return clonar(this.sesionEnMemoria);

    const porDefecto = this.crearSesionPorDefecto();
    this.recordar(porDefecto);
    return clonar(porDefecto);
  }

  async cambiarRol(rol: RolUsuario): Promise<SesionActual> {
    const actual = await this.obtener();
    const actualizada: SesionActual = { ...actual, rol };
    this.recordar(actualizada);
    return clonar(actualizada);
  }

  async establecerUsuario(usuarioId: string, nombre?: string): Promise<SesionActual> {
    const actual = await this.obtener();
    const actualizada: SesionActual = {
      usuarioId,
      rol: actual.rol,
      nombre: nombre ?? actual.nombre
    };
    this.recordar(actualizada);
    return clonar(actualizada);
  }

  private crearSesionPorDefecto(): SesionActual {
    return {
      usuarioId: this.generadorId.generar(),
      rol: ROL_POR_DEFECTO,
      nombre: NOMBRE_POR_DEFECTO
    };
  }

  /** Deja la sesión en memoria y, si el entorno lo permite, también en `localStorage`. */
  private recordar(sesion: SesionActual): void {
    this.sesionEnMemoria = clonar(sesion);
    const almacen = obtenerAlmacen();
    if (almacen === null) return;
    try {
      almacen.setItem(this.clave, JSON.stringify(sesion));
    } catch {
      // Cuota agotada o almacenamiento bloqueado: la sesión en memoria sigue siendo válida.
    }
  }

  private leerDeAlmacenamiento(): SesionActual | null {
    const almacen = obtenerAlmacen();
    if (almacen === null) return null;

    let crudo: string | null;
    try {
      crudo = almacen.getItem(this.clave);
    } catch {
      return null;
    }
    if (crudo === null) return null;

    try {
      return interpretarSesion(JSON.parse(crudo));
    } catch {
      // JSON corrupto: se descarta y `obtener()` regenerará la sesión por defecto.
      return null;
    }
  }
}

function obtenerAlmacen(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function clonar(sesion: SesionActual): SesionActual {
  return { usuarioId: sesion.usuarioId, rol: sesion.rol, nombre: sesion.nombre };
}

/** Valida el contenido persistido; `null` indica que el dato no es una sesión utilizable. */
function interpretarSesion(dato: unknown): SesionActual | null {
  if (typeof dato !== 'object' || dato === null) return null;

  const registro = dato as Record<string, unknown>;
  const usuarioId = registro['usuarioId'];
  const rol = registro['rol'];
  const nombre = registro['nombre'];

  if (typeof usuarioId !== 'string' || usuarioId.trim() === '') return null;
  if (!esRolUsuario(rol)) return null;

  return {
    usuarioId,
    rol,
    nombre: typeof nombre === 'string' && nombre.trim() !== '' ? nombre : NOMBRE_POR_DEFECTO
  };
}

function esRolUsuario(valor: unknown): valor is RolUsuario {
  return valor === 'estudiante' || valor === 'docente';
}
