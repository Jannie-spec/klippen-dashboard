// Medarbejdervenlig visning (28. okt. 2026): "Dit arbejde i dag" øverst, fortryd efter gem,
// kopiér-knapper, valg af sted/platform gemt i adressen. Ændrer ingen data – kun visningen.

// ---------- Dit arbejde i dag ----------
function staffGroups(){
 const match=r=>(selected==='all'||r.property===selected)&&(platform==='all'||r.platform===platform);
 const all=nightReport.reviews.filter(match);
 const hold=r=>typeof removalHold==='function'&&!!removalHold(r);
 const open=all.filter(r=>r.replyStatus==='unanswered'&&!workflowState(r.id).answered);
 const dontTouch=all.filter(hold);
 const rest=open.filter(r=>!hold(r));
 const waitLeader=rest.filter(r=>reviewNeedsApproval(r)&&!workflowState(r.id).strategy);
 const replyNow=rest.filter(r=>!waitLeader.includes(r));
 return {replyNow,waitLeader,dontTouch};
}
function staffPlace(id){return properties.find(p=>p.id===id)?.name||id;}
function staffScore(r){return Number.isFinite(r.score)?`${String(r.score).replace('.',',')}/${r.scale}`:'';}
function renderTodayOverview(){
 const host=document.querySelector('#todayOverview');if(!host)return;const e=escapeHTML;
 const {replyNow,waitLeader,dontTouch}=staffGroups();
 const isLeader=teamRole==='manager';
 const updated=new Date(nightReport.observedAt).toLocaleString('da-DK',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Copenhagen'});
 const who=r=>`<strong>${e(r.author||'Gæst')}</strong> · ${e(staffPlace(r.property))} · ${e(r.platform)}${staffScore(r)?' · '+e(staffScore(r)):''}`;
 const nowItems=replyNow.map(r=>`<li>${who(r)}<div class="task-actions"><button type="button" data-copy-text="${e(suggestedReply(r))}">Kopiér svarforslag</button><a href="${e(ownerReplyUrl(r))}" target="_blank" rel="noopener noreferrer">Svar på ${e(r.platform)} ↗</a><a href="#${e(replyAnchor(r))}">Se kortet</a></div></li>`).join('');
 const waitItems=waitLeader.map(r=>`<li>${who(r)} <a href="#${e(replyAnchor(r))}">${isLeader?'Godkend svaret':'Se kortet'}</a></li>`).join('');
 const holdItems=dontTouch.map(r=>`<li>${who(r)}<span class="task-why">Claude prøver at få den fjernet. Svar ikke, før Claude giver besked.</span></li>`).join('');
 let issues='';
 if(teamRole){const reviews=nightReport.reviews.filter(r=>(selected==='all'||r.property===selected)&&(platform==='all'||r.platform===platform));
  const n=reviewAspectEvidence.flatMap(i=>{const r=reviews.find(r=>r.id===i.reviewId);return r?i.aspects.filter(a=>a.sentiment==='bad').map(a=>({...a,r})):[];}).filter(a=>!aspectCompleted(a)).length;
  issues=n?`<p class="task-more"><a href="#topicsFold" data-open-topics>${n} ${n===1?'fejl fra gæsterne mangler':'fejl fra gæsterne mangler'} at blive tjekket eller rettet →</a></p>`:'';}
 host.innerHTML=`<div class="task-head"><div><div class="eyebrow">DIT ARBEJDE I DAG</div><h2>Hvad skal du gøre?</h2></div><span class="task-updated">Opdateret ${e(updated)} · næste opdatering ca. kl. 13</span></div>
 <div class="task-groups">
  <section class="task-group task-now"><h3>✅ Svar nu <span>${replyNow.length}</span></h3>${nowItems?`<ul>${nowItems}</ul>`:'<p class="empty-text">Ingen lige nu. Godt gået!</p>'}</section>
  <section class="task-group task-wait"><h3>⏳ Venter på leder <span>${waitLeader.length}</span></h3>${waitItems?`<p class="task-why">${isLeader?'Du er leder: skriv og godkend, hvad vi svarer.':'Jannie, Thomas eller Martin godkender først, hvad vi svarer.'}</p><ul>${waitItems}</ul>`:'<p class="empty-text">Ingen.</p>'}</section>
  <section class="task-group task-hold"><h3>⛔ Svar ikke <span>${dontTouch.length}</span></h3>${holdItems?`<ul>${holdItems}</ul>`:'<p class="empty-text">Ingen.</p>'}</section>
 </div>${issues}${teamRole?'':'<p class="footnote">Du er ikke logget ind, så du kan ikke se, hvad kolleger allerede har markeret som svaret. Log ind øverst.</p>'}`;
 host.querySelector('[data-open-topics]')?.addEventListener('click',()=>{const d=document.querySelector('#topicsFold');if(d)d.open=true;});
}

// ---------- kopiér ----------
async function staffCopy(text,btn){
 const old=btn.textContent;
 try{await navigator.clipboard.writeText(text);btn.textContent='Kopieret ✓';}
 catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();try{document.execCommand('copy');btn.textContent='Kopieret ✓';}catch{btn.textContent='Markér og kopiér selv';}t.remove();}
 setTimeout(()=>{btn.textContent=old;},1600);
}
document.addEventListener('click',ev=>{
 const a=ev.target.closest('[data-copy-text]');if(a){staffCopy(a.dataset.copyText,a);return;}
 const b=ev.target.closest('[data-copy-reply]');if(b){const p=b.closest('details')?.querySelector('[data-reply-text]');if(p)staffCopy(p.textContent,b);}
});

// ---------- fortryd efter gem (ingen pop-up-dialoger) ----------
const staffFieldNames={fixed:'Fejlen er rettet',notReal:'Det var ikke en fejl',contacted:'Gæsten er kontaktet',strategy:'Godkendt af leder',answered:'Svaret på platformen',issueNote:'Notat',contactNote:'Notat',strategyNote:'Svarstrategi'};
let staffToastTimer=null;
function staffToast(html,undo){
 let t=document.querySelector('#staffToast');
 if(!t){t=document.createElement('div');t.id='staffToast';t.className='staff-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.append(t);}
 t.innerHTML=html+(undo?' <button type="button">Fortryd</button>':'');t.hidden=false;
 t.querySelector('button')?.addEventListener('click',async()=>{t.hidden=true;await undo();});
 clearTimeout(staffToastTimer);staffToastTimer=setTimeout(()=>{t.hidden=true;},undo?8000:3500);
}
let staffSaveQueue=Promise.resolve();
{const originalPersist=persistWorkflow;
 persistWorkflow=function(key,field,value){const run=staffSaveQueue.then(()=>staffPersist(key,field,value));staffSaveQueue=run.catch(()=>{});return run;};
 async function staffPersist(key,field,value){
  const before=workflowState(key)[field];
  const ok=await originalPersist(key,field,value);
  if(ok){
   const label=staffFieldNames[field]||'Ændringen';
   if(typeof value==='boolean')staffToast(`<strong>Gemt for hele teamet:</strong> ${escapeHTML(label)} ${value?'✓':'fjernet'}`,async()=>{const back=!!before;if(await originalPersist(key,field,back)){staffToast('Fortrudt.');renderNightReport();renderReviewTopics();}});
   else staffToast(`<strong>${escapeHTML(label)} gemt</strong> for hele teamet.`);
  }else staffToast(`<strong>Ikke gemt.</strong> ${escapeHTML(teamStatus||'')}`);
  return ok;
 }
}

// ---------- hjælpetekst under notefelter ----------
function staffNoteHints(root){
 root.querySelectorAll('textarea[data-workflow-key]').forEach(t=>{
  if(t.nextElementSibling?.classList.contains('note-hint'))return;
  const s=document.createElement('small');s.className='note-hint';
  s.textContent=t.disabled?'Log ind for at skrive her.':'Gemmes for hele teamet, når du klikker uden for feltet. Kun logget-ind medarbejdere kan se det.';
  t.after(s);
 });
}
new MutationObserver(()=>staffNoteHints(document)).observe(document.querySelector('main'),{childList:true,subtree:true});

// ---------- sted og platform i adressen (genindlæs og tilbage virker) ----------
{const q=new URLSearchParams(location.search);const st=q.get('sted'),pl=q.get('platform');
 let changed=false;
 if(st&&(st==='all'||properties.some(p=>p.id===st))){selected=st;changed=true;}
 if(pl&&platforms.includes(pl)){platform=pl;const sel=document.querySelector('#platform');if(sel)sel.value=pl;changed=true;}
 const originalRender=render;
 render=function(){originalRender();const u=new URL(location.href);
  selected==='all'?u.searchParams.delete('sted'):u.searchParams.set('sted',selected);
  platform==='all'?u.searchParams.delete('platform'):u.searchParams.set('platform',platform);
  if(u.href!==location.href)history.pushState({sted:selected,platform},'',u);};
 window.addEventListener('popstate',()=>{const q=new URLSearchParams(location.search);selected=q.get('sted')||'all';platform=q.get('platform')||'all';const sel=document.querySelector('#platform');if(sel)sel.value=platform;originalRender();});
 if(changed)originalRender();
}

{const st=document.querySelector('.stamp');if(st&&st.firstChild&&st.firstChild.nodeType===3)st.firstChild.textContent='Opdateret';}
renderNightReport();
staffNoteHints(document);
