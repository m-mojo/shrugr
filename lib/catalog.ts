import type { Delivery, Mood, RecommendationFilm, Visual } from "./recommendation";
import tmdbMetadata from "../data/tmdb-metadata.json";

export type Film = RecommendationFilm & {
  slug: string;
  year: number;
  poster: string;
  palette: string;
  genres: string[];
  moods: Mood[];
  delivery: Delivery[];
  visual: Visual[];
  interruption: number | null;
  genericProfile?: boolean;
  isLive?: boolean;
  note: string;
  reason: string;
  tmdbId?: number;
  overview?: string;
};

type ImportedMetadata = {
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterPath: string | null;
  genres: string[];
  overview: string;
  importedAt: string;
};

/** Local seed records remain the fallback until the managed catalog is connected. */
const editorialFilms: Film[] = [
  { slug: "the-grand-budapest-hotel", title: "The Grand Budapest Hotel", year: 2014, runtime: 100, poster: "https://image.tmdb.org/t/p/w780/eWdyYQreja6JGCzqhwf5Ywq3q4D.jpg", palette: "poster-pink", genres: ["Comedy", "Adventure"], moods: ["unwind", "feel"], delivery: ["simple", "hooked"], visual: ["composed", "energy"], interruption: 4, note: "Let the details wash over you. This little storybook has a place for every wandering thought.", providers: ["Disney+", "Prime Video"], reason: "A playful, chaptered story with a world you can sink into without working too hard." },
  { slug: "knives-out", title: "Knives Out", year: 2019, runtime: 131, poster: "https://image.tmdb.org/t/p/w780/pThyQovXQrw2m0s9x82twj48Jq4.jpg", palette: "poster-gold", genres: ["Mystery", "Comedy"], moods: ["hyped", "learn", "feel"], delivery: ["hooked", "simple"], visual: ["composed", "energy"], interruption: 4, note: "You don't have to solve it before Benoit Blanc does. Just enjoy the deliciously messy family along the way.", providers: ["Netflix", "Prime Video"], reason: "Quick dialogue and a satisfying mystery keep the evening moving." },
  { slug: "arrival", title: "Arrival", year: 2016, runtime: 116, poster: "https://image.tmdb.org/t/p/w780/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", palette: "poster-blue", genres: ["Sci-Fi", "Drama"], moods: ["feel", "escape", "learn"], delivery: ["soak", "brain"], visual: ["grounded", "raw"], interruption: 3, note: "You can let the questions stay questions for a while. Pay attention to how it feels, and the pieces will find each other.", providers: ["Paramount+", "Prime Video"], reason: "A thoughtful, immersive pace matches a curious mood and a little breathing room." },
  { slug: "spider-man-into-the-spider-verse", title: "Spider-Man: Into the Spider-Verse", year: 2018, runtime: 117, poster: "https://image.tmdb.org/t/p/w780/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", palette: "poster-purple", genres: ["Animation", "Action"], moods: ["hyped", "escape", "unwind"], delivery: ["hooked", "simple"], visual: ["energy", "composed"], interruption: 4, note: "No need to catch every frame. Let the color and the music do their thing—you'll find your way into it.", providers: ["Disney+", "Netflix"], reason: "Big visual energy, clear stakes, and a joyful pace make this an easy yes." },
  { slug: "chef", title: "Chef", year: 2014, runtime: 115, poster: "https://image.tmdb.org/t/p/w780/7h6TqPB3ESmjuVbxCxAeB1c9OB1.jpg", palette: "poster-orange", genres: ["Comedy", "Drama"], moods: ["unwind", "feel"], delivery: ["simple", "soak"], visual: ["raw", "grounded"], interruption: 5, note: "Take it at your own pace. This is a warm, low-stakes hangout with a very good soundtrack and no wrong way to watch.", providers: ["Netflix", "Prime Video"], reason: "A warm, linear story that feels like a deep breath after a long day." },
  { slug: "mad-max-fury-road", title: "Mad Max: Fury Road", year: 2015, runtime: 121, poster: "https://image.tmdb.org/t/p/w780/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", palette: "poster-red", genres: ["Action", "Adventure"], moods: ["hyped", "escape"], delivery: ["hooked"], visual: ["energy", "raw"], interruption: 3, note: "Settle in and let the momentum carry you. The story is in the movement as much as the words.", providers: ["Max", "Prime Video"], reason: "Pure forward motion for when you want your attention completely captured." },
  { slug: "perfect-blue", title: "Perfect Blue", year: 1997, runtime: 81, poster: "https://image.tmdb.org/t/p/w780/6WTiOCfDPP8XV4jqfloiVWf7b3b.jpg", palette: "poster-violet", genres: ["Animation", "Thriller"], moods: ["escape", "feel"], delivery: ["brain", "hooked"], visual: ["composed", "energy"], interruption: 2, note: "Don't worry about pinning down what's real right away. Let the unease settle in and trust the film to take you somewhere.", providers: ["MUBI", "Criterion"], reason: "A compact, mind-bending watch with a carefully controlled visual world." },
  { slug: "before-sunrise", title: "Before Sunrise", year: 1995, runtime: 101, poster: "https://image.tmdb.org/t/p/w780/6o9y0xZ5Ghg3v1wXg9es5R7qYqD.jpg", palette: "poster-dusk", genres: ["Romance", "Drama"], moods: ["feel", "unwind"], delivery: ["soak"], visual: ["grounded", "raw"], interruption: 4, note: "There's nowhere else to be. Just walk along with them and let the conversation take the scenic route.", providers: ["Criterion", "Prime Video"], reason: "An intimate, unhurried conversation that rewards a relaxed evening." },
  { slug: "the-social-network", title: "The Social Network", year: 2010, runtime: 120, poster: "https://image.tmdb.org/t/p/w780/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg", palette: "poster-teal", genres: ["Drama"], moods: ["hyped", "learn"], delivery: ["hooked"], visual: ["composed", "raw"], interruption: 3, note: "You don't need to keep score of every sharp exchange. Let the rhythm of the conversation pull you along.", providers: ["Netflix", "Prime Video"], reason: "Relentless dialogue and brisk scenes make a smart story feel electric." },
  { slug: "paddington-2", title: "Paddington 2", year: 2017, runtime: 104, poster: "https://image.tmdb.org/t/p/w780/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg", palette: "poster-orange", genres: ["Family", "Comedy"], moods: ["unwind", "feel"], delivery: ["simple"], visual: ["composed", "grounded"], interruption: 5, note: "You are allowed to enjoy something kind. Let this be a small, marmalade-scented reset.", providers: ["Max", "Netflix"], reason: "A bright, beautifully clear story with a generous heart and gentle stakes." },
  { slug: "everything-everywhere-all-at-once", title: "Everything Everywhere All at Once", year: 2022, runtime: 140, poster: "https://image.tmdb.org/t/p/w780/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", palette: "poster-rainbow", genres: ["Sci-Fi", "Adventure"], moods: ["escape", "feel", "hyped"], delivery: ["brain", "hooked"], visual: ["energy", "raw"], interruption: 2, note: "It gets gloriously chaotic. You don't have to hold every universe in your head—follow the feeling back home.", providers: ["Showtime", "Prime Video"], reason: "A maximalist, shape-shifting ride for when you want to be fully transported." },
  { slug: "lost-in-translation", title: "Lost in Translation", year: 2003, runtime: 102, poster: "https://image.tmdb.org/t/p/w780/4k4YzP9z9bP4g4G4f3g9b4V1j4P.jpg", palette: "poster-dusk", genres: ["Drama", "Romance"], moods: ["unwind", "feel"], delivery: ["soak"], visual: ["grounded", "raw"], interruption: 4, note: "You don't have to name the feeling. Sit in the in-between with them for a little while.", providers: ["MUBI", "Prime Video"], reason: "Quiet, atmospheric, and unhurried—a soft landing for a low-key night." },
];

const importedMetadata = tmdbMetadata as Record<string, ImportedMetadata>;
export const films: Film[] = editorialFilms.map((film) => {
  const imported = importedMetadata[film.slug];
  if (!imported) return film;

  return {
    ...film,
    tmdbId: imported.tmdbId,
    title: imported.title || film.title,
    year: imported.year ?? film.year,
    runtime: imported.runtime ?? film.runtime,
    poster: imported.posterPath ? `https://image.tmdb.org/t/p/w780${imported.posterPath}` : film.poster,
    genres: imported.genres.length > 0 ? imported.genres : film.genres,
    overview: imported.overview,
  };
});

export const filmBySlug = (slug: string) => films.find((film) => film.slug === slug);
