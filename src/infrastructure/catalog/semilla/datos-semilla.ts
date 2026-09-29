/**
 * Corpus semilla del catálogo en su forma CRUDA (tal como se siembra y se persiste).
 *
 * Copia fiel de `src/data/seed-levels.ts` (SEED_NIVELES, SEED_VOCABULARIO,
 * SEED_ORACIONES_BASE): 10 niveles, 48 palabras y 19 oraciones. El vocabulario quechua,
 * sus traducciones y sus contextos culturales NO se han alterado.
 *
 * El archivo es autocontenido a propósito: no importa `src/data` ni `src/types` (código
 * legado en retirada), sólo los tipos crudos de `../esquemas`.
 *
 * Las oraciones del corpus original no registran fecha de creación; al proyectarlas a la
 * entidad de dominio se les asigna `FECHA_SIEMBRA_CORPUS`.
 */
import type { CorpusCrudo } from '../esquemas';

/** Fecha canónica de siembra del corpus (el corpus original no fecha cada oración). */
export const FECHA_SIEMBRA_CORPUS = '2026-01-01';

/** Corpus crudo completo: lo valida `esquemaCorpus` antes de construir las entidades. */
export const SEMILLA_CRUDA: CorpusCrudo = {
  niveles: [
    {
      id: 1,
      tituloQuechua: 'Rimaykuna',
      tituloEspanol: 'Saludos y Cortesía',
      descripcion: 'Aprende las fórmulas básicas de saludo, reciprocidad y respeto en runasimi.',
      icono: 'Sparkles',
      colorAcento: '#B94700'
    },
    {
      id: 2,
      tituloQuechua: 'Ayllu',
      tituloEspanol: 'Familia y Comunidad',
      descripcion: 'Términos de parentesco y vínculos afectivos dentro del ayllu tradicional.',
      icono: 'Users',
      colorAcento: '#F59E0B'
    },
    {
      id: 3,
      tituloQuechua: 'Yupaykuna',
      tituloEspanol: 'Números y Cantidades',
      descripcion: 'Sistema de numeración decimal quechua del 1 al 10 y expresiones de cantidad.',
      icono: 'Binary',
      colorAcento: '#0D9488'
    },
    {
      id: 4,
      tituloQuechua: 'Llimp\'ikuna',
      tituloEspanol: 'Colores y Textiles',
      descripcion: 'Los colores en el arte textil del aguayo y la naturaleza andina.',
      icono: 'Palette',
      colorAcento: '#0284C7'
    },
    {
      id: 5,
      tituloQuechua: 'Uywakuna',
      tituloEspanol: 'Animales Andinos',
      descripcion: 'Fauna silvestre y animales domésticos de la cordillera y los valles.',
      icono: 'PawPrint',
      colorAcento: '#D97706'
    },
    {
      id: 6,
      tituloQuechua: 'Mikhuna',
      tituloEspanol: 'Alimentos y Cosecha',
      descripcion: 'Frutos de la Pachamama, tubérculos, cereales y platos tradicionales.',
      icono: 'Utensils',
      colorAcento: '#B94700'
    },
    {
      id: 7,
      tituloQuechua: 'Kurku',
      tituloEspanol: 'Cuerpo y Bienestar',
      descripcion: 'Partes del cuerpo humano, sensaciones y salud comunitaria.',
      icono: 'HeartPulse',
      colorAcento: '#E11D48'
    },
    {
      id: 8,
      tituloQuechua: 'Wasinchik',
      tituloEspanol: 'La Casa y el Entorno',
      descripcion: 'El hogar andino, espacios de convivencia y objetos cotidianos.',
      icono: 'Home',
      colorAcento: '#0F766E'
    },
    {
      id: 9,
      tituloQuechua: 'Ruwaykuna',
      tituloEspanol: 'Acciones y Trabajo',
      descripcion: 'Verbos de la labor cotidiana: sembrar, cosechar, tejer y colaborar (ayni).',
      icono: 'Hammer',
      colorAcento: '#F59E0B'
    },
    {
      id: 10,
      tituloQuechua: 'Pacha',
      tituloEspanol: 'Cosmovisión y Tiempo',
      descripcion: 'Espacio-tiempo, los ciclos agrícolas y las fuerzas de la naturaleza.',
      icono: 'Sun',
      colorAcento: '#D97706'
    }
  ],
  palabras: [
    // Nivel 1: Rimaykuna
    {
      id: 'voc_1_1',
      nivelId: 1,
      termino: 'Allianllachu',
      traduccion: '¿Cómo estás? / ¿Estás bien?',
      pronunciacion: 'a-lli-an-lla-chu',
      categoria: 'saludo',
      contextoCultural: 'Fórmula clásica de cortesía quechua. Expresa genuino interés por el bienestar físico y espiritual del interlocutor.',
      ejemploUso: 'Allianllachu, masiy? (¿Estás bien, amigo?)'
    },
    {
      id: 'voc_1_2',
      nivelId: 1,
      termino: 'Allianmi',
      traduccion: 'Estoy bien',
      pronunciacion: 'a-lli-an-mi',
      categoria: 'saludo',
      contextoCultural: 'Respuesta obligada y afirmativa ante "Allianllachu", con el sufijo de certeza -mi.',
      ejemploUso: 'Allianmi kachkani (Estoy bien).'
    },
    {
      id: 'voc_1_3',
      nivelId: 1,
      termino: 'Sulpayki',
      traduccion: 'Gracias',
      pronunciacion: 'sul-pay-ki',
      categoria: 'saludo',
      contextoCultural: 'Agradecimiento sincero; en el quechua sureño boliviano se usa para reciprocidad cotidiana.',
      ejemploUso: 'Sulpayki mikhunamanta (Gracias por la comida).'
    },
    {
      id: 'voc_1_4',
      nivelId: 1,
      termino: 'Tinkunakama',
      traduccion: 'Hasta el encuentro / Hasta luego',
      pronunciacion: 'tin-ku-na-ka-ma',
      categoria: 'saludo',
      contextoCultural: 'En la cultura andina no existe el "adiós" definitivo, siempre se promete un próximo encuentro (tinku).',
      ejemploUso: 'Q\'ayankama tinkunakama (Hasta el reencuentro de mañana).'
    },
    {
      id: 'voc_1_5',
      nivelId: 1,
      termino: 'Ari',
      traduccion: 'Sí',
      pronunciacion: 'a-ri',
      categoria: 'saludo',
      contextoCultural: 'Afirmación clara y respetuosa.',
      ejemploUso: 'Ari, yachakuni (Sí, estoy aprendiendo).'
    },
    {
      id: 'voc_1_6',
      nivelId: 1,
      termino: 'Mana',
      traduccion: 'No',
      pronunciacion: 'ma-na',
      categoria: 'saludo',
      contextoCultural: 'Partícula de negación general. Suele complementarse con sufijo -chu.',
      ejemploUso: 'Mana yachanichu (No sé).'
    },

    // Nivel 2: Ayllu
    {
      id: 'voc_2_1',
      nivelId: 2,
      termino: 'Mama',
      traduccion: 'Madre',
      pronunciacion: 'ma-ma',
      categoria: 'sustantivo',
      contextoCultural: 'Pilar fundamental del hogar andino y figura de protección y sabiduría textil.',
      ejemploUso: 'Mamayqa t\'antata ruwan (Mi madre hace pan).'
    },
    {
      id: 'voc_2_2',
      nivelId: 2,
      termino: 'Tata',
      traduccion: 'Padre',
      pronunciacion: 'ta-ta',
      categoria: 'sustantivo',
      contextoCultural: 'Representa el trabajo de la tierra y la guía familiar comunitaria.',
      ejemploUso: 'Tatayqa chajrapim llamk\'an (Mi padre trabaja en la chacra).'
    },
    {
      id: 'voc_2_3',
      nivelId: 2,
      termino: 'Wawa',
      traduccion: 'Bebé / Niño pequeño',
      pronunciacion: 'wa-wa',
      categoria: 'sustantivo',
      contextoCultural: 'Término de inmenso cariño que designa a los infantes de la comunidad.',
      ejemploUso: 'Wawa puñuchkan (El bebé está durmiendo).'
    },
    {
      id: 'voc_2_4',
      nivelId: 2,
      termino: 'Jatun mama',
      traduccion: 'Abuela',
      pronunciacion: 'ja-tun ma-ma',
      categoria: 'sustantivo',
      contextoCultural: 'Literalmente "gran madre"; portadora de la memoria oral y los cantos ancestrales.',
      ejemploUso: 'Jatun mamay willakuwasqa (Mi abuela me contó una historia).'
    },
    {
      id: 'voc_2_5',
      nivelId: 2,
      termino: 'Wawqi',
      traduccion: 'Hermano (de varón a varón)',
      pronunciacion: 'waw-qi',
      categoria: 'sustantivo',
      contextoCultural: 'El quechua distingue el parentesco según el género de quien habla.',
      ejemploUso: 'Wawqiyqa llamk\'aq rin (Mi hermano va a trabajar).'
    },
    {
      id: 'voc_2_6',
      nivelId: 2,
      termino: 'Pana',
      traduccion: 'Hermana (de varón a mujer)',
      pronunciacion: 'pa-na',
      categoria: 'sustantivo',
      contextoCultural: 'Expresión de hermandad fraterna y reciprocidad.',
      ejemploUso: 'Panaywan kuska takiyku (Canto junto a mi hermana).'
    },

    // Nivel 3: Yupaykuna
    {
      id: 'voc_3_1',
      nivelId: 3,
      termino: 'Juk',
      traduccion: 'Uno (1)',
      pronunciacion: 'juk',
      categoria: 'numero',
      contextoCultural: 'Representa la unidad y el inicio de los ciclos.',
      ejemploUso: 'Juk ch\'aska cielopi k\'ancharin (Una estrella brilla en el cielo).'
    },
    {
      id: 'voc_3_2',
      nivelId: 3,
      termino: 'Iskay',
      traduccion: 'Dos (2)',
      pronunciacion: 'is-kay',
      categoria: 'numero',
      contextoCultural: 'Dualidad andina complementaria (Yanantin), hombre-mujer, sol-luna.',
      ejemploUso: 'Iskay allqokuna pukllachkanku (Dos perros están jugando).'
    },
    {
      id: 'voc_3_3',
      nivelId: 3,
      termino: 'Kimsa',
      traduccion: 'Tres (3)',
      pronunciacion: 'kim-sa',
      categoria: 'numero',
      contextoCultural: 'Los tres mundos de la cosmovisión: Hanan Pacha, Kay Pacha y Uku Pacha.',
      ejemploUso: 'Kimsa urpikuna phawanku (Tres palomas vuelan).'
    },
    {
      id: 'voc_3_4',
      nivelId: 3,
      termino: 'Tawa',
      traduccion: 'Cuatro (4)',
      pronunciacion: 'ta-wa',
      categoria: 'numero',
      contextoCultural: 'Base de las 4 direcciones del Tawantinsuyu y los 4 brazos de la Chakana.',
      ejemploUso: 'Tawa suyukuna kanku (Son cuatro regiones).'
    },
    {
      id: 'voc_3_5',
      nivelId: 3,
      termino: 'Phichqa',
      traduccion: 'Cinco (5)',
      pronunciacion: 'phich-qa',
      categoria: 'numero',
      contextoCultural: 'Los cinco dedos de la mano con la que se trabaja la tierra.',
      ejemploUso: 'Phichqa t\'antakunata rantini (Compro cinco panes).'
    },
    {
      id: 'voc_3_6',
      nivelId: 3,
      termino: 'Chunka',
      traduccion: 'Diez (10)',
      pronunciacion: 'chun-ka',
      categoria: 'numero',
      contextoCultural: 'Culminación de la decena; base del conteo en quipus.',
      ejemploUso: 'Chunka watayoq kani (Tengo diez años).'
    },

    // Nivel 4: Llimp'ikuna
    {
      id: 'voc_4_1',
      nivelId: 4,
      termino: 'Puka',
      traduccion: 'Rojo',
      pronunciacion: 'pu-ka',
      categoria: 'adjetivo',
      contextoCultural: 'El color de la flor de cantuta y la fuerza de la sangre de la tierra.',
      ejemploUso: 'Puka pollerata sirani (Coso una pollera roja).'
    },
    {
      id: 'voc_4_2',
      nivelId: 4,
      termino: 'Q\'illu',
      traduccion: 'Amarillo',
      pronunciacion: 'q\'i-llu',
      categoria: 'adjetivo',
      contextoCultural: 'El color del Inti (sol) y del maíz maduro listo para la cosecha.',
      ejemploUso: 'Q\'illu sara tarpusqa (Maíz amarillo sembrado).'
    },
    {
      id: 'voc_4_3',
      nivelId: 4,
      termino: 'Anqas',
      traduccion: 'Azul',
      pronunciacion: 'an-qas',
      categoria: 'adjetivo',
      contextoCultural: 'El color del cielo andino despejado y las aguas del lago sagrado.',
      ejemploUso: 'Anqas ch\'ulluta awani (Tejo un chullo azul).'
    },
    {
      id: 'voc_4_4',
      nivelId: 4,
      termino: 'Q\'umir',
      traduccion: 'Verde',
      pronunciacion: 'q\'u-mir',
      categoria: 'adjetivo',
      contextoCultural: 'La esperanza del pasto fresco para las alpacas tras las lluvias.',
      ejemploUso: 'Q\'umir qhuchapi kachkanku (Están en la laguna verde).'
    },
    {
      id: 'voc_4_5',
      nivelId: 4,
      termino: 'Yuraq',
      traduccion: 'Blanco',
      pronunciacion: 'yu-raq',
      categoria: 'adjetivo',
      contextoCultural: 'La nieve perpetua de los nevados tutelares (Achachilas).',
      ejemploUso: 'Yuraq rit\'i urqupi tiyan (Hay nieve blanca en el cerro).'
    },
    {
      id: 'voc_4_6',
      nivelId: 4,
      termino: 'Yana',
      traduccion: 'Negro',
      pronunciacion: 'ya-na',
      categoria: 'adjetivo',
      contextoCultural: 'El color de la noche profunda y la fertilidad de la tierra negra.',
      ejemploUso: 'Yana allpa sumaq tarpunapaq (Tierra negra excelente para sembrar).'
    },

    // Nivel 5: Uywakuna
    {
      id: 'voc_5_1',
      nivelId: 5,
      termino: 'Allqo',
      traduccion: 'Perro',
      pronunciacion: 'all-qo',
      categoria: 'sustantivo',
      contextoCultural: 'Compañero leal del pastor andino y guardián del hogar.',
      ejemploUso: 'Allqoyqa wasita qhawapan (Mi perro cuida la casa).'
    },
    {
      id: 'voc_5_2',
      nivelId: 5,
      termino: 'Misi',
      traduccion: 'Gato',
      pronunciacion: 'mi-si',
      categoria: 'sustantivo',
      contextoCultural: 'Protege las despensas de chuño y maíz de los roedores.',
      ejemploUso: 'Misiqa intipim q\'oñikuchkan (El gato se calienta al sol).'
    },
    {
      id: 'voc_5_3',
      nivelId: 5,
      termino: 'Kuntur',
      traduccion: 'Cóndor',
      pronunciacion: 'kun-tur',
      categoria: 'sustantivo',
      contextoCultural: 'Mensajero divino del Hanan Pacha y símbolo de libertad andina.',
      ejemploUso: 'Jatun kuntur urqukunapi phawan (El gran cóndor vuela en los cerros).'
    },
    {
      id: 'voc_5_4',
      nivelId: 5,
      termino: 'Llama',
      traduccion: 'Llama',
      pronunciacion: 'lla-ma',
      categoria: 'sustantivo',
      contextoCultural: 'Animal emblemático del altiplano, provee lana, abono y transporte.',
      ejemploUso: 'Llamakuna ichhuta mikhunku (Las llamas comen paja brava).'
    },
    {
      id: 'voc_5_5',
      nivelId: 5,
      termino: 'Wisk\'acha',
      traduccion: 'Vizcacha',
      pronunciacion: 'wis-k\'a-cha',
      categoria: 'sustantivo',
      contextoCultural: 'Roedor andino ágil que habita entre las peñas y peñascos.',
      ejemploUso: 'Wisk\'acha rumi patapi tiyakun (La vizcacha reposa sobre la piedra).'
    },

    // Nivel 6: Mikhuna
    {
      id: 'voc_6_1',
      nivelId: 6,
      termino: 'Sara',
      traduccion: 'Maíz',
      pronunciacion: 'sa-ra',
      categoria: 'sustantivo',
      contextoCultural: 'Grano sagrado, base de la chicha ceremonial y sustento de los valles.',
      ejemploUso: 'Sara mut\'ita mikhunchik (Comemos mote de maíz).'
    },
    {
      id: 'voc_6_2',
      nivelId: 6,
      termino: 'Papa',
      traduccion: 'Papa',
      pronunciacion: 'pa-pa',
      categoria: 'sustantivo',
      contextoCultural: 'Regalo andino a la humanidad con miles de variedades nativas.',
      ejemploUso: 'Ch\'uñuta papamanta ruwanchik (Hacemos chuño a partir de la papa).'
    },
    {
      id: 'voc_6_3',
      nivelId: 6,
      termino: 'Kinwa',
      traduccion: 'Quinua',
      pronunciacion: 'kin-wa',
      categoria: 'sustantivo',
      contextoCultural: 'Grano de oro de alto valor nutritivo cultivado en los salares y llanuras.',
      ejemploUso: 'Kinwa lawata mamay wayk\'un (Mi madre cocina sopa de quinua).'
    },
    {
      id: 'voc_6_4',
      nivelId: 6,
      termino: 'Yaku',
      traduccion: 'Agua',
      pronunciacion: 'ya-ku',
      categoria: 'sustantivo',
      contextoCultural: 'Elemento de vida y purificación ritual (Unu / Yaku).',
      ejemploUso: 'Ch\'uwa yakuta ukyani (Bebo agua cristalina).'
    },

    // Nivel 7: Kurku
    {
      id: 'voc_7_1',
      nivelId: 7,
      termino: 'Uma',
      traduccion: 'Cabeza',
      pronunciacion: 'u-ma',
      categoria: 'sustantivo',
      contextoCultural: 'Sede del pensamiento (Yuyay) y la lucidez.',
      ejemploUso: 'Umaypi ch\'ulluta churakuni (Me pongo el chullo en la cabeza).'
    },
    {
      id: 'voc_7_2',
      nivelId: 7,
      termino: 'Maki',
      traduccion: 'Mano',
      pronunciacion: 'ma-ki',
      categoria: 'sustantivo',
      contextoCultural: 'Símbolo del trabajo colectivo: "maki ayni" (mano de ayuda mutua).',
      ejemploUso: 'Makiwan llamk\'anchik (Trabajamos con las manos).'
    },
    {
      id: 'voc_7_3',
      nivelId: 7,
      termino: 'Chaki',
      traduccion: 'Pie',
      pronunciacion: 'cha-ki',
      categoria: 'sustantivo',
      contextoCultural: 'El contacto directo con la Pachamama al caminar por las montañas.',
      ejemploUso: 'Chakiwan urquman wicharini (Subo al cerro a pie).'
    },
    {
      id: 'voc_7_4',
      nivelId: 7,
      termino: 'Sonqo',
      traduccion: 'Corazón / Sentimiento',
      pronunciacion: 'son-qo',
      categoria: 'sustantivo',
      contextoCultural: 'Centro de los afectos y del compromiso sincero con la comunidad.',
      ejemploUso: 'Tukuy sonqoywan munakuyki (Te quiero con todo mi corazón).'
    },

    // Nivel 8: Wasinchik
    {
      id: 'voc_8_1',
      nivelId: 8,
      termino: 'Wasi',
      traduccion: 'Casa / Hogar',
      pronunciacion: 'wa-si',
      categoria: 'sustantivo',
      contextoCultural: 'Espacio sagrado protegido con cruz andina y ofrendas de buena fortuna.',
      ejemploUso: 'Sumaj wasiypi kusi tiyakuni (Vivo feliz en mi hermosa casa).'
    },
    {
      id: 'voc_8_2',
      nivelId: 8,
      termino: 'Punku',
      traduccion: 'Puerta',
      pronunciacion: 'pun-ku',
      categoria: 'sustantivo',
      contextoCultural: 'Entrada que da la bienvenida a los visitantes de la comunidad.',
      ejemploUso: 'Punkuta kichariway (Ábreme la puerta).'
    },
    {
      id: 'voc_8_3',
      nivelId: 8,
      termino: 'Tawna',
      traduccion: 'Báculo / Bastón de apoyo',
      pronunciacion: 'taw-na',
      categoria: 'sustantivo',
      contextoCultural: 'Apoyo para caminar en las quebradas y símbolo de autoridad comunitaria.',
      ejemploUso: 'Machu tata tawnanwan purin (El anciano camina con su bastón).'
    },

    // Nivel 9: Ruwaykuna
    {
      id: 'voc_9_1',
      nivelId: 9,
      termino: 'Tarpuy',
      traduccion: 'Sembrar',
      pronunciacion: 'tar-puy',
      categoria: 'verbo',
      contextoCultural: 'Acto ritual y laborioso de depositar la semilla en el surco fértil.',
      ejemploUso: 'Kunan p\'unchay papata tarpunchik (Hoy sembramos papa).'
    },
    {
      id: 'voc_9_2',
      nivelId: 9,
      termino: 'Away',
      traduccion: 'Tejer',
      pronunciacion: 'a-way',
      categoria: 'verbo',
      contextoCultural: 'Arte de plasmar la cosmovisión y los ciclos en telares tradicionales.',
      ejemploUso: 'Mamayqa aguayota awachkan (Mi madre está tejiendo un aguayo).'
    },
    {
      id: 'voc_9_3',
      nivelId: 9,
      termino: 'Llamk\'ay',
      traduccion: 'Trabajar',
      pronunciacion: 'llam-k\'ay',
      categoria: 'verbo',
      contextoCultural: 'Principio ético fundamental: Ama Qhella (no seas flojo), trabajo digno.',
      ejemploUso: 'Tukuy ayllu kuska llamk\'anku (Toda la comunidad trabaja junta).'
    },
    {
      id: 'voc_9_4',
      nivelId: 9,
      termino: 'Yachakuy',
      traduccion: 'Aprender',
      pronunciacion: 'ya-cha-kuy',
      categoria: 'verbo',
      contextoCultural: 'Adquirir la sabiduría de los abuelos para mantener viva la cultura.',
      ejemploUso: 'Runasimi simita yachakuni (Aprendo el idioma quechua).'
    },

    // Nivel 10: Pacha
    {
      id: 'voc_10_1',
      nivelId: 10,
      termino: 'Inti',
      traduccion: 'Sol',
      pronunciacion: 'in-ti',
      categoria: 'sustantivo',
      contextoCultural: 'Deidad dadora de calor, vida y madurez para las cosechas.',
      ejemploUso: 'Inti Raymi phistapi kusikunchik (Nos alegramos en la fiesta del Sol).'
    },
    {
      id: 'voc_10_2',
      nivelId: 10,
      termino: 'Killa',
      traduccion: 'Luna / Mes',
      pronunciacion: 'ki-lla',
      categoria: 'sustantivo',
      contextoCultural: 'Guía de los ciclos de siembra, fertilidad y calendarios agrícolas.',
      ejemploUso: 'Killa k\'anchay tutapi purini (Camino en la noche a la luz de la luna).'
    },
    {
      id: 'voc_10_3',
      nivelId: 10,
      termino: 'Pachamama',
      traduccion: 'Madre Tierra',
      pronunciacion: 'pa-cha-ma-ma',
      categoria: 'sustantivo',
      contextoCultural: 'Entidad sagrada y viva que nutre y cobija a todos los seres del cosmos.',
      ejemploUso: 'Pachamamaman ch\'allanchik (Challamos y agradecemos a la Madre Tierra).'
    },
    {
      id: 'voc_10_4',
      nivelId: 10,
      termino: 'Ch\'aska',
      traduccion: 'Estrella',
      pronunciacion: 'ch\'as-ka',
      categoria: 'sustantivo',
      contextoCultural: 'Guías de navegación nocturna en las rutas de arrieros andinos.',
      ejemploUso: 'Hanan pachapi ch\'askakuna k\'anchanku (Las estrellas brillan en el cielo).'
    }
  ],
  oraciones: [
    // Nivel 1: Rimaykuna
    {
      id: 'ora_1_1',
      nivelId: 1,
      textoQuechua: 'Allianllachu masiy kachkanki?',
      traduccionEspanol: '¿Cómo estás, amigo mío?',
      palabraClaveId: 'voc_1_1',
      categoria: 'saludo',
      contextoCultural: 'Saludo respetuoso entre compañeros de labor o estudio.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_1_2',
      nivelId: 1,
      textoQuechua: 'Allianmi kachkani, sulpayki.',
      traduccionEspanol: 'Estoy bien, muchas gracias.',
      palabraClaveId: 'voc_1_2',
      categoria: 'saludo',
      contextoCultural: 'Respuesta cordial que devuelve la reciprocidad en el diálogo.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_1_3',
      nivelId: 1,
      textoQuechua: 'Paqarin kama tinkunakama.',
      traduccionEspanol: 'Hasta mañana, hasta nuestro próximo encuentro.',
      palabraClaveId: 'voc_1_4',
      categoria: 'saludo',
      contextoCultural: 'Despedida esperanzadora en la escuela o faena comunitaria.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 2: Ayllu
    {
      id: 'ora_2_1',
      nivelId: 2,
      textoQuechua: 'Mamayqa sumaq mut\'ita wayk\'un.',
      traduccionEspanol: 'Mi madre cocina un mote delicioso.',
      palabraClaveId: 'voc_2_1',
      categoria: 'sustantivo',
      contextoCultural: 'El rol de la madre en la preparación del alimento familiar.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_2_2',
      nivelId: 2,
      textoQuechua: 'Tataywan chajrapim llamk\'ayku.',
      traduccionEspanol: 'Trabajamos en la chacra junto con mi padre.',
      palabraClaveId: 'voc_2_2',
      categoria: 'sustantivo',
      contextoCultural: 'Transmisión intergeneracional de la agricultura.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 3: Yupaykuna
    {
      id: 'ora_3_1',
      nivelId: 3,
      textoQuechua: 'Iskay allqokuna wasipi kanku.',
      traduccionEspanol: 'Hay dos perros en la casa.',
      palabraClaveId: 'voc_3_2',
      categoria: 'numero',
      contextoCultural: 'Conteo de animales domésticos en el patio familiar.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_3_2',
      nivelId: 3,
      textoQuechua: 'Kimsa urpikuna phawachkanku.',
      traduccionEspanol: 'Tres palomas están volando.',
      palabraClaveId: 'voc_3_3',
      categoria: 'numero',
      contextoCultural: 'Aves que anuncian cambios en el clima.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 4: Llimp'ikuna
    {
      id: 'ora_4_1',
      nivelId: 4,
      textoQuechua: 'Puka pollerata mamay siran.',
      traduccionEspanol: 'Mi madre confecciona una pollera roja.',
      palabraClaveId: 'voc_4_1',
      categoria: 'adjetivo',
      contextoCultural: 'Indumentaria festiva de la mujer andina chuquisaqueña.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_4_2',
      nivelId: 4,
      textoQuechua: 'Q\'illu sara allin poqosqa.',
      traduccionEspanol: 'El maíz amarillo ha madurado muy bien.',
      palabraClaveId: 'voc_4_2',
      categoria: 'adjetivo',
      contextoCultural: 'La maduración del grano antes de la siega.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 5: Uywakuna
    {
      id: 'ora_5_1',
      nivelId: 5,
      textoQuechua: 'Jatun kuntur urqukunapi phawan.',
      traduccionEspanol: 'El majestuoso cóndor vuela sobre los cerros.',
      palabraClaveId: 'voc_5_3',
      categoria: 'sustantivo',
      contextoCultural: 'El cóndor reina en las alturas andinas.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_5_2',
      nivelId: 5,
      textoQuechua: 'Llamakuna ichhuta mikhunku.',
      traduccionEspanol: 'Las llamas se alimentan de paja brava.',
      palabraClaveId: 'voc_5_4',
      categoria: 'sustantivo',
      contextoCultural: 'Pastoreo en las faldas de la cordillera.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 6: Mikhuna
    {
      id: 'ora_6_1',
      nivelId: 6,
      textoQuechua: 'Ch\'uñuta papamanta ruwanchik.',
      traduccionEspanol: 'Elaboramos el chuño a partir de la papa deshidratada.',
      palabraClaveId: 'voc_6_2',
      categoria: 'sustantivo',
      contextoCultural: 'Tecnología ancestral de conservación de alimentos con heladas nocturnas.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_6_2',
      nivelId: 6,
      textoQuechua: 'Kinwa lawata mikhuyku.',
      traduccionEspanol: 'Tomamos sopa nutritiva de quinua.',
      palabraClaveId: 'voc_6_3',
      categoria: 'sustantivo',
      contextoCultural: 'Alimentación fortificante para los inviernos fríos.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 7: Kurku
    {
      id: 'ora_7_1',
      nivelId: 7,
      textoQuechua: 'Makiwan kuska llamk\'anchik.',
      traduccionEspanol: 'Trabajamos juntos mano a mano.',
      palabraClaveId: 'voc_7_2',
      categoria: 'sustantivo',
      contextoCultural: 'Principio del Ayni: cooperación comunitaria obligatoria y festiva.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 8: Wasinchik
    {
      id: 'ora_8_1',
      nivelId: 8,
      textoQuechua: 'Sumaj wasiypi kusi tiyakuni.',
      traduccionEspanol: 'Vivo dichoso y en paz en mi hermoso hogar.',
      palabraClaveId: 'voc_8_1',
      categoria: 'sustantivo',
      contextoCultural: 'El Sumaj Kawsay (Buen Vivir) en armonía con el entorno.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 9: Ruwaykuna
    {
      id: 'ora_9_1',
      nivelId: 9,
      textoQuechua: 'Kunan p\'unchay papata tarpunchik.',
      traduccionEspanol: 'El día de hoy sembramos la papa.',
      palabraClaveId: 'voc_9_1',
      categoria: 'verbo',
      contextoCultural: 'Siembra en comunidad tras la bendición de la tierra.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_9_2',
      nivelId: 9,
      textoQuechua: 'Mamayqa aguayota sumaqta awachkan.',
      traduccionEspanol: 'Mi madre está tejiendo un hermoso aguayo.',
      palabraClaveId: 'voc_9_2',
      categoria: 'verbo',
      contextoCultural: 'El arte del telar tradicional transmitido de madres a hijas.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },

    // Nivel 10: Pacha
    {
      id: 'ora_10_1',
      nivelId: 10,
      textoQuechua: 'Inti k\'anchayninwan chajrata poqochin.',
      traduccionEspanol: 'El sol con su resplandor hace madurar la cosecha.',
      palabraClaveId: 'voc_10_1',
      categoria: 'sustantivo',
      contextoCultural: 'El ciclo sagrado del Inti y la siembra.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    },
    {
      id: 'ora_10_2',
      nivelId: 10,
      textoQuechua: 'Tukuy sonqowan Pachamamaman ch\'allanchik.',
      traduccionEspanol: 'Challamos y agradecemos de corazón a la Madre Tierra.',
      palabraClaveId: 'voc_10_3',
      categoria: 'sustantivo',
      contextoCultural: 'Ritual de agradecimiento y respeto cósmico.',
      autorId: 'docente_quispe_01',
      estado: 'aprobado'
    }
  ]
};
