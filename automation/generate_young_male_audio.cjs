const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('../tempus-video/node_modules/msedge-tts');

const scripts = [
  {
    num: 1,
    text: "Si metes todo tu dinero a una sola empresa, estás jugando a la ruleta rusa con tus ahorros."
  },
  {
    num: 2,
    text: "John Bogle lo dejó muy claro: ¡no busques la aguja en el pajar! Compra el pajar entero."
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

function getExactDurationWithFfprobe(filePath) {
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' });
    const dur = parseFloat(out.trim());
    if (!isNaN(dur)) return dur;
  } catch (err) {
    console.warn('ffprobe error:', err.message);
  }
  return 4.0;
}

async function main() {
  const targetDir = path.join(__dirname, '..', 'tempus-hyperframes', 'assets', 'audio');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  // Voz de hombre joven con tono más agudo (+4Hz) y ritmo alegre y ágil (+4%)
  const voice = "es-ES-AlvaroNeural";
  const results = [];

  for (const s of scripts) {
    console.log(`[+] Generando audio Escena ${s.num} con tono más agudo: "${s.text.slice(0, 35)}..."`);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const tempDir = path.join(targetDir, `temp_male_high_${s.num}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Tono más agudo (+4Hz) para que suene más fresco, joven y brillante, con cadencia dinámica
    await tts.toFile(tempDir, s.text, { rate: '+4%', pitch: '+4Hz' });
    const srcFile = path.join(tempDir, 'audio.mp3');
    const destFile = path.join(targetDir, `slide${s.num}.mp3`);

    fs.copyFileSync(srcFile, destFile);
    fs.unlinkSync(srcFile);
    try { fs.rmdirSync(tempDir); } catch (_) {}

    const exactDuration = getExactDurationWithFfprobe(destFile);
    console.log(`   -> Escena ${s.num}: duración = ${exactDuration.toFixed(3)}s`);
    results.push({
      num: s.num,
      text: s.text,
      durationSec: exactDuration,
      file: `slide${s.num}.mp3`
    });
  }

  const metaPath = path.join(targetDir, 'scene_timings_male_higher.json');
  fs.writeFileSync(metaPath, JSON.stringify(results, null, 2));
  console.log('✅ Audios con tono más agudo generados con éxito.');
}

main().catch(console.error);
