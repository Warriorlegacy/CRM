import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3600_000);
}

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60_000);
}

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const agentPassword = await bcrypt.hash('Agent@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rideright.in' },
    update: {},
    create: { email: 'admin@rideright.in', password: adminPassword, name: 'Vikram Patel' },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@rideright.in' },
    update: {},
    create: { email: 'agent@rideright.in', password: agentPassword, name: 'Priya Singh' },
  });

  const existingWorkspace = await prisma.workspace.findUnique({ where: { slug: 'rideright-motors' } });
  if (existingWorkspace) {
    console.log('Database already seeded, skipping.');
    await prisma.$disconnect();
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: 'RideRight Motors',
      slug: 'rideright-motors',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'admin' },
          { userId: agent.id, role: 'agent' },
        ],
      },
    },
  });

  // ── WhatsApp Contacts ───────────────────────────────────────────────
  const waContacts = [
    {
      name: 'Amit Sharma',
      phone: '919876543210',
      channel: 'whatsapp',
      stage: 'lead',
      leadScore: 72,
      tags: 'Hot,Bike enquiry',
      unreadCount: 2,
      lastMessageAt: minutesAgo(5),
    },
    {
      name: 'Neha Verma',
      phone: '919123456789',
      channel: 'whatsapp',
      stage: 'followup',
      leadScore: 45,
      tags: 'Warm,Test ride booked',
      unreadCount: 1,
      lastMessageAt: minutesAgo(18),
    },
    {
      name: 'Rohit Singh',
      phone: '919000011111',
      channel: 'whatsapp',
      stage: 'negotiation',
      leadScore: 88,
      tags: 'Hot,Financing',
      unreadCount: 0,
      lastMessageAt: hoursAgo(1),
    },
    {
      name: 'Priya Joshi',
      phone: '919876500001',
      channel: 'whatsapp',
      stage: 'new',
      leadScore: 15,
      tags: 'Cold',
      unreadCount: 0,
      lastMessageAt: daysAgo(2),
    },
    {
      name: 'Vikram Rao',
      phone: '919876500002',
      channel: 'whatsapp',
      stage: 'won',
      leadScore: 95,
      tags: 'Converted,Premium',
      unreadCount: 0,
      lastMessageAt: daysAgo(5),
    },
  ];

  const igContacts = [
    {
      name: 'Sneha Kulkarni',
      phone: 'ig_sneha.k',
      igUsername: 'sneha.k',
      channel: 'instagram',
      stage: 'lead',
      leadScore: 62,
      tags: 'Hot,Instagram DM',
      unreadCount: 3,
      lastMessageAt: minutesAgo(12),
    },
    {
      name: 'Arjun Mehta',
      phone: 'ig_arjun_rides',
      igUsername: 'arjun_rides',
      channel: 'instagram',
      stage: 'followup',
      leadScore: 38,
      tags: 'Warm,Story reply',
      unreadCount: 0,
      lastMessageAt: hoursAgo(3),
    },
    {
      name: 'Kavita Nair',
      phone: 'ig_kavita.nair',
      igUsername: 'kavita.nair',
      channel: 'instagram',
      stage: 'new',
      leadScore: 10,
      tags: 'Cold',
      unreadCount: 1,
      lastMessageAt: daysAgo(1),
    },
  ];

  const allContacts = [...waContacts, ...igContacts];

  const createdContacts = [];
  for (const c of allContacts) {
    const contact = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        name: c.name,
        phone: c.phone,
        igUsername: (c as any).igUsername,
        channel: c.channel,
        stage: c.stage,
        leadScore: c.leadScore,
        tags: c.tags,
        unreadCount: c.unreadCount,
        lastMessageAt: c.lastMessageAt,
        assignedToId: Math.random() > 0.5 ? admin.id : agent.id,
      },
    });
    createdContacts.push(contact);
  }

  // ── Conversations + Messages ────────────────────────────────────────
  const waConversationTexts: Record<string, string[]> = {
    'Amit Sharma': [
      'Hi, do you have the new Dominar 400 in stock?',
      'Yes we do! Matte Black and Cosmic Blue available. Want to come for a test ride?',
      'Awesome! Can I come this Saturday morning?',
      'Saturday 10 AM works. I\'ll book the slot. Which model colour interests you?',
      'Matte Black please!',
    ],
    'Neha Verma': [
      'Hello, I saw your Instagram reel about the NS400. Price kya hai?',
      'NS400 starts at ₹1,85,000 (ex-showroom). We also have exchange offers!',
      'I have an old Pulsar 150. Any exchange bonus?',
      'Absolutely! Up to ₹15,000 exchange bonus on NS series. Want me to get a valuation done?',
      'Yes please, how do I share my bike details?',
    ],
    'Rohit Singh': [
      'Bhai, final price batao FZ-X ke liye. serious buyer hoon.',
      'Rohit ji, best deal: ₹1,42,000 on-road including accessories kit. This is our festival price.',
      '₹1,38,000 mein ho jayega kya? Cash ready hain.',
      'Let me check with manager. Can you visit today or tomorrow?',
      'Aaj evening 6 PM theek hai.',
    ],
    'Priya Joshi': [
      'Kya aapke yahan scoyti available hai?',
      'Ji, Activa 6G, Jupiter, aur TVS IQube electric bhi available hai. Kaunsa dekhna hai?',
      'Activa 6G ka price?',
      'Activa 6G DLX: ₹72,000 on-road. Want me to share the full variant-wise price list?',
    ],
    'Vikram Rao': [
      'Sir, delivery lene aa raha hoon aaj. Time?',
      'Congratulations! Your bike is ready. Any time after 11 AM. Bring your ID and insurance copy.',
      'Thanks! Bike kitni achhi lag rahi hai showroom mein 🔥',
      'Glad you love it! Ride safe and do share photos with #RideRight',
    ],
  };

  const igConversationTexts: Record<string, string[]> = {
    'Sneha Kulkarni': [
      'Hey! Saw your story about the electric bike range. Is the TVS iQube good for city commute?',
      'Hey Sneha! Yes, iQube is perfect for city rides — 75 km range, super smooth. Want a detailed walkthrough?',
      'Yes! Also do you have any exchange offers?',
      'We do! Up to ₹8,000 exchange bonus on any old two-wheeler. Want to schedule a visit?',
      'Can I come this Sunday?',
      'Sunday works! I\'ll book 11 AM slot for you. See you then!',
    ],
    'Arjun Mehta': [
      'Your reel on the Dominar touring setup was amazing! How much for the full accessory kit?',
      'Thanks Arjun! The touring kit (windshield, saddle stays, crash guard) is ₹12,500 fitted. We can do ₹11,000 if you buy with a new bike.',
      'Nice. I already own a Dominar 2019. Can I get just the crash guard?',
      'Yes! Crash guard alone is ₹3,800 fitted. Want me to check stock?',
      'Sure, let me know. I\'ll visit next week.',
    ],
    'Kavita Nair': [
      'Hi, do you service bikes from other brands too?',
      'Hi Kavita! We primarily service Bajaj, KTM, and Husqvarna. What bike do you have?',
      'I have a Honda CB350.',
      'Ah, we don\'t service Honda currently. But we can recommend a trusted partner nearby. Want the contact?',
    ],
  };

  for (const contact of createdContacts) {
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact.id,
        channel: contact.channel,
        status: contact.stage === 'won' ? 'closed' : 'open',
      },
    });

    const contactName = contact.name || '';
    const texts =
      contact.channel === 'whatsapp'
        ? waConversationTexts[contactName] || []
        : igConversationTexts[contactName] || [];

    for (let i = 0; i < texts.length; i++) {
      const isInbound = i % 2 === 0;
      await prisma.message.create({
        data: {
          workspaceId: workspace.id,
          conversationId: conversation.id,
          contactId: contact.id,
          channel: contact.channel,
          direction: isInbound ? 'inbound' : 'outbound',
          type: 'text',
          bodyText: texts[i],
          sentByUserId: isInbound ? null : (Math.random() > 0.5 ? admin.id : agent.id),
          createdAt: minutesAgo((texts.length - i) * 12),
        },
      });
    }
  }

  // ── Chatbot Flows ───────────────────────────────────────────────────
  const welcomeFlow = await prisma.chatbotFlow.create({
    data: {
      workspaceId: workspace.id,
      name: 'Welcome & Qualify',
      description: 'Greet new contacts and ask about their interest',
      trigger: 'new_contact',
      channels: 'whatsapp,instagram',
      isActive: true,
    },
  });

  const welcomeNodes = await Promise.all([
    prisma.flowNode.create({
      data: {
        flowId: welcomeFlow.id,
        type: 'message',
        label: 'Welcome Message',
        content: 'Namaste! 🙏 Welcome to RideRight Motors. I\'m here to help you find the perfect ride. Are you looking for a bike or a scooter?',
        positionX: 100,
        positionY: 100,
      },
    }),
    prisma.flowNode.create({
      data: {
        flowId: welcomeFlow.id,
        type: 'question',
        label: 'Vehicle Type',
        content: 'Bike or Scooter?',
        positionX: 100,
        positionY: 250,
        config: JSON.stringify({ options: ['Bike', 'Scooter', 'Electric'] }),
      },
    }),
    prisma.flowNode.create({
      data: {
        flowId: welcomeFlow.id,
        type: 'action',
        label: 'Tag as Lead',
        content: 'Add tag: qualified-lead',
        positionX: 100,
        positionY: 400,
        config: JSON.stringify({ action: 'add_tag', value: 'qualified-lead' }),
      },
    }),
    prisma.flowNode.create({
      data: {
        flowId: welcomeFlow.id,
        type: 'message',
        label: 'Bike Models',
        content: 'Great choice! Our popular bikes: Dominar 400 (₹2.15L), NS400 (₹1.85L), Pulsar N250 (₹1.45L). Want a test ride?',
        positionX: 300,
        positionY: 500,
      },
    }),
  ]);

  await Promise.all([
    prisma.flowEdge.create({
      data: {
        flowId: welcomeFlow.id,
        sourceId: welcomeNodes[0].id,
        targetId: welcomeNodes[1].id,
        label: 'Next',
      },
    }),
    prisma.flowEdge.create({
      data: {
        flowId: welcomeFlow.id,
        sourceId: welcomeNodes[1].id,
        targetId: welcomeNodes[2].id,
        label: 'Bike',
      },
    }),
    prisma.flowEdge.create({
      data: {
        flowId: welcomeFlow.id,
        sourceId: welcomeNodes[2].id,
        targetId: welcomeNodes[3].id,
        label: 'Next',
      },
    }),
  ]);

  // Pricing flow
  const pricingFlow = await prisma.chatbotFlow.create({
    data: {
      workspaceId: workspace.id,
      name: 'Pricing Auto-Reply',
      description: 'Auto-reply to pricing keyword with current offers',
      trigger: 'keyword',
      triggerKeyword: 'price',
      channels: 'whatsapp,instagram',
      isActive: true,
    },
  });

  const priceNodes = await Promise.all([
    prisma.flowNode.create({
      data: {
        flowId: pricingFlow.id,
        type: 'message',
        label: 'Pricing Info',
        content: 'Here are our current prices (June 2026):\n\n🏍 Dominar 400 — ₹2,15,000\n🏍 NS400 — ₹1,85,000\n🏍 Pulsar N250 — ₹1,45,000\n🛵 Activa 6G — ₹72,000\n⚡ TVS iQube — ₹1,25,000\n\nFestival offers running! Want to visit the showroom?',
        positionX: 100,
        positionY: 100,
      },
    }),
  ]);

  // ── Lead Scoring Rules ──────────────────────────────────────────────
  await Promise.all([
    prisma.leadScoringRule.create({
      data: {
        workspaceId: workspace.id,
        name: 'First message',
        event: 'message_sent',
        points: 5,
        isActive: true,
      },
    }),
    prisma.leadScoringRule.create({
      data: {
        workspaceId: workspace.id,
        name: 'Reply within 5 min',
        event: 'quick_reply',
        points: 10,
        conditions: JSON.stringify({ maxResponseTime: 300 }),
        isActive: true,
      },
    }),
    prisma.leadScoringRule.create({
      data: {
        workspaceId: workspace.id,
        name: 'Test ride booked',
        event: 'tag_added',
        points: 20,
        conditions: JSON.stringify({ tag: 'Test ride booked' }),
        isActive: true,
      },
    }),
    prisma.leadScoringRule.create({
      data: {
        workspaceId: workspace.id,
        name: 'Visit scheduled',
        event: 'tag_added',
        points: 15,
        conditions: JSON.stringify({ tag: 'Visit scheduled' }),
        isActive: true,
      },
    }),
  ]);

  // ── Contact Notes ───────────────────────────────────────────────────
  const amitContact = createdContacts[0];
  const rohitContact = createdContacts[2];

  await Promise.all([
    prisma.contactNote.create({
      data: {
        workspaceId: workspace.id,
        contactId: amitContact.id,
        userId: admin.id,
        content: 'Interested in Dominar 400 Matte Black. Prefers Saturday morning for test ride.',
        category: 'interest',
        channel: 'whatsapp',
      },
    }),
    prisma.contactNote.create({
      data: {
        workspaceId: workspace.id,
        contactId: amitContact.id,
        userId: agent.id,
        content: 'High intent buyer. Follow up after test ride with financing options.',
        category: 'followup',
        channel: 'whatsapp',
      },
    }),
    prisma.contactNote.create({
      data: {
        workspaceId: workspace.id,
        contactId: rohitContact.id,
        userId: admin.id,
        content: 'Negotiating hard on FZ-X. Offered ₹1,42,000. Wants ₹1,38,000. Visit today evening.',
        category: 'deal',
        channel: 'whatsapp',
      },
    }),
  ]);

  // ── Follow-ups ──────────────────────────────────────────────────────
  await Promise.all([
    prisma.followup.create({
      data: {
        workspaceId: workspace.id,
        contactId: amitContact.id,
        assignedToId: admin.id,
        dueAt: daysAgo(-2), // 2 days from now
        note: 'Confirm test ride slot for Saturday 10 AM',
        status: 'pending',
      },
    }),
    prisma.followup.create({
      data: {
        workspaceId: workspace.id,
        contactId: rohitContact.id,
        assignedToId: agent.id,
        dueAt: hoursAgo(2), // 2 hours from now
        note: 'Finalize deal at ₹1,38,000 if approved by manager',
        status: 'pending',
      },
    }),
  ]);

  // ── Templates ───────────────────────────────────────────────────────
  await Promise.all([
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        title: 'Test Ride Confirmation',
        body: 'Hi {name}! 🏍 Your test ride is confirmed for {date} at {time}. Please bring a valid ID. See you at RideRight Motors!',
        category: 'utility',
      },
    }),
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        title: 'Festival Offer',
        body: 'Hey {name}! 🎉 RideRight Festival Sale is ON! Get up to ₹15,000 exchange bonus + free accessories on select models. Visit us this weekend!',
        category: 'marketing',
      },
    }),
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        title: 'Follow-up After Visit',
        body: 'Hi {name}, thanks for visiting RideRight Motors! 🙏 Did you get a chance to think about the {model}? Happy to answer any questions.',
        category: 'utility',
      },
    }),
  ]);

  // ── Autoresponders ──────────────────────────────────────────────────
  await Promise.all([
    prisma.autoresponder.create({
      data: {
        workspaceId: workspace.id,
        name: 'Outside Hours',
        trigger: 'keyword',
        keyword: 'hours',
        message: 'Our showroom is open Mon-Sat 10 AM - 8 PM, Sunday 11 AM - 6 PM. How can I help?',
        isActive: true,
      },
    }),
    prisma.autoresponder.create({
      data: {
        workspaceId: workspace.id,
        name: 'Location Reply',
        trigger: 'keyword',
        keyword: 'location',
        message: 'RideRight Motors, 42 MG Road, Near City Mall, Pune 411001. Google Maps: maps.app.link/ridereight. See you soon! 📍',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ RideRight Motors seed complete');
  console.log('   Admin:  admin@rideright.in / Admin@123');
  console.log('   Agent:  agent@rideright.in / Agent@123');
  console.log(`   Contacts: ${createdContacts.length} (${waContacts.length} WA + ${igContacts.length} IG)`);
  console.log('   Chatbot flows: 2 (Welcome + Pricing)');
  console.log('   Follow-ups: 2 pending');
  console.log('   Templates: 3');
  console.log('   Autoresponders: 2');
  console.log('   Lead scoring rules: 4');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
