const $=s=>document.querySelector(s);
const KEY={cfg:"tw_cfg",hist:"tw_hist",cur:"tw_cur",spot:"tw_spot",sound:"tw_sound",finishUndo:"tw_finish_undo"};
const clone=x=>JSON.parse(JSON.stringify(x));
const load=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):clone(f)}catch{return clone(f)}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let cfg=load(KEY.cfg,window.ACTIVE_DEFAULTS).map((x,i)=>Object.assign({},window.ACTIVE_DEFAULTS[i],x));
let hist=load(KEY.hist,[]);
let cur=load(KEY.cur,null);
let view="home",timer=null,remaining=0,running=false,timerSet=null;
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
function render(){document.body.classList.toggle("workout-mode",view==="workout");if(view==="home")home();if(view==="program")program();if(view==="progress")progress();if(view==="more")more();if(view==="workout")workout()}
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
 cfg.map((ex,i)=>"<div class='exercise-row'><div class='exercise-no'>"+String(i+1).padStart(2,"0")+"</div><button class='exercise-main' data-detail='"+ex.id+"' aria-label='Vis "+esc(ex.name)+"'><span class='exercise-copy'><h3>"+esc(ex.name)+"</h3><p>"+esc(target(ex))+"</p><span class='mini'>"+(ex.type==="assist"?"STØTTEVEKT":"PT-PROGRAM")+"</span></span><span class='exercise-chevron' aria-hidden='true'>›</span></button><button class='edit-btn' data-edit='"+ex.id+"' aria-label='Rediger "+esc(ex.name)+"'>✎</button></div>").join("")+"</div>";
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
function makeSession(){return{id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),startedAt:new Date().toISOString(),index:0,round:0,undo:[],exercises:cfg.map(ex=>({id:ex.id,name:ex.name,type:ex.type,sets:Array.from({length:Number(ex.sets)||1},()=>({weight:ex.weight,reps:firstRep(ex.reps),done:false}))}))}}
function startWorkout(){if(!cur){cur=makeSession();save(KEY.cur,cur)}view="workout";document.querySelectorAll(".nav-btn[data-view]").forEach(b=>b.classList.remove("active"));render();window.scrollTo({top:0})}
function workout(){
 if(!cur){startWorkout();return}
 if(!Number.isInteger(cur.round))cur.round=Math.min(...cur.exercises.map(e=>{const i=e.sets.findIndex(s=>!s.done);return i<0?e.sets.length:i}));
 if(cur.roundEnd){roundSummary();return}
 let ix=Math.max(0,Math.min(cur.index,cfg.length-1));cur.index=ix;save(KEY.cur,cur);
 const ex=cfg[ix],log=cur.exercises[ix],done=cur.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0),all=cur.exercises.reduce((a,e)=>a+e.sets.length,0),pct=all?done/all*100:0,timed=ex.type==="time"||ex.type==="stretch";
 const activeSet=log.sets[cur.round]&&!log.sets[cur.round].done?cur.round:-1;
 const si=Math.min(cur.round,log.sets.length-1),s=log.sets[si];
 const fields=timed?"":
   "<div class='active-fields'>"+(ex.weight!=null?"<label class='active-field'><span>"+(ex.type==="assist"?"Støtte · kg":"Vekt · kg")+"</span><input aria-label='"+(ex.type==="assist"?"Støttevekt":"Vekt")+"' inputmode='decimal' data-set='"+si+"' data-field='weight' value='"+(s.weight??"")+"'></label>":"")+
   "<label class='active-field'><span>Repetisjoner</span><input aria-label='Repetisjoner' inputmode='numeric' data-set='"+si+"' data-field='reps' value='"+s.reps+"'></label></div>";
 app.innerHTML="<div class='workout-head'><div><p class='eyebrow'>RUNDE "+(cur.round+1)+" · ØVELSE "+(ix+1)+" AV "+cfg.length+"</p><span class='tiny'>"+done+" / "+all+" sett fullført</span></div><button class='icon-btn' id='quitWorkout' aria-label='Avslutt økten'>×</button></div><div class='progress-track'><i style='width:"+pct+"%'></i></div>"+
 "<section class='focus-card'><div class='workout-title'><h2>"+esc(ex.name)+"</h2><button class='exercise-guide' data-detail='"+ex.id+"'>Slik gjør du ⓘ</button></div>"+
 "<div class='target-line'>"+(ex.weight!=null?"<span class='target-pill'>"+(ex.type==="assist"?nfmt(ex.weight)+" kg støtte":nfmt(ex.weight)+" kg")+"</span>":"")+"<span class='target-pill'>"+esc(ex.reps)+(timed?"":" reps")+"</span></div>"+
 "<div class='active-set'><p class='eyebrow'>"+(activeSet<0?"SETTET ER FERDIG":"NÅ · SETT "+(si+1)+" AV "+log.sets.length)+"</p><div class='set-steps' aria-label='Settstatus'>"+log.sets.map((item,i)=>"<span class='set-step "+(item.done?"done":i===activeSet?"current":"")+"'>"+(item.done?"✓":i+1)+"</span>").join("")+"</div>"+
 (timed?"<div class='timer-box'><div class='timer-time' id='timerTime'>"+formatTime(remaining||ex.duration||30)+"</div><button id='timerBtn' "+(activeSet<0?"disabled":"")+">"+(running?"Pause":remaining?"Fortsett":"Start timer")+"</button></div>":fields)+"</div>"+
 "<div class='workout-controls'><button class='primary full' id='completeSet' "+(activeSet<0?"disabled":"")+">"+(activeSet<0?"Settet er ferdig ✓":"Sett "+(si+1)+" ferdig ✓")+"</button>"+
 "<button class='undo-set' id='undoWorkout' "+(cur.undo?.length?"":"disabled")+">↶ Angre siste valg</button><div class='focus-actions'><button class='secondary' id='prevEx' "+(previousExercise()<0?"disabled":"")+">← Forrige</button><button class='secondary' id='nextEx'>"+(nextExercise()<0?"Avslutt runden →":"Neste øvelse →")+"</button></div></div></section>";
}

function formatTime(s){s=Math.max(0,s||0);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function rememberWorkout(){
 const snapshot=clone(cur);delete snapshot.undo;
 cur.undo=cur.undo||[];cur.undo.push(snapshot);if(cur.undo.length>60)cur.undo.shift();
}
function undoWorkout(){
 if(!cur?.undo?.length)return;
 stopTimer(false);const stack=cur.undo,snapshot=stack.pop();cur=Object.assign(snapshot,{undo:stack});save(KEY.cur,cur);workout();toast("Siste valg er angret");
}
function nextExercise(){return cur.exercises.findIndex((e,i)=>i>cur.index&&e.sets[cur.round])}
function previousExercise(){for(let i=cur.index-1;i>=0;i--)if(cur.exercises[i].sets[cur.round])return i;return -1}
function advanceExercise(){
 const next=nextExercise();
 if(next<0)cur.roundEnd=true;else cur.index=next;
 save(KEY.cur,cur);workout();
}
function completeSet(si){
 if(!cur||cur.roundEnd)return;
 const log=cur.exercises[cur.index];if(si==null)si=cur.round;
 if(si!==cur.round||!log.sets[si]||log.sets[si].done)return;
 rememberWorkout();stopTimer(false);log.sets[si].done=true;
 advanceExercise();
}
function confirmCompleteSet(){
 if(!cur||cur.roundEnd)return;
 const ex=cur.exercises[cur.index],set=ex.sets[cur.round];if(!set||set.done)return;
 if(confirm("Registrere sett "+(cur.round+1)+" av «"+ex.name+"» som ferdig?"))completeSet();
}
function roundSummary(){
 const eligible=cur.exercises.filter(e=>e.sets[cur.round]),done=eligible.filter(e=>e.sets[cur.round].done).length;
 const hasNext=cur.exercises.some(e=>e.sets[cur.round+1]);
 app.innerHTML="<section class='focus-card round-summary'><p class='eyebrow'>RUNDE "+(cur.round+1)+"</p><h2>"+(done===eligible.length?"Runden er ferdig ✓":"Runden er gjennomgått")+"</h2><p class='muted'>"+done+" av "+eligible.length+" øvelser fullført i denne runden.</p><div class='round-choices'>"+
 (hasNext?"<button class='primary full' id='nextRound'>Gå til sett "+(cur.round+2)+" →</button>":"")+
 (done<eligible.length?"<button class='secondary full' id='missingExercises'>Tilbake til uferdige øvelser</button>":"")+
 "<button class='secondary full' id='finishWorkout'>Avslutt og lagre treningen</button><button class='undo-set' id='undoWorkout' "+(cur.undo?.length?"":"disabled")+">↶ Angre siste valg</button></div></section>";
}
function nextRound(){
 if(!cur||!cur.exercises.some(e=>e.sets[cur.round+1]))return;
 if(cur.exercises.some(e=>e.sets[cur.round]&&!e.sets[cur.round].done)&&!confirm("Noen øvelser er ikke fullført. Gå videre likevel?"))return;
 rememberWorkout();stopTimer(false);cur.round++;cur.roundEnd=false;cur.index=cur.exercises.findIndex(e=>e.sets[cur.round]);save(KEY.cur,cur);workout();
}
function startTimer(seconds){
 if(!cur)return;
 const si=cur.round;
 if(cur.roundEnd||!cur.exercises[cur.index].sets[si]||cur.exercises[cur.index].sets[si].done)return;
 if(running){stopTimer(true);return}
 if(!remaining)remaining=seconds;
 timerSet={session:cur.id,index:cur.index,set:si};running=true;timerUI();countdownFlash();
 timer=setInterval(()=>{
   remaining--;countdownFlash();const e=$("#timerTime");if(e)e.textContent=formatTime(remaining);
   if(remaining<=0){
     const completed=timerSet;stopTimer(false);signal();
     if(cur&&cur.id===completed.session&&cur.index===completed.index)completeSet(completed.set);
   }
 },1000);
}
function countdownFlash(){
 if(!running||remaining<1||remaining>5)return;
 document.body.classList.remove("countdown-flash");void document.body.offsetWidth;document.body.classList.add("countdown-flash");
}
function stopTimer(keep=true){document.body.classList.remove("countdown-flash");clearInterval(timer);timer=null;running=false;if(!keep){remaining=0;timerSet=null}timerUI()}
function timerUI(){const b=$("#timerBtn");if(b)b.textContent=running?"Pause":remaining?"Fortsett":"Start";const e=$("#timerTime");if(e&&remaining)e.textContent=formatTime(remaining)}
function signal(){if(navigator.vibrate)navigator.vibrate([120,70,120]);if(localStorage.getItem(KEY.sound)==="off")return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=740;g.gain.value=.04;o.start();o.stop(c.currentTime+.16)}catch{}}
function finish(){
 save(KEY.finishUndo,cur);
 const fin=new Date(),done=cur.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0),mins=Math.max(1,Math.round((fin-new Date(cur.startedAt))/60000));
 hist.unshift({id:cur.id,startedAt:cur.startedAt,finishedAt:fin.toISOString(),completedSets:done,durationMin:mins,exercises:cur.exercises});save(KEY.hist,hist);localStorage.removeItem(KEY.cur);cur=null;stopTimer(false);$("#finishSummary").textContent=done+" sett • "+mins+" min • +"+(done*10+40)+" XP";$("#finishDialog").showModal();
}
function undoFinish(){
 const session=load(KEY.finishUndo,null);if(!session)return;
 hist=hist.filter(h=>h.id!==session.id);save(KEY.hist,hist);cur=session;save(KEY.cur,cur);localStorage.removeItem(KEY.finishUndo);$("#finishDialog").close();startWorkout();
}
function detailValue(ex){
 const weight=ex.weight==null?"Ingen":(ex.type==="assist"?nfmt(ex.weight)+" kg støtte":nfmt(ex.weight)+" kg");
 return {weight:weight,sets:String(ex.sets),reps:String(ex.reps),duration:ex.duration?String(ex.duration)+" sek":null};
}
function showDetail(id){
 const ex=cfg.find(x=>x.id===id);if(!ex)return;
 const d=detailValue(ex),dlg=$("#exerciseDialog");
 $("#detailTitle").textContent=ex.name;
 $("#detailBody").innerHTML=
   "<div class='detail-stats'>"+
   "<div class='detail-stat'><span>VEKT</span><strong>"+esc(d.weight)+"</strong></div>"+
   "<div class='detail-stat'><span>SETT</span><strong>"+esc(d.sets)+"</strong></div>"+
   "<div class='detail-stat'><span>REPS</span><strong>"+esc(d.reps)+"</strong></div>"+
   "</div>"+
   (d.duration?"<div class='detail-time'><span>⏱</span><div><small>VARIGHET</small><strong>"+esc(d.duration)+"</strong></div></div>":"")+
   "<div class='detail-how'><p class='eyebrow'>SLIK GJØR DU</p><p>"+esc(ex.desc)+"</p></div>"+
   (ex.type==="assist"?"<p class='detail-note'>På denne øvelsen er vekten støttevekt. Lavere tall betyr mindre hjelp.</p>":"");
 dlg.showModal();
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
 const db=e.target.closest("[data-detail]");if(db){showDetail(db.dataset.detail);return}
 if(e.target.id==="completeSet"){confirmCompleteSet();return}
 if(e.target.id==="undoWorkout"){undoWorkout();return}
 if(e.target.id==="nextRound"){nextRound();return}
 if(e.target.id==="missingExercises"&&cur){rememberWorkout();cur.roundEnd=false;cur.index=cur.exercises.findIndex(e=>e.sets[cur.round]&&!e.sets[cur.round].done);save(KEY.cur,cur);workout();return}
 if(e.target.id==="prevEx"&&cur){const prev=previousExercise();if(prev>=0){rememberWorkout();stopTimer(false);cur.index=prev;save(KEY.cur,cur);workout()}return}
 if(e.target.id==="nextEx"&&cur){
   if(cur.exercises[cur.index].sets[cur.round]&&!cur.exercises[cur.index].sets[cur.round].done&&!confirm("Gå videre uten å fullføre dette settet?"))return;
   rememberWorkout();stopTimer(false);advanceExercise();return;
 }
 if((e.target.id==="quitWorkout"||e.target.id==="finishWorkout")&&cur){if(confirm("Avslutte treningen og lagre det som er gjennomført?"))finish();return}
 if(e.target.id==="timerBtn"){startTimer(cfg[cur.index].duration||30);return}
 if(e.target.id==="detailClose"||e.target.id==="detailDone"){$("#exerciseDialog").close();return}
 if(e.target.id==="editorReset"){e.preventDefault();resetEdit();return}
 if(e.target.id==="editorSave"){e.preventDefault();saveEdit();$("#editorDialog").close();return}
 if(e.target.id==="saveSpotify"){localStorage.setItem(KEY.spot,$("#spotifyUrl").value.trim());toast("Spotify-lenke lagret ✓");return}
 if(e.target.id==="openSpotify"){let u=($("#spotifyUrl")?.value||localStorage.getItem(KEY.spot)||"").trim();window.open(u.startsWith("https://open.spotify.com/")?u:"https://open.spotify.com/","_blank","noopener");return}
 if(e.target.id==="exportData"){exportData();return}
 if(e.target.id==="undoFinish"){undoFinish();return}
 if(e.target.id==="finishClose"){$("#finishDialog").close();setView("home");return}
 if(e.target.id==="soundBtn"){const off=localStorage.getItem(KEY.sound)==="off";localStorage.setItem(KEY.sound,off?"on":"off");$("#soundIcon").textContent=off?"◐":"○";toast(off?"Lyd på":"Lyd av");return}
});
document.addEventListener("input",e=>{if(!cur||!e.target.matches("[data-set][data-field]"))return;const s=cur.exercises[cur.index].sets[Number(e.target.dataset.set)],f=e.target.dataset.field;if(f==="weight")s.weight=Math.max(0,Number(String(e.target.value).replace(",","."))||0);if(f==="reps")s.reps=Math.max(0,parseInt(e.target.value,10)||0);save(KEY.cur,cur)});
document.addEventListener("change",e=>{if(e.target.id==="importData"&&e.target.files[0])importData(e.target.files[0])});
$("#soundIcon").textContent=localStorage.getItem(KEY.sound)==="off"?"○":"◐";
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
render();