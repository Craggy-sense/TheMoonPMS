'use client';

import React, { useState } from 'react';
import { Booking } from '@/lib/types';
import { Search, Filter, CheckCircle, LogOut, Trash2, Calendar, User, ExternalLink } from 'lucide-react';

interface ReservationsListProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export function ReservationsList({
  bookings,
  onSelectBooking,
  onUpdateStatus,
  onDeleteBooking,
}: ReservationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.unit_name && b.unit_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || b.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'airbnb': return 'source-airbnb';
      case 'booking.com': return 'source-booking';
      case 'direct': return 'source-direct';
      default: return 'source-manual';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by guest, reservation #, unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses ({bookings.length})</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All Channels</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking.com">Booking.com</option>
            <option value="direct">Direct</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Reservation</th>
              <th>Apartment</th>
              <th>Dates & Nights</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Revenue</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No reservations match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const d1 = new Date(b.check_in);
                const d2 = new Date(b.check_out);
                const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.guest_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{b.id}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{b.unit_name || b.unit_id}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.unit_type}</div>
                    </td>

                    <td>
                      <div>{b.check_in} → {b.check_out}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{nights} nights</div>
                    </td>

                    <td>
                      <span className={`badge ${getSourceBadgeClass(b.source)}`}>
                        {b.source}
                      </span>
                    </td>

                    <td>
                      <span className={`badge badge-${b.status}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--moon-gold)' }}>
                        KSH {b.total_price.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: b.paid_amount >= b.total_price ? '#10B981' : '#F59E0B' }}>
                        {b.paid_amount >= b.total_price ? 'Paid' : `KSH ${b.paid_amount.toLocaleString()} paid`}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => onUpdateStatus(b.id, 'checked_in')}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', color: '#10B981' }}
                            title="Check-in"
                          >
                            <CheckCircle size={14} /> Check In
                          </button>
                        )}
                        {b.status === 'checked_in' && (
                          <button
                            onClick={() => onUpdateStatus(b.id, 'checked_out')}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', color: '#94A3B8' }}
                            title="Check-out & Turnover"
                          >
                            <LogOut size={14} /> Check Out
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete reservation?')) onDeleteBooking(b.id);
                          }}
                          style={{ color: '#EF4444', padding: '6px' }}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
