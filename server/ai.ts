import OpenAI from "openai";

// Using OpenAI integration for backup/fallback AI capabilities
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key: OPENAI_API_KEY');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// AI Website Builder Content Generation
export async function generateWebsiteContent(prompt: string, type: 'landing' | 'about' | 'contact' | 'blog' = 'landing'): Promise<{
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  suggestions: string[];
}> {
  try {
    const systemPrompt = `You are an expert web content creator. Generate high-quality, engaging website content based on the user's requirements. Respond with JSON in this format: {
      "title": "Page title",
      "content": "Full HTML content with proper structure",
      "seoTitle": "SEO optimized title (60 chars max)",
      "seoDescription": "SEO description (160 chars max)",
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using stable model version
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${type} page content for: ${prompt}` }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Website content generation error:', error);
    throw new Error('Failed to generate website content');
  }
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
  try {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Write a ${length} (${lengthGuide[length]}) blog post about "${topic}" in a ${tone} tone.` }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Blog post generation error:', error);
    throw new Error('Failed to generate blog post');
  }
}

// Marketing Content Generation
export async function generateMarketingContent(campaign: string, type: 'email' | 'social' | 'landing' | 'ad'): Promise<{
  headline: string;
  content: string;
  cta: string;
  variations: string[];
}> {
  try {
    const systemPrompt = `You are a marketing copywriter expert. Create compelling marketing content that drives engagement and conversions. Respond with JSON in this format: {
      "headline": "Compelling headline",
      "content": "Marketing content body",
      "cta": "Call-to-action text",
      "variations": ["variation1", "variation2", "variation3"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create ${type} marketing content for: ${campaign}` }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Marketing content generation error:', error);
    throw new Error('Failed to generate marketing content');
  }
}

// SEO Optimization
export async function optimizeForSEO(content: string, targetKeywords: string[]): Promise<{
  optimizedContent: string;
  seoTitle: string;
  seoDescription: string;
  suggestions: string[];
  keywords: string[];
}> {
  try {
    const systemPrompt = `You are an SEO expert. Optimize content for search engines while maintaining readability and user experience. Respond with JSON in this format: {
      "optimizedContent": "SEO optimized content",
      "seoTitle": "SEO title (60 chars max)",
      "seoDescription": "SEO description (160 chars max)", 
      "suggestions": ["suggestion1", "suggestion2"],
      "keywords": ["keyword1", "keyword2"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Optimize this content for SEO with target keywords: ${targetKeywords.join(', ')}\n\nContent: ${content}` }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('SEO optimization error:', error);
    throw new Error('Failed to optimize content for SEO');
  }
}

// Chatbot Response Generation
export async function generateChatbotResponse(userMessage: string, context: string = ''): Promise<string> {
  try {
    const systemPrompt = `You are a helpful AI assistant for the EchoVerse platform. You help users with website building, e-commerce, content creation, and platform features. Be friendly, informative, and concise. Always try to guide users toward relevant platform features.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: context },
        { role: "user", content: userMessage }
      ],
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error('Chatbot response error:', error);
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
  try {
    const systemPrompt = `You are a content analysis expert. Analyze the provided content for sentiment, readability, and topics. Respond with JSON in this format: {
      "sentiment": "positive|neutral|negative",
      "readabilityScore": number_0_to_100,
      "suggestions": ["suggestion1", "suggestion2"],
      "topics": ["topic1", "topic2"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this content: ${content}` }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Content analysis error:', error);
    throw new Error('Failed to analyze content');
  }
}

// Full Website Builder - Generate Complete Website Structure
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
  try {
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
Features needed: ${params.features?.join(', ') || 'standard'}

Make it professional, responsive, and conversion-focused.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Complete website generation error:', error);
    throw new Error('Failed to generate complete website');
  }
}

// Component Generator for Drag-and-Drop Editor
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
  try {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Component generation error:', error);
    throw new Error('Failed to generate component');
  }
}

// Template Generator
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
  try {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Template generation error:', error);
    throw new Error('Failed to generate template');
  }
}

// Content Enhancement for Better UX
export async function enhanceWebsiteContent(params: {
  content: string;
  enhancement: 'readability' | 'seo' | 'conversion' | 'engagement';
  target: string;
}): Promise<{
  enhanced: string;
  improvements: string[];
  metrics: any;
}> {
  try {
    const systemPrompt = `You are a content optimization expert. Enhance web content for better ${params.enhancement} while maintaining brand voice and accuracy. Respond with JSON in this format: {
      "enhanced": "Improved content",
      "improvements": ["List of improvements made"],
      "metrics": {"readability": 0-100, "estimated_impact": "description"}
    }`;

    const userPrompt = `Enhance this content for ${params.enhancement} targeting ${params.target}:

${params.content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Content enhancement error:', error);
    throw new Error('Failed to enhance content');
  }
}