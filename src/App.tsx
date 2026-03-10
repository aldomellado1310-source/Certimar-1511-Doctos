import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Menu,
  X,
  Fish,
  Anchor,
  Moon,
  Sun,
  Star,
  Grid3X3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from './lib/utils';
import { AppState, ReportImage, HistoryEntry } from './types';
import { 
  CATALOGO_EXTRACCION, 
  CATALOGO_DESNATURALIZACION, 
  CATALOGO_GENERADORES, 
  CATALOGO_ALMACENAMIENTO,
  CATALOGO_CENTROS,
  HISTORICO_CERTIFICACIONES
} from './constants/masterData';

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
      ubicacion: ""
    },
    fechas: {
      evaluacion_documental: new Date().toISOString().split('T')[0],
      inspeccion_terreno: new Date().toISOString().split('T')[0],
      emision_certificado: new Date().toISOString().split('T')[0]
    }
  },
  extraction: {
    sistemas_apoyo: {
      buceo: false,
      rov: true,
      succion_yoma: false,
      automatica: true
    },
    parametros: {
      numero_total_jaulas: 18,
      jaulas_simultaneas: 2,
      horas_efectivas_trabajo: 9,
      personal_operativo: 2,
      profundidad_operacion_m: 20,
      sistema_principal: 'LIFT-UP (Novatech)',
      talla_pez: 'Grande (>=4.5kg)',
      factor_ajuste_biomasa: 1.0,
      marca_equipo: "Novatech 10\"",
      id_catalogo_equipo: "novatech-10",
      tipo_compresor: "Kaeser Mobilair M50E / M50",
      id_catalogo_compresor: "kaeser-m50e",
      potencia_cfm: 185,
      capacidad_receptor_bins_litros: 500,
      disponibilidad_base_fd: 0.90
    },
    resultados: {
      ciclos_por_dia: 0,
      capacidad_diaria_ton: 0,
      cumple_norma: false
    }
  },
  denaturation: {
    equipos: {
      cantidad_sistemas: 1,
      id_catalogo_trituradora: "acuimaster-ac715",
      id_catalogo_incinerador: "",
      marca_modelo: "ACUIMASTER AC-715 LT",
      velocidad_nominal_kg_hr: 1680,
      horas_funcionamiento_dia: 9,
      cuenta_con_prepicador: false,
      capacidad_prepicador_kg_hr: 0,
      cuenta_con_recirculacion_acido: true,
      material_construccion: "Acero inoxidable AISI 304/316-L",
      tipo_sistema: 'Ensilaje'
    },
    parametros_batch: {
      kilos_por_batch: 700,
      tiempo_procesamiento_min: 15,
      tiempo_pausa_min: 10
    },
    parametros_incineracion: {
      capacidad_carga_kg_h: 0,
      temperatura_operacion: "",
      camara_primaria: "",
      camara_secundaria: ""
    },
    generacion_electrica: [
      {
        tipo: "Principal",
        marca: "FG Wilson",
        modelo: "P220-3",
        capacidad_kva: 220,
        ubicacion: "A/N Pontón Alimentador"
      }
    ],
    resultados: {
      duracion_total_batch_min: 0,
      numero_batches_dia: 0,
      capacidad_diaria_ton: 0,
      cumple_norma: false,
      observacion_automatica: ""
    }
  },
  storage: {
    parametros: {
      capacidad_almacenaje_m3: 20,
      factor_densidad: 1.2,
      observaciones: "SE REALIZA EL CÁLCULO POR DENSIDAD DE ÁCIDO FÓRMICO 1.2 TN/M3"
    },
    infraestructura: {
      pretil_material: "Acero inoxidable",
      pretil_estado: 'Bueno',
      piping_material: "HDPE 90mm",
      piping_diametro: "4\"",
      piping_valvulas: "Tipo Mariposa",
      piping_estado: 'Bueno'
    },
    resultados: {
      capacidad_almacenaje_ton: 0,
      cumple_norma: false
    }
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

const MarineBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40 transition-colors duration-700">
    {/* Deep water gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 via-white to-cyan-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/30" />
    
    {/* Subtle Waves at the bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-96 opacity-20 select-none">
      <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <motion.path
          animate={{
            d: [
              "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,176C672,181,768,139,864,138.7C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="fill-indigo-500/20 dark:fill-indigo-400/10"
        />
      </svg>
    </div>

    {/* Seaweed / Sea Elements */}
    <div className="absolute bottom-0 left-10 w-32 h-64 opacity-20 dark:opacity-10 pointer-events-none">
      <motion.div 
        animate={{ rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-full h-full bg-emerald-500/30 rounded-t-full blur-xl origin-bottom"
      />
    </div>
    <div className="absolute bottom-0 right-20 w-40 h-80 opacity-20 dark:opacity-10 pointer-events-none">
      <motion.div 
        animate={{ rotate: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="w-full h-full bg-cyan-500/30 rounded-t-full blur-xl origin-bottom"
      />
    </div>

    {/* Sea Stars */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={`star-${i}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 0.8], rotate: [0, 90, 180] }}
        transition={{ duration: 10, repeat: Infinity, delay: i * 3 }}
        className="absolute text-amber-300/30 dark:text-amber-500/20"
        style={{ 
          top: `${10 + Math.random() * 80}vh`, 
          left: `${10 + Math.random() * 80}vw` 
        }}
      >
        <Star size={24 + Math.random() * 24} />
      </motion.div>
    ))}

    {/* Net Pattern */}
    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.01] pointer-events-none">
      <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>

    {/* Floating Bubbles */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={`bubble-${i}`}
        initial={{ y: "110vh", x: `${Math.random() * 100}vw`, opacity: 0 }}
        animate={{ 
          y: "-10vh",
          opacity: [0, 0.4, 0],
          x: `${(Math.random() * 100) + (Math.sin(i) * 15)}vw`
        }}
        transition={{ 
          duration: 12 + Math.random() * 20, 
          repeat: Infinity, 
          delay: Math.random() * 20,
          ease: "linear"
        }}
        className="absolute w-1 h-1 md:w-3 md:h-3 rounded-full border border-indigo-300/20 bg-white/10 blur-[1px] dark:shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      />
    ))}

    {/* Swimming Fish */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={`fish-${i}`}
        initial={{ x: i % 2 === 0 ? "-10vw" : "110vw", y: `${20 + Math.random() * 60}vh`, opacity: 0 }}
        animate={{ 
          x: i % 2 === 0 ? "110vw" : "-10vw",
          opacity: [0, 0.3, 0.3, 0],
          y: `${20 + Math.random() * 60 + Math.sin(Date.now() / 1000 + i) * 20}vh`
        }}
        transition={{ 
          duration: 20 + Math.random() * 30, 
          repeat: Infinity, 
          delay: Math.random() * 15,
          ease: "linear"
        }}
        className="absolute text-indigo-400/30 dark:text-indigo-300/20"
      >
        <Fish size={24 + Math.random() * 20} className={i % 2 !== 0 ? "scale-x-[-1]" : ""} />
      </motion.div>
    ))}

    {/* Sea Stars at the bottom */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={`star-${i}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.2, scale: 1, rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-4 text-indigo-400/40 dark:text-indigo-300/20"
        style={{ left: `${15 + i * 15}%` }}
      >
        <Star size={20 + Math.random() * 15} fill="currentColor" />
      </motion.div>
    ))}

    {/* Subtle Net patterns */}
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.01] pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>

    {/* Subtle Seaweed-like elements */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={`seaweed-${i}`}
        animate={{
          rotate: [0, 5, -5, 0],
          scaleY: [1, 1.05, 0.95, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
        className="absolute bottom-0 w-8 h-64 bg-indigo-600/5 dark:bg-indigo-400/5 rounded-full blur-2xl"
        style={{ left: `${10 + i * 20}%` }}
      />
    ))}
  </div>
);

const Logo = ({ collapsed }: { collapsed?: boolean }) => (
  <div className={cn("flex items-center gap-4 transition-all duration-500", collapsed ? "justify-center" : "")}>
    <div className="relative w-12 h-12 shrink-0 group">
      {/* Logo Box */}
      <div className="absolute inset-0 bg-slate-900 dark:bg-indigo-950 rounded-2xl shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-slate-900 dark:to-slate-900 rounded-2xl opacity-90" />
      
      {/* Fish Grid */}
      <div className="relative h-full w-full grid grid-cols-2 grid-rows-2 p-2.5 gap-1">
        <Fish size={14} className="text-white/30" />
        <Fish size={14} className="text-white/30" />
        <Fish size={14} className="text-white/30" />
        <div className="flex items-center justify-center">
          <CheckCircle2 size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
        </div>
      </div>
      
      {/* Subtle light sweep */}
      <motion.div 
        animate={{ x: [-50, 100] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
      />
    </div>
    
    {!collapsed && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col"
      >
        <h1 className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white leading-none">
          CERTI<span className="text-indigo-600 dark:text-indigo-400">MAR</span>
        </h1>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="h-px w-3 bg-indigo-200 dark:bg-indigo-800" />
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Norma 1511</span>
        </div>
      </motion.div>
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

const InputField = ({ label, value, onChange, type = "text", placeholder, suffix, inputRef, highlight }: { label: string, value: any, onChange: (val: any) => void, type?: string, placeholder?: string, suffix?: string, inputRef?: React.RefObject<HTMLInputElement | null>, highlight?: boolean }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
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

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'general' | 'extraction' | 'denaturation' | 'storage' | 'report' | 'issue' | 'history'>('general');
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certimar-draft-state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved draft:", e);
          return DEFAULT_STATE;
        }
      }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('certimar-draft-state', JSON.stringify(state));
  }, [state]);

  const resetState = () => {
    if (window.confirm("¿Está seguro de que desea borrar el borrador actual y comenzar de nuevo?")) {
      setState(DEFAULT_STATE);
      localStorage.removeItem('certimar-draft-state');
      setActiveTab('general');
    }
  };
  const centerCodeRef = useRef<HTMLInputElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certimar-dark-mode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
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
    if (!showWelcome && centerCodeRef.current) {
      centerCodeRef.current.focus();
    }
  }, [showWelcome]);

  const handleCenterCodeChange = (code: string) => {
    const center = CATALOGO_CENTROS.find(c => c.codigo === code);
    if (center) {
      setState(prev => ({
        ...prev,
        general: {
          ...prev.general,
          centro_cultivo: {
            ...prev.general.centro_cultivo,
            codigo_centro: code,
            nombre_centro: center.nombre,
            titular: center.titular,
            acs: center.acs,
            ubicacion: center.ubicacion
          }
        }
      }));
    } else {
      updateGeneral('centro_cultivo.codigo_centro', code);
    }
  };

  // --- Calculations ---
  const calculatedExtraction = useMemo(() => {
    const { parametros } = state.extraction;
    
    // 1. Determine base times and biomass limits based on fish size
    let t_trabajo_base = 15;
    let t_pausa_base = 2.15;
    let limite_biomasa = 270;

    if (parametros.talla_pez === 'Mediano (1.5-4.5kg)') {
      t_trabajo_base = 12;
      t_pausa_base = 2.0;
      limite_biomasa = 375;
    } else if (parametros.talla_pez === 'Pequeño (<1.5kg)') {
      t_trabajo_base = 10;
      t_pausa_base = 1.8;
      limite_biomasa = 360;
    }

    // 2. Adjust efficiency based on depth and system
    let η = 0.95; // Default LIFT-UP
    if (parametros.sistema_principal === 'Mortex HW') η = 0.92;
    if (parametros.sistema_principal === 'ROV') η = 0.75;
    if (parametros.sistema_principal === 'Succión por Yoma') η = 0.80;

    if (parametros.profundidad_operacion_m > 25) {
      if (parametros.sistema_principal === 'LIFT-UP (Novatech)') η = 0.85;
      if (parametros.sistema_principal === 'Mortex HW') η = 0.82;
      if (parametros.sistema_principal === 'ROV') η = 0.70;
    }

    // 3. Availability adjustment based on personnel
    let fd = parametros.disponibilidad_base_fd;
    if (parametros.personal_operativo < 3) {
      fd = fd * 0.90;
    }

    // 4. Cycle time calculation
    const pausa_proporcional = (t_pausa_base * 0.01) * parametros.numero_total_jaulas;
    const t_ciclo_total = t_trabajo_base + t_pausa_base + pausa_proporcional;

    // 5. Daily cycles
    const ciclos_por_dia = (parametros.horas_efectivas_trabajo * 60) / t_ciclo_total;

    // 6. Final capacity (TN/Día)
    const kg_bins = limite_biomasa * parametros.factor_ajuste_biomasa;
    const capacidad_diaria_ton = (parametros.jaulas_simultaneas * ciclos_por_dia * kg_bins * η * fd) / 1000;
    
    return {
      ciclos_por_dia: parseFloat(ciclos_por_dia.toFixed(2)),
      capacidad_diaria_ton: parseFloat(capacidad_diaria_ton.toFixed(2)),
      cumple_norma: capacidad_diaria_ton >= 15
    };
  }, [state.extraction.parametros]);

  const calculatedDenaturation = useMemo(() => {
    const { parametros_batch, equipos, parametros_incineracion } = state.denaturation;
    const total_work_min = equipos.horas_funcionamiento_dia * 60;
    
    if (equipos.tipo_sistema === 'Incineración') {
      const capacity_ton = (parametros_incineracion.capacidad_carga_kg_h * equipos.horas_funcionamiento_dia) / 1000;
      return {
        duracion_total_batch_min: 0,
        numero_batches_dia: 0,
        capacidad_diaria_ton: parseFloat(capacity_ton.toFixed(2)),
        cumple_norma: capacity_ton >= 15,
        observacion_automatica: `Sistema de incineración térmica con capacidad de carga de ${parametros_incineracion.capacidad_carga_kg_h} kg/h. Operando ${equipos.horas_funcionamiento_dia} horas diarias, alcanza una capacidad de ${capacity_ton.toFixed(2)} toneladas/día.`
      };
    }

    // Ensilaje Logic
    let batch_duration = parametros_batch.tiempo_procesamiento_min + parametros_batch.tiempo_pausa_min;
    if (equipos.cuenta_con_prepicador) {
      batch_duration = batch_duration * 0.70;
    }

    const num_batches = total_work_min / batch_duration;
    const capacity_kg = num_batches * parametros_batch.kilos_por_batch;
    const capacity_ton = capacity_kg / 1000;

    const observacion = `La eficiencia del sistema depende directamente del tiempo total de cada ciclo (batch + pausa)... (kg/batch=${parametros_batch.kilos_por_batch} -- Horas de trabajo diario: ${equipos.horas_funcionamiento_dia} = ${total_work_min} min) Duración total por batch: ${batch_duration.toFixed(2)} min / Número de batches por día: ${total_work_min} ÷ ${batch_duration.toFixed(2)} = ${num_batches.toFixed(2)} batches Capacidad diaria ${parametros_batch.kilos_por_batch} kg * ${num_batches.toFixed(2)} = ${capacity_kg.toFixed(0)} kg = ${capacity_ton.toFixed(2)} toneladas`;

    return {
      duracion_total_batch_min: parseFloat(batch_duration.toFixed(2)),
      numero_batches_dia: parseFloat(num_batches.toFixed(2)),
      capacidad_diaria_ton: parseFloat(capacity_ton.toFixed(2)),
      cumple_norma: capacity_ton >= 15,
      observacion_automatica: observacion
    };
  }, [state.denaturation.parametros_batch, state.denaturation.equipos, state.denaturation.parametros_incineracion]);

  const calculatedStorage = useMemo(() => {
    const { parametros } = state.storage;
    const capacity_ton = parametros.capacidad_almacenaje_m3 * parametros.factor_densidad;
    return {
      capacidad_almacenaje_ton: parseFloat(capacity_ton.toFixed(2)),
      cumple_norma: capacity_ton >= 20
    };
  }, [state.storage.parametros]);

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
    return state.extraction.resultados.cumple_norma &&
           state.denaturation.resultados.cumple_norma &&
           state.storage.resultados.cumple_norma &&
           state.images.length > 0;
  }, [state]);

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
            temperatura_operacion: inc.temperatura,
            camara_primaria: inc.camara_primaria,
            camara_secundaria: inc.camara_secundaria
          }
        }
      }));
    }
  };

  const handleSelectGenerator = (index: number, id: string) => {
    const gen = CATALOGO_GENERADORES.find(g => g.id === id);
    if (gen) {
      const newGens = [...state.denaturation.generacion_electrica];
      newGens[index] = {
        ...newGens[index],
        marca: gen.marca,
        modelo: gen.modelo,
        capacidad_kva: gen.kva
      };
      setState(prev => ({
        ...prev,
        denaturation: {
          ...prev.denaturation,
          generacion_electrica: newGens
        }
      }));
    }
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

  const addImage = (files: File[]) => {
    const newImages: ReportImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      seccion: 'General',
      leyenda: '',
      estado: 'Verde',
      observacion: 'CUMPLE CON LO DECLARADO'
    }));
    setState(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
  };

  const removeImage = (id: string) => {
    setState(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const updateImage = (id: string, updates: Partial<ReportImage>) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, ...updates } : img)
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const { general, extraction, denaturation, storage } = state;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(20, 30, 70);
    doc.text("CERTIFICADO DE SISTEMAS DE MORTALIDAD", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Resolución Exenta N°1511/2021`, 105, 28, { align: 'center' });

    // General Info
    (doc as any).autoTable({
      startY: 40,
      head: [['Identificación del Centro', '']],
      body: [
        ['Titular', general.centro_cultivo.titular],
        ['Código Centro', general.centro_cultivo.codigo_centro],
        ['Nombre Centro', general.centro_cultivo.nombre_centro],
        ['A.C.S', general.centro_cultivo.acs],
        ['Fecha Inspección', general.fechas.inspeccion_terreno],
      ],
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Capacities
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Capacidad Certificada', 'Valor', 'Cumplimiento']],
      body: [
        ['Extracción', `${extraction.resultados.capacidad_diaria_ton} TN/DÍA`, extraction.resultados.cumple_norma ? 'CUMPLE' : 'NO CUMPLE'],
        ['Desnaturalización', `${denaturation.resultados.capacidad_diaria_ton} TN/DÍA`, denaturation.resultados.cumple_norma ? 'CUMPLE' : 'NO CUMPLE'],
        ['Almacenamiento', `${storage.resultados.capacidad_almacenaje_ton} TN`, storage.resultados.cumple_norma ? 'CUMPLE' : 'NO CUMPLE'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50] }
    });

    // Signature
    const finalY = (doc as any).lastAutoTable.finalY + 40;
    doc.line(60, finalY, 150, finalY);
    doc.text(general.certificador.nombre, 105, finalY + 10, { align: 'center' });
    doc.text(`RUT: ${general.certificador.rut}`, 105, finalY + 15, { align: 'center' });
    doc.text(`Registro: ${general.certificador.numero_registro}`, 105, finalY + 20, { align: 'center' });

    doc.save(`Certificado_1511_${general.centro_cultivo.codigo_centro}.pdf`);
  };

  // --- Views ---

  const GeneralView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <SectionHeader 
        title="Datos Generales" 
        icon={LayoutDashboard} 
        description="Información base del centro de cultivo y del certificador a cargo."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormCard title="Identificación del Centro">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                inputRef={centerCodeRef}
                highlight={state.general.centro_cultivo.codigo_centro === ""}
                label="Código Centro" 
                value={state.general.centro_cultivo.codigo_centro} 
                onChange={handleCenterCodeChange} 
                placeholder="Ej. 102345"
              />
              <InputField 
                label="A.C.S / RNA" 
                value={state.general.centro_cultivo.acs} 
                onChange={(v) => updateGeneral('centro_cultivo.acs', v)} 
                placeholder="26B"
              />
            </div>
            <InputField 
              label="Titular" 
              value={state.general.centro_cultivo.titular} 
              onChange={(v) => updateGeneral('centro_cultivo.titular', v)} 
              placeholder="Ej. EXPORTADORA LOS FIORDOS LTDA."
            />
            <InputField 
              label="Nombre Centro" 
              value={state.general.centro_cultivo.nombre_centro} 
              onChange={(v) => updateGeneral('centro_cultivo.nombre_centro', v)} 
              placeholder="RENAICO"
            />
            <InputField 
              label="Ubicación" 
              value={state.general.centro_cultivo.ubicacion} 
              onChange={(v) => updateGeneral('centro_cultivo.ubicacion', v)} 
              placeholder="Región de Aysén..."
            />
          </div>
        </FormCard>

        <FormCard title="Fechas y Certificador">
          <div className="space-y-4">
            <InputField 
              label="Fecha Inspección Terreno" 
              type="date"
              value={state.general.fechas.inspeccion_terreno} 
              onChange={(v) => updateGeneral('fechas.inspeccion_terreno', v)} 
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Emisión</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Centro</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ACS</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cap. Extr.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cap. Desn.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Alm.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HISTORICO_CERTIFICACIONES.map((entry, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100 dark:border-slate-800">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-md uppercase">
                      {entry.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{entry.fechaEmision}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.nombreCentro}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{entry.codigoCentro}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{entry.empresa}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{entry.acs}</td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold">{entry.capExtraccion}</td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold">{entry.capDesnaturalizacion}</td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold">{entry.capAlmacenamiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormCard>
    </div>
  );

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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
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
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
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
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Seleccionar compresor...</option>
                  {CATALOGO_EXTRACCION.compresores.map(c => (
                    <option key={c.id} value={c.id}>{c.marca} {c.modelo}</option>
                  ))}
                </select>
              </div>

              <InputField label="Marca Equipo" value={state.extraction.parametros.marca_equipo} onChange={(v) => updateExtraction('parametros.marca_equipo', v)} />
              <InputField label="Tipo Compresor" value={state.extraction.parametros.tipo_compresor} onChange={(v) => updateExtraction('parametros.tipo_compresor', v)} />
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
              <InputField label="Horas Trabajo" type="number" value={state.extraction.parametros.horas_efectivas_trabajo} onChange={(v) => updateExtraction('parametros.horas_efectivas_trabajo', v)} suffix="Hrs" />
              <InputField label="Ajuste Biomasa" type="number" value={state.extraction.parametros.factor_ajuste_biomasa} onChange={(v) => updateExtraction('parametros.factor_ajuste_biomasa', v)} />
              <InputField label="Disponibilidad fd₀" type="number" value={state.extraction.parametros.disponibilidad_base_fd} onChange={(v) => updateExtraction('parametros.disponibilidad_base_fd', v)} />
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
    </div>
  );

  const DenaturationView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex justify-between items-start">
        <SectionHeader 
          title="Desnaturalización (Ensilaje)" 
          icon={FlaskConical} 
          description="Cálculo de capacidad por ciclos (Batch) y equipos de trituración (Mínimo 15 TN/Día)."
        />
        <StatusBadge status={state.denaturation.resultados.cumple_norma} />
      </div>

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
                  <InputField label="Kilos por Batch" type="number" value={state.denaturation.parametros_batch.kilos_por_batch} onChange={(v) => updateDenaturation('parametros_batch.kilos_por_batch', v)} suffix="Kg" />
                  <InputField label="Tiempo Proceso" type="number" value={state.denaturation.parametros_batch.tiempo_procesamiento_min} onChange={(v) => updateDenaturation('parametros_batch.tiempo_procesamiento_min', v)} suffix="Min" />
                  <InputField label="Tiempo Pausa" type="number" value={state.denaturation.parametros_batch.tiempo_pausa_min} onChange={(v) => updateDenaturation('parametros_batch.tiempo_pausa_min', v)} suffix="Min" />
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
            <div className="space-y-6">
              {state.denaturation.generacion_electrica.map((gen, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Generador (Catálogo)</label>
                    <select 
                      value={CATALOGO_GENERADORES.find(g => g.modelo === gen.modelo)?.id || ""}
                      onChange={(e) => handleSelectGenerator(idx, e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Seleccionar generador...</option>
                      {CATALOGO_GENERADORES.map(g => (
                        <option key={g.id} value={g.id}>{g.marca} {g.modelo} ({g.kva} kVA)</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Marca" value={gen.marca} onChange={(v) => {
                    const newGens = [...state.denaturation.generacion_electrica];
                    newGens[idx].marca = v;
                    updateDenaturation('generacion_electrica', newGens);
                  }} />
                  <InputField label="Capacidad" type="number" value={gen.capacidad_kva} onChange={(v) => {
                    const newGens = [...state.denaturation.generacion_electrica];
                    newGens[idx].capacidad_kva = v;
                    updateDenaturation('generacion_electrica', newGens);
                  }} suffix="kVA" />
                </div>
              ))}
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
              <InputField label="Factor Densidad" type="number" value={state.storage.parametros.factor_densidad} onChange={(v) => updateStorage('parametros.factor_densidad', v)} suffix="TN/m³" />
              <div className="md:col-span-2">
                <InputField label="Observaciones" value={state.storage.parametros.observaciones} onChange={(v) => updateStorage('parametros.observaciones', v)} />
              </div>
            </div>
          </FormCard>

          <FormCard title="Infraestructura y Seguridad">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Material Pretil" value={state.storage.infraestructura.pretil_material} onChange={(v) => updateStorage('infraestructura.pretil_material', v)} />
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
              <InputField label="Material Piping" value={state.storage.infraestructura.piping_material} onChange={(v) => updateStorage('infraestructura.piping_material', v)} />
              <InputField label="Diámetro Piping" value={state.storage.infraestructura.piping_diametro} onChange={(v) => updateStorage('infraestructura.piping_diametro', v)} />
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
    </div>
  );

  const ReportView = () => {
    const onDrop = (acceptedFiles: File[]) => {
      addImage(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: { 'image/*': [] } 
    } as any);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader 
          title="Informe Técnico e Imágenes" 
          icon={Camera} 
          description="Grilla de registro fotográfico. Arrastra imágenes y asigna estados y leyendas."
        />

        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer",
            isDragActive 
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
              : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50"
          )}
        >
          <input {...getInputProps()} />
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
            {state.images.map((img) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group"
              >
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sección</label>
                      <select 
                        value={img.seccion}
                        onChange={(e) => updateImage(img.id, { seccion: e.target.value as any })}
                        className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-slate-900 dark:text-slate-100"
                      >
                        <option value="Extracción">Extracción</option>
                        <option value="Desnaturalización">Desnaturalización</option>
                        <option value="Almacenamiento">Almacenamiento</option>
                        <option value="General">General</option>
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
                  <InputField 
                    label="Leyenda" 
                    value={img.leyenda} 
                    onChange={(v) => updateImage(img.id, { leyenda: v })} 
                    placeholder="Ej. Imagen 1. Olla trituradora..."
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
                <div className={cn("p-2 rounded-lg", state.images.length > 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400")}>
                  {state.images.length > 0 ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Registro Fotográfico</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Imágenes cargadas: {state.images.length}</p>
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
              Se generará el Certificado, Acta y Anexo Técnico en formato PDF consolidado.
            </p>
          </div>
          <button 
            disabled={!canEmit}
            onClick={generatePDF}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg",
              canEmit 
                ? "bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95" 
                : "bg-indigo-400 text-indigo-200 cursor-not-allowed"
            )}
          >
            {canEmit ? <><FileDown size={24} /> Descargar PDF</> : "Faltan Requisitos"}
          </button>
          {!canEmit && (
            <p className="text-xs text-indigo-200 italic">
              * Asegúrate de cumplir con todas las capacidades mínimas y cargar al menos una imagen.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const WelcomeScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200 dark:border-slate-800 relative">
        {/* Marine decorative elements in welcome screen */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />
        
        <div className="md:w-2/5 bg-indigo-600 dark:bg-indigo-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Waves className="absolute -bottom-10 -left-10 w-40 h-40 rotate-12" />
            <Anchor className="absolute top-10 -right-10 w-32 h-32 -rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">CERTIMAR 1511</h2>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Plataforma inteligente para la certificación de sistemas de mortalidad bajo la Resolución Exenta N°1511.
            </p>
          </div>
          <div className="text-[10px] font-bold tracking-[0.2em] opacity-50 uppercase relative z-10">v2.0 Build 2026</div>
        </div>
        <div className="md:w-3/5 p-12 flex flex-col justify-center relative">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">¡Bienvenido!</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Esta herramienta automatiza el cálculo de capacidades de extracción, desnaturalización y almacenamiento, asegurando el cumplimiento normativo en cada paso.
          </p>
          <MarineButton 
            onClick={() => setShowWelcome(false)}
            className="w-full py-4"
          >
            Comenzar Certificación
            <ArrowRight size={20} />
          </MarineButton>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-500">
      <MarineBackground />
      <AnimatePresence>
        {showWelcome && <WelcomeScreen />}
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
            <button
              onClick={resetState}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600",
                isSidebarCollapsed ? "justify-center px-0" : ""
              )}
            >
              <Trash2 size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">Borrar Borrador</span>}
            </button>
          </div>
        </nav>

        <div className={cn("p-4 border-t border-slate-100 dark:border-slate-800 space-y-4", isSidebarCollapsed ? "text-center" : "px-6")}>
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

          <p className={cn("text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest", isSidebarCollapsed ? "hidden" : "")}>
            © 2026 Certimar SpA
          </p>
          {isSidebarCollapsed && <Anchor size={16} className="text-slate-200 dark:text-slate-700 mx-auto" />}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && <GeneralView key="general" />}
            {activeTab === 'extraction' && <ExtractionView key="extraction" />}
            {activeTab === 'denaturation' && <DenaturationView key="denaturation" />}
            {activeTab === 'storage' && <StorageView key="storage" />}
            {activeTab === 'report' && <ReportView key="report" />}
            {activeTab === 'issue' && <IssueView key="issue" />}
            {activeTab === 'history' && <HistoryView key="history" />}
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
