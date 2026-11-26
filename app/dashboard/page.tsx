'use client';
import { useCallback,useEffect,useState } from "react";
import { Activity,CalendarDays,Dumbbell,LogOut,Salad } from "lucide-react";
import AuthScreen from "../../components/dashboard/AuthScreen";
import NutritionTab from "../../components/dashboard/NutritionTab";
import WorkoutTab from "../../components/dashboard/WorkoutTab";
import { api,ApiError } from "../../lib/clientApi";
import type { PublicUser } from "../../lib/auth";
import { localDateKey } from "../../lib/fitness";
import "./dashboard.css";
const dashboardHome=import.meta.env.BASE_URL==="/"?"/dashboard":import.meta.env.BASE_URL;

export default function DashboardPage() {
  const [user,setUser]=useState<PublicUser|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[logoutBusy,setLogoutBusy]=useState(false);
  const [tab,setTab]=useState<"workouts"|"nutrition">("workouts"),[date,setDate]=useState(()=>localDateKey());
  useEffect(()=>{let active=true;const controller=new AbortController();api<{user:PublicUser}>("/api/auth/me",{signal:controller.signal}).then((result)=>{if(active)setUser(result.user);}).catch((error)=>{if(active&&!(error instanceof ApiError&&error.status===401)&&!controller.signal.aborted)setError(error instanceof Error?error.message:"無法連線至登入服務。");}).finally(()=>{if(active)setLoading(false);});const expired=()=>setUser(null);window.addEventListener("fitness:unauthorized",expired);return()=>{active=false;controller.abort();window.removeEventListener("fitness:unauthorized",expired);};},[]);
  useEffect(()=>{if(user&&window.location.pathname!==dashboardHome)window.history.replaceState(null,"",dashboardHome);},[user]);
  const authenticated=useCallback((next:PublicUser)=>{setUser(next);setError(null);setTab("workouts");setDate(localDateKey());},[]);
  async function logout(){setLogoutBusy(true);setError(null);try{await api("/api/auth/logout",{method:"POST"});setUser(null);}catch(error){setError(error instanceof Error?error.message:"登出失敗，請重試。");}finally{setLogoutBusy(false);}}
  if(loading)return <div className="app-loading" role="status"><Activity size={30}/><strong>FORM</strong><span>載入你的訓練紀錄…</span></div>;
  if(!user)return <AuthScreen onAuthenticated={authenticated} startupError={error}/>;
  return <div className="dash-shell" key={user.id}><header className="dash-nav"><a className="brand" href={dashboardHome}><span><Activity size={23}/></span><strong>FORM<small>TRAINING JOURNAL</small></strong></a><div className="user-menu"><div><strong>{user.display_name}</strong><span>{user.email}</span></div><button type="button" className="text-button" onClick={()=>void logout()} disabled={logoutBusy}><LogOut size={16}/>{logoutBusy?"登出中…":"登出"}</button></div></header><main className="dash-main"><div className="dash-intro"><div><span className="eyebrow">YOUR DAILY PRACTICE</span><h1>把今天，練成進步。</h1><p>每一組訓練，每一份營養，累積成看得見的改變。</p></div><div className="date-picker"><CalendarDays size={17}/><label><span className="sr-only">紀錄日期</span><input aria-label="紀錄日期" type="date" value={date} onChange={(event)=>{if(event.target.value)setDate(event.target.value);}}/></label><button type="button" onClick={()=>setDate(localDateKey())}>今天</button></div></div>
      {error&&<div className="message error" role="alert">{error}</div>}
      <div className="dashboard-tabs" role="tablist" aria-label="儀表板分頁">{([{id:"workouts",label:"重訓紀錄與動作指導",Icon:Dumbbell},{id:"nutrition",label:"身體數據與飲食熱量",Icon:Salad}] as const).map(({id,label,Icon},index)=><button type="button" key={id} id={`tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`panel-${id}`} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={(event)=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){event.preventDefault();const next=event.key==="Home"?"workouts":event.key==="End"?"nutrition":index===0?"nutrition":"workouts";setTab(next);document.getElementById(`tab-${next}`)?.focus();}}}><Icon size={19}/>{label}</button>)}</div>
      <div role="tabpanel" id="panel-workouts" aria-labelledby="tab-workouts" hidden={tab!=="workouts"}><WorkoutTab date={date}/></div><div role="tabpanel" id="panel-nutrition" aria-labelledby="tab-nutrition" hidden={tab!=="nutrition"}><NutritionTab date={date}/></div>
    </main><footer className="dash-footer"><span>FORM / TRAIN WITH UNDERSTANDING</span><span>持續記錄，慢慢變強。</span></footer></div>;
}
