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
COMMAND=$(python -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(d.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" <<< "$INPUT" 2>/dev/null || echo "")

echo "$COMMAND" | grep -q "vitest" || exit 0

# ── Filtro 2: solo si hay tests fallidos ────────────────────────────────────
TOOL_RESPONSE=$(python -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    resp = d.get('tool_response', '')
    # tool_response puede ser string o dict con 'output'
    if isinstance(resp, dict):
        print(resp.get('output', ''))
    else:
        print(str(resp))
except Exception:
    print('')
" <<< "$INPUT" 2>/dev/null || echo "")

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
