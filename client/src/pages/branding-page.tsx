import React, { useState } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const brandColors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500'];

export default function BrandingPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Clipboard copy handler
  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 1500);
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">Branding Studio</h1>
          <p className="text-xl text-light-base/70 mb-12">
            Create and manage your brand identity
          </p>

          <Tabs defaultValue="colors" className="w-full" aria-label="Branding tabs">
            <TabsList className="mb-8">
              <TabsTrigger value="colors" aria-label="Brand Colors tab">Colors</TabsTrigger>
              <TabsTrigger value="typography" aria-label="Typography tab">Typography</TabsTrigger>
              <TabsTrigger value="logos" aria-label="Logos tab">Logos</TabsTrigger>
            </TabsList>

            {/* Colors */}
            <TabsContent value="colors">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {brandColors.map((color) => (
                      <button
                        key={color}
                        className="aspect-square rounded-lg border border-light-base/20 hover:scale-105 transition-transform relative"
                        style={{ backgroundColor: color }}
                        aria-label={`Copy color code ${color}`}
                        onClick={() => handleCopyColor(color)}
                        type="button"
                      >
                        {copiedColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center text-white font-bold bg-black bg-opacity-50 rounded-lg">
                            Copied!
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography */}
            <TabsContent value="typography">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Brand Typography</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm text-light-base/70 mb-2">Heading Font</h4>
                      <p
                        style={{ fontFamily: "Inter, sans-serif" }}
                        className="text-3xl font-semibold"
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm text-light-base/70 mb-2">Body Font</h4>
                      <p
                        style={{ fontFamily: "'Source Sans Pro', sans-serif" }}
                        className="text-lg"
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logos */}
            <TabsContent value="logos">
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center gap-6">
                  <h3 className="text-xl font-semibold mb-4">Brand Logos</h3>
                  <p className="text-light-base/70 mb-8">Upload or preview your brand logos here.</p>
                  <div className="flex gap-6">
                    {/* Placeholder logos */}
                    {[1, 2, 3].map((logo) => (
                      <div
                        key={logo}
                        className="w-32 h-32 bg-light-base/20 rounded-lg flex items-center justify-center text-light-base/50 font-mono text-xl"
                      >
                        Logo {logo}
                      </div>
                    ))}
                  </div>
                  {/* Could add file upload button here in the future */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}
