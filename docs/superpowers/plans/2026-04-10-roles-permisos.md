# Sistema de Roles y Permisos CERTIMAR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el sistema binario `admin`/`reader` + PIN por tres roles (`admin`, `inspector`, `reader`) con un objeto `perms` centralizado que controla todas las guardas de la UI.

**Architecture:** Un solo archivo (`src/App.tsx`) concentra todos los cambios. Se agrega el tipo `'inspector'` al union de `UserRole`, se elimina el flujo PIN completo, se añade un `useMemo` que produce el objeto `perms`, y se sustituyen los ~20 usos dispersos de `isAdmin` por la capability correspondiente.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6. Sin dependencias nuevas.

---

## Archivos afectados

| Archivo | Tipo | Cambios |
|---|---|---|
| `src/App.tsx` | Modify | Único archivo. Tipos, login, perms, ~20 guardas JSX, eliminar PIN UI |

---

### Task 1: Actualizar tipos y añadir objeto `perms`

**Files:**
- Modify: `src/App.tsx` (~líneas 158, 1048-1069, 2237-2253)

- [ ] **Step 1: Eliminar `ADMIN_PIN` (línea 158)**

Buscar y eliminar:
```typescript
const ADMIN_PIN        = import.meta.env.VITE_ADMIN_PIN        as string | undefined;
```
Reemplazar con (eliminar la línea completa — ya no se usa).

- [ ] **Step 2: Actualizar prop type de `WelcomeScreen` (línea 1048)**

```typescript
// Antes:
  setUserRole:    React.Dispatch<React.SetStateAction<'admin' | 'reader' | null>>;

// Después:
  setUserRole:    React.Dispatch<React.SetStateAction<'admin' | 'inspector' | 'reader' | null>>;
```

- [ ] **Step 3: Actualizar `pendingRoleRef` y `triggerAquaLogin` (líneas 1069-1071)**

```typescript
// Antes:
  const pendingRoleRef = React.useRef<'admin' | 'reader' | null>(null);
  const triggerAquaLogin = React.useCallback((role: 'admin' | 'reader') => {

// Después:
  const pendingRoleRef = React.useRef<'admin' | 'inspector' | 'reader' | null>(null);
  const triggerAquaLogin = React.useCallback((role: 'admin' | 'inspector' | 'reader') => {
```

- [ ] **Step 4: Actualizar `readSession` y `userRole` en App (líneas 2237-2253)**

```typescript
// Antes:
  const readSession = (): { role: 'admin' | 'reader'; expiry: number } | null => {

// Después:
  const readSession = (): { role: 'admin' | 'inspector' | 'reader'; expiry: number } | null => {
```

```typescript
// Antes:
  const [userRole, setUserRole] = useState<'admin' | 'reader' | null>(savedSession?.role ?? null);
  const isAdmin = userRole === 'admin';

// Después:
  const [userRole, setUserRole] = useState<'admin' | 'inspector' | 'reader' | null>(savedSession?.role ?? null);
  const perms = React.useMemo(() => ({
    canEdit:                userRole === 'admin' || userRole === 'inspector',
    canSave:                userRole === 'admin' || userRole === 'inspector',
    canGenerate:            userRole === 'admin' || userRole === 'inspector',
    canAttachVisita:        userRole === 'admin' || userRole === 'inspector',
    canImportDraft:         userRole === 'admin' || userRole === 'inspector',
    canViewStats:           userRole === 'admin',
    canDeleteDraft:         userRole === 'admin',
    canDeletePhotos:        userRole === 'admin',
    canManageCatalog:       userRole === 'admin',
    canExportDraft:         userRole === 'admin',
    canModeOperacionMinima: userRole === 'admin',
  }), [userRole]);
```

- [ ] **Step 5: Verificar tipos**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && npm run lint 2>&1 | head -20
```

Esperado: errores de `isAdmin` (aún sin migrar) pero NO errores de tipo en las líneas editadas.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
git add src/App.tsx
git commit -m "feat: add inspector role type and perms object"
```

---

### Task 2: Simplificar flujo de login (eliminar PIN)

**Files:**
- Modify: `src/App.tsx` (~líneas 1054-1056, 1092-1134)

- [ ] **Step 1: Eliminar estados PIN en `WelcomeScreen` (líneas 1054-1056)**

```typescript
// Eliminar estas 3 líneas:
  const [step, setStep]               = React.useState<'google' | 'pin'>('google');
  const [googleEmail, setGoogleEmail] = React.useState('');
  const [pin, setPin]                 = React.useState('');
```

- [ ] **Step 2: Reemplazar `handleGoogleSignIn` (líneas 1107-1113)**

```typescript
// Antes (bloque if dentro de handleGoogleSignIn):
      const AUTHORIZED_ADMINS = ['operaciones@certimar.cl', 'informes@certimar.cl'];
      if (AUTHORIZED_ADMINS.includes(email)) {
        setGoogleEmail(email);
        setStep('pin');
      } else {
        localStorage.setItem('certimar-session', JSON.stringify({ role: 'reader', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
        triggerAquaLogin('reader');
      }

// Después:
      if (email === 'operaciones@certimar.cl') {
        localStorage.setItem('certimar-session', JSON.stringify({ role: 'admin', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
        triggerAquaLogin('admin');
      } else {
        localStorage.setItem('certimar-session', JSON.stringify({ role: 'inspector', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
        triggerAquaLogin('inspector');
      }
```

- [ ] **Step 3: Eliminar `handlePin` completo (líneas 1124-1134)**

Eliminar la función entera:
```typescript
  const handlePin = () => {
    if (ADMIN_PIN && pin === ADMIN_PIN) {
      localStorage.setItem('certimar-session', JSON.stringify({ role: 'admin', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      triggerAquaLogin('admin');
    } else if (pin === '') {
      localStorage.setItem('certimar-session', JSON.stringify({ role: 'reader', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      triggerAquaLogin('reader');
    } else {
      setError('PIN incorrecto.');
    }
  };
```

- [ ] **Step 4: Verificar**

```bash
npm run lint 2>&1 | grep "handlePin\|ADMIN_PIN\|step.*pin\|googleEmail"
```

Esperado: sin referencias a esas variables.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: remove PIN flow, direct role assignment on login"
```

---

### Task 3: Eliminar UI del PIN

**Files:**
- Modify: `src/App.tsx` (~líneas 1435-1488)

- [ ] **Step 1: Reemplazar `AnimatePresence` del panel de login**

Localizar el bloque (líneas 1435–1489):
```tsx
                  <AnimatePresence mode="wait">
                    {step === 'google' ? (
                      <motion.div key="google-step" ...>
                        ...botón Google...
                      </motion.div>
                    ) : (
                      <motion.div key="pin-step" ...>
                        ...UI del PIN...
                      </motion.div>
                    )}
                  </AnimatePresence>
```

Reemplazar por el contenido del `google-step` directamente (sin `AnimatePresence` ni condicional):
```tsx
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: '#f1f5f9', color: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'background 0.15s' }}
                      onMouseEnter={e => !loading && (e.currentTarget.style.background = '#e2e8f0')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                    >
                      {loading ? (
                        <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                        </svg>
                      ) : <GoogleIcon />}
                      {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                    </button>
                    {error && <p style={{ textAlign: 'center', fontSize: 12, color: '#f87171' }}>{error}</p>}
                    <p style={{ textAlign: 'center', fontSize: 10, color: '#334155', marginTop: 8 }}>
                      Acceso restringido · Solo cuentas @certimar.cl
                    </p>
                  </div>
```

- [ ] **Step 2: Verificar compilación**

```bash
npm run lint 2>&1 | grep -i "error" | head -20
```

Esperado: errores solo de `isAdmin` (aún pendiente). Sin errores en WelcomeScreen.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: remove PIN UI from login screen"
```

---

### Task 4: Migrar guardas de useEffects y Stats

**Files:**
- Modify: `src/App.tsx` (~líneas 2484, 2495, 4762, 4770, 4915)

- [ ] **Step 1: useEffect catálogo custom (línea 2484)**

```typescript
// Antes:
    if (!isAdmin) return;
// Después (primer useEffect, carga catálogo):
    if (!perms.canManageCatalog) return;
```

- [ ] **Step 2: useEffect logos empresas (línea 2495)**

```typescript
// Antes:
    if (!isAdmin) return;
// Después (segundo useEffect, carga logos):
    if (!perms.canManageCatalog) return;
```

- [ ] **Step 3: useEffect stats (línea 4762)**

```typescript
// Antes:
      if (activeTab !== 'stats' || !isAdmin) return;
// Después:
      if (activeTab !== 'stats' || !perms.canViewStats) return;
```

- [ ] **Step 4: Dependencia del useEffect stats (línea 4770)**

```typescript
// Antes:
  }, [activeTab, isAdmin]);
// Después:
  }, [activeTab, perms.canViewStats]);
```

- [ ] **Step 5: StatsView guard (línea 4915)**

```typescript
// Antes:
    if (activeTab !== 'stats' || !isAdmin) return null;
// Después:
    if (activeTab !== 'stats' || !perms.canViewStats) return null;
```

- [ ] **Step 6: Verificar**

```bash
npm run lint 2>&1 | grep "isAdmin" | wc -l
```

Esperado: número menor que antes (deben quedar ~15 referencias aún por migrar).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate useEffect and stats guards to perms object"
```

---

### Task 5: Migrar guardas de GeneralView y ConfigView

**Files:**
- Modify: `src/App.tsx` (~líneas 5257, 5294, 5884, 5899)

- [ ] **Step 1: Controles registro ID en GeneralView (línea 5257)**

```typescript
// Antes:
      {isAdmin && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
// Después:
      {perms.canEdit && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
```

- [ ] **Step 2: Modo Operación Mínima toggle (línea 5294)**

```typescript
// Antes:
      {isAdmin && (
        <FormCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-amber-500" />
                Modo Operación Mínima
// Después:
      {perms.canModeOperacionMinima && (
        <FormCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-amber-500" />
                Modo Operación Mínima
```

- [ ] **Step 3: Botón borrar borrador en ConfigView (línea 5884)**

```typescript
// Antes:
        {isAdmin && (
          <button
            onClick={resetState}
// Después:
        {perms.canDeleteDraft && (
          <button
            onClick={resetState}
```

- [ ] **Step 4: Sección logos empresas en ConfigView (línea 5899)**

```typescript
// Antes:
      {isAdmin && (
        <section className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-violet-500" />
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logos de Empresas Clientes</h2>
// Después:
      {perms.canManageCatalog && (
        <section className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-violet-500" />
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logos de Empresas Clientes</h2>
```

- [ ] **Step 5: Verificar**

```bash
npm run lint 2>&1 | grep "isAdmin" | wc -l
```

Esperado: ~11 referencias restantes.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate GeneralView and ConfigView guards to perms"
```

---

### Task 6: Migrar botones "Guardar sección"

**Files:**
- Modify: `src/App.tsx` (~líneas 6482, 6879, 7070, 7544)

Hay 4 botones de guardado idénticos en estructura, uno por sección.

- [ ] **Step 1: Guardar sección Extracción (línea 6482)**

```typescript
// Antes:
      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('extraction')}
// Después:
      {perms.canSave && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('extraction')}
```

- [ ] **Step 2: Guardar sección Desnaturalización (línea 6879)**

```typescript
// Antes:
      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('denaturation')}
// Después:
      {perms.canSave && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('denaturation')}
```

- [ ] **Step 3: Guardar sección Almacenamiento (línea 7070)**

```typescript
// Antes:
      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('storage')}
// Después:
      {perms.canSave && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('storage')}
```

- [ ] **Step 4: Guardar sección Informe (línea 7544)**

```typescript
// Antes:
      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('report')}
// Después:
      {perms.canSave && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('report')}
```

- [ ] **Step 5: Verificar**

```bash
npm run lint 2>&1 | grep "isAdmin" | wc -l
```

Esperado: ~7 referencias restantes.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate save section buttons to perms.canSave"
```

---

### Task 7: Migrar guardas de ReportView (fotos y visita)

**Files:**
- Modify: `src/App.tsx` (~líneas 7227, 7247)

- [ ] **Step 1: Botón borrar fotos (línea 7227)**

```typescript
// Antes:
          {isAdmin && total > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 ml-auto" />
              <button
                onClick={() => {
                  if (window.confirm(`¿Borrar las ${total} fotos? Esta acción no se puede deshacer.`)) {
// Después:
          {perms.canDeletePhotos && total > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 ml-auto" />
              <button
                onClick={() => {
                  if (window.confirm(`¿Borrar las ${total} fotos? Esta acción no se puede deshacer.`)) {
```

- [ ] **Step 2: Adjuntar Registro de Visita PDF (línea 7247)**

```typescript
// Antes:
        {isAdmin && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Registro de Visita</p>
// Después:
        {perms.canAttachVisita && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Registro de Visita</p>
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate report view guards to perms"
```

---

### Task 8: Migrar generación PDFs, import/export, banner y checklist

**Files:**
- Modify: `src/App.tsx` (~líneas 7668, 7684, 7700, 7843, 7862-7865, 7975, 7997)

- [ ] **Step 1: Botón Generar Certificado (línea 7668)**

```typescript
// Antes:
            disabled={!canEmit || generating !== null || !isAdmin}
// Después (primer botón, generateCertificadoPDF):
            disabled={!canEmit || generating !== null || !perms.canGenerate}
```

- [ ] **Step 2: Botón Generar Informe Técnico (línea 7684)**

```typescript
// Antes:
            disabled={!canEmit || generating !== null || !isAdmin}
// Después (segundo botón, generateInformePDF):
            disabled={!canEmit || generating !== null || !perms.canGenerate}
```

- [ ] **Step 3: Botón Generar Acta (línea 7700)**

```typescript
// Antes:
            disabled={generating !== null || !isAdmin}
// Después:
            disabled={generating !== null || !perms.canGenerate}
```

- [ ] **Step 4: Exportar borrador JSON (línea 7843)**

```typescript
// Antes:
            {isAdmin && (
// Después (bloque de exportar JSON):
            {perms.canExportDraft && (
```

- [ ] **Step 5: Importar borrador JSON — title y className (líneas 7862-7863)**

```typescript
// Antes:
              title={isAdmin ? "Cargar borrador desde archivo JSON" : "Solo administradores"}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all", isAdmin ? "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40", isSidebarCollapsed && "justify-center px-0")}
// Después:
              title={perms.canImportDraft ? "Cargar borrador desde archivo JSON" : "Solo administradores e inspectores"}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all", perms.canImportDraft ? "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40", isSidebarCollapsed && "justify-center px-0")}
```

- [ ] **Step 6: Importar borrador JSON — input disabled (línea 7865)**

```typescript
// Antes:
              <input ref={importDraftRef} type="file" accept=".json" className="hidden" disabled={!isAdmin} onChange={importDraft} />
// Después:
              <input ref={importDraftRef} type="file" accept=".json" className="hidden" disabled={!perms.canImportDraft} onChange={importDraft} />
```

- [ ] **Step 7: Eliminar banner "MODO LECTURA" (línea 7975)**

Eliminar este bloque completo:
```tsx
          {!isAdmin && userRole === 'reader' && (
            <div className="sticky top-0 z-40 bg-amber-500 text-amber-950 text-xs font-bold px-6 py-2 flex items-center gap-2">
              <ShieldCheck size={14} />
              MODO LECTURA — No puedes editar ni generar documentos en esta sesión.
            </div>
          )}
```

- [ ] **Step 8: Checklist flotante (línea 7997)**

```typescript
// Antes:
      {isAdmin && (['general','extraction','denaturation','storage','report'] as const).includes(activeTab as any) && (() => {
// Después:
      {perms.canEdit && (['general','extraction','denaturation','storage','report'] as const).includes(activeTab as any) && (() => {
```

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate generate/import/export/banner/checklist guards to perms"
```

---

### Task 9: Verificación final

**Files:**
- Read: `src/App.tsx`

- [ ] **Step 1: Confirmar que no quedan referencias a `isAdmin`**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && grep -n "isAdmin" src/App.tsx
```

Esperado: sin resultados (0 líneas).

- [ ] **Step 2: Confirmar que no quedan referencias al PIN**

```bash
grep -n "handlePin\|ADMIN_PIN\|pin-step\|setStep.*pin\|step.*google.*pin" src/App.tsx
```

Esperado: sin resultados.

- [ ] **Step 3: Lint limpio**

```bash
npm run lint 2>&1
```

Esperado: `LINT OK` (0 errores).

- [ ] **Step 4: Tests pasando**

```bash
npm test 2>&1
```

Esperado:
```
✓ src/domain/documents.test.ts (23 tests)
✓ src/domain/calculations.test.ts (37 tests)
Tests: 60 passed
```

- [ ] **Step 5: Commit final**

```bash
git add src/App.tsx
git commit -m "feat: complete role/permissions system - admin/inspector roles with perms object"
```
