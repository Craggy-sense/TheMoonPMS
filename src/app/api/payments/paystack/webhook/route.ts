import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPaystackSignature } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-paystack-signature') || '';
    const rawBody = await req.text();

    // Verify HMAC signature if secret key is configured
    if (process.env.PAYSTACK_SECRET_KEY) {
      const isValid = verifyPaystackSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const data = event.data;
      const bookingId = data.metadata?.bookingId;

      if (bookingId) {
        const db = getDb();
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;

        if (booking) {
          const amountPaid = data.amount / 100;
          const channelUsed = data.channel === 'mobile_money' ? 'M-Pesa' : 'Card';
          const newPaid = booking.paid_amount + amountPaid;
          const log = `\n[M-PESA WEBHOOK] ${data.currency} ${amountPaid.toLocaleString()} confirmed via ${channelUsed}. Ref: ${data.reference}`;

          db.prepare(`
            UPDATE bookings
            SET paid_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(newPaid, (booking.notes || '') + log, bookingId);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
