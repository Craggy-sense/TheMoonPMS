import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateUnitIcs } from '@/lib/ical';
import { Unit, Booking } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId');

    const db = getDb();

    if (!unitId) {
      // Export all units combined or show error
      const units = db.prepare('SELECT * FROM units').all() as Unit[];
      if (units.length === 0) {
        return new Response('No units found', { status: 404 });
      }
      // For general feed export
      const bookings = db.prepare("SELECT * FROM bookings WHERE status != 'cancelled'").all() as Booking[];
      const combinedIcs = generateUnitIcs(
        { id: 'all-moon', name: 'All Moon Apartments', type: 'Building', floor: 0, max_guests: 20, base_price: 0, cleaning_fee: 0, status: 'clean', description: '', amenities: '[]' },
        bookings
      );
      return new Response(combinedIcs, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="the-moon-apartments-all.ics"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as Unit | undefined;
    if (!unit) {
      return new Response('Unit not found', { status: 404 });
    }

    const bookings = db.prepare(
      "SELECT * FROM bookings WHERE unit_id = ? AND status != 'cancelled'"
    ).all(unitId) as Booking[];

    const icsContent = generateUnitIcs(unit, bookings);

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="moon-unit-${unitId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return new Response(`Error generating iCal: ${error.message}`, { status: 500 });
  }
}
