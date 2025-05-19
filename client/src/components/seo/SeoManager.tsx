
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export function SeoManager() {
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [structuredData, setStructuredData] = useState('');
  
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="meta">
            <TabsList>
              <TabsTrigger value="meta">Meta Tags</TabsTrigger>
              <TabsTrigger value="structured">Structured Data</TabsTrigger>
              <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            </TabsList>
            <TabsContent value="meta">
              <div className="space-y-4">
                <Input
                  placeholder="Meta Title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Meta Description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
                <Button>Save Meta Tags</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
