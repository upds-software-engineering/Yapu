import { useCallback, useState, type FormEvent } from 'react';
import type { PalabraDto } from '@application/dto/aprendizaje';
import { Boton, EstadoCarga, MensajeError } from '@ui/design-system';
import { cn } from '@ui/lib/clases';

/** Datos que el formulario entrega al panel para ejecutar `RegistrarOracionBaseUseCase`. */
export interface EntradaOracionFormulario {
  nivelId: number;
  textoQuechua: string;
  traduccionEspanol: string;
  palabraClaveId: string;
  contextoCultural: string;
}

/** RF-003: un nivel del mapa, sólo lo que el formulario necesita para pintar el `select`. */
export interface OpcionNivel {
  id: number;
  tituloEspanol: string;
  tituloQuechua: string;
}

export interface PropsFormularioOracion {
  /** Los 10 niveles, leídos de `ObtenerMapaNivelesUseCase` (nunca de infraestructura). */
  niveles: readonly OpcionNivel[];
  /**
   * RF-006 / RN-12: catálogo de palabras del nivel elegido. Se resuelve con el caso de uso de la
   * aplicación; devuelve el DTO plano de palabras o `null` si la carga falló.
   */
  alCargarPalabras: (nivelId: number) => Promise<PalabraDto[] | null>;
  /** Ejecuta el alta. Devuelve `true` sólo si la oración quedó guardada. */
  alGuardar: (entrada: EntradaOracionFormulario) => Promise<boolean>;
  /** Confirma que la oración quedó aprobada y alimenta al generador. */
  avisoExito: string | null;
  /** Error del caso de uso (RN-11/RN-12), ya en español. */
  error: string | null;
  /** Limpia el error del caso de uso cuando el docente corrige los datos. */
  alLimpiarError: () => void;
}

const CLASES_ETIQUETA = 'text-body font-semibold text-slate-200';

const CLASES_CAMPO = [
  'w-full min-h-tactil min-w-tactil rounded-xl border border-andina-night-border',
  'bg-andina-night px-3 py-2 text-body text-slate-100 placeholder:text-slate-600',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold'
].join(' ');

/** Hick: dos pasos con nombre propio; el indicador los anuncia sin depender del color. */
const PASOS: readonly string[] = ['Datos de la oración', 'Palabra clave y contexto'];

/**
 * RF-006 / RN-11 / RN-12 — formulario de alta de una oración base.
 *
 * Hick (BLOQUEANTE): el alta se divide en DOS pasos para no pedir cinco campos a la vez:
 *  - paso 1: nivel, texto en quechua y traducción al español;
 *  - paso 2: palabra clave (OBLIGATORIA, elegida del catálogo del nivel) y contexto cultural.
 *
 * El paso 2 no se alcanza sin nivel, texto y traducción, y al volver al paso 1 se conservan los
 * valores ya escritos. Los avisos de validación van en español dentro de una región `role="alert"`.
 */
export function FormularioOracion({
  niveles,
  alCargarPalabras,
  alGuardar,
  avisoExito,
  error,
  alLimpiarError
}: PropsFormularioOracion) {
  const primerNivelId = niveles[0]?.id ?? 1;

  const [paso, setPaso] = useState<1 | 2>(1);
  const [nivelId, setNivelId] = useState(primerNivelId);
  const [textoQuechua, setTextoQuechua] = useState('');
  const [traduccionEspanol, setTraduccionEspanol] = useState('');
  const [palabraClaveId, setPalabraClaveId] = useState('');
  const [contextoCultural, setContextoCultural] = useState('');

  const [palabras, setPalabras] = useState<readonly PalabraDto[]>([]);
  const [cargandoPalabras, setCargandoPalabras] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  /**
   * El nivel elegido puede no existir en el mapa (catálogo vacío o recargado): en ese caso se lee
   * como el primer nivel disponible sin necesidad de sincronizar estado con un efecto.
   */
  const nivelElegido = niveles.some((nivel) => nivel.id === nivelId) ? nivelId : primerNivelId;

  /**
   * RN-12: el catálogo del paso 2 se pide al caso de uso justo al entrar al paso, no en un efecto:
   * así la carga nace de una acción del docente y no de un render encadenado.
   */
  const cargarCatalogoDelNivel = useCallback(
    async (nivel: number): Promise<void> => {
      setCargandoPalabras(true);
      setPalabras([]);
      setPalabraClaveId('');
      const catalogo = await alCargarPalabras(nivel);
      setPalabras(catalogo ?? []);
      setCargandoPalabras(false);
    },
    [alCargarPalabras]
  );

  const limpiar = useCallback((): void => {
    setPaso(1);
    setNivelId(primerNivelId);
    setTextoQuechua('');
    setTraduccionEspanol('');
    setPalabraClaveId('');
    setContextoCultural('');
    setPalabras([]);
    setAviso(null);
  }, [primerNivelId]);

  /** Hick: paso 1 -> paso 2, sólo con los tres campos obligatorios completos. */
  function continuar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (textoQuechua.trim().length === 0) {
      setAviso('Escribe la oración en quechua: es el campo obligatorio del paso 1.');
      return;
    }
    if (traduccionEspanol.trim().length === 0) {
      setAviso('Escribe la traducción al español: es el campo obligatorio del paso 1.');
      return;
    }
    setAviso(null);
    alLimpiarError();
    setPaso(2);
    void cargarCatalogoDelNivel(nivelElegido);
  }

  /** El nivel sólo se elige en el paso 1; el `select` del paso 2 queda deshabilitado. */
  function cambiarNivel(valor: string): void {
    setNivelId(Number.parseInt(valor, 10));
  }

  /** RN-12: vuelve al paso 1 conservando todo lo escrito. */
  function atras(): void {
    setAviso(null);
    setPaso(1);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    if (palabraClaveId.trim().length === 0) {
      setAviso(
        'Elige la palabra clave del nivel: la oración debe contenerla (RN-12). Es obligatoria.'
      );
      return;
    }

    setAviso(null);
    alLimpiarError();
    setGuardando(true);
    try {
      const guardada = await alGuardar({
        nivelId,
        textoQuechua: textoQuechua.trim(),
        traduccionEspanol: traduccionEspanol.trim(),
        palabraClaveId,
        contextoCultural: contextoCultural.trim()
      });
      if (guardada) limpiar();
    } finally {
      setGuardando(false);
    }
  }

  const mensajeError = aviso ?? error;

  return (
    <form
      data-formulario="oracion"
      noValidate
      onSubmit={(evento) => void (paso === 1 ? continuar(evento) : guardar(evento))}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <p data-indicador-paso className="text-caption font-semibold text-andina-gold">
          Paso {paso} de 2 · {PASOS[paso - 1]}
        </p>
        <ol className="flex flex-wrap items-center gap-2" aria-hidden="true">
          {PASOS.map((nombre, indice) => {
            const numero = indice + 1;
            const activo = numero === paso;
            return (
              <li
                key={nombre}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-caption font-semibold',
                  activo
                    ? 'border-andina-terracotta/40 bg-andina-terracotta/20 text-andina-gold'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400'
                )}
              >
                {numero}. {nombre}
              </li>
            );
          })}
        </ol>
      </div>

      {/*
        Sólo se monta el paso activo: el contrato de selectores exige `data-paso="1"` y
        `data-paso="2"` como pasos excluyentes, y así el paso 2 tampoco existe antes de tiempo.
      */}
      {paso === 1 && (
        <div data-paso="1" className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className={CLASES_ETIQUETA}>Nivel de la oración (obligatorio)</span>
            <select
              name="nivelId"
              value={String(nivelElegido)}
              onChange={(evento) => cambiarNivel(evento.target.value)}
              className={CLASES_CAMPO}
            >
              {niveles.map((nivel) => (
                <option key={nivel.id} value={String(nivel.id)}>
                  Nivel {nivel.id}: {nivel.tituloEspanol || nivel.tituloQuechua}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={CLASES_ETIQUETA}>Texto en quechua (obligatorio)</span>
            <input
              type="text"
              name="textoQuechua"
              value={textoQuechua}
              onChange={(evento) => setTextoQuechua(evento.target.value)}
              aria-required="true"
              aria-invalid={aviso !== null ? true : undefined}
              placeholder="Ej.: Mamayqa sumaq mut'ita wayk'un."
              className={CLASES_CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={CLASES_ETIQUETA}>Traducción al español (obligatorio)</span>
            <input
              type="text"
              name="traduccionEspanol"
              value={traduccionEspanol}
              onChange={(evento) => setTraduccionEspanol(evento.target.value)}
              aria-required="true"
              aria-invalid={aviso !== null ? true : undefined}
              placeholder="Ej.: Mi madre cocina un mote delicioso."
              className={CLASES_CAMPO}
            />
          </label>
        </div>
      )}

      {paso === 2 && (
        <div data-paso="2" className="flex flex-col gap-4">
          <p className="text-body text-slate-400">
            Nivel {nivelElegido}. La palabra clave es obligatoria: la oración debe contenerla
            (RN-11) y tiene que pertenecer a este mismo nivel (RN-12).
          </p>

          <label className="flex flex-col gap-1">
            <span className={CLASES_ETIQUETA}>Palabra clave del nivel (obligatoria)</span>
            <select
              name="palabraClaveId"
              value={palabraClaveId}
              onChange={(evento) => setPalabraClaveId(evento.target.value)}
              aria-required="true"
              aria-invalid={aviso !== null ? true : undefined}
              className={CLASES_CAMPO}
            >
              <option value="">Elige una palabra del nivel {nivelElegido}…</option>
              {palabras.map((palabra) => (
                <option key={palabra.id} value={palabra.id}>
                  {palabra.termino} — {palabra.etiquetaCategoria}
                </option>
              ))}
            </select>
          </label>

          {cargandoPalabras && (
            <EstadoCarga mensaje={`Cargando las palabras del nivel ${nivelElegido}…`} />
          )}
          {!cargandoPalabras && palabras.length === 0 && (
            <p className="text-body text-amber-200">
              Este nivel todavía no tiene palabras publicadas, así que no puedes elegir palabra
              clave.
            </p>
          )}

          <label className="flex flex-col gap-1">
            <span className={CLASES_ETIQUETA}>Contexto cultural (opcional)</span>
            <textarea
              name="contextoCultural"
              rows={3}
              value={contextoCultural}
              onChange={(evento) => setContextoCultural(evento.target.value)}
              placeholder="Ej.: Se usa al agradecer a la Pachamama después de la cosecha."
              className={CLASES_CAMPO}
            />
          </label>
        </div>
      )}

      {/* Jakob: un solo bloque de error; Accesibilidad: `role="alert"` lo anuncia de inmediato. */}
      {mensajeError !== null && <MensajeError key={mensajeError} mensaje={mensajeError} />}

      {avisoExito !== null && (
        <p role="status" aria-live="polite" className="text-body font-semibold text-emerald-300">
          {avisoExito}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {paso === 1 ? (
          // Hick: el paso 1 sólo ofrece UNA acción, el avance; es el CTA primario de la pestaña.
          <Boton type="submit" variante="primario" esCtaPrimario data-accion="continuar">
            Continuar
          </Boton>
        ) : (
          <>
            <Boton type="submit" variante="primario" esCtaPrimario data-accion="guardar" cargando={guardando}>
              Guardar oración
            </Boton>
            <Boton type="button" variante="secundario" onClick={atras} disabled={guardando}>
              Atrás
            </Boton>
          </>
        )}
      </div>
    </form>
  );
}

export default FormularioOracion;
