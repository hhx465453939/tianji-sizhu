/**
 * Generate Android launcher icons and splash screens from the project's
 * design tokens (cinnabar seal + rice-paper strokes).
 *
 * Replaces Capacitor's default teal robot assets, which clash with the
 * Song-dynasty palette defined in frontend/src/style.css.
 *
 * Renders with the system Chrome via puppeteer-core (project-local tooling).
 * Usage: node scripts/gen-android-assets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Anchor everything to the repo root (script location), never to cwd:
// running from frontend/ would otherwise write to frontend/frontend/...
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requireFromFrontend = createRequire(path.join(ROOT, 'frontend/package.json'))
const puppeteer = requireFromFrontend('puppeteer-core')

const SEAL = '#B23A28'
const PAPER = '#F5F0E6'
const RES = path.join(ROOT, 'frontend/android/app/src/main/res')

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
if (!executablePath) { console.error('No Chrome/Edge found'); process.exit(1) }

/** Four stacked strokes: the "four pillars" mark, legible even at 48px. */
function markSvg({ bg, stroke, inset = 22, weight = 9 }) {
  const top = inset
  const bottom = 100 - inset
  const gap = (bottom - top) / 3
  const lines = [0, 1, 2, 3]
    .map(i => `<line x1="${inset}" y1="${top + gap * i}" x2="${100 - inset}" y2="${top + gap * i}"/>`)
    .join('')
  const rect = bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    ${rect}
    <g stroke="${stroke}" stroke-width="${weight}" stroke-linecap="square">${lines}</g>
  </svg>`
}

function roundSvg() {
  const lines = [26, 42, 58, 74]
    .map(y => `<line x1="30" y1="${y}" x2="70" y2="${y}"/>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="50" r="50" fill="${SEAL}"/>
    <g stroke="${PAPER}" stroke-width="7" stroke-linecap="square">${lines}</g>
  </svg>`
}

function splashSvg(w, h) {
  const short = Math.min(w, h)
  const seal = Math.round(short * 0.20)
  const x = (w - seal) / 2
  const y = (h - seal) / 2 - Math.round(short * 0.02)
  const lines = [0, 1, 2, 3]
    .map(i => {
      const inset = seal * 0.26
      const top = y + inset
      const gap = (seal - inset * 2) / 3
      const yy = top + gap * i
      return `<line x1="${x + inset}" y1="${yy}" x2="${x + seal - inset}" y2="${yy}"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${PAPER}"/>
    <rect x="${x}" y="${y}" width="${seal}" height="${seal}" fill="${SEAL}"/>
    <g stroke="${PAPER}" stroke-width="${Math.max(1.5, seal * 0.075)}" stroke-linecap="square">${lines}</g>
  </svg>`
}

const MIPMAPS = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
]

const SPLASHES = [
  ['drawable/splash.png', 480, 320],
  ['drawable-land-mdpi/splash.png', 480, 320],
  ['drawable-land-hdpi/splash.png', 800, 480],
  ['drawable-land-xhdpi/splash.png', 1280, 720],
  ['drawable-land-xxhdpi/splash.png', 1600, 960],
  ['drawable-land-xxxhdpi/splash.png', 1920, 1280],
  ['drawable-port-mdpi/splash.png', 320, 480],
  ['drawable-port-hdpi/splash.png', 480, 800],
  ['drawable-port-xhdpi/splash.png', 720, 1280],
  ['drawable-port-xxhdpi/splash.png', 960, 1600],
  ['drawable-port-xxxhdpi/splash.png', 1280, 1920],
]

async function render(page, svg, width, height, outPath, transparent) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.setContent(
    `<html><head><style>
       html,body{margin:0;padding:0;width:${width}px;height:${height}px;background:transparent;overflow:hidden}
       svg{display:block;width:${width}px;height:${height}px}
     </style></head><body>${svg}</body></html>`,
    { waitUntil: 'load' },
  )
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await page.screenshot({ path: outPath, omitBackground: transparent, clip: { x: 0, y: 0, width, height } })
  console.log(`  ${path.relative(ROOT, outPath)} (${width}x${height})`)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
  })
  const page = await browser.newPage()

  console.log('launcher icons:')
  for (const [density, iconSize, fgSize] of MIPMAPS) {
    const dir = path.join(RES, `mipmap-${density}`)
    await render(page, markSvg({ bg: SEAL, stroke: PAPER }), iconSize, iconSize, path.join(dir, 'ic_launcher.png'), false)
    await render(page, roundSvg(), iconSize, iconSize, path.join(dir, 'ic_launcher_round.png'), true)
    // Adaptive foreground: transparent, strokes inside the 66/108 safe zone.
    await render(page, markSvg({ bg: null, stroke: PAPER, inset: 22, weight: 7 }), fgSize, fgSize, path.join(dir, 'ic_launcher_foreground.png'), true)
  }

  console.log('splash screens:')
  for (const [rel, w, h] of SPLASHES) {
    await render(page, splashSvg(w, h), w, h, path.join(RES, rel), false)
  }

  await browser.close()
  console.log('\ndone')
}

main().catch(err => { console.error(err); process.exit(1) })
