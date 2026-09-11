const SUPABASE_URL="https://zafgfjsdzfknqljjbumv.supabase.co",SUPABASE_KEY="sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});
const festivalTarget=new Date("2026-09-14T00:00:00+05:30").getTime();
function countdown(){let d=Math.max(0,festivalTarget-Date.now());days.textContent=String(Math.floor(d/86400000)).padStart(2,"0");hours.textContent=String(Math.floor(d%86400000/3600000)).padStart(2,"0");minutes.textContent=String(Math.floor(d%3600000/60000)).padStart(2,"0");seconds.textContent=String(Math.floor(d%60000/1000)).padStart(2,"0")}
setInterval(countdown,1000);countdown();

async function loadHome(){
 const today=new Date().toISOString().slice(0,10);
 const [ev,do_,ph,pd,allEv,ann]=await Promise.all([
  db.from("events").select("*").eq("event_date",today).order("start_time"),
  db.from("donors").select("*").order("created_at",{ascending:false}),
  db.from("photos").select("*").eq("status","approved").order("created_at",{ascending:false}).limit(8),
  db.from("program_donors").select("*").order("program_name").order("created_at"),
  db.from("events").select("*").order("event_date").order("start_time"),
  db.from("announcements").select("*").order("created_at",{ascending:false}).limit(5)
 ]);
 const events=ev.data||[],donors=do_.data||[],photos=ph.data||[],programDonors=pd.data||[],schedule=allEv.data||[],anns=ann.data||[];
 const total=donors.reduce((s,x)=>s+(Number(x.amount)||0),0);
 document.getElementById("totalDonations").textContent=money(total);
 document.getElementById("totalDonors").textContent=donors.length;
 document.getElementById("donationProgressText").textContent=money(total)+" collected";
 document.getElementById("progressBar").style.width=Math.min(100,total/150000*100)+"%";
 document.getElementById("todayEvents").innerHTML=events.length?events.map(x=>`<div class="today-row"><div><b>${esc(x.title)}</b><span>${esc(x.description||"")}</span></div><strong>${x.start_time?x.start_time.slice(0,5):""}${x.end_time?" – "+x.end_time.slice(0,5):""}</strong></div>`).join(""):'<p class="muted">No events scheduled for today.</p>';
 const future=schedule.filter(x=>x.event_date>=today).slice(0,4);
 document.getElementById("upcomingEvents").innerHTML=future.length?future.map((x,i)=>`<article class="event-card"><div class="event-day">DAY ${i+1}<b>${new Date(x.event_date+"T00:00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric"})}</b></div><div class="event-image">🪔</div><div class="event-body"><h3>${esc(x.title)}</h3><b>${x.start_time?x.start_time.slice(0,5):""}${x.end_time?" – "+x.end_time.slice(0,5):""}</b><p>${esc(x.description||"")}</p><small>📍 ${esc(x.location||"")}</small></div></article>`).join(""):'<p class="muted">Add fixed-date events from the admin dashboard.</p>';
 document.getElementById("programDonorsList").innerHTML=programDonors.length?programDonors.map(x=>`<div class="program-card"><span>${esc(x.program_name)}</span><b>${x.is_anonymous?"Anonymous Donor":esc(x.donor_name)}</b></div>`).join(""):'<p class="muted">Program donors will appear here.</p>';
 document.getElementById("galleryGrid").innerHTML=photos.length?photos.map(x=>`<figure><img loading="lazy" src="${esc(x.image_url)}" alt="${esc(x.title||"Festival photo")}"><figcaption>${esc(x.title||"Festival photo")}</figcaption></figure>`).join("")+'<a class="upload-tile" href="#upload"><span>📷</span><b>Share your moments</b><small>Upload Photo</small></a>':document.getElementById("galleryGrid").innerHTML;
 document.getElementById("announcementList").innerHTML=anns.length?anns.map(x=>`<div class="announcement-row"><span>•</span><div><b>${esc(x.title)}</b><p>${esc(x.message||"")}</p></div><span>→</span></div>`).join(""):'<p class="muted">No announcements yet.</p>';
}
document.getElementById("uploadForm").addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("uploadMsg"),file=document.getElementById("photoFile").files[0];if(!file)return;if(file.size>8*1024*1024){msg.textContent="Please keep the photo below 8MB.";return}msg.textContent="Uploading…";const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=`public/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from("ganesh-photos").upload(path,file,{contentType:file.type});if(up.error){msg.textContent="Upload failed: "+up.error.message;return}const url=db.storage.from("ganesh-photos").getPublicUrl(path).data.publicUrl;const ins=await db.from("photos").insert({image_url:url,title:document.getElementById("photoTitle").value.trim(),uploaded_by:document.getElementById("photoName").value.trim(),status:"pending"});if(ins.error){msg.textContent="Could not submit photo: "+ins.error.message;return}msg.textContent="Thank you! Your photo was submitted for admin approval.";e.target.reset()});
loadHome();