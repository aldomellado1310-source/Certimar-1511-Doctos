import { describe, it, expect } from 'vitest';
import { newRecordDocId, resolveDocId } from './recordId';

describe('recordId — identidad de registros (anti-colisión)', () => {
  describe('newRecordDocId', () => {
    it('genera un string no vacío', () => {
      expect(newRecordDocId().length).toBeGreaterThan(0);
    });

    it('genera IDs distintos en llamadas sucesivas', () => {
      const ids = new Set(Array.from({ length: 50 }, () => newRecordDocId()));
      expect(ids.size).toBe(50);
    });

    it('no produce IDs con barras (válidos como doc ID de Firestore)', () => {
      for (let i = 0; i < 20; i++) {
        expect(newRecordDocId()).not.toContain('/');
      }
    });
  });

  describe('resolveDocId', () => {
    it('reutiliza el ID existente de un registro ya guardado', () => {
      // Registro legado cuyo doc ID en Firestore es su antiguo REG-XXX.
      expect(resolveDocId('REG-007')).toBe('REG-007');
      // ID nuevo tipo UUID.
      expect(resolveDocId('a1b2c3d4-0000-4000-8000-000000000000')).toBe(
        'a1b2c3d4-0000-4000-8000-000000000000',
      );
    });

    it('acuña un ID nuevo cuando no hay ID previo', () => {
      const minted = resolveDocId(undefined, () => 'NUEVO');
      expect(minted).toBe('NUEVO');
      expect(resolveDocId(null, () => 'NUEVO')).toBe('NUEVO');
      expect(resolveDocId('', () => 'NUEVO')).toBe('NUEVO');
      expect(resolveDocId('   ', () => 'NUEVO')).toBe('NUEVO');
    });

    it('REGRESIÓN: dos registros nuevos nunca comparten ID (no se reusa el correlativo)', () => {
      // El bug original: el ID salía de un contador local que podía repetirse
      // entre dispositivos, y setDoc sobrescribía el registro anterior.
      const a = resolveDocId(undefined);
      const b = resolveDocId(undefined);
      expect(a).not.toBe(b);
    });
  });
});
