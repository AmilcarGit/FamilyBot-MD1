const { execFile } = require('child_process');
const path = require('path');

const repoPath = path.resolve(__dirname, '..');

function ejecutarGit(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: repoPath, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function actualizar() {
  try {
    await ejecutarGit(['rev-parse', '--is-inside-work-tree']);
    console.log('🔄 Comprobando actualizaciones de GitHub...');
    const salida = await ejecutarGit(['pull', '--ff-only', 'origin', 'main']);
    console.log(salida || '✅ El bot ya está actualizado.');
  } catch (error) {
    console.error(`⚠️ No se pudo actualizar desde GitHub: ${error.message}`);
    console.log('▶️ Continuando con la versión local.');
  }
}

actualizar();
