const SUPABASE_URL="https://zafgfjsdzfknqljjbumv.supabase.co";
const SUPABASE_KEY="sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function refresh(){
 const session=(await db.auth.getSession()).data.session; if(!session)return;
 const [p,e,d]=await Promise.all([
  db.from("photos").select("*").eq("status","pending").order("created_at",{ascending:false}),
  db.from("events").select("*").order("event_date",{ascending:false}),
  db.from("donors").select("*").order("created_at",{ascending:false})
 ]);
 document.querySelector("#pendingPhotos").innerHTML=p.data?.length?p.data.map(x=>`<div class="pending-item"><img src="${esc(x.image_url)}"><div><b>${esc(x.title||"无标题")}</b><br>上传者：${esc(x.uploaded_by||"未填写")}</div><div class="actions"><button onclick="approve('${x.id}')">通过</button> <button class="danger" onclick="reject('${x.id}')">拒绝</button></div></div>`).join(""):"<p class='muted'>暂无待审核照片。</p>";
 document.querySelector("#adminEvents").innerHTML=e.data?.length?`<table class="small-table"><tr><th>日期</th><th>活动</th><th>地点</th></tr>${e.data.map(x=>`<tr><td>${esc(x.event_date)}</td><td>${esc(x.title)}</td><td>${esc(x.location||"")}</td></tr>`).join("")}</table>`:"<p class='muted'>కార్యక్రమాలు లేవు.</p>";
 document.querySelector("#adminDonors").innerHTML=d.data?.length?`<table class="small-table"><tr><th>పేరు</th><th>మొత్తం</th></tr>${d.data.map(x=>`<tr><td>${x.is_anonymous?"అనామక దాత":esc(x.name)}</td><td>${x.amount!=null?"₹"+Number(x.amount).toLocaleString("en-IN"):"-"}</td></tr>`).join("")}</table>`:"<p class='muted'>దాతలు లేరు.</p>";
}
async function approve(id){await db.from("photos").update({status:"approved"}).eq("id",id);refresh()}
async function reject(id){await db.from("photos").delete().eq("id",id);refresh()}
document.querySelector("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const msg=document.querySelector("#loginMsg");const r=await db.auth.signInWithPassword({email:email.value,password:password.value});if(r.error){msg.textContent=r.error.message;return}showDash()});
document.querySelector("#logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.reload()});
async function showDash(){document.querySelector("#loginPanel").hidden=true;document.querySelector("#dashboard").hidden=false;refresh()}
db.auth.onAuthStateChange((_event,session)=>{if(session)showDash()});
document.querySelector("#eventForm").addEventListener("submit",async e=>{e.preventDefault();const r=await db.from("events").insert({title:eventTitle.value.trim(),description:eventDesc.value.trim(),event_date:eventDate.value,start_time:startTime.value||null,end_time:endTime.value||null,location:eventLocation.value.trim()});alert(r.error?r.error.message:"కార్యక్రమం సేవ్ అయింది");if(!r.error)e.target.reset();refresh()});
document.querySelector("#donorForm").addEventListener("submit",async e=>{e.preventDefault();const r=await db.from("donors").insert({name:donorName.value.trim(),amount:donorAmount.value?Number(donorAmount.value):null,is_anonymous:donorAnonymous.checked});alert(r.error?r.error.message:"దాత సేవ్ అయ్యారు");if(!r.error)e.target.reset();refresh()});
document.querySelector("#announcementForm").addEventListener("submit",async e=>{e.preventDefault();const r=await db.from("announcements").insert({title:annTitle.value.trim(),message:annMessage.value.trim()});alert(r.error?r.error.message:"ప్రకటన సేవ్ అయింది");if(!r.error)e.target.reset()});
(async()=>{const s=(await db.auth.getSession()).data.session;if(s)showDash()})();
