const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'extracted_launcher/source')
const localRequire = createRequire(path.join(source, 'package.json'))
const { BundledDistributionAPI } = localRequire('./app/assets/js/bundleddistribution')
const { DistributionIndexProcessor } = localRequire('helios-core/dl')
const { isLibraryCompatible } = localRequire('helios-core/common')
const config = localRequire('./launcher-config.json')
const work = path.join(root, '.test-eclypse')
const common = path.join(work, 'common')
const instances = path.join(work, 'instances')
const cf = 'C:/Users/gusta/curseforge/minecraft/Install'
function copy(from, to) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to) }

async function main() {
    const api = new BundledDistributionAPI(path.join(work, 'launcher'), path.join(source, 'distribution'), config)
    api.commonDir = common
    api.instanceDir = instances
    const distro = await api.getDistribution()
    const server = distro.getMainServer()
    assert.equal(server.rawServer.minecraftVersion, '1.20.1')
    assert.equal(server.port, 25518)
    assert.equal(server.effectiveJavaOptions.supported, '17.x')
    const processor = new DistributionIndexProcessor(common, distro, server.rawServer.id)
    assert.equal((await processor.validate(async () => {})).distribution.length, 0)
    const modPath = server.modules[1].getPath()
    fs.writeFileSync(modPath, 'corrupted test file')
    assert.equal((await processor.validate(async () => {})).distribution.length, 1)
    await api.refreshDistributionOrFallback()
    assert.equal((await processor.validate(async () => {})).distribution.length, 0)
    const vanilla = JSON.parse(fs.readFileSync(path.join(cf, 'versions/1.20.1/1.20.1.json')))
    copy(path.join(cf, 'versions/1.20.1/1.20.1.json'), path.join(common, 'versions/1.20.1/1.20.1.json'))
    copy(path.join(cf, 'versions/1.20.1/1.20.1.jar'), path.join(common, 'versions/1.20.1/1.20.1.jar'))
    for (const lib of vanilla.libraries) {
        if (isLibraryCompatible(lib.rules, lib.natives)) {
            const rel = lib.downloads.artifact.path
            copy(path.join(cf, 'libraries', rel), path.join(common, 'libraries', rel))
        }
    }
    // Reuse only public asset files for the local smoke test.
    const assets = path.join(common, 'assets')
    if (!fs.existsSync(assets)) fs.symlinkSync(path.join(cf, 'assets'), assets, 'junction')
    const modManifest = await processor.loadModLoaderVersionJson()
    const mockConfig = {
        getInstanceDirectory: () => instances, getCommonDirectory: () => common,
        getModConfiguration: () => ({ mods: {} }), getTempNativeFolder: () => 'eclypse-test-natives',
        getMaxRAM: () => '4G', getMinRAM: () => '1G', getJVMOptions: () => [],
        getFullscreen: () => false, getGameWidth: () => 854, getGameHeight: () => 480,
        getAutoConnect: () => true, getLaunchDetached: () => false, getCloseOnLaunch: () => false,
        getJavaExecutable: () => path.join(cf, 'java/java-runtime-gamma/bin/java.exe')
    }
    const builderFile = path.join(source, 'app/assets/js/processbuilder.js')
    const builderRequire = createRequire(builderFile)
    const moduleMock = { exports: {} }
    const context = { module: moduleMock, exports: moduleMock.exports, __dirname: path.dirname(builderFile),
        process, console, setTimeout,
        require: name => name === './configmanager' ? mockConfig : name === '@electron/remote' ? { getCurrentWindow: () => ({}) } : builderRequire(name) }
    vm.runInNewContext(fs.readFileSync(builderFile, 'utf8'), context, { filename: builderFile })
    const Builder = moduleMock.exports
    const builder = new Builder(server, vanilla, modManifest,
        { displayName: 'EclypseTest', uuid: 'a7fe3c359ac243ab9f0d83d74fe813a4', accessToken: '0', type: 'offline' }, '1.0.0')
    const args = builder.constructJVMArguments([], path.join(work, 'natives'))
    assert.ok(args.includes('47.4.10'))
    assert.ok(args.includes('sp-02.magnohost.com.br:25518'))
    assert.ok(!args.some(arg => typeof arg === 'string' && arg.includes('${')))
    const cp = args[args.indexOf('-cp') + 1].split(path.delimiter)
    assert.ok(cp.every(file => fs.existsSync(file)))
    assert.equal(cp.filter(file => /[/\\]asm[/\\][0-9]/.test(file)).length, 1)
    assert.ok(cp.some(file => file.includes('asm-9.8.jar')))
    console.log('PASS: install, integrity repair, Java 17, Forge manifest, classpath and server arguments.')
    if (process.argv.includes('--launch')) {
        mockConfig.getAutoConnect = () => false
        const child = builder.build()
        const log = fs.createWriteStream(path.join(work, 'smoke.log'))
        child.stdout.pipe(log)
        child.stderr.pipe(log)
        const timer = setTimeout(() => { console.log('Smoke test time limit reached.'); child.kill() }, 90000)
        child.on('exit', code => { clearTimeout(timer); console.log('Minecraft exit:', code) })
    }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
