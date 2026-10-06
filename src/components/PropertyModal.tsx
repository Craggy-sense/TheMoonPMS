'use client';

import React, { useState } from 'react';
import { Unit } from '@/lib/types';
import { X, Home, Wifi, Key, Globe, DollarSign, Layers, Plus, Trash2, ShieldCheck, Info } from 'lucide-react';

interface PropertyModalProps {
  unit?: Unit | null; // If passed, edit mode; else create mode
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const COMMON_AMENITIES = [
  'King Bed',
  'Queen Bed',
  'Jacuzzi',
  'Wrap-around Balcony',
  'Dedicated Workspace',
  'High-speed WiFi',
  'Full Kitchen',
  'Kitchenette',
  'Smart TV 65"',
  'Nespresso Machine',
  'Washer / Dryer',
  'Private Patio',
  'Panoramic City View',
  'Smart Lock Check-in',
  'Central AC & Heat',
];

export function PropertyModal({ unit, onClose, onSaved }: PropertyModalProps) {
  const isEditing = Boolean(unit);

  const [name, setName] = useState(unit?.name || '');
  const [type, setType] = useState(unit?.type || '1BR Suite');
  const [floor, setFloor] = useState(unit?.floor !== undefined ? String(unit.floor) : '1');
  const [maxGuests, setMaxGuests] = useState(unit?.max_guests !== undefined ? String(unit.max_guests) : '2');
  const [basePrice, setBasePrice] = useState(unit?.base_price !== undefined ? String(unit.base_price) : '180');
  const [cleaningFee, setCleaningFee] = useState(unit?.cleaning_fee !== undefined ? String(unit.cleaning_fee) : '45');
  const [description, setDescription] = useState(unit?.description || '');
  const [address, setAddress] = useState(unit?.address || 'The Moon Apartments, 100 Lunar Crescent');
  
  // Custom access credentials
  const [wifiName, setWifiName] = useState(unit?.wifi_name || 'MoonApartments-Guest');
  const [wifiPassword, setWifiPassword] = useState(unit?.wifi_password || 'LunarStay2026!');
  const [doorCode, setDoorCode] = useState(unit?.door_code || '');

  // Airbnb specific connections
  const existingAirbnbFeed = unit?.icalFeeds?.find((f) => f.channel === 'Airbnb');
  const [airbnbIcalUrl, setAirbnbIcalUrl] = useState(existingAirbnbFeed?.url || '');
  const [airbnbListingUrl, setAirbnbListingUrl] = useState(unit?.airbnb_listing_url || '');

  // Amenities
  const initialAmenities: string[] = Array.isArray(unit?.amenities)
    ? unit.amenities
    : typeof unit?.amenities === 'string'
    ? JSON.parse(unit?.amenities || '[]')
    : [];
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);
  const [customAmenity, setCustomAmenity] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      setSelectedAmenities([...selectedAmenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Apartment name is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: unit?.id,
          name: name.trim(),
          type: type.trim(),
          floor: Number(floor) || 1,
          max_guests: Number(maxGuests) || 2,
          base_price: Number(basePrice) || 150,
          cleaning_fee: Number(cleaningFee) || 40,
          description: description.trim(),
          amenities: selectedAmenities,
          wifi_name: wifiName.trim() || null,
          wifi_password: wifiPassword.trim() || null,
          door_code: doorCode.trim() || null,
          address: address.trim() || null,
          airbnb_listing_url: airbnbListingUrl.trim() || null,
          airbnb_ical_url: airbnbIcalUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save apartment');
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} style={{ color: 'var(--moon-gold)' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                {isEditing ? `Edit ${unit?.name || 'Apartment'}` : 'Add New Moon Apartment Property'}
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Configure property specifications, smart access credentials, and direct Airbnb live feeds
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#F87171',
                fontSize: '13px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* SECTION 1: CORE IDENTIFICATION */}
            <div>
              <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--moon-gold)', marginBottom: '12px' }}>
                1. Apartment Specifications
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Apartment Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Moon Skyline Loft 302"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Category / Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Studio Suite">Studio Suite</option>
                    <option value="1BR Loft">1BR Loft</option>
                    <option value="1BR Suite">1BR Suite</option>
                    <option value="2BR Suite">2BR Suite</option>
                    <option value="2BR Penthouse">2BR Penthouse</option>
                    <option value="3BR Presidential">3BR Presidential</option>
                    <option value="Garden Villa">Garden Villa</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Guests</label>
                  <input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nightly Rate (KSH)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    min="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cleaning Fee (KSH)</label>
                  <input
                    type="number"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Building Wing / Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. The Moon Apartments, Tower B, Level 4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Description & Ambience</label>
                <textarea
                  rows={2}
                  placeholder="Boutique interior details, furnishings, and view..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 2: LIVE AIRBNB INTEGRATION */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Globe size={16} style={{ color: 'var(--airbnb-color)' }} />
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--airbnb-color)' }}>
                  2. Live Airbnb Connection
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Live Airbnb iCal Sync URL (.ics)</label>
                <input
                  type="url"
                  placeholder="https://www.airbnb.com/calendar/ical/12345678.ics?s=your_token"
                  value={airbnbIcalUrl}
                  onChange={(e) => setAirbnbIcalUrl(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Copy this from Airbnb Host Dashboard: Listing → Pricing & availability → Calendar sync → Export calendar.
                </span>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Airbnb Listing Public Webpage URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://www.airbnb.com/rooms/12345678"
                  value={airbnbListingUrl}
                  onChange={(e) => setAirbnbListingUrl(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 3: ACCESS & CREDENTIALS */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Key size={16} style={{ color: '#10B981' }} />
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10B981' }}>
                  3. Keyless Entry & Guest Wi-Fi
                </h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Smart Lock / Keybox Door Code</label>
                  <input
                    type="text"
                    placeholder="e.g. *9204#"
                    value={doorCode}
                    onChange={(e) => setDoorCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Apartment Wi-Fi SSID</label>
                  <input
                    type="text"
                    placeholder="e.g. Moon-401-5G"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Wi-Fi Password</label>
                <input
                  type="text"
                  placeholder="e.g. moon_penthouse_2026"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 4: AMENITIES */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                4. Apartment Amenities & Badges
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {COMMON_AMENITIES.map((am) => {
                  const isChecked = selectedAmenities.includes(am);
                  return (
                    <button
                      type="button"
                      key={am}
                      onClick={() => toggleAmenity(am)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        background: isChecked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isChecked ? 'var(--moon-gold)' : 'var(--border-subtle)'}`,
                        color: isChecked ? 'var(--moon-gold)' : 'var(--text-secondary)',
                      }}
                    >
                      {isChecked ? '✓ ' : '+ '} {am}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add custom amenity (e.g. Espresso Bar, Fireplace)..."
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  style={{ flex: 1, padding: '7px 12px' }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="btn-secondary"
                  style={{ padding: '7px 14px' }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Apartment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
