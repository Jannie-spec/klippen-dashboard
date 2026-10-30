// "Kan den fjernes?" – tjek af dårlige anmeldelser mod platformenes regler.
// Dårlig = 1–3 på 5-skala eller 6 og derunder på 10-skala.
// Regler er hentet fra platformenes egne sider 25. oktober 2026 (se kilde under hver platform).
// Claude vurderer hver ny dårlig anmeldelse i den daglige opdatering og tilføjer den i removalChecks.
// infoSeenAt: ISO-tidspunkt, hvor Claude senest har læst personalets "Ny oplysning til Claude" (workflow-nøgle removal|<id>, felt issueNote).
// verdict: possible | check | pending | rejected | removed | none. Jannie har givet stående ja til, at Claude selv rapporterer, når der er grundlag.

const removalRules={
 'Google':{
  source:'https://support.google.com/contributionpolicy/answer/7400114',
  grounds:{
   fake:['Ikke en reel oplevelse','Falsk eller vildledende anmeldelse, der ikke bygger på et ægte besøg.'],
   conflict:['Interessekonflikt','Skrevet af en konkurrent, ansat, tidligere ansat eller andre med egen interesse.'],
   offensive:['Krænkende eller udokumenterede beskyldninger','Angreb på personer eller grupper, eller påstande om lovbrud uden belæg.'],
   harassment:['Chikane eller trusler','Trusler, udstilling af personer, seksualisering.'],
   hate:['Hadefuld tale','Nedgørende indhold om beskyttede grupper.'],
   personal:['Personoplysninger','Fx fulde navne på medarbejdere med private detaljer, telefonnumre, adresser.'],
   profanity:['Groft sprog','Bandeord brugt til at fornærme.'],
   offtopic:['Ikke om stedet','Politik, generelle rants eller en oplevelse et andet sted.'],
   ads:['Reklame eller links','Kontaktoplysninger, links eller reklame i anmeldelsen.'],
   gibberish:['Uforståelig eller gentaget','Meningsløs tekst eller samme anmeldelse flere gange.']
  },
  notGrounds:'Uenighed, kritik af pris, standard eller service er ikke grundlag.',
  how:'Business Profile → Anmeldelser → ⋮ → Rapportér og vælg grund. Status og appel: værktøjet “Administrer dine anmeldelser” (support.google.com/business/workflow/9945796). Der kan kun være én aktiv rapport pr. anmeldelse, og én appel, når rapporten er afgjort. Navneskift/ejerskifte: kontakt Business Profile-support.',
  limits:'Afgørelse tager typisk nogle dage.'
 },
 'Tripadvisor':{
  source:'https://www.tripadvisor.com/Trust-lvBd3L1aU38Y.html',
  grounds:{
   notFirstHand:['Ikke førstehånd','Skrevet af en, der ikke selv var der, eller på andres vegne.'],
   tooOld:['For gammel oplevelse','Indsendt mere end 12 måneder efter opholdet.'],
   duplicate:['Dublet','Samme oplevelse anmeldt flere gange eller på flere sider.'],
   biased:['Inhabil skribent','Ansat, tidligere ansat, familie/ven af personalet, leverandør eller konkurrent inden for 16 km.'],
   blackmail:['Afpresning','Gæsten har krævet noget for ikke at skrive eller for at fjerne anmeldelsen.'],
   bombing:['Review bombing','Drevet af en sag, nyhed eller sociale medier uden eget besøg.'],
   irrelevant:['Irrelevant indhold','Politiske/etiske rants, kommentarer om andre anmeldelser, eller ydelser uden for stedets hovedfunktion.'],
   ineligible:['Ikke en gyldig oplevelse','Handler kun om politikker, åbningstider, ubesvarede opkald/mails eller at have set stedet udefra.'],
   tooShort:['For kort','Under 25 tegn.']
  },
  notGrounds:'Negativ kritik af et ægte ophold bliver stående.',
  how:'Tripadvisor Management Center → Anmeldelser → Rapportér anmeldelse (vælg grund og forklar). Mistanke om betalte/falske anmeldelser: contentintegrity@tripadvisor.com. Ejerskifte: bed support fjerne anmeldelser fra før overtagelsen.',
  limits:'Gæster kan kun anmelde op til 12 måneder efter opholdet.'
 },
 'Expedia':{
  source:'https://www.expedia.com/lp/b/content-guidelines',
  grounds:{
   falseContent:['Falsk eller vildledende','Usandt, vildledende, overdrevet indhold eller falske anklager.'],
   offtopic:['Ikke om opholdet','Indhold, der ikke handler om rejsen eller opholdet.'],
   offensive:['Stødende eller ulovligt','Stødende, diskriminerende, truende eller ulovligt indhold.'],
   personal:['Personoplysninger','Telefonnumre, mailadresser, adresser, kortoplysninger.'],
   pricing:['Prisoplysninger','Konkrete priser eller prisniveauer i teksten.'],
   links:['Links og reklame','URL’er, sociale profiler, reklame.'],
   fake:['Falsk, betalt eller afpresning','Falsk anmeldelse, afpresning eller krav om refusion for en god anmeldelse.'],
   relation:['Relation til stedet','Skribenten ejer, driver eller har relation til stedet.'],
   ownership:['Ejerskifte eller stor renovering','Expedia kan fjerne anmeldelser fra før ejerskifte eller større renovering.']
  },
  notGrounds:'En lav karakter uden tekst eller ærlig kritik kan ikke fjernes.',
  how:'Partner Central → Anmeldelser → “Bestrid anmeldelse” (review dispute) eller Kontakt os → Anmeldelser efter opholdet.',
  limits:''
 },
 'Airbnb':{
  source:'https://www.airbnb.com/help/article/2673',
  grounds:{
   irrelevant:['Ikke om opholdet','Ingen førstehåndsoplevelse, fx gæsten aflyste af grunde, der ikke handler om stedet.'],
   fake:['Ingen reel booking','Anmeldelsen bygger ikke på en rigtig reservation.'],
   extortion:['Afpresning eller pres','Bruges til at få kompensation, eller er manipuleret/vildledende.'],
   competition:['Konkurrent','Skribenten er tilknyttet eller i direkte konkurrence med opslaget.'],
   retaliatory:['Hævn','Gæsten fik besked om eget regelbrud og skrev derefter en hævnanmeldelse.'],
   content:['Overtræder indholdsregler','Diskriminerende, eksplicit, skadeligt eller ulovligt indhold.']
  },
  notGrounds:'Uenighed om stjerner, subjektive meninger og forhold uden for værtens kontrol er ikke grundlag.',
  how:'airbnb.com/help/article/2673 → “Kom i gang” (anmeld en anmeldelse) → vælg anmeldelse og grund, beskriv og vedhæft dokumentation. Eller kontakt Airbnb via Hjælpecenter.',
  limits:''
 },
 'Booking.com':{
  source:'https://www.booking.com/content-moderation-policy/content-guidelines.en-gb.html',
  grounds:{
   notStayed:['Gæsten boede ikke','Aflyst/no-show, og anmeldelsen handler ikke om kommunikation eller vigtig info.'],
   notExperience:['Beskriver ikke opholdet','Teksten handler ikke om gæstens oplevelse.'],
   wrongProperty:['Forkert sted','Anmeldelsen handler om et andet sted.'],
   blackmail:['Afpresning','Kræver skriftlig dokumentation.'],
   misleading:['Vildledende eller udgiver sig for at være en anden',''],
   commercial:['Reklame eller kontaktoplysninger',''],
   disrespectful:['Krænkende, farligt eller personoplysninger','']
  },
  notGrounds:'Gæster, der rejste før tid, må gerne anmelde opholdet og årsagen.',
  how:'Extranet → Indbakke → Booking.com-beskeder → Se kontaktmuligheder → emne “Gæsteanmeldelser”. Skriv bookingnummer og forklaring. Ved ejerskifte fjernes alle anmeldelser fra før.',
  limits:'Gæster kan anmelde op til 3 måneder efter udtjekning. Anmeldelser vises i 36 måneder.'
 },
 'VRBO':{
  source:'https://www.hostaway.com/blog/vrbo-reviews-policy/',
  grounds:{
   inaccurate:['Usandt eller respektløst',''],
   extortion:['Afpresning','Anmeldelsen bruges til at presse betaling eller refusion igennem.'],
   prohibited:['Forbudte oplysninger','Fx stedets præcise adresse eller faktiske priser.'],
   irrelevant:['Ikke om udlejningen','']
  },
  notGrounds:'Kritik af et ægte ophold bliver stående.',
  how:'Kontakt VRBO kundeservice og opret en sag med dokumentation for, hvilken regel der er brudt.',
  limits:'En fjernet anmeldelse kan ikke erstattes af en ny.'
 }
};

// Datoer, vi har brugt i anmodninger om fjernelse ved ejerskifte.
const removalOwnershipCutoff={grevens:'2021-10-01',hostel:'2022-01-01',jorgens:'2022-01-01'};

const removalVerdicts={
 pending:{label:'RAPPORTERET · AFVENTER',cls:'rv-pending',order:0},
 possible:{label:'MULIG · VÆRD AT RAPPORTERE',cls:'rv-possible',order:1},
 check:{label:'TJEK FØRST',cls:'rv-check',order:2},
 unassessed:{label:'IKKE VURDERET ENDNU',cls:'rv-check',order:3},
 rejected:{label:'AFVIST AF PLATFORMEN',cls:'rv-no',order:4},
 removed:{label:'FJERNET',cls:'rv-done',order:5},
 none:{label:'INGEN GRUNDLAG · SVAR I STEDET',cls:'rv-no',order:6}
};

// Vurdering pr. anmeldelse (id fra nightReport.reviews). checkedAt = datoen for vurderingen.
const removalChecks={
 'google:jylkat:jesper:1-star':{verdict:'pending',grounds:['fake','offensive'],checkedAt:'2026-10-30',reason:'Vi mener ikke, at han har været der: Jylkat havde lige åbnet, tog ikke imod store grupper og serverede kun snacks. Teksten er ændret efter en kommentar til en video. Fødevarestyrelsen gav glad smiley 15. juli 2026.',next:'Allerede rapporteret. Når Google har afgjort rapporten, sendes appellen (teksten ligger i projektnoten om fjernelse af anmeldelser). Fortsat online 30. okt.: Jylkat viser stadig 24 anmeldelser på Google (Google har ikke fjernet den endnu). Tjekkes igen ved næste kontrol.'},
 'tripadvisor:1069536992':{verdict:'rejected',grounds:[],checkedAt:'2026-10-18',reason:'Tripadvisor har vurderet rapporten og lader anmeldelsen stå.',next:'Svar er givet. Ingen ny rapport, medmindre der kommer nye oplysninger.'},
 'google:jorgens:toke-rude-trangbaek:one-week-at-2026-10-07':{verdict:'none',grounds:[],checkedAt:'2026-10-21',reason:'Ægte ophold med konkret kritik. Han nævner “jeres ejer”, men ikke ved navn, så det er ikke et personangreb.',next:'Ejersvar er givet. Fokus på at rette lys, trappe og støj.'},
 'expedia:jorgens:helle:2026-09-20':{verdict:'none',grounds:[],checkedAt:'2026-10-26',reason:'Hele teksten er læst i Partner Central: ægte booking med ophold, kritik af oplysningen om fælles bad og af prisen. Der står intet konkret beløb, og “røveri” er brugt som en mening, ikke som en anklage om lovbrud. Ingen regel passer.',next:'Ingen rapport. Maiken har allerede svaret 8. okt.; tjek gerne, at fælles bad står tydeligt på Hotels.com/Expedia.'},
 'airbnb:hostel:1156202787136511899:da79a474d75283ba':{verdict:'none',grounds:[],checkedAt:'2026-10-27',reason:'Tjekket i hostellets Airbnb-værtskonto: bekræftet reservation til 3 gæster, 4.–5. juli 2026, ikke aflyst, og gæsten boede der. Ingen beskeder fra gæsten, og hostellet har hverken anmeldt eller rapporteret gæsten, så det er ikke hævn. Teksten er én kort, negativ mening uden groft sprog eller personangreb. Ingen regel passer.',next:'Ingen rapport. Maiken har allerede svaret; ingen yderligere handling.'},
 'airbnb:hostel:1156211949097051927:24df73d38a9356c9':{verdict:'none',grounds:[],checkedAt:'2026-10-25',reason:'At billederne ikke stemte med oplevelsen er gæstens vurdering af opslaget.',next:'Tjek at billederne på opslaget viser værelset, som det er nu.'},
 'expedia:jorgens:diana:2026-07-29':{verdict:'none',grounds:[],checkedAt:'2026-10-25',reason:'Kun karakter uden tekst. Kan ikke fjernes, så længe opholdet fandt sted.',next:'Ingen handling. Følg kommende anmeldelser.'},
 'tripadvisor:1024635595':{verdict:'none',grounds:[],checkedAt:'2026-10-25',reason:'Ophold i august 2025, altså efter overtagelsen. Konkret kritik af rengøring, bad og pris.',next:'Svar på anmeldelsen, hvis den mangler svar.'}
};
// Ægte ophold med almindelig kritik – ingen regelbrud ud fra referatet.
for(const id of ['booking.com:therns:ivan:2026-08-27','expedia:jorgens:jesper:2026-08-11','airbnb:1747635873313492464','booking.com:jorgens:lena:2026-07-30','booking.com:therns:eva:2026-07-10','airbnb:1211514579680969299','tripadvisor:grevens:jan-j:2026-06:ophold-paa-klippen','airbnb:hostel:1136068877447449912:373f7285461fb425','airbnb:hostel:1136068877447449912:130fdbe847843fd2','airbnb:hostel:1136068877447449912:e629ff78193634a8','airbnb:hostel:1136068877447449912:56ef33a31bdb3dc2','airbnb:hostel:1136068877447449912:e98e6f45f9471d77','airbnb:hostel:1156202787136511899:770f80f240834b81','airbnb:hostel:1156202787136511899:4c278a4788c83d88','airbnb:hostel:1156202787136511899:47c89c66b3828387','airbnb:hostel:1156202787136511899:79081bddc575f3c1','airbnb:hostel:1156202787136511899:c446d30bd8016778','airbnb:hostel:1156202787136511899:b08b8e2dbd3a6899','airbnb:hostel:1156211949097051927:cd723fcbf37d57bb','airbnb:hostel:1156211949097051927:c330bb1ac8220420','airbnb:hostel:1156211949097051927:2bd24d0ced7dec33','airbnb:hostel:1156211949097051927:5673cc9af636a5a3','airbnb:hostel:1156211949097051927:2a9d0f425471abc8','airbnb:hostel:1156218847192124812:bda670de7e73b789','airbnb:hostel:1156226769988855769:7cf806f88e2cc967','airbnb:hostel:1156226769988855769:f88a10157570967c','airbnb:summer:28063316:1454248767625684547','expedia:grevens:kristina:2026-10-17']){
 if(!removalChecks[id])removalChecks[id]={verdict:'none',grounds:[],checkedAt:'2026-10-25',reason:'Ægte ophold med konkret kritik eller mening. Ingen regelbrud ud fra referatet.',next:'Svar roligt og ret det, der kan rettes.'};
}

function isLowReview(r){
 if(!Number.isFinite(r.score)||!Number.isFinite(r.scale)||r.scale<=0)return false;
 return r.scale===5?r.score<=3:r.scale===10?r.score<=6:r.score/r.scale<=0.6;
}
// Automatiske hints, også for nye anmeldelser, der ikke er vurderet endnu.
function removalHints(r){
 const hints=[];const date=r.publishedDate||r.publishedMonth||r.stayMonth||'';
 const cutoff=removalOwnershipCutoff[r.property];
 if(cutoff&&date&&date<cutoff.slice(0,date.length))hints.push('Fra før overtagelsen – kan søges fjernet ved ejerskifte.');
 if(!r.text&&/uden (fri )?anmeldelsestekst|uden tekst|kun stjerner/i.test(r.summary||''))hints.push('Kun karakter uden tekst – kan normalt ikke fjernes, medmindre gæsten ikke boede der.');
 if(r.platform==='Booking.com'&&r.publishedDate){const age=(Date.now()-new Date(r.publishedDate))/864e5/30.4;if(age>36)hints.push('Over 36 måneder gammel – Booking.com skjuler den automatisk.');}
 return hints;
}
function removalStatus(r){return removalChecks[r.id]?.verdict||'unassessed';}
let showNoRemovalGround=false;
function renderRemovalCheck(){
 let host=document.querySelector('#removalCheck');
 if(!host){host=document.createElement('section');host.id='removalCheck';host.className='panel';host.setAttribute('aria-label','Kan anmeldelsen fjernes?');document.querySelector('#nightReport')?.after(host);}
 const e=escapeHTML;
 const low=nightReport.reviews.filter(r=>isLowReview(r)&&(selected==='all'||r.property===selected)&&(platform==='all'||r.platform===platform));
 const items=low.map(r=>({r,status:removalStatus(r),check:removalChecks[r.id]})).sort((a,b)=>(removalNewInfo(b.r)-removalNewInfo(a.r))||removalVerdicts[a.status].order-removalVerdicts[b.status].order||String(b.r.publishedDate||b.r.publishedMonth||'').localeCompare(String(a.r.publishedDate||a.r.publishedMonth||'')));
 const count=s=>items.filter(i=>i.status===s).length;
 const hidden=items.filter(i=>['none','rejected','removed'].includes(i.status)&&!removalNewInfo(i.r));
 const shown=showNoRemovalGround?items:items.filter(i=>!hidden.includes(i));
 const placeName=id=>properties.find(p=>p.id===id)?.name||id;
 const card=({r,status,check})=>{
  const v=removalVerdicts[status];const rules=removalRules[r.platform]||{grounds:{}};const key='removal|'+r.id;
  const grounds=(check?.grounds||[]).map(g=>rules.grounds[g]).filter(Boolean);
  const hints=removalHints(r);
  return `<article class="aspect-card removal-card"><span class="rv-badge ${v.cls}">${v.label}</span><h3>${e(r.author||'Gæst')} · ${e(placeName(r.property))}</h3><div class="meta">${e(r.platform)} · <strong>${e(String(r.score).replace('.',','))}/${e(r.scale)}</strong> · ${e(r.publishedDate||r.publishedMonth||r.publishedRelative||'Dato ukendt')}${r.url?` · <a href="${e(r.url)}" target="_blank" rel="noopener noreferrer">Åbn på ${e(r.platform)}</a>`:''}</div><p>${e(r.summary||'')}</p>${check?`<p><strong>Vurdering:</strong> ${e(check.reason)}</p>`:'<p><strong>Vurdering:</strong> Ny anmeldelse – Claude tjekker den mod platformens regler ved næste daglige opdatering.</p>'}${grounds.length?`<div class="rv-grounds">${grounds.map(g=>`<span title="${e(g[1])}">${e(g[0])}</span>`).join('')}</div>`:''}${hints.length?`<ul class="rv-hints">${hints.map(h=>`<li>${e(h)}</li>`).join('')}</ul>`:''}${check?.next?`<div class="suggestion"><strong>Næste skridt</strong><p>${e(check.next)}</p></div>`:''}${removalHold(r)}<label class="workflow-note rv-info"><strong class="rv-info-title">Ved du noget om gæsten eller opholdet, som anmeldelsen ikke fortæller?</strong><span>Fx at gæsten aldrig har boet her, truede med en dårlig anmeldelse eller blev bortvist. Skriv det her, så tjekker Claude, om det kan give grundlag for at få anmeldelsen fjernet.</span><textarea data-workflow-key="${e(key)}" data-field="issueNote" ${!teamCanEdit()?'disabled':''} placeholder="Skriv hvad du ved – fx “Gæsten aflyste og var her aldrig” eller “Gæsten krævede pengene tilbage og truede med en dårlig anmeldelse”">${e(workflowState(key).issueNote||'')}</textarea></label><small class="rv-info-help">${removalNewInfo(r)?'<strong>Afventer Claudes nye vurdering.</strong> ':''}Skriv kun det, I ved er sandt. Claude læser det ved næste daglige tjek (ca. kl. 13) og vurderer igen.${teamCanEdit()?'':' Log ind som medarbejder for at skrive.'}</small>${check?`<small class="rv-checked">Tjekket af Claude ${e(new Date(check.checkedAt).toLocaleDateString('da-DK',{day:'numeric',month:'long',year:'numeric'}))}.</small>`:''}</article>`;
 };
 host.innerHTML=`<div class="section-heading"><div><div class="eyebrow">DÅRLIGE ANMELDELSER · REGELTJEK</div><h2>Kan anmeldelsen fjernes?</h2></div><span class="tag">${count('possible')} mulige · ${count('check')+count('unassessed')} undersøges · ${count('pending')} rapporteret</span></div><p class="section-intro">Claude tjekker hver anmeldelse med 1–3 stjerner eller 6/10 og derunder mod platformens regler og giver Jannie besked. Er der grundlag, rapporterer Claude den selv til platformen – så står der “Vent med at svare denne”. Ved I noget, Claude ikke kan se (gæsten var der aldrig, truede, opførte sig urimeligt …), så skriv det i feltet under anmeldelsen – også selvom Claude har vurderet, at den ikke kan fjernes. Kan en anmeldelse ikke fjernes, er det rigtige et roligt svar og at rette det, gæsten peger på.</p>${shown.length?`<div class="reply-grid">${shown.map(card).join('')}</div>`:'<p class="empty-text">Ingen dårlige anmeldelser at undersøge for dette valg.</p>'}${hidden.length?`<label class="workflow-check"><input id="showNoRemovalGround" type="checkbox" ${showNoRemovalGround?'checked':''}>Vis også dem uden grundlag, afviste og fjernede (${hidden.length})</label>`:''}`;
 host.querySelector('#showNoRemovalGround')?.addEventListener('change',ev=>{showNoRemovalGround=ev.target.checked;renderRemovalCheck();});
 bindWorkflowControls(host);
}
function removalRulesHTML(p){
 const r=removalRules[p];if(!r)return '<p>Ingen regler registreret for denne platform.</p>';const e=escapeHTML;
 return `<ul>${Object.values(r.grounds).map(([l,d])=>`<li><strong>${e(l)}</strong>${d?' – '+e(d):''}</li>`).join('')}</ul><p><strong>Ikke grundlag:</strong> ${e(r.notGrounds)}</p><p><strong>Sådan rapporterer I:</strong> ${e(r.how)}</p>${r.limits?`<p><strong>Frister:</strong> ${e(r.limits)}</p>`:''}<p><a href="${e(r.source)}" target="_blank" rel="noopener noreferrer">Kilde: ${e(p)}s regler</a></p>`;
}
// Vent med at svare, mens Claude forsøger at få anmeldelsen fjernet. Et svar, der fx takker for opholdet, kan svække en rapport om, at gæsten ikke var der.
function removalNewInfo(r){
 const w=workflowState('removal|'+r.id);const note=(w.issueNote||'').trim();if(!note)return false;
 const c=removalChecks[r.id];const seen=c?.infoSeenAt||(c?.checkedAt?c.checkedAt+'T00:00:00Z':'');
 return !seen||!w.updatedAt||new Date(w.updatedAt)>new Date(seen);
}
function removalHold(r){
 const v=removalChecks[r.id]?.verdict;const info=removalNewInfo(r);
 if(!['possible','check','pending'].includes(v)&&!info)return '';
 const text=v==='pending'?`Jeg har rapporteret den til ${escapeHTML(r.platform)}, fordi den går imod reglerne. Svar først, når jeg giver besked.`:v==='possible'?'Jeg prøver at få den fjernet, fordi den går imod reglerne. Svar først, når jeg giver besked.':info?'Jeg vurderer jeres nye oplysning ved næste daglige tjek. Svar først, når jeg giver besked.':'Jeg undersøger, om den går imod reglerne og kan fjernes. Svar først, når jeg giver besked.';
 return `<div class="rv-hold"><strong>Vent med at svare denne</strong><p>${text} – Claude</p></div>`;
}
// Vis sammen med resten, når sted/platform skiftes eller teamets status opdateres.
{const original=renderNightReport;renderNightReport=function(){original();renderRemovalCheck();};}
renderNightReport();
