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
