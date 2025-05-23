import { useEffect } from "react";
import { useLocation } from "wouter";

import { MainLayout } from "@/components/layouts/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { AISection } from "@/components/home/ai-section";
import { LibraryPreviewSection } from "@/components/learning/library-preview-section";
import { CTASection } from "@/components/home/cta-section";

export default function HomePage() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = location.split("#")[1];

    if (hash) {
      const el = document.getElementById(hash);

      if (el) {
        // Delay to let layout finalize before scrolling
        const timeoutId = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);

        // Cleanup in case component unmounts quickly
        return () => clearTimeout(timeoutId);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  return (
    <MainLayout>
      <main className="min-h-screen bg-dark-base flex flex-col">
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <LibraryPreviewSection />
        <CTASection />
      </main>
    </MainLayout>
  );
}
