const { MsEdgeTTS, OUTPUT_FORMAT } = require('../tempus-video/node_modules/msedge-tts');
const path = require('path');
const fs = require('fs');

/**
 * Parses exact duration in seconds from an MP3 buffer without native binaries.
 * Handles MPEG-1 / MPEG-2 Layer III frames.
 */
function getMp3DurationInSeconds(buffer) {
  const bitrateTableMPEG2Layer3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
  const sampleRateTableMPEG2 = [22050, 24000, 16000, 0];
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

      let bitrate = 0;
      let sampleRate = 0;
      let samplesPerFrame = 1152;

      if (mpegVersionId === 3) {
        bitrate = bitrateTableMPEG1Layer3[bitrateIdx] * 1000;
        sampleRate = sampleRateTableMPEG1[sampleRateIdx];
        samplesPerFrame = 1152;
      } else if (mpegVersionId === 2 || mpegVersionId === 0) {
        bitrate = bitrateTableMPEG2Layer3[bitrateIdx] * 1000;
        sampleRate = sampleRateTableMPEG2[sampleRateIdx];
        samplesPerFrame = 576;
      } else {
        offset++;
        continue;
      }

      if (!sampleRate || !bitrate) {
        offset++;
        continue;
      }

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

  if (totalDuration === 0 && buffer.length > 0) {
    totalDuration = (buffer.length * 8) / 48000;
  }

  return totalDuration;
}

async function generateSlideAudio(slideNum, text, targetDir, voice = "es-ES-AlvaroNeural") {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const tts = new MsEdgeTTS();
      // Alta calidad a 96 kbps para eliminar artefactos metálicos
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      
      const tempDir = path.join(targetDir, `temp_slide_${slideNum}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Prosodia ajustada: ritmo más dinámico (+6%) y natural para sonar conversacional y menos robótico
      await tts.toFile(tempDir, text, { rate: '+6%', pitch: '+0Hz' });
      const srcFile = path.join(tempDir, 'audio.mp3');
      const destFile = path.join(targetDir, `slide${slideNum}.mp3`);
      
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        fs.unlinkSync(srcFile);
        try { fs.rmdirSync(tempDir); } catch (_) {}
        
        const buf = fs.readFileSync(destFile);
        const durationSec = getMp3DurationInSeconds(buf);
        // Buffer of ~18 frames (0.6s) ensures smooth transition without cutting off the end of words
        const frames = Math.max(120, Math.ceil(durationSec * 30) + 18);
        console.log(`[✔] Slide ${slideNum} generado: ${destFile} (${durationSec.toFixed(2)}s -> ${frames} frames)`);
        return { durationSec, frames };
      }
    } catch (err) {
      attempts++;
      console.warn(`[!] Intento ${attempts}/3 fallido para slide ${slideNum}: ${err.message}`);
      if (attempts >= 3) {
        // Fallback to existing file if already exists
        const destFile = path.join(targetDir, `slide${slideNum}.mp3`);
        if (fs.existsSync(destFile)) {
          const buf = fs.readFileSync(destFile);
          const durationSec = getMp3DurationInSeconds(buf);
          const frames = Math.max(120, Math.ceil(durationSec * 30) + 18);
          return { durationSec, frames };
        }
        return { durationSec: 5.0, frames: 168 };
      }
      await new Promise(r => setTimeout(r, 1200));
    }
  }
  return { durationSec: 5.0, frames: 168 };
}

async function generateAllVoiceovers(scripts, targetDir, voice = "es-ES-AlvaroNeural") {
  console.log(`[+] Generando locución por slide con voz española neuronal de alta definición (${voice})...`);
  const durations = [];
  const slideDurations = [];

  for (let i = 0; i < scripts.length; i++) {
    const slideNum = i + 1;
    const text = scripts[i];
    console.log(`  -> Slide ${slideNum}: "${text}"`);
    const { durationSec, frames } = await generateSlideAudio(slideNum, text, targetDir, voice);
    durations.push(durationSec);
    slideDurations.push(frames);
  }

  console.log(`[✔] Locuciones generadas. Duraciones de frames calculadas: [${slideDurations.join(', ')}]`);
  return { durations, slideDurations };
}

module.exports = { generateAllVoiceovers, generateSlideAudio, getMp3DurationInSeconds };

if (require.main === module) {
  const publicDir = path.join(__dirname, '..', 'tempus-video', 'public');
  const defaultScripts = [
    "¿Sabes cómo funciona realmente el interés compuesto?",
    "Es el efecto bola de nieve que multiplica tu dinero de forma exponencial con el paso de los años.",
    "Aportando solo cien euros al mes con un ocho por ciento anual, puedes superar los cincuenta y ocho mil euros.",
    "El noventa por ciento del crecimiento final se produce en la última etapa gracias a los intereses reinvertidos.",
    "Visualiza tus propias proyecciones en tiempo real en Tempus. Pruébalo gratis en el link de la bio."
  ];
  generateAllVoiceovers(defaultScripts, publicDir)
    .then((res) => console.log('Resultado:', res))
    .catch(err => console.error('Error generando voces:', err));
}
