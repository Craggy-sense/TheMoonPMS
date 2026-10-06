'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Unit, Booking } from '@/lib/types';
import { TapeChartCalendar } from '@/components/TapeChartCalendar';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';
import { NewBookingModal } from '@/components/NewBookingModal';
import { ChannelManager } from '@/components/ChannelManager';
import { ReservationsList } from '@/components/ReservationsList';
import { HousekeepingTracker } from '@/components/HousekeepingTracker';
import { UnitsCatalog } from '@/components/UnitsCatalog';
import { FinancialsView } from '@/components/FinancialsView';
import {
  Moon,
  Calendar,
  ListFilter,
  Layers,
  Sparkles,
  BarChart3,
  RefreshCw,
  Plus,
  Home,
  CheckCircle,
  AlertCircle,
  Globe,
  Radio
} from 'lucide-react';

export default function MoonApartmentsDashboard() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'reservations' | 'channels' | 'housekeeping' | 'units' | 'financials'>('calendar');
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calendar date state (defaults to October 2026 based on seed data and metadata)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 6));

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newBookingUnitId, setNewBookingUnitId] = useState<string | undefined>();
  const [newBookingDate, setNewBookingDate] = useState<string | undefined>();

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [unitsRes, bookingsRes, statsRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/bookings'),
        fetch('/api/stats'),
      ]);

      const unitsData = await unitsRes.json();
      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();

      if (unitsData.units) setUnits(unitsData.units);
      if (bookingsData.bookings) setBookings(bookingsData.bookings);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load PMS data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then(() => loadData())
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleGlobalSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.summary || 'Channels successfully synchronized!');
        await loadData();
      } else {
        showToast(`Sync warning: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    await loadData();
    showToast(`Reservation status updated to ${status.replace('_', ' ')}`);
  };

  const handleDeleteBooking = async (id: string) => {
    const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete booking');
    await loadData();
    showToast('Reservation deleted.');
  };

  const handleCellNewBooking = (unitId: string, dateStr: string) => {
    setNewBookingUnitId(unitId);
    setNewBookingDate(dateStr);
    setIsNewBookingOpen(true);
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '28px',
          zIndex: 1000,
          background: '#0F172A',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--text-main)',
          fontSize: '13.5px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Sparkles size={16} style={{ color: 'var(--moon-gold)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Luxury Navigation Header */}
      <header className="pms-header">
        <div className="brand-container">
          <div className="brand-moon-icon">
            <Moon size={22} fill="#080C15" />
          </div>
          <div>
            <div className="brand-title">THE MOON APARTMENTS</div>
            <div className="brand-subtitle">PMS & Channel Hub</div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={15} /> Tape Chart
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <ListFilter size={15} /> Reservations
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            <Globe size={15} /> iCal Channels
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'housekeeping' ? 'active' : ''}`}
            onClick={() => setActiveTab('housekeeping')}
          >
            <Sparkles size={15} /> Housekeeping
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'units' ? 'active' : ''}`}
            onClick={() => setActiveTab('units')}
          >
            <Layers size={15} /> Apartments
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            <BarChart3 size={15} /> Financials
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="header-actions">
          <button
            onClick={handleGlobalSync}
            disabled={isSyncing}
            className="btn-secondary"
            title="Sync all Airbnb & Booking.com feeds"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span style={{ fontSize: '13px' }}>{isSyncing ? 'Syncing...' : 'Sync OTA'}</span>
            <div className="sync-pulse" />
          </button>

          <button
            onClick={() => {
              setNewBookingUnitId(undefined);
              setNewBookingDate(undefined);
              setIsNewBookingOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* KPI Strip */}
        {stats && (
          <div className="kpi-grid">
            <div className="kpi-card glass-panel" style={{ '--kpi-accent': 'var(--moon-gold)' } as any}>
              <div className="kpi-title">
                <span>Occupancy Rate</span>
                <Radio size={14} style={{ color: 'var(--moon-gold)' }} />
              </div>
              <div className="kpi-value">{stats.occupancyRate}%</div>
              <div className="kpi-desc">{stats.totalUnits} Units in Portfolio</div>
            </div>

            <div className="kpi-card glass-panel" style={{ '--kpi-accent': '#10B981' } as any}>
              <div className="kpi-title">
                <span>Monthly Revenue</span>
                <Home size={14} style={{ color: '#10B981' }} />
              </div>
              <div className="kpi-value">${stats.totalRevenue.toLocaleString()}</div>
              <div className="kpi-desc">ADR: ${stats.adr}/night</div>
            </div>

            <div className="kpi-card glass-panel" style={{ '--kpi-accent': 'var(--airbnb-color)' } as any}>
              <div className="kpi-title">
                <span>In-House Guests</span>
                <CheckCircle size={14} style={{ color: 'var(--airbnb-color)' }} />
              </div>
              <div className="kpi-value">{stats.checkedInCount}</div>
              <div className="kpi-desc">{stats.upcomingCount} Confirmed upcoming</div>
            </div>

            <div className="kpi-card glass-panel" style={{ '--kpi-accent': stats.dirtyUnits > 0 ? '#EF4444' : '#10B981' } as any}>
              <div className="kpi-title">
                <span>Turnover Status</span>
                <Sparkles size={14} style={{ color: stats.dirtyUnits > 0 ? '#EF4444' : '#10B981' }} />
              </div>
              <div className="kpi-value" style={{ color: stats.dirtyUnits > 0 ? '#F87171' : 'var(--text-main)' }}>
                {stats.dirtyUnits} Pending
              </div>
              <div className="kpi-desc">{stats.dirtyUnits === 0 ? 'All units inspected clean' : 'Requires cleaning action'}</div>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'calendar' && (
          <TapeChartCalendar
            units={units}
            bookings={bookings}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSelectBooking={(b) => setSelectedBooking(b)}
            onNewBookingForUnitAndDate={handleCellNewBooking}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationsList
            bookings={bookings}
            onSelectBooking={(b) => setSelectedBooking(b)}
            onUpdateStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelManager
            units={units}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'housekeeping' && (
          <HousekeepingTracker
            units={units}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'units' && (
          <UnitsCatalog
            units={units}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'financials' && (
          <FinancialsView
            stats={stats}
          />
        )}
      </main>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdateStatus={handleUpdateBookingStatus}
        onDeleteBooking={handleDeleteBooking}
      />

      {/* New Booking Modal */}
      {isNewBookingOpen && (
        <NewBookingModal
          units={units}
          initialUnitId={newBookingUnitId}
          initialDate={newBookingDate}
          onClose={() => setIsNewBookingOpen(false)}
          onCreated={async () => {
            await loadData();
            showToast('New reservation created successfully!');
          }}
        />
      )}
    </div>
  );
}
