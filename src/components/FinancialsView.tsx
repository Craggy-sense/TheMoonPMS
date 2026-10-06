'use client';

import React from 'react';
import { DollarSign, TrendingUp, Percent, Award, ArrowUpRight, Globe } from 'lucide-react';

interface FinancialsViewProps {
  stats: any;
}

export function FinancialsView({ stats }: FinancialsViewProps) {
  if (!stats) return null;

  const totalRev = stats.totalRevenue || 0;
  const airbnbRev = stats.channelBreakdown?.airbnb || 0;
  const bcomRev = stats.channelBreakdown?.bookingCom || 0;
  const directRev = stats.channelBreakdown?.direct || 0;
  const manualRev = stats.channelBreakdown?.manual || 0;

  const airbnbPct = totalRev > 0 ? Math.round((airbnbRev / totalRev) * 100) : 0;
  const bcomPct = totalRev > 0 ? Math.round((bcomRev / totalRev) * 100) : 0;
  const directPct = totalRev > 0 ? Math.round((directRev / totalRev) * 100) : 0;
  const manualPct = totalRev > 0 ? Math.round((manualRev / totalRev) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Financial Performance & Revenue Yield</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Revenue metrics, channel share, and occupancy indicators for The Moon Apartments
        </p>
      </div>

      {/* KPI Trio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              Total Gross Revenue
            </span>
            <DollarSign size={18} style={{ color: 'var(--moon-gold)' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            KES {totalRev.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> Active reservations portfolio
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              Average Daily Rate (ADR)
            </span>
            <TrendingUp size={18} style={{ color: '#6366F1' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            KES {stats.adr.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Weighted average nightly rate
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              Occupancy Rate
            </span>
            <Percent size={18} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {stats.occupancyRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Active units monthly utilization
          </div>
        </div>
      </div>

      {/* Channel Distribution */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>
          Distribution by Booking Channel
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Airbnb */}
          <div style={{
            background: 'rgba(255, 56, 92, 0.06)',
            border: '1px solid rgba(255, 56, 92, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--airbnb-color)' }}>Airbnb</span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{airbnbPct}%</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
              KES {airbnbRev.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Synced via iCal OTA
            </div>
          </div>

          {/* Booking.com */}
          <div style={{
            background: 'rgba(0, 108, 228, 0.06)',
            border: '1px solid rgba(0, 108, 228, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--booking-color)' }}>Booking.com</span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{bcomPct}%</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
              KES {bcomRev.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Synced via iCal OTA
            </div>
          </div>

          {/* Direct */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--direct-color)' }}>Direct Website</span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{directPct}%</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
              KES {directRev.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Zero Commission bookings
            </div>
          </div>

          {/* Manual */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--manual-color)' }}>Manual / Phone</span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{manualPct}%</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
              KES {manualRev.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Direct telephone & repeat guests
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
