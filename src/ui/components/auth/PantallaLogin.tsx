import { useId, useState, type FormEvent } from 'react';
import { KeyRound, LogIn, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import type { SesionAutenticadaDto } from '@application/dto';
import { Boton, EstadoCarga, Insignia, MensajeError, Tarjeta } from '@ui/design-system';
import { anunciarCambioDeSesion, useServicios, useSesionAutenticada } from '@ui/hooks';
import { mensajeDeError } from '@ui/lib/mensajes';
import { ruta } from '@ui/lib/ruta';
import { useCuentaAtras, formatearDuracion } from './useCuentaAtras';

/**
 * Cuentas de DEMOSTRACIÓN del servidor simulado. Se repiten aquí (la UI no puede importar la
 * infraestructura) y una prueba de integración verifica que coinciden con `CUENTAS_DEMO`.
 */
export const CUENTAS_VISIBLES = [
  { usuario: 'docente', contrasena: 'yapu2026', descripcion: 'Docente (panel docente)' },
  { usuario: 'docente2', contrasena: 'yapu2026', descripcion: 'Segunda docente (RN-13)' },
  { usuario: 'estudiante', contrasena: 'yapu2026', descripcion: 'Estudiante' }
] as const;

const CLASES_CAMPO =
  'w-full min-h-tactil rounded-xl border border-linea-fuerte bg-fondo px-3 py-2 text-body text-tinta placeholder:text-tinta-tenue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte';

/**
 * Destino tras iniciar sesión (`?siguiente=/docente`). Sólo se aceptan rutas LÓGICAS internas:
 * nada de `//dominio` ni URLs absolutas, para que el parámetro no sirva de redirección abierta.
 */
function leerDestino(): string {
  if (typeof window === 'undefined') return '/';
  const siguiente = new URLSearchParams(window.location.search).get('siguiente') ?? '/';
  return /^\/(?!\/)[\w\-/]*$/.test(siguiente) ? siguiente : '/';
}

/** Mensaje del fallo: los de credenciales y validación ya vienen redactados para la persona. */
function mensajeDeLogin(fallo: unknown): string {
  if (typeof fallo === 'object' && fallo !== null) {
    const { codigo, message } = fallo as { codigo?: unknown; message?: unknown };
    if ((codigo === 'NO_AUTENTICADO' || codigo === 'VALIDACION') && typeof message === 'string') return message;
  }
  return mensajeDeError(fallo);
}

/**
 * RF-001 — pantalla de inicio de sesión con token de acceso y token de refresco.
 *
 * Sin sesión: formulario de usuario y contraseña, con las cuentas de demostración a un toque.
 * Con sesión: la identidad verificada del token y la vida de cada token en tiempo real, más las
 * acciones «Renovar token ahora» (rota el refresco) y «Cerrar sesión» (revoca la familia).
 */
export function PantallaLogin() {
  const { sesion, comprobando, error, renovar, cerrar } = useSesionAutenticada();

  return (
    <section
      data-pantalla="login"
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-display font-bold text-tinta">
          {sesion ? 'Tu sesión' : 'Iniciar sesión'}
        </h1>
        <p className="text-body text-tinta-tenue">
          Acceso con token JWT firmado (2 min) y token de refresco (7 días) que se renueva solo.
        </p>
      </header>

      {error !== null && <MensajeError mensaje={error} />}
      {comprobando ? (
        <EstadoCarga mensaje="Verificando tu sesión…" />
      ) : sesion ? (
        <PanelSesion sesion={sesion} alRenovar={renovar} alCerrar={cerrar} />
      ) : (
        <FormularioLogin />
      )}
    </section>
  );
}

function FormularioLogin() {
  const { iniciarSesion } = useServicios();
  const idUsuario = useId();
  const idContrasena = useId();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion.ejecutar({ usuario, contrasena });
      anunciarCambioDeSesion();
      window.location.assign(ruta(leerDestino()));
    } catch (fallo) {
      setError(mensajeDeLogin(fallo));
      setEnviando(false);
    }
  }

  return (
    <>
      <form
        data-formulario="login"
        noValidate
        onSubmit={(evento) => void enviar(evento)}
        className="flex flex-col gap-4 rounded-2xl border border-linea bg-superficie p-4 sm:p-6"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={idUsuario} className="text-body font-semibold text-tinta">
            Usuario
          </label>
          <input
            id={idUsuario}
            name="usuario"
            autoComplete="username"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            className={CLASES_CAMPO}
            placeholder="docente"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idContrasena} className="text-body font-semibold text-tinta">
            Contraseña
          </label>
          <input
            id={idContrasena}
            name="contrasena"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            className={CLASES_CAMPO}
          />
        </div>

        {error !== null && (
          <p role="alert" data-error-login className="text-body font-semibold text-peligro">
            {error}
          </p>
        )}

        <Boton type="submit" variante="primario" esCtaPrimario anchoCompleto cargando={enviando} data-accion="entrar">
          <LogIn aria-hidden="true" className="h-4 w-4" />
          Entrar
        </Boton>
      </form>

      <Tarjeta className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-title font-semibold text-tinta">
          <KeyRound aria-hidden="true" className="h-5 w-5 text-acento" />
          Cuentas de demostración
        </h2>
        <p className="text-caption text-tinta-tenue">
          Servidor de identidad simulado (ADR-003): contraseña <span className="font-semibold text-tinta">yapu2026</span>.
        </p>
        <ul className="flex flex-col gap-2">
          {CUENTAS_VISIBLES.map((cuenta) => (
            <li key={cuenta.usuario}>
              <button
                type="button"
                data-cuenta-demo={cuenta.usuario}
                onClick={() => {
                  setUsuario(cuenta.usuario);
                  setContrasena(cuenta.contrasena);
                  setError(null);
                }}
                className="flex min-h-tactil w-full items-center justify-between gap-2 rounded-xl border border-linea bg-superficie-alta px-3 py-2 text-left text-body text-tinta transition-colors hover:border-acento/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
              >
                <span className="font-semibold">{cuenta.usuario}</span>
                <span className="text-caption text-tinta-tenue">{cuenta.descripcion}</span>
              </button>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </>
  );
}

interface PropsPanelSesion {
  sesion: SesionAutenticadaDto;
  alRenovar: () => Promise<void>;
  alCerrar: () => Promise<void>;
}

function PanelSesion({ sesion, alRenovar, alCerrar }: PropsPanelSesion) {
  const restanteAcceso = useCuentaAtras(sesion.expiraAccesoEn);
  const [renovando, setRenovando] = useState(false);
  const [renovacionState, setRenovacionState] = useState({
    prevExpira: sesion.expiraAccesoEn,
    conteo: 0
  });

  if (sesion.expiraAccesoEn !== renovacionState.prevExpira) {
    setRenovacionState({
      prevExpira: sesion.expiraAccesoEn,
      conteo: renovacionState.conteo + 1
    });
  }

  const renovaciones = renovacionState.conteo;

  const vencimientoRefresco = new Date(sesion.expiraRefrescoEn).toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <Tarjeta className="flex flex-col gap-4" >
      <div data-sesion-autenticada={sesion.rol} className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-exito/40 bg-exito/10 text-exito">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-title font-semibold text-tinta">{sesion.nombre}</p>
          <p className="text-caption text-tinta-tenue">{`Usuario ${sesion.usuarioId}`}</p>
        </div>
        <Insignia tono={sesion.esDocente ? 'marca' : 'neutro'}>{sesion.rol}</Insignia>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-linea bg-fondo/60 p-3">
          <dt className="text-caption text-tinta-tenue">Token de acceso vence en</dt>
          <dd data-vence-acceso className="text-title font-bold text-acento" aria-live="off">
            {formatearDuracion(restanteAcceso)}
          </dd>
        </div>
        <div className="rounded-xl border border-linea bg-fondo/60 p-3">
          <dt className="text-caption text-tinta-tenue">Token de refresco vence</dt>
          <dd className="text-body font-semibold text-tinta">{vencimientoRefresco}</dd>
        </div>
      </dl>

      <p role="status" aria-live="polite" className="text-caption text-tinta-tenue">
        {renovaciones === 0
          ? 'Se renovará solo 15 s antes de vencer, rotando el token de refresco.'
          : `Token renovado ${renovaciones} ${renovaciones === 1 ? 'vez' : 'veces'} en esta visita.`}
      </p>

      <div className="flex flex-wrap gap-2">
        <Boton
          variante="secundario"
          cargando={renovando}
          data-accion="renovar-token"
          onClick={() => {
            setRenovando(true);
            void alRenovar().finally(() => setRenovando(false));
          }}
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Renovar token ahora
        </Boton>
        <Boton variante="terciario" data-accion="cerrar-sesion" onClick={() => void alCerrar()}>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Cerrar sesión
        </Boton>
      </div>

      <a
        href={ruta(sesion.esDocente ? '/docente' : '/')}
        className="inline-flex min-h-tactil items-center justify-center rounded-xl bg-primario px-4 py-2 text-body font-semibold text-white shadow-lg shadow-primario/25 transition-colors hover:bg-primario-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
        data-cta="primario"
      >
        {sesion.esDocente ? 'Ir al panel docente' : 'Ir a mis niveles'}
      </a>
    </Tarjeta>
  );
}

export default PantallaLogin;
