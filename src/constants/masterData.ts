export const CATALOGO_EXTRACCION = {
  sistemas: [
    { id: 'novatech-8', marca: 'Novatech', modelo: '8"', capacidad_kg_h: 2400 },
    { id: 'novatech-10', marca: 'Novatech', modelo: '10"', capacidad_kg_h: 2500 },
    { id: 'polinox-10', marca: 'Polinox', modelo: '10"', capacidad_kg_h: 3000 },
    { id: 'scaleaq-8', marca: 'Scale AQ', modelo: '8"', capacidad_kg_h: 1700 },
    { id: 'scaleaq-10', marca: 'Scale AQ', modelo: '10"', capacidad_kg_h: 2400 },
    { id: 'quo-8', marca: 'QUO', modelo: '8"', capacidad_kg_h: 2000 },
  ],
  compresores: [
    { id: 'kaeser-m50e', marca: 'Kaeser', modelo: 'Mobilair M50E / M50', cfm: 185 },
    { id: 'kaeser-sk25', marca: 'Kaeser', modelo: 'SK25', cfm: 90 },
    { id: 'kaeser-m100', marca: 'Kaeser', modelo: 'M100', cfm: 350 }, // Estimated
    { id: 'atlas-xas97', marca: 'Atlas Copco', modelo: 'XAS 97', cfm: 187 },
    { id: 'atlas-xas186', marca: 'Atlas Copco', modelo: 'XAS 186', cfm: 400 }, // Estimated
    { id: 'abac-b7000', marca: 'ABAC', modelo: 'B7000', cfm: 42.7 },
  ]
};

export const CATALOGO_DESNATURALIZACION = {
  trituradoras: [
    {
      id: 'aquainox-1430',
      marca_modelo: 'AQUAINOX 1430 L-EQ',
      capacidad_nominal_kg_h: 2500,
      almacenamiento_l: 1430,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 1000,
      configuraciones_batch: [
        { label: '1.400 kg / 33,6 min  (20 + 13,6)',  kilos: 1400,   t_proceso: 20,   t_pausa: 13.6 },
        { label: '1.400 kg / 34 min    (20 + 14)',     kilos: 1400,   t_proceso: 20,   t_pausa: 14   },
        { label: '1.400 kg / 33,6 min  (23 + 10,6)',  kilos: 1400,   t_proceso: 23,   t_pausa: 10.6 },
        { label: '1.400 kg / 25 min    (21 + 4) — optimizado', kilos: 1400, t_proceso: 21, t_pausa: 4 },
        { label: '1.081,1 kg / 23 min  (21 + 2)',     kilos: 1081, t_proceso: 21,   t_pausa: 2    },
        { label: '1.081,1 kg / 17,3 min  (15,3 + 2) — Op. Mínima con Prepicador', kilos: 1081, t_proceso: 15.3, t_pausa: 2 },
      ],
    },
    {
      id: 'optimo-mix-500',
      marca_modelo: 'OPTIMO MIX OM 500',
      capacidad_nominal_kg_h: 2100,
      almacenamiento_l: 500,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 8000,
      configuraciones_batch: [
        { label: '480 kg / 13,7 min  (10 + 3,7)',  kilos: 480, t_proceso: 10,  t_pausa: 3.7 },
        { label: '378 kg / 10,8 min  (8,8 + 2)',   kilos: 378, t_proceso: 8.8, t_pausa: 2   },
        { label: '350 kg / 8 min     (6 + 2)',      kilos: 350, t_proceso: 6,   t_pausa: 2   },
        { label: '350 kg / 7,14 min  (5,14 + 2)',   kilos: 350, t_proceso: 5.14,t_pausa: 2   },
      ],
    },
    {
      // Capacidades nominales documentadas: 1.200 / 1.950 / 2.500 kg/h según configuración de centro.
      // Olla 700 L | Motor 7.5 kW | Sistema de recirculación de ácido incluido.
      // Con prepicador integrado: ciclo de 15 min proceso + 1 min pausa → 1.350 kg/batch (alta carga).
      id: 'ocea-sw700',
      marca_modelo: 'OCEA SW-700L-OCH 7.5 KW',
      capacidad_nominal_kg_h: 2500,
      almacenamiento_l: 700,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 2000,
      configuraciones_batch: [
        { label: '650 kg / 20 min  (10 + 10) — Estándar',              kilos: 650,   t_proceso: 10, t_pausa: 10 },
        { label: '600 kg / 15 min  (10 + 5)',                           kilos: 600,   t_proceso: 10, t_pausa: 5  },
        { label: '529,2 kg / 12 min  (10 + 2) — Peces pequeños',       kilos: 529.2, t_proceso: 10, t_pausa: 2  },
        { label: '1.350 kg / 16 min  (15 + 1) — Con Prepicador',       kilos: 1350,  t_proceso: 15, t_pausa: 1  },
      ],
    },
    {
      id: 'acuimaster-ac715',
      marca_modelo: 'ACUIMASTER AC-715 LT',
      capacidad_nominal_kg_h: 1680,
      almacenamiento_l: 715,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 1200,
      configuraciones_batch: [
        { label: '700 kg / 25 min  (15 + 10)',   kilos: 700,   t_proceso: 15, t_pausa: 10 },
        { label: '529,2 kg / 16 min  (15 + 1)',  kilos: 529.2, t_proceso: 15, t_pausa: 1  },
      ],
    },
    {
      // Metalúrgica Chinquihue (Puerto Montt) — Sistema Integral de Ensilaje
      // Diseñado para operar en pontones (mar y agua dulce). Piezas cortadas con tecnología Waterjet.
      // Componentes: estanque 1.200 L + bomba Chopper + bomba dosificadora ácido + tablero eléctrico.
      // Restricción fabricante: molienda MÍNIMA 15 min por batch (no negociable para validación).
      // Primera molienda del día: agregar agua hasta cubrir la voluta para generar sello hidráulico.
      // Prepicador opcional PR 60/7: 2.000 kg/h, 7 cuchillas AISI 304/316-L, motor SEW 3kW / 60 RPM / 6,7 A.
      // Dimensiones equipo: 250 cm alto × 130 cm ancho × 130 cm largo | Peso: 300 kg | Temp. máx: 80°C.
      // Capacidad nominal (ciclo estándar 30 min): 1.100 × 2 batches/h = 2.200 kg/h.
      id: 'mch-tk1200',
      marca_modelo: 'MCH - TK1200',
      capacidad_nominal_kg_h: 2200,
      almacenamiento_l: 1200,
      material: 'Acero inoxidable AISI 304 (corte Waterjet)',
      capacidad_prepicador_kg_h: 2000,
      configuraciones_batch: [
        { label: '1.100 kg / 30 min  (15 + 15) — Estándar MCH',            kilos: 1100, t_proceso: 15, t_pausa: 15 },
        { label: '1.100 kg / 21 min  (15 + 6)  — Con Prepicador PR 60/7',  kilos: 1100, t_proceso: 15, t_pausa: 6  },
      ],
    },
    {
      // Global Fluid (Estándar 1000L) — Datos fabricante 2026-03-29
      // Capacidad molienda: 2.100 kg/h | Estanque: 1.000 L | Pez promedio: 2,5 kg
      // Turno 8h: 6.720 peces → 16,8 TN/día
      // Obs. fabricante: capacidad exacta depende del tamaño del estanque y del pez.
      id: 'global-fluid-1000',
      marca_modelo: 'Global Fluid (Estándar 1000L)',
      capacidad_nominal_kg_h: 2100,
      almacenamiento_l: 1000,
      material: 'Acero inoxidable',
      configuraciones_batch: [
        { label: '1.000 kg / 29 min  (28,6 + 0,4) — Estándar fabricante', kilos: 1000, t_proceso: 28.6, t_pausa: 0.4 },
      ],
    },
  ],
  incineradores: [
    {
      id: 'addfield-thunder-1000',
      marca_modelo: 'ADDFIELD / THUNDER 1000',
      capacidad_carga_kg_h: 150,
      horas_funcionamiento: 8,
      camara_primaria: '1.450 m diámetro interior',
      num_quemadores_primaria: 1,
      temperatura_camara_primaria_c: 950,
      camara_secundaria: '2 m Diámetro Interior',
      num_quemadores_secundaria: 1,
      temperatura_camara_secundaria_c: 850,
      requerimiento_energetico: '390 kWh',
      sistema_carga: 'CARGA MANUAL TACHOS 60L',
      sistema_descarga: 'MANUAL HACIA MAXISACOS',
      disposicion_final: 'VERTEDERO MUNICIPAL PTA ARENAS',
      almacenamiento_gas: '4000L X 2 = 8.000L GAS GLP',
      observaciones: 'INCINERADOR ES EL SISTEMA SECUNDARIO DE DESNATURALIZACIÓN DEL CENTRO DE CULTIVO. Capacidad Diaria Incineración: 150 kg/h x 8 h = 1.200 TON/DIA',
    },
    {
      id: 'incinerador-300',
      marca_modelo: 'INCINERADOR 300',
      capacidad_carga_kg_h: 50,
      horas_funcionamiento: 8,
      camara_primaria: '1.6 m diámetro interior',
      num_quemadores_primaria: 1,
      temperatura_camara_primaria_c: 950,
      camara_secundaria: '2 m Diámetro Interior',
      num_quemadores_secundaria: 1,
      temperatura_camara_secundaria_c: 850,
      requerimiento_energetico: '8 KW/hora',
      sistema_carga: 'CARGA MANUAL TACHOS 60L',
      sistema_descarga: 'MANUAL HACIA MAXISACOS',
      disposicion_final: 'VERTEDERO MUNICIPAL PTA ARENAS',
      almacenamiento_gas: '4000L X 4 = 16.000L GAS GLP',
      observaciones: 'INCINERADOR ES EL SISTEMA SECUNDARIO DE DESNATURALIZACIÓN DEL CENTRO DE CULTIVO.',
    },
  ]
};

export const CATALOGO_GENERADORES = [
  { id: 'cummins-c110d5', marca: 'Cummins', modelo: 'C110D5', kva: 110 },
  { id: 'cummins-c250d5', marca: 'Cummins', modelo: 'C250 D5', kva: 250 },
  { id: 'fg-p33-3', marca: 'FG Wilson', modelo: 'P33-3', kva: 33 },
  { id: 'fg-p65-6', marca: 'FG Wilson', modelo: 'P65-6', kva: 65 },
  { id: 'fg-p125-1', marca: 'FG Wilson', modelo: 'P125-1', kva: 125 },
  { id: 'fg-c150d5', marca: 'FG Wilson', modelo: 'C150D5', kva: 150 },
  { id: 'fg-p220-3', marca: 'FG Wilson', modelo: 'P220-3', kva: 220 },
  { id: 'werbank-160g', marca: 'Werbank', modelo: '160G', kva: 160 },
  { id: 'weichai-wpg33l1', marca: 'Weichai', modelo: 'WPG33L1', kva: 33 },
  { id: 'mwm-sgd330-50', marca: 'MWM', modelo: 'SGD330.50', kva: 330 },
  { id: 'caterpillar-fg-wilson-p56', marca: 'Caterpillar / FG Wilson', modelo: 'P56', kva: 50 },
];

export const CATALOGO_ALMACENAMIENTO = [20, 21, 30, 32, 40, 45, 50];

export interface CatalogoCentro {
  codigo: string;
  nombre: string;
  titular: string;
  acs: string;
  ubicacion: string;
  operacion_minima?: true;
  sistema_extraccion_tipico?: string;
  capacidad_tipica_ton_dia?: number;
  nota?: string;
}

export const CATALOGO_CENTROS: CatalogoCentro[] = [
  {
    codigo: '102345',
    nombre: 'Punta Larga',
    titular: 'AquaChile S.A.',
    acs: 'ACS 10A',
    ubicacion: 'Estero Reloncaví, Los Lagos'
  },
  {
    codigo: '104567',
    nombre: 'Isla Guar',
    titular: 'Cermaq Chile S.A.',
    acs: 'ACS 10B',
    ubicacion: 'Seno de Reloncaví, Los Lagos'
  },
  {
    codigo: '110890',
    nombre: 'Canal Fitz Roy',
    titular: 'Mowi Chile S.A.',
    acs: 'ACS 12',
    ubicacion: 'Canal Fitz Roy, Magallanes'
  },
  {
    codigo: '120334',
    nombre: 'Bahía Low',
    titular: 'Australis Mar S.A.',
    acs: 'ACS 17',
    ubicacion: 'Melinka, Aysén'
  },
  {
    codigo: '101223',
    nombre: 'Ensenada Baja',
    titular: 'Blumar S.A.',
    acs: 'ACS 21A',
    ubicacion: 'Puerto Chacabuco, Aysén'
  },
  // --- Centros de Operación Mínima ---
  // Centros que operan con sistema ROV y declaran capacidad al umbral legal mínimo (15 TN/día).
  // Al seleccionarlos, el sistema muestra un aviso al certificador.
  {
    codigo: '110893',
    nombre: 'Punta Sánchez',
    titular: 'EXPORTADORA LOS FIORDOS LTDA.',
    acs: 'ACS 26B',
    ubicacion: 'Los Lagos',
    operacion_minima: true,
    sistema_extraccion_tipico: 'ROV',
    capacidad_tipica_ton_dia: 15,
    nota: 'Opera exclusivamente con ROV submarino como sistema de extracción de mortalidad. Capacidad declarada al umbral mínimo legal (15 TN/día). Verificar valores reales en terreno.',
  },
];

// ---------------------------------------------------------------------------
// CATÁLOGO MAESTRO DE LEYENDAS FOTOGRÁFICAS
// Descripciones validadas extraídas de Informes Técnicos reales.
// Usadas como autocompletado en la grilla de imágenes del Informe.
// Placeholders dinámicos: {m3} → capacidad estanque, {kva} → potencia generador.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// LISTAS DE AUTOCOMPLETADO — Datos de identificación frecuentes
// ---------------------------------------------------------------------------

export const TITULARES_CONOCIDOS = [
  'EXPORTADORA LOS FIORDOS LTDA.',
  'MOWI CHILE S.A.',
  'CERMAQ CHILE S.A.',
  'AQUACHILE S.A.',
  'BLUMAR S.A.',
  'AUSTRALIS MAR S.A.',
  'MARINE HARVEST CHILE S.A.',
  'SALMONES MULTIEXPORT S.A.',
  'MULTIEXPORT FOODS S.A.',
  'SALMONES CAMANCHACA S.A.',
  'CAMANCHACA CULTIVOS SUR S.A.',
  'SALMONES ANTARTICA S.A.',
  'VENTISQUEROS S.A.',
  'COMPAÑÍA PESQUERA CAMANCHACA S.A.',
  'COOKE AQUACULTURE CHILE S.A.',
  'SALMONES AYSÉN S.A.',
  'PACIFIC STAR S.A.',
  'SALMONES BIO BIO S.A.',
  'INVERMAR S.A.',
];

export const EMPRESA_HINTS: {
  keywords: string[];
  extraccion: string;
  desnaturalizacion: string;
  almacenamiento: string;
}[] = [
  {
    keywords: ['MOWI'],
    extraccion: 'Mowi opera habitualmente con LIFT-UP Novatech 10" y compresor Kaeser M50E (185 CFM). Cap. típica certificada: ~18 TN/día.',
    desnaturalizacion: 'Sistema de ensilaje con AQUAINOX 1430 L (2 500 kg/h). Operación en jornada de 8 h con 1–2 equipos.',
    almacenamiento: 'Estanques de ~49 m³ reportados. Verificar número de estanques para superar las 20 TN mínimas.',
  },
  {
    keywords: ['CERMAQ'],
    extraccion: 'Cermaq usa LIFT-UP Novatech 8"–10" con Kaeser M50E. Capacidades reportadas entre 16–22 TN/día según módulo.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L o OCEA SW-700. Cap. desnaturalización frecuentemente alta (>50 TN/día) en módulos grandes.',
    almacenamiento: 'Almacenamiento habitual en rangos de 50–80 m³. Centro Aguantao: 59.78 TN reportadas.',
  },
  {
    keywords: ['AQUACHILE'],
    extraccion: 'AquaChile emplea LIFT-UP Novatech o Polinox 10". Jornadas de 8 h; capacidad certificada típica: ~20 TN/día.',
    desnaturalizacion: 'Uso frecuente de OPTIMO MIX OM 500 (2 100 kg/h) o AQUAINOX 1430 L. Sistema de ensilaje en 1 equipo.',
    almacenamiento: 'Almacenamiento ajustado al mínimo regulatorio; centro Lalanca 2 reportó 20.58 TN. Verificar volumen real de estanques.',
  },
  {
    keywords: ['BLUMAR'],
    extraccion: 'Blumar utiliza LIFT-UP Novatech 10" con compresor Kaeser. Capacidades certificadas en torno a 20 TN/día.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L (1 equipo estándar). Operación de 8 h/día.',
    almacenamiento: 'Estanques de 40–50 m³ en centros tipo. Centro Elena Norte registró 44.1 TN.',
  },
  {
    keywords: ['CAMANCHACA'],
    extraccion: 'Camanchaca opera con LIFT-UP Novatech 10" y compresores Atlas Copco XAS 97 o Kaeser M50E.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L o ACUIMASTER AC-715 LT. Velocidades nominales en torno a 1 700–2 500 kg/h.',
    almacenamiento: 'Estanques de 35–45 m³ habituales. Centro Williams 1 reportó 39.2 TN.',
  },
  {
    keywords: ['LOS FIORDOS', 'FIORDOS'],
    extraccion: 'Los Fiordos (EWOS/Cargill) emplea LIFT-UP Novatech 10". Módulos grandes con múltiples jaulas simultáneas.',
    desnaturalizacion: 'Sistema de ensilaje con AQUAINOX 1430 L. En módulos de alta biomasa se observan 2 equipos en paralelo.',
    almacenamiento: 'Almacenamiento entre 40–70 m³ dependiendo del módulo. Verificar número y capacidad de estanques actuales.',
  },
  {
    keywords: ['MULTIEXPORT', 'SALMONES MULTIEXPORT'],
    extraccion: 'Multiexport usa LIFT-UP Novatech 10" o Scale AQ 10". Jornadas de 8 h con personal de 2–3 operarios.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L o OPTIMO MIX OM 500 según disponibilidad por zona.',
    almacenamiento: 'Estanques de 30–50 m³. Verificar si el centro dispone de estanque de respaldo.',
  },
  {
    keywords: ['AUSTRALIS', 'AUSTRALIS MAR'],
    extraccion: 'Australis Mar (ahora parte de WH Group/Cooke) opera con LIFT-UP Novatech 10". Revisar actualizaciones post-fusión.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L histórico. Confirmar modelo vigente en inspección.',
    almacenamiento: 'Estanques de 40–60 m³ típicos en sus centros. Verificar número de unidades activas.',
  },
  {
    keywords: ['VENTISQUEROS'],
    extraccion: 'Ventisqueros utiliza LIFT-UP Novatech 10" en la mayoría de sus centros. Compresor Kaeser M50E frecuente.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L o OCEA SW-700. Operación de 8 h en 1 equipo.',
    almacenamiento: 'Almacenamiento habitual en 30–50 m³. Confirmar cantidad y estado de estanques.',
  },
  {
    keywords: ['COOKE'],
    extraccion: 'Cooke Aquaculture opera con LIFT-UP Novatech 10". Revisar manual de equipos actualizado del centro.',
    desnaturalizacion: 'Ensilaje con AQUAINOX 1430 L en configuración estándar. Confirmar con documentación del centro.',
    almacenamiento: 'Verificar número de estanques: Cooke suele operar con 2–3 unidades de 20 m³ c/u.',
  },
];

export const FORMATOS_MODULO_CONOCIDOS = [
  '20 jaulas, tipo Metálicas',
  '24 jaulas, tipo Metálicas',
  '28 jaulas, tipo Metálicas',
  '30 jaulas, tipo Metálicas',
  '20 jaulas, tipo HDPE',
  '24 jaulas, tipo HDPE',
  '16 jaulas, tipo Metálicas',
  '12 jaulas, tipo Metálicas',
  '18 jaulas, tipo Metálicas',
];

export const TAMANOS_JAULAS_CONOCIDOS = [
  '20 x 20 metros',
  '25 x 25 metros',
  '28 x 28 metros',
  '30 x 30 metros',
  '32 x 32 metros',
  '35 x 35 metros',
  '40 x 40 metros',
];

export const NOMBRES_AN_CONOCIDOS = [
  'A/N Pontón Alimentador',
  'A/N Pontón de Servicio',
  'A/N Pontón Principal',
  'A/N Pontón Ensilaje',
  'A/N Barcaza Alimentadora',
  'A/N Barcaza de Servicio',
  'A/N Plataforma de Servicio',
];

export const CATALOGO_FOTOS: Record<'Extracción' | 'Desnaturalización' | 'Almacenamiento' | 'General' | 'Portada' | 'Paisaje' | 'Ubicación Espacial', string[]> = {
  'Extracción': [
    // Compresores
    'Electrocompresor Kaeser Mobilair M50E.',
    'Compresor M100.',
    'Atlas Copco GA90VSD.',
    'Compresor Atlas Copco H250 VSD.',
    'Compresor Atlas Copco XAS 98.',
    'Compresores operativos.',
    'Tablero de compresor utilizado para extracción.',
    // Manga y Bins
    'Manga de extracción operativa (todo el módulo).',
    'Bin de extracción de mortalidad en buen estado y operativo.',
    'Bins de extracción en buen estado y operativos.',
    'Manga y bin asegurados al módulo de cultivo correctamente.',
    // Líneas y Válvulas
    'Líneas de aire comprimido que recorren el centro, en buen estado y sin fisuras.',
    'Línea de aire comprimido desde el compresor al módulo.',
    'Línea de aire comprimido desde el compresor en buen estado y operativa.',
    'Válvulas de aire para extracción por jaula, operativas y en buen estado.',
    'Válvulas de Línea de aire comprimido desde los compresores.',
    // Seguridad y Sistema General
    'Sistemas de extracción asegurados correctamente.',
    'Sistema de mortalidad instalado en todo el módulo correctamente.',
    'Equipos de extracción correctamente instalados.',
    'Extintor PQS operativo.',
    'La Extracción de mortalidad presente en el módulo es mediante equipo R.O.V., apoyado por buceo semiautónomo y embarcación.',
  ],
  'Desnaturalización': [
    // Olla y Molienda
    'Olla trituradora operativa.',
    'Sistema de molienda operativo.',
    'Prepicado utilizado en sistema de ensilaje, en buen estado y operativo.',
    'Prepicador y motor operativo.',
    // Tableros Eléctricos
    'Tablero de equipos desnaturalización en norma.',
    'Tablero Sistema de Ensilaje en norma.',
    'Tablero de equipos desnaturalización operativos y en norma.',
    // Ácido y Piping
    'Bomba y pipeta de ácido fórmico en buen estado y operativo.',
    'Bomba de ácido en buen estado y operativa.',
    'Pipeta de ácido de sistema de desnaturalización, en buen estado y operativo.',
    'Piping en buen estado y operativo.',
    'Estanque de almacenamiento de ácido fórmico.',
    'Estanque de ácido fórmico con pretil en buen estado.',
    'Bomba de recirculación operativa.',
    // Logística Mortalidad
    'Tachos extracción de mortalidad rotulados.',
    'Tachos de transporte de mortalidad rotulados.',
    'Mesa de necropsia en buen estado.',
    // Seguridad E.P.P.
    'Lavaojos operativo.',
    'Lavaojos en buen estado y operativo.',
    'Cajón de E.P.P. e insumos del sistema de ensilaje.',
    'Casillero de E.P.P. en buen estado y operativo.',
    'Extintor PQS en norma.',
    // Incineración (centros Magallanes)
    'Sistema de incineración operativo.',
    'Proceso desnaturalización por Incineración efectiva.',
    'Escotilla de registro en buen estado.',
    'Infraestructura gas rotulada y protegida.',
    'Estanque gas de sistema incineración.',
  ],
  'Almacenamiento': [
    // Estanques
    'Estanques de almacenamiento en buen estado.',
    'Estanque con capacidad para {m3} m³ con recirculación.',
    // Recirculación
    'Bomba de recirculación en buen estado y operativa.',
    // Fondeo y Estructura
    'Plataforma asegurada a línea del pontón directamente, debido al arreglo de conexión propia.',
    'Cáncamo de fondeo correctamente instalado e asegurado.',
  ],
  'General': [
    // Generación Eléctrica
    'Generador de {kva} kVA.',
    // Orden y Limpieza
    'Área limpia, manejo de residuos eficiente.',
  ],
  'Portada': [
    'Vista aérea del centro de cultivo.',
    'Vista aérea del módulo de cultivo.',
    'Vista panorámica del centro de cultivo.',
    'Vista frontal del módulo de cultivo.',
    'Vista general de instalaciones del centro.',
  ],
  'Paisaje': [
    'Vista del entorno del centro de cultivo.',
    'Paisaje del canal.',
    'Vista panorámica del entorno.',
    'Vista del fiordo.',
    'Entorno natural del centro.',
  ],
  'Ubicación Espacial': [
    'Vista aérea general del centro — contexto geográfico.',
    'Vista lateral del módulo de cultivo.',
    'Vista de jaulas y estructura del módulo.',
    'Vista del pontón y sistema de apoyo.',
    'Vista aérea del sector de ensilaje y almacenamiento.',
    'Vista del centro desde la orilla.',
    'Vista diagonal del arreglo de jaulas.',
  ],
};

export const HISTORICO_CERTIFICACIONES = [
  {
    estado: "Enviado",
    fechaIngreso: "06-01-2024",
    fechaEnvioDoc: "",
    fechaFirma: "",
    fechaEmision: "17-01-2024",
    fechaRecepcionImg: "",
    rv: "",
    area: "",
    acs: "10A",
    empresa: "CERMAQ CHILE SA",
    titular: "",
    codigoCentro: "102105",
    nombreCentro: "AGUANTAO",
    numJaulas: "",
    tipoSistema: "LIFT-UP",
    capExtraccion: "16.08",
    capDesnaturalizacion: "83.3",
    capAlmacenamiento: "59.78",
    observaciones: "NO",
    fechaObs: "",
    nombreCertificador: "ENGELBERT FLORES",
    numRegistro: "DN-02727-2023",
    firmante: "ENGELBERT FLORES",
    oc: "OK",
    hes: "OK"
  },
  {
    estado: "Enviado",
    fechaIngreso: "24-06-2024",
    fechaEnvioDoc: "",
    fechaFirma: "",
    fechaEmision: "27-06-2024",
    fechaRecepcionImg: "",
    rv: "",
    area: "",
    acs: "22D",
    empresa: "MOWI",
    titular: "",
    codigoCentro: "110364",
    nombreCentro: "BUTAN 7",
    numJaulas: "",
    tipoSistema: "LIFT-UP",
    capExtraccion: "18.0",
    capDesnaturalizacion: "24.0",
    capAlmacenamiento: "49.0",
    observaciones: "NO",
    fechaObs: "",
    nombreCertificador: "ENGELBERT FLORES",
    numRegistro: "DN-02727-2023",
    firmante: "ENGELBERT FLORES",
    oc: "OK",
    hes: "OK"
  },
  {
    estado: "Enviado",
    fechaIngreso: "26-06-2024",
    fechaEnvioDoc: "",
    fechaFirma: "",
    fechaEmision: "01-07-2024",
    fechaRecepcionImg: "",
    rv: "",
    area: "",
    acs: "21B",
    empresa: "AQUACHILE",
    titular: "",
    codigoCentro: "110406",
    nombreCentro: "LALANCA 2",
    numJaulas: "",
    tipoSistema: "LIFT-UP",
    capExtraccion: "20",
    capDesnaturalizacion: "20",
    capAlmacenamiento: "20.58",
    observaciones: "NO",
    fechaObs: "",
    nombreCertificador: "ENGELBERT FLORES",
    numRegistro: "DN-02727-2023",
    firmante: "ENGELBERT FLORES",
    oc: "OK",
    hes: "OK"
  },
  {
    estado: "Enviado",
    fechaIngreso: "13-07-2024",
    fechaEnvioDoc: "",
    fechaFirma: "",
    fechaEmision: "26-07-2024",
    fechaRecepcionImg: "",
    rv: "",
    area: "",
    acs: "28A",
    empresa: "BLUMAR",
    titular: "",
    codigoCentro: "110557",
    nombreCentro: "ELENA NORTE",
    numJaulas: "",
    tipoSistema: "LIFT-UP",
    capExtraccion: "20.0",
    capDesnaturalizacion: "20.0",
    capAlmacenamiento: "44.1",
    observaciones: "NO",
    fechaObs: "",
    nombreCertificador: "ENGELBERT FLORES",
    numRegistro: "DN-02727-2023",
    firmante: "ENGELBERT FLORES",
    oc: "FALTA OC Y HES",
    hes: "OK"
  },
  {
    estado: "Enviado",
    fechaIngreso: "16-07-2024",
    fechaEnvioDoc: "",
    fechaFirma: "",
    fechaEmision: "22-07-2024",
    fechaRecepcionImg: "",
    rv: "",
    area: "",
    acs: "21D",
    empresa: "CAMANCHACA",
    titular: "",
    codigoCentro: "110707",
    nombreCentro: "WILLIAMS 1",
    numJaulas: "",
    tipoSistema: "LIFT-UP",
    capExtraccion: "20.0",
    capDesnaturalizacion: "20.0",
    capAlmacenamiento: "39.2",
    observaciones: "NO",
    fechaObs: "",
    nombreCertificador: "ENGELBERT FLORES",
    numRegistro: "DN-02727-2023",
    firmante: "ENGELBERT FLORES",
    oc: "OK",
    hes: "OK"
  }
];

// ---------------------------------------------------------------------------
// CATÁLOGO DE PLATAFORMAS / A/N ENSILAJE — Dimensiones conocidas
// Fuente: registros de inspección en terreno + especificaciones de fábrica.
// Usado para autocompletar Eslora / Manga / Puntal en sección Almacenamiento.
// ---------------------------------------------------------------------------
export interface PlataformaEntry {
  nombre: string;
  eslora: string;
  manga: string;
  puntal: string;
}

export const CATALOGO_PLATAFORMAS: PlataformaEntry[] = [
  // Modelos de fábrica
  { nombre: 'Ocea 3S - SB21 (fábrica)',    eslora: '6.0',   manga: '5.5',  puntal: '2.10' },
  // Plataformas documentadas en terreno
  { nombre: 'A/N Tricahue',                eslora: '24.62', manga: '11.0', puntal: '3.50' },
  { nombre: 'A/N Río Maullín',             eslora: '13.0',  manga: '9.0',  puntal: '1.5'  },
  // Rangos típicos (promedio de inspecciones)
  { nombre: 'Pontón pequeño  (~6 × 5 m)',  eslora: '6.0',   manga: '5.0',  puntal: '1.5'  },
  { nombre: 'Pontón mediano  (~9 × 6 m)',  eslora: '9.0',   manga: '6.0',  puntal: '1.5'  },
  { nombre: 'Pontón mediano  (~10 × 7 m)', eslora: '10.2',  manga: '7.0',  puntal: '2.0'  },
  { nombre: 'Pontón grande   (~13 × 9 m)', eslora: '13.0',  manga: '9.0',  puntal: '2.0'  },
  { nombre: 'Barcaza grande  (~25 × 11 m)',eslora: '24.62', manga: '11.0', puntal: '3.50' },
];

export const OPCIONES_INFRAESTRUCTURA = {
  pretil_material: ['Acero Inoxidable', 'Hormigón', 'Hormigón Armado'],
  piping_material: ['HDPE PN10 PE100 armado por electrofusión', 'HDPE'],
  piping_diametro: ['90mm / 4"', '90mm / 8"'],
  piping_valvulas: ['Válvulas Tipo Mariposa', 'Válvulas Tipo Bola'],
};

export const OPCIONES_INCINERADOR = {
  sistema_carga: ['CARGA MANUAL TACHOS 60L', 'N/A'],
  sistema_descarga: ['MANUAL HACIA MAXISACOS', 'N/A'],
  disposicion_final: ['VERTEDERO MUNICIPAL PTA ARENAS', 'N/A'],
  almacenamiento_gas: ['4000L X 2 = 8.000L GAS GLP', '4000L X 4 = 16.000L GAS GLP', 'N/A'],
};
