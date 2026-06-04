/* TEMP dump test — render acta HTML to disk for visual/height review. Delete after. */
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { buildActaHtml, patchOklch } from './actaHtml';
import { FIXTURE_STATE } from './fixtures';
import type { AppState } from '../types';

it('dump base acta', () => {
  const html = patchOklch(buildActaHtml(FIXTURE_STATE));
  writeFileSync('C:/tmp/acta-base.html', html, 'utf8');
});

it('dump full/worst-case acta', () => {
  const full: AppState = {
    ...FIXTURE_STATE,
    general: {
      ...FIXTURE_STATE.general,
      observaciones_acta:
        'Se verifica en terreno el sistema completo de mortalidad. El centro cumple con la totalidad de los requisitos establecidos en la Res. Exenta N°1511/2021 para extracción, desnaturalización y almacenamiento. Sin observaciones adicionales que reportar.',
    },
    extraction: {
      ...FIXTURE_STATE.extraction,
      sistemas_apoyo: { buceo: true, rov: true, succion_yoma: true, automatica: true },
      parametros: {
        ...FIXTURE_STATE.extraction.parametros,
        observacion_sistema:
          'Sistema Automático compuesto por 24 equipos Lift-up Novatech 10", uno por jaula, con cono extractor amarrado al fondo de la malla. Apoyo con buceo diario y ROV para inspección.',
      },
    },
    denaturation: {
      ...FIXTURE_STATE.denaturation,
      parametros_incineracion: {
        capacidad_carga_kg_h: 150,
        temperatura_operacion: '850',
        camara_primaria: '1.2 m³',
        camara_secundaria: '0.8 m³',
      },
      incinerador: {
        ...FIXTURE_STATE.denaturation.incinerador,
        activo: true,
        marca_modelo: 'INCINERADOR ATI MODELO C-150',
        capacidad_carga_kg_h: 150,
        horas_funcionamiento_dia: 8,
        num_quemadores_primaria: 2,
        num_quemadores_secundaria: 1,
        temperatura_camara_primaria_c: 850,
        temperatura_camara_secundaria_c: 1100,
        requerimiento_energetico: 'Gas licuado (GLP) 45 kg/h',
        sistema_carga: 'Manual con compuerta frontal',
        sistema_descarga: 'Bandeja de cenizas extraíble',
        disposicion_final: 'Retiro por gestor autorizado de residuos',
        almacenamiento_gas: '2 estanques de 1000 L',
        observaciones: 'Incinerador como sistema secundario de respaldo para mortalidad masiva.',
      },
    },
    storage: {
      ...FIXTURE_STATE.storage,
      parametros: {
        ...FIXTURE_STATE.storage.parametros,
        observaciones:
          'Estanque de acero inoxidable AISI 304 con dique de contención de hormigón. Se realiza el cálculo por densidad de ácido fórmico 1.2 TN/m³.',
      },
    },
  };
  const html = patchOklch(buildActaHtml(full));
  writeFileSync('C:/tmp/acta-full.html', html, 'utf8');
});
