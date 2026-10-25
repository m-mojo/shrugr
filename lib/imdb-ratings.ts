import { createReadStream } from "node:fs";
import { open, readFile, stat, writeFile } from "node:fs/promises";

export type ImdbRating = {
  averageRating: number;
  numVotes: number;
};

type IndexEntry = { id: string; offset: number };
type RatingsIndex = {
  version: 1;
  sourceSize: number;
  sourceModifiedAt: number;
  stride: number;
  entries: IndexEntry[];
};

const INDEX_STRIDE = 256;
const ratingsCache = new Map<string, Map<string, ImdbRating>>();

async function* readLinesWithOffsets(filePath: string) {
  let carry = Buffer.alloc(0);
  let streamOffset = 0;

  for await (const chunk of createReadStream(filePath)) {
    const combined = Buffer.concat([carry, chunk]);
    const combinedOffset = streamOffset - carry.length;
    let lineStart = 0;
    let newline = combined.indexOf(10, lineStart);

    while (newline !== -1) {
      const line = combined.subarray(lineStart, newline).toString("utf8").replace(/\r$/, "");
      yield { line, offset: combinedOffset + lineStart };
      lineStart = newline + 1;
      newline = combined.indexOf(10, lineStart);
    }

    carry = combined.subarray(lineStart);
    streamOffset += chunk.length;
  }

  if (carry.length > 0) {
    yield {
      line: carry.toString("utf8").replace(/\r$/, ""),
      offset: streamOffset - carry.length,
    };
  }
}

export async function buildImdbRatingsIndex(filePath: string, indexPath = `${filePath}.idx.json`) {
  const sourceStats = await stat(filePath);
  const entries: IndexEntry[] = [];
  let rowCount = 0;
  let previousId = "";
  let hasHeader = false;

  for await (const { line, offset } of readLinesWithOffsets(filePath)) {
    if (!hasHeader) {
      hasHeader = true;
      if (line !== "tconst\taverageRating\tnumVotes") {
        throw new Error("IMDb ratings file has an unexpected TSV header.");
      }
      continue;
    }

    const [id] = line.split("\t");
    if (!/^tt\d+$/.test(id ?? "")) continue;
    if (id <= previousId) {
      throw new Error("IMDb ratings rows must be sorted by tconst to build a lookup index.");
    }
    previousId = id;
    if (rowCount % INDEX_STRIDE === 0) entries.push({ id, offset });
    rowCount += 1;
  }

  if (!hasHeader) throw new Error("IMDb ratings file is empty.");
  const index: RatingsIndex = {
    version: 1,
    sourceSize: sourceStats.size,
    sourceModifiedAt: sourceStats.mtimeMs,
    stride: INDEX_STRIDE,
    entries,
  };
  await writeFile(indexPath, JSON.stringify(index));
  return { indexPath, rowCount, indexEntries: entries.length };
}

async function readLineAt(handle: Awaited<ReturnType<typeof open>>, offset: number) {
  const buffer = Buffer.alloc(1024);
  const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
  if (bytesRead === 0) return null;
  const newline = buffer.indexOf(10, 0);
  const end = newline === -1 ? bytesRead : newline;
  const line = buffer.toString("utf8", 0, end).replace(/\r$/, "");
  return { line, nextOffset: offset + end + (newline === -1 ? 0 : 1) };
}

function findIndexEntry(entries: IndexEntry[], id: string) {
  let low = 0;
  let high = entries.length - 1;
  let result = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (entries[middle].id <= id) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return result;
}

export async function readImdbRatingsForIds(
  filePath: string,
  ids: string[],
  indexPath = `${filePath}.idx.json`,
) {
  const ratings = new Map<string, ImdbRating>();
  const wanted = [...new Set(ids.filter((id) => /^tt\d+$/.test(id)))].sort();
  if (wanted.length === 0) return ratings;

  const sourceStats = await stat(filePath);
  const index = JSON.parse(await readFile(/*turbopackIgnore: true*/ indexPath, "utf8")) as RatingsIndex;
  if (
    index.version !== 1 ||
    index.sourceSize !== sourceStats.size ||
    index.sourceModifiedAt !== sourceStats.mtimeMs ||
    index.stride !== INDEX_STRIDE ||
    !Array.isArray(index.entries) ||
    index.entries.length === 0
  ) {
    throw new Error("IMDb ratings index is missing, stale, or invalid; rebuild it from the current TSV file.");
  }

  const buckets = new Map<number, string[]>();
  for (const id of wanted) {
    const entryIndex = findIndexEntry(index.entries, id);
    if (entryIndex === -1) continue;
    const group = buckets.get(entryIndex) ?? [];
    group.push(id);
    buckets.set(entryIndex, group);
  }

  const handle = await open(filePath, "r");
  try {
    for (const [entryIndex, bucketIds] of buckets) {
      const idsInBucket = new Set(bucketIds);
      const lastId = bucketIds[bucketIds.length - 1];
      let offset = index.entries[entryIndex].offset;

      while (idsInBucket.size > 0) {
        const record = await readLineAt(handle, offset);
        if (!record) break;
        offset = record.nextOffset;
        const [id, averageRatingText, numVotesText] = record.line.split("\t");
        if (!id || id > lastId) break;
        if (!idsInBucket.delete(id)) continue;

        const averageRating = Number(averageRatingText);
        const numVotes = Number(numVotesText);
        if (Number.isFinite(averageRating) && Number.isInteger(numVotes) && numVotes >= 0) {
          ratings.set(id, { averageRating, numVotes });
        }
      }
    }
  } finally {
    await handle.close();
  }
  return ratings;
}

export async function getImdbRatings(ids: string[]) {
  const filePath = process.env.IMDB_RATINGS_TSV?.trim();
  if (!filePath) return new Map<string, ImdbRating>();

  const indexPath = process.env.IMDB_RATINGS_INDEX?.trim() || `${filePath}.idx.json`;
  const cacheKey = `${filePath}|${indexPath}`;
  let ratings = ratingsCache.get(cacheKey);
  if (!ratings) {
    ratings = await readImdbRatingsForIds(filePath, ids, indexPath);
    ratingsCache.set(cacheKey, ratings);
    return ratings;
  }

  const missingIds = ids.filter((id) => !ratings?.has(id));
  if (missingIds.length > 0) {
    const additionalRatings = await readImdbRatingsForIds(filePath, missingIds, indexPath);
    for (const [id, rating] of additionalRatings) ratings.set(id, rating);
  }
  return new Map(ids.flatMap((id) => {
    const rating = ratings?.get(id);
    return rating ? [[id, rating] as const] : [];
  }));
}
