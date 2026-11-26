const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgDir = path.join(__dirname, '..', 'tempus-hyperframes', 'assets', 'images');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TempusDocumentaryBot/1.0 (contact@tempus.es)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'TempusDocumentaryBot/1.0 (contact@tempus.es)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    get(url);
  });
}

async function main() {
  // Query Category:Hyperinflation_in_the_Weimar_Republic on Wikimedia Commons
  const catUrl = 'https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Hyperinflation_in_the_Weimar_Republic&gcmtype=file&gcmlimit=50&prop=imageinfo&iiprop=url|size&format=json';
  const res = await fetchJson(catUrl);
  const pages = Object.values((res.query && res.query.pages) || {});
  console.log(`Found ${pages.length} archival files in Wikimedia category:`);
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (ii) {
      console.log(` - ${p.title} (${ii.width}x${ii.height}) -> ${ii.url}`);
    }
  }

  // Also search specifically for children playing with banknotes in 1923
  const searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap+inflation+1923+children+OR+Kinder+OR+Spielzeug+OR+Geldscheinen&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url|size&format=json';
  const sres = await fetchJson(searchUrl);
  const spages = Object.values((sres.query && sres.query.pages) || {});
  console.log(`\nSearch results (${spages.length}):`);
  for (const p of spages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (ii) {
      console.log(` * ${p.title} (${ii.width}x${ii.height}) -> ${ii.url}`);
    }
  }

  const all = [...pages, ...spages];

  const pickAndSave = async (keywords, outName) => {
    const matches = all.filter(p => {
      const t = p.title.toLowerCase();
      return keywords.some(k => t.includes(k.toLowerCase())) && p.imageinfo && p.imageinfo[0];
    });
    matches.sort((a, b) => (b.imageinfo[0].width * b.imageinfo[0].height) - (a.imageinfo[0].width * a.imageinfo[0].height));
    if (matches.length > 0) {
      const best = matches[0];
      const ii = best.imageinfo[0];
      const rawDest = path.join(imgDir, 'raw_' + outName);
      console.log(`\nDownloading best match for ${outName}: ${best.title} (${ii.width}x${ii.height})`);
      await downloadFile(ii.url, rawDest);
      const finalDest = path.join(imgDir, outName);
      // Enhance & upscale cleanly to min 1200px wide with lanczos + subtle contrast adaptive sharpening
      execSync(`ffmpeg -y -i "${rawDest}" -vf "scale='max(1280,iw)':-2:flags=lanczos,unsharp=5:5:0.7:5:5:0.0" -q:v 2 "${finalDest}"`, { stdio: 'ignore' });
      fs.unlinkSync(rawDest);
      console.log(`Saved crisp HD ${outName}`);
      return true;
    }
    return false;
  };

  await pickAndSave(['kinder', 'children', 'spiel', 'blocks', 'klötze', 'baukasten', '102-00'], 'kids_playing_hd.jpg');
  await pickAndSave(['tapezieren', '102-00104', 'wallpaper'], 'wallpaper_money_hd.jpg');
  await pickAndSave(['183-r1215-506', 'geldauflieferungsstelle', '102-00131', 'reichsbank'], 'bank_stacks_hd.jpg');

  // Also upscale existing kids_playing_money.jpg if no larger Wikimedia match had children
  const existingKids = path.join(imgDir, 'kids_playing_money.jpg');
  const hdKids = path.join(imgDir, 'kids_playing_money_restored.jpg');
  if (fs.existsSync(existingKids)) {
    execSync(`ffmpeg -y -i "${existingKids}" -vf "scale=1080:-2:flags=lanczos,hqdn3d=2:2:3:3,unsharp=5:5:1.1:5:5:0.0,eq=contrast=1.08:brightness=0.02" -q:v 2 "${hdKids}"`, { stdio: 'ignore' });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
