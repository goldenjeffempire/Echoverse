import { aiRouter } from "./ai-providers/router";
import { AIServiceError } from "./utils/errors";
import { safeJSONParse, validateJSONFields } from "./utils/safe-json";
import { sanitizeAIPrompt, sanitizeInput, sanitizeArray } from "./utils/input-sanitization";

// AI Website Builder Content Generation
export async function generateWebsiteContent(prompt: string, type: 'landing' | 'about' | 'contact' | 'blog' = 'landing'): Promise<{
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  suggestions: string[];
}> {
  const sanitizedPrompt = sanitizeAIPrompt(prompt, 2000);
  
  const systemPrompt = `You are an expert web content creator. Generate high-quality, engaging website content based on the user's requirements. Respond with JSON in this format: {
    "title": "Page title",
    "content": "Full HTML content with proper structure",
    "seoTitle": "SEO optimized title (60 chars max)",
    "seoDescription": "SEO description (160 chars max)",
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Generate ${type} page content for: ${sanitizedPrompt}`,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateWebsiteContent',
    fallback: {
      title: 'Welcome',
      content: '<p>Content generated successfully</p>',
      seoTitle: 'Home',
      seoDescription: 'Welcome to our website',
      suggestions: []
    }
  });

  return validateJSONFields(result, ['title', 'content', 'seoTitle', 'seoDescription', 'suggestions'], 'generateWebsiteContent');
}

// Blog & CMS Content Generation
export async function generateBlogPost(topic: string, tone: 'professional' | 'casual' | 'technical' = 'professional', length: 'short' | 'medium' | 'long' = 'medium'): Promise<{
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}> {
  const sanitizedTopic = sanitizeAIPrompt(topic, 500);
  
  const systemPrompt = `You are a professional content writer. Create engaging blog posts with proper structure, headings, and formatting. Respond with JSON in this format: {
    "title": "Blog post title",
    "content": "Full blog post content in HTML with proper headings, paragraphs, and structure",
    "excerpt": "Brief excerpt (150 chars max)",
    "tags": ["tag1", "tag2", "tag3"],
    "seoTitle": "SEO optimized title (60 chars max)",
    "seoDescription": "SEO description (160 chars max)"
  }`;

  const lengthGuide = {
    short: '500-800 words',
    medium: '1000-1500 words',
    long: '2000-3000 words'
  };

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Write a ${length} (${lengthGuide[length]}) blog post about "${sanitizedTopic}" in a ${tone} tone.`,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateBlogPost',
    fallback: {
      title: sanitizedTopic,
      content: `<h1>${sanitizedTopic}</h1><p>Blog content here.</p>`,
      excerpt: `An article about ${sanitizedTopic}`,
      tags: [tone, 'blog'],
      seoTitle: sanitizedTopic.substring(0, 60),
      seoDescription: `Read about ${sanitizedTopic}`
    }
  });

  return validateJSONFields(result, ['title', 'content', 'excerpt', 'tags', 'seoTitle', 'seoDescription'], 'generateBlogPost');
}

// Marketing Automation Content Generation
export async function generateMarketingContent(campaign: string, type: 'email' | 'social' | 'landing' | 'ad'): Promise<{
  headline: string;
  content: string;
  cta: string;
  variations: string[];
}> {
  const sanitizedCampaign = sanitizeAIPrompt(campaign, 1000);
  
  const systemPrompt = `You are a marketing copywriter expert. Create compelling marketing content that drives engagement and conversions. Respond with JSON in this format: {
    "headline": "Compelling headline",
    "content": "Marketing content body",
    "cta": "Call-to-action text",
    "variations": ["variation1", "variation2", "variation3"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Create ${type} marketing content for: ${sanitizedCampaign}`,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateMarketingContent',
    fallback: {
      headline: 'Special Offer',
      content: 'Discover amazing products and services',
      cta: 'Learn More',
      variations: ['Get Started', 'Sign Up Now', 'Try It Free']
    }
  });

  return validateJSONFields(result, ['headline', 'content', 'cta', 'variations'], 'generateMarketingContent');
}

// SEO Optimization
export async function optimizeForSEO(content: string, targetKeywords: string[]): Promise<{
  optimizedContent: string;
  seoTitle: string;
  seoDescription: string;
  suggestions: string[];
  keywords: string[];
}> {
  const sanitizedContent = sanitizeInput(content, { maxLength: 5000, allowHtml: true });
  const sanitizedKeywords = sanitizeArray(targetKeywords, { maxItems: 10, itemMaxLength: 50 });
  
  const systemPrompt = `You are an SEO expert. Optimize content for search engines while maintaining readability and user experience. Respond with JSON in this format: {
    "optimizedContent": "SEO optimized content",
    "seoTitle": "SEO title (60 chars max)",
    "seoDescription": "SEO description (160 chars max)",
    "suggestions": ["suggestion1", "suggestion2"],
    "keywords": ["keyword1", "keyword2"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Optimize this content for SEO with target keywords: ${sanitizedKeywords.join(', ')}\n\nContent: ${sanitizedContent}`,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'optimizeForSEO',
    fallback: {
      optimizedContent: sanitizedContent,
      seoTitle: 'Optimized Content',
      seoDescription: 'SEO optimized page content',
      suggestions: ['Add more keywords', 'Improve readability'],
      keywords: sanitizedKeywords
    }
  });

  return validateJSONFields(result, ['optimizedContent', 'seoTitle', 'seoDescription', 'suggestions', 'keywords'], 'optimizeForSEO');
}

// Chatbot Response Generation
export async function generateChatbotResponse(userMessage: string, context: string = ''): Promise<string> {
  const sanitizedMessage = sanitizeAIPrompt(userMessage, 1000);
  const sanitizedContext = sanitizeInput(context, { maxLength: 2000 });
  
  const systemPrompt = `You are EchoBot, a helpful AI assistant for the EchoVerse platform. You help users with website building, e-commerce, content creation, and platform features. Be friendly, informative, and concise. Always try to guide users toward relevant platform features.`;

  try {
    const response = await aiRouter.chatCompletion({
      systemPrompt: sanitizedContext ? `${systemPrompt}\n\nContext: ${sanitizedContext}` : systemPrompt,
      userPrompt: sanitizedMessage,
      jsonMode: false,
    });

    return response;
  } catch (error) {
    if (error instanceof AIServiceError) {
      return "I'm sorry, I'm currently unavailable. Please try again later or contact support.";
    }
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

// Content Analysis
export async function analyzeContent(content: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  readabilityScore: number;
  suggestions: string[];
  topics: string[];
}> {
  const sanitizedContent = sanitizeInput(content, { maxLength: 5000, allowHtml: true });
  
  const systemPrompt = `You are a content analysis expert. Analyze the provided content for sentiment, readability, and topics. Respond with JSON in this format: {
    "sentiment": "positive|neutral|negative",
    "readabilityScore": number_0_to_100,
    "suggestions": ["suggestion1", "suggestion2"],
    "topics": ["topic1", "topic2"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Analyze this content: ${sanitizedContent}`,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'analyzeContent',
    fallback: {
      sentiment: 'neutral' as const,
      readabilityScore: 50,
      suggestions: ['Review content structure', 'Add more details'],
      topics: ['general']
    }
  });

  return validateJSONFields(result, ['sentiment', 'readabilityScore', 'suggestions', 'topics'], 'analyzeContent');
}

// Complete Website Generation
export async function generateCompleteWebsite(params: {
  description: string;
  businessType: string;
  style: 'modern' | 'classic' | 'minimal' | 'creative';
  pages: string[];
  colorScheme?: string;
  features?: string[];
}): Promise<{
  name: string;
  pages: {
    id: string;
    name: string;
    route: string;
    title: string;
    content: string;
    components: any[];
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
  }[];
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    layout: string;
  };
  navigation: {
    type: string;
    items: { name: string; route: string; }[];
  };
}> {
  const sanitizedDescription = sanitizeAIPrompt(params.description, 1000);
  const sanitizedBusinessType = sanitizeInput(params.businessType, { maxLength: 100 });
  const sanitizedPages = sanitizeArray(params.pages, { maxItems: 10, itemMaxLength: 50 });
  const sanitizedColorScheme = sanitizeInput(params.colorScheme || 'professional', { maxLength: 50 });
  const sanitizedFeatures = sanitizeArray(params.features || [], { maxItems: 20, itemMaxLength: 100 });
  
  const systemPrompt = `You are an expert web developer and designer. Generate a complete, professional website structure based on the requirements. Include modern responsive design, proper navigation, SEO optimization, and compelling content. Respond with JSON in this exact format: {
    "name": "Website Name",
    "pages": [
      {
        "id": "unique-page-id",
        "name": "Page Name",
        "route": "/route",
        "title": "Page Title",
        "content": "Full HTML content with semantic structure",
        "components": [{"type": "hero", "content": "...", "styles": "..."}],
        "seo": {
          "title": "SEO Title (60 chars max)",
          "description": "Meta description (160 chars max)",
          "keywords": ["keyword1", "keyword2"]
        }
      }
    ],
    "theme": {
      "colors": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "fonts": {
        "heading": "Font Name",
        "body": "Font Name"
      },
      "layout": "modern"
    },
    "navigation": {
      "type": "horizontal",
      "items": [{"name": "Home", "route": "/"}]
    }
  }`;

  const userPrompt = `Generate a complete ${params.style} website for a ${sanitizedBusinessType} with this description: "${sanitizedDescription}"

Pages to include: ${sanitizedPages.join(', ')}
Color scheme preference: ${sanitizedColorScheme}
Key features: ${sanitizedFeatures.join(', ') || 'standard website features'}

Create a fully functional, modern, responsive website structure.`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateCompleteWebsite',
    fallback: {
      name: `${sanitizedBusinessType} Website`,
      pages: [{
        id: 'home',
        name: 'Home',
        route: '/',
        title: 'Home',
        content: '<h1>Welcome</h1>',
        components: [],
        seo: { title: 'Home', description: 'Welcome', keywords: [] }
      }],
      theme: {
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          background: '#FFFFFF',
          text: '#1F2937'
        },
        fonts: { heading: 'Inter', body: 'Inter' },
        layout: 'modern'
      },
      navigation: {
        type: 'horizontal',
        items: [{ name: 'Home', route: '/' }]
      }
    }
  });

  return validateJSONFields(result, ['name', 'pages', 'theme', 'navigation'], 'generateCompleteWebsite');
}

// Web Component Generation
export async function generateWebComponent(params: {
  type: 'hero' | 'navbar' | 'footer' | 'card' | 'form' | 'gallery' | 'testimonial' | 'pricing' | 'cta';
  description: string;
  style: string;
  content?: string;
}): Promise<{
  id: string;
  type: string;
  name: string;
  html: string;
  css: string;
  props: any;
  preview: string;
}> {
  const sanitizedDescription = sanitizeAIPrompt(params.description, 500);
  const sanitizedStyle = sanitizeInput(params.style, { maxLength: 100 });
  const sanitizedContent = sanitizeInput(params.content || '', { maxLength: 1000, allowHtml: true });
  
  const systemPrompt = `You are a frontend component expert. Generate modern, responsive web components with clean HTML, CSS, and configurable properties. Respond with JSON in this format: {
    "id": "unique-component-id",
    "type": "${params.type}",
    "name": "Component Display Name",
    "html": "Clean HTML structure with semantic tags",
    "css": "Modern CSS with flexbox/grid, responsive design",
    "props": {"configurable": "properties"},
    "preview": "Brief description of component appearance"
  }`;

  const userPrompt = `Create a ${params.type} component with ${sanitizedStyle} styling.
Description: ${sanitizedDescription}
${sanitizedContent ? `Content to include: ${sanitizedContent}` : ''}

Make it responsive, accessible, and modern.`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateWebComponent',
    fallback: {
      id: `${params.type}-component`,
      type: params.type,
      name: `${params.type} Component`,
      html: `<div class="${params.type}">Component</div>`,
      css: `.${params.type} { display: block; }`,
      props: {},
      preview: `A ${params.type} component`
    }
  });

  return validateJSONFields(result, ['id', 'type', 'name', 'html', 'css', 'props', 'preview'], 'generateWebComponent');
}

// Website Template Generation
export async function generateWebsiteTemplate(params: {
  industry: string;
  style: string;
  features: string[];
}): Promise<{
  id: string;
  name: string;
  description: string;
  preview: string;
  category: string;
  structure: any;
  customization: any;
}> {
  const sanitizedIndustry = sanitizeInput(params.industry, { maxLength: 100 });
  const sanitizedStyle = sanitizeInput(params.style, { maxLength: 100 });
  const sanitizedFeatures = sanitizeArray(params.features, { maxItems: 15, itemMaxLength: 100 });
  
  const systemPrompt = `You are a web template designer. Create professional website templates optimized for specific industries. Respond with JSON in this format: {
    "id": "template-id",
    "name": "Template Name",
    "description": "Template description",
    "preview": "Preview description",
    "category": "industry-category",
    "structure": {"pages": [], "components": [], "layout": ""},
    "customization": {"colors": [], "fonts": [], "layouts": []}
  }`;

  const userPrompt = `Create a professional website template for the ${sanitizedIndustry} industry with ${sanitizedStyle} styling.
Features: ${sanitizedFeatures.join(', ')}

Make it industry-specific, conversion-focused, and easily customizable.`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateWebsiteTemplate',
    fallback: {
      id: `${sanitizedIndustry}-template`,
      name: `${sanitizedIndustry} Template`,
      description: `A template for ${sanitizedIndustry}`,
      preview: 'Professional template',
      category: sanitizedIndustry,
      structure: { pages: [], components: [], layout: 'modern' },
      customization: { colors: [], fonts: [], layouts: [] }
    }
  });

  return validateJSONFields(result, ['id', 'name', 'description', 'preview', 'category', 'structure', 'customization'], 'generateWebsiteTemplate');
}

// Content Enhancement
export async function enhanceWebsiteContent(params: {
  content: string;
  enhancement: 'readability' | 'seo' | 'conversion' | 'engagement';
  target: string;
}): Promise<{
  enhanced: string;
  improvements: string[];
  metrics: any;
}> {
  const sanitizedContent = sanitizeInput(params.content, { maxLength: 5000, allowHtml: true });
  const sanitizedTarget = sanitizeInput(params.target, { maxLength: 200 });
  
  const systemPrompt = `You are a content optimization expert. Enhance web content for better ${params.enhancement} while maintaining brand voice and accuracy. Respond with JSON in this format: {
    "enhanced": "Improved content",
    "improvements": ["List of improvements made"],
    "metrics": {"readability": 0-100, "estimated_impact": "description"}
  }`;

  const userPrompt = `Enhance this content for ${params.enhancement} targeting ${sanitizedTarget}:

${sanitizedContent}`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'enhanceWebsiteContent',
    fallback: {
      enhanced: sanitizedContent,
      improvements: ['Content reviewed', 'Minor enhancements applied'],
      metrics: { readability: 70, estimated_impact: 'moderate' }
    }
  });

  return validateJSONFields(result, ['enhanced', 'improvements', 'metrics'], 'enhanceWebsiteContent');
}

// Generate Image Suggestions (text-based, for AI image generation prompts)
export async function generateImageSuggestions(context: string, count: number = 3): Promise<string[]> {
  const sanitizedContext = sanitizeAIPrompt(context, 500);
  const safeCount = Math.min(Math.max(count, 1), 10); // Limit between 1-10
  
  const systemPrompt = `You are an expert in AI image generation prompts. Create detailed, specific prompts for AI image generators like DALL-E or Midjourney. Respond with JSON in this format: {
    "prompts": ["detailed prompt 1", "detailed prompt 2", "detailed prompt 3"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Generate ${safeCount} detailed AI image generation prompts for: ${sanitizedContext}`,
    jsonMode: true,
  });

  const result = safeJSONParse<any>(response, {
    context: 'generateImageSuggestions',
    fallback: { prompts: [`Professional image for ${sanitizedContext}`] }
  });
  
  return Array.isArray(result.prompts) ? result.prompts.slice(0, safeCount) : [];
}

// Health Check - Check if any AI provider is available
export async function checkAIHealth(): Promise<{
  available: boolean;
  provider: string | null;
  fallback: string | null;
}> {
  const isAvailable = await aiRouter.isAnyProviderAvailable();
  const providerInfo = aiRouter.getProviderInfo();
  
  return {
    available: isAvailable,
    provider: providerInfo.primary,
    fallback: providerInfo.fallback,
  };
}
