import { db } from './db';
import { users, websites, products, posts, communities, campaigns, plugins } from '../shared/schema';
import { hashPassword } from './auth';
import { randomUUID } from 'crypto';
async function seed() {
    // Starting database seeding
    try {
        // Creating demo users
        const hashedPassword = await hashPassword('password123');
        const demoUsers = await db.insert(users).values([
            {
                id: randomUUID(),
                username: 'admin',
                email: 'admin@echoverse.com',
                password: hashedPassword,
                role: 'admin',
                displayName: 'Admin User',
            },
            {
                id: randomUUID(),
                username: 'john_doe',
                email: 'john@example.com',
                password: hashedPassword,
                role: 'user',
                displayName: 'John Doe',
            },
            {
                id: randomUUID(),
                username: 'jane_smith',
                email: 'jane@example.com',
                password: hashedPassword,
                role: 'user',
                displayName: 'Jane Smith',
            },
        ]).returning();
        // Demo users created
        const adminId = demoUsers[0].id;
        const johnId = demoUsers[1].id;
        const janeId = demoUsers[2].id;
        // Creating demo websites
        const demoWebsites = await db.insert(websites).values([
            {
                id: randomUUID(),
                userId: johnId,
                name: 'My Portfolio',
                domain: 'john-portfolio',
                status: 'published',
                theme: 'modern',
                pages: JSON.stringify([
                    {
                        id: 'home',
                        title: 'Home',
                        slug: '/',
                        content: '<h1>Welcome to My Portfolio</h1><p>Check out my work!</p>',
                    },
                    {
                        id: 'about',
                        title: 'About',
                        slug: '/about',
                        content: '<h1>About Me</h1><p>I am a web developer...</p>',
                    },
                ]),
                settings: JSON.stringify({
                    primaryColor: '#3b82f6',
                    fontFamily: 'Inter',
                    logoUrl: '',
                }),
            },
            {
                id: randomUUID(),
                userId: janeId,
                name: 'Jane\'s Blog',
                domain: 'jane-blog',
                status: 'published',
                theme: 'minimal',
                pages: JSON.stringify([
                    {
                        id: 'home',
                        title: 'Home',
                        slug: '/',
                        content: '<h1>Welcome to My Blog</h1>',
                    },
                ]),
                settings: JSON.stringify({
                    primaryColor: '#10b981',
                    fontFamily: 'Georgia',
                    logoUrl: '',
                }),
            },
        ]).returning();
        // Demo websites created
        // Creating demo products
        const demoProducts = await db.insert(products).values([
            {
                id: randomUUID(),
                userId: johnId,
                name: 'Premium Theme Bundle',
                description: 'Collection of 10 premium website themes',
                price: 4999,
                currency: 'usd',
                category: 'digital-products',
                isActive: true,
                stock: 999,
                images: JSON.stringify(['https://images.unsplash.com/photo-1517694712202-14dd9538aa97']),
            },
            {
                id: randomUUID(),
                userId: janeId,
                name: 'Web Design Course',
                description: 'Complete web design course for beginners',
                price: 9999,
                currency: 'usd',
                category: 'courses',
                isActive: true,
                stock: 999,
                images: JSON.stringify(['https://images.unsplash.com/photo-1498050108023-c5249f4df085']),
            },
            {
                id: randomUUID(),
                userId: johnId,
                name: 'Logo Design Service',
                description: 'Professional logo design for your brand',
                price: 14999,
                currency: 'usd',
                category: 'services',
                isActive: true,
                stock: 50,
                images: JSON.stringify(['https://images.unsplash.com/photo-1626785774625-ddcddc3445e9']),
            },
        ]).returning();
        // Demo products created
        // Creating demo blog posts
        const demoPosts = await db.insert(posts).values([
            {
                id: randomUUID(),
                userId: janeId,
                title: 'Getting Started with Web Development',
                slug: 'getting-started-with-web-development',
                content: '<p>Web development is an exciting field with endless possibilities...</p>',
                excerpt: 'Learn the basics of web development in this comprehensive guide.',
                status: 'published',
                type: 'post',
                publishedAt: new Date(),
                featuredImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
                tags: JSON.stringify(['web-development', 'tutorial', 'beginner']),
            },
            {
                id: randomUUID(),
                userId: johnId,
                title: 'Design Trends for 2025',
                slug: 'design-trends-2025',
                content: '<p>Discover the latest design trends shaping the industry...</p>',
                excerpt: 'Explore the design trends that will dominate in 2025.',
                status: 'published',
                type: 'post',
                publishedAt: new Date(),
                featuredImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
                tags: JSON.stringify(['design', 'trends', '2025']),
            },
            {
                id: randomUUID(),
                userId: janeId,
                title: 'Building Your First Website',
                slug: 'building-your-first-website',
                content: '<p>Step-by-step guide to creating your first website...</p>',
                excerpt: 'A beginner-friendly guide to building your first website.',
                status: 'draft',
                type: 'post',
                featuredImage: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d',
                tags: JSON.stringify(['tutorial', 'beginner', 'website']),
            },
        ]).returning();
        // Demo posts created
        // Creating demo communities
        const demoCommunities = await db.insert(communities).values([
            {
                id: randomUUID(),
                name: 'Web Developers',
                slug: 'web-developers',
                description: 'A community for web developers to share knowledge and collaborate',
                ownerId: adminId,
                isPrivate: false,
                memberCount: 0,
                settings: JSON.stringify({
                    allowPosts: true,
                    requireApproval: false,
                }),
            },
            {
                id: randomUUID(),
                name: 'Design Enthusiasts',
                slug: 'design-enthusiasts',
                description: 'Share your designs and get feedback from the community',
                ownerId: janeId,
                isPrivate: false,
                memberCount: 0,
                settings: JSON.stringify({
                    allowPosts: true,
                    requireApproval: false,
                }),
            },
        ]).returning();
        // Demo communities created
        // Creating demo campaigns
        const demoCampaigns = await db.insert(campaigns).values([
            {
                id: randomUUID(),
                userId: johnId,
                name: 'Summer Sale 2025',
                type: 'email',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                settings: JSON.stringify({
                    subject: 'Summer Sale - Up to 50% Off!',
                    targetAudience: 'all-subscribers',
                }),
                metrics: JSON.stringify({
                    sent: 0,
                    opened: 0,
                    clicked: 0,
                    converted: 0,
                }),
            },
            {
                id: randomUUID(),
                userId: janeId,
                name: 'Newsletter - Week 1',
                type: 'email',
                status: 'draft',
                settings: JSON.stringify({
                    subject: 'Weekly Newsletter',
                    targetAudience: 'subscribers',
                }),
                metrics: JSON.stringify({
                    sent: 0,
                    opened: 0,
                    clicked: 0,
                    converted: 0,
                }),
            },
        ]).returning();
        // Demo campaigns created
        // Creating demo plugins
        const demoPlugins = await db.insert(plugins).values([
            {
                id: randomUUID(),
                name: 'Analytics Dashboard',
                slug: 'analytics-dashboard',
                description: 'Advanced analytics and reporting for your website',
                developerId: johnId,
                version: '1.0.0',
                price: 2999,
                category: 'analytics',
                isActive: true,
                downloads: 0,
                rating: 0,
                reviewCount: 0,
                features: JSON.stringify([
                    'Real-time visitor tracking',
                    'Custom reports',
                    'Goal tracking',
                    'Conversion funnels',
                ]),
            },
            {
                id: randomUUID(),
                name: 'SEO Optimizer',
                slug: 'seo-optimizer',
                description: 'Boost your search engine rankings with AI-powered SEO',
                developerId: janeId,
                version: '1.2.0',
                price: 1999,
                category: 'seo',
                isActive: true,
                downloads: 0,
                rating: 0,
                reviewCount: 0,
                features: JSON.stringify([
                    'Keyword analysis',
                    'Meta tag optimization',
                    'Sitemap generation',
                    'Backlink monitoring',
                ]),
            },
            {
                id: randomUUID(),
                name: 'Social Media Manager',
                slug: 'social-media-manager',
                description: 'Schedule and manage all your social media posts',
                developerId: adminId,
                version: '2.0.0',
                price: 3999,
                category: 'marketing',
                isActive: true,
                downloads: 0,
                rating: 0,
                reviewCount: 0,
                features: JSON.stringify([
                    'Multi-platform scheduling',
                    'Content calendar',
                    'Analytics integration',
                    'Team collaboration',
                ]),
            },
        ]).returning();
        // Demo plugins created
        // Database seeding completed successfully
        // Demo credentials available:
        // Admin: admin@echoverse.com / password123
        // User 1: john@example.com / password123
        // User 2: jane@example.com / password123
    }
    catch (error) {
        // Error seeding database
        throw error;
    }
}
seed()
    .then(() => {
    // Seeding complete, exiting
    process.exit(0);
})
    .catch((error) => {
    // Seed failed
    process.exit(1);
});
