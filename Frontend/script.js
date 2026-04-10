// --- Page Navigation ---
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById(id);
  target.classList.add('active');
  // Re-trigger stagger animations
  target.querySelectorAll('.stagger-in').forEach((el,i)=>{
    el.style.animation='none';
    void el.offsetWidth;
    el.style.animation=`staggerUp .5s ease ${i*0.07}s forwards`;
  });
  // Draw chart if worker
  if(id==='worker-dash') drawChart();
}

// --- Login Role Switch ---
let currentRole='worker';
function switchRole(el,role){
  currentRole=role;
  document.querySelectorAll('.role-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
}

// Focus on login form when admin button clicked
function focusLoginForm(){
  const emailInput = document.getElementById('login-email');
  if(emailInput) emailInput.focus();
}

// --- Login Action ---
function doLogin(){
  const dashMap={admin:'admin-dash',user:'user-dash',worker:'worker-dash'};
  showPage(dashMap[currentRole]);
}

// --- Earnings Chart (animated bars) ---
const earnings=[32,41,28,55,48,63,72]; // k
function drawChart(){
  const c=document.getElementById('earningsChart');
  c.innerHTML='';
  const max=Math.max(...earnings);
  earnings.forEach((v,i)=>{
    const bar=document.createElement('div');
    bar.className='chart-bar';
    bar.style.height='0px';
    c.appendChild(bar);
    setTimeout(()=>{
      bar.style.height=((v/max)*100)+'px';
    },150+i*80);
  });
}

// --- Availability Toggle Label ---
document.querySelector('.toggle').addEventListener('click',function(){
  document.getElementById('avail-label').textContent=this.classList.contains('on')
    ? 'Available for new jobs' : 'Currently unavailable';
});