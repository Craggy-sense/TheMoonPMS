'use client';

import React, { useState, useEffect } from 'react';
import { Unit, ICalFeed } from '@/lib/types';
import { RefreshCw, Copy, Check, ExternalLink, Plus, Trash2, ShieldCheck, Download, Calendar } from 'lucide-react';

interface ChannelManagerProps {
  units: Unit[];
  onRefreshData: () => Promise<void>;
}

export function ChannelManager({ units, onRefreshData }: ChannelManagerProps) {
  const [feeds, setFeeds] = useState<(ICalFeed & { unit_name?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // New feed form state
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [channel, setChannel] = useState<'Airbnb' | 'Booking.com' | 'VRBO' | 'Other'>('Airbnb');
  const [feedUrl, setFeedUrl] = useState('');

  // Raw iCal test state
  const [manualIcs, setManualIcs] = useState('');
  const [manualUnitId, setManualUnitId] = useState(units[0]?.id || '');
  const [manualChannel, setManualChannel] = useState<'Airbnb' | 'Booking.com'>('Airbnb');
  const [manualTesting, setManualTesting] = useState(false);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ical/feeds');
      const data = await res.json();
      if (data.feeds) {
        setFeeds(data.feeds);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      setSyncStatusMsg('');
      const res = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatusMsg(data.summary || 'All feeds synchronized successfully!');
        await fetchFeeds();
        await onRefreshData();
      } else {
        setSyncStatusMsg(`Sync error: ${data.error}`);
      }
    } catch (err: any) {
      setSyncStatusMsg(`Failed to sync: ${err.message}`);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncSingle = async (feedId: string) => {
    try {
      const res = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.summary || 'Feed synced!');
        await fetchFeeds();
        await onRefreshData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    try {
      const res = await fetch('/api/ical/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnitId || units[0]?.id,
          channel,
          url: feedUrl.trim(),
        }),
      });

      if (res.ok) {
        setFeedUrl('');
        await fetchFeeds();
        alert(`Added ${channel} iCal feed. Click "Sync" to import bookings.`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteFeed = async (id: string) => {
    if (confirm('Delete this iCal sync feed?')) {
      await fetch(`/api/ical/feeds?id=${id}`, { method: 'DELETE' });
      await fetchFeeds();
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleManualSyncTest = async () => {
    if (!manualIcs.trim()) return;
    try {
      setManualTesting(true);
      const res = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualIcsContent: manualIcs,
          unitId: manualUnitId || units[0]?.id,
          channel: manualChannel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.summary || 'Simulated iCal events imported!');
        setManualIcs('');
        await onRefreshData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setManualTesting(false);
    }
  };

  // Base URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} style={{ color: 'var(--moon-gold)' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>2-Way iCal Channel Synchronizer</h2>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '720px' }}>
              Connect The Moon Apartments directly with Airbnb, Booking.com, VRBO, or Google Calendar using the standard RFC 5545 iCalendar protocol. Prevent double bookings automatically.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <RefreshCw size={16} className={syncingAll ? 'animate-spin' : ''} />
              {syncingAll ? 'Syncing Channels...' : 'Sync All Active Feeds'}
            </button>
          </div>
        </div>

        {syncStatusMsg && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: '#34D399',
          }}>
            {syncStatusMsg}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* 1. EXPORT CALENDARS TO AIRBNB / BOOKING.COM */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ExternalLink size={20} style={{ color: 'var(--moon-gold)' }} />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Export Feeds to Airbnb & Booking.com</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Paste these URLs into your Airbnb & Booking.com listing calendar settings to block dates booked on The Moon Apartments.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {units.map((u) => {
              const exportUrl = `${origin}/api/ical/export?unitId=${u.id}`;
              const isCopied = copiedUrl === exportUrl;

              return (
                <div
                  key={u.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name}</div>
                    <a
                      href={exportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Download or preview .ICS feed"
                    >
                      <Download size={12} /> Test .ICS
                    </a>
                  </div>

                  <div className="code-chip">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                      {exportUrl}
                    </span>
                    <button
                      onClick={() => copyToClipboard(exportUrl)}
                      style={{
                        color: isCopied ? '#10B981' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.08)'
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span style={{ fontSize: '11px' }}>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. IMPORT FEEDS FROM AIRBNB / BOOKING.COM */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Plus size={20} style={{ color: '#10B981' }} />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Import Calendar from OTA Channels</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Subscribe to Airbnb or Booking.com reservation calendars to automatically pull their bookings into your PMS tape chart.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddFeed} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Apartment</label>
                <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="VRBO">VRBO</option>
                  <option value="Other">Other iCal Feed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">OTA iCal Export URL</label>
              <input
                type="url"
                placeholder="https://www.airbnb.com/calendar/ical/1234567.ics?s=..."
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
              <Plus size={15} /> Add Channel Feed
            </button>
          </form>

          {/* List of active feeds */}
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em' }}>
            Active Imported Channels ({feeds.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            {feeds.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '10px 0' }}>
                No external feeds connected yet.
              </div>
            ) : (
              feeds.map((f) => (
                <div
                  key={f.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${f.channel === 'Airbnb' ? 'source-airbnb' : 'source-booking'}`}>
                        {f.channel}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>
                        {f.unit_name || f.unit_id}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.url}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Last synced: {f.last_synced_at || 'Never'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleSyncSingle(f.id)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Sync this feed now"
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteFeed(f.id)}
                      style={{ color: '#EF4444', padding: '6px' }}
                      title="Remove feed"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. DIRECT ICAL SIMULATION & RAW PASTE TESTING */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Calendar size={20} style={{ color: 'var(--moon-gold)' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Direct iCal Sandbox / Raw Paste Import</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Paste raw iCalendar text (.ics format) directly from any channel to verify sync parsing instantly.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Assign To Apartment</label>
              <select value={manualUnitId} onChange={(e) => setManualUnitId(e.target.value)}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Channel Source</label>
              <select value={manualChannel} onChange={(e) => setManualChannel(e.target.value as any)}>
                <option value="Airbnb">Airbnb</option>
                <option value="Booking.com">Booking.com</option>
              </select>
            </div>

            <button
              onClick={handleManualSyncTest}
              disabled={manualTesting || !manualIcs.trim()}
              className="btn-primary"
              style={{ marginTop: 'auto' }}
            >
              {manualTesting ? 'Parsing...' : 'Parse & Sync Events'}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Raw VCALENDAR / VEVENT String</label>
            <textarea
              rows={5}
              placeholder={`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:airbnb-custom-test-101\nDTSTART;VALUE=DATE:20261018\nDTEND;VALUE=DATE:20261022\nSUMMARY:Airbnb (HM9921)\nEND:VEVENT\nEND:VCALENDAR`}
              value={manualIcs}
              onChange={(e) => setManualIcs(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
