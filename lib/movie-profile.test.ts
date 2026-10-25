import assert from "node:assert/strict";
import test from "node:test";
import { buildMovieProfile } from "./movie-profile";

test("broad fantasy and family genres do not imply curiosity, slow pacing, or composed visuals", () => {
  const profile = buildMovieProfile(["Comedy", "Family", "Fantasy"], "A teen faces a monster.", ["teenager", "monster"]);

  assert.equal(profile.moods.includes("learn"), false);
  assert.equal(profile.delivery.includes("soak"), false);
  assert.equal(profile.visual.includes("composed"), false);
});

test("plot and keyword clues can identify curiosity, slow pacing, and composed visuals", () => {
  const profile = buildMovieProfile(
    ["Drama"],
    "A reflective, slow burn follows a historian investigating a forgotten mystery.",
    ["historical investigation", "meticulous composition"],
  );

  assert.equal(profile.moods.includes("learn"), true);
  assert.equal(profile.delivery.includes("soak"), true);
  assert.equal(profile.visual.includes("composed"), true);
});
