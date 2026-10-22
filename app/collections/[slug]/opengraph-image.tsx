import { ImageResponse } from "next/og";
import { getCollection } from "../../../lib/seo-pages";

export const alt = "Shrugr curated movie collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ImageProps = { params: Promise<{ slug: string }> };

export default async function OpenGraphImage({ params }: ImageProps) {
  const { slug } = await params;
  const collection = getCollection(slug);
  const title = collection?.title ?? "A few good directions";
  const subtitle = collection ? `${collection.films.length} considered picks for your kind of night` : "Less scrolling. More watching.";

  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: "72px", color: "#f3f0e8", background: "radial-gradient(circle at 78% 20%, #4c5940, transparent 35%), linear-gradient(135deg, #11110f, #24251e)",
      fontFamily: "sans-serif",
    }}>
      <div style={{ color: "#c6e27a", fontSize: 30, letterSpacing: 8 }}>SHRUGR<span style={{ color: "#f3f0e8" }}>.</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
        <div style={{ color: "#c6e27a", fontSize: 20, letterSpacing: 5 }}>A FEW GOOD DIRECTIONS</div>
        <div style={{ fontFamily: "serif", fontSize: 74, lineHeight: 1.08 }}>{title}</div>
        <div style={{ color: "#c4c1b6", fontSize: 28 }}>{subtitle}</div>
      </div>
      <div style={{ color: "#aaa99e", fontSize: 20 }}>Less scrolling. More watching.</div>
    </div>,
    size,
  );
}
