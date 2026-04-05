# WelcomeScreen Redesign — CERTIMAR 1511

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la pantalla de inicio minimalista (fondo sólido) por un diseño institucional en dos paneles que comunique el propósito del sistema y oriente al usuario a iniciar sesión.

**Architecture:** Layout split 55/45 — panel izquierdo con identidad y contexto del sistema, panel derecho con el formulario de login. La secuencia splash (logo fade) se mantiene como fase previa al layout. Todo vive en `WelcomeScreen` dentro de `src/App.tsx`; no se crean archivos nuevos.

**Tech Stack:** React 19, Framer Motion (AnimatePresence, motion), Tailwind CSS v4, lucide-react (iconos).

---

## Contexto de diseño

**Problema rechazado (versión anterior):** Fondo sólido `#0f1117` sin ningún contenido visual ni textual — no transmite identidad, no orienta al usuario.

**Versión también rechazada:** Paisaje animado (montañas SVG, estrellas parpadeantes, peces) — demasiado lúdico/decorativo para una herramienta de certificación normativa.

**Dirección aprobada — "Institucional Split":**

```
┌─────────────────────────────────────────────────────────┐
│  PANEL IZQUIERDO (55%)        │  PANEL DERECHO (45%)    │
│  bg: #0d1117  borde: #1e2535  │  bg: #111827            │
│                               │                         │
│  [Logo CERTIMAR]              │  Ingresar al sistema    │
│  Sistema de Certificación     │                         │
│  Norma 1511 · Puerto Aysén    │  [G] Continuar con      │
│                               │      Google             │
│  ─────────────────            │                         │
│                               │  Solo cuentas           │
│  [icon] Registro de Visita    │  @certimar.cl           │
│         Captura digital con   │                         │
│         firma en campo        │                         │
│                               │                         │
│  [icon] Informe 1511          │                         │
│         Certificados y actas  │                         │
│         PDF con firma digital │                         │
│                               │                         │
│  [icon] Métricas              │                         │
│         Trazabilidad visita → │                         │
│         informe con delay     │                         │
│                               │                         │
│  ─────────────────────────    │                         │
│  Sernapesca · Región de Aysén │                         │
└─────────────────────────────────────────────────────────┘
```

**Paleta:**
- Fondo exterior: `#080c14`
- Panel izquierdo: `#0d1117`
- Panel derecho: `#111827`
- Divisor/borde: `#1e2535`
- Acento azul: `#3b82f6`
- Texto primario: `#f1f5f9`
- Texto secundario: `#64748b`
- Feature label: `#94a3b8`
- Feature desc: `#475569`

**Fondo del panel izquierdo:** Patrón topográfico SVG muy sutil (líneas de contorno a baja opacidad), evoca el territorio patagónico sin ser decoración ruidosa.

**Splash:** Se mantiene igual — logo centrado, fade-in 350ms → hold → fade-out 450ms → aparece el split layout.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Modificar `WelcomeScreen` (líneas ~976–1230). Solo el bloque `return`. La lógica de auth, states y handlers no cambia. |

No se crean archivos nuevos.

---

## Task 1: Panel izquierdo — identidad y features

**Files:**
- Modify: `src/App.tsx` — bloque `{phase === 'login' && (...)}`  (aprox línea 1085–1230)

- [ ] **Step 1: Localizar el bloque exacto a reemplazar**

  En `src/App.tsx`, buscar:
  ```
  {phase === 'login' && (
  ```
  El bloque termina en `</AnimatePresence>` seguido de `</div>` y `);` del return. Todo el interior del `motion.div` con `key="login"` será reemplazado.

- [ ] **Step 2: Reemplazar el contenido de la fase 'login' con el split layout**

  Reemplazar desde `{phase === 'login' && (` hasta el cierre `)}` correspondiente con:

  ```tsx
  {phase === 'login' && (
    <motion.div
      key="login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex items-center justify-center p-6"
    >
      <div
        className="w-full flex overflow-hidden"
        style={{
          maxWidth: 880,
          borderRadius: 20,
          border: '1px solid #1e2535',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          minHeight: 520,
        }}
      >
        {/* ── PANEL IZQUIERDO ── identidad + features */}
        <div
          className="flex flex-col justify-between relative overflow-hidden"
          style={{ flex: '0 0 55%', background: '#0d1117', padding: '44px 40px 36px', borderRight: '1px solid #1e2535' }}
        >
          {/* Patrón topográfico de fondo */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', opacity: 0.035 }}
            viewBox="0 0 480 520"
            preserveAspectRatio="xMidYMid slice"
          >
            {[40,80,120,160,200,240,280,320,360,400,440,480].map((r, i) => (
              <ellipse key={i} cx="240" cy="280" rx={r} ry={r * 0.55} fill="none" stroke="#3b82f6" strokeWidth="1" />
            ))}
          </svg>

          {/* Logo + título */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#0f2040)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 p-2 w-full h-full">
                  <Fish size={9} className="text-white/25" />
                  <Fish size={9} className="text-white/25" />
                  <Fish size={9} className="text-white/25" />
                  <CheckCircle2 size={10} style={{ color: '#3b82f6' }} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none" style={{ color: '#f1f5f9' }}>
                  CERTI<span style={{ color: '#3b82f6' }}>MAR</span>
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mt-0.5" style={{ color: '#475569' }}>
                  Sistema de Certificación
                </p>
              </div>
            </div>

            <div className="mt-5 mb-6">
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Plataforma de certificación de manejo de mortalidad para centros de cultivo de salmónidos bajo{' '}
                <span style={{ color: '#94a3b8' }}>Resolución Exenta N°1511/2021</span>.
              </p>
            </div>

            {/* Divisor */}
            <div style={{ height: 1, background: '#1e2535', marginBottom: 24 }} />

            {/* Features */}
            <div className="space-y-5">
              {[
                {
                  icon: <ClipboardList size={15} style={{ color: '#3b82f6' }} />,
                  label: 'Registro de Visita',
                  desc: 'Captura digital con firma en campo',
                },
                {
                  icon: <FileText size={15} style={{ color: '#3b82f6' }} />,
                  label: 'Informe 1511',
                  desc: 'Certificados y actas en PDF con firma digital',
                },
                {
                  icon: <BarChart3 size={15} style={{ color: '#3b82f6' }} />,
                  label: 'Métricas de Despacho',
                  desc: 'Trazabilidad visita → informe con delay',
                },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer institucional */}
          <div className="relative z-10 mt-8 flex items-center gap-2">
            <div style={{ width: 20, height: 1, background: '#1e2535' }} />
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: '#334155' }}>
              Sernapesca · Región de Aysén
            </p>
          </div>
        </div>

        {/* ── PANEL DERECHO ── login */}
        <div
          className="flex flex-col items-center justify-center"
          style={{ flex: '0 0 45%', background: '#111827', padding: '44px 40px' }}
        >
          <div className="w-full" style={{ maxWidth: 280 }}>
            <p className="text-base font-bold mb-1" style={{ color: '#f1f5f9' }}>Ingresar al sistema</p>
            <p className="text-xs mb-8" style={{ color: '#475569' }}>Usa tu cuenta institucional para acceder</p>

            <AnimatePresence mode="wait">
              {step === 'google' ? (
                <motion.div key="google-step" initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}} transition={{duration:0.2}} className="space-y-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
                    style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                  >
                    {loading ? (
                      <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                  </button>
                  {error && <p className="text-center text-xs mt-2" style={{ color: '#f87171' }}>{error}</p>}
                  <p className="text-center text-[10px] mt-4" style={{ color: '#334155' }}>
                    Acceso restringido · Solo cuentas @certimar.cl
                  </p>
                </motion.div>
              ) : (
                <motion.div key="pin-step" initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} transition={{duration:0.2}} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => { setStep('google'); setPin(''); setError(''); }}
                      className="transition-colors"
                      style={{ color: '#475569' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    </button>
                    <p className="text-sm font-medium" style={{ color: '#cbd5e1' }}>
                      Acceso a <span style={{ color: '#3b82f6', fontWeight: 700 }}>Operaciones</span>
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: '#475569' }}>
                    Cuenta: <span style={{ color: '#94a3b8' }}>{googleEmail}</span>
                  </p>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#475569' }}>
                      PIN Administrador{' '}
                      <span className="normal-case font-normal" style={{ color: '#334155' }}>(vacío = solo lectura)</span>
                    </label>
                    <input
                      type="password"
                      value={pin}
                      autoFocus
                      onChange={e => { setPin(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handlePin()}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none text-center tracking-[0.5em] font-bold"
                      style={{ background: '#0d1117', border: '1px solid #1e2535', color: '#f1f5f9', caretColor: '#3b82f6' }}
                    />
                  </div>
                  {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
                  <button
                    onClick={handlePin}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: '#1d4ed8', color: '#fff' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1d4ed8')}
                  >
                    Ingresar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )}
  ```

- [ ] **Step 3: Verificar que los iconos `ClipboardList`, `FileText`, `BarChart3` estén importados**

  En `src/App.tsx`, buscar la línea de importación de `lucide-react`:
  ```tsx
  import { ... } from 'lucide-react';
  ```
  Añadir `ClipboardList`, `FileText`, `BarChart3` si no están presentes. Ejemplo:
  ```tsx
  import { Fish, CheckCircle2, ClipboardList, FileText, BarChart3, /* resto */ } from 'lucide-react';
  ```

- [ ] **Step 4: Build de verificación**

  ```bash
  cd C:\Users\aldon\Documents\Proyectos\Certimar-1511-Doctos
  npx vite build 2>&1 | tail -5
  ```

  Esperado: `✓ built in XX.XXs` sin errores nuevos.

- [ ] **Step 5: Preview local**

  ```bash
  npx vite preview
  ```

  Verificar:
  - Splash (logo centrado) aparece ~1.5s, luego fade-out
  - Split layout aparece: panel izquierdo con logo, descripción, 3 features, footer
  - Panel derecho con "Ingresar al sistema" y botón Google
  - Fondo exterior oscuro `#080c14` visible en pantallas anchas
  - En pantallas < 768px: layout se apila (ver Task 2)

---

## Task 2: Responsividad mobile

**Files:**
- Modify: `src/App.tsx` — el `div` del split layout (el `div` con `flex` que contiene ambos paneles)

- [ ] **Step 1: Ajustar el contenedor para apilar en mobile**

  El `div` que envuelve los dos paneles actualmente usa `flex` en fila. Añadir la clase `flex-col md:flex-row` y ajustar los `flex` de cada panel:

  ```tsx
  <div
    className="w-full flex flex-col md:flex-row overflow-hidden"
    style={{
      maxWidth: 880,
      borderRadius: 20,
      border: '1px solid #1e2535',
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      minHeight: 520,
    }}
  >
  ```

  Panel izquierdo: cambiar `flex: '0 0 55%'` por:
  ```tsx
  style={{ flex: '0 0 55%', /* ... */ borderRight: undefined, borderBottom: '1px solid #1e2535' }}
  ```
  Y añadir clase `md:border-r md:border-b-0` para el borde condicional.

  > Nota: Tailwind v4 usa variantes estándar `md:`. Si el proyecto tiene configuración custom, verificar el breakpoint `md` (768px por defecto).

- [ ] **Step 2: Build + verificación mobile**

  ```bash
  npx vite build 2>&1 | tail -3
  ```

  En DevTools del browser (F12 → Toggle device toolbar), verificar a 375px: los paneles se apilan, el panel de features queda arriba, el login abajo.

---

## Task 3: Deploy

**Files:** ninguno nuevo — solo comandos.

- [ ] **Step 1: Deploy a Firebase Hosting**

  ```bash
  cd C:\Users\aldon\Documents\Proyectos\Certimar-1511-Doctos
  firebase deploy --only hosting
  ```

  Esperado:
  ```
  ✔  hosting[certimar-1511-doctos]: release complete
  Hosting URL: https://certimar-1511-doctos.web.app
  ```

---

## Self-Review

**Spec coverage:**
- [x] Fondo no sólido puro — patrón topográfico SVG en panel izquierdo
- [x] Comunica propósito — descripción del sistema + norma + 3 features
- [x] Orienta al usuario — "Ingresar al sistema" + botón Google prominente
- [x] Sobriedad institucional — sin animaciones decorativas, paleta oscura neutral
- [x] Splash previo — se conserva la lógica existente
- [x] Responsividad — Task 2 cubre mobile

**Placeholder scan:** ninguno encontrado.

**Type consistency:** `step`, `pin`, `error`, `loading`, `googleEmail`, `handleGoogleSignIn`, `handlePin` — todos definidos en el estado existente del componente, no se crean nuevos.
