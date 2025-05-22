// client/src/pages/home-page.tsx

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

  // Scroll to anchor on mount
  useEffect(() => {
    const handleScrollToHash = () => {
      if (typeof window === "undefined") return;

      const hash = location.split("#")[1];
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          // Wait a tick for layout to stabilize
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    handleScrollToHash();
  }, [location]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-dark-base">
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <LibraryPreviewSection />
        <CTASection />
      </div>
    </MainLayout>
  );
}
