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
