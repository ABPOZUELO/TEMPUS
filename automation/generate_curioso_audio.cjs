const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  const rootDir = path.resolve(__dirname, '..');
  const msedgePath = path.join(rootDir, 'tempus-video', 'node_modules', 'msedge-tts');
  const { MsEdgeTTS, OUTPUT_FORMAT } = require(msedgePath);

  const voice = "es-ES-AlvaroNeural";
  const scriptPath = path.join(rootDir, 'tempus-hyperframes', 'assets', 'audio', 'curioso_script.json');
  const scenes = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

  const outputDir = path.join(rootDir, 'tempus-hyperframes', 'assets', 'audio');
  const timings = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const filename = `${scene.id}.mp3`;
    const destFile = path.join(outputDir, filename);
    console.log(`[TTS] Generating ${filename} with pitch +4Hz, rate +4%...`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const tempDir = path.join(outputDir, `temp_curioso_${i}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    await tts.toFile(tempDir, scene.text, { rate: '+4%', pitch: '+4Hz' });
    const srcFile = path.join(tempDir, 'audio.mp3');

    fs.copyFileSync(srcFile, destFile);
    fs.unlinkSync(srcFile);
    try { fs.rmdirSync(tempDir); } catch (_) {}

    const exactDuration = getExactDurationWithFfprobe(destFile);
    console.log(`[+] ${filename} generated. Duration: ${exactDuration.toFixed(3)}s`);
    timings.push({
      id: scene.id,
      text: scene.text,
      file: filename,
      duration: exactDuration
    });
  }

  const timingsPath = path.join(outputDir, 'curioso_timings.json');
  fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 2));
  console.log('✅ All curious facts audio generated and saved to', timingsPath);
}

main().catch(err => {
  console.error('[!] Error generating audio:', err);
  process.exit(1);
});
