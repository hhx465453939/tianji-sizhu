import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Android shell config.
 *
 * The web build (vite) is the single source of UI truth: the same dist/ powers
 * Wails on desktop and the Capacitor WebView on Android. Data persistence is
 * abstracted in src/lib/platform (SQLite on desktop, localStorage on Android).
 */
const config: CapacitorConfig = {
  appId: 'com.tianjisizhu.app',
  appName: '天机四柱',
  webDir: 'dist',
  // No remote content: the APK is fully offline.
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#F5F0E6',
  },
}

export default config
