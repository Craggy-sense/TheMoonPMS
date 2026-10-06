import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPaystackPayment } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, bookingId } = body;

    if (!reference || !bookingId) {
      return NextResponse.json({ error: 'reference and bookingId are required' }, { status: 400 });
    }

    const paystackData = await verifyPaystackPayment(reference);

    if (paystackData.data.status === 'success') {
      const db = getDb();
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const amountPaidUnits = paystackData.data.amount / 100;
      const channelUsed = paystackData.data.channel === 'mobile_money' ? 'M-Pesa' : 'Card / Bank';
      const newPaidAmount = booking.paid_amount + amountPaidUnits;

      const paymentLog = `\n[PAYSTACK ${new Date().toISOString().split('T')[0]}] Received ${paystackData.data.currency} ${amountPaidUnits.toLocaleString()} via ${channelUsed}. Ref: ${reference}`;
      const updatedNotes = (booking.notes || '') + paymentLog;

      db.prepare(`
        UPDATE bookings
        SET paid_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newPaidAmount, updatedNotes, bookingId);

      return NextResponse.json({
        success: true,
        status: 'success',
        amount: amountPaidUnits,
        currency: paystackData.data.currency,
        channel: channelUsed,
        reference,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: paystackData.data.status,
        message: paystackData.data.gateway_response || 'Payment not completed',
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
