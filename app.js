'use strict';
const KEY='runningComebackV1';
const defaultData=()=>({start:'2026-10-12',weekend:'Sunday',runs:[],weights:[],weightGoal:null});
let data;
try{data=JSON.parse(localStorage.getItem(KEY))||defaultData()}catch(e){data=defaultData()}
const $=id=>document.getElementById(id);
if(!Array.isArray(data.deletedStravaIds))data.deletedStravaIds=[];if(!Array.isArray(data.weights))data.weights=[];if(!('weightGoal' in data))data.weightGoal=null;if(!data.recent5kBenchmark)data.recent5kBenchmark='27:00';if(!data.adaptive||typeof data.adaptive!=='object')data.adaptive={level:0,proposal:null,lastReview:'',acceptedAt:''};
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const weeks=[
['Run/walk return','Mon & Thu: 6 × (2 min jog / 2 min walk). Weekend: 7 × (2 / 2). Add a 5-minute walk before and after.','14 min jogging'],
['Easy intervals','Three easy sessions; build towards 18–20 minutes total jogging using short walk breaks.','20 min jogging'],
['Longer blocks','Gradually extend comfortable jogging blocks, with walking as needed.','25 min jogging'],
['Consolidate','Repeat comfortable sessions rather than adding intensity.','25 min jogging'],
['Continuous running','Aim for an easy continuous 25–30-minute run if symptom-free.','30 min'],
['Aerobic base','Two shorter easy runs and one comfortable longer run.','35 min'],
['Endurance','Keep all sessions conversational; extend longest run carefully.','40 min'],
['Recovery week','Reduce or hold volume; check next-morning symptoms.','35–40 min'],
['Build distance','Gradually approach 7–8 km at an easy effort, if ready.','45–50 min'],
['Longer endurance','Approach 50–55 minutes comfortably; no racing.','50–55 min'],
['Controlled progression','Only if fully symptom-free and consistent, introduce a few short controlled pickups.','55–60 min'],
['10K assessment','Comfortable 10K only if prepared; otherwise continue building gradually.','Up to 10 km']];
const weekIndex=()=>{let days=Math.floor((new Date(today()+'T12:00:00')-new Date(data.start+'T12:00:00'))/86400000);return Math.max(0,Math.min(11,Math.floor(days/7)))};
const advice=()=>{const currentRuns=data.runs.filter(r=>r.date>=data.start&&r.date<=today());if(!currentRuns.length)return 'Start easy. Your Achilles response the following morning matters more than pace.';let r=currentRuns[currentRuns.length-1];if(r.pain==null||r.effort==null)return 'CHECK IN: imported run needs pain and effort feedback before coaching recommendations.';if(r.pain>=4||r.painType==='Sharp pain'||r.morning>=4)return 'REDUCE / PAUSE: pain or stiffness is elevated. Avoid progressing. Seek a clinician’s advice if symptoms persist, worsen or affect walking.';if(r.pain>0||r.morning>0)return 'HOLD: repeat or shorten your next easy session. Monitor symptoms, especially the next morning.';if(currentRuns.length<3)return 'GOOD START: keep the next session easy. Progress only after repeated symptom-free runs.';let last=currentRuns.slice(-3);if(last.every(x=>x.pain===0&&x.effort!=null&&(!x.morning||x.morning===0)&&x.effort<=5))return 'ON TRACK: recent runs were comfortable. Consider a small increase in running time, not pace, if recovery stays good.';return 'STEADY: maintain easy running and reassess after the next session.'};
// Store dates as ISO yyyy-mm-dd for safe sorting, but display UK dd.mm.yyyy.
const ukDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?`${value.slice(8,10)}.${value.slice(5,7)}.${value.slice(0,4)}`:String(value||'');
// Keep durations internally in minutes so existing data and calculations remain compatible.
const hmsToMinutes=value=>{const m=/^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(String(value||'').trim());return m?Number(m[1])*60+Number(m[2])+Number(m[3])/60:NaN};
// Automatically insert separators while entering six digits (HHMMSS).
// Four digits are interpreted as MMSS when the field loses focus.
function maskActivityTime(input){
 const digits=input.value.replace(/\D/g,'').slice(0,6);
 if(!digits){input.value='';return}
 if(digits.length<=2)input.value=digits;
 else if(digits.length<=4)input.value=digits.slice(0,2)+':'+digits.slice(2);
 else input.value=digits.slice(0,2)+':'+digits.slice(2,4)+':'+digits.slice(4);
}
function completeActivityTime(input){
 const digits=input.value.replace(/\D/g,'');
 if(!digits)return;
 if(digits.length<=4){const padded=digits.padStart(4,'0');input.value='00:'+padded.slice(0,2)+':'+padded.slice(2)}
 else if(digits.length<=6){const padded=digits.padStart(6,'0');input.value=padded.slice(0,2)+':'+padded.slice(2,4)+':'+padded.slice(4)}
}
for(const id of ['duration','editRunDuration']){
 const input=$(id);input.addEventListener('input',()=>maskActivityTime(input));input.addEventListener('blur',()=>completeActivityTime(input));
}
const minutesToHms=value=>{const seconds=Math.round(Number(value)*60);if(!Number.isFinite(seconds)||seconds<0)return '00:00:00';return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`};
const fmtPace=r=>r.distance>0?(()=>{let n=r.duration/r.distance;return `${Math.floor(Math.round(n*60)/60)}:${String(Math.round(n*60)%60).padStart(2,'0')}/km`})():'—';
function render(){let w=weekIndex();$('weekNumber').textContent=`${w+1} / 12`;$('runCount').textContent=data.runs.filter(r=>r.date>=data.start).length;$('totalKm').textContent=(data.runs.filter(r=>r.date>=data.start).reduce((a,r)=>a+r.distance,0)).toFixed(1)+' km';$('nextTitle').textContent=weeks[Math.min(11,data.adaptive.level)][0];$('nextDescription').textContent=weeks[Math.min(11,data.adaptive.level)][1];$('nextDay').textContent=data.weekend==='Saturday'?'Mon · Thu · Sat':'Mon · Thu · Sun';$('advice').textContent=advice();$('advice').className='notice'+(/REDUCE|HOLD/.test(advice())?' warn':'');$('planRows').innerHTML=weeks.map((r,i)=>`<div class="week ${i===data.adaptive.level?'current':''}"><strong>Week ${i+1} · ${r[0]}</strong><p>${r[1]}</p><small>Longest session: ${r[2]}</small></div>`).join('');$('longest').textContent=(Math.max(0,...data.runs.filter(r=>r.date>=data.start).map(r=>r.runningMinutes||0))).toFixed(0)+' min';$('pace').textContent=data.runs.filter(r=>r.date>=data.start).length?fmtPace(data.runs.filter(r=>r.date>=data.start).slice(-1)[0]):'—';let recent=data.runs.filter(r=>r.date>=data.start).slice(-12),max=Math.max(1,...recent.map(r=>r.distance));$('bars').innerHTML=recent.length?recent.map(r=>`<div class="barwrap"><div>${r.distance.toFixed(1)}</div><div class="bar" style="height:${Math.max(4,Math.round(r.distance/max*110))}px"></div><div>${ukDate(r.date).slice(0,5)}</div></div>`).join(''):'<p class="muted">Log your first run to see your progress.</p>';const filteredHistory=data.runs.filter(r=>$('historyFilter').value==='all'||($('historyFilter').value==='historical'?r.date<'2026-05-01':r.date>=data.start));$('history').innerHTML=filteredHistory.length?[...filteredHistory].reverse().map(r=>`<div class="historyitem"><strong>${ukDate(r.date)} · ${r.distance.toFixed(2)} km · ${minutesToHms(r.duration)}</strong><span>${fmtPace(r)} · Effort ${r.effort}/10 · Pain ${r.pain==null?'not entered':r.pain+'/10'} · Morning ${r.morning==null?'pending':r.morning+'/10'}</span><div>${escapeHTML(r.notes||'')}</div><div class="activity-actions"><button type="button" class="tiny" data-edit-run="${escapeHTML(String(r.id))}">Edit activity</button><button type="button" class="tiny danger-button" data-delete-run="${escapeHTML(String(r.id))}">Delete</button></div></div>`).join(''):'<p class="muted">No runs recorded yet.</p>';$('startDate').value=data.start;$('weekend').value=data.weekend;$('weightGoal').value=data.weightGoal??'';$('recent5kSetting').value=data.recent5kBenchmark;renderWeights();renderCoachingDashboard();renderAdaptive();}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function go(page){document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===page));document.querySelectorAll('nav button').forEach(el=>el.classList.toggle('selected',el.dataset.go===page));window.scrollTo(0,0)}
$('historyFilter').addEventListener('change',render);
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
['effort','pain','morningPain'].forEach(id=>$(id).addEventListener('input',()=>$(id+'Value').textContent=$(id).value));
$('runDate').value=today();$('weightDate').value=today();
$('runForm').addEventListener('submit',e=>{e.preventDefault();completeActivityTime($('duration'));let r={id:Date.now(),date:$('runDate').value,session:$('session').value,distance:Number($('distance').value),duration:hmsToMinutes($('duration').value),runningMinutes:Number($('runningMinutes').value),effort:Number($('effort').value),pain:Number($('pain').value),location:$('location').value,painType:$('painType').value,notes:$('notes').value,morning:null};if(!r.date||r.distance<=0||!Number.isFinite(r.duration)||r.duration<=0||r.runningMinutes>r.duration){alert('Please enter a valid date, distance, total time and running time.');return}data.runs.push(r);data.runs.sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);save();render();$('savedNotice').classList.remove('hidden');$('savedNotice').textContent='Run saved. '+advice();$('runForm').reset();$('runDate').value=today();$('effortValue').textContent='3';$('painValue').textContent='0';go('home')});
$('saveMorning').addEventListener('click',()=>{const current=data.runs.filter(r=>r.date>=data.start&&r.date<=today());if(!current.length){$('morningStatus').textContent='Log a comeback run first.';return}let r=current[current.length-1];if(r.date===today()){ $('morningStatus').textContent='Please complete this check-in tomorrow morning, not immediately after your run.';return;}r.morning=Number($('morningPain').value);save();render();$('morningStatus').textContent=`Saved for your latest run (${r.date}).`});
$('saveSettings').addEventListener('click',()=>{if(!$('startDate').value)return;data.start=$('startDate').value;data.weekend=$('weekend').value;const benchmark=$('recent5kSetting').value.trim();if(!/^\d{1,2}:[0-5]\d$/.test(benchmark)){alert('Enter a valid 5K benchmark, for example 27:00.');return;}data.recent5kBenchmark=benchmark;data.weightGoal=$('weightGoal').value?Number($('weightGoal').value):null;save();render();alert('Settings saved')});
function download(name,body,mime){const blob=new Blob([body],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportData').addEventListener('click',()=>download('running-comeback-backup-'+today()+'.json',JSON.stringify(data,null,2),'application/json'));
$('importData').addEventListener('change',async e=>{let f=e.target.files[0];if(!f)return;try{let obj=JSON.parse(await f.text());if(!Array.isArray(obj.runs)||typeof obj.start!=='string')throw Error('Invalid backup');if(!confirm('Replace all existing running history with this backup?'))return;data={deletedStravaIds:Array.isArray(obj.deletedStravaIds)?obj.deletedStravaIds:[],start:obj.start,weekend:obj.weekend==='Saturday'?'Saturday':'Sunday',runs:obj.runs,weights:Array.isArray(obj.weights)?obj.weights:[],weightGoal:obj.weightGoal??null,recent5kBenchmark:obj.recent5kBenchmark||'27:00',adaptive:obj.adaptive&&typeof obj.adaptive==='object'?obj.adaptive:{level:0,proposal:null,lastReview:'',acceptedAt:''}};save();render();alert('Backup restored')}catch(err){alert('Could not import: '+err.message)}e.target.value=''});
$('copyCoach').addEventListener('click',async()=>{let summary=`Running Comeback coaching review. Goal sub-50-minute 10K; previous best 55:00; age 57; prior calf/Achilles injury May 2026. Week ${weekIndex()+1}. Schedule Monday, Thursday, weekend (max 3/week). Recommendation: ${advice()}\nApproved training level: ${data.adaptive.level+1}/12. Weekly assessment: ${assessWeek().reason}\nWeight: ${data.weights.length?data.weights[data.weights.length-1].kg+' kg':'not recorded'}; target ${data.weightGoal??'none'} kg.\nRecent runs:\n`+data.runs.slice(-8).map(r=>`${ukDate(r.date)}: ${r.distance}km in ${minutesToHms(r.duration)}; jogging ${r.runningMinutes}min; effort ${r.effort}/10; pain ${r.pain??'not entered'}/10 (${r.location}, ${r.painType}); next morning ${r.morning??'not logged'}/10; notes ${r.notes||'-'}`).join('\n')+'\nPlease assess progress and recommend the next safe training sessions.';try{await navigator.clipboard.writeText(summary);$('copyStatus').textContent='Copied. Paste into your ChatGPT conversation.'}catch(e){download('coaching-summary.txt',summary,'text/plain');$('copyStatus').textContent='Downloaded summary text instead.'}});
function renderWeights(){const entries=[...data.weights].sort((a,b)=>a.date.localeCompare(b.date));const first=entries[0],last=entries[entries.length-1];$('latestWeight').textContent=last?last.kg.toFixed(1)+' kg':'—';$('weightChange').textContent=first&&last?(last.kg-first.kg>0?'+':'')+(last.kg-first.kg).toFixed(1)+' kg':'—';$('weightGoalDisplay').textContent=data.weightGoal?data.weightGoal.toFixed(1)+' kg':'—';$('weightHistory').innerHTML=entries.length?[...entries].reverse().slice(0,12).map(e=>`<div class="historyitem"><strong>${escapeHTML(e.date)} · ${e.kg.toFixed(1)} kg</strong><button type="button" class="tiny" data-delete-weight="${escapeHTML(e.date)}">Remove</button></div>`).join(''):'<p class="muted">No weight entries yet.</p>';const chart=$('weightChart');if(entries.length<2){chart.innerHTML='<p class="muted">Add at least two measurements to see a trend.</p>';return}const values=entries.slice(-16),lo=Math.min(...values.map(e=>e.kg))-1,hi=Math.max(...values.map(e=>e.kg))+1;const coords=values.map((e,i)=>`${20+i*280/(values.length-1)},${120-(e.kg-lo)/(hi-lo)*100}`).join(' ');chart.innerHTML=`<svg viewBox="0 0 320 145" role="img" aria-label="Weight trend from ${values[0].kg.toFixed(1)} to ${values[values.length-1].kg.toFixed(1)} kilograms"><line x1="20" y1="120" x2="300" y2="120" stroke="#cadbd2"/><polyline points="${coords}" fill="none" stroke="#198364" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${values.map((e,i)=>`<circle cx="${20+i*280/(values.length-1)}" cy="${120-(e.kg-lo)/(hi-lo)*100}" r="3" fill="#198364"/>`).join('')}<text x="20" y="140" font-size="10" fill="#506a70">${escapeHTML(values[0].date.slice(5))}</text><text x="260" y="140" font-size="10" fill="#506a70">${escapeHTML(values[values.length-1].date.slice(5))}</text></svg>`;}
$('weightForm').addEventListener('submit',e=>{e.preventDefault();const date=$('weightDate').value,kg=Number($('weightKg').value);if(!date||!Number.isFinite(kg)||kg<25||kg>350)return;data.weights=data.weights.filter(x=>x.date!==date);data.weights.push({date,kg});data.weights.sort((a,b)=>a.date.localeCompare(b.date));save();render();$('weightMessage').textContent='Weight saved. A measurement on the same date is updated rather than duplicated.';$('weightKg').value='';});
$('weightHistory').addEventListener('click',e=>{const date=e.target.dataset.deleteWeight;if(!date)return;if(!confirm('Remove weight entry for '+date+'?'))return;data.weights=data.weights.filter(x=>x.date!==date);save();render()});

// Manual Strava export importer: never sends data to any external server.
function parseCSV(s){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){let c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows}
function seconds(s){if(typeof s==='number')return s;let t=String(s||'').trim();if(/^\d+(\.\d+)?$/.test(t))return Number(t);let a=t.split(':').map(Number);if(a.some(x=>!Number.isFinite(x)))return NaN;return a.reduce((n,x)=>n*60+x,0)}
function dateISO(s){let t=String(s||'').trim();if(/^\d{4}-\d\d-\d\d/.test(t))return t.slice(0,10);let d=new Date(t);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function normalizeStrava(a){const lower={};Object.entries(a).forEach(([k,v])=>lower[k.toLowerCase().trim()]=v);const get=(...names)=>{for(const n of names)if(lower[n.toLowerCase()]!==undefined&&lower[n.toLowerCase()]!=='')return lower[n.toLowerCase()];return ''};let type=String(get('Activity Type','sport_type','type')).toLowerCase();if(!['run','trailrun','virtualrun','treadmill','trail run','virtual run'].includes(type))return null;let date=dateISO(get('Activity Date','start_date_local','start_date','date'));let rawDist=get('Distance','distance');let dist=Number(rawDist);if(!Number.isFinite(dist)||dist<=0||!date)return null; // Strava API JSON distances are metres; CSV distance is usually kilometres (account units).
let api=typeof a.distance==='number'&&('moving_time'in a||'elapsed_time'in a);if(api)dist/=1000;
let time=get('Moving Time','moving_time','Elapsed Time','elapsed_time','duration');let sec=seconds(time);if(!Number.isFinite(sec)||sec<=0)return null;let id=String(get('Activity ID','id','activity_id')||'');return {id:id?'strava-'+id:'strava-'+date+'-'+dist.toFixed(3)+'-'+Math.round(sec),stravaId:id||null,source:'Strava export',date,session:'Strava import',distance:Math.round(dist*100)/100,duration:Math.round(sec/6)/10,runningMinutes:Math.round(sec/6)/10,effort:null,pain:null,location:'Not recorded',painType:'Not recorded',notes:String(get('Activity Name','name')||''),morning:null,averageHR:Number(get('Average Heart Rate','average_heartrate'))||null}}
$('stravaFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{let txt=await f.text(),rows;if(f.name.toLowerCase().endsWith('.json')){let obj=JSON.parse(txt);rows=Array.isArray(obj)?obj:Array.isArray(obj.activities)?obj.activities:[];}else{let table=parseCSV(txt);if(table.length<2)throw Error('CSV contains no activity rows');let headers=table.shift().map(x=>x.replace(/^\uFEFF/,'').trim());rows=table.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])))}let candidates=rows.map(normalizeStrava).filter(Boolean);if(!candidates.length)throw Error('No compatible running activities found. Check that the file is activities.csv and that distances are in kilometres.');if(!confirm(`Found ${candidates.length} running activities. Import into this device? Existing records will be preserved.`))return;let existing=new Set(data.runs.map(r=>String(r.stravaId?'strava-'+r.stravaId:r.id))),added=0;for(let r of candidates){if(existing.has(String(r.id))||(r.stravaId&&data.deletedStravaIds.includes(String(r.stravaId))))continue;data.runs.push(r);existing.add(String(r.id));added++}data.runs.sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));save();render();$('stravaStatus').textContent=`Imported ${added} runs; skipped ${candidates.length-added} duplicates. Add injury feedback under Progress → Training history.`;}catch(err){$('stravaStatus').textContent='Import failed: '+err.message}e.target.value=''});
// Activity editing uses an explicit form so imported and manually logged runs are equally manageable.
let editingRunId=null;
function openActivityEditor(id){
 const r=data.runs.find(x=>String(x.id)===String(id));if(!r)return;
 editingRunId=String(r.id);
 $('editRunSource').textContent=r.stravaId?'Imported from Strava · changes are local to this app':'Manually logged activity';
 $('editRunDate').value=r.date||'';
 $('editRunDistance').value=r.distance;
 $('editRunDuration').value=minutesToHms(r.duration);
 $('editRunRunning').value=r.runningMinutes??r.duration;
 $('editRunEffort').value=r.effort??'';
 $('editRunPain').value=r.pain??'';
 $('editRunMorning').value=r.morning??'';
 $('editRunLocation').value=r.location||'';
 $('editRunPainType').value=r.painType||'None';
 $('editRunNotes').value=r.notes||'';
 $('activityEditor').classList.remove('hidden');
 $('editRunDate').focus();
}
function closeActivityEditor(){editingRunId=null;$('activityEditor').classList.add('hidden')}
$('closeActivityEditor').addEventListener('click',closeActivityEditor);
$('cancelActivityEditor').addEventListener('click',closeActivityEditor);
$('activityEditor').addEventListener('click',e=>{if(e.target===$('activityEditor'))closeActivityEditor()});
$('editActivityForm').addEventListener('submit',e=>{
 e.preventDefault();completeActivityTime($('editRunDuration'));
 const r=data.runs.find(x=>String(x.id)===editingRunId);if(!r)return;
 const distance=Number($('editRunDistance').value),duration=hmsToMinutes($('editRunDuration').value),running=Number($('editRunRunning').value);
 if(!$('editRunDate').value||!Number.isFinite(distance)||distance<=0||!Number.isFinite(duration)||duration<=0||!Number.isFinite(running)||running<0||running>duration){alert('Enter a valid date, distance, duration and running time.');return}
 const effort=$('editRunEffort').value,pain=$('editRunPain').value,morning=$('editRunMorning').value;
 Object.assign(r,{date:$('editRunDate').value,distance,duration,runningMinutes:running,
 effort:effort===''?null:Number(effort),pain:pain===''?null:Number(pain),morning:morning===''?null:Number(morning),
 location:$('editRunLocation').value.slice(0,120),painType:$('editRunPainType').value,notes:$('editRunNotes').value.slice(0,1000)});
 data.runs.sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
 save();closeActivityEditor();render();
});
$('history').addEventListener('click',e=>{
 const edit=e.target.closest('[data-edit-run]'),del=e.target.closest('[data-delete-run]');
 if(edit){openActivityEditor(edit.dataset.editRun);return}
 if(!del)return;
 const r=data.runs.find(x=>String(x.id)===del.dataset.deleteRun);if(!r)return;
 const message=`Delete the ${r.distance.toFixed(2)} km activity on ${ukDate(r.date)}?`+(r.stravaId?'\\n\\nThis will remove it from Running Comeback and prevent it being re-imported on future Strava syncs. It will NOT delete the activity from Strava.':'')+'\\n\\nThis cannot be undone except by restoring a backup.';
 if(!confirm(message))return;
 if(r.stravaId&&!data.deletedStravaIds.includes(String(r.stravaId)))data.deletedStravaIds.push(String(r.stravaId));
 data.runs=data.runs.filter(x=>x!==r);
 save();render();
});



// Adaptive coaching: local, rule-based, no network or background scheduler.
const dayNumber=date=>Math.floor(new Date(date+'T12:00:00').getTime()/86400000);
const recentComeback=days=>data.runs.filter(r=>r.date>=data.start&&r.date<=today()&&dayNumber(today())-dayNumber(r.date)<days);
function assessWeek(){
 const runs=recentComeback(7),older=recentComeback(14).filter(r=>dayNumber(today())-dayNumber(r.date)>=7);
 const km=runs.reduce((a,r)=>a+(Number(r.distance)||0),0),oldKm=older.reduce((a,r)=>a+(Number(r.distance)||0),0);
 const missing=runs.filter(r=>r.pain==null||r.effort==null||r.morning==null);
 const high=runs.some(r=>Number(r.pain)>=4||Number(r.morning)>=4||String(r.painType||'').toLowerCase().includes('sharp'));
 const mild=runs.some(r=>Number(r.pain)>0||Number(r.morning)>0||Number(r.effort)>5);
 const tooMany=runs.length>3;
 let type='hold',reason='Not enough recent completed sessions to justify progressing.';
 if(!runs.length)reason='No comeback runs in the last seven days. Keep the current level and restart gently.';
 else if(high){type='recover';reason='Significant pain, stiffness or sharp pain reported. Pause progression and consider assessment by a physiotherapist.';}
 else if(tooMany){type='hold';reason='More than three runs recorded this week. Do not add another session.';}
 else if(missing.length){type='checkin';reason=`${missing.length} run(s) need effort, pain or next-morning recovery feedback before a training increase can be considered.`;}
 else if(mild){type='hold';reason='Symptoms or higher effort reported. Repeat or reduce the current level and monitor recovery.';}
 else if(runs.length<3){type='hold';reason='Fewer than three completed, fully checked-in runs. Consolidate this level first.';}
 else if(oldKm>0&&km>oldKm*1.15){type='hold';reason='Weekly distance already increased substantially compared with the previous week. Consolidate rather than increase again.';}
 else if(data.adaptive.level>=11){type='hold';reason='You are at the final programme level. Maintain consistency rather than progressing automatically.';}
 else{type='progress';reason='Three comfortable runs, complete recovery feedback and no reported symptoms. A modest increase in easy running time may be appropriate.';}
 return {type,reason,runs:runs.length,km,oldKm,missing:missing.length,level:Math.max(0,Math.min(11,data.adaptive.level))};
}
function renderAdaptive(){
 const a=assessWeek(),proposal=data.adaptive.proposal;
 $('adaptiveSummary').textContent=`Last 7 days: ${a.runs} run(s), ${a.km.toFixed(1)} km. Current approved level: ${a.level+1} / 12.`;
 $('activePlanNote').textContent=`Approved training level: ${a.level+1} / 12 (${weeks[a.level][0]}). Calendar week ${weekIndex()+1} / 12 is for reference only; progression needs your approval.`;
 $('adaptiveProposal').textContent=proposal?`${proposal.label}: ${proposal.reason}`:'Press Review my week to generate a recommendation. No automatic training increases.';
 $('adaptiveProposal').className='notice'+(proposal&&proposal.type==='recover'?' warn':'');
 $('acceptPlan').disabled=!(proposal&&proposal.type==='progress'&&proposal.target>data.adaptive.level&&proposal.reviewDate===today()&&assessWeek().type==='progress');
 const latest=recentComeback(14).slice(-1)[0];
 if(latest&&latest.morning==null){$('morningStatus').textContent=`Recovery check-in still needed for ${ukDate(latest.date)}. Only record it the morning after that run.`;}
 if(new Date().getDay()===0&&data.adaptive.lastReview!==today())$('adaptiveStatus').textContent='Sunday review available. Tap Review my week to see the recommendation.';
}
$('reviewWeek').addEventListener('click',()=>{
 const a=assessWeek();let label={progress:'PROPOSE: progress one level',hold:'MAINTAIN: keep current level',recover:'RECOVER: pause progression',checkin:'CHECK-IN NEEDED: no increase'}[a.type];
 data.adaptive.proposal={type:a.type,target:a.type==='progress'?Math.min(11,a.level+1):a.level,reason:a.reason,label,reviewDate:today()};
 data.adaptive.lastReview=today();save();render();$('adaptiveStatus').textContent='Review complete. A progression is only applied if you approve it.';
});
$('acceptPlan').addEventListener('click',()=>{
 const a=assessWeek(),p=data.adaptive.proposal;
 if(!p||p.type!=='progress'||a.type!=='progress'||p.target!==a.level+1||p.reviewDate!==today())return;
 if(!confirm(`Approve level ${p.target+1}: ${weeks[p.target][0]}? Continue only if recovery remains comfortable.`))return;
 data.adaptive.level=p.target;data.adaptive.acceptedAt=today();data.adaptive.proposal=null;save();render();$('adaptiveStatus').textContent='New level approved. Keep running easy and monitor next-morning symptoms.';
});
$('keepPlan').addEventListener('click',()=>{data.adaptive.proposal=null;data.adaptive.lastReview=today();save();render();$('adaptiveStatus').textContent='Current level retained. You can review again whenever needed.';});

if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();

// Live Strava integration (v4). Private key is entered on device, never shipped in source.
const STRAVA_API='https://running-comeback-strava.drwhobe12.workers.dev';
const stravaInput=$('stravaAccessKey'), stravaRemember=$('rememberStravaKey'), stravaStatus=$('liveStravaStatus');
try {const remembered=localStorage.getItem('runningComebackStravaKey');if(remembered){stravaInput.value=remembered;stravaRemember.checked=true}}catch(e){}
$('forgetStravaKey').addEventListener('click',()=>{stravaInput.value='';stravaRemember.checked=false;sessionStorage.removeItem('runningComebackStravaKey');localStorage.removeItem('runningComebackStravaKey');stravaStatus.textContent='Key forgotten on this device.'});
$('syncStrava').addEventListener('click',async()=>{
 const key=stravaInput.value.trim()||sessionStorage.getItem('runningComebackStravaKey');
 if(!key){stravaStatus.textContent='Enter your APP_ACCESS_KEY first.';return}
 $('syncStrava').disabled=true;stravaStatus.textContent='Retrieving your runs securely from Strava…';
 try{
  if(stravaRemember.checked)localStorage.setItem('runningComebackStravaKey',key);
  else{localStorage.removeItem('runningComebackStravaKey');sessionStorage.setItem('runningComebackStravaKey',key)}
  let count=0,seen=0,added=0;
  const existing=new Set([...data.runs.map(r=>String(r.stravaId||'')).filter(Boolean),...data.deletedStravaIds]);
  for(let page=1;page<=10;page++){
   const response=await fetch(STRAVA_API+'/activities?page='+page,{headers:{'Authorization':'Bearer '+key},cache:'no-store'});
   if(!response.ok){let message='HTTP '+response.status;try{const j=await response.json();message=j.error||message}catch(e){}throw Error(message)}
   const activities=await response.json();if(!Array.isArray(activities))throw Error('Unexpected activity response');
   for(const a of activities){
    seen++;if(!a.id||existing.has(String(a.id)))continue;
    const km=Number(a.distance)/1000,mins=Number(a.moving_time)/60;
    if(!Number.isFinite(km)||km<=0||!Number.isFinite(mins)||mins<=0)continue;
    const date=String(a.start_date||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
    data.runs.push({id:'strava-'+a.id,stravaId:String(a.id),source:'Strava live',date,session:'Strava import',distance:Math.round(km*100)/100,duration:Math.round(mins*10)/10,runningMinutes:Math.round(mins*10)/10,effort:null,pain:null,location:'Not recorded',painType:'Not recorded',notes:String(a.name||''),morning:null,averageHR:Number(a.average_heartrate)||null,elevationGain:Number(a.total_elevation_gain)||null});
    existing.add(String(a.id));added++;
   }
   if(activities.length<100)break;
  }
  data.runs.sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
  save();render();stravaStatus.textContent=`Sync complete: ${added} new runs imported, ${seen} Strava activities checked. Add injury feedback under Progress → Training history.`;
 }catch(err){stravaStatus.textContent='Sync failed: '+err.message+'. Check your key and Strava connection.'}
 finally{$('syncStrava').disabled=false}
});


function isoDaysAgo(n){const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function formatRace(minutes){if(!Number.isFinite(minutes))return '—';let sec=Math.round(minutes*60);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}
function makeWeeklyReport(){
 const last7=isoDaysAgo(6), prior7=isoDaysAgo(13),now=today();
 const recent=data.runs.filter(r=>r.date>=last7&&r.date<=now&&r.date>=data.start);
 const prior=data.runs.filter(r=>r.date>=prior7&&r.date<last7&&r.date>=data.start);
 const km=a=>a.reduce((s,r)=>s+(Number(r.distance)||0),0);
 const checked=recent.filter(r=>r.pain!=null&&r.effort!=null&&r.morning!=null);
 const flagged=recent.filter(r=>r.pain>=4||r.morning>=4||r.painType==='Sharp pain');
 const mild=recent.filter(r=>(r.pain>0||r.morning>0)&&!flagged.includes(r));
 const missing=recent.filter(r=>r.pain==null||r.effort==null||r.morning==null);
 const weights=[...data.weights].sort((a,b)=>a.date.localeCompare(b.date));const latest=weights.at(-1),older=[...weights].reverse().find(w=>w.date<=isoDaysAgo(7));
 let recommendation=flagged.length?'Reduce or pause running progression; persistent or significant symptoms warrant clinical assessment.':mild.length?'Hold training load and check the next-morning response before progressing.':missing.length?'Complete pain, effort and next-morning feedback before deciding whether to progress.':recent.length<2?'Build consistency with easy run/walk sessions; do not increase speed.':'If comfortable throughout and the next morning, maintain consistency and consider only a small increase in easy running time.';
 return {recent,prior,missing,flagged,km:km(recent),priorKm:km(prior),recommendation,weightText:latest?`${latest.kg.toFixed(1)} kg${older?' ('+(latest.kg-older.kg>=0?'+':'')+(latest.kg-older.kg).toFixed(1)+' kg vs ≥7 days ago)':''}`:'Not recorded',checked:checked.length};
}
function renderCoachingDashboard(){
 const all=data.runs,comeback=all.filter(r=>r.date>=data.start&&r.date<=today()),historic=all.filter(r=>r.date<'2026-05-01');
 const best=target=>{let eligible=historic.filter(r=>Math.abs(r.distance-target)<=target*0.03&&r.duration>0);return eligible.length?formatRace(Math.min(...eligible.map(r=>r.duration*target/r.distance))):'—'};
 $('historic5k').textContent=best(5);$('historic10k').textContent=best(10);
 const qualifying5k=historic.filter(r=>Math.abs(r.distance-5)<=0.15&&r.duration>0).sort((a,b)=>b.date.localeCompare(a.date));
 const recent5kRun=qualifying5k[0];
 $('recent5k').textContent=recent5kRun?formatRace(recent5kRun.duration*5/recent5kRun.distance):data.recent5kBenchmark;
 $('recent5k').title=recent5kRun?'Latest qualifying pre-injury 5K: '+ukDate(recent5kRun.date):'Manual benchmark (no qualifying historical 5K found)';const comeback5=comeback.filter(r=>Math.abs(r.distance-5)<=0.15&&r.duration>0);$('comeback5k').textContent=comeback5.length?formatRace(Math.min(...comeback5.map(r=>r.duration*5/r.distance))):'Not tested';
 $('comebackKm').textContent=comeback.reduce((s,r)=>s+r.distance,0).toFixed(1);
 const rep=makeWeeklyReport();$('weekKm').textContent=rep.km.toFixed(1)+' km';$('weekRuns').textContent=rep.recent.length;
 $('comebackLongest').textContent=comeback.length?Math.max(...comeback.map(r=>r.distance)).toFixed(1)+' km':'—';
 const bins=[];for(let i=7;i>=0;i--){const end=isoDaysAgo(i*7),start=isoDaysAgo(i*7+6);bins.push({label:ukDate(end).slice(0,5),km:comeback.filter(r=>r.date>=start&&r.date<=end).reduce((s,r)=>s+r.distance,0)})}
 const max=Math.max(1,...bins.map(b=>b.km));$('weeklyBars').innerHTML=bins.map(b=>`<div class="barwrap"><div>${b.km.toFixed(1)}</div><div class="bar" style="height:${Math.max(3,b.km/max*115)}px"></div><div>${b.label}</div></div>`).join('');
 const hrs=comeback.filter(r=>r.averageHR>0).slice(-8);$('heartRateTrend').innerHTML=hrs.length?hrs.map(r=>`<div class="historyitem">${escapeHTML(ukDate(r.date))} · ${Math.round(r.averageHR)} bpm · ${r.distance.toFixed(1)} km</div>`).join(''):'<p class="muted">Heart-rate data will appear here after new runs are imported.</p>';
 const pain=comeback.filter(r=>r.pain!=null||r.morning!=null).slice(-8);$('painTrend').innerHTML=pain.length?pain.map(r=>`<div class="historyitem">${escapeHTML(ukDate(r.date))} · Pain ${r.pain??'—'}/10 · Next morning ${r.morning??'pending'}/10</div>`).join(''):'<p class="muted">No injury feedback logged for comeback runs yet.</p>';
 $('weeklyReport').innerHTML=`<p><strong>Last 7 days:</strong> ${rep.recent.length} run(s), ${rep.km.toFixed(1)} km. Previous 7 days: ${rep.priorKm.toFixed(1)} km.</p><p><strong>Recovery:</strong> ${rep.checked} fully reviewed, ${rep.missing.length} need check-in, ${rep.flagged.length} elevated symptom flags.</p><p><strong>Weight:</strong> ${escapeHTML(rep.weightText)}</p><div class="notice${rep.flagged.length?' warn':''}">${escapeHTML(rep.recommendation)}</div>`;
}
$('copyWeeklyReport').addEventListener('click',async()=>{const r=makeWeeklyReport();const content=`RUNNING COMEBACK — WEEKLY COACHING REPORT\nProgramme week ${weekIndex()+1}, goal sub-50 10K, age 57, recent relevant pre-injury 5K ${data.recent5kBenchmark}, older historical 5K PB 25:04 (not used for current pace guidance), previous calf/Achilles injury May 2026.\nLast 7 days: ${r.recent.length} runs, ${r.km.toFixed(1)} km; prior 7 days ${r.priorKm.toFixed(1)} km.\nWeight: ${r.weightText}.\nFeedback missing: ${r.missing.length}; elevated symptom flags: ${r.flagged.length}.\n${r.recent.map(x=>`${ukDate(x.date)}: ${x.distance} km, ${minutesToHms(x.duration)}, HR ${x.averageHR??'—'}, effort ${x.effort??'not recorded'}, pain ${x.pain??'not recorded'}, next-morning ${x.morning??'not recorded'}, notes ${x.notes||'—'}`).join('\n')}\nSuggested caution: ${r.recommendation}\nPlease review and recommend the next three sessions, considering my maximum of three days per week.`;try{await navigator.clipboard.writeText(content);$('weeklyCopyStatus').textContent='Copied — paste into ChatGPT.'}catch(e){download('weekly-running-coach-'+today()+'.txt',content,'text/plain');$('weeklyCopyStatus').textContent='Downloaded report.'}});

const AUTO_SYNC_KEY='runningComebackAutoSync';
$('autoSyncStrava').checked=localStorage.getItem(AUTO_SYNC_KEY)==='yes';
$('autoSyncStrava').addEventListener('change',()=>{localStorage.setItem(AUTO_SYNC_KEY,$('autoSyncStrava').checked?'yes':'no');if($('autoSyncStrava').checked&&!localStorage.getItem('runningComebackStravaKey')){$('liveStravaStatus').textContent='To enable automatic sync, tick Remember key and run Sync Strava once.'}});
if($('autoSyncStrava').checked&&localStorage.getItem('runningComebackStravaKey')){
 window.addEventListener('load',()=>{if(navigator.onLine)$('syncStrava').click()},{once:true});
}
