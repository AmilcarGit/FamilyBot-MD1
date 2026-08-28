const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const TEMP_DIR = path.join(os.tmpdir(), 'familybot-youtube');
fs.mkdirSync(TEMP_DIR, { recursive: true });

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', d => { stdout += d; });
    p.stderr.on('data', d => { stderr += d; });
    p.on('error', err => reject(new Error('yt-dlp no está instalado en la VPS.')));
    p.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr.trim().split('\n').slice(-3).join(' ') || `yt-dlp terminó con código ${code}`)));
  });
}

async function info(url) {
  const { stdout } = await runYtDlp(['--dump-single-json', '--no-playlist', '--skip-download', url]);
  return JSON.parse(stdout);
}

async function download(url, type) {
  const meta = await info(url);
  const id = String(meta.id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
  const prefix = path.join(TEMP_DIR, `${id}-${Date.now()}`);
  const output = `${prefix}.%(ext)s`;
  const args = ['--no-playlist', '--no-warnings', '--max-filesize', '49M', '-o', output];

  if (type === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '128K');
  } else {
    args.push('-f', 'bv*[height<=360][ext=mp4]+ba[ext=m4a]/b[height<=360][ext=mp4]/b[height<=360]', '--merge-output-format', 'mp4');
  }

  args.push(url);
  await runYtDlp(args);
  const files = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(path.basename(prefix) + '.'));
  if (!files.length) throw new Error('yt-dlp no generó el archivo de salida.');
  return {
    path: path.join(TEMP_DIR, files[0]),
    title: meta.title || 'YouTube',
    duration: meta.duration || 0,
    thumbnail: meta.thumbnail || ''
  };
}

function cleanup(file) {
  try { fs.unlinkSync(file); } catch {}
}

module.exports = { info, download, cleanup };