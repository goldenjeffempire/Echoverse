
import { MainLayout } from "@/components/layouts/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { AISection } from "@/components/home/ai-section";
import { LibraryPreviewSection } from "@/components/learning/library-preview-section";
import { CTASection } from "@/components/home/cta-section";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const [location, setLocation] = useLocation();
  
  // Handle anchor links smoothly
  useEffect(() => {
    // Check if there's a hash in the URL
    if (location.includes('#')) {
      const id = location.split('#')[1];
      const element = document.getElementById(id);
      if (element) {
        // Add a small delay to ensure the page is fully loaded
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      // If no hash, scroll to top
      window.scrollTo(0, 0);
    }
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
