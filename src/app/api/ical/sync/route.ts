import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { syncFeedByUrl, syncIcalFeedContent } from '@/lib/ical';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { feedId, manualIcsContent, unitId, channel } = body;

    const db = getDb();

    // 1. Direct manual paste sync (useful for testing or if user pastes Airbnb iCal directly)
    if (manualIcsContent && unitId && channel) {
      let activeFeedId = feedId;
      if (!activeFeedId) {
        // Create or find a feed
        const existingFeed = db.prepare('SELECT id FROM ical_feeds WHERE unit_id = ? AND channel = ?').get(unitId, channel) as any;
        if (existingFeed) {
          activeFeedId = existingFeed.id;
        } else {
          activeFeedId = `feed-manual-${Date.now().toString(36)}`;
          db.prepare(`
            INSERT INTO ical_feeds (id, unit_id, channel, url, sync_status)
            VALUES (?, ?, ?, 'manual://imported-content', 'ok')
          `).run(activeFeedId, unitId, channel);
        }
      }

      const result = await syncIcalFeedContent(activeFeedId, unitId, channel, manualIcsContent);
      return NextResponse.json({
        success: true,
        summary: `Synchronized ${result.count} events (${result.added} new, ${result.updated} updated).`
      });
    }

    // 2. Sync a specific feed by feedId
    if (feedId) {
      const result = await syncFeedByUrl(feedId);
      return NextResponse.json({
        success: true,
        summary: `Synchronized ${result.count} events (${result.added} new, ${result.updated} updated).`
      });
    }

    // 3. Sync all feeds
    const feeds = db.prepare('SELECT * FROM ical_feeds').all() as any[];
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalCount = 0;
    const errors: string[] = [];

    for (const f of feeds) {
      try {
        const res = await syncFeedByUrl(f.id);
        totalAdded += res.added;
        totalUpdated += res.updated;
        totalCount += res.count;
      } catch (err: any) {
        errors.push(`Feed ${f.channel} for ${f.unit_id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalAdded,
      totalUpdated,
      totalCount,
      errors,
      summary: `Completed channel sync across ${feeds.length} feeds. ${totalAdded} added, ${totalUpdated} updated.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
