const { app } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const root = path.resolve(__dirname, '..')
app.setPath('userData', path.join(root, '.test-eclypse/ui'))
process.env.ECLYPSE_DATA_DIR = path.join(root, '.test-eclypse')
app.on('browser-window-created', (_event, window) => {
    window.webContents.on('console-message', (_event, ...args) => console.log('Renderer:', ...args))
    window.webContents.on('did-fail-load', (_event, code, message) => console.error('LOAD FAILED', code, message))
    window.webContents.on('did-finish-load', () => {
        setTimeout(async () => {
            try {
                console.log('UI RESULT', await window.webContents.executeJavaScript(`JSON.stringify({title:document.title,server:document.getElementById('server_selection_button')?.textContent, fatal:typeof fatalStartupError !== 'undefined' && fatalStartupError})`))
                if (process.argv.includes('--repair')) {
                    // Force a real vanilla download; Forge/mod files are repaired from the bundle.
                    const missingLibrary = path.join(root, '.test-eclypse/common/libraries/com/mojang/logging/1.1.1/logging-1.1.1.jar')
                    if (fs.existsSync(missingLibrary)) fs.unlinkSync(missingLibrary)
                    await window.webContents.executeJavaScript(`(async () => {
                        const failures = [];
                        const previousHandler = showLaunchFailure;
                        showLaunchFailure = (title, message) => failures.push(title + ': ' + message);
                        try {
                            await dlAsync(false);
                            if (failures.length) throw new Error(failures.join('\\n'));
                        } finally { showLaunchFailure = previousHandler; }
                    })()`)
                    if (!fs.existsSync(missingLibrary)) throw new Error('FullRepair did not restore the missing library.')
                    console.log('REPAIR FLOW FINISHED')
                }
                fs.writeFileSync(path.join(root, '.test-eclypse/launcher.png'), (await window.webContents.capturePage()).toPNG())
            } catch(error) { console.error(error) }
            app.quit()
        }, 15000)
    })
})
setTimeout(() => app.quit(), process.argv.includes('--repair') ? 120000 : 30000)
require(path.join(root, 'extracted_launcher/source/index.js'))
