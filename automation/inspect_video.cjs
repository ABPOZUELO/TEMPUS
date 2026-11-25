const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpeg = path.resolve(__dirname, '../tempus-video/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const video = 'C:/Users/jorge/.gemini/antigravity/brain/60258e72-4be7-45ea-8351-e01422a97ed2/.user_uploaded/media_1795596124710_60e55675.mp4';
const outDir = 'C:/Users/jorge/.gemini/antigravity/brain/60258e72-4be7-45ea-8351-e01422a97ed2/scratch';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Probe info
const probe = spawnSync(ffmpeg, ['-i', video], { encoding: 'utf8' });
const fullText = (probe.stderr || '') + (probe.stdout || '');
console.log('--- PROBE INFO ---');
fullText.split('\n').filter(l => l.includes('Duration:') || l.includes('Video:') || l.includes('Audio:') || l.includes('Stream')).forEach(l => console.log(l));

// 2. Extract 5 frames across the video to see visual style
// E.g. at 2s, 6s, 12s, 18s, 25s
const timestamps = [2, 6, 12, 18, 25];
timestamps.forEach((sec, idx) => {
  const outFile = path.join(outDir, `frame_${idx + 1}.jpg`);
  spawnSync(ffmpeg, ['-ss', sec.toString(), '-i', video, '-vframes', '1', '-q:v', '2', '-y', outFile]);
  if (fs.existsSync(outFile)) {
    console.log(`Extracted frame ${idx + 1} at ${sec}s: ${outFile} (${fs.statSync(outFile).size} bytes)`);
  }
});

// 3. Extract audio to scratch for transcription or inspection
const audioOut = path.join(outDir, 'example_audio.wav');
spawnSync(ffmpeg, ['-i', video, '-vn', '-ar', '16000', '-ac', '1', '-y', audioOut]);
if (fs.existsSync(audioOut)) {
  console.log(`Extracted audio to ${audioOut} (${fs.statSync(audioOut).size} bytes)`);
}
