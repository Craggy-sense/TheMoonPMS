import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ICalFeed } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const feeds = db.prepare(`
      SELECT f.*, u.name as unit_name 
      FROM ical_feeds f
      LEFT JOIN units u ON f.unit_id = u.id
      ORDER BY f.unit_id ASC, f.channel ASC
    `).all() as (ICalFeed & { unit_name: string })[];

    return NextResponse.json({ feeds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const { unit_id, channel, url } = body;

    if (!unit_id || !channel || !url) {
      return NextResponse.json({ error: 'unit_id, channel, and url are required' }, { status: 400 });
    }

    const feedId = `feed-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    db.prepare(`
      INSERT INTO ical_feeds (id, unit_id, channel, url, sync_status)
      VALUES (?, ?, ?, ?, 'idle')
    `).run(feedId, unit_id, channel, url);

    return NextResponse.json({ success: true, feedId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing feed id' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM ical_feeds WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
