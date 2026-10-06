'use client';

import React, { useState } from 'react';
import { Unit } from '@/lib/types';
import { Home, Users, DollarSign, Sparkles, Download, Layers, Plus, Edit2, Trash2, Key, Wifi, Globe, ExternalLink } from 'lucide-react';
import { PropertyModal } from './PropertyModal';
import { ConnectAirbnbModal } from './ConnectAirbnbModal';

interface UnitsCatalogProps {
  units: Unit[];
  onRefreshData: () => Promise<void>;
}

export function UnitsCatalog({ units, onRefreshData }: UnitsCatalogProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [airbnbConnectUnit, setAirbnbConnectUnit] = useState<Unit | null>(null);

  const handleDeleteUnit = async (unit: Unit) => {
    if (confirm(`Are you sure you want to delete ${unit.name}? This will remove its bookings, feeds, and housekeeping tasks.`)) {
      try {
        const res = await fetch(`/api/units?id=${unit.id}`, { method: 'DELETE' });
        if (res.ok) {
          await onRefreshData();
        } else {
          const data = await res.json();
          alert(`Error: ${data.error}`);
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>The Moon Apartments Portfolio</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Manage luxury units, customize door codes, Wi-Fi credentials, and configure live Airbnb iCal calendars.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--moon-gold)', fontWeight: 600 }}>
              {units.length} Managed Properties
            </span>
            <button
              onClick={() => {
                setEditingUnit(null);
                setIsPropertyModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus size={16} /> Add Custom Property
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {units.map((u) => {
          const exportUrl = `${origin}/api/ical/export?unitId=${u.id}`;
          const amenitiesList = Array.isArray(u.amenities)
            ? u.amenities
            : typeof u.amenities === 'string'
            ? JSON.parse(u.amenities || '[]')
            : [];

          const airbnbFeed = u.icalFeeds?.find((f) => f.channel === 'Airbnb');

          return (
            <div
              key={u.id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative'
              }}
            >
              <div>
                {/* Header row with status & actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--moon-gold)', fontWeight: 600 }}>
                      Floor {u.floor} • {u.type}
                    </span>
                    <h3 style={{ fontSize: '19px', fontWeight: 700, marginTop: '2px' }}>
                      {u.name}
                    </h3>
                    {u.address && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {u.address}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge badge-${u.status}`}>
                      {u.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => {
                        setEditingUnit(u);
                        setIsPropertyModalOpen(true);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 8px' }}
                      title="Edit apartment specifications"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(u)}
                      style={{ color: '#EF4444', padding: '6px' }}
                      title="Delete unit"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: '1.5' }}>
                  {u.description || 'Modern luxury apartment with bespoke aesthetics.'}
                </p>

                {/* Specs bar */}
                <div style={{ display: 'flex', gap: '18px', marginTop: '14px', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nightly Base</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--moon-gold)' }}>KSH {u.base_price.toLocaleString()}/nt</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cleaning Fee</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>KSH {u.cleaning_fee.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Guest Limit</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{u.max_guests} Guests</div>
                  </div>
                </div>

                {/* Custom Access details (Door Code & Wi-Fi) */}
                {(u.door_code || u.wifi_name) && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    {u.door_code && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981' }}>
                        <Key size={13} /> Keycode: <strong style={{ color: 'var(--text-main)' }}>{u.door_code}</strong>
                      </div>
                    )}
                    {u.wifi_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38BDF8' }}>
                        <Wifi size={13} /> Wi-Fi: <strong style={{ color: 'var(--text-main)' }}>{u.wifi_name}</strong>
                        {u.wifi_password && <span style={{ color: 'var(--text-muted)' }}>({u.wifi_password})</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Amenities */}
                {amenitiesList.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {amenitiesList.slice(0, 6).map((a: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {a}
                        </span>
                      ))}
                      {amenitiesList.length > 6 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px' }}>
                          +{amenitiesList.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Airbnb live connect & iCal export */}
              <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAirbnbConnectUnit(u)}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderColor: airbnbFeed ? 'rgba(255, 56, 92, 0.4)' : undefined,
                    color: airbnbFeed ? 'var(--airbnb-color)' : 'var(--text-main)',
                  }}
                >
                  <Globe size={13} />
                  {airbnbFeed ? 'Airbnb Connected' : 'Connect Airbnb iCal'}
                </button>

                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <Download size={13} /> Export .ICS
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Property Modal */}
      {isPropertyModalOpen && (
        <PropertyModal
          unit={editingUnit}
          onClose={() => {
            setIsPropertyModalOpen(false);
            setEditingUnit(null);
          }}
          onSaved={async () => {
            await onRefreshData();
          }}
        />
      )}

      {/* Connect Airbnb Modal */}
      {airbnbConnectUnit && (
        <ConnectAirbnbModal
          unit={airbnbConnectUnit}
          onClose={() => setAirbnbConnectUnit(null)}
          onConnected={async () => {
            await onRefreshData();
          }}
        />
      )}
    </div>
  );
}
