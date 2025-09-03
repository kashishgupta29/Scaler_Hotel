import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { toast } from 'react-hot-toast';
import BookingDialog from '../components/BookingDialog.jsx';
import CancelDialog from '../components/CancelDialog.jsx';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ room_type: '', room_number: '', start_time: '', end_time: '' });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const roomById = useMemo(() => new Map(rooms.map(r => [r.id, r])), [rooms]);

  async function loadRooms() {
    try {
      const res = await api.getRooms();
      setRooms(res.rooms || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadBookings() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBookings(filters);
      setBookings(res.bookings || []);
    } catch (e) {
      setError(e.message || 'Failed to load bookings');
      toast.error(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { loadBookings(); }, []);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  function applyFilters() {
    loadBookings();
  }

  function clearFilters() {
    setFilters({ room_type: '', room_number: '', start_time: '', end_time: '' });
    setTimeout(loadBookings, 0);
  }

  function estimateRefundPercent(startISO) {
    const now = new Date();
    const start = new Date(startISO);
    const hours = (start - now) / (60 * 60 * 1000);
    if (hours >= 48) return 100;
    if (hours >= 24) return 50;
    return 0;
  }

  async function confirmCancel(id) {
    try {
      const res = await api.cancelBooking(id);
      setCancelTarget(null);
      await loadBookings();
      toast.success(`Booking cancelled. Refund ${res.refund_percent}% (₹${res.refund_amount})`);
    } catch (e) {
      toast.error(e.message || 'Failed to cancel');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      
      {/* Filters Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Room Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Room Type</label>
              <select
                name="room_type"
                value={filters.room_type}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Superior">Superior</option>
              </select>
            </div>
            {/* Room Number */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Room Number</label>
              <input
                type="number"
                name="room_number"
                value={filters.room_number}
                onChange={handleFilterChange}
                placeholder="e.g., 101"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* Start Time */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Start From</label>
              <input
                type="datetime-local"
                name="start_time"
                value={filters.start_time}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* End Time */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">End To</label>
              <input
                type="datetime-local"
                name="end_time"
                value={filters.end_time}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={applyFilters} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
              Clear Filters
            </button>
            <button onClick={() => {
              setEditingBooking(null);
              setIsBookingDialogOpen(true);
            }} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
          {loading && (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0c-4.4 0-8 3.6-8 8v4z"></path>
              </svg>
              Loading...
            </span>
          )}
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                {['User', 'Room', 'Type', 'Start', 'End', 'Price', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((b) => {
                const room = b.room || roomById.get(b.room_id);
                const refund = estimateRefundPercent(b.start_time);
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{b.user_email}</td>
                    <td className="px-4 py-3">{room?.room_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">{room?.type ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">{new Date(b.start_time).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(b.end_time).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">₹{b.price}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingBooking(b);
                            setIsBookingDialogOpen(true);
                          }}
                          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
                        >
                          Edit
                        </button>
                        {b.status === 'active' && (
                          <button
                            onClick={() => setCancelTarget({ id: b.id, estimate: refund, price: b.price })}
                            className="rounded-md bg-error-500 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-error-600 focus:ring-2 focus:ring-error-500"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="M7 8h10M7 12h10M7 16h10"></path>
                      </svg>
                      <p>No bookings found</p>
                      <button onClick={() => {
                        setEditingBooking(null);
                        setIsBookingDialogOpen(true);
                      }} className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-primary-600">
                        Create your first booking
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Dialog */}
      <CancelDialog 
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        cancelTarget={cancelTarget}
      />

      {/* Booking Dialog */}
      <BookingDialog
        isOpen={isBookingDialogOpen}
        bookingId={editingBooking?.id || null}
        onClose={(success) => {
          setIsBookingDialogOpen(false);
          setEditingBooking(null);
          if (success) {
            loadBookings();
          }
        }}
      />
    </div>
  );
}
