const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const launcherDir = path.resolve(__dirname, '..');
const distroDir = path.join(launcherDir, 'rede-eclypse-distro');
const updateJsonPath = path.join(distroDir, 'mobile-update.json');
const mobileSourceDir = path.resolve('C:\\Mods\\rede-eclypse-mobile');
const mobileUpdateJsonPath = path.join(mobileSourceDir, 'mobile-update.json');

async function main() {
    const rl = readline.createInterface({ input, output });

    console.log('============================================================');
    console.log('    REDE ECLYPSE MOBILE — PUBLICADOR DE ATUALIZAÇÃO (APK)   ');
    console.log('============================================================\n');

    // 1. Sincroniza o repositório local com as atualizações da nuvem (incluindo commits do bot)
    if (fs.existsSync(mobileSourceDir)) {
        try {
            console.log('-> Verificando atualizações no repositório mobile do GitHub...');
            execSync('git fetch origin main', { cwd: mobileSourceDir, stdio: 'ignore' });
            execSync('git pull --rebase --autostash origin main', { cwd: mobileSourceDir, stdio: 'ignore' });
        } catch (e) {
            // Continua se estiver offline ou sem alteracoes
        }
    }

    // Leitura dos dados da versao atual
    let currentData = null;
    if (fs.existsSync(mobileUpdateJsonPath)) {
        try {
            currentData = JSON.parse(fs.readFileSync(mobileUpdateJsonPath, 'utf8'));
        } catch (e) {}
    }
    if (!currentData && fs.existsSync(updateJsonPath)) {
        try {
            currentData = JSON.parse(fs.readFileSync(updateJsonPath, 'utf8'));
        } catch (e) {}
    }

    if (!currentData) {
        console.error('[ERRO] mobile-update.json não encontrado nem no mobile nem no distro!');
        rl.close();
        return;
    }

    const currentVersionName = currentData.versionName || '1.0.0';
    const currentVersionCode = currentData.versionCode || 1;

    console.log(`Versão atual nos celulares: v${currentVersionName} (Código: ${currentVersionCode})`);
    console.log(`Link atual do APK: ${currentData.apkUrl || 'Nenhum'}\n`);

    // 2. Validação estrita da nova versão (bloqueia versão idêntica)
    let newVersionName = '';
    while (true) {
        const answer = await rl.question(`Digite a NOVA versão (ex: 1.0.8) ou ENTER para cancelar: `);
        const trimmed = answer.trim();

        if (!trimmed) {
            console.log('\nOperação cancelada pelo usuário.');
            rl.close();
            return;
        }

        if (trimmed === currentVersionName) {
            console.log(`\n❌ [BLOQUEADO] A versão "${trimmed}" é idêntica à versão atual (v${currentVersionName})!`);
            console.log(`   Para publicar uma atualização, você precisa definir uma versão nova (ex: 1.0.8).\n`);
            continue;
        }

        newVersionName = trimmed;
        break;
    }

    const changelogAnswer = await rl.question('\nDigite as novidades / o que mudou (ou ENTER para padrão): ');
    const changelog = changelogAnswer.trim() || '• Melhorias de desempenho e novidades no servidor!';

    console.log('\n------------------------------------------------------------');
    console.log('Resumo da Publicação Mobile:');
    console.log(`- Versão anterior:  v${currentVersionName} (code: ${currentVersionCode})`);
    console.log(`- Nova Versão:      v${newVersionName}`);
    console.log(`- Novidades:        ${changelog}`);
    console.log('------------------------------------------------------------\n');

    const confirmAnswer = await rl.question('Confirmar e iniciar compilação do APK agora? (S/N): ');
    if (confirmAnswer.trim().toLowerCase() !== 's') {
        console.log('\nOperação cancelada pelo usuário.');
        rl.close();
        return;
    }

    rl.close();

    // 3. Grava version_info.json e envia para o GitHub
    if (fs.existsSync(mobileSourceDir)) {
        try {
            console.log('\n[1/2] Gravando version_info.json no projeto mobile...');
            const versionInfoFile = path.join(mobileSourceDir, 'version_info.json');
            fs.writeFileSync(versionInfoFile, JSON.stringify({
                versionName: newVersionName,
                changelog: changelog
            }, null, 2) + '\n', 'utf8');

            console.log('[2/2] Enviando para o GitHub para iniciar a compilação do APK...');
            // Garante que puxa qualquer commit pendente do bot sem conflito
            try {
                execSync('git pull --rebase --autostash origin main', { cwd: mobileSourceDir, stdio: 'inherit' });
            } catch (pullErr) {}

            execSync('git add -A', { cwd: mobileSourceDir, stdio: 'inherit' });

            const status = execSync('git status --porcelain', { cwd: mobileSourceDir, encoding: 'utf8' }).trim();
            if (status) {
                execSync(`git commit -m "release(mobile): v${newVersionName} - ${changelog}"`, { cwd: mobileSourceDir, stdio: 'inherit' });
            } else {
                execSync(`git commit --allow-empty -m "release(mobile): v${newVersionName} - ${changelog}"`, { cwd: mobileSourceDir, stdio: 'inherit' });
            }

            try {
                execSync('git push origin main', { cwd: mobileSourceDir, stdio: 'inherit' });
            } catch (pushErr) {
                console.log('  -> Tentando sincronizar e reenviar push...');
                execSync('git pull --rebase origin main', { cwd: mobileSourceDir, stdio: 'inherit' });
                execSync('git push origin main', { cwd: mobileSourceDir, stdio: 'inherit' });
            }

            console.log('  -> Código enviado ao GitHub com sucesso!');
        } catch (e) {
            console.error('  [ERRO no Git mobile]:', e.message);
            return;
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
