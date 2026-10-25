import { NextResponse } from "next/server";
import type { Delivery, DiscoveryMode, Mood, RuntimeChoice, Visual } from "../../../lib/recommendation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tmdbGenres: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Science Fiction",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10770: "TV Movie",
};

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  runtime?: number | null;
  poster_path?: string | null;
  overview?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
};

type TmdbPage = {
  page: number;
  total_pages: number;
  results: TmdbMovie[];
};

function parseRuntime(value: string | null): RuntimeChoice {
  return value === "short" || value === "medium" || value === "long" ? value : "any";
}

function parseDiscoveryMode(value: string | null): DiscoveryMode {
  return value === "trending" || value === "recent" || value === "popular" || value === "top-rated"
    ? value
    : "balanced";
}

function genreProfile(genres: string[]) {
  const has = (...names: string[]) => names.some((name) => genres.includes(name));
  const moods: Mood[] = [];
  if (has("Comedy", "Family", "Romance", "Music")) moods.push("unwind");
  if (has("Documentary", "History", "Science Fiction", "Mystery")) moods.push("learn");
  if (has("Action", "Adventure", "Thriller", "War")) moods.push("hyped");
  if (has("Drama", "Romance", "Music")) moods.push("feel");
  if (has("Fantasy", "Science Fiction", "Animation", "Adventure")) moods.push("escape");

  const delivery: Delivery[] = [];
  if (has("Action", "Adventure", "Thriller", "Mystery")) delivery.push("hooked");
  if (has("Drama", "Romance", "Music")) delivery.push("soak");
  if (has("Mystery", "Science Fiction", "Crime", "Documentary")) delivery.push("brain");
  if (has("Comedy", "Family", "Animation")) delivery.push("simple");

  const visual: Visual[] = [];
  if (has("Action", "Adventure", "Animation", "Music")) visual.push("energy");
  if (has("Crime", "Horror", "Thriller", "War")) visual.push("raw");
  if (has("Fantasy", "Science Fiction", "Mystery", "Animation")) visual.push("composed");
  if (has("Drama", "Romance", "Documentary", "Family")) visual.push("grounded");

  return { moods, delivery, visual };
}

function mapMovie(movie: TmdbMovie) {
  const genres = movie.genres?.length
    ? movie.genres.map(({ name }) => name)
    : (movie.genre_ids ?? []).map((id) => tmdbGenres[id]).filter((genre): genre is string => Boolean(genre));
  const profile = genreProfile(genres);
  const year = movie.release_date ? Number(movie.release_date.slice(0, 4)) || null : null;
  const runtime = Number.isInteger(movie.runtime) && movie.runtime! > 0 ? movie.runtime! : null;
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null;
  if (!movie.id || !movie.title || !year || !runtime || !poster) return null;

  return {
    slug: `tmdb-${movie.id}`,
    tmdbId: movie.id,
    title: movie.title,
    year,
    runtime,
    voteAverage: Number.isFinite(movie.vote_average) ? movie.vote_average : undefined,
    voteCount: Number.isFinite(movie.vote_count) ? movie.vote_count : undefined,
    poster,
    palette: "poster-blue",
    genres,
    ...profile,
    interruption: null,
    providers: [],
    providerAvailabilityKnown: false,
    genericProfile: true,
    note: "A broad suggestion based on TMDB genres and runtime. Shrugr hasn’t editorially reviewed this title yet.",
    reason: genres.length ? `TMDB genres: ${genres.join(", ")}. This is a broad genre-based match, not a personal or editorial rating.` : "A live TMDB catalog suggestion; detailed film metadata is limited.",
    overview: movie.overview ?? "",
  };
}

async function discoverPage(
  token: string,
  page: number,
  runtimeChoice: RuntimeChoice,
  mode: DiscoveryMode,
): Promise<TmdbPage> {
  const endpoint = mode === "trending"
    ? `https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=${page}`
    : null;
  const params = new URLSearchParams({
    language: "en-US",
    include_adult: "false",
    include_video: "false",
    sort_by: mode === "recent" ? "primary_release_date.desc" : mode === "top-rated" ? "vote_average.desc" : "popularity.desc",
    page: String(page),
  });
  if (mode === "top-rated" || mode === "balanced") params.set("vote_count.gte", "250");
  if (runtimeChoice === "short") params.set("with_runtime.lte", "89");
  if (runtimeChoice === "medium") {
    params.set("with_runtime.gte", "90");
    params.set("with_runtime.lte", "120");
  }
  if (runtimeChoice === "long") params.set("with_runtime.gte", "121");

  const response = await fetch(endpoint ?? `https://api.themoviedb.org/3/discover/movie?${params}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 429) throw new Error("TMDB rate limit reached. Please retry shortly.");
  if (!response.ok) throw new Error(`TMDB discovery failed with HTTP ${response.status}.`);
  return (await response.json()) as TmdbPage;
}

async function fetchMovieDetails(token: string, id: number): Promise<TmdbMovie | null> {
  const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=en-US`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 429) throw new Error("TMDB rate limit reached. Please retry shortly.");
  if (!response.ok) return null;
  return (await response.json()) as TmdbMovie;
}

export async function GET(request: Request) {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: "Live movie search is not configured on the server." }, { status: 503 });
  if (
    /[\s"'`]/.test(token) ||
    token.includes("TMDB_API_READ_ACCESS_TOKEN=") ||
    /^Bearer\b/i.test(token)
  ) {
    return NextResponse.json(
      { error: "TMDB_API_READ_ACCESS_TOKEN must contain only the raw token value, with no variable name, Bearer prefix, quotes, or line breaks." },
      { status: 503 },
    );
  }

  const runtimeChoice = parseRuntime(new URL(request.url).searchParams.get("runtime"));
  const searchParams = new URL(request.url).searchParams;
  const mode = parseDiscoveryMode(searchParams.get("mode"));
  const excludedIds = new Set(
    (searchParams.get("exclude") ?? "")
      .split(",")
      .filter((id) => /^\d+$/.test(id))
      .slice(0, 100)
      .map(Number),
  );
  try {
    const modes: DiscoveryMode[] = mode === "balanced" ? ["popular", "top-rated"] : [mode];
    const firstPages = await Promise.all(modes.map((sourceMode) => discoverPage(token, 1, runtimeChoice, sourceMode)));
    const totalPages = Math.max(...firstPages.map((page) => page.total_pages));
    const sampledPages = await Promise.all(firstPages.map(async (firstPage, index) => {
      const sourceMode = modes[index];
      const pageCount = mode === "balanced" ? 1 : 3;
      const availablePages = Array.from(
        { length: Math.max(0, Math.min(firstPage.total_pages, 500) - 1) },
        (_, pageIndex) => pageIndex + 2,
      );
      if (mode !== "recent") {
        for (let i = availablePages.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [availablePages[i], availablePages[j]] = [availablePages[j], availablePages[i]];
        }
      }
      const additionalPages = await Promise.all(
        availablePages.slice(0, pageCount).map((page) => discoverPage(token, page, runtimeChoice, sourceMode)),
      );
      return [firstPage, ...additionalPages];
    }));
    const allMovies = sampledPages.flat().flatMap((page) => page.results);
    const uniqueMovies = [...new Map(allMovies.map((movie) => [movie.id, movie])).values()]
      .filter((movie) => !excludedIds.has(movie.id));
    for (let i = uniqueMovies.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueMovies[i], uniqueMovies[j]] = [uniqueMovies[j], uniqueMovies[i]];
    }
    const details: TmdbMovie[] = [];
    const candidates = uniqueMovies.slice(0, 24);
    for (let index = 0; index < candidates.length; index += 6) {
      const batch = await Promise.all(candidates.slice(index, index + 6).map((movie) => fetchMovieDetails(token, movie.id)));
      details.push(...batch.filter((movie): movie is TmdbMovie => movie !== null));
    }
    const movies = details
      .map(mapMovie)
      .filter((movie): movie is NonNullable<ReturnType<typeof mapMovie>> => movie !== null)
      .filter((movie) => {
        if (runtimeChoice === "short") return movie.runtime < 90;
        if (runtimeChoice === "medium") return movie.runtime >= 90 && movie.runtime <= 120;
        if (runtimeChoice === "long") return movie.runtime > 120;
        return true;
      });

    return NextResponse.json({ movies, source: "tmdb-live", totalPages }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    const rateLimited = errorMessage === "TMDB rate limit reached. Please retry shortly.";
    const discoveryFailure = /^TMDB discovery failed with HTTP \d+\.$/.test(errorMessage);
    const message = rateLimited || discoveryFailure
      ? errorMessage
      : "TMDB request failed. Check the server token setting and try again.";
    console.error("Live TMDB search failed.", message);
    return NextResponse.json({ error: message }, { status: rateLimited ? 429 : 502 });
  }
}
