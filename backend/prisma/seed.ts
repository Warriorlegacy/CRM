import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = 'admin@demo.com';
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: adminPassword, name: 'Admin' },
  });

  // Create agent user (for testing typing indicators)
  const agentEmail = 'agent@demo.com';
  const agentPassword = await bcrypt.hash('Agent@123', 10);

  const agent = await prisma.user.upsert({
    where: { email: agentEmail },
    update: {},
    create: { email: agentEmail, password: agentPassword, name: 'Sales Agent' },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Demo Workspace',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'admin' },
          { userId: agent.id, role: 'agent' },
        ],
      },
    },
  });

  // Create sample contacts with some unread messages
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        name: 'Amit Sharma',
        phone: '919876543210',
        stage: 'new',
        tags: 'Hot',
        unreadCount: 2,
        lastMessageAt: new Date(),
      },
    }),
    prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        name: 'Neha Verma',
        phone: '919123456789',
        stage: 'followup',
        tags: 'Warm',
        unreadCount: 1,
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 18),
      },
    }),
    prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        name: 'Rohit Singh',
        phone: '919000011111',
        stage: 'negotiation',
        tags: 'Hot',
        unreadCount: 0,
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    }),
  ]);

  // Create conversations and sample messages for contacts
  for (const contact of contacts) {
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact.id,
        status: 'open',
      },
    });

    // Add sample messages
    const messages = await Promise.all([
      prisma.message.create({
        data: {
          workspaceId: workspace.id,
          conversationId: conversation.id,
          contactId: contact.id,
          direction: 'inbound',
          type: 'text',
          bodyText: 'Hello, I am interested in your services',
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
      }),
      prisma.message.create({
        data: {
          workspaceId: workspace.id,
          conversationId: conversation.id,
          contactId: contact.id,
          direction: 'outbound',
          type: 'text',
          bodyText: 'Hi! Thanks for reaching out. How can I help you today?',
          sentByUserId: admin.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 55),
        },
      }),
    ]);

    // Add read receipt for the outbound message
    await prisma.readReceipt.create({
      data: {
        messageId: messages[1].id,
        userId: agent.id,
      },
    });
  }

  // Create sample templates
  await Promise.all([
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        title: 'Pricing Reply',
        body: 'Hi {name}, pricing ₹2999/mo se start hoti hai ✅',
      },
    }),
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        title: 'Demo Confirmation',
        body: 'Sure {name}! Demo ka time confirm kar do 🙂',
      },
    }),
  ]);

  console.log('✅ Seeded successfully:');
  console.log('  Admin:', admin.email);
  console.log('  Agent:', agent.email);
  console.log('  Workspace:', workspace.name);
  console.log('  Contacts:', contacts.length);
  console.log('  Sample messages created with read receipts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
