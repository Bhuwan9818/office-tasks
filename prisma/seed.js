const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const users = [
    { name: 'aman', email: 'aman@office.com', password: 'aman123' },
    { name: 'anjali', email: 'anjali@office.com', password: 'anjali123' },
    { name: 'bhuwan', email: 'bhuwan@office.com', password: 'bhuwan123' },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashed,
      },
    });
    console.log(`✅ Created user: ${user.name} (${user.email}) — password: ${user.password}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('Login credentials:');
  console.log('  aman: aman@office.com / pass1234');
  console.log('  anjali: anjali@office.com / pass1234');
  console.log('  bhuwan: bhuwan@office.com / pass1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
