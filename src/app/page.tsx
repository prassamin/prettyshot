import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/home/hero";
import { Gallery } from "@/components/home/gallery";
import { Footer } from "@/components/footer";
import { getOrigin } from "@/lib/url";

export const metadata: Metadata = {
  title: "PrettyShot | Make your screenshots look stunning",
  description:
    "Drop any screenshot, pick a style, and export a beautiful image in seconds. Gradient backgrounds, shadows, noise, perspective, zero signup, totally free.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const origin = await getOrigin();
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PrettyShot",
    url: origin,
    description:
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Zero signup, totally free.",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Navbar />
      <Hero />
      <Gallery />
      <Footer />
    </main>
  );
}
