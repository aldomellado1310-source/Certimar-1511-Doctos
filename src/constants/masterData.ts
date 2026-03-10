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
      capacidad_prepicador_kg_h: 1000
    },
    { 
      id: 'optimo-mix-500', 
      marca_modelo: 'OPTIMO MIX OM 500', 
      capacidad_nominal_kg_h: 2100, 
      almacenamiento_l: 500,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 8000
    },
    { 
      id: 'ocea-sw700', 
      marca_modelo: 'OCEA SW-700L-OCH 7.5 KW', 
      capacidad_nominal_kg_h: 2450, 
      almacenamiento_l: 700,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 2000
    },
    { 
      id: 'acuimaster-ac715', 
      marca_modelo: 'ACUIMASTER AC-715 LT', 
      capacidad_nominal_kg_h: 1680, 
      almacenamiento_l: 715,
      material: 'Acero inoxidable AISI 304/316-L',
      capacidad_prepicador_kg_h: 1200
    }
  ],
  incineradores: [
    {
      id: 'addfield-thunder-1000',
      marca_modelo: 'Addfield THUNDER 1000',
      capacidad_carga_kg_h: 150,
      temperatura: '850–1100°C',
      camara_primaria: '1.45m',
      camara_secundaria: '2.0m'
    }
  ]
};

export const CATALOGO_GENERADORES = [
  { id: 'cummins-c110d5', marca: 'Cummins', modelo: 'C110D5', kva: 110 },
  { id: 'cummins-c250d5', marca: 'Cummins', modelo: 'C250 D5', kva: 250 },
  { id: 'fg-p65-6', marca: 'FG Wilson', modelo: 'P65-6', kva: 65 },
  { id: 'fg-p125-1', marca: 'FG Wilson', modelo: 'P125-1', kva: 125 },
  { id: 'fg-c150d5', marca: 'FG Wilson', modelo: 'C150D5', kva: 150 },
  { id: 'fg-p220-3', marca: 'FG Wilson', modelo: 'P220-3', kva: 220 },
  { id: 'werbank-160g', marca: 'Werbank', modelo: '160G', kva: 160 },
  { id: 'weichai-wpg33l1', marca: 'Weichai', modelo: 'WPG33L1', kva: 33 },
];

export const CATALOGO_ALMACENAMIENTO = [20, 21, 30, 32, 40, 45, 50];

export const CATALOGO_CENTROS = [
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
  }
];

// ---------------------------------------------------------------------------
// CATÁLOGO MAESTRO DE LEYENDAS FOTOGRÁFICAS
// Descripciones validadas extraídas de Informes Técnicos reales.
// Usadas como autocompletado en la grilla de imágenes del Informe.
// Placeholders dinámicos: {m3} → capacidad estanque, {kva} → potencia generador.
// ---------------------------------------------------------------------------

export const CATALOGO_FOTOS: Record<'Extracción' | 'Desnaturalización' | 'Almacenamiento' | 'General', string[]> = {
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
