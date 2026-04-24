import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const GOAL = 2000000;
const CYCLE_LENGTH_DEFAULT = 24;
const PERIOD_LENGTH_DEFAULT = 5;
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPA_URL, SUPA_KEY);

// HADES PALETTE
const H = {
  void: "#0a0507", obsidian: "#14090c", styx: "#1f0d12",
  ember: "#2a1015", emberLight: "#3a1820",
  bloodDeep: "#6b0e1a", blood: "#a81d2a", bloodLight: "#d42e3a",
  fire: "#ff5530",
  gold: "#c9a85a", goldBright: "#e8c66f", goldDim: "#8a7340",
  parchment: "#e8d9a8", parchmentDim: "#9c8a62",
  elysium: "#5db85a", elysiumDim: "#3d7a3d",
  amber: "#e09030", bone: "#d8c9a8",
};

const PC = {
  etsy: "#d4622a", pitonisa: "#b83060", fiverr: "#5db85a",
  agencia: "#4a9eda", helena: "#4a9eda", martin: "#5db85a",
  sonia: "#e09030", rafael: "#9b7edc",
};
const DESC = {
  etsy: "60+ productos digitales",
  pitonisa: "IG + TikTok + YouTube tarot",
  fiverr: "Primer gig de agentes IA",
  agencia: "Bots para clientes",
  helena: "Bot tienda celulares CellBot",
  martin: "Celulares mayorista",
  sonia: "Empresa de construccion",
  rafael: "Empresa transporte",
};
const PRIO = { alta: H.blood, media: H.amber, baja: H.goldDim };

const PHASE_COLORS = {
  menstrual: "#b83060", folicular: "#5db85a",
  ovulacion: "#e09030", lutea: "#9b7edc",
};
const PHASE_INFO = {
  menstrual: { energia: "baja", descripcion: "Descanso, planificacion, tareas admin. No presiones creatividad.", tareas: ["planificar semana", "revisar reportes", "organizar archivos"] },
  folicular: { energia: "alta creciente", descripcion: "Creatividad, nuevos proyectos, contenido, brainstorm.", tareas: ["crear contenido", "nuevos productos", "aprender"] },
  ovulacion: { energia: "maxima", descripcion: "Ventas, reuniones, grabaciones, networking, pitch.", tareas: ["llamadas venta", "grabar reels", "lanzamientos"] },
  lutea: { energia: "decreciente", descripcion: "Detalles, edicion, cierres, finalizar pendientes.", tareas: ["editar", "revisar", "finalizar", "cerrar ventas"] },
};

const MESSAGES = {
  low: [
    "El Styx no se cruza mirando.",
    "Zagreus tampoco nacio campeon. Moveme una tarea.",
    "La sombra pesa hoy. Una accion pequena rompe el hechizo.",
    "Hasta Nyx descansa. Pero Daniela no se entierra.",
    "Mas intencion, menos espera.",
  ],
  mid: [
    "Vas caminando. No bajes el ritmo.",
    "La forja esta tibia. Dale otro golpe.",
    "Momentum encontrado. Proxima tarea.",
    "Elysium se ve mas cerca. Seguile.",
    "Buen pulso. Subi una marcha.",
  ],
  high: [
    "Los dioses observan. Seguis en racha.",
    "Esto es dominio absoluto.",
    "Modo Olimpo activado.",
    "Productividad digna de un boon de Zeus.",
    "Hoy no hay sombra que te frene.",
  ],
};

function computeProductivity({ weeklyIncome, tasksDone, tasksPending, logsToday, energy }) {
  let score = 0;
  const taskTotal = tasksDone + tasksPending;
  if (taskTotal > 0) score += Math.min(30, (tasksDone / taskTotal) * 30);
  else score += 10;
  const weeklyGoal = GOAL / 4;
  score += Math.min(30, (weeklyIncome / weeklyGoal) * 30);
  score += (energy / 10) * 20;
  score += Math.min(20, logsToday * 5);
  return Math.round(Math.min(100, score));
}

function getTier(score) {
  if (score < 34) return { tier: "low", color: H.blood, glow: H.bloodLight, label: "EN LA SOMBRA" };
  if (score < 67) return { tier: "mid", color: H.amber, glow: H.fire, label: "EN LA FORJA" };
  return { tier: "high", color: H.elysium, glow: "#8dd88d", label: "EN EL OLIMPO" };
}
function getMessage(tier) {
  const pool = MESSAGES[tier];
  return pool[new Date().getHours() % pool.length];
}

function computeCycleState(lastPeriod) {
  if (!lastPeriod) return null;
  const start = new Date(lastPeriod.start_date + "T00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const daysSince = Math.floor((today - start) / 86400000);
  const cycleLen = lastPeriod.cycle_length || CYCLE_LENGTH_DEFAULT;
  const periodLen = lastPeriod.period_length || PERIOD_LENGTH_DEFAULT;
  const cycleDay = (daysSince % cycleLen) + 1;
  let phase;
  if (cycleDay <= periodLen) phase = "menstrual";
  else if (cycleDay <= Math.floor(cycleLen * 0.5)) phase = "folicular";
  else if (cycleDay <= Math.floor(cycleLen * 0.65)) phase = "ovulacion";
  else phase = "lutea";
  const cyclesPassed = Math.floor(daysSince / cycleLen);
  const nextPeriod = new Date(start.getTime() + (cyclesPassed + 1) * cycleLen * 86400000);
  const daysUntil = Math.ceil((nextPeriod - today) / 86400000);
  return { cycleDay, phase, nextPeriod, daysUntil, cycleLen, periodLen };
}

function GreekKey({ color = H.gold, height = 16 }) {
  const id = `mk-${color.replace("#","")}-${height}`;
  return (
    <svg width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", opacity: 0.7 }}>
      <defs>
        <pattern id={id} x="0" y="0" width="36" height={height} patternUnits="userSpaceOnUse">
          <path d={`M0 ${height-2} L0 2 L12 2 L12 ${height-6} L4 ${height-6} L4 ${height-10} L16 ${height-10} L16 6 L8 6 L8 ${height-2} Z`} fill="none" stroke={color} strokeWidth="1.2"/>
          <path d={`M20 ${height-2} L20 2 L32 2 L32 ${height-6} L24 ${height-6} L24 ${height-10} L36 ${height-10} L36 6 L28 6 L28 ${height-2} Z`} fill="none" stroke={color} strokeWidth="1.2"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`}/>
    </svg>
  );
}

function Corner({ color = H.gold, size = 28, position = "tl" }) {
  const rotations = { tl: 0, tr: 90, br: 180, bl: 270 };
  return (
    <svg width={size} height={size} style={{
      position: "absolute",
      [position.includes("t") ? "top" : "bottom"]: -1,
      [position.includes("l") ? "left" : "right"]: -1,
      transform: `rotate(${rotations[position]}deg)`,
      pointerEvents: "none",
    }}>
      <path d={`M0 0 L${size} 0 L${size} 2 L2 2 L2 ${size} L0 ${size} Z`} fill={color} opacity="0.9"/>
      <circle cx="5" cy="5" r="1.5" fill={color}/>
      <path d={`M9 2 L13 2 M2 9 L2 13`} stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

function Laurel({ color = H.gold, width = 36, side = "left" }) {
  const flip = side === "right" ? "scaleX(-1)" : "none";
  return (
    <svg width={width} height={width} viewBox="0 0 40 40" style={{ transform: flip }}>
      <path d="M20 35 Q20 20 20 5" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      {[8,14,20,26,32].map((y, i) => (
        <g key={i} opacity="0.75">
          <ellipse cx={15} cy={y} rx={5} ry={2} fill={color} transform={`rotate(-30 15 ${y})`} opacity="0.7"/>
          <ellipse cx={25} cy={y+1} rx={5} ry={2} fill={color} transform={`rotate(30 25 ${y+1})`} opacity="0.7"/>
        </g>
      ))}
    </svg>
  );
}

function Ring({ pct, size = 110, stroke = 5, color = H.gold, children }) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={H.styx} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke-1}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s", filter: `drop-shadow(0 0 6px ${color}aa)` }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Bar({ pct, color = H.gold, h = 6 }) {
  return (
    <div style={{ background: H.styx, borderRadius: 1, height: h, width: "100%", overflow: "hidden", border: `1px solid ${H.goldDim}44` }}>
      <div style={{
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        height: "100%", width: `${Math.min(pct, 100)}%`,
        transition: "width 0.8s", boxShadow: `0 0 8px ${color}99`,
      }}/>
    </div>
  );
}

function Panel({ children, title, color = H.gold }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${H.ember}, ${H.obsidian})`,
      border: `1px solid ${color}33`, borderRadius: 2,
      padding: "18px 20px", position: "relative",
      boxShadow: `inset 0 1px 0 ${color}22, 0 4px 20px ${H.void}`,
    }}>
      <Corner color={color} position="tl"/>
      <Corner color={color} position="tr"/>
      <Corner color={color} position="bl"/>
      <Corner color={color} position="br"/>
      {title && (
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 10,
          letterSpacing: 4, color: color, marginBottom: 14,
          fontWeight: 600, textShadow: `0 0 8px ${color}66`,
        }}>{title}</div>
      )}
      {children}
    </div>
  );
}

function Divider({ color = H.gold }) {
  return (
    <div style={{ margin: "14px 0", height: 16 }}>
      <GreekKey color={color} height={16}/>
    </div>
  );
}

function ProjectRow({ project, tasks, onToggleTask, onAddTask, onDeleteTask }) {
  const [open, setOpen] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [adding, setAdding] = useState(false);
  const c = PC[project.id] || project.color || H.gold;
  const desc = DESC[project.id] || project.description || "";
  const myTasks = tasks.filter(t => t.project === project.id);
  const done = myTasks.filter(t => t.done).length;
  const total = myTasks.length;
  const pct = total ? Math.round(done/total*100) : 0;

  return (
    <div style={{
      background: H.ember,
      border: `1px solid ${open ? c + "66" : H.goldDim + "33"}`,
      borderRadius: 2, overflow: "hidden", transition: "border-color 0.3s",
    }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
        background: open ? `linear-gradient(90deg, ${c}15, transparent 60%)` : "transparent",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: `radial-gradient(circle, ${c}33, ${H.void})`,
          border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700, color: c, flexShrink: 0,
          boxShadow: `0 0 12px ${c}66`,
        }}>{project.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 15, color: H.parchment, letterSpacing: 1, fontWeight: 600 }}>{project.name}</span>
            {project.type === "client" && (
              <span style={{
                fontSize: 8, background: H.goldDim + "22", color: H.gold,
                border: `1px solid ${H.goldDim}`, padding: "2px 7px",
                fontFamily: "'Cinzel', serif", letterSpacing: 2,
              }}>CLIENT</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: H.parchmentDim, fontFamily: "'JetBrains Mono', monospace" }}>{desc}</div>
        </div>
        <div style={{ width: 130, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: c, textShadow: `0 0 10px ${c}66` }}>{pct}%</span>
            <span style={{ fontSize: 10, color: H.goldDim, fontFamily: "'JetBrains Mono', monospace" }}>{done}/{total}</span>
          </div>
          <Bar pct={pct} color={c}/>
        </div>
      </div>
      {open && (
        <div style={{ padding: "4px 18px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {myTasks.filter(t => !t.done).map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: H.obsidian, border: `1px solid ${H.goldDim}22` }}>
                <div onClick={() => onToggleTask(t)} style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${PRIO[t.priority] || H.goldDim}`, cursor: "pointer", flexShrink: 0,
                  boxShadow: `0 0 6px ${PRIO[t.priority] || H.goldDim}44`,
                }}/>
                <span style={{ fontSize: 13, color: H.parchment, lineHeight: 1.4, flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>{t.text}</span>
                <span style={{ fontSize: 9, color: PRIO[t.priority] || H.goldDim, flexShrink: 0, fontFamily: "'Cinzel', serif", letterSpacing: 1, textTransform: "uppercase" }}>{t.priority}</span>
                <button onClick={() => onDeleteTask(t.id)} style={{ background: "transparent", border: "none", color: H.goldDim, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
              </div>
            ))}
            {myTasks.filter(t => t.done).length > 0 && (
              <>
                <div style={{ fontSize: 9, color: H.goldDim, fontFamily: "'Cinzel', serif", letterSpacing: 3, marginTop: 10, marginBottom: 4 }}>COMPLETADO</div>
                {myTasks.filter(t => t.done).map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: H.void, border: `1px solid ${H.styx}` }}>
                    <div onClick={() => onToggleTask(t)} style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: H.elysium, border: `2px solid ${H.elysium}`,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: H.void, fontWeight: 700, flexShrink: 0,
                    }}>✓</div>
                    <span style={{ fontSize: 13, color: H.goldDim, textDecoration: "line-through", flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>{t.text}</span>
                    <button onClick={() => onDeleteTask(t.id)} style={{ background: "transparent", border: "none", color: H.goldDim, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                  </div>
                ))}
              </>
            )}
          </div>
          {adding ? (
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { onAddTask(project.id, newTodo); setNewTodo(""); setAdding(false); } }}
                autoFocus placeholder="Nueva tarea..."
                style={{ flex: 1, background: H.obsidian, border: `1px solid ${c}66`, padding: "10px 12px", color: H.parchment, fontSize: 13, outline: "none", fontFamily: "'JetBrains Mono', monospace" }}/>
              <button onClick={() => { onAddTask(project.id, newTodo); setNewTodo(""); setAdding(false); }}
                style={{ background: c + "22", border: `1px solid ${c}`, color: c, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Cinzel', serif" }}>+</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{
              marginTop: 10, width: "100%", background: "transparent",
              border: `1px dashed ${c}44`, padding: 9,
              color: c + "99", cursor: "pointer", fontSize: 10,
              fontFamily: "'Cinzel', serif", letterSpacing: 3,
            }}>+ INVOCAR TAREA</button>
          )}
        </div>
      )}
    </div>
  );
}

function CycleCalendar({ cycleState }) {
  if (!cycleState) return null;
  const { cycleDay, cycleLen, periodLen } = cycleState;
  const days = [];
  for (let i = 1; i <= cycleLen; i++) {
    let phase;
    if (i <= periodLen) phase = "menstrual";
    else if (i <= Math.floor(cycleLen * 0.5)) phase = "folicular";
    else if (i <= Math.floor(cycleLen * 0.65)) phase = "ovulacion";
    else phase = "lutea";
    days.push({ day: i, phase, current: i === cycleDay });
  }
  return (
    <div style={{ background: H.ember, border: `1px solid ${H.goldDim}33`, borderRadius: 2, padding: 16, marginBottom: 16, position: "relative" }}>
      <Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, color: H.gold, marginBottom: 12 }}>CICLO DEL ORACULO</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
        {days.map(d => (
          <div key={d.day} style={{
            aspectRatio: "1",
            background: PHASE_COLORS[d.phase] + (d.current ? "cc" : "22"),
            border: d.current ? `2px solid ${PHASE_COLORS[d.phase]}` : `1px solid ${PHASE_COLORS[d.phase]}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "'Cinzel', serif", fontWeight: 700,
            color: d.current ? H.parchment : PHASE_COLORS[d.phase],
            boxShadow: d.current ? `0 0 12px ${PHASE_COLORS[d.phase]}` : "none",
          }}>{d.day}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 10, color: H.parchmentDim, flexWrap: "wrap" }}>
        {Object.entries(PHASE_COLORS).map(([k,v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: v }}/>
            <span style={{ textTransform: "uppercase", fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [income, setIncome] = useState([]);
  const [energy, setEnergy] = useState(7);
  const [ideas, setIdeas] = useState([]);
  const [events, setEvents] = useState([]);
  const [cycleLog, setCycleLog] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [projectLogs, setProjectLogs] = useState([]);
  const [tab, setTab] = useState("projects");
  const [showSale, setShowSale] = useState(false);
  const [showIdea, setShowIdea] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [saleF, setSaleF] = useState({ amount: "", brand: "etsy" });
  const [ideaF, setIdeaF] = useState({ text: "", project: "etsy", priority: "inventario" });
  const [eventF, setEventF] = useState({ title: "", date: "", time: "" });
  const [periodF, setPeriodF] = useState({ date: new Date().toISOString().slice(0,10) });
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const today = new Date().toISOString().slice(0,10);
      const [p, t, i, iv, ev, en, cl, sy, pl] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("project_tasks").select("*").order("id", { ascending: false }),
        supabase.from("income").select("*"),
        supabase.from("ideas").select("*").neq("status","archivada").order("id",{ ascending: false }),
        supabase.from("calendar").select("*").gte("date", today).order("date").order("time"),
        supabase.from("energy").select("*").eq("date", today).order("id",{ ascending: false }).limit(1),
        supabase.from("cycle_log").select("*").eq("event","period_start").order("start_date",{ ascending: false }),
        supabase.from("cycle_symptoms").select("*").order("date",{ ascending: false }).limit(30),
        supabase.from("project_log").select("*").eq("date", today),
      ]);
      if (!active) return;
      if (p.data) setProjects(p.data);
      if (t.data) setTasks(t.data);
      if (i.data) setIncome(i.data);
      if (iv.data) setIdeas(iv.data);
      if (ev.data) setEvents(ev.data);
      if (en.data && en.data[0]) setEnergy(en.data[0].level);
      if (cl.data) setCycleLog(cl.data);
      if (sy.data) setSymptoms(sy.data);
      if (pl.data) setProjectLogs(pl.data);
      setLoading(false);
      setConnected(true);
    };
    load();

    const ch = supabase.channel("jarvis_hades_v14")
      .on("postgres_changes", { event: "*", schema: "public", table: "project_tasks" }, payload => {
        setTasks(prev => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev];
          if (payload.eventType === "UPDATE") return prev.map(t => t.id === payload.new.id ? payload.new : t);
          if (payload.eventType === "DELETE") return prev.filter(t => t.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, payload => {
        setProjects(prev => {
          if (payload.eventType === "INSERT") return [...prev, payload.new];
          if (payload.eventType === "UPDATE") return prev.map(p => p.id === payload.new.id ? payload.new : p);
          if (payload.eventType === "DELETE") return prev.filter(p => p.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "income" }, payload => setIncome(prev => [...prev, payload.new]))
      .on("postgres_changes", { event: "*", schema: "public", table: "ideas" }, payload => {
        setIdeas(prev => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev];
          if (payload.eventType === "UPDATE") return prev.map(i => i.id === payload.new.id ? payload.new : i);
          if (payload.eventType === "DELETE") return prev.filter(i => i.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar" }, payload => {
        setEvents(prev => {
          if (payload.eventType === "INSERT") return [...prev, payload.new].sort((a,b) => a.date.localeCompare(b.date) || (a.time||"").localeCompare(b.time||""));
          if (payload.eventType === "UPDATE") return prev.map(e => e.id === payload.new.id ? payload.new : e);
          if (payload.eventType === "DELETE") return prev.filter(e => e.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "energy" }, payload => {
        if (payload.new.date === new Date().toISOString().slice(0,10)) setEnergy(payload.new.level);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cycle_log" }, payload => {
        if (payload.new.event === "period_start") setCycleLog(prev => [payload.new, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cycle_symptoms" }, payload => setSymptoms(prev => [payload.new, ...prev]))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_log" }, payload => {
        if (payload.new.date === new Date().toISOString().slice(0,10)) setProjectLogs(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { active = false; ch.unsubscribe(); };
  }, []);

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const cycleState = cycleLog.length > 0 ? computeCycleState(cycleLog[0]) : null;
  const revTotal = income.reduce((a, r) => a + parseFloat(r.amount), 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyIncome = income.filter(r => new Date(r.date) >= weekAgo).reduce((a, r) => a + parseFloat(r.amount), 0);
  const pct = Math.round(revTotal / GOAL * 100);
  const totalPending = tasks.filter(t => !t.done).length;
  const today = new Date().toISOString().slice(0,10);
  const tasksDoneToday = tasks.filter(t => t.done && t.completed_at && t.completed_at.startsWith(today)).length;

  const productivity = computeProductivity({
    weeklyIncome, tasksDone: tasksDoneToday, tasksPending: totalPending,
    logsToday: projectLogs.length, energy,
  });
  const tier = getTier(productivity);
  const message = getMessage(tier.tier);

  const clientProjects = projects.filter(p => p.type === "client");
  const otherProjects = projects.filter(p => p.type === "main" && p.id !== "revenue");

  const toggleTask = async (t) => {
    await supabase.from("project_tasks").update({ done: !t.done, completed_at: !t.done ? new Date().toISOString() : null }).eq("id", t.id);
  };
  const addTask = async (project, text) => {
    if (!text.trim()) return;
    await supabase.from("project_tasks").insert({ project, text, priority: "media" });
  };
  const deleteTask = async (id) => { await supabase.from("project_tasks").delete().eq("id", id); };
  const addSale = async () => {
    const a = parseInt(saleF.amount.replace(/\D/g,""));
    if (!a) return;
    await supabase.from("income").insert({ amount: a, brand: saleF.brand, date: new Date().toISOString().slice(0,10) });
    setSaleF({ amount: "", brand: "etsy" });
    setShowSale(false);
  };
  const addIdea = async () => {
    if (!ideaF.text) return;
    await supabase.from("ideas").insert({ text: ideaF.text, project: ideaF.project, priority: ideaF.priority, status: "nueva" });
    setIdeaF({ text: "", project: "etsy", priority: "inventario" });
    setShowIdea(false);
  };
  const deleteIdea = async (id) => { await supabase.from("ideas").delete().eq("id", id); };
  const addEvent = async () => {
    if (!eventF.title || !eventF.date) return;
    await supabase.from("calendar").insert(eventF);
    setEventF({ title: "", date: "", time: "" });
    setShowEvent(false);
  };
  const deleteEvent = async (id) => { await supabase.from("calendar").delete().eq("id", id); };
  const setEnergyLevel = async (lv) => {
    setEnergy(lv);
    await supabase.from("energy").insert({ level: lv, date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5) });
  };
  const registerPeriod = async () => {
    await supabase.from("cycle_log").insert({ event: "period_start", start_date: periodF.date, cycle_length: CYCLE_LENGTH_DEFAULT, period_length: PERIOD_LENGTH_DEFAULT });
    setShowPeriod(false);
    setPeriodF({ date: new Date().toISOString().slice(0,10) });
  };

  const inputS = {
    background: H.obsidian, border: `1px solid ${H.goldDim}66`,
    padding: "10px 12px", color: H.parchment, fontSize: 13, outline: "none",
    fontFamily: "'JetBrains Mono', monospace",
  };

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: H.void, color: H.gold,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Cinzel', serif", letterSpacing: 6, fontSize: 18,
    }}>INVOCANDO...</div>
  );

  const phaseColor = cycleState ? PHASE_COLORS[cycleState.phase] : H.goldDim;
  const bodyGlow = tier.tier === "high"
    ? `radial-gradient(ellipse at top, ${H.elysium}11, transparent 60%), ${H.void}`
    : tier.tier === "mid"
      ? `radial-gradient(ellipse at top, ${H.amber}14, transparent 60%), ${H.void}`
      : `radial-gradient(ellipse at top, ${H.blood}18, transparent 60%), ${H.void}`;

  return (
    <div style={{
      minHeight: "100vh", background: bodyGlow, color: H.parchment,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "20px 24px", maxWidth: 1200, margin: "0 auto",
      transition: "background 1.5s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=JetBrains+Mono:wght@300;400;500;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${H.void}}
        ::-webkit-scrollbar-thumb{background:${H.goldDim}}
        ::-webkit-scrollbar-thumb:hover{background:${H.gold}}
        input::placeholder{color:${H.goldDim}!important}
        select option{background:${H.obsidian};color:${H.parchment}}
        body{background:${H.void};color:${H.parchment}}
        @keyframes emberFlicker {
          0%,100%{opacity:0.92;}
          50%{opacity:1;}
        }
        @keyframes subtleGlow {
          0%,100%{text-shadow:0 0 12px currentColor;}
          50%{text-shadow:0 0 22px currentColor;}
        }
        .hades-title{animation:subtleGlow 4s ease-in-out infinite;}
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Laurel color={H.gold} width={36} side="left"/>
            <div>
              <h1 className="hades-title" style={{
                fontFamily: "'Cinzel', serif", fontSize: 38, fontWeight: 900,
                color: H.goldBright, letterSpacing: 8,
                textShadow: `0 0 20px ${H.gold}66`, lineHeight: 1,
              }}>J·A·R·V·I·S</h1>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                fontSize: 12, color: H.parchmentDim, letterSpacing: 3, marginTop: 4,
              }}>ORACULUM · v14 · {connected ? "STYX SYNCED" : "SEVERED"}</div>
            </div>
            <Laurel color={H.gold} width={36} side="right"/>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700,
              color: H.goldBright, letterSpacing: 4, textShadow: `0 0 12px ${H.gold}66`,
            }}>
              {clock.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
              fontSize: 12, color: H.parchmentDim, marginTop: 4, letterSpacing: 2,
            }}>
              {clock.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{
          background: `linear-gradient(90deg, ${tier.color}22, ${H.obsidian} 50%, ${tier.color}22)`,
          border: `1px solid ${tier.color}66`, borderRadius: 2, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 16, position: "relative",
          boxShadow: `0 0 20px ${tier.color}33, inset 0 1px 0 ${tier.color}44`,
          transition: "all 1s", flexWrap: "wrap",
        }}>
          <Corner color={tier.color} position="tl"/>
          <Corner color={tier.color} position="tr"/>
          <Corner color={tier.color} position="bl"/>
          <Corner color={tier.color} position="br"/>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 32, fontWeight: 900,
            color: tier.color, textShadow: `0 0 16px ${tier.glow}`,
            minWidth: 70, textAlign: "center",
            animation: "emberFlicker 3s ease-in-out infinite",
          }}>{productivity}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 4,
              color: tier.color, marginBottom: 4, fontWeight: 600,
            }}>{tier.label}</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
              fontSize: 15, color: H.parchment, lineHeight: 1.3,
            }}>{message}</div>
          </div>
          <div style={{ width: 120, flexShrink: 0 }}>
            <Bar pct={productivity} color={tier.color} h={8}/>
          </div>
        </div>

        <div style={{ marginTop: 12 }}><GreekKey color={H.gold} height={14}/></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Panel title="TESORO" color={H.gold}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Ring pct={pct} size={76} color={H.gold}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17, fontWeight: 700, color: H.goldBright }}>{pct}%</div>
            </Ring>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700,
                color: revTotal > 0 ? H.elysium : H.goldDim,
                textShadow: revTotal > 0 ? `0 0 10px ${H.elysium}66` : "none",
              }}>${revTotal.toLocaleString("es-CO")}</div>
              <div style={{ fontSize: 10, color: H.parchmentDim, marginTop: 2 }}>Meta ${GOAL.toLocaleString("es-CO")}</div>
              <button onClick={() => setShowSale(!showSale)} style={{
                marginTop: 6, background: H.gold + "15", border: `1px solid ${H.gold}66`,
                color: H.goldBright, padding: "4px 10px", cursor: "pointer",
                fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: 2,
              }}>+ VENTA</button>
            </div>
          </div>
        </Panel>

        <Panel title="QUESTS" color={H.amber}>
          <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color: H.amber, textShadow: `0 0 10px ${H.amber}66` }}>{totalPending}</div>
              <div style={{ fontSize: 10, color: H.parchmentDim, marginTop: 2, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>PENDIENTES</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color: H.elysium, textShadow: `0 0 10px ${H.elysium}66` }}>{tasksDoneToday}</div>
              <div style={{ fontSize: 10, color: H.parchmentDim, marginTop: 2, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>HOY</div>
            </div>
          </div>
        </Panel>

        <Panel title="VIGOR" color={energy >= 7 ? H.elysium : energy >= 4 ? H.amber : H.blood}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ring pct={energy*10} size={66} color={energy >= 7 ? H.elysium : energy >= 4 ? H.amber : H.blood}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: energy >= 7 ? H.elysium : energy >= 4 ? H.amber : H.blood }}>{energy}</div>
            </Ring>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} onClick={() => setEnergyLevel(10-i)} style={{
                  width: 28, height: 3, cursor: "pointer",
                  background: (10-i) <= energy ? (energy >= 7 ? H.elysium : energy >= 4 ? H.amber : H.blood) : H.styx,
                  boxShadow: (10-i) <= energy ? `0 0 4px ${energy >= 7 ? H.elysium : energy >= 4 ? H.amber : H.blood}` : "none",
                }}/>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="CICLO" color={phaseColor}>
          {cycleState ? (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700, color: phaseColor, textTransform: "uppercase", letterSpacing: 2 }}>{cycleState.phase}</div>
              <div style={{ fontSize: 10, color: H.parchmentDim, marginTop: 2 }}>Dia {cycleState.cycleDay}/{cycleState.cycleLen}</div>
              <div style={{ fontSize: 10, color: H.parchmentDim, marginTop: 8, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Proximo periodo:</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: phaseColor, fontWeight: 700, textShadow: `0 0 8px ${phaseColor}66` }}>{cycleState.daysUntil}d</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: H.parchmentDim, marginBottom: 8, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Sin datos</div>
              <button onClick={() => setShowPeriod(true)} style={{
                background: H.blood + "22", border: `1px solid ${H.blood}`, color: H.bloodLight,
                padding: "6px 10px", cursor: "pointer", fontSize: 10,
                fontFamily: "'Cinzel', serif", letterSpacing: 2,
              }}>REGISTRAR</button>
            </div>
          )}
        </Panel>

        <Panel title="AGENDA" color={H.gold}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {events.slice(0, 3).map(ev => (
              <div key={ev.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: H.goldBright, minWidth: 38 }}>{ev.time || "--:--"}</div>
                <div style={{ fontSize: 11, color: H.parchment, lineHeight: 1.3, fontFamily: "'Cormorant Garamond', serif" }}>{ev.title}</div>
              </div>
            ))}
            {events.length === 0 && <div style={{ fontSize: 11, color: H.goldDim, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Los dioses reposan</div>}
          </div>
        </Panel>
      </div>

      {showSale && (
        <div style={{ background: H.ember, border: `1px solid ${H.gold}33`, padding: 14, marginBottom: 12, display: "flex", gap: 8, position: "relative", flexWrap: "wrap" }}>
          <Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/>
          <input placeholder="Monto COP" value={saleF.amount} onChange={e => setSaleF(p => ({ ...p, amount: e.target.value }))} style={{ ...inputS, flex: 1, minWidth: 120 }}/>
          <select value={saleF.brand} onChange={e => setSaleF(p => ({ ...p, brand: e.target.value }))} style={inputS}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={addSale} style={{ background: H.gold + "33", border: `1px solid ${H.gold}`, color: H.goldBright, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>OK</button>
        </div>
      )}

      {showPeriod && (
        <div style={{ background: H.ember, border: `1px solid ${H.blood}66`, padding: 14, marginBottom: 12, display: "flex", gap: 8, alignItems: "center", position: "relative", flexWrap: "wrap" }}>
          <Corner color={H.blood} position="tl"/><Corner color={H.blood} position="tr"/><Corner color={H.blood} position="bl"/><Corner color={H.blood} position="br"/>
          <span style={{ fontSize: 12, color: H.bloodLight, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>FECHA INICIO:</span>
          <input type="date" value={periodF.date} onChange={e => setPeriodF({ date: e.target.value })} style={inputS}/>
          <button onClick={registerPeriod} style={{ background: H.blood + "33", border: `1px solid ${H.blood}`, color: H.bloodLight, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>REGISTRAR</button>
          <button onClick={() => setShowPeriod(false)} style={{ background: "transparent", border: `1px solid ${H.goldDim}`, color: H.goldDim, padding: "10px 14px", cursor: "pointer", fontSize: 13 }}>X</button>
        </div>
      )}

      <Divider/>

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: `2px solid ${H.goldDim}44`, overflowX: "auto" }}>
        {[["projects","QUESTS"], ["ideas","VISIONES"], ["calendar","AGENDA"], ["cycle","CICLO"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "12px 22px", cursor: "pointer", border: "none", background: "transparent",
            fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 4, fontWeight: 600,
            color: tab === k ? H.goldBright : H.goldDim,
            borderBottom: tab === k ? `3px solid ${H.gold}` : "3px solid transparent",
            marginBottom: -2, textShadow: tab === k ? `0 0 10px ${H.gold}66` : "none",
            transition: "all 0.3s", whiteSpace: "nowrap",
          }}>{l}</button>
        ))}
      </div>

      {tab === "projects" && (
        <div>
          {clientProjects.length > 0 && (
            <>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 5, color: H.amber, marginBottom: 12, fontWeight: 600, textShadow: `0 0 8px ${H.amber}44` }}>◆ PACTOS · AGENCIA IA</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                {clientProjects.map(p => <ProjectRow key={p.id} project={p} tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask}/>)}
              </div>
            </>
          )}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 5, color: H.gold, marginBottom: 12, fontWeight: 600, textShadow: `0 0 8px ${H.gold}44` }}>◆ DOMINIOS PROPIOS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {otherProjects.map(p => <ProjectRow key={p.id} project={p} tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask}/>)}
          </div>
        </div>
      )}

      {tab === "ideas" && (
        <div>
          <button onClick={() => setShowIdea(!showIdea)} style={{
            marginBottom: 14, background: H.gold + "08", border: `1px dashed ${H.gold}66`,
            padding: "12px 16px", color: H.goldBright, cursor: "pointer",
            fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: 4, width: "100%",
          }}>+ CONVOCAR VISION</button>
          {showIdea && (
            <div style={{ background: H.ember, border: `1px solid ${H.gold}33`, padding: 14, marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
              <Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/>
              <input placeholder="Describe la vision..." value={ideaF.text} onChange={e => setIdeaF(p => ({ ...p, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && addIdea()} style={{ ...inputS, flex: 2, minWidth: 180 }}/>
              <select value={ideaF.project} onChange={e => setIdeaF(p => ({ ...p, project: e.target.value }))} style={inputS}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={ideaF.priority} onChange={e => setIdeaF(p => ({ ...p, priority: e.target.value }))} style={inputS}>
                <option value="pronto">Pronto</option>
                <option value="inventario">Inventario</option>
              </select>
              <button onClick={addIdea} style={{ background: H.gold + "33", border: `1px solid ${H.gold}`, color: H.goldBright, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>OK</button>
            </div>
          )}
          {ideas.filter(i => i.priority === "pronto").length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 4, color: H.bloodLight, marginBottom: 8, fontWeight: 600 }}>◆ TRABAJAR PRONTO</div>
              {ideas.filter(i => i.priority === "pronto").map(i => (
                <div key={i.id} style={{ background: H.ember, borderLeft: `3px solid ${H.blood}`, padding: "12px 14px", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: H.parchment, fontFamily: "'Cormorant Garamond', serif" }}>{i.text}</div>
                    <div style={{ fontSize: 10, color: H.goldDim, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{projects.find(p => p.id === i.project)?.name || i.project}</div>
                  </div>
                  <button onClick={() => deleteIdea(i.id)} style={{ background: "transparent", border: "none", color: H.goldDim, cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {ideas.filter(i => i.priority === "inventario").length > 0 && (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 4, color: H.goldDim, marginBottom: 8, fontWeight: 600 }}>◆ INVENTARIO</div>
              {ideas.filter(i => i.priority === "inventario").map(i => (
                <div key={i.id} style={{ background: H.obsidian, padding: "10px 14px", marginBottom: 3, border: `1px solid ${H.styx}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: H.parchmentDim, fontFamily: "'Cormorant Garamond', serif" }}>{i.text}</div>
                    <div style={{ fontSize: 10, color: H.goldDim, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{projects.find(p => p.id === i.project)?.name || i.project}</div>
                  </div>
                  <button onClick={() => deleteIdea(i.id)} style={{ background: "transparent", border: "none", color: H.goldDim, cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {ideas.length === 0 && <div style={{ textAlign: "center", padding: 50, color: H.goldDim, fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>El oraculo aun no habla</div>}
        </div>
      )}

      {tab === "calendar" && (
        <div>
          <button onClick={() => setShowEvent(!showEvent)} style={{
            marginBottom: 14, background: H.gold + "08", border: `1px dashed ${H.gold}66`,
            padding: "12px 16px", color: H.goldBright, cursor: "pointer",
            fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: 4, width: "100%",
          }}>+ CONSAGRAR EVENTO</button>
          {showEvent && (
            <div style={{ background: H.ember, border: `1px solid ${H.gold}33`, padding: 14, marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
              <Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/>
              <input placeholder="Titulo" value={eventF.title} onChange={e => setEventF(p => ({ ...p, title: e.target.value }))} style={{ ...inputS, flex: 2, minWidth: 180 }}/>
              <input type="date" value={eventF.date} onChange={e => setEventF(p => ({ ...p, date: e.target.value }))} style={inputS}/>
              <input type="time" value={eventF.time} onChange={e => setEventF(p => ({ ...p, time: e.target.value }))} style={{ ...inputS, width: 110 }}/>
              <button onClick={addEvent} style={{ background: H.gold + "33", border: `1px solid ${H.gold}`, color: H.goldBright, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>OK</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ background: H.ember, border: `1px solid ${H.goldDim}33`, display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" }}>
                <div style={{ background: H.gold + "11", border: `1px solid ${H.gold}`, padding: "10px 14px", textAlign: "center", minWidth: 60, boxShadow: `inset 0 0 10px ${H.gold}22` }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: H.goldBright }}>{new Date(ev.date + "T00:00").getDate()}</div>
                  <div style={{ fontSize: 9, color: H.goldDim, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>{new Date(ev.date + "T00:00").toLocaleDateString("es-CO", { month: "short" })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: H.parchment, fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: H.goldDim, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>{ev.time || "TODO EL DIA"}</div>
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={{ background: "transparent", border: "none", color: H.goldDim, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
            {events.length === 0 && <div style={{ textAlign: "center", padding: 50, color: H.goldDim, fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Ningun evento consagrado</div>}
          </div>
        </div>
      )}

      {tab === "cycle" && (
        <div>
          {cycleState ? (
            <>
              <div style={{ background: H.ember, border: `1px solid ${phaseColor}66`, padding: 20, marginBottom: 16, display: "flex", gap: 24, alignItems: "center", position: "relative", flexWrap: "wrap" }}>
                <Corner color={phaseColor} position="tl"/><Corner color={phaseColor} position="tr"/><Corner color={phaseColor} position="bl"/><Corner color={phaseColor} position="br"/>
                <Ring pct={cycleState.cycleDay/cycleState.cycleLen*100} size={100} color={phaseColor}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color: phaseColor, textShadow: `0 0 10px ${phaseColor}66` }}>{cycleState.cycleDay}</div>
                  <div style={{ fontSize: 9, color: H.goldDim, marginTop: 2, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>DE {cycleState.cycleLen}</div>
                </Ring>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 700, color: phaseColor, textTransform: "uppercase", letterSpacing: 4, textShadow: `0 0 12px ${phaseColor}66` }}>{cycleState.phase}</div>
                  <div style={{ fontSize: 13, color: H.parchment, marginTop: 10, lineHeight: 1.5, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>{PHASE_INFO[cycleState.phase].descripcion}</div>
                  <div style={{ fontSize: 11, color: H.parchmentDim, marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                    Energia: <span style={{ color: phaseColor, fontWeight: 700 }}>{PHASE_INFO[cycleState.phase].energia}</span>
                  </div>
                  <div style={{ fontSize: 11, color: H.parchmentDim, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                    Proximo: <span style={{ color: phaseColor, fontWeight: 700 }}>{cycleState.nextPeriod.toISOString().slice(0,10)}</span> <span style={{ color: H.goldDim }}>(en {cycleState.daysUntil}d)</span>
                  </div>
                </div>
              </div>

              <CycleCalendar cycleState={cycleState}/>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div style={{ background: H.ember, border: `1px solid ${H.elysiumDim}66`, padding: 14, position: "relative" }}>
                  <Corner color={H.elysium} position="tl"/><Corner color={H.elysium} position="tr"/><Corner color={H.elysium} position="bl"/><Corner color={H.elysium} position="br"/>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, color: H.elysium, marginBottom: 10, fontWeight: 600 }}>TAREAS IDEALES AHORA</div>
                  {PHASE_INFO[cycleState.phase].tareas.map((t, i) => (
                    <div key={i} style={{ fontSize: 13, color: H.parchment, padding: "5px 0", fontFamily: "'Cormorant Garamond', serif" }}>◆ {t}</div>
                  ))}
                </div>
                <div style={{ background: H.ember, border: `1px solid ${H.bloodDeep}66`, padding: 14, position: "relative" }}>
                  <Corner color={H.blood} position="tl"/><Corner color={H.blood} position="tr"/><Corner color={H.blood} position="bl"/><Corner color={H.blood} position="br"/>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, color: H.bloodLight, marginBottom: 10, fontWeight: 600 }}>HISTORIAL SINTOMAS</div>
                  {symptoms.slice(0, 5).map(s => (
                    <div key={s.id} style={{ fontSize: 11, color: H.parchmentDim, padding: "5px 0", borderBottom: `1px solid ${H.styx}`, fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.date} · {s.phase || "?"} · {s.mood || "?"}
                      {s.symptoms && s.symptoms.length > 0 && <span style={{ color: H.parchment }}> · {s.symptoms.join(", ")}</span>}
                    </div>
                  ))}
                  {symptoms.length === 0 && <div style={{ fontSize: 11, color: H.goldDim, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Sin registros</div>}
                </div>
              </div>

              <button onClick={() => setShowPeriod(true)} style={{
                background: H.blood + "33", border: `1px solid ${H.blood}`, color: H.bloodLight,
                padding: "12px 20px", cursor: "pointer", fontSize: 11, fontFamily: "'Cinzel', serif",
                letterSpacing: 3, width: "100%", fontWeight: 600,
              }}>+ REGISTRAR NUEVO PERIODO</button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 50, color: H.parchmentDim }}>
              <div style={{ fontSize: 14, marginBottom: 16, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>El oraculo aun no revela tu ciclo</div>
              <button onClick={() => setShowPeriod(true)} style={{
                background: H.blood + "33", border: `1px solid ${H.blood}`, color: H.bloodLight,
                padding: "12px 22px", cursor: "pointer", fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: 3,
              }}>REGISTRAR PRIMER PERIODO</button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 32 }}><GreekKey color={H.gold} height={14}/></div>
      <div style={{
        marginTop: 14, textAlign: "center", fontFamily: "'Cinzel', serif",
        fontSize: 9, letterSpacing: 6, color: H.goldDim, marginBottom: 10,
      }}>EX INFERIS AD STELLAS · STYX REALTIME</div>
    </div>
  );
}
