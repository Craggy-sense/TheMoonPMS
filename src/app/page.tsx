'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Unit, Booking, StaffUser } from '@/lib/types';
import { TapeChartCalendar } from '@/components/TapeChartCalendar';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';
import { NewBookingModal } from '@/components/NewBookingModal';
import { ChannelManager } from '@/components/ChannelManager';
import { ReservationsList } from '@/components/ReservationsList';
import { HousekeepingTracker } from '@/components/HousekeepingTracker';
import { UnitsCatalog } from '@/components/UnitsCatalog';
import { FinancialsView } from '@/components/FinancialsView';
import { LoginScreen } from '@/components/LoginScreen';
import { StaffManagementModal } from '@/components/StaffManagementModal';
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
  Radio,
  User,
  Users,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function MoonApartmentsDashboard() {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

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

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'housekeeping') {
            setActiveTab('housekeeping');
          }
        }
      } catch (err) {
        console.error('Auth check error', err);
      } finally {
        setAuthChecking(false);
      }
    }

    checkAuth();
  }, []);

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
    if (currentUser) {
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
    }
  }, [currentUser, loadData]);

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
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

  // If loading session
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C15', color: '#FFF' }}>
        <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--moon-gold)' }} />
      </div>
    );
  }

  // If unauthenticated: display staff login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'housekeeping') {
            setActiveTab('housekeeping');
          } else {
            setActiveTab('calendar');
          }
          loadData();
        }}
      />
    );
  }

  const isHousekeeping = currentUser.role === 'housekeeping';
  const isReception = currentUser.role === 'reception';
  const isAdmin = currentUser.role === 'admin';

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
        <div className="brand-container" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/themoon-icon.webp"
            alt="The Moon"
            style={{ width: '42px', height: '42px', borderRadius: '50%', boxShadow: '0 0 18px rgba(56, 189, 248, 0.45)', objectFit: 'contain' }}
          />
          <div>
            <img
              src="/themoon-serenity-logo.webp"
              alt="The Moon Serenity Furnished Apartments"
              style={{ height: '30px', maxWidth: '200px', objectFit: 'contain', display: 'block' }}
            />
            <div className="brand-subtitle" style={{ marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Ruaka • Thindigua • Fourways Junction | Management' : isReception ? 'Front Desk Hub' : 'Housekeeping Portal'}
            </div>
          </div>
        </div>

        {/* Center Nav Tabs - REGULATED BY ROLE */}
        <nav className="nav-tabs">
          {!isHousekeeping && (
            <button
              className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={15} /> Tape Chart
            </button>
          )}

          {!isHousekeeping && (
            <button
              className={`nav-tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservations')}
            >
              <ListFilter size={15} /> Reservations
            </button>
          )}

          {isAdmin && (
            <button
              className={`nav-tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
              onClick={() => setActiveTab('channels')}
            >
              <Globe size={15} /> iCal Channels
            </button>
          )}

          <button
            className={`nav-tab-btn ${activeTab === 'housekeeping' ? 'active' : ''}`}
            onClick={() => setActiveTab('housekeeping')}
          >
            <Sparkles size={15} /> Housekeeping
          </button>

          {!isHousekeeping && (
            <button
              className={`nav-tab-btn ${activeTab === 'units' ? 'active' : ''}`}
              onClick={() => setActiveTab('units')}
            >
              <Layers size={15} /> Apartments
            </button>
          )}

          {isAdmin && (
            <button
              className={`nav-tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <BarChart3 size={15} /> Financials
            </button>
          )}
        </nav>

        {/* Right CTA Actions & User Profile */}
        <div className="header-actions">
          {/* Staff Profile Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '5px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)'
          }}>
            <User size={13} style={{ color: 'var(--moon-gold)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{currentUser.name}</span>
            <span
              className="badge"
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                background: isAdmin ? 'rgba(245, 158, 11, 0.2)' : isReception ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isAdmin ? 'var(--moon-gold)' : isReception ? '#818CF8' : '#34D399',
              }}
            >
              {currentUser.role}
            </span>
          </div>

          {/* Admin Staff & Permissions Button */}
          {isAdmin && (
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
              title="Manage staff accounts & PINs"
            >
              <Users size={14} /> Team & PINs
            </button>
          )}

          {!isHousekeeping && (
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
          )}

          {!isHousekeeping && (
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
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '7px 10px', color: '#EF4444' }}
            title="Log out of PMS"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* KPI Strip (Only displayed for Front Desk and Admin) */}
        {!isHousekeeping && stats && (
          <div className="kpi-grid">
            {isAdmin && (
              <div className="kpi-card glass-panel" style={{ '--kpi-accent': 'var(--moon-gold)' } as any}>
                <div className="kpi-title">
                  <span>Occupancy Rate</span>
                  <Radio size={14} style={{ color: 'var(--moon-gold)' }} />
                </div>
                <div className="kpi-value">{stats.occupancyRate}%</div>
                <div className="kpi-desc">{stats.totalUnits} Units in Portfolio</div>
              </div>
            )}

            {isAdmin && (
              <div className="kpi-card glass-panel" style={{ '--kpi-accent': '#10B981' } as any}>
                <div className="kpi-title">
                  <span>Monthly Revenue</span>
                  <Home size={14} style={{ color: '#10B981' }} />
                </div>
                <div className="kpi-value">KES {stats.totalRevenue.toLocaleString()}</div>
                <div className="kpi-desc">ADR: KES {stats.adr.toLocaleString()}/night</div>
              </div>
            )}

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
        {activeTab === 'calendar' && !isHousekeeping && (
          <TapeChartCalendar
            units={units}
            bookings={bookings}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSelectBooking={(b) => setSelectedBooking(b)}
            onNewBookingForUnitAndDate={handleCellNewBooking}
          />
        )}

        {activeTab === 'reservations' && !isHousekeeping && (
          <ReservationsList
            bookings={bookings}
            onSelectBooking={(b) => setSelectedBooking(b)}
            onUpdateStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
          />
        )}

        {activeTab === 'channels' && isAdmin && (
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

        {activeTab === 'units' && !isHousekeeping && (
          <UnitsCatalog
            units={units}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'financials' && isAdmin && (
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
      {isNewBookingOpen && !isHousekeeping && (
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

      {/* Staff & Permissions Modal (Admin Only) */}
      {isStaffModalOpen && (
        <StaffManagementModal
          onClose={() => setIsStaffModalOpen(false)}
        />
      )}
    </div>
  );
}
