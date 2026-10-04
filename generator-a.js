 class SeededRandom{
 constructor(seed){
 this.seed = seed || Date.now();
}
 next(){
 this.seed =(this.seed * 16807 + 0)% 2147483647;
 return(this.seed - 1)/ 2147483646;
}
 range(min,max){
 return min + this.next()*(max - min);
}
 int(min,max){
 return Math.floor(this.range(min,max + 1));
}
}
 function createNoise(rng){
 const grads =[];
 for(let i = 0;i < 256;i++){
 const a = rng.next()* Math.PI * 2;
 grads.push([Math.cos(a),Math.sin(a)]);
}
 const perm = new Uint8Array(512);
 for(let i = 0;i < 256;i++)perm[i]= i;
 for(let i = 255;i > 0;i--){
 const j = rng.int(0,i);
 [perm[i],perm[j]]=[perm[j],perm[i]];
}
 for(let i = 0;i < 256;i++)perm[i + 256]= perm[i];
 function fade(t){return t * t * t *(t *(t * 6 - 15)+ 10);}
 function lerp(a,b,t){return a + t *(b - a);}
 function perlin2(x,y){
 const X = Math.floor(x)& 255;
 const Y = Math.floor(y)& 255;
 const xf = x - Math.floor(x);
 const yf = y - Math.floor(y);
 const u = fade(xf);
 const v = fade(yf);
 const aa = perm[perm[X]+ Y];
 const ab = perm[perm[X]+ Y + 1];
 const ba = perm[perm[X + 1]+ Y];
 const bb = perm[perm[X + 1]+ Y + 1];
 const gaa = grads[aa];
 const gab = grads[ab];
 const gba = grads[ba];
 const gbb = grads[bb];
 const dotAA = gaa[0]* xf + gaa[1]* yf;
 const dotBA = gba[0]*(xf - 1)+ gba[1]* yf;
 const dotAB = gab[0]* xf + gab[1]*(yf - 1);
 const dotBB = gbb[0]*(xf - 1)+ gbb[1]*(yf - 1);
 return lerp(lerp(dotAA,dotBA,u),lerp(dotAB,dotBB,u),v);
}
 function fbm(x,y,octaves = 4,lacunarity = 2.0,gain = 0.5){
 let sum = 0;
 let amp = 1;
 let freq = 1;
 let maxAmp = 0;
 for(let i = 0;i < octaves;i++){
 sum += perlin2(x * freq,y * freq)* amp;
 maxAmp += amp;
 amp *= gain;
 freq *= lacunarity;
}
 return sum / maxAmp;
}
 function curl(x,y,eps = 0.01){
 const n1 = fbm(x,y + eps);
 const n2 = fbm(x,y - eps);
 const n3 = fbm(x + eps,y);
 const n4 = fbm(x - eps,y);
 return{
 x:(n1 - n2)/(2 * eps),
 y:(n4 - n3)/(2 * eps)
};
}
 return{perlin: perlin2,fbm,curl};
}
 function hexToRgb(hex){
 const r = parseInt(hex.slice(1,3),16);
 const g = parseInt(hex.slice(3,5),16);
 const b = parseInt(hex.slice(5,7),16);
 return{r,g,b};
}
 function rgba(hex,a){
 const{r,g,b}= hexToRgb(hex);
 return `rgba(${r},${g},${b},${a})`;
}
 const canvas = document.getElementById('frostCanvas');
 const ctx = canvas.getContext('2d');
 let currentRng = null;
 let noise = null;
 function getParams(){
 return{
 width: parseInt(document.getElementById('canvasWidth').value)|| 800,
 height: parseInt(document.getElementById('canvasHeight').value)|| 600,
 direction: document.getElementById('direction').value,
 baseColor: document.getElementById('baseColor').value,
 highlightColor: document.getElementById('highlightColor').value,
 bgColor: document.getElementById('bgColor').value,
 transparentBg: document.getElementById('transparentBg').checked,
 opacity: parseFloat(document.getElementById('opacity').value),
 rootCount: parseInt(document.getElementById('rootCount').value),
 branchProb: parseFloat(document.getElementById('branchProb').value),
 maxDepth: parseInt(document.getElementById('maxDepth').value),
 angleSpread: parseFloat(document.getElementById('angleSpread').value)* Math.PI / 180,
 segLength: parseFloat(document.getElementById('segLength').value),
 thickness: parseFloat(document.getElementById('thickness').value),
 noiseInfluence: parseFloat(document.getElementById('noiseInfluence').value),
 curlStrength: parseFloat(document.getElementById('curlStrength').value),
 enableIcicles: document.getElementById('enableIcicles').checked,
 icicleDensity: parseFloat(document.getElementById('icicleDensity').value),
 icicleLength: parseFloat(document.getElementById('icicleLength').value),
 icicleTaper: parseFloat(document.getElementById('icicleTaper').value),
 icicleBlur: parseFloat(document.getElementById('icicleBlur').value),
 enableReflections: document.getElementById('enableReflections').checked,
 specularStrength: parseFloat(document.getElementById('specularStrength').value),
 sparkleCount: parseInt(document.getElementById('sparkleCount').value),
 sparkleIntensity: parseFloat(document.getElementById('sparkleIntensity').value),
 glowStrength: parseFloat(document.getElementById('glowStrength').value),
 frostDensity: parseFloat(document.getElementById('frostDensity').value),
 noiseScale: parseFloat(document.getElementById('noiseScale').value),
 enableEdgeFrost: document.getElementById('enableEdgeFrost').checked,
 seed: parseInt(document.getElementById('seed').value)|| 0
};
}
 function updateValueDisplays(){
 document.getElementById('opacityVal').textContent = document.getElementById('opacity').value;
 document.getElementById('rootCountVal').textContent = document.getElementById('rootCount').value;
 document.getElementById('branchProbVal').textContent = document.getElementById('branchProb').value;
 document.getElementById('maxDepthVal').textContent = document.getElementById('maxDepth').value;
 document.getElementById('angleSpreadVal').textContent = document.getElementById('angleSpread').value + '°';
 document.getElementById('segLengthVal').textContent = document.getElementById('segLength').value;
 document.getElementById('thicknessVal').textContent = document.getElementById('thickness').value;
 document.getElementById('noiseInfluenceVal').textContent = document.getElementById('noiseInfluence').value;
 document.getElementById('curlStrengthVal').textContent = document.getElementById('curlStrength').value;
 document.getElementById('icicleDensityVal').textContent = document.getElementById('icicleDensity').value;
 document.getElementById('icicleLengthVal').textContent = document.getElementById('icicleLength').value;
 document.getElementById('icicleTaperVal').textContent = document.getElementById('icicleTaper').value;
 document.getElementById('icicleBlurVal').textContent = document.getElementById('icicleBlur').value;
 document.getElementById('specularStrengthVal').textContent = document.getElementById('specularStrength').value;
 document.getElementById('sparkleCountVal').textContent = document.getElementById('sparkleCount').value;
 document.getElementById('sparkleIntensityVal').textContent = document.getElementById('sparkleIntensity').value;
 document.getElementById('glowStrengthVal').textContent = document.getElementById('glowStrength').value;
 document.getElementById('frostDensityVal').textContent = document.getElementById('frostDensity').value;
 document.getElementById('noiseScaleVal').textContent = document.getElementById('noiseScale').value;
}
 function syncColor(id,hexId){
 const picker = document.getElementById(id);
 const hex = document.getElementById(hexId);
 picker.addEventListener('input',()=>{
 hex.value = picker.value;
 scheduleGenerate();
});
 hex.addEventListener('change',()=>{
 if(/^#[0-9A-Fa-f]{6}$/.test(hex.value)){
 picker.value = hex.value;
 scheduleGenerate();
}
});
}
 syncColor('baseColor','baseColorHex');
 syncColor('highlightColor','highlightColorHex');
 syncColor('bgColor','bgColorHex');
 function drawBranch(ctx,x,y,angle,length,depth,params,rng){
 if(depth <= 0 || length < 1.5)return;
 const ni = params.noiseInfluence;
 const curlS = params.curlStrength;
 const scale = params.noiseScale * 40;
 const n = noise.fbm(x * scale,y * scale,4);
 const n2 = noise.fbm(x * scale * 1.7 + 100,y * scale * 1.7 + 50,3);
 const curl = noise.curl(x * scale * 0.6,y * scale * 0.6);
 let growAngle = angle;
 if(curlS > 0){
 growAngle +=(curl.x * 0.7 + curl.y * 0.3)* curlS *(0.4 + ni * 0.6);
}
 growAngle += n * 0.55 * ni;
 const lenMod = 1 + n2 * 0.45 * ni;
 const segLen = length * Math.max(0.35,lenMod);
 const endX = x + Math.cos(growAngle)* segLen;
 const endY = y + Math.sin(growAngle)* segLen;
 const depthRatio = depth / params.maxDepth;
 const thickNoise = 1 + n * 0.4 * ni;
 const t = params.thickness * depthRatio * Math.max(0.25,thickNoise);
 const alpha = params.opacity *(0.35 + 0.65 * depthRatio)*(0.75 + n * 0.25 * ni);
 if(params.glowStrength > 0){
 ctx.beginPath();
 ctx.moveTo(x,y);
 ctx.lineTo(endX,endY);
 ctx.strokeStyle = rgba(params.baseColor,params.glowStrength * 0.22 * alpha);
 ctx.lineWidth = t * 3.8;
 ctx.lineCap = 'round';
 ctx.stroke();
}
 ctx.beginPath();
 ctx.moveTo(x,y);
 ctx.lineTo(endX,endY);
 ctx.strokeStyle = rgba(params.baseColor,Math.min(1,alpha));
 ctx.lineWidth = Math.max(0.3,t);
 ctx.lineCap = 'round';
 ctx.stroke();
 const hx = Math.cos(growAngle + Math.PI / 2)* t * 0.15;
 const hy = Math.sin(growAngle + Math.PI / 2)* t * 0.15;
 ctx.beginPath();
 ctx.moveTo(x + hx,y + hy);
 ctx.lineTo(endX + hx,endY + hy);
 ctx.strokeStyle = rgba(params.highlightColor,alpha * 0.55);
 ctx.lineWidth = Math.max(0.4,t * 0.32);
 ctx.stroke();
 if(params.enableReflections && params.specularStrength > 0){
 const lightAngle = -Math.PI * 0.75;
 const facing = Math.cos(growAngle - lightAngle);
 const spec = Math.pow(Math.max(0,facing),4)* params.specularStrength;
 if(spec > 0.05){
 ctx.beginPath();
 ctx.moveTo(x,y);
 ctx.lineTo(endX,endY);
 ctx.strokeStyle = rgba('#ffffff',Math.min(1,spec * alpha * 0.9));
 ctx.lineWidth = Math.max(0.35,t * 0.22);
 ctx.lineCap = 'round';
 ctx.stroke();
 if(spec > 0.35 && rng.next()< 0.4){
 const mx =(x + endX)* 0.5;
 const my =(y + endY)* 0.5;
 const hs = 0.8 + spec * 1.5;
 ctx.beginPath();
 ctx.arc(mx,my,hs,0,Math.PI * 2);
 ctx.fillStyle = rgba('#ffffff',Math.min(1,spec * 0.7));
 ctx.fill();
}
}
}
 if(rng.next()< params.branchProb *(0.7 + n * 0.3 * ni)&& depth > 1){
 const spread = params.angleSpread *(0.55 + rng.next()* 0.7 + Math.abs(n)* 0.25 * ni);
 const lenFactor = 0.5 + rng.next()* 0.38 + Math.abs(n2)* 0.12 * ni;
 drawBranch(ctx,endX,endY,growAngle - spread,length * lenFactor,depth - 1,params,rng);
 if(rng.next()< 0.72){
 drawBranch(ctx,endX,endY,growAngle + spread,length * lenFactor,depth - 1,params,rng);
}
 if(rng.next()< 0.28 + ni * 0.15){
 const microSpread =(rng.next()- 0.5)* spread * 0.7;
 drawBranch(ctx,endX,endY,growAngle + microSpread,length * lenFactor * 0.7,depth - 1,params,rng);
}
}
 if(depth > 1){
 const curve = n * 0.5 * ni +(rng.next()- 0.5)* 0.25;
 const nextLen = length *(0.68 + rng.next()* 0.28 + n2 * 0.1 * ni);
 drawBranch(ctx,endX,endY,growAngle + curve,nextLen,depth - 1,params,rng);
}
}
 function drawIcicle(ctx,x,y,params,rng){
 const len = params.icicleLength *(0.5 + rng.next()* 0.8);
 const baseW = params.thickness *(1.5 + rng.next()* 1.5);
 const tipY = y + len;
 const blur = params.icicleBlur || 0;
 ctx.save();
 if(blur > 0){
 ctx.shadowColor = rgba(params.baseColor,0.45);
 ctx.shadowBlur = blur;
 ctx.shadowOffsetX = 0;
 ctx.shadowOffsetY = 0;
}
 if(blur > 1.5){
 ctx.beginPath();
 ctx.moveTo(x - baseW * 0.7,y);
 ctx.lineTo(x + baseW * 0.7,y);
 ctx.lineTo(x + baseW * 0.25 *(1 - params.icicleTaper),tipY);
 ctx.lineTo(x - baseW * 0.25 *(1 - params.icicleTaper),tipY);
 ctx.closePath();
 ctx.fillStyle = rgba(params.baseColor,params.opacity * 0.2);
 ctx.fill();
}
 ctx.beginPath();
 ctx.moveTo(x - baseW / 2,y);
 ctx.lineTo(x + baseW / 2,y);
 ctx.lineTo(x + baseW * 0.15 *(1 - params.icicleTaper),tipY);
 ctx.lineTo(x - baseW * 0.15 *(1 - params.icicleTaper),tipY);
 ctx.closePath();
 const grad = ctx.createLinearGradient(x,y,x,tipY);
 grad.addColorStop(0,rgba(params.baseColor,params.opacity * 0.9));
 grad.addColorStop(0.6,rgba(params.baseColor,params.opacity * 0.55));
 grad.addColorStop(1,rgba(params.highlightColor,params.opacity * 0.25));
 ctx.fillStyle = grad;
 ctx.fill();
 ctx.shadowBlur = 0;
 ctx.beginPath();
 ctx.moveTo(x - baseW * 0.15,y);
 ctx.lineTo(x,tipY);
 ctx.strokeStyle = rgba(params.highlightColor,params.opacity * 0.6);
 ctx.lineWidth = 1;
 ctx.stroke();
 if(params.enableReflections && params.specularStrength > 0){
 const spec = params.specularStrength *(0.5 + rng.next()* 0.5);
 const streakX = x - baseW * 0.12 + rng.range(-0.5,0.5);
 ctx.beginPath();
 ctx.moveTo(streakX,y + len * 0.08);
 ctx.lineTo(x +(rng.next()- 0.5)* 1.5,tipY - len * 0.05);
 ctx.strokeStyle = rgba('#ffffff',Math.min(1,spec * params.opacity * 0.75));
 ctx.lineWidth = Math.max(0.6,baseW * 0.12);
 ctx.lineCap = 'round';
 ctx.stroke();
 if(spec > 0.4){
 ctx.beginPath();
 ctx.arc(x,tipY - 1,1.2 + spec * 1.2,0,Math.PI * 2);
 ctx.fillStyle = rgba('#ffffff',Math.min(1,spec * 0.85));
 ctx.fill();
}
}
 if(params.glowStrength > 0){
 ctx.beginPath();
 ctx.moveTo(x,y);
 ctx.lineTo(x,tipY);
 ctx.strokeStyle = rgba(params.highlightColor,params.glowStrength * 0.3);
 ctx.lineWidth = baseW * 0.4;
 ctx.stroke();
}
 ctx.restore();
}
