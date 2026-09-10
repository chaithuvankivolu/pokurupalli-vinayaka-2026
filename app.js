const SUPABASE_URL="https://zafgfjsdzfknqljjbumv.supabase.co",SUPABASE_KEY="sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function loadHome(){
 const today=new Date().toISOString().slice(0,10);
 const [ev,do_,ph,pd,allEv]=await Promise.all([
  db.from("events").select("*").eq("event_date",today).order("start_time"),
  db.from("donors").select("*").order("created_at",{ascending:false}),
  db.from("photos").select("*").eq("status","approved").order("created_at",{ascending:false}),
  db.from("program_donors").select("*").order("program_name",{ascending:true}).order("created_at",{ascending:true}),
  db.from("events").select("*").order("event_date",{ascending:true}).order("start_time",{ascending:true})
 ]);
 const donors=do_.data||[],events=ev.data||[],photos=ph.data||[],programDonors=pd.data||[],schedule=allEv.data||[];
 const total=donors.reduce((s,x)=>s+(Number(x.amount)||0),0);
 totalDonations.textContent="₹"+total.toLocaleString("en-IN",{maximumFractionDigits:2});
 totalDonors.textContent=donors.length;eventCount.textContent=events.length;
 todayEvents.innerHTML=events.length?events.map(x=>`<article class="card"><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p><div class="meta">🕒 ${x.start_time?x.start_time.slice(0,5):""}${x.end_time?" – "+x.end_time.slice(0,5):""} &nbsp; 📍 ${esc(x.location||"")}</div></article>`).join(""):'<p class="muted">No events have been added for today yet.</p>';
 programDonorsList.innerHTML=programDonors.length?programDonors.map(x=>`<div class="program-donor"><span class="program">${esc(x.program_name)}</span><b>${x.is_anonymous?"Anonymous Donor":esc(x.donor_name)}</b></div>`).join(""):'<p class="muted">Program donors will appear here.</p>';
 const grouped={}; schedule.forEach(x=>(grouped[x.event_date]??=[]).push(x));
 scheduleList.innerHTML=schedule.length?Object.entries(grouped).map(([date,items])=>`<div class="schedule-day"><h3>${new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</h3>${items.map(x=>`<div class="schedule-item"><div><b>${esc(x.title)}</b><p>${esc(x.description||"")}</p></div><div class="schedule-meta">🕒 ${x.start_time?x.start_time.slice(0,5):""}${x.end_time?" – "+x.end_time.slice(0,5):""}<br>📍 ${esc(x.location||"")}</div></div>`).join("")}</div>`).join(""):'<p class="muted">The festival schedule will be published here.</p>';
 donorsList.innerHTML=donors.length?donors.map(x=>`<div class="donor"><b>${x.is_anonymous?"Anonymous Donor":esc(x.name)}</b>${x.amount!=null?`<span class="muted">₹${Number(x.amount).toLocaleString("en-IN")}</span>`:""}</div>`).join(""):'<p class="muted">Donor details will appear here.</p>';
 galleryGrid.innerHTML=photos.length?photos.map(x=>`<figure><img loading="lazy" src="${esc(x.image_url)}" alt="${esc(x.title||"Festival photo")}"><figcaption>${esc(x.title||"Festival photo")}</figcaption></figure>`).join(""):'<p class="muted">Approved festival photos will appear here.</p>';
}
document.querySelector("#uploadForm").addEventListener("submit",async e=>{e.preventDefault();const msg=document.querySelector("#uploadMsg"),file=document.querySelector("#photoFile").files[0];if(!file)return;if(file.size>8*1024*1024){msg.textContent="Please keep the photo below 8MB.";return}msg.textContent="Uploading…";const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=`public/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from("ganesh-photos").upload(path,file,{contentType:file.type});if(up.error){msg.textContent="Upload failed: "+up.error.message;return}const url=db.storage.from("ganesh-photos").getPublicUrl(path).data.publicUrl;const ins=await db.from("photos").insert({image_url:url,title:document.querySelector("#photoTitle").value.trim(),uploaded_by:document.querySelector("#photoName").value.trim(),status:"pending"});if(ins.error){msg.textContent="Could not submit photo: "+ins.error.message;return}msg.textContent="Thank you! Your photo was submitted for admin approval.";e.target.reset()});
loadHome();