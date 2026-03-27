import { app, BrowserWindow } from 'electron/main'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// This funtion contains the window settings
const createWindow = () => {
    const window = new BrowserWindow({
        width: 1220,
        height: 690,
        useContentSize: true,        
    })
    window.loadFile(path.join(__dirname, '..', 'web', 'index.html'))
}

app.whenReady().then(() => {
    createWindow()

    app.on('active', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') 
        app.quit()
})

