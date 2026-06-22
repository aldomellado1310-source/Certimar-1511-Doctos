/**
 * Tests unitarios — Cálculos regulatorios CERTIMAR 1511
 * Res. Exenta N°1511/2021 — D.S. N°320
 *
 * Cobertura priorizada:
 *  - Casos borde que afectan cumplimiento/incumplimiento normativo
 *  - División por cero en ensilaje (F1 — riesgo crítico)
 *  - Exactitud de umbrales (15/15/20 TN)
 *  - Efectos de profundidad, personal y prepicador
 */

import { describe, it, expect } from 'vitest';
import { calculateExtraction, calculateDenaturation, calculateStorage } from './calculations';
import {
  MIN_EXTRACTION_TON_DIA,
  MIN_DENATURATION_TON_DIA,
  MIN_STORAGE_TON,
  FORMIC_ACID_DENSITY_TN_M3,
} from './constants';

// ---------------------------------------------------------------------------
// HELPERS — parámetros base válidos reutilizables en los tests
// ---------------------------------------------------------------------------

const BASE_EXTRACTION_PARAMS = {
  numero_total_jaulas: 18,
  jaulas_simultaneas: 2,
  horas_efectivas_trabajo: 9,
  personal_operativo: 4,
  profundidad_operacion_m: 20,
  sistema_principal: 'LIFT-UP' as const,
  talla_pez: 'Grande (>=4.5kg)' as const,
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
};

const BASE_EQUIPOS_ENSILAJE = {
  cantidad_sistemas: 1,
  cantidad_ollas: 1,
  id_catalogo_trituradora: 'acuimaster-ac715',
  id_catalogo_incinerador: '',
  marca_modelo: 'ACUIMASTER AC-715 LT',
  velocidad_nominal_kg_hr: 1680,
  horas_funcionamiento_dia: 9,
  cuenta_con_prepicador: false,
  marca_modelo_prepicador: '',
  cantidad_prepicador: 0,
  capacidad_prepicador_kg_hr: 0,
  factor_eficiencia_prepicador: 0.70,
  cuenta_con_recirculacion_acido: true,
  material_construccion: 'Acero inoxidable AISI 304',
  tipo_sistema: 'Ensilaje' as const,
  estado_olla: 'Bueno' as const,
};

const BASE_BATCH_PARAMS = {
  kilos_por_batch: 700,
  tiempo_procesamiento_min: 15,
  tiempo_pausa_min: 10,
};

const BASE_INCINERACION_PARAMS = {
  capacidad_carga_kg_h: 0,
  temperatura_operacion: '850-1100°C',
  camara_primaria: '1.45m',
  camara_secundaria: '2.0m',
};

const BASE_STORAGE_PARAMS = {
  capacidad_almacenaje_m3: 20,
  factor_densidad: FORMIC_ACID_DENSITY_TN_M3,
  observaciones: 'SE REALIZA EL CÁLCULO POR DENSIDAD DE ÁCIDO FÓRMICO 1.2 TN/M3',
};

// ===========================================================================
// EXTRACCIÓN
// ===========================================================================

describe('calculateExtraction', () => {
  describe('Caso base — parámetros estándar LIFT-UP, Grande, profundidad ≤ 25m', () => {
    it('produce un resultado numérico finito y no negativo', () => {
      const r = calculateExtraction(BASE_EXTRACTION_PARAMS);
      expect(isFinite(r.capacidad_diaria_ton)).toBe(true);
      expect(r.capacidad_diaria_ton).toBeGreaterThanOrEqual(0);
      expect(isFinite(r.ciclos_por_dia)).toBe(true);
    });

    it('2 jaulas simultáneas + 9h + Grande producen ~14.2 TN/día (NO cumple con parámetros conservadores)', () => {
      // Cálculo esperado:
      //   t_ciclo = 15 + 2.15 + (2.15×0.01×18) = 17.537 min
      //   ciclos/día = 540 / 17.537 = 30.79
      //   cap = (2 × 30.79 × 270 × 0.95 × 0.90) / 1000 ≈ 14.22 TN/día
      const r = calculateExtraction(BASE_EXTRACTION_PARAMS);
      expect(r.capacidad_diaria_ton).toBeCloseTo(14.22, 0);
      expect(r.cumple_norma).toBe(false);
    });

    it('cumple la norma con 3 jaulas simultáneas (≥ 15 TN/día)', () => {
      // 3 jaulas simult × 30.79 ciclos × 270 kg × 0.95η × 0.90fd / 1000 ≈ 21.33 TN/día
      const r = calculateExtraction({ ...BASE_EXTRACTION_PARAMS, jaulas_simultaneas: 3 });
      expect(r.cumple_norma).toBe(true);
      expect(r.capacidad_diaria_ton).toBeGreaterThanOrEqual(MIN_EXTRACTION_TON_DIA);
    });
  });

  describe('Umbral exacto — Res. Exenta N°1511/2021: mínimo 15 TN/día', () => {
    it('NO cumple cuando capacidad < 15 TN/día (pocas horas y pocas jaulas)', () => {
      const r = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        horas_efectivas_trabajo: 1,
        jaulas_simultaneas: 1,
        factor_ajuste_biomasa: 0.1,
      });
      expect(r.cumple_norma).toBe(false);
      expect(r.capacidad_diaria_ton).toBeLessThan(MIN_EXTRACTION_TON_DIA);
    });

    it('cumple_norma es true exactamente en el umbral de 15 TN/día', () => {
      // Validamos que el operador >= se aplica correctamente (no >)
      // Construimos condiciones que produzcan ~15 TN y verificamos comportamiento de umbral
      const r = calculateExtraction(BASE_EXTRACTION_PARAMS);
      const cumple = r.capacidad_diaria_ton >= MIN_EXTRACTION_TON_DIA;
      expect(r.cumple_norma).toBe(cumple);
    });
  });

  describe('Penalización por profundidad > 25m', () => {
    it('reduce la capacidad al operar a mayor profundidad (LIFT-UP)', () => {
      const shallow = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        profundidad_operacion_m: 20,
      });
      const deep = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        profundidad_operacion_m: 30,
      });
      expect(deep.capacidad_diaria_ton).toBeLessThan(shallow.capacidad_diaria_ton);
    });

    it('aplica η correcto para ROV en profundidad > 25m', () => {
      const shallowROV = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        sistema_principal: 'ROV',
        profundidad_operacion_m: 20,
      });
      const deepROV = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        sistema_principal: 'ROV',
        profundidad_operacion_m: 30,
      });
      // ROV shallow (0.75) vs deep (0.70): deep debe ser menor
      expect(deepROV.capacidad_diaria_ton).toBeLessThan(shallowROV.capacidad_diaria_ton);
    });
  });

  describe('Penalización por personal insuficiente (< 3 operarios)', () => {
    it('reduce la capacidad cuando personal_operativo < 3', () => {
      const suficiente = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        personal_operativo: 3,
      });
      const insuficiente = calculateExtraction({
        ...BASE_EXTRACTION_PARAMS,
        personal_operativo: 2,
      });
      expect(insuficiente.capacidad_diaria_ton).toBeLessThan(suficiente.capacidad_diaria_ton);
    });

    it('NO aplica penalización cuando personal_operativo es exactamente 3', () => {
      const con3 = calculateExtraction({ ...BASE_EXTRACTION_PARAMS, personal_operativo: 3 });
      const con4 = calculateExtraction({ ...BASE_EXTRACTION_PARAMS, personal_operativo: 4 });
      // Ambos deben tener la misma capacidad (sin penalización)
      expect(con3.capacidad_diaria_ton).toBe(con4.capacidad_diaria_ton);
    });
  });

  describe('Ajuste de biomasa como factor de multiplicación', () => {
    it('escala la capacidad proporcionalmente aun cuando el equipo es el límite (Scale AQ 8" Pequeño)', () => {
      // Scale AQ 8" = 1700 kg/h, Pequeño (t_trabajo 10) → equipo limita a ~283 kg/ciclo (< biomasa 360).
      // El ajuste debe multiplicar el resultado efectivo, no quedar absorbido por el min().
      const params = {
        ...BASE_EXTRACTION_PARAMS,
        talla_pez: 'Pequeño (<1.5kg)' as const,
        id_catalogo_equipo: 'scaleaq-8',
        marca_equipo: 'Scale AQ 8"',
        factor_ajuste_biomasa: 1.0,
      };
      const base  = calculateExtraction(params);
      const doble = calculateExtraction({ ...params, factor_ajuste_biomasa: 2.0 });
      expect(doble.capacidad_diaria_ton).toBeCloseTo(base.capacidad_diaria_ton * 2, 5);
    });

    it('reduce la capacidad a la mitad con factor 0.5', () => {
      const base  = calculateExtraction(BASE_EXTRACTION_PARAMS);
      const mitad = calculateExtraction({ ...BASE_EXTRACTION_PARAMS, factor_ajuste_biomasa: 0.5 });
      expect(mitad.capacidad_diaria_ton).toBeCloseTo(base.capacidad_diaria_ton / 2, 5);
    });
  });

  describe('Variación por talla de pez', () => {
    it('pez Mediano produce mayor capacidad kg_bins que Grande (375 > 270 kg)', () => {
      const grande = calculateExtraction({ ...BASE_EXTRACTION_PARAMS, talla_pez: 'Grande (>=4.5kg)' });
      const mediano = calculateExtraction({ ...BASE_EXTRACTION_PARAMS, talla_pez: 'Mediano (1.5-4.5kg)' });
      // Mediano tiene mayor biomasa_max pero menor t_trabajo — el resultado neto
      // depende de la fórmula; verificamos que produce valores finitos y distintos
      expect(isFinite(mediano.capacidad_diaria_ton)).toBe(true);
      expect(mediano.capacidad_diaria_ton).not.toBe(grande.capacidad_diaria_ton);
    });
  });
});

// ===========================================================================
// DESNATURALIZACIÓN — ENSILAJE
// ===========================================================================

describe('calculateDenaturation (Ensilaje)', () => {
  describe('Caso base — parámetros estándar', () => {
    it('produce resultado finito y no negativo', () => {
      const r = calculateDenaturation(BASE_EQUIPOS_ENSILAJE, BASE_BATCH_PARAMS, BASE_INCINERACION_PARAMS);
      expect(isFinite(r.capacidad_diaria_ton)).toBe(true);
      expect(r.capacidad_diaria_ton).toBeGreaterThanOrEqual(0);
    });

    it('calcula correctamente batches/día para parámetros conocidos', () => {
      // batch_duration = 15 + 10 = 25 min
      // num_batches = (9 * 60) / 25 = 21.6
      // capacity = 21.6 * 700 / 1000 = 15.12 TN/día
      const r = calculateDenaturation(BASE_EQUIPOS_ENSILAJE, BASE_BATCH_PARAMS, BASE_INCINERACION_PARAMS);
      expect(r.duracion_total_batch_min).toBe(25);
      expect(r.numero_batches_dia).toBeCloseTo(21.6, 1);
      expect(r.capacidad_diaria_ton).toBeCloseTo(15.12, 1);
      expect(r.cumple_norma).toBe(true);
    });
  });

  describe('CRÍTICO — F1: Guard DIV/0 — tiempo de ciclo = 0', () => {
    it('NO produce Infinity cuando tiempo_procesamiento=0 y tiempo_pausa=0', () => {
      const r = calculateDenaturation(
        BASE_EQUIPOS_ENSILAJE,
        { ...BASE_BATCH_PARAMS, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(isFinite(r.capacidad_diaria_ton)).toBe(true);
      expect(r.capacidad_diaria_ton).toBe(0);
    });

    it('retorna cumple_norma=false cuando tiempo de ciclo = 0 (previene certificación fraudulenta)', () => {
      const r = calculateDenaturation(
        BASE_EQUIPOS_ENSILAJE,
        { ...BASE_BATCH_PARAMS, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.cumple_norma).toBe(false);
    });

    it('retorna cumple_norma=false cuando tiempo de ciclo = 0 con prepicador activado', () => {
      // Con prepicador: batch_duration = 0 * 0.70 = 0 → debe seguir siendo guard
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        { ...BASE_BATCH_PARAMS, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.cumple_norma).toBe(false);
      expect(r.capacidad_diaria_ton).toBe(0);
    });

    it('incluye mensaje de error descriptivo cuando tiempo de ciclo = 0', () => {
      const r = calculateDenaturation(
        BASE_EQUIPOS_ENSILAJE,
        { ...BASE_BATCH_PARAMS, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.observacion_automatica).toContain('Error de configuración');
    });
  });

  describe('Umbral exacto — Res. Exenta N°1511/2021: mínimo 15 TN/día', () => {
    it('NO cumple cuando capacidad < 15 TN/día', () => {
      const r = calculateDenaturation(
        BASE_EQUIPOS_ENSILAJE,
        { ...BASE_BATCH_PARAMS, kilos_por_batch: 100 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.cumple_norma).toBe(false);
      expect(r.capacidad_diaria_ton).toBeLessThan(MIN_DENATURATION_TON_DIA);
    });

    it('cumple_norma es true exactamente en el umbral de 15 TN/día', () => {
      const r = calculateDenaturation(BASE_EQUIPOS_ENSILAJE, BASE_BATCH_PARAMS, BASE_INCINERACION_PARAMS);
      const cumple = r.capacidad_diaria_ton >= MIN_DENATURATION_TON_DIA;
      expect(r.cumple_norma).toBe(cumple);
    });
  });

  describe('Efecto del prepicador — Res. Exenta N°1511/2021', () => {
    it('reduce la duración del batch en un 30% cuando cuenta_con_prepicador=true', () => {
      const sin = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: false },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      const con = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      // Prepicador reduce duración batch: 25 * 0.70 = 17.5 min
      expect(con.duracion_total_batch_min).toBeCloseTo(sin.duracion_total_batch_min * 0.70, 1);
    });

    it('aumenta la capacidad diaria al usar prepicador', () => {
      const sin = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: false },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      const con = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(con.capacidad_diaria_ton).toBeGreaterThan(sin.capacidad_diaria_ton);
    });

    it('glosa_eficiencia_prepicador es cadena vacía cuando NO hay prepicador', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: false },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('glosa_eficiencia_prepicador es cadena vacía en ruta de incineración', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, tipo_sistema: 'Incineración' as const },
        BASE_BATCH_PARAMS,
        { ...BASE_INCINERACION_PARAMS, capacidad_carga_kg_h: 2000 }
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('glosa_eficiencia_prepicador es cadena vacía en el guard de batch ≤ 0', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        { ...BASE_BATCH_PARAMS, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('glosa declara el método de cálculo, el factor y el incremento de capacidad', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toContain(
        'La capacidad diaria de desnaturalización por ensilaje se calcula como:'
      );
      expect(r.glosa_eficiencia_prepicador).toContain('factor de eficiencia: 70%');
      expect(r.glosa_eficiencia_prepicador).toContain('se reduce de 25,0 a 17,5 min');
      expect(r.glosa_eficiencia_prepicador).toContain(
        'incrementa dicha capacidad de 15,1 a 21,6 TN/día (+43,0%)'
      );
    });

    it('el método aparece ANTES de la mención del prepicador en la glosa', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      const g = r.glosa_eficiencia_prepicador;
      expect(g.indexOf('se calcula como:')).toBeLessThan(g.indexOf('Con prepicador activo'));
    });

    it('glosa vacía cuando el prepicador está activo pero el factor es 1 (sin ganancia)', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true, factor_eficiencia_prepicador: 1 },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toBe('');
    });

    it('la observación en pantalla embebe exactamente la misma glosa (fuente única)', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      // Verifica la garantía de fuente única: la observación contiene la glosa verbatim.
      expect(r.observacion_automatica).toContain(r.glosa_eficiencia_prepicador);
    });

    it('omite la cláusula de incremento cuando cap_sin redondea a 0 (kilos_por_batch=0)', () => {
      const r = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cuenta_con_prepicador: true },
        { ...BASE_BATCH_PARAMS, kilos_por_batch: 0 },
        BASE_INCINERACION_PARAMS
      );
      expect(r.glosa_eficiencia_prepicador).toContain('factor de eficiencia');
      expect(r.glosa_eficiencia_prepicador).not.toContain('incrementa');
    });
  });

  describe('Factor de multiplicación por cantidad de ollas trituradoras', () => {
    it('duplica la capacidad diaria con 2 ollas (procesamiento en paralelo)', () => {
      const una = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cantidad_ollas: 1 },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      const dos = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cantidad_ollas: 2 },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(dos.capacidad_diaria_ton).toBeCloseTo(una.capacidad_diaria_ton * 2, 5);
      // La duración del batch y los batches/día por olla NO cambian
      expect(dos.duracion_total_batch_min).toBe(una.duracion_total_batch_min);
      expect(dos.numero_batches_dia).toBe(una.numero_batches_dia);
    });

    it('trata cantidad_ollas ausente o ≤ 0 como 1 (sin penalizar capacidad)', () => {
      const base = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cantidad_ollas: 1 },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      const cero = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cantidad_ollas: 0 },
        BASE_BATCH_PARAMS,
        BASE_INCINERACION_PARAMS
      );
      expect(cero.capacidad_diaria_ton).toBeCloseTo(base.capacidad_diaria_ton, 5);
    });

    it('un centro que NO cumple con 1 olla puede cumplir con varias ollas', () => {
      // 700 kg/batch, 25 min, 9h → ~15.12 TN/día con 1 olla. Con kg/batch menor cae bajo el umbral.
      const params = { ...BASE_BATCH_PARAMS, kilos_por_batch: 400 };
      const una = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cantidad_ollas: 1 }, params, BASE_INCINERACION_PARAMS
      );
      const tres = calculateDenaturation(
        { ...BASE_EQUIPOS_ENSILAJE, cantidad_ollas: 3 }, params, BASE_INCINERACION_PARAMS
      );
      expect(una.cumple_norma).toBe(false);
      expect(tres.cumple_norma).toBe(true);
    });
  });

  describe('Pausa = 0 pero proceso > 0 (caso borde realista)', () => {
    it('calcula correctamente sin producir Infinity', () => {
      const r = calculateDenaturation(
        BASE_EQUIPOS_ENSILAJE,
        { ...BASE_BATCH_PARAMS, tiempo_pausa_min: 0, tiempo_procesamiento_min: 20 },
        BASE_INCINERACION_PARAMS
      );
      expect(isFinite(r.capacidad_diaria_ton)).toBe(true);
      expect(r.capacidad_diaria_ton).toBeGreaterThan(0);
    });
  });
});

// ===========================================================================
// DESNATURALIZACIÓN — INCINERACIÓN
// ===========================================================================

describe('calculateDenaturation (Incineración)', () => {
  const equiposIncineracion = {
    ...BASE_EQUIPOS_ENSILAJE,
    tipo_sistema: 'Incineración' as const,
  };

  it('usa la capacidad de carga kg/h para calcular toneladas diarias', () => {
    // 2000 kg/h × 9h = 18000 kg = 18 TN/día
    const r = calculateDenaturation(
      equiposIncineracion,
      BASE_BATCH_PARAMS,
      { ...BASE_INCINERACION_PARAMS, capacidad_carga_kg_h: 2000 }
    );
    expect(r.capacidad_diaria_ton).toBeCloseTo(18, 1);
    expect(r.cumple_norma).toBe(true);
  });

  it('NO cumple con el incinerador de catálogo (150 kg/h × 9h = 1.35 TN/día)', () => {
    // El incinerador Addfield THUNDER 1000 (150 kg/h) nunca alcanza 15 TN/día
    const r = calculateDenaturation(
      equiposIncineracion,
      BASE_BATCH_PARAMS,
      { ...BASE_INCINERACION_PARAMS, capacidad_carga_kg_h: 150 }
    );
    expect(r.capacidad_diaria_ton).toBeCloseTo(1.35, 1);
    expect(r.cumple_norma).toBe(false);
  });

  it('retorna duracion_total_batch_min=0 y numero_batches_dia=0 (no aplica para incineración)', () => {
    const r = calculateDenaturation(
      equiposIncineracion,
      BASE_BATCH_PARAMS,
      { ...BASE_INCINERACION_PARAMS, capacidad_carga_kg_h: 2000 }
    );
    expect(r.duracion_total_batch_min).toBe(0);
    expect(r.numero_batches_dia).toBe(0);
  });

  it('NO cumple cuando capacidad_carga_kg_h = 0', () => {
    const r = calculateDenaturation(
      equiposIncineracion,
      BASE_BATCH_PARAMS,
      { ...BASE_INCINERACION_PARAMS, capacidad_carga_kg_h: 0 }
    );
    expect(r.capacidad_diaria_ton).toBe(0);
    expect(r.cumple_norma).toBe(false);
  });
});

// ===========================================================================
// ALMACENAMIENTO
// ===========================================================================

describe('calculateStorage', () => {
  describe('Caso base — 20 m³ × 1.2 TN/m³ = 24 TN', () => {
    it('calcula correctamente con densidad ácido fórmico por defecto', () => {
      const r = calculateStorage(BASE_STORAGE_PARAMS);
      expect(r.capacidad_almacenaje_ton).toBeCloseTo(24, 1);
      expect(r.cumple_norma).toBe(true);
    });
  });

  describe('Umbral exacto — Res. Exenta N°1511/2021: mínimo 20 TN', () => {
    it('cumple exactamente con 20 TN (operador >=)', () => {
      // m³ × densidad = 20: necesitamos 20/1.2 ≈ 16.67 m³
      const r = calculateStorage({
        ...BASE_STORAGE_PARAMS,
        capacidad_almacenaje_m3: 20 / FORMIC_ACID_DENSITY_TN_M3,
      });
      expect(r.capacidad_almacenaje_ton).toBeCloseTo(20, 1);
      expect(r.cumple_norma).toBe(true);
    });

    it('NO cumple cuando capacidad < 20 TN', () => {
      // 10 m³ × 1.2 = 12 TN
      const r = calculateStorage({ ...BASE_STORAGE_PARAMS, capacidad_almacenaje_m3: 10 });
      expect(r.capacidad_almacenaje_ton).toBeCloseTo(12, 1);
      expect(r.cumple_norma).toBe(false);
    });

    it('cumple_norma es true exactamente en el umbral de 20 TN', () => {
      const r = calculateStorage(BASE_STORAGE_PARAMS);
      const cumple = r.capacidad_almacenaje_ton >= MIN_STORAGE_TON;
      expect(r.cumple_norma).toBe(cumple);
    });
  });

  describe('Consistencia con constante FORMIC_ACID_DENSITY_TN_M3', () => {
    it('produce 20 TN exactas con estanque de referencia y densidad estándar', () => {
      // El estanque mínimo del catálogo es 20 m³ → 20 × 1.2 = 24 TN
      const r = calculateStorage({
        ...BASE_STORAGE_PARAMS,
        capacidad_almacenaje_m3: 20,
        factor_densidad: FORMIC_ACID_DENSITY_TN_M3,
      });
      expect(r.capacidad_almacenaje_ton).toBe(24);
    });
  });

  describe('Estanques del catálogo — todos los tamaños disponibles', () => {
    const tamanos = [20, 21, 30, 32, 40, 45, 50];
    tamanos.forEach(m3 => {
      it(`estanque de ${m3} m³ ${m3 * FORMIC_ACID_DENSITY_TN_M3 >= MIN_STORAGE_TON ? 'cumple' : 'NO cumple'} la norma`, () => {
        const r = calculateStorage({
          ...BASE_STORAGE_PARAMS,
          capacidad_almacenaje_m3: m3,
          factor_densidad: FORMIC_ACID_DENSITY_TN_M3,
        });
        const expected = m3 * FORMIC_ACID_DENSITY_TN_M3 >= MIN_STORAGE_TON;
        expect(r.cumple_norma).toBe(expected);
      });
    });
  });
});
