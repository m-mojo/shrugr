import { buildImdbRatingsIndex } from "../lib/imdb-ratings";

const filePath = process.argv[2];
if (!filePath) {
  throw new Error("Usage: npm run imdb:ratings:index -- <path-to-title.ratings.tsv>");
}

void buildImdbRatingsIndex(filePath).then((result) => {
  console.log(`Indexed ${result.rowCount.toLocaleString()} IMDb ratings into ${result.indexPath} (${result.indexEntries.toLocaleString()} index entries).`);
}).catch((error: unknown) => {
  console.error("Could not build IMDb ratings index.", error);
  process.exitCode = 1;
});
