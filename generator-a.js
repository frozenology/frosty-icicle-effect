const $ = (id) => document.getElementById(id);
class SeededRandom {
 constructor(seed) {
 this.seed = seed || Date.now();
 }
 next() {
 this.seed = (this.seed * 16807 + 0) % 2147483647;
 return (this.seed - 1) / 2147483646;
 }
 range(min, max) {
 return min + this.next() * (max - min);
 }
 int(min, max) {
 return Math.floor(this.range(min, max + 1));
 }
}
function createNoise(rng) {
 const grads = [];
 for (let i = 0; i < 256; i++) {
 const a = rng.next() * Math.PI * 2;
 grads.push([Math.cos(a), Math.sin(a)]);
 }
 const perm = new Uint8Array(512);
 for (let i = 0; i < 256; i++) perm[i] = i;
 for (let i = 255; i > 0; i--) {
 const j = rng.int(0, i);
 [perm[i], perm[j]] = [perm[j], perm[i]];
 }
 for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
 function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
 function lerp(a, b, t) { return a + t * (b - a); }
 function perlin2(x, y) {
 const X = Math.floor(x) & 255;
 const Y = Math.floor(y) & 255;
 const xf = x - Math.floor(x);
 const yf = y - Math.floor(y);
 const u = fade(xf);
 const v = fade(yf);
 const aa = perm[perm[X] + Y];
 const ab = perm[perm[X] + Y + 1];
 const ba = perm[perm[X + 1] + Y];
 const bb = perm[perm[X + 1] + Y + 1];
 const gaa = grads[aa];
 const gab = grads[ab];
 const gba = grads[ba];
 const gbb = grads[bb];
 const dotAA = gaa[0] * xf + gaa[1] * yf;
 const dotBA = gba[0] * (xf - 1) + gba[1] * yf;
 const dotAB = gab[0] * xf + gab[1] * (yf - 1);
 const dotBB = gbb[0] * (xf - 1) + gbb[1] * (yf - 1);
 return lerp(lerp(dotAA, dotBA, u), lerp(dotAB, dotBB, u), v);
 }
 function fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
 let sum = 0, amp = 1, freq = 1, maxAmp = 0;
 for (let i = 0; i < octaves; i++) {
 sum += perlin2(x * freq, y * freq) * amp;
 maxAmp += amp; amp *= gain; freq *= lacunarity;
 }
 return sum / maxAmp;
 }
 function curl(x, y, eps = 0.01) {
 const n1 = fbm(x, y + eps), n2 = fbm(x, y - eps);
 const n3 = fbm(x + eps, y), n4 = fbm(x - eps, y);
 return { x: (n1 - n2) / (2 * eps), y: (n4 - n3) / (2 * eps) };
 }
 return { perlin: perlin2, fbm, curl };
}
function hexToRgb(hex) {
 return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}
function rgba(hex, a) {
 const { r, g, b } = hexToRgb(hex);
 return `rgba(${r},${g},${b},${a})`;
}
const canvas = $('frostCanvas');
const ctx = canvas.getContext('2d');
let currentRng = null, noise = null;
function getParams() {
 return {
 width: parseInt($('canvasWidth').value) || 800,
 height: parseInt($('canvasHeight').value) || 600,
 direction: $('direction').value,
 baseColor: $('baseColor').value,
 highlightColor: $('highlightColor').value,
 bgColor: $('bgColor').value,
 transparentBg: $('transparentBg').checked,
 opacity: parseFloat($('opacity').value),
 rootCount: parseInt($('rootCount').value),
 branchProb: parseFloat($('branchProb').value),
 maxDepth: parseInt($('maxDepth').value),
 angleSpread: parseFloat($('angleSpread').value) * Math.PI / 180,
 segLength: parseFloat($('segLength').value),
 thickness: parseFloat($('thickness').value),
 noiseInfluence: parseFloat($('noiseInfluence').value),
 curlStrength: parseFloat($('curlStrength').value),
 enableIcicles: $('enableIcicles').checked,
 icicleDensity: parseFloat($('icicleDensity').value),
 icicleLength: parseFloat($('icicleLength').value),
 icicleTaper: parseFloat($('icicleTaper').value),
 icicleBlur: parseFloat($('icicleBlur').value),
 enableReflections: $('enableReflections').checked,
 specularStrength: parseFloat($('specularStrength').value),
 sparkleCount: parseInt($('sparkleCount').value),
 sparkleIntensity: parseFloat($('sparkleIntensity').value),
 glowStrength: parseFloat($('glowStrength').value),
 frostDensity: parseFloat($('frostDensity').value),
 noiseScale: parseFloat($('noiseScale').value),
 enableEdgeFrost: $('enableEdgeFrost').checked,
 seed: parseInt($('seed').value) || 0
 };
}
function updateValueDisplays() {
 $('opacityVal').textContent = $('opacity').value;
 $('rootCountVal').textContent = $('rootCount').value;
 $('branchProbVal').textContent = $('branchProb').value;
 $('maxDepthVal').textContent = $('maxDepth').value;
 $('angleSpreadVal').textContent = $('angleSpread').value + '°';
 $('segLengthVal').textContent = $('segLength').value;
 $('thicknessVal').textContent = $('thickness').value;
 $('noiseInfluenceVal').textContent = $('noiseInfluence').value;
 $('curlStrengthVal').textContent = $('curlStrength').value;
 $('icicleDensityVal').textContent = $('icicleDensity').value;
 $('icicleLengthVal').textContent = $('icicleLength').value;
 $('icicleTaperVal').textContent = $('icicleTaper').value;
 $('icicleBlurVal').textContent = $('icicleBlur').value;
 $('specularStrengthVal').textContent = $('specularStrength').value;
 $('sparkleCountVal').textContent = $('sparkleCount').value;
 $('sparkleIntensityVal').textContent = $('sparkleIntensity').value;
 $('glowStrengthVal').textContent = $('glowStrength').value;
 $('frostDensityVal').textContent = $('frostDensity').value;
 $('noiseScaleVal').textContent = $('noiseScale').value;
}
function syncColor(id, hexId) {
 const picker = $(id), hex = $(hexId);
 picker.addEventListener('input', () => { hex.value = picker.value; scheduleGenerate(); });
 hex.addEventListener('change', () => {
 if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) { picker.value = hex.value; scheduleGenerate(); }
 });
}
syncColor('baseColor', 'baseColorHex');
syncColor('highlightColor', 'highlightColorHex');
syncColor('bgColor', 'bgColorHex');
function drawBranch(ctx, x, y, angle, length, depth, params, rng) {
 if (depth <= 0 || length < 1.5) return;
 const ni = params.noiseInfluence, curlS = params.curlStrength, scale = params.noiseScale * 40;
 const n = noise.fbm(x * scale, y * scale, 4);
 const n2 = noise.fbm(x * scale * 1.7 + 100, y * scale * 1.7 + 50, 3);
 const curl = noise.curl(x * scale * 0.6, y * scale * 0.6);
 let growAngle = angle;
 if (curlS > 0) growAngle += (curl.x * 0.7 + curl.y * 0.3) * curlS * (0.4 + ni * 0.6);
 growAngle += n * 0.55 * ni;
 const segLen = length * Math.max(0.35, 1 + n2 * 0.45 * ni);
 const endX = x + Math.cos(growAngle) * segLen;
 const endY = y + Math.sin(growAngle) * segLen;
 const depthRatio = depth / params.maxDepth;
 const t = params.thickness * depthRatio * Math.max(0.25, 1 + n * 0.4 * ni);
 const alpha = params.opacity * (0.35 + 0.65 * depthRatio) * (0.75 + n * 0.25 * ni);
 if (params.glowStrength > 0) {
 ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY);
 ctx.strokeStyle = rgba(params.baseColor, params.glowStrength * 0.22 * alpha);
 ctx.lineWidth = t * 3.8; ctx.lineCap = 'round'; ctx.stroke();
 }
 ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY);
 ctx.strokeStyle = rgba(params.baseColor, Math.min(1, alpha));
 ctx.lineWidth = Math.max(0.3, t); ctx.lineCap = 'round'; ctx.stroke();
 const hx = Math.cos(growAngle + Math.PI / 2) * t * 0.15;
 const hy = Math.sin(growAngle + Math.PI / 2) * t * 0.15;
 ctx.beginPath(); ctx.moveTo(x + hx, y + hy); ctx.lineTo(endX + hx, endY + hy);
 ctx.strokeStyle = rgba(params.highlightColor, alpha * 0.55);
 ctx.lineWidth = Math.max(0.4, t * 0.32); ctx.stroke();
 if (params.enableReflections && params.specularStrength > 0) {
 const facing = Math.cos(growAngle + Math.PI * 0.75);
 const spec = Math.pow(Math.max(0, facing), 4) * params.specularStrength;
 if (spec > 0.05) {
 ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY);
 ctx.strokeStyle = rgba('#ffffff', Math.min(1, spec * alpha * 0.9));
 ctx.lineWidth = Math.max(0.35, t * 0.22); ctx.lineCap = 'round'; ctx.stroke();
 if (spec > 0.35 && rng.next() < 0.4) {
 ctx.beginPath(); ctx.arc((x + endX) * 0.5, (y + endY) * 0.5, 0.8 + spec * 1.5, 0, Math.PI * 2);
 ctx.fillStyle = rgba('#ffffff', Math.min(1, spec * 0.7)); ctx.fill();
 }
 }
 }
 if (rng.next() < params.branchProb * (0.7 + n * 0.3 * ni) && depth > 1) {
 const spread = params.angleSpread * (0.55 + rng.next() * 0.7 + Math.abs(n) * 0.25 * ni);
 const lenFactor = 0.5 + rng.next() * 0.38 + Math.abs(n2) * 0.12 * ni;
 drawBranch(ctx, endX, endY, growAngle - spread, length * lenFactor, depth - 1, params, rng);
 if (rng.next() < 0.72) drawBranch(ctx, endX, endY, growAngle + spread, length * lenFactor, depth - 1, params, rng);
 if (rng.next() < 0.28 + ni * 0.15) {
 drawBranch(ctx, endX, endY, growAngle + (rng.next() - 0.5) * spread * 0.7, length * lenFactor * 0.7, depth - 1, params, rng);
 }
 }
 if (depth > 1) {
 drawBranch(ctx, endX, endY, growAngle + n * 0.5 * ni + (rng.next() - 0.5) * 0.25, length * (0.68 + rng.next() * 0.28 + n2 * 0.1 * ni), depth - 1, params, rng);
 }
}
function drawIcicle(ctx, x, y, params, rng) {
 const len = params.icicleLength * (0.5 + rng.next() * 0.8);
 const baseW = params.thickness * (1.5 + rng.next() * 1.5);
 const tipY = y + len, blur = params.icicleBlur || 0;
 ctx.save();
 if (blur > 0) {
 ctx.shadowColor = rgba(params.baseColor, 0.45); ctx.shadowBlur = blur;
 ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
 }
 if (blur > 1.5) {
 ctx.beginPath();
 ctx.moveTo(x - baseW * 0.7, y); ctx.lineTo(x + baseW * 0.7, y);
 ctx.lineTo(x + baseW * 0.25 * (1 - params.icicleTaper), tipY);
 ctx.lineTo(x - baseW * 0.25 * (1 - params.icicleTaper), tipY);
 ctx.closePath();
 ctx.fillStyle = rgba(params.baseColor, params.opacity * 0.2); ctx.fill();
 }
 ctx.beginPath();
 ctx.moveTo(x - baseW / 2, y); ctx.lineTo(x + baseW / 2, y);
 ctx.lineTo(x + baseW * 0.15 * (1 - params.icicleTaper), tipY);
 ctx.lineTo(x - baseW * 0.15 * (1 - params.icicleTaper), tipY);
 ctx.closePath();
 const grad = ctx.createLinearGradient(x, y, x, tipY);
 grad.addColorStop(0, rgba(params.baseColor, params.opacity * 0.9));
 grad.addColorStop(0.6, rgba(params.baseColor, params.opacity * 0.55));
 grad.addColorStop(1, rgba(params.highlightColor, params.opacity * 0.25));
 ctx.fillStyle = grad; ctx.fill(); ctx.shadowBlur = 0;
 ctx.beginPath(); ctx.moveTo(x - baseW * 0.15, y); ctx.lineTo(x, tipY);
 ctx.strokeStyle = rgba(params.highlightColor, params.opacity * 0.6); ctx.lineWidth = 1; ctx.stroke();
 if (params.enableReflections && params.specularStrength > 0) {
 const spec = params.specularStrength * (0.5 + rng.next() * 0.5);
 ctx.beginPath();
 ctx.moveTo(x - baseW * 0.12 + rng.range(-0.5, 0.5), y + len * 0.08);
 ctx.lineTo(x + (rng.next() - 0.5) * 1.5, tipY - len * 0.05);
 ctx.strokeStyle = rgba('#ffffff', Math.min(1, spec * params.opacity * 0.75));
 ctx.lineWidth = Math.max(0.6, baseW * 0.12); ctx.lineCap = 'round'; ctx.stroke();
 if (spec > 0.4) {
 ctx.beginPath(); ctx.arc(x, tipY - 1, 1.2 + spec * 1.2, 0, Math.PI * 2);
 ctx.fillStyle = rgba('#ffffff', Math.min(1, spec * 0.85)); ctx.fill();
 }
 }
 if (params.glowStrength > 0) {
 ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, tipY);
 ctx.strokeStyle = rgba(params.highlightColor, params.glowStrength * 0.3);
 ctx.lineWidth = baseW * 0.4; ctx.stroke();
 }
 ctx.restore();
}
