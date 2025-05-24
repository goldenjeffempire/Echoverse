// prisma/seed.ts
import { PrismaClient } from '../prisma/generated/prisma/index.js'; // <- ESM-compatible path with .js

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: 'hashedpassword', // Replace with hashed password in production
    },
  });

  console.log('✅ Seeded initial user');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
