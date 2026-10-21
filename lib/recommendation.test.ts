import test from "node:test";
import assert from "node:assert/strict";

import { buildRecommendationChoices, pickRecommendation, type Film } from "./recommendation";

const films: Film[] = [
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
