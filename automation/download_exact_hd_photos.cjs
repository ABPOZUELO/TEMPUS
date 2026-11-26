const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgDir = path.join(__dirname, '..', 'tempus-hyperframes', 'assets', 'images');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'TempusDocumentaryBot/1.0 (contact@tempus.es)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' for ' + u));
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    get(url);
  });
}

async function main() {
  const items = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Children_using_bundles_of_marks_as_toys_in_Germany%2C_Literary_Digest_%281923-12-08%29%2C_p17-colorized_%281%29.jpg',
      out: 'kids_playing_hd.jpg',
      vf: "scale=1200:-2:flags=lanczos,unsharp=5:5:0.5:5:5:0.0"
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Berlin_-_la_foule_assi%C3%A8ge_la_voiture_d%27un_boulanger_et_se_dispute_le_pain_%C3%A0_coup_de_millions_de_Marks_-_btv1b9024458p.jpg',
      out: 'bakery_crowd_hd.jpg',
      vf: "scale=1440:-2:flags=lanczos,eq=contrast=1.08"
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Bundesarchiv_Bild_183-R1215-506%2C_Berlin%2C_Reichsbank%2C_Geldauflieferungsstelle.jpg',
      out: 'reichsbank_vault_hd.jpg',
      vf: "scale=1280:-2:flags=lanczos,unsharp=5:5:0.7:5:5:0.0,eq=contrast=1.08"
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Bundesarchiv_Bild_102-00131%2C_Berlin%2C_Reichsbank%2C_Geldtransport_mit_Taschen.jpg',
      out: 'money_bags_hd.jpg',
      vf: "scale=1280:-2:flags=lanczos,unsharp=5:5:0.7:5:5:0.0,eq=contrast=1.08"
    }
  ];

  for (const item of items) {
    const raw = path.join(imgDir, 'tmp_' + item.out);
    const dest = path.join(imgDir, item.out);
    console.log('Downloading', item.out, '...');
    await downloadFile(item.url, raw);
    execSync(`ffmpeg -y -i "${raw}" -vf "${item.vf}" -q:v 2 "${dest}"`, { stdio: 'ignore' });
    fs.unlinkSync(raw);
    console.log('Saved crisp', item.out);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
