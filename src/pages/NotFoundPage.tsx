import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-1 fw-bold" style={{ color: 'var(--accent)', fontSize: '96px' }}>404</h1>
      <h2 className="mb-3">Page not found</h2>
      <p className="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
      <Link className="btn btn-outline-dark" to="/">&larr; Back to movies</Link>
    </div>
  )
}
