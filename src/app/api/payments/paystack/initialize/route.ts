import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializePaystackPayment } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, amount, currency = 'KES', email, phone } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const db = getDb();
    const booking = db.prepare(`
      SELECT b.*, u.name as unit_name
      FROM bookings b
      LEFT JOIN units u ON b.unit_id = u.id
      WHERE b.id = ?
    `).get(bookingId) as any;

    if (!booking) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const guestEmail = email || booking.guest_email || 'guest@themoonapartments.com';
    const guestPhone = phone || booking.guest_phone || '';
    
    // Amount to charge (either custom amount or remaining balance)
    const amountToCharge = amount !== undefined ? Number(amount) : Math.max(10, booking.total_price - booking.paid_amount);

    const origin = req.headers.get('origin') || 'http://localhost:3001';
    const callbackUrl = `${origin}/pay/${booking.id}?reference={reference}`;

    const paystackRes = await initializePaystackPayment({
      email: guestEmail,
      amountInUnits: amountToCharge,
      currency: currency as 'KES' | 'USD',
      metadata: {
        bookingId: booking.id,
        unitId: booking.unit_id,
        unitName: booking.unit_name,
        guestName: booking.guest_name,
        phone: guestPhone,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
      },
      callbackUrl,
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackRes.data.authorization_url,
      reference: paystackRes.data.reference,
      accessCode: paystackRes.data.access_code,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
