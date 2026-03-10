export interface GeneralData {
  certificador: {
    nombre: string;
    rut: string;
    numero_registro: string;
  };
  centro_cultivo: {
    codigo_centro: string;
    nombre_centro: string;
    titular: string;
    acs: string;
    ubicacion: string;
  };
  fechas: {
    evaluacion_documental: string;
    inspeccion_terreno: string;
    emision_certificado: string;
  };
}

export type FishSize = 'Pequeño (<1.5kg)' | 'Mediano (1.5-4.5kg)' | 'Grande (>=4.5kg)';
export type ExtractionSystem = 'LIFT-UP (Novatech)' | 'Mortex HW' | 'ROV' | 'Succión por Yoma';

export interface ExtractionData {
  sistemas_apoyo: {
    buceo: boolean;
    rov: boolean;
    succion_yoma: boolean;
    automatica: boolean;
  };
  parametros: {
    numero_total_jaulas: number;
    jaulas_simultaneas: number;
    horas_efectivas_trabajo: number;
    personal_operativo: number;
    profundidad_operacion_m: number;
    sistema_principal: ExtractionSystem;
    talla_pez: FishSize;
    factor_ajuste_biomasa: number;
    marca_equipo: string;
    id_catalogo_equipo: string;
    tipo_compresor: string;
    id_catalogo_compresor: string;
    potencia_cfm: number;
    capacidad_receptor_bins_litros: number;
    disponibilidad_base_fd: number;
  };
  resultados: {
    ciclos_por_dia: number;
    capacidad_diaria_ton: number;
    cumple_norma: boolean;
  };
}

export interface DenaturationData {
  equipos: {
    cantidad_sistemas: number;
    id_catalogo_trituradora: string;
    id_catalogo_incinerador: string;
    marca_modelo: string;
    velocidad_nominal_kg_hr: number;
    horas_funcionamiento_dia: number;
    cuenta_con_prepicador: boolean;
    capacidad_prepicador_kg_hr: number;
    cuenta_con_recirculacion_acido: boolean;
    material_construccion: string;
    tipo_sistema: 'Ensilaje' | 'Incineración';
  };
  parametros_batch: {
    kilos_por_batch: number;
    tiempo_procesamiento_min: number;
    tiempo_pausa_min: number;
  };
  parametros_incineracion: {
    capacidad_carga_kg_h: number;
    temperatura_operacion: string;
    camara_primaria: string;
    camara_secundaria: string;
  };
  generacion_electrica: Array<{
    tipo: string;
    marca: string;
    modelo: string;
    capacidad_kva: number;
    ubicacion: string;
  }>;
  resultados: {
    duracion_total_batch_min: number;
    numero_batches_dia: number;
    capacidad_diaria_ton: number;
    cumple_norma: boolean;
    observacion_automatica: string;
  };
}

export interface StorageData {
  parametros: {
    capacidad_almacenaje_m3: number;
    factor_densidad: number;
    observaciones: string;
  };
  infraestructura: {
    pretil_material: string;
    pretil_estado: 'Bueno' | 'Regular' | 'Malo';
    piping_material: string;
    piping_diametro: string;
    piping_valvulas: string;
    piping_estado: 'Bueno' | 'Regular' | 'Malo';
  };
  resultados: {
    capacidad_almacenaje_ton: number;
    cumple_norma: boolean;
  };
}

export interface ReportImage {
  id: string;
  url: string;
  seccion: 'Extracción' | 'Desnaturalización' | 'Almacenamiento' | 'General';
  leyenda: string;
  estado: 'Verde' | 'Amarillo' | 'Rojo';
  observacion: string;
}

export interface AppState {
  general: GeneralData;
  extraction: ExtractionData;
  denaturation: DenaturationData;
  storage: StorageData;
  images: ReportImage[];
}

export interface HistoryEntry {
  estado: string;
  fechaIngreso: string;
  fechaEnvioDoc: string;
  fechaFirma: string;
  fechaEmision: string;
  fechaRecepcionImg: string;
  rv: string;
  area: string;
  acs: string;
  empresa: string;
  titular: string;
  codigoCentro: string;
  nombreCentro: string;
  numJaulas: string;
  tipoSistema: string;
  capExtraccion: string;
  capDesnaturalizacion: string;
  capAlmacenamiento: string;
  observaciones: string;
  fechaObs: string;
  nombreCertificador: string;
  numRegistro: string;
  firmante: string;
  oc: string;
  hes: string;
}
