import { describe, expect, it, vi } from 'vitest';
import { AutenticacionError, ValidacionError } from '@domain/errores';
import {
  AlmacenTokensLocal,
  ServidorIdentidadSimulado
} from '@infrastructure/auth';
import { AlmacenMemoria } from '@infrastructure/persistence/local-storage';
import { SesionLocalAdapter } from '@infrastructure/system';
import { CerrarSesionUseCase } from '@application/use-cases/CerrarSesionUseCase';
import { IniciarSesionUseCase } from '@application/use-cases/IniciarSesionUseCase';
import { ValidarSesionUseCase } from '@application/use-cases/ValidarSesionUseCase';
import { RelojFijo, unGeneradorId } from '../../helpers';

/**
 * [RF-001] Casos de uso de autenticación con tokens y rotación de refresco (ADR-003 rev. 2).
 *
 * Pruebas de integración a nivel de aplicación:
 * 1. Iniciar sesión canjea credenciales, verifica el token y sincroniza el perfil local.
 * 2. Validar sesión reconoce el token vigente y ROTA el token de refresco cuando el acceso vence.
 * 3. Cerrar sesión revoca el refresco, limpia los tokens y vuelve al perfil de invitado.
 */

function crearEntornoAuth(fechaInicio = '2026-09-30T10:00:00.000Z') {
  const reloj = new RelojFijo(fechaInicio);
  const generadorId = unGeneradorId('auth');
  const almacen = new AlmacenMemoria();
  const servidor = new ServidorIdentidadSimulado({
    reloj,
    generadorId,
    almacen
  });
  const tokens = new AlmacenTokensLocal(almacen);
  const sesion = new SesionLocalAdapter(generadorId);

  const iniciarSesion = new IniciarSesionUseCase(servidor, tokens, sesion);
  const validarSesion = new ValidarSesionUseCase(servidor, tokens, sesion, reloj, generadorId);
  const cerrarSesion = new CerrarSesionUseCase(servidor, tokens, sesion, generadorId);

  return { reloj, servidor, tokens, sesion, iniciarSesion, validarSesion, cerrarSesion };
}

describe('[RF-001] Casos de uso de autenticación', () => {
  describe('IniciarSesionUseCase', () => {
    it('[RF-001] rechaza credenciales con usuario o contraseña vacíos', async () => {
      // Dado el caso de uso
      const { iniciarSesion } = crearEntornoAuth();

      // Cuando se envían campos vacíos
      await expect(
        iniciarSesion.ejecutar({ usuario: '', contrasena: 'yapu2026' })
      ).rejects.toBeInstanceOf(ValidacionError);

      await expect(
        iniciarSesion.ejecutar({ usuario: 'docente', contrasena: '' })
      ).rejects.toBeInstanceOf(ValidacionError);
    });

    it('[RF-001] rechaza credenciales incorrectas con AutenticacionError', async () => {
      // Dado el caso de uso
      const { iniciarSesion } = crearEntornoAuth();

      // Cuando la contraseña no coincide
      await expect(
        iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'clave-erronea' })
      ).rejects.toBeInstanceOf(AutenticacionError);
    });

    it('[RF-001] inicia sesión con éxito, guarda tokens y sincroniza el perfil con rol docente', async () => {
      // Dado un entorno limpio sin sesión
      const { iniciarSesion, tokens, sesion } = crearEntornoAuth();

      // Cuando el docente inicia sesión
      const resultado = await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      // Entonces el DTO devuelve la identidad y el rol docente
      expect(resultado.nombre).toBe('Docente Mamani');
      expect(resultado.rol).toBe('docente');
      expect(resultado.esDocente).toBe(true);
      expect(resultado.refrescado).toBe(false);

      // Y los tokens quedaron guardados en el almacén
      const guardado = await tokens.leer();
      expect(guardado).not.toBeNull();
      expect(guardado?.tokenAcceso).toBeDefined();
      expect(guardado?.tokenRefresco).toBeDefined();

      // Y el adaptador de sesión refleja el nuevo usuario y rol
      const perfil = await sesion.obtener();
      expect(perfil.rol).toBe('docente');
      expect(perfil.nombre).toBe('Docente Mamani');
    });

    it('[RF-001] inicia sesión como estudiante con rol estudiante', async () => {
      // Dado el caso de uso
      const { iniciarSesion, sesion } = crearEntornoAuth();

      // Cuando un estudiante inicia sesión
      const resultado = await iniciarSesion.ejecutar({ usuario: 'estudiante', contrasena: 'yapu2026' });

      // Entonces el perfil y el DTO corresponden a estudiante
      expect(resultado.rol).toBe('estudiante');
      expect(resultado.esDocente).toBe(false);
      expect((await sesion.obtener()).rol).toBe('estudiante');
    });
  });

  describe('ValidarSesionUseCase y Rotación de Refresh Token', () => {
    it('[RF-001] devuelve null cuando no hay ningún token guardado (invitado)', async () => {
      // Dado un cliente sin tokens
      const { validarSesion } = crearEntornoAuth();

      // Cuando se valida la sesión
      const resultado = await validarSesion.ejecutar();

      // Entonces es invitado
      expect(resultado).toBeNull();
    });

    it('[RF-001] valida token de acceso vigente sin necesidad de renovar', async () => {
      // Dado un usuario con sesión recién iniciada
      const { iniciarSesion, validarSesion } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      // Cuando se valida a los 10 segundos
      const resultado = await validarSesion.ejecutar();

      // Entonces sigue vigente y no se rotó el token de refresco
      expect(resultado).not.toBeNull();
      expect(resultado?.esDocente).toBe(true);
      expect(resultado?.refrescado).toBe(false);
    });

    it('[RF-001] ROTA el token de refresco automáticamente cuando el acceso está por vencer o vencido', async () => {
      // Dado un docente logueado a las 10:00:00 (token de acceso dura 120s)
      const { iniciarSesion, validarSesion, tokens, reloj } = crearEntornoAuth('2026-09-30T10:00:00.000Z');
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      const parInicial = await tokens.leer();
      expect(parInicial).not.toBeNull();

      // Cuando avanzan 110 segundos (quedan 10s para vencer, entra en el margen de renovación de 15s)
      reloj.avanzarSegundos(110);
      const resultado = await validarSesion.ejecutar();

      // Entonces la sesión se renueva exitosamente marcando refrescado: true
      expect(resultado).not.toBeNull();
      expect(resultado?.refrescado).toBe(true);
      expect(resultado?.esDocente).toBe(true);

      // Y en el almacén el par de tokens fue ROTADO (nuevo token de acceso y nuevo refresh token)
      const parNuevo = await tokens.leer();
      expect(parNuevo?.tokenAcceso).not.toBe(parInicial?.tokenAcceso);
      expect(parNuevo?.tokenRefresco).not.toBe(parInicial?.tokenRefresco);
    });

    it('[RF-001] forzarRefresco rota el token aunque el acceso esté vigente', async () => {
      // Dado un usuario con token recién creado
      const { iniciarSesion, validarSesion, tokens } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });
      const primerRefresco = (await tokens.leer())?.tokenRefresco;

      // Cuando se solicita forzar refresco (ej. botón en la UI)
      const resultado = await validarSesion.ejecutar({ forzarRefresco: true });

      // Entonces se emite un nuevo par rotado
      expect(resultado?.refrescado).toBe(true);
      const segundoRefresco = (await tokens.leer())?.tokenRefresco;
      expect(segundoRefresco).not.toBe(primerRefresco);
    });

    it('[RF-001] ante un refresh token revocado o corrupto, descarta tokens y vuelve a invitado', async () => {
      // Dado un par de tokens con refresco alterado
      const { validarSesion, tokens } = crearEntornoAuth();
      await tokens.guardar({
        tokenAcceso: 'token-invalido',
        tokenRefresco: 'refresco-invalido',
        expiraAccesoEn: Date.now() - 1000,
        expiraRefrescoEn: Date.now() + 100000
      });

      // Cuando se valida
      const resultado = await validarSesion.ejecutar();

      // Entonces descarta los tokens y devuelve null (invitado)
      expect(resultado).toBeNull();
      expect(await tokens.leer()).toBeNull();
    });

    it('[RF-001] si verificarAcceso detecta firma inválida o token manipulado, descarta la sesión', async () => {
      const { iniciarSesion, validarSesion, servidor, tokens, sesion } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      vi.spyOn(servidor, 'verificarAcceso').mockRejectedValueOnce(
        new AutenticacionError('Firma manipulada', 'TOKEN_INVALIDO')
      );

      const resultado = await validarSesion.ejecutar();
      expect(resultado).toBeNull();
      expect(await tokens.leer()).toBeNull();
      expect((await sesion.obtener()).rol).toBe('estudiante');
    });

    it('[RF-001] si verificarAcceso lanza TOKEN_EXPIRADO antes del margen local, procede al refresco', async () => {
      const { iniciarSesion, validarSesion, servidor } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      const verificarOriginal = servidor.verificarAcceso.bind(servidor);
      let primeraLlamada = true;
      vi.spyOn(servidor, 'verificarAcceso').mockImplementation(async (token) => {
        if (primeraLlamada) {
          primeraLlamada = false;
          throw new AutenticacionError('Token expirado en servidor', 'TOKEN_EXPIRADO');
        }
        return verificarOriginal(token);
      });

      const resultado = await validarSesion.ejecutar();
      expect(resultado).not.toBeNull();
      expect(resultado?.refrescado).toBe(true);
    });

    it('[RF-001] propaga errores no controlados lanzados por verificarAcceso', async () => {
      const { iniciarSesion, validarSesion, servidor } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      vi.spyOn(servidor, 'verificarAcceso').mockRejectedValueOnce(
        new Error('Fallo de almacenamiento remoto')
      );

      await expect(validarSesion.ejecutar()).rejects.toThrow('Fallo de almacenamiento remoto');
    });

    it('[RF-001] propaga errores no controlados lanzados por refrescar', async () => {
      const { iniciarSesion, validarSesion, servidor, reloj } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });
      reloj.avanzarSegundos(115);

      vi.spyOn(servidor, 'refrescar').mockRejectedValueOnce(
        new Error('Fallo crítico del servicio de tokens')
      );

      await expect(validarSesion.ejecutar()).rejects.toThrow('Fallo crítico del servicio de tokens');
    });
  });

  describe('CerrarSesionUseCase', () => {
    it('[RF-001] cierra sesión: borra tokens locales, revoca la sesión y resetea a invitado', async () => {
      // Dado un docente con sesión activa
      const { iniciarSesion, cerrarSesion, validarSesion, tokens, sesion } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      // Cuando cierra la sesión
      await cerrarSesion.ejecutar();

      // Entonces los tokens locales se eliminaron
      expect(await tokens.leer()).toBeNull();

      // Y validar sesión devuelve null
      expect(await validarSesion.ejecutar()).toBeNull();

      // Y el perfil local volvió a ser un estudiante anónimo
      const perfil = await sesion.obtener();
      expect(perfil.rol).toBe('estudiante');
      expect(perfil.nombre).toContain('Estudiante');
    });

    it('[RF-001] cerrar sesión sin tokens guardados resetea a invitado sin llamar al servidor', async () => {
      const { cerrarSesion, servidor, sesion } = crearEntornoAuth();
      const cerrarSpy = vi.spyOn(servidor, 'cerrarSesion');

      await cerrarSesion.ejecutar();

      expect(cerrarSpy).not.toHaveBeenCalled();
      const perfil = await sesion.obtener();
      expect(perfil.rol).toBe('estudiante');
    });

    it('[RF-001] ignora errores de autenticación si el token ya expiró o fue revocado en servidor', async () => {
      const { iniciarSesion, cerrarSesion, servidor, tokens, sesion } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      vi.spyOn(servidor, 'cerrarSesion').mockRejectedValueOnce(
        new AutenticacionError('Token ya expirado', 'TOKEN_EXPIRADO')
      );

      await expect(cerrarSesion.ejecutar()).resolves.toBeUndefined();
      expect(await tokens.leer()).toBeNull();
      expect((await sesion.obtener()).rol).toBe('estudiante');
    });

    it('[RF-001] propaga errores inesperados del servidor al intentar cerrar sesión', async () => {
      const { iniciarSesion, cerrarSesion, servidor } = crearEntornoAuth();
      await iniciarSesion.ejecutar({ usuario: 'docente', contrasena: 'yapu2026' });

      vi.spyOn(servidor, 'cerrarSesion').mockRejectedValueOnce(
        new Error('Fallo de red al revocar token')
      );

      await expect(cerrarSesion.ejecutar()).rejects.toThrow('Fallo de red al revocar token');
    });
  });
});
