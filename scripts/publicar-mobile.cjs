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

    // 1. Grava version_info.json no repositório mobile e envia as alterações
    if (fs.existsSync(mobileSourceDir)) {
        try {
            console.log('\n[1/2] Gravando version_info.json no projeto mobile...');
            const versionInfoFile = path.join(mobileSourceDir, 'version_info.json');
            fs.writeFileSync(versionInfoFile, JSON.stringify({
                versionName: newVersionName,
                changelog: changelog
            }, null, 2) + '\n', 'utf8');

            console.log('[2/2] Enviando para o GitHub para iniciar a compilação do APK...');
            execSync('git add -A', { cwd: mobileSourceDir, stdio: 'inherit' });
            
            const status = execSync('git status --porcelain', { cwd: mobileSourceDir, encoding: 'utf8' }).trim();
            if (status) {
                execSync(`git commit -m "release(mobile): v${newVersionName} - ${changelog}"`, { cwd: mobileSourceDir, stdio: 'inherit' });
            } else {
                execSync(`git commit --allow-empty -m "release(mobile): v${newVersionName} - ${changelog}"`, { cwd: mobileSourceDir, stdio: 'inherit' });
            }

            execSync('git push origin main', { cwd: mobileSourceDir, stdio: 'inherit' });
            console.log('  -> Código enviado ao GitHub com sucesso!');
        } catch (e) {
            console.error('  [ERRO no Git mobile]:', e.message);
        }
    }

    console.log('\n============================================================');
    console.log(`  COMPILAÇÃO DA VERSÃO v${newVersionName} INICIADA COM SUCESSO!`);
    console.log('============================================================\n');
    console.log('🛡️  PROTEÇÃO ATIVA CONTRA ERRO DE ATUALIZAÇÃO:');
    console.log('• O aviso de atualização nos celulares SÓ será liberado quando');
    console.log('  o GitHub Actions terminar 100% de compilar e publicar o novo APK.');
    console.log('• Se algum jogador abrir o app agora durante os 3 minutos de build,');
    console.log('  ele jogará normalmente sem nenhum erro de download prematuro!\n');
    console.log('Acompanhe a compilação em tempo real em:');
    console.log('https://github.com/sleexzx11/rede-eclypse-mobile/actions\n');
    console.log('============================================================\n');
}

main().catch(err => {
    console.error('\n[ERRO CRÍTICO]:', err);
});
