import { createClient } from "@supabase/supabase-js";
import { films as localFilms, type Film } from "../catalog";

const posterBaseUrl = "https://image.tmdb.org/t/p/w780";

type SupabaseFilmRow = {
  slug: string;
  tmdb_id: number | null;
  title: string;
  release_year: number | null;
  runtime_minutes: number | null;
  poster_path: string | null;
  overview: string;
  genres: string[];
  moods: Film["moods"];
  delivery: Film["delivery"];
  visual: Film["visual"];
  interruption: number | null;
  providers: string[];
  note: string;
  reason: string;
};

function getSupabaseClient() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!configuredUrl || !anonKey) return null;

  // The dashboard may provide either the project root or a REST endpoint URL.
  const projectUrl = new URL(configuredUrl);
  projectUrl.pathname = projectUrl.pathname.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  projectUrl.search = "";
  projectUrl.hash = "";

  return createClient(projectUrl.toString().replace(/\/$/, ""), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function mapFilm(row: SupabaseFilmRow): Film | null {
  if (!row.slug || !row.title || !row.runtime_minutes || !row.release_year) return null;

  const localFilm = localFilms.find((film) => film.slug === row.slug);
  const poster = row.poster_path
    ? row.poster_path.startsWith("http")
      ? row.poster_path
      : `${posterBaseUrl}${row.poster_path}`
    : localFilm?.poster;
  if (!poster) return null;

  return {
    slug: row.slug,
    tmdbId: row.tmdb_id ?? undefined,
    title: row.title,
    year: row.release_year,
    runtime: row.runtime_minutes,
    poster,
    palette: localFilm?.palette ?? "poster-blue",
    genres: row.genres ?? [],
    moods: row.moods ?? [],
    delivery: row.delivery ?? [],
    visual: row.visual ?? [],
    interruption: row.interruption ?? 0,
    providers: row.providers ?? [],
    note: row.note ?? "",
    reason: row.reason ?? "",
    overview: row.overview ?? "",
  };
}

/** Return null on configuration/network/schema errors so the local catalog remains available. */
export async function fetchPublishedFilms(): Promise<Film[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("films")
    .select("slug, tmdb_id, title, release_year, runtime_minutes, poster_path, overview, genres, moods, delivery, visual, interruption, providers, note, reason")
    .eq("status", "published")
    .order("title");

  if (error || !data) {
    if (error) console.warn("Supabase catalog unavailable; using local catalog.", error.message);
    return null;
  }

  const mappedFilms = (data as SupabaseFilmRow[]).map(mapFilm).filter((film): film is Film => film !== null);
  return mappedFilms.length > 0 ? mappedFilms : null;
}
