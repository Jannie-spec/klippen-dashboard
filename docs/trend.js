// Udvikling over tid: bygges af de daglige kontrollerede målinger i nightReport.liveSnapshots
// (og evt. reviewHistory fra history.js, når ældre anmeldelser er hentet ind).
(function(){
 const fmtNum=(n,scale)=>n==null?'–':n.toLocaleString('da-DK',{minimumFractionDigits:scale===10?1:1,maximumFractionDigits:2});
 const fmtDate=iso=>new Date(iso).toLocaleDateString('da-DK',{day:'numeric',month:'short',timeZone:'Europe/Copenhagen'});
 const dayKey=iso=>new Date(iso).toLocaleDateString('sv-SE',{timeZone:'Europe/Copenhagen'});

 function buildSeries(){
  const snaps=(typeof nightReport!=='undefined'&&nightReport.liveSnapshots)||[];
  const groups=new Map();
  for(const s of snaps){
   if(!s.observedAt||s.score==null||!Number.isFinite(Number(s.score)))continue;
   const k=s.property+'|'+s.platform;
   if(!groups.has(k))groups.set(k,new Map());
   const byDay=groups.get(k),d=dayKey(s.observedAt),prev=byDay.get(d);
   if(!prev||prev.observedAt<=s.observedAt)byDay.set(d,s);
  }
  const series=[];
  for(const [k,byDay] of groups){
   const pts=[...byDay.values()].sort((a,b)=>a.observedAt<b.observedAt?-1:1).map(s=>({at:s.observedAt,score:Number(s.score),count:Number(s.count)||0,ok:s.eligibleForTrend!==false,scale:s.scale||(['Expedia','Booking.com','VRBO'].includes(s.platform)?10:5)}));
   const [property,plat]=k.split('|');
   series.push({property,platform:plat,scale:pts[pts.length-1].scale,pts});
  }
  return series;
 }

 function summarize(s){
  // Kun sammenlignelige punkter (fx ikke efter Tripadvisor har slettet ældre anmeldelser).
  let start=0;
  for(let i=s.pts.length-1;i>0;i--){if(!s.pts[i].ok||!s.pts[i-1].ok){start=i;break;}}
  const comparable=s.pts.slice(start).filter(p=>p.ok);
  const usable=comparable.length>=2?comparable:s.pts.filter(p=>p.ok);
  const first=usable[0]||s.pts[0],last=s.pts[s.pts.length-1];
  let added=0;
  for(let i=1;i<s.pts.length;i++){const d=s.pts[i].count-s.pts[i-1].count;if(d>0&&s.pts[i].ok&&s.pts[i-1].ok)added+=d;}
  const change=last.ok&&first?Math.round((last.score-first.score)*100)/100:null;
  return {first,last,change,added,broken:s.pts.some(p=>!p.ok)};
 }

 function sparkline(s){
  const w=150,h=34,pad=4,pts=s.pts;
  const t0=new Date(pts[0].at).getTime(),t1=new Date(pts[pts.length-1].at).getTime()||t0+1;
  const scores=pts.map(p=>p.score),minSpan=s.scale===10?0.8:0.4;
  let lo=Math.min(...scores),hi=Math.max(...scores);
  if(hi-lo<minSpan){const mid=(hi+lo)/2;lo=mid-minSpan/2;hi=mid+minSpan/2;}
  const x=p=>pad+(t1===t0?w/2:(new Date(p.at).getTime()-t0)/(t1-t0)*(w-2*pad));
  const y=p=>h-pad-(p.score-lo)/(hi-lo)*(h-2*pad);
  const segs=[];let cur=[];
  pts.forEach((p,i)=>{if(i>0&&p.ok!==pts[i-1].ok){if(cur.length)segs.push({ok:pts[i-1].ok,pts:cur});cur=[];} cur.push(p);});
  if(cur.length)segs.push({ok:cur[cur.length-1].ok,pts:cur});
  const lines=segs.map(sg=>`<polyline fill="none" stroke="${sg.ok?'var(--green)':'var(--sage)'}" stroke-width="2" ${sg.ok?'':'stroke-dasharray="3 3"'} stroke-linecap="round" stroke-linejoin="round" points="${sg.pts.map(p=>x(p).toFixed(1)+','+y(p).toFixed(1)).join(' ')}"/>`).join('');
  const last=pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${s.pts.length} målinger">${lines}<circle cx="${x(last).toFixed(1)}" cy="${y(last).toFixed(1)}" r="3" fill="${last.ok?'var(--green)':'var(--sage)'}"/></svg>`;
 }

 function renderYears(sel,plat,name,e){
  if(typeof reviewHistory==='undefined')return '';
  const order=typeof platforms!=='undefined'?platforms:[];
  const propOrder=(typeof properties!=='undefined'?properties:[]).map(p=>p.id);
  const list=reviewHistory.series.filter(s=>(sel==='all'||s.property===sel)&&(plat==='all'||s.platform===plat))
   .sort((a,b)=>propOrder.indexOf(a.property)-propOrder.indexOf(b.property)||order.indexOf(a.platform)-order.indexOf(b.platform));
  if(!list.length)return '';
  // Nye anmeldelser fra den daglige gennemgang (skrevet efter indsamlingsdagen) lægges oven i.
  const fresh=((typeof nightReport!=='undefined'&&nightReport.reviews)||[]).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.publishedDate||'')&&r.publishedDate>reviewHistory.collectedAt&&Number.isFinite(Number(r.score)));
  const byYear=s=>{const y={};for(const [k,n,sum] of s.buckets){const yr=k[0]==='Y'?k.slice(1):k.slice(0,4);y[yr]=y[yr]||[0,0];y[yr][0]+=n;y[yr][1]+=sum;}
   for(const r of fresh)if(r.property===s.property&&r.platform===s.platform){const yr=r.publishedDate.slice(0,4);y[yr]=y[yr]||[0,0];y[yr][0]++;y[yr][1]+=Number(r.score)*(s.scale/(r.scale||s.scale));}
   return y;};
  const years=[...new Set(list.flatMap(s=>Object.keys(byYear(s))))].sort();
  const shown=years.slice(-8),early=years.length>8?years.slice(0,-8):[];
  const cols=(early.length?['før']:[]).concat(shown);
  const cell=(n,sum,scale)=>{if(!n)return '<td class="yr-empty">–</td>';const avg=sum/n,r=avg/scale;const cls=r>=0.86?'yr-good':r>=0.74?'yr-mid':'yr-low';return `<td class="yr ${cls}"><strong>${avg.toLocaleString('da-DK',{minimumFractionDigits:1,maximumFractionDigits:1})}</strong><small>${n} anm.</small></td>`;};
  let total=0;
  const rows=list.map(s=>{const y=byYear(s);total+=Object.values(y).reduce((a,[n])=>a+n,0);const cells=cols.map(c=>{if(c==='før'){let n=0,sum=0;for(const yr of early)if(y[yr]){n+=y[yr][0];sum+=y[yr][1];}return cell(n,sum,s.scale);}const v=y[c];return v?cell(v[0],v[1],s.scale):cell(0,0,s.scale);}).join('');
   return `<tr><td><span class="property">${e(name(s.property))}</span><span class="address">${e(s.platform)} · / ${s.scale}</span></td>${cells}</tr>`;}).join('');
  const usedPlatforms=[...new Set(list.map(s=>s.platform))];
  const notes=usedPlatforms.map(p=>reviewHistory.notes[p]?`<strong>${e(p)}:</strong> ${e(reviewHistory.notes[p])}`:'').filter(Boolean).join(' ');
  return `<h3 class="trend-sub">Gennemsnit af anmeldelserne år for år</h3><p class="section-intro">Hver anmeldelse er hentet fra platformen og lagt i det år, den blev skrevet (${total.toLocaleString('da-DK')} anmeldelser). Grøn er en god karakter, orange en svag. Tallet er gæsternes gennemsnit det år – ikke platformens samlede bedømmelse.</p><div class="table-wrap"><table class="year-table"><thead><tr><th>Sted og platform</th>${cols.map(c=>`<th>${c==='før'?'Før '+shown[0]:c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="footnote">${notes} Hentet ${new Date(reviewHistory.collectedAt).toLocaleDateString('da-DK',{day:'numeric',month:'long',year:'numeric'})}.</p>`;
 }

 function renderTrend(){
  const host=document.querySelector('#trendPanel');if(!host)return;
  const e=typeof escapeHTML==='function'?escapeHTML:String;
  const all=buildSeries();
  const sel=typeof selected!=='undefined'?selected:'all',plat=typeof platform!=='undefined'?platform:'all';
  const order=typeof platforms!=='undefined'?platforms:[];
  const propOrder=(typeof properties!=='undefined'?properties:[]).map(p=>p.id);
  const list=all.filter(s=>(sel==='all'||s.property===sel)&&(plat==='all'||s.platform===plat))
   .sort((a,b)=>propOrder.indexOf(a.property)-propOrder.indexOf(b.property)||order.indexOf(a.platform)-order.indexOf(b.platform));
  const name=id=>((typeof properties!=='undefined'&&properties.find(p=>p.id===id))||{name:id}).name;
  const firstAt=list.length?list.reduce((m,s)=>s.pts[0].at<m?s.pts[0].at:m,list[0].pts[0].at):null;
  const lastAt=list.length?list.reduce((m,s)=>s.pts[s.pts.length-1].at>m?s.pts[s.pts.length-1].at:m,list[0].pts[list[0].pts.length-1].at):null;
  const days=new Set(list.flatMap(s=>s.pts.map(p=>dayKey(p.at)))).size;
  let ups=0,downs=0,added=0;
  const rows=list.map(s=>{
   const m=summarize(s);added+=m.added;
   if(m.change>0)ups++;else if(m.change<0)downs++;
   const ch=m.change==null?'<span class="trend-flat">ikke sammenlignelig</span>':m.change>0?`<span class="trend-up">▲ ${fmtNum(m.change)}</span>`:m.change<0?`<span class="trend-down">▼ ${fmtNum(Math.abs(m.change))}</span>`:'<span class="trend-flat">uændret</span>';
   const note=m.broken?'<small class="trend-note">Stiplet: tal der ikke kan sammenlignes (platformen har fjernet ældre anmeldelser)</small>':'';
   return `<tr><td><span class="property">${e(name(s.property))}</span><span class="address">${e(s.platform)} · / ${s.scale}</span>${note}</td><td>${sparkline(s)}</td><td class="trend-num">${fmtNum(m.first.score)} → <strong>${fmtNum(m.last.score)}</strong></td><td class="trend-num">${ch}</td><td class="trend-num">${m.added?'+'+m.added:'0'}<small> (${m.last.count} i alt)</small></td></tr>`;
  }).join('');
  const tag=list.length?`Siden ${fmtDate(firstAt)} · ${days} målinger`:'Afventer historik';
  const body=list.length?`<div class="table-wrap"><table class="trend-table"><thead><tr><th>Sted og platform</th><th>Forløb</th><th>Bedømmelse</th><th>Ændring</th><th>Nye anmeldelser</th></tr></thead><tbody>${rows}</tbody></table></div><p class="footnote">Bygget af de daglige kontrollerede målinger (seneste ${fmtDate(lastAt)}). Platformene afrunder bedømmelsen – Google til én decimal – så en lille forbedring ses først, når der er kommet en del nye anmeldelser.</p>`
   :`<p class="empty-text">Der er endnu ingen målinger for dette valg.</p>`;
  host.innerHTML=`<div class="section-heading"><div><div class="eyebrow">OP ELLER NED?</div><h2>Udvikling over tid</h2></div><span class="tag">${e(tag)}</span></div>${renderYears(sel,plat,name,e)}<h3 class="trend-sub">De seneste uger</h3>${body}<div class="history-footer"><span>Stigninger <strong>${list.length?ups:'—'}</strong></span><span>Fald <strong>${list.length?downs:'—'}</strong></span><span>Nye anmeldelser <strong>${list.length?added:'—'}</strong></span></div>`;
 }
 window.renderTrend=renderTrend;
 const originalRender=window.render;
 if(typeof originalRender==='function'){window.render=function(){originalRender.apply(this,arguments);renderTrend();};}
 renderTrend();
})();
