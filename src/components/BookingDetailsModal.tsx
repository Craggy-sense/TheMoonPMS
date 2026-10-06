'use client';

import React, { useState } from 'react';
import { Booking } from '@/lib/types';
import { X, Calendar, User, Phone, Mail, DollarSign, Home, CheckCircle, LogOut, Trash2, Globe, Smartphone, CreditCard, Copy } from 'lucide-react';

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export function BookingDetailsModal({
  booking,
  onClose,
  onUpdateStatus,
  onDeleteBooking,
}: BookingDetailsModalProps) {
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      await onUpdateStatus(booking.id, newStatus);
      onClose();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete reservation #${booking.id} for ${booking.guest_name}?`)) {
      try {
        setLoading(true);
        await onDeleteBooking(booking.id);
        onClose();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate nights
  const d1 = new Date(booking.check_in);
  const d2 = new Date(booking.check_out);
  const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge badge-${booking.status}`}>
                {booking.status.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{booking.id}</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
              {booking.guest_name}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Channel banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={18} style={{ color: 'var(--moon-gold)' }} />
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  Booking Channel
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>
                  {booking.source}
                </div>
              </div>
            </div>

            {booking.external_uid && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                <div>Channel Sync UID:</div>
                <code style={{ color: '#38BDF8', fontSize: '11px' }}>{booking.external_uid}</code>
              </div>
            )}
          </div>

          {/* Unit & Dates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Home size={14} /> Assigned Apartment
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                {booking.unit_name || booking.unit_id}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {booking.unit_type || 'The Moon Apartments'}
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Calendar size={14} /> Stay Duration ({nights} {nights === 1 ? 'Night' : 'Nights'})
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                {booking.check_in} → {booking.check_out}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {booking.guests_count} {booking.guests_count === 1 ? 'Guest' : 'Guests'}
              </div>
            </div>
          </div>

          {/* Financial summary */}
          <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</span>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--moon-gold)' }}>
                  ${booking.total_price.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Status</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: booking.paid_amount >= booking.total_price ? '#10B981' : '#F59E0B' }}>
                  {booking.paid_amount >= booking.total_price ? 'Fully Paid' : `$${booking.paid_amount} Paid (Due: $${booking.total_price - booking.paid_amount})`}
                </div>
              </div>
            </div>

            {/* Paystack M-Pesa & Card Checkout Banner */}
            {booking.paid_amount < booking.total_price && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={14} /> Paystack M-Pesa & Card Checkout
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Send guest link for instant STK Push or Card payment:
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/pay/${booking.id}`;
                      navigator.clipboard.writeText(link);
                      alert('Guest payment link copied to clipboard! You can share it via WhatsApp or SMS.');
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Copy size={13} /> Copy Pay Link
                  </button>

                  <a
                    href={`/pay/${booking.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF' }}
                  >
                    <CreditCard size={13} /> Open Checkout
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Guest Contact Details */}
          {(booking.guest_email || booking.guest_phone) && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {booking.guest_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Mail size={14} /> {booking.guest_email}
                </div>
              )}
              {booking.guest_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Phone size={14} /> {booking.guest_phone}
                </div>
              )}
            </div>
          )}

          {/* Special Notes */}
          {booking.notes && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes / House Instructions</div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{ color: '#EF4444', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Trash2 size={15} /> Delete
          </button>

          {booking.status === 'confirmed' && (
            <button
              onClick={() => handleStatusChange('checked_in')}
              disabled={loading}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF' }}
            >
              <CheckCircle size={16} /> Mark Checked In
            </button>
          )}

          {booking.status === 'checked_in' && (
            <button
              onClick={() => handleStatusChange('checked_out')}
              disabled={loading}
              className="btn-primary"
            >
              <LogOut size={16} /> Mark Checked Out & Turnover
            </button>
          )}

          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
