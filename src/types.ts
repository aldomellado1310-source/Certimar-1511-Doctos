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
    formato_modulo: string;       // Ej. "24 jaulas, tipo Metálicas"
    tamano_jaulas: string;        // Ej. "30 x 30 metros"
    coordenadas_ensilaje: string; // GPS del A/N Ensilaje
    nombre_an_ensilaje: string;   // Nombre del A/N donde opera el ensilaje
  };
  fechas: {
    evaluacion_documental: string;
    inspeccion_terreno: string;
    emision_certificado: string;
  };
  modo_operacion_minima?: boolean;
  observaciones_acta: string;
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
    t_trabajo_override_min?: number;  // sobreescribe FISH_PARAMS cuando está en modo Op. Mínima
    motocompresores_por_jaula: number;  // N° motocompresores por jaula
    ubicacion_compresor: string;        // Ubicación física del compresor de aire
    observacion_sistema: string;        // Observación libre del sistema automático
    n_teams_buceo?: number;              // N° teams de buceo
    n_buzos_por_team?: number;          // N° buzos por team
    periodicidad_buceo?: string;        // Periodicidad buceo (ej. "DIARIA")
  };
  resultados: {
    ciclos_por_dia: number;
    capacidad_diaria_ton: number;
    cumple_norma: boolean;
  };
  equipos_extraccion: Array<{
    tipo: string;
    id_catalogo: string;
    marca: string;
    modelo: string;
    capacidad_kg_h: number;
    ubicacion: string;
  }>;
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
    marca_modelo_prepicador: string;
    cantidad_prepicador: number;
    capacidad_prepicador_kg_hr: number;
    factor_eficiencia_prepicador: number;   // 0–1, ej. 0.70 = 30% reducción de tiempo proceso
    cuenta_con_recirculacion_acido: boolean;
    material_construccion: string;
    tipo_sistema: 'Ensilaje' | 'Incineración';
    estado_olla: 'Bueno' | 'Regular' | 'Malo';
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
  incinerador: {
    activo: boolean;
    id_catalogo: string;
    marca_modelo: string;
    capacidad_carga_kg_h: number;
    horas_funcionamiento_dia: number;
    num_quemadores_primaria: number;
    num_quemadores_secundaria: number;
    temperatura_camara_primaria_c: number;
    temperatura_camara_secundaria_c: number;
    requerimiento_energetico: string;
    sistema_carga: string;
    sistema_descarga: string;
    disposicion_final: string;
    almacenamiento_gas: string;
    observaciones: string;
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
    capacidad_ensilaje_ton: number;
    capacidad_incinerador_ton: number;
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
    eslora_m: string;   // Dimensiones A/N Pontón — Eslora
    manga_m: string;    // Manga
    puntual_m: string;  // Puntual
  };
  resultados: {
    capacidad_almacenaje_ton: number;
    cumple_norma: boolean;
  };
}

export type ImageSeccion =
  | 'Portada'
  | 'Paisaje'
  | 'Ubicación Espacial'
  | 'Extracción'
  | 'Desnaturalización'
  | 'Almacenamiento'
  | 'General';

export interface ReportImage {
  id: string;
  url: string;
  seccion: ImageSeccion;
  leyenda: string;
  estado: 'Verde' | 'Amarillo' | 'Rojo';
  observacion: string;
  enPortada?: boolean;
  slotUbicacion?: 'top' | 'left' | 'right' | 'bottom';
  croppedUrl?: string;  // data URL de recorte manual; si existe, se usa en PDF en lugar de url
}

export interface AppState {
  general: GeneralData;
  extraction: ExtractionData;
  denaturation: DenaturationData;
  storage: StorageData;
  images: ReportImage[];
  registroId?: string;  // correlativo interno (REG-001…), nunca incluido en documentos
}

export type EventoTipo =
  | 'login'
  | 'generar_certificado'
  | 'generar_informe'
  | 'generar_acta'
  | 'ver_historico'
  | 'abrir_registro'
  | 'crear_registro';

export interface EventoUso {
  tipo: EventoTipo;
  usuario: string;
  codigoCentro?: string;
  nombreCentro?: string;
  titular?: string;
  fecha: any; // Firestore Timestamp
}

export type TipoEquipoCatalogo =
  | 'trituradora'
  | 'incinerador'
  | 'prepicador'
  | 'grinder_pump'
  | 'ensilador'
  | 'bomba_centrifuga'
  | 'dosificador'
  | 'linea_extraccion'
  | 'compresor';

export interface CatalogoCustomEntry {
  id?: string;                          // Firestore document ID (para eliminación)
  tipo: TipoEquipoCatalogo;
  marca_modelo: string;
  fabricante?: string;
  // Campos trituradora / grinder_pump
  capacidad_nominal_kg_h?: number;
  almacenamiento_l?: number;
  material?: string;
  capacidad_prepicador_kg_h?: number;
  configuraciones_batch?: Array<{ label: string; kilos: number; t_proceso: number; t_pausa: number }>;
  // Campos incinerador
  capacidad_carga_kg_h?: number;
  // Campos prepicador / linea_extraccion / compresor
  rendimiento_kg_h?: number;
  potencia_kw?: number;
  cfm?: number;
  // Notas libres (todos los tipos)
  notas?: string;
  creadoPor: string;
  __createdAt: any;
}

export interface RegistroHistorico {
  id?: string;               // Firestore doc ID (= registroId)
  registroId: string;
  codigoCentro: string;
  nombreCentro: string;
  titular: string;
  fechaInspeccion: string;
  documentosGenerados: string[];  // 'certificado' | 'informe' | 'acta'
  // Estado de gestión
  esBorrador?: boolean;
  aprobado?: boolean;
  firmado?: boolean;
  enviado_sernapesca?: boolean;
  cliente_notificado?: boolean;
  // Snapshot del estado (con URLs de Firebase Storage)
  snapshot: Omit<AppState, 'images'> & {
    images: Array<Omit<ReportImage, 'url'> & { url?: string }>;
  };
  metricas?: {
    capExtraccion: number;
    capDesnaturalizacion: number;
    capAlmacenamiento: number;
    cumpleExtraccion: boolean;
    cumpleDesnaturalizacion: boolean;
    cumpleAlmacenamiento: boolean;
    sistemaExtraccion: string;
    sistemaDesnaturalizacion: string;
    modoOperacionMinima: boolean;
    numJaulas: number;
    jaulas_simultaneas: number;
    profundidad_m: number;
  };
  documentUrls?: {
    certificado?: string;
    informe?: string;
    acta?: string;
    registro_visita?: string;
  };
  __updatedAt?: any;
  creadoEn?: any;
}
