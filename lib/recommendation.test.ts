import test from "node:test";
import assert from "node:assert/strict";

import { buildRecommendationChoices, pickRecommendation, recommendationIdentity, type RecommendationFilm } from "./recommendation";

const films: RecommendationFilm[] = [
  {
    title: "Alpha",
    runtime: 90,
    moods: ["unwind"],
    delivery: ["simple"],
    visual: ["grounded"],
    interruption: 5,
    providers: ["Netflix"],
    genres: ["Drama"],
    year: 2020,
    note: "Chill",
    reason: "A soft reset.",
  },
  {
    title: "Bravo",
    runtime: 110,
    moods: ["unwind"],
    delivery: ["simple"],
    visual: ["grounded"],
    interruption: 4,
    providers: ["Netflix"],
    genres: ["Comedy"],
    year: 2019,
    note: "Warm",
    reason: "A gentle evening.",
  },
  {
    title: "Charlie",
    runtime: 140,
    moods: ["hyped"],
    delivery: ["hooked"],
    visual: ["energy"],
    interruption: 2,
    providers: ["Prime Video"],
    genres: ["Action"],
    year: 2021,
    note: "Big energy",
    reason: "Fast and loud.",
  },
];

test("hard filters remove unavailable providers and runtimes", () => {
  const matches = buildRecommendationChoices({
    films,
    providers: ["Netflix"],
    runtime: "medium",
    interruptions: false,
    mood: null,
    delivery: null,
    visual: null,
    seen: [],
  });

  assert.deepEqual(
    matches.map((film) => film.title),
    ["Bravo", "Alpha"],
  );
});

test("soft preferences rank matches without filtering out valid films", () => {
  const matches = buildRecommendationChoices({
    films,
    providers: ["Netflix"],
    runtime: "any",
    interruptions: false,
    mood: "hyped",
    delivery: "hooked",
    visual: "energy",
    seen: [],
  });

  assert.deepEqual(matches.map((film) => film.title), ["Alpha", "Bravo"]);
});

test("seen titles are excluded and score prefers stronger matches", () => {
  const matches = buildRecommendationChoices({
    films,
    providers: ["Netflix"],
    runtime: "any",
    interruptions: false,
    mood: "unwind",
    delivery: "simple",
    visual: "grounded",
    seen: ["Alpha"],
  });

  assert.deepEqual(matches.map((film) => film.title), ["Bravo"]);
});

test("previously recommended TMDB IDs stay excluded when the title changes", () => {
  const firstPick = { title: "Same title", tmdbId: 42, runtime: 100, providers: [] };
  const alternateTitle = { ...firstPick, title: "Localized title" };
  const unseen = { title: "Fresh film", tmdbId: 43, runtime: 100, providers: [] };

  assert.deepEqual(
    buildRecommendationChoices({
      films: [alternateTitle, unseen],
      providers: [],
      runtime: "any",
      interruptions: false,
      mood: null,
      delivery: null,
      visual: null,
      seen: [recommendationIdentity(firstPick)],
    }),
    [unseen],
  );
});

test("empty match states are handled gracefully", () => {
  const matches = buildRecommendationChoices({
    films,
    providers: ["Hulu"],
    runtime: "short",
    interruptions: true,
    mood: "unwind",
    delivery: "simple",
    visual: "grounded",
    seen: [],
  });

  assert.equal(matches.length, 0);
  assert.equal(pickRecommendation(matches, null), null);
});

test("unknown provider and interruption data do not exclude live candidates", () => {
  const liveFilm: RecommendationFilm = {
    title: "Live suggestion",
    runtime: 102,
    providers: [],
    providerAvailabilityKnown: false,
    interruption: null,
  };

  const matches = buildRecommendationChoices({
    films: [liveFilm],
    providers: ["Netflix"],
    runtime: "medium",
    interruptions: true,
    mood: null,
    delivery: null,
    visual: null,
    seen: [],
  });

  assert.deepEqual(matches, [liveFilm]);
});

test("top-rated mode ranks vibe fit before using TMDB ratings as a tie-breaker", () => {
  const ratedFilms: RecommendationFilm[] = [
    { title: "Highest rated", runtime: 100, voteAverage: 9.1, providers: [] },
    { title: "Best vibe match", runtime: 100, voteAverage: 8.5, moods: ["learn"], delivery: ["soak"], visual: ["composed"], providers: [] },
    { title: "Lower vibe match", runtime: 100, voteAverage: 8.5, providers: [] },
  ];
  const matches = buildRecommendationChoices({
    films: ratedFilms,
    providers: [],
    runtime: "any",
    interruptions: false,
    mood: "learn",
    delivery: "soak",
    visual: "composed",
    discoveryMode: "top-rated",
    seen: [],
  });

  assert.deepEqual(matches.map((film) => film.title), ["Best vibe match", "Highest rated", "Lower vibe match"]);
});

test("IMDb top-rated mode ranks vibe fit before using IMDb ratings as a tie-breaker", () => {
  const ratedFilms: RecommendationFilm[] = [
    { title: "Highest IMDb rating", runtime: 100, imdbRating: 9.4, providers: [] },
    { title: "Best vibe match", runtime: 100, imdbRating: 8.2, moods: ["learn"], delivery: ["soak"], visual: ["composed"], providers: [] },
    { title: "Second-best vibe match", runtime: 100, imdbRating: 8.8, moods: ["learn"], delivery: ["soak"], providers: [] },
  ];
  const matches = buildRecommendationChoices({
    films: ratedFilms,
    providers: [],
    runtime: "any",
    interruptions: false,
    mood: "learn",
    delivery: "soak",
    visual: "composed",
    discoveryMode: "top-rated-imdb",
    seen: [],
  });

  assert.deepEqual(matches.map((film) => film.title), ["Best vibe match", "Second-best vibe match", "Highest IMDb rating"]);
});
