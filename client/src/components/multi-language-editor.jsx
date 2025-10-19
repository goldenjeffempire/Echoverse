import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Globe, Languages, Copy, Check, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
];
export function MultiLanguageEditor() {
    const [contentItems, setContentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [selectedItem, setSelectedItem] = useState(null);
    const [translationProgress, setTranslationProgress] = useState({});
    const { toast } = useToast();
    useEffect(() => {
        loadContent();
    }, []);
    const loadContent = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/content/translations');
            setContentItems(response.content || []);
            if (response.content?.length > 0) {
                setSelectedItem(response.content[0]);
            }
        }
        catch (error) {
            toast({
                title: "Error loading content",
                description: error.message || "Failed to load translations",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const calculateProgress = (item, language) => {
        const translation = item.translations.find(t => t.language === language);
        if (!translation)
            return 0;
        const totalFields = Object.keys(translation.content).length;
        const filledFields = Object.values(translation.content).filter(v => v.trim() !== '').length;
        return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    };
    const handleSaveTranslation = async (item, language, field, value) => {
        setSaving(true);
        try {
            const updatedItem = { ...item };
            const translation = updatedItem.translations.find(t => t.language === language);
            if (translation) {
                translation.content[field] = value;
            }
            else {
                updatedItem.translations.push({
                    language,
                    content: { [field]: value }
                });
            }
            await apiClient.put('/api/content/translations', {
                itemId: item.id,
                language,
                field,
                value
            });
            setContentItems(contentItems.map(i => i.id === item.id ? updatedItem : i));
            const progress = calculateProgress(updatedItem, language);
            setTranslationProgress(prev => ({ ...prev, [`${item.id}-${language}`]: progress }));
            toast({
                title: "Translation saved",
                description: "Your changes have been saved successfully",
            });
        }
        catch (error) {
            toast({
                title: "Save failed",
                description: error.message || "Failed to save translation",
                variant: "destructive"
            });
        }
        finally {
            setSaving(false);
        }
    };
    const handleAutoTranslate = async (item, targetLanguage) => {
        try {
            const baseTranslation = item.translations.find(t => t.language === item.baseLanguage);
            if (!baseTranslation) {
                toast({
                    title: "Translation failed",
                    description: "Base language content not found",
                    variant: "destructive"
                });
                return;
            }
            const response = await apiClient.post('/api/ai/translate', {
                content: baseTranslation.content,
                sourceLanguage: item.baseLanguage,
                targetLanguage
            });
            const updatedItem = { ...item };
            const existingTranslation = updatedItem.translations.find(t => t.language === targetLanguage);
            if (existingTranslation) {
                existingTranslation.content = response.translation;
            }
            else {
                updatedItem.translations.push({
                    language: targetLanguage,
                    content: response.translation
                });
            }
            setContentItems(contentItems.map(i => i.id === item.id ? updatedItem : i));
            setSelectedItem(updatedItem);
            toast({
                title: "Auto-translation complete",
                description: `Content translated to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}`,
            });
        }
        catch (error) {
            toast({
                title: "Translation failed",
                description: error.message || "Failed to auto-translate content",
                variant: "destructive"
            });
        }
    };
    const handleCopyFromBase = (item, targetLanguage) => {
        const baseTranslation = item.translations.find(t => t.language === item.baseLanguage);
        if (!baseTranslation)
            return;
        const updatedItem = { ...item };
        const existingTranslation = updatedItem.translations.find(t => t.language === targetLanguage);
        if (existingTranslation) {
            existingTranslation.content = { ...baseTranslation.content };
        }
        else {
            updatedItem.translations.push({
                language: targetLanguage,
                content: { ...baseTranslation.content }
            });
        }
        setContentItems(contentItems.map(i => i.id === item.id ? updatedItem : i));
        setSelectedItem(updatedItem);
        toast({
            title: "Content copied",
            description: `Base language content copied to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}`,
        });
    };
    if (loading) {
        return (<div className="space-y-6">
        <Skeleton className="h-10 w-64"/>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64"/>
          <Skeleton className="h-64"/>
        </div>
      </div>);
    }
    if (!selectedItem) {
        return (<Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
            <p className="text-muted-foreground">No content available for translation</p>
          </div>
        </CardContent>
      </Card>);
    }
    const currentTranslation = selectedItem.translations.find(t => t.language === selectedLanguage);
    const baseTranslation = selectedItem.translations.find(t => t.language === selectedItem.baseLanguage);
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary"/>
            Multi-Language Editor
          </h1>
          <p className="text-muted-foreground">Manage translations for your content</p>
        </div>
        <Button onClick={() => loadContent()} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SUPPORTED_LANGUAGES.slice(0, 3).map(lang => {
            const progress = calculateProgress(selectedItem, lang.code);
            return (<Card key={lang.code}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-2xl">{lang.flag}</span>
                  {lang.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="mb-2"/>
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </CardContent>
            </Card>);
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Language</CardTitle>
              <Badge variant="outline">{selectedItem.baseLanguage.toUpperCase()} Base</Badge>
            </div>
            <CardDescription>Choose a language to edit translations</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language"/>
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (<SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {lang.code === selectedItem.baseLanguage && (<Badge variant="secondary" className="ml-2">Base</Badge>)}
                    </span>
                  </SelectItem>))}
              </SelectContent>
            </Select>

            {selectedLanguage !== selectedItem.baseLanguage && (<div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopyFromBase(selectedItem, selectedLanguage)} className="flex-1">
                  <Copy className="h-4 w-4 mr-2"/>
                  Copy from Base
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAutoTranslate(selectedItem, selectedLanguage)} className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2"/>
                  AI Translate
                </Button>
              </div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Translation Progress</CardTitle>
            <CardDescription>Overall completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SUPPORTED_LANGUAGES.map(lang => {
            const progress = calculateProgress(selectedItem, lang.code);
            return (<div key={lang.code} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress}/>
                  </div>);
        })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Content Editor - {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
          </CardTitle>
          <CardDescription>
            {selectedLanguage === selectedItem.baseLanguage
            ? "Editing base language content"
            : "Translate content to selected language"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Content Fields</TabsTrigger>
              <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {baseTranslation && Object.keys(baseTranslation.content).map(field => (<div key={field} className="space-y-2">
                  <label className="text-sm font-medium capitalize flex items-center gap-2">
                    {field.replace(/_/g, ' ')}
                    {currentTranslation?.content[field] && (<Check className="h-4 w-4 text-green-600"/>)}
                  </label>
                  <Textarea value={currentTranslation?.content[field] || ''} onChange={(e) => handleSaveTranslation(selectedItem, selectedLanguage, field, e.target.value)} placeholder={`Enter ${field} in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}`} className="min-h-[100px]"/>
                </div>))}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {baseTranslation && Object.keys(baseTranslation.content).map(field => (<div key={field} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {field.replace(/_/g, ' ')} ({selectedItem.baseLanguage.toUpperCase()})
                    </label>
                    <Textarea value={baseTranslation.content[field] || ''} disabled className="min-h-[100px] bg-muted"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {field.replace(/_/g, ' ')} ({selectedLanguage.toUpperCase()})
                    </label>
                    <Textarea value={currentTranslation?.content[field] || ''} onChange={(e) => handleSaveTranslation(selectedItem, selectedLanguage, field, e.target.value)} placeholder={`Enter translation`} className="min-h-[100px]"/>
                  </div>
                </div>))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);
}
