import assert from "node:assert/strict";
import test from "node:test";
import { films } from "./catalog";
import { editorialCollections, getCollection } from "./seo-pages";

test("catalog slugs are unique and every SEO collection points to catalog films", () => {
  assert.equal(new Set(films.map((film) => film.slug)).size, films.length);

  for (const { slug } of editorialCollections) {
    const collection = getCollection(slug);
    assert.ok(collection, `Expected collection ${slug} to resolve`);
    assert.ok(collection.films.length > 0, `Expected collection ${slug} to have films`);
    assert.equal(collection.films.length, collection.filmSlugs.length);
  }
});

test("curated editorial tags and copy remain present in the TMDB-backed catalog", () => {
  for (const film of films) {
    assert.ok(film.note, `${film.title} should retain its editorial note`);
    assert.ok(film.reason, `${film.title} should retain its editorial reason`);
    assert.ok(film.moods.length > 0, `${film.title} should retain editorial mood tags`);
  }
});
