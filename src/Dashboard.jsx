import { useState, useEffect } from "react";

const GOAL = 2000000;
const STORAGE_KEY = "jarvis_data_v1";

const INITIAL_PROJECTS = [
  { id:"helena", name:"Helena Store", pct:90, status:"Casi listo", color:"#00d4ff", client:true,
    desc:"Bot tienda celulares — CellBot",
    todos:[
      {id:1,text:"Pruebas finales con cliente",done:false,p:"alta"},
      {id:2,text:"Entregar y cobrar",done:false,p:"alta"},
    ]},
  { id:"martin", name:"Bot Martin", pct:40, status:"En progreso", color:"#00ff88", client:true,
    desc:"Celulares mayorista — basado en Helena",
    todos:[
      {id:10,text:"Adaptar flujo de Helena para mayorista",done:true,p:"alta"},
      {id:11,text:"Catalogo de productos mayorista",done:false,p:"alta"},
      {id:12,text:"Integrar precios por volumen",done:false,p:"alta"},
      {id:13,text:"Testear con Martin",done:false,p:"media"},
      {id:14,text:"Entregar y cobrar",done:false,p:"media"},
    ]},
  { id:"sonia", name:"Bot Sonia", pct:20, status:"Construccion", color:"#ff9500", client:true,
    desc:"Empresa de construccion",
    todos:[
      {id:50,text:"Definir servicios y flujo del bot",done:true,p:"alta"},
      {id:51,text:"Construir estructura de conversacion",done:false,p:"alta"},
      {id:52,text:"Integrar cotizaciones",done:false,p:"alta"},
      {id:53,text:"Testear con Sonia",done:false,p:"media"},
      {id:54,text:"Entregar y cobrar",done:false,p:"media"},
    ]},
  { id:"rafael", name:"Bot Rafael", pct:5, status:"Por definir", color:"#a78bfa", client:true,
    desc:"Empresa transporte — buses y carros",
    todos:[
      {id:20,text:"Reunion 28 abril 10am",done:false,p:"alta"},
      {id:21,text:"Definir tipo de bot",done:false,p:"alta"},
      {id:22,text:"Cotizar y acordar precio",done:false,p:"alta"},
    ]},
  { id:"etsy", name:"Etsy Store", pct:10, status:"Activo", color:"#f56400",
    desc:"60+ productos digitales — 0 ventas",
    stats:{products:60,visits:0,favorites:0,sales:0},
    todos:[
      {id:1,text:"Optimizar titulos con keywords",done:true,p:"alta"},
      {id:2,text:"Agregar 13 tags a listings",done:false,p:"alta"},
      {id:3,text:"Configurar Pinterest",done:false,p:"alta"},
      {id:4,text:"5 pins diarios en Pinterest",done:false,p:"media"},
      {id:5,text:"Mejorar fotos de preview",done:false,p:"media"},
    ]},
  { id:"pitonisa", name:"La Pitonisa", pct:5, status:"Inicio", color:"#ff3366",
    desc:"IG + TikTok + YouTube — tarot $50-100K",
    todos:[
      {id:30,text:"Primer reel en Instagram",done:false,p:"alta"},
      {id:31,text:"Primer TikTok",done:false,p:"alta"},
      {id:32,text:"Link de pago Nequi",done:false,p:"alta"},
      {id:33,text:"5 guiones de reels",done:false,p:"media"},
    ]},
  { id:"fiverr", name:"Fiverr", pct:0, status:"Setup", color:"#16a34a",
    desc:"Primer gig de agentes IA",
    todos:[
      {id:40,text:"Crear cuenta",done:false,p:"alta"},
      {id:41,text:"Perfil profesional",done:false,p:"alta"},
      {id:42,text:"Investigar competencia",done:false,p:"media"},
      {id:43,text:"Publicar primer gig",done:false,p:"alta"},
    ]},
];

const PC = {alta:"#ff3366",media:"#ffaa00",baja:"#334"};

// Calculate pct from todos dynamically
function calcPct(todos){
  if(!todos || todos.length===0) return 0;
  const done = todos.filter(t=>t.done).length;
  return Math.round(done/todos.length*100);
}

function Ring({pct,size=110,stroke=5,color="#00d4ff",children}){
  const r=(size-stroke*2)/2;const c=2*Math.PI*r;const off=c-(pct/100)*c;
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0a1828" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke-1}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1s",filter:`drop-shadow(0 0 8px ${color}55)`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {children}
      </div>
    </div>
  );
}

function Bar({pct,color="#00d4ff",h=6}){
  return(
    <div style={{background:"#0a1828",borderRadius:3,height:h,width:"100%",overflow:"hidden"}}>
      <div style={{background:color,height:"100%",width:`${Math.min(pct,100)}%`,borderRadius:3,
        transition:"width 0.8s",boxShadow:`0 0 10px ${color}44`}}/>
    </div>
  );
}

function Panel({children,title,color="#00d4ff",span=1}){
  return(
    <div style={{
      background:"linear-gradient(180deg,#060d18,#040a14)",
      border:`1px solid ${color}18`,borderRadius:4,padding:"18px 20px",
      gridColumn:`span ${span}`,position:"relative",overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:0,left:0,width:24,height:1,background:color}}/>
      <div style={{position:"absolute",top:0,left:0,width:1,height:24,background:color}}/>
      <div style={{position:"absolute",top:0,right:0,width:24,height:1,background:color}}/>
      <div style={{position:"absolute",top:0,right:0,width:1,height:24,background:color}}/>
      {title&&<div style={{fontFamily:"'Orbitron',monospace",fontSize:10,letterSpacing:4,color:color+"99",marginBottom:14}}>{title}</div>}
      {children}
    </div>
  );
}

function ProjectRow({project,onUpdate}){
  const [open,setOpen]=useState(false);
  const [newTodo,setNewTodo]=useState("");
  const [adding,setAdding]=useState(false);
  const c=project.color;
  const done=project.todos.filter(t=>t.done).length;
  const total=project.todos.length;
  const pct = calcPct(project.todos);  // DYNAMIC from todos!

  const toggle=id=>onUpdate({...project,todos:project.todos.map(t=>t.id===id?{...t,done:!t.done}:t)});
  const add=()=>{
    if(!newTodo.trim())return;
    onUpdate({...project,todos:[...project.todos,{id:Date.now(),text:newTodo,done:false,p:"media"}]});
    setNewTodo("");setAdding(false);
  };
  const del=id=>onUpdate({...project,todos:project.todos.filter(t=>t.id!==id)});

  return(
    <div style={{background:"#060d18",border:`1px solid ${open?c+"33":"#0a1828"}`,borderRadius:4,overflow:"hidden",transition:"border-color 0.3s"}}>
      <div onClick={()=>setOpen(!open)} style={{
        padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,
        background:open?`linear-gradient(90deg,${c}06,transparent)`:"transparent",
      }}>
        <div style={{width:40,height:40,borderRadius:6,background:c+"12",border:`1px solid ${c}33`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"'Orbitron'",fontSize:16,fontWeight:700,color:c,flexShrink:0,
        }}>{project.name[0]}</div>

        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontFamily:"'Orbitron'",fontSize:14,color:"#c0d0e0",letterSpacing:1}}>{project.name}</span>
            {project.client&&<span style={{fontSize:8,background:"#ffaa0012",color:"#ffaa00",border:"1px solid #ffaa0033",padding:"2px 6px",borderRadius:2,fontFamily:"'Orbitron'",letterSpacing:1}}>CLIENT</span>}
            <span style={{fontSize:10,color:c+"88",fontFamily:"monospace"}}>{project.status}</span>
          </div>
          <div style={{fontSize:12,color:"#3a4a5a"}}>{project.desc}</div>
        </div>

        <div style={{width:130,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontFamily:"'Orbitron'",fontSize:18,fontWeight:700,color:c,textShadow:`0 0 12px ${c}33`}}>{pct}%</span>
            <span style={{fontSize:10,color:"#2a3a4a",alignSelf:"flex-end"}}>{done}/{total}</span>
          </div>
          <Bar pct={pct} color={c}/>
        </div>
      </div>

      {open&&(
        <div style={{padding:"4px 18px 18px"}}>
          {project.stats&&(
            <div style={{display:"flex",gap:24,padding:"12px 16px",background:"#040a14",border:"1px solid #0a1828",borderRadius:4,marginBottom:12}}>
              {[{l:"Productos",v:project.stats.products,c:"#f56400"},
                {l:"Visitas",v:project.stats.visits,c:"#f97316"},
                {l:"Favoritos",v:project.stats.favorites,c:"#fb923c"},
                {l:"Ventas",v:project.stats.sales,c:project.stats.sales>0?"#00ff44":"#ff3366"}
              ].map(s=>(
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Orbitron'",fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:"#2a3a4a",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {project.todos.filter(t=>!t.done).map(t=>(
              <div key={t.id} style={{
                display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                background:"#040a14",border:"1px solid #0a1828",borderRadius:3,
              }}>
                <div onClick={()=>toggle(t.id)} style={{
                  width:20,height:20,borderRadius:3,border:`2px solid ${PC[t.p]}`,
                  cursor:"pointer",flexShrink:0,
                }}/>
                <span style={{fontSize:13,color:"#8899aa",lineHeight:1.4,flex:1}}>{t.text}</span>
                <span style={{fontSize:9,color:"#1a2a3a",flexShrink:0}}>{t.p}</span>
                <button onClick={()=>del(t.id)} style={{background:"transparent",border:"none",color:"#334",cursor:"pointer",fontSize:14,padding:"0 4px"}}>×</button>
              </div>
            ))}
            {project.todos.filter(t=>t.done).length>0&&(
              <>
                <div style={{fontSize:9,color:"#112233",fontFamily:"'Orbitron'",letterSpacing:3,marginTop:8,marginBottom:2}}>COMPLETADO</div>
                {project.todos.filter(t=>t.done).map(t=>(
                  <div key={t.id} style={{
                    display:"flex",alignItems:"center",gap:12,padding:"8px 12px",
                    background:"#030810",border:"1px solid #080f1a",borderRadius:3,
                  }}>
                    <div onClick={()=>toggle(t.id)} style={{
                      width:20,height:20,borderRadius:3,background:"#00ff44",border:"2px solid #00ff44",
                      cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:12,color:"#000",fontWeight:700,flexShrink:0}}>✓</div>
                    <span style={{fontSize:13,color:"#2a3a4a",textDecoration:"line-through",flex:1}}>{t.text}</span>
                    <button onClick={()=>del(t.id)} style={{background:"transparent",border:"none",color:"#334",cursor:"pointer",fontSize:14,padding:"0 4px"}}>×</button>
                  </div>
                ))}
              </>
            )}
          </div>

          {adding?(
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} autoFocus
                placeholder="Nueva tarea..."
                style={{flex:1,background:"#040a14",border:`1px solid ${c}22`,borderRadius:3,padding:"9px 12px",color:"#8899aa",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={add} style={{background:c+"22",border:`1px solid ${c}44`,color:c,padding:"9px 14px",cursor:"pointer",fontWeight:700,fontSize:13,borderRadius:3}}>+</button>
            </div>
          ):(
            <button onClick={()=>setAdding(true)} style={{marginTop:10,width:"100%",background:"transparent",border:`1px dashed ${c}15`,borderRadius:3,padding:8,color:"#1a2a3a",cursor:"pointer",fontSize:11,fontFamily:"'Orbitron'",letterSpacing:2}}>+ TAREA</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard(){
  // Load from localStorage or use initial data
  const loadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  };

  const savedData = loadData();

  const [projects,setProjects] = useState(savedData?.projects || INITIAL_PROJECTS);
  const [rev,setRev] = useState(savedData?.rev || {total:0,weekly:0,brands:{}});
  const [energy,setEnergy] = useState(savedData?.energy || 7);
  const [ideas,setIdeas] = useState(savedData?.ideas || []);
  const [events,setEvents] = useState(savedData?.events || [
    {id:1,title:"Reunion Rafael — transporte",date:"2026-04-28",time:"10:00"},
    {id:2,title:"Reunion Martin — celulares",date:"2026-04-28",time:"15:00"},
  ]);
  const [tab,setTab]=useState("projects");
  const [showSale,setShowSale]=useState(false);
  const [showIdea,setShowIdea]=useState(false);
  const [showEvent,setShowEvent]=useState(false);
  const [saleF,setSaleF]=useState({amount:"",brand:"etsy"});
  const [ideaF,setIdeaF]=useState({text:"",project:"etsy",priority:"inventario"});
  const [eventF,setEventF]=useState({title:"",date:"",time:""});
  const [clock,setClock]=useState(new Date());

  // Save to localStorage whenever data changes
  useEffect(()=>{
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects, rev, energy, ideas, events
      }));
    } catch(e) {}
  }, [projects, rev, energy, ideas, events]);

  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t)},[]);

  const pct=Math.round(rev.total/GOAL*100);
  const totalPending=projects.reduce((a,p)=>a+p.todos.filter(t=>!t.done).length,0);
  const totalDone=projects.reduce((a,p)=>a+p.todos.filter(t=>t.done).length,0);
  const clientProjects=projects.filter(p=>p.client);
  const otherProjects=projects.filter(p=>!p.client);

  const upProject=u=>setProjects(prev=>prev.map(p=>p.id===u.id?u:p));
  const addSale=()=>{
    const a=parseInt(saleF.amount.replace(/\D/g,""));if(!a)return;
    setRev(p=>({total:p.total+a,weekly:p.weekly+a,brands:{...p.brands,[saleF.brand]:(p.brands[saleF.brand]||0)+a}}));
    setSaleF({amount:"",brand:"etsy"});setShowSale(false);
  };
  const addIdea=()=>{
    if(!ideaF.text)return;
    setIdeas(p=>[...p,{...ideaF,id:Date.now()}]);
    setIdeaF({text:"",project:"etsy",priority:"inventario"});setShowIdea(false);
  };
  const addEvent=()=>{
    if(!eventF.title||!eventF.date)return;
    setEvents(p=>[...p,{...eventF,id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||"").localeCompare(b.time||"")));
    setEventF({title:"",date:"",time:""});setShowEvent(false);
  };
  const delIdea = id => setIdeas(p=>p.filter(i=>i.id!==id));
  const delEvent = id => setEvents(p=>p.filter(e=>e.id!==id));

  const resetData = () => {
    if(confirm("Borrar todos los datos guardados?")){
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const inputS={background:"#040a14",border:"1px solid #0a2030",borderRadius:3,padding:"9px 12px",color:"#6688aa",fontSize:13,outline:"none",fontFamily:"inherit"};

  return(
    <div style={{minHeight:"100vh",background:"#020508",color:"#8899aa",fontFamily:"'JetBrains Mono','Fira Code',monospace",padding:"20px 24px",maxWidth:1200,margin:"0 auto"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Orbitron:wght@400;500;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:#0a2030}
        input::placeholder{color:#1a2a3a!important}
        select option{background:#040a14;color:#4466aa}
      `}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:"'Orbitron'",fontSize:32,fontWeight:900,color:"#00d4ff",letterSpacing:4,textShadow:"0 0 24px #00d4ff33"}}>
            J.A.R.V.I.S
          </h1>
          <div style={{fontFamily:"'Orbitron'",fontSize:9,color:"#0a2a40",letterSpacing:4,marginTop:4}}>COMMAND CENTER v11</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Orbitron'",fontSize:28,fontWeight:700,color:"#00d4ff",textShadow:"0 0 12px #00d4ff33",letterSpacing:3}}>
            {clock.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>
          <div style={{fontSize:11,color:"#1a2a3a",marginTop:4}}>
            {clock.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </div>
          <button onClick={resetData} style={{marginTop:6,background:"transparent",border:"1px solid #1a2a3a",color:"#1a2a3a",padding:"2px 8px",cursor:"pointer",fontSize:8,fontFamily:"'Orbitron'",letterSpacing:2,borderRadius:2}}>RESET</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <Panel title="REVENUE" color="#00d4ff">
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Ring pct={pct} size={90} color="#00d4ff">
              <div style={{fontFamily:"'Orbitron'",fontSize:20,fontWeight:700,color:"#00d4ff"}}>{pct}%</div>
            </Ring>
            <div>
              <div style={{fontFamily:"'Orbitron'",fontSize:22,fontWeight:700,color:rev.total>0?"#00ff44":"#1a2a3a"}}>
                ${rev.total.toLocaleString("es-CO")}
              </div>
              <div style={{fontSize:11,color:"#1a2a3a",marginTop:4}}>Meta ${GOAL.toLocaleString("es-CO")}</div>
              <button onClick={()=>setShowSale(!showSale)} style={{marginTop:8,background:"#00d4ff0a",border:"1px solid #00d4ff22",borderRadius:3,color:"#00d4ff88",padding:"4px 10px",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron'",letterSpacing:1}}>+ VENTA</button>
            </div>
          </div>
        </Panel>

        <Panel title="TAREAS" color="#ffaa00">
          <div style={{display:"flex",gap:24,marginTop:4}}>
            <div>
              <div style={{fontFamily:"'Orbitron'",fontSize:32,fontWeight:700,color:"#ffaa00"}}>{totalPending}</div>
              <div style={{fontSize:11,color:"#2a3a4a",marginTop:2}}>Pendientes</div>
            </div>
            <div>
              <div style={{fontFamily:"'Orbitron'",fontSize:32,fontWeight:700,color:"#00ff44"}}>{totalDone}</div>
              <div style={{fontSize:11,color:"#2a3a4a",marginTop:2}}>Hechas</div>
            </div>
          </div>
        </Panel>

        <Panel title="ENERGIA" color={energy>=7?"#00ff44":energy>=4?"#ffaa00":"#ff3366"}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Ring pct={energy*10} size={80} color={energy>=7?"#00ff44":energy>=4?"#ffaa00":"#ff3366"}>
              <div style={{fontFamily:"'Orbitron'",fontSize:22,fontWeight:700,color:energy>=7?"#00ff44":energy>=4?"#ffaa00":"#ff3366"}}>{energy}</div>
            </Ring>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {[...Array(10)].map((_,i)=>(
                <div key={i} onClick={()=>setEnergy(10-i)} style={{
                  width:40,height:4,borderRadius:2,cursor:"pointer",
                  background:(10-i)<=energy?(energy>=7?"#00ff44":energy>=4?"#ffaa00":"#ff3366"):"#0a1828",
                }}/>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="AGENDA" color="#a78bfa">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {events.slice(0,3).map(ev=>(
              <div key={ev.id} style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{fontFamily:"'Orbitron'",fontSize:14,fontWeight:700,color:"#a78bfa",minWidth:45}}>{ev.time}</div>
                <div style={{fontSize:12,color:"#5a6a7a",lineHeight:1.3}}>{ev.title}</div>
              </div>
            ))}
            {events.length===0&&<div style={{fontSize:12,color:"#1a2a3a"}}>Sin eventos</div>}
          </div>
        </Panel>
      </div>

      {showSale&&(
        <div style={{background:"#060d18",border:"1px solid #00d4ff18",borderRadius:4,padding:14,marginBottom:12,display:"flex",gap:8}}>
          <input placeholder="Monto COP" value={saleF.amount} onChange={e=>setSaleF(p=>({...p,amount:e.target.value}))} style={{...inputS,flex:1}}/>
          <select value={saleF.brand} onChange={e=>setSaleF(p=>({...p,brand:e.target.value}))} style={inputS}>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={addSale} style={{background:"#00d4ff22",border:"1px solid #00d4ff44",color:"#00d4ff",padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13,borderRadius:3}}>OK</button>
        </div>
      )}

      <div style={{display:"flex",gap:0,marginBottom:14,borderBottom:"1px solid #0a1828"}}>
        {[["projects","PROYECTOS"],["ideas","IDEAS"],["calendar","AGENDA"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:"10px 20px",cursor:"pointer",border:"none",background:"transparent",
            fontFamily:"'Orbitron'",fontSize:11,letterSpacing:3,
            color:tab===k?"#00d4ff":"#1a2a3a",
            borderBottom:tab===k?"2px solid #00d4ff":"2px solid transparent",
            marginBottom:-1,
          }}>{l}</button>
        ))}
      </div>

      {tab==="projects"&&(
        <div>
          <div style={{fontFamily:"'Orbitron'",fontSize:10,letterSpacing:4,color:"#ffaa0066",marginBottom:10}}>CLIENTES AGENCIA IA</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
            {clientProjects.sort((a,b)=>calcPct(b.todos)-calcPct(a.todos)).map(p=>(
              <ProjectRow key={p.id} project={p} onUpdate={upProject}/>
            ))}
          </div>
          <div style={{fontFamily:"'Orbitron'",fontSize:10,letterSpacing:4,color:"#00d4ff66",marginBottom:10}}>PROYECTOS PROPIOS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {otherProjects.sort((a,b)=>calcPct(b.todos)-calcPct(a.todos)).map(p=>(
              <ProjectRow key={p.id} project={p} onUpdate={upProject}/>
            ))}
          </div>
        </div>
      )}

      {tab==="ideas"&&(
        <div>
          <button onClick={()=>setShowIdea(!showIdea)} style={{marginBottom:14,background:"#a78bfa0a",border:"1px solid #a78bfa22",borderRadius:3,padding:"10px 16px",color:"#a78bfa88",cursor:"pointer",fontSize:11,fontFamily:"'Orbitron'",letterSpacing:2,width:"100%"}}>+ NUEVA IDEA</button>
          {showIdea&&(
            <div style={{background:"#060d18",border:"1px solid #a78bfa18",borderRadius:4,padding:14,marginBottom:14,display:"flex",gap:8}}>
              <input placeholder="Describe la idea..." value={ideaF.text} onChange={e=>setIdeaF(p=>({...p,text:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addIdea()} style={{...inputS,flex:2}}/>
              <select value={ideaF.project} onChange={e=>setIdeaF(p=>({...p,project:e.target.value}))} style={inputS}>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={ideaF.priority} onChange={e=>setIdeaF(p=>({...p,priority:e.target.value}))} style={inputS}>
                <option value="pronto">Pronto</option><option value="inventario">Inventario</option>
              </select>
              <button onClick={addIdea} style={{background:"#a78bfa22",border:"1px solid #a78bfa44",color:"#a78bfa",padding:"9px 14px",cursor:"pointer",fontWeight:700,borderRadius:3}}>OK</button>
            </div>
          )}
          {ideas.filter(i=>i.priority==="pronto").length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Orbitron'",fontSize:10,letterSpacing:3,color:"#a78bfa66",marginBottom:8}}>TRABAJAR PRONTO</div>
              {ideas.filter(i=>i.priority==="pronto").map(i=>(
                <div key={i.id} style={{background:"#060d18",borderLeft:`3px solid #a78bfa`,padding:"12px 14px",marginBottom:4,borderRadius:3,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:"#8899aa"}}>{i.text}</div>
                    <div style={{fontSize:10,color:"#2a3a4a",marginTop:4}}>{projects.find(p=>p.id===i.project)?.name||i.project}</div>
                  </div>
                  <button onClick={()=>delIdea(i.id)} style={{background:"transparent",border:"none",color:"#334",cursor:"pointer",fontSize:16}}>×</button>
                </div>
              ))}
            </div>
          )}
          {ideas.filter(i=>i.priority==="inventario").length>0&&(
            <div>
              <div style={{fontFamily:"'Orbitron'",fontSize:10,letterSpacing:3,color:"#1a2a3a",marginBottom:8}}>INVENTARIO</div>
              {ideas.filter(i=>i.priority==="inventario").map(i=>(
                <div key={i.id} style={{background:"#040a14",padding:"10px 14px",marginBottom:3,borderRadius:3,border:"1px solid #080f1a",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:"#3a4a5a"}}>{i.text}</div>
                    <div style={{fontSize:10,color:"#1a2a3a",marginTop:2}}>{projects.find(p=>p.id===i.project)?.name||i.project}</div>
                  </div>
                  <button onClick={()=>delIdea(i.id)} style={{background:"transparent",border:"none",color:"#223",cursor:"pointer",fontSize:14}}>×</button>
                </div>
              ))}
            </div>
          )}
          {ideas.length===0&&<div style={{textAlign:"center",padding:40,color:"#1a2a3a",fontSize:14}}>Sin ideas guardadas</div>}
        </div>
      )}

      {tab==="calendar"&&(
        <div>
          <button onClick={()=>setShowEvent(!showEvent)} style={{marginBottom:14,background:"#a78bfa0a",border:"1px solid #a78bfa22",borderRadius:3,padding:"10px 16px",color:"#a78bfa88",cursor:"pointer",fontSize:11,fontFamily:"'Orbitron'",letterSpacing:2,width:"100%"}}>+ NUEVO EVENTO</button>
          {showEvent&&(
            <div style={{background:"#060d18",border:"1px solid #a78bfa18",borderRadius:4,padding:14,marginBottom:14,display:"flex",gap:8}}>
              <input placeholder="Titulo" value={eventF.title} onChange={e=>setEventF(p=>({...p,title:e.target.value}))} style={{...inputS,flex:2}}/>
              <input type="date" value={eventF.date} onChange={e=>setEventF(p=>({...p,date:e.target.value}))} style={inputS}/>
              <input type="time" value={eventF.time} onChange={e=>setEventF(p=>({...p,time:e.target.value}))} style={{...inputS,width:110}}/>
              <button onClick={addEvent} style={{background:"#a78bfa22",border:"1px solid #a78bfa44",color:"#a78bfa",padding:"9px 14px",cursor:"pointer",fontWeight:700,borderRadius:3}}>OK</button>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {events.map(ev=>(
              <div key={ev.id} style={{background:"#060d18",border:"1px solid #0a1828",borderRadius:4,display:"flex",alignItems:"center",gap:16,padding:"14px 18px"}}>
                <div style={{background:"#00d4ff08",border:"1px solid #00d4ff22",borderRadius:4,padding:"10px 14px",textAlign:"center",minWidth:56}}>
                  <div style={{fontFamily:"'Orbitron'",fontSize:20,fontWeight:700,color:"#00d4ff"}}>{new Date(ev.date+"T00:00").getDate()}</div>
                  <div style={{fontSize:10,color:"#0a3050",textTransform:"uppercase"}}>{new Date(ev.date+"T00:00").toLocaleDateString("es-CO",{month:"short"})}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,color:"#8899aa"}}>{ev.title}</div>
                  <div style={{fontSize:12,color:"#2a3a4a",marginTop:4,fontFamily:"'Orbitron'"}}>{ev.time||"Todo el dia"}</div>
                </div>
                <button onClick={()=>delEvent(ev.id)} style={{background:"transparent",border:"none",color:"#334",cursor:"pointer",fontSize:18}}>×</button>
              </div>
            ))}
            {events.length===0&&<div style={{textAlign:"center",padding:40,color:"#1a2a3a",fontSize:14}}>Sin eventos</div>}
          </div>
        </div>
      )}

      <div style={{marginTop:28,textAlign:"center",fontFamily:"'Orbitron'",fontSize:8,letterSpacing:5,color:"#0a1828"}}>
        ALL SYSTEMS OPERATIONAL · DATA PERSISTED LOCALLY
      </div>
    </div>
  );
}
