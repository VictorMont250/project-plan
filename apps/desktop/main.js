import { app, BrowserWindow, Menu, dialog } from 'electron/main'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let isPaused = false

const setGamePaused = async (window, shouldPause) => {
    if (!window || window.isDestroyed()) return

    const eventName = shouldPause ? 'ladybug-desktop-pause' : 'ladybug-desktop-resume'
    await window.webContents.executeJavaScript(
        `window.dispatchEvent(new CustomEvent('${eventName}'));`,
        true
    )
    isPaused = shouldPause
}

const togglePause = async (window) => {
    await setGamePaused(window, !isPaused)
}

const showGameDialog = async (window) => {
    const pauseLabel = isPaused ? 'Resume game' : 'Pause game'
    const response = await dialog.showMessageBox(window, {
        type: 'question',
        title: 'Game actions',
        message: 'Choose an action for Ladybug Adventures.',
        buttons: ['Reload game', pauseLabel, 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
    })

    if (response.response === 0) {
        isPaused = false
        window.webContents.reload()
    }

    if (response.response === 1) {
        await togglePause(window)
    }
}

const buildMenu = (window) => Menu.buildFromTemplate([
    {
        label: 'Menu',
        submenu: [
            {
                label: 'Game Actions',
                accelerator: 'Ctrl+Shift+G',
                click: async () => {
                    await showGameDialog(window)
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Reload Game',
                accelerator: 'Ctrl+R',
                click: () => {
                    isPaused = false
                    window.webContents.reload()
                },
            },
            {
                label: 'Pause or Resume',
                accelerator: 'Ctrl+P',
                click: async () => {
                    await togglePause(window)
                },
            },
        ],
    },
])

// This funtion contains the window settings
const createWindow = () => {
    const window = new BrowserWindow({
        width: 1220,
        height: 690,
        useContentSize: true,        
    })
    window.loadFile(path.join(__dirname, '..', 'web', 'index.html'))
    Menu.setApplicationMenu(buildMenu(window))

    window.webContents.on('did-finish-load', () => {
        isPaused = false
    })
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

