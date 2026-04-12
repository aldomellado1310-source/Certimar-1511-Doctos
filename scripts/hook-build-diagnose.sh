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
COMMAND=$(python -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(d.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" <<< "$INPUT" 2>/dev/null || echo "")

echo "$COMMAND" | grep -q "vite build" || exit 0

# ── Filtro 2: solo si hay errores de compilación ────────────────────────────
TOOL_RESPONSE=$(python -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    resp = d.get('tool_response', '')
    if isinstance(resp, dict):
        print(resp.get('output', ''))
    else:
        print(str(resp))
except Exception:
    print('')
" <<< "$INPUT" 2>/dev/null || echo "")

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
