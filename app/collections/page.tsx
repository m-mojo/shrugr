import type { Metadata } from "next";
import Link from "next/link";
import { editorialCollections, getCollection } from "../../lib/seo-pages";

const siteUrl = "https://shrugr.ro.to";

export const metadata: Metadata = {
  title: "Movie collections for your kind of night — Shrugr",
  description: "Small, human-curated movie lists for different moods, runtimes, and kinds of evenings.",
  alternates: { canonical: `${siteUrl}/collections` },
};

export default function CollectionsIndexPage() {
  const collections = editorialCollections.map(({ slug }) => getCollection(slug)).filter((collection) => collection !== undefined);
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Curated movie collections",
    itemListElement: collections.map((collection, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/collections/${collection.slug}`,
      name: collection.title,
    })),
  };

  return (
    <main className="editorial-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd).replace(/</g, "\\u003c") }} />
      <header className="editorial-topbar"><Link href="/" className="editorial-brand">shrugr<span>.</span></Link><Link href="/">Find a movie</Link></header>
      <section className="collection-index">
        <p className="editorial-kicker">A FEW GOOD DIRECTIONS</p>
        <h1>Pick a kind of night.</h1>
        <p className="editorial-lede">Small, considered lists to get you closer to the right film—with less scrolling.</p>
        <div className="collection-grid">
          {collections.map((collection) => <Link className="collection-card" href={`/collections/${collection.slug}`} key={collection.slug}>
            <span className="editorial-kicker">{collection.films.length} CURATED PICKS</span>
            <h2>{collection.title}</h2>
            <p>{collection.description}</p>
            <span className="collection-link">Explore collection →</span>
          </Link>)}
        </div>
      </section>
      <footer className="editorial-footer"><Link href="/">Back to Shrugr</Link></footer>
    </main>
  );
}
