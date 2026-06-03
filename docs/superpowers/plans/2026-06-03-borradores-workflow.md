# Borradores: flujo de guardado y retomado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir guardar registros como borradores para avanzar con otros sin perder trabajo, con marcado/visibilidad claros y retomado fácil.

**Architecture:** Reusa el modelo existente `RegistroHistorico` (`esBorrador`, `__updatedAt`, `snapshot`, `metricas`). Se extrae la lógica de guardado a `persistDraft()`, se auto-guarda antes de cambiar de registro, se añade un botón explícito "Guardar borrador", y en la pestaña Histórico se añade un filtro segmentado + indicadores de avance calculados por una función pura nueva `draftStatus()`.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind, Firebase Firestore, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-03-borradores-workflow-design.md`

---

## File Structure

- **Create:** `src/domain/draftStatus.ts` — función pura que calcula secciones pendientes de un borrador desde su `snapshot` + `metricas`.
- **Create:** `src/domain/draftStatus.test.ts` — tests Vitest.
- **Modify:** `src/App.tsx` — extraer `persistDraft`, añadir `hasDraftableData`, auto-guardado en `comenzarRegistro`/`loadFromHistorico`, botón "Guardar borrador", filtro + tarjetas de borrador en Histórico.

---

## Task 1: Función pura `draftStatus`

**Files:**
- Create: `src/domain/draftStatus.ts`
- Test: `src/domain/draftStatus.test.ts`

- [ ] **Step 1: Write the failing test**

Crear `src/domain/draftStatus.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { draftStatus } from './draftStatus';
import type { RegistroHistorico } from '../types';

type Snapshot = RegistroHistorico['snapshot'];
type Metricas = RegistroHistorico['metricas'];

/** Snapshot completo (todas las secciones OK). Se clona y se muta por caso. */
function baseSnapshot(): Snapshot {
  return {
    general: {
      certificador: { nombre: 'X', rut: '1-9', numero_registro: 'DN-1' },
      centro_cultivo: {
        codigo_centro: '110814', nombre_centro: 'PAMELA', titular: 'FIORDOS',
        acs: '24', ubicacion: 'CANAL', formato_modulo: '', tamano_jaulas: '',
        coordenadas_ensilaje: '', nombre_an_ensilaje: 'A/N PAMELA',
      },
      fechas: { evaluacion_documental: '2026-01-02', inspeccion_terreno: '2026-01-08', emision_certificado: '2026-01-10' },
      observaciones_acta: '',
    },
    extraction: { parametros: { numero_total_jaulas: 24, potencia_cfm: 185 } },
    denaturation: { equipos: { velocidad_nominal_kg_hr: 3000 } },
    storage: { parametros: { capacidad_almacenaje_m3: 60 } },
    images: [
      { id: '1', seccion: 'Ubicación Espacial', url: 'https://a' },
      { id: '2', seccion: 'Ubicación Espacial', url: 'https://b' },
      { id: '3', seccion: 'Ubicación Espacial', url: 'https://c' },
      { id: '4', seccion: 'Ubicación Espacial', url: 'https://d' },
    ],
  } as unknown as Snapshot;
}

const metricasOk: Metricas = {
  capExtraccion: 20, capDesnaturalizacion: 18, capAlmacenamiento: 30,
  cumpleExtraccion: true, cumpleDesnaturalizacion: true, cumpleAlmacenamiento: true,
  sistemaExtraccion: 'LIFT-UP', sistemaDesnaturalizacion: 'Ensilaje',
  modoOperacionMinima: false, numJaulas: 24, jaulas_simultaneas: 2, profundidad_m: 30,
};

describe('draftStatus', () => {
  it('borrador completo: sin pendientes, 5/5', () => {
    const r = draftStatus(baseSnapshot(), metricasOk);
    expect(r.pendientes).toEqual([]);
    expect(r.completados).toBe(5);
    expect(r.total).toBe(5);
  });

  it('faltan datos generales → General pendiente', () => {
    const s = baseSnapshot();
    s.general.centro_cultivo.codigo_centro = '';
    const r = draftStatus(s, metricasOk);
    expect(r.pendientes).toContain('General');
    expect(r.completados).toBe(4);
  });

  it('no cumple extracción (metricas) → Extracción pendiente', () => {
    const r = draftStatus(baseSnapshot(), { ...metricasOk, cumpleExtraccion: false });
    expect(r.pendientes).toContain('Extracción');
  });

  it('menos de 4 fotos de ubicación → Fotos pendiente', () => {
    const s = baseSnapshot();
    s.images = s.images.slice(0, 2);
    const r = draftStatus(s, metricasOk);
    expect(r.pendientes).toContain('Fotos');
  });

  it('op. mínima: cfm 0 no marca Extracción pendiente si cumple', () => {
    const s = baseSnapshot();
    s.general.modo_operacion_minima = true;
    s.extraction.parametros.potencia_cfm = 0;
    const r = draftStatus(s, metricasOk);
    expect(r.pendientes).not.toContain('Extracción');
  });

  it('sin metricas: solo evalúa inputs (compliance desconocido = ok)', () => {
    const r = draftStatus(baseSnapshot(), undefined);
    expect(r.pendientes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/draftStatus.test.ts`
Expected: FAIL — "Failed to resolve import './draftStatus'" / `draftStatus is not a function`.

- [ ] **Step 3: Write minimal implementation**

Crear `src/domain/draftStatus.ts`:

```ts
import type { RegistroHistorico } from '../types';

export type DraftSection =
  | 'General' | 'Extracción' | 'Desnaturalización' | 'Almacenamiento' | 'Fotos';

export interface DraftStatusResult {
  pendientes: DraftSection[];
  completados: number;
  total: number;
}

/**
 * Calcula qué secciones de un borrador quedan pendientes, usando el snapshot
 * guardado y las métricas de cumplimiento ya persistidas (no recalcula nada).
 * Si no hay métricas (borradores antiguos), el cumplimiento se asume OK y solo
 * se evalúan los campos de entrada.
 */
export function draftStatus(
  snapshot: RegistroHistorico['snapshot'],
  metricas?: RegistroHistorico['metricas'],
): DraftStatusResult {
  const pendientes: DraftSection[] = [];
  const cc = snapshot.general.centro_cultivo;
  const f = snapshot.general.fechas;

  const generalOk =
    !!cc.codigo_centro?.trim() && !!cc.nombre_centro?.trim() && !!cc.titular?.trim() &&
    !!cc.acs?.trim() && !!cc.ubicacion?.trim() && !!cc.nombre_an_ensilaje?.trim() &&
    !!f.evaluacion_documental && !!f.inspeccion_terreno && !!f.emision_certificado;
  if (!generalOk) pendientes.push('General');

  const ext = snapshot.extraction.parametros;
  const opMin = snapshot.general.modo_operacion_minima === true;
  const extInputsOk = ext.numero_total_jaulas > 0 && (opMin || ext.potencia_cfm > 0);
  const extCumple = metricas ? metricas.cumpleExtraccion : true;
  if (!extInputsOk || !extCumple) pendientes.push('Extracción');

  const denInputsOk = snapshot.denaturation.equipos.velocidad_nominal_kg_hr > 0;
  const denCumple = metricas ? metricas.cumpleDesnaturalizacion : true;
  if (!denInputsOk || !denCumple) pendientes.push('Desnaturalización');

  const stoInputsOk = snapshot.storage.parametros.capacidad_almacenaje_m3 > 0;
  const stoCumple = metricas ? metricas.cumpleAlmacenamiento : true;
  if (!stoInputsOk || !stoCumple) pendientes.push('Almacenamiento');

  const ubiCount = (snapshot.images ?? []).filter(
    (i) => i.seccion === 'Ubicación Espacial' && !!i.url,
  ).length;
  if (ubiCount < 4) pendientes.push('Fotos');

  const total = 5;
  return { pendientes, completados: total - pendientes.length, total };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/draftStatus.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/draftStatus.ts src/domain/draftStatus.test.ts
git commit -m "feat: draftStatus — secciones pendientes de un borrador (pura, testeable)"
```

---

## Task 2: Extraer `persistDraft()` desde `handleGuardar`

**Files:**
- Modify: `src/App.tsx:2158-2245` (`handleGuardar`)

Refactor sin cambio de comportamiento: la lógica de guardar en `registros/{docId}` + upsert `historico` con `esBorrador:true` se mueve a `persistDraft`, y `handleGuardar` la invoca.

- [ ] **Step 1: Añadir `persistDraft` antes de `handleGuardar`**

Insertar esta función justo antes de `const handleGuardar` ([App.tsx:2158](src/App.tsx#L2158)):

```ts
  /**
   * Guarda el estado actual en Firestore (registros/{id}) y hace upsert de la
   * entrada de histórico como borrador (esBorrador:true), sin degradar registros
   * que ya generaron documentos. Devuelve true si Firestore respondió OK.
   * `motivo` solo se registra en el doc registros para depuración.
   */
  const persistDraft = async (motivo: 'manual' | 'auto' | 'section'): Promise<boolean> => {
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const cc = state.general.centro_cultivo;
      const docId = state.registroId ?? `sin-reg_${cc.codigo_centro || 'borrador'}`;
      const imagesMetadata = state.images.map(img => ({
        ...img,
        url: img.url?.startsWith('https://') ? img.url : '',
      }));
      const stateClean = JSON.parse(JSON.stringify(state));
      await setDoc(doc(db, 'registros', docId), {
        ...stateClean,
        images: imagesMetadata,
        __version: 'v3',
        __savedAt: serverTimestamp(),
        __savedBy: state.general.certificador.nombre || 'desconocido',
        __section: motivo,
      });
      const calcExt = calculatedExtraction;
      const calcDen = calculatedDenaturation;
      const calcSto = calculatedStorage;
      const existingEntry = historicoEntries.find(e => e.id === docId);
      const keepNonBorrador = existingEntry && existingEntry.esBorrador === false;
      if (!keepNonBorrador) {
        const esEntradaNueva = !existingEntry?.creadoEn;
        await setDoc(doc(db, 'historico', docId), {
          registroId: docId,
          codigoCentro: cc.codigo_centro,
          nombreCentro: cc.nombre_centro,
          titular: cc.titular,
          fechaInspeccion: state.general.fechas.inspeccion_terreno,
          esBorrador: true,
          snapshot: JSON.parse(JSON.stringify({ ...state, images: imagesMetadata })),
          metricas: {
            capExtraccion: calcExt.capacidad_diaria_ton,
            capDesnaturalizacion: calcDen.capacidad_diaria_ton,
            capAlmacenamiento: calcSto.capacidad_almacenaje_ton,
            cumpleExtraccion: calcExt.cumple_norma,
            cumpleDesnaturalizacion: calcDen.cumple_norma,
            cumpleAlmacenamiento: calcSto.cumple_norma,
            sistemaExtraccion: state.extraction.parametros.sistema_principal,
            sistemaDesnaturalizacion: state.denaturation.equipos.tipo_sistema,
            modoOperacionMinima: state.general.modo_operacion_minima ?? false,
            numJaulas: state.extraction.parametros.numero_total_jaulas,
            jaulas_simultaneas: state.extraction.parametros.jaulas_simultaneas,
            profundidad_m: state.extraction.parametros.profundidad_operacion_m,
          },
          __updatedAt: serverTimestamp(),
          ...(esEntradaNueva && { creadoEn: serverTimestamp() }),
        }, { merge: true });
        setHistoricoEntries(prev => {
          const idx = prev.findIndex(e => e.id === docId);
          const updated: RegistroHistorico = {
            ...(idx >= 0 ? prev[idx] : {}),
            id: docId,
            registroId: docId,
            codigoCentro: cc.codigo_centro,
            nombreCentro: cc.nombre_centro,
            titular: cc.titular,
            fechaInspeccion: state.general.fechas.inspeccion_terreno,
            esBorrador: true,
            documentosGenerados: idx >= 0 ? (prev[idx].documentosGenerados ?? []) : [],
            snapshot: { ...state, images: imagesMetadata } as any,
            creadoEn: idx >= 0 ? (prev[idx].creadoEn ?? 'pending') : 'pending',
          };
          return idx >= 0 ? prev.map(e => e.id === docId ? updated : e) : [updated, ...prev];
        });
      }
      return true;
    } catch (err) {
      console.error('Error guardando borrador en Firestore:', err);
      return false;
    }
  };
```

- [ ] **Step 2: Reemplazar el cuerpo de `handleGuardar` para usar `persistDraft`**

Sustituir la función `handleGuardar` completa ([App.tsx:2158-2245](src/App.tsx#L2158-L2245)) por:

```ts
  const handleGuardar = async (section: string) => {
    if (guardandoSection) return; // evitar doble-click
    setGuardandoSection(section);
    setSaveError(null);
    const ok = await persistDraft('section');
    if (ok) {
      exportDraft();
      setGuardadoSection(section);
      setTimeout(() => setGuardadoSection(null), 2500);
    } else {
      setSaveError('No se pudo guardar en la nube. Verifica tu conexión.');
      setTimeout(() => setSaveError(null), 4000);
    }
    setGuardandoSection(null);
  };
```

- [ ] **Step 3: Verify build (tsc)**

Run: `npm run lint`
Expected: PASS sin errores (0 errores TS).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: extraer persistDraft desde handleGuardar (sin cambio de comportamiento)"
```

---

## Task 3: Auto-guardar al cambiar de registro + `hasDraftableData`

**Files:**
- Modify: `src/App.tsx` — `comenzarRegistro` ([App.tsx:2136](src/App.tsx#L2136)), `loadFromHistorico` ([App.tsx:2439](src/App.tsx#L2439))

- [ ] **Step 1: Añadir helper `hasDraftableData` justo antes de `comenzarRegistro`**

Insertar antes de `const comenzarRegistro` ([App.tsx:2136](src/App.tsx#L2136)):

```ts
  /** Hay datos del registro actual dignos de guardar como borrador. */
  const hasDraftableData = (): boolean => {
    const cc = state.general.centro_cultivo;
    return !!state.registroId && (!!cc.codigo_centro.trim() || !!cc.nombre_centro.trim());
  };

  /**
   * Guarda el registro actual como borrador antes de descartarlo. Devuelve true
   * si se puede continuar (guardado OK, nada que guardar, o el usuario aceptó
   * continuar pese al fallo de guardado).
   */
  const autosaveBeforeSwitch = async (): Promise<boolean> => {
    if (!hasDraftableData()) return true;
    const ok = await persistDraft('auto');
    if (ok) return true;
    return window.confirm(
      'No se pudo guardar el borrador actual (sin conexión).\n' +
      '¿Continuar de todas formas y descartar los cambios no guardados?'
    );
  };
```

- [ ] **Step 2: Cablear auto-guardado en `comenzarRegistro`**

En `comenzarRegistro` ([App.tsx:2136](src/App.tsx#L2136)), cambiar la firma a `async` y guardar antes de limpiar. Reemplazar el bloque del `if (window.confirm(...))`:

```ts
  const comenzarRegistro = async () => {
    if (!window.confirm(
      '¿Comenzar un nuevo registro?\n' +
      'El registro actual se guardará automáticamente como borrador y podrás retomarlo desde el Histórico.\n' +
      'Se asignará un correlativo y se limpiarán los datos del centro, extracción, desnaturalización, almacenamiento e imágenes.\n' +
      'Los datos del certificador se conservan.'
    )) return;
    if (!(await autosaveBeforeSwitch())) return;
    logEvento('crear_registro');
    idbClear();
    const { registroId, nextCounter } = getNextCorrelativo();
    localStorage.setItem('certimar-correlativo-counter', String(nextCounter));
    setState(prev => ({
      ...DEFAULT_STATE,
      registroId,
      general: {
        ...DEFAULT_STATE.general,
        certificador: prev.general.certificador,
        fechas: { evaluacion_documental: "", inspeccion_terreno: "", emision_certificado: "" },
        revisionConfirmada: false,
      },
    }));
    setActiveTab('general');
  };
```

- [ ] **Step 3: Cablear auto-guardado en `loadFromHistorico`**

En `loadFromHistorico` ([App.tsx:2439](src/App.tsx#L2439)), reemplazar el `window.confirm` inicial (líneas 2440-2443) por uno que avise del auto-guardado, y guardar tras pasar el lock-check. Reemplazar:

```ts
  const loadFromHistorico = async (entry: RegistroHistorico) => {
    if (!window.confirm(
      `¿Cargar los datos de ${entry.nombreCentro} (${entry.codigoCentro}) en el formulario?\n` +
      'El registro actual se guardará automáticamente como borrador antes de continuar.'
    )) return;
```

Y justo **después** del bloque de lock anterior `if (state.registroId) await releaseLock(state.registroId);` ([App.tsx:2461](src/App.tsx#L2461)), insertar antes de la línea `logEvento('abrir_registro', ...)`:

```ts
    if (!(await autosaveBeforeSwitch())) return;
```

Nota: `autosaveBeforeSwitch` usa el `state` del registro actual, que aún no se ha sobrescrito en este punto — correcto.

- [ ] **Step 4: Verify build (tsc)**

Run: `npm run lint`
Expected: PASS sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: auto-guardar borrador al comenzar o cargar otro registro"
```

---

## Task 4: Botón explícito "Guardar borrador"

**Files:**
- Modify: `src/App.tsx:6083-6103` (barra de acciones de GeneralView)

- [ ] **Step 1: Añadir el botón "Guardar borrador"**

En el `<div className="flex items-center gap-3">` que contiene "Comenzar Registro" y "Guardar" ([App.tsx:6083](src/App.tsx#L6083)), insertar entre ambos botones un nuevo botón:

```tsx
            <button
              onClick={async () => {
                if (guardandoSection) return;
                setGuardandoSection('borrador');
                const ok = await persistDraft('manual');
                setGuardandoSection(null);
                if (ok) {
                  setGuardadoSection('borrador');
                  setTimeout(() => setGuardadoSection(null), 2500);
                } else {
                  setSaveError('No se pudo guardar el borrador. Verifica tu conexión.');
                  setTimeout(() => setSaveError(null), 4000);
                }
              }}
              disabled={!!guardandoSection || !hasDraftableData()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all"
            >
              {guardandoSection === 'borrador'
                ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={16} /></motion.div> Guardando…</>
                : guardadoSection === 'borrador'
                  ? <><CheckCircle2 size={16} /> Borrador guardado</>
                  : <><Bookmark size={16} /> Guardar borrador</>
              }
            </button>
```

(`Bookmark`, `Save`, `CheckCircle2`, `motion` ya están importados — usados en esta misma vista.)

- [ ] **Step 2: Verify build (tsc)**

Run: `npm run lint`
Expected: PASS sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: botón Guardar borrador en Datos Generales"
```

---

## Task 5: Histórico — filtro de borradores + avance + retomar

**Files:**
- Modify: `src/App.tsx` — import de `draftStatus` ([App.tsx:125](src/App.tsx#L125) zona de imports de `./types`), grilla del histórico ([App.tsx:6945](src/App.tsx#L6945)), tarjeta ([App.tsx:6952-7028](src/App.tsx#L6952))

- [ ] **Step 1: Importar `draftStatus`**

Junto a los imports de dominio existentes (cerca de [App.tsx:125](src/App.tsx#L125)), añadir:

```ts
import { draftStatus } from './domain/draftStatus';
```

- [ ] **Step 2: Añadir estado de filtro**

Junto a `const [historicoEntries, setHistoricoEntries] = useState...` ([App.tsx:3720](src/App.tsx#L3720)), añadir:

```ts
  const [historicoFiltro, setHistoricoFiltro] = useState<'todos' | 'borradores' | 'finalizados'>('todos');
```

- [ ] **Step 3: Derivar lista filtrada y ordenada**

Inmediatamente antes del bloque `{!historicoLoading && historicoEntries.length > 0 && (` ([App.tsx:6945](src/App.tsx#L6945)), no se puede declarar consts en JSX; en su lugar reemplazar `historicoEntries.map((entry) => {` por una IIFE que filtra/ordena. Reemplazar la apertura del `.map`:

De:
```tsx
              {historicoEntries.map((entry) => {
```
Por:
```tsx
              {historicoEntries
                .filter(e =>
                  historicoFiltro === 'todos' ? true :
                  historicoFiltro === 'borradores' ? e.esBorrador === true :
                  e.esBorrador !== true)
                .map((entry) => {
```

- [ ] **Step 4: Añadir el control segmentado encima de la grilla**

Inmediatamente antes de `<FormCard className="p-0 overflow-hidden">` ([App.tsx:6931](src/App.tsx#L6931)), insertar:

```tsx
        {!historicoLoading && historicoEntries.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            {([
              { id: 'todos' as const, label: 'Todos', n: historicoEntries.length },
              { id: 'borradores' as const, label: 'Borradores', n: historicoEntries.filter(e => e.esBorrador === true).length },
              { id: 'finalizados' as const, label: 'Finalizados', n: historicoEntries.filter(e => e.esBorrador !== true).length },
            ]).map(({ id, label, n }) => (
              <button
                key={id}
                onClick={() => setHistoricoFiltro(id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border',
                  historicoFiltro === id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                )}
              >
                {label} <span className="opacity-70">({n})</span>
              </button>
            ))}
          </div>
        )}
```

- [ ] **Step 5: Resaltar tarjeta de borrador + avance + botón "Continuar"**

En la tarjeta ([App.tsx:6952](src/App.tsx#L6952)), cambiar el `className` del contenedor para resaltar borradores. Reemplazar:

```tsx
                  <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
```
Por:
```tsx
                  <div key={entry.id} className={cn(
                    'bg-white dark:bg-slate-800 rounded-2xl p-5 flex flex-col gap-3 transition-colors border',
                    entry.esBorrador
                      ? 'border-2 border-dashed border-amber-300 dark:border-amber-500/40 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                  )}>
```

Luego, justo **después** del bloque de "Compliance badges" (tras el cierre `)}` de `{m && (...)}` en [App.tsx:6989](src/App.tsx#L6989)), insertar el avance del borrador:

```tsx
                    {entry.esBorrador && (() => {
                      const ds = draftStatus(entry.snapshot, entry.metricas);
                      return (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                            Avance {ds.completados}/{ds.total}
                          </span>
                          {ds.pendientes.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {ds.pendientes.map(p => (
                                <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                  Falta: {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
```

Finalmente, cambiar la etiqueta del botón "Cargar" → "Continuar" para borradores ([App.tsx:7030](src/App.tsx#L7030) aprox., botón que llama `loadFromHistorico(entry)`). Reemplazar el texto del botón:

De (texto literal):
```tsx
                        Cargar
```
Por:
```tsx
                        {entry.esBorrador ? 'Continuar' : 'Cargar'}
```

- [ ] **Step 6: Verify build (tsc)**

Run: `npm run lint`
Expected: PASS sin errores.

- [ ] **Step 7: Run full test suite**

Run: `npm test`
Expected: PASS (incluye `draftStatus.test.ts` y los tests existentes de calculations/documents).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: filtro de borradores, avance y botón Continuar en Histórico"
```

---

## Verificación manual final

1. Crear registro, llenar parcialmente General; "Guardar borrador" → toast "Borrador guardado".
2. "Comenzar Registro" → confirmar; el anterior aparece en Histórico filtro **Borradores** con borde ámbar, "Avance X/5" y chips "Falta: …".
3. "Continuar" sobre ese borrador → recarga sus datos en el formulario.
4. Generar un documento (certificado) sobre un registro completo → pasa a **Finalizados** (`esBorrador:false`), y un guardado posterior NO lo regresa a borrador (`keepNonBorrador`).
5. Filtros "Todos / Borradores / Finalizados" muestran los conteos correctos.
