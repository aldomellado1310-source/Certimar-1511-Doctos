# -*- coding: utf-8 -*-
"""
Prueba visual del WelcomeScreen en viewports mobile y desktop.
Verifica que el panel izquierdo este oculto en mobile y visible en desktop.
Ejecutar con: python scripts/test_welcome_responsive.py
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
        print(f"\n-- {vp['name']} ({vp['width']}x{vp['height']}) --")
        page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
        page.goto("http://localhost:3001")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(4000)  # esperar splash + login phase

        screenshot_path = f"C:/tmp/welcome_{vp['name'].replace(' ', '_').lower()}.png"
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"  Screenshot: {screenshot_path}")

        is_mobile = vp["width"] < 640

        # Verificar que el panel de login existe y es visible
        login_panel = page.locator("text=Ingresar al sistema")
        check(login_panel.count() > 0, "Panel login visible")

        # En mobile: verificar que el boton Google es accesible (no fuera de pantalla)
        btn = page.locator("text=Continuar con Google")
        if btn.count() > 0:
            box = btn.bounding_box()
            if box:
                in_viewport = (box["y"] + box["height"]) <= vp["height"]
                check(in_viewport, f"Boton Google en viewport (y={box['y']:.0f}, h={box['height']:.0f})")
                check(box["height"] >= 40, f"Boton Google alto >= 40px (actual: {box['height']:.0f}px)")
            else:
                FAILURES.append("Boton Google sin bounding box")

        # En mobile: panel izquierdo debe estar oculto (display:none)
        # En desktop: debe estar visible
        info_text = page.get_by_text("Registro de Visita", exact=True)
        if is_mobile:
            visible = info_text.count() > 0 and info_text.first.is_visible()
            check(not visible, "Panel info oculto en mobile")
        else:
            check(info_text.count() > 0 and info_text.first.is_visible(), "Panel info visible en desktop")

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
