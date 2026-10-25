import type { Delivery, Mood, Visual } from "./recommendation";

type MovieProfile = {
  moods: Mood[];
  delivery: Delivery[];
  visual: Visual[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(` ${normalize(term)} `));
}

export function buildMovieProfile(genres: string[], overview: string, keywords: string[]): MovieProfile {
  const normalizedGenres = new Set(genres.map(normalize));
  const genreHas = (...names: string[]) => names.some((name) => normalizedGenres.has(normalize(name)));
  const text = ` ${normalize([...keywords, overview].join(" "))} `;
  const textHas = (...terms: string[]) => matchesAny(text, terms);

  const moods: Mood[] = [];
  if (
    genreHas("Comedy", "Family", "Romance", "Music") ||
    textHas("feel good", "heartwarming", "lighthearted", "comfort", "friendship")
  ) moods.push("unwind");
  if (
    genreHas("Documentary", "History") ||
    textHas("historical", "investigation", "scientist", "research", "biography", "philosophical", "educational")
  ) moods.push("learn");
  if (
    genreHas("Action", "Adventure", "Thriller", "War") ||
    textHas("high stakes", "race against time", "action packed", "survival", "fast paced", "chase")
  ) moods.push("hyped");
  if (
    genreHas("Drama", "Romance", "Music") ||
    textHas("coming of age", "grief", "loss", "heartfelt", "family conflict", "love story")
  ) moods.push("feel");
  if (
    genreHas("Fantasy", "Science Fiction", "Animation", "Adventure") ||
    textHas("alternate reality", "otherworldly", "time travel", "magical world", "outer space")
  ) moods.push("escape");

  const delivery: Delivery[] = [];
  if (
    genreHas("Action", "Adventure", "Thriller") ||
    textHas("suspenseful", "race against time", "plot twist", "high stakes", "fast paced", "murder mystery")
  ) delivery.push("hooked");
  if (
    textHas("slow burn", "meditative", "contemplative", "atmospheric", "quiet", "reflective", "intimate", "character study", "slice of life", "unhurried")
  ) delivery.push("soak");
  if (
    textHas("mind bending", "nonlinear", "time loop", "psychological puzzle", "conspiracy", "philosophical", "complex mystery")
  ) delivery.push("brain");
  if (
    genreHas("Comedy", "Family", "Animation") ||
    textHas("lighthearted", "feel good", "family friendly", "straightforward", "easygoing")
  ) delivery.push("simple");

  const visual: Visual[] = [];
  if (
    genreHas("Action", "Adventure", "Animation", "Music") ||
    textHas("kinetic", "vibrant", "colorful", "visual spectacle", "dynamic imagery")
  ) visual.push("energy");
  if (textHas("gritty", "handheld", "naturalistic", "social realism", "raw realism", "documentary style")) {
    visual.push("raw");
  }
  if (
    textHas("symmetrical", "meticulous composition", "precise framing", "stop motion", "visually stylized", "surreal imagery", "elaborate production design")
  ) visual.push("composed");
  if (
    genreHas("Documentary") ||
    textHas("realistic", "based on a true story", "slice of life", "everyday life", "grounded drama")
  ) visual.push("grounded");

  return { moods, delivery, visual };
}
