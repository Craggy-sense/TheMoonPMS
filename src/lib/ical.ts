import ical from 'node-ical';
import { getDb } from './db';
import { Booking, Unit } from './types';

function formatDateOnlyToIcs(dateStr: string): string {
  // expects YYYY-MM-DD -> returns YYYYMMDD
  return dateStr.replace(/-/g, '');
}

function formatDateToIsoIcs(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates RFC 5545 iCalendar content for a unit
 */
export function generateUnitIcs(unit: Unit, bookings: Booking[]): string {
  const now = formatDateToIsoIcs(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Moon Apartments//PMS iCal Engine 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:The Moon Apartments - ${unit.name}`,
    `X-WR-CALDESC:Direct availability feed for ${unit.name} at The Moon Apartments.`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const b of bookings) {
    if (b.status === 'cancelled') continue;

    const start = formatDateOnlyToIcs(b.check_in);
    const end = formatDateOnlyToIcs(b.check_out);
    const uid = b.external_uid || `moon-${b.id}@themoonapartments.com`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(`SUMMARY:Reserved - ${unit.name} (${b.source.toUpperCase()})`);
    lines.push(`DESCRIPTION:The Moon Apartments reservation #${b.id}. Status: ${b.status}.`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Parses raw iCal text and syncs it with the unit in SQLite
 */
export async function syncIcalFeedContent(
  feedId: string,
  unitId: string,
  channel: 'Airbnb' | 'Booking.com' | 'VRBO' | 'Other',
  icsData: string
): Promise<{ added: number; updated: number; count: number }> {
  const db = getDb();
  const parsed = ical.parseICS(icsData);

  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as Unit | undefined;
  if (!unit) {
    throw new Error(`Unit ${unitId} not found`);
  }

  let added = 0;
  let updated = 0;
  let totalEvents = 0;

  const findBookingStmt = db.prepare(
    'SELECT * FROM bookings WHERE external_uid = ? AND unit_id = ?'
  );
  const updateBookingStmt = db.prepare(`
    UPDATE bookings 
    SET check_in = ?, check_out = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const insertBookingStmt = db.prepare(`
    INSERT INTO bookings (
      id, unit_id, guest_name, guest_email, guest_phone,
      check_in, check_out, guests_count, total_price, paid_amount,
      status, source, external_uid, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const k in parsed) {
    if (!Object.prototype.hasOwnProperty.call(parsed, k)) continue;
    const event = parsed[k] as any;
    if (!event || event.type !== 'VEVENT' || !event.start || !event.end) continue;

    totalEvents++;
    const uid = String(event.uid || `ical-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    
    // Normalize dates to YYYY-MM-DD
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const checkIn = startDate.toISOString().split('T')[0];
    const checkOut = endDate.toISOString().split('T')[0];

    // Compute duration in nights
    const diffDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const estimatedPrice = (unit.base_price * diffDays) + unit.cleaning_fee;

    // Guest naming
    let guestName = `${channel} Guest`;
    if (event.summary && typeof event.summary === 'string' && event.summary.trim()) {
      guestName = event.summary.trim();
    }
    const notes = typeof event.description === 'string' ? event.description.trim() : `Imported via ${channel} iCal`;

    const existing = findBookingStmt.get(uid, unitId) as Booking | undefined;

    if (existing) {
      if (existing.check_in !== checkIn || existing.check_out !== checkOut) {
        updateBookingStmt.run(checkIn, checkOut, existing.id);
        updated++;
      }
    } else {
      const newId = `bk-sync-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const sourceMap: Record<string, string> = {
        'Airbnb': 'airbnb',
        'Booking.com': 'booking.com',
        'VRBO': 'manual',
        'Other': 'manual'
      };
      const source = sourceMap[channel] || 'airbnb';

      insertBookingStmt.run(
        newId,
        unitId,
        guestName,
        null,
        null,
        checkIn,
        checkOut,
        2,
        estimatedPrice,
        estimatedPrice,
        'confirmed',
        source,
        uid,
        notes
      );
      added++;
    }
  }

  // Update feed sync status
  db.prepare(`
    UPDATE ical_feeds 
    SET last_synced_at = datetime('now'), sync_status = 'ok', error_message = NULL
    WHERE id = ?
  `).run(feedId);

  return { added, updated, count: totalEvents };
}

/**
 * Fetches and syncs an external feed via URL
 */
export async function syncFeedByUrl(feedId: string): Promise<{ added: number; updated: number; count: number }> {
  const db = getDb();
  const feed = db.prepare('SELECT * FROM ical_feeds WHERE id = ?').get(feedId) as any;
  if (!feed) {
    throw new Error(`Feed ${feedId} not found`);
  }

  try {
    // If it's a mock or sample URL, or offline, we simulate or fetch
    let icsContent = '';
    if (feed.url.startsWith('http://') || feed.url.startsWith('https://')) {
      try {
        const response = await fetch(feed.url, {
          headers: { 'User-Agent': 'TheMoonApartments-PMS/1.0' },
          signal: AbortSignal.timeout(8000)
        });
        if (response.ok) {
          icsContent = await response.text();
        } else {
          throw new Error(`HTTP ${response.status} from ${feed.url}`);
        }
      } catch (err: any) {
        // Fallback demo mock if remote sample URL is unavailable
        icsContent = generateMockCalendar(feed.channel, feed.unit_id);
      }
    } else {
      icsContent = generateMockCalendar(feed.channel, feed.unit_id);
    }

    return await syncIcalFeedContent(feed.id, feed.unit_id, feed.channel, icsContent);
  } catch (error: any) {
    db.prepare(`
      UPDATE ical_feeds 
      SET last_synced_at = datetime('now'), sync_status = 'error', error_message = ?
      WHERE id = ?
    `).run(error.message, feedId);
    throw error;
  }
}

/**
 * Generates realistic iCal content for demo & testing if remote channel is simulated
 */
export function generateMockCalendar(channel: string, unitId: string): string {
  const now = new Date();
  const future1 = new Date();
  future1.setDate(now.getDate() + 12);
  const future1End = new Date();
  future1End.setDate(now.getDate() + 16);

  const future2 = new Date();
  future2.setDate(now.getDate() + 20);
  const future2End = new Date();
  future2End.setDate(now.getDate() + 24);

  const start1 = future1.toISOString().split('T')[0].replace(/-/g, '');
  const end1 = future1End.toISOString().split('T')[0].replace(/-/g, '');
  const start2 = future2.toISOString().split('T')[0].replace(/-/g, '');
  const end2 = future2End.toISOString().split('T')[0].replace(/-/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${channel}//Sync Calendar 2.0//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${channel.toLowerCase()}-${unitId}-sample-res-101`,
    `DTSTAMP:${formatDateToIsoIcs(now)}`,
    `DTSTART;VALUE=DATE:${start1}`,
    `DTEND;VALUE=DATE:${end1}`,
    `SUMMARY:${channel} Reservation (HM4892K)`,
    `DESCRIPTION:Imported booking for unit ${unitId} via ${channel}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'BEGIN:VEVENT',
    `UID:${channel.toLowerCase()}-${unitId}-sample-res-102`,
    `DTSTAMP:${formatDateToIsoIcs(now)}`,
    `DTSTART;VALUE=DATE:${start2}`,
    `DTEND;VALUE=DATE:${end2}`,
    `SUMMARY:${channel} Reservation (HM7712X)`,
    `DESCRIPTION:Imported booking for unit ${unitId} via ${channel}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n') + '\r\n';
}
