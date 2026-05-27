import React,{createContext,useContext,useState,useEffect,useRef}from"react";
import{BrowserRouter,Routes,Route,Navigate,useNavigate,useLocation}from"react-router-dom";
import"./index.css";

// ── FIX #5: Products fetched from public API (with hardcoded fallback) ──
const FALLBACK_PRODUCTS=[
  {id:1,name:"Vegetarian Muscle Stack",subtitle:"Plant-Powered Gains",price:2499,originalPrice:2999,emoji:"🌿",accent:"#10b981",badge:"Bestseller",macros:{protein:"42g",carbs:"12g",fat:"6g"},description:"Complete plant-based protein blend.",weight:"1kg",flavors:["Chocolate","Vanilla"]},
  {id:2,name:"Soya Isolate Blend",subtitle:"Ultra-Pure Protein",price:1899,originalPrice:2199,emoji:"⚡",accent:"#06b6d4",badge:"New",macros:{protein:"38g",carbs:"4g",fat:"2g"},description:"95% pure soy protein isolate.",weight:"900g",flavors:["Chocolate Fudge"]},
  {id:3,name:"High-Protein Oats",subtitle:"Morning Fuel Complex",price:899,originalPrice:1099,emoji:"🔥",accent:"#f97316",badge:"Sale",macros:{protein:"28g",carbs:"55g",fat:"8g"},description:"Whole grain oats with whey protein.",weight:"2kg",flavors:["Banana","Berry"]},
  {id:4,name:"Creatine Monohydrate",subtitle:"Strength Amplifier",price:1299,originalPrice:1499,emoji:"💪",accent:"#8b5cf6",badge:"Popular",macros:{protein:"0g",carbs:"0g",fat:"0g"},description:"Micronized creatine for strength.",weight:"500g",flavors:["Unflavored"]},
  {id:5,name:"BCAA Recovery Mix",subtitle:"Muscle Repair Formula",price:1599,originalPrice:1899,emoji:"🧬",accent:"#ec4899",badge:"Top Rated",macros:{protein:"5g",carbs:"3g",fat:"0g"},description:"2:1:1 ratio BCAAs + electrolytes.",weight:"400g",flavors:["Watermelon","Mango"]},
  {id:6,name:"Pre-Workout Ignite",subtitle:"Explosive Energy Blend",price:1749,originalPrice:2099,emoji:"🚀",accent:"#eab308",badge:"Intense",macros:{protein:"2g",carbs:"8g",fat:"0g"},description:"200mg caffeine + beta-alanine.",weight:"300g",flavors:["Green Apple"]},
];

// Map Open Food Facts API category results into our product shape
function mapApiProducts(items){
  const emojis=["🌿","⚡","🔥","💪","🧬","🚀","🥛","🍃"];
  const accents=["#10b981","#06b6d4","#f97316","#8b5cf6","#ec4899","#eab308","#39ff14","#ef4444"];
  const badges=["New","Popular","Sale","Top Rated","Bestseller","Intense",null,null];
  return items.slice(0,8).map((p,i)=>({
    id:p.id||i+100,
    name:p.product_name||p.abbreviated_product_name||"Supplement "+( i+1),
    subtitle:p.brands||"Nutrition Product",
    price:Math.floor(Math.random()*2000)+500,
    originalPrice:Math.floor(Math.random()*800)+2000,
    emoji:emojis[i%emojis.length],
    accent:accents[i%accents.length],
    badge:badges[i%badges.length],
    macros:{
      protein:(p.nutriments?.proteins_100g||Math.floor(Math.random()*40)+5)+"g",
      carbs:(p.nutriments?.carbohydrates_100g||Math.floor(Math.random()*30)+2)+"g",
      fat:(p.nutriments?.fat_100g||Math.floor(Math.random()*10)+1)+"g",
    },
    description:(p.generic_name||p.ingredients_text||"Premium nutrition supplement.").slice(0,60)+".",
    weight:(p.quantity||"500g"),
    flavors:["Original"],
  }));
}

const PLANS=[
  {id:"monthly",label:"Monthly",duration:"1 Month",days:30,price:999,originalPrice:1299,badge:null,color:"#06b6d4",features:["Full gym access","Progress tracking","Basic support","Store access"]},
  {id:"quarterly",label:"Quarterly",duration:"3 Months",days:90,price:2499,originalPrice:3897,badge:"Most Popular",color:"#39ff14",features:["Full gym access","10% supplement discount","Priority support","Save ₹1398"]},
  {id:"yearly",label:"Yearly",duration:"12 Months",days:365,price:7999,originalPrice:11988,badge:"Best Value",color:"#f97316",features:["Full gym access","20% discount","Free diet plan","Personal coach","Save ₹3989"]},
];
const PHOTOS=["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80","https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80","https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80","https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80"];
const MET={running:9.8,cycling:7.5,walking:3.5,swimming:8.0,rowing:7.0,jump_rope:12.3};
const EXERCISES=[{value:"running",label:"🏃 Running"},{value:"cycling",label:"🚴 Cycling"},{value:"walking",label:"🚶 Walking"},{value:"swimming",label:"🏊 Swimming"},{value:"rowing",label:"🚣 Rowing"},{value:"jump_rope",label:"⏭ Jump Rope"}];

// ── FIX #1: RAZORPAY — robust integration with proper error handling ──
const RZP_KEY="rzp_test_REPLACE_WITH_YOUR_KEY"; // ← paste your Razorpay Key ID here
function pay({amount,user,items,onSuccess,onFailure}){
  if(!window.Razorpay){
    // Try loading the script dynamically if it wasn't in index.html
    const script=document.createElement("script");
    script.src="https://checkout.razorpay.com/v1/checkout.js";
    script.onload=()=>pay({amount,user,items,onSuccess,onFailure});
    script.onerror=()=>onFailure&&onFailure({reason:"Could not load Razorpay. Check your internet connection."});
    document.head.appendChild(script);
    return;
  }
  if(!RZP_KEY||RZP_KEY.includes("REPLACE")){
    onFailure&&onFailure({reason:"Razorpay Key not configured. Add your key to RZP_KEY in App.js."});
    return;
  }
  try{
    const options={
      key:RZP_KEY,
      amount:Math.round(amount*100), // paise, must be integer
      currency:"INR",
      name:"PumpLab",
      description:items[0]?.name||"PumpLab Order",
      prefill:{name:user?.name||"",email:user?.email||"",contact:user?.phone||""},
      theme:{color:"#39ff14"},
      modal:{
        ondismiss:()=>onFailure&&onFailure({reason:"Payment was cancelled."}),
        escape:true,
        animation:true,
      },
      handler:(response)=>{
        onSuccess&&onSuccess({
          id:response.razorpay_payment_id||"PAY_"+Date.now(),
          date:new Date().toISOString(),
          items,
          amount,
          status:"confirmed",
          paymentId:response.razorpay_payment_id,
        });
      },
    };
    const rzp=new window.Razorpay(options);
    rzp.on("payment.failed",(response)=>{
      onFailure&&onFailure({reason:response.error?.description||response.error?.reason||"Payment failed. Please try again."});
    });
    rzp.open();
  }catch(err){
    onFailure&&onFailure({reason:"Failed to open payment: "+err.message});
  }
}

// ── AUTH ──
const AC=createContext(null);
const getU=()=>{try{return JSON.parse(localStorage.getItem("gz_u"))||[];}catch{return[];}};
const saveU=(u)=>localStorage.setItem("gz_u",JSON.stringify(u));
function AuthProvider({children}){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{try{const s=JSON.parse(localStorage.getItem("gz_s"));if(s)setUser(s);}catch{}setLoading(false);},[]);
  const persist=(u)=>{setUser(u);localStorage.setItem("gz_s",JSON.stringify(u));};
  const register=async({name,email,password,phone})=>{
    const users=getU();
    if(users.find(u=>u.email===email))throw new Error("Email already registered.");
    const nu={id:Date.now().toString(),name,email,password,phone,avatar:name.charAt(0).toUpperCase(),
      subscription:{renewalDays:14,plan:"Trial"},stats:{workouts:0,prs:0,totalCaloriesBurned:0,totalKmRun:0},
      lifts:{squat:{w:"",r:"",s:"",history:[]},bench:{w:"",r:"",s:"",history:[]},deadlift:{w:"",r:"",s:"",history:[]}},
      workoutHistory:[],cardioSessions:[],orders:[],weight:"",height:"",age:""};
    saveU([...users,nu]);const{password:_,...safe}=nu;persist(safe);return safe;
  };
  const login=async({email,password})=>{
    const found=getU().find(u=>u.email===email&&u.password===password);
    if(!found)throw new Error("Invalid email or password.");
    const{password:_,...safe}=found;persist(safe);return safe;
  };
  // ── FIX #2: Google Sign-In handler ──
  const loginWithGoogle=async(googleUser)=>{
    const {name,email,picture,sub}=googleUser;
    const users=getU();
    let found=users.find(u=>u.email===email);
    if(!found){
      // auto-register Google users
      found={id:sub||Date.now().toString(),name,email,password:"__google__",phone:"",
        avatar:name.charAt(0).toUpperCase(),googlePicture:picture,
        subscription:{renewalDays:14,plan:"Trial"},
        stats:{workouts:0,prs:0,totalCaloriesBurned:0,totalKmRun:0},
        lifts:{squat:{w:"",r:"",s:"",history:[]},bench:{w:"",r:"",s:"",history:[]},deadlift:{w:"",r:"",s:"",history:[]}},
        workoutHistory:[],cardioSessions:[],orders:[],weight:"",height:"",age:""};
      saveU([...users,found]);
    }
    const{password:_,...safe}=found;persist(safe);return safe;
  };
  const logout=()=>{setUser(null);localStorage.removeItem("gz_s");};
  const updateUser=(updates)=>{
    const updated={...user,...updates};persist(updated);
    const users=getU();const idx=users.findIndex(u=>u.id===updated.id);
    if(idx!==-1){users[idx]={...users[idx],...updates};saveU(users);}
  };
  const addOrder=(order)=>updateUser({orders:[...(user.orders||[]),order]});
  return<AC.Provider value={{user,loading,register,login,loginWithGoogle,logout,updateUser,addOrder}}>{children}</AC.Provider>;
}
const useAuth=()=>useContext(AC);

// ── FIX #4: Cart persisted to localStorage so it survives refresh ──
const CC=createContext(null);
const CART_KEY="gz_cart";
const loadCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch{return[];}};
const saveCart=(items)=>{try{localStorage.setItem(CART_KEY,JSON.stringify(items));}catch{}};
function CartProvider({children}){
  const[items,setItems]=useState(()=>loadCart());
  const[cartOpen,setCartOpen]=useState(false);
  const setAndSave=(updater)=>setItems(prev=>{const next=typeof updater==="function"?updater(prev):updater;saveCart(next);return next;});
  const addItem=(p)=>setAndSave(prev=>{const ex=prev.find(i=>i.id===p.id);return ex?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{...p,qty:1}];});
  const removeItem=(id)=>setAndSave(prev=>prev.filter(i=>i.id!==id));
  const updateQty=(id,qty)=>qty<1?removeItem(id):setAndSave(prev=>prev.map(i=>i.id===id?{...i,qty}:i));
  const clearCart=()=>setAndSave([]);
  const totalItems=items.reduce((s,i)=>s+i.qty,0);
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping=subtotal>1500?0:subtotal>0?99:0;
  const total=subtotal+shipping;
  return<CC.Provider value={{items,cartOpen,setCartOpen,addItem,removeItem,updateQty,clearCart,totalItems,subtotal,shipping,total}}>{children}</CC.Provider>;
}
const useCart=()=>useContext(CC);

// ── SMALL COMPONENTS ──
function Guard({children}){
  const{user,loading}=useAuth();
  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07070f"}}><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style><div style={{textAlign:"center"}}><div style={{width:48,height:48,border:"3px solid #39ff14",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}}/><p style={{color:"#6b7280",fontSize:13,fontWeight:700,letterSpacing:2}}>Loading PumpLab...</p></div></div>;
  return user?children:<Navigate to="/auth" replace/>;
}
const S={card:{borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",background:"linear-gradient(160deg,#0d1117,#0a0a1a)"}};
function SB({emoji,value,label,sub,color}){return<div style={{...S.card,padding:14,background:`radial-gradient(circle at 80% 20%,${color}10,transparent 60%),linear-gradient(160deg,#0d1117,#0a0a1a)`}}><span style={{fontSize:20}}>{emoji}</span><div style={{fontSize:22,fontWeight:900,color:"white",lineHeight:1,marginTop:6}}>{value}</div><div style={{fontSize:11,fontWeight:900,color,marginTop:3}}>{label}</div><div style={{fontSize:10,color:"#4b5563",marginTop:1}}>{sub}</div></div>;}
function Field({label,name,value,onChange,placeholder,type="text",unit,min}){return<div style={{flex:1,minWidth:110}}><label style={{display:"block",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>{label}</label><div style={{position:"relative"}}><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} style={{width:"100%",padding:"9px 11px",paddingRight:unit?"34px":"11px",borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:12,outline:"none",boxSizing:"border-box"}}/>{unit&&<span style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#6b7280",fontWeight:700}}>{unit}</span>}</div></div>;}
function Btn({onClick,children,disabled,style={}}){return<button onClick={onClick} disabled={disabled} style={{padding:"10px 20px",borderRadius:10,fontWeight:900,fontSize:12,letterSpacing:1,textTransform:"uppercase",cursor:disabled?"not-allowed":"pointer",border:"none",background:disabled?"#1e293b":"linear-gradient(135deg,#39ff14,#06b6d4)",color:disabled?"#6b7280":"#000",transition:"all 0.2s",...style}}>{children}</button>;}

// ── COUNTDOWN ──
function Countdown({days=14}){
  const[c,setC]=useState(days);
  const r=54,circ=2*Math.PI*r,dash=circ-((30-c)/30)*circ;
  const col=c<=7?"#ef4444":c<=14?"#f97316":"#39ff14";
  return<div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{position:"relative",width:130,height:130}}><svg style={{width:"100%",height:"100%",transform:"rotate(-90deg)"}} viewBox="0 0 120 120"><circle cx="60" cy="60" r={r} fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="60" cy="60" r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash} style={{transition:"stroke-dashoffset 0.8s ease,stroke 0.5s ease",filter:`drop-shadow(0 0 8px ${col})`}}/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:28,fontWeight:900,color:"white",lineHeight:1}}>{c}</span><span style={{fontSize:9,color:"#6b7280",fontWeight:700,letterSpacing:3,marginTop:3}}>DAYS</span></div></div><p style={{fontSize:10,color:"#6b7280",marginTop:6,letterSpacing:2,textTransform:"uppercase"}}>Until Renewal</p></div>;
}

// ── SPARKLINE ──
function Spark({data,color}){
  if(!data||data.length<2)return<p style={{fontSize:11,color:"#374151",padding:"16px 0"}}>No history yet. Log your first lift!</p>;
  const W=300,H=55,P=6;
  const vals=data.map(d=>d.weight);
  const mx=Math.max(...vals),mn=Math.min(...vals),range=mx-mn||1;
  const pts=vals.map((v,i)=>({x:P+(i/(vals.length-1))*(W-P*2),y:H-P-((v-mn)/range)*(H-P*2)}));
  const d=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  return<svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:300}}><defs><linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><path d={`${d} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`} fill={`url(#g${color.replace("#","")})`}/><path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>{pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color}/>)}</svg>;
}

// ── FIX #2: Google Sign-In Button (uses Google Identity Services) ──
function GoogleSignInButton({onSuccess,onError}){
  const btnRef=useRef(null);
  useEffect(()=>{
    const initGoogle=()=>{
      if(!window.google?.accounts?.id)return;
      window.google.accounts.id.initialize({
        // ⬇ Replace with your Google OAuth Client ID from console.cloud.google.com
        client_id:"YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback:(response)=>{
          try{
            // Decode JWT credential from Google
            const base64=response.credential.split(".")[1];
            const pad=base64.replace(/-/g,"+").replace(/_/g,"/");
            const json=JSON.parse(atob(pad));
            onSuccess(json);
          }catch(e){onError("Failed to parse Google sign-in response.");}
        },
        auto_select:false,
        cancel_on_tap_outside:true,
      });
      window.google.accounts.id.renderButton(btnRef.current,{
        theme:"filled_black",shape:"pill",size:"large",width:340,
        text:"signin_with",logo_alignment:"left",
      });
    };
    // Load the Google script if not already loaded
    if(window.google?.accounts?.id){initGoogle();return;}
    const existing=document.getElementById("google-gsi-script");
    if(existing){existing.addEventListener("load",initGoogle);return()=>existing.removeEventListener("load",initGoogle);}
    const script=document.createElement("script");
    script.id="google-gsi-script";
    script.src="https://accounts.google.com/gsi/client";
    script.async=true;
    script.defer=true;
    script.onload=initGoogle;
    document.head.appendChild(script);
    return()=>{};
  },[onSuccess,onError]);
  return<div ref={btnRef} style={{display:"flex",justifyContent:"center",marginTop:4}}/>;
}

// ── SUBSCRIPTION MODAL ──
function SubModal({onClose}){
  const{user,updateUser,addOrder}=useAuth();
  const[sel,setSel]=useState("quarterly");
  const[ps,setPs]=useState(null);
  const[fm,setFm]=useState("");
  const pl=PLANS.find(p=>p.id===sel);
  const handlePay=()=>{
    setPs("processing");
    pay({amount:pl.price,user,items:[{id:pl.id,name:`PumpLab ${pl.label} Plan`,emoji:"🏋️",price:pl.price,qty:1}],
      onSuccess:(order)=>{addOrder({...order,type:"subscription",plan:pl.label});updateUser({subscription:{plan:pl.label,renewalDays:pl.days}});setPs("success");setTimeout(()=>onClose(),3000);},
      onFailure:({reason})=>{setFm(reason);setPs("failed");setTimeout(()=>setPs(null),4000);},
    });
  };
  return<div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.87)",backdropFilter:"blur(12px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <style>{"@keyframes mIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}"}</style>
    <div style={{background:"linear-gradient(160deg,#0d1117,#0a0a1a)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:24,width:"100%",maxWidth:660,maxHeight:"90vh",overflowY:"auto",animation:"mIn 0.3s ease"}}>
      <div style={{borderRadius:12,overflow:"hidden",height:100,position:"relative",marginBottom:18}}>
        <img src={PHOTOS[1]} alt="gym" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.5}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,#0d1117cc,transparent,#0d1117cc)"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px"}}>
          <div><h2 style={{fontWeight:900,color:"white",fontSize:20}}>Choose Your Plan</h2><p style={{fontSize:12,color:"#9ca3af",marginTop:2}}>Unlock full PumpLab access</p></div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.15)",color:"white",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:10,marginBottom:16}}>
        {PLANS.map(p=><div key={p.id} onClick={()=>setSel(p.id)} style={{borderRadius:12,border:`2px solid ${sel===p.id?p.color:"rgba(255,255,255,0.07)"}`,padding:14,cursor:"pointer",position:"relative",transition:"all 0.2s",background:sel===p.id?p.color+"15":"rgba(255,255,255,0.02)",transform:sel===p.id?"scale(1.03)":"scale(1)"}}>
          {p.badge&&<span style={{position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:900,padding:"2px 8px",borderRadius:999,background:p.color,color:"#000",whiteSpace:"nowrap"}}>{p.badge}</span>}
          <div style={{textAlign:"center",marginTop:p.badge?4:0}}>
            <p style={{fontSize:12,fontWeight:700,color:"#9ca3af",marginBottom:4}}>{p.label}</p>
            <p style={{fontSize:24,fontWeight:900,color:"white",lineHeight:1}}>₹{p.price}</p>
            <p style={{fontSize:10,color:"#6b7280"}}>/{p.duration}</p>
            <p style={{fontSize:10,color:"#374151",textDecoration:"line-through",marginBottom:8}}>₹{p.originalPrice}</p>
            {p.features.map(f=><div key={f} style={{display:"flex",gap:4,marginBottom:3}}><span style={{color:p.color,fontSize:10}}>✓</span><span style={{fontSize:10,color:"#9ca3af",lineHeight:1.4}}>{f}</span></div>)}
          </div>
          {sel===p.id&&<div style={{position:"absolute",top:8,right:8,width:16,height:16,borderRadius:"50%",background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#000",fontWeight:900}}>✓</div>}
        </div>)}
      </div>
      <div style={{padding:12,borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div><p style={{fontSize:12,color:"#9ca3af"}}>Selected: <span style={{color:"white",fontWeight:700}}>{pl.label} Plan</span></p><p style={{fontSize:10,color:"#6b7280",marginTop:1}}>{pl.duration} · Auto-renews</p></div>
        <div style={{textAlign:"right"}}><p style={{fontSize:20,fontWeight:900,color:"white"}}>₹{pl.price}</p><p style={{fontSize:11,fontWeight:700,color:"#39ff14"}}>Save ₹{pl.originalPrice-pl.price}</p></div>
      </div>
      {ps==="success"&&<div style={{padding:12,borderRadius:10,textAlign:"center",fontSize:13,fontWeight:700,color:"#000",background:"linear-gradient(135deg,#39ff14,#06b6d4)",marginBottom:10}}>✅ Activated! Enjoy PumpLab {pl.label} 🎉</div>}
      {ps==="failed"&&<div style={{padding:10,borderRadius:10,textAlign:"center",fontSize:11,color:"#fca5a5",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",marginBottom:10}}>❌ {fm}</div>}
      {ps!=="success"&&<button onClick={handlePay} disabled={ps==="processing"} style={{width:"100%",padding:14,borderRadius:10,fontWeight:900,fontSize:13,letterSpacing:2,textTransform:"uppercase",cursor:ps==="processing"?"not-allowed":"pointer",border:"none",background:ps==="processing"?"#1e293b":`linear-gradient(135deg,${pl.color},#06b6d4)`,color:ps==="processing"?"#6b7280":"#000",transition:"all 0.2s"}}>{ps==="processing"?"⏳ Opening...":`Pay ₹${pl.price} with Razorpay →`}</button>}
      <p style={{textAlign:"center",fontSize:11,color:"#374151",marginTop:8}}>🔒 Razorpay · UPI · Cards · Net Banking</p>
    </div>
  </div>;
}

// ── LIFTS PAGE ──
function LiftsPage(){
  const{user,updateUser}=useAuth();
  const[lifts,setLifts]=useState(()=>user?.lifts||{squat:{w:"",r:"",s:"",history:[]},bench:{w:"",r:"",s:"",history:[]},deadlift:{w:"",r:"",s:"",history:[]}});
  const[saved,setSaved]=useState({});
  const today=new Date().toLocaleDateString("en-IN");
  const LC=[{key:"squat",label:"Squat",emoji:"🏋️",color:"#39ff14"},{key:"bench",label:"Bench Press",emoji:"💪",color:"#06b6d4"},{key:"deadlift",label:"Deadlift",emoji:"⚡",color:"#f97316"}];
  const ch=(k,f,v)=>setLifts(p=>({...p,[k]:{...p[k],[f]:v}}));
  const save=(k)=>{
    const l=lifts[k];if(!l.w){alert("Enter weight.");return;}
    const entry={weight:parseFloat(l.w),reps:parseInt(l.r)||1,sets:parseInt(l.s)||1,date:today};
    const hist=[...(l.history||[]),entry].slice(-30);
    const ul={...lifts,[k]:{...l,history:hist}};
    setLifts(ul);updateUser({lifts:ul,stats:{...user.stats,prs:(user.stats?.prs||0)+1}});
    setSaved(s=>({...s,[k]:true}));setTimeout(()=>setSaved(s=>({...s,[k]:false})),2000);
  };
  const best=(k)=>{const h=lifts[k]?.history||[];return h.length?Math.max(...h.map(e=>e.weight))+"kg":"—";};
  return<div style={{maxWidth:900,margin:"0 auto",padding:"28px 16px"}}>
    <style>{"input[type=number]::-webkit-inner-spin-button{opacity:1}"}</style>
    <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:42,letterSpacing:5,color:"#39ff14",textShadow:"0 0 20px #39ff1460",lineHeight:1,marginBottom:4}}>LIFT TRACKER</h1>
    <p style={{color:"#6b7280",fontSize:12,marginBottom:20}}>Log your lifts, update PRs, track progress</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
      {LC.map(lc=><div key={lc.key} style={{borderRadius:12,padding:14,textAlign:"center",background:`linear-gradient(135deg,${lc.color}15,rgba(13,17,23,0.9))`,border:`1px solid ${lc.color}30`}}><span style={{fontSize:22}}>{lc.emoji}</span><p style={{fontSize:20,fontWeight:900,color:"white",marginTop:5}}>{best(lc.key)}</p><p style={{fontSize:10,color:lc.color,fontWeight:700,marginTop:1}}>Best {lc.label}</p><p style={{fontSize:9,color:"#4b5563",marginTop:1}}>{lifts[lc.key]?.history?.length||0} sessions</p></div>)}
    </div>
    {LC.map(lc=><div key={lc.key} style={{...S.card,padding:20,marginBottom:14,transition:"border-color 0.3s",borderColor:saved[lc.key]?lc.color:"rgba(255,255,255,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:9,background:lc.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{lc.emoji}</div>
          <div><h3 style={{fontWeight:900,color:"white",fontSize:14}}>{lc.label}</h3><p style={{fontSize:10,color:"#6b7280",marginTop:1}}>{today}</p></div>
        </div>
        {lifts[lc.key]?.history?.length>0&&<div style={{textAlign:"right"}}><p style={{fontSize:10,color:"#6b7280"}}>Last</p><p style={{fontSize:13,fontWeight:700,color:"white"}}>{lifts[lc.key].history[lifts[lc.key].history.length-1]?.weight}kg</p></div>}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Field label="Weight" name="w" value={lifts[lc.key]?.w||""} onChange={e=>ch(lc.key,"w",e.target.value)} placeholder="100" type="number" unit="kg" min="0"/>
        <Field label="Sets" name="s" value={lifts[lc.key]?.s||""} onChange={e=>ch(lc.key,"s",e.target.value)} placeholder="4" type="number" min="1"/>
        <Field label="Reps" name="r" value={lifts[lc.key]?.r||""} onChange={e=>ch(lc.key,"r",e.target.value)} placeholder="8" type="number" min="1"/>
      </div>
      {lifts[lc.key]?.w&&lifts[lc.key]?.s&&lifts[lc.key]?.r&&<div style={{padding:"7px 12px",borderRadius:8,background:lc.color+"15",display:"inline-block",marginBottom:12}}><span style={{fontSize:12,color:lc.color,fontWeight:900}}>Volume: {(parseFloat(lifts[lc.key].w)||0)*(parseInt(lifts[lc.key].s)||0)*(parseInt(lifts[lc.key].r)||0)}kg</span></div>}
      <button onClick={()=>save(lc.key)} style={{padding:"9px 20px",borderRadius:9,fontWeight:900,fontSize:11,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",border:"none",transition:"all 0.2s",background:saved[lc.key]?lc.color:`linear-gradient(135deg,${lc.color},#06b6d4)`,color:"#000",boxShadow:saved[lc.key]?`0 0 14px ${lc.color}60`:"none"}}>{saved[lc.key]?"✓ Saved!":"Log Lift →"}</button>
      {lifts[lc.key]?.history?.length>1&&<div style={{marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.05)"}}><p style={{fontSize:10,color:"#6b7280",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Weight Progression</p><Spark data={lifts[lc.key].history} color={lc.color}/></div>}
      {lifts[lc.key]?.history?.length>0&&<div style={{marginTop:12}}><p style={{fontSize:10,color:"#6b7280",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Recent Sessions</p>{[...lifts[lc.key].history].reverse().slice(0,4).map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",marginBottom:4}}><span style={{fontSize:10,color:"#6b7280"}}>{e.date}</span><span style={{fontSize:11,fontWeight:700,color:"white"}}>{e.weight}kg × {e.sets}×{e.reps}</span><span style={{fontSize:10,color:lc.color,fontWeight:700}}>{e.weight*e.sets*e.reps}kg vol</span></div>)}</div>}
    </div>)}
  </div>;
}

// ── CARDIO PAGE ──
function CardioPage(){
  const{user,updateUser}=useAuth();
  const[form,setForm]=useState({type:"running",distance:"",duration:"",date:new Date().toISOString().split("T")[0]});
  const[saved,setSaved]=useState(false);
  const[sessions,setSessions]=useState(()=>user?.cardioSessions||[]);
  const bw=parseFloat(user?.weight)||70;
  const calcCal=(type,dur)=>Math.round((MET[type]||7)*bw*(parseFloat(dur)||0)/60);
  const calcPace=(dist,dur)=>{const k=parseFloat(dist),m=parseFloat(dur);if(!k||!m)return null;const pm=Math.floor(m/k);return`${pm}:${Math.round((m/k-pm)*60).toString().padStart(2,"0")} /km`;};
  const handleSave=()=>{
    if(!form.duration){alert("Enter duration.");return;}
    const cal=calcCal(form.type,form.duration);
    const s={...form,calories:cal,id:Date.now(),km:parseFloat(form.distance)||0};
    const upd=[s,...sessions].slice(0,50);
    setSessions(upd);
    updateUser({cardioSessions:upd,stats:{...user.stats,totalCaloriesBurned:Math.round(upd.reduce((a,x)=>a+(x.calories||0),0)),totalKmRun:Math.round(upd.reduce((a,x)=>a+(x.km||0),0)*10)/10}});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    setForm(f=>({...f,distance:"",duration:""}));
  };
  const prevCal=calcCal(form.type,form.duration);
  const prevPace=calcPace(form.distance,form.duration);
  const totCal=sessions.reduce((s,x)=>s+(x.calories||0),0);
  const totKm=sessions.reduce((s,x)=>s+(x.km||0),0);
  return<div style={{maxWidth:900,margin:"0 auto",padding:"28px 16px"}}>
    <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:42,letterSpacing:5,color:"#39ff14",textShadow:"0 0 20px #39ff1460",lineHeight:1,marginBottom:4}}>CARDIO TRACKER</h1>
    <p style={{color:"#6b7280",fontSize:12,marginBottom:20}}>Log runs, track calories burned, monitor progress</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}}>
      <SB emoji="🔥" value={totCal.toLocaleString()} label="Calories Burned" sub="All sessions" color="#f97316"/>
      <SB emoji="🏃" value={totKm.toFixed(1)+"km"} label="Total Distance" sub="All sessions" color="#39ff14"/>
      <SB emoji="📅" value={sessions.length} label="Sessions" sub="Logged" color="#06b6d4"/>
      <SB emoji="⚖️" value={(parseFloat(user?.weight)||70)+"kg"} label="Body Weight" sub="For calc" color="#8b5cf6"/>
    </div>
    {!user?.weight&&<div style={{padding:"9px 14px",borderRadius:9,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",marginBottom:14,fontSize:11,color:"#fbbf24"}}>⚠️ Set body weight in Profile for accurate calorie calculations. Using 70kg default.</div>}
    <div style={{...S.card,padding:20,marginBottom:16}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:15,marginBottom:4}}>Log Session</h3>
      <p style={{fontSize:11,color:"#6b7280",marginBottom:16}}>Track your workout and calories burned</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
        <div style={{flex:1,minWidth:160}}>
          <label style={{display:"block",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>Exercise Type</label>
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:"100%",padding:"9px 11px",borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:12,outline:"none",cursor:"pointer"}}>
            {EXERCISES.map(o=><option key={o.value} value={o.value} style={{background:"#0d1117"}}>{o.label}</option>)}
          </select>
        </div>
        <Field label="Distance" name="distance" value={form.distance} onChange={e=>setForm(f=>({...f,distance:e.target.value}))} placeholder="5.0" type="number" unit="km" min="0"/>
        <Field label="Duration" name="duration" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="30" type="number" unit="min" min="1"/>
        <Field label="Date" name="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} placeholder="" type="date"/>
      </div>
      {form.duration&&<div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{padding:"8px 14px",borderRadius:9,background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.25)"}}><span style={{fontSize:13,color:"#f97316",fontWeight:900}}>🔥 ~{prevCal} kcal</span><span style={{fontSize:10,color:"#6b7280",marginLeft:6}}>estimated burn</span></div>
        {prevPace&&<div style={{padding:"8px 14px",borderRadius:9,background:"rgba(57,255,20,0.1)",border:"1px solid rgba(57,255,20,0.2)"}}><span style={{fontSize:13,color:"#39ff14",fontWeight:900}}>⚡ {prevPace}</span><span style={{fontSize:10,color:"#6b7280",marginLeft:6}}>avg pace</span></div>}
      </div>}
      <Btn onClick={handleSave} style={saved?{background:"#39ff14",boxShadow:"0 0 14px #39ff1460"}:{}}>{saved?"✓ Session Logged!":"Log Session →"}</Btn>
    </div>
    {sessions.length>0&&<div style={{...S.card,padding:20}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:15,marginBottom:4}}>Session History</h3>
      <p style={{fontSize:11,color:"#6b7280",marginBottom:14}}>{sessions.length} sessions recorded</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sessions.slice(0,10).map(s=>{const opt=EXERCISES.find(o=>o.value===s.type);return<div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:9,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{opt?.label?.split(" ")[0]||"🏃"}</span><div><p style={{fontSize:11,fontWeight:700,color:"white",textTransform:"capitalize"}}>{s.type.replace("_"," ")}</p><p style={{fontSize:10,color:"#6b7280",marginTop:1}}>{s.date}</p></div></div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            {s.km>0&&<div style={{textAlign:"center"}}><p style={{fontSize:12,fontWeight:900,color:"white"}}>{s.km}km</p><p style={{fontSize:9,color:"#6b7280"}}>distance</p></div>}
            <div style={{textAlign:"center"}}><p style={{fontSize:12,fontWeight:900,color:"white"}}>{s.duration}min</p><p style={{fontSize:9,color:"#6b7280"}}>duration</p></div>
            <div style={{textAlign:"center"}}><p style={{fontSize:12,fontWeight:900,color:"#f97316"}}>{s.calories}kcal</p><p style={{fontSize:9,color:"#6b7280"}}>burned</p></div>
          </div>
        </div>;})}
      </div>
    </div>}
  </div>;
}

// ── WORKOUT LOG PAGE ──
function WorkoutPage(){
  const{user,updateUser}=useAuth();
  const[exs,setExs]=useState([{id:1,name:"",sets:"",reps:"",weight:"",notes:""}]);
  const[wName,setWName]=useState("");
  const[saved,setSaved]=useState(false);
  const[hist,setHist]=useState(()=>user?.workoutHistory||[]);
  const today=new Date().toLocaleDateString("en-IN");
  const addEx=()=>setExs(p=>[...p,{id:Date.now(),name:"",sets:"",reps:"",weight:"",notes:""}]);
  const remEx=(id)=>setExs(p=>p.filter(e=>e.id!==id));
  const updEx=(id,f,v)=>setExs(p=>p.map(e=>e.id===id?{...e,[f]:v}:e));
  const handleSave=()=>{
    const filled=exs.filter(e=>e.name.trim());
    if(!filled.length){alert("Add at least one exercise.");return;}
    const w={id:Date.now(),name:wName||`Workout ${today}`,date:today,exercises:filled};
    const upd=[w,...hist].slice(0,30);
    setHist(upd);updateUser({workoutHistory:upd,stats:{...user.stats,workouts:(user.stats?.workouts||0)+1}});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    setExs([{id:1,name:"",sets:"",reps:"",weight:"",notes:""}]);setWName("");
  };
  return<div style={{maxWidth:900,margin:"0 auto",padding:"28px 16px"}}>
    <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:42,letterSpacing:5,color:"#39ff14",textShadow:"0 0 20px #39ff1460",lineHeight:1,marginBottom:4}}>WORKOUT LOG</h1>
    <p style={{color:"#6b7280",fontSize:12,marginBottom:20}}>Log today's session — exercises, sets, reps, weight</p>
    <SB emoji="📋" value={hist.length} label="Workouts Logged" sub="Total sessions" color="#39ff14"/>
    <div style={{height:16}}/>
    <div style={{...S.card,padding:20,marginBottom:16}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:15,marginBottom:4}}>Today — {today}</h3>
      <p style={{fontSize:11,color:"#6b7280",marginBottom:14}}>Add your exercises below</p>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>Workout Name (optional)</label>
        <input value={wName} onChange={e=>setWName(e.target.value)} placeholder="e.g. Push Day, Leg Day, Full Body" style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
      </div>
      {exs.map((ex,idx)=><div key={ex.id} style={{borderRadius:11,border:"1px solid rgba(255,255,255,0.07)",padding:14,marginBottom:10,background:"rgba(255,255,255,0.02)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1}}>Exercise {idx+1}</span>
          {exs.length>1&&<button onClick={()=>remEx(ex.id)} style={{fontSize:10,color:"#6b7280",background:"none",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",padding:"2px 8px",borderRadius:6}}>Remove</button>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <div style={{flex:"1 1 180px"}}>
            <label style={{display:"block",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>Exercise Name</label>
            <input value={ex.name} onChange={e=>updEx(ex.id,"name",e.target.value)} placeholder="e.g. Incline Dumbbell Press" style={{width:"100%",padding:"9px 11px",borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <Field label="Sets" name="sets" value={ex.sets} onChange={e=>updEx(ex.id,"sets",e.target.value)} placeholder="4" type="number" min="1"/>
          <Field label="Reps" name="reps" value={ex.reps} onChange={e=>updEx(ex.id,"reps",e.target.value)} placeholder="10" type="number" min="1"/>
          <Field label="Weight" name="weight" value={ex.weight} onChange={e=>updEx(ex.id,"weight",e.target.value)} placeholder="60" type="number" unit="kg"/>
        </div>
        <div>
          <label style={{display:"block",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Notes</label>
          <input value={ex.notes} onChange={e=>updEx(ex.id,"notes",e.target.value)} placeholder="e.g. felt strong, increase next time" style={{width:"100%",padding:"7px 11px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",color:"white",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>)}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={addEx} style={{padding:"9px 16px",borderRadius:9,fontWeight:700,fontSize:11,cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"white"}}>+ Add Exercise</button>
        <Btn onClick={handleSave} style={saved?{background:"#39ff14"}:{}}>{saved?"✓ Saved!":"Save Workout →"}</Btn>
      </div>
    </div>
    {hist.length>0&&<div style={{...S.card,padding:20}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:15,marginBottom:4}}>History</h3>
      <p style={{fontSize:11,color:"#6b7280",marginBottom:14}}>{hist.length} workouts logged</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {hist.slice(0,8).map(w=><div key={w.id} style={{borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",padding:14,background:"rgba(255,255,255,0.02)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div><p style={{fontWeight:900,color:"white",fontSize:13}}>{w.name}</p><p style={{fontSize:10,color:"#6b7280",marginTop:1}}>{w.date} · {w.exercises.length} exercises</p></div>
            <span style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"rgba(57,255,20,0.1)",color:"#39ff14",border:"1px solid rgba(57,255,20,0.2)",fontWeight:700}}>✓ Done</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{w.exercises.filter(e=>e.name).map((e,i)=><span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:7,background:"rgba(255,255,255,0.05)",color:"#9ca3af",border:"1px solid rgba(255,255,255,0.07)"}}>{e.name}{e.weight?` ${e.weight}kg`:""}</span>)}</div>
        </div>)}
      </div>
    </div>}
  </div>;
}

// ── PROFILE PAGE ──
function ProfilePage(){
  const{user,updateUser}=useAuth();
  const[form,setForm]=useState({name:user?.name||"",phone:user?.phone||"",weight:user?.weight||"",height:user?.height||"",age:user?.age||""});
  const[saved,setSaved]=useState(false);
  const ch=(e)=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleSave=()=>{updateUser({...form,avatar:form.name.charAt(0).toUpperCase()});setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const bmi=form.weight&&form.height?(parseFloat(form.weight)/Math.pow(parseFloat(form.height)/100,2)).toFixed(1):null;
  const bmiLabel=bmi?bmi<18.5?"Underweight":bmi<25?"Normal ✅":bmi<30?"Overweight":"Obese":null;
  const bmiColor=bmi?bmi<18.5?"#06b6d4":bmi<25?"#39ff14":bmi<30?"#f97316":"#ef4444":"#6b7280";
  return<div style={{maxWidth:680,margin:"0 auto",padding:"28px 16px"}}>
    <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:42,letterSpacing:5,color:"#39ff14",textShadow:"0 0 20px #39ff1460",lineHeight:1,marginBottom:4}}>MY PROFILE</h1>
    <p style={{color:"#6b7280",fontSize:12,marginBottom:20}}>Update personal details and body stats</p>
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:18,borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",background:"linear-gradient(160deg,#0d1117,#0a0a1a)"}}>
      <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#39ff14,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000",fontSize:28,flexShrink:0}}>{form.name.charAt(0)||user?.avatar||"U"}</div>
      <div><p style={{fontWeight:900,color:"white",fontSize:17}}>{form.name||user?.name}</p><p style={{fontSize:11,color:"#6b7280",marginTop:2}}>{user?.email}</p><span style={{fontSize:10,padding:"2px 9px",borderRadius:999,background:"rgba(57,255,20,0.1)",color:"#39ff14",border:"1px solid rgba(57,255,20,0.2)",fontWeight:700,marginTop:5,display:"inline-block"}}>{user?.subscription?.plan||"Trial"} Plan</span></div>
    </div>
    <div style={{...S.card,padding:20,marginBottom:14}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:14,marginBottom:14}}>Personal Details</h3>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="Full Name" name="name" value={form.name} onChange={ch} placeholder="Your name"/>
        <Field label="Phone" name="phone" value={form.phone} onChange={ch} placeholder="9876543210" type="tel"/>
      </div>
    </div>
    <div style={{...S.card,padding:20,marginBottom:16}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:14,marginBottom:4}}>Body Stats</h3>
      <p style={{fontSize:11,color:"#6b7280",marginBottom:14}}>Used for accurate calorie calculations</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
        <Field label="Body Weight" name="weight" value={form.weight} onChange={ch} placeholder="75" type="number" unit="kg"/>
        <Field label="Height" name="height" value={form.height} onChange={ch} placeholder="175" type="number" unit="cm"/>
        <Field label="Age" name="age" value={form.age} onChange={ch} placeholder="25" type="number" unit="yrs"/>
      </div>
      {bmi&&<div style={{padding:"11px 14px",borderRadius:10,background:bmiColor+"15",border:`1px solid ${bmiColor}30`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>⚖️</span>
        <div><p style={{fontWeight:900,color:bmiColor,fontSize:16}}>BMI: {bmi} — {bmiLabel}</p><p style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{bmi<18.5?"Increase caloric intake":bmi<25?"Great! Keep it up":bmi<30?"More cardio recommended":"Consult a healthcare professional"}</p></div>
      </div>}
    </div>
    <Btn onClick={handleSave} style={{width:"100%",padding:14,fontSize:13,letterSpacing:2,...(saved?{background:"#39ff14",boxShadow:"0 0 18px #39ff1440"}:{})}}>{saved?"✓ Profile Saved!":"Save Profile →"}</Btn>
  </div>;
}

// ── PRODUCT CARD ──
function ProductCard({product:p}){
  const{addItem}=useCart();
  const[flash,setFlash]=useState(false);
  const add=()=>{addItem(p);setFlash(true);setTimeout(()=>setFlash(false),1200);};
  return<div style={{position:"relative",borderRadius:14,border:`1px solid ${flash?p.accent:"rgba(255,255,255,0.06)"}`,overflow:"hidden",transition:"all 0.3s",background:"#0d1117",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
    {p.badge&&<span style={{position:"absolute",top:10,right:10,fontSize:10,fontWeight:900,padding:"2px 7px",borderRadius:999,background:p.accent+"22",color:p.accent,border:`1px solid ${p.accent}44`,zIndex:1}}>{p.badge}</span>}
    <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50,background:`radial-gradient(circle at 50% 60%,${p.accent}18,transparent 70%)`}}><span style={{userSelect:"none"}}>{p.emoji}</span></div>
    <div style={{padding:14}}>
      <h3 style={{fontWeight:900,color:"white",fontSize:12}}>{p.name}</h3>
      <p style={{fontSize:10,marginTop:2,marginBottom:3,color:p.accent+"cc",fontWeight:600}}>{p.subtitle}</p>
      <p style={{fontSize:10,color:"#4b5563",marginBottom:10,lineHeight:1.5}}>{p.description}</p>
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {Object.entries(p.macros).map(([k,v])=><div key={k} style={{flex:1,textAlign:"center",borderRadius:7,padding:"4px 0",background:p.accent+"11"}}><div style={{fontSize:10,fontWeight:900,color:"white"}}>{v}</div><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color:p.accent+"99",marginTop:1}}>{k}</div></div>)}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><span style={{fontSize:16,fontWeight:900,color:"white"}}>₹{p.price}</span><span style={{fontSize:10,color:"#4b5563",textDecoration:"line-through",marginLeft:5}}>₹{p.originalPrice}</span><span style={{fontSize:10,fontWeight:700,marginLeft:4,color:"#39ff14"}}>{Math.round((1-p.price/p.originalPrice)*100)}% off</span></div>
        <button onClick={add} style={{padding:"6px 12px",borderRadius:9,fontSize:10,fontWeight:900,cursor:"pointer",transition:"all 0.2s",background:flash?p.accent:p.accent+"22",color:flash?"#000":p.accent,border:`1px solid ${p.accent}55`}}>{flash?"✓ Added!":"+ Cart"}</button>
      </div>
    </div>
  </div>;
}

// ── CART PANEL ──
function Cart(){
  const{items,cartOpen,setCartOpen,removeItem,updateQty,clearCart,subtotal,shipping,total}=useCart();
  const{user,addOrder}=useAuth();
  const[ps,setPs]=useState(null);
  const[fm,setFm]=useState("");
  const checkout=()=>{
    if(!user){alert("Please sign in first.");return;}
    if(!items.length)return;
    setPs("processing");
    pay({amount:total,user,items,
      onSuccess:(order)=>{addOrder(order);clearCart();setPs("success");setTimeout(()=>{setPs(null);setCartOpen(false);},3000);},
      onFailure:({reason})=>{setFm(reason);setPs("failed");setTimeout(()=>setPs(null),4000);},
    });
  };
  return<>
    <div onClick={()=>setCartOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",zIndex:40,opacity:cartOpen?1:0,pointerEvents:cartOpen?"auto":"none",transition:"opacity 0.3s"}}/>
    <div style={{position:"fixed",top:0,right:0,height:"100%",width:300,zIndex:50,display:"flex",flexDirection:"column",borderLeft:"1px solid rgba(255,255,255,0.05)",background:"linear-gradient(180deg,#0a0a12,#07070f)",transform:cartOpen?"translateX(0)":"translateX(100%)",transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)"}}>
      <div style={{padding:"16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><h2 style={{fontWeight:900,color:"white",fontSize:16}}>Cart</h2><p style={{fontSize:10,color:"#6b7280",marginTop:1}}>{items.length} item{items.length!==1?"s":""}</p></div>
        <button onClick={()=>setCartOpen(false)} style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:12}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:7}}>
        {items.length===0?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",textAlign:"center",padding:"28px 0"}}><span style={{fontSize:40,marginBottom:8}}>🛒</span><p style={{color:"#6b7280",fontWeight:700,fontSize:12}}>Cart is empty</p></div>
        :items.map(item=><div key={item.id} style={{display:"flex",alignItems:"center",gap:7,padding:9,borderRadius:9,border:"1px solid rgba(255,255,255,0.05)"}}>
          <span style={{fontSize:18,flexShrink:0}}>{item.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:10,fontWeight:900,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</p>
            <p style={{fontSize:10,color:item.accent,fontWeight:700,marginTop:1}}>₹{item.price}</p>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
              <button onClick={()=>updateQty(item.id,item.qty-1)} style={{width:16,height:16,borderRadius:3,background:"rgba(255,255,255,0.1)",border:"none",color:"white",cursor:"pointer",fontSize:10}}>−</button>
              <span style={{fontSize:10,fontWeight:700,color:"white",width:12,textAlign:"center"}}>{item.qty}</span>
              <button onClick={()=>updateQty(item.id,item.qty+1)} style={{width:16,height:16,borderRadius:3,background:"rgba(255,255,255,0.1)",border:"none",color:"white",cursor:"pointer",fontSize:10}}>+</button>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <p style={{fontSize:12,fontWeight:900,color:"white"}}>₹{item.price*item.qty}</p>
            <button onClick={()=>removeItem(item.id)} style={{fontSize:9,color:"#4b5563",background:"none",border:"none",cursor:"pointer",marginTop:1}}>remove</button>
          </div>
        </div>)}
      </div>
      <div style={{padding:12,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:"#9ca3af"}}>Subtotal</span><span style={{fontSize:11,fontWeight:700,color:"white"}}>₹{subtotal}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:"#9ca3af"}}>Shipping</span><span style={{fontSize:11,fontWeight:700,color:shipping===0?"#39ff14":"#f97316"}}>{shipping===0&&subtotal>0?"FREE 🎉":subtotal===0?"—":`₹${shipping}`}</span></div>
          <div style={{height:1,background:"rgba(255,255,255,0.05)",margin:"6px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:900,color:"white",fontSize:14}}>Total</span><span style={{fontWeight:900,color:"white",fontSize:16}}>₹{total}</span></div>
        </div>
        {ps==="success"&&<div style={{padding:9,borderRadius:9,textAlign:"center",fontSize:12,fontWeight:700,color:"#000",background:"linear-gradient(135deg,#39ff14,#06b6d4)",marginBottom:8}}>✅ Payment Successful!</div>}
        {ps==="failed"&&<div style={{padding:9,borderRadius:9,textAlign:"center",fontSize:10,color:"#fca5a5",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",marginBottom:8}}>❌ {fm}</div>}
        {ps!=="success"&&<button onClick={checkout} disabled={!items.length||ps==="processing"} style={{width:"100%",padding:"11px",borderRadius:9,fontWeight:900,fontSize:11,letterSpacing:2,textTransform:"uppercase",cursor:items.length&&ps!=="processing"?"pointer":"not-allowed",border:"none",background:items.length&&ps!=="processing"?"linear-gradient(135deg,#39ff14,#06b6d4)":"#1a1a2e",color:items.length&&ps!=="processing"?"#000":"#374151",transition:"all 0.2s"}}>{ps==="processing"?"⏳ Opening...":items.length?"Pay with Razorpay →":"Cart Empty"}</button>}
        {subtotal>0&&subtotal<=1500&&<p style={{textAlign:"center",fontSize:9,color:"#4b5563",marginTop:5}}>Add ₹{1500-subtotal} more for free shipping</p>}
      </div>
    </div>
  </>;
}

// ── FIX #3: NAVBAR — mobile-friendly with hamburger menu ──
function Navbar(){
  const navigate=useNavigate();
  const location=useLocation();
  const{user,logout}=useAuth();
  const{totalItems,setCartOpen}=useCart();
  const[menuOpen,setMenuOpen]=useState(false);
  const tabs=[{l:"📊 Dashboard",p:"/dashboard"},{l:"🏋️ Lifts",p:"/lifts"},{l:"🏃 Cardio",p:"/cardio"},{l:"📋 Workout",p:"/workout"},{l:"🛍 Store",p:"/store"},{l:"📦 Orders",p:"/orders"}];
  const go=(path)=>{navigate(path);setMenuOpen(false);};
  return<>
    <style>{`
      @media(min-width:768px){.nav-desktop{display:flex!important}.nav-hamburger{display:none!important}}
      @media(max-width:767px){.nav-desktop{display:none!important}.nav-hamburger{display:flex!important}}
      @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    `}</style>
    <nav style={{position:"sticky",top:0,zIndex:30,borderBottom:"1px solid rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",background:"rgba(7,7,15,0.95)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 14px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,gap:10}}>
        {/* Logo */}
        <button onClick={()=>go("/dashboard")} style={{display:"flex",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#39ff14,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000",fontSize:12}}>P</div>
          <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:4,color:"#39ff14"}}>PUMP<span style={{color:"white"}}>LAB</span></span>
        </button>
        {/* Desktop nav tabs */}
        <div className="nav-desktop" style={{display:"none",background:"rgba(255,255,255,0.04)",borderRadius:9,padding:3,border:"1px solid rgba(255,255,255,0.05)",overflowX:"auto",gap:1,flex:1,maxWidth:560}}>
          {tabs.map(t=><button key={t.p} onClick={()=>go(t.p)} style={{padding:"5px 9px",borderRadius:6,fontSize:10,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",border:"none",transition:"all 0.2s",background:location.pathname===t.p?"linear-gradient(135deg,#39ff14,#06b6d4)":"transparent",color:location.pathname===t.p?"#000":"#9ca3af"}}>{t.l}</button>)}
        </div>
        {/* Right side: cart + avatar + hamburger */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <button onClick={()=>setCartOpen(true)} style={{position:"relative",display:"flex",alignItems:"center",gap:4,padding:"6px 9px",borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>
            🛒<span className="nav-desktop" style={{display:"none"}}>Cart</span>
            {totalItems>0&&<span style={{position:"absolute",top:-5,right:-5,width:17,height:17,borderRadius:"50%",background:"#39ff14",color:"#000",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 7px #39ff1460"}}>{totalItems}</span>}
          </button>
          {user&&<button onClick={()=>go("/profile")} style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#39ff14,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000",fontSize:12,border:"none",cursor:"pointer",flexShrink:0}}>{user.avatar||user.name?.charAt(0)||"U"}</button>}
          {user&&<button onClick={()=>{logout();navigate("/auth");}} className="nav-desktop" style={{display:"none",fontSize:10,color:"#6b7280",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Out</button>}
          {/* Hamburger button */}
          <button className="nav-hamburger" onClick={()=>setMenuOpen(o=>!o)} style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:4,width:32,height:32,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,cursor:"pointer",padding:6}}>
            <span style={{width:14,height:2,background:menuOpen?"#39ff14":"#9ca3af",borderRadius:2,transition:"all 0.2s",transform:menuOpen?"rotate(45deg) translate(4px,4px)":"none"}}/>
            <span style={{width:14,height:2,background:menuOpen?"transparent":"#9ca3af",borderRadius:2,transition:"all 0.2s"}}/>
            <span style={{width:14,height:2,background:menuOpen?"#39ff14":"#9ca3af",borderRadius:2,transition:"all 0.2s",transform:menuOpen?"rotate(-45deg) translate(4px,-4px)":"none"}}/>
          </button>
        </div>
      </div>
      {/* Mobile dropdown menu */}
      {menuOpen&&<div style={{animation:"slideDown 0.2s ease",borderTop:"1px solid rgba(255,255,255,0.05)",padding:"8px 14px 12px",display:"flex",flexDirection:"column",gap:4}}>
        {tabs.map(t=><button key={t.p} onClick={()=>go(t.p)} style={{padding:"10px 12px",borderRadius:9,fontSize:12,fontWeight:700,textAlign:"left",cursor:"pointer",border:"none",background:location.pathname===t.p?"linear-gradient(135deg,#39ff14,#06b6d4)":"rgba(255,255,255,0.03)",color:location.pathname===t.p?"#000":"#9ca3af",borderLeft:location.pathname===t.p?"none":`3px solid rgba(255,255,255,0.05)`}}>{t.l}</button>)}
        {user&&<button onClick={()=>{logout();navigate("/auth");setMenuOpen(false);}} style={{padding:"10px 12px",borderRadius:9,fontSize:12,fontWeight:700,textAlign:"left",cursor:"pointer",border:"none",background:"rgba(239,68,68,0.08)",color:"#ef4444",borderLeft:"3px solid rgba(239,68,68,0.2)",marginTop:4}}>🚪 Sign Out</button>}
      </div>}
    </nav>
  </>;
}

// ── AUTH PAGE ──
function AuthPage(){
  const[mode,setMode]=useState("login");
  const[form,setForm]=useState({name:"",email:"",password:"",phone:""});
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);
  const[showPw,setShowPw]=useState(false);
  const[imgIdx,setImgIdx]=useState(0);
  const{login,register,loginWithGoogle}=useAuth();
  const navigate=useNavigate();
  useEffect(()=>{const t=setInterval(()=>setImgIdx(i=>(i+1)%PHOTOS.length),4000);return()=>clearInterval(t);},[]);
  const ch=(e)=>{setForm(f=>({...f,[e.target.name]:e.target.value}));setError("");};
  const submit=async(e)=>{
    e.preventDefault();setError("");setLoading(true);
    try{if(mode==="login")await login({email:form.email,password:form.password});else{if(!form.name.trim())throw new Error("Name is required.");if(form.password.length<6)throw new Error("Password must be at least 6 characters.");await register(form);}navigate("/dashboard");}
    catch(err){setError(err.message);}finally{setLoading(false);}
  };
  const handleGoogle=async(googleUser)=>{
    setError("");setLoading(true);
    try{await loginWithGoogle(googleUser);navigate("/dashboard");}
    catch(err){setError("Google sign-in failed: "+err.message);}
    finally{setLoading(false);}
  };
  const inp=(label,name,type,ph)=><div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>{label}</label>
    <div style={{position:"relative"}}>
      <input name={name} type={type==="password"&&showPw?"text":type} value={form[name]} onChange={ch} placeholder={ph} required style={{width:"100%",padding:"10px 13px",paddingRight:type==="password"?38:13,borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
      {type==="password"&&<button type="button" onClick={()=>setShowPw(s=>!s)} style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#6b7280"}}>{showPw?"🙈":"👁"}</button>}
    </div>
  </div>;
  return<div style={{minHeight:"100vh",display:"flex",background:"#07070f"}}>
    <div id="authLeft" style={{flex:1,display:"none",position:"relative",overflow:"hidden"}}>
      {PHOTOS.map((src,i)=><div key={i} style={{position:"absolute",inset:0,transition:"opacity 1s ease",opacity:i===imgIdx?1:0}}><img src={src} alt="gym" style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to right,transparent,#07070f)"}}/></div>)}
      <div style={{position:"absolute",bottom:36,left:36}}>
        <p style={{fontFamily:"'Bebas Neue',cursive",fontSize:48,color:"white",letterSpacing:4,lineHeight:1}}>FORGE YOUR</p>
        <p style={{fontFamily:"'Bebas Neue',cursive",fontSize:48,color:"#39ff14",letterSpacing:4,lineHeight:1,textShadow:"0 0 28px #39ff1460"}}>BEST SELF</p>
        <div style={{display:"flex",gap:6,marginTop:12}}>{PHOTOS.map((_,i)=><div key={i} style={{width:i===imgIdx?20:5,height:5,borderRadius:3,background:i===imgIdx?"#39ff14":"rgba(255,255,255,0.3)",transition:"all 0.4s"}}/>)}</div>
      </div>
    </div>
    <div style={{width:"100%",maxWidth:420,display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      <div style={{width:"100%",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:5}}>
            <div style={{width:38,height:38,borderRadius:9,background:"linear-gradient(135deg,#39ff14,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000",fontSize:17}}>P</div>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,letterSpacing:5,color:"#39ff14"}}>PUMP<span style={{color:"white"}}>LAB</span></span>
          </div>
          <p style={{color:"#6b7280",fontSize:12}}>Elite Gym & Supplement Platform</p>
        </div>
        <div style={{borderRadius:16,border:"1px solid rgba(255,255,255,0.1)",padding:24,background:"rgba(13,17,23,0.97)"}}>
          <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:9,padding:3,marginBottom:20}}>
            {["login","register"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"8px",borderRadius:6,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",transition:"all 0.2s",background:mode===m?"linear-gradient(135deg,#39ff14,#06b6d4)":"transparent",color:mode===m?"#000":"#6b7280"}}>{m==="login"?"Sign In":"Create Account"}</button>)}
          </div>
          {/* Google Sign-In button */}
          <div style={{marginBottom:16}}>
            <GoogleSignInButton onSuccess={handleGoogle} onError={setError}/>
            <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
              <span style={{fontSize:10,color:"#4b5563",fontWeight:700}}>OR</span>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
            </div>
          </div>
          <form onSubmit={submit}>
            {mode==="register"&&inp("Full Name","name","text","Arjun Sharma")}
            {inp("Email","email","email","you@example.com")}
            {mode==="register"&&inp("Phone","phone","tel","9876543210")}
            {inp("Password","password","password","••••••••")}
            {error&&<div style={{display:"flex",alignItems:"center",gap:6,padding:10,borderRadius:9,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5",fontSize:11,marginBottom:12}}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"12px",borderRadius:9,fontWeight:900,fontSize:12,letterSpacing:2,textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",border:"none",background:loading?"#1e293b":"linear-gradient(135deg,#39ff14,#06b6d4)",color:loading?"#6b7280":"#000",transition:"all 0.2s",marginTop:2}}>{loading?"Please wait...":mode==="login"?"Sign In →":"Create Account →"}</button>
          </form>
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.05)",textAlign:"center"}}>
            <button onClick={()=>{setForm({name:"Arjun Sharma",email:"demo@pumplab.com",password:"demo123",phone:"9876543210"});setError("");}} style={{fontSize:10,color:"#4b5563",background:"none",border:"none",cursor:"pointer"}}>Fill demo credentials</button>
          </div>
        </div>
      </div>
    </div>
    <style>{"#authLeft{display:none}@media(min-width:768px){#authLeft{display:block!important}}"}</style>
  </div>;
}

// ── DASHBOARD ──
function DashboardPage(){
  const{user}=useAuth();
  const navigate=useNavigate();
  const[showPlans,setShowPlans]=useState(false);
  const[heroImg,setHeroImg]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setHeroImg(i=>(i+1)%PHOTOS.length),5000);return()=>clearInterval(t);},[]);
  const bestSquat=user?.lifts?.squat?.history?.length?Math.max(...user.lifts.squat.history.map(e=>e.weight))+"kg":"—";
  const bestBench=user?.lifts?.bench?.history?.length?Math.max(...user.lifts.bench.history.map(e=>e.weight))+"kg":"—";
  const bestDead=user?.lifts?.deadlift?.history?.length?Math.max(...user.lifts.deadlift.history.map(e=>e.weight))+"kg":"—";
  const quickNav=[{l:"Log Lifts",i:"🏋️",p:"/lifts",c:"#39ff14"},{l:"Log Cardio",i:"🏃",p:"/cardio",c:"#f97316"},{l:"Log Workout",i:"📋",p:"/workout",c:"#06b6d4"},{l:"My Profile",i:"👤",p:"/profile",c:"#8b5cf6"},{l:"Store",i:"🛍",p:"/store",c:"#ec4899"}];
  return<div style={{maxWidth:1152,margin:"0 auto",padding:"28px 16px"}}>
    <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}"}</style>
    <div style={{borderRadius:18,overflow:"hidden",position:"relative",height:180,marginBottom:18}}>
      {PHOTOS.map((src,i)=><div key={i} style={{position:"absolute",inset:0,transition:"opacity 1.2s ease",opacity:i===heroImg?1:0}}><img src={src} alt="gym" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,15,0.92),rgba(7,7,15,0.4),rgba(7,7,15,0.7))"}}/>
      <div style={{position:"absolute",inset:0,padding:"24px 28px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <p style={{fontSize:10,color:"#39ff14",fontWeight:700,letterSpacing:4,textTransform:"uppercase",marginBottom:5,animation:"pulse 2s infinite"}}>● Live Training</p>
        <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:34,color:"white",letterSpacing:4,lineHeight:1,marginBottom:5}}>WELCOME BACK, <span style={{color:"#39ff14"}}>{user?.name?.split(" ")[0]?.toUpperCase()||"ATHLETE"}</span></h1>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Keep pushing. Your next PR is waiting. 💪</p>
      </div>
      <div style={{position:"absolute",bottom:12,right:14,display:"flex",gap:4}}>{PHOTOS.map((_,i)=><div key={i} onClick={()=>setHeroImg(i)} style={{width:i===heroImg?16:5,height:5,borderRadius:3,background:i===heroImg?"#39ff14":"rgba(255,255,255,0.3)",transition:"all 0.4s",cursor:"pointer"}}/>)}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:18}}>
      {quickNav.map(q=><button key={q.p} onClick={()=>navigate(q.p)} style={{padding:"12px 8px",borderRadius:12,border:`1px solid ${q.c}30`,background:q.c+"10",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.borderColor=q.c+"60";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=q.c+"30";}}><span style={{fontSize:22}}>{q.i}</span><span style={{fontSize:10,fontWeight:700,color:q.c}}>{q.l}</span></button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:18,marginBottom:18}}>
      <div style={{...S.card}}>
        <div style={{height:80,background:"linear-gradient(135deg,#39ff1420,#06b6d420)",position:"relative"}}>
          <div style={{position:"absolute",inset:0,opacity:0.07,backgroundImage:"repeating-linear-gradient(45deg,#39ff14 0,#39ff14 1px,transparent 0,transparent 50%)",backgroundSize:"8px 8px"}}/>
          <div style={{position:"absolute",bottom:-34,left:18}}><div style={{width:68,height:68,borderRadius:14,border:"4px solid #07070f",background:"linear-gradient(135deg,#39ff14,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000",fontSize:24}}>{user?.avatar||user?.name?.charAt(0)||"U"}</div></div>
        </div>
        <div style={{padding:"44px 18px 18px"}}>
          <h2 style={{fontWeight:900,color:"white",fontSize:17}}>{user?.name||"Athlete"}</h2>
          <p style={{fontSize:10,color:"#6b7280",marginTop:1}}>{user?.email}</p>
          {user?.weight&&<p style={{fontSize:10,color:"#9ca3af",marginTop:3}}>{user.weight}kg · {user.height||"—"}cm · Age {user.age||"—"}</p>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginTop:14}}>
            {[["Squat",bestSquat],["Bench",bestBench],["Deadlift",bestDead]].map(([l,v])=><div key={l} style={{borderRadius:9,padding:"6px 0",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",textAlign:"center"}}><div style={{fontSize:12,fontWeight:900,color:"white"}}>{v}</div><div style={{fontSize:8,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginTop:1}}>{l}</div></div>)}
          </div>
        </div>
      </div>
      <div style={{...S.card,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,boxShadow:"0 0 0 1px #39ff1415,inset 0 0 24px #39ff1406"}}>
        <p style={{fontSize:9,fontWeight:900,letterSpacing:3,textTransform:"uppercase",color:"#6b7280",marginBottom:12}}>Subscription Renewal</p>
        <Countdown days={user?.subscription?.renewalDays||14}/>
        <div style={{marginTop:7,padding:"3px 10px",borderRadius:999,background:"rgba(57,255,20,0.1)",border:"1px solid rgba(57,255,20,0.2)"}}><span style={{fontSize:10,color:"#39ff14",fontWeight:700}}>{user?.subscription?.plan||"Trial"} Plan</span></div>
        <button onClick={()=>setShowPlans(true)} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:9,fontWeight:900,fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",border:"none",background:"linear-gradient(135deg,#39ff14,#06b6d4)",color:"#000",boxShadow:"0 0 14px #39ff1430",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>🚀 Renew / Upgrade</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <SB emoji="🔥" value={user?.stats?.workouts||0} label="Workouts" sub="Logged" color="#f97316"/>
        <SB emoji="🏆" value={user?.stats?.prs||0} label="PRs" sub="Lifetime" color="#39ff14"/>
        <SB emoji="🏃" value={(user?.stats?.totalKmRun||0)+"km"} label="Distance" sub="All cardio" color="#06b6d4"/>
        <SB emoji="⚡" value={(user?.stats?.totalCaloriesBurned||0).toLocaleString()} label="kcal Burned" sub="All sessions" color="#eab308"/>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
      {PHOTOS.map((src,i)=><div key={i} style={{borderRadius:10,overflow:"hidden",height:80,position:"relative"}}><img src={src} alt="gym" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(7,7,15,0.5),transparent)"}}/></div>)}
    </div>
    {showPlans&&<SubModal onClose={()=>setShowPlans(false)}/>}
  </div>;
}

// ── FIX #5: STORE PAGE — products fetched from Open Food Facts API ──
function StorePage(){
  const[search,setSearch]=useState("");
  const[sort,setSort]=useState("default");
  const[products,setProducts]=useState(FALLBACK_PRODUCTS);
  const[apiStatus,setApiStatus]=useState("loading"); // loading | success | error
  useEffect(()=>{
    setApiStatus("loading");
    // Open Food Facts — free, no key needed, fetches sports/fitness nutrition products
    fetch("https://world.openfoodfacts.org/cgi/search.pl?search_terms=protein+supplement&search_simple=1&action=process&json=1&page_size=12&fields=id,product_name,abbreviated_product_name,brands,generic_name,ingredients_text,quantity,nutriments,image_url")
      .then(r=>{if(!r.ok)throw new Error("API error");return r.json();})
      .then(data=>{
        const valid=(data.products||[]).filter(p=>p.product_name&&p.product_name.trim().length>2);
        if(valid.length>=4){setProducts(mapApiProducts(valid));setApiStatus("success");}
        else{setProducts(FALLBACK_PRODUCTS);setApiStatus("error");}
      })
      .catch(()=>{setProducts(FALLBACK_PRODUCTS);setApiStatus("error");});
  },[]);
  const filtered=products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==="price-asc"?a.price-b.price:sort==="price-desc"?b.price-a.price:0);
  return<div style={{maxWidth:1152,margin:"0 auto",padding:"28px 16px"}}>
    <div style={{borderRadius:16,overflow:"hidden",position:"relative",height:140,marginBottom:24}}>
      <img src={PHOTOS[2]} alt="store" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.45}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(7,7,15,0.95),rgba(7,7,15,0.4))"}}/>
      <div style={{position:"absolute",inset:0,padding:"0 26px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:40,letterSpacing:5,color:"#39ff14",textShadow:"0 0 20px #39ff1460",lineHeight:1}}>SUPPLEMENT STORE</h1>
        <p style={{color:"rgba(255,255,255,0.45)",fontSize:11,marginTop:3}}>
          {apiStatus==="loading"?"⏳ Fetching latest products...":apiStatus==="success"?`✅ ${products.length} live products · Free shipping over ₹1,500`:`${products.length} products · Free shipping over ₹1,500`}
        </p>
      </div>
    </div>
    <div style={{display:"flex",gap:9,marginBottom:20,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:1,minWidth:160}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#6b7280",fontSize:12}}>🔍</span><input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",paddingLeft:32,paddingRight:11,paddingTop:8,paddingBottom:8,borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white",fontSize:11,outline:"none",boxSizing:"border-box"}}/></div>
      <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"8px 11px",borderRadius:9,background:"#0d1117",border:"1px solid rgba(255,255,255,0.1)",color:"#d1d5db",fontSize:11,outline:"none",cursor:"pointer"}}><option value="default">Sort: Default</option><option value="price-asc">Price: Low → High</option><option value="price-desc">Price: High → Low</option></select>
    </div>
    {apiStatus==="loading"?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>
      {[1,2,3,4,5,6].map(i=><div key={i} style={{borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",background:"#0d1117",height:280,overflow:"hidden",position:"relative"}}><div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)",animation:"shimmer 1.5s infinite"}} /></div>)}
      <style>{"@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}"}</style>
    </div>
    :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
  </div>;
}

// ── ORDERS PAGE ──
function OrdersPage(){
  const{user}=useAuth();
  const navigate=useNavigate();
  const orders=user?.orders||[];
  return<div style={{maxWidth:900,margin:"0 auto",padding:"28px 16px"}}>
    <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:42,letterSpacing:5,color:"#39ff14",textShadow:"0 0 20px #39ff1460",lineHeight:1,marginBottom:4}}>MY ORDERS</h1>
    <p style={{color:"#6b7280",fontSize:12,marginBottom:20}}>{orders.length} order{orders.length!==1?"s":""} placed</p>
    {orders.length===0?<div style={{borderRadius:16,border:"1px solid rgba(255,255,255,0.05)",padding:"60px 24px",textAlign:"center",background:"linear-gradient(160deg,#0d1117,#0a0a1a)"}}><p style={{fontSize:48,marginBottom:8}}>📦</p><p style={{fontWeight:900,color:"white",fontSize:16}}>No orders yet</p><button onClick={()=>navigate("/store")} style={{marginTop:16,padding:"10px 24px",borderRadius:9,fontWeight:900,fontSize:11,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",border:"none",background:"linear-gradient(135deg,#39ff14,#06b6d4)",color:"#000"}}>Shop Now →</button></div>
    :<div style={{display:"flex",flexDirection:"column",gap:12}}>
      {[...orders].reverse().map(order=><div key={order.id} style={{borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:16,background:"linear-gradient(160deg,#0d1117,#0a0a1a)"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:10}}>
          <div><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontSize:10,fontWeight:900,color:"white",fontFamily:"monospace"}}>{order.paymentId||order.id}</span><span style={{fontSize:9,padding:"2px 6px",borderRadius:999,fontWeight:700,background:"#39ff1422",color:"#39ff14",border:"1px solid #39ff1444"}}>✓ {order.status}</span>{order.type==="subscription"&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:999,fontWeight:700,background:"#06b6d422",color:"#06b6d4",border:"1px solid #06b6d444"}}>📋 {order.plan}</span>}</div><p style={{fontSize:10,color:"#6b7280",marginTop:2}}>{new Date(order.date).toLocaleString("en-IN")}</p></div>
          <p style={{fontSize:18,fontWeight:900,color:"white"}}>₹{order.amount}</p>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{order.items?.map(item=><div key={item.id} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:7,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}><span style={{fontSize:12}}>{item.emoji}</span><span style={{fontSize:10,color:"#d1d5db",fontWeight:700}}>{item.name}</span><span style={{fontSize:9,color:"#6b7280"}}>×{item.qty}</span></div>)}</div>
      </div>)}
    </div>}
  </div>;
}

// ── APP ROOT ──
function AppLayout({children}){
  return<div style={{minHeight:"100vh",background:"#07070f",fontFamily:"'DM Sans',system-ui,sans-serif"}}><Navbar/><main>{children}</main><Cart/></div>;
}

export default function App(){
  return<AuthProvider><CartProvider><BrowserRouter><Routes>
    <Route path="/auth" element={<AuthPage/>}/>
    <Route path="/dashboard" element={<Guard><AppLayout><DashboardPage/></AppLayout></Guard>}/>
    <Route path="/lifts" element={<Guard><AppLayout><LiftsPage/></AppLayout></Guard>}/>
    <Route path="/cardio" element={<Guard><AppLayout><CardioPage/></AppLayout></Guard>}/>
    <Route path="/workout" element={<Guard><AppLayout><WorkoutPage/></AppLayout></Guard>}/>
    <Route path="/store" element={<Guard><AppLayout><StorePage/></AppLayout></Guard>}/>
    <Route path="/orders" element={<Guard><AppLayout><OrdersPage/></AppLayout></Guard>}/>
    <Route path="/profile" element={<Guard><AppLayout><ProfilePage/></AppLayout></Guard>}/>
    <Route path="*" element={<Navigate to="/auth" replace/>}/>
  </Routes></BrowserRouter></CartProvider></AuthProvider>;
}
