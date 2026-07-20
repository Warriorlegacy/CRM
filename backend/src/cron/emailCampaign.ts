import { prisma } from '../prisma';
import { sendCampaign } from '../services/emailAutomation';
import { logger } from '../middleware/logger';

const CAMPAIGN_POLL_INTERVAL_MS = 60_000; // Check every 60 seconds

export async function processScheduledCampaigns() {
  logger.info('📧 Processing scheduled email campaigns...');

  try {
    const dueCampaigns = await prisma.emailCampaign.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: new Date() },
      },
    });

    if (dueCampaigns.length === 0) {
      logger.info('No scheduled campaigns due.');
      return;
    }

    logger.info(`Found ${dueCampaigns.length} scheduled campaign(s) to send.`);

    for (const campaign of dueCampaigns) {
      logger.info(`Sending scheduled campaign: ${campaign.name} (${campaign.id})`);

      // Fire and forget - sendCampaign handles its own error logging
      sendCampaign(campaign.id).catch((err) => {
        logger.error(`Scheduled campaign ${campaign.id} failed`, { error: err });
      });
    }
  } catch (err: any) {
    logger.error('Failed to process scheduled campaigns', { error: err.message });
  }
}

export function startEmailCampaignCron() {
  // Run immediately on startup
  setImmediate(async () => {
    try {
      await processScheduledCampaigns();
    } catch (err: any) {
      logger.error('Initial campaign processing failed', { error: err.message });
    }
  });

  // Then run periodically
  const timer = setInterval(async () => {
    try {
      await processScheduledCampaigns();
    } catch (err: any) {
      logger.error('Email campaign cron failed', { error: err.message });
    }
  }, CAMPAIGN_POLL_INTERVAL_MS);

  return () => clearInterval(timer);
}
