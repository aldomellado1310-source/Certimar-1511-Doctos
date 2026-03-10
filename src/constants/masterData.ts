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
