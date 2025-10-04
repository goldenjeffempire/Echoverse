import { aiRouter } from "./ai-providers/router";
import { AIServiceError } from "./utils/errors";

// AI Website Builder Content Generation
export async function generateWebsiteContent(prompt: string, type: 'landing' | 'about' | 'contact' | 'blog' = 'landing'): Promise<{
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  suggestions: string[];
}> {
  const systemPrompt = `You are an expert web content creator. Generate high-quality, engaging website content based on the user's requirements. Respond with JSON in this format: {
    "title": "Page title",
    "content": "Full HTML content with proper structure",
    "seoTitle": "SEO optimized title (60 chars max)",
    "seoDescription": "SEO description (160 chars max)",
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Generate ${type} page content for: ${prompt}`,
    jsonMode: true,
  });

  return JSON.parse(response);
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
    userPrompt: `Write a ${length} (${lengthGuide[length]}) blog post about "${topic}" in a ${tone} tone.`,
    jsonMode: true,
  });

  return JSON.parse(response);
}

// Marketing Automation Content Generation
export async function generateMarketingContent(campaign: string, type: 'email' | 'social' | 'landing' | 'ad'): Promise<{
  headline: string;
  content: string;
  cta: string;
  variations: string[];
}> {
  const systemPrompt = `You are a marketing copywriter expert. Create compelling marketing content that drives engagement and conversions. Respond with JSON in this format: {
    "headline": "Compelling headline",
    "content": "Marketing content body",
    "cta": "Call-to-action text",
    "variations": ["variation1", "variation2", "variation3"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Create ${type} marketing content for: ${campaign}`,
    jsonMode: true,
  });

  return JSON.parse(response);
}

// SEO Optimization
export async function optimizeForSEO(content: string, targetKeywords: string[]): Promise<{
  optimizedContent: string;
  seoTitle: string;
  seoDescription: string;
  suggestions: string[];
  keywords: string[];
}> {
  const systemPrompt = `You are an SEO expert. Optimize content for search engines while maintaining readability and user experience. Respond with JSON in this format: {
    "optimizedContent": "SEO optimized content",
    "seoTitle": "SEO title (60 chars max)",
    "seoDescription": "SEO description (160 chars max)",
    "suggestions": ["suggestion1", "suggestion2"],
    "keywords": ["keyword1", "keyword2"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Optimize this content for SEO with target keywords: ${targetKeywords.join(', ')}\n\nContent: ${content}`,
    jsonMode: true,
  });

  return JSON.parse(response);
}

// Chatbot Response Generation
export async function generateChatbotResponse(userMessage: string, context: string = ''): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant for the EchoVerse platform. You help users with website building, e-commerce, content creation, and platform features. Be friendly, informative, and concise. Always try to guide users toward relevant platform features.`;

  try {
    const response = await aiRouter.chatCompletion({
      systemPrompt: context ? `${systemPrompt}\n\nContext: ${context}` : systemPrompt,
      userPrompt: userMessage,
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
  const systemPrompt = `You are a content analysis expert. Analyze the provided content for sentiment, readability, and topics. Respond with JSON in this format: {
    "sentiment": "positive|neutral|negative",
    "readabilityScore": number_0_to_100,
    "suggestions": ["suggestion1", "suggestion2"],
    "topics": ["topic1", "topic2"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Analyze this content: ${content}`,
    jsonMode: true,
  });

  return JSON.parse(response);
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

  const userPrompt = `Generate a complete ${params.style} website for a ${params.businessType} with this description: "${params.description}"

Pages to include: ${params.pages.join(', ')}
Color scheme preference: ${params.colorScheme || 'professional'}
Key features: ${params.features?.join(', ') || 'standard website features'}

Create a fully functional, modern, responsive website structure.`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  return JSON.parse(response);
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
  const systemPrompt = `You are a frontend component expert. Generate modern, responsive web components with clean HTML, CSS, and configurable properties. Respond with JSON in this format: {
    "id": "unique-component-id",
    "type": "${params.type}",
    "name": "Component Display Name",
    "html": "Clean HTML structure with semantic tags",
    "css": "Modern CSS with flexbox/grid, responsive design",
    "props": {"configurable": "properties"},
    "preview": "Brief description of component appearance"
  }`;

  const userPrompt = `Create a ${params.type} component with ${params.style} styling.
Description: ${params.description}
${params.content ? `Content to include: ${params.content}` : ''}

Make it responsive, accessible, and modern.`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  return JSON.parse(response);
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
  const systemPrompt = `You are a web template designer. Create professional website templates optimized for specific industries. Respond with JSON in this format: {
    "id": "template-id",
    "name": "Template Name",
    "description": "Template description",
    "preview": "Preview description",
    "category": "industry-category",
    "structure": {"pages": [], "components": [], "layout": ""},
    "customization": {"colors": [], "fonts": [], "layouts": []}
  }`;

  const userPrompt = `Create a professional website template for the ${params.industry} industry with ${params.style} styling.
Features: ${params.features.join(', ')}

Make it industry-specific, conversion-focused, and easily customizable.`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  return JSON.parse(response);
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
  const systemPrompt = `You are a content optimization expert. Enhance web content for better ${params.enhancement} while maintaining brand voice and accuracy. Respond with JSON in this format: {
    "enhanced": "Improved content",
    "improvements": ["List of improvements made"],
    "metrics": {"readability": 0-100, "estimated_impact": "description"}
  }`;

  const userPrompt = `Enhance this content for ${params.enhancement} targeting ${params.target}:

${params.content}`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  return JSON.parse(response);
}

// Generate Image Suggestions (text-based, for AI image generation prompts)
export async function generateImageSuggestions(context: string, count: number = 3): Promise<string[]> {
  const systemPrompt = `You are an expert in AI image generation prompts. Create detailed, specific prompts for AI image generators like DALL-E or Midjourney. Respond with JSON in this format: {
    "prompts": ["detailed prompt 1", "detailed prompt 2", "detailed prompt 3"]
  }`;

  const response = await aiRouter.chatCompletion({
    systemPrompt,
    userPrompt: `Generate ${count} detailed AI image generation prompts for: ${context}`,
    jsonMode: true,
  });

  const result = JSON.parse(response);
  return result.prompts || [];
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
