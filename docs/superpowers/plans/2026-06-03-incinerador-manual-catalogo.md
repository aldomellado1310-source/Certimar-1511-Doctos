# Incinerador manual + catálogo reutilizable — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir ingresar un incinerador llenando todos sus campos manualmente y, opcionalmente, guardarlo en el catálogo (Firestore) para reutilizarlo, editarlo o borrarlo en otras certificaciones.

**Architecture:** Toda la lógica de transformación (resolver una selección → estado, construir la entrada de catálogo, detectar duplicados) vive como funciones puras en `src/domain/incineradorCatalogo.ts` y se testea con Vitest. La tarjeta "Incinerador Secundario" de `App.tsx` consume esas funciones: el desplegable lista catálogo estático + guardados + "Nuevo manual", los campos de detalle pasan a ser editables, y un botón persiste a la colección `catalogo_custom`. El admin (`CatalogoEquiposAdmin.tsx`) gana el formulario completo de incinerador y edición de entradas.

**Tech Stack:** Vite + React 19 + TypeScript, Firestore (`catalogo_custom`), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-03-incinerador-manual-catalogo-design.md`

---

## Estructura de archivos

- **Crear** `src/domain/incineradorCatalogo.ts` — funciones puras: tipos `IncineradorDetalle`/`IncineradorCompleto`, `INCINERADOR_VACIO`, `ID_NUEVO_INCINERADOR`, `estadoDesdeIncinerador`, `incineradorDesdeCustom`, `resolverIncinerador`, `buildIncineradorEntry`, `findIncineradorDuplicado`.
- **Crear** `src/domain/incineradorCatalogo.test.ts` — tests Vitest de lo anterior.
- **Modificar** `src/types.ts` — añadir `IncineradorDetalle` y `incinerador_detalle?` a `CatalogoCustomEntry`.
- **Modificar** `src/App.tsx` — desplegable con optgroups, campos editables, handler de selección, botón "Guardar en catálogo", wiring de `onUpdate` al admin, bump de `CHANGELOG_VERSION` + paso en modal.
- **Modificar** `src/constants/masterData.ts` — exportar el tipo de los incineradores estáticos (tipado), sin cambiar datos.
- **Modificar** `src/components/CatalogoEquiposAdmin.tsx` — formulario completo de incinerador + edición de entradas.

---

### Task 1: Modelo de datos y funciones puras (TDD)

**Files:**
- Modify: `src/types.ts` (tras `CatalogoCustomEntry`, ~línea 246)
- Create: `src/domain/incineradorCatalogo.ts`
- Test: `src/domain/incineradorCatalogo.test.ts`

- [ ] **Step 1: Añadir tipos a `types.ts`**

En `src/types.ts`, justo antes de `export interface CatalogoCustomEntry {` añade:

```ts
export interface IncineradorDetalle {
  horas_funcionamiento: number;
  camara_primaria: string;
  num_quemadores_primaria: number;
  temperatura_camara_primaria_c: number;
  camara_secundaria: string;
  num_quemadores_secundaria: number;
  temperatura_camara_secundaria_c: number;
  requerimiento_energetico: string;
  sistema_carga: string;
  sistema_descarga: string;
  disposicion_final: string;
  almacenamiento_gas: string;
  observaciones: string;
}
```

Dentro de `CatalogoCustomEntry`, en el bloque `// Campos incinerador` (donde está `capacidad_carga_kg_h?: number;`), añade debajo:

```ts
  incinerador_detalle?: IncineradorDetalle;
```

- [ ] **Step 2: Escribir el test que falla**

Crea `src/domain/incineradorCatalogo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  ID_NUEVO_INCINERADOR,
  estadoDesdeIncinerador,
  incineradorDesdeCustom,
  resolverIncinerador,
  buildIncineradorEntry,
  findIncineradorDuplicado,
  IncineradorCompleto,
} from './incineradorCatalogo';
import { CatalogoCustomEntry } from '../types';

const ESTATICO: IncineradorCompleto & { id: string } = {
  id: 'addfield-thunder-1000',
  marca_modelo: 'ADDFIELD / THUNDER 1000',
  capacidad_carga_kg_h: 150,
  horas_funcionamiento: 8,
  camara_primaria: '1.450 m diámetro interior',
  num_quemadores_primaria: 1,
  temperatura_camara_primaria_c: 950,
  camara_secundaria: '2 m Diámetro Interior',
  num_quemadores_secundaria: 1,
  temperatura_camara_secundaria_c: 850,
  requerimiento_energetico: '390 kWh',
  sistema_carga: 'CARGA MANUAL TACHOS 60L',
  sistema_descarga: 'MANUAL HACIA MAXISACOS',
  disposicion_final: 'VERTEDERO MUNICIPAL PTA ARENAS',
  almacenamiento_gas: '4000L X 2 = 8.000L GAS GLP',
  observaciones: 'Sistema secundario.',
};

const CUSTOM: CatalogoCustomEntry = {
  id: 'abc123',
  tipo: 'incinerador',
  marca_modelo: 'MI INCINERADOR X',
  capacidad_carga_kg_h: 80,
  incinerador_detalle: {
    horas_funcionamiento: 10,
    camara_primaria: '1.2 m',
    num_quemadores_primaria: 2,
    temperatura_camara_primaria_c: 900,
    camara_secundaria: '1.8 m',
    num_quemadores_secundaria: 1,
    temperatura_camara_secundaria_c: 800,
    requerimiento_energetico: '10 KW/h',
    sistema_carga: 'CARGA MANUAL TACHOS 60L',
    sistema_descarga: 'MANUAL HACIA MAXISACOS',
    disposicion_final: 'VERTEDERO MUNICIPAL PTA ARENAS',
    almacenamiento_gas: 'N/A',
    observaciones: 'Custom guardado.',
  },
  creadoPor: 'eflores@certimar.cl',
  __createdAt: new Date(),
};

describe('estadoDesdeIncinerador', () => {
  it('mapea campos a incinerador y parametros_incineracion', () => {
    const { incinerador, parametros_incineracion } = estadoDesdeIncinerador(ESTATICO, 'addfield-thunder-1000');
    expect(incinerador.activo).toBe(true);
    expect(incinerador.id_catalogo).toBe('addfield-thunder-1000');
    expect(incinerador.marca_modelo).toBe('ADDFIELD / THUNDER 1000');
    expect(incinerador.horas_funcionamiento_dia).toBe(8);
    expect(incinerador.num_quemadores_primaria).toBe(1);
    expect(parametros_incineracion.camara_primaria).toBe('1.450 m diámetro interior');
    expect(parametros_incineracion.temperatura_operacion).toBe('950°C / 850°C');
    expect(parametros_incineracion.capacidad_carga_kg_h).toBe(150);
  });
});

describe('incineradorDesdeCustom', () => {
  it('extrae el detalle anidado a IncineradorCompleto', () => {
    const full = incineradorDesdeCustom(CUSTOM);
    expect(full.marca_modelo).toBe('MI INCINERADOR X');
    expect(full.capacidad_carga_kg_h).toBe(80);
    expect(full.horas_funcionamiento).toBe(10);
    expect(full.num_quemadores_primaria).toBe(2);
  });
});

describe('resolverIncinerador', () => {
  it('value vacío o nuevo → estado en blanco editable', () => {
    const { incinerador } = resolverIncinerador(ID_NUEVO_INCINERADOR, [ESTATICO], [CUSTOM]);
    expect(incinerador.id_catalogo).toBe(ID_NUEVO_INCINERADOR);
    expect(incinerador.marca_modelo).toBe('');
    expect(incinerador.horas_funcionamiento_dia).toBe(8);
  });
  it('value estático → resuelve del catálogo estático', () => {
    const { incinerador } = resolverIncinerador('addfield-thunder-1000', [ESTATICO], [CUSTOM]);
    expect(incinerador.marca_modelo).toBe('ADDFIELD / THUNDER 1000');
  });
  it('value custom:<id> → resuelve del catálogo custom', () => {
    const { incinerador } = resolverIncinerador('custom:abc123', [ESTATICO], [CUSTOM]);
    expect(incinerador.marca_modelo).toBe('MI INCINERADOR X');
    expect(incinerador.id_catalogo).toBe('custom:abc123');
  });
});

describe('buildIncineradorEntry', () => {
  it('construye CatalogoCustomEntry con detalle anidado desde el estado', () => {
    const { incinerador, parametros_incineracion } = estadoDesdeIncinerador(ESTATICO, 'x');
    const entry = buildIncineradorEntry(incinerador, parametros_incineracion, 'eflores@certimar.cl', null);
    expect(entry.tipo).toBe('incinerador');
    expect(entry.marca_modelo).toBe('ADDFIELD / THUNDER 1000');
    expect(entry.capacidad_carga_kg_h).toBe(150);
    expect(entry.incinerador_detalle?.camara_primaria).toBe('1.450 m diámetro interior');
    expect(entry.incinerador_detalle?.temperatura_camara_secundaria_c).toBe(850);
  });
  it('recorta espacios en marca_modelo', () => {
    const { incinerador, parametros_incineracion } = estadoDesdeIncinerador(ESTATICO, 'x');
    const entry = buildIncineradorEntry({ ...incinerador, marca_modelo: '  EQ  ' }, parametros_incineracion, 'a', null);
    expect(entry.marca_modelo).toBe('EQ');
  });
});

describe('findIncineradorDuplicado', () => {
  it('encuentra por marca_modelo ignorando mayúsculas/espacios', () => {
    const dup = findIncineradorDuplicado([CUSTOM], '  mi incinerador x ');
    expect(dup?.id).toBe('abc123');
  });
  it('no confunde con otros tipos', () => {
    const tri: CatalogoCustomEntry = { ...CUSTOM, id: 'z', tipo: 'trituradora' };
    expect(findIncineradorDuplicado([tri], 'MI INCINERADOR X')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm run test -- incineradorCatalogo`
Expected: FAIL — `Cannot find module './incineradorCatalogo'`.

- [ ] **Step 4: Implementar `src/domain/incineradorCatalogo.ts`**

```ts
import { CatalogoCustomEntry, DenaturationData, IncineradorDetalle } from '../types';

export const ID_NUEVO_INCINERADOR = '__nuevo__';

/** Forma canónica plana de un incinerador (estático o resuelto). */
export interface IncineradorCompleto extends IncineradorDetalle {
  marca_modelo: string;
  capacidad_carga_kg_h: number;
}

const VACIO: IncineradorCompleto = {
  marca_modelo: '',
  capacidad_carga_kg_h: 0,
  horas_funcionamiento: 8,
  camara_primaria: '',
  num_quemadores_primaria: 0,
  temperatura_camara_primaria_c: 0,
  camara_secundaria: '',
  num_quemadores_secundaria: 0,
  temperatura_camara_secundaria_c: 0,
  requerimiento_energetico: '',
  sistema_carga: 'N/A',
  sistema_descarga: 'N/A',
  disposicion_final: 'N/A',
  almacenamiento_gas: 'N/A',
  observaciones: '',
};

export const INCINERADOR_VACIO: IncineradorCompleto = { ...VACIO };

/** Mapea la forma canónica al sub-estado del incinerador + parametros_incineracion. */
export function estadoDesdeIncinerador(
  full: IncineradorCompleto,
  id_catalogo: string,
): {
  incinerador: DenaturationData['incinerador'];
  parametros_incineracion: DenaturationData['parametros_incineracion'];
} {
  return {
    incinerador: {
      activo: true,
      id_catalogo,
      marca_modelo: full.marca_modelo,
      capacidad_carga_kg_h: full.capacidad_carga_kg_h,
      horas_funcionamiento_dia: full.horas_funcionamiento,
      num_quemadores_primaria: full.num_quemadores_primaria,
      num_quemadores_secundaria: full.num_quemadores_secundaria,
      temperatura_camara_primaria_c: full.temperatura_camara_primaria_c,
      temperatura_camara_secundaria_c: full.temperatura_camara_secundaria_c,
      requerimiento_energetico: full.requerimiento_energetico,
      sistema_carga: full.sistema_carga,
      sistema_descarga: full.sistema_descarga,
      disposicion_final: full.disposicion_final,
      almacenamiento_gas: full.almacenamiento_gas,
      observaciones: full.observaciones,
    },
    parametros_incineracion: {
      capacidad_carga_kg_h: full.capacidad_carga_kg_h,
      temperatura_operacion: `${full.temperatura_camara_primaria_c}°C / ${full.temperatura_camara_secundaria_c}°C`,
      camara_primaria: full.camara_primaria,
      camara_secundaria: full.camara_secundaria,
    },
  };
}

/** Extrae la forma canónica desde una entrada de catálogo custom. */
export function incineradorDesdeCustom(entry: CatalogoCustomEntry): IncineradorCompleto {
  const d = entry.incinerador_detalle;
  return {
    marca_modelo: entry.marca_modelo,
    capacidad_carga_kg_h: entry.capacidad_carga_kg_h ?? 0,
    horas_funcionamiento: d?.horas_funcionamiento ?? 8,
    camara_primaria: d?.camara_primaria ?? '',
    num_quemadores_primaria: d?.num_quemadores_primaria ?? 0,
    temperatura_camara_primaria_c: d?.temperatura_camara_primaria_c ?? 0,
    camara_secundaria: d?.camara_secundaria ?? '',
    num_quemadores_secundaria: d?.num_quemadores_secundaria ?? 0,
    temperatura_camara_secundaria_c: d?.temperatura_camara_secundaria_c ?? 0,
    requerimiento_energetico: d?.requerimiento_energetico ?? '',
    sistema_carga: d?.sistema_carga ?? 'N/A',
    sistema_descarga: d?.sistema_descarga ?? 'N/A',
    disposicion_final: d?.disposicion_final ?? 'N/A',
    almacenamiento_gas: d?.almacenamiento_gas ?? 'N/A',
    observaciones: d?.observaciones ?? '',
  };
}

/** Resuelve el value del desplegable al sub-estado correspondiente. */
export function resolverIncinerador(
  value: string,
  estaticos: Array<IncineradorCompleto & { id: string }>,
  custom: CatalogoCustomEntry[],
): {
  incinerador: DenaturationData['incinerador'];
  parametros_incineracion: DenaturationData['parametros_incineracion'];
} {
  if (value === ID_NUEVO_INCINERADOR || value === '') {
    return estadoDesdeIncinerador({ ...VACIO }, value);
  }
  if (value.startsWith('custom:')) {
    const id = value.slice('custom:'.length);
    const entry = custom.find((c) => c.id === id && c.tipo === 'incinerador');
    if (entry) return estadoDesdeIncinerador(incineradorDesdeCustom(entry), value);
  }
  const inc = estaticos.find((e) => e.id === value);
  if (inc) return estadoDesdeIncinerador(inc, value);
  return estadoDesdeIncinerador({ ...VACIO }, value);
}

/** Construye la entrada de catálogo a persistir desde el estado actual. */
export function buildIncineradorEntry(
  inc: DenaturationData['incinerador'],
  params: DenaturationData['parametros_incineracion'],
  creadoPor: string,
  createdAt: unknown,
): Omit<CatalogoCustomEntry, 'id'> {
  return {
    tipo: 'incinerador',
    marca_modelo: inc.marca_modelo.trim(),
    capacidad_carga_kg_h: inc.capacidad_carga_kg_h,
    incinerador_detalle: {
      horas_funcionamiento: inc.horas_funcionamiento_dia,
      camara_primaria: params.camara_primaria,
      num_quemadores_primaria: inc.num_quemadores_primaria,
      temperatura_camara_primaria_c: inc.temperatura_camara_primaria_c,
      camara_secundaria: params.camara_secundaria,
      num_quemadores_secundaria: inc.num_quemadores_secundaria,
      temperatura_camara_secundaria_c: inc.temperatura_camara_secundaria_c,
      requerimiento_energetico: inc.requerimiento_energetico,
      sistema_carga: inc.sistema_carga,
      sistema_descarga: inc.sistema_descarga,
      disposicion_final: inc.disposicion_final,
      almacenamiento_gas: inc.almacenamiento_gas,
      observaciones: inc.observaciones,
    },
    creadoPor,
    __createdAt: createdAt,
  };
}

/** Busca un incinerador custom con la misma marca/modelo (normalizado). */
export function findIncineradorDuplicado(
  catalogo: CatalogoCustomEntry[],
  marca_modelo: string,
): CatalogoCustomEntry | undefined {
  const norm = marca_modelo.trim().toLowerCase();
  return catalogo.find(
    (c) => c.tipo === 'incinerador' && c.marca_modelo.trim().toLowerCase() === norm,
  );
}
```

> Nota: `DenaturationData` ya se exporta desde `src/types.ts`. Si el import falla, verifica que el `export interface DenaturationData` existe (sí, ~línea 77).

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm run test -- incineradorCatalogo`
Expected: PASS (todos los `describe`).

- [ ] **Step 6: Typecheck**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/domain/incineradorCatalogo.ts src/domain/incineradorCatalogo.test.ts
git commit -m "feat: dominio puro para catálogo de incineradores (tipos + funciones + tests)"
```

---

### Task 2: Tipar incineradores estáticos en masterData

**Files:**
- Modify: `src/constants/masterData.ts` (export `INCINERADORES_ESTATICOS`, ~línea 145)

Esto da un arreglo tipado con `id` para pasar a `resolverIncinerador` sin castear en App.tsx.

- [ ] **Step 1: Añadir export tipado**

En `src/constants/masterData.ts`, al final del archivo (tras `OPCIONES_INCINERADOR`), añade:

```ts
import type { IncineradorCompleto } from '../domain/incineradorCatalogo';

/** Vista tipada de los incineradores del catálogo estático para el resolver. */
export const INCINERADORES_ESTATICOS: Array<IncineradorCompleto & { id: string }> =
  CATALOGO_DESNATURALIZACION.incineradores;
```

> Si TypeScript reclama que algún campo no coincide, es señal de que un objeto en `CATALOGO_DESNATURALIZACION.incineradores` (líneas 146-181) omite un campo de `IncineradorCompleto`. Ambos objetos existentes ya tienen los 15 campos; no deberían faltar.

- [ ] **Step 2: Typecheck**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/constants/masterData.ts
git commit -m "feat: export tipado INCINERADORES_ESTATICOS para el resolver"
```

---

### Task 3: Tarjeta — desplegable con optgroups, campos editables y handler

**Files:**
- Modify: `src/App.tsx` import de dominio (~línea 128), `handleSelectIncineradorSecundario` (~3631), JSX de la tarjeta (~7868-7950)

- [ ] **Step 1: Importar funciones de dominio y constante**

En `src/App.tsx`, junto a los imports existentes (busca el import de `./constants/masterData` o agrega uno nuevo):

```ts
import {
  ID_NUEVO_INCINERADOR,
  resolverIncinerador,
  buildIncineradorEntry,
  findIncineradorDuplicado,
} from './domain/incineradorCatalogo';
import { INCINERADORES_ESTATICOS } from './constants/masterData';
```

> `INCINERADORES_ESTATICOS` puede añadirse a un import existente de `./constants/masterData` si ya hay uno.

- [ ] **Step 2: Reemplazar `handleSelectIncineradorSecundario`**

Sustituye la función completa (~líneas 3631-3662) por:

```ts
  const handleSelectIncineradorSecundario = (value: string) => {
    const { incinerador, parametros_incineracion } = resolverIncinerador(
      value,
      INCINERADORES_ESTATICOS,
      catalogoCustom,
    );
    setState(prev => ({
      ...prev,
      denaturation: {
        ...prev.denaturation,
        parametros_incineracion,
        incinerador: {
          ...incinerador,
          activo: prev.denaturation.incinerador.activo,
        },
      },
    }));
  };
```

- [ ] **Step 3: Reemplazar el `<select>` del incinerador por uno con optgroups**

En la tarjeta (~líneas 7879-7888), reemplaza el `<select>` y sus `<option>` por:

```tsx
                        <select
                          aria-label="Incinerador (Catálogo)" value={state.denaturation.incinerador.id_catalogo}
                          onChange={(e) => handleSelectIncineradorSecundario(e.target.value)}
                          className="w-full px-4 py-2.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="">Seleccionar incinerador...</option>
                          <optgroup label="— Catálogo estándar —">
                            {CATALOGO_DESNATURALIZACION.incineradores.map(i => (
                              <option key={i.id} value={i.id}>{i.marca_modelo} — {i.capacidad_carga_kg_h} kg/h</option>
                            ))}
                          </optgroup>
                          {catalogoCustom.filter(c => c.tipo === 'incinerador').length > 0 && (
                            <optgroup label="— Guardados —">
                              {catalogoCustom.filter(c => c.tipo === 'incinerador').map(c => (
                                <option key={c.id} value={`custom:${c.id}`}>{c.marca_modelo} — {c.capacidad_carga_kg_h ?? 0} kg/h</option>
                              ))}
                            </optgroup>
                          )}
                          <option value={ID_NUEVO_INCINERADOR}>➕ Nuevo incinerador (manual)</option>
                        </select>
```

- [ ] **Step 4: Convertir el bloque ReadOnly en campos editables**

Reemplaza el bloque IIFE `{state.denaturation.incinerador.id_catalogo && (() => { ... })()}` (~líneas 7900-7919, el que define `ReadOnly` y renderiza las 5 filas) por inputs editables. Quedará así (insertar en lugar de ese bloque):

```tsx
                      {(state.denaturation.incinerador.id_catalogo || state.denaturation.incinerador.activo) && (
                        <>
                          <InputField label="Marca / Modelo" value={state.denaturation.incinerador.marca_modelo} onChange={(v) => updateDenaturation('incinerador.marca_modelo', v)} />
                          <InputField label="Capacidad Carga" type="number" value={state.denaturation.incinerador.capacidad_carga_kg_h} onChange={(v) => updateDenaturation('incinerador.capacidad_carga_kg_h', v)} suffix="kg/h" min={0} max={5000} />
                          <InputField label="Cámara Primaria (Dimensiones)" value={state.denaturation.parametros_incineracion.camara_primaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_primaria', v)} />
                          <InputField label="N° Quemadores Primaria" type="number" value={state.denaturation.incinerador.num_quemadores_primaria} onChange={(v) => updateDenaturation('incinerador.num_quemadores_primaria', v)} min={0} max={10} />
                          <InputField label="Temp. Cámara Primaria" type="number" value={state.denaturation.incinerador.temperatura_camara_primaria_c} onChange={(v) => updateDenaturation('incinerador.temperatura_camara_primaria_c', v)} suffix="°C" min={0} max={2000} />
                          <InputField label="Cámara Secundaria (Dimensiones)" value={state.denaturation.parametros_incineracion.camara_secundaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_secundaria', v)} />
                          <InputField label="N° Quemadores Secundaria" type="number" value={state.denaturation.incinerador.num_quemadores_secundaria} onChange={(v) => updateDenaturation('incinerador.num_quemadores_secundaria', v)} min={0} max={10} />
                          <InputField label="Temp. Cámara Secundaria" type="number" value={state.denaturation.incinerador.temperatura_camara_secundaria_c} onChange={(v) => updateDenaturation('incinerador.temperatura_camara_secundaria_c', v)} suffix="°C" min={0} max={2000} />
                          <InputField label="Requerimiento Energético" value={state.denaturation.incinerador.requerimiento_energetico} onChange={(v) => updateDenaturation('incinerador.requerimiento_energetico', v)} />
                        </>
                      )}
```

> Los `<select>` de Sistema de Carga/Descarga/Disposición/Almacenamiento y el InputField de Observaciones (líneas 7920-7946) ya son editables; déjalos como están. El cálculo de "Capacidad Calculada" (líneas 7891-7899) sigue funcionando porque lee `capacidad_carga_kg_h` y `horas_funcionamiento_dia`.

- [ ] **Step 5: Verificar typecheck**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 6: Verificación manual en dev**

Run: `npm run dev` y abre `http://localhost:3000`. En Desnaturalización → Incinerador Secundario:
1. Activa el checkbox.
2. Elige "Catálogo estándar → ADDFIELD / THUNDER 1000": los campos se llenan y son editables.
3. Edita "Temp. Cámara Primaria" a 999 — debe quedar reflejado.
4. Elige "➕ Nuevo incinerador (manual)": los campos quedan en blanco y editables.
Expected: comportamiento descrito; sin errores en consola.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: incinerador secundario con campos editables y opción manual/guardados"
```

---

### Task 4: Botón "Guardar en catálogo" + persistencia

**Files:**
- Modify: `src/App.tsx` (estado de UI cerca de otros `useState` ~1983; nuevo handler cerca de `saveCustomEquipo` ~3567; botón en la tarjeta tras Observaciones ~7946)

- [ ] **Step 1: Añadir estado de feedback del botón**

Cerca de `const [catalogoCustom, setCatalogoCustom] = useState...` (~línea 1983), añade:

```ts
  const [guardandoInc, setGuardandoInc] = useState<'idle' | 'guardando' | 'guardado'>('idle');
```

- [ ] **Step 2: Añadir el handler `handleGuardarIncinerador`**

Justo después de `saveCustomEquipo` (~línea 3585), añade:

```ts
  const handleGuardarIncinerador = async () => {
    const inc = state.denaturation.incinerador;
    if (!inc.marca_modelo.trim()) {
      alert('Ingresa la marca/modelo del incinerador antes de guardarlo.');
      return;
    }
    setGuardandoInc('guardando');
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('./firebase');
      const user = (auth as any).currentUser;
      const payload = buildIncineradorEntry(
        inc,
        state.denaturation.parametros_incineracion,
        user?.email ?? 'admin',
        serverTimestamp(),
      );
      const dup = findIncineradorDuplicado(catalogoCustom, inc.marca_modelo);
      if (dup?.id) {
        await updateDoc(doc(db, 'catalogo_custom', dup.id), payload as any);
        setCatalogoCustom(prev => prev.map(c => (c.id === dup.id ? { ...payload, id: dup.id, __createdAt: new Date() } : c)));
        updateDenaturation('incinerador.id_catalogo', `custom:${dup.id}`);
      } else {
        const ref = await addDoc(collection(db, 'catalogo_custom'), payload);
        setCatalogoCustom(prev => [...prev, { ...payload, id: ref.id, __createdAt: new Date() }]);
        updateDenaturation('incinerador.id_catalogo', `custom:${ref.id}`);
      }
      setGuardandoInc('guardado');
      setTimeout(() => setGuardandoInc('idle'), 2000);
    } catch (err) {
      console.error('Error guardando incinerador:', err);
      setGuardandoInc('idle');
      alert('Error al guardar el incinerador. Verifica la conexión e intenta nuevamente.');
    }
  };
```

- [ ] **Step 3: Añadir el botón en la tarjeta**

Tras el bloque de Observaciones (~línea 7946, justo antes del `</div>` que cierra el grid `md:grid-cols-2`), añade:

```tsx
                      <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                        {findIncineradorDuplicado(catalogoCustom, state.denaturation.incinerador.marca_modelo) && (
                          <span className="text-xs text-slate-400">Ya existe: se actualizará el guardado.</span>
                        )}
                        <button
                          type="button"
                          onClick={handleGuardarIncinerador}
                          disabled={guardandoInc === 'guardando' || !state.denaturation.incinerador.marca_modelo.trim()}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {guardandoInc === 'guardando' ? 'Guardando…' : guardandoInc === 'guardado' ? 'Guardado ✓' : 'Guardar en catálogo'}
                        </button>
                      </div>
```

- [ ] **Step 4: Typecheck**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Run: `npm run dev`. Activa incinerador → "Nuevo manual" → llena Marca/Modelo "PRUEBA QA" + capacidad + algunos campos → "Guardar en catálogo".
Expected: botón pasa a "Guardado ✓"; "PRUEBA QA" aparece en el grupo "Guardados" del desplegable y queda seleccionado. Recarga la página y vuelve a abrir el desplegable: "PRUEBA QA" sigue ahí (persistió en Firestore). Vuelve a guardarlo con un cambio → debe **actualizar** (no duplicar) y mostrar el aviso "Ya existe".

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: guardar/actualizar incinerador en catálogo desde la tarjeta"
```

---

### Task 5: Admin — formulario completo de incinerador + edición

**Files:**
- Modify: `src/components/CatalogoEquiposAdmin.tsx` (FormState, EMPTY_FORM, props, handleSubmit, render de campos, fila con botón editar)
- Modify: `src/App.tsx` (handler `handleUpdateEquipo` + pasar prop `onUpdate`)

- [ ] **Step 1: Wiring de `onUpdate` en App.tsx**

Junto a `handleAddEquipo`/`handleDeleteEquipo` (~línea 1989), añade:

```ts
  const handleUpdateEquipo = (entry: CatalogoCustomEntry) => {
    setCatalogoCustom(prev => prev.map(e => (e.id === entry.id ? entry : e)));
  };
```

Busca dónde se renderiza `<CatalogoEquiposAdmin` (~línea 6951) y añade la prop:

```tsx
            onUpdate={handleUpdateEquipo}
```

- [ ] **Step 2: Ampliar `FormState`, `EMPTY_FORM` y `Props` en el admin**

En `src/components/CatalogoEquiposAdmin.tsx`, en `interface FormState` (~línea 29) añade tras `notas: string;`:

```ts
  // Detalle incinerador
  horas_funcionamiento: string;
  camara_primaria: string;
  num_quemadores_primaria: string;
  temperatura_camara_primaria_c: string;
  camara_secundaria: string;
  num_quemadores_secundaria: string;
  temperatura_camara_secundaria_c: string;
  requerimiento_energetico: string;
  sistema_carga: string;
  sistema_descarga: string;
  disposicion_final: string;
  almacenamiento_gas: string;
```

En `EMPTY_FORM` (~línea 43) añade los mismos campos con `''`:

```ts
  horas_funcionamiento: '',
  camara_primaria: '',
  num_quemadores_primaria: '',
  temperatura_camara_primaria_c: '',
  camara_secundaria: '',
  num_quemadores_secundaria: '',
  temperatura_camara_secundaria_c: '',
  requerimiento_energetico: '',
  sistema_carga: '',
  sistema_descarga: '',
  disposicion_final: '',
  almacenamiento_gas: '',
```

En `interface Props` (~línea 57) añade:

```ts
  onUpdate: (entry: CatalogoCustomEntry) => void;
```

Y en la firma del componente (~línea 63): `export function CatalogoEquiposAdmin({ catalogoCustom, onAdd, onDelete, onUpdate }: Props) {`

- [ ] **Step 3: Añadir estado de edición**

Tras `const [showForm, setShowForm] = useState(false);` (~línea 64) añade:

```ts
  const [editingId, setEditingId] = useState<string | null>(null);
```

- [ ] **Step 4: Importar el tipo de detalle**

En el import superior (`import { CatalogoCustomEntry, TipoEquipoCatalogo } from '../types';`) añade `IncineradorDetalle`:

```ts
import { CatalogoCustomEntry, TipoEquipoCatalogo, IncineradorDetalle } from '../types';
```

- [ ] **Step 5: Construir el detalle y soportar update en `handleSubmit`**

Dentro de `handleSubmit`, tras construir `payload` (~línea 106, antes de `const ref = await addDoc(...)`), añade el detalle del incinerador al payload:

```ts
      if (form.tipo === 'incinerador') {
        const detalle: IncineradorDetalle = {
          horas_funcionamiento: Number(form.horas_funcionamiento) || 8,
          camara_primaria: form.camara_primaria.trim(),
          num_quemadores_primaria: Number(form.num_quemadores_primaria) || 0,
          temperatura_camara_primaria_c: Number(form.temperatura_camara_primaria_c) || 0,
          camara_secundaria: form.camara_secundaria.trim(),
          num_quemadores_secundaria: Number(form.num_quemadores_secundaria) || 0,
          temperatura_camara_secundaria_c: Number(form.temperatura_camara_secundaria_c) || 0,
          requerimiento_energetico: form.requerimiento_energetico.trim(),
          sistema_carga: form.sistema_carga.trim() || 'N/A',
          sistema_descarga: form.sistema_descarga.trim() || 'N/A',
          disposicion_final: form.disposicion_final.trim() || 'N/A',
          almacenamiento_gas: form.almacenamiento_gas.trim() || 'N/A',
          observaciones: form.notas.trim(),
        };
        (payload as Omit<CatalogoCustomEntry, 'id'>).incinerador_detalle = detalle;
      }
```

Luego reemplaza el bloque que hace `addDoc` + `onAdd` (~líneas 108-111) por:

```ts
      if (editingId) {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'catalogo_custom', editingId), payload as any);
        onUpdate({ ...payload, id: editingId, __createdAt: new Date() });
      } else {
        const ref = await addDoc(collection(db, 'catalogo_custom'), payload);
        onAdd({ ...payload, id: ref.id, __createdAt: new Date() });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
```

> Quita la línea `const ref = await addDoc(...)` y `onAdd(...)` originales (ya están incluidas arriba en la rama `else`).

- [ ] **Step 6: Añadir botón "Editar" por fila y función `startEdit`**

Antes del `return (` del componente, añade:

```ts
  const startEdit = (entry: CatalogoCustomEntry) => {
    const d = entry.incinerador_detalle;
    setForm({
      ...EMPTY_FORM,
      tipo: entry.tipo,
      marca_modelo: entry.marca_modelo,
      fabricante: entry.fabricante ?? '',
      material: entry.material ?? '',
      notas: entry.tipo === 'incinerador' ? (d?.observaciones ?? '') : (entry.notas ?? ''),
      capacidad_nominal_kg_h: entry.capacidad_nominal_kg_h?.toString() ?? '',
      almacenamiento_l: entry.almacenamiento_l?.toString() ?? '',
      capacidad_carga_kg_h: entry.capacidad_carga_kg_h?.toString() ?? '',
      rendimiento_kg_h: entry.rendimiento_kg_h?.toString() ?? '',
      potencia_kw: entry.potencia_kw?.toString() ?? '',
      cfm: entry.cfm?.toString() ?? '',
      horas_funcionamiento: d?.horas_funcionamiento?.toString() ?? '',
      camara_primaria: d?.camara_primaria ?? '',
      num_quemadores_primaria: d?.num_quemadores_primaria?.toString() ?? '',
      temperatura_camara_primaria_c: d?.temperatura_camara_primaria_c?.toString() ?? '',
      camara_secundaria: d?.camara_secundaria ?? '',
      num_quemadores_secundaria: d?.num_quemadores_secundaria?.toString() ?? '',
      temperatura_camara_secundaria_c: d?.temperatura_camara_secundaria_c?.toString() ?? '',
      requerimiento_energetico: d?.requerimiento_energetico ?? '',
      sistema_carga: d?.sistema_carga ?? '',
      sistema_descarga: d?.sistema_descarga ?? '',
      disposicion_final: d?.disposicion_final ?? '',
      almacenamiento_gas: d?.almacenamiento_gas ?? '',
    });
    setEditingId(entry.id ?? null);
    setShowForm(true);
  };
```

En la celda de acciones de la tabla, junto al botón de eliminar (~línea 322), añade antes del botón de borrar:

```tsx
                      {entry.id && (
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Editar"
                          aria-label={`Editar ${entry.marca_modelo}`}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
```

Y añade `Pencil` al import de lucide (línea 2): `import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Pencil } from 'lucide-react';`

- [ ] **Step 7: Renderizar los campos de detalle cuando `tipo === 'incinerador'`**

Tras el `<div>` de "Material" (~línea 243, antes del `<div>` de "Notas"), añade un bloque condicional con los campos del incinerador:

```tsx
          {form.tipo === 'incinerador' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="inc-horas" className={labelCls}>Horas funcionamiento/día</label>
                <input id="inc-horas" type="number" min={0} max={24} value={form.horas_funcionamiento} onChange={e => set('horas_funcionamiento', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-req" className={labelCls}>Requerimiento energético</label>
                <input id="inc-req" type="text" placeholder="Ej. 390 kWh" value={form.requerimiento_energetico} onChange={e => set('requerimiento_energetico', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-cp" className={labelCls}>Cámara primaria (dim.)</label>
                <input id="inc-cp" type="text" placeholder="Ej. 1.450 m diámetro interior" value={form.camara_primaria} onChange={e => set('camara_primaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-qp" className={labelCls}>N° quemadores primaria</label>
                <input id="inc-qp" type="number" min={0} max={10} value={form.num_quemadores_primaria} onChange={e => set('num_quemadores_primaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-tp" className={labelCls}>Temp. cámara primaria (°C)</label>
                <input id="inc-tp" type="number" min={0} max={2000} value={form.temperatura_camara_primaria_c} onChange={e => set('temperatura_camara_primaria_c', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-cs" className={labelCls}>Cámara secundaria (dim.)</label>
                <input id="inc-cs" type="text" placeholder="Ej. 2 m Diámetro Interior" value={form.camara_secundaria} onChange={e => set('camara_secundaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-qs" className={labelCls}>N° quemadores secundaria</label>
                <input id="inc-qs" type="number" min={0} max={10} value={form.num_quemadores_secundaria} onChange={e => set('num_quemadores_secundaria', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-ts" className={labelCls}>Temp. cámara secundaria (°C)</label>
                <input id="inc-ts" type="number" min={0} max={2000} value={form.temperatura_camara_secundaria_c} onChange={e => set('temperatura_camara_secundaria_c', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-carga" className={labelCls}>Sistema de carga</label>
                <input id="inc-carga" type="text" placeholder="Ej. CARGA MANUAL TACHOS 60L" value={form.sistema_carga} onChange={e => set('sistema_carga', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-descarga" className={labelCls}>Sistema de descarga</label>
                <input id="inc-descarga" type="text" placeholder="Ej. MANUAL HACIA MAXISACOS" value={form.sistema_descarga} onChange={e => set('sistema_descarga', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-disp" className={labelCls}>Disposición final</label>
                <input id="inc-disp" type="text" placeholder="Ej. VERTEDERO MUNICIPAL PTA ARENAS" value={form.disposicion_final} onChange={e => set('disposicion_final', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="inc-gas" className={labelCls}>Almacenamiento gas</label>
                <input id="inc-gas" type="text" placeholder="Ej. 4000L X 2 = 8.000L GAS GLP" value={form.almacenamiento_gas} onChange={e => set('almacenamiento_gas', e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
```

> El campo "Notas" existente se usa como `observaciones` del incinerador (ya mapeado en `startEdit` y `handleSubmit`).

- [ ] **Step 8: Reflejar modo edición en el botón de submit y el header**

En el texto del botón de submit (~línea 265) cambia para reflejar edición:

```tsx
            {saving ? 'Guardando…' : editingId ? 'Actualizar equipo' : 'Guardar equipo'}
```

Y en el botón "Nuevo equipo / Cancelar" del header (~línea 148), al cancelar limpia la edición:

```tsx
          onClick={() => { setShowForm(v => !v); if (showForm) { setEditingId(null); setForm(EMPTY_FORM); } }}
```

- [ ] **Step 9: Typecheck**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 10: Verificación manual**

Run: `npm run dev`. En el panel de admin de equipos:
1. "Nuevo equipo" → tipo "Incinerador" → aparecen los campos de detalle. Llena y guarda.
2. En la tabla, pulsa "Editar" en esa fila → el formulario se pre-llena → cambia un valor → "Actualizar equipo".
Expected: el cambio persiste (recarga y reabre edición para confirmar). El incinerador editado aparece correctamente en el desplegable de la tarjeta con sus campos.

- [ ] **Step 11: Commit**

```bash
git add src/App.tsx src/components/CatalogoEquiposAdmin.tsx
git commit -m "feat: admin de catálogo con formulario completo de incinerador y edición"
```

---

### Task 6: Changelog (convención del proyecto)

**Files:**
- Modify: `src/App.tsx` (`CHANGELOG_VERSION` ~2897 y los pasos del modal de novedades)

- [ ] **Step 1: Subir la versión**

En `src/App.tsx` (~línea 2897) cambia:

```ts
  const CHANGELOG_VERSION = '2026-06-03-v13';
```

- [ ] **Step 2: Añadir el paso al modal**

El changelog es un arreglo tipado `const steps: {...}[] = [ ... ]` (~línea 9581). Cada paso es un objeto `{ Icon, color, titulo, descripcion, detalle: string[] }`. Añade como **primer** elemento del arreglo (para que aparezca primero) este objeto:

```ts
          {
            Icon: Settings2,
            color: '#c2410c',
            titulo: 'Incinerador a medida y reutilizable',
            descripcion: 'Ahora puedes ingresar un incinerador llenando todos sus campos y guardarlo en el catálogo para reutilizarlo en otras certificaciones.',
            detalle: [
              'Nuevo: opción "➕ Nuevo incinerador (manual)" en el selector de Incinerador Secundario.',
              'Los campos de detalle (cámaras, temperaturas, quemadores, etc.) son editables.',
              '"Guardar en catálogo" persiste el incinerador; reutilízalo, edítalo o elimínalo desde el panel de equipos.',
            ],
          },
```

> `Settings2` ya está importado (lo usan otros pasos). El `color` naranja `#c2410c` distingue la novedad del incinerador.

- [ ] **Step 3: Typecheck + tests**

Run: `npm run lint` y `npm run test`
Expected: lint sin errores; todos los tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "chore: changelog v13 — incinerador manual + catálogo"
```

---

## Verificación final

- [ ] `npm run lint` — sin errores de tipos.
- [ ] `npm run test` — toda la suite PASS (incluye `incineradorCatalogo.test.ts`).
- [ ] `npm run build` — build exitoso.
- [ ] Flujo manual completo: crear manual → guardar → reutilizar en otra "certificación" (nuevo registro) → editar tras seleccionar sin alterar el guardado → editar/eliminar desde el admin.
