const SUPABASE_URL="https://zafgfjsdzfknqljjbumv.supabase.co",SUPABASE_KEY="sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});
const festivalDate="2026-09-14";
const festivalStart=new Date("2026-09-14T00:00:00+05:30");
const eventImages={
  "Ganesh Pooja":"lord-ganesh.jpg","Pooja":"lord-ganesh.jpg","Anna Prasadam":"anna-prasadam.svg","Homam":"homam.svg",
  "Culturals & Games":"culturals-games.svg","Utti":"utti.svg","Laddu & Money Auction":"laddu-auction.svg","Ganesh Visarjan":"visarjan.svg"
};
const eventIcons={"Ganesh Pooja":"🪔","Pooja":"🪔","Anna Prasadam":"🍚","Homam":"🔥","Culturals & Games":"🎭","Utti":"🪢","Laddu & Money Auction":"🏆","Ganesh Visarjan":"🙏"};
function indiaDate(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
function countdown(){const el={days:document.getElementById("days"),hours:document.getElementById("hours"),minutes:document.getElementById("minutes"),seconds:document.getElementById("seconds")}; if(!el.days)return;let d=Math.max(0,new Date("2026-09-14T00:00:00+05:30").getTime()-Date.now());el.days.textContent=String(Math.floor(d/86400000)).padStart(2,"0");el.hours.textContent=String(Math.floor(d%86400000/3600000)).padStart(2,"0");el.minutes.textContent=String(Math.floor(d%3600000/60000)).padStart(2,"0");el.seconds.textContent=String(Math.floor(d%60000/1000)).padStart(2,"0")}
setInterval(countdown,1000);countdown();
function dayNumber(date){return Math.max(1,Math.floor((new Date(date+"T00:00:00+05:30")-festivalStart)/86400000)+1)}
function timeRange(x){return `${x.start_time?x.start_time.slice(0,5):""}${x.end_time?" – "+x.end_time.slice(0,5):""}`}
function eventCard(x){const img=eventImages[x.title],icon=eventIcons[x.title]||"🪔";return `<article class="event-card"><div class="event-image">${img?`<img loading="lazy" src="${img}" alt="${esc(x.title)}">`:`<span>${icon}</span>`}<span class="event-icon-badge">${icon}</span></div><div class="event-body"><h3>${esc(x.title)}</h3><b>${timeRange(x)}</b><p>${esc(x.description||"")}</p><small>📍 ${esc(x.location||"")}</small></div></article>`}
function dayGroup(date,items){const d=new Date(date+"T00:00:00+05:30");const day=dayNumber(date);const dateText=d.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"});const label=day===1?"Ganesh Chaturthi":day===3?"Ganesh Visarjan Day":"Festival Celebrations";return `<section class="schedule-day"><div class="schedule-day-head"><div><span>DAY ${day}</span><h3>${dateText}</h3></div><b>${label}</b></div><div class="event-grid">${items.map(eventCard).join("")}</div></section>`}
function groupedSchedule(items){const groups={};items.forEach(x=>(groups[x.event_date]??=[]).push(x));return Object.keys(groups).sort().map(date=>dayGroup(date,groups[date])).join("")}
async function loadHome(){
 try{
  const today=indiaDate();
  const results=await Promise.all([
   db.from("events").select("*").order("event_date").order("start_time"),
   db.from("donors").select("*").order("created_at",{ascending:false}),
   db.from("photos").select("*").eq("status","approved").order("created_at",{ascending:false}).limit(8),
   db.from("program_donors").select("*").order("program_name").order("created_at"),
   db.from("announcements").select("*").order("created_at",{ascending:false}).limit(5)
  ]);
  const [ev,do_,ph,pd,ann]=results;
  const firstError=results.find(r=>r.error)?.error;
  if(firstError) console.error("Supabase load error:",firstError);
  const schedule=ev.data||[],donors=do_.data||[],photos=ph.data||[],programDonors=pd.data||[],anns=ann.data||[];
  const total=donors.reduce((s,x)=>s+(Number(x.amount)||0),0);
  const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value};
  set("totalDonations",money(total));set("totalDonors",donors.length);set("donationProgressText",money(total)+" collected");
  const progress=document.getElementById("progressBar");if(progress)progress.style.width=Math.min(100,total/150000*100)+"%";
  const todayEvents=schedule.filter(x=>x.event_date===today);
  const todayEl=document.getElementById("todayEvents");
  if(todayEl) todayEl.innerHTML=todayEvents.length?`<div class="today-day-title">DAY ${dayNumber(today)} · ${new Date(today+"T00:00:00+05:30").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"})}</div>`+todayEvents.map(x=>`<div class="today-row"><div class="today-event-main"><span class="today-event-icon">${eventIcons[x.title]||"🪔"}</span><div><b>${esc(x.title)}</b><span>${esc(x.description||"")}</span></div></div><strong>${timeRange(x)}</strong></div>`).join(""):'<p class="muted">No events scheduled for today.</p>';
  const future=schedule.filter(x=>x.event_date>=today);
  const upcoming=document.getElementById("upcomingEvents");
  if(upcoming) upcoming.innerHTML=future.length?groupedSchedule(future):'<p class="muted">No upcoming events scheduled.</p>';
  const pdEl=document.getElementById("programDonorsList");if(pdEl)pdEl.innerHTML=programDonors.length?programDonors.map(x=>`<div class="program-card"><span>${esc(x.program_name)}</span><b>${x.is_anonymous?"Anonymous Donor":esc(x.donor_name)}</b></div>`).join(""):'<p class="muted">Program donors will appear here.</p>';
  const gallery=document.getElementById("galleryGrid");if(gallery&&photos.length)gallery.innerHTML=photos.map(x=>`<figure><img loading="lazy" src="${esc(x.image_url)}" alt="${esc(x.title||"Festival photo")}"><figcaption>${esc(x.title||"Festival photo")}</figcaption></figure>`).join("")+`<a class="upload-tile" href="#upload"><span>📷</span><b>Share your moments</b><small>Upload Photo</small></a>`;
  const an=document.getElementById("announcementList");if(an)an.innerHTML=anns.length?anns.map(x=>`<div class="announcement-row"><span>•</span><div><b>${esc(x.title)}</b><p>${esc(x.message||"")}</p></div><span>→</span></div>`).join(""):'<p class="muted">No announcements yet.</p>';
 }catch(err){
  console.error("Website data loading failed:",err);
  const todayEl=document.getElementById("todayEvents");if(todayEl)todayEl.innerHTML='<p class="muted">Unable to load events right now. Please refresh.</p>';
  const upcoming=document.getElementById("upcomingEvents");if(upcoming)upcoming.innerHTML='<p class="muted">Unable to load the event schedule right now.</p>';
 }
}
const uploadForm=document.getElementById("uploadForm");
if(uploadForm)uploadForm.addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("uploadMsg"),file=document.getElementById("photoFile").files[0];if(!file)return;if(file.size>8*1024*1024){msg.textContent="Please keep the photo below 8MB.";return}msg.textContent="Uploading…";const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=`public/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from("ganesh-photos").upload(path,file,{contentType:file.type});if(up.error){msg.textContent="Upload failed: "+up.error.message;return}const url=db.storage.from("ganesh-photos").getPublicUrl(path).data.publicUrl;const ins=await db.from("photos").insert({image_url:url,title:document.getElementById("photoTitle").value.trim(),uploaded_by:document.getElementById("photoName").value.trim(),status:"pending"});if(ins.error){msg.textContent="Could not submit photo: "+ins.error.message;return}msg.textContent="Thank you! Your photo was submitted for admin approval.";e.target.reset()});
// UPI donation controls
const upiIdValue="8985120240@ybl";
const upiPayeeName="Pokurupalli Vinayaka Chaviti";
function updateUpiLink(amount){
  const btn=document.getElementById("upiDonateBtn");
  if(!btn)return;
  let url=`upi://pay?pa=${encodeURIComponent(upiIdValue)}&pn=${encodeURIComponent(upiPayeeName)}&cu=INR`;
  if(amount && Number(amount)>0) url+=`&am=${encodeURIComponent(Number(amount).toFixed(2))}`;
  btn.href=url;
}
document.querySelectorAll(".amount-choice").forEach(btn=>btn.addEventListener("click",()=>{
  const input=document.getElementById("customDonationAmount");
  if(input) input.value=btn.dataset.amount;
  document.querySelectorAll(".amount-choice").forEach(x=>x.classList.remove("selected"));
  btn.classList.add("selected");
  updateUpiLink(btn.dataset.amount);
}));
const customAmount=document.getElementById("customDonationAmount");
if(customAmount) customAmount.addEventListener("input",()=>{
  document.querySelectorAll(".amount-choice").forEach(x=>x.classList.remove("selected"));
  updateUpiLink(customAmount.value);
});
const copyUpi=document.getElementById("copyUpi");
if(copyUpi) copyUpi.addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(upiIdValue);copyUpi.textContent="Copied!";setTimeout(()=>copyUpi.textContent="Copy",1500)}
  catch{copyUpi.textContent="Select & copy"}
});

loadHome();
