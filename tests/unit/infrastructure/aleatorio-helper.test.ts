import { describe, it, expect } from 'vitest';
import type { FuenteAleatoria } from '@domain/shared/puertos';
import { barajar, elegir, elegirVarios } from '@domain/shared/aleatorio';
import {
  AleatorioFijo,
  AleatorioGuionado,
  GeneradorIdSecuencial,
  mismaSecuencia
} from '../../helpers/aleatorio';

/**
 * Pruebas de los dobles de prueba deterministas del motor de evaluación (hallazgo A5).
 *
 * Toda la aleatoriedad del dominio se inyecta como `FuenteAleatoria`: si el doble de test no es
 * reproducible, ninguna prueba de reglas de negocio lo será. Aquí se fija ese contrato.
 */

describe('[A5] Aleatoriedad determinista', () => {
  it('[A5] AleatorioFijo produce la misma secuencia con la misma semilla', () => {
    // Dado
    const primero = new AleatorioFijo(42);
    const segundo = new AleatorioFijo(42);

    // Cuando
    const secuenciaPrimera = [primero.siguiente(), primero.siguiente(), primero.siguiente(), primero.siguiente(), primero.siguiente()];
    const secuenciaSegunda = [segundo.siguiente(), segundo.siguiente(), segundo.siguiente(), segundo.siguiente(), segundo.siguiente()];

    // Entonces
    expect(secuenciaPrimera).toEqual(secuenciaSegunda);
    expect(secuenciaPrimera).toHaveLength(5);
  });

  it('[A5] AleatorioFijo produce secuencias distintas con semillas distintas', () => {
    // Dado
    const conSemilla42 = new AleatorioFijo(42);
    const conSemilla1 = new AleatorioFijo(1);

    // Cuando
    const mismas = mismaSecuencia(conSemilla42, conSemilla1, 5);

    // Entonces
    expect(mismas).toBe(false);
  });

  it('[A5] mismaSecuencia reconoce dos fuentes idénticas', () => {
    // Dado / Cuando
    const mismas = mismaSecuencia(new AleatorioFijo(2026), new AleatorioFijo(2026), 10);

    // Entonces
    expect(mismas).toBe(true);
  });

  it('[A5] AleatorioFijo sólo devuelve valores en [0, 1)', () => {
    // Dado
    const fuente = new AleatorioFijo(99);
    const valores: number[] = [];

    // Cuando
    for (let i = 0; i < 50; i++) valores.push(fuente.siguiente());

    // Entonces
    expect(valores).toHaveLength(50);
    for (const valor of valores) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });

  it('[A5] AleatorioGuionado repite su guion de forma cíclica', () => {
    // Dado
    const fuente = new AleatorioGuionado([0.25, 0.5, 0.75]);

    // Cuando
    const valores = [
      fuente.siguiente(),
      fuente.siguiente(),
      fuente.siguiente(),
      fuente.siguiente(),
      fuente.siguiente()
    ];

    // Entonces
    expect(valores).toEqual([0.25, 0.5, 0.75, 0.25, 0.5]);
  });

  it('[A5] AleatorioGuionado con un único valor es una fuente constante en [0, 1)', () => {
    // Dado
    const fuente = new AleatorioGuionado([0.5]);

    // Cuando
    const valores = [fuente.siguiente(), fuente.siguiente(), fuente.siguiente()];

    // Entonces
    expect(valores).toEqual([0.5, 0.5, 0.5]);
    for (const valor of valores) expect(valor).toBeLessThan(1);
  });

  it('[A5] barajar es reproducible con la misma fuente y la misma semilla', () => {
    // Dado
    const original = [1, 2, 3, 4, 5];

    // Cuando
    const primeraVuelta = barajar(original, new AleatorioFijo(7));
    const segundaVuelta = barajar(original, new AleatorioFijo(7));

    // Entonces
    expect(primeraVuelta).toEqual(segundaVuelta);
  });

  it('[A5] barajar devuelve una permutación con los mismos elementos', () => {
    // Dado
    const original = [1, 2, 3, 4, 5];

    // Cuando
    const resultado = barajar(original, new AleatorioFijo(7));

    // Entonces
    expect(resultado).toHaveLength(original.length);
    expect([...resultado].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(resultado).size).toBe(original.length);
  });

  it('[A5] barajar no muta el array original', () => {
    // Dado
    const original = [1, 2, 3, 4, 5];
    const copia = [...original];

    // Cuando
    barajar(original, new AleatorioFijo(7));

    // Entonces
    expect(original).toEqual(copia);
  });

  it('[A5] barajar con una fuente guionada es totalmente predecible', () => {
    // Dado: el guion fuerza los índices de intercambio de Fisher-Yates
    const fuente = new AleatorioGuionado([0]);

    // Cuando
    const resultado = barajar([1, 2, 3], fuente);

    // Entonces
    // Con `siguiente() = 0` el índice elegido es siempre 0: [1,2,3] -> [3,2,1] -> [2,3,1]
    expect(resultado).toEqual([2, 3, 1]);
  });

  it('[A5] elegirVarios devuelve exactamente la cantidad pedida, sin repetidos', () => {
    // Dado
    const fuente = new AleatorioFijo(11);

    // Cuando
    const seleccion = elegirVarios([1, 2, 3, 4, 5], 3, fuente);

    // Entonces
    expect(seleccion).toHaveLength(3);
    expect(new Set(seleccion).size).toBe(3);
    for (const item of seleccion) expect([1, 2, 3, 4, 5]).toContain(item);
  });

  it('[A5] elegirVarios nunca devuelve más elementos que los disponibles', () => {
    // Dado
    const fuente = new AleatorioFijo(3);

    // Cuando
    const seleccion = elegirVarios([1, 2], 5, fuente);

    // Entonces
    expect(seleccion).toHaveLength(2);
    expect([...seleccion].sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it('[A5] elegirVarios devuelve una lista vacía si se piden cero o menos', () => {
    // Dado
    const fuente = new AleatorioFijo(3);

    // Cuando / Entonces
    expect(elegirVarios([1, 2, 3], 0, fuente)).toEqual([]);
    expect(elegirVarios([1, 2, 3], -1, fuente)).toEqual([]);
  });

  it('[A5] elegir devuelve undefined con una colección vacía', () => {
    // Dado
    const fuente = new AleatorioFijo(5);

    // Cuando
    const item = elegir([], fuente);

    // Entonces
    expect(item).toBeUndefined();
  });

  it('[A5] elegir devuelve siempre un elemento de la colección', () => {
    // Dado
    const items = ['inti', 'killa', 'yaku'];

    // Cuando
    const item = elegir(items, new AleatorioFijo(5));

    // Entonces
    expect(items).toContain(item);
  });

  it('[A5] elegir es reproducible con la misma semilla', () => {
    // Dado
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Cuando
    const primero = elegir(items, new AleatorioFijo(123));
    const segundo = elegir(items, new AleatorioFijo(123));

    // Entonces
    expect(primero).toBe(segundo);
  });

  it('[A5] GeneradorIdSecuencial genera identificadores consecutivos y únicos', () => {
    // Dado
    const generador = new GeneradorIdSecuencial('p');

    // Cuando
    const ids = [generador.generar(), generador.generar(), generador.generar()];

    // Entonces
    expect(ids).toEqual(['p-1', 'p-2', 'p-3']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('[A5] GeneradorIdSecuencial usa el prefijo por defecto', () => {
    // Dado
    const generador = new GeneradorIdSecuencial();

    // Cuando
    const id = generador.generar();

    // Entonces
    expect(id).toBe('id-1');
  });

  it('[A5] toda FuenteAleatoria inyectada respeta el contrato [0, 1)', () => {
    // Dado
    const fuentes: FuenteAleatoria[] = [new AleatorioFijo(1), new AleatorioFijo(2026), new AleatorioGuionado([0, 0.999])];

    // Cuando / Entonces
    for (const fuente of fuentes) {
      for (let i = 0; i < 20; i++) {
        const valor = fuente.siguiente();
        expect(valor).toBeGreaterThanOrEqual(0);
        expect(valor).toBeLessThan(1);
      }
    }
  });
});
