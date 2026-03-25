import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/home/hero";
import { Gallery } from "@/components/home/gallery";
import { Footer } from "@/components/footer";
import { getOrigin } from "@/lib/url";
import { Features } from "@/components/home/features";
import { HowItWorks } from "@/components/home/how-it-works";
import { Faq } from "@/components/home/faq";
import { SmoothScroll } from "@/components/smooth-scroll";
import { metatag } from "@/lib/metatag";
import { APP_NAME } from "@/config";


export const generateMetadata = () => {
  return metatag({
    title: `Editor | ${APP_NAME}`,
    description:
      "Beautify your screenshots with gradient backgrounds, mesh gradients, shadows, noise texture, perspective tilt, and more. Export in PNG or JPG at up to 3x scale.",
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
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Zero signup, totally free.",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
      <Gallery />
      <HowItWorks />
      <Features />
      <Faq />
      <Footer />
    </main>
  );
}
