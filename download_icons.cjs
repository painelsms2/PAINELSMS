const fs = require('fs');
const https = require('https');
const path = require('path');

const files = [
  'ki0.png', 'sa0.png', 'hx0.png', 'am0.png', 'bqr0.png', 'bbl0.png', 'qv0.png', 'li0.png', 'vc0.png', 'abd0.png',
  'ie0.png', 'baj0.png', 'ht0.png', 'ua0.png', 'ann0.png', 'sy0.png', 'avy0.png', 'aff0.png', 're0.png', 'om0.png',
  'ax0.png', 'ccl0.png', 'aje0.png', 'ahi0.png', 'ds0.png', 'xj0.png', 'efi0.png', 'arf0.png', 'cau0.png', 'apb0.png',
  'fb0.png', 'alc0.png', 'asl0.png', 'any0.png', 'aim0.png', 'arg0.png', 'aiu0.png', 'go0.png', 'ccu0.png', 'gmsg0.png',
  'gf0.png', 'afe0.png', 'yw0.png', 'alb0.png', 'ik0.png', 'iq0.png', 'pd0.png', 'anx0.png', 'ig0.png', 'btn0.png',
  'ad0.png', 'kt0.png', 'vp0.png', 'fh0.png', 'me0.png', 'beh0.png', 'afq0.png', 'fd0.png', 'bwv0.png', 'uy0.png',
  'cq0.png', 'amv0.png', 'aom0.png', 'bgj0.png', 'axm0.png', 'awg0.png', 'nv0.png', 'aex0.png', 'nf0.png', 'aey0.png',
  'awh0.png', 'aaa0.png', 'ok0.png', 'aor0.png', 'sn0.png', 'dr0.png', 'auz0.png', 'ot0.png', 'abg0.png', 'abf0.png',
  'aol0.png', 'bqh0.png', 'fx0.png', 'ev0.png', 'pf0.png', 'anw0.png', 'afs0.png', 'dp0.png', 'bxj0.png', 'ayk0.png',
  'aba0.png', 'aoz0.png', 'ij0.png', 'avp0.png', 'lj0.png', 'abj0.png', 'aez0.png', 'vg0.png', 'ka0.png', 'ana0.png',
  'aqt0.png', 'fu0.png', 'bxz0.png', 'ky0.png', 'tg0.png', 'ep0.png', 'qq0.png', 'rb0.png', 'gp0.png', 'lf0.png',
  'oi0.png', 'auc0.png', 'hb0.png', 'ub0.png', 'ahb0.png', 'afr0.png', 'abh0.png', 'bdw0.png', 'vi0.png', 'vk0.png',
  'eb0.png', 'wr0.png', 'bfa0.png', 'wb0.png', 'th0.png', 'wa0.png', 'bsa0.png', 'vs0.png', 'baa0.png', 'bo0.png',
  'aml0.png', 'yu0.png', 'mb0.png', 'yl0.png', 'ya0.png', 'sm0.png', 'em0.png', 'btm0.png', 'zh0.png'
];

const dir = path.join(__dirname, 'public', 'img', 'servicesImg');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function download(filename) {
  return new Promise((resolve, reject) => {
    const url = `https://sms24h.org/img/servicesImg/${filename}`;
    const dest = path.join(dir, filename);
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return resolve(`Failed ${filename}: ${response.statusCode}`);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(`Downloaded ${filename}`));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve(`Error ${filename}: ${err.message}`);
    });
  });
}

async function run() {
  console.log(`Downloading ${files.length} images...`);
  // Process in batches of 10 to avoid overwhelming the server
  for (let i = 0; i < files.length; i += 10) {
    const batch = files.slice(i, i + 10);
    const results = await Promise.all(batch.map(download));
    console.log(`Batch ${i / 10 + 1}:`, results.filter(r => r.startsWith('Failed')).length ? results : 'All ok');
  }
  console.log('Done!');
}

run();
