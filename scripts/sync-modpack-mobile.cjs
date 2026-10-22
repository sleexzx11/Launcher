const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distroDir = path.join(root, 'rede-eclypse-distro');
const mobileModsDir = path.join(distroDir, 'instance-mobile', 'mods');

console.log('========================================================');
console.log('    Rede Eclypse — Atualizador do Modpack Mobile        ');
console.log('========================================================\n');

if (!fs.existsSync(mobileModsDir)) {
    fs.mkdirSync(mobileModsDir, { recursive: true });
}

// 1. Gerar manifesto mobile-distribution.json atualizado
console.log('-> Gerando novo mobile-distribution.json com hashes atualizados...');
execSync(`node "${path.join(distroDir, 'generate-mobile-distribution.js')}"`, { stdio: 'inherit' });

// 2. Subir automaticamente para o GitHub
if (!process.argv.includes('--no-push')) {
    console.log('\n-> Enviando atualizacao dos mods mobile para o GitHub (sleexzx11/Launcher)...');
    try {
        execSync('git add rede-eclypse-distro/instance-mobile/ rede-eclypse-distro/mobile-distribution.json', { cwd: root, stdio: 'inherit' });
        const status = execSync('git status --porcelain', { cwd: root }).toString().trim();
        if (status) {
            const commitMsg = process.argv[2] && !process.argv[2].startsWith('--') 
                ? process.argv[2] 
                : 'Atualizacao do Modpack Mobile';
            execSync(`git commit -m "${commitMsg}"`, { cwd: root, stdio: 'inherit' });
            execSync('git push origin main', { cwd: root, stdio: 'inherit' });
            console.log('\n========================================================');
            console.log(' ✔ SUCESSO: Modpack MOBILE atualizado no GitHub!');
            console.log(' Os celulares sincronizarao esses mods ao tocar em JOGAR.');
            console.log('========================================================\n');
        } else {
            console.log('\n[INFO] Nenhuma alteracao em mods mobile detectada. Nada para subir.');
        }
    } catch (err) {
        console.error('Erro ao subir para o git:', err.message);
    }
} else {
    console.log('\n[OK] mobile-distribution.json atualizado localmente (modo sem push).');
}
