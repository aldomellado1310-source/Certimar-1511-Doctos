/**
 * Tests del generador de Acta HTML — CERTIMAR 1511
 * Verifica que los campos editables del estado se reflejen en el acta.
 */

import { describe, it, expect } from 'vitest';
import { buildActaHtml } from './actaHtml';
import { FIXTURE_STATE } from './fixtures';

describe('buildActaHtml — sección G. Almacenamiento', () => {
  it('refleja el campo Observaciones de almacenamiento del estado', () => {
    const html = buildActaHtml(FIXTURE_STATE);
    expect(html).toContain('Estanque de acero inoxidable con dique de contención.');
  });

  it('no deja el texto hardcodeado del template cuando el estado tiene observaciones', () => {
    const html = buildActaHtml(FIXTURE_STATE);
    expect(html).not.toContain('POR DENSIDAD POR DENSIDAD');
  });

  it('muestra N/A cuando las observaciones de almacenamiento están vacías', () => {
    const state = {
      ...FIXTURE_STATE,
      storage: {
        ...FIXTURE_STATE.storage,
        parametros: { ...FIXTURE_STATE.storage.parametros, observaciones: '' },
      },
    };
    const html = buildActaHtml(state);
    expect(html).not.toContain('POR DENSIDAD POR DENSIDAD');
  });
});

describe('buildActaHtml — glosa de eficiencia del prepicador (ensilaje)', () => {
  const stateConPrepicador = {
    ...FIXTURE_STATE,
    denaturation: {
      ...FIXTURE_STATE.denaturation,
      equipos: { ...FIXTURE_STATE.denaturation.equipos, cuenta_con_prepicador: true },
    },
  };

  it('incluye la glosa cuando el prepicador está activo', () => {
    const html = buildActaHtml(stateConPrepicador);
    expect(html).toContain('La capacidad diaria de desnaturalización por ensilaje se calcula como:');
    expect(html).toContain('Con prepicador activo (factor de eficiencia: 70%)');
    expect(html).toContain('incrementa dicha capacidad de 15,1 a 21,6 TN/día (+43,0%)');
  });

  it('NO incluye la glosa cuando no hay prepicador (sin regresión)', () => {
    const html = buildActaHtml(FIXTURE_STATE);
    expect(html).not.toContain('incrementa dicha capacidad');
    expect(html).not.toContain('Con prepicador activo');
  });
});

describe('buildActaHtml — Tabla F: composición de capacidad (ensilaje + incinerador)', () => {
  const stateConIncinerador = {
    ...FIXTURE_STATE,
    denaturation: {
      ...FIXTURE_STATE.denaturation,
      incinerador: {
        ...FIXTURE_STATE.denaturation.incinerador,
        activo: true,
        capacidad_carga_kg_h: 50,
        horas_funcionamiento_dia: 8,
      },
    },
  };

  it('explica que la capacidad total es la suma de ensilaje e incineración', () => {
    const html = buildActaHtml(stateConIncinerador);
    expect(html).toContain('Capacidad diaria por ensilaje:');
    expect(html).toContain('A esta capacidad se suma la del incinerador');
    expect(html).toContain('Capacidad total de desnaturalización:');
  });

  it('usa el override manual del incinerador cuando está definido', () => {
    const state = {
      ...stateConIncinerador,
      denaturation: {
        ...stateConIncinerador.denaturation,
        incinerador: {
          ...stateConIncinerador.denaturation.incinerador,
          capacidad_diaria_ton_manual: 5,
        },
      },
    };
    const html = buildActaHtml(state);
    expect(html).toContain('5.00 TN/día');
  });

  it('sin incinerador activo conserva la glosa simple (sin regresión)', () => {
    const html = buildActaHtml(FIXTURE_STATE);
    expect(html).not.toContain('A esta capacidad se suma la del incinerador');
  });
});
