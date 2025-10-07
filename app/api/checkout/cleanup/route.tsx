import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { checkout } from '@/db/schema';
import { lt } from 'drizzle-orm';
import cron from 'node-cron';

let isCronScheduled = false;

export async function GET() {
  if (!isCronScheduled) {
    // Runs every 12 minutes
    cron.schedule('*/12 * * * *', async () => {
      try {
        const twelveMinutesAgo = new Date(Date.now() - 12 * 60 * 1000); // 12 minutes ago
        await db
          .delete(checkout)
          .where(lt(checkout.createdAt, twelveMinutesAgo));

        console.log('Expired checkout items deleted');
      } catch (error) {
        console.error('Error cleaning up checkout items:', error);
      }
    });

    isCronScheduled = true;
  }

  return NextResponse.json({ message: 'Cleanup job scheduled (every 12 mins)' });
}
