# Agentes de Diagnóstico Automático — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar dos hooks `PostToolUse` en Claude Code que detecten fallos en `vitest` y `vite build`, y lancen automáticamente un agente que diagnostique la causa raíz y corrija el error en `src/` (nunca en `src/domain/`).

**Architecture:** Dos scripts bash en `scripts/` del proyecto, referenciados en `~/.claude/settings.json` como hooks `PostToolUse`. Cada script recibe el payload JSON del hook por stdin, filtra por comando y presencia de errores en el output, y si corresponde invoca `claude -p` con un prompt especializado que embebe el error capturado. Los scripts viven en el proyecto para quedar versionados en git; `settings.json` los referencia por ruta absoluta.

**Tech Stack:** Bash, Claude Code CLI (`claude -p`), Python3 (JSON parsing de stdin), Claude Code Hooks API (`PostToolUse`)

---

## Mapa de archivos

| Acción | Ruta | Responsabilidad |
|--------|------|-----------------|
| Crear | `scripts/hook-test-diagnose.sh` | Hook post-vitest: filtra, extrae output, invoca agente diagnóstico de tests |
| Crear | `scripts/hook-build-diagnose.sh` | Hook post-build: filtra, extrae output, invoca agente diagnóstico de compilación |
| Modificar | `~/.claude/settings.json` | Registrar ambos hooks bajo `PostToolUse[matcher=Bash]` |

---

## Task 1: Crear `scripts/hook-test-diagnose.sh`

**Files:**
- Create: `scripts/hook-test-diagnose.sh`

- [ ] **Step 1: Crear el directorio `scripts/` y el archivo**

```bash
mkdir -p /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts
touch /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-test-diagnose.sh
chmod +x /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-test-diagnose.sh
```

- [ ] **Step 2: Escribir el script completo**

Contenido de `scripts/hook-test-diagnose.sh`:

```bash
#!/usr/bin/env bash
# hook-test-diagnose.sh
# PostToolUse hook: se ejecuta después de cada Bash.
# Solo actúa cuando el comando era vitest Y hubo tests fallidos.
# Invoca un agente Claude que diagnostica y corrige en src/ (nunca en src/domain/).

set -euo pipefail

PROJECT="/c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos"

# Leer payload JSON del hook desde stdin
INPUT=$(cat)

# ── Filtro 1: solo comandos vitest ──────────────────────────────────────────
COMMAND=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.argv[1])
    print(d.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" "$INPUT" 2>/dev/null || echo "")

echo "$COMMAND" | grep -q "vitest" || exit 0

# ── Filtro 2: solo si hay tests fallidos ────────────────────────────────────
TOOL_RESPONSE=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.argv[1])
    resp = d.get('tool_response', '')
    # tool_response puede ser string o dict con 'output'
    if isinstance(resp, dict):
        print(resp.get('output', ''))
    else:
        print(str(resp))
except Exception:
    print('')
" "$INPUT" 2>/dev/null || echo "")

# Vitest reporta fallos con "FAIL", "failed", o "× N tests"
echo "$TOOL_RESPONSE" | grep -qE "(FAIL |× [0-9]+ test|tests failed|failed to run)" || exit 0

# ── Invocar agente de diagnóstico ───────────────────────────────────────────
PROMPT="Eres un agente de diagnóstico automático del proyecto CERTIMAR-1511-Doctos.

CONTEXTO DEL PROYECTO:
- App web de certificación normativa acuícola (Resolución Exenta N°1511/2021, Sernapesca)
- Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase + jsPDF
- Ruta: ${PROJECT}

ESTRUCTURA CLAVE:
- src/domain/         → ZONA PROTEGIDA — solo lectura, lógica normativa legal
- src/App.tsx         → componente principal (~8000 líneas), UI principal
- src/firebase.ts     → configuración Firebase
- src/constants/      → catálogos de equipos y plataformas
- src/lib/            → utilidades

TESTS FALLIDOS (output de vitest):
---
${TOOL_RESPONSE}
---

PROCESO DE DIAGNÓSTICO:
1. Lee el mensaje de error completo — identifica archivo, línea y tipo de fallo
2. Lee el archivo afectado ANTES de proponer cualquier cambio
3. Determina si el fallo es:
   a) Regresión en UI/componentes → corrige en src/ (excepto domain/)
   b) Expectativa incorrecta en el test → analiza si el test fue escrito correctamente
      (en CERTIMAR los tests de domain/ validan norma legal — NO los cambies sin confirmación)
   c) Cambio de comportamiento intencional → reporta al usuario en vez de auto-corregir
4. Aplica el fix MÍNIMO necesario
5. Después del fix, lista los archivos modificados y explica en 2 líneas qué cambió y por qué

RESTRICCIONES ESTRICTAS:
- NUNCA modifiques src/domain/ (calculations.ts, documents.ts, constants.ts, actaHtml.ts)
- NUNCA modifiques src/domain/*.test.ts
- NUNCA aumentes timeouts como solución a fallos de timing
- NUNCA agregues dependencias nuevas (npm install)
- NUNCA refactorices código no relacionado con el error
- Si el error está EN src/domain/, detente y reporta al usuario con el diagnóstico completo

FORMATO DE REPORTE (siempre al final):
✅ Fix aplicado | Archivo: X | Causa: Y | Cambio: Z
❌ No se pudo corregir automáticamente | Razón: ...
⚠️  Requiere revisión manual | Motivo: ..."

echo ""
echo "🤖 [hook-test-diagnose] Tests fallidos detectados — lanzando agente de diagnóstico..."
echo ""

(cd "$PROJECT" && claude -p "$PROMPT")
```

- [ ] **Step 3: Verificar que el script es ejecutable**

```bash
ls -la /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-test-diagnose.sh
```

Esperado: permisos `-rwxr-xr-x` (o similar con `x`).

- [ ] **Step 4: Commit**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
git add scripts/hook-test-diagnose.sh
git commit -m "feat: hook post-vitest para diagnóstico automático de tests fallidos"
```

---

## Task 2: Crear `scripts/hook-build-diagnose.sh`

**Files:**
- Create: `scripts/hook-build-diagnose.sh`

- [ ] **Step 1: Crear el archivo**

```bash
touch /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-build-diagnose.sh
chmod +x /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-build-diagnose.sh
```

- [ ] **Step 2: Escribir el script completo**

Contenido de `scripts/hook-build-diagnose.sh`:

```bash
#!/usr/bin/env bash
# hook-build-diagnose.sh
# PostToolUse hook: se ejecuta después de cada Bash.
# Solo actúa cuando el comando era vite build Y hubo errores de compilación.
# Invoca un agente Claude que diagnostica y corrige en src/ (nunca en src/domain/).

set -euo pipefail

PROJECT="/c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos"

# Leer payload JSON del hook desde stdin
INPUT=$(cat)

# ── Filtro 1: solo comandos vite build ──────────────────────────────────────
COMMAND=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.argv[1])
    print(d.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" "$INPUT" 2>/dev/null || echo "")

echo "$COMMAND" | grep -q "vite build" || exit 0

# ── Filtro 2: solo si hay errores de compilación ────────────────────────────
TOOL_RESPONSE=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.argv[1])
    resp = d.get('tool_response', '')
    if isinstance(resp, dict):
        print(resp.get('output', ''))
    else:
        print(str(resp))
except Exception:
    print('')
" "$INPUT" 2>/dev/null || echo "")

# Vite build reporta errores con "error TS", "Build failed", o "ERROR"
echo "$TOOL_RESPONSE" | grep -qiE "(error TS[0-9]+|Build failed|✘ \[ERROR\]|error: )" || exit 0

# ── Invocar agente de diagnóstico ───────────────────────────────────────────
PROMPT="Eres un agente de diagnóstico automático del proyecto CERTIMAR-1511-Doctos.

CONTEXTO DEL PROYECTO:
- App web de certificación normativa acuícola (Resolución Exenta N°1511/2021, Sernapesca)
- Stack: React 19 + TypeScript 5 + Vite 6
- Ruta: ${PROJECT}

ERROR DE COMPILACIÓN (output de vite build):
---
${TOOL_RESPONSE}
---

PROCESO DE DIAGNÓSTICO:
1. Lee el error completo — identifica: archivo, línea, tipo de error TypeScript/JSX
2. Lee el archivo afectado completo antes de editar
3. Clasifica el error:
   - TS2xxx → error de tipos: busca el tipo correcto en el mismo archivo o en src/types.ts
   - TS18xxx → módulo no encontrado: verifica imports y rutas relativas
   - React hooks (#310, #321) → busca hook condicional o llamada como función directa (ej: {Comp()} en vez de <Comp />)
   - JSX syntax → error de sintaxis en el template
4. Aplica el fix mínimo
5. Si el error está en src/domain/, detente y reporta

RESTRICCIONES ESTRICTAS:
- NUNCA modifiques src/domain/
- NUNCA uses \`// @ts-ignore\` o \`as any\` como solución
- NUNCA elimines tipos — busca el tipo correcto
- NUNCA agregues dependencias
- Si el fix requiere tocar más de 3 archivos, reporta en vez de auto-corregir

FORMATO DE REPORTE (siempre al final):
✅ Fix aplicado | Archivo: X | Error TS: Y | Cambio: Z
❌ No se pudo corregir automáticamente | Razón: ...
⚠️  Requiere revisión manual | Motivo: ..."

echo ""
echo "🤖 [hook-build-diagnose] Build fallido detectado — lanzando agente de diagnóstico..."
echo ""

(cd "$PROJECT" && claude -p "$PROMPT")
```

- [ ] **Step 3: Verificar que el script es ejecutable**

```bash
ls -la /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-build-diagnose.sh
```

Esperado: permisos con `x`.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
git add scripts/hook-build-diagnose.sh
git commit -m "feat: hook post-vite-build para diagnóstico automático de errores de compilación"
```

---

## Task 3: Registrar los hooks en `~/.claude/settings.json`

**Files:**
- Modify: `~/.claude/settings.json`

- [ ] **Step 1: Leer el settings.json actual**

```bash
cat /c/Users/aldon/.claude/settings.json
```

Tomar nota de la estructura existente (puede tener `env`, `model`, u otras claves).

- [ ] **Step 2: Agregar el bloque `hooks` al JSON existente**

Agregar dentro del objeto raíz de `settings.json` (sin borrar las claves existentes):

```json
"hooks": {
  "PostToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "bash /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-test-diagnose.sh"
        },
        {
          "type": "command",
          "command": "bash /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos/scripts/hook-build-diagnose.sh"
        }
      ]
    }
  ]
}
```

> **Nota:** `settings.json` es global — estos hooks se activarán en TODAS las sesiones de Claude Code, no solo en el proyecto CERTIMAR. Los scripts tienen filtros por comando (`vitest`, `vite build`) así que no harán nada en otros proyectos a menos que también usen esos comandos. Si en el futuro quieres limitarlos a este proyecto, mueve el bloque a un `.claude/settings.json` dentro del proyecto.

- [ ] **Step 3: Verificar que el JSON es válido**

```bash
python3 -c "import json; json.load(open('/c/Users/aldon/.claude/settings.json')); print('JSON válido ✅')"
```

Esperado: `JSON válido ✅`

---

## Task 4: Verificación manual end-to-end

- [ ] **Step 1: Probar hook de tests — crear un test fallido temporal**

En `src/domain/calculations.test.ts`, comentar temporalmente la línea de un test para romperlo, o en cualquier archivo de test agregar al final:

```typescript
// test temporal para verificar hook
it('hook-test-diagnose: verificación temporal', () => {
  expect(1).toBe(2); // falla intencional
});
```

- [ ] **Step 2: Correr vitest desde Claude Code**

Ejecutar en la sesión de Claude Code:
```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && npm test
```

Esperado: el test falla Y aparece el mensaje `🤖 [hook-test-diagnose] Tests fallidos detectados — lanzando agente de diagnóstico...` seguido del diagnóstico del agente.

- [ ] **Step 3: Eliminar el test temporal**

Eliminar el `it('hook-test-diagnose...')` agregado en el Step 1.

- [ ] **Step 4: Verificar que tests pasan sin trigger**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && npm test
```

Esperado: 60/60 tests pasan, el hook **no** se activa (silencio total).

- [ ] **Step 5: Probar hook de build — introducir error de TypeScript temporal**

En `src/App.tsx`, al final del archivo antes del último `}`, agregar:

```typescript
// verificación hook build — eliminar después
const _hookTest: number = "esto falla" as any; // TS2322
```

Espera, no: queremos un error REAL de TS sin `as any`. Usar:

```typescript
// verificación hook build — eliminar después
const _hookVerify: number = "cadena_que_rompe_tipos";
```

- [ ] **Step 6: Correr build desde Claude Code**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && npm run build
```

Esperado: build falla con `error TS2322` Y aparece `🤖 [hook-build-diagnose] Build fallido detectado — lanzando agente de diagnóstico...`

- [ ] **Step 7: Eliminar la línea de error temporal de `src/App.tsx`**

Eliminar la línea `const _hookVerify...` agregada en el Step 5.

- [ ] **Step 8: Verificar build limpio**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && npm run build
```

Esperado: build exitoso, hook **no** se activa.

---

## Task 5: Commit final y documentación

- [ ] **Step 1: Verificar estado del repositorio**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos && git status
```

Esperado: working tree limpio (los commits de Task 1 y 2 ya fueron hechos).

- [ ] **Step 2: Agregar nota en IMPROVEMENTS.md**

Agregar al inicio de `IMPROVEMENTS.md` (después del título):

```markdown
## [AUTOMATIZACIÓN] Agentes de Diagnóstico Post-Test y Post-Build

**Fecha:** 2026-04-12

**Archivos:** `scripts/hook-test-diagnose.sh`, `scripts/hook-build-diagnose.sh`, `~/.claude/settings.json`

**Qué hace:** Dos hooks `PostToolUse` de Claude Code que detectan automáticamente
fallos en `vitest` y `vite build`, y lanzan un agente que diagnostica la causa raíz
y aplica el fix mínimo en `src/` (nunca toca `src/domain/`).

**Zona protegida:** `src/domain/` (calculations.ts, documents.ts, constants.ts,
actaHtml.ts y sus tests) — lógica normativa legal bajo Res. Exenta N°1511/2021.
```

- [ ] **Step 3: Commit final**

```bash
cd /c/Users/aldon/Documents/Proyectos/Certimar-1511-Doctos
git add IMPROVEMENTS.md
git commit -m "docs: registrar implementación de agentes de diagnóstico automático"
```

---

## Casos borde documentados

| Situación | Comportamiento esperado |
|-----------|------------------------|
| Tests pasan (exit 0) | Hook sale silenciosamente, no invoca agente |
| Build pasa | Hook sale silenciosamente, no invoca agente |
| Error en `src/domain/` | Agente reporta `⚠️ Requiere revisión manual`, no modifica |
| Fix requiere > 3 archivos | Agente reporta en vez de auto-corregir |
| Python3 no disponible | Script falla silenciosamente (`set -e` + fallback `|| echo ""`) |
| Comando es `vitest watch` (interactivo) | Hook se activa si hay fallos — comportamiento correcto |
