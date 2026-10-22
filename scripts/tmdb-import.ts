import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { films as editorialFilms } from "../lib/catalog";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadataPath = path.join(projectRoot, "data", "tmdb-metadata.json");
const seededMovies = [
  { slug: "the-grand-budapest-hotel", tmdbId: 120467 },
  { slug: "knives-out", tmdbId: 546554 },
  { slug: "arrival", tmdbId: 329865 },
  { slug: "spider-man-into-the-spider-verse", tmdbId: 324857 },
  { slug: "chef", tmdbId: 212778 },
  { slug: "mad-max-fury-road", tmdbId: 76341 },
  { slug: "perfect-blue", tmdbId: 10494 },
  { slug: "before-sunrise", tmdbId: 76 },
  { slug: "the-social-network", tmdbId: 37799 },
  { slug: "paddington-2", tmdbId: 346648 },
  { slug: "everything-everywhere-all-at-once", tmdbId: 545611 },
  { slug: "lost-in-translation", tmdbId: 153 },
] as const;

async function loadLocalEnvironment() {
  try {
    const envFile = await readFile(path.join(projectRoot, ".env.local"), "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

type TmdbMovieResponse = {
  id: number;
  title: string;
  release_date?: string;
  runtime?: number | null;
  poster_path?: string | null;
  overview?: string;
  genres?: { id: number; name: string }[];
};

type ImportedMovie = {
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterPath: string | null;
  genres: string[];
  overview: string;
  importedAt: string;
};

function getSupabaseSyncConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SECRET_KEY in .env.local to sync the catalog.");
  }

  const legacyRole = secretKey.startsWith("eyJ")
    ? (JSON.parse(Buffer.from(secretKey.split(".")[1] ?? "", "base64url").toString("utf8")) as { role?: string }).role
    : null;
  if (!secretKey.startsWith("sb_secret_") && legacyRole !== "service_role") {
    throw new Error("Catalog sync requires a Supabase secret key or legacy service_role key; the public anon/publishable key cannot write catalog rows.");
  }

  return { supabaseUrl: supabaseUrl.replace(/\/rest\/v1\/?$/, ""), secretKey };
}

async function main() {
  await loadLocalEnvironment();
  const postersOnly = process.argv.includes("--posters-only");
  const syncSupabase = process.argv.includes("--sync-supabase");
  const supabaseConfig = syncSupabase ? getSupabaseSyncConfig() : null;
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Set TMDB_API_READ_ACCESS_TOKEN in .env.local before importing catalog data.");
  }

  let existing: Record<string, ImportedMovie> = {};
  try {
    existing = JSON.parse(await readFile(metadataPath, "utf8")) as Record<string, ImportedMovie>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const imported = { ...existing };
  const importedAt = new Date().toISOString();
  for (const seed of seededMovies) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${seed.tmdbId}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
    });

    if (response.status === 429) {
      throw new Error(`TMDB rate limit reached while importing ${seed.slug}; retry later.`);
    }
    if (!response.ok) {
      throw new Error(`TMDB import failed for ${seed.slug}: HTTP ${response.status} ${response.statusText}`);
    }

    const movie = (await response.json()) as TmdbMovieResponse;
    if (movie.id !== seed.tmdbId || !movie.title) {
      throw new Error(`TMDB returned an invalid movie record for ${seed.slug}.`);
    }

    const previous = imported[seed.slug];
    imported[seed.slug] = {
      tmdbId: movie.id,
      title: postersOnly ? previous?.title ?? movie.title : movie.title,
      year: postersOnly ? previous?.year ?? (movie.release_date ? Number(movie.release_date.slice(0, 4)) || null : null) : movie.release_date ? Number(movie.release_date.slice(0, 4)) || null : null,
      runtime: postersOnly ? previous?.runtime ?? (Number.isInteger(movie.runtime) && movie.runtime! > 0 ? movie.runtime! : null) : Number.isInteger(movie.runtime) && movie.runtime! > 0 ? movie.runtime! : null,
      posterPath: movie.poster_path ?? null,
      genres: postersOnly ? previous?.genres ?? (movie.genres ?? []).map(({ name }) => name) : (movie.genres ?? []).map(({ name }) => name),
      overview: postersOnly ? previous?.overview ?? movie.overview ?? "" : movie.overview ?? "",
      importedAt,
    };
    console.log(`${postersOnly ? "Updated poster for" : "Imported"} ${movie.title} (${seed.tmdbId})`);
  }

  await writeFile(metadataPath, `${JSON.stringify(imported, null, 2)}\n`, "utf8");
  console.log(`Saved ${seededMovies.length} TMDB ${postersOnly ? "poster records" : "records"} to data/tmdb-metadata.json`);

  if (syncSupabase) {
    const supabase = createClient(supabaseConfig!.supabaseUrl, supabaseConfig!.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const rows = editorialFilms.map((film) => {
      const metadata = imported[film.slug];
      const posterPath = metadata?.posterPath ?? null;
      return {
        slug: film.slug,
        tmdb_id: metadata?.tmdbId ?? film.tmdbId ?? null,
        title: metadata?.title ?? film.title,
        release_year: metadata?.year ?? film.year,
        runtime_minutes: metadata?.runtime ?? film.runtime,
        poster_path: posterPath ?? film.poster,
        overview: metadata?.overview ?? film.overview ?? "",
        genres: metadata?.genres.length ? metadata.genres : film.genres,
        moods: film.moods,
        delivery: film.delivery,
        visual: film.visual,
        interruption: film.interruption,
        providers: film.providers,
        note: film.note,
        reason: film.reason,
        status: "published" as const,
      };
    });

    const { error } = await supabase.from("films").upsert(rows, { onConflict: "slug" });
    if (error) {
      throw new Error(`Supabase catalog sync failed: ${error.message}`);
    }
    console.log(`Synced ${rows.length} curated films to Supabase.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
