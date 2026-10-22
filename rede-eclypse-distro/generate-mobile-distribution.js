/**
 * Script de Geracao do Manifesto Remoto de Distribuicao da Rede Eclypse (MOBILE)
 * Gera o mobile-distribution.json oficial exclusivo para o Launcher Android.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Argumentos da linha de comando
const args = process.argv.slice(2);
let baseUrl = 'https://raw.githubusercontent.com/sleexzx11/Launcher/main/rede-eclypse-distro';
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
        baseUrl = args[i + 1].replace(/\/+$/, '');
    }
}

const rootDir = __dirname;
const instanceModsDir = path.join(rootDir, 'instance-mobile', 'mods');
const librariesDir = path.join(rootDir, 'libraries');
const versionsDir = path.join(rootDir, 'versions');

function getHash(filePath, algo = 'md5') {
    const buffer = fs.readFileSync(filePath);
    return {
        size: buffer.length,
        hash: crypto.createHash(algo).update(buffer).digest('hex')
    };
}

if (!fs.existsSync(instanceModsDir)) {
    fs.mkdirSync(instanceModsDir, { recursive: true });
}

// 1. Carregar versoes do Forge 1.20.1
const forgeVersionId = '1.20.1-forge-47.4.10';
const forgeJsonPath = path.join(versionsDir, forgeVersionId, `${forgeVersionId}.json`);
if (!fs.existsSync(forgeJsonPath)) {
    console.error(`Erro: Arquivo ${forgeJsonPath} nao encontrado!`);
    process.exit(1);
}
const forgeJson = JSON.parse(fs.readFileSync(forgeJsonPath, 'utf8'));

// 2. Modulos do Forge e Bibliotecas
const forgeClientJarPath = path.join(librariesDir, 'net/minecraftforge/forge/1.20.1-47.4.10/forge-1.20.1-47.4.10-client.jar');
const forgeClientInfo = getHash(forgeClientJarPath);

const forgeModule = {
    id: 'net.minecraftforge:forge:1.20.1-47.4.10:client',
    name: 'forge',
    type: 'ForgeHosted',
    artifact: {
        size: forgeClientInfo.size,
        MD5: forgeClientInfo.hash,
        url: `${baseUrl}/libraries/net/minecraftforge/forge/1.20.1-47.4.10/forge-1.20.1-47.4.10-client.jar`,
        path: 'net/minecraftforge/forge/1.20.1-47.4.10/forge-1.20.1-47.4.10-client.jar'
    },
    subModules: []
};

// Submodulos do Forge (bibliotecas que vao no classpath)
for (const lib of forgeJson.libraries) {
    const artifact = lib.downloads && lib.downloads.artifact;
    const [group, name, ver, classifier] = lib.name.split(':');
    const rel = artifact?.path || `${group.replace(/\./g, '/')}/${name}/${ver}/${name}-${ver}${classifier ? '-' + classifier : ''}.jar`;
    const localLibPath = path.join(librariesDir, rel);

    let libSize = artifact ? artifact.size : 0;
    let libMd5 = '';

    if (fs.existsSync(localLibPath)) {
        const info = getHash(localLibPath);
        libSize = info.size;
        libMd5 = info.hash;
    }

    const downloadUrl = (artifact && artifact.url && artifact.url.startsWith('http'))
        ? artifact.url
        : `${baseUrl}/libraries/${rel}`;

    forgeModule.subModules.push({
        id: lib.name,
        name: name,
        type: 'Library',
        artifact: {
            size: libSize,
            MD5: libMd5 || (artifact ? artifact.sha1 : ''),
            url: downloadUrl,
            path: rel
        }
    });
}

// Bibliotecas auxiliares do FML
const fmlComponents = [
    'fmlcore',
    'javafmllanguage',
    'lowcodelanguage',
    'mclanguage'
];

for (const comp of fmlComponents) {
    const rel = `net/minecraftforge/${comp}/1.20.1-47.4.10/${comp}-1.20.1-47.4.10.jar`;
    const p = path.join(librariesDir, rel);
    if (fs.existsSync(p)) {
        const info = getHash(p);
        forgeModule.subModules.push({
            id: `net.minecraftforge:${comp}:1.20.1-47.4.10`,
            name: comp,
            type: 'Library',
            artifact: {
                size: info.size,
                MD5: info.hash,
                url: `${baseUrl}/libraries/${rel}`,
                path: rel
            }
        });
    }
}

// Forge Universal
const universalRel = 'net/minecraftforge/forge/1.20.1-47.4.10/forge-1.20.1-47.4.10-universal.jar';
const universalPath = path.join(librariesDir, universalRel);
if (fs.existsSync(universalPath)) {
    const info = getHash(universalPath);
    forgeModule.subModules.push({
        id: 'net.minecraftforge:forge:1.20.1-47.4.10:universal',
        name: 'forge',
        type: 'Library',
        artifact: {
            size: info.size,
            MD5: info.hash,
            url: `${baseUrl}/libraries/${universalRel}`,
            path: universalRel
        }
    });
}

// Minecraft Client extra & SRG
const mcp = forgeJson.arguments.game[forgeJson.arguments.game.indexOf('--fml.mcpVersion') + 1];
const extraRel = `net/minecraft/client/1.20.1-${mcp}/client-1.20.1-${mcp}-extra.jar`;
const extraPath = path.join(librariesDir, extraRel);
if (fs.existsSync(extraPath)) {
    const info = getHash(extraPath);
    forgeModule.subModules.push({
        id: `net.minecraft:client:1.20.1-${mcp}:extra`,
        name: 'client',
        type: 'Library',
        artifact: {
            size: info.size,
            MD5: info.hash,
            url: `${baseUrl}/libraries/${extraRel}`,
            path: extraRel
        }
    });
}

const srgRel = `net/minecraft/client/1.20.1-${mcp}/client-1.20.1-${mcp}-srg.jar`;
const srgPath = path.join(librariesDir, srgRel);
if (fs.existsSync(srgPath)) {
    const info = getHash(srgPath);
    forgeModule.subModules.push({
        id: `net.minecraft:client:1.20.1-${mcp}:srg`,
        name: 'client',
        type: 'Library',
        classpath: false,
        artifact: {
            size: info.size,
            MD5: info.hash,
            url: `${baseUrl}/libraries/${srgRel}`,
            path: srgRel
        }
    });
}

// Forge Version Manifest
const forgeManifestInfo = getHash(forgeJsonPath);
forgeModule.subModules.push({
    id: forgeJson.id,
    name: 'Forge version manifest',
    type: 'VersionManifest',
    artifact: {
        size: forgeManifestInfo.size,
        MD5: forgeManifestInfo.hash,
        url: `${baseUrl}/versions/${forgeVersionId}/${forgeVersionId}.json`
    }
});

const modules = [forgeModule];

// 3. Modulos dos Mods Mobile (instance-mobile/mods)
// Corrigir automaticamente nomes codificados (%2b -> +)
const rawMods = fs.readdirSync(instanceModsDir);
for (const f of rawMods) {
    if (f.includes('%2b') || f.includes('%2B')) {
        const clean = f.replace(/%2b/gi, '+');
        fs.renameSync(path.join(instanceModsDir, f), path.join(instanceModsDir, clean));
        console.log(`  [AUTO-CORRECAO] ${f} -> ${clean}`);
    }
}

const modFiles = fs.readdirSync(instanceModsDir).filter(f => f.endsWith('.jar')).sort();
console.log(`Lendo ${modFiles.length} mods mobile em ${instanceModsDir}...`);

for (const modFile of modFiles) {
    const fullPath = path.join(instanceModsDir, modFile);
    const info = getHash(fullPath);
    const rel = `mods/${modFile}`;

    modules.push({
        id: modFile,
        name: modFile,
        type: 'File',
        artifact: {
            size: info.size,
            MD5: info.hash,
            url: `${baseUrl}/instance-mobile/${rel}`,
            path: rel
        }
    });
    console.log(`  + [MOD MOBILE] ${modFile} (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
}

// 4. Montar a estrutura da distribuicao mobile
const distro = {
    version: '1.0.0',
    rss: null,
    discord: {
        clientId: '1562658013888778290',
        smallImageKey: 'logo',
        smallImageText: 'Rede Eclypse Mobile'
    },
    servers: [
        {
            id: 'rede-eclypse-mobile-1.20.1',
            name: 'Rede Eclypse Mobile',
            description: 'Dragon Mine Z — Minecraft 1.20.1 Mobile / Forge 47.4.10',
            icon: '',
            version: '1.0.0',
            address: 'sp-02.magnohost.com.br:25518',
            minecraftVersion: '1.20.1',
            mainServer: true,
            autoconnect: true,
            discord: {
                shortId: 'Dragon Mine Z Mobile',
                largeImageKey: 'logo',
                largeImageText: 'Rede Eclypse Mobile 1.20.1'
            },
            javaOptions: {
                supported: '17.x',
                suggestedMajor: 17
            },
            modules: modules
        }
    ]
};

// 5. Salvar mobile-distribution.json
const outputPath = path.join(rootDir, 'mobile-distribution.json');
fs.writeFileSync(outputPath, JSON.stringify(distro, null, 2), 'utf8');

console.log('\n============================================================');
console.log(`Manifesto Mobile gerado com sucesso: ${outputPath}`);
console.log(`URL Base configurada: ${baseUrl}`);
console.log(`Total de mods mobile: ${modFiles.length}`);
console.log('============================================================\n');
