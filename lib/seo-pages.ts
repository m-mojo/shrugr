import { films } from "./catalog";

export type EditorialCollection = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  filmSlugs: string[];
};

/** Start with a few human-reviewed pages rather than generating thin filter combinations. */
export const editorialCollections: EditorialCollection[] = [
  {
    slug: "movies-under-two-hours",
    title: "Movies under two hours",
    description: "A curated set of movies under two hours for a complete story that leaves a little more room in your evening.",
    intro: "A shorter runtime can still leave room for a big feeling. These curated picks are all under two hours, with distinct moods and styles to choose from.",
    filmSlugs: ["perfect-blue", "the-grand-budapest-hotel", "before-sunrise", "arrival", "chef", "paddington-2", "lost-in-translation"],
  },
  {
    slug: "warm-movies-to-unwind",
    title: "Warm movies to unwind with",
    description: "Gentle, feel-good movie picks for a softer landing at the end of the day.",
    intro: "When the day has taken enough out of you, a warm and welcoming story can help you settle in. Start with one of these curated picks.",
    filmSlugs: ["chef", "paddington-2", "the-grand-budapest-hotel"],
  },
  {
    slug: "thoughtful-sci-fi-movies",
    title: "Thoughtful science-fiction movies",
    description: "Curious, transporting science-fiction picks with ideas and atmosphere to stay with you.",
    intro: "For a night when you want to leave the everyday behind and bring back a question or two, these science-fiction stories offer different kinds of wonder.",
    filmSlugs: ["arrival", "everything-everywhere-all-at-once"],
  },
];

export function getCollection(slug: string) {
  const collection = editorialCollections.find((item) => item.slug === slug);
  if (!collection) return undefined;

  return {
    ...collection,
    films: collection.filmSlugs
      .map((filmSlug) => films.find((film) => film.slug === filmSlug))
      .filter((film) => film !== undefined),
  };
}
