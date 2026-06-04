/**
 * Fixture compartido para tests de dominio — CERTIMAR 1511
 * Centro real 110814 "PAMELA" — EXPORTADORA LOS FIORDOS LTDA.
 * Fuente: registro enviado 02-01-2026, inspección 08-01-2026.
 */

import type { AppState } from '../types';

export const FIXTURE_STATE: AppState = {
  general: {
    certificador: {
      nombre: 'ENGELBERT FLORES',
      rut: '13.968.696-9',
      numero_registro: 'DN-02727-2023',
    },
    centro_cultivo: {
      codigo_centro: '110814',
      nombre_centro: 'PAMELA',
      titular: 'EXPORTADORA LOS FIORDOS LTDA.',
      acs: '24',
      ubicacion: 'CANAL MORALEDA, AL ESTE DE ISLA AUCHILE, Región de Aysén del General Carlos Ibáñez del Campo',
      formato_modulo: '24 jaulas, tipo Metálicas',
      tamano_jaulas: '30 x 30 metros',
      coordenadas_ensilaje: '45°30\'S 72°45\'W',
      nombre_an_ensilaje: 'A/N PAMELA',
    },
    fechas: {
      evaluacion_documental: '2026-01-02',
      inspeccion_terreno: '2026-01-08',
      emision_certificado: '2026-02-10',
    },
    observaciones_acta: '',
  },
  extraction: {
    sistemas_apoyo: { buceo: false, rov: false, succion_yoma: false, automatica: false },
    parametros: {
      numero_total_jaulas: 24,
      jaulas_simultaneas: 3,
      horas_efectivas_trabajo: 9,
      personal_operativo: 4,
      profundidad_operacion_m: 20,
      sistema_principal: 'LIFT-UP',
      talla_pez: 'Grande (>=4.5kg)',
      factor_ajuste_biomasa: 1.0,
      marca_equipo: 'Novatech 10"',
      id_catalogo_equipo: 'novatech-10',
      tipo_compresor: 'Kaeser M50E',
      id_catalogo_compresor: 'kaeser-m50e',
      potencia_cfm: 185,
      capacidad_receptor_bins_litros: 500,
      disponibilidad_base_fd: 0.90,
      motocompresores_por_jaula: 1,
      ubicacion_compresor: 'A/N Pontón',
      observacion_sistema: '',
      n_teams_buceo: 1,
      n_buzos_por_team: 4,
      periodicidad_buceo: 'DIARIA',
    },
    resultados: {
      ciclos_por_dia: 21,
      capacidad_diaria_ton: 23.6,  // valor real del registro
      cumple_norma: true,           // 23.6 ≥ 15
    },
    equipos_extraccion: [],
  },
  denaturation: {
    equipos: {
      cantidad_sistemas: 1,
      cantidad_ollas: 1,
      id_catalogo_trituradora: 'acuimaster-ac715',
      id_catalogo_incinerador: '',
      marca_modelo: 'ACUIMASTER AC-715 LT',
      velocidad_nominal_kg_hr: 1500,
      horas_funcionamiento_dia: 9,
      cuenta_con_prepicador: false,
      marca_modelo_prepicador: '',
      cantidad_prepicador: 0,
      capacidad_prepicador_kg_hr: 0,
      factor_eficiencia_prepicador: 0.70,
      cuenta_con_recirculacion_acido: true,
      material_construccion: 'Acero inoxidable AISI 304',
      tipo_sistema: 'Ensilaje',
      estado_olla: 'Bueno' as const,
    },
    parametros_batch: {
      kilos_por_batch: 700,
      tiempo_procesamiento_min: 15,
      tiempo_pausa_min: 10,
    },
    parametros_incineracion: {
      capacidad_carga_kg_h: 0,
      temperatura_operacion: '',
      camara_primaria: '',
      camara_secundaria: '',
    },
    incinerador: {
      activo: false,
      id_catalogo: '',
      marca_modelo: '',
      capacidad_carga_kg_h: 0,
      horas_funcionamiento_dia: 8,
      num_quemadores_primaria: 0,
      num_quemadores_secundaria: 0,
      temperatura_camara_primaria_c: 0,
      temperatura_camara_secundaria_c: 0,
      requerimiento_energetico: '',
      sistema_carga: 'N/A',
      sistema_descarga: 'N/A',
      disposicion_final: 'N/A',
      almacenamiento_gas: 'N/A',
      observaciones: '',
    },
    generacion_electrica: [],
    resultados: {
      duracion_total_batch_min: 25,
      numero_batches_dia: 21,
      capacidad_ensilaje_ton: 17.9,
      capacidad_incinerador_ton: 0,
      capacidad_diaria_ton: 17.9,
      cumple_norma: true,
      observacion_automatica: '',
    },
  },
  storage: {
    parametros: {
      capacidad_almacenaje_m3: 21,
      factor_densidad: 1.2,
      observaciones: 'Estanque de acero inoxidable con dique de contención.',
    },
    infraestructura: {
      pretil_material: 'Hormigón',
      pretil_estado: 'Bueno',
      piping_material: 'HDPE',
      piping_diametro: '2"',
      piping_valvulas: 'Válvula de bola DN50',
      piping_estado: 'Bueno',
      eslora_m: '25',
      manga_m: '8',
      puntual_m: '2',
    },
    resultados: {
      capacidad_almacenaje_ton: 25.2,  // valor real del registro (21 m³ × 1.2)
      cumple_norma: true,               // 25.2 ≥ 20
    },
  },
  images: [],
};
