const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '..', 'tempus-hyperframes', 'assets', 'audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const SAMPLE_RATE = 44100;

function writeWav(filename, samplesFloat) {
  const numSamples = samplesFloat.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM
  buffer.writeUInt16LE(1, 20);  // Linear PCM
  buffer.writeUInt16LE(1, 22);  // Mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samplesFloat[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  const outPath = path.join(audioDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${filename} (${(numSamples / SAMPLE_RATE).toFixed(2)}s)`);
}

// Seeded PRNG for deterministic noise
let seed = 192301;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return (seed / 4294967296) * 2 - 1;
}

// 1. Cinematic Whoosh / Morph Transition (0.65s)
{
  const dur = 0.65;
  const N = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(N);
  let lp = 0, bp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.sin(Math.PI * Math.pow(t / dur, 0.85)) ** 1.6;
    const cutoff = 0.03 + 0.22 * Math.sin(Math.PI * (t / dur));
    const n = rand();
    lp += cutoff * (n - lp);
    bp += cutoff * (lp - bp);
    const sub = Math.sin(2 * Math.PI * (90 + 180 * (t / dur)) * t) * 0.35;
    out[i] = (bp * 1.4 + sub) * env * 0.7;
  }
  writeWav('sfx_whoosh.wav', out);
}

// 2. Heavy Stamp Slam (0.55s) - for "200.000 MILLONES!"
{
  const dur = 0.55;
  const N = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const envBody = Math.exp(-t * 14);
    const envClick = Math.exp(-t * 95);
    const freq = 55 + 130 * Math.exp(-t * 35);
    const thud = Math.sin(2 * Math.PI * freq * t) * envBody;
    lp += 0.25 * (rand() - lp);
    const impact = lp * envClick * 0.9;
    out[i] = Math.tanh((thud * 1.3 + impact) * 1.2) * 0.8;
  }
  writeWav('sfx_stamp.wav', out);
}

// 3. Tactile Pop / Brick Stack (0.22s) - for 2D bricks stacking
{
  const dur = 0.22;
  const N = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 32);
    const f = 320 + 420 * (1 - Math.exp(-t * 55));
    out[i] = Math.sin(2 * Math.PI * f * t) * env * 0.65;
  }
  writeWav('sfx_pop.wav', out);
}

// 4. Warm Fire Ignition & Crackle (1.4s) - for Scene 3 stove
{
  const dur = 1.4;
  const N = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const flare = t < 0.25 ? (t / 0.25) : Math.exp(-(t - 0.25) * 2.2);
    const n = rand();
    lp += 0.08 * (n - lp);
    const crackle = Math.abs(n) > 0.985 ? n * 0.9 : 0;
    out[i] = (lp * 0.85 * flare + crackle * Math.exp(-t * 1.2)) * 0.65;
  }
  writeWav('sfx_fire.wav', out);
}

// 5. Golden Chime / Wealth Shield Reveal (1.2s) - for Scene 5 Tempus reveal
{
  const dur = 1.2;
  const N = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(N);
  const freqs = [523.25, 659.25, 783.99, 1046.5, 1567.98]; // C major 9th shimmer
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.015);
    let sum = 0;
    for (let k = 0; k < freqs.length; k++) {
      const env = Math.exp(-t * (2.6 + k * 0.55));
      sum += Math.sin(2 * Math.PI * freqs[k] * t) * env * (0.28 / (1 + k * 0.2));
    }
    out[i] = sum * attack * 0.85;
  }
  writeWav('sfx_chime.wav', out);
}
