# CERTIMAR 1511

**Sistema de certificación normativa para centros de cultivo de salmónidos**
Resolución Exenta N°1511/2021 — D.S. N°320 — Sernapesca / Subpesca

---

## Descripción

CERTIMAR 1511 es una aplicación web que automatiza el proceso de certificación de sistemas de manejo de mortalidad en centros de cultivo de peces (salmónidos). Calcula y valida el cumplimiento de los tres umbrales críticos exigidos por la normativa chilena:

| Sistema | Umbral Mínimo |
|---|---|
| Extracción de mortalidad (jaulas → superficie) | ≥ 15 TN/día |
| Desnaturalización (ensilaje o incineración) | ≥ 15 TN/día |
| Almacenamiento de biomasa desnaturalizada | ≥ 20 TN |

El output del proceso son los documentos legales requeridos por Sernapesca:
- Acta de Certificación
- Certificado de Sistemas de Mortalidad
- Informe Técnico fotográfico con semáforo normativo (Verde / Amarillo / Rojo)

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework UI | React | 19.0.0 |
| Lenguaje | TypeScript | 5.8.2 |
| Build tool | Vite | 6.2.0 |
| Estilos | Tailwind CSS | 4.1.14 |
| Generación PDF | jsPDF + jspdf-autotable | 4.2.0 / 5.0.7 |
| Animaciones | Motion (Framer Motion) | 12.23.24 |
| Drag & Drop | react-dropzone | 15.0.0 |
| Iconos | lucide-react | 0.546.0 |

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

---

## Instalación y uso

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd Certimar-1511-Doctos

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

La aplicación estará disponible en `http://localhost:5173` por defecto.

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto basándose en `.env.example`:

```env
GEMINI_API_KEY="tu_api_key_aqui"   # Opcional — integración futura con IA
APP_URL="http://localhost:5173"
```

---

## Flujo de certificación

El proceso sigue un flujo secuencial de 6 pasos:

```
1. Datos Generales
   └─ Identificación del centro de cultivo, fechas y datos del certificador

2. Sistema de Extracción
   └─ Selección de equipo (LIFT-UP, Mortex HW, ROV, Yoma)
   └─ Parámetros: jaulas, personal, profundidad, talla de pez, horas efectivas
   └─ Cálculo automático de capacidad diaria (TN/día)

3. Desnaturalización
   └─ Modo Ensilaje: ollas trituradoras, ciclos batch (kg/batch, tiempos)
   └─ Modo Incineración: capacidad de carga kg/h
   └─ Cálculo automático de capacidad diaria (TN/día)

4. Almacenamiento
   └─ Capacidad del estanque (m³) × densidad ácido fórmico (1.2 TN/m³)
   └─ Infraestructura: pretil, piping, válvulas

5. Informe Técnico
   └─ Carga fotográfica por sección (Extracción / Desnaturalización / Almacenamiento)
   └─ Semáforo normativo por imagen: Verde / Amarillo / Rojo
   └─ Leyendas y observaciones

6. Emisión del Certificado
   └─ Validación de los tres umbrales + registro fotográfico
   └─ Generación de documentos PDF
```

---

## Estructura del proyecto

```
src/
├── App.tsx                  # Componente principal: estado, cálculos, vistas, PDF
├── types.ts                 # Interfaces TypeScript del dominio
├── main.tsx                 # Entry point React
├── index.css                # Estilos globales (Tailwind + fuentes)
├── constants/
│   └── masterData.ts        # Catálogos de equipos y datos históricos
└── lib/
    └── utils.ts             # Utilidad cn() para clases Tailwind
```

---

## Catálogos de equipos

### Sistemas de extracción
- Novatech 8" / 10"
- Polinox 10"
- Scale AQ 8" / 10"
- QUO 8"

### Trituradoras (Ensilaje)
- AQUAINOX 1430 L-EQ (2.500 kg/h)
- OPTIMO MIX OM 500 (2.100 kg/h)
- OCEA SW-700 (2.450 kg/h)
- ACUIMASTER AC-715 LT (1.680 kg/h)

### Incineradores
- Addfield THUNDER 1000 (150 kg/h, 850–1100°C)

### Compresores
- Kaeser Mobilair M50E / M50, SK25, M100
- Atlas Copco XAS 97, XAS 186
- ABAC B7000

---

## Marco normativo

| Documento | Descripción |
|---|---|
| **D.S. N°320** | Decreto Supremo que establece los requisitos sanitarios para centros de cultivo acuícola |
| **Res. Exenta N°1511/2021** | Resolución del Servicio Nacional de Pesca que regula los sistemas de manejo de mortalidad en centros acuícolas |

Los umbrales de capacidad (15/15/20 TN) están definidos en la Res. Exenta N°1511/2021 y deben ser verificados por un certificador inscrito en el registro de Sernapesca.

---

## Persistencia de datos

El borrador del proceso de certificación se guarda automáticamente en `localStorage` del navegador bajo la clave `certimar-draft-state`. Para iniciar una nueva certificación desde cero, usar el botón **Borrar Borrador** en la barra lateral.

> **Nota:** Los datos no se sincronizan con ningún servidor externo. El sistema es completamente client-side. Para ambientes de producción regulatoria se recomienda implementar un backend con base de datos y control de acceso.

---

## Limitaciones conocidas (v2.0)

- Los documentos Acta de Certificación e Informe Técnico fotográfico están en desarrollo; actualmente solo se genera el Certificado básico en PDF.
- El catálogo de centros de cultivo es de ejemplo; debe reemplazarse con datos reales de Sernapesca.
- No existe sistema de autenticación ni log de auditoría de emisiones.
- Los datos históricos mostrados son de referencia y no provienen de una base de datos persistente.

---

## Certificador por defecto

La aplicación incluye datos de un certificador de ejemplo para propósitos de desarrollo. Estos deben ser actualizados con los datos reales del certificador inscrito antes de generar documentos legales.

---

## Licencia

Uso interno — © 2026 Certimar SpA. Todos los derechos reservados.
