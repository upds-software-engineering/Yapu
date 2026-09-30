import type { RetoDto } from '@application/dto/contenido';
import { BarraProgreso, Insignia, Tarjeta, type TonoInsignia } from '@ui/design-system';

export interface PropsTarjetaReto {
  /** RF-007: reto comunitario ya proyectado a DTO por la capa de aplicación. */
  reto: RetoDto;
  className?: string;
}

/** RN-13: el estado del reto se comunica con el tono semántico de la pastilla. */
const TONOS: Record<RetoDto['estado'], TonoInsignia> = {
  pendiente: 'alerta',
  aprobado: 'exito',
  rechazado: 'error'
};

/** Etiqueta en español del estado (nunca se pinta el valor crudo del dominio). */
const ETIQUETAS: Record<RetoDto['estado'], string> = {
  pendiente: 'Pendiente de moderación',
  aprobado: 'Aprobado y publicado',
  rechazado: 'Rechazado'
};

/** RF-007: participantes de la bitácora de moderación. */
const ETIQUETAS_DECISION: Record<'aprobado' | 'rechazado', string> = {
  aprobado: 'Aprobó',
  rechazado: 'Rechazó'
};

/**
 * RF-007 / RN-13 — tarjeta de un reto comunitario.
 *
 * Miller/Jakob: la tarjeta repite siempre el mismo orden de lectura (autor, texto en quechua,
 * traducción, pista cultural, nivel y estado) para que comparar retos no cueste trabajo.
 *
 * RN-13: el progreso de moderación se muestra como `aprobaciones` de `aprobacionesRequeridas`
 * («1 de 2 aprobaciones de docentes») acompañado de una `BarraProgreso`, porque publicar exige
 * dos docentes DISTINTOS. La bitácora se lista sólo con el identificador del docente: ninguna
 * decisión debe exponer datos personales.
 *
 * Estética-Usabilidad (BLOQUEANTE): la tipografía sale siempre de los tokens
 * `text-caption|body|title|display`; aquí no hay ningún objetivo interactivo propio (los botones
 * de moderación viven en el panel docente), así que la tarjeta no añade ruido de Fitts.
 */
export function TarjetaReto({ reto, className }: PropsTarjetaReto) {
  const requeridas = reto.aprobacionesRequeridas > 0 ? reto.aprobacionesRequeridas : 1;
  const aprobaciones = Math.min(Math.max(reto.aprobaciones, 0), requeridas);

  return (
    <Tarjeta className={className}>
      <article data-reto={reto.id} data-estado-reto={reto.estado} className="flex flex-col gap-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-caption text-tinta-tenue">
            Aporte de <span className="font-semibold text-tinta">{reto.nombreAutor}</span>
          </p>
          <Insignia tono={TONOS[reto.estado]}>{ETIQUETAS[reto.estado]}</Insignia>
        </header>

        <div className="flex flex-col gap-1">
          <p className="text-title font-display font-bold text-acento">{reto.textoQuechua}</p>
          <p className="text-body text-tinta">Traducción: {reto.traduccionSugerida}</p>
        </div>

        {reto.pistaCultural.length > 0 && (
          <p className="rounded-xl border border-linea bg-fondo/60 px-3 py-2 text-body italic text-tinta-suave">
            {reto.pistaCultural}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Insignia tono="marca">Nivel sugerido {reto.nivelSugerido}</Insignia>
          <Insignia tono="neutro">Propuesto el {reto.fechaCreacion}</Insignia>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-body text-tinta-suave">
            {aprobaciones} de {requeridas} aprobaciones de docentes
          </p>
          <BarraProgreso
            valor={aprobaciones}
            max={requeridas}
            etiqueta="Progreso de moderación del reto"
          />
        </div>

        {reto.moderaciones.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-caption font-semibold uppercase tracking-widest text-tinta-tenue">
              Moderaciones registradas
            </p>
            <ul className="flex flex-col gap-1">
              {reto.moderaciones.map((moderacion) => (
                <li
                  key={`${moderacion.docenteId}-${moderacion.fecha}`}
                  className="text-caption text-tinta-tenue"
                >
                  Docente {moderacion.docenteId}: {ETIQUETAS_DECISION[moderacion.decision]} el{' '}
                  {moderacion.fecha}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </Tarjeta>
  );
}

export default TarjetaReto;
