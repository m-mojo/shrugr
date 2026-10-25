import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildImdbRatingsIndex, readImdbRatingsForIds } from "./imdb-ratings";

test("builds a sparse index and retrieves requested IMDb ratings and vote counts", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "shrugr-imdb-"));
  const filePath = path.join(directory, "ratings.tsv");
  try {
    const rows = Array.from({ length: 520 }, (_, index) => {
      const id = `tt${String(index + 1).padStart(7, "0")}`;
      return `${id}\t${((index % 90) + 10) / 10}\t${index + 1}`;
    });
    await writeFile(filePath, `tconst\taverageRating\tnumVotes\n${rows.join("\n")}\n`);
    const index = await buildImdbRatingsIndex(filePath);
    const ratings = await readImdbRatingsForIds(filePath, ["tt0000001", "tt0000257", "tt0000520", "tt9999999"]);

    assert.equal(index.rowCount, 520);
    assert.ok(index.indexEntries > 1);
    assert.deepEqual(ratings.get("tt0000001"), { averageRating: 1.0, numVotes: 1 });
    assert.deepEqual(ratings.get("tt0000257"), { averageRating: 8.6, numVotes: 257 });
    assert.deepEqual(ratings.get("tt0000520"), { averageRating: 7.9, numVotes: 520 });
    assert.equal(ratings.has("tt9999999"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects an IMDb file with an unexpected header", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "shrugr-imdb-"));
  const filePath = path.join(directory, "ratings.tsv");
  try {
    await writeFile(filePath, "id\trating\tvotes\ntt0000001\t5.7\t2239\n");
    await assert.rejects(buildImdbRatingsIndex(filePath), /unexpected TSV header/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects a stale index after the ratings file changes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "shrugr-imdb-"));
  const filePath = path.join(directory, "ratings.tsv");
  try {
    await writeFile(filePath, "tconst\taverageRating\tnumVotes\ntt0000001\t5.7\t2239\n");
    await buildImdbRatingsIndex(filePath);
    await writeFile(filePath, "tconst\taverageRating\tnumVotes\ntt0000001\t6.1\t2240\n");
    await assert.rejects(
      readImdbRatingsForIds(filePath, ["tt0000001"]),
      /missing, stale, or invalid/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
