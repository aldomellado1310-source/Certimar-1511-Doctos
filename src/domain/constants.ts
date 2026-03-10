/**
 * Constantes regulatorias del sistema CERTIMAR 1511
 * Marco normativo: Resolución Exenta N°1511/2021 — D.S. N°320
 * Autoridad: Sernapesca / Subpesca — Chile
 *
 * IMPORTANTE: Cualquier modificación a estos valores debe ir acompañada de la
 * referencia normativa correspondiente y quedar registrada en IMPROVEMENTS.md.
 */

import type { FishSize, ExtractionSystem } from '../types';

// ---------------------------------------------------------------------------
// UMBRALES MÍNIMOS DE CAPACIDAD CERTIFICADA
// Res. Exenta N°1511/2021 — Requisitos de capacidad para centros de cultivo
// ---------------------------------------------------------------------------

/** Umbral mínimo de capacidad de extracción diaria (TN/día). Res. Exenta N°1511/2021. */
export const MIN_EXTRACTION_TON_DIA = 15;

/** Umbral mínimo de capacidad de desnaturalización diaria (TN/día). Res. Exenta N°1511/2021. */
export const MIN_DENATURATION_TON_DIA = 15;

/** Umbral mínimo de capacidad de almacenamiento de biomasa desnaturalizada (TN). Res. Exenta N°1511/2021. */
export const MIN_STORAGE_TON = 20;

// ---------------------------------------------------------------------------
// FACTORES DE EFICIENCIA OPERACIONAL (η) POR SISTEMA Y PROFUNDIDAD
// Res. Exenta N°1511/2021 — Parámetros técnicos de sistemas de extracción
// ---------------------------------------------------------------------------

/** η LIFT-UP (Novatech) en profundidad ≤ 25 m */
export const ETA_LIFTUP_SHALLOW = 0.95;
/** η Mortex HW en profundidad ≤ 25 m */
export const ETA_MORTEX_SHALLOW = 0.92;
/** η ROV en profundidad ≤ 25 m */
export const ETA_ROV_SHALLOW = 0.75;
/** η Succión por Yoma (no varía con profundidad) */
export const ETA_YOMA = 0.80;

/** η LIFT-UP (Novatech) en profundidad > 25 m */
export const ETA_LIFTUP_DEEP = 0.85;
/** η Mortex HW en profundidad > 25 m */
export const ETA_MORTEX_DEEP = 0.82;
/** η ROV en profundidad > 25 m */
export const ETA_ROV_DEEP = 0.70;

/** Profundidad (metros) a partir de la cual se aplica el factor de penalización de eficiencia */
export const DEPTH_THRESHOLD_M = 25;

// ---------------------------------------------------------------------------
// PARÁMETROS OPERACIONALES POR TALLA DE PEZ
// Res. Exenta N°1511/2021 — Tiempos base de ciclo y límites de biomasa por jaula
// ---------------------------------------------------------------------------

export interface FishSizeParams {
  /** Tiempo de trabajo efectivo por ciclo de extracción (minutos) */
  t_trabajo: number;
  /** Tiempo de pausa base entre jaulas (minutos) */
  t_pausa: number;
  /** Biomasa máxima por ciclo por jaula (kg) */
  biomasa_max_kg: number;
}

/** Tabla de parámetros operacionales indexada por talla de pez */
export const FISH_PARAMS: Record<FishSize, FishSizeParams> = {
  'Grande (>=4.5kg)':   { t_trabajo: 15, t_pausa: 2.15, biomasa_max_kg: 270 },
  'Mediano (1.5-4.5kg)': { t_trabajo: 12, t_pausa: 2.00, biomasa_max_kg: 375 },
  'Pequeño (<1.5kg)':   { t_trabajo: 10, t_pausa: 1.80, biomasa_max_kg: 360 },
};

// ---------------------------------------------------------------------------
// FACTORES DE DISPONIBILIDAD OPERACIONAL
// ---------------------------------------------------------------------------

/** Reducción adicional de disponibilidad (fd) cuando el personal operativo es insuficiente */
export const FD_REDUCTION_LOW_PERSONNEL = 0.90;

/** Mínimo de personal operativo para no aplicar penalización de disponibilidad */
export const MIN_PERSONNEL_THRESHOLD = 3;

/** Coeficiente que multiplica la pausa base por número de jaulas (pausa proporcional) */
export const PAUSA_PROPORCIONAL_COEF = 0.01;

// ---------------------------------------------------------------------------
// FACTOR DE EFICIENCIA DEL PREPICADOR (Ensilaje)
// Res. Exenta N°1511/2021 — Reducción de tiempo de ciclo batch por prepicador
// ---------------------------------------------------------------------------

/**
 * Factor multiplicador sobre la duración total del batch cuando el sistema
 * cuenta con prepicador. Valor < 1 implica reducción de tiempo (mayor eficiencia).
 * NOTA: Este valor es distinto del η ROV profundo (0.70) — no confundir.
 */
export const PREPICADOR_BATCH_FACTOR = 0.70;

// ---------------------------------------------------------------------------
// DENSIDAD DE REFERENCIA — ALMACENAMIENTO
// Res. Exenta N°1511/2021 — Método de cálculo de capacidad de almacenamiento
// ---------------------------------------------------------------------------

/**
 * Densidad del ácido fórmico usada para convertir volumen (m³) a toneladas.
 * Valor estándar: 1.2 TN/m³ (ácido fórmico comercial al 85%).
 */
export const FORMIC_ACID_DENSITY_TN_M3 = 1.2;

// ---------------------------------------------------------------------------
// MAPAS DE EFICIENCIA POR SISTEMA (derivados de las constantes anteriores)
// ---------------------------------------------------------------------------

/** η shallow por tipo de sistema */
export const ETA_BY_SYSTEM_SHALLOW: Record<ExtractionSystem, number> = {
  'LIFT-UP (Novatech)': ETA_LIFTUP_SHALLOW,
  'Mortex HW':          ETA_MORTEX_SHALLOW,
  'ROV':                ETA_ROV_SHALLOW,
  'Succión por Yoma':   ETA_YOMA,
};

/** η deep por tipo de sistema (Yoma no varía) */
export const ETA_BY_SYSTEM_DEEP: Record<ExtractionSystem, number> = {
  'LIFT-UP (Novatech)': ETA_LIFTUP_DEEP,
  'Mortex HW':          ETA_MORTEX_DEEP,
  'ROV':                ETA_ROV_DEEP,
  'Succión por Yoma':   ETA_YOMA,
};
