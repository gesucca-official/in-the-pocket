// Rasterizza build/icon.svg in PNG, ICO e (con iconutil) ICNS.
// Si esegue con Electron, così non servono altre dipendenze:
//   node_modules/electron/dist/Electron.app/Contents/MacOS/Electron scripts/make-icon.mjs
import { app, BrowserWindow } from 'electron'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.join(import.meta.dirname, '..')
const svg = fs.readFileSync(path.join(root, 'build/icon.svg'), 'utf8')

app.dock?.hide()
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    transparent: true,
    frame: false,
    useContentSize: true,
    webPreferences: { offscreen: true }
  })
  const html = `<html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  await new Promise((r) => setTimeout(r, 500))
  const image = (await win.webContents.capturePage()).resize({ width: 1024, height: 1024 })
  const master = path.join(os.tmpdir(), 'itp-icon-1024.png')
  fs.writeFileSync(master, image.toPNG())

  // iconset → icns
  const set = path.join(os.tmpdir(), 'itp.iconset')
  fs.rmSync(set, { recursive: true, force: true })
  fs.mkdirSync(set)
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const name = `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`
      execFileSync(
        'sips',
        ['-z', size * scale, size * scale, master, '--out', path.join(set, name)],
        {
          stdio: 'ignore'
        }
      )
    }
  }
  execFileSync('iconutil', ['-c', 'icns', set, '-o', path.join(root, 'build/icon.icns')])

  fs.copyFileSync(master, path.join(root, 'build/icon.png'))
  fs.copyFileSync(master, path.join(root, 'resources/icon.png'))

  // ico (Windows): un'unica immagine PNG 256x256
  const png256 = path.join(os.tmpdir(), 'itp-icon-256.png')
  execFileSync('sips', ['-z', 256, 256, master, '--out', png256], { stdio: 'ignore' })
  const data = fs.readFileSync(png256)
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0) // riservato
  header.writeUInt16LE(1, 2) // tipo: icona
  header.writeUInt16LE(1, 4) // numero di immagini
  header.writeUInt8(0, 6) // larghezza 0 = 256
  header.writeUInt8(0, 7) // altezza 0 = 256
  header.writeUInt16LE(1, 10) // piani colore
  header.writeUInt16LE(32, 12) // bit per pixel
  header.writeUInt32LE(data.length, 14)
  header.writeUInt32LE(22, 18) // offset dei dati
  fs.writeFileSync(path.join(root, 'build/icon.ico'), Buffer.concat([header, data]))

  console.log('icone aggiornate')
  app.quit()
})
