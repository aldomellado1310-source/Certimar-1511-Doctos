# Product

## Register

product

## Users

Personal interno de Certimar (operadores y certificadores). Trabajan en oficina y en terreno (inspecciones en plantas), a veces desde tablet o celular. Su tarea es capturar datos regulatorios de una instalación y generar documentos oficiales: certificados, informes técnicos y actas de inspección, conforme a la Res. Exenta N°1511/2021. El contexto es de alta responsabilidad: los datos alimentan documentos legales, así que la precisión y la ausencia de errores priman sobre todo.

## Product Purpose

Herramienta interna que reemplaza el llenado manual de plantillas Word/PDF. Centraliza la captura de datos (datos generales, extracción, desnaturalización, almacenamiento, incinerador), aplica cálculos regulatorios y umbrales normativos, y produce los documentos finales (PDF con jsPDF, Acta HTML desde template oficial). El éxito es: cero errores de transcripción, documentos consistentes con la norma, y generación en minutos en vez de horas.

## Brand Personality

Sobria y técnica. Confiable, precisa, regulatoria. La voz es directa y profesional, sin adornos. La interfaz debe transmitir rigor y exactitud; la estética sirve a la legibilidad de los datos, nunca compite con ellos. Tres palabras: precisa, confiable, eficiente.

## Anti-references

- No debe parecer una landing SaaS genérica (gradientes decorativos, hero metrics, tarjetas idénticas con icono+título+texto).
- Nada de slop AI: gradient text, glassmorphism decorativo, eyebrows en mayúsculas sobre cada sección.
- No sacrificar densidad de datos por "aire" decorativo: es una herramienta de captura intensiva, no una página de marketing.

## Design Principles

- **La precisión es la feature.** Cada input, validación y cálculo debe minimizar el riesgo de error humano en datos que terminan en documentos legales.
- **Densidad legible.** Mucha información en pantalla, pero jerarquizada: agrupación clara, contraste suficiente, sin ruido.
- **Funciona donde se trabaja.** Usable en terreno (tablet/móvil) y en oficina; los controles deben ser operables con dedos y con teclado.
- **Consistencia normativa.** La UI refleja la estructura de la norma; los umbrales y reglas viven en un dominio testeable, no esparcidos en la vista.
- **Sin sorpresas.** Estados de carga, error y vacío explícitos; el usuario siempre sabe qué pasó con su documento.

## Accessibility & Inclusion

- Objetivo WCAG 2.1 AA: contraste de texto ≥4.5:1 (≥3:1 texto grande), navegación completa por teclado con foco visible.
- Uso en terreno: responsive real en tablet/móvil, touch targets ≥44×44px.
- Dark mode confiable: paridad de contraste y tokens en ambos temas (el dark mode ya existe vía clase `.dark`).
