# Catálogo de Equipos — Actualización y CRUD Manual

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar TERMINATOR VRG 530/515 y Prepicador Doble al catálogo estático, extender el tipo `CatalogoCustomEntry`, y construir un componente admin CRUD (tabla + formulario) para que usuarios con rol admin puedan agregar, ver y eliminar equipos personalizados almacenados en Firestore (`catalogo_custom` collection).

**Architecture:** El catálogo estático (`masterData.ts`) recibe las nuevas entradas. El tipo `CatalogoCustomEntry` en `types.ts` se extiende para soportar nuevas categorías de equipo y un campo `id` para permitir eliminación por doc Firestore. Un nuevo componente `CatalogoEquiposAdmin.tsx` encapsula tabla + formulario reactivo, usando dynamic Firestore imports siguiendo el patrón existente de App.tsx. El componente recibe `catalogoCustom`, `onAdd` y `onDelete` como props y se integra en el `ConfigView` existente, protegido por `isAdmin`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Firebase Firestore (ya configurado en `src/firebase.ts`), Lucide React icons. Sin librerías de formulario externas (YAGNI — el proyecto usa estado controlado manual).

---

## Archivos afectados

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `src/constants/masterData.ts` | Agregar TERMINATOR VRG 530/515 a `trituradoras` + nuevo sub-array `prepicadores` |
| Modificar | `src/types.ts` | Extender `CatalogoCustomEntry`: nuevos tipos, campo `id?`, campo `fabricante?`, campo `notas?` |
| Crear | `src/components/CatalogoEquiposAdmin.tsx` | Formulario adaptativo + tabla con eliminación; llamadas Firestore internas |
| Modificar | `src/App.tsx` | Incluir `id` al cargar docs de Firestore; renderizar `CatalogoEquiposAdmin` en ConfigView; manejar callbacks `onAdd`/`onDelete` |

---

## Task 1: Actualizar catálogo estático en masterData.ts

**Files:**
- Modify: `src/constants/masterData.ts`

- [ ] **Step 1: Agregar TERMINATOR VRG 530 y VRG 515 al array `trituradoras`**

Al final del array `trituradoras`, antes del cierre `],`, agregar:

```typescript
    {
      // TERMINATOR VRG 530 — Ydra (Noruega). Grinder pump continuo para ensilaje.
      // Motor 22 kW | Caudal máx ~289 m³/h | Material AISI 316 | Cuchillos Vanax (16 uds)
      // Tiempo molienda: pescado entero 2 t → 30-40 min; restos 2 t → 80-90 min.
      id: 'ydra-vrg-530',
      marca_modelo: 'TERMINATOR VRG 530 (Ydra)',
      capacidad_nominal_kg_h: 3500,
      almacenamiento_l: 5000,
      material: 'AISI 316 / Vanax',
      capacidad_prepicador_kg_h: 0,
      configuraciones_batch: [
        { label: '2.000 kg / 35 min — Pescado entero',   kilos: 2000, t_proceso: 30, t_pausa: 5 },
        { label: '2.000 kg / 90 min — Restos / cabezas', kilos: 2000, t_proceso: 85, t_pausa: 5 },
      ],
    },
    {
      // TERMINATOR VRG 515 — Ydra (Noruega). Versión compacta 15 kW.
      // Motor 15 kW | Caudal máx ~236 m³/h | Material AISI 316 | Cuchillos Vanax (16 uds)
      id: 'ydra-vrg-515',
      marca_modelo: 'TERMINATOR VRG 515 (Ydra)',
      capacidad_nominal_kg_h: 2500,
      almacenamiento_l: 2000,
      material: 'AISI 316 / Vanax',
      capacidad_prepicador_kg_h: 0,
      configuraciones_batch: [
        { label: '2.000 kg / 50 min — Pescado entero',    kilos: 2000, t_proceso: 45, t_pausa: 5 },
        { label: '2.000 kg / 115 min — Restos / cabezas', kilos: 2000, t_proceso: 110, t_pausa: 5 },
      ],
    },
```

- [ ] **Step 2: Agregar sub-array `prepicadores` a `CATALOGO_DESNATURALIZACION`**

Después del cierre del array `incineradores` y antes del `};` que cierra el objeto, agregar:

```typescript
  prepicadores: [
    {
      id: 'prepicador-doble-7-5kw',
      marca_modelo: 'Prepicador Doble 7,5 kW',
      rendimiento_kg_h: 5000,
      potencia_kw: 5.5,
      material: 'Acero Inoxidable 304',
      numero_ejes: 2,
      numero_cuchillos: 54,
    },
  ],
```

- [ ] **Step 3: Verificar que el archivo compila sin errores**

```bash
cd C:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npm run build 2>&1 | head -30
```

Expected: Sin errores TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/constants/masterData.ts
git commit -m "feat: add TERMINATOR VRG 530/515 and Prepicador Doble to static equipment catalog"
```

---

## Task 2: Extender el tipo CatalogoCustomEntry en types.ts

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Reemplazar la definición actual de `CatalogoCustomEntry`**

Buscar el bloque actual (líneas ~200-211):

```typescript
export interface CatalogoCustomEntry {
  tipo: 'trituradora' | 'incinerador';
  marca_modelo: string;
  capacidad_nominal_kg_h?: number;
  almacenamiento_l?: number;
  material?: string;
  capacidad_prepicador_kg_h?: number;
  configuraciones_batch?: Array<{ label: string; kilos: number; t_proceso: number; t_pausa: number }>;
  capacidad_carga_kg_h?: number;
  creadoPor: string;
  __createdAt: any;
}
```

Reemplazarlo con:

```typescript
export type TipoEquipoCatalogo =
  | 'trituradora'
  | 'incinerador'
  | 'prepicador'
  | 'grinder_pump'
  | 'ensilador'
  | 'bomba_centrifuga'
  | 'dosificador'
  | 'linea_extraccion'
  | 'compresor';

export interface CatalogoCustomEntry {
  id?: string;                          // Firestore document ID (para eliminación)
  tipo: TipoEquipoCatalogo;
  marca_modelo: string;
  fabricante?: string;
  // Campos trituradora / grinder_pump
  capacidad_nominal_kg_h?: number;
  almacenamiento_l?: number;
  material?: string;
  capacidad_prepicador_kg_h?: number;
  configuraciones_batch?: Array<{ label: string; kilos: number; t_proceso: number; t_pausa: number }>;
  // Campos incinerador
  capacidad_carga_kg_h?: number;
  // Campos prepicador / linea_extraccion / compresor
  rendimiento_kg_h?: number;
  potencia_kw?: number;
  cfm?: number;
  // Notas libres (todos los tipos)
  notas?: string;
  creadoPor: string;
  __createdAt: any;
}
```

- [ ] **Step 2: Actualizar `pendingCustomEquipo` en App.tsx para usar el nuevo tipo**

Buscar en `src/App.tsx`:

```typescript
const [pendingCustomEquipo, setPendingCustomEquipo] = useState<{ marca_modelo: string; tipo: 'trituradora' | 'incinerador' } | null>(null);
```

Reemplazar con:

```typescript
const [pendingCustomEquipo, setPendingCustomEquipo] = useState<{ marca_modelo: string; tipo: TipoEquipoCatalogo } | null>(null);
```

Agregar `TipoEquipoCatalogo` al import de `./types`:

```typescript
import { AppState, ReportImage, RegistroHistorico, EventoUso, CatalogoCustomEntry, TipoEquipoCatalogo } from './types';
```

- [ ] **Step 3: Verificar compilación**

```bash
npm run build 2>&1 | head -30
```

Expected: Sin errores TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/App.tsx
git commit -m "feat: extend CatalogoCustomEntry with new equipment types and optional fields"
```

---

## Task 3: Crear componente CatalogoEquiposAdmin

**Files:**
- Create: `src/components/CatalogoEquiposAdmin.tsx`

- [ ] **Step 1: Crear el archivo del componente**

Crear `src/components/CatalogoEquiposAdmin.tsx` con el siguiente contenido:

```typescript
import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { CatalogoCustomEntry, TipoEquipoCatalogo } from '../types';

const TIPO_LABELS: Record<TipoEquipoCatalogo, string> = {
  trituradora:      'Trituradora / Ensilaje',
  grinder_pump:     'Grinder Pump (continuo)',
  incinerador:      'Incinerador',
  prepicador:       'Prepicador',
  ensilador:        'Ensilador',
  bomba_centrifuga: 'Bomba Centrífuga',
  dosificador:      'Dosificador Químico',
  linea_extraccion: 'Línea de Extracción',
  compresor:        'Compresor',
};

const TIPO_COLOR: Record<TipoEquipoCatalogo, string> = {
  trituradora:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  grinder_pump:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  incinerador:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  prepicador:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ensilador:        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  bomba_centrifuga: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
  dosificador:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  linea_extraccion: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  compresor:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

interface FormState {
  tipo: TipoEquipoCatalogo;
  marca_modelo: string;
  fabricante: string;
  capacidad_nominal_kg_h: string;
  almacenamiento_l: string;
  capacidad_carga_kg_h: string;
  rendimiento_kg_h: string;
  potencia_kw: string;
  cfm: string;
  material: string;
  notas: string;
}

const EMPTY_FORM: FormState = {
  tipo: 'trituradora',
  marca_modelo: '',
  fabricante: '',
  capacidad_nominal_kg_h: '',
  almacenamiento_l: '',
  capacidad_carga_kg_h: '',
  rendimiento_kg_h: '',
  potencia_kw: '',
  cfm: '',
  material: '',
  notas: '',
};

interface Props {
  catalogoCustom: CatalogoCustomEntry[];
  onAdd: (entry: CatalogoCustomEntry) => void;
  onDelete: (id: string) => void;
}

export function CatalogoEquiposAdmin({ catalogoCustom, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const showCapacity = form.tipo === 'trituradora' || form.tipo === 'grinder_pump';
  const showStorage   = form.tipo === 'trituradora' || form.tipo === 'grinder_pump' || form.tipo === 'ensilador';
  const showKgH       = form.tipo === 'incinerador';
  const showRendimiento = form.tipo === 'prepicador' || form.tipo === 'linea_extraccion';
  const showPotencia  = ['prepicador','ensilador','bomba_centrifuga','dosificador','linea_extraccion','compresor','grinder_pump'].includes(form.tipo);
  const showCfm       = form.tipo === 'compresor';

  const handleSubmit = async () => {
    if (!form.marca_modelo.trim()) {
      setError('El nombre / marca-modelo es obligatorio.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('../firebase');
      const user = (auth as any).currentUser;

      const payload: Omit<CatalogoCustomEntry, 'id'> = {
        tipo: form.tipo,
        marca_modelo: form.marca_modelo.trim(),
        ...(form.fabricante.trim()            && { fabricante: form.fabricante.trim() }),
        ...(form.material.trim()              && { material: form.material.trim() }),
        ...(form.notas.trim()                 && { notas: form.notas.trim() }),
        ...(showCapacity && form.capacidad_nominal_kg_h && { capacidad_nominal_kg_h: Number(form.capacidad_nominal_kg_h) }),
        ...(showStorage  && form.almacenamiento_l       && { almacenamiento_l:       Number(form.almacenamiento_l) }),
        ...(showKgH      && form.capacidad_carga_kg_h   && { capacidad_carga_kg_h:   Number(form.capacidad_carga_kg_h) }),
        ...(showRendimiento && form.rendimiento_kg_h    && { rendimiento_kg_h:        Number(form.rendimiento_kg_h) }),
        ...(showPotencia && form.potencia_kw            && { potencia_kw:             Number(form.potencia_kw) }),
        ...(showCfm      && form.cfm                    && { cfm:                     Number(form.cfm) }),
        creadoPor: user?.email ?? 'admin',
        __createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'catalogo_custom'), payload);
      onAdd({ ...payload, id: ref.id, __createdAt: new Date() });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError('Error al guardar. Verifica la conexión y vuelve a intentarlo.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: CatalogoCustomEntry) => {
    if (!entry.id) return;
    if (!confirm(`¿Eliminar "${entry.marca_modelo}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(entry.id);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'catalogo_custom', entry.id));
      onDelete(entry.id);
    } catch (err) {
      alert('Error al eliminar el equipo. Intenta nuevamente.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all';
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Equipos Personalizados ({catalogoCustom.length})
        </h4>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {showForm ? <ChevronUp size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancelar' : 'Nuevo equipo'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Agregar equipo al catálogo</p>

          {/* Tipo */}
          <div>
            <label className={labelCls}>Tipo de equipo *</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value as TipoEquipoCatalogo)} className={inputCls}>
              {(Object.entries(TIPO_LABELS) as [TipoEquipoCatalogo, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Nombre / Marca-Modelo */}
          <div>
            <label className={labelCls}>Nombre / Marca-Modelo *</label>
            <input
              type="text"
              placeholder="Ej. TERMINATOR VRG 530 (Ydra)"
              value={form.marca_modelo}
              onChange={e => set('marca_modelo', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Fabricante */}
          <div>
            <label className={labelCls}>Fabricante / Proveedor</label>
            <input
              type="text"
              placeholder="Ej. Ydra (Noruega)"
              value={form.fabricante}
              onChange={e => set('fabricante', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Campos condicionados por tipo */}
          <div className="grid grid-cols-2 gap-3">
            {showCapacity && (
              <div>
                <label className={labelCls}>Capacidad nominal (kg/h)</label>
                <input type="number" min={0} value={form.capacidad_nominal_kg_h} onChange={e => set('capacidad_nominal_kg_h', e.target.value)} className={inputCls} />
              </div>
            )}
            {showStorage && (
              <div>
                <label className={labelCls}>Almacenamiento / Volumen (L)</label>
                <input type="number" min={0} value={form.almacenamiento_l} onChange={e => set('almacenamiento_l', e.target.value)} className={inputCls} />
              </div>
            )}
            {showKgH && (
              <div>
                <label className={labelCls}>Capacidad carga (kg/h)</label>
                <input type="number" min={0} value={form.capacidad_carga_kg_h} onChange={e => set('capacidad_carga_kg_h', e.target.value)} className={inputCls} />
              </div>
            )}
            {showRendimiento && (
              <div>
                <label className={labelCls}>Rendimiento (kg/h)</label>
                <input type="number" min={0} value={form.rendimiento_kg_h} onChange={e => set('rendimiento_kg_h', e.target.value)} className={inputCls} />
              </div>
            )}
            {showPotencia && (
              <div>
                <label className={labelCls}>Potencia (kW)</label>
                <input type="number" min={0} step="0.1" value={form.potencia_kw} onChange={e => set('potencia_kw', e.target.value)} className={inputCls} />
              </div>
            )}
            {showCfm && (
              <div>
                <label className={labelCls}>Caudal (CFM)</label>
                <input type="number" min={0} value={form.cfm} onChange={e => set('cfm', e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          {/* Material */}
          <div>
            <label className={labelCls}>Material</label>
            <input
              type="text"
              placeholder="Ej. Acero Inoxidable AISI 316"
              value={form.material}
              onChange={e => set('material', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Notas */}
          <div>
            <label className={labelCls}>Notas / Especificaciones adicionales</label>
            <textarea
              rows={3}
              placeholder="Ej. Motor 22 kW, 400V/50Hz. Cuchillos Vanax. Brida entrada 10 pulgadas."
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar equipo'}
          </button>
        </div>
      )}

      {/* Tabla */}
      {catalogoCustom.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
          No hay equipos personalizados. Agrega el primero con el botón de arriba.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Nombre / Modelo</th>
                <th className="text-left px-3 py-2">Fabricante</th>
                <th className="text-left px-3 py-2">Capacidad</th>
                <th className="text-left px-3 py-2">Material</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {catalogoCustom.map((entry, i) => {
                const capacidad = entry.capacidad_nominal_kg_h
                  ? `${entry.capacidad_nominal_kg_h.toLocaleString('es-CL')} kg/h`
                  : entry.capacidad_carga_kg_h
                  ? `${entry.capacidad_carga_kg_h.toLocaleString('es-CL')} kg/h`
                  : entry.rendimiento_kg_h
                  ? `${entry.rendimiento_kg_h.toLocaleString('es-CL')} kg/h`
                  : entry.cfm
                  ? `${entry.cfm} CFM`
                  : entry.almacenamiento_l
                  ? `${entry.almacenamiento_l.toLocaleString('es-CL')} L`
                  : '—';

                return (
                  <tr key={entry.id ?? i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLOR[entry.tipo]}`}>
                        {TIPO_LABELS[entry.tipo] ?? entry.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate" title={entry.marca_modelo}>
                      {entry.marca_modelo}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                      {entry.fabricante ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-xs">
                      {capacidad}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs max-w-[120px] truncate" title={entry.material}>
                      {entry.material ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.id && (
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          {deletingId === entry.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar que el componente compila**

```bash
npm run build 2>&1 | head -40
```

Expected: Sin errores TypeScript en el nuevo archivo.

- [ ] **Step 3: Commit**

```bash
git add src/components/CatalogoEquiposAdmin.tsx
git commit -m "feat: add CatalogoEquiposAdmin component with adaptive form and CRUD table"
```

---

## Task 4: Integrar componente en App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Importar el componente y el nuevo tipo**

Localizar el import de `./types` en App.tsx (línea ~124):

```typescript
import { AppState, ReportImage, RegistroHistorico, EventoUso, CatalogoCustomEntry } from './types';
```

Reemplazar con:

```typescript
import { AppState, ReportImage, RegistroHistorico, EventoUso, CatalogoCustomEntry, TipoEquipoCatalogo } from './types';
```

Agregar el import del nuevo componente junto a los demás imports de components (si existen, sino al principio del archivo):

```typescript
import { CatalogoEquiposAdmin } from './components/CatalogoEquiposAdmin';
```

- [ ] **Step 2: Incluir el `id` del documento al cargar `catalogo_custom` de Firestore**

Localizar en App.tsx (alrededor de línea 2827):

```typescript
const snap = await getDocs(collection(db, 'catalogo_custom'));
setCatalogoCustom(snap.docs.map(d => d.data() as CatalogoCustomEntry));
```

Reemplazar con:

```typescript
const snap = await getDocs(collection(db, 'catalogo_custom'));
setCatalogoCustom(snap.docs.map(d => ({ id: d.id, ...d.data() } as CatalogoCustomEntry)));
```

- [ ] **Step 3: Agregar callbacks `handleAddEquipo` y `handleDeleteEquipo` en App.tsx**

Buscar la función `handleSubmit` o el bloque donde se define `catalogoCustom` y agregar junto al estado existente (alrededor de línea 1897):

```typescript
const handleAddEquipo = (entry: CatalogoCustomEntry) => {
  setCatalogoCustom(prev => [...prev, entry]);
};

const handleDeleteEquipo = (id: string) => {
  setCatalogoCustom(prev => prev.filter(e => e.id !== id));
};
```

- [ ] **Step 4: Renderizar `CatalogoEquiposAdmin` en el ConfigView admin**

Localizar en App.tsx el bloque `ConfigView` donde se muestra la sección de catálogo personalizado (buscar `pendingCustomEquipo` o `Catálogo personalizado`). Identificar el JSX de la sección de catálogo custom y reemplazarlo con:

```tsx
{/* Catálogo de equipos personalizados */}
<div className="space-y-3">
  <CatalogoEquiposAdmin
    catalogoCustom={catalogoCustom}
    onAdd={handleAddEquipo}
    onDelete={handleDeleteEquipo}
  />
</div>
```

> **Nota:** Si el bloque `pendingCustomEquipo` tiene su propio formulario inline, eliminar ese JSX y los handlers relacionados (`setPendingCustomEquipo`, `handleGuardarEquipoCustom`, etc.) ya que `CatalogoEquiposAdmin` los reemplaza completamente.

- [ ] **Step 5: Verificar compilación completa**

```bash
npm run build 2>&1 | head -40
```

Expected: Sin errores TypeScript.

- [ ] **Step 6: Verificar comportamiento visual**

```bash
npm run dev
```

1. Abrir `http://localhost:5173`
2. Iniciar sesión con PIN de admin
3. Navegar a la sección de configuración (engranaje)
4. Verificar que aparece la tabla de equipos personalizados (vacía si no hay datos en Firestore)
5. Hacer clic en "Nuevo equipo", seleccionar tipo "Trituradora / Ensilaje", ingresar nombre "Test Equipo", hacer clic en "Guardar equipo"
6. Verificar que aparece en la tabla con el tipo correcto
7. Hacer clic en el ícono de eliminar y confirmar — verificar que desaparece de la tabla
8. Cambiar tipo a "Grinder Pump" y verificar que los campos condicionados cambian (aparece "Potencia kW", "Capacidad nominal kg/h", "Almacenamiento L")
9. Cambiar tipo a "Compresor" y verificar que aparece el campo "Caudal (CFM)"
10. Verificar que los TERMINATOR VRG 530/515 aparecen en el dropdown de trituradora en el formulario de desnaturalización

- [ ] **Step 7: Commit final**

```bash
git add src/App.tsx src/components/CatalogoEquiposAdmin.tsx
git commit -m "feat: integrate CatalogoEquiposAdmin into ConfigView with add/delete callbacks"
```

---

## Self-Review

### Spec coverage

| Requisito | Tarea que lo implementa |
|-----------|------------------------|
| Actualizar catálogo extracción con nuevos equipos | Task 1 (TERMINATOR VRG a trituradoras) |
| Actualizar catálogo desnaturalización / ensilaje | Task 1 (TERMINATOR VRG 530/515 + Prepicador) |
| Habilitar ingreso manual de nuevos equipos | Task 3 (formulario en CatalogoEquiposAdmin) |
| Formulario tipo con campos por categoría | Task 3 (formulario adaptativo por tipo) |
| Tabla de equipos | Task 3 (tabla con columnas tipo/nombre/fabricante/capacidad/material) |
| Almacenar en Firebase | Task 3 (addDoc a `catalogo_custom`), Task 4 (carga con doc IDs) |
| Eliminación de entradas | Task 3 (handleDelete + deleteDoc) |
| Persistencia del `id` para eliminación | Task 4 Step 2 (incluir `d.id` al mapear docs) |

### Sin placeholders: revisado ✓
### Tipos consistentes a lo largo del plan: revisado ✓
- `TipoEquipoCatalogo` definido en Task 2, usado en Task 3 y Task 4 ✓
- `CatalogoCustomEntry.id?: string` definido en Task 2, usado en Task 3 (delete) y Task 4 (carga) ✓
- `onAdd` recibe `CatalogoCustomEntry`, `onDelete` recibe `string` (id) — consistente ✓
