export type Movie = {
  movieId: number
  title: string
  synopsis?: string | null
  runtimeHours?: number | null
  runtimeMinutes?: number | null
  releaseDate?: string | null
  imageUrl?: string | null
  genreName?: string | null
  ratingName?: string | null
  releaseYear?: number | null
}

export type Review = {
  id: number
  movieId: number
  score?: number | null
  content?: string | null
  criticName?: string | null
  createdDate?: string | null
}
