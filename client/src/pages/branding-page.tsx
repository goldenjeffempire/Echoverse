import { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Logo from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";

export default function BrandingPage() {
  const { user } = useAuth();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const colorPalette = [
    { name: "Primary", color: "#4A25AA", variable: "var(--primary)" },
    { name: "Primary Light", color: "#6D48D7", variable: "var(--primary-light)" },
    { name: "Primary Dark", color: "#3A1D87", variable: "var(--primary-dark)" },
    { name: "Secondary", color: "#2563EB", variable: "var(--secondary)" },
    { name: "Secondary Light", color: "#3B82F6", variable: "var(--secondary-light)" },
    { name: "Secondary Dark", color: "#1D4ED8", variable: "var(--secondary-dark)" },
    { name: "Accent Purple", color: "#A855F7", variable: "var(--accent-purple)" },
    { name: "Accent Cyan", color: "#22D3EE", variable: "var(--accent-cyan)" },
    { name: "Accent Pink", color: "#EC4899", variable: "var(--accent-pink)" },
  ];

  const gradients = [
    { name: "Gradient Cosmic", class: "bg-gradient-cosmic" },
    { name: "Gradient Purple", class: "bg-gradient-purple" },
    { name: "Gradient Blue", class: "bg-gradient-blue" },
    { name: "Gradient Pink", class: "bg-gradient-pink" },
  ];

  const typography = [
    { name: "Display H1", class: "text-4xl font-display font-bold", sample: "Echoverse" },
    { name: "Display H2", class: "text-3xl font-display font-bold", sample: "AI-Native Platform" },
    { name: "Display H3", class: "text-2xl font-display font-bold", sample: "Modular Design" },
    { name: "Body Large", class: "text-xl font-sans", sample: "Build, learn, sell, and grow with AI" },
    { name: "Body Medium", class: "text-base font-sans", sample: "Echoverse is the ultimate platform for creators" },
    { name: "Body Small", class: "text-sm font-sans", sample: "Leverage AI tools to enhance your workflow" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const LogoDisplay = () => (
    <div className="space-y-8">
      <div className="bg-dark-card p-8 rounded-xl border border-primary/20">
        <div className="flex flex-col items-center justify-center space-y-8">
          <Logo className="h-16 w-auto" />
          <div className="h-24 w-24 rounded-full bg-gradient-cosmic p-1 overflow-hidden">
            <div className="bg-dark-base rounded-full h-full w-full flex items-center justify-center">
              <span className="text-white text-4xl font-bold font-display">E</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-light-base p-8 rounded-xl border border-primary/20">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="h-8 w-auto flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-full bg-gradient-cosmic p-0.5 overflow-hidden">
              <div className="absolute inset-[2px] bg-white rounded-full flex items-center justify-center">
                <span className="text-primary text-sm font-bold">E</span>
              </div>
            </div>
            <span className="text-primary font-display font-bold text-xl">Echoverse</span>
          </div>
          <div className="h-24 w-24 rounded-full bg-gradient-cosmic p-1 overflow-hidden">
            <div className="bg-white rounded-full h-full w-full flex items-center justify-center">
              <span className="text-primary text-4xl font-bold font-display">E</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-white font-medium mb-2">Logo SVG Code</h3>
          <div className="relative bg-dark-card p-4 rounded-lg border border-primary/20">
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(`<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="20" fill="url(#paint0_linear)" />
  <path d="M16.4 25V15.4H19.56C20.5333 15.4 21.3467 15.5867 22 15.96C22.6533 16.32 23.1467 16.8267 23.48 17.48C23.8133 18.12 23.98 18.8667 23.98 19.72C23.98 20.5733 23.8133 21.3267 23.48 21.98C23.1467 22.62 22.6533 23.1267 22 23.5C21.3467 23.8667 20.5333 24.05 19.56 24.05H17.58V25H16.4ZM17.58 23.01H19.52C20.24 23.01 20.84 22.87 21.32 22.59C21.8 22.31 22.1533 21.93 22.38 21.45C22.6067 20.9567 22.72 20.38 22.72 19.72C22.72 19.06 22.6067 18.49 22.38 18.01C22.1533 17.5167 21.8 17.1333 21.32 16.86C20.84 16.5733 20.24 16.43 19.52 16.43H17.58V23.01Z" fill="white" />
  <defs>
    <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4A25AA" />
      <stop offset="0.5" stop-color="#A855F7" />
      <stop offset="1" stop-color="#22D3EE" />
    </linearGradient>
  </defs>
</svg>`, "logoSvg")}
            >
              {copiedText === "logoSvg" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <pre className="text-xs text-light-base/70 overflow-x-auto p-2">
              {`<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="20" fill="url(#paint0_linear)" />
  <path d="M16.4 25V15.4H19.56C20.5333 15.4 21.3467 15.5867 22 15.96C22.6533 16.32 23.1467 16.8267 23.48 17.48C23.8133 18.12 23.98 18.8667 23.98 19.72C23.98 20.5733 23.8133 21.3267 23.48 21.98C23.1467 22.62 22.6533 23.1267 22 23.5C21.3467 23.8667 20.5333 24.05 19.56 24.05H17.58V25H16.4ZM17.58 23.01H19.52C20.24 23.01 20.84 22.87 21.32 22.59C21.8 22.31 22.1533 21.93 22.38 21.45C22.6067 20.9567 22.72 20.38 22.72 19.72C22.72 19.06 22.6067 18.49 22.38 18.01C22.1533 17.5167 21.8 17.1333 21.32 16.86C20.84 16.5733 20.24 16.43 19.52 16.43H17.58V23.01Z" fill="white" />
  <defs>
    <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4A25AA" />
      <stop offset="0.5" stop-color="#A855F7" />
      <stop offset="1" stop-color="#22D3EE" />
    </linearGradient>
  </defs>
</svg>`}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-white font-medium mb-2">Logo React Component</h3>
          <div className="relative bg-dark-card p-4 rounded-lg border border-primary/20">
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(`import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("h-8 w-auto flex items-center gap-2", className)}>
      <div className="relative h-8 w-8 rounded-full bg-gradient-cosmic p-0.5 overflow-hidden">
        <div className="absolute inset-[2px] bg-dark-base rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">E</span>
        </div>
      </div>
      <span className="text-white font-display font-bold text-xl">Echoverse</span>
    </div>
  );
}`, "logoComponent")}
            >
              {copiedText === "logoComponent" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <pre className="text-xs text-light-base/70 overflow-x-auto p-2">
              {`import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("h-8 w-auto flex items-center gap-2", className)}>
      <div className="relative h-8 w-8 rounded-full bg-gradient-cosmic p-0.5 overflow-hidden">
        <div className="absolute inset-[2px] bg-dark-base rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">E</span>
        </div>
      </div>
      <span className="text-white font-display font-bold text-xl">Echoverse</span>
    </div>
  );
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  const ColorsDisplay = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {colorPalette.map((color) => (
          <div 
            key={color.name} 
            className="bg-dark-card p-4 rounded-lg border border-primary/20 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-8 h-8 rounded-md" 
                style={{ backgroundColor: color.color }}
              ></div>
              <h3 className="text-white font-medium">{color.name}</h3>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-light-base/60 flex justify-between">
                <span>HEX:</span>
                <span className="text-light-base/90">{color.color}</span>
              </p>
              <p className="text-xs text-light-base/60 flex justify-between">
                <span>CSS:</span>
                <span className="text-light-base/90">{color.variable}</span>
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-xs"
              onClick={() => copyToClipboard(color.color, color.name)}
            >
              {copiedText === color.name ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              Copy
            </Button>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-display font-bold text-white mt-8 mb-4">Gradients</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gradients.map((gradient) => (
          <div 
            key={gradient.name} 
            className="bg-dark-card p-4 rounded-lg border border-primary/20"
          >
            <h3 className="text-white font-medium mb-2">{gradient.name}</h3>
            <div 
              className={`${gradient.class} h-16 w-full rounded-md mb-2`}
            ></div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-light-base/70">{`.${gradient.class}`}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => copyToClipboard(gradient.class, gradient.name)}
              >
                {copiedText === gradient.name ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TypographyDisplay = () => (
    <div className="space-y-6">
      <div className="bg-dark-card p-6 rounded-xl border border-primary/20">
        <h3 className="text-white font-medium mb-4">Font Families</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-light-base/80 mb-2">Space Grotesk (Display)</h4>
            <p className="font-display text-2xl text-white">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="font-display text-2xl text-white">abcdefghijklmnopqrstuvwxyz</p>
            <p className="font-display text-2xl text-white">0123456789</p>
          </div>
          <div>
            <h4 className="text-light-base/80 mb-2">Inter (Body)</h4>
            <p className="font-sans text-2xl text-white">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="font-sans text-2xl text-white">abcdefghijklmnopqrstuvwxyz</p>
            <p className="font-sans text-2xl text-white">0123456789</p>
          </div>
        </div>
      </div>

      <div className="bg-dark-card p-6 rounded-xl border border-primary/20">
        <h3 className="text-white font-medium mb-4">Typography Styles</h3>
        <div className="space-y-6">
          {typography.map((type) => (
            <div key={type.name} className="border-b border-primary/10 pb-4 last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h4 className="text-light-base/80">{type.name}</h4>
                <span className="text-xs text-light-base/60">{`.${type.class.split(' ').join('.')}`}</span>
              </div>
              <p className={`${type.class} text-white mb-2`}>{type.sample}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => copyToClipboard(type.class, type.name)}
              >
                {copiedText === type.name ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                Copy
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Brand Guidelines - Echoverse</title>
        <meta name="description" content="Echoverse brand system - logos, colors, typography, and design tokens." />
      </Helmet>
      
      <div className="min-h-screen bg-dark-default flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              className="mb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 
                className="text-3xl sm:text-4xl font-display font-bold text-white mb-4"
                variants={itemVariants}
              >
                Echoverse <span className="text-gradient">Brand System</span>
              </motion.h1>
              <motion.p 
                className="text-xl text-light-base/70 max-w-3xl"
                variants={itemVariants}
              >
                Complete brand guidelines, assets, and design tokens for the Echoverse platform.
              </motion.p>
            </motion.div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Tabs defaultValue="logo" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="typography">Typography</TabsTrigger>
                </TabsList>
                
                <TabsContent value="logo">
                  <LogoDisplay />
                </TabsContent>
                
                <TabsContent value="colors">
                  <ColorsDisplay />
                </TabsContent>
                
                <TabsContent value="typography">
                  <TypographyDisplay />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
