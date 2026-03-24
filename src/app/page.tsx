import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/home/hero";
import { Gallery } from "@/components/home/gallery";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Gallery />
      <Footer />
    </main>
  );
}
