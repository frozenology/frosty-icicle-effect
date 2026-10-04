/**
 * Noise utilities for Frosty Icicle Generator
 * Modes: perlin | value | ridged | turbulence | simplex
 */
function createNoise(rng, mode = 'perlin') {
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

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);

  function perlin2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    const gaa = grads[aa], gab = grads[ab], gba = grads[ba], gbb = grads[bb];
    const dotAA = gaa[0] * xf + gaa[1] * yf;
    const dotBA = gba[0] * (xf - 1) + gba[1] * yf;
    const dotAB = gab[0] * xf + gab[1] * (yf - 1);
    const dotBB = gbb[0] * (xf - 1) + gbb[1] * (yf - 1);
    return lerp(lerp(dotAA, dotBA, u), lerp(dotAB, dotBB, u), v);
  }

  function value2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const n00 = perm[perm[X] + Y] / 255 * 2 - 1;
    const n10 = perm[perm[X + 1] + Y] / 255 * 2 - 1;
    const n01 = perm[perm[X] + Y + 1] / 255 * 2 - 1;
    const n11 = perm[perm[X + 1] + Y + 1] / 255 * 2 - 1;
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
  }

  function simplex2(x, y) {
    const F2 = 0.366025403, G2 = 0.211324865;
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const contrib = (gx, gy, dx, dy) => {
      const t0 = 0.5 - dx * dx - dy * dy;
      if (t0 < 0) return 0;
      const tt = t0 * t0;
      return tt * tt * (gx * dx + gy * dy);
    };
    const g0 = grads[perm[ii + perm[jj]]];
    const g1 = grads[perm[ii + i1 + perm[jj + j1]]];
    const g2 = grads[perm[ii + 1 + perm[jj + 1]]];
    return 70 * (contrib(g0[0], g0[1], x0, y0) + contrib(g1[0], g1[1], x1, y1) + contrib(g2[0], g2[1], x2, y2));
  }

  const base = { perlin: perlin2, value: value2, simplex: simplex2 }[mode] || perlin2;

  function fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let sum = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      sum += base(x * freq, y * freq) * amp;
      maxAmp += amp; amp *= gain; freq *= lacunarity;
    }
    return sum / maxAmp;
  }

  function ridged(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let sum = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(base(x * freq, y * freq));
      sum += n * n * amp;
      maxAmp += amp; amp *= gain; freq *= lacunarity;
    }
    return sum / maxAmp * 2 - 1;
  }

  function turbulence(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let sum = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      sum += Math.abs(base(x * freq, y * freq)) * amp;
      maxAmp += amp; amp *= gain; freq *= lacunarity;
    }
    return sum / maxAmp * 2 - 1;
  }

  const sample = mode === 'ridged' ? ridged : mode === 'turbulence' ? turbulence : fbm;

  function curl(x, y, eps = 0.01) {
    const n1 = sample(x, y + eps), n2 = sample(x, y - eps);
    const n3 = sample(x + eps, y), n4 = sample(x - eps, y);
    return { x: (n1 - n2) / (2 * eps), y: (n4 - n3) / (2 * eps) };
  }

  return { mode, perlin: perlin2, value: value2, simplex: simplex2, fbm: sample, ridged, turbulence, curl };
}
