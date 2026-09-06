import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/home/hero";
import { Footer } from "@/components/footer";
import { Transformation } from "@/components/home/transformation";
import { Features } from "@/components/home/features";
import { Pricing } from "@/components/home/pricing";
import { Faq } from "@/components/home/faq";
import { getOrigin } from "@/lib/url";
import { SmoothScroll } from "@/components/smooth-scroll";
import { APP_NAME } from "@/config";
import { metatag } from "@/lib/metatag";

export const generateMetadata = () => {
  return metatag({
    title: `${APP_NAME} | Every screenshot deserves to be remembered`,
    description:  "Drop any screenshot, pick a style, and export a beautiful image in seconds. Free to use, or upgrade to Lifetime Pro for cloud sync and 4K export.",
  });
};

export default async function Home() {
  const origin = await getOrigin();
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: APP_NAME,
    url: origin,
    description:
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Free to use, or upgrade to Lifetime Pro.",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "29.00", priceCurrency: "USD" },
  });

  return (
    <main>
      <SmoothScroll />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Navbar />
      <Hero />
      <Transformation />
      <Features />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
