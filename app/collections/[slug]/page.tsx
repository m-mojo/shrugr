import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editorialCollections, getCollection } from "../../../lib/seo-pages";

const siteUrl = "https://shrugr.de5.net";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return editorialCollections.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};

  const url = `${siteUrl}/collections/${collection.slug}`;
  return {
    title: `${collection.title} — Shrugr`,
    description: collection.description,
    alternates: { canonical: url },
    openGraph: { title: `${collection.title} — Shrugr`, description: collection.description, url, type: "website", images: [`${url}/opengraph-image`] },
    twitter: { card: "summary_large_image", title: collection.title, description: collection.description, images: [`${url}/opengraph-image`] },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const url = `${siteUrl}/collections/${collection.slug}`;
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.title,
    description: collection.description,
    numberOfItems: collection.films.length,
    itemListElement: collection.films.map((film, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/films/${film.slug}`,
      item: { "@type": "Movie", name: film.title, image: film.poster, datePublished: `${film.year}` },
    })),
    url,
  };

  return (
    <main className="editorial-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }} />
      <header className="editorial-topbar"><Link href="/" className="editorial-brand">shrugr<span>.</span></Link><Link href="/collections">All collections</Link></header>
      <article className="collection-page">
        <p className="editorial-kicker">A SHRUGR COLLECTION</p>
        <h1>{collection.title}</h1>
        <p className="editorial-lede">{collection.intro}</p>
        <div className="film-list">
          {collection.films.map((film) => <Link className="film-list-card" href={`/films/${film.slug}`} key={film.slug}>
            <Image src={film.poster} alt={`${film.title} poster`} width={180} height={270} />
            <span className="film-list-copy"><b>{film.title}</b><small>{film.year} · {film.runtime} min · {film.genres.join(" / ")}</small><span>{film.reason}</span></span>
            <span aria-hidden="true" className="film-list-arrow">→</span>
          </Link>)}
        </div>
        <p className="editorial-disclaimer">Availability varies by region and is not verified by Shrugr.</p>
        <Link href="/" className="primary-button editorial-cta">Find a film for tonight <span aria-hidden="true">→</span></Link>
      </article>
      <footer className="editorial-footer"><Link href="/collections">All collections</Link><Link href="/">Back to Shrugr</Link></footer>
    </main>
  );
}
