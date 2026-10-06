'use client';

import React, { useState } from 'react';
import { Unit } from '@/lib/types';
import { X, Globe, Copy, Check, ExternalLink, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface ConnectAirbnbModalProps {
  unit: Unit | null;
  onClose: () => void;
  onConnected: () => Promise<void>;
}

export function ConnectAirbnbModal({ unit, onClose, onConnected }: ConnectAirbnbModalProps) {
  if (!unit) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ourExportUrl = `${origin}/api/ical/export?unitId=${unit.id}`;

  const existingFeed = unit.icalFeeds?.find((f) => f.channel === 'Airbnb');
  const [airbnbIcalUrl, setAirbnbIcalUrl] = useState(existingFeed?.url || '');
  const [copiedExport, setCopiedExport] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const copyExportUrl = () => {
    navigator.clipboard.writeText(ourExportUrl);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    const cleanUrl = airbnbIcalUrl.trim();
    if (!cleanUrl) {
      setResultMsg({ type: 'error', text: 'Please enter a valid Airbnb calendar .ics URL.' });
      return;
    }

    try {
      setTesting(true);

      // Save feed or update existing
      const feedRes = await fetch('/api/ical/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unit.id,
          channel: 'Airbnb',
          url: cleanUrl,
        }),
      });

      const feedData = await feedRes.json();
      if (!feedRes.ok) throw new Error(feedData.error || 'Failed to save feed');

      // Now trigger immediate sync on this feed
      const syncRes = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId: feedData.feedId }),
      });

      const syncData = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncData.error || 'Failed to sync feed');

      setResultMsg({
        type: 'success',
        text: `Successfully linked with Airbnb! ${syncData.summary || 'Calendar synchronized.'}`
      });

      await onConnected();
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF385C 0%, #D70466 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF'
            }}>
              <Globe size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 700 }}>Connect Airbnb Calendar</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                2-Way iCal synchronization for {unit.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConnectAndSync}>
          <div className="modal-body" style={{ gap: '18px' }}>
            {resultMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                background: resultMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${resultMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: resultMsg.type === 'success' ? '#34D399' : '#F87171',
              }}>
                {resultMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{resultMsg.text}</span>
              </div>
            )}

            {/* STEP 1: IMPORT FROM AIRBNB */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  background: 'var(--airbnb-color)',
                  color: '#FFF',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>1</span>
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                  Paste Airbnb Calendar Export URL
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                In your Airbnb Host account: go to <strong>Listing → Pricing & availability → Calendar sync → Export calendar</strong>, copy the link and paste it below:
              </p>

              <div className="form-group">
                <input
                  type="url"
                  placeholder="https://www.airbnb.com/calendar/ical/12345678.ics?s=..."
                  value={airbnbIcalUrl}
                  onChange={(e) => setAirbnbIcalUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* STEP 2: EXPORT TO AIRBNB */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  background: 'var(--moon-gold)',
                  color: '#080C15',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>2</span>
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                  Paste The Moon Apartments Feed into Airbnb
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                In Airbnb, click <strong>Import calendar</strong> and paste this URL so Airbnb automatically blocks dates booked directly on The Moon Apartments:
              </p>

              <div className="code-chip">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '440px' }}>
                  {ourExportUrl}
                </span>
                <button
                  type="button"
                  onClick={copyExportUrl}
                  style={{
                    color: copiedExport ? '#10B981' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.08)'
                  }}
                >
                  {copiedExport ? <Check size={14} /> : <Copy size={14} />}
                  <span style={{ fontSize: '11px' }}>{copiedExport ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button
              type="submit"
              disabled={testing || !airbnbIcalUrl.trim()}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #FF385C 0%, #D70466 100%)', color: '#FFF' }}
            >
              <RefreshCw size={15} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing & Syncing...' : 'Test & Save Airbnb Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
