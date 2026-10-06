import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Booking } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const db = getDb();
    let query = `
      SELECT b.*, u.name as unit_name, u.type as unit_type
      FROM bookings b
      LEFT JOIN units u ON b.unit_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (unitId) {
      query += ` AND b.unit_id = ?`;
      params.push(unitId);
    }
    if (status && status !== 'all') {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (b.guest_name LIKE ? OR b.guest_email LIKE ? OR b.id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.check_in ASC`;

    const bookings = db.prepare(query).all(...params) as Booking[];
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      unit_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      guests_count = 1,
      total_price,
      paid_amount = 0,
      status = 'confirmed',
      source = 'direct',
      notes = ''
    } = body;

    if (!unit_id || !guest_name || !check_in || !check_out) {
      return NextResponse.json({ error: 'Missing required reservation fields' }, { status: 400 });
    }

    if (check_in >= check_out) {
      return NextResponse.json({ error: 'Check-out date must be after check-in date' }, { status: 400 });
    }

    // Check for double booking conflict on this unit
    const conflict = db.prepare(`
      SELECT b.*, u.name as unit_name 
      FROM bookings b
      LEFT JOIN units u ON b.unit_id = u.id
      WHERE b.unit_id = ? 
        AND b.status != 'cancelled'
        AND b.check_in < ? 
        AND b.check_out > ?
    `).get(unit_id, check_out, check_in) as any;

    if (conflict) {
      return NextResponse.json({
        error: `Date conflict! This unit is already booked by ${conflict.guest_name} from ${conflict.check_in} to ${conflict.check_out} (${conflict.source.toUpperCase()}).`
      }, { status: 409 });
    }

    const bookingId = `bk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    db.prepare(`
      INSERT INTO bookings (
        id, unit_id, guest_name, guest_email, guest_phone,
        check_in, check_out, guests_count, total_price, paid_amount,
        status, source, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookingId,
      unit_id,
      guest_name,
      guest_email || null,
      guest_phone || null,
      check_in,
      check_out,
      guests_count,
      total_price || 0,
      paid_amount || 0,
      status,
      source,
      notes
    );

    // If check-out is today or future, create a cleaning task placeholder
    const today = new Date().toISOString().split('T')[0];
    if (check_out >= today) {
      db.prepare(`
        INSERT INTO cleaning_tasks (id, unit_id, booking_id, date, status, notes)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `).run(`cl-${bookingId}`, unit_id, bookingId, check_out, `Post-departure clean for ${guest_name}`);
    }

    return NextResponse.json({ success: true, bookingId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, status, paid_amount, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (paid_amount !== undefined) {
      updates.push('paid_amount = ?');
      params.push(paid_amount);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // If status became checked_out, mark unit as dirty for turnover cleaning
    if (status === 'checked_out') {
      const b = db.prepare('SELECT unit_id FROM bookings WHERE id = ?').get(id) as any;
      if (b) {
        db.prepare("UPDATE units SET status = 'dirty' WHERE id = ?").run(b.unit_id);
      }
    }

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
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
