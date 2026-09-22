import type { Nivel, PalabraVocabulario, OracionBase } from '../types/domain.ts';

export const SEED_NIVELES: Nivel[] = [
  {
    id_nivel: 1,
    titulo_quechua: 'Rimaykuna',
    titulo_espanol: 'Saludos y Cortesía',
    descripcion: 'Aprende las fórmulas básicas de saludo, reciprocidad y respeto en runasimi.',
    orden_secuencial: 1,
    umbral_minimo_aprobacion: 70,
    icono: 'Sparkles',
    color_acento: '#B94700'
  },
  {
    id_nivel: 2,
    titulo_quechua: 'Ayllu',
    titulo_espanol: 'Familia y Comunidad',
    descripcion: 'Términos de parentesco y vínculos afectivos dentro del ayllu tradicional.',
    orden_secuencial: 2,
    umbral_minimo_aprobacion: 70,
    icono: 'Users',
    color_acento: '#F59E0B'
  },
  {
    id_nivel: 3,
    titulo_quechua: 'Yupaykuna',
    titulo_espanol: 'Números y Cantidades',
    descripcion: 'Sistema de numeración decimal quechua del 1 al 10 y expresiones de cantidad.',
    orden_secuencial: 3,
    umbral_minimo_aprobacion: 70,
    icono: 'Binary',
    color_acento: '#0D9488'
  },
  {
    id_nivel: 4,
    titulo_quechua: 'Llimp\'ikuna',
    titulo_espanol: 'Colores y Textiles',
    descripcion: 'Los colores en el arte textil del aguayo y la naturaleza andina.',
    orden_secuencial: 4,
    umbral_minimo_aprobacion: 70,
    icono: 'Palette',
    color_acento: '#0284C7'
  },
  {
    id_nivel: 5,
    titulo_quechua: 'Uywakuna',
    titulo_espanol: 'Animales Andinos',
    descripcion: 'Fauna silvestre y animales domésticos de la cordillera y los valles.',
    orden_secuencial: 5,
    umbral_minimo_aprobacion: 70,
    icono: 'PawPrint',
    color_acento: '#D97706'
  },
  {
    id_nivel: 6,
    titulo_quechua: 'Mikhuna',
    titulo_espanol: 'Alimentos y Cosecha',
    descripcion: 'Frutos de la Pachamama, tubérculos, cereales y platos tradicionales.',
    orden_secuencial: 6,
    umbral_minimo_aprobacion: 70,
    icono: 'Utensils',
    color_acento: '#B94700'
  },
  {
    id_nivel: 7,
    titulo_quechua: 'Kurku',
    titulo_espanol: 'Cuerpo y Bienestar',
    descripcion: 'Partes del cuerpo humano, sensaciones y salud comunitaria.',
    orden_secuencial: 7,
    umbral_minimo_aprobacion: 70,
    icono: 'HeartPulse',
    color_acento: '#E11D48'
  },
  {
    id_nivel: 8,
    titulo_quechua: 'Wasinchik',
    titulo_espanol: 'La Casa y el Entorno',
    descripcion: 'El hogar andino, espacios de convivencia y objetos cotidianos.',
    orden_secuencial: 8,
    umbral_minimo_aprobacion: 70,
    icono: 'Home',
    color_acento: '#0F766E'
  },
  {
    id_nivel: 9,
    titulo_quechua: 'Ruwaykuna',
    titulo_espanol: 'Acciones y Trabajo',
    descripcion: 'Verbos de la labor cotidiana: sembrar, cosechar, tejer y colaborar (ayni).',
    orden_secuencial: 9,
    umbral_minimo_aprobacion: 70,
    icono: 'Hammer',
    color_acento: '#F59E0B'
  },
  {
    id_nivel: 10,
    titulo_quechua: 'Pacha',
    titulo_espanol: 'Cosmovisión y Tiempo',
    descripcion: 'Espacio-tiempo, los ciclos agrícolas y las fuerzas de la naturaleza.',
    orden_secuencial: 10,
    umbral_minimo_aprobacion: 70,
    icono: 'Sun',
    color_acento: '#D97706'
  }
];

export const SEED_VOCABULARIO: PalabraVocabulario[] = [
  // Nivel 1: Rimaykuna
  {
    id_palabra: 'voc_1_1',
    id_nivel: 1,
    termino_quechua: 'Allianllachu',
    traduccion_espanol: '¿Cómo estás? / ¿Estás bien?',
    pronunciacion_aproximada: 'a-lli-an-lla-chu',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Fórmula clásica de cortesía quechua. Expresa genuino interés por el bienestar físico y espiritual del interlocutor.',
    ejemplo_uso: 'Allianllachu, masiy? (¿Estás bien, amigo?)'
  },
  {
    id_palabra: 'voc_1_2',
    id_nivel: 1,
    termino_quechua: 'Allianmi',
    traduccion_espanol: 'Estoy bien',
    pronunciacion_aproximada: 'a-lli-an-mi',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Respuesta obligada y afirmativa ante "Allianllachu", con el sufijo de certeza -mi.',
    ejemplo_uso: 'Allianmi kachkani (Estoy bien).'
  },
  {
    id_palabra: 'voc_1_3',
    id_nivel: 1,
    termino_quechua: 'Sulpayki',
    traduccion_espanol: 'Gracias',
    pronunciacion_aproximada: 'sul-pay-ki',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Agradecimiento sincero; en el quechua sureño boliviano se usa para reciprocidad cotidiana.',
    ejemplo_uso: 'Sulpayki mikhunamanta (Gracias por la comida).'
  },
  {
    id_palabra: 'voc_1_4',
    id_nivel: 1,
    termino_quechua: 'Tinkunakama',
    traduccion_espanol: 'Hasta el encuentro / Hasta luego',
    pronunciacion_aproximada: 'tin-ku-na-ka-ma',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'En la cultura andina no existe el "adiós" definitivo, siempre se promete un próximo encuentro (tinku).',
    ejemplo_uso: 'Q\'ayankama tinkunakama (Hasta el reencuentro de mañana).'
  },
  {
    id_palabra: 'voc_1_5',
    id_nivel: 1,
    termino_quechua: 'Ari',
    traduccion_espanol: 'Sí',
    pronunciacion_aproximada: 'a-ri',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Afirmación clara y respetuosa.',
    ejemplo_uso: 'Ari, yachakuni (Sí, estoy aprendiendo).'
  },
  {
    id_palabra: 'voc_1_6',
    id_nivel: 1,
    termino_quechua: 'Mana',
    traduccion_espanol: 'No',
    pronunciacion_aproximada: 'ma-na',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Partícula de negación general. Suele complementarse con sufijo -chu.',
    ejemplo_uso: 'Mana yachanichu (No sé).'
  },

  // Nivel 2: Ayllu
  {
    id_palabra: 'voc_2_1',
    id_nivel: 2,
    termino_quechua: 'Mama',
    traduccion_espanol: 'Madre',
    pronunciacion_aproximada: 'ma-ma',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Pilar fundamental del hogar andino y figura de protección y sabiduría textil.',
    ejemplo_uso: 'Mamayqa t\'antata ruwan (Mi madre hace pan).'
  },
  {
    id_palabra: 'voc_2_2',
    id_nivel: 2,
    termino_quechua: 'Tata',
    traduccion_espanol: 'Padre',
    pronunciacion_aproximada: 'ta-ta',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Representa el trabajo de la tierra y la guía familiar comunitaria.',
    ejemplo_uso: 'Tatayqa chajrapim llamk\'an (Mi padre trabaja en la chacra).'
  },
  {
    id_palabra: 'voc_2_3',
    id_nivel: 2,
    termino_quechua: 'Wawa',
    traduccion_espanol: 'Bebé / Niño pequeño',
    pronunciacion_aproximada: 'wa-wa',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Término de inmenso cariño que designa a los infantes de la comunidad.',
    ejemplo_uso: 'Wawa puñuchkan (El bebé está durmiendo).'
  },
  {
    id_palabra: 'voc_2_4',
    id_nivel: 2,
    termino_quechua: 'Jatun mama',
    traduccion_espanol: 'Abuela',
    pronunciacion_aproximada: 'ja-tun ma-ma',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Literalmente "gran madre"; portadora de la memoria oral y los cantos ancestrales.',
    ejemplo_uso: 'Jatun mamay willakuwasqa (Mi abuela me contó una historia).'
  },
  {
    id_palabra: 'voc_2_5',
    id_nivel: 2,
    termino_quechua: 'Wawqi',
    traduccion_espanol: 'Hermano (de varón a varón)',
    pronunciacion_aproximada: 'waw-qi',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El quechua distingue el parentesco según el género de quien habla.',
    ejemplo_uso: 'Wawqiyqa llamk\'aq rin (Mi hermano va a trabajar).'
  },
  {
    id_palabra: 'voc_2_6',
    id_nivel: 2,
    termino_quechua: 'Pana',
    traduccion_espanol: 'Hermana (de varón a mujer)',
    pronunciacion_aproximada: 'pa-na',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Expresión de hermandad fraterna y reciprocidad.',
    ejemplo_uso: 'Panaywan kuska takiyku (Canto junto a mi hermana).'
  },

  // Nivel 3: Yupaykuna
  {
    id_palabra: 'voc_3_1',
    id_nivel: 3,
    termino_quechua: 'Juk',
    traduccion_espanol: 'Uno (1)',
    pronunciacion_aproximada: 'juk',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Representa la unidad y el inicio de los ciclos.',
    ejemplo_uso: 'Juk ch\'aska cielopi k\'ancharin (Una estrella brilla en el cielo).'
  },
  {
    id_palabra: 'voc_3_2',
    id_nivel: 3,
    termino_quechua: 'Iskay',
    traduccion_espanol: 'Dos (2)',
    pronunciacion_aproximada: 'is-kay',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Dualidad andina complementaria (Yanantin), hombre-mujer, sol-luna.',
    ejemplo_uso: 'Iskay allqokuna pukllachkanku (Dos perros están jugando).'
  },
  {
    id_palabra: 'voc_3_3',
    id_nivel: 3,
    termino_quechua: 'Kimsa',
    traduccion_espanol: 'Tres (3)',
    pronunciacion_aproximada: 'kim-sa',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Los tres mundos de la cosmovisión: Hanan Pacha, Kay Pacha y Uku Pacha.',
    ejemplo_uso: 'Kimsa urpikuna phawanku (Tres palomas vuelan).'
  },
  {
    id_palabra: 'voc_3_4',
    id_nivel: 3,
    termino_quechua: 'Tawa',
    traduccion_espanol: 'Cuatro (4)',
    pronunciacion_aproximada: 'ta-wa',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Base de las 4 direcciones del Tawantinsuyu y los 4 brazos de la Chakana.',
    ejemplo_uso: 'Tawa suyukuna kanku (Son cuatro regiones).'
  },
  {
    id_palabra: 'voc_3_5',
    id_nivel: 3,
    termino_quechua: 'Phichqa',
    traduccion_espanol: 'Cinco (5)',
    pronunciacion_aproximada: 'phich-qa',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Los cinco dedos de la mano con la que se trabaja la tierra.',
    ejemplo_uso: 'Phichqa t\'antakunata rantini (Compro cinco panes).'
  },
  {
    id_palabra: 'voc_3_6',
    id_nivel: 3,
    termino_quechua: 'Chunka',
    traduccion_espanol: 'Diez (10)',
    pronunciacion_aproximada: 'chun-ka',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Culminación de la decena; base del conteo en quipus.',
    ejemplo_uso: 'Chunka watayoq kani (Tengo diez años).'
  },

  // Nivel 4: Llimp'ikuna
  {
    id_palabra: 'voc_4_1',
    id_nivel: 4,
    termino_quechua: 'Puka',
    traduccion_espanol: 'Rojo',
    pronunciacion_aproximada: 'pu-ka',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'El color de la flor de cantuta y la fuerza de la sangre de la tierra.',
    ejemplo_uso: 'Puka pollerata sirani (Coso una pollera roja).'
  },
  {
    id_palabra: 'voc_4_2',
    id_nivel: 4,
    termino_quechua: 'Q\'illu',
    traduccion_espanol: 'Amarillo',
    pronunciacion_aproximada: 'q\'i-llu',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'El color del Inti (sol) y del maíz maduro listo para la cosecha.',
    ejemplo_uso: 'Q\'illu sara tarpusqa (Maíz amarillo sembrado).'
  },
  {
    id_palabra: 'voc_4_3',
    id_nivel: 4,
    termino_quechua: 'Anqas',
    traduccion_espanol: 'Azul',
    pronunciacion_aproximada: 'an-qas',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'El color del cielo andino despejado y las aguas del lago sagrado.',
    ejemplo_uso: 'Anqas ch\'ulluta awani (Tejo un chullo azul).'
  },
  {
    id_palabra: 'voc_4_4',
    id_nivel: 4,
    termino_quechua: 'Q\'umir',
    traduccion_espanol: 'Verde',
    pronunciacion_aproximada: 'q\'u-mir',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'La esperanza del pasto fresco para las alpacas tras las lluvias.',
    ejemplo_uso: 'Q\'umir qhuchapi kachkanku (Están en la laguna verde).'
  },
  {
    id_palabra: 'voc_4_5',
    id_nivel: 4,
    termino_quechua: 'Yuraq',
    traduccion_espanol: 'Blanco',
    pronunciacion_aproximada: 'yu-raq',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'La nieve perpetua de los nevados tutelares (Achachilas).',
    ejemplo_uso: 'Yuraq rit\'i urqupi tiyan (Hay nieve blanca en el cerro).'
  },
  {
    id_palabra: 'voc_4_6',
    id_nivel: 4,
    termino_quechua: 'Yana',
    traduccion_espanol: 'Negro',
    pronunciacion_aproximada: 'ya-na',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'El color de la noche profunda y la fertilidad de la tierra negra.',
    ejemplo_uso: 'Yana allpa sumaq tarpunapaq (Tierra negra excelente para sembrar).'
  },

  // Nivel 5: Uywakuna
  {
    id_palabra: 'voc_5_1',
    id_nivel: 5,
    termino_quechua: 'Allqo',
    traduccion_espanol: 'Perro',
    pronunciacion_aproximada: 'all-qo',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Compañero leal del pastor andino y guardián del hogar.',
    ejemplo_uso: 'Allqoyqa wasita qhawapan (Mi perro cuida la casa).'
  },
  {
    id_palabra: 'voc_5_2',
    id_nivel: 5,
    termino_quechua: 'Misi',
    traduccion_espanol: 'Gato',
    pronunciacion_aproximada: 'mi-si',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Protege las despensas de chuño y maíz de los roedores.',
    ejemplo_uso: 'Misiqa intipim q\'oñikuchkan (El gato se calienta al sol).'
  },
  {
    id_palabra: 'voc_5_3',
    id_nivel: 5,
    termino_quechua: 'Kuntur',
    traduccion_espanol: 'Cóndor',
    pronunciacion_aproximada: 'kun-tur',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Mensajero divino del Hanan Pacha y símbolo de libertad andina.',
    ejemplo_uso: 'Jatun kuntur urqukunapi phawan (El gran cóndor vuela en los cerros).'
  },
  {
    id_palabra: 'voc_5_4',
    id_nivel: 5,
    termino_quechua: 'Llama',
    traduccion_espanol: 'Llama',
    pronunciacion_aproximada: 'lla-ma',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Animal emblemático del altiplano, provee lana, abono y transporte.',
    ejemplo_uso: 'Llamakuna ichhuta mikhunku (Las llamas comen paja brava).'
  },
  {
    id_palabra: 'voc_5_5',
    id_nivel: 5,
    termino_quechua: 'Wisk\'acha',
    traduccion_espanol: 'Vizcacha',
    pronunciacion_aproximada: 'wis-k\'a-cha',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Roedor andino ágil que habita entre las peñas y peñascos.',
    ejemplo_uso: 'Wisk\'acha rumi patapi tiyakun (La vizcacha reposa sobre la piedra).'
  },

  // Nivel 6: Mikhuna
  {
    id_palabra: 'voc_6_1',
    id_nivel: 6,
    termino_quechua: 'Sara',
    traduccion_espanol: 'Maíz',
    pronunciacion_aproximada: 'sa-ra',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Grano sagrado, base de la chicha ceremonial y sustento de los valles.',
    ejemplo_uso: 'Sara mut\'ita mikhunchik (Comemos mote de maíz).'
  },
  {
    id_palabra: 'voc_6_2',
    id_nivel: 6,
    termino_quechua: 'Papa',
    traduccion_espanol: 'Papa',
    pronunciacion_aproximada: 'pa-pa',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Regalo andino a la humanidad con miles de variedades nativas.',
    ejemplo_uso: 'Ch\'uñuta papamanta ruwanchik (Hacemos chuño a partir de la papa).'
  },
  {
    id_palabra: 'voc_6_3',
    id_nivel: 6,
    termino_quechua: 'Kinwa',
    traduccion_espanol: 'Quinua',
    pronunciacion_aproximada: 'kin-wa',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Grano de oro de alto valor nutritivo cultivado en los salares y llanuras.',
    ejemplo_uso: 'Kinwa lawata mamay wayk\'un (Mi madre cocina sopa de quinua).'
  },
  {
    id_palabra: 'voc_6_4',
    id_nivel: 6,
    termino_quechua: 'Yaku',
    traduccion_espanol: 'Agua',
    pronunciacion_aproximada: 'ya-ku',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Elemento de vida y purificación ritual (Unu / Yaku).',
    ejemplo_uso: 'Ch\'uwa yakuta ukyani (Bebo agua cristalina).'
  },

  // Nivel 7: Kurku
  {
    id_palabra: 'voc_7_1',
    id_nivel: 7,
    termino_quechua: 'Uma',
    traduccion_espanol: 'Cabeza',
    pronunciacion_aproximada: 'u-ma',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Sede del pensamiento (Yuyay) y la lucidez.',
    ejemplo_uso: 'Umaypi ch\'ulluta churakuni (Me pongo el chullo en la cabeza).'
  },
  {
    id_palabra: 'voc_7_2',
    id_nivel: 7,
    termino_quechua: 'Maki',
    traduccion_espanol: 'Mano',
    pronunciacion_aproximada: 'ma-ki',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Símbolo del trabajo colectivo: "maki ayni" (mano de ayuda mutua).',
    ejemplo_uso: 'Makiwan llamk\'anchik (Trabajamos con las manos).'
  },
  {
    id_palabra: 'voc_7_3',
    id_nivel: 7,
    termino_quechua: 'Chaki',
    traduccion_espanol: 'Pie',
    pronunciacion_aproximada: 'cha-ki',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El contacto directo con la Pachamama al caminar por las montañas.',
    ejemplo_uso: 'Chakiwan urquman wicharini (Subo al cerro a pie).'
  },
  {
    id_palabra: 'voc_7_4',
    id_nivel: 7,
    termino_quechua: 'Sonqo',
    traduccion_espanol: 'Corazón / Sentimiento',
    pronunciacion_aproximada: 'son-qo',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Centro de los afectos y del compromiso sincero con la comunidad.',
    ejemplo_uso: 'Tukuy sonqoywan munakuyki (Te quiero con todo mi corazón).'
  },

  // Nivel 8: Wasinchik
  {
    id_palabra: 'voc_8_1',
    id_nivel: 8,
    termino_quechua: 'Wasi',
    traduccion_espanol: 'Casa / Hogar',
    pronunciacion_aproximada: 'wa-si',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Espacio sagrado protegido con cruz andina y ofrendas de buena fortuna.',
    ejemplo_uso: 'Sumaj wasiypi kusi tiyakuni (Vivo feliz en mi hermosa casa).'
  },
  {
    id_palabra: 'voc_8_2',
    id_nivel: 8,
    termino_quechua: 'Punku',
    traduccion_espanol: 'Puerta',
    pronunciacion_aproximada: 'pun-ku',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Entrada que da la bienvenida a los visitantes de la comunidad.',
    ejemplo_uso: 'Punkuta kichariway (Ábreme la puerta).'
  },
  {
    id_palabra: 'voc_8_3',
    id_nivel: 8,
    termino_quechua: 'Tawna',
    traduccion_espanol: 'Báculo / Bastón de apoyo',
    pronunciacion_aproximada: 'taw-na',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Apoyo para caminar en las quebradas y símbolo de autoridad comunitaria.',
    ejemplo_uso: 'Machu tata tawnanwan purin (El anciano camina con su bastón).'
  },

  // Nivel 9: Ruwaykuna
  {
    id_palabra: 'voc_9_1',
    id_nivel: 9,
    termino_quechua: 'Tarpuy',
    traduccion_espanol: 'Sembrar',
    pronunciacion_aproximada: 'tar-puy',
    categoria_gramatical: 'verbo',
    contexto_cultural: 'Acto ritual y laborioso de depositar la semilla en el surco fértil.',
    ejemplo_uso: 'Kunan p\'unchay papata tarpunchik (Hoy sembramos papa).'
  },
  {
    id_palabra: 'voc_9_2',
    id_nivel: 9,
    termino_quechua: 'Away',
    traduccion_espanol: 'Tejer',
    pronunciacion_aproximada: 'a-way',
    categoria_gramatical: 'verbo',
    contexto_cultural: 'Arte de plasmar la cosmovisión y los ciclos en telares tradicionales.',
    ejemplo_uso: 'Mamayqa aguayota awachkan (Mi madre está tejiendo un aguayo).'
  },
  {
    id_palabra: 'voc_9_3',
    id_nivel: 9,
    termino_quechua: 'Llamk\'ay',
    traduccion_espanol: 'Trabajar',
    pronunciacion_aproximada: 'llam-k\'ay',
    categoria_gramatical: 'verbo',
    contexto_cultural: 'Principio ético fundamental: Ama Qhella (no seas flojo), trabajo digno.',
    ejemplo_uso: 'Tukuy ayllu kuska llamk\'anku (Toda la comunidad trabaja junta).'
  },
  {
    id_palabra: 'voc_9_4',
    id_nivel: 9,
    termino_quechua: 'Yachakuy',
    traduccion_espanol: 'Aprender',
    pronunciacion_aproximada: 'ya-cha-kuy',
    categoria_gramatical: 'verbo',
    contexto_cultural: 'Adquirir la sabiduría de los abuelos para mantener viva la cultura.',
    ejemplo_uso: 'Runasimi simita yachakuni (Aprendo el idioma quechua).'
  },

  // Nivel 10: Pacha
  {
    id_palabra: 'voc_10_1',
    id_nivel: 10,
    termino_quechua: 'Inti',
    traduccion_espanol: 'Sol',
    pronunciacion_aproximada: 'in-ti',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Deidad dadora de calor, vida y madurez para las cosechas.',
    ejemplo_uso: 'Inti Raymi phistapi kusikunchik (Nos alegramos en la fiesta del Sol).'
  },
  {
    id_palabra: 'voc_10_2',
    id_nivel: 10,
    termino_quechua: 'Killa',
    traduccion_espanol: 'Luna / Mes',
    pronunciacion_aproximada: 'ki-lla',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Guía de los ciclos de siembra, fertilidad y calendarios agrícolas.',
    ejemplo_uso: 'Killa k\'anchay tutapi purini (Camino en la noche a la luz de la luna).'
  },
  {
    id_palabra: 'voc_10_3',
    id_nivel: 10,
    termino_quechua: 'Pachamama',
    traduccion_espanol: 'Madre Tierra',
    pronunciacion_aproximada: 'pa-cha-ma-ma',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Entidad sagrada y viva que nutre y cobija a todos los seres del cosmos.',
    ejemplo_uso: 'Pachamamaman ch\'allanchik (Challamos y agradecemos a la Madre Tierra).'
  },
  {
    id_palabra: 'voc_10_4',
    id_nivel: 10,
    termino_quechua: 'Ch\'aska',
    traduccion_espanol: 'Estrella',
    pronunciacion_aproximada: 'ch\'as-ka',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Guías de navegación nocturna en las rutas de arrieros andinos.',
    ejemplo_uso: 'Hanan pachapi ch\'askakuna k\'anchanku (Las estrellas brillan en el cielo).'
  }
];

export const SEED_ORACIONES_BASE: OracionBase[] = [
  // Nivel 1: Rimaykuna
  {
    id_oracion: 'ora_1_1',
    id_nivel: 1,
    texto_quechua: 'Allianllachu masiy kachkanki?',
    traduccion_espanol: '¿Cómo estás, amigo mío?',
    palabra_clave_id: 'voc_1_1',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Saludo respetuoso entre compañeros de labor o estudio.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_1_2',
    id_nivel: 1,
    texto_quechua: 'Allianmi kachkani, sulpayki.',
    traduccion_espanol: 'Estoy bien, muchas gracias.',
    palabra_clave_id: 'voc_1_2',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Respuesta cordial que devuelve la reciprocidad en el diálogo.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_1_3',
    id_nivel: 1,
    texto_quechua: 'Paqarin kama tinkunakama.',
    traduccion_espanol: 'Hasta mañana, hasta nuestro próximo encuentro.',
    palabra_clave_id: 'voc_1_4',
    categoria_gramatical: 'saludo',
    contexto_cultural: 'Despedida esperanzadora en la escuela o faena comunitaria.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 2: Ayllu
  {
    id_oracion: 'ora_2_1',
    id_nivel: 2,
    texto_quechua: 'Mamayqa sumaq mut\'ita wayk\'un.',
    traduccion_espanol: 'Mi madre cocina un mote delicioso.',
    palabra_clave_id: 'voc_2_1',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El rol de la madre en la preparación del alimento familiar.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_2_2',
    id_nivel: 2,
    texto_quechua: 'Tataywan chajrapim llamk\'ayku.',
    traduccion_espanol: 'Trabajamos en la chacra junto con mi padre.',
    palabra_clave_id: 'voc_2_2',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Transmisión intergeneracional de la agricultura.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 3: Yupaykuna
  {
    id_oracion: 'ora_3_1',
    id_nivel: 3,
    texto_quechua: 'Iskay allqokuna wasipi kanku.',
    traduccion_espanol: 'Hay dos perros en la casa.',
    palabra_clave_id: 'voc_3_2',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Conteo de animales domésticos en el patio familiar.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_3_2',
    id_nivel: 3,
    texto_quechua: 'Kimsa urpikuna phawachkanku.',
    traduccion_espanol: 'Tres palomas están volando.',
    palabra_clave_id: 'voc_3_3',
    categoria_gramatical: 'numero',
    contexto_cultural: 'Aves que anuncian cambios en el clima.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 4: Llimp'ikuna
  {
    id_oracion: 'ora_4_1',
    id_nivel: 4,
    texto_quechua: 'Puka pollerata mamay siran.',
    traduccion_espanol: 'Mi madre confecciona una pollera roja.',
    palabra_clave_id: 'voc_4_1',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'Indumentaria festiva de la mujer andina chuquisaqueña.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_4_2',
    id_nivel: 4,
    texto_quechua: 'Q\'illu sara allin poqosqa.',
    traduccion_espanol: 'El maíz amarillo ha madurado muy bien.',
    palabra_clave_id: 'voc_4_2',
    categoria_gramatical: 'adjetivo',
    contexto_cultural: 'La maduración del grano antes de la siega.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 5: Uywakuna
  {
    id_oracion: 'ora_5_1',
    id_nivel: 5,
    texto_quechua: 'Jatun kuntur urqukunapi phawan.',
    traduccion_espanol: 'El majestuoso cóndor vuela sobre los cerros.',
    palabra_clave_id: 'voc_5_3',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El cóndor reina en las alturas andinas.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_5_2',
    id_nivel: 5,
    texto_quechua: 'Llamakuna ichhuta mikhunku.',
    traduccion_espanol: 'Las llamas se alimentan de paja brava.',
    palabra_clave_id: 'voc_5_4',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Pastoreo en las faldas de la cordillera.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 6: Mikhuna
  {
    id_oracion: 'ora_6_1',
    id_nivel: 6,
    texto_quechua: 'Ch\'uñuta papamanta ruwanchik.',
    traduccion_espanol: 'Elaboramos el chuño a partir de la papa deshidratada.',
    palabra_clave_id: 'voc_6_2',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Tecnología ancestral de conservación de alimentos con heladas nocturnas.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_6_2',
    id_nivel: 6,
    texto_quechua: 'Kinwa lawata mikhuyku.',
    traduccion_espanol: 'Tomamos sopa nutritiva de quinua.',
    palabra_clave_id: 'voc_6_3',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Alimentación fortificante para los inviernos fríos.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 7: Kurku
  {
    id_oracion: 'ora_7_1',
    id_nivel: 7,
    texto_quechua: 'Makiwan kuska llamk\'anchik.',
    traduccion_espanol: 'Trabajamos juntos mano a mano.',
    palabra_clave_id: 'voc_7_2',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Principio del Ayni: cooperación comunitaria obligatoria y festiva.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 8: Wasinchik
  {
    id_oracion: 'ora_8_1',
    id_nivel: 8,
    texto_quechua: 'Sumaj wasiypi kusi tiyakuni.',
    traduccion_espanol: 'Vivo dichoso y en paz en mi hermoso hogar.',
    palabra_clave_id: 'voc_8_1',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El Sumaj Kawsay (Buen Vivir) en armonía con el entorno.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 9: Ruwaykuna
  {
    id_oracion: 'ora_9_1',
    id_nivel: 9,
    texto_quechua: 'Kunan p\'unchay papata tarpunchik.',
    traduccion_espanol: 'El día de hoy sembramos la papa.',
    palabra_clave_id: 'voc_9_1',
    categoria_gramatical: 'verbo',
    contexto_cultural: 'Siembra en comunidad tras la bendición de la tierra.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_9_2',
    id_nivel: 9,
    texto_quechua: 'Mamayqa aguayota sumaqta awachkan.',
    traduccion_espanol: 'Mi madre está tejiendo un hermoso aguayo.',
    palabra_clave_id: 'voc_9_2',
    categoria_gramatical: 'verbo',
    contexto_cultural: 'El arte del telar tradicional transmitido de madres a hijas.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },

  // Nivel 10: Pacha
  {
    id_oracion: 'ora_10_1',
    id_nivel: 10,
    texto_quechua: 'Inti k\'anchayninwan chajrata poqochin.',
    traduccion_espanol: 'El sol con su resplandor hace madurar la cosecha.',
    palabra_clave_id: 'voc_10_1',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'El ciclo sagrado del Inti y la siembra.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  },
  {
    id_oracion: 'ora_10_2',
    id_nivel: 10,
    texto_quechua: 'Tukuy sonqowan Pachamamaman ch\'allanchik.',
    traduccion_espanol: 'Challamos y agradecemos de corazón a la Madre Tierra.',
    palabra_clave_id: 'voc_10_3',
    categoria_gramatical: 'sustantivo',
    contexto_cultural: 'Ritual de agradecimiento y respeto cósmico.',
    autor_id: 'docente_quispe_01',
    validador_id: 'docente_quispe_01',
    estado_moderacion: 'aprobado'
  }
];
