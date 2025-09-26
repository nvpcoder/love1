/* ---------- Helpers ---------- */
const rand = (a,b) => a + Math.random()*(b-a);

/* ---------- Canvas setup ---------- */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: true });

let DPR = window.devicePixelRatio || 1;
function resize(){
  DPR = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
resize();

/* ---------- Heart shape parametric ---------- */
function heartPoint(t, scale=10) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x: x * scale, y: -y * scale };
}

/* ---------- Particles ---------- */
class Particle {
  constructor(x,y,color){
    this.x = x; this.y = y;
    this.vx = rand(-0.6,0.6); this.vy = rand(-1.5,-0.2);
    this.life = rand(1.2,2.6);
    this.age = 0;
    this.size = rand(1.2,3.6);
    this.color = color || `rgba(255,${Math.floor(rand(50,180))},${Math.floor(rand(100,255))},1)`;
  }
  update(dt){
    this.age += dt;
    this.vy += 0.4 * dt;
    this.x += this.vx * 60 * dt;
    this.y += this.vy * 60 * dt;
  }
  draw(ctx){
    const t = Math.max(0, 1 - (this.age / this.life));
    ctx.globalAlpha = Math.pow(t, 1.8);
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size * (1+ (1-t)*0.4), 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  dead(){ return this.age >= this.life; }
}

/* ---------- Text ring ---------- */
class TextRing {
  constructor(text, radius, speed, fontSize=18){
    this.text = text;
    this.radius = radius;
    this.speed = speed;
    this.angle = 0;
    this.fontSize = fontSize;
  }
  update(dt){ this.angle += this.speed * dt; }
  draw(ctx, cx, cy){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);
    ctx.font = `${this.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = this.text.split('');
    const circumference = 2*Math.PI*this.radius;
    for(let i=0;i<chars.length;i++){
      const theta = (i / chars.length) * Math.PI*2;
      const x = Math.cos(theta)*this.radius;
      const y = Math.sin(theta)*this.radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(theta + Math.PI/2);
      ctx.fillStyle = (i%5===0)?'#ff8fb3':'#fff';
      ctx.globalAlpha = 0.9;
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

/* ---------- Scene state ---------- */
const particles = [];
const rings = [];
let last = performance.now();

function makeRings(){
  rings.length = 0;
  rings.push(new TextRing('Em yêu anh • Em yêu anh •', 110, 0.03, 16));
  rings.push(new TextRing('Gửi cho crush để tỏ tình • Tokitoki.love •', 170, -0.02, 14));
}
makeRings();

function spawnHeartParticles(cx, cy, scale, count=250){
  for(let i=0;i<count;i++){
    const t = Math.random()*Math.PI*2;
    const p = heartPoint(t, scale);
    const jitterR = rand(0,4);
    const angle = t + rand(-0.2,0.2);
    const x = cx + p.x + Math.cos(angle)*jitterR;
    const y = cy + p.y + Math.sin(angle)*jitterR;
    const color = `rgba(255, ${Math.floor(rand(30,160))}, ${Math.floor(rand(70,220))},1)`;
    particles.push(new Particle(x,y,color));
  }
}

function initialBloom(){
  const cx = canvas.clientWidth/2;
  const cy = canvas.clientHeight*0.36;
  spawnHeartParticles(cx, cy, Math.min(canvas.clientWidth, canvas.clientHeight) / 55, 420);
}
initialBloom();

canvas.addEventListener('click', ()=>{
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width/2;
  const cy = rect.height*0.36;
  spawnHeartParticles(cx, cy, Math.min(rect.width, rect.height) / 55, 300);
});

/* ---------- Loop ---------- */
function loop(now){
  const dt = Math.min(0.033, (now - last)/1000);
  last = now;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0,0,w,h);

  for(let i=0;i<5;i++){
    ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random()*0.03})`;
    ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*1.6, Math.random()*1.6);
  }

  const cx = w/2, cy = h*0.6;
  rings.forEach(r=>{ r.update(dt); r.draw(ctx, cx, cy); });

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.update(dt);
    p.draw(ctx);
    if(p.dead()) particles.splice(i,1);
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(cx, h*0.36, 10, cx, h*0.36, 220);
  grad.addColorStop(0, 'rgba(255,120,160,0.25)');
  grad.addColorStop(0.6, 'rgba(120,30,80,0.04)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, h*0.36, Math.min(w,h)/4.2, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(()=>{
  const cx = canvas.clientWidth/2;
  const cy = canvas.clientHeight*0.36;
  spawnHeartParticles(cx, cy, Math.min(canvas.clientWidth, canvas.clientHeight) / 55, 120);
}, 2500);
