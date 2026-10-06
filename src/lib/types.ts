export type BookingSource = 'airbnb' | 'booking.com' | 'direct' | 'manual';
export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type UnitStatus = 'clean' | 'dirty' | 'in_progress' | 'maintenance';

export interface Unit {
  id: string;
  name: string;
  type: string;
  floor: number;
  max_guests: number;
  base_price: number;
  cleaning_fee: number;
  status: UnitStatus;
  description: string;
  amenities: string | string[]; // JSON array string or parsed array
  wifi_name?: string | null;
  wifi_password?: string | null;
  door_code?: string | null;
  airbnb_listing_url?: string | null;
  address?: string | null;
  created_at?: string;
  icalFeeds?: ICalFeed[];
}

export interface ICalFeed {
  id: string;
  unit_id: string;
  channel: 'Airbnb' | 'Booking.com' | 'VRBO' | 'Other';
  url: string;
  last_synced_at?: string;
  sync_status?: 'idle' | 'ok' | 'error';
  error_message?: string;
}

export interface Booking {
  id: string;
  unit_id: string;
  unit_name?: string;
  unit_type?: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests_count: number;
  total_price: number;
  paid_amount: number;
  status: BookingStatus;
  source: BookingSource;
  external_uid?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CleaningTask {
  id: string;
  unit_id: string;
  unit_name?: string;
  booking_id?: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string;
  notes?: string;
}

export interface SyncResult {
  feedId: string;
  unitId: string;
  channel: string;
  addedCount: number;
  updatedCount: number;
  errors: string[];
}
