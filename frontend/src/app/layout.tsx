import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "LearnLens AI – From Any Question to a Verified, Interactive Learning Experience",
  description:
    "LearnLens AI helps students generate academic diagrams, understand uploaded study material, interact with AI-powered explanations, and verify educational content using Gemma 4.",
  keywords: ["educational AI", "diagram generator", "study assistant", "Gemma 4", "learning tool"],
  authors: [{ name: "LearnLens AI" }],
  openGraph: {
    title: "LearnLens AI",
    description: "AI-powered educational diagram generation and interactive learning.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
