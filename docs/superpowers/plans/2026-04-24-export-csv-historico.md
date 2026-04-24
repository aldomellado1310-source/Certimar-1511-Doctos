# Export CSV del Histórico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar botón "Exportar CSV" en el tab Histórico que descarga todos los registros de Firestore con métricas clave, y persistir `creadoEn` en documentos nuevos.

**Architecture:** Se añade el campo `creadoEn` a `RegistroHistorico` en `types.ts`. En `App.tsx` se agrega estado `exportingCSV`, una función `exportHistoricoCSV()` que hace un fetch único de Firestore y genera el CSV en memoria, y un botón en el encabezado del tab Histórico. El campo `creadoEn: serverTimestamp()` se escribe condicionalmente (solo en la primera escritura del documento) tanto en `handleGuardar()` como en `saveToHistorico()`.

**Tech Stack:** React 19, TypeScript, Firebase Firestore v9 (`getDocs`, `query`, `collection`, `orderBy`, `serverTimestamp`), Blob API para la descarga.

---

### Task 1: Agregar `creadoEn` a `RegistroHistorico` en types.ts

**Files:**
- Modify: `src/types.ts:283`

- [ ] **Step 1: Leer el archivo**

Abrir `src/types.ts`. Localizar la interfaz `RegistroHistorico` (línea 245). Buscar la línea `__updatedAt?: any;` (línea 283).

- [ ] **Step 2: Agregar el campo**

Después de la línea `__updatedAt?: any;`, agregar:

```typescript
  creadoEn?: any;
```

El bloque final de `RegistroHistorico` debe quedar:
```typescript
  documentUrls?: {
    certificado?: string;
    informe?: string;
    acta?: string;
    registro_visita?: string;
  };
  __updatedAt?: any;
  creadoEn?: any;
}
```

- [ ] **Step 3: Verificar que TypeScript no reporta errores**

```bash
npx tsc --noEmit
```
Expected: sin errores relacionados a `creadoEn`.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: agregar campo creadoEn a RegistroHistorico"
```

---

### Task 2: Persistir `creadoEn` en `handleGuardar()`

**Files:**
- Modify: `src/App.tsx:2151-2174`

Contexto: `handleGuardar()` hace un `setDoc` con `merge: true` al documento `historico/{docId}`. Solo se ejecuta si `!keepNonBorrador`. La condición para ser "nuevo" es que la entrada local (`existingEntry`) no tenga `creadoEn` todavía.

- [ ] **Step 1: Localizar el setDoc dentro del bloque `if (!keepNonBorrador)`**

En `src/App.tsx`, buscar la línea ~2151:
```typescript
        await setDoc(doc(db, 'historico', docId), {
          registroId: docId,
          ...
          __updatedAt: serverTimestamp(),
        }, { merge: true });
```

- [ ] **Step 2: Agregar `creadoEn` condicionalmente**

Reemplazar ese bloque `setDoc` por:
```typescript
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
```

- [ ] **Step 3: Verificar sin errores TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persistir creadoEn en handleGuardar al crear entrada nueva"
```

---

### Task 3: Persistir `creadoEn` en `saveToHistorico()`

**Files:**
- Modify: `src/App.tsx:2221-2249`

Contexto: `saveToHistorico()` construye un objeto `payload` y llama `setDoc(..., payload, { merge: true })`. El `docId` se calcula de la misma forma que en `handleGuardar`.

- [ ] **Step 1: Localizar la construcción de `payload` (~línea 2221)**

Buscar:
```typescript
      const payload: Record<string, any> = {
        registroId: docId,
        ...
        __updatedAt: serverTimestamp(),
      };
```

- [ ] **Step 2: Agregar `creadoEn` condicionalmente en payload**

Justo antes de `if (documentUrl) {` (línea ~2246), agregar:

```typescript
      const esEntradaNueva = !historicoEntries.find(e => e.id === docId)?.creadoEn;
      if (esEntradaNueva) {
        payload.creadoEn = serverTimestamp();
      }
```

El código completo del bloque relevante queda:
```typescript
      const payload: Record<string, any> = {
        registroId: docId,
        codigoCentro: cc.codigo_centro,
        nombreCentro: cc.nombre_centro,
        titular: cc.titular,
        fechaInspeccion: state.general.fechas.inspeccion_terreno,
        esBorrador: false,
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
      const esEntradaNueva = !historicoEntries.find(e => e.id === docId)?.creadoEn;
      if (esEntradaNueva) {
        payload.creadoEn = serverTimestamp();
      }
      if (documentUrl) {
        payload[`documentUrls.${tipo}`] = documentUrl;
      }
      await setDoc(doc(db, 'historico', docId), payload, { merge: true });
```

- [ ] **Step 3: Verificar sin errores TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persistir creadoEn en saveToHistorico al crear entrada nueva"
```

---

### Task 4: Agregar estado `exportingCSV` y función `exportHistoricoCSV()`

**Files:**
- Modify: `src/App.tsx` — cerca de línea 3539 (bloque de estados del histórico) y después de `exportDraft()` (~línea 2437)

- [ ] **Step 1: Agregar estado `exportingCSV` cerca de los otros estados del histórico**

En `src/App.tsx`, buscar la línea:
```typescript
  const [historicoEntries, setHistoricoEntries] = useState<RegistroHistorico[]>([]);
```
(~línea 3539). Debajo del bloque de estados del histórico (después de `const resubirFileInputRef`), agregar:

```typescript
  const [exportingCSV, setExportingCSV] = useState(false);
```

- [ ] **Step 2: Agregar helper `csvEscape` y función `exportHistoricoCSV` después de `exportDraft`**

Buscar el cierre de la función `exportDraft` (~línea 2460, termina con `};`). Justo después, agregar:

```typescript
  const csvEscape = (v: unknown): string => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const exportHistoricoCSV = async () => {
    setExportingCSV(true);
    try {
      const { getDocs, query, collection, orderBy } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const snap = await getDocs(query(collection(db, 'historico'), orderBy('__updatedAt', 'desc')));

      const toISO = (ts: any): string => {
        if (!ts) return '';
        if (ts?.toDate) return ts.toDate().toISOString();
        return String(ts);
      };

      const headers = [
        'registroId', 'codigoCentro', 'nombreCentro', 'titular', 'fechaInspeccion',
        'creadoEn', 'ultimaModificacion',
        'esBorrador', 'aprobado', 'firmado', 'enviadoSernapesca', 'clienteNotificado',
        'documentosGenerados',
        'capExtraccion_TN_dia', 'capDesnaturalizacion_TN_dia', 'capAlmacenamiento_TN',
        'cumpleExtraccion', 'cumpleDesnaturalizacion', 'cumpleAlmacenamiento',
        'sistemaExtraccion', 'sistemaDesnaturalizacion',
        'modoOperacionMinima', 'numJaulas', 'jaulasSimultaneas', 'profundidad_m',
      ];

      const rows = snap.docs.map(d => {
        const e = d.data() as RegistroHistorico;
        const m = e.metricas;
        return [
          e.registroId,
          e.codigoCentro,
          e.nombreCentro,
          e.titular,
          e.fechaInspeccion,
          toISO(e.creadoEn),
          toISO(e.__updatedAt),
          e.esBorrador,
          e.aprobado,
          e.firmado,
          e.enviado_sernapesca,
          e.cliente_notificado,
          (e.documentosGenerados ?? []).join(';'),
          m?.capExtraccion,
          m?.capDesnaturalizacion,
          m?.capAlmacenamiento,
          m?.cumpleExtraccion,
          m?.cumpleDesnaturalizacion,
          m?.cumpleAlmacenamiento,
          m?.sistemaExtraccion,
          m?.sistemaDesnaturalizacion,
          m?.modoOperacionMinima,
          m?.numJaulas,
          m?.jaulas_simultaneas,
          m?.profundidad_m,
        ].map(csvEscape).join(',');
      });

      const csv = '﻿' + headers.join(',') + '\r\n' + rows.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico_certimar_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      alert('No se pudo exportar el historial. Verifica tu conexión.');
    } finally {
      setExportingCSV(false);
    }
  };
```

- [ ] **Step 3: Verificar sin errores TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: agregar exportHistoricoCSV con estado exportingCSV"
```

---

### Task 5: Agregar botón "Exportar CSV" en el encabezado del tab Histórico

**Files:**
- Modify: `src/App.tsx:6714-6721`

Contexto: el tab Histórico empieza con un `<div className="space-y-8 ...">` que contiene un `<SectionHeader ... />`. El botón va a la derecha del título, en un flex row.

- [ ] **Step 1: Localizar el bloque de apertura del tab Histórico**

Buscar (~línea 6714):
```typescript
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <SectionHeader
          title="Histórico de Certificaciones"
          icon={History}
          description="Registros generados automáticamente al emitir documentos. Haz clic en los estados para actualizarlos."
        />
```

- [ ] **Step 2: Reemplazar por header con botón a la derecha**

```typescript
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                <History size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Histórico de Certificaciones</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">Registros generados automáticamente al emitir documentos. Haz clic en los estados para actualizarlos.</p>
          </div>
          <button
            onClick={exportHistoricoCSV}
            disabled={exportingCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {exportingCSV ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                Exportando…
              </>
            ) : (
              <>
                <Download size={16} />
                Exportar CSV
              </>
            )}
          </button>
        </div>
```

Nota: el icono `Download` ya está importado en el proyecto (se usa en la línea ~5581 para "Exportar JSON").

- [ ] **Step 3: Verificar que el build compila sin errores**

```bash
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Verificar en browser**

```bash
npm run dev
```

Abrir la app en el browser, ir al tab **Histórico** y verificar:
- El botón "Exportar CSV" aparece a la derecha del título.
- Al hacer clic, el botón muestra spinner + "Exportando…" y se deshabilita.
- Al terminar, se descarga un archivo `historico_certimar_YYYY-MM-DD.csv`.
- Abrir el CSV en Excel/LibreOffice: verificar que las tildes se ven correctamente y que las columnas coinciden con la especificación.
- Si Firestore está vacío, el CSV descargado solo tiene la fila de encabezados.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: botón Exportar CSV en tab Histórico"
```

---

### Task 6: Build final y verificación de producción

**Files:**
- No changes — solo verificación.

- [ ] **Step 1: Build de producción**

```bash
npm run build
```
Expected: build exitoso sin errores ni warnings de TypeScript.

- [ ] **Step 2: Commit de cierre si el build cache cambió**

```bash
git add -A
git status
```
Si solo hay cambios en `dist/` o archivos de cache, no es necesario commitear. Si hay algún archivo fuente sin commitear, commitearlo antes de continuar.
