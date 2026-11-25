const path = require('path');
const fs = require('fs');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('../tempus-video/node_modules/msedge-tts');

const scripts = [
  {
    num: 1,
    text: "Si inviertes todo tu dinero en una sola empresa, estás jugando a la ruleta rusa con tus ahorros."
  },
  {
    num: 2,
    text: "John Bogle lo dejó muy claro: no busques la aguja en el pajar. ¡Compra el pajar entero!"
  },
  {
    num: 3,
    text: "Un Fondo Indexado reúne las 500 mayores empresas del planeta. Si una quiebra, las otras 499 tiran de ti hacia arriba."
  },
  {
    num: 4,
    text: "Con solo 100 euros al mes, el crecimiento de esas 500 empresas convierte 24.000 euros en más de 75.000 euros sin mirar las noticias."
  },
  {
    num: 5,
    text: "Deja de apostar tu futuro: invierte con estrategia. Diseña y simula tu cartera indexada hoy mismo en Tempus."
  }
];

function getMp3DurationInSeconds(buffer) {
  const bitrateTableMPEG1Layer3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  const sampleRateTableMPEG1 = [44100, 48000, 32000, 0];
  let offset = 0;
  if (buffer.subarray(0, 3).toString() === 'ID3') {
    const size = ((buffer[6] & 0x7f) << 21) |
                 ((buffer[7] & 0x7f) << 14) |
                 ((buffer[8] & 0x7f) << 7) |
                 (buffer[9] & 0x7f);
    offset = 10 + size;
  }
  let totalDuration = 0;
  while (offset < buffer.length - 4) {
    if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
      const b1 = buffer[offset + 1];
      const b2 = buffer[offset + 2];
      const mpegVersionId = (b1 >> 3) & 0x03;
      const layerId = (b1 >> 1) & 0x03;
      const bitrateIdx = (b2 >> 4) & 0x0F;
      const sampleRateIdx = (b2 >> 2) & 0x03;
      const padding = (b2 >> 1) & 0x01;
      if (bitrateIdx === 0 || bitrateIdx === 15 || sampleRateIdx === 3 || layerId !== 1) {
        offset++;
        continue;
      }
      let bitrate = bitrateTableMPEG1Layer3[bitrateIdx] * 1000;
      let sampleRate = sampleRateTableMPEG1[sampleRateIdx];
      let samplesPerFrame = 1152;
      const frameLength = Math.floor((samplesPerFrame * bitrate) / (8 * sampleRate)) + padding;
      if (frameLength <= 0 || offset + frameLength > buffer.length + 10) {
        offset++;
        continue;
      }
      totalDuration += samplesPerFrame / sampleRate;
      offset += frameLength;
    } else {
      offset++;
    }
  }
  return totalDuration || (buffer.length * 8) / 96000;
}

async function main() {
  const targetDir = path.join(__dirname, '..', 'tempus-hyperframes', 'assets', 'audio');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const voice = "es-ES-ElviraNeural";
  const results = [];

  for (const s of scripts) {
    console.log(`[+] Generando audio Escena ${s.num}: "${s.text.slice(0, 40)}..."`);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const tempDir = path.join(targetDir, `temp_${s.num}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Tono conversacional, ritmo dinámico de creador (+5%)
    await tts.toFile(tempDir, s.text, { rate: '+5%', pitch: '+0Hz' });
    const srcFile = path.join(tempDir, 'audio.mp3');
    const destFile = path.join(targetDir, `slide${s.num}.mp3`);

    fs.copyFileSync(srcFile, destFile);
    fs.unlinkSync(srcFile);
    try { fs.rmdirSync(tempDir); } catch (_) {}

    const buf = fs.readFileSync(destFile);
    const durationSec = getMp3DurationInSeconds(buf);
    console.log(`   -> Escena ${s.num}: ${durationSec.toFixed(2)}s`);
    results.push({
      num: s.num,
      text: s.text,
      durationSec,
      file: `slide${s.num}.mp3`
    });
  }

  const metaPath = path.join(targetDir, 'scene_timings.json');
  fs.writeFileSync(metaPath, JSON.stringify(results, null, 2));
  console.log('✅ Todos los audios generados con éxito.');
}

main().catch(console.error);
