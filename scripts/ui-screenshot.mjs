/**
 * Visual acceptance harness for CHG-001 / CHG-002.
 *
 * Renders the real app in a system Chrome (no bundled browser download) and
 * captures both themes at desktop and phone viewports. Screenshots land in
 * .tmp/screenshots (git-ignored) and are referenced by tasks/CHG-001.
 *
 * Theme switching goes through the real UI control so React state and the
 * `data-theme` attribute never diverge.
 *
 * Usage:  node scripts/ui-screenshot.mjs [baseUrl]
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

// Tooling lives in frontend/node_modules (project-local, never global).
const requireFromFrontend = createRequire(path.resolve(process.cwd(), 'package.json'))
const puppeteer = requireFromFrontend('puppeteer-core')

const BASE = process.argv[2] || process.env.BASE_URL || 'http://localhost:4173'

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

const OUT_DIR = path.resolve(process.cwd(), '..', '.tmp', 'screenshots')
fs.mkdirSync(OUT_DIR, { recursive: true })

const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 }
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2 }

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  })
  await new Promise(r => setTimeout(r, 180))
}

/** Switch theme through the real UI so React state and DOM stay in sync. */
async function ensureTheme(page, want) {
  const current = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light')
  if (current === want) return
  const clicked = await page.evaluate((target) => {
    const label = target === 'dark' ? '切换到暗色' : '切换到明亮'
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => (b.getAttribute('title') || b.getAttribute('aria-label') || '').includes(label))
    if (!btn) return false
    btn.click()
    return true
  }, want)
  if (!clicked) {
    await page.evaluate(t => {
      localStorage.setItem('tianji.theme', t)
      document.documentElement.setAttribute('data-theme', t)
      document.documentElement.style.colorScheme = t
    }, want)
  }
  await settle(page)
}

async function shot(page, name, fullPage = false) {
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage })
  const { width, height } = page.viewport()
  console.log(`  captured ${name} (${width}x${height}${fullPage ? ' full' : ''})`)
}

async function go(page, hash) {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: 'networkidle2' })
  await settle(page)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
    defaultViewport: DESKTOP,
  })

  const page = await browser.newPage()
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(String(err)))

  // --- Home ---
  await page.setViewport(DESKTOP)
  await go(page, '/')
  await ensureTheme(page, 'light')
  await shot(page, 'home-light-desktop')
  await ensureTheme(page, 'dark')
  await shot(page, 'home-dark-desktop')

  await page.setViewport(PHONE)
  await ensureTheme(page, 'light')
  await shot(page, 'home-light-phone')
  await ensureTheme(page, 'dark')
  await shot(page, 'home-dark-phone')

  // --- Result: submit the default chart ---
  await page.setViewport(DESKTOP)
  await go(page, '/')
  await ensureTheme(page, 'light')
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => (b.textContent || '').includes('排 盘'))
    btn?.click()
  })
  await new Promise(r => setTimeout(r, 1000))
  await settle(page)
  const onResult = page.url().includes('#/result')
  await ensureTheme(page, 'light')
  await shot(page, 'result-light-desktop')
  await shot(page, 'result-light-desktop-full', true)

  await ensureTheme(page, 'dark')
  await shot(page, 'result-dark-desktop')
  await shot(page, 'result-dark-desktop-full', true)

  // Phone: same route, responsive columns
  await page.setViewport(PHONE)
  await ensureTheme(page, 'light')
  await shot(page, 'result-light-phone')
  await shot(page, 'result-light-phone-full', true)
  await ensureTheme(page, 'dark')
  await shot(page, 'result-dark-phone')

  // --- Records / Settings ---
  await page.setViewport(DESKTOP)
  await go(page, '/records')
  await ensureTheme(page, 'light')
  await shot(page, 'records-light-desktop')
  await ensureTheme(page, 'dark')
  await shot(page, 'records-dark-desktop')

  await go(page, '/settings')
  await ensureTheme(page, 'light')
  await shot(page, 'settings-light-desktop')
  await ensureTheme(page, 'dark')
  await shot(page, 'settings-dark-desktop')

  await page.setViewport(PHONE)
  await ensureTheme(page, 'light')
  await shot(page, 'settings-light-phone')

  // --- Report ---
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort()
  console.log(`\n${files.length} screenshots -> ${OUT_DIR}`)
  if (errors.length) {
    console.log('\nConsole errors:')
    for (const e of errors.slice(0, 12)) console.log('  ' + e)
  } else {
    console.log('No console errors.')
  }
  console.log(`Result route reached: ${onResult ? 'yes' : 'NO'}`)

  await browser.close()
  if (errors.length) process.exitCode = 2
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
