# UNIVERSIDAD PRIVADA DOMINGO SAVIO
## FACULTAD DE INGENIERIA - CARRERA DE INGENIERIA EN SISTEMAS
### ASIGNATURA: INGENIERIA DE SOFTWARE I (SANTA CRUZ)

# TAREAS VARIAS DE INVESTIGACION Y LABORATORIO EN JAVA
Docente: Ing. Jimmy Nataniel Requena Llorentty
Estudiantes:
- Jhoel Alvaro Cruz Zurita
- Emmanuel Ponce Quiroga
Fecha: 28 de septiembre de 2026
Santa Cruz de la Sierra, Bolivia

---

## INDICE GENERAL

1. [Investigacion PCI DSS v4.0](#1-investigacion-pci-dss-v40)
2. [Investigacion IEEE 1016 y SDD](#2-investigacion-ieee-1016-y-sdd)
3. [Tokenizacion del PAN](#3-tokenizacion-del-pan)
4. [Codigo de Seguridad CVV y su Proteccion](#4-codigo-de-seguridad-cvv-y-su-proteccion)
5. [HMAC-SHA-256](#5-hmac-sha-256)
6. [Que Significa el 256 en SHA-256](#6-que-significa-el-256-en-sha-256)
7. [Modulo de Seguridad de Hardware (HSM)](#7-modulo-de-seguridad-de-hardware-hsm)
8. [Enmascaramiento de Datos en Logs](#8-enmascaramiento-de-datos-en-logs)
9. [Diferencias entre Anonimizacion, Tokenizacion, Enmascaramiento y Hash](#9-diferencias-entre-anonimizacion-tokenizacion-enmascaramiento-y-hash)
10. [Programa en Java y Prueba Unitaria con JUnit](#10-programa-en-java-y-prueba-unitaria-con-junit)
11. [Referencias Bibliograficas](#11-referencias-bibliograficas)

---

## 1. Investigacion PCI DSS v4.0

### Que es PCI DSS
PCI DSS significa Payment Card Industry Data Security Standard (Estandar de Seguridad de Datos para la Industria de Tarjetas de Pago). Es un conjunto de normas de seguridad creado en 2004 por las principales franquicias de tarjetas (Visa, MasterCard, American Express, Discover y JCB). Su objetivo principal es evitar fraudes y proteger la informacion de las tarjetas cuando se procesan, transmiten o guardan en cualquier sistema informatico.

### Que significa el cumplimiento de PCI DSS 4.0
La version 4.0 es la actualizacion oficial del estandar que reemplazo a la version 3.2.1. Cumplir con la version 4.0 significa que la empresa no solo aplica una lista fija de verificacion una vez al ano, sino que mantiene una seguridad continua basada en la evaluacion constante de riesgos. Ademas, exige controles de autenticacion mas fuertes (como autenticacion multifactor obligatoria en accesos administrativos), mayor proteccion contra ataques web en las pantallas de pago y verificacion constante de que los datos no se fuguen.

### Requisitos clave relacionados con el diseno del software
En el diseno de un sistema, los requisitos mas importantes de PCI DSS v4.0 son:

* Requisito 3.3.1: Prohibicion absoluta de guardar datos sensibles de autenticacion despues de procesar el pago. Esto significa que el codigo de seguridad (CVV) nunca se puede almacenar en la base de datos ni en archivos temporales, ni siquiera aunque este cifrado.
* Requisito 3.4: El numero de tarjeta (PAN) debe mostrarse siempre enmascarado cuando aparezca en pantallas, recibos o archivos de registro (logs).
* Requisito 3.5: Si el numero de tarjeta se llega a guardar, debe ser totalmente ilegible mediante tokenizacion o cifrado fuerte con llaves seguras.
* Requisito 3.6 y 3.7: Las llaves que se usen para cifrar deben administrarse con procedimientos formales y resguardarse en modulos seguros, no escritas en el codigo fuente.
* Requisito 4.2: Todo envio de datos por internet debe usar cifrado fuerte y protocolos modernos como TLS 1.2 o TLS 1.3.

### Como se aplica al diseno de un Payment Switch
Un Payment Switch es el componente central que recibe las peticiones de transacciones desde los puntos de venta o paginas web y las envia al banco emisor correspondiente.
Para que el diseno del switch cumpla con PCI DSS:
1. El switch no debe recibir ni manipular el numero real de tarjeta en texto plano. Debe desacoplarse mediante una interfaz de tokenizacion para que trabaje usando un token temporal.
2. El switch debe recibir el CVV solo en memoria RAM durante el segundo en que se procesa la llamada hacia el banco, y borrar esa variable de la memoria apenas reciba la respuesta.
3. Si el switch escribe logs para depurar errores, estos logs solo deben contener datos generales (como el identificador de la transaccion, el monto y la fecha), ocultando siempre los numeros centrales de la tarjeta y descartando totalmente el CVV.

---

## 2. Investigacion IEEE 1016 y SDD

### Que significa IEEE 1016
IEEE 1016 es el estandar oficial de la IEEE titulado "Standard for Information Technology - Systems Design - Software Design Descriptions". Es la norma internacional que define la estructura y el contenido que debe tener un documento de diseno de software.

### Que es un SDD y para que sirve
Un SDD (Software Design Description o Descripcion del Diseno de Software) es el documento tecnico donde se detalla la arquitectura, los componentes, las clases, las bases de datos y los flujos de un sistema antes de empezar a programarlo a fondo.
* Sirve como el plano de construccion para los programadores, evitando que cada desarrollador programe segun su propia interpretacion.
* Sirve al equipo de pruebas (QA) para saber exactamente que entradas y salidas deben verificar.
* Sirve para el mantenimiento futuro, permitiendo que cualquier nuevo integrante del equipo entienda la estructura del software sin tener que descifrar miles de lineas de codigo.

### Como se aplica al diseno y documentacion del sistema
El estandar IEEE 1016 organiza la documentacion por puntos de vista tecnicos:
* Vista de Arquitectura: Muestra las capas fisicas y logicas (por ejemplo, cliente web, servicios en la nube y servidores propios).
* Vista Estructural: Presenta los diagramas de clases, detallando atributos con sus tipos de datos, visibilidad y metodos, ademas de justificar tecnicamente las relaciones (por que se uso composicion, agregacion o dependencia).
* Vista Dinamica: Muestra diagramas de secuencia y maquinas de estados que explican el orden en que se comunican los componentes paso a paso.
* Vista de Persistencia: Define el modelo de datos (tablas o colecciones) y las reglas de integridad.

---

## 3. Tokenizacion del PAN

### Que es el PAN (Primary Account Number)
El PAN es el numero principal de la tarjeta de credito o debito, que normalmente tiene 16 digitos (aunque puede variar entre 15 y 19 digitos segun la franquicia).
Su estructura se divide en tres partes:
* Los primeros 6 u 8 digitos representan el BIN o IIN, que identifica a la marca (por ejemplo 4 para Visa, 5 para Mastercard) y al banco emisor.
* Los digitos del medio representan la cuenta individual del cliente.
* El ultimo digito es un numero de control calculado mediante la formula matematica del algoritmo de Luhn.

### Que es la tokenizacion
La tokenizacion es una tecnica de seguridad que reemplaza el numero real de la tarjeta (PAN) por un codigo sustituto llamado "token". Este token se genera de forma aleatoria y no tiene ninguna relacion matematica con el numero original.
Esto significa que si un atacante logra robar una base de datos llena de tokens, no puede descifrar ni deducir el numero de tarjeta real porque no existe una clave matematica para revertirlo; solo el sistema de tokenizacion (que esta resguardado en un servidor cerrado) conoce la tabla de correspondencia.

### Por que el numero real de tarjeta no debe persistirse en texto claro
Guardar el PAN en texto claro en una base de datos, en un archivo de texto o en cookies es una falta grave que incumple PCI DSS. Si el servidor sufre un ataque de inyeccion SQL, un robo de respaldo o una fuga de credenciales, los atacantes tendrian los numeros listos para hacer compras por internet, lo que provoca clonaciones, perdidas de dinero y sanciones legales directas a la institucion.

### Uso de un token de vida corta
Un token de vida corta es un token que tiene un tiempo limite de validez (por ejemplo, 10 o 15 minutos, o valido para una unica transaccion).
Se usa para reducir la ventana de riesgo: si una persona malintencionada logra interceptar la comunicacion y capturar el token, para el momento en que intente usarlo el token ya habra caducado y el sistema lo rechazara de inmediato.

---

## 4. Codigo de Seguridad CVV y su Proteccion

### Que es el codigo de seguridad de la tarjeta (CVV/CVC)
Es un codigo numerico de 3 digitos (o 4 digitos en American Express) que viene impreso en la parte posterior de la tarjeta (o al frente en Amex). Segun la marca se le conoce como CVV2 (Visa), CVC2 (MasterCard) o CID (American Express).
Su objetivo es validar que el usuario que esta haciendo una compra por internet o por telefono realmente tiene la tarjeta fisica en la mano, y que no esta usando simplemente una lista de numeros robados. Este dato no se guarda en la banda magnetica ni en el chip.

### Como se debe proteger
Bajo el Requisito 3.3.1 de PCI DSS, la regla es categorica:
1. Esta completamente prohibido guardar el CVV una vez completada la autorizacion del pago.
2. No se puede guardar en bases de datos, no se puede guardar en archivos de texto, no se puede guardar en memoria cache y tampoco se puede guardar en copias de seguridad.
3. Esta prohibido guardarlo incluso si esta cifrado.
4. En el codigo, el CVV solo debe existir como una variable temporal en la memoria RAM mientras viaja el mensaje hacia el banco, y debe eliminarse de inmediato una vez recibida la respuesta.

---

## 5. HMAC-SHA-256

### Que es HMAC y que es SHA-256
* HMAC significa Hash-based Message Authentication Code (Codigo de Autenticacion de Mensajes basado en Hash). Es un metodo que combina una funcion hash con una clave secreta para verificar tanto la integridad del dato (que no haya sido modificado) como su autenticidad (que fue generado por alguien que conoce la clave secreta).
* SHA-256 es una funcion matematica que pertenece a la familia SHA-2. Toma un texto o archivo de cualquier longitud y genera un resultado unico de 256 bits.

### Por que se utiliza SHA-256
Se utiliza porque es un algoritmo extremadamente seguro y probado mundialmente:
* Es unidireccional: es muy facil calcular el hash a partir del dato, pero es matematicamente imposible obtener el dato original a partir del hash.
* Resistencia a colisiones: no es posible encontrar dos mensajes diferentes que generen exactamente el mismo resultado hash.
* Efecto avalancha: con solo cambiar una letra o un espacio en la entrada, mas de la mitad del hash resultante cambia por completo.

### Que significa que tenga una clave secreta (HMAC-SHA-256 con clave)
Un hash normal siempre da el mismo resultado para el mismo texto. Por ejemplo, cualquiera puede calcular el hash de "123". Como los codigos CVV solo van del 000 al 999 (mil combinaciones), un atacante podria calcular los mil hashes en un segundo y saber a que numero corresponde cada uno.
Al usar HMAC con una clave secreta, el calculo incluye una clave que solo el sistema conoce. Sin esa clave secreta, un atacante no puede generar el hash correcto ni comparar con listas precalculadas, bloqueando ataques de diccionario.

### Por que el valor original no se reconstruye ni se almacena
Porque una funcion hash funciona como un triturador matematico: comprime la informacion de entrada mediante operaciones de rotacion de bits y sumas modulares. Al haber perdida deliberada de informacion en el proceso de resumen, no existe ninguna formula, clave privada o procedimiento matematico que permita "deshacer" el hash para recuperar el dato original.

---

## 6. Que Significa el 256 en SHA-256

### Determinar que representa el numero 256
El numero 256 representa la longitud exacta del resultado del hash expresada en bits.

### Aclaracion de bits, bytes y caracteres
* En bits: el resultado tiene exactamente 256 bits (unos y ceros).
* En bytes: sabiendo que un byte tiene 8 bits, dividimos 256 entre 8:
  256 bits / 8 = 32 bytes de datos binarios.
* En caracteres hexadecimales: como los humanos no leemos bytes binarios directamente, cada byte se representa con dos caracteres hexadecimales (usando numeros del 0 al 9 y letras de la a a la f). Multiplicamos:
  32 bytes * 2 = 64 caracteres hexadecimales.

### Explicar el tamano del resultado del hash
El resultado de SHA-256 siempre tiene un tamano fijo de 256 bits (32 bytes / 64 caracteres hex).
No importa si se procesa una palabra corta de 3 letras o un archivo pesado de 5 gigabytes: la salida siempre medira exactamente 64 caracteres en formato hexadecimal.

---

## 7. Modulo de Seguridad de Hardware (HSM)

### Que significa HSM y para que sirve
HSM significa Hardware Security Module (Modulo de Seguridad de Hardware). Es un dispositivo fisico especializado (como una tarjeta electronica blindada conectada a un servidor o un equipo de red independiente) creado especificamente para resguardar llaves criptograficas y realizar operaciones de cifrado a gran velocidad.

### Como protege claves y operaciones criptograficas
* Aislamiento seguro: Las llaves maestras se generan dentro del propio chip del HSM y nunca salen a la memoria RAM del servidor web ni del sistema operativo. Esto evita que un virus o un administrador del sistema pueda copiar las llaves.
* Proteccion fisica contra manipulacion: El dispositivo cuenta con sensores internos de presion, temperatura y luz. Si alguien intenta abrir la caja del HSM o taladrar el chip para conectar sondas, el circuito activa un borrado de emergencia inmediato (llamado Zeroization), destruyendo las llaves en cuestion de microsegundos antes de que puedan ser leidas.

### Como se integraria en el diseno del sistema
En el diseno de software no se programa el chip directamente; se utiliza una clase de servicio intermediaria (por ejemplo, CryptoHSMService) que se conecta con el dispositivo usando interfaces estandar de la industria como PKCS#11 o APIs seguras.
Cuando el sistema necesita guardar un numero de tarjeta de forma segura, le envia el numero al HSM; el HSM lo cifra internamente usando algoritmos de preservacion de formato (FPE) y devuelve la tarjeta ya cifrada, sin que la llave haya salido del chip en ningun momento.

---

## 8. Enmascaramiento de Datos en Logs

### Por que no debe aparecer el PAN completo en los logs
Los archivos de logs o trazas de depuracion suelen guardarse en texto simple para que los desarrolladores y el equipo de soporte puedan revisar errores del sistema. Ademas, estos logs se copian a herramientas de monitoreo en la nube.
Si en esos archivos se imprime el numero de tarjeta completo, cualquier persona con acceso a los logs podria ver las tarjetas de los clientes. Ademas, las normas PCI DSS obligarian a auditar con maximo rigor cada servidor y herramienta que reciba esos logs, encareciendo enormemente la operacion y aumentando el riesgo de filtraciones masivas.

### Ejemplo de informacion sensible enmascarada
* Numero real de tarjeta: 4552 8765 4321 9012
* Numero enmascarado para pantallas y logs: 4552********9012

### Que informacion puede mostrarse y cual debe ocultarse (PCI DSS Req. 3.4)
* Informacion que si se puede mostrar:
  1. Los primeros 6 digitos (sirven para identificar que banco emitio la tarjeta).
  2. Los ultimos 4 digitos (sirven para que el cliente identifique su compra en el recibo).
  3. La fecha, la hora, el codigo unico de transaccion y el estado (aprobado o rechazado).
* Informacion que esta prohibido registrar o mostrar:
  1. Los digitos del medio de la tarjeta (posiciones del 7 al 12).
  2. El codigo de seguridad CVV (bajo ningun motivo).
  3. El PIN del cajero automatico.
  4. La fecha completa de vencimiento cuando este junto al numero de tarjeta.

---

## 9. Diferencias entre Anonimizacion, Tokenizacion, Enmascaramiento y Hash

Para comprender cuando usar cada tecnica en el diseno de software, se presenta el siguiente cuadro comparativo:

| Mecanismo | Que es | Es Reversible? | Mantiene Formato? | Caso de Uso Tipico |
|---|---|---|---|---|
| Tokenizacion | Reemplaza el dato real por un codigo sustituto aleatorio sin valor matematico. | Si, pero solo dentro del servidor seguro de tokenizacion. | Si, puede mantener 16 digitos como la tarjeta original. | Para cobrar suscripciones mensuales o enviar referencias entre modulos sin exponer la tarjeta real. |
| Enmascaramiento | Tapa una parte fija de los digitos usando asteriscos u otros simbolos. | No, los digitos ocultos simplemente no se muestran. | Si, conserva la apariencia visual del dato. | Para recibos impresos, pantallas de confirmacion de compra y logs del sistema. |
| Hash / HMAC | Aplica una formula matematica de reduccion para generar una huella digital unica. | No, es totalmente irreversible por definicion. | No, siempre genera una cadena fija de caracteres (como 64 caracteres en SHA-256). | Para guardar contrasenas en bases de datos o para validar la integridad del CVV en memoria. |
| Anonimizacion | Elimina o transforma los datos para que sea imposible asociarlos a una persona real. | No, es permanente e irreversible. | No necesariamente. | Para generar estadisticas academicas, reportes generales o compartir datos abiertos sin violar la privacidad. |

---

## 10. Programa en Java y Prueba Unitaria con JUnit

A continuacion se presenta el codigo fuente del modulo solicitado y su correspondiente prueba unitaria en Java, siguiendo el caso de prueba indicado por el docente:
* Valor base: 100.0
* Descuento: 10.0
* Resultado esperado: 90.0

### 10.1 Codigo Fuente del Modulo: CalculadoraDescuento.java

```java
package bo.edu.upds.software;

/**
 * Modulo sencillo para el calculo de descuentos comerciales.
 * Desarrollado para la materia de Ingenieria de Software I en la UPDS.
 */
public class CalculadoraDescuento {

    /**
     * Calcula el precio final restando el monto de descuento al valor base.
     * 
     * @param valorBase Monto original positivo (ejemplo: 100.0)
     * @param descuento Monto a descontar (ejemplo: 10.0)
     * @return El monto final con el descuento aplicado (ejemplo: 90.0)
     * @throws IllegalArgumentException si los valores son negativos o si el descuento supera el valor
     */
    public double calcularPrecioFinal(double valorBase, double descuento) {
        if (valorBase < 0) {
            throw new IllegalArgumentException("El valor base no puede ser negativo.");
        }
        if (descuento < 0) {
            throw new IllegalArgumentException("El descuento no puede ser negativo.");
        }
        if (descuento > valorBase) {
            throw new IllegalArgumentException("El descuento no puede ser mayor que el valor base.");
        }

        return valorBase - descuento;
    }
}
```

### 10.2 Codigo Fuente de la Prueba Unitaria: CalculadoraDescuentoTest.java

```java
package bo.edu.upds.software;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Prueba unitaria con JUnit 5 para verificar el modulo CalculadoraDescuento.
 * Aplica el patron estandar AAA (Arrange, Act, Assert).
 */
public class CalculadoraDescuentoTest {

    private CalculadoraDescuento calculadora;

    @BeforeEach
    void setUp() {
        // Inicializamos el objeto antes de cada prueba
        calculadora = new CalculadoraDescuento();
    }

    @Test
    @DisplayName("Debe retornar 90.0 cuando el valor es 100.0 y el descuento es 10.0")
    void testCalcularDescuentoExitosoCasoDocente() {
        // 1. Arrange: Preparamos los datos solicitados por el docente
        double valorBase = 100.0;
        double descuento = 10.0;
        double resultadoEsperado = 90.0;

        // 2. Act: Ejecutamos el metodo de la clase
        double resultadoObtenido = calculadora.calcularPrecioFinal(valorBase, descuento);

        // 3. Assert: Comprobamos que el resultado sea exactamente 90.0
        assertEquals(resultadoEsperado, resultadoObtenido, 0.0001,
            "El calculo del descuento debe devolver exactamente 90.0");
    }

    @Test
    @DisplayName("Debe lanzar excepcion si el descuento es mayor al valor base")
    void testDescuentoMayorAlValorLanzaExcepcion() {
        // Arrange: Datos donde el descuento supera el precio
        double valorBase = 50.0;
        double descuentoInvalido = 70.0;

        // Act y Assert: Verificamos que el sistema no permita valores negativos
        assertThrows(IllegalArgumentException.class, () -> {
            calculadora.calcularPrecioFinal(valorBase, descuentoInvalido);
        }, "El sistema debe bloquear descuentos que superen el valor original.");
    }
}
```

### 10.3 Guia de Explicacion y Defensa del Test

Puntos clave para explicar el codigo al docente:

1. Patron AAA (Arrange, Act, Assert):
   * Arrange (Preparar): Se declaran las variables de entrada (`valorBase = 100.0`, `descuento = 10.0`, `resultadoEsperado = 90.0`).
   * Act (Ejecutar): Se llama a la funcion `calcularPrecioFinal`.
   * Assert (Verificar): Se usa `assertEquals` para comparar el resultado obtenido contra el esperado.

2. Por que se usa un delta (0.0001) en numeros decimales (double):
   En Java y en las computadoras en general, los numeros con decimales flotantes pueden tener pequenos desajustes de redondeo en los ultimos decimales binarios. El tercer parametro (0.0001) le indica a JUnit el margen de tolerancia permitido para considerar que dos numeros reales son iguales.

3. Pruebas de casos limite y excepciones:
   Un buen desarrollador no solo prueba que el calculo de 90 funcione (el camino feliz), sino que prueba que el sistema sea seguro ante entradas invalidas. Por eso agregamos una segunda prueba con `assertThrows` que confirma que el sistema rechaza descuentos que sean mayores al precio del producto.

---

## 11. Referencias Bibliograficas

* IEEE Computer Society. (2009). IEEE Std 1016-2009: IEEE Standard for Information Technology - Systems Design - Software Design Descriptions. IEEE.
* National Institute of Standards and Technology. (2015). Secure Hash Standard (SHS) (FIPS PUB 180-4). U.S. Department of Commerce.
* National Institute of Standards and Technology. (2002). The Keyed-Hash Message Authentication Code (HMAC) (FIPS PUB 198-1). U.S. Department of Commerce.
* PCI Security Standards Council. (2022). Payment Card Industry (PCI) Data Security Standard: Requirements and Testing Procedures v4.0. PCI SSC.
* Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner's approach (9na ed.). McGraw-Hill.
