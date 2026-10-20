// Imports the already-installed Forge client and mods, without changing CurseForge.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'extracted_launcher/source')
const config = require(path.join(source, 'launcher-config.json'))
const instance = process.argv[2] || 'C:/Users/gusta/curseforge/minecraft/Instances/Dragon mine z server'
const install = process.argv[3] || path.join(root, '.tools/forge-client')
const metadata = JSON.parse(fs.readFileSync(path.join(instance, 'minecraftinstance.json')))
if (metadata.gameVersion !== config.minecraftVersion || metadata.baseModLoader.forgeVersion !== config.forgeVersion) {
    throw new Error('A versão da instância não corresponde à configuração do launcher.')
}
const bundle = path.join(source, 'distribution')
const forgeId = `${config.minecraftVersion}-forge-${config.forgeVersion}`
const version = JSON.parse(fs.readFileSync(path.join(install, 'versions', forgeId, `${forgeId}.json`)))
const hash = (bytes, algo) => crypto.createHash(algo).update(bytes).digest('hex')
const files = []
function artifact(relative, bytes, url) {
    const dest = path.join(bundle, relative)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, bytes)
    files.push({ path: relative, sha256: hash(bytes, 'sha256') })
    return { size: bytes.length, MD5: hash(bytes, 'md5'), url: url || `bundle:${relative}` }
}
function library(id, type = 'Library', declared) {
    const [group, name, ver, classifier] = id.split(':')
    const rel = declared?.path || `${group.replaceAll('.', '/')}/${name}/${ver}/${name}-${ver}${classifier ? '-' + classifier : ''}.jar`
    const bytes = fs.readFileSync(path.join(install, 'libraries', rel))
    if (declared?.sha1 && hash(bytes, 'sha1') !== declared.sha1) throw new Error(`Biblioteca corrompida: ${id}`)
    return { id, name, type, artifact: { ...artifact(`libraries/${rel}`, bytes, declared?.url), path: rel } }
}
const forgeVersion = `${config.minecraftVersion}-${config.forgeVersion}`
const forge = library(`net.minecraftforge:forge:${forgeVersion}:client`, 'ForgeHosted')
forge.subModules = version.libraries.map(lib => library(lib.name, 'Library', lib.downloads.artifact))
for (const component of ['fmlcore', 'javafmllanguage', 'lowcodelanguage', 'mclanguage']) {
    forge.subModules.push(library(`net.minecraftforge:${component}:${forgeVersion}`))
}
forge.subModules.push(library(`net.minecraftforge:forge:${forgeVersion}:universal`))
const mcp = version.arguments.game[version.arguments.game.indexOf('--fml.mcpVersion') + 1]
forge.subModules.push(library(`net.minecraft:client:${config.minecraftVersion}-${mcp}:extra`))
forge.subModules.push({ ...library(`net.minecraft:client:${config.minecraftVersion}-${mcp}:srg`), classpath: false })
const versionPath = `versions/${version.id}/${version.id}.json`
forge.subModules.push({ id: version.id, name: 'Forge version manifest', type: 'VersionManifest', artifact: artifact(versionPath, Buffer.from(JSON.stringify(version, null, 2))) })
const modules = [forge]
for (const file of fs.readdirSync(path.join(instance, 'mods')).filter(name => name.endsWith('.jar')).sort()) {
    const rel = `mods/${file}`
    modules.push({ id: file, name: file, type: 'File', artifact: { ...artifact(`instance/${rel}`, fs.readFileSync(path.join(instance, rel))), path: rel } })
}
const distro = {
    version: '1.0.0', rss: null, servers: [{
        id: 'rede-eclypse-1.20.1', name: config.name,
        description: 'Dragon Mine Z — Minecraft 1.20.1 / Forge 47.4.10',
        icon: '', version: '1.0.0', address: config.serverAddress,
        minecraftVersion: config.minecraftVersion, mainServer: true, autoconnect: true,
        javaOptions: { supported: '17.x', suggestedMajor: 17 },
        modules
    }]
}
fs.writeFileSync(path.join(bundle, 'distribution.json'), JSON.stringify(distro, null, 2))
fs.writeFileSync(path.join(bundle, 'bundle-lock.json'), JSON.stringify(files, null, 2))
console.log(`Distribuição gerada: ${files.length} arquivos; ${modules.length - 1} mods; Forge ${config.forgeVersion}.`)
