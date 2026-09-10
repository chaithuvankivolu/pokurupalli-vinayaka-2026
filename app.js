const SUPABASE_URL = "https://zafgfjsdzfknqljjbumv.supabase.co";
const SUPABASE_KEY = "sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateText(v){if(!v)return ""; return new Date(v+"T00:00:00").toLocaleDateString("te-IN",{day:"numeric",month:"long",year:"numeric"})}
async function loadHome(){
  const today=new Date().toISOString().slice(0,10);
  const [ev,do_,ph]=await Promise.all([
    db.from("events").select("*").eq("event_date",today).order("start_time",{ascending:true}),
    db.from("donors").select("*").order("created_at",{ascending:false}),
    db.from("photos").select("*").eq("status","approved").order("created_at",{ascending:false})
  ]);
  const e=document.querySelector("#todayEvents");
  e.innerHTML=ev.data?.length?ev.data.map(x=>`<article class="card"><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p><b>${x.start_time?x.start_time.slice(0,5):""}${x.end_time?" - "+x.end_time.slice(0,5):""}</b><p>📍 ${esc(x.location||"")}</p></article>`).join(""):'<p class="muted">ఈ రోజు కార్యక్రమాలు ఇంకా జోడించలేదు.</p>';
  document.querySelector("#donorsList").innerHTML=do_.data?.length?do_.data.map(x=>`<div class="donor"><b>${x.is_anonymous?"అనామక దాత":esc(x.name)}</b>${x.amount!=null?`<br>₹${Number(x.amount).toLocaleString("en-IN")}`:""}</div>`).join(""):'<p class="muted">దాతల వివరాలు త్వరలో.</p>';
  document.querySelector("#galleryGrid").innerHTML=ph.data?.length?ph.data.map(x=>`<figure><img loading="lazy" src="${esc(x.image_url)}" alt="${esc(x.title||"ఉత్సవ ఫోటో")}"><figcaption>${esc(x.title||"")}</figcaption></figure>`).join(""):'<p class="muted">ఆమోదించిన ఫోటోలు త్వరలో ఇక్కడ కనిపిస్తాయి.</p>';
}
document.querySelector("#uploadForm").addEventListener("submit",async e=>{
 e.preventDefault(); const msg=document.querySelector("#uploadMsg"); const file=document.querySelector("#photoFile").files[0];
 if(!file)return; if(file.size>8*1024*1024){msg.textContent="ఫోటో 8MB కంటే తక్కువగా ఉండాలి.";return}
 msg.textContent="అప్లోడ్ అవుతోంది...";
 const ext=file.name.split(".").pop().toLowerCase(); const path=`public/${crypto.randomUUID()}.${ext}`;
 const up=await db.storage.from("ganesh-photos").upload(path,file,{contentType:file.type});
 if(up.error){msg.textContent="అప్లోడ్ విఫలమైంది: "+up.error.message;return}
 const pub=db.storage.from("ganesh-photos").getPublicUrl(path).data.publicUrl;
 const ins=await db.from("photos").insert({image_url:pub,title:document.querySelector("#photoTitle").value.trim(),uploaded_by:document.querySelector("#photoName").value.trim(),status:"pending"});
 if(ins.error){msg.textContent="ఫోటో సేవ్ కాలేదు: "+ins.error.message;return}
 msg.textContent="ధన్యవాదాలు! మీ ఫోటో అడ్మిన్ ఆమోదం కోసం పంపబడింది.";
 e.target.reset();
});
loadHome();
