import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={onToggle}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

function App() {
  const location = useLocation()
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light'
  })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app-shell">
      <nav className={`navbar navbar-expand-lg navbar-dark py-3 sticky-top${scrolled ? ' navbar--scrolled' : ''}`} aria-label="Movie reviews">
        <div className="container d-flex justify-content-between align-items-center">
          <span className="navbar-brand fw-semibold">CineScope</span>
          <div className="d-flex align-items-center gap-3">
            <span className="navbar-text">Public movie reviews</span>
            <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
          </div>
        </div>
      </nav>

      <div className="page-fade" key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <footer className="footer mt-auto">
        <div className="container py-4 text-center text-md-start">
          <div className="text-center">
            <span>Movie Reviews Public App</span>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  )
}

export default App
