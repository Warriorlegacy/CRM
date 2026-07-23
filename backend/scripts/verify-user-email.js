const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'piyushrajsingh092@gmail.com';
  const updated = await prisma.user.updateMany({
    where: { email: email.toLowerCase() },
    data: { emailVerified: true, active: true },
  });
  console.log(`Updated ${updated.count} user(s) to emailVerified = true`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
