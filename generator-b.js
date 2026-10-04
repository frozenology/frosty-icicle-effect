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
 noise = createNoise(currentRng);
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
 drawBranch(ctx, p.x, p.y, p.angle, params.segLength * (0.8 + currentRng.next() * 0.5), params.maxDepth, params, currentRng);
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
 '#rootCount,#branchProb,#maxDepth,#angleSpread,#segLength,#thickness,' +
 '#noiseInfluence,#curlStrength,#enableIcicles,#icicleDensity,#icicleLength,#icicleTaper,#icicleBlur,' +
 '#enableReflections,#specularStrength,#sparkleCount,#sparkleIntensity,#glowStrength,' +
 '#frostDensity,#noiseScale,#enableEdgeFrost,#seed,#canvasWidth,#canvasHeight'
).forEach(el => {
 el.addEventListener('input', scheduleGenerate);
 el.addEventListener('change', scheduleGenerate);
});
updateValueDisplays();
generate();
