import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { filmBySlug, films } from "../../../lib/catalog";

const siteUrl = "https://shrugr.de5.net";

type FilmPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return films.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: FilmPageProps): Promise<Metadata> {
  const { slug } = await params;
  const film = filmBySlug(slug);
  if (!film) return {};

  const title = `${film.title} (${film.year}) — Shrugr`;
  const synopsis = film.overview?.trim();
  const description = synopsis
    ? `${film.title} (${film.year}): ${synopsis}`.slice(0, 300)
    : `${film.reason} ${film.runtime}-minute ${film.genres.join(" and ")} film. Explore why it might fit your night.`;
  const url = `${siteUrl}/films/${film.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", images: [`${url}/opengraph-image`] },
    twitter: { card: "summary_large_image", title, description, images: [`${url}/opengraph-image`] },
  };
}

export default async function FilmPage({ params }: FilmPageProps) {
  const { slug } = await params;
  const film = filmBySlug(slug);
  if (!film) notFound();

  const url = `${siteUrl}/films/${film.slug}`;
  const movieJsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: film.title,
    datePublished: `${film.year}`,
    duration: `PT${film.runtime}M`,
    genre: film.genres,
    image: film.poster,
    description: film.reason,
    url,
  };
  const safeJsonLd = JSON.stringify(movieJsonLd).replace(/</g, "\\u003c");

  return (
    <main className="editorial-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <header className="editorial-topbar"><Link href="/" className="editorial-brand">shrugr<span>.</span></Link><Link href="/collections">Explore picks</Link></header>
      <article className="film-editorial">
        <div className="film-editorial-poster"><Image src={film.poster} alt={`${film.title} poster`} width={780} height={1170} priority /></div>
        <div className="film-editorial-copy">
          <p className="editorial-kicker">A SHRUGR FILM NOTE</p>
          <h1>{film.title}</h1>
          <p className="editorial-meta">{film.year} <span>·</span> {film.runtime} min <span>·</span> {film.genres.join(" / ")}</p>
          <p className="editorial-lede">{film.reason}</p>
          {film.overview && <section className="editorial-synopsis"><h2>About the film</h2><p>{film.overview}</p></section>}
          <section className="editorial-note"><h2>A little permission</h2><p>{film.note}</p></section>
          <p className="editorial-disclaimer">Streaming availability changes by region and is not verified here. Check your services directly.</p>
          <Link href="/" className="primary-button editorial-cta">Find a film for tonight <span aria-hidden="true">→</span></Link>
        </div>
      </article>
      <footer className="editorial-footer"><Link href="/collections">Browse curated collections</Link><Link href="/">Back to Shrugr</Link></footer>
    </main>
  );
}
