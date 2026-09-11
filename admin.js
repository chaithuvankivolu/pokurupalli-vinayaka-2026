const SUPABASE_URL = 'https://zafgfjsdzfknqljjbumv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WsUdEATeL5sDRIwfJxoxIw_iBwxGAdo';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', {maximumFractionDigits:2});

async function isAdmin(){
  const {data:{user}, error:userError} = await db.auth.getUser();
  if(userError || !user) return {ok:false, message:'Please sign in again.'};

  // Use the SECURITY DEFINER RPC instead of querying admin_users directly.
  // This avoids admin_users RLS blocking an otherwise valid admin login.
  const {data, error} = await db.rpc('is_admin');
  if(error) return {ok:false, message:'Admin verification failed: ' + error.message};
  return {ok:Boolean(data), message:Boolean(data) ? '' : 'This account is not an admin.'};
}

function showLogin(message=''){
  $('loginPanel').hidden = false;
  $('dashboard').hidden = true;
  $('loginMsg').textContent = message;
}

async function loadDashboard(){
  const admin = await isAdmin();
  if(!admin.ok) { await db.auth.signOut(); showLogin(admin.message); return; }
  $('loginPanel').hidden = true; $('dashboard').hidden = false;
  await Promise.all([loadStats(),loadPending(),loadEvents(),loadDonors(),loadProgramDonors(),loadAnnouncements()]);
}

async function loadStats(){
  const [{data:donors},{data:events},{data:photos}] = await Promise.all([
    db.from('donors').select('amount'),
    db.from('events').select('event_date'),
    db.from('photos').select('id,status').eq('status','pending')
  ]);
  $('dashDonations').textContent = money((donors||[]).reduce((s,d)=>s+Number(d.amount||0),0));
  $('dashDonors').textContent = (donors||[]).length;
  const today = new Date().toISOString().slice(0,10);
  $('dashEvents').textContent = (events||[]).filter(e=>e.event_date===today).length;
  $('dashPending').textContent = (photos||[]).length;
}

async function loadPending(){
  const box=$('pendingPhotos');
  const {data,error}=await db.from('photos').select('*').eq('status','pending').order('created_at',{ascending:false});
  if(error){box.innerHTML='<p class="status">Could not load pending photos: '+esc(error.message)+'</p>';return;}
  if(!data?.length){box.innerHTML='<p class="muted">No pending photos.</p>';return;}
  box.innerHTML=data.map(p=>`<div class="admin-item photo-review"><img src="${esc(p.image_url)}" alt=""><div><strong>${esc(p.title||'Festival photo')}</strong><small>By ${esc(p.uploaded_by||'Anonymous')} · ${new Date(p.created_at).toLocaleString('en-IN')}</small><div class="row"><button onclick="approvePhoto('${p.id}')">Approve</button><button class="secondary" onclick="rejectPhoto('${p.id}')">Reject</button></div></div></div>`).join('');
}
window.approvePhoto=async(id)=>{const {error}=await db.from('photos').update({status:'approved'}).eq('id',id); if(error) alert(error.message); else {await loadPending();await loadStats();}};
window.rejectPhoto=async(id)=>{const {error}=await db.from('photos').update({status:'rejected'}).eq('id',id); if(error) alert(error.message); else {await loadPending();await loadStats();}};

async function loadEvents(){
  const {data,error}=await db.from('events').select('*').order('event_date',{ascending:true}).order('start_time',{ascending:true});
  const box=$('adminEvents'); if(error){box.innerHTML='<p class="status">'+esc(error.message)+'</p>';return;}
  box.innerHTML=(data||[]).map(e=>`<div class="admin-item"><div><strong>${esc(e.title)}</strong><small>${esc(e.event_date)} ${esc(e.start_time||'')} ${e.end_time?'– '+esc(e.end_time):''} · ${esc(e.location||'')}</small></div><button class="secondary" onclick='deleteRow("events","${e.id}",loadEvents)'>Delete</button></div>`).join('')||'<p class="muted">No events.</p>';
}
async function loadDonors(){
  const {data,error}=await db.from('donors').select('*').order('created_at',{ascending:false});
  const box=$('adminDonors'); if(error){box.innerHTML='<p class="status">'+esc(error.message)+'</p>';return;}
  box.innerHTML=(data||[]).map(d=>`<div class="admin-item"><div><strong>${esc(d.is_anonymous?'Anonymous':d.name)}</strong><small>${money(d.amount)}</small></div><button class="secondary" onclick='deleteRow("donors","${d.id}",loadDonors)'>Delete</button></div>`).join('')||'<p class="muted">No donors.</p>';
}
async function loadProgramDonors(){
  const {data,error}=await db.from('program_donors').select('*').order('created_at',{ascending:false});
  const box=$('adminProgramDonors'); if(error){box.innerHTML='<p class="status">'+esc(error.message)+'</p>';return;}
  box.innerHTML=(data||[]).map(d=>`<div class="admin-item"><div><strong>${esc(d.is_anonymous?'Anonymous':d.donor_name)}</strong><small>${esc(d.program_name)}</small></div><button class="secondary" onclick='deleteRow("program_donors","${d.id}",loadProgramDonors)'>Delete</button></div>`).join('')||'<p class="muted">No program donors.</p>';
}
async function loadAnnouncements(){
  const {data,error}=await db.from('announcements').select('*').order('created_at',{ascending:false});
  const box=$('adminAnnouncements'); if(error){box.innerHTML='<p class="status">'+esc(error.message)+'</p>';return;}
  box.innerHTML=(data||[]).map(a=>`<div class="admin-item"><div><strong>${esc(a.title)}</strong><small>${esc(a.message)}</small></div><button class="secondary" onclick='deleteRow("announcements","${a.id}",loadAnnouncements)'>Delete</button></div>`).join('')||'<p class="muted">No announcements.</p>';
}
window.deleteRow=async(table,id,reload)=>{if(!confirm('Delete this item?'))return;const {error}=await db.from(table).delete().eq('id',id);if(error)alert(error.message);else{await reload();await loadStats();}};

$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  $('loginMsg').textContent='Signing in…';
  const email=$('email').value.trim();
  const password=$('password').value;
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error){$('loginMsg').textContent=error.message;return;}
  if(!data?.session){$('loginMsg').textContent='Login succeeded, but no session was created.';return;}
  await loadDashboard();
});
$('logoutBtn').addEventListener('click',async()=>{await db.auth.signOut();location.reload();});
$('eventForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db.from('events').insert({title:$('eventTitle').value,description:$('eventDesc').value,event_date:$('eventDate').value,start_time:$('startTime').value||null,end_time:$('endTime').value||null,location:$('eventLocation').value});if(error)alert(error.message);else{e.target.reset();await loadEvents();await loadStats();}});
$('donorForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db.from('donors').insert({name:$('donorName').value,amount:Number($('donorAmount').value||0),is_anonymous:$('donorAnonymous').checked});if(error)alert(error.message);else{e.target.reset();await loadDonors();await loadStats();}});
$('programDonorForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db.from('program_donors').insert({program_name:$('programName').value,donor_name:$('programDonorName').value,is_anonymous:$('programAnonymous').checked});if(error)alert(error.message);else{e.target.reset();await loadProgramDonors();}});
$('announcementForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db.from('announcements').insert({title:$('annTitle').value,message:$('annMessage').value});if(error)alert(error.message);else{e.target.reset();await loadAnnouncements();}});

db.auth.getSession().then(({data:{session}})=>{if(session)loadDashboard();});
