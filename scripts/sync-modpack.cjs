const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distroDir = path.join(root, 'rede-eclypse-distro');
const distroModsDir = path.join(distroDir, 'instance', 'mods');
const pcLauncherDistroDir = path.resolve(root, '..', 'rede-eclypse-launcher', 'distribution');
const cfInstanceMods = 'C:/Users/gusta/curseforge/minecraft/Instances/Dragon mine z server/mods';

console.log('========================================================');
console.log('      Rede Eclypse — Atualizador do Modpack');
console.log('========================================================\n');

// 1. Sincronizar mods do CurseForge se solicitado ou se houver novos mods
if (process.argv.includes('--curseforge') && fs.existsSync(cfInstanceMods)) {
    console.log('-> Sincronizando mods da pasta do CurseForge...');
    const cfFiles = fs.readdirSync(cfInstanceMods).filter(f => f.endsWith('.jar'));
    for (const f of cfFiles) {
        const cleanName = f.replace(/%2b/gi, '+');
        const src = path.join(cfInstanceMods, f);
        const dst = path.join(distroModsDir, cleanName);
        fs.copyFileSync(src, dst);
    }
}

// 2. Gerar manifesto distribution.json atualizado
console.log('-> Gerando novo distribution.json com hashes atualizados...');
execSync(`node "${path.join(distroDir, 'generate-distribution.js')}"`, { stdio: 'inherit' });

// 3. Atualizar a pasta local do launcher PC se existir (fallback offline)
if (fs.existsSync(pcLauncherDistroDir)) {
    console.log('-> Sincronizando arquivos de fallback local do launcher PC...');
    fs.mkdirSync(pcLauncherDistroDir, { recursive: true });
    fs.copyFileSync(
        path.join(distroDir, 'distribution.json'),
        path.join(pcLauncherDistroDir, 'distribution.json')
    );

    // Copiar mods para o bundle local do PC
    const mods = fs.readdirSync(distroModsDir).filter(f => f.endsWith('.jar'));
    const launcherModsDir = path.join(pcLauncherDistroDir, 'instance', 'mods');
    fs.mkdirSync(launcherModsDir, { recursive: true });
    for (const m of mods) {
        fs.copyFileSync(path.join(distroModsDir, m), path.join(launcherModsDir, m));
    }
}

// 4. Subir automaticamente para o GitHub
if (!process.argv.includes('--no-push')) {
    console.log('\n-> Enviando atualizacao para o GitHub (sleexzx11/Launcher)...');
    try {
        execSync('git add .', { cwd: root, stdio: 'inherit' });
        const status = execSync('git status --porcelain', { cwd: root }).toString().trim();
        if (status) {
            const commitMsg = process.argv[2] && !process.argv[2].startsWith('--') 
                ? process.argv[2] 
                : 'Atualizacao do Modpack';
            execSync(`git commit -m "${commitMsg}"`, { cwd: root, stdio: 'inherit' });
            execSync('git push origin main', { cwd: root, stdio: 'inherit' });
            console.log('\n========================================================');
            console.log(' ✔ SUCESSO: O modpack foi atualizado no GitHub!');
            console.log(' Os jogadores receberao os novos mods ao abrir o launcher.');
            console.log('========================================================\n');
        } else {
            console.log('\n[INFO] Nenhuma alteracao em mods detectada. Nada para subir.');
        }
    } catch (err) {
        console.error('Erro ao subir para o git:', err.message);
    }
} else {
    console.log('\n[OK] distribution.json atualizado localmente (modo sem push).');
}
