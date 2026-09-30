import { useCallback, useMemo, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import type {
  ExportacionCorpusDto,
  ListaRetosDto,
  OracionDto,
  RetoDto
} from '@application/dto/contenido';
import type { MapaNivelesDto, PalabraDto } from '@application/dto/aprendizaje';
import { EstadoCarga, MensajeError, Tabs, type Pestana } from '@ui/design-system';
import { useCasoDeUso, useServicios, useSesionAutenticada } from '@ui/hooks';
import { mensajeDeError } from '@ui/lib/mensajes';

import { ExportacionCorpus } from './ExportacionCorpus';
import { FormularioOracion, type EntradaOracionFormulario, type OpcionNivel } from './FormularioOracion';
import { GuardiaDocente } from './GuardiaDocente';
import { ListaOraciones } from './ListaOraciones';
import { ModeracionRetos } from './ModeracionRetos';

/** Contrato de selectores: pestañas del panel docente. */
const ID_PESTANA_ORACIONES = 'oraciones';
const ID_PESTANA_MODERACION = 'moderacion';
const ID_PESTANA_DATOS = 'datos';

/** RF-006: confirmación explícita de que la oración queda aprobada y alimenta al generador. */
const AVISO_ORACION_GUARDADA =
  'Oración guardada y aprobada: ya alimenta al generador de preguntas del nivel.';

/**
 * Lee `codigo` y `message` del fallo sin asumir su forma: la UI tiene prohibido importar `@domain`,
 * así que el error de dominio se inspecciona como un objeto cualquiera (mismo criterio que
 * `Evaluacion`, que ya lee `codigo` de esta manera).
 */
function leerMensajeDeValidacion(fallo: unknown): string | null {
  if (typeof fallo !== 'object' || fallo === null) return null;
  const { codigo, message } = fallo as { codigo?: unknown; message?: unknown };
  if (codigo !== 'VALIDACION' || typeof message !== 'string') return null;
  const mensaje = message.trim();
  return mensaje.length > 0 ? mensaje : null;
}

/**
 * RN-11 / RN-12: `RegistrarOracionBaseUseCase` deja escapar el `ValidacionError` del dominio, cuyo
 * mensaje ya está redactado para el docente (nombra la palabra clave y la regla incumplida). Sin
 * embargo, `mensajeDeError` colapsa el código `VALIDACION` en un aviso genérico («Revisa los
 * datos…») que no dice QUÉ corregir. En el formulario del corpus ese detalle es justamente la
 * ayuda que el docente necesita, así que se prefiere el mensaje del caso de uso; cualquier otro
 * fallo (permisos, contenido ausente, red) se traduce como siempre.
 */
function mensajeDeErrorDeFormulario(fallo: unknown): string {
  return leerMensajeDeValidacion(fallo) ?? mensajeDeError(fallo);
}

/**
 * Aplana los tramos del mapa en una lista plana de niveles, ordenada de menor a mayor, con el
 * nombre del tramo pedagógico como contexto para quien elige.
 */
function aplanarNiveles(mapa: MapaNivelesDto | null): Array<OpcionNivel & { tramo: string }> {
  if (mapa === null) return [];
  return mapa.tramos
    .flatMap((tramo) => tramo.niveles.map((nivel) => ({ ...nivel, tramo: tramo.nombre })))
    .sort((a, b) => a.id - b.id)
    .map((nivel) => ({
      id: nivel.id,
      tituloEspanol: nivel.tituloEspanol,
      tituloQuechua: nivel.tituloQuechua,
      tramo: nivel.tramo
    }));
}

/**
 * RF-001 / RF-006 / RF-007 / RS-004 — panel de gestión docente.
 *
 * Puerta de entrada (RF-001, ADR-003 rev. 2): la sesión se resuelve con `ValidarSesionUseCase`,
 * que verifica la firma y la caducidad del token de acceso (y lo renueva con el de refresco si
 * hace falta). Sin token válido con rol docente la pantalla se reduce a `GuardiaDocente`; el panel
 * no se monta, así que ningún caso de uso de contenido llega a ejecutarse sin autorización.
 *
 * Con rol docente: tres pestañas (Hick: una sección visible a la vez) sobre el componente `Tabs`
 * del design system, que ya implementa el patrón WAI-ARIA con `role="tablist"`, `role="tab"` y
 * `role="tabpanel"` y navegación por flechas.
 *
 * Los datos que las pestañas necesitan se cargan aquí y se pasan como props: así las cabeceras
 * muestran el número de oraciones y de retos pendientes, y tras guardar o moderar basta con
 * refrescar el caso de uso correspondiente.
 */
export function PanelDocente() {
  const servicios = useServicios();
  const { cambiarRol, obtenerSesion } = servicios;
  const sesionLocal = useCasoDeUso(() => obtenerSesion.ejecutar(), { ejecutarAlMontar: [] });

  const [errorModeracion, setErrorModeracion] = useState<string | null>(null);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [avisoGuardado, setAvisoGuardado] = useState<string | null>(null);

  const autenticacion = useSesionAutenticada();

  const obtenerMapa = useCallback(
    (): Promise<MapaNivelesDto> => servicios.mapaNiveles.ejecutar(),
    [servicios]
  );
  const mapa = useCasoDeUso(obtenerMapa, { ejecutarAlMontar: [] });

  const obtenerOraciones = useCallback(
    (): Promise<OracionDto[]> => servicios.listarOraciones.ejecutar(),
    [servicios]
  );
  const oraciones = useCasoDeUso(obtenerOraciones, { ejecutarAlMontar: [] });
  const recargarOraciones = oraciones.ejecutar;

  const obtenerRetos = useCallback(
    (): Promise<ListaRetosDto> => servicios.listarRetos.ejecutar(),
    [servicios]
  );
  const retos = useCasoDeUso(obtenerRetos, { ejecutarAlMontar: [] });
  const recargarRetos = retos.ejecutar;

  const niveles = useMemo(() => aplanarNiveles(mapa.datos), [mapa.datos]);

  /**
   * RF-006 / RN-12: catálogo de palabras del nivel elegido, leído del caso de uso de la aplicación
   * (`LeccionDto.palabras`), nunca de la infraestructura.
   */
  const cargarPalabras = useCallback(
    async (nivelId: number): Promise<PalabraDto[] | null> => {
      try {
        const leccion = await servicios.leccion.ejecutar({ nivel: nivelId });
        return leccion.palabras;
      } catch {
        return null;
      }
    },
    [servicios]
  );

  /**
   * RF-006 / RN-11 / RN-12: registra la oración y refresca el listado. Los errores de validación
   * del caso de uso se muestran con su propio mensaje en español, tal como los redacta el dominio
   * (`mensajeDeErrorDeFormulario`); el resto de fallos se traducen con `mensajeDeError`.
   */
  const registrarOracion = useCallback(
    async (entrada: EntradaOracionFormulario): Promise<boolean> => {
      setErrorFormulario(null);
      setAvisoGuardado(null);
      try {
        await servicios.registrarOracion.ejecutar({
          nivelId: entrada.nivelId,
          textoQuechua: entrada.textoQuechua,
          traduccionEspanol: entrada.traduccionEspanol,
          palabraClaveId: entrada.palabraClaveId,
          contextoCultural: entrada.contextoCultural
        });
      } catch (fallo) {
        setErrorFormulario(mensajeDeErrorDeFormulario(fallo));
        return false;
      }
      setAvisoGuardado(AVISO_ORACION_GUARDADA);
      void recargarOraciones();
      return true;
    },
    [recargarOraciones, servicios]
  );

  /** RF-007 / RN-13: modera un reto. Los conflictos de estado no desmontan la pantalla. */
  const moderarReto = useCallback(
    async (retoId: string, decision: 'aprobado' | 'rechazado'): Promise<RetoDto | null> => {
      setErrorModeracion(null);
      try {
        const actualizado = await servicios.moderarReto.ejecutar({ retoId, decision });
        void recargarRetos();
        return actualizado;
      } catch (fallo) {
        setErrorModeracion(mensajeDeError(fallo));
        return null;
      }
    },
    [recargarRetos, servicios]
  );

  /** RS-004: exporta el corpus completo a CSV. */
  const exportarCorpus = useCallback(
    (): Promise<ExportacionCorpusDto> => servicios.exportarCorpus.ejecutar(),
    [servicios]
  );

  const sesionActual =
    autenticacion.sesion ??
    (sesionLocal.datos
      ? {
          usuarioId: sesionLocal.datos.usuarioId,
          nombre: sesionLocal.datos.nombre,
          rol: sesionLocal.datos.rol,
          esDocente: sesionLocal.datos.esDocente,
          expiraAccesoEn: 0,
          expiraRefrescoEn: 0,
          refrescado: false
        }
      : null);

  if (autenticacion.comprobando && sesionLocal.cargando) {
    return (
      <section data-pantalla="docente" className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <EstadoCarga mensaje="Verificando tu sesión…" />
      </section>
    );
  }

  // RF-001: sin rol docente NO se renderiza el panel, sólo la guardia.
  if (sesionActual === null || !sesionActual.esDocente) {
    return (
      <GuardiaDocente
        nombreSesion={sesionActual?.nombre ?? null}
        alCambiarRolDocente={async () => {
          await cambiarRol.ejecutar({ rol: 'docente' });
          void sesionLocal.ejecutar();
        }}
      />
    );
  }

  const listaOraciones = oraciones.datos ?? [];
  const listaRetos = retos.datos?.retos ?? [];
  const pendientes = listaRetos.filter((reto) => reto.estado === 'pendiente').length;
  const titulosPorNivel: Record<number, string> = {};
  for (const nivel of niveles) {
    titulosPorNivel[nivel.id] = nivel.tituloEspanol || nivel.tituloQuechua;
  }

  /** Hick: cada pestaña declara su propia acción primaria; nunca hay dos a la vez. */
  const pestanas: Pestana[] = [
    {
      id: ID_PESTANA_ORACIONES,
      etiqueta: `Oraciones base (${listaOraciones.length})`,
      contenido: (
        <div className="flex flex-col gap-6">
          <FormularioOracion
            niveles={niveles}
            alCargarPalabras={cargarPalabras}
            alGuardar={registrarOracion}
            avisoExito={avisoGuardado}
            error={errorFormulario}
            alLimpiarError={() => setErrorFormulario(null)}
          />
          {oraciones.cargando && <EstadoCarga mensaje="Cargando las oraciones base…" />}
          {oraciones.error !== null && (
            <MensajeError
              mensaje={oraciones.error}
              onReintentar={() => void recargarOraciones()}
              textoReintentar="Volver a cargar el corpus"
            />
          )}
          {!oraciones.cargando && oraciones.error === null && (
            <ListaOraciones oraciones={listaOraciones} titulosPorNivel={titulosPorNivel} />
          )}
        </div>
      )
    },
    {
      id: ID_PESTANA_MODERACION,
      etiqueta: `Moderación de retos (${pendientes} pendientes)`,
      contenido: (
        <div className="flex flex-col gap-4">
          {retos.cargando && <EstadoCarga mensaje="Cargando los retos de la comunidad…" />}
          {retos.error !== null && (
            <MensajeError
              mensaje={retos.error}
              onReintentar={() => void recargarRetos()}
              textoReintentar="Volver a cargar los retos"
            />
          )}
          {!retos.cargando && retos.error === null && (
            <ModeracionRetos retos={listaRetos} alModerar={moderarReto} error={errorModeracion} />
          )}
        </div>
      )
    },
    {
      id: ID_PESTANA_DATOS,
      etiqueta: 'Datos abiertos (RS-004)',
      contenido: (
        <ExportacionCorpus alExportar={exportarCorpus} oracionesDisponibles={listaOraciones.length} />
      )
    }
  ];

  return (
    <section
      data-pantalla="docente"
      data-panel="docente"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"
    >
      <header className="flex flex-col gap-2 border-b border-linea pb-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario/15 text-acento"
          >
            <GraduationCap className="h-5 w-5" />
          </span>
          <h1 className="text-display font-display font-bold text-tinta">Panel docente</h1>
        </div>
        <p className="text-body text-tinta-tenue">
          Registra oraciones base para el generador y modera los retos de la comunidad. Sesión:{' '}
          <strong className="text-tinta">{sesionActual.nombre}</strong> ({sesionActual.rol}).
        </p>
      </header>

      {mapa.error !== null && (
        <MensajeError
          mensaje={mapa.error}
          onReintentar={() => void mapa.ejecutar()}
          textoReintentar="Volver a cargar los niveles"
        />
      )}
      {niveles.length === 0 && mapa.cargando && <EstadoCarga mensaje="Cargando los niveles…" />}

      <Tabs pestanas={pestanas} idInicial={ID_PESTANA_ORACIONES} />
    </section>
  );
}

export default PanelDocente;
