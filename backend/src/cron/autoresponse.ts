import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';
import { logger } from '../middleware/logger';

const BATCH_SIZE = 50;

export async function processPendingAutoresponses() {
  logger.info('⏰ Processing pending autoresponses...');

  const pending = await prisma.pendingAutoresponse.findMany({
    where: {
      sent: false,
      sendAt: { lte: new Date() },
    },
    take: BATCH_SIZE,
  });

  if (pending.length === 0) {
    logger.info('No pending autoresponses to send.');
    return;
  }

  logger.info(`Found ${pending.length} pending autoresponses to send.`);

  for (const item of pending) {
    try {
      const wa = await prisma.waAccount.findUnique({
        where: { workspaceId: item.workspaceId },
      });

      if (!wa) {
        logger.warn(`No WhatsApp account found for workspace ${item.workspaceId}, skipping autoresponse.`);
        await prisma.pendingAutoresponse.update({
          where: { id: item.id },
          data: { sent: true }, // Mark as sent to avoid retrying forever
        });
        continue;
      }

      const contact = await prisma.contact.findUnique({
        where: { id: item.contactId },
      });

      if (!contact) {
        logger.warn(`Contact ${item.contactId} not found, skipping autoresponse.`);
        await prisma.pendingAutoresponse.update({
          where: { id: item.id },
          data: { sent: true },
        });
        continue;
      }

      await sendWhatsAppText({
        accessToken: wa.accessToken,
        phoneNumberId: wa.phoneNumberId,
        to: contact.phone,
        text: item.message,
      });

      await prisma.pendingAutoresponse.update({
        where: { id: item.id },
        data: { sent: true },
      });

      logger.info(`✅ Sent autoresponse ${item.id} to ${contact.phone}`);
    } catch (err: any) {
      logger.error(`❌ Failed to send autoresponse ${item.id}`, { error: err.message });
      // Don't mark as sent - will retry on next cron run
    }
  }
}

const AUTO_RESPONSE_POLL_INTERVAL_MS = 60_000; // Check every 60 seconds

export function startAutoresponseCron() {
  // Run immediately on startup (non-blocking)
  setImmediate(async () => {
    try {
      await processPendingAutoresponses();
    } catch (err: any) {
      logger.error('Initial autoresponse processing failed', { error: err.message });
    }
  });

  // Then run periodically
  const timer = setInterval(async () => {
    try {
      await processPendingAutoresponses();
    } catch (err: any) {
      logger.error('Autoresponse cron failed', { error: err.message });
    }
  }, AUTO_RESPONSE_POLL_INTERVAL_MS);

  return () => clearInterval(timer);
}
