# Imágenes rotas y control de slot aéreo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Que las imágenes carguen correctamente al abrir un registro desde el historial en cualquier dispositivo/usuario; (2) Permitir al usuario elegir manualmente en qué celda de la tabla de Ubicación Espacial (arriba-completa / izquierda / derecha) queda cada imagen aérea.

**Architecture:**
- Tarea 1: Cuando `loadFromHistorico` carga el estado, relanzar la restauración desde IDB localmente para fusionar cualquier base64 cached. Esto complementa el fix de hoy (URLs en Firestore) cubriendo registros antiguos y el mismo dispositivo.
- Tarea 2: Agregar campo `slotUbicacion?: 'top' | 'left' | 'right'` a `ReportImage`. En la UI, mostrar un selector de slot solo para imágenes de sección `Ubicación Espacial`. En `addAerialSection`, usar el slot asignado en lugar del keyword-matching actual.

**Tech Stack:** React 19, TypeScript, jsPDF + jspdf-autotable, Firebase Storage, IndexedDB (idb helpers internos).

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/types.ts` | Agregar `slotUbicacion?: 'top' \| 'left' \| 'right'` a `ReportImage` |
| `src/App.tsx` | (1) `loadFromHistorico` lanza IDB merge post-setState; (2) UI selector de slot; (3) `addAerialSection` usa slot |

---

## Tarea 1: Restaurar imágenes desde IDB al cargar desde historial

**Contexto:** `loadFromHistorico` (línea ~1928) hace `setState` con el snapshot de Firestore. El `useEffect` de IDB (línea ~1550) solo corre en mount — no vuelve a correr. Por lo tanto, imágenes con `url: ''` (guardadas antes del fix de hoy) nunca se restauran desde el IDB local del usuario.

**Archivos:**
- Modify: `src/App.tsx` — función `loadFromHistorico`

---

- [ ] **Step 1: Leer el bloque actual de `loadFromHistorico`**

Abre `src/App.tsx` y localiza la función `loadFromHistorico` (~línea 1928):

```typescript
const loadFromHistorico = (entry: RegistroHistorico) => {
  if (!window.confirm(...)) return;
  logEvento('abrir_registro', { ... });
  setState({
    ...entry.snapshot,
    images: (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' })),
    registroId: entry.registroId,
  });
  setActiveTab('general');
};
```

- [ ] **Step 2: Convertir a async y fusionar IDB tras setState**

Reemplazar la función por:

```typescript
const loadFromHistorico = async (entry: RegistroHistorico) => {
  if (!window.confirm(
    `¿Cargar los datos de ${entry.nombreCentro} (${entry.codigoCentro}) en el formulario?\n` +
    'Los cambios no guardados del formulario actual se perderán.'
  )) return;
  logEvento('abrir_registro', { codigoCentro: entry.codigoCentro, nombreCentro: entry.nombreCentro, titular: entry.titular });

  // Primera pasada: cargar snapshot tal como viene (puede tener url vacía en registros antiguos)
  const loadedImages = (entry.snapshot.images as any[]).map(img => ({ ...img, url: img.url ?? '' }));
  setState({
    ...entry.snapshot,
    images: loadedImages,
    registroId: entry.registroId,
  });

  // Segunda pasada: fusionar URLs del IDB local (cubre registros creados en este dispositivo
  // antes del fix que guarda URLs en Firestore)
  try {
    const urlMap = await idbGetAll();
    if (Object.keys(urlMap).length > 0) {
      setState(prev => ({
        ...prev,
        images: prev.images.map(img => ({
          ...img,
          url: urlMap[img.id] ?? img.url,
        })),
      }));
    }
  } catch { /* IDB no crítico */ }

  setActiveTab('general');
};
```

- [ ] **Step 3: Verificar que compila sin errores**

```bash
npm run lint
```

Esperado: 0 errores TypeScript.

- [ ] **Step 4: Prueba manual**
  1. Con `operaciones@certimar.cl`, abre un registro existente con imágenes (subido antes del fix de hoy — sin URL en Firestore).
  2. Ve al historial y carga ese registro.
  3. Verifica que las imágenes cargan (desde IDB del mismo dispositivo).
  4. Luego guarda el registro → ahora la URL queda en Firestore.
  5. Con `informes@certimar.cl` en otro navegador, carga ese mismo registro desde historial.
  6. Verifica que las imágenes cargan (desde URL de Firestore).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "fix: restaurar imágenes desde IDB al cargar registro desde historial"
```

---

## Tarea 2: Selector de slot para imágenes de Ubicación Espacial

**Contexto:** `addAerialSection` (línea ~4423) asigna imágenes a 3 slots (arriba completa, izquierda, derecha) por keyword-matching en `leyenda`. El usuario quiere elegir explícitamente qué imagen va en cada celda.

**Layout del informe:**
```
┌─────────────────────────────────┐
│  slot: 'top'  (ancho completo)  │
├────────────────┬────────────────┤
│  slot: 'left'  │  slot: 'right' │
└────────────────┴────────────────┘
```

**Archivos:**
- Modify: `src/types.ts` — campo `slotUbicacion`
- Modify: `src/App.tsx` — UI card de imagen + `addAerialSection`

---

- [ ] **Step 1: Agregar campo a `ReportImage` en `types.ts`**

En `src/types.ts`, dentro de `interface ReportImage`:

```typescript
export interface ReportImage {
  id: string;
  url: string;
  seccion: ImageSeccion;
  leyenda: string;
  estado: 'Verde' | 'Amarillo' | 'Rojo';
  observacion: string;
  enPortada?: boolean;
  slotUbicacion?: 'top' | 'left' | 'right';  // solo aplica si seccion === 'Ubicación Espacial'
}
```

- [ ] **Step 2: Agregar selector de slot en la card de imagen**

En `src/App.tsx`, dentro del bloque que renderiza cada image card (~línea 7437), localiza el bloque `isUbicacion`:

```typescript
const isUbicacion = img.seccion === 'Ubicación Espacial';
```

Justo después del selector de `seccion` (`<select>` con options como "Ubicación Espacial"), agregar el selector de slot — solo visible si `isUbicacion`:

```tsx
{isUbicacion && (
  <div className="space-y-1">
    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
      Posición en tabla
    </label>
    <select
      value={img.slotUbicacion ?? ''}
      onChange={(e) => updateImage(img.id, { slotUbicacion: e.target.value as 'top' | 'left' | 'right' || undefined })}
      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/20 dark:[color-scheme:dark]"
    >
      <option value="">— Auto (por leyenda) —</option>
      <option value="top">Arriba (ancho completo)</option>
      <option value="left">Abajo izquierda</option>
      <option value="right">Abajo derecha</option>
    </select>
  </div>
)}
```

**Nota:** La opción `''` (auto) preserva el comportamiento actual para imágenes sin slot asignado.

- [ ] **Step 3: Actualizar `addAerialSection` para respetar slots asignados**

En `src/App.tsx`, función `addAerialSection` (~línea 4423), reemplazar la lógica de asignación de slots:

```typescript
// ANTES (keyword-matching):
const imgEstructura = imgs.find(i => kw(i,'estructura','módulo')) ?? imgs[0];
const imgDiagonal   = imgs.find(i => kw(i,'diagonal','arreglo'))  ?? imgs[1];
const imgAerea      = imgs.find(i => kw(i,'aérea','general','contexto')) ?? imgs[2];
```

Por:

```typescript
// DESPUÉS (slot explícito con fallback a keyword-matching):
const bySlot = (slot: 'top' | 'left' | 'right') => imgs.find(i => i.slotUbicacion === slot);
const noSlot = imgs.filter(i => !i.slotUbicacion);

const imgEstructura = bySlot('top')
  ?? noSlot.find(i => kw(i, 'estructura', 'módulo'))
  ?? noSlot[0];

const imgDiagonal   = bySlot('left')
  ?? noSlot.find(i => kw(i, 'diagonal', 'arreglo') && i !== imgEstructura)
  ?? noSlot.find(i => i !== imgEstructura);

const imgAerea      = bySlot('right')
  ?? noSlot.find(i => kw(i, 'aérea', 'general', 'contexto') && i !== imgEstructura && i !== imgDiagonal)
  ?? noSlot.find(i => i !== imgEstructura && i !== imgDiagonal);
```

- [ ] **Step 4: Verificar que compila sin errores**

```bash
npm run lint
```

Esperado: 0 errores TypeScript.

- [ ] **Step 5: Prueba manual**
  1. Sube 3 imágenes de sección `Ubicación Espacial`.
  2. En cada card, selecciona un slot distinto (Arriba, Abajo izquierda, Abajo derecha).
  3. Genera el Informe Técnico.
  4. Verifica que las imágenes aparecen en la posición seleccionada en el PDF.
  5. Prueba que con slot `— Auto —` el comportamiento de keyword-matching sigue funcionando igual.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/App.tsx
git commit -m "feat: selector de slot para imágenes de Ubicación Espacial en el informe"
```

---

## Tarea 3: Build y deploy

- [ ] **Step 1: Build**

```bash
npm run build
```

Esperado: `✓ built in ~13s` sin errores.

- [ ] **Step 2: Deploy**

```bash
firebase deploy --only hosting
```

Esperado: `Deploy complete!`
