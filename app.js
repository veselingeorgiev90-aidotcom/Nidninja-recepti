'use strict';
const book=document.getElementById('book'),jump=document.getElementById('jump');
const prev=document.getElementById('prev'),next=document.getElementById('next');
const searchInput=document.getElementById('recipeSearch'),catSelect=document.getElementById('recipeCategory');
const searchDialog=document.getElementById('searchResults'),resultItems=document.getElementById('resultItems');
const closeButton=document.getElementById('closeSearch');
let searchOpener=null,queuedPage=null;
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function imagePath(value){return /^images\/[a-zA-Z0-9_.-]+$/.test(value||'') ? value : null;}
function html(i){
 if(i===0)return '<img src="ninja_cover_new.jpg" alt="Моята кухня с Ninja OL750EU — корица" style="width:100%;height:100%;object-fit:contain;background:#1a1510;display:block">';
 const r=recipes[i-1],src=imagePath(r.image),steps=r.steps.split(/(?<=\.)\s+(?=[А-ЯЁ])/);
 return `<article class="recipe"><div class="photo-wrap">${src?`<img class="photo" src="${escapeHtml(src)}?v=20261011-2" alt="${escapeHtml(r.name)}" decoding="async"><span class="photo-caption">Илюстрация на ястието</span>`:`<div class="image-fallback">${escapeHtml(r.name)}</div>`}</div><div class="body"><div class="kicker">РЕЦЕПТА ${i} · ${escapeHtml(r.category)} · ${escapeHtml(r.accessory||'Силиконова форма със 7 гнезда')}</div><h1>${escapeHtml(r.name)}</h1><div class="facts"><span>🍳 ${escapeHtml(r.mode)}</span><span>🌡️ ${escapeHtml(r.temp)}</span><span>⏱️ ${escapeHtml(r.time)}</span></div><div class="cols"><section><h2>Необходими продукти</h2><ul>${r.ingredients.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section><section><h2>Приготвяне</h2><ol>${steps.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></section></div><div class="tip">${escapeHtml(r.note||'Постави термоустойчивата силиконова форма върху решетката. Времето е ориентировъчно: проверявай готовността и максималната допустима температура на формата.')}</div></div></article>`;
}
function leaf(i,cls){
 const el=document.createElement('div');el.className='leaf '+cls;el.tabIndex=-1;el.setAttribute('aria-label',i?recipes[i-1].name:'Корица');el.innerHTML=html(i);
 el.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{const fallback=document.createElement('div');fallback.className='image-fallback';fallback.textContent='Снимката временно не се зарежда.';img.replaceWith(fallback);},{once:true}));return el;
}
function controls(){document.getElementById('counter').textContent=`${idx+1} / ${recipes.length+1}`;prev.disabled=idx===0||busy;next.disabled=idx===recipes.length||busy;jump.disabled=busy;jump.value=idx;}
function pageFromHash(){const m=location.hash.match(/^#recipe-(\d+)$/);return m?Math.min(recipes.length,Math.max(0,Number(m[1]))):0;}
function go(n,updateHash=true){
 if(!Number.isInteger(n)||n<0||n>recipes.length)return;
 if(busy){queuedPage={n,updateHash};return;}if(n===idx){controls();return;}
 busy=true;const old=book.querySelector('.leaf.current'),newEl=leaf(n,'next');newEl.setAttribute('aria-hidden','true');book.insertBefore(newEl,old);void newEl.offsetWidth;
 old.classList.add(n>idx?'flipping':'reverse');idx=n;controls();
 if(updateHash)history.replaceState(null,'',n?'#recipe-'+n:location.pathname+location.search);
 let completed=false;function finish(){if(completed)return;completed=true;old.remove();newEl.classList.replace('next','current');newEl.removeAttribute('aria-hidden');busy=false;controls();if(queuedPage){const q=queuedPage;queuedPage=null;go(q.n,q.updateHash);}}
 old.addEventListener('animationend',finish,{once:true});setTimeout(finish,matchMedia('(prefers-reduced-motion: reduce)').matches?20:760);
}
jump.innerHTML='<option value="0">Корица</option>'+recipes.map((r,i)=>`<option value="${i+1}">${i+1}. ${escapeHtml(r.name)}</option>`).join('');
document.querySelector('.total').textContent=recipes.length+' рецепти';
idx=pageFromHash();book.appendChild(leaf(idx,'current'));controls();
prev.onclick=()=>go(idx-1);next.onclick=()=>go(idx+1);jump.onchange=e=>go(Number(e.target.value));window.addEventListener('hashchange',()=>go(pageFromHash(),false));
document.addEventListener('keydown',e=>{
 if(searchDialog.classList.contains('open'))return;
 if(e.target.closest('input,select,textarea,[contenteditable="true"]')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(idx+(e.key==='ArrowRight'?1:-1));}
});
let touch=null;
book.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
book.addEventListener('touchend',e=>{if(!touch||searchDialog.classList.contains('open'))return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(idx+(dx<0?1:-1));},{passive:true});book.addEventListener('touchcancel',()=>touch=null);
const categoryAliases={'Основно':'Основни ястия','Месо':'Основни ястия','Пилешко':'Основни ястия','Гарнитура':'Гарнитури'};
const category=r=>categoryAliases[r.category]||r.category;
[...new Set(recipes.map(category))].sort((a,b)=>a.localeCompare(b,'bg')).forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;catSelect.appendChild(o);});
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase('bg').replace(/\s+/g,' ').trim();
function closeSearch(){searchDialog.classList.remove('open');document.querySelectorAll('body > :not(#searchResults)').forEach(el=>el.inert=false);if(searchOpener?.isConnected)searchOpener.focus();}
function runSearch(){
 const words=normalize(searchInput.value).split(' ').filter(Boolean),cat=catSelect.value;
 const hits=recipes.map((r,i)=>({...r,_i:i})).filter(r=>{const text=normalize([r.name,r.category,category(r),r.accessory||'Силиконова форма със 7 гнезда',r.mode,r.steps,...r.ingredients].join(' '));return (!cat||category(r)===cat)&&words.every(w=>text.includes(w));});
 resultItems.replaceChildren();searchDialog.querySelector('h2').textContent=`Намерени рецепти (${hits.length})`;
 if(!hits.length)resultItems.textContent='Няма намерени рецепти. Опитай с друга дума или категория.';
 hits.forEach(r=>{const b=document.createElement('button');b.className='item';const strong=document.createElement('strong');strong.textContent=(r._i+1)+'. '+r.name;const small=document.createElement('small');small.textContent=category(r)+' · '+(r.accessory||'Силиконова форма със 7 гнезда')+' · '+r.mode+' · '+r.time;b.append(strong,small);b.onclick=()=>{closeSearch();go(r._i+1);};resultItems.appendChild(b);});
 searchOpener=document.activeElement;searchDialog.classList.add('open');searchDialog.scrollTop=0;document.querySelectorAll('body > :not(#searchResults)').forEach(el=>{if(!['SCRIPT','STYLE'].includes(el.tagName))el.inert=true;});closeButton.focus();
}
document.getElementById('searchBtn').onclick=runSearch;searchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch();}});catSelect.onchange=runSearch;closeButton.onclick=closeSearch;
searchDialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeSearch();}if(e.key==='Tab'){const buttons=[...searchDialog.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
