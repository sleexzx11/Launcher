const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const launcherDir = path.resolve(__dirname, '..');
const distroDir = path.join(launcherDir, 'rede-eclypse-distro');
const updateJsonPath = path.join(distroDir, 'mobile-update.json');
const mobileSourceDir = path.resolve('C:\\Mods\\rede-eclypse-mobile');

async function main() {
    const rl = readline.createInterface({ input, output });

    console.log('============================================================');
    console.log('    REDE ECLYPSE MOBILE — PUBLICADOR DE ATUALIZAÇÃO (APK)   ');
    console.log('============================================================\n');

    if (!fs.existsSync(updateJsonPath)) {
        console.error('[ERRO] mobile-update.json não encontrado em: ' + updateJsonPath);
        rl.close();
        return;
    }

    const currentData = JSON.parse(fs.readFileSync(updateJsonPath, 'utf8'));
    const currentVersionName = currentData.versionName || '1.0.0';
    const currentVersionCode = currentData.versionCode || 1;

    console.log(`Versão atual nos celulares: v${currentVersionName} (Código: ${currentVersionCode})`);
    console.log(`Link atual do APK: ${currentData.apkUrl || 'Nenhum'}\n`);

    let newVersionName = '';
    while (true) {
        const answer = await rl.question(`Digite a NOVA versão (ex: 1.0.1) ou ENTER para manter [${currentVersionName}]: `);
        const trimmed = answer.trim();

        if (!trimmed) {
            newVersionName = currentVersionName;
            break;
        }

        newVersionName = trimmed;
        break;
    }

    const newVersionCode = Math.max(currentVersionCode + 1, 9934860);

    console.log(`\nCódigo de versão que forçará a atualização nos celulares: ${newVersionCode}`);

    const changelogAnswer = await rl.question('\nDigite as novidades / o que mudou (ou ENTER para padrão): ');
    const changelog = changelogAnswer.trim() || '• Melhorias de desempenho e novidades no servidor!';

    console.log('\n------------------------------------------------------------');
    console.log('Resumo da Publicação Mobile:');
    console.log(`- Versão anterior:  v${currentVersionName} (code: ${currentVersionCode})`);
    console.log(`- Nova Versão:      v${newVersionName} (code: ${newVersionCode})`);
    console.log(`- Novidades:        ${changelog}`);
    console.log(`- Arquivo Remoto:   rede-eclypse-distro/mobile-update.json`);
    console.log('------------------------------------------------------------\n');

    const confirmAnswer = await rl.question('Confirmar e disparar atualização para os celulares agora? (S/N): ');
    if (confirmAnswer.trim().toLowerCase() !== 's') {
        console.log('\nOperação cancelada pelo usuário.');
        rl.close();
        return;
    }

    rl.close();

    // 1. Se houver alterações locais no código do mobile ou se for uma nova versão, commita e envia
    if (fs.existsSync(mobileSourceDir)) {
        try {
            console.log('\n[1/3] Preparando repositório mobile (rede-eclypse-mobile)...');
            const status = execSync('git status --porcelain', { cwd: mobileSourceDir, encoding: 'utf8' }).trim();
            if (status) {
                console.log('  -> Salvando modificações nos arquivos do aplicativo...');
                execSync('git add -A', { cwd: mobileSourceDir, stdio: 'inherit' });
                execSync(`git commit -m "release(mobile): v${newVersionName} - ${changelog}"`, { cwd: mobileSourceDir, stdio: 'inherit' });
            } else {
                console.log('  -> Criando marco de versão v' + newVersionName + ' para disparar build do APK...');
                execSync(`git commit --allow-empty -m "release(mobile): v${newVersionName} - ${changelog}"`, { cwd: mobileSourceDir, stdio: 'inherit' });
            }

            console.log('  -> Enviando para o GitHub (origin/main)...');
            execSync('git push origin main', { cwd: mobileSourceDir, stdio: 'inherit' });
            console.log('  -> Código mobile enviado ao GitHub com sucesso!');
        } catch (e) {
            console.error('  [ERRO no Git mobile]:', e.message);
        }
    }

    // 2. Atualiza o mobile-update.json no repositório Launcher
    console.log('\n[2/3] Atualizando mobile-update.json...');
    currentData.versionCode = newVersionCode;
    currentData.versionName = newVersionName;
    currentData.changelog = changelog;
    currentData.title = `Rede Eclypse Mobile v${newVersionName}`;

    fs.writeFileSync(updateJsonPath, JSON.stringify(currentData, null, 2) + '\n', 'utf8');
    console.log('  -> mobile-update.json gravado localmente.');

    // 3. Commit e push no repositório Launcher
    console.log('\n[3/3] Publicando manifesto de atualização no GitHub (Launcher)...');
    try {
        execSync('git add rede-eclypse-distro/mobile-update.json', { cwd: launcherDir, stdio: 'inherit' });
        const launcherStatus = execSync('git status --porcelain', { cwd: launcherDir, encoding: 'utf8' }).trim();
        if (launcherStatus) {
            execSync(`git commit -m "feat(mobile): dispara atualizacao v${newVersionName} (code ${newVersionCode})"`, { cwd: launcherDir, stdio: 'inherit' });
        }
        execSync('git push origin main', { cwd: launcherDir, stdio: 'inherit' });
        console.log('  -> Manifesto publicado no GitHub com sucesso!');
    } catch (e) {
        console.error('  [ERRO no Git Launcher]:', e.message);
    }

    console.log('\n============================================================');
    console.log(`  SUCESSO! Atualização v${newVersionName} ativada para os celulares!`);
    console.log('============================================================\n');
    console.log('O que acontece agora:');
    console.log('1. Qualquer jogador que abrir o Launcher no celular verá o aviso');
    console.log('   de atualização com as novidades digitadas.');
    console.log('2. Ao clicar em "Atualizar", o celular baixa o novo APK sozinho.');
    console.log('\nAcompanhe o build do novo APK no GitHub Actions:');
    console.log('https://github.com/sleexzx11/rede-eclypse-mobile/actions\n');
    console.log('============================================================\n');
}

main().catch(err => {
    console.error('\n[ERRO CRÍTICO]:', err);
});
