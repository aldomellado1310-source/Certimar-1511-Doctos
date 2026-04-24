# Generador "Otro (Especificar)" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la opción "Otro (Especificar)" al dropdown de catálogo de generadores, permitiendo que el usuario ingrese marca/modelo/kVA de forma libre mientras el dropdown permanece en "Otro (Especificar)".

**Architecture:** Se agrega `catalogoId?: string` al tipo de cada generador en el estado de la app. Un sentinel `{ id: 'otro' }` se agrega al catálogo. El valor del dropdown se deriva directamente de `gen.catalogoId` en lugar de buscar coincidencia por modelo. La migración de estados guardados (localStorage y Firestore) infiere el `catalogoId` a partir de marca+modelo al cargar.

**Tech Stack:** React 19, TypeScript, Vitest (para test de migración)

---

## Archivos que se modifican

| Archivo | Cambio |
|---|---|
| `src/types.ts` | Agregar `catalogoId?: string` al array `generacion_electrica` |
| `src/constants/masterData.ts` | Agregar sentinel `{ id: 'otro' }` al final de `CATALOGO_GENERADORES` |
| `src/domain/generators.ts` | **Crear nuevo** — utilidad `inferCatalogoId` (testable) |
| `src/domain/generators.test.ts` | **Crear nuevo** — tests de `inferCatalogoId` |
| `src/App.tsx` | `handleSelectGenerator`, `handleAddGenerator`, migraciones, UI del bloque generador |

---

### Task 1: Agregar `catalogoId` al tipo + sentinel al catálogo

**Files:**
- Modify: `src/types.ts:122-128`
- Modify: `src/constants/masterData.ts:207`

- [ ] **Step 1: Agregar `catalogoId` al tipo de generador en `types.ts`**

Ubicar el array `generacion_electrica` (línea 122) y agregar el campo:

```ts
  generacion_electrica: Array<{
    tipo: string;
    marca: string;
    modelo: string;
    capacidad_kva: number;
    ubicacion: string;
    catalogoId?: string;
  }>;
```

- [ ] **Step 2: Agregar sentinel al final de `CATALOGO_GENERADORES` en `masterData.ts`**

Justo antes del `];` de cierre del array (después de la línea con `caterpillar-fg-wilson-p56`):

```ts
  { id: 'otro', marca: '', modelo: '', kva: 0 },
```

- [ ] **Step 3: Verificar que TypeScript compila**

```bash
cd "C:\Users\aldon\Documents\Proyectos\Certimar-1511-Doctos"
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/constants/masterData.ts
git commit -m "feat: agregar catalogoId a generador y sentinel otro al catalogo"
```

---

### Task 2: Crear utilidad `inferCatalogoId` con tests (TDD)

**Files:**
- Create: `src/domain/generators.ts`
- Create: `src/domain/generators.test.ts`

La función recibe marca+modelo y devuelve el `id` del catálogo si hay coincidencia exacta, o `'otro'` si no la hay. Se usa en las migraciones de estado.

- [ ] **Step 1: Escribir el test primero**

Crear `src/domain/generators.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { inferCatalogoId } from './generators';

describe('inferCatalogoId', () => {
  it('devuelve el id correcto cuando hay coincidencia exacta', () => {
    expect(inferCatalogoId({ marca: 'Cummins', modelo: 'C110D5' })).toBe('cummins-c110d5');
  });

  it('devuelve otro cuando la marca no coincide', () => {
    expect(inferCatalogoId({ marca: 'Desconocida', modelo: 'C110D5' })).toBe('otro');
  });

  it('devuelve otro cuando el modelo no existe', () => {
    expect(inferCatalogoId({ marca: 'Cummins', modelo: 'X999' })).toBe('otro');
  });

  it('devuelve otro cuando ambos campos están vacíos', () => {
    expect(inferCatalogoId({ marca: '', modelo: '' })).toBe('otro');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
npx vitest run src/domain/generators.test.ts
```

Esperado: FAIL — `Cannot find module './generators'`.

- [ ] **Step 3: Implementar `inferCatalogoId`**

Crear `src/domain/generators.ts`:

```ts
import { CATALOGO_GENERADORES } from '../constants/masterData';

export function inferCatalogoId(gen: { marca: string; modelo: string }): string {
  return (
    CATALOGO_GENERADORES.find(g => g.modelo === gen.modelo && g.marca === gen.marca)?.id ?? 'otro'
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npx vitest run src/domain/generators.test.ts
```

Esperado: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/generators.ts src/domain/generators.test.ts
git commit -m "feat: utilidad inferCatalogoId para migrar estado guardado de generadores"
```

---

### Task 3: Actualizar lógica en `App.tsx` — handlers y migración

**Files:**
- Modify: `src/App.tsx:1884-1897` (migración localStorage)
- Modify: `src/App.tsx:2428-2436` (migración carga desde Firestore/histórico)
- Modify: `src/App.tsx:3502-3519` (`handleSelectGenerator`, `handleAddGenerator`)

- [ ] **Step 1: Importar `inferCatalogoId` en `App.tsx`**

Agregar el import junto a los otros imports de `domain/`:

```ts
import { inferCatalogoId } from './domain/generators';
```

- [ ] **Step 2: Actualizar `handleSelectGenerator` (línea 3502)**

Reemplazar el bloque actual:

```ts
const handleSelectGenerator = (index: number, id: string) => {
  const gen = CATALOGO_GENERADORES.find(g => g.id === id);
  if (gen) {
    const newGens = [...state.denaturation.generacion_electrica];
    newGens[index] = { ...newGens[index], marca: gen.marca, modelo: gen.modelo, capacidad_kva: gen.kva };
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
  }
};
```

Por:

```ts
const handleSelectGenerator = (index: number, id: string) => {
  const newGens = [...state.denaturation.generacion_electrica];
  if (id === 'otro') {
    newGens[index] = { ...newGens[index], catalogoId: 'otro', marca: '', modelo: '', capacidad_kva: 0 };
  } else {
    const gen = CATALOGO_GENERADORES.find(g => g.id === id);
    if (gen) {
      newGens[index] = { ...newGens[index], catalogoId: id, marca: gen.marca, modelo: gen.modelo, capacidad_kva: gen.kva };
    }
  }
  setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
};
```

- [ ] **Step 3: Actualizar `handleAddGenerator` (línea 3517) para incluir `catalogoId`**

Reemplazar:

```ts
const handleAddGenerator = () => {
  const newGen = { tipo: 'Principal', marca: '', modelo: '', capacidad_kva: 0, ubicacion: '' };
  setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: [...prev.denaturation.generacion_electrica, newGen] } }));
};
```

Por:

```ts
const handleAddGenerator = () => {
  const newGen = { tipo: 'Principal', marca: '', modelo: '', capacidad_kva: 0, ubicacion: '', catalogoId: '' };
  setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: [...prev.denaturation.generacion_electrica, newGen] } }));
};
```

- [ ] **Step 4: Agregar migración en la carga desde localStorage (línea ~1897)**

Dentro del bloque `if (parsed.__version === SCHEMA_VERSION)`, después de las migraciones existentes de `observaciones_acta` y `equipos_extraccion`, agregar:

```ts
if (parsed.denaturation?.generacion_electrica) {
  parsed.denaturation.generacion_electrica = parsed.denaturation.generacion_electrica.map(
    (gen: any) => gen.catalogoId !== undefined ? gen : { ...gen, catalogoId: inferCatalogoId(gen) }
  );
}
```

- [ ] **Step 5: Agregar migración en la carga desde histórico Firestore (línea ~2428)**

Reemplazar el bloque de `setState`:

```ts
setState({
  ...entry.snapshot,
  extraction: {
    ...entry.snapshot.extraction,
    equipos_extraccion: entry.snapshot.extraction.equipos_extraccion ?? [],
  },
  images: (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' })),
  registroId: entry.registroId,
});
```

Por:

```ts
setState({
  ...entry.snapshot,
  extraction: {
    ...entry.snapshot.extraction,
    equipos_extraccion: entry.snapshot.extraction.equipos_extraccion ?? [],
  },
  denaturation: {
    ...entry.snapshot.denaturation,
    generacion_electrica: (entry.snapshot.denaturation.generacion_electrica ?? []).map(
      (gen: any) => gen.catalogoId !== undefined ? gen : { ...gen, catalogoId: inferCatalogoId(gen) }
    ),
  },
  images: (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' })),
  registroId: entry.registroId,
});
```

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/domain/generators.ts
git commit -m "feat: migrar catalogoId en carga de estado y actualizar handlers de generador"
```

---

### Task 4: Actualizar UI del bloque generador en `App.tsx`

**Files:**
- Modify: `src/App.tsx:7775-7783` (select value + opciones)

- [ ] **Step 1: Cambiar el `value` del select y las opciones (línea 7775)**

Reemplazar el bloque del select de catálogo:

```tsx
<select
  value={CATALOGO_GENERADORES.find(g => g.modelo === gen.modelo)?.id || ''}
  onChange={(e) => handleSelectGenerator(idx, e.target.value)}
  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
>
  <option value="">Seleccionar...</option>
  {CATALOGO_GENERADORES.map(g => (
    <option key={g.id} value={g.id}>{g.marca} {g.modelo} — {g.kva} kVA</option>
  ))}
</select>
```

Por:

```tsx
<select
  value={gen.catalogoId || ''}
  onChange={(e) => handleSelectGenerator(idx, e.target.value)}
  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
>
  <option value="">Seleccionar...</option>
  {CATALOGO_GENERADORES.map(g => (
    <option key={g.id} value={g.id}>
      {g.id === 'otro' ? 'Otro (Especificar)' : `${g.marca} ${g.modelo} — ${g.kva} kVA`}
    </option>
  ))}
</select>
```

- [ ] **Step 2: Agregar InputField condicional para Modelo (después del cierre `</div>` del select, antes de `<InputField label="Marca"`)**

```tsx
{gen.catalogoId === 'otro' && (
  <InputField
    label="Modelo"
    value={gen.modelo}
    onChange={(v) => handleUpdateGenerator(idx, 'modelo', v)}
    placeholder="Ej: WPG55L2"
  />
)}
```

El resultado del bloque de generador debe quedar (en orden):
1. TIPO (select)
2. MODELO (CATÁLOGO) (select)
3. MODELO (InputField, solo visible cuando `catalogoId === 'otro'`)
4. MARCA (InputField, siempre visible)
5. CAPACIDAD kVA (InputField, siempre visible)
6. UBICACIÓN (InputField, siempre visible)

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: UI Otro (Especificar) en dropdown catalogo generadores"
```

---

### Task 5: Smoke test manual y commit final

- [ ] **Step 1: Levantar la app**

```bash
npm run dev
```

- [ ] **Step 2: Verificar flujo principal**

1. Ir a la sección Desnaturalización → Generación Eléctrica
2. Agregar un generador
3. Seleccionar un modelo del catálogo (ej: "FG Wilson P125-1 — 125 kVA") → verificar que Marca, Modelo y Capacidad se rellenan automáticamente
4. Cambiar a "Otro (Especificar)" → verificar que aparece el InputField "Modelo" y que Marca/Modelo/Capacidad se limpian
5. Escribir marca, modelo y kVA manualmente → verificar que el dropdown permanece en "Otro (Especificar)"
6. Guardar el borrador (si hay botón) o refrescar la página → verificar que los datos y el "Otro (Especificar)" persisten al recargar desde localStorage

- [ ] **Step 3: Verificar migración de estado antiguo**

1. Abrir DevTools → Application → LocalStorage → `certimar-draft-state`
2. Editar manualmente un generador para eliminar la clave `catalogoId` y guardar
3. Refrescar la página → verificar que el dropdown muestra "Otro (Especificar)" si la marca/modelo no coincide con catálogo, o el modelo correcto si sí coincide

- [ ] **Step 4: Ejecutar tests**

```bash
npx vitest run
```

Esperado: todos PASS.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat: generador Otro (Especificar) — implementación completa"
```
