import { NextResponse } from "next/server";
import { getImdbRatings } from "../../../lib/imdb-ratings";
import { buildMovieProfile } from "../../../lib/movie-profile";
import type { DiscoveryMode, RuntimeChoice } from "../../../lib/recommendation";

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
  external_ids?: { imdb_id?: string | null };
  keywords?: { keywords?: { id: number; name: string }[] };
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
  return value === "trending" || value === "recent" || value === "popular" || value === "top-rated" || value === "top-rated-imdb"
    ? value
    : "balanced";
}

function tmdbDiscoveryMode(mode: DiscoveryMode): DiscoveryMode {
  return mode === "top-rated-imdb" ? "top-rated" : mode;
}

function mapMovie(movie: TmdbMovie) {
  const genres = movie.genres?.length
    ? movie.genres.map(({ name }) => name)
    : (movie.genre_ids ?? []).map((id) => tmdbGenres[id]).filter((genre): genre is string => Boolean(genre));
  const keywords = movie.keywords?.keywords?.map(({ name }) => name) ?? [];
  const profile = buildMovieProfile(genres, movie.overview ?? "", keywords);
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
    note: "A broad suggestion based on TMDB genres, plot summary, and keywords. Shrugr hasn’t editorially reviewed this title yet.",
    reason: genres.length
      ? `Estimated from TMDB genres, plot summary, and keywords${keywords.length ? ` (${keywords.slice(0, 3).join(", ")})` : ""}; not editorially reviewed.`
      : "A live TMDB catalog suggestion; detailed film metadata is limited.",
    overview: movie.overview ?? "",
  };
}

async function discoverPage(
  token: string,
  page: number,
  runtimeChoice: RuntimeChoice,
  mode: DiscoveryMode,
): Promise<TmdbPage> {
  const sourceMode = tmdbDiscoveryMode(mode);
  const endpoint = sourceMode === "trending"
    ? `https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=${page}`
    : null;
  const params = new URLSearchParams({
    language: "en-US",
    include_adult: "false",
    include_video: "false",
    sort_by: sourceMode === "recent" ? "primary_release_date.desc" : sourceMode === "top-rated" ? "vote_average.desc" : "popularity.desc",
    page: String(page),
  });
  if (sourceMode === "top-rated" || sourceMode === "balanced") params.set("vote_count.gte", "250");
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
  const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=en-US&append_to_response=keywords,external_ids`, {
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
  if (mode === "top-rated-imdb" && !process.env.IMDB_RATINGS_TSV?.trim()) {
    return NextResponse.json({ error: "IMDb top-rated mode is not configured on this server." }, { status: 503 });
  }
  const excludedIds = new Set(
    (searchParams.get("exclude") ?? "")
      .split(",")
      .filter((id) => /^\d+$/.test(id))
      .slice(0, 100)
      .map(Number),
  );
  try {
    const modes: DiscoveryMode[] = mode === "balanced"
      ? ["popular", "top-rated"]
      : [mode === "top-rated-imdb" ? "top-rated" : mode];
    const firstPages = await Promise.all(modes.map((sourceMode) => discoverPage(token, 1, runtimeChoice, sourceMode)));
    const totalPages = Math.max(...firstPages.map((page) => page.total_pages));
    const sampledPages = await Promise.all(firstPages.map(async (firstPage, index) => {
      const sourceMode = modes[index];
      const pageCount = mode === "balanced" ? 1 : 3;
      const availablePages = Array.from(
        { length: Math.max(0, Math.min(firstPage.total_pages, 500) - 1) },
        (_, pageIndex) => pageIndex + 2,
      );
      if (mode !== "recent" && sourceMode !== "top-rated") {
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
    if (mode !== "top-rated" && mode !== "top-rated-imdb") {
      for (let i = uniqueMovies.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueMovies[i], uniqueMovies[j]] = [uniqueMovies[j], uniqueMovies[i]];
      }
    }
    const details: TmdbMovie[] = [];
    const candidates = uniqueMovies.slice(0, 24);
    for (let index = 0; index < candidates.length; index += 6) {
      const batch = await Promise.all(candidates.slice(index, index + 6).map((movie) => fetchMovieDetails(token, movie.id)));
      details.push(...batch.filter((movie): movie is TmdbMovie => movie !== null));
    }
    const imdbIds = details
      .map((movie) => movie.external_ids?.imdb_id)
      .filter((id): id is string => typeof id === "string" && /^tt\d+$/.test(id));
    let imdbRatings = new Map<string, { averageRating: number; numVotes: number }>();
    if (imdbIds.length > 0 && process.env.IMDB_RATINGS_TSV?.trim()) {
      try {
        imdbRatings = await getImdbRatings(imdbIds);
      } catch (error) {
        console.error("IMDb ratings could not be loaded.", error);
        return NextResponse.json(
          { error: "IMDb ratings could not be loaded. Check the IMDB_RATINGS_TSV server setting and file format." },
          { status: 503 },
        );
      }
    }
    if (mode === "top-rated-imdb" && imdbRatings.size === 0) {
      return NextResponse.json(
        { error: "No IMDb ratings were found for this candidate batch. Rebuild the IMDb index or try another discovery mode." },
        { status: 503 },
      );
    }
    const movies = details
      .map((movie): (NonNullable<ReturnType<typeof mapMovie>> & { imdbRating?: number; imdbVoteCount?: number }) | null => {
        const film = mapMovie(movie);
        const imdbId = movie.external_ids?.imdb_id;
        const imdbRating = imdbId ? imdbRatings.get(imdbId) : undefined;
        return film && imdbRating ? { ...film, imdbRating: imdbRating.averageRating, imdbVoteCount: imdbRating.numVotes } : film;
      })
      .filter((movie): movie is NonNullable<ReturnType<typeof mapMovie>> & { imdbRating?: number; imdbVoteCount?: number } => movie !== null)
      .filter((movie) => {
        if (runtimeChoice === "short") return movie.runtime < 90;
        if (runtimeChoice === "medium") return movie.runtime >= 90 && movie.runtime <= 120;
        if (runtimeChoice === "long") return movie.runtime > 120;
        return true;
      })
      .filter((movie) => mode !== "top-rated-imdb" || movie.imdbRating != null)
      .sort((a, b) => mode === "top-rated-imdb" ? (b.imdbRating ?? -1) - (a.imdbRating ?? -1) : 0);

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
