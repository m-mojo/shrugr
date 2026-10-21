export type Mood = "unwind" | "learn" | "hyped" | "feel" | "escape";
export type Delivery = "hooked" | "soak" | "brain" | "simple";
export type Visual = "energy" | "raw" | "composed" | "grounded";
export type RuntimeChoice = "short" | "medium" | "long" | "any";

export type RecommendationFilm = {
  title: string;
  runtime: number;
  moods?: Mood[];
  delivery?: Delivery[];
  visual?: Visual[];
  interruption?: number;
  providers: string[];
  year?: number;
  genres?: string[];
  note?: string;
  reason?: string;
};

export type RecommendationOptions<T extends RecommendationFilm = RecommendationFilm> = {
  films: T[];
  providers: string[];
  runtime: RuntimeChoice;
  interruptions: boolean;
  mood: Mood | null;
  delivery: Delivery | null;
  visual: Visual | null;
  seen: string[];
};

function runtimeWindowMatches<T extends RecommendationFilm>(film: T, runtime: RuntimeChoice) {
  if (runtime === "any") return true;
  if (runtime === "short") return film.runtime < 90;
  if (runtime === "medium") return film.runtime >= 90 && film.runtime <= 120;
  return film.runtime > 120;
}

function runtimeSortValue<T extends RecommendationFilm>(film: T, runtime: RuntimeChoice) {
  if (runtime === "short") return 90 - film.runtime;
  if (runtime === "medium") return Math.abs(105 - film.runtime);
  if (runtime === "long") return film.runtime;
  return 0;
}

export function scoreCandidate<T extends RecommendationFilm>(film: T, options: RecommendationOptions<T>) {
  const { providers, interruptions, mood, delivery, visual } = options;

  return (
    (mood && (film.moods ?? []).includes(mood) ? 5 : 0) +
    (delivery && (film.delivery ?? []).includes(delivery) ? 4 : 0) +
    (visual && (film.visual ?? []).includes(visual) ? 3 : 0) +
    (interruptions ? (film.interruption ?? 0) : 0) +
    (providers.length > 0 && film.providers.some((provider) => providers.includes(provider)) ? 2 : 0)
  );
}

export function buildRecommendationChoices<T extends RecommendationFilm>(options: RecommendationOptions<T>): T[] {
  const { films, providers, runtime, interruptions, mood, delivery, visual, seen } = options;

  return films
    .filter((film) => {
      const matchesProvider = providers.length === 0 || film.providers.some((provider) => providers.includes(provider));
      const runtimeMatches = runtimeWindowMatches(film, runtime);
      const pauseFriendly = !interruptions || (film.interruption ?? 0) >= 4;
      const unseen = !seen.includes(film.title);

      return matchesProvider && runtimeMatches && pauseFriendly && unseen;
    })
    .sort((a, b) => {
      const scoreDelta = scoreCandidate(b, options) - scoreCandidate(a, options);
      if (scoreDelta !== 0) return scoreDelta;

      const runtimeDelta = runtimeSortValue(a, runtime) - runtimeSortValue(b, runtime);
      if (runtimeDelta !== 0) return runtimeDelta;

      if (mood && (a.moods ?? []).includes(mood) && !(b.moods ?? []).includes(mood)) return -1;
      if (mood && !(a.moods ?? []).includes(mood) && (b.moods ?? []).includes(mood)) return 1;
      if (delivery && (a.delivery ?? []).includes(delivery) && !(b.delivery ?? []).includes(delivery)) return -1;
      if (delivery && !(a.delivery ?? []).includes(delivery) && (b.delivery ?? []).includes(delivery)) return 1;
      if (visual && (a.visual ?? []).includes(visual) && !(b.visual ?? []).includes(visual)) return -1;
      if (visual && !(a.visual ?? []).includes(visual) && (b.visual ?? []).includes(visual)) return 1;
      return 0;
    });
}

export function pickRecommendation<T extends { title: string }>(matches: T[], current: T | null) {
  const withoutCurrent = matches.filter((film) => film.title !== current?.title);
  return withoutCurrent[0] ?? matches[0] ?? null;
}
