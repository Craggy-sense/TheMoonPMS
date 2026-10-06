import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Total units
    const totalUnits = (db.prepare('SELECT COUNT(*) as count FROM units').get() as any).count;

    // Current month range (e.g., 2026-10)
    const bookings = db.prepare(`
      SELECT b.*, u.base_price 
      FROM bookings b
      LEFT JOIN units u ON b.unit_id = u.id
      WHERE b.status != 'cancelled'
    `).all() as any[];

    let totalRevenue = 0;
    let airbnbRevenue = 0;
    let bcomRevenue = 0;
    let directRevenue = 0;
    let manualRevenue = 0;
    let totalNightsBooked = 0;

    for (const b of bookings) {
      const price = Number(b.total_price) || 0;
      totalRevenue += price;

      if (b.source === 'airbnb') airbnbRevenue += price;
      else if (b.source === 'booking.com') bcomRevenue += price;
      else if (b.source === 'direct') directRevenue += price;
      else manualRevenue += price;

      const d1 = new Date(b.check_in);
      const d2 = new Date(b.check_out);
      const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
      totalNightsBooked += nights;
    }

    const dirtyUnits = (db.prepare("SELECT COUNT(*) as count FROM units WHERE status = 'dirty' OR status = 'in_progress'").get() as any).count;
    const checkedInCount = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'checked_in'").get() as any).count;
    const upcomingCount = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'").get() as any).count;

    // Estimate occupancy across 30 days window for all units
    const totalUnitDays = Math.max(1, totalUnits * 30);
    const occupancyRate = Math.min(100, Math.round((totalNightsBooked / totalUnitDays) * 100));
    const adr = totalNightsBooked > 0 ? Math.round(totalRevenue / totalNightsBooked) : 0;

    return NextResponse.json({
      totalUnits,
      occupancyRate,
      totalRevenue,
      adr,
      checkedInCount,
      upcomingCount,
      dirtyUnits,
      channelBreakdown: {
        airbnb: airbnbRevenue,
        bookingCom: bcomRevenue,
        direct: directRevenue,
        manual: manualRevenue,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
