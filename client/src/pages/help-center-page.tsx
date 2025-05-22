// src/pages/help-center-page.tsx
import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { featuredArticles, categories, faqCategories } from "@/data/help-center-data";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

const CategoryCard = ({ icon, name, description, href }: any) => {
  const LucideIcon = (Icons as any)[icon] || Icons.HelpCircle;
  return (
    <a href={href} className="block">
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6 space-y-3">
          <LucideIcon className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </CardContent>
      </Card>
    </a>
  );
};

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!query) return faqCategories;
    return faqCategories
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter((faq) =>
          faq.question.toLowerCase().includes(query.toLowerCase()) ||
          faq.answer.toLowerCase().includes(query.toLowerCase())
        ),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [query]);

  return (
    <>
      <Helmet>
        <title>Help Center</title>
      </Helmet>

      <div className="container py-12 space-y-12">
        <section className="text-center space-y-4">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-bold">
            Help Center
          </motion.h1>
          <p className="text-muted-foreground">
            Find answers, explore resources, and get help fast.
          </p>
          <Input
            type="search"
            placeholder="Search FAQs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md mx-auto"
          />
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </section>

        <section className="space-y-8">
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2">
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="articles">Featured Articles</TabsTrigger>
              <TabsTrigger value="videos">Tutorials</TabsTrigger>
            </TabsList>

            <TabsContent value="faq">
              {filteredFaqs.length === 0 ? (
                <p className="text-center text-muted-foreground mt-4">No results found.</p>
              ) : (
                filteredFaqs.map((category) => (
                  <div key={category.title} className="space-y-2">
                    <h2 className="text-xl font-semibold">{category.title}</h2>
                    <Accordion type="multiple" className="w-full">
                      {category.faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${category.title}-${i}`}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="articles">
              <div className="grid md:grid-cols-2 gap-4">
                {featuredArticles.map((article) => (
                  <a key={article.id} href={article.href}>
                    <Card className="hover:shadow transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold">{article.title}</h3>
                        <p className="text-sm text-muted-foreground">{article.description}</p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Coming soon: step-by-step video guides.</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Subscribe to Updates</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Subscribe for Updates</DialogTitle>
                      <Input placeholder="you@example.com" />
                      <Button className="mt-2 w-full">Subscribe</Button>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Anchor Targets */}
        <div id="getting-started" className="pt-24"><h2 className="text-2xl font-bold">Getting Started</h2></div>
        <div id="account-management" className="pt-24"><h2 className="text-2xl font-bold">Account Management</h2></div>
        <div id="security" className="pt-24"><h2 className="text-2xl font-bold">Security</h2></div>
      </div>
    </>
  );
}
