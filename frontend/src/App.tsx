import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Result from './pages/Result'
import Records from './pages/Records'
import Settings from './pages/Settings'

function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  if (location.pathname === '/result') return null

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-gray-800/50 border-b border-gray-700/50">
      <button onClick={() => navigate('/')} className="text-lg font-bold hover:text-blue-400 transition-colors">
        天机四柱
      </button>
      <div className="flex gap-3 text-sm">
        {!isHome && (
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
            排盘
          </button>
        )}
        <button onClick={() => navigate('/records')} className="text-gray-400 hover:text-white transition-colors">
          记录
        </button>
        <button onClick={() => navigate('/settings')} className="text-gray-400 hover:text-white transition-colors">
          设置
        </button>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/records" element={<Records />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
