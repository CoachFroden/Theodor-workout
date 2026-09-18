const $=s=>document.querySelector(s);
const KEY={cfg:"tw_cfg",hist:"tw_hist",cur:"tw_cur",spot:"tw_spot",sound:"tw_sound"};
const clone=x=>JSON.parse(JSON.stringify(x));
const load=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):clone(f)}catch{return clone(f)}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let cfg=load(KEY.cfg,window.ACTIVE_DEFAULTS).map((x,i)=>Object.assign({},window.ACTIVE_DEFAULTS[i],x));
let hist=load(KEY.hist,[]);
let cur=load(KEY.cur,null);
let view="home",timer=null,remaining=0,running=false;
const app=$("#app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const firstRep=s=>parseInt((String(s).match(/\d+/)||["0"])[0],10)||0;
const nfmt=n=>Number(n)%1===0?String(Number(n)):String(Number(n)).replace(".",",");
const dateFmt=iso=>new Intl.DateTimeFormat("nb-NO",{day:"numeric",month:"short",year:"numeric"}).format(new Date(iso));
function target(ex){let a=[];if(ex.weight!=null)a.push(ex.type==="assist"?nfmt(ex.weight)+" kg støtte":nfmt(ex.weight)+" kg");a.push(ex.sets+" sett");a.push(ex.reps);return a.join(" • ")}
function totalSets(){return hist.reduce((a,h)=>a+(h.completedSets||0),0)}
function totalXp(){return hist.reduce((a,h)=>a+(h.completedSets||0)*10+40,0)}
function level(){const x=totalXp();return{n:Math.floor(x/250)+1,x:x,p:x%250,pct:(x%250)/2.5}}
function toast(msg){let t=$(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t)}t.textContent=msg;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),1700)}
function setView(v){view=v;document.querySelectorAll(".nav-btn[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===v));if(v!=="workout")stopTimer(false);render();window.scrollTo({top:0,behavior:"smooth"})}
function render(){if(view==="home")home();if(view==="program")program();if(view==="progress")progress();if(view==="more")more();if(view==="workout")workout()}
function home(){
 const l=level(),last=hist[0];
 app.innerHTML="<section class='hero'><div class='hero-card'><p class='eyebrow'>CITY BLUE // GK MODE</p><h2 class='hero-title'>READY TO<br><span>LEVEL UP?</span></h2><p class='muted'>PT-programmet klart. Én øvelse om gangen. Gjør jobben, logg settene, ferdig.</p><div class='hero-actions'><button class='primary' data-action='start'>"+(cur?"Fortsett økten":"Start økten")+" &nbsp;▶</button><button class='secondary' data-view='program'>Se program</button></div><div class='pitch-lines'></div><div class='tiny' style='margin-top:10px'>GK inspiration • Donnarumma</div></div></section>"+
 "<div class='stat-grid'><div class='stat'><strong>"+hist.length+"</strong><span>Økter</span></div><div class='stat'><strong>"+totalSets()+"</strong><span>Sett gjort</span></div><div class='stat'><strong>"+l.n+"</strong><span>Level</span></div></div>"+
 "<div class='section-head'><div><p class='eyebrow'>PROGRAM</p><h2>14 øvelser</h2></div><button data-view='program'>Alle →</button></div>"+
 "<div class='card next-card'><div class='exercise-no'>01</div><div><h3>"+esc(cfg[0].name)+"</h3><p>"+esc(target(cfg[0]))+"</p></div></div>"+
 "<div class='section-head'><div><p class='eyebrow'>SISTE ØKT</p><h2>"+(last?dateFmt(last.finishedAt):"Ikke startet ennå")+"</h2></div></div>"+
 "<div class='card'>"+(last?"<div class='history-card'><div><strong>"+last.completedSets+" sett gjennomført</strong><small>"+last.durationMin+" min • +"+(last.completedSets*10+40)+" XP</small></div><span class='target-pill'>✓ LOGGET</span></div>":"<p class='muted'>Første fullførte økt dukker opp her.</p>")+"</div>";
}
function program(){
 app.innerHTML="<div class='section-head'><div><p class='eyebrow'>PT-PROGRAM</p><h2>Ditt program</h2></div><span class='tiny'>14 øvelser</span></div><p class='muted'>Startverdiene kommer fra PT-en. Endringer lagres på denne telefonen.</p><div class='exercise-list'>"+
 cfg.map((ex,i)=>"<div class='exercise-row'><div class='exercise-no'>"+String(i+1).padStart(2,"0")+"</div><div><h3>"+esc(ex.name)+"</h3><p>"+esc(target(ex))+"</p><div class='mini'>"+(ex.type==="assist"?"STØTTEVEKT":"PT-PROGRAM")+"</div></div><button class='edit-btn' data-edit='"+ex.id+"' aria-label='Rediger'>✎</button></div>").join("")+"</div>";
}
function progress(){
 const l=level();
 app.innerHTML="<div class='section-head'><div><p class='eyebrow'>PROGRESJON</p><h2>Consistency wins.</h2></div></div>"+
 "<div class='card level-wrap'><div class='level-top'><div><p class='eyebrow'>THEODOR LEVEL</p><h2 style='margin:5px 0 3px'>Level "+l.n+"</h2><span class='muted'>"+l.x+" total XP</span></div><div class='level-badge'>"+l.n+"</div></div><div class='xpbar'><i style='width:"+l.pct+"%'></i></div><p class='tiny'>"+l.p+" / 250 XP til neste level. XP kommer fra gjennomførte sett og økter – ikke tyngre vekter.</p></div>"+
 "<div class='stat-grid'><div class='stat'><strong>"+hist.length+"</strong><span>Økter</span></div><div class='stat'><strong>"+totalSets()+"</strong><span>Sett</span></div><div class='stat'><strong>"+hist.reduce((a,h)=>a+(h.durationMin||0),0)+"</strong><span>Minutter</span></div></div>"+
 "<div class='section-head'><div><p class='eyebrow'>HISTORIKK</p><h2>Siste økter</h2></div></div><div class='card'>"+
 (hist.length?hist.slice(0,12).map(h=>"<div class='history-card'><div><strong>"+dateFmt(h.finishedAt)+"</strong><small>"+h.completedSets+" sett • "+h.durationMin+" min</small></div><span class='target-pill'>+"+(h.completedSets*10+40)+" XP</span></div>").join(""):"<div class='empty'>Ingen økter logget ennå.</div>")+"</div>";
}
function more(){
 const s=localStorage.getItem(KEY.spot)||"";
 app.innerHTML="<div class='section-head'><div><p class='eyebrow'>MUSIKK</p><h2>Spotify</h2></div></div>"+
 "<div class='card spotify'><div class='spotify-row'><div class='spotify-logo'>♪</div><div><strong>Workout soundtrack</strong><div class='tiny'>Lagre favorittspillelisten én gang.</div></div></div><input id='spotifyUrl' inputmode='url' placeholder='Lim inn Spotify-lenke' value='"+esc(s)+"'><div class='hero-actions'><button class='primary' id='openSpotify'>Åpne Spotify</button><button class='secondary' id='saveSpotify'>Lagre lenke</button></div></div>"+
 "<div class='section-head'><div><p class='eyebrow'>PRØVETIMEN</p><h2>Øvelsesbibliotek</h2></div><span class='tiny'>23 øvelser</span></div><p class='muted'>Disse var med på prøvetimen. De er ikke del av dagens 14-øvelsesprogram.</p><div>"+
 window.EXERCISE_LIBRARY.map((x,i)=>"<details class='card library-card'><summary><div class='exercise-no'>"+String(i+1).padStart(2,"0")+"</div><div><strong>"+esc(x[0])+"</strong><div class='tiny'>"+esc(x[1])+" • "+esc(x[2])+" reps</div></div></summary><div class='body'>"+esc(x[3])+"<div class='source'>PRØVETIME / ORIGINAL</div></div></details>").join("")+"</div>"+
 "<div class='section-head'><div><p class='eyebrow'>IPHONE</p><h2>Hjemskjerm</h2></div></div><div class='card'><strong>Installer som app</strong><p class='muted'>Åpne siden i Safari → Del → Legg til på Hjem-skjerm. Da får den eget TW-ikon og åpnes uten nettleserfelt.</p></div>"+
 "<div class='section-head'><div><p class='eyebrow'>DATA</p><h2>Sikkerhetskopi</h2></div></div><div class='card'><button class='secondary full' id='exportData'>Eksporter treningsdata</button><div class='spacer'></div><label class='ghost full' style='display:block;text-align:center'>Importer treningsdata<input id='importData' type='file' accept='application/json' hidden></label><p class='tiny'>Data lagres kun lokalt på telefonen. Eksport gir en JSON-fil som sikkerhetskopi.</p></div>";
}
function makeSession(){return{id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),startedAt:new Date().toISOString(),index:0,exercises:cfg.map(ex=>({id:ex.id,name:ex.name,type:ex.type,sets:Array.from({length:Number(ex.sets)||1},()=>({weight:ex.weight,reps:firstRep(ex.reps),done:false}))}))}}
function startWorkout(){if(!cur){cur=makeSession();save(KEY.cur,cur)}view="workout";document.querySelectorAll(".nav-btn[data-view]").forEach(b=>b.classList.remove("active"));render();window.scrollTo({top:0})}
function workout(){
 if(!cur){startWorkout();return}
 let ix=Math.max(0,Math.min(cur.index,cfg.length-1));cur.index=ix;save(KEY.cur,cur);
 const ex=cfg[ix],log=cur.exercises[ix],done=cur.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0),all=cur.exercises.reduce((a,e)=>a+e.sets.length,0),pct=all?done/all*100:0,timed=ex.type==="time"||ex.type==="stretch";
 let rows=log.sets.map((s,si)=>{
   let a=ex.weight!=null?"<div class='field-mini'><input inputmode='decimal' data-set='"+si+"' data-field='weight' value='"+(s.weight??"")+"'><span>"+(ex.type==="assist"?"støtte":"kg")+"</span></div>":"<div class='field-mini'><input value='"+(timed?(ex.duration||30):s.reps)+"' "+(timed?"disabled":"inputmode='numeric' data-set='"+si+"' data-field='reps'")+"'><span>"+(timed?"sek":"reps")+"</span></div>";
   let b=ex.weight!=null?"<div class='field-mini'><input inputmode='numeric' data-set='"+si+"' data-field='reps' value='"+s.reps+"'><span>reps</span></div>":"<div class='field-mini'><input value='"+(timed?esc(ex.reps):"")+"' disabled><span>"+(timed?"mål":"")+"</span></div>";
   return"<div class='set-row "+(s.done?"done":"")+"'><div class='set-num'>"+(si+1)+"</div>"+a+b+"<button class='check-btn' data-check='"+si+"' aria-label='Sett ferdig'>"+(s.done?"✓":"○")+"</button></div>";
 }).join("");
 app.innerHTML="<div class='workout-head'><div><p class='eyebrow'>LIVE ØKT</p><h2>"+done+"/"+all+" sett</h2></div><button class='icon-btn' id='quitWorkout'>×</button></div><div class='progress-track'><i style='width:"+pct+"%'></i></div>"+
 "<section class='focus-card'><div class='focus-index'><span>ØVELSE "+String(ix+1).padStart(2,"0")+" / "+cfg.length+"</span><span>"+(ex.type==="assist"?"GK // SUPPORT":"THEODOR // WORK")+"</span></div><h2>"+esc(ex.name)+"</h2>"+
 "<div class='target-line'>"+(ex.weight!=null?"<span class='target-pill'>"+(ex.type==="assist"?nfmt(ex.weight)+" kg støtte":nfmt(ex.weight)+" kg")+"</span>":"")+"<span class='target-pill'>"+ex.sets+" sett</span><span class='target-pill'>"+esc(ex.reps)+"</span></div>"+
 "<div class='technique'>"+esc(ex.desc)+"</div>"+(timed?"<div class='timer-box'><div><div class='tiny'>SETT-TIMER</div><div class='timer-time' id='timerTime'>"+formatTime(remaining||ex.duration||30)+"</div></div><button id='timerBtn'>"+(running?"Pause":"Start")+" "+(ex.duration||30)+"s</button></div>":"")+"<div class='set-list'>"+rows+"</div>"+
 "<div class='focus-actions'><button class='secondary' id='prevEx' "+(ix===0?"disabled":"")+">← Forrige</button><button class='primary' id='nextEx'>"+(ix===cfg.length-1?"Fullfør økt":"Neste →")+"</button></div></section>";
}
function formatTime(s){s=Math.max(0,s||0);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function startTimer(seconds){if(!remaining)remaining=seconds;if(running){stopTimer(true);return}running=true;timerUI();timer=setInterval(()=>{remaining--;const e=$("#timerTime");if(e)e.textContent=formatTime(remaining);if(remaining<=0){stopTimer(false);signal();toast("Tid! ✓")}},1000)}
function stopTimer(keep=true){clearInterval(timer);timer=null;running=false;if(!keep)remaining=0;timerUI()}
function timerUI(){const b=$("#timerBtn");if(b)b.textContent=running?"Pause":"Start";const e=$("#timerTime");if(e&&remaining)e.textContent=formatTime(remaining)}
function signal(){if(navigator.vibrate)navigator.vibrate([120,70,120]);if(localStorage.getItem(KEY.sound)==="off")return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=740;g.gain.value=.04;o.start();o.stop(c.currentTime+.16)}catch{}}
function finish(){
 const fin=new Date(),done=cur.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0),mins=Math.max(1,Math.round((fin-new Date(cur.startedAt))/60000));
 hist.unshift({id:cur.id,startedAt:cur.startedAt,finishedAt:fin.toISOString(),completedSets:done,durationMin:mins,exercises:cur.exercises});save(KEY.hist,hist);localStorage.removeItem(KEY.cur);cur=null;stopTimer(false);$("#finishSummary").textContent=done+" sett • "+mins+" min • +"+(done*10+40)+" XP";$("#finishDialog").showModal();
}
function edit(id){
 const ex=cfg.find(x=>x.id===id);if(!ex)return;const d=$("#editorDialog");d.dataset.id=id;$("#editorTitle").textContent=ex.name;$("#editorFields").innerHTML="<div class='form-grid'>"+(ex.weight!=null?"<div class='form-field'><label>"+(ex.type==="assist"?"Støtte":"Vekt")+" (kg)</label><input id='editWeight' inputmode='decimal' value='"+ex.weight+"'></div>":"")+"<div class='form-field'><label>Sett</label><input id='editSets' inputmode='numeric' value='"+ex.sets+"'></div><div class='form-field'><label>Reps / mål</label><input id='editReps' value='"+esc(ex.reps)+"'></div></div>";d.showModal();
}
function resetEdit(){const id=$("#editorDialog").dataset.id,ix=cfg.findIndex(x=>x.id===id);if(ix<0)return;cfg[ix]=clone(window.ACTIVE_DEFAULTS[ix]);save(KEY.cfg,cfg);$("#editorDialog").close();toast("PT-verdien er gjenopprettet ✓");render()}
function saveEdit(){
 const id=$("#editorDialog").dataset.id,ix=cfg.findIndex(x=>x.id===id);if(ix<0)return;const ex=cfg[ix],w=$("#editWeight");if(w)ex.weight=Math.max(0,Number(String(w.value).replace(",","."))||0);ex.sets=Math.max(1,Math.min(12,parseInt($("#editSets").value,10)||1));ex.reps=$("#editReps").value.trim()||ex.reps;save(KEY.cfg,cfg);toast("Lagret ✓");render();
}
function exportData(){const p={version:1,exportedAt:new Date().toISOString(),config:cfg,history:hist,spotify:localStorage.getItem(KEY.spot)||""},b=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="theodor-workout-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(u)}
async function importData(f){try{const d=JSON.parse(await f.text());if(!Array.isArray(d.config)||!Array.isArray(d.history))throw 0;cfg=d.config;hist=d.history;save(KEY.cfg,cfg);save(KEY.hist,hist);if(typeof d.spotify==="string")localStorage.setItem(KEY.spot,d.spotify);toast("Sikkerhetskopi importert ✓");more()}catch{toast("Kunne ikke lese filen")}}
document.addEventListener("click",e=>{
 const vb=e.target.closest("[data-view]");if(vb){setView(vb.dataset.view);return}
 if(e.target.closest("[data-action='start']")){startWorkout();return}
 const eb=e.target.closest("[data-edit]");if(eb){edit(eb.dataset.edit);return}
 const cb=e.target.closest("[data-check]");if(cb&&cur){let s=cur.exercises[cur.index].sets[Number(cb.dataset.check)];s.done=!s.done;save(KEY.cur,cur);workout();return}
 if(e.target.id==="prevEx"&&cur){stopTimer(false);cur.index=Math.max(0,cur.index-1);save(KEY.cur,cur);workout();return}
 if(e.target.id==="nextEx"&&cur){if(cur.index===cfg.length-1)finish();else{stopTimer(false);cur.index++;save(KEY.cur,cur);workout()}return}
 if(e.target.id==="quitWorkout"){if(confirm("Avslutte økten? Det som er registrert i denne økten slettes.")){cur=null;localStorage.removeItem(KEY.cur);setView("home")}return}
 if(e.target.id==="timerBtn"){startTimer(cfg[cur.index].duration||30);return}
 if(e.target.id==="editorReset"){e.preventDefault();resetEdit();return}
 if(e.target.id==="editorSave"){e.preventDefault();saveEdit();$("#editorDialog").close();return}
 if(e.target.id==="saveSpotify"){localStorage.setItem(KEY.spot,$("#spotifyUrl").value.trim());toast("Spotify-lenke lagret ✓");return}
 if(e.target.id==="openSpotify"){let u=($("#spotifyUrl")?.value||localStorage.getItem(KEY.spot)||"").trim();window.open(u.startsWith("https://open.spotify.com/")?u:"https://open.spotify.com/","_blank","noopener");return}
 if(e.target.id==="exportData"){exportData();return}
 if(e.target.id==="finishClose"){$("#finishDialog").close();setView("home");return}
 if(e.target.id==="soundBtn"){const off=localStorage.getItem(KEY.sound)==="off";localStorage.setItem(KEY.sound,off?"on":"off");$("#soundIcon").textContent=off?"◐":"○";toast(off?"Lyd på":"Lyd av");return}
});
document.addEventListener("input",e=>{if(!cur||!e.target.matches("[data-set][data-field]"))return;const s=cur.exercises[cur.index].sets[Number(e.target.dataset.set)],f=e.target.dataset.field;if(f==="weight")s.weight=Math.max(0,Number(String(e.target.value).replace(",","."))||0);if(f==="reps")s.reps=Math.max(0,parseInt(e.target.value,10)||0);save(KEY.cur,cur)});
document.addEventListener("change",e=>{if(e.target.id==="importData"&&e.target.files[0])importData(e.target.files[0])});
$("#soundIcon").textContent=localStorage.getItem(KEY.sound)==="off"?"○":"◐";
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
render();