const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

const titleScreen = document.getElementById('title-screen');
const endScreen = document.getElementById('end-screen');
const hud = document.getElementById('hud');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const endText = document.getElementById('end-text');
const bestTitle = document.getElementById('best-score-title');
const bestEnd = document.getElementById('best-score-end');

const bgColors = ['#87CEEB','#FF8C42','#2d4a22'];
const gooseEmoji = '🪿';

let highScore = localStorage.getItem('geeseHighScore') || 0;
bestTitle.textContent = `Best: ${highScore}`;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playShot(){
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='square'; o.frequency.setValueAtTime(800, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime+0.1);
  g.gain.setValueAtTime(0.5, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.1);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+0.1);
}
function playHonk(){
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='sawtooth'; o.frequency.setValueAtTime(200, audioCtx.currentTime);
  o.frequency.linearRampToValueAtTime(400, audioCtx.currentTime+0.15);
  o.frequency.linearRampToValueAtTime(150, audioCtx.currentTime+0.3);
  g.gain.setValueAtTime(0.4, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.3);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+0.3);
}

let geese=[], particles=[], score=0, level=0, speed=1.5, spawnCount=1, speedTimer=0, gameTimer=0, running=false;

function spawnGeese(){
  for(let i=0;i<spawnCount;i++){
    geese.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height*0.6, vx:(Math.random()-0.5)*speed, vy:(Math.random()-0.5)*speed, size:50+Math.random()*20});
  }
}
function spawnFeathers(x,y){
  for(let i=0;i<14;i++){
    particles.push({x,y, vx:(Math.random()-0.5)*9, vy:(Math.random()-0.5)*9, life:1, color: Math.random()>0.3?'white':'#ffcc66'});
  }
}
function update(dt){
  if(!running) return;
  speedTimer+=dt; gameTimer+=dt;
  if(speedTimer>=5){ speed*=1.8; spawnCount*=2; spawnGeese(); speedTimer=0; }
  if(gameTimer>=30){ endLevel(); return; }
  timerEl.textContent = Math.ceil(30-gameTimer);
  geese.forEach(g=>{
    g.x+=g.vx; g.y+=g.vy;
    if(g.x<0 || g.x>canvas.width-g.size) g.vx*=-1;
    if(g.y<0 || g.y>canvas.height-g.size) g.vy*=-1;
  });
  particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.18; p.life-=0.02; });
  particles = particles.filter(p=>p.life>0);
}
function draw(){
  ctx.fillStyle = bgColors[level] || '#87CEEB';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = level==0?'#32CD32':level==1?'#1e3d14':'#555';
  ctx.fillRect(0,canvas.height*0.75,canvas.width,canvas.height*0.25);
  ctx.font = '40px serif';
  geese.forEach(g=>{
    ctx.save();
    ctx.translate(g.x+g.size/2, g.y+g.size/2);
    ctx.scale(g.vx>0?-1:1,1);
    ctx.fillText(gooseEmoji, -20, 10);
    ctx.restore();
  });
  particles.forEach(p=>{
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.ellipse(p.x,p.y,6,3,Math.random()*6,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1;
  if(running) requestAnimationFrame(loop);
}
let last=0;
function loop(ts){ const dt=(ts-last)/1000; last=ts; update(dt); draw(); }

function startLevel(lvl){
  if(audioCtx.state==='suspended') audioCtx.resume();
  level=lvl; geese=[]; particles=[]; score=0; speed=1.5+lvl*0.5; spawnCount=1; speedTimer=0; gameTimer=0;
  levelEl.textContent=`Level ${level+1}`; scoreEl.textContent=`Score: 0`; timerEl.textContent=30;
  titleScreen.classList.add('hidden'); endScreen.classList.add('hidden'); hud.classList.remove('hidden');
  spawnGeese(); running=true; last=performance.now(); requestAnimationFrame(loop);
}
function endLevel(){
  running=false;
  if(score>highScore){ highScore=score; localStorage.setItem('geeseHighScore', highScore); }
  bestTitle.textContent=`Best: ${highScore}`;
  endText.textContent=`Time! Score: ${score}`;
  bestEnd.textContent=`Best Score: ${highScore}`;
  endScreen.classList.remove('hidden');
  hud.classList.add('hidden');
  document.getElementById('next-btn').style.display = level<2?'block':'none';
}
function shoot(e){
  if(!running) return;
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
  const y=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
  let hit=false;
  geese = geese.filter(g=>{
    if(x>g.x && x<g.x+g.size && y>g.y && y<g.y+g.size){
      hit=true; score++; scoreEl.textContent=`Score: ${score}`;
      spawnFeathers(g.x+g.size/2, g.y+g.size/2); return false;
    } return true;
  });
  if(hit) playShot(); else playHonk();
}
canvas.addEventListener('touchstart', shoot, {passive:false});
canvas.addEventListener('mousedown', shoot);
document.getElementById('start-btn').onclick=()=>startLevel(0);
document.getElementById('again-btn').onclick=()=>startLevel(level);
document.getElementById('next-btn').onclick=()=>startLevel(level+1);
