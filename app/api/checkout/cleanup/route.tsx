import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { checkout } from '@/db/schema';
import { lt } from 'drizzle-orm';
import cron from 'node-cron';

let isCronScheduled = false;

export async function GET() {
  if (!isCronScheduled) {
    cron.schedule('*/10 * * * *', async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        await db
          .delete(checkout)
          .where(lt(checkout.createdAt, oneHourAgo));
        console.log('Expired checkout items deleted');
      } catch (error) {
        console.error('Error cleaning up checkout items:', error);
      }
    });
    isCronScheduled = true;
  }

  return NextResponse.json({ message: 'Cleanup job scheduled' });
}