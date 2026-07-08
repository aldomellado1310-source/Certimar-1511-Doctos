/**
 * Módulo de cálculos regulatorios — CERTIMAR 1511
 * Res. Exenta N°1511/2021 — D.S. N°320
 *
 * Funciones puras: no tienen efectos secundarios, no dependen de estado React.
 * Cada función puede ser importada y testeada de forma independiente.
 *
 * Referencia normativa en cada umbral de cumplimiento.
 */

import type { ExtractionData, DenaturationData, StorageData } from '../types';
import {
  MIN_EXTRACTION_TON_DIA,
  MIN_DENATURATION_TON_DIA,
  MIN_STORAGE_TON,
  FISH_PARAMS,
  ETA_BY_SYSTEM_SHALLOW,
  ETA_BY_SYSTEM_DEEP,
  DEPTH_THRESHOLD_M,
  FD_REDUCTION_LOW_PERSONNEL,
  MIN_PERSONNEL_THRESHOLD,
  PAUSA_PROPORCIONAL_COEF,
  PREPICADOR_BATCH_FACTOR,
} from './constants';
import { CATALOGO_EXTRACCION } from '../constants/masterData';

// ---------------------------------------------------------------------------
// EXTRACCIÓN
// ---------------------------------------------------------------------------

/**
 * Calcula la capacidad diaria de extracción de mortalidad.
 *
 * Fórmula:
 *   t_ciclo = t_trabajo_base + t_pausa_base + (t_pausa_base × COEF × n_jaulas)
 *   ciclos/día = (horas_trabajo × 60) / t_ciclo
 *   cap_ton/día = (jaulas_simult × ciclos × kg_bins × η × fd) / 1000
 *
 * Umbral mínimo: 15 TN/día — Res. Exenta N°1511/2021
 */
export function calculateExtraction(
  parametros: ExtractionData['parametros']
): ExtractionData['resultados'] {
  // Parámetros base según talla del pez — Res. Exenta N°1511/2021
  const { t_trabajo: t_trabajo_base, t_pausa, biomasa_max_kg } = FISH_PARAMS[parametros.talla_pez];
  const t_trabajo = (parametros.t_trabajo_override_min != null && parametros.t_trabajo_override_min > 0)
    ? parametros.t_trabajo_override_min
    : t_trabajo_base;

  // Factor de eficiencia η según sistema y profundidad de operación
  const isDeep = parametros.profundidad_operacion_m > DEPTH_THRESHOLD_M;
  const eta = isDeep
    ? ETA_BY_SYSTEM_DEEP[parametros.sistema_principal]
    : ETA_BY_SYSTEM_SHALLOW[parametros.sistema_principal];

  // Factor de disponibilidad fd, con penalización por personal insuficiente
  let fd = parametros.disponibilidad_base_fd;
  if (parametros.personal_operativo < MIN_PERSONNEL_THRESHOLD) {
    fd = fd * FD_REDUCTION_LOW_PERSONNEL;
  }

  // Tiempo de ciclo total incluyendo pausa proporcional al número de jaulas
  const pausa_proporcional = t_pausa * PAUSA_PROPORCIONAL_COEF * parametros.numero_total_jaulas;
  const t_ciclo_total = t_trabajo + t_pausa + pausa_proporcional;

  const ciclos_por_dia = (parametros.horas_efectivas_trabajo * 60) / t_ciclo_total;

  // Propuesta C — Opción B: capacidad nominal del equipo como límite superior de kg_bins.
  // El equipo puede procesar como máximo capacidad_kg_h × (t_trabajo / 60) kg por ciclo.
  // Si no hay equipo seleccionado, se usa el límite regulatorio sin restricción de equipo.
  let kg_bins = biomasa_max_kg;
  if (parametros.id_catalogo_equipo) {
    const equipo = CATALOGO_EXTRACCION.sistemas.find(s => s.id === parametros.id_catalogo_equipo);
    if (equipo) {
      const capacidad_equipo_kg_ciclo = equipo.capacidad_kg_h * (t_trabajo / 60);
      kg_bins = Math.min(kg_bins, capacidad_equipo_kg_ciclo);
    }
  }

  // Ajuste de biomasa: factor de multiplicación sobre el kg efectivo por ciclo.
  // Se aplica DESPUÉS del límite del equipo para que siempre escale el resultado
  // (antes multiplicaba la biomasa regulatoria y quedaba absorbido por el min()).
  kg_bins = kg_bins * parametros.factor_ajuste_biomasa;

  // Res. Exenta N°1511/2021 — Umbral mínimo Extracción: 15 TN/día
  // motocompresores_por_jaula multiplica las líneas de extracción paralelas por jaula
  const motocomp = parametros.motocompresores_por_jaula > 0 ? parametros.motocompresores_por_jaula : 1;
  const capacidad_diaria_ton =
    (parametros.jaulas_simultaneas * motocomp * ciclos_por_dia * kg_bins * eta * fd) / 1000;

  return {
    ciclos_por_dia: parseFloat(ciclos_por_dia.toFixed(2)),
    capacidad_diaria_ton: parseFloat(capacidad_diaria_ton.toFixed(2)),
    cumple_norma: capacidad_diaria_ton >= MIN_EXTRACTION_TON_DIA,
  };
}

// ---------------------------------------------------------------------------
// DESNATURALIZACIÓN
// ---------------------------------------------------------------------------

type OllaAdicionalResultado = {
  capacidad_ton: number;
  duracion_batch_min: number;
  numero_batches_dia: number;
};

/**
 * Calcula la capacidad diaria de una olla trituradora adicional, con
 * configuración (prepicador, horario) totalmente independiente de la olla
 * principal. Misma GUARD F1 que la ruta principal: batch_duration u horas ≤ 0
 * → capacidad 0 (nunca Infinity/fraude).
 */
function calcularOllaAdicional(olla: NonNullable<DenaturationData['ollas_adicionales']>[number]): OllaAdicionalResultado {
  const factor_pre = olla.cuenta_con_prepicador
    ? (olla.factor_eficiencia_prepicador || PREPICADOR_BATCH_FACTOR)
    : 1;
  const batch_duration = (olla.tiempo_procesamiento_min + olla.tiempo_pausa_min) * factor_pre;
  const total_work_min = olla.horas_funcionamiento_dia * 60;
  if (batch_duration <= 0 || total_work_min <= 0) {
    return { capacidad_ton: 0, duracion_batch_min: 0, numero_batches_dia: 0 };
  }
  const numero_batches_dia = total_work_min / batch_duration;
  const capacidad_ton = (numero_batches_dia * olla.kilos_por_batch) / 1000;
  return { capacidad_ton, duracion_batch_min: batch_duration, numero_batches_dia };
}

/**
 * Glosa declarativa de las ollas trituradoras adicionales (cada una con su
 * propia configuración: puede tener o no prepicador y operar un horario
 * distinto al de la olla principal). Se usa tanto en la observación
 * automática del informe como en la glosa del acta, para que ambos
 * documentos describan la misma composición de capacidad.
 */
export function buildGlosaOllasAdicionales(
  ollas: DenaturationData['ollas_adicionales']
): { texto: string; capacidadTotalTon: number } {
  const lista = ollas ?? [];
  if (lista.length === 0) return { texto: '', capacidadTotalTon: 0 };

  const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');

  let capacidadTotalTon = 0;
  const detalles = lista.map((olla, idx) => {
    const r = calcularOllaAdicional(olla);
    capacidadTotalTon += r.capacidad_ton;
    const nombre = olla.marca_modelo?.trim() || `Olla adicional ${idx + 1}`;
    const prepicadorTxt = olla.cuenta_con_prepicador
      ? ` con prepicador${olla.marca_modelo_prepicador?.trim() ? ` ${olla.marca_modelo_prepicador.trim()}` : ''} ` +
        `(factor de eficiencia ${Math.round((olla.factor_eficiencia_prepicador || PREPICADOR_BATCH_FACTOR) * 100)}%)`
      : ' sin prepicador';
    return (
      `${nombre} (${olla.velocidad_nominal_kg_hr} kg/h, estado ${olla.estado_olla.toLowerCase()})` +
      `${prepicadorTxt}, opera ${olla.horas_funcionamiento_dia} horas/día: ` +
      `duración total por batch ${fmt1(r.duracion_batch_min)} min, ${r.numero_batches_dia.toFixed(2)} batches/día, ` +
      `capacidad de ${r.capacidad_ton.toFixed(2)} TN/día.`
    );
  });

  const texto =
    ` Adicionalmente, el centro cuenta con ${lista.length} olla(s) trituradora(s) adicional(es), de configuración ` +
    `independiente de la olla principal (cada una puede operar con o sin prepicador y con un horario propio): ` +
    detalles.join(' ') +
    ` Capacidad adicional total: ${capacidadTotalTon.toFixed(2)} TN/día.`;

  return { texto, capacidadTotalTon };
}

/**
 * Calcula la capacidad diaria de desnaturalización.
 * Soporta dos rutas: Ensilaje Químico (batch) e Incineración Térmica.
 *
 * Ruta Ensilaje:
 *   batch_dur = t_procesamiento + t_pausa
 *   si prepicador: batch_dur = batch_dur × PREPICADOR_BATCH_FACTOR
 *   cap_ton/día = (horas × 60 / batch_dur × kg/batch) / 1000
 *
 * Ruta Incineración:
 *   cap_ton/día = (kg/h × horas) / 1000
 *
 * Umbral mínimo: 15 TN/día — Res. Exenta N°1511/2021
 *
 * GUARD: Si batch_duration ≤ 0 retorna capacidad 0 y NO CUMPLE
 * en lugar de producir Infinity (F1 — riesgo regulatorio crítico).
 */
export function calculateDenaturation(
  equipos: DenaturationData['equipos'],
  parametros_batch: DenaturationData['parametros_batch'],
  parametros_incineracion: DenaturationData['parametros_incineracion'],
  incinerador?: DenaturationData['incinerador'],
  ollasAdicionales?: DenaturationData['ollas_adicionales']
): DenaturationData['resultados'] {
  const total_work_min = equipos.horas_funcionamiento_dia * 60;

  // Override manual de la capacidad diaria del incinerador (TN/día).
  // Cuando está definido, reemplaza al cálculo automático (carga × horas ÷ 1.000).
  const incOverrideRaw = incinerador?.capacidad_diaria_ton_manual;
  const hasIncOverride = incOverrideRaw != null && Number.isFinite(incOverrideRaw);
  const incOverride = hasIncOverride ? (incOverrideRaw as number) : 0;

  // --- Ruta: Incineración Térmica (primary) ---
  if (equipos.tipo_sistema === 'Incineración') {
    // Res. Exenta N°1511/2021 — Umbral mínimo Desnaturalización: 15 TN/día
    const capacity_auto =
      (parametros_incineracion.capacidad_carga_kg_h * equipos.horas_funcionamiento_dia) / 1000;
    const capacity_ton = hasIncOverride ? incOverride : capacity_auto;
    return {
      duracion_total_batch_min: 0,
      numero_batches_dia: 0,
      capacidad_ensilaje_ton: 0,
      capacidad_incinerador_ton: 0,
      capacidad_diaria_ton: parseFloat(capacity_ton.toFixed(2)),
      cumple_norma: capacity_ton >= MIN_DENATURATION_TON_DIA,
      observacion_automatica: hasIncOverride
        ? `Capacidad diaria de incineración declarada manualmente en ${capacity_ton.toFixed(2)} toneladas/día ` +
          `(reemplaza el cálculo automático de ${capacity_auto.toFixed(2)} TN/día = ` +
          `${parametros_incineracion.capacidad_carga_kg_h} kg/h × ${equipos.horas_funcionamiento_dia} h ÷ 1.000).`
        : `Sistema de incineración térmica con capacidad de carga de ` +
          `${parametros_incineracion.capacidad_carga_kg_h} kg/h. ` +
          `Operando ${equipos.horas_funcionamiento_dia} horas diarias, ` +
          `alcanza una capacidad de ${capacity_ton.toFixed(2)} toneladas/día.`,
      glosa_eficiencia_prepicador: '',
    };
  }

  // --- Ruta: Ensilaje Químico (batch) ---
  // Res. Exenta N°1511/2021 — El prepicador reduce la duración TOTAL del batch
  const factor_pre = equipos.cuenta_con_prepicador
    ? (equipos.factor_eficiencia_prepicador ?? PREPICADOR_BATCH_FACTOR)
    : 1;
  const batch_duration_base = parametros_batch.tiempo_procesamiento_min + parametros_batch.tiempo_pausa_min;
  const batch_duration = batch_duration_base * factor_pre;

  // GUARD F1: Duración de batch debe ser > 0.
  // Sin esta guarda, batch_duration=0 produce Infinity batches → cumple_norma=true (fraude).
  if (batch_duration <= 0) {
    return {
      duracion_total_batch_min: 0,
      numero_batches_dia: 0,
      capacidad_ensilaje_ton: 0,
      capacidad_incinerador_ton: 0,
      capacidad_diaria_ton: 0,
      cumple_norma: false,
      observacion_automatica:
        'Error de configuración: el tiempo de ciclo (proceso + pausa) debe ser mayor a cero. ' +
        'Verifique los parámetros de batch.',
      glosa_eficiencia_prepicador: '',
    };
  }

  // Factor de multiplicación por ollas/trituradoras en paralelo.
  // Cada olla procesa su propia secuencia de batches → la capacidad escala linealmente.
  // Ausente o ≤ 0 se trata como 1 (sin penalizar capacidad, retrocompatible).
  const n_ollas = equipos.cantidad_ollas > 0 ? equipos.cantidad_ollas : 1;

  const num_batches = total_work_min / batch_duration;
  const capacity_kg = num_batches * parametros_batch.kilos_por_batch * n_ollas;
  const capacity_ton = capacity_kg / 1000;

  // Ollas adicionales: configuración independiente (prepicador y horario propios),
  // cuya capacidad se SUMA a la de la olla principal (cada una procesa su propia
  // secuencia de batches, a diferencia de `n_ollas` que asume ollas idénticas).
  const { texto: glosa_ollas_adicionales, capacidadTotalTon: capacidad_adicional_ton } =
    buildGlosaOllasAdicionales(ollasAdicionales);

  const capacidad_ensilaje_total_ton = capacity_ton + capacidad_adicional_ton;

  // Secondary incinerador capacity (only for Ensilaje primary route).
  // Respeta el override manual cuando está definido.
  const capacidad_incinerador_ton =
    incinerador?.activo
      ? (hasIncOverride
          ? incOverride
          : (incinerador.capacidad_carga_kg_h * incinerador.horas_funcionamiento_dia) / 1000)
      : 0;

  const combined_ton = capacidad_ensilaje_total_ton + capacidad_incinerador_ton;

  // Glosa declarativa de eficiencia del prepicador (método de cálculo + efecto).
  // Coma decimal (es-CL), determinista y sin dependencia de locale/ICU del entorno.
  const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');
  let glosa_eficiencia_prepicador = '';
  if (equipos.cuenta_con_prepicador && factor_pre < 1) {
    const cap_sin = parseFloat(
      (((total_work_min / batch_duration_base) * parametros_batch.kilos_por_batch * n_ollas) / 1000).toFixed(1)
    );
    const cap_con = parseFloat(capacity_ton.toFixed(1));
    const metodo =
      'La capacidad diaria de desnaturalización por ensilaje se calcula como: ' +
      '(horas de trabajo × 60 ÷ duración total del batch) × kilos por batch × ' +
      'N° de ollas trituradoras ÷ 1.000. ';
    const efectoCap =
      cap_sin > 0
        ? `, lo que incrementa dicha capacidad de ${fmt1(cap_sin)} a ${fmt1(cap_con)} TN/día ` +
          `(+${fmt1((cap_con / cap_sin - 1) * 100)}%)`
        : '';
    glosa_eficiencia_prepicador =
      metodo +
      `Con prepicador activo (factor de eficiencia: ${Math.round(factor_pre * 100)}%), ` +
      `la duración total del batch se reduce de ${fmt1(batch_duration_base)} a ${fmt1(batch_duration)} min` +
      efectoCap +
      '. ';
  }

  const glosa_ollas = n_ollas > 1
    ? ` × ${n_ollas} ollas trituradoras en paralelo`
    : '';

  // Glosa de composición de la capacidad de desnaturalización cuando el centro
  // dispone simultáneamente de olla trituradora (ensilaje) e incinerador.
  // Explica que la capacidad total es la SUMA de ambos sistemas, porque operan
  // de forma independiente y pueden funcionar en paralelo.
  let glosa_incinerador = '';
  if (incinerador?.activo) {
    const incStr   = capacidad_incinerador_ton.toFixed(2);
    const ollaStr  = capacidad_ensilaje_total_ton.toFixed(2);
    const totalStr = combined_ton.toFixed(2);
    const detalleInc = hasIncOverride
      ? `declarada manualmente en ${incStr} TN/día`
      : `equivalente a su capacidad de carga por las horas de funcionamiento diario ` +
        `(${incinerador.capacidad_carga_kg_h} kg/h × ${incinerador.horas_funcionamiento_dia} h ÷ 1.000 = ${incStr} TN/día)`;
    glosa_incinerador =
      ` Adicionalmente, el centro cuenta con un incinerador que complementa la desnaturalización por ensilaje, ` +
      `con una capacidad diaria ${detalleInc}. ` +
      `La capacidad total de desnaturalización corresponde a la SUMA de ambos sistemas, ` +
      `dado que la olla trituradora (ensilaje) y el incinerador operan de forma independiente y pueden funcionar en paralelo: ` +
      `${ollaStr} TN/día (ensilaje) + ${incStr} TN/día (incineración) = ${totalStr} TN/día.`;
  }

  const observacion =
    `La eficiencia del sistema depende directamente del tiempo total de cada ciclo (batch + pausa). ` +
    `Los tiempos de pausas y de procesamiento permite determinar la cantidad de batches por día, ` +
    `por lo tanto, estudiar detalladamente la capacidad de procesamiento total. ` +
    `(kg/batch=${parametros_batch.kilos_por_batch} -- Horas de trabajo diario: ` +
    `${equipos.horas_funcionamiento_dia} = ${total_work_min} min) ` +
    glosa_eficiencia_prepicador +
    `Duración total por batch: ${batch_duration.toFixed(1)} min / ` +
    `Número de batches por día: ${total_work_min} ÷ ${batch_duration.toFixed(1)} = ` +
    `${num_batches.toFixed(2)} batches ` +
    `Capacidad diaria: ${parametros_batch.kilos_por_batch.toLocaleString('es-CL')} kg × ` +
    `${num_batches.toFixed(2)}${glosa_ollas} = ${capacity_kg.toFixed(0)} kg = ${capacity_ton.toFixed(2)} toneladas` +
    glosa_ollas_adicionales +
    glosa_incinerador;

  // Res. Exenta N°1511/2021 — Umbral mínimo Desnaturalización: 15 TN/día
  return {
    duracion_total_batch_min: parseFloat(batch_duration.toFixed(2)),
    numero_batches_dia: parseFloat(num_batches.toFixed(2)),
    capacidad_ensilaje_ton: parseFloat(capacidad_ensilaje_total_ton.toFixed(2)),
    capacidad_incinerador_ton: parseFloat(capacidad_incinerador_ton.toFixed(2)),
    capacidad_diaria_ton: parseFloat(combined_ton.toFixed(2)),
    cumple_norma: combined_ton >= MIN_DENATURATION_TON_DIA,
    observacion_automatica: observacion,
    glosa_eficiencia_prepicador,
  };
}

// ---------------------------------------------------------------------------
// ALMACENAMIENTO
// ---------------------------------------------------------------------------

/**
 * Calcula la capacidad de almacenamiento de biomasa desnaturalizada.
 *
 * Fórmula: cap_ton = m³ × factor_densidad
 * Factor por defecto: 1.2 TN/m³ (densidad ácido fórmico comercial al 85%)
 *
 * Umbral mínimo: 20 TN — Res. Exenta N°1511/2021
 */
export function calculateStorage(
  parametros: StorageData['parametros']
): StorageData['resultados'] {
  // Res. Exenta N°1511/2021 — Umbral mínimo Almacenamiento: 20 TN
  const capacity_ton = parametros.capacidad_almacenaje_m3 * parametros.factor_densidad;

  return {
    capacidad_almacenaje_ton: parseFloat(capacity_ton.toFixed(2)),
    cumple_norma: capacity_ton >= MIN_STORAGE_TON,
  };
}
