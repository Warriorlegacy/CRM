const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'piyushrajsingh092@gmail.com', mode: 'insensitive' } },
  });
  console.log('User found:', user ? user.email : 'None');

  if (user) {
    const tokens = await prisma.verificationToken.findMany({
      where: { userId: user.id },
      orderBy: { expiresAt: 'desc' },
    });
    console.log('Tokens for user:', tokens);
  } else {
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
    console.log('All registered users:', allUsers);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
