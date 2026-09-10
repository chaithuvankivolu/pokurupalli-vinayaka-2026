const SUPABASE_URL="https://zafgfjsdzfknqljjbumv.supabase.co",SUPABASE_KEY="sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let editingEventId=null,editingDonorId=null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});

async function refresh(){
 const s=(await db.auth.getSession()).data.session;if(!s)return;
 const today=new Date().toISOString().slice(0,10);
 const [p,e,d,a,pd]=await Promise.all([
  db.from("photos").select("*").eq("status","pending").order("created_at",{ascending:false}),
  db.from("events").select("*").order("event_date",{ascending:false}),
  db.from("donors").select("*").order("created_at",{ascending:false}),
  db.from("announcements").select("*").order("created_at",{ascending:false}),
  db.from("program_donors").select("*").order("program_name",{ascending:true})
 ]);
 if([p,e,d,a,pd].some(x=>x.error)){console.error(p.error,e.error,d.error,a.error);return}
 const photos=p.data||[],events=e.data||[],donors=d.data||[],anns=a.data||[],programDonors=pd.data||[];
 const total=donors.reduce((sum,x)=>sum+(Number(x.amount)||0),0);
 dashDonations.textContent=money(total);dashDonors.textContent=donors.length;
 dashEvents.textContent=events.filter(x=>x.event_date===today).length;dashPending.textContent=photos.length;

 pendingPhotos.innerHTML=photos.length?photos.map(x=>`<div class="pending-item"><img src="${esc(x.image_url)}"><div><b>${esc(x.title||"Untitled photo")}</b><br>Uploaded by: ${esc(x.uploaded_by||"Not provided")}</div><div class="actions"><button onclick="approve('${x.id}')">Approve</button> <button class="danger" onclick="rejectPhoto('${x.id}')">Reject</button></div></div>`).join(""):"<p class='muted'>No photos waiting for approval.</p>";

 adminEvents.innerHTML=events.length?`<table class="small-table"><tr><th>Date</th><th>Event</th><th>Location</th><th>Actions</th></tr>${events.map(x=>`<tr><td>${esc(x.event_date)}</td><td>${esc(x.title)}</td><td>${esc(x.location||"")}</td><td><button onclick="editEvent('${x.id}')">Edit</button> <button class="danger" onclick="deleteEvent('${x.id}')">Delete</button></td></tr>`).join("")}</table>`:"<p class='muted'>No events yet.</p>";

 adminProgramDonors.innerHTML=programDonors.length?`<table class="small-table"><tr><th>Program</th><th>Donor</th><th>Actions</th></tr>${programDonors.map(x=>`<tr><td>${esc(x.program_name)}</td><td>${x.is_anonymous?"Anonymous Donor":esc(x.donor_name)}</td><td><button class="danger" onclick="deleteProgramDonor('${x.id}')">Delete</button></td></tr>`).join("")}</table>`:"<p class='muted'>No program donors yet.</p>";
 adminDonors.innerHTML=donors.length?`<table class="small-table"><tr><th>Donor</th><th>Amount</th><th>Actions</th></tr>${donors.map(x=>`<tr><td>${x.is_anonymous?"Anonymous Donor":esc(x.name)}</td><td>${x.amount!=null?money(x.amount):"—"}</td><td><button onclick="editDonor('${x.id}')">Edit</button> <button class="danger" onclick="deleteDonor('${x.id}')">Delete</button></td></tr>`).join("")}</table>`:"<p class='muted'>No donors yet.</p>";

 adminAnnouncements.innerHTML=anns.length?`<table class="small-table"><tr><th>Title</th><th>Message</th><th>Actions</th></tr>${anns.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.message||"")}</td><td><button class="danger" onclick="deleteAnnouncement('${x.id}')">Delete</button></td></tr>`).join("")}</table>`:"<p class='muted'>No announcements yet.</p>";
}
async function approve(id){const r=await db.from("photos").update({status:"approved"}).eq("id",id);if(r.error)alert(r.error.message);refresh()}
async function rejectPhoto(id){const r=await db.from("photos").delete().eq("id",id);if(r.error)alert(r.error.message);refresh()}
async function deleteEvent(id){if(!confirm("Delete this event?"))return;const r=await db.from("events").delete().eq("id",id);if(r.error)alert(r.error.message);refresh()}
async function deleteDonor(id){if(!confirm("Delete this donor?"))return;const r=await db.from("donors").delete().eq("id",id);if(r.error)alert(r.error.message);refresh()}
async function deleteProgramDonor(id){if(!confirm("Delete this program donor?"))return;const r=await db.from("program_donors").delete().eq("id",id);if(r.error)alert(r.error.message);refresh()}
async function deleteAnnouncement(id){if(!confirm("Delete this announcement?"))return;const r=await db.from("announcements").delete().eq("id",id);if(r.error)alert(r.error.message);refresh()}
async function editEvent(id){const r=await db.from("events").select("*").eq("id",id).single();if(r.error)return alert(r.error.message);const x=r.data;editingEventId=id;eventTitle.value=x.title||"";eventDesc.value=x.description||"";eventDate.value=x.event_date||"";startTime.value=x.start_time?x.start_time.slice(0,5):"";endTime.value=x.end_time?x.end_time.slice(0,5):"";eventLocation.value=x.location||"";document.querySelector("#eventForm button").textContent="Update Event";window.scrollTo({top:document.querySelector("#eventForm").offsetTop-80,behavior:"smooth"})}
async function editDonor(id){const r=await db.from("donors").select("*").eq("id",id).single();if(r.error)return alert(r.error.message);const x=r.data;editingDonorId=id;donorName.value=x.name||"";donorAmount.value=x.amount??"";donorAnonymous.checked=!!x.is_anonymous;document.querySelector("#donorForm button").textContent="Update Donor";window.scrollTo({top:document.querySelector("#donorForm").offsetTop-80,behavior:"smooth"})}

loginForm.addEventListener("submit",async e=>{e.preventDefault();loginMsg.textContent="Signing in…";const r=await db.auth.signInWithPassword({email:email.value,password:password.value});if(r.error){loginMsg.textContent=r.error.message;return}loginMsg.textContent="";showDash()});
logoutBtn.addEventListener("click",async()=>{await db.auth.signOut();location.reload()});
async function showDash(){loginPanel.hidden=true;dashboard.hidden=false;refresh()}
db.auth.onAuthStateChange((_e,s)=>{if(s)showDash()});

eventForm.addEventListener("submit",async e=>{e.preventDefault();const payload={title:eventTitle.value.trim(),description:eventDesc.value.trim(),event_date:eventDate.value,start_time:startTime.value||null,end_time:endTime.value||null,location:eventLocation.value.trim()};const r=editingEventId?await db.from("events").update(payload).eq("id",editingEventId):await db.from("events").insert(payload);alert(r.error?r.error.message:(editingEventId?"Event updated successfully.":"Event saved successfully."));if(!r.error){editingEventId=null;e.target.reset();document.querySelector("#eventForm button").textContent="Save Event";}refresh()});
donorForm.addEventListener("submit",async e=>{e.preventDefault();const payload={name:donorName.value.trim(),amount:donorAmount.value?Number(donorAmount.value):null,is_anonymous:donorAnonymous.checked};const r=editingDonorId?await db.from("donors").update(payload).eq("id",editingDonorId):await db.from("donors").insert(payload);alert(r.error?r.error.message:(editingDonorId?"Donor updated successfully.":"Donor saved successfully."));if(!r.error){editingDonorId=null;e.target.reset();document.querySelector("#donorForm button").textContent="Save Donor";}refresh()});
announcementForm.addEventListener("submit",async e=>{e.preventDefault();const r=await db.from("announcements").insert({title:annTitle.value.trim(),message:annMessage.value.trim()});alert(r.error?r.error.message:"Announcement saved successfully.");if(!r.error)e.target.reset();refresh()});
(async()=>{if((await db.auth.getSession()).data.session)showDash()})();
programDonorForm.addEventListener("submit",async e=>{e.preventDefault();const r=await db.from("program_donors").insert({program_name:programName.value.trim(),donor_name:programDonorName.value.trim(),is_anonymous:programAnonymous.checked});alert(r.error?r.error.message:"Program donor saved successfully.");if(!r.error)e.target.reset();refresh()});
