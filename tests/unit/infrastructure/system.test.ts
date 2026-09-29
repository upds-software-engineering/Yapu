import { afterEach, describe, expect, it, vi } from 'vitest';
import { Evaluacion } from '@domain/evaluacion/Evaluacion';
import { NivelId, Puntuacion } from '@domain/value-objects';
import { AleatorioFijo, GeneradorIdSecuencial, mismaSecuencia } from '../../helpers/index';
import { AleatorioMulberry32 } from '@infrastructure/system/AleatorioMulberry32';
import { ConectividadNavegador } from '@infrastructure/system/ConectividadNavegador';
import { DescargaCsvAdapter } from '@infrastructure/system/DescargaCsvAdapter';
import { GeneradorIdCrypto } from '@infrastructure/system/GeneradorIdCrypto';
import { RelojSistema } from '@infrastructure/system/RelojSistema';
import { CLAVE_SESION, SesionLocalAdapter } from '@infrastructure/system/SesionLocalAdapter';
import { SincronizacionNoopAdapter } from '@infrastructure/sync/SincronizacionNoopAdapter';

/** Formato de los identificadores que expone `GeneradorIdCrypto` (UUID con guiones). */
const FORMATO_UUID = /^[0-9a-f-]{36}$/i;

/** Lee la sesión persistida sin asumir su forma: la prueba comprueba el contenido real guardado. */
function sesionPersistida(clave: string = CLAVE_SESION): unknown {
  return JSON.parse(localStorage.getItem(clave) ?? 'null');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('[RNF-005] Adaptadores de sistema', () => {
  describe('RelojSistema', () => {
    it('devuelve un Date válido cercano al instante actual', () => {
      // Dado
      const reloj = new RelojSistema();
      const antes = Date.now();

      // Cuando
      const ahora = reloj.ahora();

      // Entonces
      const despues = Date.now();
      expect(ahora).toBeInstanceOf(Date);
      expect(Number.isNaN(ahora.getTime())).toBe(false);
      expect(ahora.getTime()).toBeGreaterThanOrEqual(antes);
      expect(ahora.getTime()).toBeLessThanOrEqual(despues);
    });
  });

  describe('AleatorioMulberry32', () => {
    it('conSemilla(42) reproduce exactamente la secuencia de AleatorioFijo(42)', () => {
      // Dado
      const produccion = AleatorioMulberry32.conSemilla(42);
      const dobleDePrueba = new AleatorioFijo(42);

      // Cuando / Entonces: misma secuencia de 50 valores, no sólo los cinco primeros
      expect(mismaSecuencia(AleatorioMulberry32.conSemilla(42), new AleatorioFijo(42))).toBe(true);
      expect(mismaSecuencia(produccion, dobleDePrueba, 50)).toBe(true);
    });

    it('genera siempre valores dentro de [0, 1)', () => {
      // Dado
      const aleatorio = AleatorioMulberry32.conSemilla(7);

      // Cuando
      const valores = Array.from({ length: 500 }, () => aleatorio.siguiente());

      // Entonces
      for (const valor of valores) {
        expect(valor).toBeGreaterThanOrEqual(0);
        expect(valor).toBeLessThan(1);
      }
    });

    it('sin semilla funciona y expone una semilla numérica', () => {
      // Dado
      const aleatorio = new AleatorioMulberry32();

      // Cuando
      const valor = aleatorio.siguiente();

      // Entonces
      expect(typeof aleatorio.semilla).toBe('number');
      expect(Number.isInteger(aleatorio.semilla)).toBe(true);
      expect(aleatorio.semilla).toBeGreaterThanOrEqual(0);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    });

    it('es determinista: dos instancias con la misma semilla dan los mismos valores', () => {
      // Dado
      const primera = AleatorioMulberry32.conSemilla(123456);
      const segunda = AleatorioMulberry32.conSemilla(123456);

      // Cuando
      const secuenciaPrimera = Array.from({ length: 20 }, () => primera.siguiente());
      const secuenciaSegunda = Array.from({ length: 20 }, () => segunda.siguiente());

      // Entonces
      expect(secuenciaPrimera).toEqual(secuenciaSegunda);
    });
  });

  describe('GeneradorIdCrypto', () => {
    it('genera 1000 identificadores únicos, no vacíos y con formato UUID', () => {
      // Dado
      const generador = new GeneradorIdCrypto();
      const ids = new Set<string>();

      // Cuando
      for (let i = 0; i < 1000; i++) {
        const id = generador.generar();
        expect(id).not.toBe('');
        expect(id).toMatch(FORMATO_UUID);
        ids.add(id);
      }

      // Entonces
      expect(ids.size).toBe(1000);
    });

    it('nunca lanza y mantiene el formato UUID cuando no hay WebCrypto', () => {
      // Dado: entorno sin `crypto` (SSR o navegador antiguo)
      vi.stubGlobal('crypto', undefined);
      const generador = new GeneradorIdCrypto();

      try {
        // Cuando
        const ids = Array.from({ length: 200 }, () => generador.generar());

        // Entonces
        expect(new Set(ids).size).toBe(200);
        for (const id of ids) {
          expect(id).toMatch(FORMATO_UUID);
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('ConectividadNavegador', () => {
    afterEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    it('refleja el estado de navigator.onLine', () => {
      // Dado
      const conectividad = new ConectividadNavegador();

      // Cuando
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      // Entonces
      expect(conectividad.estaEnLinea()).toBe(false);

      // Cuando
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      // Entonces
      expect(conectividad.estaEnLinea()).toBe(true);
    });

    it('avisa al recuperar la conexión y la desuscripción cancela el aviso', () => {
      // Dado
      const conectividad = new ConectividadNavegador();
      const manejador = vi.fn();
      const desuscribir = conectividad.alRecuperarConexion(manejador);

      // Cuando
      window.dispatchEvent(new Event('online'));

      // Entonces
      expect(manejador).toHaveBeenCalledTimes(1);

      // Cuando
      desuscribir();
      window.dispatchEvent(new Event('online'));

      // Entonces
      expect(manejador).toHaveBeenCalledTimes(1);
    });

    it('es seguro sin navegador (SSR): asume conexión y devuelve una desuscripción inerte', () => {
      // Dado: entorno sin `navigator` ni `window`
      vi.stubGlobal('navigator', undefined);
      vi.stubGlobal('window', undefined);

      try {
        const conectividad = new ConectividadNavegador();

        // Cuando
        const desuscribir = conectividad.alRecuperarConexion(() => undefined);

        // Entonces
        expect(conectividad.estaEnLinea()).toBe(true);
        expect(() => desuscribir()).not.toThrow();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('SesionLocalAdapter', () => {
    it('la primera llamada a obtener() crea y persiste una sesión de estudiante', async () => {
      // Dado
      const sesion = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));

      // Cuando
      const actual = await sesion.obtener();

      // Entonces
      expect(actual.rol).toBe('estudiante');
      expect(actual.nombre).toBe('Estudiante YAPU');
      expect(actual.usuarioId).not.toBe('');
      expect(actual.usuarioId).toBe('usuario-1');
      expect(sesionPersistida()).toMatchObject({
        usuarioId: 'usuario-1',
        rol: 'estudiante',
        nombre: 'Estudiante YAPU'
      });
    });

    it('cambiarRol persiste y una instancia nueva lo lee del almacenamiento real', async () => {
      // Dado
      const primera = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));
      const inicial = await primera.obtener();

      // Cuando
      const actualizada = await primera.cambiarRol('docente');

      // Entonces
      expect(actualizada.rol).toBe('docente');

      // Cuando: instancia nueva sobre el mismo localStorage (no comparte estado en memoria)
      const segunda = new SesionLocalAdapter(new GeneradorIdSecuencial('otro'));
      const releida = await segunda.obtener();

      // Entonces
      expect(releida.rol).toBe('docente');
      expect(releida.usuarioId).toBe(inicial.usuarioId);
      expect(releida.nombre).toBe('Estudiante YAPU');
    });

    it('establecerUsuario persiste el identificador y el nombre', async () => {
      // Dado
      const sesion = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));
      await sesion.obtener();

      // Cuando
      const actualizada = await sesion.establecerUsuario('u-9', 'Ana');

      // Entonces
      expect(actualizada).toMatchObject({ usuarioId: 'u-9', nombre: 'Ana', rol: 'estudiante' });

      // Cuando: se relee desde otra instancia
      const otra = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));
      const releida = await otra.obtener();

      // Entonces
      expect(releida).toMatchObject({ usuarioId: 'u-9', nombre: 'Ana', rol: 'estudiante' });
    });

    it('conserva el nombre actual cuando establecerUsuario no recibe nombre', async () => {
      // Dado
      const sesion = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));
      await sesion.establecerUsuario('u-1', 'Ana');

      // Cuando
      const actualizada = await sesion.establecerUsuario('u-2');

      // Entonces
      expect(actualizada).toMatchObject({ usuarioId: 'u-2', nombre: 'Ana' });
    });

    it('tolera JSON corrupto y devuelve la sesión por defecto sin lanzar', async () => {
      // Dado
      localStorage.setItem(CLAVE_SESION, '{esto no es json válido');
      const sesion = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));

      // Cuando
      const actual = await sesion.obtener();

      // Entonces
      expect(actual.rol).toBe('estudiante');
      expect(actual.usuarioId).toBe('usuario-1');
      expect(sesionPersistida()).toMatchObject({
        usuarioId: 'usuario-1',
        rol: 'estudiante'
      });
    });

    it('descarta una sesión persistida con rol desconocido', async () => {
      // Dado
      localStorage.setItem(
        CLAVE_SESION,
        JSON.stringify({ usuarioId: 'intruso', rol: 'administrador', nombre: 'X' })
      );
      const sesion = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'));

      // Cuando
      const actual = await sesion.obtener();

      // Entonces
      expect(actual.rol).toBe('estudiante');
      expect(actual.usuarioId).toBe('usuario-1');
    });

    it('usa la clave de almacenamiento indicada en el constructor', async () => {
      // Dado
      const clavePropia = 'yapu:sesion:prueba';
      const sesion = new SesionLocalAdapter(new GeneradorIdSecuencial('usuario'), clavePropia);

      // Cuando
      await sesion.obtener();

      // Entonces
      expect(localStorage.getItem(clavePropia)).not.toBeNull();
      expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    });
  });

  describe('DescargaCsvAdapter', () => {
    it('crea el objeto URL, pulsa el enlace con el nombre indicado y limpia el DOM', () => {
      // Dado
      const crearObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:yapu/x.csv');
      const revocarObjectUrl = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation(() => undefined);
      let nombreDescargado = '';
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          nombreDescargado = this.download;
        });
      const adaptador = new DescargaCsvAdapter();

      // Cuando
      adaptador.descargar('x.csv', 'contenido', 'text/csv');

      // Entonces
      expect(crearObjectUrl).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(nombreDescargado).toBe('x.csv');
      expect(revocarObjectUrl).toHaveBeenCalledWith('blob:yapu/x.csv');
      expect(document.querySelectorAll('a[download]')).toHaveLength(0);
    });
  });
});

describe('[RN-15] Sincronización no-op', () => {
  /** Evaluación recién rendida, en la cola offline (`sincronizada = false`). */
  function unaEvaluacion(id: string): Evaluacion {
    return Evaluacion.registrar({
      id,
      estudianteId: 'estudiante-1',
      nivel: NivelId.crear(3),
      puntuacion: Puntuacion.crear(80),
      aciertos: 8,
      totalPreguntas: 10,
      fechaIso: '2026-03-15T09:00:00.000Z'
    });
  }

  it('devuelve todos los ids recibidos, en orden, y las marca como sincronizadas', async () => {
    // Dado
    const adaptador = new SincronizacionNoopAdapter();
    const evaluaciones = [unaEvaluacion('eval-1'), unaEvaluacion('eval-2'), unaEvaluacion('eval-3')];
    expect(evaluaciones.every((evaluacion) => !evaluacion.sincronizada)).toBe(true);

    // Cuando
    const sincronizadas = await adaptador.sincronizar(evaluaciones);

    // Entonces
    expect(sincronizadas).toEqual(['eval-1', 'eval-2', 'eval-3']);
    expect(evaluaciones.every((evaluacion) => evaluacion.sincronizada)).toBe(true);
  });

  it('es idempotente: la misma evaluación devuelve su id las dos veces sin efectos extra', async () => {
    // Dado
    const adaptador = new SincronizacionNoopAdapter();
    const evaluacion = unaEvaluacion('eval-9');

    // Cuando
    const primera = await adaptador.sincronizar([evaluacion]);
    const segunda = await adaptador.sincronizar([evaluacion]);

    // Entonces
    expect(primera).toEqual(['eval-9']);
    expect(segunda).toEqual(['eval-9']);
    expect(evaluacion.sincronizada).toBe(true);
  });

  it('devuelve una lista vacía cuando no hay nada que sincronizar', async () => {
    // Dado
    const adaptador = new SincronizacionNoopAdapter();

    // Cuando
    const sincronizadas = await adaptador.sincronizar([]);

    // Entonces
    expect(sincronizadas).toEqual([]);
  });
});
