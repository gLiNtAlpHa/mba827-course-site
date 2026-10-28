/* MBA 827 living course — engine: helpers, scroll scenes, views */
(function(){
const NS='http://www.w3.org/2000/svg';
const C = window.Course = {units:[], byId:{}};
C.modules = [
  {n:1, title:{en:'The Individual at Work (Units 1–5)',pc:'Di Person for Work (Units 1–5)'}},
  {n:2, title:{en:'Groups, Motivation and Leadership (Units 6–10)',pc:'Group, Motivation and Leadership (Units 6–10)'}},
  {n:3, title:{en:'Structure, Culture, Conflict and Change (Units 11–15)',pc:'Structure, Culture, Wahala and Change (Units 11–15)'}}
];
C.deep={};
/* deterministic option shuffle so the right answer isn't always in the same slot */
const mix=(q,salt)=>{if(!q||!q.o||q.o.length<2)return q;const key=JSON.stringify(q.q)+salt;let h=2166136261;for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619);}
  const r=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};const idx=q.o.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
  q.o=idx.map(i=>q.o[i]);q.a=idx.indexOf(q.a);return q;};
C.add = u => { (u.quiz||[]).forEach((q,i)=>mix(q,'q'+i));(u.scen||[]).forEach((q,i)=>mix(q,'s'+i));if(u.deep)Object.values(u.deep).forEach(d=>mix(d.q,'d')); C.units.push(u); C.byId[u.id]=u; if(u.deep)for(const k in u.deep){C.deep[k]=Object.assign({unit:u.id,key:k},u.deep[k]);} };
/* ---------- language ---------- */
C.lang='en';
const L=C.L=v=>(v&&typeof v==='object'&&!Array.isArray(v)&&'en' in v)?(C.lang==='pc'&&v.pc!=null?v.pc:v.en):v;
const T=C.T=(en,pc)=>C.lang==='pc'?pc:en;
const R=C.R=v=>{if(typeof v==='function'||v==null)return v;if(Array.isArray(v))return v.map(R);if(typeof v==='object'){if('en' in v&&Object.keys(v).every(k=>k==='en'||k==='pc'))return L(v);const o={};for(const k in v)o[k]=R(v[k]);return o;}return v;};

/* ---------- maths + DOM helpers ---------- */
const H = C.H = {};
H.clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
H.lerp=(a,b,t)=>a+(b-a)*t;
H.seg=(t,a,b)=>H.clamp((t-a)/(b-a));
H.ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
H.es=(t,a,b)=>H.ease(H.seg(t,a,b));
H.rand=(seed=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;})(42);
H.seeded=s=>{let seed=s;return()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};};
H.gauss=r=>{let u=r()||1e-9,v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
H.npdf=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
function setA(e,a){for(const k in a){const v=a[k];if(v==null)continue;
  if(k==='text'){e.textContent=v;continue}
  if(typeof v==='string'&&v.includes('var(')&&(k==='fill'||k==='stroke'||k==='stop-color')){e.style[k==='stop-color'?'stopColor':k]=v;continue}
  e.setAttribute(k,v);} return e;}
H.el=(tag,a={},p)=>{const e=document.createElementNS(NS,tag);setA(e,a);if(p)p.appendChild(e);return e;};
H.set=(e,a)=>setA(e,a);
H.svg=(parent,w=600,h=440)=>{const s=H.el('svg',{viewBox:`0 0 ${w} ${h}`,preserveAspectRatio:'xMidYMid meet',role:'img'});parent.appendChild(s);return s;};
H.t=(p,x,y,str,a={})=>H.el('text',Object.assign({x,y,fill:'var(--ink)','font-size':13,text:str},a),p);
H.h=(tag,a={},kids=[])=>{const e=document.createElement(tag);for(const k in a){if(k==='html')e.innerHTML=a[k];else if(k==='text')e.textContent=a[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),a[k]);else e.setAttribute(k,a[k]);}
  (Array.isArray(kids)?kids:[kids]).forEach(c=>c!=null&&e.append(c));return e;};
H.op=(e,o)=>{e.style.opacity=o;e.style.display=o<=0.001?'none':'';};
H.path=pts=>pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
H.css=name=>getComputedStyle(document.documentElement).getPropertyValue(name).trim();
H.tag=(stage,txt='Illustrative data')=>{const d=document.createElement('div');d.className='illus';d.textContent=txt;stage.appendChild(d);return d;};
H.cap=(stage,txt)=>{const d=document.createElement('div');d.className='stage-cap';d.textContent=txt;stage.appendChild(d);return d;};
/* axes in an svg; returns scale fns */
H.axes=(g,{x,y,w,h,xmin=0,xmax=1,ymin=0,ymax=1,xl='',yl='',xt=[],yt=[]})=>{
  const sx=v=>x+(v-xmin)/(xmax-xmin)*w, sy=v=>y+h-(v-ymin)/(ymax-ymin)*h;
  H.el('line',{x1:x,y1:y+h,x2:x+w,y2:y+h,stroke:'var(--muted)','stroke-width':1.2},g);
  H.el('line',{x1:x,y1:y,x2:x,y2:y+h,stroke:'var(--muted)','stroke-width':1.2},g);
  xt.forEach(v=>{const t=Array.isArray(v)?v:[v,v];H.el('line',{x1:sx(t[0]),x2:sx(t[0]),y1:y+h,y2:y+h+4,stroke:'var(--muted)'},g);H.t(g,sx(t[0]),y+h+17,String(t[1]),{'text-anchor':'middle','font-size':11,fill:'var(--muted)'});});
  yt.forEach(v=>{const t=Array.isArray(v)?v:[v,v];H.el('line',{x1:x-4,x2:x+w,y1:sy(t[0]),y2:sy(t[0]),stroke:'var(--line)','stroke-width':.8},g);H.t(g,x-7,sy(t[0])+4,String(t[1]),{'text-anchor':'end','font-size':11,fill:'var(--muted)'});});
  if(xl)H.t(g,x+w,y+h+34,xl,{'text-anchor':'end','font-size':12,fill:'var(--muted)'});
  if(yl)H.t(g,x,y-10,yl,{'font-size':12,fill:'var(--muted)'});
  return {sx,sy};
};
/* person glyph */
H.person=(g,x,y,col='var(--emp)',s=1)=>{const p=H.el('g',{transform:`translate(${x},${y}) scale(${s})`},g);
  H.el('circle',{cx:0,cy:-9,r:4.2,fill:col},p);H.el('path',{d:'M-6 6 Q-6 -3 0 -3 Q6 -3 6 6 Z',fill:col},p);return p;};
/* controls */
H.slider=(parent,{id,label,min,max,step=1,value,fmt=v=>v},on)=>{
  const out=H.h('output',{for:id},fmt(value));
  const inp=H.h('input',{type:'range',id,min,max,step,value});
  inp.addEventListener('input',()=>{out.textContent=fmt(+inp.value);on(+inp.value);});
  parent.append(H.h('div',{class:'ctl'},[H.h('label',{for:id},[H.h('span',{},label),out]),inp]));return inp;};
H.segBtns=(parent,label,opts,val,on)=>{const box=H.h('div',{class:'ctl'},[H.h('label',{},[H.h('span',{},label)])]);const s=H.h('div',{class:'seg',role:'group','aria-label':label});
  opts.forEach(o=>{const b=H.h('button',{type:'button','aria-pressed':String(o[0]===val)},o[1]);b.onclick=()=>{s.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');on(o[0]);};s.append(b);});
  box.append(s);parent.append(box);return s;};
H.readout=parent=>{const r=H.h('div',{class:'readout','aria-live':'polite'});parent.append(r);return r;};

/* ---------- tiny 3D on canvas ---------- */
H.c3=(stage,{yaw=.6,pitch=.38,dist=18,f=1.15,spin=.0022,render})=>{
  const cv=document.createElement('canvas');cv.style.cssText='width:100%;height:100%;display:block';stage.appendChild(cv);
  const ctx=cv.getContext('2d');const o={yaw,pitch,dist,f,spin,dirty:true,w:1,h:1,cx:0,cy:0,ty:0};
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size=()=>{const r=stage.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);o.w=r.width;o.h=r.height;cv.width=Math.max(1,r.width*d);cv.height=Math.max(1,r.height*d);ctx.setTransform(d,0,0,d,0,0);o.dirty=true;};
  new ResizeObserver(size).observe(stage);size();
  o.proj=p=>{const cy=Math.cos(o.yaw),sy=Math.sin(o.yaw),cp=Math.cos(o.pitch),sp=Math.sin(o.pitch);
    const x=p[0]-o.cx,y=p[1]-o.ty,z=p[2];const x1=x*cy+z*sy,z1=-x*sy+z*cy;const y2=y*cp-z1*sp,z2=y*sp+z1*cp;
    const d=o.dist+z2,s=o.f*Math.min(o.w,o.h*1.25)/Math.max(.1,d);return [o.w/2+x1*s,o.h/2-y2*s,d,s];};
  o.col={};const cols=['org','org-soft','emp','emp-soft','err','err-soft','ink','muted','line','sunk','data','data-soft','card','paper','manila','manila-ink'];
  let vis=true;new IntersectionObserver(es=>{vis=es[0].isIntersecting;}).observe(stage);
  const loop=()=>{if(!stage.isConnected)return;requestAnimationFrame(loop);if(!vis)return;
    if(o.spin&&!reduce){o.yaw+=o.spin;o.dirty=true;}
    if(!o.dirty)return;o.dirty=false;cols.forEach(c=>o.col[c]=H.css('--'+c));ctx.clearRect(0,0,o.w,o.h);render(ctx,o);};
  requestAnimationFrame(loop);return o;};
H.c3line=(ctx,o,a,b,col,w=2)=>{const p=o.proj(a),q=o.proj(b);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();};
H.c3ring=(ctx,o,y,r,col,w=2,n=64)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,p=o.proj([Math.cos(a)*r,y,Math.sin(a)*r]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();};
H.c3text=(ctx,o,p,txt,col,size=12,align='center',weight=700)=>{const q=o.proj(p);ctx.fillStyle=col;ctx.font=`${weight} ${size}px "Atkinson Hyperlegible", sans-serif`;ctx.textAlign=align;ctx.fillText(txt,q[0],q[1]);};
H.c3box=(o,c,sz,col)=>{const [x,y,z]=c,[a,b,d]=sz.map(v=>v/2);const V=[[x-a,y-b,z-d],[x+a,y-b,z-d],[x+a,y+b,z-d],[x-a,y+b,z-d],[x-a,y-b,z+d],[x+a,y-b,z+d],[x+a,y+b,z+d],[x-a,y+b,z+d]];
  const F=[[0,1,2,3,.8],[5,4,7,6,.8],[4,0,3,7,.64],[1,5,6,2,.64],[3,2,6,7,1],[4,5,1,0,.5]];
  return F.map(f=>{const P=f.slice(0,4).map(i=>o.proj(V[i]));return {P,z:P.reduce((s,p)=>s+p[2],0)/4,shade:f[4],col};});};
H.c3faces=(ctx,faces,stroke)=>{faces.sort((a,b)=>b.z-a.z).forEach(f=>{const P=f.P;let ar=0;for(let i=0;i<4;i++){const p=P[i],q=P[(i+1)%4];ar+=p[0]*q[1]-q[0]*p[1];}if(ar>0)return;
  ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.col;ctx.fill();
  ctx.fillStyle=`rgba(0,0,0,${(1-f.shade)*.5})`;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}});};

/* ---------- shared drawing helpers ---------- */
H.g=(p,a={})=>H.el('g',a,p);
H.box=(g,x,y,w,h,fill='var(--card)',stroke='var(--line)',rx=8)=>H.el('rect',{x,y,width:w,height:h,rx,fill,stroke},g);
H.wrap=(g,x,y,str,max=28,a={})=>{const words=String(str).split(' ');let line='',ly=y;const lh=a.lh||15;const b=Object.assign({},a);delete b.lh;words.forEach(w=>{if((line+' '+w).trim().length>max&&line){H.t(g,x,ly,line.trim(),b);line=w;ly+=lh;}else line+=' '+w;});if(line.trim())H.t(g,x,ly,line.trim(),b);return ly;};
H.showTabs=(tabs,t)=>tabs.forEach(([g,a,b,last])=>H.op(g,H.es(t,a-.12,a+.1)*(last?1:(1-H.es(t,b-.1,b+.05)))));
H.node=(g,x,y,label,fill='var(--org-soft)',w=96,h=30,a={})=>{const n=H.el('g',{},g);H.box(n,x-w/2,y-h/2,w,h,fill,'none',h/2);H.t(n,x,y+4.5,label,Object.assign({'text-anchor':'middle','font-size':11.5,'font-weight':700},a));return n;};
H.link=(g,a,b,col='var(--line)',dash,wd=2.2)=>H.el('path',{d:`M${a[0]} ${a[1]} V${(a[1]+b[1])/2} H${b[0]} V${b[1]}`,fill:'none',stroke:col,'stroke-width':wd,'stroke-dasharray':dash||'none'},g);
H.along=(pts,f)=>{const segs=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);segs.push(d);tot+=d;}let r=H.clamp(f)*tot;for(let i=0;i<segs.length;i++){if(r<=segs[i]||i===segs.length-1){const k=segs[i]?r/segs[i]:0;return [H.lerp(pts[i][0],pts[i+1][0],H.clamp(k)),H.lerp(pts[i][1],pts[i+1][1],H.clamp(k))];}r-=segs[i];}return pts[0];};

/* ---------- storage ---------- */
const store={get(k,d){try{const v=localStorage.getItem('mba827:'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('mba827:'+k,JSON.stringify(v));}catch(e){}}};
C.store=store;
const done=()=>store.get('done',{});
const markDone=id=>{const d=done();d[id]=Date.now();store.set('done',d);};
const hid=id=>'#u'+id.replace('.','-');

/* ---------- theme + language ---------- */
function theme(){const order=['system','light','dark'];let cur=store.get('theme','system');
  const names={system:T('system','auto'),light:T('light','light'),dark:T('dark','dark')};
  const apply=()=>{if(cur==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',cur);
    const b=document.getElementById('themeBtn');b.textContent=T('Theme: ','Colour: ')+cur;};
  apply();document.getElementById('themeBtn').onclick=()=>{cur=order[(order.indexOf(cur)+1)%3];store.set('theme',cur);apply();route(true);};}
function langUI(){C.lang=store.get('lang','en');
  const btns=[...document.querySelectorAll('.lang button')];
  const apply=()=>{btns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===C.lang)));document.documentElement.lang=C.lang==='pc'?'pcm':'en';
    const cm=document.querySelector('.bar nav a[href="#home"]');if(cm)cm.textContent=T('Course map','Course map');
    const rv=document.querySelector('.bar nav a[href="#revise"]');if(rv)rv.textContent=T('Revise','Revise');
    const tb=document.getElementById('themeBtn');tb.textContent=T('Theme: ','Colour: ')+store.get('theme','system');};
  btns.forEach(b=>b.onclick=()=>{if(C.lang===b.dataset.lang)return;C.lang=b.dataset.lang;store.set('lang',C.lang);apply();route(true);});apply();}

/* ---------- scroll engine ---------- */
let scrollHandler=null;
function attachScroll(stepsEl,scene){
  const steps=[...stepsEl.children];
  const onScroll=()=>{
    const mobile=innerWidth<=900, anchor=innerHeight*(mobile?0.82:0.55);
    let t=0;
    for(let i=0;i<steps.length;i++){const r=steps[i].getBoundingClientRect();
      if(r.top<=anchor){t=i+H.clamp((anchor-r.top)/r.height);} }
    t=H.clamp(t,0,steps.length-0.0001);
    const k=Math.floor(t);steps.forEach((s,i)=>s.classList.toggle('on',i===k));
    if(scene&&scene.update)scene.update(t);
  };
  return onScroll;
}
function readBar(){const b=document.getElementById('readBar');const h=document.documentElement;const p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);b.style.width=(H.clamp(p)*100)+'%';}
let raf=0;addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;readBar();if(scrollHandler)scrollHandler();});},{passive:true});
addEventListener('resize',()=>{if(scrollHandler)scrollHandler();});

/* ---------- views ---------- */
const app=()=>document.getElementById('app');
/* {{key|text}} -> tappable term */
const rich=C.rich=html=>String(html==null?'':html).replace(/\{\{([\w-]+)\|([^}]+)\}\}/g,(m,k,t)=>C.deep[k]?`<button type="button" class="term" data-k="${k}">${t}</button>`:t);
const strip=html=>String(html||'').replace(/\{\{[\w-]+\|([^}]+)\}\}/g,'$1').replace(/<[^>]+>/g,'');

/* ---------- deep-dive modal ---------- */
let dlg=null,trail=[];
function ensureDlg(){if(dlg)return dlg;dlg=document.getElementById('deep');
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
  dlg.addEventListener('close',()=>{trail=[];});return dlg;}
function openDeep(k,push=true){const raw=C.deep[k];if(!raw)return;const d=R(raw);ensureDlg();
  if(push&&dlg.open&&trail[trail.length-1]!==k)trail.push(k);else if(!dlg.open)trail=[k];
  const box=dlg.querySelector('.deep-body');box.innerHTML='';box.scrollTop=0;
  const top=H.h('div',{class:'deep-top'},[
    trail.length>1?H.h('button',{type:'button',class:'btn',onclick:()=>{trail.pop();openDeep(trail[trail.length-1],false);}},T('← Back','← Go back')):H.h('span'),
    H.h('button',{type:'button',class:'btn',onclick:()=>dlg.close(),'aria-label':T('Close','Close am')},'✕')]);
  box.append(top);
  const u=C.byId[raw.unit];
  box.append(H.h('div',{class:'eyebrow'},T('Deep dive','Go deeper')+(u?` · Unit ${u.id}`:'')));
  box.append(H.h('h2',{id:'deepTitle'},d.t));
  if(d.s)box.append(H.h('p',{class:'deep-short'},d.s));
  box.append(H.h('div',{class:'deep-main',html:rich(d.b)}));
  if(d.ex)box.append(H.h('div',{class:'deep-box ex'},[H.h('div',{class:'eyebrow'},T('Real-life example','Example from real life')),H.h('div',{html:rich(d.ex)})]));
  if(d.trap)box.append(H.h('div',{class:'deep-box trap'},[H.h('div',{class:'eyebrow'},T('Watch out','Shine your eye')),H.h('div',{html:rich(d.trap)})]));
  if(d.q){const qb=H.h('div',{class:'deep-box qz'},[H.h('div',{class:'eyebrow'},T('Check yourself','Check yourself'))]);qb.append(quiz([d.q]));box.append(qb);}
  if(d.rel&&d.rel.length){const rel=H.h('div',{class:'deep-rel'},[H.h('div',{class:'eyebrow'},T('Connected ideas','Wetin join am'))]);
    const row=H.h('div',{class:'chips'});d.rel.filter(r=>C.deep[r]).forEach(r=>row.append(H.h('button',{type:'button',class:'chip term-chip','data-k':r},L(C.deep[r].t))));rel.append(row);box.append(rel);}
  if(!dlg.open){try{dlg.showModal();}catch(e){dlg.setAttribute('open','');}}
}
C.openDeep=openDeep;
document.addEventListener('click',e=>{const b=e.target.closest('.term,.term-chip,.word');if(b&&b.dataset.k){e.preventDefault();openDeep(b.dataset.k,true);}});

function home(){
  scrollHandler=null;const d=done();const total=C.units.length, n=Object.keys(d).filter(k=>C.byId[k]).length;
  const last=store.get('last',null);
  const root=app();root.innerHTML='';
  const hero=H.h('section',{class:'hero'});
  const left=H.h('div',{},[
    H.h('div',{class:'eyebrow'},T('National Open University course · 15 units · plain English and Pidgin','National Open University course · 15 units · simple English and Pidgin')),
    H.h('h1',{html:T('Why people at work behave the way they do, <em>drawn as it moves</em>.','Why people for work dey behave di way dem dey behave, <em>we draw am make you see am move</em>.')}),
    H.h('p',{class:'lede'},T('Each idea is explained in everyday words and shown moving. Any underlined word can be tapped to open a deep dive with the full story, a real-life example, a common trap and a quick check. Every unit ends with real-life scenarios so you can practise using what you learnt.','We explain every idea for simple language and show am dey move. Any word wey get line for under, tap am, e go open “go deeper” box wey get di full gist, example from real life, trap wey people dey fall enter, and quick check. Every unit get real-life scenario for di end so you fit practise use wetin you learn.')),
    H.h('p',{class:'credit'},T('Course content: MBA 827 Advanced Organisational Behaviour, NOUN (Course Developer and Unit Writer: Abdullahi S. Araga). Charts marked “Illustrative” use example numbers, not findings from the course. Where the course text contains an error, the unit says so.','Di course content na from MBA 827 Advanced Organisational Behaviour, NOUN (Course Developer and Unit Writer: Abdullahi S. Araga). Any chart wey get “Illustrative” na example number, no be result from di course. Where di course text get mistake, di unit go talk am.'))
  ]);
  const acts=H.h('div',{class:'actions'});
  const first=last&&C.byId[last]?C.byId[last]:C.units[0];
  acts.append(H.h('a',{class:'btn primary',href:hid(first.id)},last?T('Resume unit ','Continue unit ')+first.id:T('Start with unit 1','Start from unit 1')));
  acts.append(H.h('a',{class:'btn',href:'#revise'},T('Revise: flashcards, glossary, scenarios, exam','Revise: flashcards, glossary, scenario, exam')));
  left.append(acts);
  {const nq=C.units.reduce((a,u)=>a+(u.quiz||[]).length,0),ns=C.units.reduce((a,u)=>a+(u.scen||[]).length,0),nd=Object.keys(C.deep).length;
  left.append(H.h('div',{class:'legend-key'},[H.h('span',{},[H.h('i',{class:'dot',style:'background:var(--org)'}),T(`${nd} tap-to-explore terms`,`${nd} word wey you fit tap`)]),H.h('span',{},[H.h('i',{class:'dot',style:'background:var(--emp)'}),T(`${ns} real-life scenarios`,`${ns} real-life scenario`)]),H.h('span',{},[H.h('i',{class:'dot',style:'background:var(--data)'}),T(`${nq} practice questions`,`${nq} practice question`)])]));}
  const viz=H.h('div',{class:'hero-viz','aria-label':T('A worker at the centre of four rings: the individual, the group, the organisation and the environment','Worker for di centre of four ring: di person, di group, di organisation and di environment')});
  hero.append(left,viz);root.append(hero);heroViz(viz);
  const cab=H.h('section',{class:'cabinet','aria-label':T('Course map','Course map')});
  cab.append(H.h('div',{class:'drawer-head'},[H.h('h2',{style:'font-size:var(--s3)'},T('Course map','Course map')),H.h('span',{class:'count mono'},T(`${n} of ${total} units done`,`${n} out of ${total} units don finish`))]));
  C.modules.forEach(m=>{
    const us=C.units.filter(u=>u.module===m.n);
    const dr=H.h('div',{class:'drawer'});
    dr.append(H.h('div',{class:'drawer-head'},[H.h('h2',{},`Module ${m.n}: ${L(m.title)}`),H.h('span',{class:'count'},`${us.filter(u=>d[u.id]).length}/${us.length}`)]));
    const fs=H.h('div',{class:'files'});
    us.forEach(u=>{const a=H.h('a',{class:'file',href:hid(u.id),'data-no':'UNIT '+u.id},[H.h('h3',{},L(u.title)),H.h('span',{class:'viz'},L(u.vizLabel)||'')]);
      if(d[u.id])a.append(H.h('span',{class:'stamp'},T('DONE','E DON DO')));fs.append(a);});
    dr.append(fs);cab.append(dr);
  });
  root.append(cab);
}
function heroViz(box){
  const s=H.svg(box,480,360);const cx=240,cy=180;
  const rings=[[150,T('Environment','Environment'),'var(--data-soft)'],[112,T('Organisation','Organisation'),'var(--org-soft)'],[74,T('Group','Group'),'var(--emp-soft)']];
  const rg=rings.map(([r,l,c])=>{const g=H.el('g',{},s);H.el('circle',{cx,cy,r,fill:c,stroke:'var(--card)','stroke-width':3},g);return {g,r,l};});
  H.el('circle',{cx,cy,r:36,fill:'var(--card)'},s);H.person(s,cx,cy+8,'var(--emp)',2.6);
  const labs=rings.map(([r,l])=>H.t(s,0,0,l,{'text-anchor':'middle','font-size':12.5,'font-weight':700}));
  const ind=H.t(s,cx,cy+52,T('Individual','Individual'),{'text-anchor':'middle','font-size':12,'font-weight':700});
  const dots=[...Array(10)].map((_,i)=>H.el('circle',{r:5,fill:['var(--data)','var(--org)','var(--emp)'][i%3]},s));
  const cap=H.t(s,cx,350,'',{'text-anchor':'middle','font-size':13,'font-weight':700});
  const caps=[T('Four things shape behaviour at work','Four things dey shape how people behave for work'),T('…the person, the group, the organisation and the world outside','…di person, di group, di organisation and di world outside')];
  const draw=t=>{rings.forEach(([r],i)=>{const a=-Math.PI/2+t*.25*(i%2?1:-1)+i;H.set(labs[i],{x:cx+Math.cos(a)*(r-18),y:cy+Math.sin(a)*(r-18)+4});});
    dots.forEach((d,i)=>{const r=rings[i%3][0]-8,a=t*(.6+i*.05)+i*1.3;H.set(d,{cx:cx+Math.cos(a)*r*(1-.15*Math.sin(t*2+i)),cy:cy+Math.sin(a)*r*(1-.15*Math.sin(t*2+i))});});
    cap.textContent=caps[Math.floor(t/4)%2];};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){draw(1);return;}
  const t0=performance.now();const go=now=>{if(!box.isConnected)return;draw((now-t0)/1000);requestAnimationFrame(go);};requestAnimationFrame(go);
}

function scenarios(list,onAll){
  const box=H.h('div',{class:'scen-list'});let n=0;
  list.forEach((sc,i)=>{const card=H.h('article',{class:'scen'});
    card.append(H.h('div',{class:'scen-head'},[H.h('span',{class:'scen-no mono'},T('Scenario ','Scenario ')+(i+1)),H.h('h3',{},sc.title)]));
    card.append(H.h('div',{class:'scen-story',html:rich(sc.story)}));
    const q=quiz([{q:sc.q,o:sc.o,a:sc.a,w:sc.w}],()=>{n++;if(n===list.length&&onAll)onAll();});q.classList.add('scen-q');card.append(q);
    if(sc.then){const more=H.h('details',{class:'scen-more'},[H.h('summary',{},T('What a good manager would do next','Wetin better manager go do next')),H.h('div',{html:rich(sc.then)})]);card.append(more);}
    box.append(card);});
  return box;
}

function unitView(raw){
  store.set('last',raw.id);const u=R(raw);
  const root=app();root.innerHTML='';
  root.append(H.h('header',{class:'unit-head'},[H.h('span',{class:'tab'},`UNIT ${u.id} · MODULE ${u.module}`),H.h('h1',{},u.title)]));
  root.append(H.h('div',{class:'hook'},[H.h('div',{class:'avatar','aria-hidden':'true'},u.hook.who[0]),H.h('div',{},[H.h('div',{class:'eyebrow'},T('Story: ','Gist: ')+u.hook.who),H.h('p',{html:rich(u.hook.text)})])]));
  root.append(H.h('div',{class:'objectives'},[H.h('div',{class:'eyebrow'},T('By the end of this unit you should be able to','When you finish dis unit, you go fit')),H.h('ul',{},u.objectives.map(o=>H.h('li',{},o)))]));
  root.append(H.h('p',{class:'tap-hint'},[H.h('span',{class:'term demo'},T('Underlined words','Word wey get line')),T(' open a deep dive. Tap any of them as you read.',' dey open “go deeper” box. Tap any of dem as you dey read.')]));
  const story=H.h('section',{class:'story','aria-label':T('Scroll story','Scroll story')});
  const steps=H.h('div',{class:'steps'});
  u.steps.forEach((s,i)=>{const kids=[H.h('div',{class:'n'},T(`Step ${i+1} of ${u.steps.length}`,`Step ${i+1} out of ${u.steps.length}`)),H.h('h3',{},s.h),H.h('div',{html:rich(s.t)})];
    if(s.say)kids.push(H.h('div',{class:'say',html:T('<b>In plain words:</b> ','<b>Simple talk:</b> ')+rich(s.say)}));
    steps.append(H.h('div',{class:'step'},H.h('div',{class:'card'},kids)));});
  const sw=H.h('div',{class:'stage-wrap'});const stage=H.h('div',{class:'stage',role:'img','aria-label':u.vizLabel||u.title});sw.append(stage);
  story.append(steps,sw);root.append(story);
  let scene=null;try{scene=raw.scene(stage);}catch(e){console.error(e);}
  scrollHandler=attachScroll(steps,scene);requestAnimationFrame(()=>scrollHandler&&scrollHandler());
  // deep-dive index for the unit
  const keys=Object.keys(raw.deep||{});
  if(keys.length){const sec=H.h('section',{class:'section'},[H.h('h2',{},T('Go deeper','Go deeper')),H.h('p',{class:'sub'},T('Every key idea in this unit, in plain words. Tap a card for the full explanation, an example, a trap to avoid and a quick check.','Every important idea for dis unit, for simple language. Tap any card for di full explanation, example, trap wey you suppose avoid, and quick check.'))]);
    sec.append(H.h('div',{class:'words'},keys.map(k=>{const d=R(C.deep[k]);return H.h('button',{type:'button',class:'word','data-k':k},[H.h('b',{},d.t),H.h('span',{},d.s||'')]);})));root.append(sec);}
  // sandbox
  if(raw.sandbox){const sec=H.h('section',{class:'section'},[H.h('h2',{},T('Try it yourself','Try am yourself')),H.h('p',{class:'sub',html:rich(u.sandboxIntro||T('Change the settings and watch the picture respond.','Shift di settings, watch how di picture go change.'))})]);
    const sb=H.h('div',{class:'sandbox'});const ctl=H.h('div',{class:'controls'});const st=H.h('div',{class:'sb-stage'});sb.append(ctl,st);sec.append(sb);root.append(sec);
    try{raw.sandbox(ctl,st);const ro=ctl.querySelector('.readout');if(ro)ctl.append(ro);}catch(e){console.error(e);}}
  // scenarios
  if(u.scen&&u.scen.length){const sec=H.h('section',{class:'section'},[H.h('h2',{},T('Apply it: real-life scenarios','Use am: real-life scenario')),H.h('p',{class:'sub'},T('Short situations from Nigerian workplaces and everyday life. Decide what is going on, then read why.','Short situation from Nigerian workplace and everyday life. Decide wetin dey happen, then read why.'))]);
    sec.append(scenarios(u.scen));
    if(u.apply)sec.append(H.h('div',{class:'grid2',style:'margin-top:14px'},[panelReveal(T('Your turn: think it through','Your turn: reason am'),u.apply.q,u.apply.a,T('Show a model answer','Show me di answer'))]));
    root.append(sec);}
  // SAE + TMA
  const sec2=H.h('section',{class:'section'},[H.h('h2',{},T('Exercises from the course','Exercise from di course')),H.h('p',{class:'sub'},T('The self-assessment exercises and the tutor-marked assignment come from the course. Model answers draw on the course’s own answer key where it gives one.','Di self-assessment exercise and di assignment wey tutor go mark na from di course. Di model answer follow di course own answer where e give one.'))]);
  const g2=H.h('div',{class:'grid2'});
  (u.sae||[]).forEach(x=>g2.append(panelReveal(x.own?T('Practice question','Practice question'):T('Self-assessment exercise','Test yourself (from di course)'),x.q,x.a,T('Show a model answer','Show me di answer'))));
  if(u.tma)g2.append(panelReveal(T('Tutor-marked assignment','Assignment wey tutor go mark'),u.tma.q,u.tma.outline,T('Show an answer outline','Show me how to answer am')));
  sec2.append(g2);root.append(sec2);
  // practice quiz
  const sec3=H.h('section',{class:'section'},[H.h('h2',{},T('Practice questions','Practice questions')),H.h('p',{class:'sub'},T(`${u.quiz.length} questions. Pick an answer to see why it is right or wrong.`,`${u.quiz.length} questions. Pick answer, we go tell you why e correct or why e no correct.`))]);
  sec3.append(quiz(u.quiz,()=>markDone(u.id)));root.append(sec3);
  // notes on the course text
  if(u.notes&&u.notes.length){root.append(H.h('section',{class:'section'},[H.h('h2',{},T('Notes on the course text','Small correction for di course text')),H.h('div',{class:'notes'},u.notes.map(n=>H.h('p',{html:rich(n)})))]));}
  // revision card
  const sec4=H.h('section',{class:'section'},[H.h('h2',{},T('Revision card','Revision card')),H.h('p',{class:'sub'},T('The lists to remember from this unit.','Di list dem wey you suppose remember from dis unit.'))]);
  const rc=H.h('div',{class:'rev-card'});
  u.card.forEach(c=>rc.append(H.h('div',{},[H.h('h4',{},c.h),H.h(c.ordered?'ol':'ul',{},c.items.map(i=>H.h('li',{},i)))])));
  sec4.append(rc);
  const status=H.h('span',{class:'why','aria-live':'polite'});
  const cp=H.h('button',{class:'btn',type:'button'},T('Copy card as text','Copy di card'));
  cp.onclick=()=>{const txt=`MBA 827 Unit ${u.id}: ${u.title}\n\n`+u.card.map(c=>c.h+'\n'+c.items.map((x,i)=>(c.ordered?(i+1)+'. ':'- ')+x).join('\n')).join('\n\n');
    navigator.clipboard.writeText(txt).then(()=>status.textContent=T('Copied.','E don copy.')).catch(()=>{status.textContent=T('Copy is blocked here. Select the card text instead.','Copy no gree work here. Select di text yourself.');});};
  sec4.append(H.h('div',{class:'copy-row'},[cp,status]));root.append(sec4);
  const i=C.units.indexOf(raw),pv=C.units[i-1],nx=C.units[i+1];const pg=H.h('nav',{class:'pager'});
  pg.append(pv?H.h('a',{href:hid(pv.id)},[H.h('div',{class:'eyebrow'},T('Previous','Di one before')),H.h('div',{},'Unit '+pv.id+' · '+L(pv.title))]):H.h('span'));
  pg.append(nx?H.h('a',{class:'next',href:hid(nx.id)},[H.h('div',{class:'eyebrow'},T('Next','Next one')),H.h('div',{},'Unit '+nx.id+' · '+L(nx.title))]):H.h('a',{class:'next',href:'#revise'},[H.h('div',{class:'eyebrow'},T('Finished','You don finish')),H.h('div',{},T('Revise the whole course','Revise di whole course'))]));
  root.append(pg);
}
function panelReveal(title,q,ans,btnTxt){
  const body=H.h('div',{class:'reveal-body',hidden:''});
  if(Array.isArray(ans))body.append(H.h('ul',{},ans.map(a=>H.h('li',{html:rich(a)}))));else body.append(H.h('div',{html:rich(ans)}));
  const b=H.h('button',{class:'btn',type:'button','aria-expanded':'false'},btnTxt);
  b.onclick=()=>{body.hidden=!body.hidden;b.setAttribute('aria-expanded',String(!body.hidden));b.textContent=body.hidden?btnTxt:T('Hide','Close am');};
  return H.h('div',{class:'panel'},[H.h('div',{class:'eyebrow'},title),H.h('h3',{html:rich(q)}),H.h('div',{class:'reveal'},[b,body])]);
}
function quiz(qs,onAll){
  const box=H.h('div',{class:'quiz'});let answered=0,right=0;const sc=H.h('div',{class:'score','aria-live':'polite'},`Score: 0 / ${qs.length}`);
  qs.forEach((q,qi)=>{const card=H.h('div',{class:'q'},[H.h('div',{class:'qt',html:(qs.length>1?`${qi+1}. `:'')+rich(q.q)})]);const opts=H.h('div',{class:'opts'});const why=H.h('div',{class:'why',hidden:''});
    let locked=false;q.o.forEach((o,oi)=>{const b=H.h('button',{class:'opt',type:'button'},o);b.onclick=()=>{if(locked)return;locked=true;answered++;
      if(oi===q.a){b.classList.add('right');right++;why.innerHTML=T('<b>Correct.</b> ','<b>Correct!</b> ')+rich(q.w);}else{b.classList.add('wrong');opts.children[q.a].classList.add('right');why.innerHTML=T('<b>Not quite.</b> ','<b>E no be am.</b> ')+rich(q.w);}
      why.hidden=false;sc.textContent=`Score: ${right} / ${qs.length}`;if(answered===qs.length&&onAll)onAll(right);};opts.append(b);});
    card.append(opts,why);box.append(card);});
  if(qs.length>1)box.append(sc);return box;
}
function revise(){
  scrollHandler=null;const root=app();root.innerHTML='';
  root.append(H.h('header',{class:'unit-head'},[H.h('span',{class:'tab'},'REVISION'),H.h('h1',{},T('Revise the whole course','Revise di whole course')),H.h('p',{style:'color:var(--muted)'},T('Flashcards of every key list, a searchable glossary of every deep-dive term, a scenario drill, and a 20-question exam paper.','Flashcards for every important list, glossary wey you fit search for every “go deeper” word, scenario drill, and exam paper of 20 questions.'))]));
  const nav=H.h('nav',{class:'chips',style:'margin:0 0 8px'},[['#fc',T('Flashcards','Flashcards')],['#gl',T('Glossary','Glossary')],['#sd',T('Scenario drill','Scenario drill')],['#ex',T('Exam practice','Exam practice')]].map(([h,l])=>H.h('button',{type:'button',class:'chip',onclick:()=>document.querySelector(h).scrollIntoView({behavior:'smooth'})},l)));root.append(nav);
  // flashcards
  const cards=[];C.units.forEach(raw=>{const u=R(raw);u.card.forEach(c=>cards.push({u,c}));});
  let i=0;const fc=H.h('div',{class:'fc-wrap'});const flash=H.h('div',{class:'flash',tabindex:'0',role:'button','aria-label':T('Flashcard. Press to flip.','Flashcard. Press am make e turn.')});
  const inner=H.h('div',{class:'flash-inner'});const front=H.h('div',{class:'face'}),back=H.h('div',{class:'face back'});inner.append(front,back);flash.append(inner);
  const pos=H.h('span',{class:'mono'});
  const show=()=>{const {u,c}=cards[i];flash.classList.remove('flip');front.innerHTML='';back.innerHTML='';
    front.append(H.h('div',{class:'eyebrow'},`Unit ${u.id} · ${u.title}`),H.h('h3',{},c.h),H.h('p',{style:'color:var(--muted)'},T(`Recall ${c.items.length} points, then tap to check.`,`Try remember ${c.items.length} points, then tap am check.`)));
    back.append(H.h('div',{class:'eyebrow'},c.h),H.h('ol',{},c.items.map(x=>H.h('li',{},x))));pos.textContent=`${i+1} / ${cards.length}`;};
  const flip=()=>flash.classList.toggle('flip');flash.onclick=flip;flash.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}};
  const fnav=H.h('div',{class:'copy-row'},[H.h('button',{class:'btn',type:'button',onclick:()=>{i=(i-1+cards.length)%cards.length;show();}},T('Previous','Back')),H.h('button',{class:'btn',type:'button',onclick:()=>{i=(i+1)%cards.length;show();}},T('Next','Next')),H.h('button',{class:'btn',type:'button',onclick:()=>{i=Math.floor(Math.random()*cards.length);show();}},T('Shuffle','Shuffle')),pos]);
  fc.append(flash,fnav);show();
  root.append(H.h('section',{class:'section',id:'fc'},[H.h('h2',{},'Flashcards'),fc]));
  // glossary
  const gl=H.h('section',{class:'section',id:'gl'},[H.h('h2',{},T('Glossary','Glossary')),H.h('p',{class:'sub'},T('Every deep-dive term in the course. Type to filter, tap to open.','Every “go deeper” word for di course. Type make e filter, tap make e open.'))]);
  const inp=H.h('input',{type:'search',class:'search',placeholder:T('Search terms, e.g. halo, equity, Johari…','Search word, like halo, equity, Johari…'),'aria-label':T('Search the glossary','Search di glossary')});
  const grid=H.h('div',{class:'words'});const all=Object.keys(C.deep).map(k=>({k,d:R(C.deep[k])})).sort((a,b)=>a.d.t.localeCompare(b.d.t));
  const cnt=H.h('p',{class:'sub mono'});
  const fill=()=>{const q=inp.value.trim().toLowerCase();grid.innerHTML='';const hits=all.filter(({d})=>!q||(d.t+' '+(d.s||'')+' '+strip(d.b)).toLowerCase().includes(q));cnt.textContent=T(`${hits.length} terms`,`${hits.length} words`);hits.forEach(({k,d})=>grid.append(H.h('button',{type:'button',class:'word','data-k':k},[H.h('b',{},d.t),H.h('span',{},`Unit ${d.unit} · `+(d.s||''))])));};
  inp.addEventListener('input',fill);gl.append(inp,cnt,grid);fill();root.append(gl);
  // scenario drill
  const sd=H.h('section',{class:'section',id:'sd'},[H.h('h2',{},T('Scenario drill','Scenario drill')),H.h('p',{class:'sub'},T('Five real-life scenarios drawn at random from across the course.','Five real-life scenario wey we pick anyhow from di whole course.'))]);const sdBox=H.h('div');
  const startS=()=>{sdBox.innerHTML='';const pool=[];C.units.forEach(raw=>{const u=R(raw);(u.scen||[]).forEach(s=>pool.push(Object.assign({},s,{title:`[${u.id}] `+s.title})));});
    for(let k=pool.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[pool[k],pool[j]]=[pool[j],pool[k]];}sdBox.append(scenarios(pool.slice(0,5)));};
  sd.append(H.h('button',{class:'btn primary',type:'button',onclick:startS,style:'margin-bottom:14px'},T('Draw five new scenarios','Pick five new scenario')),sdBox);startS();root.append(sd);
  // exam
  const ex=H.h('section',{class:'section',id:'ex'},[H.h('h2',{},T('Exam practice','Exam practice'))]);const exBox=H.h('div');
  const start=()=>{exBox.innerHTML='';const pool=[];C.units.forEach(raw=>{const u=R(raw);u.quiz.forEach(q=>pool.push(Object.assign({},q,{q:`[${u.id}] `+q.q})));});
    for(let k=pool.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[pool[k],pool[j]]=[pool[j],pool[k]];}
    exBox.append(quiz(pool.slice(0,20)));};
  ex.append(H.h('button',{class:'btn primary',type:'button',onclick:start,style:'margin-bottom:14px'},T('Start a new 20-question paper','Start new paper (20 questions)')),exBox);start();
  root.append(ex);
}

function route(keep){
  if(dlg&&dlg.open)dlg.close();
  const h=(location.hash||'#home').slice(1);
  const y=keep?scrollY:0;
  if(h.startsWith('u')){const id=h.slice(1).replace('-','.');const u=C.byId[id];if(u){unitView(u);document.title='MBA 827 · Unit '+u.id+' '+L(u.title);}else home();}
  else if(h==='revise'){revise();document.title='MBA 827 Revision';}
  else {home();document.title='MBA 827 Living Course';}
  scrollTo(0,y);readBar();if(scrollHandler)scrollHandler();
}
C.boot=()=>{langUI();theme();addEventListener('hashchange',()=>route());route();};
})();
