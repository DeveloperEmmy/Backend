import db from '../db';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { recordBackgroundJob } from '../utils/metrics';

/**
 * Delete all sessions whose expiration timestamp is in the past.
 * Safe to call multiple times — it is idempotent.
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const startTime = Date.now();
  try {
    const result = await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    const duration = (Date.now() - startTime) / 1000;
    if (result.count > 0) {
      logger.info(`[SessionCleanup] Removed ${result.count} expired session(s)`);
    }
    recordBackgroundJob('session_cleanup', 'success', duration);
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.error('[SessionCleanup] Failed to clean up sessions:', error);
    recordBackgroundJob('session_cleanup', 'failed', duration);
  }
}

/**
 * Schedule the session cleanup job to run once every 24 hours.
 * Also runs immediately on startup to handle any sessions that expired
 * while the server was offline.
 *
 * @returns A NodeJS.Timeout handle (call clearInterval to stop it).
 */
export function scheduleSessionCleanup(): NodeJS.Timeout {
  // Run once at startup
  cleanupExpiredSessions();

  // Then run every 24 hours
  const handle = setInterval(cleanupExpiredSessions, config.jwt.interval_ms);

  logger.info('[SessionCleanup] Daily cleanup scheduled');
  return handle;
}
