import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg navbar-dark py-3" aria-label="Movie reviews">
        <div className="container">
          <span className="navbar-brand fw-semibold">CineScope</span>
          <span className="navbar-text">Public movie reviews</span>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
      </Routes>

      <footer className="footer mt-auto">
        <div className="container py-4 text-center text-md-start">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
            <span>Movie Reviews Public App</span>
            <span>Built for Sprint 4</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
