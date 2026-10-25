import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbPage = {
  results: TmdbMovie[];
};

type FeaturedMovie = {
  id: number;
  title: string;
  year: number | null;
  poster: string;
  source: "popular" | "top250";
};

async function fetchPage(token: string, endpoint: string, page: number): Promise<TmdbPage> {
  const path = endpoint === "top250" ? "discover/movie" : `movie/${endpoint}`;
  const params = new URLSearchParams({ language: "en-US", page: String(page) });
  if (endpoint === "top250") {
    params.set("include_adult", "false");
    params.set("include_video", "false");
    params.set("sort_by", "vote_average.desc");
    params.set("vote_count.gte", "2500");
  }

  const response = await fetch(`https://api.themoviedb.org/3/${path}?${params}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (response.status === 429) throw new Error("TMDB rate limit reached.");
  if (!response.ok) throw new Error(`TMDB ${endpoint} request failed with HTTP ${response.status}.`);
  return (await response.json()) as TmdbPage;
}

function toFeaturedMovies(pages: TmdbPage[], source: FeaturedMovie["source"]): FeaturedMovie[] {
  return [...new Map(pages.flatMap(({ results }) => results)
    .filter((movie) => movie.id && movie.title && movie.poster_path)
    .map((movie) => [movie.id, {
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? Number(movie.release_date.slice(0, 4)) || null : null,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      source,
    }])).values()];
}

export async function GET() {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN?.trim();
  if (!token || /[\s"'`]/.test(token) || token.includes("TMDB_API_READ_ACCESS_TOKEN=") || /^Bearer\b/i.test(token)) {
    return NextResponse.json({ error: "Live movie charts are not configured on the server." }, { status: 503 });
  }

  try {
    const [popularPages, topRatedPages] = await Promise.all([
      Promise.all([1, 2, 3].map((page) => fetchPage(token, "popular", page))),
      Promise.all(Array.from({ length: 13 }, (_, index) => fetchPage(token, "top250", index + 1))),
    ]);

    return NextResponse.json({
      popular: toFeaturedMovies(popularPages, "popular"),
      top250: toFeaturedMovies(topRatedPages, "top250").slice(0, 250),
    });
  } catch (error) {
    console.warn("Featured movie charts could not be loaded.", error);
    return NextResponse.json({ error: "Live movie charts could not be loaded." }, { status: 502 });
  }
}
