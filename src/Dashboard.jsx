import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const GOAL = 2000000;
const CYCLE_LENGTH_DEFAULT = 24;
const PERIOD_LENGTH_DEFAULT = 5;
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPA_URL, SUPA_KEY);

const PROJECT_COLORS = {
  etsy:"#f56400", pitonisa:"#ff3366", fiverr:"#16a34a", agencia:"#00d4ff",
  helena:"#00d4ff", martin:"#00ff88", sonia:"#ff9500", rafael:"#a78bfa",
  revenue:"#00ff44",
};
const DESCRIPTIONS = {
  etsy:"60+ productos digitales - 0 ventas",
  pitonisa:"IG + TikTok + YouTube - tarot $50-100K",
  fiverr:"Primer gig de agentes IA",
  agencia:"Bots para clientes",
  helena:"Bot tienda celulares - CellBot",
  martin:"Celulares mayorista",
  sonia:"Empresa de construccion",
  rafael:"Empresa transporte",
  revenue:"Fiverr + Etsy sin cara, sin video - $10k/mes",
};
const PC = { alta:"#ff3366", media:"#ffaa00", baja:"#334" };

const PHASE_COLORS = {
  menstrual: "#ff3366",
  folicular: "#00ff88",
  ovulacion: "#ffaa00",
  lutea: "#a78bfa",
};

const PHASE_INFO = {
  menstrual: {
    energia: "baja",
    descripcion: "Descanso, planificacion, tareas admin. No presiones creatividad.",
    tareas: ["planificar semana", "revisar reportes", "organizar archivos"],
  },
  folicular: {
    energia: "alta creciente",
    descripcion: "Creatividad, nuevos proyectos, contenido, brainstorm.",
    tareas: ["crear contenido", "nuevos productos", "aprender"],
  },
  ovulacion: {
    energia: "maxima",
    descripcion: "Ventas, reuniones, grabaciones, networking, pitch.",
    tareas: ["llamadas venta", "grabar reels", "lanzamientos"],
  },
  lutea: {
    energia: "decreciente",
    descripcion: "Detalles, edicion, cierres, finalizar pendientes.",
    tareas: ["editar", "revisar", "finalizar", "cerrar ventas"],
  },
};

function computeCycleState(lastPeriod) {
  if (!lastPeriod) return null;
  const start = new Date(lastPeriod.start_date + "T00:00");
  const today = new Date();
  today.setHours(0,0,0,0);
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
  return { cycleDay, phase, nextPeriod, daysUntil, cycleLen, periodLen, lastStart: lastPeriod.start_date };
}

function Ring({ pct, size=110, stroke=5, color="#00d4ff", children }) {
  const r = (size - stroke*2)/2;
  const c = 2 * Math.PI * r;
  const off = c - (pct/100) * c;
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0a1828" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke-1}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1s", filter:`drop-shadow(0 0 8px ${color}55)` }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {children}
      </div>
    </div>
  );
}

function Bar({ pct, color="#00d4ff", h=6 }) {
  return (
    <div style={{ background:"#0a1828", borderRadius:3, height:h, width:"100%", overflow:"hidden" }}>
      <div style={{ background:color, height:"100%", width:`${Math.min(pct,100)}%`, borderRadius:3,
        transition:"width 0.8s", boxShadow:`0 0 10px ${color}44` }}/>
    </div>
  );
}

function Panel({ children, title, color="#00d4ff", span=1 }) {
  return (
    <div style={{
      background:"linear-gradient(180deg,#060d18,#040a14)",
      border:`1px solid ${color}18`, borderRadius:4, padding:"18px 20px",
      gridColumn:`span ${span}`, position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:0, left:0, width:24, height:1, background:color }}/>
      <div style={{ position:"absolute", top:0, left:0, width:1, height:24, background:color }}/>
      <div style={{ position:"absolute", top:0, right:0, width:24, height:1, background:color }}/>
      <div style={{ position:"absolute", top:0, right:0, width:1, height:24, background:color }}/>
      {title && <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, letterSpacing:4, color:color+"99", marginBottom:14 }}>{title}</div>}
      {children}
    </div>
  );
}

function ProjectRow({ project, tasks, onToggleTask, onAddTask, onDeleteTask }) {
  const [open, setOpen] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [adding, setAdding] = useState(false);
  const c = PROJECT_COLORS[project.id] || project.color || "#00d4ff";
  const desc = DESCRIPTIONS[project.id] || project.description || "";
  const myTasks = tasks.filter(t => t.project === project.id);
  const done = myTasks.filter(t => t.done).length;
  const total = myTasks.length;
  const pct = total ? Math.round(done/total*100) : 0;

  return (
    <div style={{ background:"#060d18", border:`1px solid ${open ? c+"33" : "#0a1828"}`, borderRadius:4, overflow:"hidden", transition:"border-color 0.3s" }}>
      <div onClick={() => setOpen(!open)} style={{
        padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:16,
        background:open ? `linear-gradient(90deg,${c}06,transparent)` : "transparent",
      }}>
        <div style={{ width:40, height:40, borderRadius:6, background:c+"12", border:`1px solid ${c}33`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Orbitron'", fontSize:16, fontWeight:700, color:c, flexShrink:0 }}>{project.name[0]}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontFamily:"'Orbitron'", fontSize:14, color:"#c0d0e0", letterSpacing:1 }}>{project.name}</span>
            {project.type === "client" && <span style={{ fontSize:8, background:"#ffaa0012", color:"#ffaa00", border:"1px solid #ffaa0033", padding:"2px 6px", borderRadius:2, fontFamily:"'Orbitron'", letterSpacing:1 }}>CLIENT</span>}
          </div>
          <div style={{ fontSize:12, color:"#3a4a5a" }}>{desc}</div>
        </div>
        <div style={{ width:130, flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontFamily:"'Orbitron'", fontSize:18, fontWeight:700, color:c, textShadow:`0 0 12px ${c}33` }}>{pct}%</span>
            <span style={{ fontSize:10, color:"#2a3a4a", alignSelf:"flex-end" }}>{done}/{total}</span>
          </div>
          <Bar pct={pct} color={c}/>
        </div>
      </div>

      {open && (
        <div style={{ padding:"4px 18px 18px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {myTasks.filter(t => !t.done).map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#040a14", border:"1px solid #0a1828", borderRadius:3 }}>
                <div onClick={() => onToggleTask(t)} style={{ width:20, height:20, borderRadius:3, border:`2px solid ${PC[t.priority] || "#334"}`, cursor:"pointer", flexShrink:0 }}/>
                <span style={{ fontSize:13, color:"#8899aa", lineHeight:1.4, flex:1 }}>{t.text}</span>
                <span style={{ fontSize:9, color:"#1a2a3a", flexShrink:0 }}>{t.priority}</span>
                <button onClick={() => onDeleteTask(t.id)} style={{ background:"transparent", border:"none", color:"#334", cursor:"pointer", fontSize:14, padding:"0 4px" }}>×</button>
              </div>
            ))}
            {myTasks.filter(t => t.done).length > 0 && (
              <>
                <div style={{ fontSize:9, color:"#112233", fontFamily:"'Orbitron'", letterSpacing:3, marginTop:8, marginBottom:2 }}>COMPLETADO</div>
                {myTasks.filter(t => t.done).map(t => (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", background:"#030810", border:"1px solid #080f1a", borderRadius:3 }}>
                    <div onClick={() => onToggleTask(t)} style={{ width:20, height:20, borderRadius:3, background:"#00ff44", border:"2px solid #00ff44", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#000", fontWeight:700, flexShrink:0 }}>✓</div>
                    <span style={{ fontSize:13, color:"#2a3a4a", textDecoration:"line-through", flex:1 }}>{t.text}</span>
                    <button onClick={() => onDeleteTask(t.id)} style={{ background:"transparent", border:"none", color:"#334", cursor:"pointer", fontSize:14, padding:"0 4px" }}>×</button>
                  </div>
                ))}
              </>
            )}
          </div>
          {adding ? (
            <div style={{ display:"flex", gap:6, marginTop:10 }}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onAddTask(project.id, newTodo); setNewTodo(""); setAdding(false); } }} autoFocus placeholder="Nueva tarea..."
                style={{ flex:1, background:"#040a14", border:`1px solid ${c}22`, borderRadius:3, padding:"9px 12px", color:"#8899aa", fontSize:13, outline:"none", fontFamily:"inherit" }}/>
              <button onClick={() => { onAddTask(project.id, newTodo); setNewTodo(""); setAdding(false); }} style={{ background:c+"22", border:`1px solid ${c}44`, color:c, padding:"9px 14px", cursor:"pointer", fontWeight:700, fontSize:13, borderRadius:3 }}>+</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ marginTop:10, width:"100%", background:"transparent", border:`1px dashed ${c}15`, borderRadius:3, padding:8, color:"#1a2a3a", cursor:"pointer", fontSize:11, fontFamily:"'Orbitron'", letterSpacing:2 }}>+ TAREA</button>
          )}
        </div>
      )}
    </div>
  );
}

function CycleCalendar({ cycleState, symptoms }) {
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
    <div style={{ background:"#060d18", border:"1px solid #0a1828", borderRadius:4, padding:16, marginBottom:16 }}>
      <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:"#8899aa88", marginBottom:12 }}>CALENDARIO DEL CICLO</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(12, 1fr)", gap:4 }}>
        {days.map(d => (
          <div key={d.day} style={{
            aspectRatio:"1", background:PHASE_COLORS[d.phase] + (d.current ? "88" : "22"),
            border: d.current ? `2px solid ${PHASE_COLORS[d.phase]}` : `1px solid ${PHASE_COLORS[d.phase]}33`,
            borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontFamily:"'Orbitron'", fontWeight:700, color:d.current ? "#fff" : PHASE_COLORS[d.phase],
            boxShadow: d.current ? `0 0 12px ${PHASE_COLORS[d.phase]}` : "none",
          }}>{d.day}</div>
        ))}
      </div>
      <div style={{ display:"flex", gap:14, marginTop:12, fontSize:10, color:"#5a6a7a" }}>
        {Object.entries(PHASE_COLORS).map(([k,v]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:10, height:10, background:v, borderRadius:2 }}/>
            <span style={{ textTransform:"uppercase", fontFamily:"'Orbitron'", letterSpacing:1 }}>{k}</span>
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
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("projects");
  const [showSale, setShowSale] = useState(false);
  const [showIdea, setShowIdea] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [saleF, setSaleF] = useState({ amount:"", brand:"etsy" });
  const [ideaF, setIdeaF] = useState({ text:"", project:"etsy", priority:"inventario" });
  const [eventF, setEventF] = useState({ title:"", date:"", time:"" });
  const [periodF, setPeriodF] = useState({ date: new Date().toISOString().slice(0,10) });
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const today = new Date().toISOString().slice(0,10);
      const [p, t, i, iv, ev, en, cl, sy, pr] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("project_tasks").select("*").order("id", { ascending:false }),
        supabase.from("income").select("*"),
        supabase.from("ideas").select("*").neq("status","archivada").order("id",{ ascending:false }),
        supabase.from("calendar").select("*").gte("date", today).order("date").order("time"),
        supabase.from("energy").select("*").eq("date", today).order("id",{ ascending:false }).limit(1),
        supabase.from("cycle_log").select("*").eq("event","period_start").order("start_date",{ ascending:false }),
        supabase.from("cycle_symptoms").select("*").order("date",{ ascending:false }).limit(30),
        supabase.from("products").select("*").order("created_at",{ ascending:false }),
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
      if (pr.data) setProducts(pr.data);
      setLoading(false);
      setConnected(true);
    };
    load();

    const ch = supabase.channel("jarvis_sync_v13")
      .on("postgres_changes", { event:"*", schema:"public", table:"project_tasks" }, payload => {
        setTasks(prev => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev];
          if (payload.eventType === "UPDATE") return prev.map(t => t.id === payload.new.id ? payload.new : t);
          if (payload.eventType === "DELETE") return prev.filter(t => t.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"projects" }, payload => {
        setProjects(prev => {
          if (payload.eventType === "INSERT") return [...prev, payload.new];
          if (payload.eventType === "UPDATE") return prev.map(p => p.id === payload.new.id ? payload.new : p);
          if (payload.eventType === "DELETE") return prev.filter(p => p.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"income" }, payload => setIncome(prev => [...prev, payload.new]))
      .on("postgres_changes", { event:"*", schema:"public", table:"ideas" }, payload => {
        setIdeas(prev => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev];
          if (payload.eventType === "UPDATE") return prev.map(i => i.id === payload.new.id ? payload.new : i);
          if (payload.eventType === "DELETE") return prev.filter(i => i.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"calendar" }, payload => {
        setEvents(prev => {
          if (payload.eventType === "INSERT") return [...prev, payload.new].sort((a,b) => a.date.localeCompare(b.date) || (a.time||"").localeCompare(b.time||""));
          if (payload.eventType === "UPDATE") return prev.map(e => e.id === payload.new.id ? payload.new : e);
          if (payload.eventType === "DELETE") return prev.filter(e => e.id !== payload.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"energy" }, payload => {
        if (payload.new.date === new Date().toISOString().slice(0,10)) setEnergy(payload.new.level);
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"cycle_log" }, payload => {
        if (payload.new.event === "period_start") setCycleLog(prev => [payload.new, ...prev]);
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"cycle_symptoms" }, payload => setSymptoms(prev => [payload.new, ...prev]))
      .on("postgres_changes", { event:"*", schema:"public", table:"products" }, payload => {
        setProducts(prev => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev];
          if (payload.eventType === "UPDATE") return prev.map(p => p.id === payload.new.id ? payload.new : p);
          if (payload.eventType === "DELETE") return prev.filter(p => p.id !== payload.old.id);
          return prev;
        });
      })
      .subscribe();

    return () => { active = false; ch.unsubscribe(); };
  }, []);

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const cycleState = cycleLog.length > 0 ? computeCycleState(cycleLog[0]) : null;

  const revTotal = income.reduce((a,r) => a + parseFloat(r.amount), 0);
  const pct = Math.round(revTotal/GOAL*100);
  const totalPending = tasks.filter(t => !t.done).length;
  const totalDone = tasks.filter(t => t.done).length;
  const clientProjects = projects.filter(p => p.type === "client");
  const otherProjects = projects.filter(p => p.type === "main");

  const toggleTask = async (t) => {
    await supabase.from("project_tasks").update({ done: !t.done, completed_at: !t.done ? new Date().toISOString() : null }).eq("id", t.id);
  };
  const addTask = async (project, text) => {
    if (!text.trim()) return;
    await supabase.from("project_tasks").insert({ project, text, priority:"media" });
  };
  const deleteTask = async (id) => { await supabase.from("project_tasks").delete().eq("id", id); };
  const addSale = async () => {
    const a = parseInt(saleF.amount.replace(/\D/g,""));
    if (!a) return;
    await supabase.from("income").insert({ amount:a, brand:saleF.brand, date:new Date().toISOString().slice(0,10) });
    setSaleF({ amount:"", brand:"etsy" });
    setShowSale(false);
  };
  const addIdea = async () => {
    if (!ideaF.text) return;
    await supabase.from("ideas").insert({ text:ideaF.text, project:ideaF.project, priority:ideaF.priority, status:"nueva" });
    setIdeaF({ text:"", project:"etsy", priority:"inventario" });
    setShowIdea(false);
  };
  const deleteIdea = async (id) => { await supabase.from("ideas").delete().eq("id", id); };
  const addEvent = async () => {
    if (!eventF.title || !eventF.date) return;
    await supabase.from("calendar").insert(eventF);
    setEventF({ title:"", date:"", time:"" });
    setShowEvent(false);
  };
  const deleteEvent = async (id) => { await supabase.from("calendar").delete().eq("id", id); };
  const setEnergyLevel = async (lv) => {
    setEnergy(lv);
    await supabase.from("energy").insert({ level:lv, date:new Date().toISOString().slice(0,10), time:new Date().toTimeString().slice(0,5) });
  };
  const registerPeriod = async () => {
    await supabase.from("cycle_log").insert({ event:"period_start", start_date:periodF.date, cycle_length:CYCLE_LENGTH_DEFAULT, period_length:PERIOD_LENGTH_DEFAULT });
    setShowPeriod(false);
    setPeriodF({ date: new Date().toISOString().slice(0,10) });
  };

  const inputS = { background:"#040a14", border:"1px solid #0a2030", borderRadius:3, padding:"9px 12px", color:"#6688aa", fontSize:13, outline:"none", fontFamily:"inherit" };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#020508", color:"#00d4ff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", letterSpacing:4 }}>
      CONECTANDO...
    </div>
  );

  const phaseColor = cycleState ? PHASE_COLORS[cycleState.phase] : "#334";

  return (
    <div style={{ minHeight:"100vh", background:"#020508", color:"#8899aa", fontFamily:"'JetBrains Mono','Fira Code',monospace", padding:"20px 24px", maxWidth:1200, margin:"0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Orbitron:wght@400;500;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:#0a2030}
        input::placeholder{color:#1a2a3a!important}
        select option{background:#040a14;color:#4466aa}
      `}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Orbitron'", fontSize:32, fontWeight:900, color:"#00d4ff", letterSpacing:4, textShadow:"0 0 24px #00d4ff33" }}>J.A.R.V.I.S</h1>
          <div style={{ fontFamily:"'Orbitron'", fontSize:9, color:"#0a2a40", letterSpacing:4, marginTop:4 }}>
            COMMAND CENTER v13 · {connected ? "LIVE SYNC" : "OFFLINE"}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Orbitron'", fontSize:28, fontWeight:700, color:"#00d4ff", textShadow:"0 0 12px #00d4ff33", letterSpacing:3 }}>
            {clock.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
          </div>
          <div style={{ fontSize:11, color:"#1a2a3a", marginTop:4 }}>
            {clock.toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"long" }).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:12, marginBottom:16 }}>
        <Panel title="REVENUE" color="#00d4ff">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Ring pct={pct} size={80} color="#00d4ff">
              <div style={{ fontFamily:"'Orbitron'", fontSize:18, fontWeight:700, color:"#00d4ff" }}>{pct}%</div>
            </Ring>
            <div>
              <div style={{ fontFamily:"'Orbitron'", fontSize:18, fontWeight:700, color:revTotal > 0 ? "#00ff44" : "#1a2a3a" }}>
                ${revTotal.toLocaleString("es-CO")}
              </div>
              <div style={{ fontSize:10, color:"#1a2a3a", marginTop:2 }}>Meta ${GOAL.toLocaleString("es-CO")}</div>
              <button onClick={() => setShowSale(!showSale)}
                style={{ marginTop:6, background:"#00d4ff0a", border:"1px solid #00d4ff22", borderRadius:3, color:"#00d4ff88", padding:"3px 8px", cursor:"pointer", fontSize:9, fontFamily:"'Orbitron'", letterSpacing:1 }}>+ VENTA</button>
            </div>
          </div>
        </Panel>

        <Panel title="TAREAS" color="#ffaa00">
          <div style={{ display:"flex", gap:16, marginTop:4 }}>
            <div>
              <div style={{ fontFamily:"'Orbitron'", fontSize:26, fontWeight:700, color:"#ffaa00" }}>{totalPending}</div>
              <div style={{ fontSize:10, color:"#2a3a4a", marginTop:2 }}>Pendientes</div>
            </div>
            <div>
              <div style={{ fontFamily:"'Orbitron'", fontSize:26, fontWeight:700, color:"#00ff44" }}>{totalDone}</div>
              <div style={{ fontSize:10, color:"#2a3a4a", marginTop:2 }}>Hechas</div>
            </div>
          </div>
        </Panel>

        <Panel title="ENERGIA" color={energy >= 7 ? "#00ff44" : energy >= 4 ? "#ffaa00" : "#ff3366"}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Ring pct={energy*10} size={70} color={energy >= 7 ? "#00ff44" : energy >= 4 ? "#ffaa00" : "#ff3366"}>
              <div style={{ fontFamily:"'Orbitron'", fontSize:20, fontWeight:700, color:energy >= 7 ? "#00ff44" : energy >= 4 ? "#ffaa00" : "#ff3366" }}>{energy}</div>
            </Ring>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} onClick={() => setEnergyLevel(10-i)} style={{ width:30, height:3, borderRadius:2, cursor:"pointer", background:(10-i) <= energy ? (energy >= 7 ? "#00ff44" : energy >= 4 ? "#ffaa00" : "#ff3366") : "#0a1828" }}/>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="CICLO" color={phaseColor}>
          {cycleState ? (
            <div>
              <div style={{ fontFamily:"'Orbitron'", fontSize:22, fontWeight:700, color:phaseColor, textTransform:"uppercase" }}>{cycleState.phase}</div>
              <div style={{ fontSize:10, color:"#3a4a5a", marginTop:2 }}>Dia {cycleState.cycleDay}/{cycleState.cycleLen}</div>
              <div style={{ fontSize:10, color:"#5a6a7a", marginTop:8 }}>Proximo periodo:</div>
              <div style={{ fontFamily:"'Orbitron'", fontSize:13, color:phaseColor, fontWeight:700 }}>{cycleState.daysUntil}d</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:11, color:"#3a4a5a", marginBottom:8 }}>Sin datos</div>
              <button onClick={() => setShowPeriod(true)} style={{ background:"#ff336620", border:"1px solid #ff336644", color:"#ff3366", padding:"6px 10px", cursor:"pointer", fontSize:10, fontFamily:"'Orbitron'", letterSpacing:1, borderRadius:3 }}>REGISTRAR</button>
            </div>
          )}
        </Panel>

        <Panel title="AGENDA" color="#a78bfa">
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {events.slice(0, 3).map(ev => (
              <div key={ev.id} style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ fontFamily:"'Orbitron'", fontSize:12, fontWeight:700, color:"#a78bfa", minWidth:40 }}>{ev.time || ""}</div>
                <div style={{ fontSize:11, color:"#5a6a7a", lineHeight:1.3 }}>{ev.title}</div>
              </div>
            ))}
            {events.length === 0 && <div style={{ fontSize:11, color:"#1a2a3a" }}>Sin eventos</div>}
          </div>
        </Panel>
      </div>

      {showSale && (
        <div style={{ background:"#060d18", border:"1px solid #00d4ff18", borderRadius:4, padding:14, marginBottom:12, display:"flex", gap:8 }}>
          <input placeholder="Monto COP" value={saleF.amount} onChange={e => setSaleF(p => ({ ...p, amount:e.target.value }))} style={{ ...inputS, flex:1 }}/>
          <select value={saleF.brand} onChange={e => setSaleF(p => ({ ...p, brand:e.target.value }))} style={inputS}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={addSale} style={{ background:"#00d4ff22", border:"1px solid #00d4ff44", color:"#00d4ff", padding:"9px 16px", cursor:"pointer", fontWeight:700, fontSize:13, borderRadius:3 }}>OK</button>
        </div>
      )}

      {showPeriod && (
        <div style={{ background:"#060d18", border:"1px solid #ff336618", borderRadius:4, padding:14, marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#ff336699" }}>Fecha inicio periodo:</span>
          <input type="date" value={periodF.date} onChange={e => setPeriodF({ date:e.target.value })} style={inputS}/>
          <button onClick={registerPeriod} style={{ background:"#ff336622", border:"1px solid #ff336644", color:"#ff3366", padding:"9px 16px", cursor:"pointer", fontWeight:700, fontSize:13, borderRadius:3 }}>REGISTRAR</button>
          <button onClick={() => setShowPeriod(false)} style={{ background:"transparent", border:"1px solid #334", color:"#445", padding:"9px 14px", cursor:"pointer", fontSize:13, borderRadius:3 }}>X</button>
        </div>
      )}

      <div style={{ display:"flex", gap:0, marginBottom:14, borderBottom:"1px solid #0a1828" }}>
        {[["projects","PROYECTOS"], ["ideas","IDEAS"], ["calendar","AGENDA"], ["cycle","CICLO"], ["products","PRODUCTOS"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding:"10px 18px", cursor:"pointer", border:"none", background:"transparent",
            fontFamily:"'Orbitron'", fontSize:11, letterSpacing:3,
            color:tab === k ? "#00d4ff" : "#1a2a3a",
            borderBottom:tab === k ? "2px solid #00d4ff" : "2px solid transparent",
            marginBottom:-1,
          }}>{l}</button>
        ))}
      </div>

      {tab === "projects" && (
        <div>
          <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:4, color:"#ffaa0066", marginBottom:10 }}>CLIENTES AGENCIA IA</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
            {clientProjects.map(p => (
              <ProjectRow key={p.id} project={p} tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask}/>
            ))}
          </div>
          <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:4, color:"#00d4ff66", marginBottom:10 }}>PROYECTOS PROPIOS</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {otherProjects.map(p => (
              <ProjectRow key={p.id} project={p} tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask}/>
            ))}
          </div>
        </div>
      )}

      {tab === "ideas" && (
        <div>
          <button onClick={() => setShowIdea(!showIdea)} style={{ marginBottom:14, background:"#a78bfa0a", border:"1px solid #a78bfa22", borderRadius:3, padding:"10px 16px", color:"#a78bfa88", cursor:"pointer", fontSize:11, fontFamily:"'Orbitron'", letterSpacing:2, width:"100%" }}>+ NUEVA IDEA</button>
          {showIdea && (
            <div style={{ background:"#060d18", border:"1px solid #a78bfa18", borderRadius:4, padding:14, marginBottom:14, display:"flex", gap:8 }}>
              <input placeholder="Describe la idea..." value={ideaF.text} onChange={e => setIdeaF(p => ({ ...p, text:e.target.value }))} onKeyDown={e => e.key === "Enter" && addIdea()} style={{ ...inputS, flex:2 }}/>
              <select value={ideaF.project} onChange={e => setIdeaF(p => ({ ...p, project:e.target.value }))} style={inputS}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={ideaF.priority} onChange={e => setIdeaF(p => ({ ...p, priority:e.target.value }))} style={inputS}>
                <option value="pronto">Pronto</option>
                <option value="inventario">Inventario</option>
              </select>
              <button onClick={addIdea} style={{ background:"#a78bfa22", border:"1px solid #a78bfa44", color:"#a78bfa", padding:"9px 14px", cursor:"pointer", fontWeight:700, borderRadius:3 }}>OK</button>
            </div>
          )}
          {ideas.filter(i => i.priority === "pronto").length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:"#a78bfa66", marginBottom:8 }}>TRABAJAR PRONTO</div>
              {ideas.filter(i => i.priority === "pronto").map(i => (
                <div key={i.id} style={{ background:"#060d18", borderLeft:"3px solid #a78bfa", padding:"12px 14px", marginBottom:4, borderRadius:3, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#8899aa" }}>{i.text}</div>
                    <div style={{ fontSize:10, color:"#2a3a4a", marginTop:4 }}>{projects.find(p => p.id === i.project)?.name || i.project}</div>
                  </div>
                  <button onClick={() => deleteIdea(i.id)} style={{ background:"transparent", border:"none", color:"#334", cursor:"pointer", fontSize:16 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {ideas.filter(i => i.priority === "inventario").length > 0 && (
            <div>
              <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:"#1a2a3a", marginBottom:8 }}>INVENTARIO</div>
              {ideas.filter(i => i.priority === "inventario").map(i => (
                <div key={i.id} style={{ background:"#040a14", padding:"10px 14px", marginBottom:3, borderRadius:3, border:"1px solid #080f1a", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:"#3a4a5a" }}>{i.text}</div>
                    <div style={{ fontSize:10, color:"#1a2a3a", marginTop:2 }}>{projects.find(p => p.id === i.project)?.name || i.project}</div>
                  </div>
                  <button onClick={() => deleteIdea(i.id)} style={{ background:"transparent", border:"none", color:"#223", cursor:"pointer", fontSize:14 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {ideas.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#1a2a3a", fontSize:14 }}>Sin ideas guardadas</div>}
        </div>
      )}

      {tab === "calendar" && (
        <div>
          <button onClick={() => setShowEvent(!showEvent)} style={{ marginBottom:14, background:"#a78bfa0a", border:"1px solid #a78bfa22", borderRadius:3, padding:"10px 16px", color:"#a78bfa88", cursor:"pointer", fontSize:11, fontFamily:"'Orbitron'", letterSpacing:2, width:"100%" }}>+ NUEVO EVENTO</button>
          {showEvent && (
            <div style={{ background:"#060d18", border:"1px solid #a78bfa18", borderRadius:4, padding:14, marginBottom:14, display:"flex", gap:8 }}>
              <input placeholder="Titulo" value={eventF.title} onChange={e => setEventF(p => ({ ...p, title:e.target.value }))} style={{ ...inputS, flex:2 }}/>
              <input type="date" value={eventF.date} onChange={e => setEventF(p => ({ ...p, date:e.target.value }))} style={inputS}/>
              <input type="time" value={eventF.time} onChange={e => setEventF(p => ({ ...p, time:e.target.value }))} style={{ ...inputS, width:110 }}/>
              <button onClick={addEvent} style={{ background:"#a78bfa22", border:"1px solid #a78bfa44", color:"#a78bfa", padding:"9px 14px", cursor:"pointer", fontWeight:700, borderRadius:3 }}>OK</button>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ background:"#060d18", border:"1px solid #0a1828", borderRadius:4, display:"flex", alignItems:"center", gap:16, padding:"14px 18px" }}>
                <div style={{ background:"#00d4ff08", border:"1px solid #00d4ff22", borderRadius:4, padding:"10px 14px", textAlign:"center", minWidth:56 }}>
                  <div style={{ fontFamily:"'Orbitron'", fontSize:20, fontWeight:700, color:"#00d4ff" }}>{new Date(ev.date + "T00:00").getDate()}</div>
                  <div style={{ fontSize:10, color:"#0a3050", textTransform:"uppercase" }}>{new Date(ev.date + "T00:00").toLocaleDateString("es-CO", { month:"short" })}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"#8899aa" }}>{ev.title}</div>
                  <div style={{ fontSize:12, color:"#2a3a4a", marginTop:4, fontFamily:"'Orbitron'" }}>{ev.time || "Todo el dia"}</div>
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={{ background:"transparent", border:"none", color:"#334", cursor:"pointer", fontSize:18 }}>×</button>
              </div>
            ))}
            {events.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#1a2a3a", fontSize:14 }}>Sin eventos</div>}
          </div>
        </div>
      )}

      {tab === "cycle" && (
        <div>
          {cycleState ? (
            <>
              <div style={{ background:"#060d18", border:`1px solid ${phaseColor}33`, borderRadius:4, padding:18, marginBottom:16, display:"flex", gap:24, alignItems:"center" }}>
                <Ring pct={cycleState.cycleDay/cycleState.cycleLen*100} size={100} color={phaseColor}>
                  <div style={{ fontFamily:"'Orbitron'", fontSize:26, fontWeight:700, color:phaseColor }}>{cycleState.cycleDay}</div>
                  <div style={{ fontSize:9, color:"#3a4a5a", marginTop:2 }}>dia {cycleState.cycleLen}</div>
                </Ring>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Orbitron'", fontSize:24, fontWeight:700, color:phaseColor, textTransform:"uppercase", letterSpacing:2 }}>{cycleState.phase}</div>
                  <div style={{ fontSize:12, color:"#8899aa", marginTop:8, lineHeight:1.5 }}>{PHASE_INFO[cycleState.phase].descripcion}</div>
                  <div style={{ fontSize:11, color:"#5a6a7a", marginTop:10 }}>
                    Energia esperada: <span style={{ color:phaseColor, fontWeight:700 }}>{PHASE_INFO[cycleState.phase].energia}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#5a6a7a", marginTop:4 }}>
                    Proximo periodo: <span style={{ color:phaseColor, fontWeight:700 }}>{cycleState.nextPeriod.toISOString().slice(0,10)}</span> (en {cycleState.daysUntil} dias)
                  </div>
                </div>
              </div>

              <CycleCalendar cycleState={cycleState} symptoms={symptoms}/>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div style={{ background:"#060d18", border:"1px solid #0a1828", borderRadius:4, padding:14 }}>
                  <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:"#00ff4488", marginBottom:10 }}>TAREAS IDEALES AHORA</div>
                  {PHASE_INFO[cycleState.phase].tareas.map((t,i) => (
                    <div key={i} style={{ fontSize:12, color:"#8899aa", padding:"4px 0" }}>- {t}</div>
                  ))}
                </div>
                <div style={{ background:"#060d18", border:"1px solid #0a1828", borderRadius:4, padding:14 }}>
                  <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:"#ff336688", marginBottom:10 }}>HISTORIAL SINTOMAS</div>
                  {symptoms.slice(0,5).map(s => (
                    <div key={s.id} style={{ fontSize:11, color:"#5a6a7a", padding:"4px 0", borderBottom:"1px solid #0a1828" }}>
                      {s.date} · {s.phase || "?"} · {s.mood || "?"}
                      {s.symptoms && s.symptoms.length > 0 && <span style={{ color:"#8899aa" }}> · {s.symptoms.join(", ")}</span>}
                    </div>
                  ))}
                  {symptoms.length === 0 && <div style={{ fontSize:11, color:"#1a2a3a" }}>Sin registros</div>}
                </div>
              </div>

              <button onClick={() => setShowPeriod(true)} style={{ background:"#ff336622", border:"1px solid #ff336644", color:"#ff3366", padding:"10px 20px", cursor:"pointer", fontSize:11, fontFamily:"'Orbitron'", letterSpacing:2, borderRadius:3, width:"100%" }}>
                REGISTRAR NUEVO PERIODO
              </button>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:40, color:"#5a6a7a" }}>
              <div style={{ fontSize:14, marginBottom:14 }}>Sin datos del ciclo</div>
              <button onClick={() => setShowPeriod(true)} style={{ background:"#ff336622", border:"1px solid #ff336644", color:"#ff3366", padding:"10px 20px", cursor:"pointer", fontSize:11, fontFamily:"'Orbitron'", letterSpacing:2, borderRadius:3 }}>
                REGISTRAR PRIMER PERIODO
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div>
          <div style={{ background:"#060d18", border:"1px solid #00ff4418", borderRadius:4, padding:14, marginBottom:16 }}>
            <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:"#00ff4488", marginBottom:6 }}>REVENUE ENGINE</div>
            <div style={{ fontSize:11, color:"#8899aa" }}>Fiverr + Etsy - sin cara, sin video - meta $10k USD/mes en 90 dias</div>
            <div style={{ fontSize:10, color:"#3a4a5a", marginTop:6 }}>Para agregar productos escribi al bot: idea de template notion para X</div>
          </div>

          {["idea", "investigando", "listo", "publicado", "vendiendo"].map(status => {
            const items = products.filter(p => p.status === status);
            if (items.length === 0) return null;
            const statusColors = {
              idea: "#5a6a7a", investigando: "#ffaa00",
              listo: "#00d4ff", publicado: "#a78bfa", vendiendo: "#00ff44"
            };
            return (
              <div key={status} style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Orbitron'", fontSize:10, letterSpacing:3, color:statusColors[status], marginBottom:8 }}>
                  {status.toUpperCase()} ({items.length})
                </div>
                {items.map(p => (
                  <div key={p.id} style={{ background:"#060d18", borderLeft:`3px solid ${statusColors[status]}`, padding:"10px 14px", marginBottom:4, borderRadius:3, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:"#8899aa" }}>{p.title}</div>
                      <div style={{ fontSize:10, color:"#2a3a4a", marginTop:3 }}>
                        {p.platform} {p.price ? `· $${p.price}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {products.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:"#1a2a3a", fontSize:14 }}>
              Sin productos. Escribe al bot: idea de template notion para CEOs
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop:28, textAlign:"center", fontFamily:"'Orbitron'", fontSize:8, letterSpacing:5, color:"#0a1828" }}>
        ALL SYSTEMS OPERATIONAL · SUPABASE REALTIME · CYCLE TRACKING
      </div>
    </div>
  );
}
