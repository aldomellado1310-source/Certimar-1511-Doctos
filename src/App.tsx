import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Waves,
  FlaskConical,
  Database,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileDown,
  Camera,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Info,
  ArrowRight,
  ShieldCheck,
  History,
  Fish,
  Anchor,
  Moon,
  Sun,
  Star,
  Cloud,
  Save,
  TestTube2,
  LogOut,
  PlayCircle,
  Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from './lib/utils';
import { AppState, ReportImage } from './types';
import {
  CATALOGO_EXTRACCION,
  CATALOGO_DESNATURALIZACION,
  CATALOGO_GENERADORES,
  CATALOGO_ALMACENAMIENTO,
  CATALOGO_FOTOS,
  HISTORICO_CERTIFICACIONES,
  TITULARES_CONOCIDOS,
  FORMATOS_MODULO_CONOCIDOS,
  TAMANOS_JAULAS_CONOCIDOS,
  NOMBRES_AN_CONOCIDOS,
  OPCIONES_INCINERADOR,
  OPCIONES_INFRAESTRUCTURA,
  EMPRESA_HINTS,
} from './constants/masterData';
import type { ImageSeccion } from './types';
import { CONCESIONES_DB, type ConcesionCentro } from './data/concesiones';
import {
  calculateExtraction,
  calculateDenaturation,
  calculateStorage,
} from './domain/calculations';
import {
  buildCertificadoData,
  buildInformeTecnicoData,
  buildActaInspeccionData,
} from './domain/documents';
import { generateActaPdf } from './domain/actaHtml';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// ─── Credenciales desde variables de entorno (.env — no subir a git) ────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const ADMIN_PIN        = import.meta.env.VITE_ADMIN_PIN        as string | undefined;

// --- Constants & Defaults ---
const DEFAULT_STATE: AppState = {
  general: {
    certificador: {
      nombre: "ENGELBERT ALEXANDER FLORES CARRIO",
      rut: "13.968.696-9",
      numero_registro: "DN-02727/2023"
    },
    centro_cultivo: {
      codigo_centro: "",
      nombre_centro: "",
      titular: "",
      acs: "",
      ubicacion: "",
      formato_modulo: "",
      tamano_jaulas: "",
      coordenadas_ensilaje: "",
      nombre_an_ensilaje: ""
    },
    fechas: {
      evaluacion_documental: new Date().toISOString().split('T')[0],
      inspeccion_terreno: new Date().toISOString().split('T')[0],
      emision_certificado: new Date().toISOString().split('T')[0]
    }
  },
  extraction: {
    sistemas_apoyo: { buceo: false, rov: false, succion_yoma: false, automatica: false },
    parametros: {
      numero_total_jaulas: 0,
      jaulas_simultaneas: 1,
      horas_efectivas_trabajo: 8,
      personal_operativo: 2,
      profundidad_operacion_m: 20,
      sistema_principal: 'LIFT-UP (Novatech)',
      talla_pez: 'Grande (>=4.5kg)',
      factor_ajuste_biomasa: 1.0,
      marca_equipo: "",
      id_catalogo_equipo: "",
      tipo_compresor: "",
      id_catalogo_compresor: "",
      potencia_cfm: 0,
      capacidad_receptor_bins_litros: 500,
      disponibilidad_base_fd: 0.90,
      motocompresores_por_jaula: 1,
      ubicacion_compresor: "",
      observacion_sistema: ""
    },
    resultados: { ciclos_por_dia: 0, capacidad_diaria_ton: 0, cumple_norma: false }
  },
  denaturation: {
    equipos: {
      cantidad_sistemas: 1,
      id_catalogo_trituradora: "",
      id_catalogo_incinerador: "",
      marca_modelo: "",
      velocidad_nominal_kg_hr: 0,
      horas_funcionamiento_dia: 8,
      cuenta_con_prepicador: false,
      capacidad_prepicador_kg_hr: 0,
      cuenta_con_recirculacion_acido: false,
      material_construccion: "",
      tipo_sistema: 'Ensilaje',
      estado_olla: 'Bueno' as const
    },
    parametros_batch: { kilos_por_batch: 0, tiempo_procesamiento_min: 0, tiempo_pausa_min: 0 },
    parametros_incineracion: { capacidad_carga_kg_h: 0, temperatura_operacion: "", camara_primaria: "", camara_secundaria: "" },
    incinerador: {
      activo: false,
      id_catalogo: '',
      marca_modelo: '',
      capacidad_carga_kg_h: 0,
      horas_funcionamiento_dia: 8,
      sistema_carga: 'N/A',
      sistema_descarga: 'N/A',
      disposicion_final: 'N/A',
      almacenamiento_gas: 'N/A',
      observaciones: '',
    },
    generacion_electrica: [],
    resultados: { duracion_total_batch_min: 0, numero_batches_dia: 0, capacidad_ensilaje_ton: 0, capacidad_incinerador_ton: 0, capacidad_diaria_ton: 0, cumple_norma: false, observacion_automatica: "" }
  },
  storage: {
    parametros: {
      capacidad_almacenaje_m3: 0,
      factor_densidad: 1.2,
      observaciones: "SE REALIZA EL CÁLCULO POR DENSIDAD DE ÁCIDO FÓRMICO 1.2 TN/M3"
    },
    infraestructura: {
      pretil_material: "",
      pretil_estado: 'Bueno',
      piping_material: "",
      piping_diametro: "",
      piping_valvulas: "",
      piping_estado: 'Bueno',
      eslora_m: "",
      manga_m: "",
      puntual_m: ""
    },
    resultados: { capacidad_almacenaje_ton: 0, cumple_norma: false }
  },
  images: []
};

// --- Components ---

const StatusBadge = ({ status }: { status: boolean }) => (
  <div className={cn(
    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
    status ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
  )}>
    {status ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    {status ? "Cumple Norma" : "No Cumple"}
  </div>
);

// Elementos marinos estáticos (posiciones fijas para evitar re-renders)
const FISH_DATA = [
  { dir: 1, y: 22, dur: 28, delay: 0,  size: 28 },
  { dir: -1, y: 38, dur: 35, delay: 5,  size: 20 },
  { dir: 1, y: 55, dur: 22, delay: 9,  size: 36 },
  { dir: -1, y: 18, dur: 40, delay: 2,  size: 18 },
  { dir: 1, y: 68, dur: 30, delay: 14, size: 24 },
  { dir: -1, y: 45, dur: 26, delay: 7,  size: 32 },
  { dir: 1, y: 30, dur: 45, delay: 18, size: 16 },
  { dir: -1, y: 62, dur: 33, delay: 11, size: 22 },
  { dir: 1, y: 75, dur: 20, delay: 3,  size: 40 },
  { dir: -1, y: 50, dur: 38, delay: 20, size: 14 },
  { dir: 1, y: 85, dur: 25, delay: 16, size: 20 },
  { dir: -1, y: 35, dur: 42, delay: 8,  size: 26 },
];
const BUBBLE_DATA = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37 + 13) % 100,
  dur: 14 + (i * 7) % 18,
  delay: (i * 3.7) % 22,
  size: i % 4 === 0 ? 'w-4 h-4' : i % 3 === 0 ? 'w-2.5 h-2.5' : i % 2 === 0 ? 'w-2 h-2' : 'w-1 h-1',
}));
const STAR_FLOOR = [12, 26, 40, 54, 68, 82, 20, 35, 50, 65];
const STAR_FLOAT = [
  { top: 15, left: 18, dur: 12, delay: 0 },
  { top: 42, left: 73, dur: 9,  delay: 3 },
  { top: 28, left: 55, dur: 15, delay: 6 },
  { top: 60, left: 30, dur: 11, delay: 2 },
  { top: 78, left: 85, dur: 13, delay: 8 },
  { top: 20, left: 90, dur: 10, delay: 4 },
];
const JELLYFISH_DATA = [
  { left: 12, top: 28, dur: 8,  delay: 0 },
  { left: 38, top: 50, dur: 11, delay: 3 },
  { left: 65, top: 35, dur: 9,  delay: 6 },
  { left: 82, top: 60, dur: 12, delay: 1 },
];
const SEAWEED_DATA = [
  { left: 4,  h: 200, color: 'bg-emerald-500/25', dur: 4, delay: 0 },
  { left: 10, h: 280, color: 'bg-teal-500/20',    dur: 6, delay: 1 },
  { left: 18, h: 160, color: 'bg-emerald-400/20', dur: 5, delay: 2 },
  { left: 68, h: 240, color: 'bg-cyan-500/20',    dur: 7, delay: 0.5 },
  { left: 76, h: 190, color: 'bg-emerald-600/20', dur: 4, delay: 1.5 },
  { left: 84, h: 260, color: 'bg-teal-400/25',    dur: 5, delay: 3 },
  { left: 92, h: 170, color: 'bg-emerald-500/15', dur: 6, delay: 2 },
];
const CORAL_DATA = [
  { left: 22, stems: [{ h: 90, w: 8, color: 'bg-rose-500/25'   }, { h: 65, w: 5, color: 'bg-pink-400/20', ml: -14 }, { h: 75, w: 6, color: 'bg-rose-400/20', ml: 10 }] },
  { left: 45, stems: [{ h: 70, w: 6, color: 'bg-orange-400/20' }, { h: 55, w: 4, color: 'bg-amber-400/15', ml: -10 }, { h: 60, w: 5, color: 'bg-orange-300/15', ml: 8 }] },
  { left: 60, stems: [{ h: 85, w: 7, color: 'bg-violet-400/20' }, { h: 60, w: 5, color: 'bg-purple-400/15', ml: -12 }, { h: 70, w: 6, color: 'bg-violet-300/15', ml: 9 }] },
  { left: 78, stems: [{ h: 75, w: 6, color: 'bg-rose-400/20'   }, { h: 50, w: 4, color: 'bg-pink-300/15', ml: -9 },  { h: 65, w: 5, color: 'bg-rose-300/15', ml: 7 }] },
];
const RAY_DATA = [
  { left: 5,  skew: -8,  h: 50, dur: 9,  delay: 0 },
  { left: 18, skew: -5,  h: 42, dur: 13, delay: 2 },
  { left: 32, skew: -2,  h: 58, dur: 8,  delay: 5 },
  { left: 50, skew: 2,   h: 45, dur: 11, delay: 1 },
  { left: 65, skew: 5,   h: 38, dur: 10, delay: 3.5 },
  { left: 78, skew: 7,   h: 55, dur: 14, delay: 2.5 },
  { left: 90, skew: 10,  h: 40, dur: 7,  delay: 6 },
];

const MarineBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-55 dark:opacity-40 transition-colors duration-700">

    {/* === FONDO: gradiente profundidad oceánica === */}
    <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 via-indigo-50/20 via-60% to-cyan-100/40 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-900" />
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/10 via-transparent to-teal-50/10 dark:from-blue-950/20 dark:to-teal-950/20" />

    {/* === RAYOS DE LUZ desde la superficie === */}
    {RAY_DATA.map((r, i) => (
      <motion.div
        key={`ray-${i}`}
        className="absolute top-0 origin-top"
        style={{
          left: `${r.left}%`,
          width: '70px',
          height: `${r.h}%`,
          background: 'linear-gradient(to bottom, rgba(147,197,253,0.12), transparent)',
          transform: `skewX(${r.skew}deg)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [1, 1.4, 1] }}
        transition={{ duration: r.dur, repeat: Infinity, ease: "easeInOut", delay: r.delay }}
      />
    ))}

    {/* === RED DE PESCA (dos capas) === */}
    <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none">
      <div className="w-full h-full" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />
    </div>
    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none" style={{ transform: 'rotate(15deg) scale(1.5)' }}>
      <div className="w-full h-full" style={{
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
    </div>

    {/* === ALGAS MARINAS — múltiples variedades === */}
    {SEAWEED_DATA.map((sw, i) => (
      <motion.div
        key={`sw-${i}`}
        className={`absolute bottom-0 rounded-t-full blur-xl origin-bottom ${sw.color}`}
        style={{ left: `${sw.left}%`, width: '28px', height: `${sw.h}px` }}
        animate={{ rotate: [0, 6, -6, 3, 0], scaleY: [1, 1.06, 0.94, 1.03, 1] }}
        transition={{ duration: sw.dur, repeat: Infinity, ease: "easeInOut", delay: sw.delay }}
      />
    ))}

    {/* === CORAL en el fondo === */}
    {CORAL_DATA.map((c, i) => (
      <motion.div
        key={`coral-${i}`}
        className="absolute bottom-0 flex items-end"
        style={{ left: `${c.left}%` }}
        animate={{ scaleY: [1, 1.02, 0.99, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
      >
        {c.stems.map((s, j) => (
          <div
            key={j}
            className={`rounded-t-full ${s.color} blur-sm`}
            style={{ width: `${s.w}px`, height: `${s.h}px`, marginLeft: j > 0 ? `${s.ml}px` : 0 }}
          />
        ))}
      </motion.div>
    ))}

    {/* === MEDUSAS === */}
    {JELLYFISH_DATA.map((j, i) => (
      <motion.div
        key={`jelly-${i}`}
        className="absolute"
        style={{ left: `${j.left}%`, top: `${j.top}%` }}
        animate={{ y: [0, -28, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: j.dur, repeat: Infinity, ease: "easeInOut", delay: j.delay }}
      >
        {/* cuerpo */}
        <div className="w-10 h-7 bg-gradient-to-b from-cyan-200/25 to-indigo-100/10 dark:from-cyan-400/15 dark:to-indigo-200/5 rounded-t-full border-t border-x border-cyan-300/20" />
        {/* tentáculos */}
        <div className="flex justify-around px-0.5">
          {[14, 20, 12, 18, 16, 10].map((h, k) => (
            <motion.div
              key={k}
              className="bg-gradient-to-b from-cyan-300/20 to-transparent"
              style={{ width: '1px', height: `${h}px` }}
              animate={{ scaleX: [1, 2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: k * 0.18, ease: "easeInOut" }}
            />
          ))}
        </div>
      </motion.div>
    ))}

    {/* === ESTRELLAS DE MAR — piso marino === */}
    {STAR_FLOOR.map((left, i) => (
      <motion.div
        key={`sf-${i}`}
        className="absolute bottom-3 text-amber-400/40 dark:text-amber-300/20"
        style={{ left: `${left}%` }}
        animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.6, repeatType: "reverse" }}
      >
        <Star size={14 + (i % 3) * 7} fill="currentColor" />
      </motion.div>
    ))}

    {/* === ESTRELLAS FLOTANTES === */}
    {STAR_FLOAT.map((s, i) => (
      <motion.div
        key={`sfloat-${i}`}
        className="absolute text-amber-300/20 dark:text-amber-400/15"
        style={{ top: `${s.top}%`, left: `${s.left}%` }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.7, 1.3, 0.7], rotate: [0, 120, 240] }}
        transition={{ duration: s.dur, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
      >
        <Star size={20 + (i % 3) * 10} />
      </motion.div>
    ))}

    {/* === BURBUJAS — variedad de tamaños === */}
    {BUBBLE_DATA.map((b, i) => (
      <motion.div
        key={`bub-${i}`}
        className={`absolute ${b.size} rounded-full border border-indigo-300/25 bg-white/10 blur-[1px]`}
        initial={{ y: "108vh" }}
        animate={{
          y: "-8vh",
          x: [0, Math.sin(i) * 30, Math.sin(i + 1) * 15, 0],
          opacity: [0, 0.5, 0.5, 0],
        }}
        transition={{
          duration: b.dur,
          repeat: Infinity,
          delay: b.delay,
          ease: "linear",
        }}
        style={{ left: `${b.x}%` }}
      />
    ))}

    {/* === PECES — escuela grande con variedad === */}
    {FISH_DATA.map((f, i) => (
      <motion.div
        key={`fish-${i}`}
        className={cn(
          "absolute",
          i < 4  ? "text-indigo-400/35 dark:text-indigo-300/25" :
          i < 8  ? "text-cyan-500/30 dark:text-cyan-400/20" :
                   "text-teal-500/25 dark:text-teal-400/15"
        )}
        initial={{ x: f.dir > 0 ? "-8vw" : "108vw" }}
        animate={{
          x: f.dir > 0 ? "108vw" : "-8vw",
          y: [0, Math.sin(i) * 25, 0],
          opacity: [0, 0.8, 0.8, 0.8, 0],
        }}
        transition={{
          duration: f.dur,
          repeat: Infinity,
          delay: f.delay,
          ease: "linear",
        }}
        style={{ top: `${f.y}%` }}
      >
        <Fish
          size={f.size}
          className={f.dir < 0 ? "scale-x-[-1]" : ""}
        />
      </motion.div>
    ))}

    {/* === ANCLAS flotando suavemente === */}
    {[{ left: 8, top: 60, dur: 14, delay: 0 }, { left: 90, top: 40, dur: 18, delay: 7 }].map((a, i) => (
      <motion.div
        key={`anchor-${i}`}
        className="absolute text-slate-400/15 dark:text-slate-300/10"
        style={{ left: `${a.left}%`, top: `${a.top}%` }}
        animate={{ y: [0, -18, 0], rotate: [-5, 5, -5], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: a.dur, repeat: Infinity, ease: "easeInOut", delay: a.delay }}
      >
        <Anchor size={32 + i * 10} />
      </motion.div>
    ))}

    {/* === OLAS DOBLES en la parte inferior === */}
    <div className="absolute bottom-0 left-0 right-0 h-80 select-none pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <motion.path
          initial={{ d: "M0,200L60,186C120,171,240,143,360,149.3C480,155,600,197,720,202.7C840,208,960,176,1080,160C1200,144,1320,144,1380,144L1440,144L1440,320L0,320Z" }}
          animate={{
            d: [
              "M0,200L60,186C120,171,240,143,360,149.3C480,155,600,197,720,202.7C840,208,960,176,1080,160C1200,144,1320,144,1380,144L1440,144L1440,320L0,320Z",
              "M0,180L60,197C120,213,240,245,360,234.7C480,224,600,171,720,165.3C840,160,960,203,1080,218.7C1200,235,1320,224,1380,218.7L1440,213L1440,320L0,320Z",
              "M0,200L60,186C120,171,240,143,360,149.3C480,155,600,197,720,202.7C840,208,960,176,1080,160C1200,144,1320,144,1380,144L1440,144L1440,320L0,320Z",
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="fill-indigo-400/10 dark:fill-indigo-400/8"
        />
        <motion.path
          initial={{ d: "M0,240L80,224C160,208,320,176,480,181.3C640,187,800,229,960,234.7C1120,240,1280,208,1360,192L1440,176L1440,320L0,320Z" }}
          animate={{
            d: [
              "M0,240L80,224C160,208,320,176,480,181.3C640,187,800,229,960,234.7C1120,240,1280,208,1360,192L1440,176L1440,320L0,320Z",
              "M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L0,320Z",
              "M0,240L80,224C160,208,320,176,480,181.3C640,187,800,229,960,234.7C1120,240,1280,208,1360,192L1440,176L1440,320L0,320Z",
            ]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="fill-cyan-400/8 dark:fill-cyan-400/5"
        />
      </svg>
    </div>

  </div>
);

const Logo = ({ collapsed }: { collapsed?: boolean }) => (
  <div className="flex items-center justify-center">
    {collapsed ? (
      <img
        src="/certimar-logo.png"
        alt="Certimar"
        className="w-12 h-12 object-contain"
      />
    ) : (
      <img
        src="/certimar-logo.png"
        alt="Certimar"
        className="h-16 max-w-full object-contain"
      />
    )}
  </div>
);

const SectionHeader = ({ title, icon: Icon, description }: { title: string, icon: React.ElementType, description?: string }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
    </div>
    {description && <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">{description}</p>}
  </div>
);

const FormCard = ({ title, children, className }: { title?: string, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors", className)}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Convierte yyyy-mm-dd ↔ dd-mm-yyyy para display/storage
const DateField = ({
  label, value, onChange, inputRef, highlight
}: {
  label: string, value: string, onChange: (val: string) => void,
  inputRef?: React.RefObject<HTMLInputElement | null>, highlight?: boolean
}) => {
  const toDisplay = (iso: string) => iso ? iso.split('-').reverse().join('-') : '';
  const toISO     = (dmy: string) => {
    const parts = dmy.split('-');
    if (parts.length === 3 && parts[2].length === 4) return parts.reverse().join('-');
    return dmy;
  };
  const [raw, setRaw] = React.useState(toDisplay(value));

  React.useEffect(() => { setRaw(toDisplay(value)); }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={raw}
        placeholder="dd-mm-yyyy"
        maxLength={10}
        onChange={(e) => {
          let v = e.target.value.replace(/[^\d-]/g, '');
          setRaw(v);
          if (/^\d{2}-\d{2}-\d{4}$/.test(v)) onChange(toISO(v));
        }}
        onBlur={() => {
          if (!/^\d{2}-\d{2}-\d{4}$/.test(raw)) setRaw(toDisplay(value));
        }}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium",
          highlight && "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-white dark:bg-slate-900"
        )}
      />
    </div>
  );
};

const InputField = ({
  label, value, onChange, type = "text", placeholder, suffix, inputRef, highlight, min, max
}: {
  label: string, value: any, onChange: (val: any) => void, type?: string,
  placeholder?: string, suffix?: string, inputRef?: React.RefObject<HTMLInputElement | null>,
  highlight?: boolean, min?: number, max?: number
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          if (type === 'number') {
            let v = parseFloat(e.target.value);
            if (isNaN(v)) v = min ?? 0;
            if (min !== undefined && v < min) v = min;
            if (max !== undefined && v > max) v = max;
            onChange(v);
          } else {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium",
          highlight && "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-white dark:bg-slate-900"
        )}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

// Combo de autocompletado para leyendas fotográficas.
// Filtra el catálogo según la sección, resuelve placeholders dinámicos ({m3}, {kva})
// y excluye descripciones ya asignadas a otras fotos de la misma sección.
const LeyendaCombo = ({
  seccion, value, onChange, m3, kva, usedLeyendas = []
}: {
  seccion: ImageSeccion;
  value: string;
  onChange: (v: string) => void;
  m3: number;
  kva: number;
  usedLeyendas?: string[];
}) => {
  const listId = `leyenda-list-${seccion.replace(/[\s\/]/g, '-').replace(/[áéíóúñ]/g, c => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n' } as Record<string,string>)[c] ?? c)}`;
  const opciones = (CATALOGO_FOTOS[seccion] ?? [])
    .map(s => s.replace(/\{m3\}/g, String(m3)).replace(/\{kva\}/g, String(kva)))
    .filter(op => op === value || !usedLeyendas.includes(op));
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Descripción</label>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Seleccione o escriba una descripción..."
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
      />
      <datalist id={listId}>
        {opciones.map((op, i) => <option key={i} value={op} />)}
      </datalist>
    </div>
  );
};

const CenterCodeAutocomplete = ({
  label, value, onChange, inputRef, highlight
}: {
  label: string, value: string, onChange: (code: string, center?: ConcesionCentro) => void,
  inputRef?: React.RefObject<HTMLInputElement | null>, highlight?: boolean
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync from external changes only (e.g. reset or auto-fill from center selection).
  // The ref prevents re-syncing when the change originated from the user's own typing.
  const internalTyping = useRef(false);
  useEffect(() => {
    if (!internalTyping.current) {
      setQuery(value);
    }
    internalTyping.current = false;
  }, [value]);

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return CONCESIONES_DB
      .filter(c => c.codigo.startsWith(query) || c.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (center: ConcesionCentro) => {
    setQuery(center.codigo);
    setOpen(false);
    onChange(center.codigo, center);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            internalTyping.current = true;
            setQuery(e.target.value);
            setOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          placeholder="Ej. 102345"
          className={cn(
            "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium",
            highlight && "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-white dark:bg-slate-900"
          )}
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-auto max-h-64">
            {suggestions.map(c => (
              <button
                key={c.codigo}
                type="button"
                onMouseDown={() => handleSelect(c)}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{c.codigo}</span>
                  <span className="text-slate-700 dark:text-slate-200 text-sm truncate">{c.nombre}</span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.titular}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MarineButton = ({ children, onClick, disabled, className, variant = "primary" }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, className?: string, variant?: "primary" | "secondary" }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "relative overflow-hidden group px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "primary" 
        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40" 
        : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700",
      className
    )}
  >
    <div className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </div>
    {/* Marine wave effect on hover */}
    <motion.div
      initial={{ y: "100%" }}
      whileHover={{ y: "0%" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="absolute inset-0 bg-indigo-500/10 pointer-events-none"
    />
    <div className="absolute -bottom-1 -left-1 right-0 h-1 bg-cyan-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const CheckboxField = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className={cn(
      "w-5 h-5 rounded border transition-all flex items-center justify-center",
      checked 
        ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500" 
        : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 group-hover:border-indigo-400"
    )}>
      {checked && <CheckCircle2 size={14} className="text-white" />}
    </div>
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

// --- WelcomeScreen — extracted outside App to prevent remount on every render ---

const WelcomeScreen = ({
  setUserRole,
  setShowWelcome,
}: {
  setUserRole: React.Dispatch<React.SetStateAction<'admin' | 'reader' | null>>;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [step, setStep]         = React.useState<'google' | 'pin'>('google');
  const [googleEmail, setGoogleEmail] = React.useState('');
  const [pin, setPin]           = React.useState('');
  const [error, setError]       = React.useState('');
  const [loading, setLoading]   = React.useState(false);

  const handleGoogleSignIn = React.useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: 'certimar.cl' });
      const result = await signInWithPopup(auth, provider);
      const email = (result.user.email ?? '').toLowerCase();
      if (!email.endsWith('@certimar.cl')) {
        setError('Solo cuentas @certimar.cl tienen acceso.');
        await result.user.delete().catch(() => {});
        return;
      }
      if (email === 'operaciones@certimar.cl') {
        setGoogleEmail(email);
        setStep('pin');
      } else {
        localStorage.setItem('certimar-session', JSON.stringify({ role: 'reader', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
        setUserRole('reader');
        setShowWelcome(false);
      }
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [setUserRole, setShowWelcome]);

  const handlePin = () => {
    if (ADMIN_PIN && pin === ADMIN_PIN) {
      localStorage.setItem('certimar-session', JSON.stringify({ role: 'admin', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      setUserRole('admin');
      setShowWelcome(false);
    } else if (pin === '') {
      localStorage.setItem('certimar-session', JSON.stringify({ role: 'reader', expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      setUserRole('reader');
      setShowWelcome(false);
    } else {
      setError('PIN incorrecto.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* ── SKY ── deep cerulean dawn gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #0a1628 0%, #0e2a4a 18%, #133d6b 35%, #1a5f8a 50%, #2a89b0 62%, #5fb8cc 72%, #8ed4dc 80%, #b8e8e4 88%, #cff0e8 95%, #ddf4ee 100%)'
      }} />
      <div className="absolute pointer-events-none" style={{ top: '8%', left: '72%', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,245,200,0.95) 30%, rgba(255,220,120,0.4) 60%, transparent 80%)', filter: 'blur(2px)' }} />
      <div className="absolute pointer-events-none" style={{ top: '5%', left: '70%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,245,200,0.12) 40%, transparent 70%)' }} />
      {[{x:5,y:4},{x:14,y:8},{x:28,y:3},{x:38,y:12},{x:52,y:6},{x:60,y:2},{x:48,y:15},{x:22,y:18},{x:8,y:22},{x:33,y:7},{x:80,y:5},{x:88,y:12},{x:95,y:7}].map((s,i)=>(
        <motion.div key={`star-${i}`} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`, top:`${s.y}%`, width: i%3===0?3:i%2===0?2:1.5, height: i%3===0?3:i%2===0?2:1.5 }}
          animate={{ opacity:[0.3,1,0.3], scale:[0.8,1.2,0.8] }}
          transition={{ duration:2+i*0.4, repeat:Infinity, delay:i*0.3, ease:'easeInOut' }}
        />
      ))}
      {[{x:-5,y:28,w:380,op:0.18},{x:30,y:22,w:280,op:0.12},{x:60,y:32,w:320,op:0.15},{x:75,y:25,w:260,op:0.1}].map((c,i)=>(
        <motion.div key={`cloud-${i}`} className="absolute pointer-events-none" style={{ left:`${c.x}%`, top:`${c.y}%`, width:c.w, height:60, borderRadius:40, background:'rgba(255,255,255,0.9)', filter:'blur(22px)', opacity:c.op }}
          animate={{ x:[0,30,0], opacity:[c.op, c.op*1.5, c.op] }}
          transition={{ duration:18+i*4, repeat:Infinity, ease:'easeInOut', delay:i*3 }}
        />
      ))}
      <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ bottom: '30%' }}>
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" style={{ width:'100%', height:260, display:'block' }}>
          <defs>
            <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a7fa0" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="#2d5f80" stopOpacity="0.65"/>
            </linearGradient>
          </defs>
          <path d="M0,300 L0,210 L60,165 L120,200 L200,130 L280,175 L360,105 L450,165 L520,95 L610,160 L680,85 L760,155 L840,70 L930,145 L1010,80 L1100,155 L1180,90 L1280,160 L1360,100 L1440,155 L1440,300Z" fill="url(#mtn1)" />
          {[[200,130],[360,105],[520,95],[680,85],[840,70],[1010,80],[1180,90]].map(([cx,cy],i)=>(
            <polygon key={i} points={`${cx},${cy} ${cx-22},${cy+30} ${cx+22},${cy+30}`} fill="rgba(220,235,245,0.55)" />
          ))}
        </svg>
      </div>
      <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ bottom: '22%' }}>
        <svg viewBox="0 0 1440 280" preserveAspectRatio="none" style={{ width:'100%', height:220, display:'block' }}>
          <defs>
            <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a4a2e"/><stop offset="60%" stopColor="#0d3320"/><stop offset="100%" stopColor="#0a2818"/>
            </linearGradient>
            <linearGradient id="mtn2mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a9080" stopOpacity="0.35"/><stop offset="100%" stopColor="#4a9080" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,280 L0,190 L90,140 L170,185 L260,120 L350,175 L430,105 L530,168 L615,95 L710,170 L790,108 L890,178 L975,100 L1070,172 L1155,110 L1250,178 L1340,115 L1440,175 L1440,280Z" fill="url(#mtn2)" />
          <path d="M0,280 L0,210 C180,195 360,200 540,190 C720,180 900,195 1080,188 C1260,181 1380,195 1440,200 L1440,280Z" fill="url(#mtn2mist)" />
        </svg>
      </div>
      <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ bottom: '15%' }}>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ width:'100%', height:160, display:'block' }}>
          <defs>
            <linearGradient id="mtn3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d2e1a"/><stop offset="100%" stopColor="#061410"/>
            </linearGradient>
          </defs>
          <path d="M0,200 L0,130 L80,90 L150,125 L230,70 L310,115 L390,55 L480,110 L565,60 L660,115 L740,65 L830,118 L915,58 L1010,120 L1095,62 L1190,118 L1275,68 L1370,120 L1440,75 L1440,200Z" fill="url(#mtn3)" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%' }}>
        <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, #0d4a5a 0%, #0a3545 40%, #062530 100%)' }} />
      </div>
      {[12,28,45,62,78,88].map((top,i)=>(
        <motion.div key={`wl-${i}`} className="absolute left-0 right-0 pointer-events-none"
          style={{ bottom:`${top * 0.18}%`, height:1, background:'linear-gradient(to right, transparent, rgba(100,200,220,0.3), rgba(150,230,240,0.5), rgba(100,200,220,0.3), transparent)' }}
          animate={{ opacity:[0.2,0.7,0.2], scaleX:[0.8,1,0.8] }}
          transition={{ duration:3+i*0.7, repeat:Infinity, delay:i*0.5, ease:'easeInOut' }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height:'18%', opacity:0.25 }}>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ width:'100%', height:'100%', transform:'scaleY(-0.4)', transformOrigin:'top' }}>
          <path d="M0,100 L0,40 L80,10 L150,35 L230,0 L310,25 L390,0 L480,20 L565,0 L660,25 L740,5 L830,28 L915,0 L1010,30 L1095,2 L1190,28 L1275,8 L1370,30 L1440,0 L1440,100Z" fill="#0d4a5a" />
        </svg>
      </div>
      {FISH_DATA.slice(0,5).map((f,i)=>(
        <motion.div key={`lf-${i}`} className="absolute pointer-events-none" style={{ color:'rgba(100,210,200,0.45)', top:`${82 + (i%3)*2}%` }}
          initial={{ x: f.dir>0 ? '-8vw' : '108vw' }}
          animate={{ x: f.dir>0 ? '108vw' : '-8vw', y:[0, Math.sin(i)*8, 0], opacity:[0,0.6,0.6,0] }}
          transition={{ duration:f.dur, repeat:Infinity, delay:f.delay, ease:'linear' }}
        >
          <Fish size={f.size * 0.7} className={f.dir<0 ? 'scale-x-[-1]' : ''} />
        </motion.div>
      ))}

      {/* ── LOGIN CARD ── glassmorphism */}
      <motion.div
        initial={{ opacity:0, y:24, scale:0.97 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ delay:0.3, duration:0.6, ease:[0.22,1,0.36,1] }}
        className="relative z-10 w-full max-w-xs"
        style={{ filter:'drop-shadow(0 25px 60px rgba(0,0,0,0.5))' }}
      >
        <div style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:28, padding:'36px 32px 32px' }}>
          <div className="flex flex-col items-center mb-7">
            <div className="relative w-14 h-14 mb-3">
              <div className="absolute inset-0 rounded-2xl" style={{ background:'linear-gradient(135deg,#4f46e5,#0f172a)', boxShadow:'0 8px 32px rgba(79,70,229,0.4)' }}/>
              <div className="relative h-full w-full grid grid-cols-2 grid-rows-2 p-2.5 gap-1">
                <Fish size={13} className="text-white/35"/>
                <Fish size={13} className="text-white/35"/>
                <Fish size={13} className="text-white/35"/>
                <div className="flex items-center justify-center"><CheckCircle2 size={15} className="text-cyan-300" /></div>
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color:'#fff', textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>
              CERTI<span style={{ color:'#7dd3fc' }}>MAR</span>
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase mt-1" style={{ color:'rgba(255,255,255,0.55)' }}>Norma 1511 — Puerto Aysén</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'google' ? (
              <motion.div key="google-step" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} className="space-y-3">
                <p className="text-center text-sm font-medium mb-4" style={{ color:'rgba(255,255,255,0.7)' }}>
                  Inicia sesión con tu cuenta institucional
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-wait"
                  style={{ background:'rgba(255,255,255,0.92)', color:'#3c4043', boxShadow:'0 2px 12px rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.5)' }}
                >
                  {loading ? (
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                </button>
                {error && <p className="text-center text-xs font-medium mt-2" style={{ color:'#fca5a5' }}>{error}</p>}
                <p className="text-center text-[10px] mt-3" style={{ color:'rgba(255,255,255,0.35)' }}>Solo cuentas @certimar.cl</p>
              </motion.div>
            ) : (
              <motion.div key="pin-step" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={()=>{setStep('google');setPin('');setError('');}} className="text-white/50 hover:text-white/80 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  </button>
                  <p className="text-sm font-medium" style={{ color:'rgba(255,255,255,0.8)' }}>
                    Acceso a <span className="text-cyan-300 font-bold">Operaciones</span>
                  </p>
                </div>
                <p className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>
                  Cuenta: <span className="text-white/70">{googleEmail}</span>
                </p>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>
                    PIN Administrador <span className="normal-case font-normal opacity-70">(dejar vacío = solo lectura)</span>
                  </label>
                  <input
                    type="password"
                    value={pin}
                    autoFocus
                    onChange={(e)=>{setPin(e.target.value);setError('');}}
                    onKeyDown={(e)=>e.key==='Enter'&&handlePin()}
                    placeholder="••••"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none text-center tracking-[0.5em] font-bold"
                    style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', caretColor:'#7dd3fc' }}
                  />
                </div>
                {error && <p className="text-xs font-medium" style={{ color:'#fca5a5' }}>{error}</p>}
                <button onClick={handlePin}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background:'linear-gradient(135deg,#4f46e5,#3730a3)', color:'#fff', boxShadow:'0 4px 20px rgba(79,70,229,0.5)' }}
                >
                  Ingresar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── IndexedDB — almacenamiento de imágenes (sin límite de quota) ────────────
const IDB_NAME = 'certimar-images-v1';
const IDB_STORE = 'urls';

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}
async function idbSave(id: string, url: string) {
  const db = await idbOpen();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(url, id);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
async function idbDelete(id: string) {
  const db = await idbOpen();
  return new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => res();
  });
}
async function idbGetAll(): Promise<Record<string, string>> {
  const db = await idbOpen();
  return new Promise((res) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const result: Record<string, string> = {};
    const curReq = store.openCursor();
    curReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) { result[cursor.key as string] = cursor.value; cursor.continue(); }
      else res(result);
    };
  });
}
async function idbClear() {
  const db = await idbOpen();
  return new Promise<void>((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = () => res();
  });
}

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'general' | 'extraction' | 'denaturation' | 'storage' | 'report' | 'issue' | 'history'>('general');
  const [state, setState] = useState<AppState>(() => {
    const SCHEMA_VERSION = 'v3';
    try {
      const raw = localStorage.getItem('certimar-draft-state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.__version === SCHEMA_VERSION) {
          // Limpiar URLs antiguas (blob: o base64 guardadas por error en localStorage)
          parsed.images = (parsed.images ?? []).map((img: any) => ({ ...img, url: '' }));
          return parsed;
        }
        localStorage.removeItem('certimar-draft-state');
      }
    } catch {}
    return DEFAULT_STATE;
  });

  // Restaurar URLs de imágenes desde IndexedDB al montar
  const [imagesRestoring, setImagesRestoring] = useState(false);
  useEffect(() => {
    setImagesRestoring(true);
    idbGetAll().then(urlMap => {
      if (Object.keys(urlMap).length) {
        setState(prev => ({
          ...prev,
          images: prev.images.map(img => ({ ...img, url: urlMap[img.id] ?? img.url }))
        }));
      }
    }).finally(() => setImagesRestoring(false));
  }, []); // solo al montar

  // Auto-guardado en localStorage — SIN URLs (van en IndexedDB)
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveAnim, setSaveAnim] = useState(false);
  const [guardadoSection, setGuardadoSection] = useState<string | null>(null);
  const [guardandoSection, setGuardandoSection] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const stateForStorage = {
      ...state,
      images: state.images.map(({ id, seccion, leyenda, estado, observacion }) =>
        ({ id, seccion, leyenda, estado, observacion, url: '' })
      ),
      __version: 'v3',
    };
    try {
      localStorage.setItem('certimar-draft-state', JSON.stringify(stateForStorage));
    } catch { /* quota — no crítico, imágenes están en IndexedDB */ }
    setSavedAt(new Date());
    setSaveAnim(true);
    const t = setTimeout(() => setSaveAnim(false), 1800);
    return () => clearTimeout(t);
  }, [state]);

  const savedLabel = useCallback(() => {
    if (!savedAt) return null;
    const diff = Math.floor((Date.now() - savedAt.getTime()) / 1000);
    if (diff < 5)  return 'ahora mismo';
    if (diff < 60) return `hace ${diff}s`;
    return `hace ${Math.floor(diff / 60)}min`;
  }, [savedAt]);

  const resetState = () => {
    if (window.confirm("¿Está seguro de que desea borrar el borrador actual y comenzar de nuevo?")) {
      idbClear();
      setState(DEFAULT_STATE);
      localStorage.removeItem('certimar-draft-state');
      setActiveTab('general');
    }
  };

  // Nuevo registro — limpia datos del centro pero preserva el certificador
  const newRecord = () => {
    if (window.confirm('¿Iniciar un nuevo registro?\nSe limpiarán los datos del centro, extracción, desnaturalización, almacenamiento e imágenes.\nLos datos del certificador se conservan.')) {
      idbClear();
      setState(prev => ({
        ...DEFAULT_STATE,
        general: {
          ...DEFAULT_STATE.general,
          certificador: prev.general.certificador,
          fechas: {
            evaluacion_documental: new Date().toISOString().split('T')[0],
            inspeccion_terreno:    new Date().toISOString().split('T')[0],
            emision_certificado:   new Date().toISOString().split('T')[0],
          },
        },
      }));
      setActiveTab('general');
    }
  };

  // Correlativo interno REG-001…
  const getNextCorrelativo = (): { registroId: string; nextCounter: number } => {
    const raw = localStorage.getItem('certimar-correlativo-counter');
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    return { registroId: `REG-${String(next).padStart(3, '0')}`, nextCounter: next };
  };

  const comenzarRegistro = () => {
    if (window.confirm(
      '¿Comenzar un nuevo registro?\nSe asignará un correlativo y se limpiarán los datos del centro, extracción, desnaturalización, almacenamiento e imágenes.\nLos datos del certificador se conservan.'
    )) {
      idbClear();
      const { registroId, nextCounter } = getNextCorrelativo();
      localStorage.setItem('certimar-correlativo-counter', String(nextCounter));
      setState(prev => ({
        ...DEFAULT_STATE,
        registroId,
        general: {
          ...DEFAULT_STATE.general,
          certificador: prev.general.certificador,
          fechas: {
            evaluacion_documental: new Date().toISOString().split('T')[0],
            inspeccion_terreno:    new Date().toISOString().split('T')[0],
            emision_certificado:   new Date().toISOString().split('T')[0],
          },
        },
      }));
      setActiveTab('general');
    }
  };

  const handleGuardar = async (section: string) => {
    if (guardandoSection) return; // evitar doble-click
    setGuardandoSection(section);
    setSaveError(null);
    let firestoreOk = false;
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const cc = state.general.centro_cultivo;
      const docId = state.registroId ?? `sin-reg_${cc.codigo_centro || 'borrador'}`;
      // Excluir blob URLs de las imágenes — no son portátiles ni aceptadas por Firestore
      const imagesMetadata = state.images.map(({ id, seccion, leyenda, estado, observacion }) =>
        ({ id, seccion, leyenda, estado, observacion })
      );
      await setDoc(doc(db, 'registros', docId), {
        ...state,
        images: imagesMetadata,
        __version: 'v3',
        __savedAt: serverTimestamp(),
        __savedBy: state.general.certificador.nombre || 'desconocido',
        __section: section,
      });
      firestoreOk = true;
    } catch (err: any) {
      console.error('Error guardando en Firestore:', err);
      setSaveError('No se pudo guardar en la nube. Verifica tu conexión.');
      setTimeout(() => setSaveError(null), 4000);
    }
    if (firestoreOk) {
      exportDraft();
      setGuardadoSection(section);
      setTimeout(() => setGuardadoSection(null), 2500);
    }
    setGuardandoSection(null);
  };

  // Exportar borrador como archivo JSON descargable
  const exportDraft = () => {
    const cc = state.general.centro_cultivo;
    const rid = state.registroId ?? 'borrador';
    const code = cc.codigo_centro ? `-${cc.codigo_centro}` : '';
    const filename = `${rid}${code}.json`;
    // URLs son base64 — se exportan completas para preservar imágenes entre sesiones
    const exportState = { ...state, __version: 'v3' };
    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importar borrador desde archivo JSON
  const importDraftRef = useRef<HTMLInputElement>(null);

  // Registro de Visita PDF — almacenado como snapshots JPEG (comprimidos) por página
  const registroVisitaRef = useRef<string[] | null>(null);
  const [registroVisitaName, setRegistroVisitaName] = useState<string | null>(null);
  const [registroVisitaProcessing, setRegistroVisitaProcessing] = useState(false);
  const [registroVisitaProgress, setRegistroVisitaProgress] = useState(0);
  const registroVisitaInputRef = useRef<HTMLInputElement>(null);

  const handleRegistroVisitaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    e.target.value = '';
    setRegistroVisitaProcessing(true);
    setRegistroVisitaProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const snapshots: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx as any, canvas, viewport }).promise;
        snapshots.push(canvas.toDataURL('image/jpeg', 0.80));
        setRegistroVisitaProgress(Math.round((i / pdf.numPages) * 100));
      }
      registroVisitaRef.current = snapshots;
      setRegistroVisitaName(file.name);
    } finally {
      setRegistroVisitaProcessing(false);
      setRegistroVisitaProgress(0);
    }
  };
  const importDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.__version !== 'v3') {
          alert('Versión de borrador incompatible. Solo se pueden cargar borradores exportados con la versión actual de la aplicación.');
          return;
        }
        // Guardar URLs de imágenes en IndexedDB y limpiarlas del estado
        await idbClear();
        const images: ReportImage[] = (parsed.images ?? []).map((img: any) => {
          if (img.url && img.url.startsWith('data:')) {
            idbSave(img.id, img.url); // async, no bloqueante
          }
          return { ...img, url: img.url?.startsWith('data:') ? img.url : '' };
        });
        setState({ ...parsed, images });
        setActiveTab('general');
      } catch {
        alert('Archivo inválido. Selecciona un borrador exportado por esta aplicación.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadTestData = () => {
    const TEST_STATE: AppState = {
      general: {
        certificador: {
          nombre: 'ENGELBERT FLORES',
          rut: '13.968.696-9',
          numero_registro: 'DN-02727-2023',
        },
        centro_cultivo: {
          codigo_centro: '110814',
          nombre_centro: 'PAMELA',
          titular: 'EXPORTADORA LOS FIORDOS LTDA.',
          acs: '24',
          ubicacion: 'CANAL MORALEDA, AL ESTE DE ISLA AUCHILE, Región de Aysén del General Carlos Ibáñez del Campo',
          formato_modulo: '24 jaulas, tipo Metálicas',
          tamano_jaulas: '30 x 30 metros',
          coordenadas_ensilaje: '45°27\'S 72°51\'W',
          nombre_an_ensilaje: 'A/N PAMELA',
        },
        fechas: {
          evaluacion_documental: '2026-01-02',
          inspeccion_terreno: '2026-01-08',
          emision_certificado: '2026-02-10',
        },
      },
      extraction: {
        sistemas_apoyo: { buceo: false, rov: false, succion_yoma: false, automatica: false },
        parametros: {
          numero_total_jaulas: 24,
          jaulas_simultaneas: 3,
          horas_efectivas_trabajo: 9,
          personal_operativo: 4,
          profundidad_operacion_m: 20,
          sistema_principal: 'LIFT-UP (Novatech)',
          talla_pez: 'Grande (>=4.5kg)',
          factor_ajuste_biomasa: 1.0,
          marca_equipo: 'Novatech 10"',
          id_catalogo_equipo: 'novatech-10',
          tipo_compresor: 'Kaeser M50E',
          id_catalogo_compresor: 'kaeser-m50e',
          potencia_cfm: 185,
          capacidad_receptor_bins_litros: 500,
          disponibilidad_base_fd: 0.90,
          motocompresores_por_jaula: 1,
          ubicacion_compresor: 'A/N Pontón',
          observacion_sistema: 'Sistema Automático; Consta de 24 Lift-up / 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla.',
        },
        resultados: { ciclos_por_dia: 0, capacidad_diaria_ton: 0, cumple_norma: false },
      },
      denaturation: {
        equipos: {
          cantidad_sistemas: 1,
          id_catalogo_trituradora: 'acuimaster-ac715',
          id_catalogo_incinerador: '',
          marca_modelo: 'ACUIMASTER AC-715 LT',
          velocidad_nominal_kg_hr: 1500,
          horas_funcionamiento_dia: 9,
          cuenta_con_prepicador: false,
          capacidad_prepicador_kg_hr: 0,
          cuenta_con_recirculacion_acido: true,
          material_construccion: 'Acero inoxidable AISI 304',
          tipo_sistema: 'Ensilaje',
          estado_olla: 'Bueno' as const,
        },
        parametros_batch: { kilos_por_batch: 700, tiempo_procesamiento_min: 15, tiempo_pausa_min: 10 },
        parametros_incineracion: { capacidad_carga_kg_h: 0, temperatura_operacion: '', camara_primaria: '', camara_secundaria: '' },
        incinerador: {
          activo: false,
          id_catalogo: '',
          marca_modelo: '',
          capacidad_carga_kg_h: 0,
          horas_funcionamiento_dia: 8,
          sistema_carga: 'N/A',
          sistema_descarga: 'N/A',
          disposicion_final: 'N/A',
          almacenamiento_gas: 'N/A',
          observaciones: 'INCINERADOR ES EL SISTEMA SECUNDARIO DE DESNATURALIZACIÓN DEL CENTRO DE CULTIVO.',
        },
        generacion_electrica: [],
        resultados: { duracion_total_batch_min: 0, numero_batches_dia: 0, capacidad_ensilaje_ton: 0, capacidad_incinerador_ton: 0, capacidad_diaria_ton: 0, cumple_norma: false, observacion_automatica: '' },
      },
      storage: {
        parametros: { capacidad_almacenaje_m3: 21, factor_densidad: 1.2, observaciones: 'Estanque de acero inoxidable con dique de contención.' },
        infraestructura: {
          pretil_material: 'Hormigón',
          pretil_estado: 'Bueno',
          piping_material: 'HDPE',
          piping_diametro: '2"',
          piping_valvulas: 'Válvula de bola DN50',
          piping_estado: 'Bueno',
          eslora_m: '25',
          manga_m: '8',
          puntual_m: '1.2',
        },
        resultados: { capacidad_almacenaje_ton: 0, cumple_norma: false },
      },
      images: [],
    };
    const hasData = state.general.centro_cultivo.codigo_centro || state.general.centro_cultivo.nombre_centro;
    if (hasData && !window.confirm('¿Cargar datos de prueba?\nSe sobrescribirán los datos actuales.')) return;
    setState(TEST_STATE);
    setActiveTab('general');
  };
  const centerCodeRef = useRef<HTMLInputElement>(null);
  const SESSION_KEY = 'certimar-session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas

  const readSession = (): { role: 'admin' | 'reader'; expiry: number } | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s?.role || !s?.expiry || Date.now() > s.expiry) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch { return null; }
  };

  const savedSession = readSession();
  const [showWelcome, setShowWelcome] = useState(!savedSession);
  const [userRole, setUserRole] = useState<'admin' | 'reader' | null>(savedSession?.role ?? null);
  const isAdmin = userRole === 'admin';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  // Auto-colapsar sidebar en móvil
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsSidebarCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certimar-dark-mode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [showHints, setShowHints] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certimar-show-hints');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('certimar-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('certimar-show-hints', JSON.stringify(showHints));
  }, [showHints]);

  useEffect(() => {
    if (!showWelcome && centerCodeRef.current) {
      centerCodeRef.current.focus();
    }
  }, [showWelcome]);

  // Auto-genera la observación del sistema de extracción al cambiar nº jaulas o sistema
  useEffect(() => {
    const { numero_total_jaulas, sistema_principal, observacion_sistema } = state.extraction.parametros;
    const autoObs = `Sistema Automático; Consta de ${numero_total_jaulas} ${sistema_principal} / 1 por Jaula, con cono extractor el cual está amarrado al fondo de la malla.`;
    const isDefault = !observacion_sistema || /^Sistema Automático; Consta de \d+/.test(observacion_sistema);
    if (isDefault) {
      setState(prev => ({
        ...prev,
        extraction: {
          ...prev.extraction,
          parametros: { ...prev.extraction.parametros, observacion_sistema: autoObs }
        }
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.extraction.parametros.numero_total_jaulas, state.extraction.parametros.sistema_principal]);

  const handleCenterCodeChange = (code: string, center?: ConcesionCentro) => {
    if (center) {
      // center.nombre = descripción geográfica del sector (ej. "CANAL MORALEDA, AL ESTE DE ISLA AUCHILE")
      // La ubicación completa = sector + región oficial según prefijo de código
      const region = center.codigo.startsWith('120')
        ? 'Región de Magallanes y de la Antártica Chilena'
        : 'Región de Aysén del General Carlos Ibáñez del Campo';
      const ubicacionCompleta = `${center.nombre}, ${region}`;
      setState(prev => ({
        ...prev,
        general: {
          ...prev.general,
          centro_cultivo: {
            ...prev.general.centro_cultivo,
            codigo_centro: center.codigo,
            nombre_centro: center.nombre_centro ?? "",  // el usuario lo completa
            titular: center.titular,
            acs: center.acs,
            ubicacion: ubicacionCompleta
          }
        }
      }));
    } else {
      updateGeneral('centro_cultivo.codigo_centro', code);
    }
  };

  // --- Calculations ---
  // Las fórmulas están en src/domain/calculations.ts (funciones puras testeables).
  // Res. Exenta N°1511/2021 — Umbrales: Extracción ≥15 TN/día, Desnaturalización ≥15 TN/día, Almacenamiento ≥20 TN.

  const calculatedExtraction = useMemo(
    () => calculateExtraction(state.extraction.parametros),
    [state.extraction.parametros]
  );

  const calculatedDenaturation = useMemo(
    () => calculateDenaturation(
      state.denaturation.equipos,
      state.denaturation.parametros_batch,
      state.denaturation.parametros_incineracion,
      state.denaturation.incinerador
    ),
    [state.denaturation.equipos, state.denaturation.parametros_batch, state.denaturation.parametros_incineracion, state.denaturation.incinerador]
  );

  const calculatedStorage = useMemo(
    () => calculateStorage(state.storage.parametros),
    [state.storage.parametros]
  );

  // Sync results to state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      extraction: { ...prev.extraction, resultados: calculatedExtraction },
      denaturation: { ...prev.denaturation, resultados: calculatedDenaturation },
      storage: { ...prev.storage, resultados: calculatedStorage }
    }));
  }, [calculatedExtraction, calculatedDenaturation, calculatedStorage]);

  const canEmit = useMemo(() => {
    return calculatedExtraction.cumple_norma &&
           calculatedDenaturation.cumple_norma &&
           calculatedStorage.cumple_norma;
  }, [calculatedExtraction, calculatedDenaturation, calculatedStorage]);

  const hasImages = state.images.length > 0;
  const [generating, setGenerating] = useState<'certificado'|'informe'|'acta'|null>(null);

  // Chequeo previo: verifica concordancia de capacidades entre los 3 documentos
  const checkCapacidades = (): string[] => {
    const issues: string[] = [];

    // Campos obligatorios de identificación
    const cc = state.general.centro_cultivo;
    if (!cc.codigo_centro.trim())   issues.push('Falta: Código de Centro');
    if (!cc.nombre_centro.trim())   issues.push('Falta: Nombre del Centro');
    if (!cc.titular.trim())         issues.push('Falta: Titular / Empresa');
    if (!cc.acs.trim())             issues.push('Falta: A.C.S / RNA');
    if (!cc.ubicacion.trim())       issues.push('Falta: Ubicación del Centro');

    // Parámetros técnicos mínimos
    if (state.extraction.parametros.numero_total_jaulas <= 0)
      issues.push('Falta: Número total de jaulas (Extracción)');
    if (state.extraction.parametros.potencia_cfm <= 0)
      issues.push('Falta: Potencia del compresor en CFM (Extracción)');
    if (state.denaturation.equipos.velocidad_nominal_kg_hr <= 0)
      issues.push('Falta: Velocidad nominal de la olla (Desnaturalización)');
    if (state.storage.parametros.capacidad_almacenaje_m3 <= 0)
      issues.push('Falta: Capacidad de almacenaje en m³');

    // Cumplimiento normativo
    if (!calculatedExtraction.cumple_norma)
      issues.push(`Extracción: ${calculatedExtraction.capacidad_diaria_ton.toFixed(2)} TN/día (mín. 15)`);
    if (!calculatedDenaturation.cumple_norma)
      issues.push(`Desnaturalización: ${calculatedDenaturation.capacidad_diaria_ton.toFixed(2)} TN/día (mín. 15)`);
    if (!calculatedStorage.cumple_norma)
      issues.push(`Almacenamiento: ${calculatedStorage.capacidad_almacenaje_ton.toFixed(2)} TN (mín. 20)`);

    return issues;
  };

  const formatDateES = (iso: string): string => {
    if (!iso) return '—';
    const [year, month, day] = iso.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${parseInt(day)} de ${months[parseInt(month)-1]} del ${year}`;
  };

  const makeDocCode = (codigo: string, fecha: string): string => {
    if (!fecha) return `${codigo}MOR`;
    const [year, month, day] = fecha.split('-');
    return `${codigo}${day}${month}${year.slice(2)}MOR`;
  };

  // --- Handlers ---
  const handleSelectExtractionSystem = (id: string) => {
    const system = CATALOGO_EXTRACCION.sistemas.find(s => s.id === id);
    if (system) {
      setState(prev => ({
        ...prev,
        extraction: {
          ...prev.extraction,
          parametros: {
            ...prev.extraction.parametros,
            id_catalogo_equipo: id,
            marca_equipo: `${system.marca} ${system.modelo}`,
          }
        }
      }));
    }
  };

  const handleSelectCompressor = (id: string) => {
    const comp = CATALOGO_EXTRACCION.compresores.find(c => c.id === id);
    if (comp) {
      setState(prev => ({
        ...prev,
        extraction: {
          ...prev.extraction,
          parametros: {
            ...prev.extraction.parametros,
            id_catalogo_compresor: id,
            tipo_compresor: `${comp.marca} ${comp.modelo}`,
            potencia_cfm: comp.cfm
          }
        }
      }));
    }
  };

  const handleSelectTrituradora = (id: string) => {
    const tri = CATALOGO_DESNATURALIZACION.trituradoras.find(t => t.id === id);
    if (tri) {
      setState(prev => ({
        ...prev,
        denaturation: {
          ...prev.denaturation,
          equipos: {
            ...prev.denaturation.equipos,
            id_catalogo_trituradora: id,
            marca_modelo: tri.marca_modelo,
            velocidad_nominal_kg_hr: tri.capacidad_nominal_kg_h,
            material_construccion: tri.material,
            capacidad_prepicador_kg_hr: tri.capacidad_prepicador_kg_h || 0
          }
        }
      }));
    }
  };

  const handleSelectIncinerador = (id: string) => {
    const inc = CATALOGO_DESNATURALIZACION.incineradores.find(i => i.id === id);
    if (inc) {
      setState(prev => ({
        ...prev,
        denaturation: {
          ...prev.denaturation,
          equipos: {
            ...prev.denaturation.equipos,
            id_catalogo_incinerador: id,
            marca_modelo: inc.marca_modelo,
          },
          parametros_incineracion: {
            capacidad_carga_kg_h: inc.capacidad_carga_kg_h,
            temperatura_operacion: `${inc.temperatura_camara_primaria_c}°C / ${inc.temperatura_camara_secundaria_c}°C`,
            camara_primaria: `${inc.camara_primaria} — ${inc.num_quemadores_primaria} quemador(es)`,
            camara_secundaria: `${inc.camara_secundaria} — ${inc.num_quemadores_secundaria} quemador(es)`,
          }
        }
      }));
    }
  };

  const handleSelectIncineradorSecundario = (id: string) => {
    const inc = CATALOGO_DESNATURALIZACION.incineradores.find(i => i.id === id);
    setState(prev => ({
      ...prev,
      denaturation: {
        ...prev.denaturation,
        incinerador: {
          ...prev.denaturation.incinerador,
          id_catalogo: id,
          marca_modelo:         inc?.marca_modelo         ?? '',
          capacidad_carga_kg_h: inc?.capacidad_carga_kg_h ?? 0,
          horas_funcionamiento_dia: inc?.horas_funcionamiento ?? 8,
          sistema_carga:        inc?.sistema_carga        ?? 'N/A',
          sistema_descarga:     inc?.sistema_descarga      ?? 'N/A',
          disposicion_final:    inc?.disposicion_final     ?? 'N/A',
          almacenamiento_gas:   inc?.almacenamiento_gas   ?? 'N/A',
          observaciones:        inc?.observaciones        ?? '',
        }
      }
    }));
  };

  const handleSelectGenerator = (index: number, id: string) => {
    const gen = CATALOGO_GENERADORES.find(g => g.id === id);
    if (gen) {
      const newGens = [...state.denaturation.generacion_electrica];
      newGens[index] = { ...newGens[index], marca: gen.marca, modelo: gen.modelo, capacidad_kva: gen.kva };
      setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
    }
  };

  const handleUpdateGenerator = (index: number, field: string, value: any) => {
    const newGens = [...state.denaturation.generacion_electrica];
    (newGens[index] as any)[field] = value;
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
  };

  const handleAddGenerator = () => {
    const newGen = { tipo: 'Principal', marca: '', modelo: '', capacidad_kva: 0, ubicacion: '' };
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: [...prev.denaturation.generacion_electrica, newGen] } }));
  };

  const handleRemoveGenerator = (index: number) => {
    const newGens = state.denaturation.generacion_electrica.filter((_, i) => i !== index);
    setState(prev => ({ ...prev, denaturation: { ...prev.denaturation, generacion_electrica: newGens } }));
  };

  const updateGeneral = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [section]: {
          ...(prev.general as any)[section],
          [key]: value
        }
      }
    }));
  };

  const updateExtraction = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      extraction: {
        ...prev.extraction,
        [section]: {
          ...(prev.extraction as any)[section],
          [key]: value
        }
      }
    }));
  };

  const updateDenaturation = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      denaturation: {
        ...prev.denaturation,
        [section]: {
          ...(prev.denaturation as any)[section],
          [key]: value
        }
      }
    }));
  };

  const updateStorage = (field: string, value: any) => {
    const [section, key] = field.split('.');
    setState(prev => ({
      ...prev,
      storage: {
        ...prev.storage,
        [section]: {
          ...(prev.storage as any)[section],
          [key]: value
        }
      }
    }));
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1400; // px lado largo máximo
          const QUALITY = 0.78;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
            else                 { width  = Math.round(width  * MAX / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', QUALITY));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const [imagesUploadProgress, setImagesUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [aiClassifying, setAiClassifying] = useState<Set<string>>(new Set());
  const [aiMeta, setAiMeta] = useState<Record<string, { confianza: number; justificacion: string }>>({});

  const addImage = (files: File[]) => {
    if (!files.length) return;
    setImagesUploadProgress({ done: 0, total: files.length });
    let done = 0;
    files.forEach(async (file) => {
      const base64 = await compressImage(file);
      const id = Math.random().toString(36).substr(2, 9);
      await idbSave(id, base64);
      const newImg: ReportImage = {
        id, url: base64,
        seccion: 'General', leyenda: '', estado: 'Verde',
        observacion: 'CUMPLE CON LO DECLARADO',
      };
      setState(prev => ({ ...prev, images: [...prev.images, newImg] }));
      done += 1;
      if (done >= files.length) {
        setImagesUploadProgress(null);
      } else {
        setImagesUploadProgress({ done, total: files.length });
      }

      // Clasificación IA — no bloquea la subida
      if (CLAUDE_API_KEY) {
        setAiClassifying(prev => new Set(prev).add(id));
        classifyImage(base64).then(result => {
          if (result) {
            setState(prev => ({
              ...prev,
              images: prev.images.map(img =>
                img.id === id ? { ...img, seccion: result.seccion } : img
              ),
            }));
            setAiMeta(prev => ({ ...prev, [id]: { confianza: result.confianza, justificacion: result.justificacion } }));
          }
          setAiClassifying(prev => { const s = new Set(prev); s.delete(id); return s; });
        });
      }
    });
  };

  const removeImage = (id: string) => {
    idbDelete(id);
    setState(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const updateImage = (id: string, updates: Partial<ReportImage>) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, ...updates } : img)
    }));
  };

  // ─── Helpers PDF compartidos ───────────────────────────────────────────────

  /** Corrige orientación EXIF dibujando la imagen en un canvas offscreen */
  const fixImageOrientation = (url: string): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const MAX_PX = 1920;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX_PX || h > MAX_PX) {
          if (w >= h) { h = Math.round(h * MAX_PX / w); w = MAX_PX; }
          else        { w = Math.round(w * MAX_PX / h); h = MAX_PX; }
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });

  const loadLogo = async (): Promise<string | null> => {
    try {
      const resp = await fetch('/certimar-logo.png');
      const blob = await resp.blob();
      return new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;

  const CLASSIFY_SYSTEM = `Actúa como un experto certificador ambiental de la industria acuícola chilena (Norma D.S. N° 320 y Res. 1511).
Tu tarea es analizar la imagen proporcionada de un centro de cultivo de salmones y clasificarla estrictamente en UNA de las siguientes categorías, devolviendo la respuesta en formato JSON.

CATEGORÍAS PERMITIDAS Y SUS CARACTERÍSTICAS:
1. "PORTADA": Vistas aéreas, paisajes marítimos, vista general de pontones o jaulas de cultivo.
2. "UBICACION": Vistas de dron o satélite mostrando la cuadrícula de jaulas en el mar, para ubicar espacialmente el centro.
3. "EXTRACCION": Compresores de aire industriales, mangas neumáticas, bins plásticos de transporte, tuberías de HDPE y válvulas asociadas a las jaulas.
4. "DESNATURALIZACION": Ollas trituradoras de acero inoxidable (ensilaje), motores prepicadores, tableros eléctricos de control, bombas de ácido, mesas de necropsia, lavaojos de emergencia, extintores, o chimeneas/cámaras de incineradores.
5. "ALMACENAMIENTO": Estanques cúbicos IBC (blancos con rejilla), grandes plataformas de fondeo, agrupaciones de bidones azules.
6. "GENERAL": Fotografías de hojas de papel, actas de inspección, escritura a mano, firmas, o imágenes que no encajan en las anteriores.

INSTRUCCIONES ADICIONALES:
- Si detectas acero inoxidable cilíndrico, es altamente probable que sea "DESNATURALIZACION".
- Si la imagen es claramente aérea/dron mostrando jaulas en cuadrícula en el mar, usa "UBICACION".
- Si la imagen es una panorámica del centro o fachada del pontón, usa "PORTADA".

FORMATO DE SALIDA (Solo JSON puro, sin markdown):
{"categoria_sugerida":"NOMBRE","confianza":0.95,"justificacion_breve":"..."}`;

  const AI_SECCION_MAP: Record<string, ImageSeccion> = {
    PORTADA: 'Portada',
    UBICACION: 'Ubicación Espacial',
    EXTRACCION: 'Extracción',
    DESNATURALIZACION: 'Desnaturalización',
    ALMACENAMIENTO: 'Almacenamiento',
    GENERAL: 'General',
  };

  async function classifyImage(base64: string): Promise<{ seccion: ImageSeccion; confianza: number; justificacion: string } | null> {
    if (!CLAUDE_API_KEY) return null;
    try {
      const mediaType = base64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const imageData = base64.split(',')[1];
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          system: CLASSIFY_SYSTEM,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: 'Clasifica esta imagen.' }
          ]}],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text);
      const seccion: ImageSeccion = AI_SECCION_MAP[parsed.categoria_sugerida] ?? 'General';
      return { seccion, confianza: parsed.confianza ?? 0, justificacion: parsed.justificacion_breve ?? '' };
    } catch {
      return null;
    }
  }

  const addInformePageFrame = (doc: jsPDF, docCode: string, logo: string | null, pageLabel: string) => {
    const n = (doc as any).internal.getNumberOfPages();
    // Empieza en la p.2 — la portada (p.1) tiene su propio diseño de cabecera/pie
    for (let i = 2; i <= n; i++) {
      doc.setPage(i);
      const W = 215.9, H = 279.4;

      // ── Helper onda decorativa #a8c8e8 — con opacidad para no tapar el texto ──
      const gState25 = (doc as any).GState({ opacity: 0.25, 'fill-opacity': 0.25 });
      const gState100 = (doc as any).GState({ opacity: 1, 'fill-opacity': 1 });
      const drawWave = (y0: number, amp: number) => {
        doc.setDrawColor(168, 200, 232);
        doc.setLineWidth(0.35);
        const w = W / 4;
        doc.lines(
          [[w*0.38,-amp,w*0.62,-amp,w,0],[w*0.38,amp,w*0.62,amp,w,0],
           [w*0.38,-amp,w*0.62,-amp,w,0],[w*0.38,amp,w*0.62,amp,w,0]],
          0, y0, [1, 1], 'S', false
        );
      };
      // Las ondas del cuerpo se dibujan ANTES del contenido (via drawBodyWaves) para
      // quedar detrás del texto. Aquí solo dibujamos header + footer.

      // ── Header: fondo blanco + ondas + logo izquierda + banda azul marino ──
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, 22, 'F');
      // Ondas decorativas sobre fondo blanco del header (también con opacidad)
      doc.setGState(gState25);
      [4, 8, 12, 16].forEach((y, idx) =>
        drawWave(y, 1.0 + (idx % 3) * 0.35)
      );
      doc.setGState(gState100);
      // Logo a la izquierda
      if (logo) {
        const props = doc.getImageProperties(logo);
        const maxW = 30, maxH = 15;
        const scale = Math.min(maxW / props.width, maxH / props.height);
        const imgW = props.width * scale, imgH = props.height * scale;
        doc.addImage(logo, 'PNG', 3 + (maxW - imgW) / 2, 2 + (maxH - imgH) / 2, imgW, imgH);
      }
      // Normativa y folio
      doc.setTextColor(26, 58, 92);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('Res. Exenta N°1511/2021 — D.S. N°320', 37, 6);
      doc.setFont('helvetica', 'bold');
      doc.text(docCode, W - 5, 6, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text(pageLabel, W - 5, 12, { align: 'right' });
      // Banda azul marino al pie del header (subida)
      doc.setFillColor(26, 58, 92);
      doc.rect(0, 17, W, 4, 'F');
      doc.setFillColor(10, 28, 70);
      doc.rect(0, 21, W, 0.8, 'F');

      // ── Footer liviano (igual que certificado) ──
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.18);
      doc.line(10, H - 10, W - 10, H - 10);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(26, 58, 92);
      doc.text('CERTIMAR SPA — Res. Exenta N°1511/2021', 10, H - 6);
      doc.setTextColor(120, 120, 120);
      doc.text('Mario Toral 101, Puerto Aysén  ·  +56 9 45052052  ·  eflores@certimar.cl',
               W / 2, H - 6, { align: 'center' });
      doc.setTextColor(26, 58, 92);
      doc.text(`Pág. ${i} de ${n}`, W - 10, H - 6, { align: 'right' });
    }
  };

  const addActaFooter = (doc: jsPDF) => {
    const n = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(180, 180, 180);
      doc.line(14, 289, 196, 289);
      doc.text('CERTIMAR SPA — Res. Exenta N°1511/2021 — D.S. (MINECON) N°15/2011', 14, 293);
      doc.text(`Pág. ${i}/${n}`, 196, 293, { align: 'right' });
    }
  };

  // ─── CERTIFICADO ───────────────────────────────────────────────────────────
  const generateCertificadoPDF = async () => {
    const issues = checkCapacidades();
    if (issues.length > 0) {
      const msg = `Advertencia de capacidades:\n${issues.join('\n')}\n\n¿Generar certificado de todas formas?`;
      if (!window.confirm(msg)) return;
    }
    setGenerating('certificado');
    try {
      const logo = await loadLogo();
      const stateWithCalc = {
        ...state,
        extraction:   { ...state.extraction,   resultados: calculatedExtraction },
        denaturation: { ...state.denaturation, resultados: calculatedDenaturation },
        storage:      { ...state.storage,      resultados: calculatedStorage },
      };
      const cert   = buildCertificadoData(stateWithCalc);
      const codigo = state.general.centro_cultivo.codigo_centro;

      const AZUL: [number, number, number]    = [15, 40, 90];
      const VERDE: [number, number, number]   = [22, 101, 52];
      const ROJO: [number, number, number]    = [185, 28, 28];
      const GRIS: [number, number, number]    = [248, 250, 252];
      const fmtC = (c: boolean) => c ? 'CUMPLE' : 'NO CUMPLE';
      const colC = (c: boolean): [number,number,number] => c ? VERDE : ROJO;

      const doc = new jsPDF({ compress: true });

      // Header blanco con acento azul — decoración sutil solo en la cabecera
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setFillColor(...AZUL);
      doc.rect(0, 32, 210, 6, 'F');
      doc.setFillColor(10, 28, 70);
      doc.rect(0, 37, 210, 1.5, 'F');

// ── Ondas decorativas + salmones acuarelados en el banner ─────────────
        // (() => {
        //   // Ondas horizontales (se mantienen sin cambios)
        //   const drawOnda = (x0: number, y0: number, totalW: number, amp: number) => {
        //     const w = totalW / 4;
        //     doc.lines([
        //       [w*0.38, -amp, w*0.62, -amp, w, 0],
        //       [w*0.38,  amp, w*0.62,  amp, w, 0],
        //       [w*0.38, -amp, w*0.62, -amp, w, 0],
        //       [w*0.38,  amp, w*0.62,  amp, w, 0],
        //     ], x0, y0, [1, 1], 'S', false);
        //   };
        //   doc.setDrawColor(95, 155, 210);
        //   ([
        //     [7,  2.0, 0.34],
        //     [14, 1.5, 0.28],
        //     [21, 2.3, 0.38],
        //     [29, 1.4, 0.26],
        //     [37, 1.9, 0.32],
        //   ] as [number,number,number][]).forEach(([y, amp, lw]) => {
        //     doc.setGState((doc as any).GState({ opacity: 0.30, 'fill-opacity': 0.30 }));
        //     doc.setLineWidth(lw);
        //     drawOnda(0, y, 212, amp);
        //   });

        //   // ─── Salmones acuarelados: canvas → PNG con canal alfa ───────────────
        //   //
        //   // Cada salmón se renderiza en un <canvas> offscreen usando globalAlpha
        //   // para fijar la opacidad final en el pixel. El PNG resultante preserva
        //   // la transparencia y jsPDF lo compone sobre el fondo sin afectar el texto.
        //   //
        //   // Orden de capas dentro del banner:
        //   //   1. Fondo blanco (existente)
        //   //   2. Líneas onduladas (arriba)
        //   //   3. ← Salmones aquí (opacidad 0.12-0.15)
        //   //   4. Logo, textos y barra azul (encima de todo)
        //   //
        //   const makeSalmonPng = (
        //     mmW: number, mmH: number,
        //     baseHex: string, facingLeft: boolean, alpha: number
        //   ): string => {
        //     const PX = 3;                                   // 3 px / mm → buena resolución
        //     const W  = Math.round(mmW * PX);
        //     const H  = Math.round(mmH * PX);
        //     const cv = document.createElement('canvas');
        //     cv.width = W; cv.height = H;
        //     const c  = cv.getContext('2d')!;

        //     // Reflejar si el pez nada hacia la izquierda
        //     if (facingLeft) { c.translate(W, 0); c.scale(-1, 1); }
        //     c.globalAlpha = alpha;                          // toda la transparencia en el PNG

        //     // ── Ejes internos: cabeza=derecha, cola=izquierda ──
        //     const cx = W * 0.50, cy = H * 0.52;
        //     const bw = W * 0.34, bh = H * 0.25;            // semiejes del cuerpo

        //     // Oscurece/aclara un color hex por `d` puntos en cada canal
        //     const sh = (hex: string, d: number): string => {
        //       const n = parseInt(hex.replace('#', ''), 16);
        //       const cl = (v: number) => Math.min(255, Math.max(0, v));
        //       return `rgb(${cl((n >> 16) + d)},${cl(((n >> 8) & 255) + d)},${cl((n & 255) + d)})`;
        //     };

        //     // 1 — Cuerpo principal
        //     c.fillStyle = baseHex;
        //     c.beginPath();
        //     c.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2);
        //     c.fill();

        //     // 2 — Cabeza (ligeramente más redondeada y oscura)
        //     c.fillStyle = sh(baseHex, -22);
        //     c.beginPath();
        //     c.ellipse(cx + bw * 0.70, cy + bh * 0.06, bw * 0.28, bh * 0.82, -0.08, 0, Math.PI * 2);
        //     c.fill();

        //     // 3 — Hocico terminal
        //     c.beginPath();
        //     c.ellipse(cx + bw * 0.96, cy + bh * 0.16, bw * 0.08, bh * 0.38, -0.15, 0, Math.PI * 2);
        //     c.fill();

        //     // 4 — Cola bifurcada (dos lóbulos simétricos)
        //     c.fillStyle = sh(baseHex, -14);
        //     c.beginPath();
        //     c.moveTo(cx - bw * 0.92, cy - bh * 0.12);
        //     c.bezierCurveTo(
        //       cx - bw * 1.12, cy - bh * 0.18,
        //       cx - bw * 1.38, cy - bh * 1.52,
        //       cx - bw * 1.52, cy - bh * 1.78
        //     );
        //     c.lineTo(cx - bw * 1.36, cy - bh * 0.88);
        //     c.lineTo(cx - bw * 0.98, cy);
        //     c.lineTo(cx - bw * 1.36, cy + bh * 0.88);
        //     c.lineTo(cx - bw * 1.52, cy + bh * 1.78);
        //     c.bezierCurveTo(
        //       cx - bw * 1.38, cy + bh * 1.52,
        //       cx - bw * 1.12, cy + bh * 0.18,
        //       cx - bw * 0.92, cy + bh * 0.12
        //     );
        //     c.fill();

        //     // 5 — Aleta dorsal (prominente, curva natural)
        //     c.fillStyle = sh(baseHex, -18);
        //     c.beginPath();
        //     c.moveTo(cx - bw * 0.06, cy - bh);
        //     c.quadraticCurveTo(cx + bw * 0.14, cy - bh * 2.20, cx + bw * 0.46, cy - bh);
        //     c.closePath();
        //     c.fill();

        //     // 6 — Aleta adiposa (pequeña, característica del salmón, entre dorsal y cola)
        //     c.beginPath();
        //     c.moveTo(cx - bw * 0.50, cy - bh * 0.96);
        //     c.quadraticCurveTo(cx - bw * 0.42, cy - bh * 1.44, cx - bw * 0.30, cy - bh * 0.96);
        //     c.closePath();
        //     c.fill();

        //     // 7 — Aleta pectoral (debajo de la cabeza, diagonal)
        //     c.fillStyle = sh(baseHex, -10);
        //     c.beginPath();
        //     c.moveTo(cx + bw * 0.50, cy + bh * 0.25);
        //     c.quadraticCurveTo(cx + bw * 0.72, cy + bh * 1.10, cx + bw * 0.62, cy + bh * 0.52);
        //     c.closePath();
        //     c.fill();

        //     // 8 — Aleta ventral
        //     c.beginPath();
        //     c.moveTo(cx + bw * 0.08, cy + bh * 0.90);
        //     c.quadraticCurveTo(cx + bw * 0.22, cy + bh * 1.52, cx + bw * 0.34, cy + bh * 0.92);
        //     c.closePath();
        //     c.fill();

        //     // 9 — Franja plateada lateral (iridiscencia)
        //     c.fillStyle = 'rgba(160,185,205,0.52)';
        //     c.beginPath();
        //     c.ellipse(cx, cy + bh * 0.08, bw * 0.84, bh * 0.20, 0, 0, Math.PI * 2);
        //     c.fill();

        //     // 10 — Manchas oscuras características (salmón del Atlántico)
        //     c.fillStyle = sh(baseHex, -48);
        //     ([
        //       [cx - 0.05 * bw, cy - 0.38 * bh, bh * 0.13],
        //       [cx + 0.20 * bw, cy - 0.50 * bh, bh * 0.11],
        //       [cx + 0.36 * bw, cy - 0.30 * bh, bh * 0.12],
        //       [cx - 0.18 * bw, cy - 0.55 * bh, bh * 0.10],
        //       [cx + 0.08 * bw, cy - 0.62 * bh, bh * 0.09],
        //       [cx - 0.35 * bw, cy - 0.42 * bh, bh * 0.08],
        //     ] as [number, number, number][]).forEach(([sx, sy, sr]) => {
        //       c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
        //     });

        //     // 11 — Ojo + reflejo especular
        //     c.fillStyle = 'rgba(28,16,6,0.92)';
        //     c.beginPath();
        //     c.arc(cx + bw * 0.66, cy - bh * 0.10, bh * 0.22, 0, Math.PI * 2);
        //     c.fill();
        //     c.fillStyle = 'rgba(255,255,255,0.68)';
        //     c.beginPath();
        //     c.arc(cx + bw * 0.70, cy - bh * 0.16, bh * 0.07, 0, Math.PI * 2);
        //     c.fill();

        //     return cv.toDataURL('image/png');
        //   };

        //   // ─── Generar los 3 PNG antes de componer el PDF ───────────────────────
        //   //  - salmonGrande (#C9967A): pinkish salmon, zona derecha (sin texto denso)
        //   //  - salmonMedio  (#8096A5): gris plateado,  detrás del logo (izquierda)
        //   //  - salmonPeq    (#A8916E): dorado pardo,   transición logo→texto
        //   const salmonGrande = makeSalmonPng(72, 38, '#C9967A', false, 0.15);
        //   const salmonMedio  = makeSalmonPng(52, 26, '#8096A5', true,  0.12);
        //   const salmonPeq    = makeSalmonPng(40, 20, '#A8916E', false, 0.13);

        //   // Opacidad 1 en GState — la semi-transparencia viene del canal alfa del PNG
        //   doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));

        //   // Posiciones en mm (x, y, ancho, alto):
        //   //   grande  → x=133, y=4  : extremo derecho del banner
        //   //   mediano → x=3,   y=9  : detrás del logo, semioculto
        //   //   pequeño → x=72,  y=22 : entre logo y texto central
        //   doc.addImage(salmonGrande, 'PNG', 133,  4, 72, 38);
        //   doc.addImage(salmonMedio,  'PNG',   3,  9, 52, 26);
        //   doc.addImage(salmonPeq,    'PNG',  72, 22, 40, 20);

        //   doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));
        //   doc.setLineWidth(0.2);
        // })();

      // Logo con proporción correcta
      if (logo) {
        const props = doc.getImageProperties(logo);
        const maxW = 40, maxH = 28;
        const scale = Math.min(maxW / props.width, maxH / props.height);
        const imgW = props.width * scale;
        const imgH = props.height * scale;
        doc.addImage(logo, 'PNG', 5 + (maxW - imgW) / 2, 3 + (maxH - imgH) / 2, imgW, imgH);
      }
      doc.setTextColor(...AZUL);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Res. Exenta N°1511/2021 — D.S. N°320', 50, 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${codigo}_CERTIFICADO`, 204, 8, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('CERTIFICADO DE SISTEMAS DE', 50, 17);
      doc.text('MANEJO DE MORTALIDAD', 50, 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Centro: ${cert.identificacion['Código Centro']} — ${cert.identificacion['Nombre Centro']}`, 50, 31);
      doc.setTextColor(0, 0, 0);

      // ── Marca de agua: olas multicolor (paleta teal) ────────────────────────
      // Definida ANTES del contenido para que quede detrás del texto.
      const PALETTE: [number,number,number][] = [
        [197, 218, 218],
        [127, 181, 176],
        [ 90, 158, 152],
        [ 46, 122, 115],
        [ 31,  78,  73],
      ];
      const drawOnda = (x0: number, y0: number, totalW: number, amp: number, lw: number, color: [number,number,number]) => {
        const w = totalW / 4;
        doc.setDrawColor(...color);
        doc.setLineWidth(lw);
        doc.lines([
          [w*0.38, -amp, w*0.62, -amp, w, 0],
          [w*0.38,  amp, w*0.62,  amp, w, 0],
          [w*0.38, -amp, w*0.62, -amp, w, 0],
          [w*0.38,  amp, w*0.62,  amp, w, 0],
        ], x0, y0, [1, 1], 'S', false);
      };
      const drawWatermarkOnPage = (yStart: number) => {
        const yEnd = 282;
        doc.setGState((doc as any).GState({ opacity: 0.35, 'fill-opacity': 0.35 }));
        let row = 0;
        for (let wy = yStart + 6; wy < yEnd; wy += 13) {
          const color = PALETTE[row % PALETTE.length];
          const amp = 1.4 + (row % 3) * 0.35;
          const lw  = 0.22 + (row % 5) * 0.06;
          drawOnda(0, wy, 212, amp, lw, color);
          row++;
        }
        doc.setGState((doc as any).GState({ opacity: 1, 'fill-opacity': 1 }));
        doc.setLineWidth(0.2);
      };

      // Página 1: olas desde y=42 (justo debajo del header reducido)
      drawWatermarkOnPage(42);

      autoTable(doc, {
        startY: 42,
        margin: { top: 30 },
        head: [['IDENTIFICACIÓN DEL CENTRO', '']],
        body: Object.entries(cert.identificacion).map(([k, v]) => [k, v]),
        theme: 'striped',
        headStyles: { fillColor: AZUL, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: GRIS },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
        styles: { fontSize: 9, cellPadding: 3 },
        didDrawPage: (data: any) => { if (data.pageNumber > 1) { drawWatermarkOnPage(30); } },
      });

      const bodyCapacidades: string[][] = [];
      const capByRow: number[] = [];
      cert.capacidades.forEach((c, i) => {
        bodyCapacidades.push([c.descripcion, c.valor, c.umbral, fmtC(c.cumple)]);
        capByRow.push(i);
      });

      autoTable(doc, {
        startY: ((doc as any).lastAutoTable?.finalY ?? 110) + 8,
        head: [['SISTEMA', 'CAPACIDAD CERTIFICADA', 'UMBRAL MÍNIMO', 'RESULTADO']],
        body: bodyCapacidades,
        theme: 'grid',
        headStyles: { fillColor: AZUL, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { top: 42 },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 3) {
            const capIdx = capByRow[data.row.index];
            data.cell.styles.textColor = colC(cert.capacidades[capIdx]?.cumple ?? false);
            data.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: (data: any) => { if (data.pageNumber > 1) { drawWatermarkOnPage(42); } },
      });

      const verdY = ((doc as any).lastAutoTable?.finalY ?? 180) + 8;
      doc.setFillColor(...(cert.cumpleGeneral ? VERDE : ROJO));
      doc.roundedRect(14, verdY, 182, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(
        cert.cumpleGeneral
          ? 'VEREDICTO: EL CENTRO CUMPLE CON LOS REQUISITOS DE LA RES. EXENTA N°1511/2021'
          : 'VEREDICTO: EL CENTRO NO CUMPLE CON LOS REQUISITOS DE LA RES. EXENTA N°1511/2021',
        105, verdY + 8, { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);

      const firmY = verdY + 55;
      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.5);
      doc.line(55, firmY, 155, firmY);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(cert.firmante.nombre, 105, firmY + 7, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`RUT: ${cert.firmante.rut}   |   Registro: ${cert.firmante.registro}`, 105, firmY + 13, { align: 'center' });
      doc.text(`Fecha de emisión: ${cert.fechaEmision}`, 105, firmY + 19, { align: 'center' });

      // Pie
      const np = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= np; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setTextColor(150,150,150); doc.setFont('helvetica','normal');
        doc.setDrawColor(200,200,200); doc.line(14,289,196,289);
        doc.text('CERTIMAR SPA — Res. Exenta N°1511/2021', 14, 293);
        doc.text(`Página ${i} de ${np}`, 196, 293, { align: 'right' });
      }

      doc.save(`Certificado_1511_${codigo}.pdf`);
    } finally { setGenerating(null); }
  };

  // ─── INFORME TÉCNICO ───────────────────────────────────────────────────────
  const generateInformePDF = async () => {
    const issues = checkCapacidades();
    if (issues.length > 0) {
      if (!window.confirm(`Advertencia:\n${issues.join('\n')}\n\n¿Generar informe de todas formas?`)) return;
    }
    setGenerating('informe');
    try {
      const logo = await loadLogo();
      const g    = state.general;
      const ext  = state.extraction;
      const den  = state.denaturation;
      const sto  = state.storage;
      const cc   = g.centro_cultivo;
      const codigo = cc.codigo_centro;
      const docCode = makeDocCode(codigo, g.fechas.inspeccion_terreno);

      // Corregir orientación EXIF de todas las imágenes antes de insertar en PDF
      const correctedImgs = await Promise.all(
        state.images.map(async img => ({ ...img, url: await fixImageOrientation(img.url) }))
      );

      const AZUL_H: [number,number,number] = [74, 118, 168];
      const AZUL_T: [number,number,number] = [31, 73, 125];
      const VERDE_H:[number,number,number] = [193, 225, 193]; // legacy — reemplazado por AZUL_MARINO en tablas
      const AZUL_MARINO: [number,number,number] = [26, 58, 92];
      const GRIS_FILA:   [number,number,number] = [245, 247, 250];
      const BORDE_TABLA: [number,number,number] = [221, 227, 234];

      const doc = new jsPDF({ format: 'letter', compress: true });
      const PW = 215.9, PH = 279.4;

      // Dibuja olas de marca de agua en la página actual — llamar ANTES del contenido
      // para que las olas queden detrás del texto.
      const drawBodyWaves = () => {
        const gS25  = (doc as any).GState({ opacity: 0.25, 'fill-opacity': 0.25 });
        const gS100 = (doc as any).GState({ opacity: 1,    'fill-opacity': 1 });
        doc.setDrawColor(168, 200, 232);
        doc.setLineWidth(0.35);
        const bw = PW / 4;
        const wv = (y0: number, amp: number) =>
          doc.lines([[bw*0.38,-amp,bw*0.62,-amp,bw,0],[bw*0.38,amp,bw*0.62,amp,bw,0],
                     [bw*0.38,-amp,bw*0.62,-amp,bw,0],[bw*0.38,amp,bw*0.62,amp,bw,0]],
                    0, y0, [1, 1], 'S', false);
        doc.setGState(gS25);
        [26, 42, 60, 80, 102, 126, 152, 180, 210].forEach((y, idx) => wv(y, 1.0 + (idx % 3) * 0.35));
        doc.setGState(gS100);
      };

      // ── Portada ──
      // Banda azul superior (con espacio para logo a la derecha y título a la izquierda)
      doc.setFillColor(...AZUL_H);
      doc.rect(0, 0, PW, 38, 'F');
      doc.setFillColor(31, 56, 100);
      doc.rect(0, 36, PW, 2, 'F');
      // docCode top-left
      doc.setFontSize(8); doc.setTextColor(255,255,255); doc.setFont('helvetica','normal');
      doc.text(docCode, 8, 8);
      // Logo top-right dentro del banner azul
      if (logo) doc.addImage(logo, 'PNG', PW - 46, 3, 40, 28);
      // Título a la izquierda del banner
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('Inspección de Certificación', 10, 16);
      doc.setFontSize(12);
      doc.text('Sistema de Mortalidad', 10, 25);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text('Res. Exenta N°1511/2021', 10, 33);

      // Banda de identificación del centro (azul oscuro)
      doc.setFillColor(31, 56, 100);
      doc.rect(0, 38, PW, 16, 'F');
      doc.setTextColor(255,255,255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(`CENTRO ${codigo}  —  ${cc.nombre_centro}`, PW / 2, 46, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(`${cc.titular}  |  ACS: ${cc.acs}`, PW / 2, 51, { align: 'center' });

      // Fotos de portada: 1 grande o 2–3 en fila
      const fotosPortada = correctedImgs.filter(img => img.seccion === 'Portada');
      const FOTO_TOP = 58;
      if (fotosPortada.length === 1) {
        try { doc.addImage(fotosPortada[0].url, 'JPEG', (PW - 150) / 2, FOTO_TOP, 150, 110); } catch { /* skip */ }
      } else if (fotosPortada.length >= 2) {
        const count = Math.min(fotosPortada.length, 3);
        const fotoW = 64, fotoH = 50, gap = 4;
        const totalW = count * fotoW + (count - 1) * gap;
        let fx = (PW - totalW) / 2;
        for (const foto of fotosPortada.slice(0, count)) {
          try { doc.addImage(foto.url, 'JPEG', fx, FOTO_TOP, fotoW, fotoH); } catch { /* skip */ }
          fx += fotoW + gap;
        }
      }

      // Fecha e info del certificador
      const fotoBottom = fotosPortada.length === 1 ? FOTO_TOP + 118 : (fotosPortada.length >= 2 ? FOTO_TOP + 58 : FOTO_TOP + 6);
      doc.setTextColor(...AZUL_T);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(formatDateES(g.fechas.inspeccion_terreno), PW / 2, fotoBottom + 14, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Certificador: ${g.certificador.nombre}  |  N° Registro: ${g.certificador.numero_registro}`,
        PW / 2, fotoBottom + 24, { align: 'center' }
      );

      // Footer portada
      doc.setFillColor(...AZUL_H);
      doc.rect(0, PH - 18, PW, 18, 'F');
      doc.setFontSize(7.5); doc.setTextColor(255,255,255); doc.setFont('helvetica','normal');
      doc.text('Mario Toral 101, Puerto Aysén', 10, PH - 8);
      doc.text('+56 9 45052052', PW / 2, PH - 8, { align: 'center' });
      doc.text('eflores@engelbert.cl', PW - 10, PH - 8, { align: 'right' });

      // ── helpers de posicionamiento ──
      const CONTENT_BOTTOM = PH - 22;
      const lastY = () => ((doc as any).lastAutoTable?.finalY ?? 30);
      const HEADER_CONTENT_Y = 25; // cabecera 22mm + 3mm margen
      const ensureSpace = (needed: number) => {
        if (lastY() + needed > CONTENT_BOTTOM) {
          doc.addPage();
          drawBodyWaves();
          (doc as any).lastAutoTable = { finalY: HEADER_CONTENT_Y };
        }
      };
      const sectionTitle = (text: string, size: number, y: number) => {
        doc.setTextColor(...AZUL_T);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(size);
        doc.text(text, 14, y);
        doc.setTextColor(0, 0, 0);
      };

      // ── Sección 1: Identificación del centro ──
      doc.addPage();
      drawBodyWaves();
      sectionTitle('1  Identificación del centro', 14, 30);

      autoTable(doc, {
        startY: 36,
        margin: { top: 25 },
        pageBreak: 'avoid',
        body: [
          ['Empresa',              cc.titular],
          ['Centro',               cc.nombre_centro],
          ['Codigo RNA',           cc.acs],
          ['Ubicación',            cc.ubicacion],
          ['Fecha inspección',     g.fechas.inspeccion_terreno],
          ['Formato del módulo',   cc.formato_modulo || '—'],
          ['Tamaño de las jaulas', cc.tamano_jaulas || '—'],
          ['A.C.S',                cc.acs],
          ['Nombre A/N Ensilaje',  cc.nombre_an_ensilaje || '—'],
          ['Coordenadas Ensilaje', cc.coordenadas_ensilaje || '—'],
        ],
        theme: 'striped',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, textColor: AZUL_MARINO } },
        alternateRowStyles: { fillColor: GRIS_FILA },
        styles: { fontSize: 9, cellPadding: 3, lineColor: BORDE_TABLA, lineWidth: 0.1 },
      });

      // 1.1 Proceso extracción
      ensureSpace(65);
      const y11 = lastY() + 10;
      sectionTitle('1.1  Proceso extracción', 12, y11);

      autoTable(doc, {
        startY: y11 + 5,
        pageBreak: 'avoid',
        body: [
          [{ content: 'Flujo de Proceso de Extracción', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold', fontSize: 9 } }],
          ['Extracción de mortalidad.', `Mediante sistema ${ext.parametros.sistema_principal} con compresor de aire.`],
          ['Sistema SEM.', `Sistema ${ext.parametros.sistema_principal} se encuentra en módulo / jaulas en simultáneo: ${ext.parametros.jaulas_simultaneas}, módulo de ${ext.parametros.numero_total_jaulas} jaulas tipo metálica en total.`],
          ['Traslado Mortalidad a plataforma de Ensilaje.', `Hacia ${cc.nombre_an_ensilaje || 'A/N Pontón'} por medio de tachos rotulados.`],
          ['Marca.',                 ext.parametros.marca_equipo],
          ['Capacidad nominal',      `${ext.parametros.jaulas_simultaneas} jaulas en simultáneo`],
          ['Marca/modelo equipo de aire.', ext.parametros.tipo_compresor],
          ['Potencia Extracción (CFM).', `${ext.parametros.potencia_cfm} CFM`],
          ['Ubicación del compresor.', ext.parametros.ubicacion_compresor || '—'],
        ],
        theme: 'striped',
        alternateRowStyles: { fillColor: GRIS_FILA },
        columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold', textColor: AZUL_MARINO } },
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: BORDE_TABLA, lineWidth: 0.1 },
      });

      // 1.2 Información plataforma y circuitos
      doc.addPage();
      drawBodyWaves();
      sectionTitle('1.2  Información plataforma y circuitos', 12, 30);

      autoTable(doc, {
        startY: 36,
        margin: { top: 25 },
        pageBreak: 'avoid',
        body: [
          [{ content: 'Información Plataforma, Equipos y Circuitos', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold' } }],
          [{ content: 'A/N Pontón.', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Eslora',  sto.infraestructura.eslora_m  ? `${sto.infraestructura.eslora_m} m` : '—'],
          ['Manga',   sto.infraestructura.manga_m   ? `${sto.infraestructura.manga_m} m` : '—'],
          ['Puntual', sto.infraestructura.puntual_m ? `${sto.infraestructura.puntual_m} m` : '—'],
          [{ content: '(Olla trituradora)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Marca', den.equipos.marca_modelo],
          ['Material', den.equipos.material_construccion],
          ['Capacidad de Proceso Nominal', `${den.equipos.velocidad_nominal_kg_hr} Kg/hr`],
          ['Estado (bien, mal, sin fugas)', den.equipos.estado_olla === 'Bueno' ? 'Buen estado, sin fugas.' : den.equipos.estado_olla === 'Regular' ? 'Estado regular, presenta observaciones.' : 'Mal estado, requiere revisión.'],
          ['Señalar si cuenta con prepicador y Recirculación de ácido', `${den.equipos.cuenta_con_prepicador ? 'Cuenta con prepicador. ' : ''}${den.equipos.cuenta_con_recirculacion_acido ? 'Cuenta con sistema de recirculación de ácido.' : ''}`],
          [{ content: '(Pretil)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Material', sto.infraestructura.pretil_material],
          ['Estado (bien, mal, sin fugas)', sto.infraestructura.pretil_estado === 'Bueno' ? 'Buen estado sin fugas.' : sto.infraestructura.pretil_estado],
          [{ content: '(Piping)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Material', sto.infraestructura.piping_material],
          ['Diámetro (pulgadas)', sto.infraestructura.piping_diametro],
          ['Válvulas', sto.infraestructura.piping_valvulas],
        ],
        theme: 'grid',
        columnStyles: { 0: { cellWidth: 95 } },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      // 1.3 Generación eléctrica
      ensureSpace(40);
      const y13 = lastY() + 10;
      sectionTitle('1.3  Capacidad Generación Eléctrica', 12, y13);

      if (den.generacion_electrica.length > 0) {
        autoTable(doc, {
          startY: y13 + 5,
          pageBreak: 'avoid',
          head: [['Tipo', 'Marca', 'Modelo', 'Capacidad (KVA)', 'Ubicación']],
          body: den.generacion_electrica.map(ge => [ge.tipo, ge.marca, ge.modelo, String(ge.capacidad_kva), ge.ubicacion]),
          theme: 'grid',
          headStyles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: GRIS_FILA },
          styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: BORDE_TABLA, lineWidth: 0.1 },
        });
      } else {
        autoTable(doc, {
          startY: y13 + 5,
          pageBreak: 'avoid',
          body: [['Sin generadores registrados', '—', '—', '—', '—']],
          theme: 'grid', styles: { fontSize: 8.5, cellPadding: 2.5 },
        });
      }

      // 1.4 Desnaturalización y almacenamiento
      ensureSpace(75);
      const y14 = lastY() + 10;
      sectionTitle('1.4  Desnaturalización y almacenamiento.', 12, y14);

      autoTable(doc, {
        startY: y14 + 5,
        pageBreak: 'avoid',
        body: [
          [{ content: 'Equipo de Desnaturalización y capacidades', colSpan: 2, styles: { fillColor: AZUL_MARINO, textColor: [255,255,255] as [number,number,number], fontStyle: 'bold' } }],
          ['Número ollas trituradoras.', String(den.equipos.cantidad_sistemas)],
          ['Capacidad de procesamiento Nominal (kg/h).', `${den.equipos.velocidad_nominal_kg_hr} Kg/h`],
          ['Horas de funcionamiento al día.', `${den.equipos.horas_funcionamiento_dia} hrs.`],
          ['Marca.', den.equipos.marca_modelo],
          [{ content: '(Por cada olla trituradora)', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Material.', den.equipos.material_construccion],
          ['Estado (bien, mal, sin fugas).', 'Buen estado sin fugas y óxido nivel medio.'],
          ['Señalar si cuenta con prepicador y dosificación de ácido.', `${den.equipos.cuenta_con_recirculacion_acido ? 'Cuenta con sistema de Recirculación de ácido.' : '—'}`],
          [{ content: 'Almacenamiento.', colSpan: 2, styles: { fontStyle: 'bold' } }],
          ['Capacidad.', `Estanque con capacidad para ${sto.parametros.capacidad_almacenaje_m3} m³ con recirculación.`],
        ],
        theme: 'striped',
        alternateRowStyles: { fillColor: GRIS_FILA },
        columnStyles: { 0: { cellWidth: 95, fontStyle: 'bold', textColor: AZUL_MARINO } },
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: BORDE_TABLA, lineWidth: 0.1 },
      });

      // ── Sección 2: Metodología ──
      doc.addPage();
      drawBodyWaves();
      sectionTitle('2  Metodología de trabajo para la inspección del módulo', 14, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      const metText = [
        'Se procede a la revisión documental y posterior visita de campo al objeto de certificar que los sistemas o equipos de extracción, desnaturalización y almacenamiento de la mortalidad tienen las capacidades indicadas por el mandante.',
        '',
        'Según la Res 1511, los centros de cultivo deberán acreditar: a) una capacidad mínima de extracción diaria de 15 toneladas de mortalidad; b) una capacidad mínima de desnaturalización diaria de 15 toneladas de mortalidad; y c) disponen de un sistema de almacenamiento, con una capacidad mínima diaria de 20 toneladas de biomasa.',
        '',
        'La metodología utilizada para la certificación de las capacidades de los sistemas o equipos de extracción, desnaturalización y almacenamiento de mortalidad en centros de cultivos de salmones, están en conformidad con el artículo 25 del D.S. Nº 15 de 2011, del Ministerio de Economía, Fomento y Turismo. La información se tabula empleando código de colores:',
      ];
      let curY = 38;
      for (const line of metText) {
        const lines = doc.splitTextToSize(line, 182);
        doc.text(lines, 14, curY);
        curY += lines.length * 6 + (line === '' ? 0 : 2);
      }
      autoTable(doc, {
        startY: curY + 4,
        pageBreak: 'avoid',
        body: [
          [{ content: '', styles: { fillColor: [0, 176, 80] as [number,number,number], cellWidth: 12 } }, 'Verde', 'Sin Observaciones (Bueno)'],
          [{ content: '', styles: { fillColor: [255, 255, 0] as [number,number,number], cellWidth: 12 } }, 'Amarillo', 'Recomendación (Regular)'],
          [{ content: '', styles: { fillColor: [255, 0, 0] as [number,number,number], cellWidth: 12 } }, 'Rojo', 'Debe ser revisado y solucionado (Malo)'],
        ],
        theme: 'grid',
        columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 30 } },
        styles: { fontSize: 9, cellPadding: 3 },
        tableWidth: 120,
        margin: { left: 40 },
      });

      // ── Sección 3: Inspección de terreno ──
      // ─ constantes y helpers de fotos ────────────────────────────────────────
      const CAPTION_H = 9;   // altura para leyenda bajo la foto (mm)
      const IMG_ROW_H = 54;  // alto mínimo de la celda de imagen
      const estadoColor = (e: string): [number,number,number] =>
        e === 'Verde' ? [22,101,52] : e === 'Amarillo' ? [161,98,7] : [185,28,28];

      /** Tabla con bordes — cabecera azul — foto + leyenda visible */
      const addPhotoSection = (seccion: ImageSeccion) => {
        const imgs = correctedImgs.filter(img => img.seccion === seccion);
        if (imgs.length === 0) {
          ensureSpace(14);
          autoTable(doc, {
            startY: lastY() + 6,
            body: [['Sin imágenes registradas para esta sección.']],
            theme: 'plain', styles: { fontSize: 8.5, textColor: [130,130,130] },
          });
          return;
        }
        for (let i = 0; i < imgs.length; i += 3) {
          const row = imgs.slice(i, i + 3);
          // Saltar de página si no cabe la cabecera + la fila completa
          ensureSpace(IMG_ROW_H + 14);
          autoTable(doc, {
            startY: lastY() + 4,
            margin: { top: 25 },
            rowPageBreak: 'avoid',
            head: [['DECLARADO / Estado', '#1', '#2', '#3']],
            body: [[
              { content: `${row[0].observacion || 'CUMPLE CON LO DECLARADO'}\n${row[0].estado}`, styles: { valign: 'top', fontSize: 8 } },
              { content: '', styles: { cellWidth: 50, minCellHeight: IMG_ROW_H } },
              { content: '', styles: { cellWidth: 50, minCellHeight: IMG_ROW_H } },
              { content: '', styles: { cellWidth: 50, minCellHeight: IMG_ROW_H } },
            ]],
            theme: 'grid',
            headStyles: { fillColor: [31,73,125] as [number,number,number], textColor: [255,255,255], fontSize: 8.5, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 }, 3: { cellWidth: 50 } },
            didDrawCell: (data: any) => {
              if (data.section === 'body' && data.column.index >= 1) {
                const imgIdx = data.column.index - 1 + i;
                const img = imgs[imgIdx];
                if (img?.url) {
                  try {
                    const imgAreaH = data.cell.height - CAPTION_H;
                    doc.addImage(img.url, 'JPEG', data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, Math.max(imgAreaH - 1, 2));
                    if (img.leyenda) {
                      doc.setFontSize(6.5);
                      doc.setTextColor(30, 30, 30);
                      doc.setFont('helvetica', 'normal');
                      const captionLines = doc.splitTextToSize(img.leyenda, data.cell.width - 4);
                      doc.text(captionLines, data.cell.x + data.cell.width / 2, data.cell.y + imgAreaH + 4, { align: 'center' });
                    }
                  } catch { /* skip si la imagen falla */ }
                }
              }
              if (data.section === 'body' && data.column.index === 0) {
                // Pastilla semáforo con texto (legible en escala de grises)
                const badgeW = 26, badgeH = 5, badgeR = 1.1;
                const bx = data.cell.x + (data.cell.width - badgeW) / 2;
                const by = data.cell.y + data.cell.height - badgeH - 3;
                const est = row[0].estado;
                const [br, bg, bb]: [number,number,number] =
                  est === 'Verde'    ? [26, 122, 60]  :
                  est === 'Amarillo' ? [184, 134, 11] : [139, 26, 26];
                const badgeLabel =
                  est === 'Verde'    ? 'CONFORME'    :
                  est === 'Amarillo' ? 'OBSERVACIÓN' : 'NO CONFORME';
                doc.setFillColor(br, bg, bb);
                doc.roundedRect(bx, by, badgeW, badgeH, badgeR, badgeR, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
                doc.text(badgeLabel, bx + badgeW / 2, by + badgeH - 1.2, { align: 'center' });
                doc.setTextColor(0, 0, 0);
              }
            },
          });
        }
      };

      /** Tabla sin bordes para imágenes aéreas — de a 2 por fila, centradas */
      const addAerialSection = (seccion: ImageSeccion) => {
        const imgs = correctedImgs.filter(img => img.seccion === seccion);
        if (imgs.length === 0) {
          autoTable(doc, {
            startY: lastY() + 6,
            body: [['Sin imágenes de ubicación espacial registradas.']],
            theme: 'plain', styles: { fontSize: 8.5, textColor: [130,130,130] },
          });
          return;
        }
        const AERIAL_W = 90, AERIAL_H = 64;
        const marginLeft = (PW - AERIAL_W * 2 - 6) / 2;
        for (let i = 0; i < imgs.length; i += 2) {
          const pair = imgs.slice(i, i + 2);
          ensureSpace(AERIAL_H + 16);
          autoTable(doc, {
            startY: lastY() + 6,
            margin: { top: 25, left: marginLeft },
            rowPageBreak: 'avoid',
            body: [[
              { content: '', styles: { cellWidth: AERIAL_W, minCellHeight: AERIAL_H, cellPadding: 0 } },
              { content: '', styles: { cellWidth: AERIAL_W, minCellHeight: AERIAL_H, cellPadding: 0 } },
            ]],
            theme: 'plain',
            styles: { fontSize: 0, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: AERIAL_W }, 1: { cellWidth: AERIAL_W } },
            didDrawCell: (data: any) => {
              if (data.section !== 'body') return;
              const img = pair[data.column.index];
              if (img?.url) {
                try {
                  const imgAreaH = data.cell.height - CAPTION_H;
                  doc.addImage(img.url, 'JPEG', data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, Math.max(imgAreaH - 2, 2));
                  if (img.leyenda) {
                    doc.setFontSize(7);
                    doc.setTextColor(40, 40, 40);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(img.leyenda, data.cell.width - 4);
                    doc.text(lines, data.cell.x + data.cell.width / 2, data.cell.y + imgAreaH + 5, { align: 'center' });
                  }
                } catch { /* skip */ }
              }
            },
          });
        }
      };

      doc.addPage();
      drawBodyWaves();
      sectionTitle('3  Inspección de terreno', 14, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(60,60,60);
      doc.text('A continuación, se presentan los resultados de la inspección con desviaciones y observaciones de lo declarado vs lo inspeccionado en terreno.', 14, 38);
      sectionTitle('3.1  Extracción', 12, 46);
      autoTable(doc, { startY: 51, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('Extracción');

      doc.addPage();
      drawBodyWaves();
      sectionTitle('3.2  Desnaturalización.', 12, 30);
      autoTable(doc, { startY: 36, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('Desnaturalización');

      doc.addPage();
      drawBodyWaves();
      sectionTitle('3.3  Almacenamiento.', 12, 30);
      autoTable(doc, { startY: 36, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('Almacenamiento');

      // ── Sección 4: Conclusiones ──
      doc.addPage();
      drawBodyWaves();
      sectionTitle('4  Conclusiones inspección de estructuras', 14, 30);

      // Helper para olas decorativas cerca de la firma
      const drawConcWave = (y0: number, amp: number) => {
        doc.setDrawColor(168, 200, 232);
        doc.setLineWidth(0.35);
        const ww = PW / 4;
        doc.lines(
          [[ww*0.38,-amp,ww*0.62,-amp,ww,0],[ww*0.38,amp,ww*0.62,amp,ww,0],
           [ww*0.38,-amp,ww*0.62,-amp,ww,0],[ww*0.38,amp,ww*0.62,amp,ww,0]],
          0, y0, [1, 1], 'S', false
        );
      };

      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      const certifica = calculatedExtraction.cumple_norma && calculatedDenaturation.cumple_norma && calculatedStorage.cumple_norma;
      const concClusion = `Con base en las observaciones encontradas, se puede concluir que los sistemas o equipos de extracción, desnaturalización y almacenamiento de la mortalidad en el centro de cultivo ${cc.nombre_centro ? cc.nombre_centro + '  SIEP – ' + codigo : codigo}, dan cumplimiento a las capacidades mínimas establecidas en el artículo 4° A del D.S. N.º 320 de 2001, del Ministerio de Economía, Fomento y Turismo. Esto fue resuelto una vez realizada tanto la evaluación documental como la verificación en terreno el día ${formatDateES(g.fechas.inspeccion_terreno)}; por lo tanto, ${certifica ? 'ES CERTIFICABLE' : 'NO ES CERTIFICABLE'}.`;
      const cLines = doc.splitTextToSize(concClusion, 182);
      doc.text(cLines, 14, 38);

      // Zona de firma — replicar layout del certificado
      const firmY = 38 + cLines.length * 6 + 28;
      // Ondas decorativas de fondo sobre la firma
      [firmY - 18, firmY - 12, firmY - 6].forEach((y, idx) =>
        drawConcWave(y, 1.0 + idx * 0.3)
      );
      // Línea azul decorativa centrada
      doc.setDrawColor(26, 58, 92); doc.setLineWidth(0.5);
      doc.line(55, firmY, PW - 55, firmY);
      // Nombre certificador
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
      doc.text(g.certificador.nombre, PW / 2, firmY + 7, { align: 'center' });
      // RUT | Registro
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(
        `RUT: ${g.certificador.rut}   |   Registro: ${g.certificador.numero_registro}`,
        PW / 2, firmY + 13, { align: 'center' }
      );
      // Fecha de emisión
      doc.text(
        `Fecha de emisión: ${formatDateES(g.fechas.emision_certificado)}`,
        PW / 2, firmY + 19, { align: 'center' }
      );

      // ── Sección 5: Registro de visita ──
      doc.addPage();
      drawBodyWaves();
      sectionTitle('5  Registro de visita.', 14, 30);
      sectionTitle('5.1  Ubicación espacial del centro', 12, 38);
      autoTable(doc, { startY: 43, margin: { top: 25 }, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addAerialSection('Ubicación Espacial');

      ensureSpace(50);
      const y52 = lastY() + 12;
      sectionTitle('5.2  Registro general', 12, y52);
      autoTable(doc, { startY: y52 + 4, body: [['']], theme: 'plain', styles: { minCellHeight: 0 } });
      addPhotoSection('General');

      // Añadir frames (header/footer + ondas) a todas las páginas excepto portada
      addInformePageFrame(doc, docCode, logo, 'Informe Técnico');

      const filename = `Informe_Tecnico_1511_${codigo}.pdf`;

      // Adjuntar Registro de Visita como snapshots JPEG (ya comprimidos al subir)
      if (registroVisitaRef.current) {
        for (const snapshot of registroVisitaRef.current) {
          doc.addPage([PW, PH]);
          doc.addImage(snapshot, 'JPEG', 0, 0, PW, PH, '', 'FAST');
        }
      }

      doc.save(filename);
    } finally { setGenerating(null); }
  };

  // useDropzone hoisted here so ReportView can be called as a plain function
  const { getRootProps: dropzoneRootProps, getInputProps: dropzoneInputProps, isDragActive } = useDropzone({
    onDrop: addImage,
    accept: { 'image/*': [] }
  } as any);

  // --- Views ---

  const GeneralView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <SectionHeader
        title="Datos Generales"
        icon={LayoutDashboard}
        description="Información base del centro de cultivo y del certificador a cargo."
      />

      {isAdmin && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {state.registroId ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 tracking-wider">
                <Bookmark size={11} />
                {state.registroId}
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Sin registro activo</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={comenzarRegistro}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              <PlayCircle size={16} />
              Comenzar Registro
            </button>
            <button
              onClick={() => handleGuardar('general')}
              disabled={!!guardandoSection}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/30"
            >
              {guardandoSection === 'general'
                ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={16} /></motion.div> Guardando…</>
                : guardadoSection === 'general'
                  ? <><CheckCircle2 size={16} /> Guardado</>
                  : <><Save size={16} /> Guardar</>
              }
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormCard title="Identificación del Centro">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <CenterCodeAutocomplete
                inputRef={centerCodeRef}
                highlight={state.general.centro_cultivo.codigo_centro === ""}
                label="Código Centro"
                value={state.general.centro_cultivo.codigo_centro}
                onChange={handleCenterCodeChange}
              />
              <InputField 
                label="A.C.S / RNA" 
                value={state.general.centro_cultivo.acs} 
                onChange={(v) => updateGeneral('centro_cultivo.acs', v)} 
                placeholder="26B"
              />
            </div>
            {/* Titular con autocompletado de empresas conocidas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Titular</label>
              <input
                list="titulares-list"
                value={state.general.centro_cultivo.titular}
                onChange={(e) => updateGeneral('centro_cultivo.titular', e.target.value)}
                placeholder="Ej. EXPORTADORA LOS FIORDOS LTDA."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="titulares-list">
                {TITULARES_CONOCIDOS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <InputField
              label="Nombre Centro"
              value={state.general.centro_cultivo.nombre_centro}
              onChange={(v) => updateGeneral('centro_cultivo.nombre_centro', v)}
              placeholder="Ej. PUNTA LARGA"
            />
            <InputField
              label="Ubicación"
              value={state.general.centro_cultivo.ubicacion}
              onChange={(v) => updateGeneral('centro_cultivo.ubicacion', v)}
              placeholder="Región de Aysén..."
            />

            {/* Formato del módulo con opciones comunes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Formato del Módulo</label>
              <input
                list="formato-modulo-list"
                value={state.general.centro_cultivo.formato_modulo}
                onChange={(e) => updateGeneral('centro_cultivo.formato_modulo', e.target.value)}
                placeholder="24 jaulas, tipo Metálicas"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="formato-modulo-list">
                {FORMATOS_MODULO_CONOCIDOS.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>

            {/* Tamaño de jaulas con opciones comunes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tamaño de Jaulas</label>
              <input
                list="tamano-jaulas-list"
                value={state.general.centro_cultivo.tamano_jaulas}
                onChange={(e) => updateGeneral('centro_cultivo.tamano_jaulas', e.target.value)}
                placeholder="30 x 30 metros"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="tamano-jaulas-list">
                {TAMANOS_JAULAS_CONOCIDOS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            {/* Nombre A/N con opciones comunes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nombre A/N Ensilaje</label>
              <input
                list="an-ensilaje-list"
                value={state.general.centro_cultivo.nombre_an_ensilaje}
                onChange={(e) => updateGeneral('centro_cultivo.nombre_an_ensilaje', e.target.value)}
                placeholder="A/N Pontón Alimentador"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium text-sm"
              />
              <datalist id="an-ensilaje-list">
                {NOMBRES_AN_CONOCIDOS.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>

            <InputField
              label="Coordenadas Ensilaje"
              value={state.general.centro_cultivo.coordenadas_ensilaje}
              onChange={(v) => updateGeneral('centro_cultivo.coordenadas_ensilaje', v)}
              placeholder="45°27'S 72°51'W"
            />
          </div>
        </FormCard>

        <FormCard title="Fechas y Certificador">
          <div className="space-y-4">
            <DateField
              label="Fecha Inspección Terreno"
              value={state.general.fechas.inspeccion_terreno}
              onChange={(v) => updateGeneral('fechas.inspeccion_terreno', v)}
            />
            <DateField
              label="Fecha Evaluación Documental"
              value={state.general.fechas.evaluacion_documental}
              onChange={(v) => updateGeneral('fechas.evaluacion_documental', v)}
            />
            <DateField
              label="Fecha Emisión Certificado"
              value={state.general.fechas.emision_certificado}
              onChange={(v) => updateGeneral('fechas.emision_certificado', v)}
            />
            <InputField 
              label="Certificador" 
              value={state.general.certificador.nombre} 
              onChange={(v) => updateGeneral('certificador.nombre', v)} 
            />
            <InputField 
              label="RUT Certificador" 
              value={state.general.certificador.rut} 
              onChange={(v) => updateGeneral('certificador.rut', v)} 
            />
            <InputField 
              label="N° Registro" 
              value={state.general.certificador.numero_registro} 
              onChange={(v) => updateGeneral('certificador.numero_registro', v)} 
            />
          </div>
        </FormCard>
      </div>
    </div>
  );

  const HistoryView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <SectionHeader 
        title="Histórico de Certificaciones" 
        icon={History} 
        description="Consulta el registro histórico de certificaciones emitidas bajo la norma 1511."
      />

      <FormCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Ingreso</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Emisión</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Centro</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ACS</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sistema</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cap. Extr.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cap. Desn.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Alm.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">N° Registro</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Certificador</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HISTORICO_CERTIFICACIONES.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                    <History size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Sin registros históricos disponibles</p>
                  </td>
                </tr>
              )}
              {HISTORICO_CERTIFICACIONES.map((entry, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100 dark:border-slate-800">
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-md uppercase",
                      entry.estado === 'VIGENTE'
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : entry.estado === 'VENCIDO' || entry.estado === 'RECHAZADO'
                          ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                          : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    )}>
                      {entry.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500 font-medium tabular-nums">{entry.fechaIngreso || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium tabular-nums">{entry.fechaEmision}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.nombreCentro}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{entry.codigoCentro}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{entry.empresa}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{entry.acs}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-md whitespace-nowrap">
                      {entry.tipoSistema || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">{entry.capExtraccion}</td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">{entry.capDesnaturalizacion}</td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">{entry.capAlmacenamiento}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{entry.numRegistro || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{entry.nombreCertificador || '—'}</td>
                  <td className="px-6 py-4">
                    {entry.observaciones && entry.observaciones !== 'NO'
                      ? <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-md uppercase">{entry.observaciones}</span>
                      : <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormCard>

    </div>
  );

  const CompanyHint = ({ section }: { section: 'extraccion' | 'desnaturalizacion' | 'almacenamiento' }) => {
    if (!showHints) return null;
    const titular = state.general.centro_cultivo.titular.toUpperCase();
    if (!titular.trim()) return null;
    const hint = EMPRESA_HINTS.find(h => h.keywords.some(k => titular.includes(k)));
    if (!hint) return null;
    const text = hint[section];
    if (!text) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20"
      >
        <Info size={13} className="shrink-0 mt-0.5 text-indigo-400 dark:text-indigo-400" />
        <p className="text-[11px] leading-relaxed text-indigo-700/80 dark:text-indigo-300/70">{text}</p>
      </motion.div>
    );
  };

  const ExtractionView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader 
          title="Sistema de Extracción" 
          icon={Waves} 
          description="Cálculo de capacidad diaria de extracción de mortalidad (Mínimo 15 TN/Día)."
        />
        <StatusBadge status={state.extraction.resultados.cumple_norma} />
      </div>
      <CompanyHint section="extraccion" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FormCard title="Métodos y Equipos" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistemas de Apoyo</h4>
              <div className="grid grid-cols-2 gap-4">
                <CheckboxField label="Buceo" checked={state.extraction.sistemas_apoyo.buceo} onChange={(v) => updateExtraction('sistemas_apoyo.buceo', v)} />
                <CheckboxField label="ROV" checked={state.extraction.sistemas_apoyo.rov} onChange={(v) => updateExtraction('sistemas_apoyo.rov', v)} />
                <CheckboxField label="Yoma" checked={state.extraction.sistemas_apoyo.succion_yoma} onChange={(v) => updateExtraction('sistemas_apoyo.succion_yoma', v)} />
                <CheckboxField label="Automática" checked={state.extraction.sistemas_apoyo.automatica} onChange={(v) => updateExtraction('sistemas_apoyo.automatica', v)} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sistema Principal</label>
                <select
                  value={state.extraction.parametros.sistema_principal}
                  onChange={(e) => updateExtraction('parametros.sistema_principal', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="LIFT-UP (Novatech)">LIFT-UP (Novatech)</option>
                  <option value="Mortex HW">Mortex HW</option>
                  <option value="ROV">ROV</option>
                  <option value="Succión por Yoma">Succión por Yoma</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Talla de Pez</label>
                <select
                  value={state.extraction.parametros.talla_pez}
                  onChange={(e) => updateExtraction('parametros.talla_pez', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="Pequeño (<1.5kg)">Pequeño (&lt;1.5kg)</option>
                  <option value="Mediano (1.5-4.5kg)">Mediano (1.5-4.5kg)</option>
                  <option value="Grande (>=4.5kg)">Grande (&gt;=4.5kg)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Línea de Extracción (Catálogo)</label>
                <select
                  value={state.extraction.parametros.id_catalogo_equipo}
                  onChange={(e) => handleSelectExtractionSystem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="">Seleccionar equipo...</option>
                  {CATALOGO_EXTRACCION.sistemas.map(s => (
                    <option key={s.id} value={s.id}>{s.marca} {s.modelo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Equipo de Aire (Catálogo)</label>
                <select
                  value={state.extraction.parametros.id_catalogo_compresor}
                  onChange={(e) => handleSelectCompressor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                >
                  <option value="">Seleccionar compresor...</option>
                  {CATALOGO_EXTRACCION.compresores.map(c => (
                    <option key={c.id} value={c.id}>{c.marca} {c.modelo}</option>
                  ))}
                </select>
              </div>

              <InputField label="Marca Equipo" value={state.extraction.parametros.marca_equipo} onChange={(v) => updateExtraction('parametros.marca_equipo', v)} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Tipo Compresor" value={state.extraction.parametros.tipo_compresor} onChange={(v) => updateExtraction('parametros.tipo_compresor', v)} />
                <InputField label="Potencia (CFM)" type="number" value={state.extraction.parametros.potencia_cfm} onChange={(v) => updateExtraction('parametros.potencia_cfm', v)} suffix="CFM" />
              </div>
              <InputField
                label="Ubicación del Compresor"
                value={state.extraction.parametros.ubicacion_compresor}
                onChange={(v) => updateExtraction('parametros.ubicacion_compresor', v)}
                placeholder="Ej. A/N Pontón, cubierta popa"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parámetros Técnicos</h4>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Total Jaulas" type="number" value={state.extraction.parametros.numero_total_jaulas} onChange={(v) => updateExtraction('parametros.numero_total_jaulas', v)} />
                <InputField label="Jaulas Simult." type="number" value={state.extraction.parametros.jaulas_simultaneas} onChange={(v) => updateExtraction('parametros.jaulas_simultaneas', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Personal Op." type="number" value={state.extraction.parametros.personal_operativo} onChange={(v) => updateExtraction('parametros.personal_operativo', v)} />
                <InputField label="Profundidad" type="number" value={state.extraction.parametros.profundidad_operacion_m} onChange={(v) => updateExtraction('parametros.profundidad_operacion_m', v)} suffix="m" />
              </div>
              <InputField label="Horas Trabajo" type="number" value={state.extraction.parametros.horas_efectivas_trabajo} onChange={(v) => updateExtraction('parametros.horas_efectivas_trabajo', v)} suffix="Hrs" min={0.5} max={24} />
              <InputField label="Ajuste Biomasa" type="number" value={state.extraction.parametros.factor_ajuste_biomasa} onChange={(v) => updateExtraction('parametros.factor_ajuste_biomasa', v)} min={0.1} max={2.0} />
              <InputField label="Disponibilidad fd₀" type="number" value={state.extraction.parametros.disponibilidad_base_fd} onChange={(v) => updateExtraction('parametros.disponibilidad_base_fd', v)} min={0.1} max={1.0} />
              <InputField label="Motocompresores/Jaula" type="number" value={state.extraction.parametros.motocompresores_por_jaula} onChange={(v) => updateExtraction('parametros.motocompresores_por_jaula', v)} />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Observación Sistema</label>
                <textarea
                  value={state.extraction.parametros.observacion_sistema}
                  onChange={(e) => updateExtraction('parametros.observacion_sistema', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </FormCard>

        <div className="space-y-6">
          <FormCard title="Resultados" className="bg-indigo-900 border-indigo-800">
            <div className="space-y-6 text-white">
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Ciclos por Día</p>
                <p className="text-4xl font-mono font-bold tracking-tighter">{state.extraction.resultados.ciclos_por_dia}</p>
              </div>
              <div className="pt-6 border-t border-indigo-800">
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Capacidad Diaria</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-mono font-bold tracking-tighter text-emerald-400">{state.extraction.resultados.capacidad_diaria_ton}</p>
                  <p className="text-indigo-300 font-medium">TN/DÍA</p>
                </div>
              </div>
            </div>
          </FormCard>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <Info className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              La capacidad mínima exigida por la Res. 1511 es de 15 toneladas diarias para sistemas de extracción.
            </p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('extraction')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'extraction'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'extraction'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
    </div>
  );

  const DenaturationView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader
          title={`Desnaturalización (${state.denaturation.equipos.tipo_sistema === 'Incineración' ? 'Incineración Térmica' : 'Ensilaje Químico'})`}
          icon={FlaskConical}
          description={state.denaturation.equipos.tipo_sistema === 'Incineración'
            ? 'Cálculo de capacidad por incineración térmica (Mínimo 15 TN/Día).'
            : 'Cálculo de capacidad por ciclos (Batch) y equipos de trituración (Mínimo 15 TN/Día).'}
        />
        <StatusBadge status={state.denaturation.resultados.cumple_norma} />
      </div>
      <CompanyHint section="desnaturalizacion" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FormCard title="Tipo de Sistema">
            <div className="flex gap-4">
              <button 
                onClick={() => updateDenaturation('equipos.tipo_sistema', 'Ensilaje')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium",
                  state.denaturation.equipos.tipo_sistema === 'Ensilaje' 
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                Ensilaje Químico
              </button>
              <button 
                onClick={() => updateDenaturation('equipos.tipo_sistema', 'Incineración')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium",
                  state.denaturation.equipos.tipo_sistema === 'Incineración' 
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                Incineración Térmica
              </button>
            </div>
          </FormCard>

          {state.denaturation.equipos.tipo_sistema === 'Ensilaje' ? (
            <>
              <FormCard title="Equipos y Trituración">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Olla Trituradora (Catálogo)</label>
                <select 
                  value={state.denaturation.equipos.id_catalogo_trituradora}
                  onChange={(e) => handleSelectTrituradora(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                      <option value="">Seleccionar trituradora...</option>
                      {CATALOGO_DESNATURALIZACION.trituradoras.map(t => (
                        <option key={t.id} value={t.id}>{t.marca_modelo}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Marca/Modelo Olla" value={state.denaturation.equipos.marca_modelo} onChange={(v) => updateDenaturation('equipos.marca_modelo', v)} />
                  <InputField label="Material Construcción" value={state.denaturation.equipos.material_construccion} onChange={(v) => updateDenaturation('equipos.material_construccion', v)} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estado Olla Trituradora</label>
                    <select
                      value={state.denaturation.equipos.estado_olla}
                      onChange={(e) => updateDenaturation('equipos.estado_olla', e.target.value)}
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm dark:[color-scheme:dark]",
                        state.denaturation.equipos.estado_olla === 'Bueno'
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                          : state.denaturation.equipos.estado_olla === 'Regular'
                          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                          : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
                      )}
                    >
                      <option value="Bueno">Bueno — sin fugas</option>
                      <option value="Regular">Regular — presenta observaciones</option>
                      <option value="Malo">Malo — requiere revisión</option>
                    </select>
                  </div>
                  <InputField label="Velocidad Nominal" type="number" value={state.denaturation.equipos.velocidad_nominal_kg_hr} onChange={(v) => updateDenaturation('equipos.velocidad_nominal_kg_hr', v)} suffix="Kg/Hr" />
                  <InputField label="Horas Operación" type="number" value={state.denaturation.equipos.horas_funcionamiento_dia} onChange={(v) => updateDenaturation('equipos.horas_funcionamiento_dia', v)} suffix="Hrs/Día" />
                  <div className="flex items-center gap-8 py-2 md:col-span-2">
                    <div className="flex flex-col gap-2">
                      <CheckboxField label="Prepicador" checked={state.denaturation.equipos.cuenta_con_prepicador} onChange={(v) => updateDenaturation('equipos.cuenta_con_prepicador', v)} />
                      {state.denaturation.equipos.cuenta_con_prepicador && (
                        <p className="text-[10px] text-indigo-600 font-bold ml-6">CAPACIDAD: {state.denaturation.equipos.capacidad_prepicador_kg_hr} KG/HR</p>
                      )}
                    </div>
                    <CheckboxField label="Recirculación Ácido" checked={state.denaturation.equipos.cuenta_con_recirculacion_acido} onChange={(v) => updateDenaturation('equipos.cuenta_con_recirculacion_acido', v)} />
                  </div>
                </div>
              </FormCard>

              <FormCard title="Cálculo de Ciclo (Batch)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const tri = CATALOGO_DESNATURALIZACION.trituradoras.find(
                      t => t.id === state.denaturation.equipos.id_catalogo_trituradora
                    );
                    if (!tri?.configuraciones_batch?.length) return null;
                    return (
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Configuración de Batch (Catálogo)</label>
                        <select
                          defaultValue=""
                          key={tri.id}
                          onChange={(e) => {
                            const cfg = tri.configuraciones_batch!.find(c => c.label === e.target.value);
                            if (cfg) {
                              updateDenaturation('parametros_batch.kilos_por_batch', cfg.kilos);
                              updateDenaturation('parametros_batch.tiempo_procesamiento_min', cfg.t_proceso);
                              updateDenaturation('parametros_batch.tiempo_pausa_min', cfg.t_pausa);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="">Seleccionar configuración registrada...</option>
                          {tri.configuraciones_batch.map(c => (
                            <option key={c.label} value={c.label}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  <InputField label="Kilos por Batch" type="number" value={state.denaturation.parametros_batch.kilos_por_batch} onChange={(v) => updateDenaturation('parametros_batch.kilos_por_batch', v)} suffix="Kg" min={1} max={5000} />
                  <InputField label="Tiempo Proceso" type="number" value={state.denaturation.parametros_batch.tiempo_procesamiento_min} onChange={(v) => updateDenaturation('parametros_batch.tiempo_procesamiento_min', v)} suffix="Min" min={1} max={240} />
                  <InputField label="Tiempo Pausa" type="number" value={state.denaturation.parametros_batch.tiempo_pausa_min} onChange={(v) => updateDenaturation('parametros_batch.tiempo_pausa_min', v)} suffix="Min" min={0} max={120} />
                </div>
              </FormCard>

              <FormCard title="Incinerador Secundario (Sistema Complementario)">
                <div className="space-y-4">
                  <CheckboxField
                    label="¿Centro cuenta con incinerador como sistema secundario?"
                    checked={state.denaturation.incinerador.activo}
                    onChange={(v) => updateDenaturation('incinerador.activo', v)}
                  />
                  {state.denaturation.incinerador.activo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Incinerador (Catálogo)</label>
                        <select
                          value={state.denaturation.incinerador.id_catalogo}
                          onChange={(e) => handleSelectIncineradorSecundario(e.target.value)}
                          className="w-full px-4 py-2.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="">Seleccionar incinerador...</option>
                          {CATALOGO_DESNATURALIZACION.incineradores.map(i => (
                            <option key={i.id} value={i.id}>{i.marca_modelo} — {i.capacidad_carga_kg_h} kg/h</option>
                          ))}
                        </select>
                      </div>
                      <InputField label="Horas Operación" type="number" value={state.denaturation.incinerador.horas_funcionamiento_dia} onChange={(v) => updateDenaturation('incinerador.horas_funcionamiento_dia', v)} suffix="Hrs/Día" min={1} max={24} />
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Capacidad Calculada</label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {((state.denaturation.incinerador.capacidad_carga_kg_h * state.denaturation.incinerador.horas_funcionamiento_dia) / 1000).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">TN/Día</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sistema de Carga</label>
                        <select value={state.denaturation.incinerador.sistema_carga} onChange={(e) => updateDenaturation('incinerador.sistema_carga', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none">
                          {OPCIONES_INCINERADOR.sistema_carga.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sistema de Descarga</label>
                        <select value={state.denaturation.incinerador.sistema_descarga} onChange={(e) => updateDenaturation('incinerador.sistema_descarga', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none">
                          {OPCIONES_INCINERADOR.sistema_descarga.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Disposición Final</label>
                        <select value={state.denaturation.incinerador.disposicion_final} onChange={(e) => updateDenaturation('incinerador.disposicion_final', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none">
                          {OPCIONES_INCINERADOR.disposicion_final.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Almacenamiento Gas</label>
                        <select value={state.denaturation.incinerador.almacenamiento_gas} onChange={(e) => updateDenaturation('incinerador.almacenamiento_gas', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none">
                          {OPCIONES_INCINERADOR.almacenamiento_gas.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <InputField label="Observaciones" value={state.denaturation.incinerador.observaciones} onChange={(v) => updateDenaturation('incinerador.observaciones', v)} />
                      </div>
                    </div>
                  )}
                </div>
              </FormCard>
            </>
          ) : (
            <FormCard title="Sistema de Incineración">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Incinerador (Catálogo)</label>
                <select 
                  value={state.denaturation.equipos.id_catalogo_incinerador}
                  onChange={(e) => handleSelectIncinerador(e.target.value)}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                    <option value="">Seleccionar incinerador...</option>
                    {CATALOGO_DESNATURALIZACION.incineradores.map(i => (
                      <option key={i.id} value={i.id}>{i.marca_modelo}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Marca/Modelo" value={state.denaturation.equipos.marca_modelo} onChange={(v) => updateDenaturation('equipos.marca_modelo', v)} />
                <InputField label="Horas Operación" type="number" value={state.denaturation.equipos.horas_funcionamiento_dia} onChange={(v) => updateDenaturation('equipos.horas_funcionamiento_dia', v)} suffix="Hrs/Día" />
                <InputField label="Capacidad Carga" type="number" value={state.denaturation.parametros_incineracion.capacidad_carga_kg_h} onChange={(v) => updateDenaturation('parametros_incineracion.capacidad_carga_kg_h', v)} suffix="Kg/Hr" />
                <InputField label="Temp. Operación" value={state.denaturation.parametros_incineracion.temperatura_operacion} onChange={(v) => updateDenaturation('parametros_incineracion.temperatura_operacion', v)} />
                <InputField label="Cámara Primaria" value={state.denaturation.parametros_incineracion.camara_primaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_primaria', v)} />
                <InputField label="Cámara Secundaria" value={state.denaturation.parametros_incineracion.camara_secundaria} onChange={(v) => updateDenaturation('parametros_incineracion.camara_secundaria', v)} />
              </div>
            </FormCard>
          )}

          <FormCard title="Generación Eléctrica">
            <div className="space-y-4">
              {state.denaturation.generacion_electrica.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">Sin generadores registrados.</p>
              )}
              {state.denaturation.generacion_electrica.map((gen, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="md:col-span-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generador {idx + 1}</span>
                    <button onClick={() => handleRemoveGenerator(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">✕ Quitar</button>
                  </div>

                  {/* Tipo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
                    <select
                      value={gen.tipo}
                      onChange={(e) => handleUpdateGenerator(idx, 'tipo', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                    >
                      <option value="Principal">Principal</option>
                      <option value="Backup">Backup</option>
                      <option value="Emergencia">Emergencia</option>
                    </select>
                  </div>

                  {/* Catálogo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Modelo (Catálogo)</label>
                    <select
                      value={CATALOGO_GENERADORES.find(g => g.modelo === gen.modelo)?.id || ''}
                      onChange={(e) => handleSelectGenerator(idx, e.target.value)}
                      className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium dark:[color-scheme:dark]"
                    >
                      <option value="">Seleccionar...</option>
                      {CATALOGO_GENERADORES.map(g => (
                        <option key={g.id} value={g.id}>{g.marca} {g.modelo} — {g.kva} kVA</option>
                      ))}
                    </select>
                  </div>

                  <InputField label="Marca" value={gen.marca} onChange={(v) => handleUpdateGenerator(idx, 'marca', v)} />
                  <InputField label="Capacidad" type="number" value={gen.capacidad_kva} onChange={(v) => handleUpdateGenerator(idx, 'capacidad_kva', v)} suffix="kVA" />
                  <div className="md:col-span-2">
                    <InputField label="Ubicación" value={gen.ubicacion} onChange={(v) => handleUpdateGenerator(idx, 'ubicacion', v)} placeholder="Ej: Pontón de ensilaje" />
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddGenerator}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm font-medium"
              >
                + Agregar Generador
              </button>
            </div>
          </FormCard>
        </div>

        <div className="space-y-6">
          <FormCard title="Resultados" className="bg-slate-900 border-slate-800">
            <div className="space-y-6 text-white">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Duración Batch</p>
                <p className="text-4xl font-mono font-bold tracking-tighter">{state.denaturation.resultados.duracion_total_batch_min} <span className="text-xl text-slate-500">MIN</span></p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Batches por Día</p>
                <p className="text-4xl font-mono font-bold tracking-tighter">{state.denaturation.resultados.numero_batches_dia}</p>
              </div>
              <div className="pt-6 border-t border-slate-800">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Capacidad Diaria</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-mono font-bold tracking-tighter text-indigo-400">{state.denaturation.resultados.capacidad_diaria_ton}</p>
                  <p className="text-slate-400 font-medium">TN/DÍA</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Observación Acta (Auto)</p>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-[10px] leading-relaxed text-slate-300 font-mono italic">
                    {state.denaturation.resultados.observacion_automatica}
                  </p>
                </div>
              </div>
            </div>
          </FormCard>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('denaturation')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'denaturation'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'denaturation'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
    </div>
  );

  const StorageView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader 
          title="Almacenamiento" 
          icon={Database} 
          description="Capacidad de acopio de biomasa desnaturalizada (Mínimo 20 TN)."
        />
        <StatusBadge status={state.storage.resultados.cumple_norma} />
      </div>
      <CompanyHint section="almacenamiento" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FormCard title="Capacidad de Estanques">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capacidad Estanque (Catálogo)</label>
                <select 
                  value={state.storage.parametros.capacidad_almacenaje_m3}
                  onChange={(e) => updateStorage('parametros.capacidad_almacenaje_m3', parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar m³...</option>
                  {CATALOGO_ALMACENAMIENTO.map(m3 => (
                    <option key={m3} value={m3}>{m3} m³</option>
                  ))}
                </select>
              </div>
              <InputField label="Capacidad Estanque" type="number" value={state.storage.parametros.capacidad_almacenaje_m3} onChange={(v) => updateStorage('parametros.capacidad_almacenaje_m3', v)} suffix="m³" />
              <InputField label="Factor Densidad" type="number" value={state.storage.parametros.factor_densidad} onChange={(v) => updateStorage('parametros.factor_densidad', v)} suffix="TN/m³" min={0.5} max={2.5} />
              <div className="md:col-span-2">
                <InputField label="Observaciones" value={state.storage.parametros.observaciones} onChange={(v) => updateStorage('parametros.observaciones', v)} />
              </div>
            </div>
          </FormCard>

          <FormCard title="Dimensiones A/N Pontón">
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Eslora" value={state.storage.infraestructura.eslora_m} onChange={(v) => updateStorage('infraestructura.eslora_m', v)} suffix="m" placeholder="25" />
              <InputField label="Manga" value={state.storage.infraestructura.manga_m} onChange={(v) => updateStorage('infraestructura.manga_m', v)} suffix="m" placeholder="8" />
              <InputField label="Puntual" value={state.storage.infraestructura.puntual_m} onChange={(v) => updateStorage('infraestructura.puntual_m', v)} suffix="m" placeholder="1.2" />
            </div>
          </FormCard>

          <FormCard title="Infraestructura y Seguridad">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Material Pretil</label>
                <select
                  value={state.storage.infraestructura.pretil_material}
                  onChange={(e) => updateStorage('infraestructura.pretil_material', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.pretil_material.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estado Pretil</label>
                <select
                  value={state.storage.infraestructura.pretil_estado}
                  onChange={(e) => updateStorage('infraestructura.pretil_estado', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Material Piping</label>
                <select
                  value={state.storage.infraestructura.piping_material}
                  onChange={(e) => updateStorage('infraestructura.piping_material', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.piping_material.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Diámetro Piping</label>
                <select
                  value={state.storage.infraestructura.piping_diametro}
                  onChange={(e) => updateStorage('infraestructura.piping_diametro', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.piping_diametro.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Válvulas Piping</label>
                <select
                  value={state.storage.infraestructura.piping_valvulas}
                  onChange={(e) => updateStorage('infraestructura.piping_valvulas', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar...</option>
                  {OPCIONES_INFRAESTRUCTURA.piping_valvulas.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estado Piping</label>
                <select
                  value={state.storage.infraestructura.piping_estado}
                  onChange={(e) => updateStorage('infraestructura.piping_estado', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
            </div>
          </FormCard>
        </div>

        <div className="space-y-6">
          <FormCard title="Resultado Almacenaje" className="bg-emerald-900 border-emerald-800">
            <div className="space-y-6 text-white">
              <div>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Capacidad Total</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-mono font-bold tracking-tighter text-white">{state.storage.resultados.capacidad_almacenaje_ton}</p>
                  <p className="text-emerald-300 font-medium">TN</p>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest mb-2">Fórmula Aplicada</p>
                <p className="text-xs font-mono">m³ × 1.2 (Densidad Ácido Fórmico)</p>
              </div>
            </div>
          </FormCard>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('storage')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'storage'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'storage'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
    </div>
  );

  const ReportView = () => {
    const SECCIONES_CONTEO: { label: string; key: string }[] = [
      { label: 'General',          key: 'General' },
      { label: 'Extracción',       key: 'Extracción' },
      { label: 'Desnaturalización',key: 'Desnaturalización' },
      { label: 'Almacenamiento',   key: 'Almacenamiento' },
    ];
    const clasificadas = new Set(SECCIONES_CONTEO.map(s => s.key));
    const sinClasificar = state.images.filter(i => !clasificadas.has(i.seccion)).length;
    const total = state.images.length;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader
          title="Informe Técnico e Imágenes"
          icon={Camera}
          description="Grilla de registro fotográfico. Arrastra imágenes y asigna estados y leyendas."
        />

        {/* Contador por sección — sticky */}
        <div className="sticky top-0 z-30 -mx-8 md:-mx-12 px-8 md:px-12 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {total} {total === 1 ? 'imagen' : 'imágenes'}
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          {SECCIONES_CONTEO.map(({ label, key }) => {
            const count = state.images.filter(i => i.seccion === key).length;
            return (
              <span
                key={key}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  count > 0
                    ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700"
                )}
              >
                {label}
                <span className={cn(
                  "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                  count > 0 ? "bg-indigo-600 text-white" : "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                )}>
                  {count}
                </span>
              </span>
            );
          })}
          {sinClasificar > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              Sin clasificar
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {sinClasificar}
              </span>
            </span>
          )}
          {isAdmin && total > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 ml-auto" />
              <button
                onClick={() => {
                  if (window.confirm(`¿Borrar las ${total} fotos? Esta acción no se puede deshacer.`)) {
                    idbClear();
                    setState(prev => ({ ...prev, images: [] }));
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={11} />
                Borrar fotos
              </button>
            </>
          )}
        </div>

        {/* Adjuntar Registro de Visita PDF */}
        {isAdmin && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Registro de Visita</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {registroVisitaProcessing
                    ? `Procesando página… ${registroVisitaProgress}%`
                    : registroVisitaName
                      ? `📄 ${registroVisitaName} — ${registroVisitaRef.current?.length ?? 0} pág.`
                      : 'Adjunta el PDF — se comprimirá e insertará al final del Informe Técnico'}
                </p>
              </div>
              <input
                ref={registroVisitaInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleRegistroVisitaUpload}
              />
              {registroVisitaName && !registroVisitaProcessing && (
                <button
                  onClick={() => { registroVisitaRef.current = null; setRegistroVisitaName(null); }}
                  className="text-rose-500 hover:text-rose-600 transition-colors"
                  title="Quitar PDF"
                >
                  <XCircle size={18} />
                </button>
              )}
              <button
                onClick={() => registroVisitaInputRef.current?.click()}
                disabled={registroVisitaProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold rounded-xl transition-all shrink-0"
              >
                {registroVisitaProcessing
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  : <FileDown size={15} />}
                {registroVisitaProcessing ? `${registroVisitaProgress}%` : registroVisitaName ? 'Cambiar' : 'Adjuntar PDF'}
              </button>
            </div>
            {/* Barra de progreso Registro de Visita */}
            {registroVisitaProcessing && (
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700">
                <motion.div
                  className="h-full bg-indigo-500 rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${registroVisitaProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Barra de progreso carga de imágenes */}
        <AnimatePresence>
          {(imagesRestoring || imagesUploadProgress) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-indigo-300 dark:border-indigo-500/50 border-t-indigo-600 dark:border-t-indigo-400 rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {imagesRestoring && !imagesUploadProgress
                      ? 'Restaurando imágenes guardadas…'
                      : imagesUploadProgress
                        ? `Procesando imágenes… ${imagesUploadProgress.done} de ${imagesUploadProgress.total}`
                        : ''}
                  </p>
                </div>
                {imagesUploadProgress && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
                    {Math.round((imagesUploadProgress.done / imagesUploadProgress.total) * 100)}%
                  </span>
                )}
              </div>
              {imagesUploadProgress && (
                <div className="h-1 bg-indigo-100 dark:bg-indigo-500/20">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((imagesUploadProgress.done / imagesUploadProgress.total) * 100)}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
              )}
              {imagesRestoring && !imagesUploadProgress && (
                <div className="h-1 bg-indigo-100 dark:bg-indigo-500/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-400 rounded-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          {...dropzoneRootProps()}
          className={cn(
            "border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer",
            isDragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
              : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50"
          )}
        >
          <input {...dropzoneInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus size={32} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Añadir Fotografías</p>
              <p className="text-slate-500 dark:text-slate-400">Arrastra archivos aquí o haz clic para seleccionar</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {state.images.map((img) => {
              // Leyendas ya usadas en la misma sección (excluyendo esta imagen)
              const usedLeyendas = state.images
                .filter(i => i.seccion === img.seccion && i.id !== img.id && i.leyenda !== '')
                .map(i => i.leyenda);

              // Avisar si ya existe una Portada
              const isPortada = img.seccion === 'Portada';
              const portadaConflict = isPortada && state.images.filter(i => i.seccion === 'Portada').length > 1;

              // Fotos de Ubicación Espacial: indicar cuántas hay (máx recomendado = 4)
              const isUbicacion = img.seccion === 'Ubicación Espacial';
              const ubicacionCount = state.images.filter(i => i.seccion === 'Ubicación Espacial').length;

              return (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm group",
                    isPortada ? "border-violet-300 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900"
                    : isUbicacion ? "border-sky-300 dark:border-sky-600"
                    : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  {/* Etiqueta especial para Portada / Ubicación */}
                  {(isPortada || isUbicacion) && (
                    <div className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2",
                      isPortada ? "bg-violet-600" : "bg-sky-600"
                    )}>
                      {isPortada ? '★ Foto Portada — Aparece en la tapa del informe' : `Ubicación Espacial ${ubicacionCount > 4 ? '⚠ máx. 4 recomendadas' : `(${ubicacionCount}/4)`}`}
                    </div>
                  )}
                  {portadaConflict && (
                    <div className="px-4 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                      ⚠ Solo se usará la primera foto Portada en el informe
                    </div>
                  )}

                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                    <img src={img.url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className={cn(
                      "absolute bottom-3 left-3 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white shadow-lg",
                      img.estado === 'Verde' ? "bg-emerald-500" : img.estado === 'Amarillo' ? "bg-amber-500" : "bg-rose-500"
                    )}>
                      {img.estado}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Badge IA */}
                    {(aiClassifying.has(img.id) || aiMeta[img.id]) && (
                      <div className="flex items-center gap-2">
                        {aiClassifying.has(img.id) && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-xs text-violet-600 dark:text-violet-400">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                              className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full" />
                            <span>Clasificando…</span>
                          </div>
                        )}
                        {!aiClassifying.has(img.id) && aiMeta[img.id] && (
                          <div
                            title={aiMeta[img.id].justificacion}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-xs font-semibold text-violet-700 dark:text-violet-300 cursor-help"
                          >
                            <Star size={10} className="shrink-0" />
                            IA · {Math.round(aiMeta[img.id].confianza * 100)}%
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sección</label>
                        <select
                          value={img.seccion}
                          onChange={(e) => updateImage(img.id, { seccion: e.target.value as ImageSeccion })}
                          className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-slate-900 dark:text-slate-100"
                        >
                          <optgroup label="── Informe ──">
                            <option value="Portada">★ Foto Portada</option>
                            <option value="Ubicación Espacial">Ubicación Espacial (4 fotos)</option>
                          </optgroup>
                          <optgroup label="── Secciones técnicas ──">
                            <option value="Extracción">Extracción</option>
                            <option value="Desnaturalización">Desnaturalización</option>
                            <option value="Almacenamiento">Almacenamiento</option>
                            <option value="General">General</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estado</label>
                        <select
                          value={img.estado}
                          onChange={(e) => updateImage(img.id, { estado: e.target.value as any })}
                          className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-slate-900 dark:text-slate-100"
                        >
                          <option value="Verde">Bueno (Verde)</option>
                          <option value="Amarillo">Regular (Amarillo)</option>
                          <option value="Rojo">Malo (Rojo)</option>
                        </select>
                      </div>
                    </div>
                    <LeyendaCombo
                      seccion={img.seccion}
                      value={img.leyenda}
                      onChange={(v) => updateImage(img.id, { leyenda: v })}
                      m3={state.storage.parametros.capacidad_almacenaje_m3}
                      kva={state.denaturation.generacion_electrica[0]?.capacidad_kva ?? 0}
                      usedLeyendas={usedLeyendas}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleGuardar('report')}
            disabled={!!guardandoSection}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
          >
            {guardandoSection === 'report'
              ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Save size={18} /></motion.div> Guardando…</>
              : guardadoSection === 'report'
                ? <><CheckCircle2 size={18} /> Guardado</>
                : <><Save size={18} /> Guardar sección</>
            }
          </button>
        </div>
      )}
      </div>
    );
  };

  const IssueView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <SectionHeader 
        title="Emitir Certificación" 
        icon={FileText} 
        description="Validación final de cumplimiento y generación de documentos PDF."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormCard title="Checklist de Validación">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", state.extraction.resultados.cumple_norma ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400")}>
                  {state.extraction.resultados.cumple_norma ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Extracción</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 15 TN/Día</p>
                </div>
              </div>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{state.extraction.resultados.capacidad_diaria_ton} TN</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", state.denaturation.resultados.cumple_norma ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400")}>
                  {state.denaturation.resultados.cumple_norma ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Desnaturalización</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 15 TN/Día</p>
                </div>
              </div>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{state.denaturation.resultados.capacidad_diaria_ton} TN</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", state.storage.resultados.cumple_norma ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400")}>
                  {state.storage.resultados.cumple_norma ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Almacenamiento</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 20 TN</p>
                </div>
              </div>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{state.storage.resultados.capacidad_almacenaje_ton} TN</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", hasImages ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400")}>
                  {hasImages ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Registro Fotográfico</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hasImages ? `Imágenes cargadas: ${state.images.length}` : 'Recomendado — sin fotos el informe no tendrá anexo visual'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FormCard>

        <div className="flex flex-col justify-center items-center p-12 bg-indigo-600 rounded-3xl text-white text-center space-y-6 shadow-xl shadow-indigo-500/20">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <FileDown size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Generar Documentación</h3>
            <p className="text-indigo-100 text-sm max-w-xs">
              Genera cada documento por separado en formato PDF.
            </p>
          </div>

          {/* Botón Certificado */}
          <button
            disabled={!canEmit || generating !== null || !isAdmin}
            onClick={generateCertificadoPDF}
            className={cn(
              "w-full py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg",
              canEmit && generating === null
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95"
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {generating === 'certificado'
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /> Generando...</>
              : <><FileDown size={20} /> Generar Certificado</>}
          </button>

          {/* Botón Informe */}
          <button
            disabled={!canEmit || generating !== null || !isAdmin}
            onClick={generateInformePDF}
            className={cn(
              "w-full py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg",
              canEmit && generating === null
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95"
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {generating === 'informe'
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /> Generando...</>
              : <><FileText size={20} /> Generar Informe Técnico</>}
          </button>

          {/* Botón Acta */}
          <button
            disabled={generating !== null || !isAdmin}
            onClick={async () => {
              setGenerating('acta');
              try {
                await generateActaPdf(state);
              } finally {
                setGenerating(null);
              }
            }}
            className={cn(
              "w-full py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg",
              generating === null
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95"
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {generating === 'acta'
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /> Generando PDF…</>
              : <><ShieldCheck size={20} /> Descargar Acta de Inspección</>}
          </button>

          {!canEmit && (
            <p className="text-xs text-indigo-200 italic">
              * Asegúrate de que los 3 sistemas cumplan las capacidades mínimas.
            </p>
          )}
          {canEmit && !hasImages && (
            <p className="text-xs text-amber-300 italic">
              * Sin fotos el PDF no incluirá anexo fotográfico.
            </p>
          )}
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-500">
      <MarineBackground />
      <AnimatePresence>
        {showWelcome && <WelcomeScreen setUserRole={setUserRole} setShowWelcome={setShowWelcome} />}
      </AnimatePresence>
      
      {/* Sidebar Navigation */}
      <aside className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col sticky top-0 h-screen transition-all duration-500 z-50 shadow-2xl shadow-slate-200/40 dark:shadow-none",
        isSidebarCollapsed ? "w-24" : "w-80"
      )}>
        <div className={cn("p-6 border-b border-slate-100 dark:border-slate-800 relative", isSidebarCollapsed ? "px-4 py-8" : "p-10")}>
          <Logo collapsed={isSidebarCollapsed} />
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-md z-10"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          <NavItem 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')} 
            icon={LayoutDashboard} 
            label="General" 
            collapsed={isSidebarCollapsed} 
          />
          <NavItem 
            active={activeTab === 'extraction'} 
            onClick={() => setActiveTab('extraction')} 
            icon={Waves} 
            label="Extracción" 
            collapsed={isSidebarCollapsed} 
          />
          <NavItem 
            active={activeTab === 'denaturation'} 
            onClick={() => setActiveTab('denaturation')} 
            icon={FlaskConical} 
            label="Desnaturalización" 
            collapsed={isSidebarCollapsed} 
          />
          <NavItem 
            active={activeTab === 'storage'} 
            onClick={() => setActiveTab('storage')} 
            icon={Database} 
            label="Almacenamiento" 
            collapsed={isSidebarCollapsed} 
          />
          <NavItem 
            active={activeTab === 'report'} 
            onClick={() => setActiveTab('report')} 
            icon={Camera} 
            label="Informe" 
            collapsed={isSidebarCollapsed} 
          />
          <NavItem 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={History} 
            label="Históricos" 
            collapsed={isSidebarCollapsed} 
          />

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <NavItem 
              active={activeTab === 'issue'} 
              onClick={() => setActiveTab('issue')} 
              icon={ShieldCheck} 
              label="Certificado" 
              collapsed={isSidebarCollapsed} 
              variant="emerald"
            />
            {/* Guardar borrador como archivo */}
            <button
              onClick={exportDraft}
              title="Guardar borrador como archivo JSON"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700",
                isSidebarCollapsed ? "justify-center px-0" : ""
              )}
            >
              <Save size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Guardar Borrador</span>}
            </button>

            {/* Cargar borrador desde archivo — solo admin */}
            <label
              title={isAdmin ? "Cargar borrador desde archivo JSON" : "Solo administradores pueden cargar borradores"}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isAdmin
                  ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 cursor-pointer"
                  : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50",
                isSidebarCollapsed ? "justify-center px-0" : ""
              )}
            >
              <input
                ref={importDraftRef}
                type="file"
                accept=".json"
                className="hidden"
                disabled={!isAdmin}
                onChange={importDraft}
              />
              <ArrowRight size={20} className="rotate-180" />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Cargar Borrador</span>}
            </label>

            <button
              onClick={loadTestData}
              disabled={!isAdmin}
              title={isAdmin ? "Cargar datos de prueba — Centro 110814 PAMELA" : "Solo administradores"}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                isAdmin
                  ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700"
                  : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50",
                isSidebarCollapsed ? "justify-center px-0" : ""
              )}
            >
              <TestTube2 size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Datos de Prueba</span>}
            </button>
            <button
              onClick={resetState}
              disabled={!isAdmin}
              title={isAdmin ? "Borrar borrador actual" : "Solo administradores"}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                isAdmin
                  ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600"
                  : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50",
                isSidebarCollapsed ? "justify-center px-0" : ""
              )}
            >
              <Trash2 size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Borrar Borrador</span>}
            </button>

            {/* Cerrar sesión */}
            <button
              onClick={async () => {
                try { const { signOut } = await import('firebase/auth'); const { auth } = await import('./firebase'); await signOut(auth); } catch {}
                localStorage.removeItem('certimar-session');
                setUserRole(null); setShowWelcome(true);
              }}
              title="Cerrar sesión"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                "text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
                isSidebarCollapsed ? "justify-center px-0" : ""
              )}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Cerrar Sesión</span>}
            </button>
          </div>
        </nav>

        <div className={cn("p-4 border-t border-slate-100 dark:border-slate-800 space-y-4", isSidebarCollapsed ? "text-center" : "px-6")}>
          {/* Hints Toggle */}
          <button
            onClick={() => setShowHints(!showHints)}
            title={showHints ? 'Ocultar sugerencias por empresa' : 'Mostrar sugerencias por empresa'}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
              showHints
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300",
              isSidebarCollapsed ? "justify-center px-0" : ""
            )}
          >
            <Info size={20} />
            {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Sugerencias</span>}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
              "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
              isSidebarCollapsed ? "justify-center px-0" : ""
            )}
          >
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
            {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>

          {/* Badge correlativo interno */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 py-1">
              <Bookmark size={11} className={cn("shrink-0", state.registroId ? "text-indigo-400" : "text-slate-400 dark:text-slate-600")} />
              <span className={cn("text-[11px] font-bold tracking-wider", state.registroId ? "text-indigo-400 dark:text-indigo-300" : "text-slate-400 dark:text-slate-600")}>
                {state.registroId ?? 'Sin registro'}
              </span>
            </div>
          )}

          {/* Indicador de auto-guardado */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 py-1">
              <motion.div
                animate={saveAnim ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 0.6 }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors duration-500",
                  saveAnim ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"
                )}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={savedAt?.getTime() ?? 0}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[10px] text-slate-400 dark:text-slate-500 font-medium"
                >
                  {saveAnim ? (
                    <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Guardado</span>
                  ) : (
                    savedAt ? `Borrador: ${savedLabel()}` : 'Sin cambios'
                  )}
                </motion.span>
              </AnimatePresence>
            </div>
          )}

          <p className={cn("text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest", isSidebarCollapsed ? "hidden" : "")}>
            © 2026 Certimar SpA
          </p>
          {isSidebarCollapsed && (
            <motion.div
              animate={saveAnim ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Anchor size={16} className={cn(
                "mx-auto transition-colors duration-500",
                saveAnim ? "text-emerald-400" : "text-slate-200 dark:text-slate-700"
              )} />
            </motion.div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative z-10">
          {/* Toast de error de guardado */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 right-4 z-[200] flex items-center gap-3 px-5 py-3 bg-rose-600 text-white rounded-2xl shadow-xl font-semibold text-sm"
              >
                <XCircle size={18} />
                {saveError}
              </motion.div>
            )}
          </AnimatePresence>
          {!isAdmin && userRole === 'reader' && (
            <div className="sticky top-0 z-40 bg-amber-500 text-amber-950 text-xs font-bold px-6 py-2 flex items-center gap-2">
              <ShieldCheck size={14} />
              MODO LECTURA — No puedes editar ni generar documentos en esta sesión.
            </div>
          )}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && GeneralView()}
            {activeTab === 'extraction' && ExtractionView()}
            {activeTab === 'denaturation' && DenaturationView()}
            {activeTab === 'storage' && StorageView()}
            {activeTab === 'report' && ReportView()}
            {activeTab === 'issue' && IssueView()}
            {activeTab === 'history' && HistoryView()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon: Icon, label, collapsed, variant = "indigo" }: { active: boolean, onClick: () => void, icon: any, label: string, collapsed: boolean, variant?: "indigo" | "emerald" }) => {
  const colors = {
    indigo: {
      active: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20",
      inactive: "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
      iconActive: "text-indigo-600 dark:text-indigo-400",
      iconInactive: "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
    },
    emerald: {
      active: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-500/20",
      inactive: "text-slate-500 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400",
      iconActive: "text-emerald-600 dark:text-emerald-400",
      iconInactive: "text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400"
    }
  };

  const current = colors[variant];

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
        active ? current.active : current.inactive,
        collapsed ? "justify-center px-0" : ""
      )}
    >
      <Icon size={20} className={cn("shrink-0 transition-colors", active ? current.iconActive : current.iconInactive)} />
      {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
      {!collapsed && active && <motion.div layoutId="active-pill" className={cn("ml-auto w-1.5 h-1.5 rounded-full", variant === "indigo" ? "bg-indigo-600" : "bg-emerald-600")} />}
      
      {collapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
          {label}
        </div>
      )}
    </button>
  );
};
