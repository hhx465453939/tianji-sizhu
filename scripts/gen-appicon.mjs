/**
 * Generate the desktop app icon (build/appicon.png) from the project's design
 * tokens, matching the Android launcher mark: cinnabar seal + four strokes.
 *
 * Wails derives build/windows/icon.ico and the macOS .icns from this file, so
 * one source of truth covers all desktop targets.
 *
 * Usage: node scripts/gen-appicon.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requireFromFrontend = createRequire(path.join(ROOT, 'frontend/package.json'))
const puppeteer = requireFromFrontend('puppeteer-core')

const SEAL = '#B23A28'
const PAPER = '#F5F0E6'
const SIZE = 1024

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

const executablePath = CHROME_CANDIDATES.find(p => fs.existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Edge executable found. Set CHROME_PATH.')
  process.exit(1)
}

function markSvg() {
  const inset = 22
  const top = inset
  const bottom = 100 - inset
  const gap = (bottom - top) / 3
  const lines = [0, 1, 2, 3]
    .map(i => `<line x1="${inset}" y1="${top + gap * i}" x2="${100 - inset}" y2="${top + gap * i}"/>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <rect width="100" height="100" fill="${SEAL}"/>
    <g stroke="${PAPER}" stroke-width="9" stroke-linecap="square">${lines}</g>
  </svg>`
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 })
  await page.setContent(
    `<html><head><style>
       html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;background:transparent;overflow:hidden}
       svg{display:block;width:${SIZE}px;height:${SIZE}px}
     </style></head><body>${markSvg()}</body></html>`,
    { waitUntil: 'load' },
  )

  const out = path.join(ROOT, 'build', 'appicon.png')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: SIZE, height: SIZE } })
  await browser.close()

  const bytes = fs.statSync(out).size
  console.log(`[icon] wrote ${path.relative(ROOT, out)} (${SIZE}x${SIZE}, ${bytes} bytes)`)
}

main().catch(err => { console.error(err); process.exit(1) })
