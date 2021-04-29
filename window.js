const { app, BrowserWindow } = require('electron')

app.allowRendererProcessReuse = false

app.whenReady().then(() => {
	const window = new BrowserWindow({
		icon: 'icon.ico',
		width: 300,
		height: 100,
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true
		}
	})
	window.loadFile('index.html')
})

app.on('window-all-closed', () => {
	app.quit()
})
