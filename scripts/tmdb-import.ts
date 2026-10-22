import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadataPath = path.join(projectRoot, "data", "tmdb-metadata.json");
const seededMovies = [
  { slug: "the-grand-budapest-hotel", tmdbId: 120467 },
  { slug: "knives-out", tmdbId: 546554 },
  { slug: "arrival", tmdbId: 329865 },
  { slug: "spider-man-into-the-spider-verse", tmdbId: 324857 },
  { slug: "chef", tmdbId: 116741 },
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
      const match = line.match(/^\s*TMDB_API_READ_ACCESS_TOKEN\s*=\s*(.*?)\s*$/);
      if (!match || process.env.TMDB_API_READ_ACCESS_TOKEN) continue;
      process.env.TMDB_API_READ_ACCESS_TOKEN = match[1].replace(/^['"]|['"]$/g, "");
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

async function main() {
  await loadLocalEnvironment();
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Set TMDB_API_READ_ACCESS_TOKEN in .env.local before importing.");
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

    imported[seed.slug] = {
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? Number(movie.release_date.slice(0, 4)) || null : null,
      runtime: Number.isInteger(movie.runtime) && movie.runtime! > 0 ? movie.runtime! : null,
      posterPath: movie.poster_path ?? null,
      genres: (movie.genres ?? []).map(({ name }) => name),
      overview: movie.overview ?? "",
      importedAt,
    };
    console.log(`Imported ${movie.title} (${seed.tmdbId})`);
  }

  await writeFile(metadataPath, `${JSON.stringify(imported, null, 2)}\n`, "utf8");
  console.log(`Saved ${seededMovies.length} TMDB records to data/tmdb-metadata.json`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
