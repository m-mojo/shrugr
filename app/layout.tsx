import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./editorial.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shrugr.de5.net/"),
  alternates: { canonical: "/" },
  title: "shrugr — Find your next movie",
  description:
    "Find a movie for tonight by runtime, mood, and vibe. Shrugr searches live TMDB movie suggestions and helps you choose what fits your evening.",
  openGraph: {
    title: "shrugr — A movie for this exact moment",
    description: "Find a movie for tonight by runtime, mood, and vibe. Less scrolling, more watching.",
    url: "https://shrugr.de5.net/",
    siteName: "shrugr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "shrugr — Find a movie for tonight",
    description: "Choose a movie by your mood, available time, and vibe.",
  },
};

export const viewport: Viewport = {
  themeColor: "#11110f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
