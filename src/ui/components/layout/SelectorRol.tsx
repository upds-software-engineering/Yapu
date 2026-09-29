import { useState, type ChangeEvent } from 'react';
import type { SesionDto } from '@application/dto';
import { useCasoDeUso, useServicios } from '@ui/hooks';
import { cn } from '@ui/lib/clases';
import { mensajeDeError } from '@ui/lib/mensajes';

/**
 * Rol de la sesión simulada (ADR-003).
 *
 * El tipo se DERIVA del DTO (`SesionDto['rol']`) y no se importa de `@domain/**`, porque la capa
 * `ui` tiene prohibido depender del dominio: así el selector sigue el contrato de la aplicación
 * sin acoplarse a sus entidades.
 */
export type RolSesion = SesionDto['rol'];

/** Jakob: dos opciones con las etiquetas que ya usa la gente, en un `<select>` nativo. */
const OPCIONES: ReadonlyArray<{ valor: RolSesion; etiqueta: string }> = [
  { valor: 'estudiante', etiqueta: 'Estudiante' },
  { valor: 'docente', etiqueta: 'Docente' }
];

/** Único rol que se muestra mientras la sesión todavía no llegó (RF-001). */
const ROL_POR_DEFECTO: RolSesion = 'estudiante';

const ID_SELECTOR = 'selector-rol-sesion';

export interface PropsSelectorRol {
  /**
   * Avisa al contenedor (la navegación) de que la sesión cambió, para que vuelva a consultarla y
   * actualice lo que dependa del rol —por ejemplo, la pestaña de docente (RF-002)—.
   */
  alCambiarRol?: () => void;
  className?: string;
}

/**
 * RF-001 / RF-002 — selector discreto de rol, en la cabecera de escritorio.
 *
 * ADR-003: la autenticación es simulada, así que el control deja cambiar de rol sin credenciales;
 * el texto de ayuda lo dice de forma explícita para que nadie confunda esto con un inicio de
 * sesión real.
 *
 * Estética-Usabilidad: sólo se usan los tokens `text-caption|body|title|display`.
 * Fitts: el control declara 44×44 px (`min-h-tactil min-w-tactil`).
 */
export function SelectorRol({ alCambiarRol, className }: PropsSelectorRol) {
  const { obtenerSesion, cambiarRol } = useServicios();
  const { datos } = useCasoDeUso<SesionDto, []>(() => obtenerSesion.ejecutar(), {
    ejecutarAlMontar: []
  });

  // El rol elegido se recuerda en cuanto el estudiante lo cambia: así la interfaz responde al
  // instante y no depende de que la sesión simulada termine de leerse.
  const [rolElegido, setRolElegido] = useState<RolSesion | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rol: RolSesion = rolElegido ?? datos?.rol ?? ROL_POR_DEFECTO;

  async function cambiar(evento: ChangeEvent<HTMLSelectElement>): Promise<void> {
    const siguiente = evento.target.value as RolSesion;
    if (siguiente === rol) return;

    const anterior = rol;
    setRolElegido(siguiente);
    setCambiando(true);
    setError(null);

    try {
      await cambiarRol.ejecutar({ rol: siguiente });
      alCambiarRol?.();
    } catch (fallo) {
      // El cambio no llegó a guardarse: se vuelve al rol vigente y se explica en español.
      setRolElegido(anterior);
      setError(mensajeDeError(fallo));
    } finally {
      setCambiando(false);
    }
  }

  return (
    <div
      data-selector-rol="sesion"
      data-rol={rol}
      className={cn('flex flex-col items-start gap-1', className)}
    >
      <label htmlFor={ID_SELECTOR} className="text-caption font-semibold text-slate-400">
        Rol de la sesión (simulado)
      </label>

      <select
        id={ID_SELECTOR}
        value={rol}
        disabled={cambiando}
        onChange={(evento) => void cambiar(evento)}
        className={cn(
          'min-h-tactil min-w-tactil rounded-lg border border-andina-night-border bg-andina-night-card px-2',
          'text-caption font-semibold text-sand transition-colors duration-200',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andina-gold'
        )}
      >
        {OPCIONES.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>

      <p className="max-w-[16rem] text-caption text-slate-400">
        Rol simulado (ADR-003): sirve para probar la vista de docente sin autenticación real.
      </p>

      {error !== null && (
        <p role="alert" className="text-caption font-semibold text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default SelectorRol;
