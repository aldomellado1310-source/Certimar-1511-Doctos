# WelcomeScreen Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que `WelcomeScreen` sea completamente usable en móvil (≥ 320px) sin romper el layout desktop actual.

**Architecture:** Se añade un hook `useWindowWidth` dentro de `WelcomeScreen` para detectar breakpoints. En mobile (< 640px) se oculta el panel izquierdo de información y se muestra sólo el panel de login con logo+tagline integrados. En desktop (≥ 640px) el split layout actual se mantiene sin cambios. No se usa Tailwind (el componente ya usa inline styles).

**Tech Stack:** React 19, TypeScript, Vite, motion/react (framer-motion), inline styles, Playwright para tests.

---

## Problemas identificados

| Problema | Impacto | Ubicación |
|---|---|---|
| Panel izquierdo viene primero en el DOM → en mobile el login queda fuera de pantalla | Crítico | `App.tsx:1352-1404` |
| `padding: '44px 40px'` en ambos paneles | Alto | `App.tsx:1355, 1407` |
| `padding: 24` en el wrapper externo | Alto | `App.tsx:1350` |
| `minHeight: 520` en el card stacked = 1040px total | Alto | `App.tsx:1352` |
| Logo splash 130px → muy grande en 320px | Medio | `App.tsx:1241` |
| `SCHOOL_FISH.endX` hasta 600px → salen de pantalla en móvil | Bajo | `App.tsx:57-70` |

---

## Files

- Modify: `src/App.tsx` — secciones 57-70 (SCHOOL_FISH), 1132-1480 (WelcomeScreen component)
- Create: `scripts/test_welcome_responsive.py` — Playwright tests

---

## Task 1: Hook `useWindowWidth` y variables responsive

**Files:**
- Modify: `src/App.tsx:1047` (dentro de WelcomeScreen, después de los useState)

- [ ] **Step 1: Añadir el hook y variables de breakpoint**

Ubicar el bloque de estados de WelcomeScreen (línea ~1047) y añadir justo después de `const [loading, setLoading]`:

```tsx
  // ── responsive ──
  const [winW, setWinW] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = winW < 640;
```

- [ ] **Step 2: Verificar compilación**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npm run build 2>&1 | tail -5
```

Esperado: `✓ built in XX.XXs`

---

## Task 2: Layout responsive del card de login

**Files:**
- Modify: `src/App.tsx:1350-1410`

- [ ] **Step 1: Wrapper externo — padding y centrado vertical ajustados**

Reemplazar:
```tsx
style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
```
Por:
```tsx
style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobile ? '16px 12px' : 24, overflowY: 'auto' }}
```

- [ ] **Step 2: Card contenedor — eliminar minHeight en mobile, ajustar borderRadius**

Reemplazar:
```tsx
style={{ width: '100%', maxWidth: 900, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', borderRadius: 20, border: '1px solid #1e2535', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', minHeight: 520 }}
```
Por:
```tsx
style={{ width: '100%', maxWidth: 900, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', borderRadius: isMobile ? 16 : 20, border: '1px solid #1e2535', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', minHeight: isMobile ? 'unset' : 520 }}
```

- [ ] **Step 3: Panel izquierdo (info) — ocultar en mobile**

Reemplazar la apertura del panel izquierdo:
```tsx
<div style={{ flex: '0 0 55%', minWidth: 280, background: '#0d1117', padding: '44px 40px 36px', borderRight: '1px solid #1e2535', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
```
Por:
```tsx
<div style={{ flex: '0 0 55%', minWidth: 280, background: '#0d1117', padding: '44px 40px 36px', borderRight: '1px solid #1e2535', display: isMobile ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
```

- [ ] **Step 4: Panel derecho (login) — padding responsive y logo mobile**

Reemplazar apertura del panel derecho:
```tsx
<div style={{ flex: '0 0 45%', minWidth: 260, background: '#111827', padding: '44px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
```
Por:
```tsx
<div style={{ flex: isMobile ? '1 1 100%' : '0 0 45%', minWidth: isMobile ? 'unset' : 260, background: '#111827', padding: isMobile ? '32px 24px 28px' : '44px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
```

- [ ] **Step 5: Añadir logo+tagline visible sólo en mobile, encima del form**

Dentro del panel derecho, justo antes del `<div style={{ width: '100%', maxWidth: 280 }}>`, añadir:

```tsx
{isMobile && (
  <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <img src={logoSrc} alt={logoAlt} style={{ height: 44, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
    <p style={{ color: '#334155', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
      Sistema de Certificación · Norma 1511
    </p>
  </div>
)}
```

- [ ] **Step 6: maxWidth del form inner en mobile**

Reemplazar:
```tsx
<div style={{ width: '100%', maxWidth: 280 }}>
```
Por:
```tsx
<div style={{ width: '100%', maxWidth: isMobile ? '100%' : 280 }}>
```

- [ ] **Step 7: Compilar y verificar**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built in XX.XXs`

---

## Task 3: Splash screen responsive

**Files:**
- Modify: `src/App.tsx:1241` (logo height en splash)

- [ ] **Step 1: Logo splash ajustado a viewport**

Reemplazar:
```tsx
style={{ height: 130, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.95, maxWidth: 320 }}
```
Por:
```tsx
style={{ height: isMobile ? 80 : 130, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.95, maxWidth: isMobile ? 200 : 320 }}
```

- [ ] **Step 2: Compilar**

```bash
npm run build 2>&1 | tail -5
```

---

## Task 4: Tests Playwright — verificación responsive

**Files:**
- Create: `scripts/test_welcome_responsive.py`

- [ ] **Step 1: Verificar que Playwright está disponible**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
python -c "from playwright.sync_api import sync_playwright; print('OK')"
```

Esperado: `OK`

Si falla: `pip install playwright && playwright install chromium`

- [ ] **Step 2: Crear script de test**

```python
# scripts/test_welcome_responsive.py
"""
Prueba visual del WelcomeScreen en viewports mobile y desktop.
Verifica que el panel izquierdo esté oculto en mobile y visible en desktop.
Ejecutar con: python scripts/with_server.py --server "npm run dev" --port 5173 -- python scripts/test_welcome_responsive.py
"""
import sys
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    { "name": "iPhone SE",  "width": 375,  "height": 667  },
    { "name": "iPhone 14",  "width": 390,  "height": 844  },
    { "name": "iPad Mini",  "width": 768,  "height": 1024 },
    { "name": "Desktop HD", "width": 1440, "height": 900  },
]

FAILURES = []

def check(condition, msg):
    if not condition:
        FAILURES.append(msg)
        print(f"  FAIL: {msg}")
    else:
        print(f"  OK:   {msg}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    for vp in VIEWPORTS:
        print(f"\n── {vp['name']} ({vp['width']}x{vp['height']}) ──")
        page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(4000)  # esperar splash + login phase

        screenshot_path = f"/tmp/welcome_{vp['name'].replace(' ', '_').lower()}.png"
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"  Screenshot: {screenshot_path}")

        is_mobile = vp["width"] < 640

        # Verificar que el panel de login existe y es visible
        login_panel = page.locator("text=Ingresar al sistema")
        check(login_panel.count() > 0, "Panel login visible")

        # En mobile: verificar que el botón Google es accesible (no fuera de pantalla)
        btn = page.locator("text=Continuar con Google")
        if btn.count() > 0:
            box = btn.bounding_box()
            if box:
                in_viewport = (box["y"] + box["height"]) <= vp["height"]
                check(in_viewport, f"Botón Google visible en viewport (y={box['y']:.0f}, h={box['height']:.0f})")
                check(box["height"] >= 40, f"Botón Google alto ≥ 40px (actual: {box['height']:.0f}px)")
            else:
                FAILURES.append("Botón Google sin bounding box")

        # En mobile: panel izquierdo debe estar oculto (display:none)
        # En desktop: debe estar visible
        # Buscamos por texto único del panel izquierdo
        info_text = page.locator("text=Registro de Visita")
        if is_mobile:
            check(info_text.count() == 0 or not info_text.is_visible(), "Panel info oculto en mobile")
        else:
            check(info_text.count() > 0 and info_text.is_visible(), "Panel info visible en desktop")

        page.close()

    browser.close()

print(f"\n{'='*50}")
if FAILURES:
    print(f"FAILURES ({len(FAILURES)}):")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
else:
    print("Todas las verificaciones pasaron.")
    sys.exit(0)
```

- [ ] **Step 3: Ejecutar los tests**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
python scripts/with_server.py --server "npm run dev" --port 5173 -- python scripts/test_welcome_responsive.py
```

Esperado: `Todas las verificaciones pasaron.`

Si falla `with_server.py --help` primero: `python scripts/with_server.py --help`

---

## Task 5: Deploy

- [ ] **Step 1: Build final**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
npm run build 2>&1 | tail -5
```

- [ ] **Step 2: Deploy**

```bash
firebase deploy --only hosting
```

Esperado: `Deploy complete!`

---

## Checklist de spec coverage

- [x] Mobile < 640px: panel info oculto, login full-width con logo
- [x] Padding mobile reducido (24px → 12px outer, 44px → 32px inner)
- [x] `minHeight` desactivado en mobile
- [x] Logo splash pequeño en mobile
- [x] Tap targets ≥ 40px (botón Google ya tiene padding 12px × 2 + ~20px content = ~44px)
- [x] Tests Playwright en 4 viewports
- [x] Desktop inalterado
