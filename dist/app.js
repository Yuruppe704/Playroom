'use strict';
(() => {
const $ = (s, base = document) => base.querySelector(s);
const $$ = (s, base = document) => [...base.querySelectorAll(s)];
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const games = [
 {"id":"traffic-drive","name":"公路穿行","en":"公路 驾驶 赛车 冲刺 护盾 TRAFFIC","category":"3D","players":"单人","description":"收集护盾与氮气，冲刺撞翻车流，完成任务。","instructions":"← / → 或 A / D 换道，↓ / S 按住刹车；空格、↑ / W 或 Shift 消耗 60 氮气冲刺 3.5 秒，P 暂停。初始 3 格耐久：普通碰撞扣 1 格；蓝色护盾免伤 8 秒，冲刺期间免伤并撞翻车辆，连撞加分。金币每枚 10 分；磁铁与双倍积分持续 10 秒；绿色氮气补充 45，修理道具恢复 1 格耐久。每完成一个目标奖励 300 分和 20 氮气，每行驶 800 米切换场景。可拖动画面换道，或使用下方按钮。","hint":"","native3d":"traffic","best":"最高得分","unit":"分","art":"<div class=\"native-art\"><img src=\"assets/traffic-drive.svg\" alt=\"公路穿行游戏示意图\" width=\"512\" height=\"320\" loading=\"lazy\"></div>"},
 {id:'tower-drop',name:'下坠小球',en:'下坠 小球 圆环 螺旋 tower ball drop',category:'3D',players:'单人',description:'旋转圆环穿过缺口，连续下坠可击碎障碍。',instructions:'按住 ← / → 或 A / D 旋转圆环，也可左右拖动画面。小球会自动弹跳，从缺口落到下一层；碰到带浅色条纹的红色区域即结束。连续穿过 3 层后获得 1.35 秒破障，可以击碎圆环。下落越连贯，积分倍率越高；圆盘会持续向下生成，没有终点；坚持到碰到红色区域结束，累计层数和得分。P 暂停。',hint:'',native3d:'tower',best:'最高得分',unit:'分',art:'<div class="native-art"><img src="assets/tower-drop.svg?v=2" alt="下坠小球圆环塔示意图" width="512" height="320" loading="lazy"></div>'},
 {id:'hole-city',name:'黑洞吞城',en:'黑洞 吞噬 城市 hole city',category:'3D',players:'单人',description:'自由移动吞噬城市，从小物件长大到高楼。',instructions:'方向键 / WASD 移动；也可点击或按住拖动地图，黑洞会追随目标。镜头始终以黑洞为中心，随体积长大自动扩大视野；城市位于不规则海岛，沙滩外的海水无法进入。小人会在街道活动，靠近黑洞会逃跑；追上吞噬可获得 25 分和体积。先吞路锥、垃圾桶和树木，长大后吞汽车、房屋、高楼及中心大厦；只能吞下比洞口小的物体。2.4 秒内连续吞噬提升倍率，最高 5 倍；每吞 15 件增加 5 秒。空格 / Shift 疾行 1.1 秒，冷却 6 秒。初始限时 90 秒，吞完整座城市另奖 1000 分。P 暂停。',hint:'',native3d:'hole',best:'最高得分',unit:'分',art:'<div class="native-art"><img src="assets/hole-city.svg" alt="黑洞吞噬城市示意图" width="512" height="320" loading="lazy"></div>'},
 { id:'2048', name:'2048', en:'2048', category:'益智', description:'合并相同数字，拼出 2048。', players:'单人', instructions:'滑动方块，让相同数字相遇并合并。目标是拼出 2048。每次有效移动后，都会出现一个新的数字。', hint:'<kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><span>或在棋盘上滑动</span>', best:'最高得分', unit:'分', art:`<div class="mini-2048"><span class="v2">2</span><span class="v4">4</span><span class="v8">8</span><span class="v16">16</span><span class="v32">32</span><span class="v64">64</span><span class="v8">8</span><span class="v128">128</span><span class="last">2048</span></div>` },
 { id:'snake', name:'贪吃蛇', en:'SNAKE', category:'街机', description:'吃果实增长，避开边界和自身。', players:'单人', instructions:'吃橙色果实获得 10 分并增长身体。撞到边界或自身时结束。每吃到 5 颗果实，速度增加。', hint:'<kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><kbd>W A S D</kbd><span>空格暂停 · 也可滑动</span>', best:'最高得分', unit:'分', art:`<div class="snake-art">${'<i></i>'.repeat(7)}<span class="food"></span></div>` },
 { id:'breakout', name:'打砖块', en:'BREAKOUT', category:'街机', description:'移动挡板接球，击碎所有砖块。', players:'单人', instructions:'移动挡板，接住弹球并击碎所有砖块。你有 3 次机会。击碎全部砖块后进入更快的下一关。', hint:'<kbd>←</kbd><kbd>→</kbd><span>鼠标或手指移动挡板</span><span>空格暂停</span>', best:'最高得分', unit:'分', art:`<div class="bricks-art">${'<i></i>'.repeat(15)}</div>` },
 { id:'mines', name:'扫雷', en:'MINESWEEPER', category:'益智', description:'根据数字推理，找出 10 颗地雷。', players:'单人', instructions:'找出 9×9 棋盘上的 10 颗地雷。数字代表周围八格的地雷数。首点及周围格子保证安全；右键插旗，手机可切换标记模式。', hint:'<kbd>点击</kbd><span>翻开格子</span><kbd>右键</kbd><span>标记地雷</span>', best:'最快通关', unit:'秒', lower:true, art:`<div class="mines-art">${['','','1','', '', '1', '2','', '', '⚑', '1','', '', '', '', ''].map((n,i)=>`<span class="${i===9?'flag':n?'revealed':''}">${n}</span>`).join('')}</div>` },
 { id:'memory', name:'记忆翻牌', en:'MEMORY', category:'休闲', description:'翻开卡片，配对 8 组相同图形。', players:'单人', instructions:'一次翻开两张卡片，找到相同的图形。配对成功的卡片会保留；如果不同，它们会重新盖上。用尽量少的步数找齐 8 对。', hint:'<kbd>点击 / 轻触</kbd><span>翻开卡片</span>', best:'最少步数', unit:'步', lower:true, art:'<div class="memory-art"><span>✳</span><span>✦</span><span>✳</span></div>' },
 { id:'tictac', name:'井字棋', en:'TIC-TAC-TOE', category:'策略', description:'将三个符号连成一线即可获胜。', players:'电脑 / 本地双人', instructions:'在 3×3 的棋盘上轮流落子，先将三个符号连成一线就获胜。可以挑战电脑，也可以在同一台设备上和朋友轮流玩。', hint:'<kbd>点击 / 轻触</kbd><span>选择空格落子</span>', best:'累计胜场', unit:'胜', art:`<div class="ttt-art">${['×','○','×','○','×','', '×','','○'].map(n=>`<span>${n}</span>`).join('')}</div>` }
];
function readStore() { try { return JSON.parse(localStorage.getItem('playroom.v1')) || {}; } catch { return {}; } }
const loaded = readStore();
const replacedGames={'traffic-jam-3d':'traffic-drive'};
if(Array.isArray(loaded.favorites))loaded.favorites=[...new Set(loaded.favorites.map(id=>replacedGames[id]||id))];
loaded.recent=replacedGames[loaded.recent]||loaded.recent;
if(!games.some(g=>g.id===loaded.recent))loaded.recent=null;
const state = { favorites:Array.isArray(loaded.favorites) ? loaded.favorites.filter(id=>games.some(g=>g.id===id)) : [], scores:loaded.scores && typeof loaded.scores === 'object' ? loaded.scores : {}, theme:loaded.theme==='dark'?'dark':'light', recent:loaded.recent || null, view:'discover', category:'all', query:'' };
function save() { try { localStorage.setItem('playroom.v1', JSON.stringify({favorites:state.favorites,scores:state.scores,theme:state.theme,recent:state.recent})); } catch { /* A blocked storage provider should not prevent play. */ } }
let toastTimer;
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2000); }
function theme() { document.documentElement.dataset.theme=state.theme; $('#theme-toggle').innerHTML=icon(state.theme==='dark'?'sun':'moon'); $('#theme-toggle').setAttribute('aria-label',state.theme==='dark'?'切换浅色外观':'切换深色外观'); }
theme();
function toggleFavorite(id) { const i=state.favorites.indexOf(id); i<0?state.favorites.push(id):state.favorites.splice(i,1); save();renderCards(); if(activeGame?.id===id) updateFavorite(); toast(i<0?'已收藏':'已取消收藏'); }
function renderCards() {
 const filtered=games.filter(g=>(state.view!=='favorites'||state.favorites.includes(g.id))&&(state.category==='all'||g.category===state.category)&&`${g.name} ${g.en} ${g.category}`.toLowerCase().includes(state.query.toLowerCase()));
 $('#game-grid').innerHTML=filtered.map(g=>`<article class="game-card"><button class="card-open" data-open="${g.id}" aria-label="开始玩${g.name}"><div class="card-art art-${g.id}">${g.art}</div><div class="card-info"><h3>${g.name}</h3><div class="card-meta"><span>${g.category}</span><span class="meta-dot">·</span><span>${g.players}</span></div><p>${g.description}</p><div class="card-bottom"><span>${state.recent===g.id?icon('clock')+'最近玩过':''}</span><span class="card-play">${state.recent===g.id?'再玩一次':'开始游戏'} ${icon('arrow')}</span></div></div></button><button class="icon-button card-favorite ${state.favorites.includes(g.id)?'is-favorite':''}" data-favorite="${g.id}" aria-label="${state.favorites.includes(g.id)?'取消收藏':'收藏'}${g.name}" aria-pressed="${state.favorites.includes(g.id)}">${icon('heart')}</button></article>`).join('');
 $('#empty-state').hidden=filtered.length>0;
 $('#empty-message').textContent=state.view==='favorites'&&!state.query?'点击游戏卡片上的爱心即可收藏。':'更换搜索词或游戏分类。';
 $('#fav-count').textContent=state.favorites.length; $('#fav-count').hidden=!state.favorites.length;
 $('#collection-title').textContent=state.view==='favorites'?'我的收藏':'全部游戏';
 $('#empty-title').textContent=state.view==='favorites'&&!state.favorites.length?'尚未收藏游戏':'暂无匹配游戏';
 $('.category[data-category="all"] span').textContent=state.view==='favorites'?state.favorites.length:games.length;
}
function navigate(view) { state.view=view;state.category='all';state.query='';$('#game-search').value='';$('#hero').hidden=view!=='discover'; $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));updateCategories();renderCards();if(view!=='discover')$('#collection').scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo({top:0,behavior:'smooth'}); }
function updateCategories() { $$('.category').forEach(b=>{b.classList.toggle('active',b.dataset.category===state.category);b.setAttribute('aria-pressed',String(b.dataset.category===state.category));}); }
document.addEventListener('click',e=>{ const open=e.target.closest('[data-open]'),favorite=e.target.closest('[data-favorite]'),nav=e.target.closest('[data-view]'),cat=e.target.closest('[data-category]'); if(open)openGame(open.dataset.open);if(favorite)toggleFavorite(favorite.dataset.favorite);if(nav)navigate(nav.dataset.view);if(cat){state.category=cat.dataset.category;updateCategories();renderCards();} });
$('#game-search').addEventListener('input',e=>{state.query=e.target.value.trim();renderCards();});
$('#theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';theme();save();});
$('#browse-games').addEventListener('click',()=>$('#collection').scrollIntoView({behavior:'smooth'}));
$('#search-toggle').addEventListener('click',()=>{$('#collection').scrollIntoView({behavior:'smooth'});$('#game-search').focus({preventScroll:true});});
$('#reset-filter').addEventListener('click',()=>navigate('all'));
function randomGame() { const choices=games.filter(g=>g.id!==activeGame?.id);openGame(choices[Math.floor(Math.random()*choices.length)].id); }
$('#random-game').addEventListener('click',randomGame);$('#next-game').addEventListener('click',randomGame);
$$('.brand').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate('discover');}));
const dialog=$('#game-dialog'), stage=$('#game-stage');
let activeGame=null, instance=null, gameAbort=null, returnFocus=null, tttPreference='ai';
function score(value, label) { $('#current-score').textContent=value; if(label)$('#score-label').textContent=label; }
function status(value) { $('#game-status').textContent=value; }
function record(value) { const g=activeGame;if(!g)return;const old=Number(state.scores[g.id])||0;if(g.lower?(!old||value<old):value>old){state.scores[g.id]=value;save();}updateBest(); }
function updateBest() { if(!activeGame)return;const best=state.scores[activeGame.id];$('#best-score').textContent=best?`${best}${activeGame.lower?' '+activeGame.unit:''}`:'—';$('#best-label').textContent=activeGame.best; }
function updateFavorite() { const on=state.favorites.includes(activeGame.id);$('#modal-favorite').classList.toggle('is-favorite',on);$('#modal-favorite').setAttribute('aria-label',on?'取消收藏游戏':'收藏游戏');$('#modal-favorite').setAttribute('aria-pressed',String(on)); }
function openGame(id) {
 const g=games.find(g=>g.id===id);if(!g)return;
 if(!dialog.open)returnFocus=document.activeElement;
 activeGame=g;dialog.classList.remove('expanded-game');dialog.classList.toggle('native-game',Boolean(g.native3d));$('#game-title').textContent=g.name;$('#modal-category').textContent=g.category;$('#game-instructions').textContent=g.instructions;$('#control-hint').innerHTML=g.hint;
 state.recent=id;save();updateBest();updateFavorite();if(!dialog.open)dialog.showModal();startGame();
}
function startGame() {
 instance?.destroy?.();gameAbort?.abort();gameAbort=new AbortController();instance=null;
 stage.innerHTML='';$('#touch-controls').innerHTML='';$('#pause-game').hidden=true;$('#pause-game').innerHTML=icon('pause');$('#pause-game').setAttribute('aria-label','暂停游戏');score(0,'本局得分');status('');
 const factories={2048:game2048,snake:gameSnake,breakout:gameBreakout,mines:gameMines,memory:gameMemory,tictac:gameTicTac};
 instance=activeGame.native3d?(activeGame.native3d==='traffic'?gameNative3D():gameArcade3D()):factories[activeGame.id]();stage.focus({preventScroll:true});
}
function on(target,event,fn,opts={}) { target.addEventListener(event,fn,{...opts,signal:gameAbort.signal}); }
function setPauseUI(paused) { $('#pause-game').innerHTML=icon(paused?'play':'pause');$('#pause-game').setAttribute('aria-label',paused?'继续游戏':'暂停游戏'); }
$('#restart-game').addEventListener('click',startGame);$('#pause-game').addEventListener('click',()=>instance?.pause?.());$('#modal-favorite').addEventListener('click',()=>activeGame&&toggleFavorite(activeGame.id));
$('.close-game').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{const previousId=activeGame?.id;instance?.destroy?.();gameAbort?.abort();instance=null;activeGame=null;stage.innerHTML='';renderCards();const target=returnFocus?.isConnected?returnFocus:$(`[data-open="${previousId}"]`);target?.focus({preventScroll:true});});
document.addEventListener('keydown',e=>{
 if(dialog.open){if(e.key==='Escape')return;if(e.target instanceof HTMLButtonElement&&(e.key===' '||e.key==='Enter'))return;if(e.repeat&&activeGame?.native3d&&(e.key==='p'||e.key==='P'||e.key===' ')){e.preventDefault();return;}const consumed=instance?.key?.(e.key);if(consumed)e.preventDefault();}
 else if(e.key==='/'&&e.target.tagName!=='INPUT'){e.preventDefault();$('#game-search').focus();$('#collection').scrollIntoView({behavior:'smooth'});}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)instance?.pause?.(true);});
function overlay(title,description,button='重新开始',action=startGame,mark='') { $('.game-overlay',stage)?.remove();const el=document.createElement('div');el.className='game-overlay';el.innerHTML=`${mark?`<span class="overlay-icon">${mark}</span>`:''}<h3>${title}</h3>${description?`<p>${description}</p>`:''}<button class="button">${button}</button>`;stage.appendChild(el);on($('button',el),'click',action); }
function swipe(fn) { let point=null;on(stage,'pointerdown',e=>{point=[e.clientX,e.clientY];});on(stage,'pointerup',e=>{if(!point)return;const dx=e.clientX-point[0],dy=e.clientY-point[1];point=null;if(Math.max(Math.abs(dx),Math.abs(dy))>24)fn(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});on(stage,'pointercancel',()=>{point=null;}); }
function directions(fn) { $('#touch-controls').innerHTML='<div class="dpad" aria-label="方向控制"><button aria-label="向上" data-dir="up">↑</button><button aria-label="向左" data-dir="left">←</button><button aria-label="向下" data-dir="down">↓</button><button aria-label="向右" data-dir="right">→</button></div>';$$('[data-dir]',$('#touch-controls')).forEach(b=>on(b,'click',e=>{e.preventDefault();fn(b.dataset.dir);})); }
const dirKeys={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'};

let nativeModulePromise;
function gameNative3D() {
 const g=activeGame, signal=gameAbort.signal;
 let controller=null,disposed=false,lastValue=0,dragging=false;
 const player=document.createElement('div');player.className='native-player';stage.appendChild(player);
 const bar=document.createElement('div');bar.className='native-controls';
 bar.innerHTML='<div class="steer-buttons" aria-label="驾驶控制"><button class="small-button" data-action="left" aria-label="向左换道">←</button><button class="small-button" data-action="right" aria-label="向右换道">→</button><button class="small-button" data-action="brake">刹车</button><button class="small-button boost-button" data-action="boost" aria-label="冲刺" disabled><span class="boost-label">冲刺</span><small class="boost-energy">65/100</small><i class="boost-fill" aria-hidden="true"></i></button></div><button class="small-button" data-expand>放大</button>';
 $('#touch-controls').appendChild(bar);
 const details=document.createElement('details');details.className='native-help';
 details.innerHTML='<summary>操作与计分</summary><p></p><p class="save-note">成绩和收藏保存在当前浏览器。</p>';$('p',details).textContent=g.instructions;$('#touch-controls').appendChild(details);
 const expand=$('[data-expand]',bar);
 function updateExpand(){const expanded=dialog.classList.contains('expanded-game');expand.textContent=expanded?'还原':'放大';expand.setAttribute('aria-pressed',String(expanded));}
 updateExpand();on(expand,'click',()=>{dialog.classList.toggle('expanded-game');updateExpand();});
 const controls=$$('[data-action]',bar);
 controls.forEach(button=>{
  on(button,'pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);controller?.input(button.dataset.action,true);});
  on(button,'pointerup',()=>controller?.input(button.dataset.action,false));on(button,'pointercancel',()=>controller?.input(button.dataset.action,false));on(button,'lostpointercapture',()=>controller?.input(button.dataset.action,false));
  on(button,'keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();controller?.input(button.dataset.action,true);}});
  on(button,'keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();controller?.input(button.dataset.action,false);}});
 });
 on(document,'keyup',e=>controller?.key(e.key,false));on(window,'blur',()=>controller?.clear());
 on(player,'pointerdown',e=>{if(e.target.tagName!=='CANVAS')return;dragging=true;player.setPointerCapture(e.pointerId);});
 on(player,'pointermove',e=>{if(!dragging)return;const r=player.getBoundingClientRect();controller?.steer(((e.clientX-r.left)/r.width-.5)*2);});
 on(player,'pointerup',()=>{dragging=false;});on(player,'pointercancel',()=>{dragging=false;controller?.clear();});
 status('正在准备 3D 画面…');
 if(!nativeModulePromise)nativeModulePromise=import('./games-3d.js?v=1.7.0');
 nativeModulePromise.then(({mount3DGame})=>{
  if(disposed||signal.aborted)return;
  controller=mount3DGame({kind:g.native3d,host:player,
   onScore(value){lastValue=value;score(value);},onStatus:status,
   onHUD(data){const button=$('[data-action="boost"]',bar);button.disabled=!data.running||data.boost>0||data.energy<60;$('.boost-label',button).textContent=data.boost>0?'冲刺 '+data.boost.toFixed(1)+'s':'冲刺';$('.boost-energy',button).textContent=Math.floor(data.energy)+'/100';$('.boost-fill',button).style.width=data.energy+'%';button.setAttribute('title','消耗 60 氮气 · 空格 / ↑ / W / Shift');},
   onEnd(result){record(result.score);$('#pause-game').hidden=true;status('');overlay('游戏结束',result.score+' 分 · '+result.distance+' 米<br>金币 '+result.coins+' · 撞翻 '+result.smashes+' 辆 · 完成目标 '+result.missions+' 个');},
   onPause(paused){setPauseUI(paused);if(paused){overlay('已暂停','','继续游戏',()=>{controller.pause();stage.focus();});status('');}else{$('.game-overlay',stage)?.remove();status('');}}
  });
  status('');overlay(g.name,'左右换道 · 收集道具<br>空格 / ↑ 冲刺，P 暂停','开始游戏',()=>{$('.game-overlay',stage)?.remove();controller.start();$('#pause-game').hidden=false;stage.focus();});
 }).catch(()=>{
  if(disposed||signal.aborted)return;nativeModulePromise=null;controller?.destroy();controller=null;
  status('无法启动 3D 画面');overlay('3D 画面未能启动','请更新浏览器并开启硬件加速，然后重试。','重新尝试',startGame);
 });
 return {key:key=>controller?.key(key)||false,pause:force=>controller?.pause(force),destroy(){disposed=true;controller?.destroy();if(lastValue>0){const old=Number(state.scores[g.id])||0;if(lastValue>old){state.scores[g.id]=lastValue;save();}}}};
}

let arcadeModulePromise;
function gameArcade3D(){
 const g=activeGame,signal=gameAbort.signal,tower=g.native3d==='tower';
 let controller=null,disposed=false,lastValue=0,dragging=false,lastX=0;
 const player=document.createElement('div');player.className='native-player';stage.appendChild(player);
 const bar=document.createElement('div');bar.className='native-controls arcade-controls';
 const actions=tower?[['left','↶','向左旋转'],['right','↷','向右旋转']]:[['left','←','向左移动'],['up','↑','向上移动'],['down','↓','向下移动'],['right','→','向右移动'],['dash','疾行','疾行']];
 bar.innerHTML='<div class="steer-buttons" aria-label="'+(tower?'圆环旋转':'黑洞移动')+'">'+actions.map(([action,label,name])=>'<button class="small-button" data-action="'+action+'" aria-label="'+name+'">'+label+'</button>').join('')+'</div><button class="small-button" data-expand>放大</button>';
 $('#touch-controls').appendChild(bar);
 const details=document.createElement('details');details.className='native-help';details.innerHTML='<summary>操作与计分</summary><p></p><p class="save-note">成绩和收藏保存在当前浏览器。</p>';$('p',details).textContent=g.instructions;$('#touch-controls').appendChild(details);
 const expand=$('[data-expand]',bar);
 function size(){const big=dialog.classList.contains('expanded-game');expand.textContent=big?'还原':'放大';expand.setAttribute('aria-pressed',String(big));}
 size();on(expand,'click',()=>{dialog.classList.toggle('expanded-game');size();});
 $$('[data-action]',bar).forEach(button=>{
  on(button,'pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);controller?.input(button.dataset.action,true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])on(button,event,()=>controller?.input(button.dataset.action,false));
  on(button,'keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();controller?.input(button.dataset.action,true);}});
  on(button,'keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();controller?.input(button.dataset.action,false);}});
 });
 on(document,'keyup',e=>controller?.key(e.key,false));on(window,'blur',()=>{dragging=false;controller?.clear();});
 on(player,'pointerdown',e=>{if(e.target.tagName!=='CANVAS')return;dragging=true;lastX=e.clientX;player.setPointerCapture(e.pointerId);if(!tower)controller?.point(e.clientX,e.clientY);});
 on(player,'pointermove',e=>{if(!dragging)return;if(tower)controller?.drag(e.clientX-lastX);else controller?.point(e.clientX,e.clientY);lastX=e.clientX;});
 on(player,'pointerup',()=>{dragging=false;});on(player,'pointercancel',()=>{dragging=false;controller?.clear();});
 const timer=setInterval(()=>{const b=$('[data-action="dash"]',bar);if(!b||!controller)return;const data=controller.status();b.disabled=!data.running||data.cooldown>0;b.textContent=data.dash>0?'疾行中':data.cooldown>0?'疾行 '+data.cooldown.toFixed(1)+'s':'疾行';},100);
 status('正在准备 3D 画面…');
 if(!arcadeModulePromise)arcadeModulePromise=import('./arcade-3d.js?v=1.7.0');
 arcadeModulePromise.then(({mountArcade3D})=>{
  if(disposed||signal.aborted)return;
  controller=mountArcade3D({kind:g.native3d,host:player,onScore(value){lastValue=value;score(value);},
   onPause(paused){dragging=false;setPauseUI(paused);if(paused)overlay('已暂停','','继续游戏',()=>{controller.pause();stage.focus({preventScroll:true});});else $('.game-overlay',stage)?.remove();},
   onEnd(result){record(result.score);$('#pause-game').hidden=true;const title=result.error?'画面中断':result.won?(tower?'游戏结束':'城市已清空'):(tower?'小球碰到红色区域':'时间到');const info=result.error||(tower?'穿过 '+result.cleared+' 层 · 最长连续 '+result.bestStreak+' 层':'吞噬 '+result.eaten+' / '+result.total+' 件 · 最大连吞 ×'+result.bestCombo);overlay(title,result.score+' 分<br>'+info);}
  });
  status('');overlay(g.name,tower?'拖动 / ← → 旋转圆环<br>无限下坠，避开红色区域':'方向键 / WASD 自由移动<br>吞噬小物件长大，90 秒内得分','开始游戏',()=>{$('.game-overlay',stage)?.remove();controller.start();$('#pause-game').hidden=false;stage.focus({preventScroll:true});});
 }).catch(()=>{if(disposed||signal.aborted)return;arcadeModulePromise=null;controller?.destroy();controller=null;status('');overlay('3D 画面未能启动','请开启浏览器硬件加速，然后重试。','重新尝试',startGame);});
 return {key:key=>controller?.key(key)||false,pause:force=>controller?.pause(force),destroy(){disposed=true;clearInterval(timer);controller?.destroy();if(lastValue>0){const old=Number(state.scores[g.id])||0;if(lastValue>old){state.scores[g.id]=lastValue;save();updateBest();}}}};
}

function game2048() {
 let board=Array(16).fill(0), total=0, ended=false, celebrated=false, busyUntil=0;
 const boardEl=document.createElement('div');boardEl.className='board-2048';boardEl.setAttribute('aria-label','2048 棋盘');stage.appendChild(boardEl);
 function spawn() { const empty=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);const idx=empty[Math.floor(Math.random()*empty.length)];if(idx!==undefined)board[idx]=Math.random()<.9?2:4;return idx; }
 function render(fresh=-1,moved=null) {
  boardEl.innerHTML=board.map((v,i)=>`<div class="tile-2048 ${i===fresh?'tile-new':''} ${moved?.merged.includes(i)?'tile-merged':''}" data-v="${v}" ${v>2048?'data-large':''} aria-label="${v||'空格'}">${v||''}</div>`).join('');
  if(moved&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const unit=boardEl.clientWidth/4;board.forEach((v,i)=>{const from=moved.origins[i];if(v&&from!==undefined&&from!==i){boardEl.children[i].animate([{transform:`translate(${((from%4)-(i%4))*unit}px,${(Math.floor(from/4)-Math.floor(i/4))*unit}px)`},{transform:'translate(0,0)'}],{duration:120,easing:'ease-out'});}});}
  score(total);record(total);
 }
 function move(dir) {
  if(ended||Date.now()<busyUntil)return;
  const moved=GameLogic.move2048(board,dir);if(!moved.changed)return;
  busyUntil=Date.now()+115;board=moved.board;total+=moved.score;const fresh=spawn();render(fresh,moved);
  if(board.some(v=>v>=2048)&&!celebrated){celebrated=true;status('已合成 2048，可继续合并更大数字。');toast('已合成 2048');}
  if(!GameLogic.canMove2048(board)){ended=true;overlay('游戏结束',`本局得分：${total} 分。`);}
 }
 spawn();const fresh=spawn();render(fresh);status('方向键 / WASD / 滑动控制');swipe(move);directions(move);
 return {key(k){if(dirKeys[k]){move(dirKeys[k]);return true;}return false;}};
}

function canvasStage(bg) { const canvas=document.createElement('canvas');canvas.width=480;canvas.height=480;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${activeGame.name}游戏画面`);canvas.style.background=bg;stage.appendChild(canvas);return [canvas,canvas.getContext('2d')]; }
function rounded(ctx,x,y,w,h,r,fill) { ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill(); }
function gameSnake() {
 const [canvas,ctx]=canvasStage('#e5edf6');let snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}],dir='right',nextDir='right',food,total=0,started=false,paused=false,ended=false,last=0,raf;
 const cell=24,size=20,vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},opposite={up:'down',down:'up',left:'right',right:'left'};
 function foodNew(){const free=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!snake.some(s=>s.x===x&&s.y===y))free.push({x,y});food=free[Math.floor(Math.random()*free.length)];}
 foodNew();
 function draw(){ctx.fillStyle='#e5edf6';ctx.fillRect(0,0,480,480);ctx.fillStyle='#c6d4e3';for(let x=12;x<480;x+=24)for(let y=12;y<480;y+=24){ctx.beginPath();ctx.arc(x,y,1.1,0,Math.PI*2);ctx.fill();}if(food){rounded(ctx,food.x*cell+5,food.y*cell+5,14,14,5,'#dda26e');rounded(ctx,food.x*cell+7,food.y*cell+5,7,4,2,'#f9d2ad');}snake.forEach((s,i)=>{rounded(ctx,s.x*cell+2,s.y*cell+2,20,20,6,i===0?'#4d7db7':`hsl(213 40% ${Math.min(77,58+i*.8)}%)`);if(i===0){const [vx,vy]=vectors[dir];ctx.fillStyle='white';const ex=s.x*cell+12+vx*4,ey=s.y*cell+12+vy*4;if(vx){ctx.beginPath();ctx.arc(ex,ey-4,2,0,Math.PI*2);ctx.arc(ex,ey+4,2,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.arc(ex-4,ey,2,0,Math.PI*2);ctx.arc(ex+4,ey,2,0,Math.PI*2);ctx.fill();}}});}
 function end(win=false){ended=true;record(total);overlay(win?'棋盘已填满':'游戏结束',`得分：${total} 分 · 果实：${total/10} 颗。`);status(win?'已通关':'撞到边界或自身，游戏结束。');}
 function tick(){dir=nextDir;const [vx,vy]=vectors[dir],head={x:snake[0].x+vx,y:snake[0].y+vy},eating=head.x===food?.x&&head.y===food?.y;const body=eating?snake:snake.slice(0,-1);if(head.x<0||head.x>=size||head.y<0||head.y>=size||body.some(s=>s.x===head.x&&s.y===head.y)){end();return;}snake.unshift(head);if(eating){total+=10;score(total);record(total);if(snake.length===400){end(true);return;}foodNew();}else snake.pop();draw();}
 function loop(t){if(started&&!paused&&!ended&&t-last>Math.max(70,155-Math.floor(total/50)*13)){last=t;tick();}raf=requestAnimationFrame(loop);}
 function begin(){if(started||ended)return;started=true;last=performance.now();$('.game-overlay',stage)?.remove();$('#pause-game').hidden=false;status('每颗果实 10 分，撞到边界或自身时结束。');}
 function change(d){if(ended||paused)return;if(d!==opposite[dir])nextDir=d;begin();}
 function pause(force=false){if(!started||ended||(force&&paused))return;paused=force||!paused;setPauseUI(paused);if(paused){overlay('已暂停','','继续游戏',()=>pause(), 'Ⅱ');}else{$('.game-overlay',stage)?.remove();last=performance.now();}}
 draw();overlay('贪吃蛇','吃果实得分，避开边界和自身。','开始游戏',begin,'↗');directions(change);swipe(change);raf=requestAnimationFrame(loop);
 return {key(k){if(dirKeys[k]){change(dirKeys[k]);return true;}if(k===' '){if(!started)begin();else pause();return true;}return false;},pause,destroy(){cancelAnimationFrame(raf);}};
}

function gameBreakout() {
 const [canvas,ctx]=canvasStage('#f4eae2');let px=195,bx=240,by=375,vx=2.6,vy=-3.3,total=0,lives=3,level=1,started=false,paused=false,ended=false,waiting=false,last=0,raf,bricks=[],left=false,right=false;
 const pw=90,py=436,r=7;
 function build(){bricks=Array.from({length:40},(_,i)=>({x:22+(i%8)*55,y:38+Math.floor(i/8)*28,w:50,h:20,live:true,color:['#c38d70','#d6a486','#e0b394','#e9c6ac','#efd3be'][Math.floor(i/8)]}));}
 function resetBall(){bx=px+pw/2;by=py-18;vx=(Math.random()>.5?1:-1)*(2.6+level*.2);vy=-3.3-level*.22;}
 function draw(){ctx.fillStyle='#f4eae2';ctx.fillRect(0,0,480,480);bricks.forEach(b=>{if(b.live){rounded(ctx,b.x,b.y+2,b.w,b.h,5,'#a579601c');rounded(ctx,b.x,b.y,b.w,b.h-2,5,b.color);}});rounded(ctx,px,py,pw,13,7,'#927460');ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fillStyle='#fffdfa';ctx.shadowColor='#aa8060';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;ctx.font='11px -apple-system,sans-serif';ctx.fillStyle='#a17b63';ctx.textAlign='left';ctx.fillText(`LEVEL ${String(level).padStart(2,'0')}`,23,463);ctx.textAlign='right';ctx.fillText('♥'.repeat(lives)+'♡'.repeat(3-lives),456,463);}
 function begin(){started=true;waiting=false;last=performance.now();$('.game-overlay',stage)?.remove();$('#pause-game').hidden=false;status(`第 ${level} 关 · 还有 ${lives} 次机会`);}
 function tick(dt){
  if(left)px-=6*dt;if(right)px+=6*dt;px=Math.max(0,Math.min(480-pw,px));bx+=vx*dt;by+=vy*dt;
  if(bx<r){bx=r;vx=Math.abs(vx);}if(bx>480-r){bx=480-r;vx=-Math.abs(vx);}if(by<r){by=r;vy=Math.abs(vy);}
  if(vy>0&&by+r>=py&&by-r<=py+13&&bx>=px-r&&bx<=px+pw+r){const rel=(bx-(px+pw/2))/(pw/2);const speed=5+Math.min(4,level*.35);vx=rel*speed*.85;vy=-Math.sqrt(Math.max(6,speed*speed-vx*vx));by=py-r-1;}
  for(const b of bricks){if(!b.live||bx+r<b.x||bx-r>b.x+b.w||by+r<b.y||by-r>b.y+b.h)continue;b.live=false;total+=10;score(total);record(total);const oldX=bx-vx*dt;if(oldX+r<=b.x||oldX-r>=b.x+b.w)vx=-vx;else vy=-vy;break;}
  if(bricks.every(b=>!b.live)){level++;build();resetBall();waiting=true;overlay(`第 ${level-1} 关已完成`,`当前得分：${total} 分。`,'进入下一关',begin);}
  if(by>495){lives--;if(lives===0){ended=true;overlay('游戏结束',`本局得分：${total} 分 · 到达第 ${level} 关。`);status('弹球已掉落 3 次，游戏结束。');}else{waiting=true;resetBall();overlay('弹球掉落',`剩余 ${lives} 次机会。`,'继续挑战',begin);}}
 }
 function loop(t){const dt=Math.min(2,(t-last)/16.667);last=t;if(started&&!paused&&!ended&&!waiting)tick(dt);draw();raf=requestAnimationFrame(loop);}
 function move(e){const bounds=canvas.getBoundingClientRect();px=Math.max(0,Math.min(480-pw,(e.clientX-bounds.left)*480/bounds.width-pw/2));if(!started||waiting)resetBall();}
 function pause(force=false){if(!started||ended||waiting||(force&&paused))return;paused=force||!paused;setPauseUI(paused);if(paused)overlay('已暂停','','继续游戏',()=>pause(),'Ⅱ');else{$('.game-overlay',stage)?.remove();last=performance.now();}}
 on(canvas,'pointermove',move);on(canvas,'pointerdown',e=>{canvas.setPointerCapture(e.pointerId);move(e);});on(document,'keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))left=false;if(['ArrowRight','d','D'].includes(e.key))right=false;});on(window,'blur',()=>{left=right=false;pause(true);});
 build();draw();overlay('打砖块','移动挡板接住弹球，击碎所有砖块。','开始游戏',begin,'↗');raf=requestAnimationFrame(loop);
 return {key(k){if(['ArrowLeft','a','A'].includes(k)){left=true;return true;}if(['ArrowRight','d','D'].includes(k)){right=true;return true;}if(k===' '){if(!started)begin();else pause();return true;}return false;},pause,destroy(){cancelAnimationFrame(raf);}};
}

function gameMines() {
 let mineData=null,revealed=new Set(),flags=new Set(),ended=false,flagMode=false,seconds=0,timer=null;
 const board=document.createElement('div');board.className='mines-board';board.setAttribute('aria-label','9乘9扫雷棋盘');stage.appendChild(board);
 const cells=Array.from({length:81},(_,i)=>{const b=document.createElement('button');b.className='mine-cell';b.setAttribute('aria-label',`第${Math.floor(i/9)+1}行第${i%9+1}列，未翻开`);board.appendChild(b);on(b,'click',()=>{if(flagMode)flag(i);else reveal(i);});on(b,'contextmenu',e=>{e.preventDefault();flag(i);});return b;});
 $('#touch-controls').innerHTML='<div class="mine-tools"><button id="flag-mode" class="small-button" aria-pressed="false">⚑ 标记模式：关</button><span id="mine-remaining" class="small-button">剩余标记 10</span></div>';
 on($('#flag-mode'),'click',()=>{flagMode=!flagMode;$('#flag-mode').classList.toggle('active',flagMode);$('#flag-mode').setAttribute('aria-pressed',String(flagMode));$('#flag-mode').textContent=`⚑ 标记模式：${flagMode?'开':'关'}`;});
 function flag(i){if(ended||revealed.has(i))return;if(flags.has(i))flags.delete(i);else if(flags.size<10)flags.add(i);else{status('10 面旗帜已经用完，可先取消一个标记。');return;}cells[i].textContent=flags.has(i)?'⚑':'';cells[i].setAttribute('aria-label',`第${Math.floor(i/9)+1}行第${i%9+1}列，${flags.has(i)?'已标记':'未翻开'}`);$('#mine-remaining').textContent=`剩余标记 ${10-flags.size}`;}
 function reveal(i){
  if(ended||revealed.has(i)||flags.has(i))return;
  if(!mineData){mineData=GameLogic.makeMines(i);timer=setInterval(()=>{seconds++;score(`${seconds}s`);},1000);}
  if(mineData.mines.has(i)){ended=true;clearInterval(timer);mineData.mines.forEach(n=>{cells[n].textContent='✹';cells[n].classList.add('revealed');cells[n].setAttribute('aria-label','地雷');});cells[i].classList.add('exploded');status('触发地雷，游戏结束。');setTimeoutSafe(()=>overlay('游戏结束',`已安全翻开 ${revealed.size} / 71 格。`),650);return;}
  const stack=[i];while(stack.length){const n=stack.pop();if(revealed.has(n)||flags.has(n)||mineData.mines.has(n))continue;revealed.add(n);const count=mineData.counts[n];cells[n].classList.add('revealed');cells[n].dataset.n=count;cells[n].textContent=count||'';cells[n].disabled=true;cells[n].setAttribute('aria-label',count?`周围有${count}颗地雷`:'周围安全');if(count===0)stack.push(...GameLogic.neighbors(n));}
  if(revealed.size===71){ended=true;clearInterval(timer);const finalTime=Math.max(1,seconds);record(finalTime);mineData.mines.forEach(n=>{cells[n].textContent='⚑';});overlay('扫雷完成',`用时 ${finalTime} 秒，已找出 10 颗地雷。`);status('已通关');}else status(`已安全翻开 ${revealed.size} / 71 格`);
 }
 const delays=[];function setTimeoutSafe(fn,ms){const t=setTimeout(fn,ms);delays.push(t);}
 score('0s','本局用时');status('首点及周围格子保证安全。');
 return {destroy(){clearInterval(timer);delays.forEach(clearTimeout);}};
}

function gameMemory() {
 const symbols=['✳','✦','●','▲','☁','♥','☀','◆'],deck=GameLogic.shuffled([...symbols,...symbols]);let first=null,locked=false,moves=0,pairs=0,ended=false;const timers=[];
 const board=document.createElement('div');board.className='memory-board';board.setAttribute('aria-label','记忆翻牌棋盘');stage.appendChild(board);
 const cards=deck.map((symbol,i)=>{const b=document.createElement('button');b.className='memory-card';b.setAttribute('aria-label',`翻开第${i+1}张卡片`);b.innerHTML=`<span class="memory-card-inner"><span class="memory-back" aria-hidden="true">✦</span><span class="memory-front" aria-hidden="true">${symbol}</span></span>`;board.appendChild(b);on(b,'click',()=>flip(i));return b;});
 function flip(i){
  if(ended||locked||cards[i].classList.contains('flipped')||cards[i].classList.contains('matched'))return;
  cards[i].classList.add('flipped');cards[i].setAttribute('aria-label',`第${i+1}张卡片：${deck[i]}`);
  if(first===null){first=i;return;}
  moves++;score(moves,'翻牌步数');const previous=first;first=null;
  if(deck[previous]===deck[i]){pairs++;[previous,i].forEach(n=>{cards[n].classList.add('matched');cards[n].disabled=true;cards[n].setAttribute('aria-label',`已配对：${deck[n]}`);});status(`已配对 ${pairs} / 8 组`);if(pairs===8){ended=true;record(moves);timers.push(setTimeout(()=>overlay('配对完成',`已配对 8 组，共 ${moves} 步。`),600));}}
  else{locked=true;status(`两张卡片不同，已配对 ${pairs} / 8 组`);timers.push(setTimeout(()=>{[previous,i].forEach(n=>{cards[n].classList.remove('flipped');cards[n].setAttribute('aria-label',`翻开第${n+1}张卡片`);});locked=false;},850));}
 }
 score(0,'翻牌步数');status('16 张卡片，共 8 组。');return {destroy(){timers.forEach(clearTimeout);}};
}

function gameTicTac() {
 let board=Array(9).fill(''),turn='X',ended=false,busy=false,mode=tttPreference,timer=null;
 const modeEl=document.createElement('div');modeEl.className='ttt-mode';modeEl.innerHTML='<button class="active" data-mode="ai" aria-pressed="true">挑战电脑</button><button data-mode="friend" aria-pressed="false">双人对弈</button>';stage.appendChild(modeEl);
 const grid=document.createElement('div');grid.className='ttt-board';grid.setAttribute('aria-label','井字棋棋盘');stage.appendChild(grid);
 const cells=board.map((_,i)=>{const b=document.createElement('button');b.className='ttt-cell';b.setAttribute('aria-label',`第${Math.floor(i/3)+1}行第${i%3+1}列，空格`);grid.appendChild(b);on(b,'click',()=>{if(!busy)play(i);});return b;});
 function reset(){clearTimeout(timer);board=Array(9).fill('');turn='X';ended=false;busy=false;$('.game-overlay',stage)?.remove();cells.forEach(b=>{b.textContent='';b.disabled=false;b.classList.remove('win');delete b.dataset.player;});cells.forEach((b,i)=>b.setAttribute('aria-label',`第${Math.floor(i/3)+1}行第${i%3+1}列，空格`));$$('[data-mode]',modeEl).forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});score('×','当前落子');status(mode==='ai'?'你执 × 先手，电脑执 ○。':'× 先手，和朋友轮流落子。');}
 $$('[data-mode]',modeEl).forEach(b=>on(b,'click',()=>{mode=b.dataset.mode;tttPreference=mode;reset();}));
 function play(i){
  if(ended||board[i])return;board[i]=turn;cells[i].textContent=turn==='X'?'×':'○';cells[i].dataset.player=turn;cells[i].disabled=true;cells[i].setAttribute('aria-label',`第${Math.floor(i/3)+1}行第${i%3+1}列，${turn}`);
  const result=GameLogic.tttResult(board);
  if(result){ended=true;busy=false;result.line.forEach(n=>cells[n].classList.add('win'));const who=result.winner==='X'?'×':'○';const win=result.winner!=='draw';if(win&&(mode==='friend'||result.winner==='X'))record((Number(state.scores.tictac)||0)+1);score(win?who:'平局','本局结果');status(result.winner==='draw'?'平局':mode==='ai'?(result.winner==='X'?'你获胜':'电脑获胜'):`${who} 获胜`);timer=setTimeout(()=>overlay(result.winner==='draw'?'平局':mode==='ai'?(result.winner==='X'?'你获胜':'电脑获胜'):`${who} 获胜`,''),750);return;}
  turn=turn==='X'?'O':'X';score(turn==='X'?'×':'○','当前落子');status(mode==='ai'?(turn==='O'?'电脑正在思考…':'轮到你落子。'):`轮到 ${turn==='X'?'×':'○'} 落子。`);
  if(mode==='ai'&&turn==='O'){busy=true;timer=setTimeout(()=>{busy=false;play(GameLogic.bestTTTMove([...board]));},420);}
 }
 reset();return {destroy(){clearTimeout(timer);}};
}
renderCards();
})();
