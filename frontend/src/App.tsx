import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Result from './pages/Result'
import Records from './pages/Records'
import Settings from './pages/Settings'
import ThemeToggle from './components/ThemeToggle'

function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  if (location.pathname === '/result') return null

  return (
    <nav className="safe-top border-b border-line-1 bg-surface-2/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2"
        >
          <span className="h-3 w-[3px] bg-accent-seal" aria-hidden="true" />
          <span className="font-heading text-base tracking-traditional text-fg-1 transition-colors group-hover:text-accent-seal md:text-lg">
            天机四柱
          </span>
        </button>

        <div className="flex items-center gap-2.5 text-[13px] font-body md:gap-5 md:text-sm">
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="text-fg-3 transition-colors hover:text-accent-seal"
            >
              排盘
            </button>
          )}
          <button
            onClick={() => navigate('/records')}
            className="text-fg-3 transition-colors hover:text-accent-seal"
          >
            记录
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="text-fg-3 transition-colors hover:text-accent-seal"
          >
            设置
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-surface-app text-fg-2 font-body">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/records" element={<Records />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App
