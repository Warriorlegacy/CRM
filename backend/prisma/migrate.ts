import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running database migrations...');

  // Create ContactNote table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ContactNote (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workspaceId TEXT NOT NULL,
      contactId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'note',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created ContactNote table');

  // Create Autoresponder table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Autoresponder (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workspaceId TEXT NOT NULL,
      name TEXT NOT NULL,
      trigger TEXT NOT NULL,
      keyword TEXT,
      delayMinutes INTEGER DEFAULT 0,
      message TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      stages TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created Autoresponder table');

  // Create WebhookLog table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS WebhookLog (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workspaceId TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT,
      status TEXT DEFAULT 'success',
      error TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created WebhookLog table');

  // Add indexes
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_contactnote_workspace ON ContactNote(workspaceId)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_contactnote_contact ON ContactNote(contactId)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autoresponder_workspace ON Autoresponder(workspaceId)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autoresponder_active ON Autoresponder(isActive)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_webhooklog_workspace ON WebhookLog(workspaceId)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_webhooklog_type ON WebhookLog(type)
  `);

  console.log('Created indexes');

  // Add category column to Template if not exists (for SQLite)
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Template ADD COLUMN category TEXT DEFAULT 'utility'
    `);
  } catch (e) {
    // Column might already exist
  }

  console.log('Migration completed!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
