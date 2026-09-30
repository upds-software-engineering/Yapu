import { useState, type FormEvent, type RefObject } from 'react';
import type { EntradaReto } from '@application/use-cases/ProponerRetoUseCase';
import { Boton, MensajeError } from '@ui/design-system';

/** RN-13: rangos válidos del nivel sugerido (los mismos 10 niveles del curso). */
const NIVEL_MINIMO_SUGERIDO = 1;
const NIVEL_MAXIMO_SUGERIDO = 10;

/** RN-13: toda propuesta exige la aprobación de docentes DISTINTOS. */
const PALABRA_DOCENTES = 'dos docentes distintos';

/** Longitud máxima de los campos de texto (evita propuestas inmanejables en la moderación). */
const MAXIMO_TEXTO_QUEHUA = 200;
const MAXIMO_TRADUCCION = 200;
const MAXIMO_PISTA = 280;

const NIVELES_SUGERIDOS: readonly number[] = Array.from(
  { length: NIVEL_MAXIMO_SUGERIDO - NIVEL_MINIMO_SUGERIDO + 1 },
  (_, indice) => NIVEL_MINIMO_SUGERIDO + indice
);

export interface PropsFormularioReto {
  /**
   * RF-007: ejecuta `ProponerRetoUseCase`. Devuelve el `RetoDto` creado o `null` si la
   * operación falló; en ese caso el error ya viene traducido a español.
   */
  alProponer: (entrada: EntradaReto) => Promise<unknown>;
  /** Error del caso de uso, ya en español, o `null` mientras no haya fallo. */
  error?: string | null;
  /** Avisa al contenedor de que la validación local pasó y el error anterior ya no aplica. */
  alLimpiarError?: () => void;
  /** Refresco de la lista tras una propuesta correcta. */
  alRefrescar: () => void;
  /** Cierra el formulario (acción secundaria). */
  alCerrar: () => void;
  /** Nivel sugerido con el que arranca el `select`. */
  nivelInicial?: number;
  /**
   * Hick: la pantalla enfoca el primer campo obligatorio cuando su CTA «Proponer un reto» abre el
   * formulario. El `input` se registra aquí porque el DOM nativo no expone un `autoFocus` diferido.
   */
  referenciaPrimerCampo?: RefObject<HTMLInputElement | null>;
  className?: string;
}

/** Texto del aviso de éxito: deja claro que el reto NO se publica todavía (RN-13). */
function mensajeDeExito(nombre: string): string {
  return `¡Gracias, ${nombre}! Tu reto quedó pendiente de moderación por ${PALABRA_DOCENTES} y se publicará cuando lo aprueben.`;
}

/**
 * RF-007 / RN-13 — formulario de propuesta de un reto comunitario.
 *
 * Hick: como máximo CUATRO campos visibles (texto en quechua, traducción, pista cultural y nivel
 * sugerido) y un ÚNICO botón de envío; cerrar el formulario es una acción terciaria que no compite.
 *
 * Validación en español ANTES de llamar al caso de uso: los avisos se publican en una región
 * `aria-live`, no en un `alert()` del navegador ni en un `required` nativo (el formulario va con
 * `noValidate` para que el mensaje sea siempre el nuestro y el mismo en todos los navegadores).
 *
 * RN-13: tras proponer con éxito se confirma que el reto queda pendiente de dos docentes
 * distintos, se limpia el formulario y se refresca la lista.
 */
export function FormularioReto({
  alProponer,
  error,
  alLimpiarError,
  alRefrescar,
  alCerrar,
  nivelInicial = NIVEL_MINIMO_SUGERIDO,
  referenciaPrimerCampo,
  className
}: PropsFormularioReto) {
  const [textoQuechua, setTextoQuechua] = useState('');
  const [traduccionSugerida, setTraduccionSugerida] = useState('');
  const [pistaCultural, setPistaCultural] = useState('');
  const [nivelSugerido, setNivelSugerido] = useState(String(nivelInicial));
  const [aviso, setAviso] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpiar(): void {
    setTextoQuechua('');
    setTraduccionSugerida('');
    setPistaCultural('');
    setNivelSugerido(String(nivelInicial));
  }

  /** Validación local: devuelve el primer problema en español o `null` si todo está correcto. */
  function primerProblema(nivel: number): string | null {
    if (textoQuechua.trim().length === 0) {
      return 'Escribe la oración o frase en quechua: es el campo obligatorio del reto.';
    }
    if (textoQuechua.trim().length > MAXIMO_TEXTO_QUEHUA) {
      return `La oración en quechua no puede pasar de ${MAXIMO_TEXTO_QUEHUA} caracteres.`;
    }
    if (traduccionSugerida.trim().length === 0) {
      return 'Escribe la traducción sugerida al español: es un campo obligatorio.';
    }
    if (traduccionSugerida.trim().length > MAXIMO_TRADUCCION) {
      return `La traducción sugerida no puede pasar de ${MAXIMO_TRADUCCION} caracteres.`;
    }
    if (pistaCultural.trim().length > MAXIMO_PISTA) {
      return `La pista cultural no puede pasar de ${MAXIMO_PISTA} caracteres.`;
    }
    if (!Number.isInteger(nivel) || nivel < NIVEL_MINIMO_SUGERIDO || nivel > NIVEL_MAXIMO_SUGERIDO) {
      return `Elige un nivel sugerido entre ${NIVEL_MINIMO_SUGERIDO} y ${NIVEL_MAXIMO_SUGERIDO}.`;
    }
    return null;
  }

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setExito(null);

    const problema = primerProblema(Number.parseInt(nivelSugerido, 10));
    if (problema !== null) {
      setAviso(problema);
      return;
    }
    // La validación local pasó: el error anterior del caso de uso deja de estar vigente.
    setAviso(null);
    alLimpiarError?.();

    setEnviando(true);
    try {
      const propuesta: EntradaReto = {
        textoQuechua: textoQuechua.trim(),
        traduccionSugerida: traduccionSugerida.trim(),
        pistaCultural: pistaCultural.trim(),
        nivelSugerido: Number.parseInt(nivelSugerido, 10)
      };
      const creado = await alProponer(propuesta);
      if (creado === null) return;

      const nombre = extraerNombreAutor(creado);
      limpiar();
      setAviso(null);
      setExito(mensajeDeExito(nombre));
      alRefrescar();
    } finally {
      setEnviando(false);
    }
  }

  /** Jakob: un solo bloque de error en pantalla; la validación local tiene prioridad. */
  const mensajeError = aviso ?? error ?? null;

  return (
    <form
      data-formulario="reto"
      noValidate
      onSubmit={(evento) => void enviar(evento)}
      className={className}
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-title font-display font-bold text-tinta">
          Proponer un reto
        </legend>

        {/*
          Hick: 4 campos como máximo. Todos los controles declaran `aria-required` explícito
          porque el formulario desactiva la validación nativa con `noValidate`.
        */}
        <label className="flex flex-col gap-1">
          <span className="text-body font-semibold text-tinta">
            Oración o frase en quechua (obligatorio)
          </span>
          <input
            type="text"
            name="textoQuechua"
            ref={referenciaPrimerCampo}
            value={textoQuechua}
            onChange={(evento) => setTextoQuechua(evento.target.value)}
            aria-required="true"
            aria-invalid={aviso !== null ? true : undefined}
            placeholder="Ej.: Munaspaqa tukuy imata yachankiman."
            className="w-full min-h-tactil min-w-tactil rounded-xl border border-linea-fuerte bg-fondo px-3 py-2 text-body text-tinta placeholder:text-tinta-tenue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-body font-semibold text-tinta">
            Traducción sugerida al español (obligatorio)
          </span>
          <input
            type="text"
            name="traduccionSugerida"
            value={traduccionSugerida}
            onChange={(evento) => setTraduccionSugerida(evento.target.value)}
            aria-required="true"
            aria-invalid={aviso !== null ? true : undefined}
            placeholder="Ej.: Si quieres, puedes aprenderlo todo."
            className="w-full min-h-tactil min-w-tactil rounded-xl border border-linea-fuerte bg-fondo px-3 py-2 text-body text-tinta placeholder:text-tinta-tenue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-body font-semibold text-tinta">
            Pista cultural (opcional)
          </span>
          <input
            type="text"
            name="pistaCultural"
            value={pistaCultural}
            onChange={(evento) => setPistaCultural(evento.target.value)}
            placeholder="Ej.: Dicho popular de aliento en los Andes."
            className="w-full min-h-tactil min-w-tactil rounded-xl border border-linea-fuerte bg-fondo px-3 py-2 text-body text-tinta placeholder:text-tinta-tenue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-body font-semibold text-tinta">Nivel sugerido</span>
          <select
            name="nivelSugerido"
            value={nivelSugerido}
            onChange={(evento) => setNivelSugerido(evento.target.value)}
            className="w-full min-h-tactil min-w-tactil rounded-xl border border-linea bg-fondo px-3 py-2 text-body text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-fuerte"
          >
            {NIVELES_SUGERIDOS.map((nivel) => (
              <option key={nivel} value={String(nivel)}>
                Nivel {nivel}
              </option>
            ))}
          </select>
        </label>

        {/*
          MensajeError ya anuncia con `role="alert"`, así que el aviso de validación local y el
          error del caso de uso comparten un ÚNICO bloque: nunca hay dos mensajes a la vez.
        */}
        {mensajeError !== null && <MensajeError key={mensajeError} mensaje={mensajeError} />}

        {/* La confirmación es cortés: no interrumpe lo que el estudiante esté leyendo. */}
        {exito !== null && (
          <p role="status" aria-live="polite" className="text-body font-semibold text-exito">
            {exito}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/*
            Fitts: el envío es el único `Boton` de acción principal del formulario y conserva los
            44 px del design system. NO se marca `esCtaPrimario` para no duplicar el CTA único de
            la pantalla (Hick); la pantalla decide cuál es su acción primaria.
          */}
          <Boton
            type="submit"
            variante="primario"
            data-accion="proponer"
            cargando={enviando}
            disabled={enviando}
          >
            Enviar reto a moderación
          </Boton>
          <Boton
            type="button"
            variante="terciario"
            onClick={alCerrar}
            disabled={enviando}
          >
            Cancelar
          </Boton>
        </div>
      </fieldset>
    </form>
  );
}

/**
 * El DTO creado siempre es un `RetoDto`, pero este componente no necesita el tipo completo:
 * lee `nombreAutor` de forma defensiva para personalizar la confirmación.
 */
function extraerNombreAutor(creado: unknown): string {
  if (typeof creado === 'object' && creado !== null && 'nombreAutor' in creado) {
    const nombre = (creado as { nombreAutor?: unknown }).nombreAutor;
    if (typeof nombre === 'string' && nombre.trim().length > 0) return nombre.trim();
  }
  return 'estudiante';
}

export default FormularioReto;
