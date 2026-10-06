import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Unit, ICalFeed } from '@/lib/types';
import { syncFeedByUrl } from '@/lib/ical';

export async function GET() {
  try {
    const db = getDb();
    const units = db.prepare('SELECT * FROM units ORDER BY floor ASC, name ASC').all() as Unit[];
    const feeds = db.prepare('SELECT * FROM ical_feeds').all() as ICalFeed[];

    // Attach feeds to units
    const unitsWithFeeds = units.map(u => ({
      ...u,
      amenities: typeof u.amenities === 'string' ? JSON.parse(u.amenities || '[]') : u.amenities,
      icalFeeds: feeds.filter(f => f.unit_id === u.id)
    }));

    return NextResponse.json({ units: unitsWithFeeds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      id,
      name,
      type,
      floor,
      max_guests,
      base_price,
      cleaning_fee,
      description,
      amenities,
      wifi_name,
      wifi_password,
      door_code,
      airbnb_listing_url,
      address,
      airbnb_ical_url,
    } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Property name and unit type are required' }, { status: 400 });
    }

    const unitId = id || `moon-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now().toString(36).substring(4, 8)}`;
    const amenitiesJson = JSON.stringify(Array.isArray(amenities) ? amenities : []);

    db.prepare(`
      INSERT INTO units (
        id, name, type, floor, max_guests, base_price, cleaning_fee,
        status, description, amenities, wifi_name, wifi_password,
        door_code, airbnb_listing_url, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'clean', ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        type=excluded.type,
        floor=excluded.floor,
        max_guests=excluded.max_guests,
        base_price=excluded.base_price,
        cleaning_fee=excluded.cleaning_fee,
        description=excluded.description,
        amenities=excluded.amenities,
        wifi_name=excluded.wifi_name,
        wifi_password=excluded.wifi_password,
        door_code=excluded.door_code,
        airbnb_listing_url=excluded.airbnb_listing_url,
        address=excluded.address
    `).run(
      unitId,
      name,
      type,
      Number(floor) || 1,
      Number(max_guests) || 2,
      Number(base_price) || 150,
      Number(cleaning_fee) || 40,
      description || '',
      amenitiesJson,
      wifi_name || null,
      wifi_password || null,
      door_code || null,
      airbnb_listing_url || null,
      address || null
    );

    // If an Airbnb iCal URL was provided or updated, link it in ical_feeds
    if (airbnb_ical_url && airbnb_ical_url.trim()) {
      const existingFeed = db.prepare(
        "SELECT id FROM ical_feeds WHERE unit_id = ? AND channel = 'Airbnb'"
      ).get(unitId) as any;

      const cleanUrl = airbnb_ical_url.trim();
      let feedId = existingFeed ? existingFeed.id : `feed-ab-${Date.now().toString(36)}`;

      if (existingFeed) {
        db.prepare("UPDATE ical_feeds SET url = ? WHERE id = ?").run(cleanUrl, feedId);
      } else {
        db.prepare(
          "INSERT INTO ical_feeds (id, unit_id, channel, url, sync_status) VALUES (?, ?, 'Airbnb', ?, 'idle')"
        ).run(feedId, unitId, cleanUrl);
      }

      // Trigger immediate initial sync in background
      try {
        await syncFeedByUrl(feedId);
      } catch (e) {
        console.warn('Initial iCal sync for unit:', e);
      }
    }

    return NextResponse.json({ success: true, unitId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing unit id or status' }, { status: 400 });
    }

    db.prepare('UPDATE units SET status = ? WHERE id = ?').run(status, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing unit id' }, { status: 400 });
    }

    const db = getDb();
    // Delete cascades or manually clean
    db.prepare('DELETE FROM bookings WHERE unit_id = ?').run(id);
    db.prepare('DELETE FROM ical_feeds WHERE unit_id = ?').run(id);
    db.prepare('DELETE FROM cleaning_tasks WHERE unit_id = ?').run(id);
    db.prepare('DELETE FROM units WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
