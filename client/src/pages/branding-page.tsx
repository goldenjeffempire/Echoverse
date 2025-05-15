import { MainLayout } from "@/components/layouts/main-layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BrandingPage() {
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

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="logos">Logos</TabsTrigger>
            </TabsList>
            <TabsContent value="colors">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['#FF0000', '#00FF00', '#0000FF', '#FFA500'].map((color, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="typography">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Brand Typography</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm text-light-base/70">Heading Font</h4>
                      <p className="text-2xl">Inter</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-light-base/70">Body Font</h4>
                      <p className="text-lg">Source Sans Pro</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}