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
 branchLength: parseFloat($('branchLength') ? $('branchLength').value : 1),
 thickness: parseFloat($('thickness').value),
 noiseInfluence: parseFloat($('noiseInfluence').value),
 noiseMode: $('noiseMode') ? $('noiseMode').value : 'perlin',
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
 if ($('branchLengthVal')) $('branchLengthVal').textContent = $('branchLength').value;
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
function drawSparkles(ctx, params, rng) {
 if (!params.enableReflections || params.sparkleCount <= 0) return;
 for (let i = 0; i < params.sparkleCount; i++) {
 const x = rng.range(0, params.width), y = rng.range(0, params.height);
 const size = rng.range(0.5, 2.5) * params.sparkleIntensity;
 const alpha = rng.range(0.3, 1) * params.sparkleIntensity * params.opacity;
 ctx.strokeStyle = rgba(params.highlightColor, alpha); ctx.lineWidth = 0.8;
 ctx.beginPath(); ctx.moveTo(x - size * 2, y); ctx.lineTo(x + size * 2, y);
 ctx.moveTo(x, y - size * 2); ctx.lineTo(x, y + size * 2); ctx.stroke();
 ctx.beginPath(); ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
 ctx.fillStyle = rgba('#ffffff', alpha * 0.8); ctx.fill();
 }
}
function getStartPoints(params, rng) {
 const points = [], w = params.width, h = params.height, count = params.rootCount;
 switch (params.direction) {
 case 'top-to-bottom':
 for (let i = 0; i < count; i++) points.push({ x: rng.range(0, w), y: rng.range(-10, 30), angle: Math.PI / 2 + (rng.next() - 0.5) * 0.6 });
 break;
 case 'bottom-to-top':
 for (let i = 0; i < count; i++) points.push({ x: rng.range(0, w), y: h - rng.range(-10, 30), angle: -Math.PI / 2 + (rng.next() - 0.5) * 0.6 });
 break;
 case 'left-to-right':
 for (let i = 0; i < count; i++) points.push({ x: rng.range(-10, 30), y: rng.range(0, h), angle: (rng.next() - 0.5) * 0.6 });
 break;
 case 'right-to-left':
 for (let i = 0; i < count; i++) points.push({ x: w - rng.range(-10, 30), y: rng.range(0, h), angle: Math.PI + (rng.next() - 0.5) * 0.6 });
 break;
 case 'border-to-center': {
 const cx = w / 2, cy = h / 2;
 for (let i = 0; i < count; i++) {
 const side = rng.int(0, 3);
 let x, y;
 if (side === 0) { x = rng.range(0, w); y = 0; }
 else if (side === 1) { x = rng.range(0, w); y = h; }
 else if (side === 2) { x = 0; y = rng.range(0, h); }
 else { x = w; y = rng.range(0, h); }
 points.push({ x, y, angle: Math.atan2(cy - y, cx - x) });
 }
 break;
 }
 case 'center-to-border': {
 const cx = w / 2, cy = h / 2;
 for (let i = 0; i < count; i++) {
 const angle = (i / count) * Math.PI * 2 + rng.range(-0.2, 0.2);
 points.push({ x: cx + Math.cos(angle) * 10, y: cy + Math.sin(angle) * 10, angle });
 }
 break;
 }
 case 'radial-out': {
 const cx = w / 2, cy = h / 2;
 for (let i = 0; i < count; i++) {
 const angle = (i / count) * Math.PI * 2 + rng.range(-0.15, 0.15);
 points.push({ x: cx, y: cy, angle });
 }
 break;
 }
 case 'radial-in': {
 const cx = w / 2, cy = h / 2;
 for (let i = 0; i < count; i++) {
 const angle = (i / count) * Math.PI * 2;
 const dist = Math.min(w, h) * 0.48;
 points.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, angle: angle + Math.PI });
 }
 break;
 }
 default:
 for (let i = 0; i < count; i++) points.push({ x: rng.range(0, w), y: rng.range(0, h), angle: rng.range(0, Math.PI * 2) });
 }
 return points;
}
let isGenerating = false;
function setLoading(on) {
 const overlay = $('loadingOverlay'), btn = $('btnRegenerate');
 if (on) { overlay.classList.add('active'); btn.disabled = true; isGenerating = true; }
 else { overlay.classList.remove('active'); btn.disabled = false; isGenerating = false; }
}
function generate() {
 if (isGenerating) return;
 setLoading(true);
 const status = $('statusBar');
 status.textContent = 'Generating...';
 setTimeout(() => {
 try {
 const params = getParams();
 canvas.width = params.width; canvas.height = params.height;
 const seed = params.seed || Math.floor(Math.random() * 1e9);
 if (!params.seed) $('seed').value = seed;
 currentRng = new SeededRandom(seed);
 noise = createNoise(currentRng, params.noiseMode || 'perlin');
 if (params.transparentBg) ctx.clearRect(0, 0, params.width, params.height);
 else { ctx.fillStyle = params.bgColor; ctx.fillRect(0, 0, params.width, params.height); }
 if (params.enableEdgeFrost && params.frostDensity > 0) {
 ctx.save();
 const dens = params.frostDensity, particleCount = Math.floor(1800 * dens);
 for (let i = 0; i < particleCount; i++) {
 const x = currentRng.range(0, params.width), y = currentRng.range(0, params.height);
 const n = noise.fbm(x * params.noiseScale, y * params.noiseScale, 5);
 const n01 = (n + 1) * 0.5;
 if (n01 > 0.42) {
 const s = currentRng.range(0.6, 2.8) * (0.7 + n01 * 0.5);
 ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2);
 ctx.fillStyle = rgba(params.baseColor, (n01 - 0.42) * 0.35 * params.opacity * dens); ctx.fill();
 }
 }
 for (let i = 0; i < particleCount * 0.6; i++) {
 const x = currentRng.range(0, params.width), y = currentRng.range(0, params.height);
 const n = noise.fbm(x * params.noiseScale * 3.2 + 40, y * params.noiseScale * 3.2, 3);
 if (n > 0.25) {
 ctx.beginPath(); ctx.arc(x, y, currentRng.range(0.3, 1.4), 0, Math.PI * 2);
 ctx.fillStyle = rgba(params.highlightColor, (n - 0.25) * 0.22 * params.opacity * dens); ctx.fill();
 }
 }
 ctx.restore();
 }
 for (const p of getStartPoints(params, currentRng)) {
 drawBranch(ctx, p.x, p.y, p.angle, params.segLength * (params.branchLength || 1) * (0.8 + currentRng.next() * 0.5), params.maxDepth, params, currentRng);
 }
 if (params.enableIcicles) {
 const icicleCount = Math.floor(params.rootCount * 3 * params.icicleDensity);
 for (let i = 0; i < icicleCount; i++) {
 let ix, iy;
 if (params.direction === 'top-to-bottom' || params.direction === 'border-to-center' || params.direction === 'radial-out') {
 ix = currentRng.range(0, params.width); iy = currentRng.range(0, params.height * 0.45);
 } else if (params.direction === 'bottom-to-top') {
 ix = currentRng.range(0, params.width); iy = currentRng.range(params.height * 0.55, params.height);
 } else {
 ix = currentRng.range(0, params.width); iy = currentRng.range(0, params.height * 0.6);
 }
 if (currentRng.next() < params.icicleDensity) drawIcicle(ctx, ix, iy, params, currentRng);
 }
 }
 if (params.frostDensity > 0) {
 const count = Math.floor(1000 * params.frostDensity);
 for (let i = 0; i < count; i++) {
 const x = currentRng.range(0, params.width), y = currentRng.range(0, params.height);
 const n = noise.fbm(x * params.noiseScale * 3.5, y * params.noiseScale * 3.5, 4);
 const n01 = (n + 1) * 0.5;
 if (n01 > 0.55) {
 ctx.beginPath(); ctx.arc(x, y, currentRng.range(0.35, 1.9) * n01, 0, Math.PI * 2);
 ctx.fillStyle = rgba(params.highlightColor, (n01 - 0.55) * 0.55 * params.opacity); ctx.fill();
 }
 }
 }
 drawSparkles(ctx, params, currentRng);
 if (params.glowStrength > 0.1) {
 const grd = ctx.createRadialGradient(params.width / 2, params.height / 2, 0, params.width / 2, params.height / 2, Math.max(params.width, params.height) * 0.7);
 grd.addColorStop(0, 'rgba(0,0,0,0)');
 grd.addColorStop(1, `rgba(10,20,40,${params.glowStrength * 0.25})`);
 ctx.fillStyle = grd; ctx.fillRect(0, 0, params.width, params.height);
 }
 status.textContent = `${params.width}×${params.height} · seed ${seed}`;
 } catch (err) {
 console.error(err); status.textContent = 'Error during generation';
 } finally { setLoading(false); }
 }, 30);
}
let genTimeout = null;
function scheduleGenerate() {
 updateValueDisplays();
 if (!$('autoRegen').checked) return;
 clearTimeout(genTimeout);
 genTimeout = setTimeout(generate, 100);
}
$('btnRegenerate').addEventListener('click', () => { $('seed').value = 0; clearTimeout(genTimeout); generate(); });
$('btnRandomSeed').addEventListener('click', () => { $('seed').value = Math.floor(Math.random() * 1e9); clearTimeout(genTimeout); generate(); });
$('btnSave').addEventListener('click', () => {
 const link = document.createElement('a');
 link.download = `frosty-icicle-${Date.now()}.png`;
 link.href = canvas.toDataURL('image/png');
 link.click();
});
document.querySelectorAll(
 '#direction,#baseColor,#highlightColor,#bgColor,#transparentBg,#opacity,' +
 '#rootCount,#branchProb,#maxDepth,#angleSpread,#segLength,#branchLength,#thickness,' +
 '#noiseInfluence,#curlStrength,#enableIcicles,#icicleDensity,#icicleLength,#icicleTaper,#icicleBlur,' +
 '#enableReflections,#specularStrength,#sparkleCount,#sparkleIntensity,#glowStrength,' +
 '#frostDensity,#noiseScale,#noiseMode,#enableEdgeFrost,#seed,#canvasWidth,#canvasHeight'
).forEach(el => {
 el.addEventListener('input', scheduleGenerate);
 el.addEventListener('change', scheduleGenerate);
});
updateValueDisplays();
generate();
