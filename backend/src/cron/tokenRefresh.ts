import { prisma } from '../prisma';
import { exchangeForLongLivedToken } from '../routes/oauth';
import { logger } from '../middleware/logger';

export async function refreshAllMetaTokens() {
  logger.info('🔄 Starting scheduled Meta OAuth token refresh...');
  
  // 1. Refresh WhatsApp Tokens
  try {
    const waAccounts = await prisma.waAccount.findMany();
    logger.info(`Found ${waAccounts.length} WhatsApp accounts to check/refresh.`);
    
    for (const wa of waAccounts) {
      try {
        const newToken = await exchangeForLongLivedToken(wa.accessToken);
        await prisma.waAccount.update({
          where: { id: wa.id },
          data: { accessToken: newToken, updatedAt: new Date() },
        });
        logger.info(`✅ Successfully refreshed WhatsApp token for workspace ${wa.workspaceId}`);
      } catch (err: any) {
        logger.error(`❌ Failed to refresh WhatsApp token for workspace ${wa.workspaceId}`, {
          error: err.message,
        });
      }
    }
  } catch (err: any) {
    logger.error('Error fetching WhatsApp accounts for token refresh', { error: err.message });
  }

  // 2. Refresh Instagram Tokens
  try {
    const igAccounts = await prisma.igAccount.findMany();
    logger.info(`Found ${igAccounts.length} Instagram accounts to check/refresh.`);
    
    for (const ig of igAccounts) {
      try {
        const newToken = await exchangeForLongLivedToken(ig.accessToken);
        await prisma.igAccount.update({
          where: { id: ig.id },
          data: { accessToken: newToken, updatedAt: new Date() },
        });
        logger.info(`✅ Successfully refreshed Instagram token for workspace ${ig.workspaceId}`);
      } catch (err: any) {
        logger.error(`❌ Failed to refresh Instagram token for workspace ${ig.workspaceId}`, {
          error: err.message,
        });
      }
    }
  } catch (err: any) {
    logger.error('Error fetching Instagram accounts for token refresh', { error: err.message });
  }

  logger.info('🔄 Meta OAuth token refresh run completed.');
}

export function startTokenRefreshCron() {
  // Run on startup
  // We wrap it in setImmediate to avoid blocking the main server startup loop
  setImmediate(async () => {
    try {
      await refreshAllMetaTokens();
    } catch (err: any) {
      logger.error('Initial startup token refresh failed', { error: err.message });
    }
  });

  // Run every 24 hours (24 * 60 * 60 * 1000 milliseconds)
  const INTERVAL_24H = 24 * 60 * 60 * 1000;
  const timer = setInterval(async () => {
    try {
      await refreshAllMetaTokens();
    } catch (err: any) {
      logger.error('Scheduled token refresh failed', { error: err.message });
    }
  }, INTERVAL_24H);

  return () => clearInterval(timer);
}
