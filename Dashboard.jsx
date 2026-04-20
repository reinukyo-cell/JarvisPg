import { useState, useEffect, useRef } from "react";

// ── PROJECTS ─────────────────────────────────────────────────
const PROJECTS_INIT = [
  { id:"etsy", name:"ETSY STORE", icon:"E", color:"#00d4ff", priority:1, status:"ACTIVO",
    desc:"60+ productos digitales · 0 ventas · trafico organico",
    stats:{ products:60, visits:0, favorites:0, sales:0 },
    todos:[
      { id:1, text:"Optimizar titulos con keywords de alto volumen", done:false, p:"ALTA" },
      { id:2, text:"Agregar 13 tags a cada listing", done:false, p:"ALTA" },
      { id:3, text:"Configurar Pinterest para trafico externo", done:false, p:"ALTA" },
      { id:4, text:"Crear 5 pins por dia en Pinterest", done:false, p:"MEDIA" },
      { id:5, text:"Mejorar fotos de preview", done:false, p:"MEDIA" },
      { id:6, text:"Investigar productos trending", done:false, p:"MEDIA" },
    ]},
  { id:"martin", name:"BOT MARTIN", icon:"M", color:"#00ff88", priority:2, status:"EN PROGRESO", client:true,
    desc:"Tienda celulares mayorista · tipo CellBot/Helena",
    phase:"Construccion",
    todos:[
      { id:10, text:"Definir catalogo (marcas, modelos, precios)", done:false, p:"ALTA" },
      { id:11, text:"Construir flujo de conversacion", done:false, p:"ALTA" },
      { id:12, text:"Integrar catalogo al bot", done:false, p:"ALTA" },
      { id:13, text:"Testear con Martin", done:false, p:"MEDIA" },
      { id:14, text:"Entregar y cobrar", done:false, p:"MEDIA" },
    ]},
  { id:"rafael", name:"BOT RAFAEL", icon:"R", color:"#a78bfa", priority:3, status:"POR DEFINIR", client:true,
    desc:"Empresa transporte · buses y carros · tipo bot por definir",
    phase:"Idea",
    todos:[
      { id:20, text:"Reunion con Rafael para definir necesidades", done:false, p:"ALTA" },
      { id:21, text:"Definir tipo de bot", done:false, p:"ALTA" },
      { id:22, text:"Cotizar y acordar precio", done:false, p:"ALTA" },
    ]},
  { id:"pitonisa", name:"LA PITONISA", icon:"P", color:"#ff3366", priority:4, status:"ACTIVO",
    desc:"IG + TikTok + YouTube · servicios $50-100K · productos digitales",
    todos:[
      { id:30, text:"Publicar primer reel en Instagram", done:false, p:"ALTA" },
      { id:31, text:"Publicar primer TikTok", done:false, p:"ALTA" },
      { id:32, text:"Configurar link Nequi para cobrar", done:false, p:"ALTA" },
      { id:33, text:"5 guiones de reels sobre bloqueos financieros", done:false, p:"MEDIA" },
      { id:34, text:"Subir primer video a YouTube", done:false, p:"MEDIA" },
    ]},
  { id:"fiverr", name:"FIVERR", icon:"F", color:"#ffaa00", priority:5, status:"SETUP",
    desc:"Publicar primer gig de agentes IA",
    phase:"Crear cuenta",
    todos:[
      { id:40, text:"Crear cuenta en Fiverr", done:false, p:"ALTA" },
      { id:41, text:"Completar perfil profesional", done:false, p:"ALTA" },
      { id:42, text:"Investigar competencia AI chatbots", done:false, p:"MEDIA" },
      { id:43, text:"Publicar primer gig", done:false, p:"ALTA" },
    ]},
];

const GOAL = 2000000;
const PHASES = ["Idea","Flujo","Construccion","Test","Entrega"];

// ── CIRCULAR GAUGE ───────────────────────────────────────────
function Gauge({ value, max, size=90, color="#00d4ff", label, sublabel }) {
  const pct = Math.min(value/max*100, 100);
  const r = (size-10)/2;
  const circ = 2*Math.PI*r;
  const offset = circ - (pct/100)*circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0a1520" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease", filter:`drop-shadow(0 0 6px ${color}66)` }} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"33"} strokeWidth={1} />
      </svg>
      <div style={{ marginTop:-size+10, height:size-10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:size/4.5, fontWeight:700, color, textShadow:`0 0 10px ${color}44` }}>{Math.round(pct)}%</div>
        {label && <div style={{ fontSize:8, color:color+"99", letterSpacing:2, marginTop:2 }}>{label}</div>}
      </div>
      {sublabel && <div style={{ fontSize:9, color:"#334455", marginTop:4 }}>{sublabel}</div>}
    </div>
  );
}

// ── HUD BORDER ───────────────────────────────────────────────
function HudPanel({ children, title, color="#00d4ff", span=1 }) {
  return (
    <div style={{
      background:"linear-gradient(180deg, #040810 0%, #060c14 100%)",
      border:`1px solid ${color}22`,
      borderRadius:2,
      padding:"14px 16px",
      position:"relative",
      gridColumn:`span ${span}`,
      overflow:"hidden",
    }}>
      {/* Corner accents */}
      <div style={{ position:"absolute",top:0,left:0,width:20,height:1,background:color }} />
      <div style={{ position:"absolute",top:0,left:0,width:1,height:20,background:color }} />
      <div style={{ position:"absolute",top:0,right:0,width:20,height:1,background:color }} />
      <div style={{ position:"absolute",top:0,right:0,width:1,height:20,background:color }} />
      <div style={{ position:"absolute",bottom:0,left:0,width:20,height:1,background:color+"66" }} />
      <div style={{ position:"absolute",bottom:0,left:0,width:1,height:20,background:color+"66" }} />
      <div style={{ position:"absolute",bottom:0,right:0,width:20,height:1,background:color+"66" }} />
      <div style={{ position:"absolute",bottom:0,right:0,width:1,height:20,background:color+"66" }} />
      {/* Scan line */}
      <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg, transparent, ${color}44, transparent)`,animation:"scanline 4s ease-in-out infinite" }} />
      {title && <div style={{ fontFamily:"'Orbitron',monospace", fontSize:9, letterSpacing:4, color:color+"aa", marginBottom:12, textTransform:"uppercase" }}>{title}</div>}
      {children}
    </div>
  );
}

// ── HUD BAR ──────────────────────────────────────────────────
function HudBar({ pct, color="#00d4ff", h=4 }) {
  return (
    <div style={{ background:"#0a1520", borderRadius:1, height:h, width:"100%", position:"relative", overflow:"hidden" }}>
      <div style={{ background:`linear-gradient(90deg, ${color}88, ${color})`, height:"100%", width:`${Math.min(pct,100)}%`, transition:"width 0.8s ease", boxShadow:`0 0 8px ${color}44` }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:`repeating-linear-gradient(90deg, transparent, transparent 4px, #040810 4px, #040810 5px)`, opacity:0.3 }} />
    </div>
  );
}

// ── TODO ITEM ────────────────────────────────────────────────
function Todo({ todo, onToggle, color }) {
  const pc = { ALTA:"#ff3366", MEDIA:"#ffaa00", BAJA:"#334455" };
  return (
    <div onClick={onToggle} style={{
      display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer",
      padding:"7px 10px", background:todo.done?"#001a0d":"#040810",
      border:`1px solid ${todo.done?"#00ff4422":"#0a1520"}`,
      transition:"all 0.2s",
    }}>
      <div style={{
        width:14, height:14, border:`1px solid ${todo.done?"#00ff44":pc[todo.p]||"#224"}`,
        background:todo.done?"#00ff44":"transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:9, color:"#000", fontWeight:700, flexShrink:0, marginTop:1,
      }}>{todo.done?"✓":""}</div>
      <div>
        <div style={{ fontSize:11, color:todo.done?"#336":"#8899aa", textDecoration:todo.done?"line-through":"none", lineHeight:1.4 }}>{todo.text}</div>
        <div style={{ fontSize:8, color:"#223", marginTop:2 }}>{todo.p}</div>
      </div>
    </div>
  );
}

// ── PROJECT PANEL ────────────────────────────────────────────
function ProjectPanel({ project, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [adding, setAdding] = useState(false);

  const done = project.todos.filter(t=>t.done).length;
  const total = project.todos.length;
  const pct = total>0 ? Math.round(done/total*100) : 0;
  const c = project.color;

  const toggle = (id) => onUpdate({...project, todos:project.todos.map(t=>t.id===id?{...t,done:!t.done}:t)});
  const add = () => {
    if(!newTodo.trim()) return;
    onUpdate({...project, todos:[...project.todos,{id:Date.now(),text:newTodo,done:false,p:"MEDIA"}]});
    setNewTodo(""); setAdding(false);
  };

  return (
    <div style={{
      background:"#040810", border:`1px solid ${open?c+"44":"#0a1520"}`,
      transition:"border-color 0.3s", overflow:"hidden",
    }}>
      {/* Header */}
      <div onClick={()=>setOpen(!open)} style={{
        padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12,
        background:open?`linear-gradient(90deg, ${c}08, transparent)`:"transparent",
        borderBottom:open?`1px solid ${c}11`:"none",
      }}>
        <div style={{
          width:32, height:32, border:`1px solid ${c}66`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, color:c,
          textShadow:`0 0 8px ${c}44`, position:"relative",
        }}>
          {project.icon}
          <div style={{ position:"absolute", inset:-1, border:`1px solid ${c}22`, transform:"rotate(45deg)" }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'Orbitron',monospace", fontSize:11, color:"#aabbcc", letterSpacing:2 }}>{project.name}</span>
            {project.client && <span style={{ fontSize:7, background:"#ffaa0018", color:"#ffaa00", border:"1px solid #ffaa0033", padding:"1px 5px", letterSpacing:1, fontFamily:"'Orbitron',monospace" }}>CLIENT</span>}
            <span style={{ fontSize:8, color:c+"88", fontFamily:"monospace" }}>[{project.status}]</span>
          </div>
          <div style={{ fontSize:9, color:"#223344", marginTop:2 }}>{project.desc}</div>
        </div>
        <div style={{ width:50, textAlign:"center" }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14, fontWeight:700, color:c, textShadow:`0 0 8px ${c}33` }}>{pct}%</div>
          <div style={{ fontSize:8, color:"#223" }}>{done}/{total}</div>
        </div>
        <HudBar pct={pct} color={c} h={3} />
      </div>

      {open && (
        <div style={{ padding:"10px 14px 14px" }}>
          {/* Phase */}
          {project.phase && (
            <div style={{ display:"flex", gap:2, marginBottom:12, alignItems:"center" }}>
              {PHASES.map((ph,i) => {
                const pi=PHASES.indexOf(project.phase);
                return (
                  <div key={ph} style={{
                    flex:1, height:3,
                    background: i<pi ? c+"66" : i===pi ? c : "#0a1520",
                    boxShadow: i===pi ? `0 0 6px ${c}44` : "none",
                  }} />
                );
              })}
              <span style={{ fontSize:8, color:c+"99", fontFamily:"'Orbitron',monospace", marginLeft:8, whiteSpace:"nowrap", letterSpacing:1 }}>{project.phase}</span>
            </div>
          )}

          {/* Etsy stats */}
          {project.id==="etsy" && (
            <div style={{ display:"flex", gap:16, marginBottom:12, padding:"10px", background:"#060c14", border:"1px solid #0a1520" }}>
              {[{l:"PROD",v:project.stats.products},{l:"VISITS",v:project.stats.visits},{l:"FAV",v:project.stats.favorites},{l:"SALES",v:project.stats.sales,c2:project.stats.sales>0?"#00ff44":"#ff3366"}].map(s=>(
                <div key={s.l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:16, fontWeight:700, color:s.c2||c, textShadow:`0 0 6px ${(s.c2||c)}33` }}>{s.v}</div>
                  <div style={{ fontSize:7, color:"#223", letterSpacing:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Todos */}
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {project.todos.filter(t=>!t.done).map(t=><Todo key={t.id} todo={t} onToggle={()=>toggle(t.id)} color={c} />)}
            {project.todos.some(t=>t.done) && (
              <>
                <div style={{ fontSize:7, color:"#112", fontFamily:"'Orbitron',monospace", letterSpacing:3, marginTop:6, marginBottom:2 }}>COMPLETED</div>
                {project.todos.filter(t=>t.done).map(t=><Todo key={t.id} todo={t} onToggle={()=>toggle(t.id)} color={c} />)}
              </>
            )}
          </div>

          {adding ? (
            <div style={{ display:"flex", gap:4, marginTop:8 }}>
              <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} autoFocus
                placeholder="Nueva tarea..." style={{ flex:1, background:"#060c14", border:`1px solid ${c}22`, padding:"7px 10px", color:"#8899aa", fontSize:11, outline:"none", fontFamily:"inherit" }} />
              <button onClick={add} style={{ background:c+"22", border:`1px solid ${c}44`, color:c, padding:"7px 12px", cursor:"pointer", fontWeight:700, fontSize:11 }}>+</button>
              <button onClick={()=>{setAdding(false);setNewTodo("")}} style={{ background:"#0a1520", border:"none", color:"#334", padding:"7px 10px", cursor:"pointer" }}>x</button>
            </div>
          ) : (
            <button onClick={()=>setAdding(true)} style={{ marginTop:8, width:"100%", background:"transparent", border:`1px dashed ${c}15`, padding:6, color:"#1a2a3a", cursor:"pointer", fontSize:10, fontFamily:"'Orbitron',monospace", letterSpacing:2 }}>+ ADD TASK</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN DASHBOARD ───────────────────────────────────────────
export default function JarvisDashboard() {
  const [projects, setProjects] = useState(PROJECTS_INIT);
  const [rev, setRev] = useState({ total:0, weekly:0, brands:{} });
  const [energy, setEnergy] = useState(7);
  const [ideas, setIdeas] = useState([]);
  const [events, setEvents] = useState([
    { id:1, title:"Reunion Rafael — transporte", date:"2026-04-28", time:"10:00" },
    { id:2, title:"Reunion Martin — celulares", date:"2026-04-28", time:"15:00" },
  ]);
  const [tab, setTab] = useState("projects");
  const [showSale, setShowSale] = useState(false);
  const [showIdea, setShowIdea] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [saleF, setSaleF] = useState({ amount:"", brand:"etsy" });
  const [ideaF, setIdeaF] = useState({ text:"", project:"etsy", priority:"inventario" });
  const [eventF, setEventF] = useState({ title:"", date:"", time:"" });
  const [clock, setClock] = useState(new Date());

  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return ()=>clearInterval(t); },[]);

  const pct = Math.round(rev.total/GOAL*100);
  const totalPending = projects.reduce((a,p)=>a+p.todos.filter(t=>!t.done).length,0);
  const totalDone = projects.reduce((a,p)=>a+p.todos.filter(t=>t.done).length,0);

  const upProject = u => setProjects(prev=>prev.map(p=>p.id===u.id?u:p));
  const addSale = () => {
    const a=parseInt(saleF.amount.replace(/\D/g,"")); if(!a) return;
    setRev(p=>({total:p.total+a, weekly:p.weekly+a, brands:{...p.brands,[saleF.brand]:(p.brands[saleF.brand]||0)+a}}));
    setSaleF({amount:"",brand:"etsy"}); setShowSale(false);
  };
  const addIdea = () => {
    if(!ideaF.text) return;
    setIdeas(p=>[...p,{...ideaF,id:Date.now()}]);
    setIdeaF({text:"",project:"etsy",priority:"inventario"}); setShowIdea(false);
  };
  const addEvent = () => {
    if(!eventF.title||!eventF.date) return;
    setEvents(p=>[...p,{...eventF,id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)));
    setEventF({title:"",date:"",time:""}); setShowEvent(false);
  };

  const inputStyle = { background:"#060c14", border:"1px solid #0a2030", padding:"7px 10px", color:"#6688aa", fontSize:11, outline:"none", fontFamily:"inherit" };
  const selectStyle = { ...inputStyle, color:"#4466aa" };
  const btnStyle = (c) => ({ background:c+"22", border:`1px solid ${c}44`, color:c, padding:"7px 14px", cursor:"pointer", fontWeight:700, fontSize:11, fontFamily:"'Orbitron',monospace" });

  return (
    <div style={{ minHeight:"100vh", background:"#020508", color:"#8899aa", fontFamily:"'JetBrains Mono','Fira Code',monospace", padding:"16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Orbitron:wght@400;500;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:#0a2030}
        input::placeholder{color:#1a2a3a!important}
        select option{background:#060c14;color:#4466aa}
        @keyframes scanline{0%,100%{opacity:0}50%{opacity:1}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, padding:"0 4px" }}>
        <div>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:6, color:"#0a2030", marginBottom:4 }}>AGENT HUB // COMMAND CENTER</div>
          <h1 style={{ fontFamily:"'Orbitron',monospace", fontSize:26, fontWeight:900, color:"#00d4ff", letterSpacing:3, lineHeight:1, textShadow:"0 0 20px #00d4ff33, 0 0 40px #00d4ff11" }}>
            J.A.R.V.I.S
          </h1>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, color:"#0a3050", letterSpacing:3, marginTop:4 }}>JUST A RATHER VERY INTELLIGENT SYSTEM</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:22, fontWeight:700, color:"#00d4ff", textShadow:"0 0 10px #00d4ff33", letterSpacing:2 }}>
            {clock.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>
          <div style={{ fontSize:9, color:"#0a3050", marginTop:2 }}>
            {clock.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase()}
          </div>
          <div style={{ display:"flex", gap:2, marginTop:6, justifyContent:"flex-end" }}>
            {[...Array(10)].map((_,i)=>(
              <div key={i} onClick={()=>setEnergy(i+1)} style={{
                width:6, height:16, cursor:"pointer",
                background:i<energy?(energy>=8?"#00ff44":energy>=5?"#ffaa00":"#ff3366"):"#0a1520",
                boxShadow:i<energy?`0 0 4px ${energy>=8?"#00ff4444":energy>=5?"#ffaa0044":"#ff336644"}`:"none",
              }} />
            ))}
            <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:energy>=8?"#00ff44":energy>=5?"#ffaa00":"#ff3366", marginLeft:4 }}>{energy}</span>
          </div>
        </div>
      </div>

      {/* ── TOP METRICS ─────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
        <HudPanel title="REVENUE" color="#00d4ff">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Gauge value={rev.total} max={GOAL} size={70} color="#00d4ff" label="META" />
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:16, fontWeight:700, color:rev.total>0?"#00ff44":"#223344", textShadow:rev.total>0?"0 0 8px #00ff4433":"none" }}>
                ${rev.total.toLocaleString("es-CO")}
              </div>
              <div style={{ fontSize:8, color:"#1a2a3a" }}>META ${GOAL.toLocaleString("es-CO")}</div>
              <button onClick={()=>setShowSale(!showSale)} style={{ marginTop:4, background:"#00d4ff11", border:"1px solid #00d4ff22", color:"#00d4ff88", padding:"2px 8px", cursor:"pointer", fontSize:8, fontFamily:"'Orbitron',monospace" }}>+ SALE</button>
            </div>
          </div>
        </HudPanel>

        <HudPanel title="TASKS" color="#ffaa00">
          <div style={{ display:"flex", gap:16, alignItems:"flex-end" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:24, fontWeight:700, color:"#ffaa00", textShadow:"0 0 8px #ffaa0033" }}>{totalPending}</div>
              <div style={{ fontSize:7, color:"#332200", letterSpacing:2 }}>PENDING</div>
            </div>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:24, fontWeight:700, color:"#00ff44", textShadow:"0 0 8px #00ff4433" }}>{totalDone}</div>
              <div style={{ fontSize:7, color:"#003300", letterSpacing:2 }}>DONE</div>
            </div>
          </div>
        </HudPanel>

        <HudPanel title="IDEAS" color="#a78bfa">
          <div style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color:"#a78bfa" }}>{ideas.filter(i=>i.priority==="pronto").length}</div>
              <div style={{ fontSize:7, color:"#221133", letterSpacing:2 }}>PRONTO</div>
            </div>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color:"#334" }}>{ideas.filter(i=>i.priority==="inventario").length}</div>
              <div style={{ fontSize:7, color:"#112", letterSpacing:2 }}>STORED</div>
            </div>
          </div>
          <button onClick={()=>setShowIdea(!showIdea)} style={{ marginTop:6, background:"#a78bfa11", border:"1px solid #a78bfa22", color:"#a78bfa88", padding:"2px 8px", cursor:"pointer", fontSize:8, fontFamily:"'Orbitron',monospace" }}>+ IDEA</button>
        </HudPanel>

        <HudPanel title="SCHEDULE" color="#00d4ff">
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color:"#00d4ff" }}>{events.length}</div>
          <div style={{ fontSize:7, color:"#0a2030", letterSpacing:2 }}>EVENTS</div>
          {events.slice(0,2).map(ev=>(
            <div key={ev.id} style={{ fontSize:9, color:"#335", marginTop:4 }}>
              {ev.time} · {ev.title.slice(0,18)}
            </div>
          ))}
          <button onClick={()=>setShowEvent(!showEvent)} style={{ marginTop:4, background:"#00d4ff11", border:"1px solid #00d4ff22", color:"#00d4ff88", padding:"2px 8px", cursor:"pointer", fontSize:8, fontFamily:"'Orbitron',monospace" }}>+ EVENT</button>
        </HudPanel>

        <HudPanel title="SYSTEM" color="#00ff44">
          <div style={{ fontSize:9, color:"#335", lineHeight:1.8 }}>
            <div>PROJECTS <span style={{ color:"#00ff44" }}>{projects.length}</span></div>
            <div>CLIENTS <span style={{ color:"#ffaa00" }}>{projects.filter(p=>p.client).length}</span></div>
            <div>DAYS NO SALE <span style={{ color:rev.total===0?"#ff3366":"#00ff44" }}>{rev.total===0?"--":"0"}</span></div>
            <div>ENERGY <span style={{ color:energy>=7?"#00ff44":energy>=4?"#ffaa00":"#ff3366" }}>{energy}/10</span></div>
          </div>
        </HudPanel>
      </div>

      {/* Quick add forms */}
      {showSale && (
        <div style={{ background:"#040810", border:"1px solid #00d4ff22", padding:10, marginBottom:8, display:"flex", gap:6 }}>
          <input placeholder="AMOUNT COP" value={saleF.amount} onChange={e=>setSaleF(p=>({...p,amount:e.target.value}))} style={inputStyle} />
          <select value={saleF.brand} onChange={e=>setSaleF(p=>({...p,brand:e.target.value}))} style={selectStyle}>
            <option value="etsy">Etsy</option><option value="martin">Martin</option><option value="rafael">Rafael</option>
            <option value="pitonisa">Pitonisa</option><option value="fiverr">Fiverr</option>
          </select>
          <button onClick={addSale} style={btnStyle("#00d4ff")}>OK</button>
        </div>
      )}
      {showIdea && (
        <div style={{ background:"#040810", border:"1px solid #a78bfa22", padding:10, marginBottom:8, display:"flex", gap:6 }}>
          <input placeholder="DESCRIBE IDEA..." value={ideaF.text} onChange={e=>setIdeaF(p=>({...p,text:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addIdea()} style={{...inputStyle,flex:2}} />
          <select value={ideaF.project} onChange={e=>setIdeaF(p=>({...p,project:e.target.value}))} style={selectStyle}>
            <option value="etsy">Etsy</option><option value="martin">Martin</option><option value="rafael">Rafael</option>
            <option value="pitonisa">Pitonisa</option><option value="fiverr">Fiverr</option>
          </select>
          <select value={ideaF.priority} onChange={e=>setIdeaF(p=>({...p,priority:e.target.value}))} style={selectStyle}>
            <option value="pronto">PRONTO</option><option value="inventario">STORE</option>
          </select>
          <button onClick={addIdea} style={btnStyle("#a78bfa")}>OK</button>
        </div>
      )}
      {showEvent && (
        <div style={{ background:"#040810", border:"1px solid #00d4ff22", padding:10, marginBottom:8, display:"flex", gap:6 }}>
          <input placeholder="TITLE" value={eventF.title} onChange={e=>setEventF(p=>({...p,title:e.target.value}))} style={{...inputStyle,flex:2}} />
          <input type="date" value={eventF.date} onChange={e=>setEventF(p=>({...p,date:e.target.value}))} style={inputStyle} />
          <input type="time" value={eventF.time} onChange={e=>setEventF(p=>({...p,time:e.target.value}))} style={{...inputStyle,width:90}} />
          <button onClick={addEvent} style={btnStyle("#00d4ff")}>OK</button>
        </div>
      )}

      {/* ── TABS ────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:0, marginBottom:12 }}>
        {[["projects","PROJECTS"],["calendar","SCHEDULE"],["ideas","IDEAS"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1, padding:"8px 0", cursor:"pointer", border:"none",
            fontFamily:"'Orbitron',monospace", fontSize:9, letterSpacing:3,
            background:tab===k?"#00d4ff0a":"transparent",
            color:tab===k?"#00d4ff":"#1a2a3a",
            borderBottom:tab===k?"2px solid #00d4ff":"2px solid #0a1520",
            transition:"all 0.2s",
          }}>{l}</button>
        ))}
      </div>

      {/* ── TAB: PROJECTS ───────────────────────────────────── */}
      {tab==="projects" && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {projects.sort((a,b)=>a.priority-b.priority).map(p=>(
            <ProjectPanel key={p.id} project={p} onUpdate={upProject} />
          ))}
        </div>
      )}

      {/* ── TAB: CALENDAR ───────────────────────────────────── */}
      {tab==="calendar" && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {events.length===0 ? (
            <div style={{ textAlign:"center", padding:40, color:"#112" }}>NO EVENTS SCHEDULED</div>
          ) : events.map(ev=>(
            <div key={ev.id} style={{
              background:"#040810", border:"1px solid #00d4ff15",
              display:"flex", alignItems:"center", gap:14, padding:"10px 14px",
            }}>
              <div style={{ background:"#00d4ff0a", border:"1px solid #00d4ff22", padding:"8px 12px", textAlign:"center", minWidth:50 }}>
                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:16, fontWeight:700, color:"#00d4ff" }}>
                  {new Date(ev.date+"T00:00").getDate()}
                </div>
                <div style={{ fontSize:8, color:"#0a3050", textTransform:"uppercase" }}>
                  {new Date(ev.date+"T00:00").toLocaleDateString("es-CO",{month:"short"})}
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, color:"#8899aa" }}>{ev.title}</div>
                <div style={{ fontSize:9, color:"#223", marginTop:2, fontFamily:"'Orbitron',monospace" }}>{ev.time||"ALL DAY"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: IDEAS ──────────────────────────────────────── */}
      {tab==="ideas" && (
        <div>
          {ideas.filter(i=>i.priority==="pronto").length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, letterSpacing:3, color:"#a78bfa88", marginBottom:8 }}>WORK SOON</div>
              {ideas.filter(i=>i.priority==="pronto").map(i=>(
                <div key={i.id} style={{ background:"#040810", borderLeft:`2px solid #a78bfa`, padding:"8px 12px", marginBottom:4, border:"1px solid #0a1520" }}>
                  <div style={{ fontSize:11, color:"#8899aa" }}>{i.text}</div>
                  <div style={{ fontSize:8, color:"#223", marginTop:2 }}>{i.project}</div>
                </div>
              ))}
            </div>
          )}
          {ideas.filter(i=>i.priority==="inventario").length>0 && (
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, letterSpacing:3, color:"#223", marginBottom:8 }}>STORED</div>
              {ideas.filter(i=>i.priority==="inventario").map(i=>(
                <div key={i.id} style={{ background:"#030508", padding:"7px 10px", marginBottom:3, border:"1px solid #080d14" }}>
                  <div style={{ fontSize:10, color:"#445" }}>{i.text}</div>
                  <div style={{ fontSize:8, color:"#112", marginTop:2 }}>{i.project}</div>
                </div>
              ))}
            </div>
          )}
          {ideas.length===0 && <div style={{ textAlign:"center", padding:40, color:"#112" }}>NO IDEAS STORED</div>}
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div style={{ marginTop:20, textAlign:"center", fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:4, color:"#0a1520" }}>
        AGENT HUB v9 // JARVIS INTERFACE // ALL SYSTEMS OPERATIONAL
      </div>
    </div>
  );
}
