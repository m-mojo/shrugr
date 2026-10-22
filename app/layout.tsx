import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./editorial.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shrugr.ro.to"),
  title: "shrugr — Find your next movie",
  description:
    "A movie for this exact moment. Tell shrugr your mood, your time, and your vibe. Get one good answer, fast.",
  openGraph: {
    title: "shrugr — A movie for this exact moment",
    description: "Less scrolling. More watching.",
    url: "https://shrugr.ro.to",
    siteName: "shrugr",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#11110f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<aside className="tmdb-attribution">This product uses the TMDB API but is not endorsed or certified by TMDB.</aside></body>
    </html>
  );
}
