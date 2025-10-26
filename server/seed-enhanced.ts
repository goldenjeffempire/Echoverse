/**
 * LOW-043: Enhanced Development Database Seeding
 */
import { db } from './db';
import { users, products, orders, posts, communities, notifications } from '../shared/schema';
import bcrypt from 'bcrypt';

const sampleUsers = [
  { email: 'admin@echoverse.com', username: 'admin', role: 'admin', name: 'Admin User' },
  { email: 'john@example.com', username: 'john_doe', role: 'user', name: 'John Doe' },
  { email: 'jane@example.com', username: 'jane_smith', role: 'user', name: 'Jane Smith' },
  { email: 'merchant@example.com', username: 'merchant', role: 'merchant', name: 'Merchant User' },
  { email: 'creator@example.com', username: 'creator', role: 'creator', name: 'Content Creator' },
];

const sampleProducts = [
  { name: 'Premium Template Pack', description: 'Professional website templates', price: '49.99', category: 'Templates', sku: 'TEMP-001' },
  { name: 'AI Writing Assistant', description: 'Advanced AI content generation', price: '29.99', category: 'AI Tools', sku: 'AI-001' },
  { name: 'E-commerce Starter', description: 'Complete e-commerce solution', price: '99.99', category: 'Bundles', sku: 'ECOM-001' },
  { name: 'Marketing Suite', description: 'All-in-one marketing tools', price: '79.99', category: 'Marketing', sku: 'MARK-001' },
  { name: 'Analytics Pro', description: 'Advanced analytics platform', price: '39.99', category: 'Analytics', sku: 'ANLT-001' },
];

const samplePosts = [
  { title: 'Getting Started with EchoVerse', slug: 'getting-started', content: 'Complete guide to getting started...', status: 'published', type: 'post' },
  { title: 'Best Practices for Web Design', slug: 'web-design-best-practices', content: 'Learn the best practices...', status: 'published', type: 'post' },
  { title: 'How to Optimize SEO', slug: 'optimize-seo', content: 'SEO optimization techniques...', status: 'published', type: 'post' },
  { title: 'E-commerce Success Stories', slug: 'ecommerce-success', content: 'Real success stories from...', status: 'draft', type: 'post' },
];

const sampleCommunities = [
  { name: 'Web Developers', slug: 'web-developers', description: 'Community for web developers', type: 'public' },
  { name: 'Designers Hub', slug: 'designers-hub', description: 'Design community', type: 'public' },
  { name: 'Entrepreneurs', slug: 'entrepreneurs', description: 'For business owners', type: 'public' },
];

export async function seedDevelopmentData() {
  console.log('🌱 Seeding development database...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(notifications);
    await db.delete(orders);
    await db.delete(posts);
    await db.delete(communities);
    await db.delete(products);
    await db.delete(users);

    // Seed users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const createdUsers = [];
    for (const user of sampleUsers) {
      const [created] = await db.insert(users).values({
        email: user.email,
        username: user.username,
        password: hashedPassword,
        role: user.role as any,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || '',
        isEmailVerified: true,
      }).returning();
      createdUsers.push(created);
      console.log(`  ✓ Created user: ${user.email}`);
    }

    // Seed products
    console.log('Creating products...');
    const createdProducts = [];
    for (const product of sampleProducts) {
      const [created] = await db.insert(products).values({
        userId: createdUsers[0].id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        sku: product.sku,
        inventory: Math.floor(Math.random() * 100) + 10,
        isActive: true,
      }).returning();
      createdProducts.push(created);
      console.log(`  ✓ Created product: ${product.name}`);
    }

    // Seed communities
    console.log('Creating communities...');
    for (const community of sampleCommunities) {
      await db.insert(communities).values({
        name: community.name,
        slug: community.slug,
        description: community.description,
        ownerId: createdUsers[0].id,
        isPrivate: community.type === 'private',
      });
      console.log(`  ✓ Created community: ${community.name}`);
    }

    // Seed posts
    console.log('Creating posts...');
    for (const post of samplePosts) {
      await db.insert(posts).values({
        userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        status: post.status,
        type: post.type,
        publishedAt: post.status === 'published' ? new Date() : null,
      });
      console.log(`  ✓ Created post: ${post.title}`);
    }

    // Seed sample orders
    console.log('Creating sample orders...');
    for (let i = 0; i < 5; i++) {
      const subtotal = String((Math.random() * 200 + 50).toFixed(2));
      await db.insert(orders).values({
        userId: createdUsers[Math.floor(Math.random() * (createdUsers.length - 1)) + 1].id,
        customerEmail: createdUsers[i % createdUsers.length].email,
        status: ['pending', 'processing', 'paid', 'cancelled'][Math.floor(Math.random() * 4)] as any,
        subtotal,
        total: subtotal,
        totalAmount: subtotal,
        currency: 'usd',
        items: JSON.stringify([{
          productId: createdProducts[i % createdProducts.length].id,
          name: createdProducts[i % createdProducts.length].name,
          price: createdProducts[i % createdProducts.length].price,
          quantity: Math.floor(Math.random() * 3) + 1,
        }]),
      });
    }
    console.log(`  ✓ Created 5 sample orders`);

    console.log('✅ Database seeding complete!');
    console.log('\nTest Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sampleUsers.forEach(u => {
      console.log(`  ${u.role.toUpperCase()}: ${u.email} / password123`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDevelopmentData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
