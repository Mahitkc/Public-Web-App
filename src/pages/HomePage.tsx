import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMovies, fetchReviews } from '../api'
import type { Movie, Review } from '../types'

type MovieWithScore = Movie & { averageScore?: number | null; reviewCount: number }

function calculateAverage(reviews: Review[]): number | null {
  const scores = reviews.map((review) => review.score ?? 0).filter((score) => score > 0)
  if (scores.length === 0) return null
  const total = scores.reduce((sum, score) => sum + score, 0)
  return Math.round((total / scores.length) * 10) / 10
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<number, { average: number | null; count: number }>>({})
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('all')
  const [rating, setRating] = useState('all')
  const [year, setYear] = useState('all')
  const [sort, setSort] = useState('title-asc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let isActive = true

    async function loadMovies() {
      try {
        const results = await fetchMovies()
        if (!isActive) return
        setMovies(results)

        const ratingEntries = await Promise.all(
          results.map(async (movie) => {
            try {
              const reviews = await fetchReviews(movie.movieId)
              return [movie.movieId, { average: calculateAverage(reviews), count: reviews.length }] as const
            } catch {
              return [movie.movieId, { average: null, count: 0 }] as const
            }
          }),
        )

        if (!isActive) return
        const nextRatings: Record<number, { average: number | null; count: number }> = {}
        ratingEntries.forEach(([movieId, rating]) => {
          nextRatings[movieId] = rating
        })
        setRatings(nextRatings)
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Unable to load movies.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadMovies()
    return () => {
      isActive = false
    }
  }, [])

  const moviesWithScores: MovieWithScore[] = useMemo(
    () =>
      movies.map((movie) => {
        const rating = ratings[movie.movieId]
        return {
          ...movie,
          averageScore: rating?.average ?? null,
          reviewCount: rating?.count ?? 0,
        }
      }),
    [movies, ratings],
  )

  const genres = useMemo(
    () => Array.from(new Set(moviesWithScores.map((movie) => movie.genreName).filter(Boolean))) as string[],
    [moviesWithScores],
  )

  const ratingsList = useMemo(
    () => Array.from(new Set(moviesWithScores.map((movie) => movie.ratingName).filter(Boolean))) as string[],
    [moviesWithScores],
  )

  const years = useMemo(
    () =>
      Array.from(new Set(moviesWithScores.map((movie) => movie.releaseYear).filter(Boolean) as number[])).sort(
        (a, b) => b - a,
      ),
    [moviesWithScores],
  )

  const filteredMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = moviesWithScores.filter((movie) => {
      const matchesQuery = normalizedQuery
        ? movie.title.toLowerCase().includes(normalizedQuery)
        : true
      const matchesGenre = genre === 'all' ? true : movie.genreName === genre
      const matchesRating = rating === 'all' ? true : movie.ratingName === rating
      const matchesYear = year === 'all' ? true : String(movie.releaseYear ?? '') === year

      return matchesQuery && matchesGenre && matchesRating && matchesYear
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'year-desc':
          return (b.releaseYear ?? 0) - (a.releaseYear ?? 0)
        case 'year-asc':
          return (a.releaseYear ?? 0) - (b.releaseYear ?? 0)
        case 'score-desc':
          return (b.averageScore ?? -1) - (a.averageScore ?? -1)
        case 'score-asc':
          return (a.averageScore ?? -1) - (b.averageScore ?? -1)
        default:
          return a.title.localeCompare(b.title)
      }
    })

    return sorted
  }, [moviesWithScores, query, genre, rating, year, sort])

  useEffect(() => {
    setPage(1)
  }, [query, genre, rating, year, sort, pageSize])

  function resetFilters() {
    setQuery('')
    setGenre('all')
    setRating('all')
    setYear('all')
    setSort('title-asc')
    setPageSize(6)
  }

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages])
  const pagedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredMovies.slice(startIndex, startIndex + pageSize)
  }, [filteredMovies, currentPage, pageSize])

  return (
    <div className="container py-4">
      <header className="hero-panel mb-4">
        <div className="hero-content">
          <p className="eyebrow">Public Movie Reviews</p>
          <h1 className="display-5">Find your next movie night pick</h1>
          <p className="lead mb-0">
            Browse posters, see average critic scores, and dive into detailed reviews from our critics.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-5">Loading movies...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : moviesWithScores.length === 0 ? (
        <div className="alert alert-warning">No movies available yet.</div>
      ) : (
        <>
          <section className="filter-panel mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label" htmlFor="search-input">Search</label>
                <input
                  id="search-input"
                  className="form-control"
                  type="search"
                  placeholder="Search by title"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label" htmlFor="page-size">Per page</label>
                <select
                  id="page-size"
                  className="form-select"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {[8, 12, 16].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label" htmlFor="genre-select">Genre</label>
                <select
                  id="genre-select"
                  className="form-select"
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                >
                  <option value="all">All</option>
                  {genres.map((genreName) => (
                    <option key={genreName} value={genreName}>
                      {genreName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label" htmlFor="rating-select">Rating</label>
                <select
                  id="rating-select"
                  className="form-select"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                >
                  <option value="all">All</option>
                  {ratingsList.map((ratingName) => (
                    <option key={ratingName} value={ratingName}>
                      {ratingName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label" htmlFor="year-select">Year</label>
                <select
                  id="year-select"
                  className="form-select"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                >
                  <option value="all">All</option>
                  {years.map((releaseYear) => (
                    <option key={releaseYear} value={releaseYear}>
                      {releaseYear}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label" htmlFor="sort-select">Sort</label>
                <select
                  id="sort-select"
                  className="form-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="year-desc">Release Year (newest)</option>
                  <option value="year-asc">Release Year (oldest)</option>
                  <option value="score-desc">Score (high to low)</option>
                  <option value="score-asc">Score (low to high)</option>
                </select>
              </div>
            </div>
            <div className="d-flex flex-wrap justify-content-between align-items-center mt-3">
              <span className="text-muted">Showing {filteredMovies.length} results</span>
              <div className="filter-actions">
                <button className="btn btn-outline-light btn-sm" type="button" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            </div>
          </section>

          {filteredMovies.length === 0 ? (
            <div className="alert alert-warning">No movies match your filters.</div>
          ) : (
            <>
              <div className="row g-3">
                {pagedMovies.map((movie) => {
                  const pct = movie.averageScore != null ? Math.round((movie.averageScore / 5) * 100) : null
                  const scoreClass =
                    pct === null ? 'none' : pct >= 70 ? 'fresh' : pct >= 50 ? 'mixed' : 'rotten'
                  return (
                    <div className="col-6 col-md-4 col-xl-3" key={movie.movieId}>
                      <article className="rt-card">
                        <Link className="rt-card-inner" to={`/movies/${movie.movieId}`}>
                          <div className="rt-card-poster-wrap">
                            {movie.imageUrl ? (
                              <img
                                src={movie.imageUrl}
                                className="rt-card-poster"
                                alt={`${movie.title} poster`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="rt-card-poster rt-card-no-poster">No poster</div>
                            )}
                            <div className={`rt-score-badge rt-score--${scoreClass}`}>
                              {pct !== null ? `${pct}%` : 'NR'}
                            </div>
                          </div>
                          <div className="rt-card-body">
                            <h2 className="rt-card-title">{movie.title}</h2>
                            <p className="rt-card-meta">
                              {movie.genreName ?? 'Genre'} · {movie.releaseYear ?? 'Year'} · {movie.reviewCount} review{movie.reviewCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </Link>
                      </article>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 ? (
                <nav className="mt-4" aria-label="Movie pages">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        type="button"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </button>
                    </li>
                    {pageNumbers.map((pageNumber) => (
                      <li
                        className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}
                        key={pageNumber}
                      >
                        <button
                          className="page-link"
                          type="button"
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        type="button"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  )
}
