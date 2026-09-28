// 사용법
//   node video/render.js                 → video/easychem_intro.mp4 생성 (사운드 포함)
//   node video/render.js --preview 3 15  → 지정한 시각(초)의 프레임을 PNG로 저장
// 필요: playwright(Chromium), ffmpeg (FFMPEG 환경변수로 경로 지정 가능), python3+numpy(사운드 생성)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');

const FPS = 30, DIR = __dirname;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.wav': 'audio/wav' };

// 캔버스 export(toDataURL)를 위해 file:// 대신 로컬 서버로 페이지를 연다
const server = http.createServer((req, res) => {
  const p = path.join(DIR, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(DIR) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/easychem_intro.html?render`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.TL.end);
  const frame = async t => Buffer.from((await page.evaluate(t => { window.renderAt(t); return document.getElementById('out').toDataURL('image/png'); }, t)).split(',')[1], 'base64');

  const pi = process.argv.indexOf('--preview');
  if (pi > 0) {
    for (const t of process.argv.slice(pi + 1).map(Number)) fs.writeFileSync(path.join(process.env.OUT_DIR || DIR, `preview_${t}.png`), await frame(t));
  } else {
    const wav = path.join(DIR, 'assets', 'bgm.wav');
    execFileSync('python3', [path.join(DIR, 'music.py')], { stdio: 'inherit' });
    const out = path.join(DIR, 'easychem_intro.mp4');
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', wav,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-tune', 'animation',
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(FPS * duration);
    for (let i = 0; i < n; i++) {
      if (!ff.stdin.write(await frame(i / FPS))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`frame ${i}/${n}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('완료:', out);
  }
  await browser.close(); server.close();
})();
