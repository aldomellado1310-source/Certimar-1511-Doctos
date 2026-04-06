# Operación Mínima + Histórico Rediseñado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Operación Mínima toggle with preset logic, upload all PDFs to Firebase Storage on generation, and replace the historical static table with cards + lateral drawer.

**Architecture:** Single-file React app (`App.tsx`, ~7700 lines) with inline styles and Tailwind classes. Firebase Firestore for persistence, Firebase Storage for PDFs. All PDF generation uses jsPDF except the Acta which uses an HTML→iframe print approach; a new `generateActaBlob` helper will render it to canvas for Storage upload. The historical view replaces its current table layout with a card grid + fixed-position drawer panel.

**Tech Stack:** React 19 + TypeScript, jsPDF, Firebase Firestore + Storage (dynamic imports), Tailwind CSS, lucide-react icons.

---

## File Map

| File | Changes |
|---|---|
| `src/types.ts` | Add `modo_operacion_minima`, `t_trabajo_override_min`, `metricas`, `documentUrls`; remove `HistoryEntry` |
| `src/constants/masterData.ts` | Remove `HISTORICO_CERTIFICACIONES` (lines 473–609) |
| `src/App.tsx` | All logic + UI changes |

---

## Task 1: Type Definitions

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `t_trabajo_override_min` to `ExtractionData.parametros`**

In `src/types.ts`, add the optional field after `disponibilidad_base_fd`:

```ts
// BEFORE (line ~50):
    disponibilidad_base_fd: number;
    motocompresores_por_jaula: number;

// AFTER:
    disponibilidad_base_fd: number;
    t_trabajo_override_min?: number;  // sobreescribe FISH_PARAMS cuando está en modo Op. Mínima
    motocompresores_por_jaula: number;
```

- [ ] **Step 2: Add `modo_operacion_minima` to `GeneralData`**

In `src/types.ts`, add the optional field before the closing `}` of `GeneralData` (after `fechas` block, line ~22):

```ts
// BEFORE (line ~22):
  };
}

export type FishSize

// AFTER:
  };
  modo_operacion_minima?: boolean;
}

export type FishSize
```

- [ ] **Step 3: Add `metricas` and `documentUrls` to `RegistroHistorico`**

In `src/types.ts`, add both fields before `__updatedAt` (after line ~248):

```ts
// BEFORE (line ~249):
  };
  __updatedAt?: any;
}

// AFTER:
  };
  metricas?: {
    capExtraccion: number;
    capDesnaturalizacion: number;
    capAlmacenamiento: number;
    cumpleExtraccion: boolean;
    cumpleDesnaturalizacion: boolean;
    cumpleAlmacenamiento: boolean;
    sistemaExtraccion: string;
    sistemaDesnaturalizacion: string;
    modoOperacionMinima: boolean;
    numJaulas: number;
    jaulas_simultaneas: number;
    profundidad_m: number;
  };
  documentUrls?: {
    certificado?: string;
    informe?: string;
    acta?: string;
    registro_visita?: string;
  };
  __updatedAt?: any;
}
```

- [ ] **Step 4: Remove unused `HistoryEntry` interface**

Delete lines 174–200 from `src/types.ts` (the full `export interface HistoryEntry { ... }` block). It is no longer used anywhere.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd C:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Remove Static Historical Data

**Files:**
- Modify: `src/constants/masterData.ts` (lines 473–609)
- Modify: `src/App.tsx` (line 125 + lines 5880–5938)

- [ ] **Step 1: Delete `HISTORICO_CERTIFICACIONES` from `masterData.ts`**

Remove lines 473–609 (the entire `export const HISTORICO_CERTIFICACIONES = [...]` block). The file should go from `CATALOGO_FOTOS` directly to the comment block for `CATALOGO_PLATAFORMAS`.

- [ ] **Step 2: Remove the import from `App.tsx`**

```ts
// BEFORE (line ~125):
  HISTORICO_CERTIFICACIONES,
  TITULARES_CONOCIDOS,

// AFTER:
  TITULARES_CONOCIDOS,
```

- [ ] **Step 3: Remove the static section from `HistoryView` in `App.tsx`**

Delete lines 5880–5938 (from `{/* ── Histórico previo (datos estáticos) ── */}` to and including `</>`). The `HistoryView` return should end after the `</FormCard>` at line 5878.

- [ ] **Step 4: Build verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Storage Helper + saveToHistorico Update

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `ExternalLink` to lucide-react imports**

```ts
// BEFORE (line ~53):
  BarChart3,
} from 'lucide-react';

// AFTER:
  BarChart3,
  ExternalLink,
} from 'lucide-react';
```

- [ ] **Step 2: Add `selectedHistoricoEntry` state near `historicoEntries` (line ~2838)**

```ts
// BEFORE (line ~2838):
  const [historicoEntries, setHistoricoEntries] = useState<RegistroHistorico[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

// AFTER:
  const [historicoEntries, setHistoricoEntries] = useState<RegistroHistorico[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [selectedHistoricoEntry, setSelectedHistoricoEntry] = useState<RegistroHistorico | null>(null);
```

- [ ] **Step 3: Add `uploadDocToStorage` helper function after `saveToHistorico` (after line ~1807)**

```ts
  const uploadDocToStorage = async (
    blob: Blob,
    docId: string,
    tipo: 'certificado' | 'informe' | 'acta' | 'registro_visita'
  ): Promise<string> => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('./firebase');
    const storageRef = ref(storage, `historico/${docId}/${tipo}.pdf`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };
```

- [ ] **Step 4: Update `saveToHistorico` to include metrics and accept optional `documentUrl`**

Replace the entire `saveToHistorico` function (lines ~1785–1807) with:

```ts
  const saveToHistorico = async (
    tipo: 'certificado' | 'informe' | 'acta',
    documentUrl?: string
  ) => {
    try {
      const { doc, setDoc, serverTimestamp, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const cc = state.general.centro_cultivo;
      const docId = state.registroId ?? `sin-reg_${cc.codigo_centro || 'borrador'}`;
      const snapshotImgs = state.images.map(({ id, seccion, leyenda, estado, observacion, url }) =>
        ({ id, seccion, leyenda, estado, observacion, url: url.startsWith('http') ? url : '' })
      );
      const payload: Record<string, any> = {
        registroId: docId,
        codigoCentro: cc.codigo_centro,
        nombreCentro: cc.nombre_centro,
        titular: cc.titular,
        fechaInspeccion: state.general.fechas.inspeccion_terreno,
        documentosGenerados: arrayUnion(tipo),
        snapshot: { ...state, images: snapshotImgs },
        metricas: {
          capExtraccion: calculatedExtraction.capacidad_diaria_ton,
          capDesnaturalizacion: calculatedDenaturation.capacidad_diaria_ton,
          capAlmacenamiento: calculatedStorage.capacidad_almacenaje_ton,
          cumpleExtraccion: calculatedExtraction.cumple_norma,
          cumpleDesnaturalizacion: calculatedDenaturation.cumple_norma,
          cumpleAlmacenamiento: calculatedStorage.cumple_norma,
          sistemaExtraccion: state.extraction.parametros.sistema_principal,
          sistemaDesnaturalizacion: state.denaturation.equipos.tipo_sistema,
          modoOperacionMinima: state.general.modo_operacion_minima ?? false,
          numJaulas: state.extraction.parametros.numero_total_jaulas,
          jaulas_simultaneas: state.extraction.parametros.jaulas_simultaneas,
          profundidad_m: state.extraction.parametros.profundidad_operacion_m,
        },
        __updatedAt: serverTimestamp(),
      };
      if (documentUrl) {
        payload[`documentUrls.${tipo}`] = documentUrl;
      }
      await setDoc(doc(db, 'historico', docId), payload, { merge: true });
    } catch (err) {
      console.error('Error guardando en histórico:', err);
    }
  };
```

- [ ] **Step 5: Build verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Operación Mínima Toggle

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import for `OPERACION_MINIMA_*` constants**

Add a new import after the `import { generateActaPdf } from './domain/actaHtml';` line (~line 148):

```ts
import {
  OPERACION_MINIMA_EXTRACTION,
  OPERACION_MINIMA_BATCH_INDEX,
  OPERACION_MINIMA_AQUAINOX_PREPICADOR,
} from './domain/constants';
```

- [ ] **Step 2: Add `applyOperacionMinima` function inside the main component (after `logEvento`, around line ~1824)**

```ts
  const applyOperacionMinima = () => {
    const { talla_pez, t_trabajo_override_min, jaulas_simultaneas, personal_operativo, disponibilidad_base_fd, sistema_principal } = OPERACION_MINIMA_EXTRACTION;
    const idTri = state.denaturation.equipos.id_catalogo_trituradora;
    const batchIndex = idTri ? OPERACION_MINIMA_BATCH_INDEX[idTri] : undefined;

    setState(prev => {
      const next: AppState = {
        ...prev,
        general: { ...prev.general, modo_operacion_minima: true },
        extraction: {
          ...prev.extraction,
          parametros: {
            ...prev.extraction.parametros,
            talla_pez,
            t_trabajo_override_min,
            jaulas_simultaneas,
            personal_operativo,
            disponibilidad_base_fd,
            sistema_principal,
          },
        },
      };

      if (idTri && batchIndex !== undefined) {
        const catTri = CATALOGO_DESNATURALIZACION.trituradoras.find(t => t.id === idTri);
        const batchCfg = catTri?.configuraciones_batch?.[batchIndex];
        if (batchCfg) {
          const useAquainoxPre = idTri === 'aquainox-1430' && prev.denaturation.equipos.cuenta_con_prepicador;
          const cfg = useAquainoxPre
            ? OPERACION_MINIMA_AQUAINOX_PREPICADOR
            : { kilos: batchCfg.kilos, t_proceso: batchCfg.t_proceso, t_pausa: batchCfg.t_pausa };
          next.denaturation = {
            ...prev.denaturation,
            parametros_batch: {
              ...prev.denaturation.parametros_batch,
              kilos_por_batch: cfg.kilos,
              tiempo_procesamiento_min: cfg.t_proceso,
              tiempo_pausa_min: cfg.t_pausa,
            },
          };
        }
      }

      return next;
    });
  };
```

- [ ] **Step 3: Add toggle card UI in `GeneralView` between the admin actions block and the form grid**

Find `{/* end admin block */}` → the line after `{isAdmin && (...)}` closes (line ~5057) — just before `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">`. Insert:

```tsx
      {/* ── Operación Mínima toggle ── */}
      {isAdmin && (
        <FormCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-amber-500" />
                Modo Operación Mínima
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Aplica parámetros regulatorios mínimos (Res. Exenta N°1511/2021): ROV, talla pequeña, 2 jaulas, 2 personas.
              </span>
            </div>
            <button
              onClick={() => {
                const hasParams = state.extraction.parametros.numero_total_jaulas > 0 ||
                  state.denaturation.equipos.id_catalogo_trituradora !== '';
                if (state.general.modo_operacion_minima) {
                  setState(prev => ({ ...prev, general: { ...prev.general, modo_operacion_minima: false } }));
                } else if (hasParams && !window.confirm(
                  'Se sobreescribirán los parámetros de extracción (talla pez, jaulas, personal, sistema) ' +
                  'y el batch de desnaturalización. ¿Continuar?'
                )) {
                  return;
                } else {
                  applyOperacionMinima();
                }
              }}
              className={cn(
                'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border',
                state.general.modo_operacion_minima
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'
              )}
            >
              {state.general.modo_operacion_minima
                ? <><ToggleRight size={18} /> Activo</>
                : <><ToggleLeft size={18} /> Inactivo</>}
            </button>
          </div>
        </FormCard>
      )}
```

- [ ] **Step 4: Build verify + visual test**

```bash
npx tsc --noEmit
```

Open the app in browser at `http://localhost:3001`, go to tab **General**, confirm the Operación Mínima toggle card is visible. Click "Inactivo" → confirm dialog appears if jaulas > 0 → click OK → verify toggle turns amber/active and extraction parameters update.

---

## Task 5: Upload PDFs on Generation

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `buildActaHtml` to the actaHtml import (line ~148)**

```ts
// BEFORE:
import { generateActaPdf } from './domain/actaHtml';

// AFTER:
import { generateActaPdf, buildActaHtml } from './domain/actaHtml';
```

- [ ] **Step 2: Add `generateActaBlob` helper inside the component (after `uploadDocToStorage`)**

```ts
  const generateActaBlob = async (): Promise<Blob> => {
    const html = buildActaHtml(state);
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-20000px;top:0;width:816px;visibility:hidden;';
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      const doc = new jsPDF({ format: [215.9, 355.6], unit: 'mm' });
      await new Promise<void>((resolve) => {
        (doc as any).html(container, {
          callback: () => resolve(),
          x: 0, y: 0,
          width: 215.9,
          windowWidth: 816,
          autoPaging: 'text',
        });
      });
      return doc.output('blob');
    } finally {
      document.body.removeChild(container);
    }
  };
```

- [ ] **Step 3: Modify `generateCertificadoPDF` to upload blob and pass URL to `saveToHistorico`**

Find the lines near the end of `generateCertificadoPDF` (lines ~3528–3532):

```ts
// BEFORE:
      doc.save(`${codigo}-${formatFileDate(state.general.fechas.emision_certificado)}-CERTIFICADO.pdf`);
      setShowEmailModal(true);
      saveToHistorico('certificado');
      logEvento('generar_certificado', ...);

// AFTER:
      const certBlob = doc.output('blob');
      doc.save(`${codigo}-${formatFileDate(state.general.fechas.emision_certificado)}-CERTIFICADO.pdf`);
      setShowEmailModal(true);
      const certDocId = state.registroId ?? `sin-reg_${codigo || 'borrador'}`;
      uploadDocToStorage(certBlob, certDocId, 'certificado')
        .then(url => saveToHistorico('certificado', url))
        .catch(() => saveToHistorico('certificado'));
      logEvento('generar_certificado', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
```

- [ ] **Step 4: Modify `generateInformePDF` to upload blob and pass URL**

Find the lines near the end of `generateInformePDF` (lines ~4504–4510):

```ts
// BEFORE:
      const filename = `${codigo}-${formatFileDate(g.fechas.emision_certificado)}-INFORME.pdf`;
      doc.save(filename);
      setShowEmailModal(true);
      saveToHistorico('informe');
      logEvento('generar_informe', ...);

// AFTER:
      const filename = `${codigo}-${formatFileDate(g.fechas.emision_certificado)}-INFORME.pdf`;
      const informeBlob = doc.output('blob');
      doc.save(filename);
      setShowEmailModal(true);
      const informeDocId = state.registroId ?? `sin-reg_${codigo || 'borrador'}`;
      uploadDocToStorage(informeBlob, informeDocId, 'informe')
        .then(url => saveToHistorico('informe', url))
        .catch(() => saveToHistorico('informe'));
      logEvento('generar_informe', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
```

- [ ] **Step 5: Modify acta button `onClick` to upload blob (lines ~7329–7333)**

```tsx
// BEFORE:
            onClick={() => {
              generateActaPdf(state);
              setShowEmailModal(true);
              saveToHistorico('acta');
              logEvento('generar_acta', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
            }}

// AFTER:
            onClick={async () => {
              generateActaPdf(state);  // abre diálogo print (no bloqueante)
              setShowEmailModal(true);
              const actaDocId = state.registroId ?? `sin-reg_${state.general.centro_cultivo.codigo_centro || 'borrador'}`;
              generateActaBlob()
                .then(blob => uploadDocToStorage(blob, actaDocId, 'acta'))
                .then(url => saveToHistorico('acta', url))
                .catch(() => saveToHistorico('acta'));
              logEvento('generar_acta', { codigoCentro: state.general.centro_cultivo.codigo_centro, nombreCentro: state.general.centro_cultivo.nombre_centro, titular: state.general.centro_cultivo.titular });
            }}
```

- [ ] **Step 6: Upload Registro de Visita PDF to Storage on file load**

Inside `handleRegistroVisitaUpload`, after line `setRegistroVisitaProcessing(true);` and before `try {`, add:

```ts
    // Upload original PDF to Storage if registroId is set
    const rvDocId = state.registroId;
    if (rvDocId) {
      const rvBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      uploadDocToStorage(rvBlob, rvDocId, 'registro_visita').then(url => {
        import('firebase/firestore').then(async ({ doc, updateDoc }) => {
          const { db } = await import('./firebase');
          await updateDoc(doc(db, 'historico', rvDocId), { 'documentUrls.registro_visita': url });
          setHistoricoEntries(prev =>
            prev.map(e => e.id === rvDocId
              ? { ...e, documentUrls: { ...e.documentUrls, registro_visita: url } }
              : e
            )
          );
        });
      }).catch(() => { /* silencioso */ });
    }
```

- [ ] **Step 7: Build verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 6: Histórico Cards + Drawer

**Files:**
- Modify: `src/App.tsx` (HistoryView function, ~lines 5778–5941)

- [ ] **Step 1: Replace the Firestore table with cards grid**

Inside `HistoryView`, replace the block from `{!historicoLoading && historicoEntries.length > 0 && (` (line ~5801) through `)}` closing the `<FormCard>` (line ~5878) with:

```tsx
          {!historicoLoading && historicoEntries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {historicoEntries.map((entry) => {
                const docs = entry.documentosGenerados ?? [];
                const urls = entry.documentUrls ?? {};
                const m = entry.metricas;
                return (
                  <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{entry.nombreCentro || '—'}</p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{entry.codigoCentro} · {entry.registroId}</p>
                      </div>
                      {entry.metricas?.modoOperacionMinima && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase shrink-0">Op. Min.</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{entry.titular || '—'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{entry.fechaInspeccion || '—'}</p>

                    {/* Compliance badges */}
                    {m && (
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { label: 'Extr.', cumple: m.cumpleExtraccion, val: m.capExtraccion },
                          { label: 'Desn.', cumple: m.cumpleDesnaturalizacion, val: m.capDesnaturalizacion },
                          { label: 'Alm.',  cumple: m.cumpleAlmacenamiento,   val: m.capAlmacenamiento },
                        ]).map(({ label, cumple, val }) => (
                          <span key={label} className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold',
                            cumple
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                          )}>
                            {label} {typeof val === 'number' ? val.toFixed(1) : val}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Doc badges — green if URL exists, grey otherwise */}
                    <div className="flex gap-1 flex-wrap">
                      {docs.map(d => (
                        <span key={d} className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                          urls[d as keyof typeof urls]
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        )}>{d}</span>
                      ))}
                    </div>

                    {/* Status chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <StatusChip active={entry.aprobado ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'aprobado', !(entry.aprobado ?? false))} labelOn="Aprobado" labelOff="No aprobado" colorOn="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40" />
                      <StatusChip active={entry.firmado ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'firmado', !(entry.firmado ?? false))} labelOn="Firmado" labelOff="Sin firma" colorOn="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/40" />
                      <StatusChip active={entry.enviado_sernapesca ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'enviado_sernapesca', !(entry.enviado_sernapesca ?? false))} labelOn="SERNAPESCA" labelOff="Sin enviar" colorOn="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/40" />
                      <StatusChip active={entry.cliente_notificado ?? false} onToggle={() => updateHistoricoStatus(entry.id!, 'cliente_notificado', !(entry.cliente_notificado ?? false))} labelOn="Notificado" labelOff="Sin notificar" colorOn="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setSelectedHistoricoEntry(entry)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                      >
                        Ver detalle
                      </button>
                      <button
                        onClick={() => loadFromHistorico(entry)}
                        title="Cargar datos en el formulario"
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
```

- [ ] **Step 2: Add the drawer panel at the end of the `HistoryView` return, just before `</div>` (the outer `space-y-8` div close)**

```tsx
        {/* ── Drawer lateral ── */}
        {selectedHistoricoEntry && (() => {
          const entry = selectedHistoricoEntry;
          const docs = entry.documentosGenerados ?? [];
          const urls = entry.documentUrls ?? {};
          const snap = entry.snapshot;
          const calcExt = calculateExtraction(snap.extraction.parametros);
          const calcDen = calculateDenaturation(
            snap.denaturation.equipos,
            snap.denaturation.parametros_batch,
            snap.denaturation.parametros_incineracion,
            snap.denaturation.incinerador
          );
          const calcSto = calculateStorage(snap.storage.parametros);
          const m = entry.metricas ?? {
            capExtraccion: calcExt.capacidad_diaria_ton,
            capDesnaturalizacion: calcDen.capacidad_diaria_ton,
            capAlmacenamiento: calcSto.capacidad_almacenaje_ton,
            cumpleExtraccion: calcExt.cumple_norma,
            cumpleDesnaturalizacion: calcDen.cumple_norma,
            cumpleAlmacenamiento: calcSto.cumple_norma,
            sistemaExtraccion: snap.extraction.parametros.sistema_principal,
            sistemaDesnaturalizacion: snap.denaturation.equipos.tipo_sistema,
            modoOperacionMinima: snap.general.modo_operacion_minima ?? false,
            numJaulas: snap.extraction.parametros.numero_total_jaulas,
            jaulas_simultaneas: snap.extraction.parametros.jaulas_simultaneas,
            profundidad_m: snap.extraction.parametros.profundidad_operacion_m,
          };
          const ALL_DOC_TYPES = ['certificado', 'informe', 'acta', 'registro_visita'] as const;
          return (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedHistoricoEntry(null)} />
              <div className="fixed right-0 top-0 h-full w-[420px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 overflow-y-auto shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-base truncate">{entry.nombreCentro || '—'}</p>
                    <p className="text-xs font-mono text-slate-400">{entry.codigoCentro} · {entry.registroId}</p>
                  </div>
                  <button onClick={() => setSelectedHistoricoEntry(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-6 px-6 py-5 flex-1">
                  {/* Info */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Centro</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Titular:</span> {entry.titular || '—'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Fecha inspección:</span> {entry.fechaInspeccion || '—'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Certificador:</span> {snap.general?.certificador?.nombre || '—'}</p>
                    {m.modoOperacionMinima && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase">Modo Operación Mínima</span>
                    )}
                  </div>

                  {/* Métricas técnicas */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Métricas técnicas</p>
                    <div className="flex flex-col gap-2">
                      {([
                        { label: 'Cap. Extracción',       val: m.capExtraccion,       cumple: m.cumpleExtraccion,       unit: 'TN/día' },
                        { label: 'Cap. Desnaturalización', val: m.capDesnaturalizacion, cumple: m.cumpleDesnaturalizacion, unit: 'TN/día' },
                        { label: 'Cap. Almacenamiento',    val: m.capAlmacenamiento,    cumple: m.cumpleAlmacenamiento,   unit: 'TN'     },
                      ]).map(({ label, val, cumple, unit }) => (
                        <div key={label} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{typeof val === 'number' ? val.toFixed(2) : '—'} {unit}</span>
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', cumple ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400')}>
                              {cumple ? 'CUMPLE' : 'NO CUMPLE'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <p><span className="font-semibold">Sist. extracción:</span> {m.sistemaExtraccion}</p>
                      <p><span className="font-semibold">Sist. desnat.:</span> {m.sistemaDesnaturalizacion}</p>
                      <p><span className="font-semibold">N° jaulas:</span> {m.numJaulas} (simul.: {m.jaulas_simultaneas})</p>
                      <p><span className="font-semibold">Profundidad:</span> {m.profundidad_m} m</p>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Documentos</p>
                    <div className="flex flex-col gap-2">
                      {ALL_DOC_TYPES.filter(d => docs.includes(d)).map(tipo => {
                        const url = urls[tipo];
                        return (
                          <div key={tipo} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                              {tipo === 'registro_visita' ? 'Registro de Visita' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </span>
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                                <ExternalLink size={11} /> Abrir PDF
                              </a>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedHistoricoEntry(null);
                                  loadFromHistorico(entry);
                                  setTimeout(() => alert('Registro cargado. Genera los documentos para subirlos a la nube.'), 300);
                                }}
                                className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                              >
                                Regenerar →
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {docs.length === 0 && <p className="text-xs text-slate-400 italic">Sin documentos generados.</p>}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    onClick={() => { setSelectedHistoricoEntry(null); loadFromHistorico(entry); }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={14} /> Cargar en formulario
                  </button>
                </div>
              </div>
            </>
          );
        })()}
```

- [ ] **Step 3: Build verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 7: Build + Deploy

- [ ] **Step 1: Full production build**

```bash
cd C:/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npm run build
```

Expected: build completes with no errors. Warnings about bundle size are OK.

- [ ] **Step 2: Visual smoke test on dev server**

```bash
npm run dev
```

Open `http://localhost:3001` (or 3000 if available). Verify:
- Login screen loads
- Tab **General**: Operación Mínima toggle is visible for admin role
- Tab **Histórico**: shows cards grid (no static table)
- Click "Ver detalle" on any card → drawer opens from right side
- Drawer shows metrics section and documents section
- Generate a Certificado → check Firebase console that `historico/{id}/certificado.pdf` appears in Storage

- [ ] **Step 3: Deploy**

```bash
firebase deploy --only hosting
```

Expected: deploy succeeds, URL printed to console.

---

## Self-Review

**Spec coverage:**
- ✅ Operación Mínima toggle in General tab (Task 4)
- ✅ Confirmation dialog before applying presets (Task 4, Step 3)
- ✅ Upload PDFs to Storage on generation — certificado, informe, acta, registro_visita (Task 5)
- ✅ `saveToHistorico` includes metrics (Task 3, Step 4)
- ✅ Remove static `HISTORICO_CERTIFICACIONES` (Task 2)
- ✅ Cards + drawer replacing table (Task 6)
- ✅ "Regenerar" loads record and prompts user (Task 6, Step 2 — "Regenerar →" button)
- ✅ `documentUrls` and `metricas` types (Task 1)

**Type consistency:**
- `saveToHistorico` uses `calculatedExtraction.capacidad_diaria_ton`, `calculatedDenaturation.capacidad_diaria_ton`, `calculatedStorage.capacidad_almacenaje_ton` — storage uses `capacidad_almacenaje_ton` (different from extraction/denaturation), confirmed in calculations.ts
- `uploadDocToStorage` signature matches all call sites
- `selectedHistoricoEntry` is `RegistroHistorico | null` — consistent with `setSelectedHistoricoEntry(entry)` and `setSelectedHistoricoEntry(null)` calls
- `documentUrls` accessed as `entry.documentUrls ?? {}` — safe for records without the field

**No placeholders:** all steps contain complete, runnable code.
