import { CATALOGO_GENERADORES } from '../constants/masterData';

export function inferCatalogoId(gen: { marca: string; modelo: string }): string {
  return (
    CATALOGO_GENERADORES.find(g => g.modelo === gen.modelo && g.marca === gen.marca)?.id ?? 'otro'
  );
}
