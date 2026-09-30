import { useMemo } from 'react';
import { CambiarRolUseCase } from '@application/use-cases/CambiarRolUseCase';
import { CerrarSesionUseCase } from '@application/use-cases/CerrarSesionUseCase';
import { IniciarSesionUseCase } from '@application/use-cases/IniciarSesionUseCase';
import { ValidarSesionUseCase } from '@application/use-cases/ValidarSesionUseCase';
import { CalificarEvaluacionUseCase } from '@application/use-cases/CalificarEvaluacionUseCase';
import { ExportarCorpusCsvUseCase } from '@application/use-cases/ExportarCorpusCsvUseCase';
import { GenerarEvaluacionUseCase } from '@application/use-cases/GenerarEvaluacionUseCase';
import { ListarOracionesUseCase } from '@application/use-cases/ListarOracionesUseCase';
import { ListarRetosUseCase } from '@application/use-cases/ListarRetosUseCase';
import { MarcarPalabraUseCase } from '@application/use-cases/MarcarPalabraUseCase';
import { ModerarRetoUseCase } from '@application/use-cases/ModerarRetoUseCase';
import { ObtenerLeccionUseCase } from '@application/use-cases/ObtenerLeccionUseCase';
import { ObtenerMapaNivelesUseCase } from '@application/use-cases/ObtenerMapaNivelesUseCase';
import { ObtenerSesionUseCase } from '@application/use-cases/ObtenerSesionUseCase';
import { ObtenerTableroUseCase } from '@application/use-cases/ObtenerTableroUseCase';
import { ProponerRetoUseCase } from '@application/use-cases/ProponerRetoUseCase';
import { RegistrarOracionBaseUseCase } from '@application/use-cases/RegistrarOracionBaseUseCase';
import { SincronizarPendientesUseCase } from '@application/use-cases/SincronizarPendientesUseCase';
import type { AdaptadoresContenedor } from '@infrastructure/container';
import { useContenedor } from './useContenedor';

/**
 * Servicios de la aplicación ya cableados con sus adaptadores.
 *
 * Es el único punto por el que los componentes obtienen casos de uso: los componentes NO
 * construyen adaptadores ni conocen la infraestructura. La UI sólo ve casos de uso y DTOs.
 */
export interface Servicios {
  mapaNiveles: ObtenerMapaNivelesUseCase;
  leccion: ObtenerLeccionUseCase;
  marcarPalabra: MarcarPalabraUseCase;
  tablero: ObtenerTableroUseCase;
  generarEvaluacion: GenerarEvaluacionUseCase;
  calificarEvaluacion: CalificarEvaluacionUseCase;
  sincronizarPendientes: SincronizarPendientesUseCase;
  registrarOracion: RegistrarOracionBaseUseCase;
  listarOraciones: ListarOracionesUseCase;
  exportarCorpus: ExportarCorpusCsvUseCase;
  proponerReto: ProponerRetoUseCase;
  moderarReto: ModerarRetoUseCase;
  listarRetos: ListarRetosUseCase;
  obtenerSesion: ObtenerSesionUseCase;
  cambiarRol: CambiarRolUseCase;
  /** RF-001: autenticación con token de acceso y token de refresco. */
  iniciarSesion: IniciarSesionUseCase;
  validarSesion: ValidarSesionUseCase;
  cerrarSesion: CerrarSesionUseCase;
}

export function crearServicios(contenedor: AdaptadoresContenedor): Servicios {
  return {
    mapaNiveles: new ObtenerMapaNivelesUseCase(contenedor.catalogo, contenedor.progreso, contenedor.sesion),
    leccion: new ObtenerLeccionUseCase(contenedor.catalogo, contenedor.progreso, contenedor.sesion),
    marcarPalabra: new MarcarPalabraUseCase(
      contenedor.catalogo,
      contenedor.progreso,
      contenedor.sesion,
      contenedor.reloj
    ),
    tablero: new ObtenerTableroUseCase(
      contenedor.catalogo,
      contenedor.progreso,
      contenedor.evaluaciones,
      contenedor.sesion
    ),
    generarEvaluacion: new GenerarEvaluacionUseCase(
      contenedor.catalogo,
      contenedor.oraciones,
      contenedor.progreso,
      contenedor.sesion,
      contenedor.aleatorio,
      contenedor.generadorId,
      contenedor.borrador,
      contenedor.reloj
    ),
    calificarEvaluacion: new CalificarEvaluacionUseCase(
      contenedor.catalogo,
      contenedor.progreso,
      contenedor.evaluaciones,
      contenedor.sesion,
      contenedor.reloj,
      contenedor.generadorId,
      contenedor.borrador
    ),
    sincronizarPendientes: new SincronizarPendientesUseCase(
      contenedor.evaluaciones,
      contenedor.sincronizacion,
      contenedor.conectividad
    ),
    registrarOracion: new RegistrarOracionBaseUseCase(
      contenedor.oraciones,
      contenedor.catalogo,
      contenedor.sesion,
      contenedor.reloj,
      contenedor.generadorId
    ),
    listarOraciones: new ListarOracionesUseCase(contenedor.catalogo, contenedor.oraciones, contenedor.sesion),
    exportarCorpus: new ExportarCorpusCsvUseCase(contenedor.catalogo, contenedor.oraciones, contenedor.exportador),
    proponerReto: new ProponerRetoUseCase(
      contenedor.retos,
      contenedor.progreso,
      contenedor.sesion,
      contenedor.reloj,
      contenedor.generadorId
    ),
    moderarReto: new ModerarRetoUseCase(contenedor.retos, contenedor.sesion, contenedor.reloj),
    listarRetos: new ListarRetosUseCase(contenedor.retos, contenedor.progreso, contenedor.sesion),
    obtenerSesion: new ObtenerSesionUseCase(contenedor.sesion),
    cambiarRol: new CambiarRolUseCase(contenedor.sesion),
    iniciarSesion: new IniciarSesionUseCase(contenedor.autenticacion, contenedor.tokens, contenedor.sesion),
    validarSesion: new ValidarSesionUseCase(
      contenedor.autenticacion,
      contenedor.tokens,
      contenedor.sesion,
      contenedor.reloj,
      contenedor.generadorId
    ),
    cerrarSesion: new CerrarSesionUseCase(
      contenedor.autenticacion,
      contenedor.tokens,
      contenedor.sesion,
      contenedor.generadorId
    )
  };
}

/** Hook de acceso a los casos de uso. `contenedor` se memoriza en `useContenedor`. */
export function useServicios(): Servicios {
  const contenedor = useContenedor();
  return useMemo(() => crearServicios(contenedor), [contenedor]);
}
