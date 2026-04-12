import type { AverageScore, Movie, Review } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5148'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function fetchMovies(): Promise<Movie[]> {
  return fetchJson<Movie[]>(`${API_BASE}/api/movies`)
}

export function fetchMovie(movieId: number): Promise<Movie> {
  if (!Number.isFinite(movieId) || movieId <= 0) {
    return Promise.reject(new Error('Invalid movie id'))
  }
  return fetchJson<Movie>(`${API_BASE}/api/movies/${movieId}`)
}

export function fetchReviews(movieId: number): Promise<Review[]> {
  if (!Number.isFinite(movieId) || movieId <= 0) {
    return Promise.reject(new Error('Invalid movie id'))
  }
  return fetchJson<Review[]>(`${API_BASE}/api/movies/${movieId}/reviews`)
}

export function fetchAverageScore(movieId: number): Promise<AverageScore> {
  if (!Number.isFinite(movieId) || movieId <= 0) {
    return Promise.reject(new Error('Invalid movie id'))
  }
  return fetchJson<AverageScore>(`${API_BASE}/api/movies/${movieId}/average-score`)
}
