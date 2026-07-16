import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(desktopRoot, 'assets/icon-source.png')
const iconset = path.join(desktopRoot, 'assets/icon.iconset')
const output = path.join(desktopRoot, 'assets/icon.icns')

if (!existsSync(source)) {
  throw new Error(`Missing icon source: ${source}`)
}

rmSync(iconset, { recursive: true, force: true })
mkdirSync(iconset, { recursive: true })

const sizes = [16, 32, 128, 256, 512]
for (const size of sizes) {
  execFileSync('sips', ['-z', String(size), String(size), source, '--out', path.join(iconset, `icon_${size}x${size}.png`)])
  execFileSync('sips', ['-z', String(size * 2), String(size * 2), source, '--out', path.join(iconset, `icon_${size}x${size}@2x.png`)])
}

execFileSync('iconutil', ['-c', 'icns', iconset, '-o', output])
rmSync(iconset, { recursive: true, force: true })
console.log(`Created ${output}`)
