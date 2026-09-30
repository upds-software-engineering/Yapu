/**
 * Errores de dominio tipados.
 *
 * La UI nunca recibe mensajes técnicos: cada error expone `codigo` para que la capa de
 * presentación lo traduzca a un mensaje amigable en español.
 */

export type CodigoError =
  | 'NIVEL_BLOQUEADO'
  | 'CONTENIDO_INSUFICIENTE'
  | 'PERMISO_DENEGADO'
  | 'VALIDACION'
  | 'NO_ENCONTRADO'
  | 'CONFLICTO_ESTADO'
  | 'NO_AUTENTICADO';

export class ErrorDominio extends Error {
  readonly codigo: CodigoError;

  constructor(mensaje: string, codigo: CodigoError) {
    super(mensaje);
    this.codigo = codigo;
    this.name = new.target.name;
  }
}

/** RN-01: un estudiante no puede rendir la evaluación ni la lección de un nivel superior al actual. */
export class NivelBloqueadoError extends ErrorDominio {
  readonly nivelSolicitado: number;
  readonly nivelActual: number;

  constructor(nivelSolicitado: number, nivelActual: number) {
    super(
      `El nivel ${nivelSolicitado} está bloqueado: primero aprueba el nivel ${nivelActual}.`,
      'NIVEL_BLOQUEADO'
    );
    this.nivelSolicitado = nivelSolicitado;
    this.nivelActual = nivelActual;
  }
}

/** RN-10: el nivel no reúne las 5 preguntas válidas mínimas. */
export class ContenidoInsuficienteError extends ErrorDominio {
  readonly nivelId: number;
  readonly preguntasDisponibles: number;

  constructor(nivelId: number, preguntasDisponibles: number, minimo: number) {
    super(
      `El nivel ${nivelId} solo permite generar ${preguntasDisponibles} preguntas válidas y se requieren al menos ${minimo}.`,
      'CONTENIDO_INSUFICIENTE'
    );
    this.nivelId = nivelId;
    this.preguntasDisponibles = preguntasDisponibles;
  }
}

/** RN-12 / RN-13: el rol o el autor no habilitan la operación. */
export class PermisoDenegadoError extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'PERMISO_DENEGADO');
  }
}

/** Reglas de validación de entidades y objetos de valor (RN-09, RN-11, RN-12, RN-14). */
export class ValidacionError extends ErrorDominio {
  readonly campo?: string;

  constructor(mensaje: string, campo?: string) {
    super(mensaje, 'VALIDACION');
    this.campo = campo;
  }
}

/** Un agregado o catálogo no contiene lo solicitado. */
export class NoEncontradoError extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'NO_ENCONTRADO');
  }
}

/** RN-13: el reto ya fue moderado, o el docente ya emitió su voto. */
export class ConflictoEstadoError extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'CONFLICTO_ESTADO');
  }
}

/**
 * RF-001 — motivo concreto por el que una credencial o un token no autentica.
 *
 * - `CREDENCIALES_INVALIDAS`: usuario o contraseña incorrectos.
 * - `TOKEN_INVALIDO`: formato roto, firma manipulada o tipo equivocado (acceso ↔ refresco).
 * - `TOKEN_EXPIRADO`: la firma es válida pero `exp` ya pasó (el de acceso se renueva con el de refresco).
 * - `TOKEN_REUTILIZADO`: un token de refresco YA usado vuelve a presentarse (posible robo): se revoca
 *   toda su familia.
 * - `SESION_REVOCADA`: la familia del token se cerró (cierre de sesión o reutilización detectada).
 */
export type MotivoAutenticacion =
  | 'CREDENCIALES_INVALIDAS'
  | 'TOKEN_INVALIDO'
  | 'TOKEN_EXPIRADO'
  | 'TOKEN_REUTILIZADO'
  | 'SESION_REVOCADA';

/** RF-001: fallo de autenticación con su motivo tipado. */
export class AutenticacionError extends ErrorDominio {
  readonly motivo: MotivoAutenticacion;

  constructor(mensaje: string, motivo: MotivoAutenticacion) {
    super(mensaje, 'NO_AUTENTICADO');
    this.motivo = motivo;
  }
}

/** Traduce cualquier error a un mensaje en español apto para la interfaz. */
export function mensajeAmigable(error: unknown): string {
  if (error instanceof ErrorDominio) return error.message;
  if (error instanceof Error) return 'Ocurrió un problema inesperado. Vuelve a intentarlo.';
  return 'Ocurrió un problema inesperado.';
}
