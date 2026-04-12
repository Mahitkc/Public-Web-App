import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAverageScore, fetchMovie, fetchReviews } from '../api'
import type { Movie, Review } from '../types'

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="star-rating" aria-label={`${score} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(Math.max(score - i, 0), 1)
        const id = `star-grad-${i}-${score}`
        if (fill >= 1) {
          return <span key={i} className="star star--full">★</span>
        }
        if (fill > 0) {
          const pct = Math.round(fill * 100)
          return (
            <svg key={i} className="star star--partial" viewBox="0 0 20 20" aria-hidden="true">
              <defs>
                <linearGradient id={id}>
                  <stop offset={`${pct}%`} stopColor="var(--accent)" />
                  <stop offset={`${pct}%`} stopColor="var(--star-empty)" />
                </linearGradient>
              </defs>
              <text y="16" fill={`url(#${id})`} fontSize="20">★</text>
            </svg>
          )
        }
        return <span key={i} className="star star--empty">★</span>
      })}
    </span>
  )
}

function formatRuntime(hours?: number | null, minutes?: number | null): string {
  if (!hours && !minutes) return 'Runtime not listed'
  const parts: string[] = []
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  return parts.join(' ')
}

function formatReleaseDate(value?: string | null): string {
  if (!value) return 'Release date not listed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Release date not listed'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date)
}

export default function MovieDetailsPage() {
  const { movieId } = useParams()
  const numericId = Number(movieId)

  const [movie, setMovie] = useState<Movie | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageScore, setAverageScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadMovie() {
      if (!Number.isFinite(numericId)) {
        setError('Invalid movie selection.')
        setLoading(false)
        return
      }

      try {
        const [movieResult, reviewResults, avgResult] = await Promise.all([
          fetchMovie(numericId),
          fetchReviews(numericId),
          fetchAverageScore(numericId),
        ])
        if (!isActive) return
        setMovie(movieResult)
        setReviews(reviewResults)
        setAverageScore(avgResult.averageScore)
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Unable to load movie details.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadMovie()
    return () => {
      isActive = false
    }
  }, [numericId])

  if (loading) {
    return <div className="container py-5 text-center">Loading movie details...</div>
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link className="btn btn-outline-dark" to="/">Back to movies</Link>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Movie not found.</div>
        <Link className="btn btn-outline-dark" to="/">Back to movies</Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <Link className="btn btn-link text-decoration-none mb-3" to="/">
        &larr; Back to all movies
      </Link>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-4">
          <div className="poster-frame">
            {movie.imageUrl ? (
              <img src={movie.imageUrl} alt={`${movie.title} poster`} className="img-fluid rounded" />
            ) : (
              <div className="placeholder-poster rounded">No poster</div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <h1 className="display-6 mb-3">{movie.title}</h1>
          <p className="text-muted mb-3">
            {movie.genreName ?? 'Genre'} · {movie.ratingName ?? 'Rating'} · {movie.releaseYear ?? 'Year'}
          </p>
          <div className="score-pill mb-3">
            <span className="score-value d-flex align-items-center gap-2">
              {averageScore !== null ? (
                <><StarRating score={averageScore} /> <span>{averageScore} / 5</span></>
              ) : 'No critic score yet'}
            </span>
            <span className="score-count">{reviews.length} reviews</span>
          </div>
          <p className="lead">{movie.synopsis ?? 'Synopsis not available.'}</p>
          <p className="text-muted mb-1">{formatRuntime(movie.runtimeHours, movie.runtimeMinutes)}</p>
          <p className="text-muted mb-0">Released: {formatReleaseDate(movie.releaseDate)}</p>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="h4 mb-3 section-title">Critic Reviews</h2>
        {reviews.length === 0 ? (
          <div className="alert alert-warning">No published reviews yet.</div>
        ) : (
          <div className="vstack gap-3">
            {reviews.map((review) => (
              <article className="card border-0 shadow-sm review-card" key={review.id}>
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                    <strong>{review.criticName ?? 'Critic'}</strong>
                    {review.score !== null && review.score !== undefined ? (
                      <span className="d-flex align-items-center gap-1">
                        <StarRating score={review.score} />
                        <span className="badge text-bg-dark">{review.score} / 5</span>
                      </span>
                    ) : (
                      <span className="badge text-bg-dark">No score</span>
                    )}
                  </div>
                  <p className="mb-0">{review.content ?? 'No review content.'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
