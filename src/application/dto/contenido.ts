import type { CategoriaGramatical, EstadoModeracion, RolUsuario } from '@domain/shared/tipos';

/** RF-006: oración base vista por el docente. */
export interface OracionDto {
  id: string;
  nivelId: number;
  textoQuechua: string;
  traduccionEspanol: string;
  palabraClaveId: string;
  palabraClaveTermino: string;
  categoria: CategoriaGramatical;
  contextoCultural: string;
  autorId: string;
  estado: EstadoModeracion;
  fechaCreacion: string;
}

export interface ModeracionDto {
  docenteId: string;
  decision: 'aprobado' | 'rechazado';
  fecha: string;
}

/** RF-007 / RN-13: reto comunitario con su bitácora de doble moderación. */
export interface RetoDto {
  id: string;
  autorId: string;
  nombreAutor: string;
  textoQuechua: string;
  traduccionSugerida: string;
  pistaCultural: string;
  nivelSugerido: number;
  estado: EstadoModeracion;
  fechaCreacion: string;
  moderaciones: ModeracionDto[];
  aprobaciones: number;
  /** RN-13: 2 aprobaciones de docentes distintos publican el reto. */
  aprobacionesRequeridas: number;
  /** El docente que consulta ya votó / es el autor: la UI deshabilita los botones. */
  votadoPorMi: boolean;
  esMiAutoría: boolean;
}

export interface SesionDto {
  usuarioId: string;
  rol: RolUsuario;
  nombre: string;
  esDocente: boolean;
}

/**
 * RF-001 — sesión AUTENTICADA: la identidad sale de un token de acceso cuya firma y caducidad ya
 * se verificaron. Los tiempos van en milisegundos desde epoch para que la UI calcule la cuenta atrás.
 */
export interface SesionAutenticadaDto extends SesionDto {
  expiraAccesoEn: number;
  expiraRefrescoEn: number;
  /** `true` cuando esta validación tuvo que renovar el token de acceso con el de refresco. */
  refrescado: boolean;
}

export interface PermisoRetoDto {
  puedeProponer: boolean;
  nivelActual: number;
  nivelRequerido: number;
  motivo: string;
}

/** RF-007: estudiantes reciben sólo retos aprobados; docentes reciben también los pendientes. */
export interface ListaRetosDto {
  retos: RetoDto[];
  permiso: PermisoRetoDto;
}

export interface ExportacionCorpusDto {
  nombreArchivo: string;
  filas: number;
  tipoMime: string;
}
