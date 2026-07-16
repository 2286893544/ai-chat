import { app, BrowserWindow, Menu, dialog, session, shell } from 'electron'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(desktopRoot, '../..')
const desktopPort = app.isPackaged ? 38673 : 38674
app.setName('AI Chat')
const gotSingleInstanceLock = app.requestSingleInstanceLock()

let mainWindow = null
let appOrigin = ''

if (!gotSingleInstanceLock) {
  app.quit()
}

function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.once('error', (error) => {
      if (error?.code === 'EADDRINUSE') {
        reject(new Error(`AI Chat 专用端口 ${port} 已被占用，请关闭其他 AI Chat 实例后重试。`))
        return
      }
      reject(error)
    })
    server.listen(port, '127.0.0.1', () => {
      server.close((error) => error ? reject(error) : resolve())
    })
  })
}

async function waitForBackend(origin, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${origin}/health`)
      if (response.ok) return
    } catch {
      // The local server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('本地 API 服务启动超时')
}

async function startBackend() {
  await ensurePortAvailable(desktopPort)
  appOrigin = `http://127.0.0.1:${desktopPort}`

  process.env.NODE_ENV = 'production'
  process.env.PORT = String(desktopPort)
  process.env.CORS_ORIGIN = appOrigin
  process.chdir(app.isPackaged ? process.resourcesPath : repoRoot)

  const serverEntry = app.isPackaged
    ? new URL('../dist/server.mjs', import.meta.url)
    : pathToFileURL(path.join(desktopRoot, 'dist/server.mjs'))

  await import(serverEntry.href)
  await waitForBackend(appOrigin)
}

function isLocalAppUrl(url) {
  try {
    return new URL(url).origin === appOrigin
  } catch {
    return false
  }
}

function configurePermissions() {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    return permission === 'media' && isLocalAppUrl(requestingOrigin)
  })

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media' && isLocalAppUrl(webContents.getURL()))
  })
}

function installApplicationMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: '显示',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

async function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#1a1a2e',
    title: 'AI Chat',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow = window
  window.once('ready-to-show', () => window.show())
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    if (isLocalAppUrl(url)) return
    event.preventDefault()
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
  })

  await window.loadURL(`${appOrigin}/chat`)
}

app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
})

app.whenReady().then(async () => {
  try {
    await startBackend()
    configurePermissions()
    installApplicationMenu()
    await createMainWindow()
  } catch (error) {
    dialog.showErrorBox('AI Chat 启动失败', error instanceof Error ? error.message : String(error))
    app.quit()
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
