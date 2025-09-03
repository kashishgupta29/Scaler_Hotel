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
      // Snapshot booking info before cancelling for email context
      const booking = bookings.find(b => b.id === id);
      const room = booking?.room || roomById.get(booking?.room_id);
      const cancelRes = await api.cancelBooking(id);
      setCancelTarget(null);
      await loadBookings();
      toast.success(`Booking cancelled. Refund ${cancelRes.refund_percent}% (₹${cancelRes.refund_amount})`);
      // Fire & forget cancellation email
      if (booking) {
        try {
          await api.sendBookingCancelled({
            email: booking.user_email,
            booking: {
              room_number: room?.room_number,
              room_type: room?.type,
              start_time: booking.start_time,
              end_time: booking.end_time,
              price: booking.price,
            },
            refund_percent: cancelRes.refund_percent,
            refund_amount: cancelRes.refund_amount,
          });
        } catch (e) {
          console.warn('Failed to send cancellation email:', e);
        }
      }
    } catch (e) {
      toast.error(e.message || 'Failed to cancel');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-primary-600">{bookings.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'active').length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold text-purple-600">{rooms.length}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
            </div>
          </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Room Type */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">Room Type</label>
              <select
                name="room_type"
                value={filters.room_type}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-gray-300"
              >
                <option value="">Any Type</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Superior">Superior</option>
              </select>
            </div>
            {/* Room Number */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">Room Number</label>
              <input
                type="number"
                name="room_number"
                value={filters.room_number}
                onChange={handleFilterChange}
                placeholder="e.g., 101"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-gray-300"
              />
            </div>
            {/* Start Time */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">Check-in Date</label>
              <input
                type="datetime-local"
                name="start_time"
                value={filters.start_time}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-gray-300"
              />
            </div>
            {/* End Time */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">Check-out Date</label>
              <input
                type="datetime-local"
                name="end_time"
                value={filters.end_time}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-gray-300"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button onClick={applyFilters} className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200 cursor-pointer">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all duration-200 cursor-pointer">
              Clear All
            </button>
            <button onClick={() => {
              setEditingBooking(null);
              setIsBookingDialogOpen(true);
            }} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </button>
          </div>
        </div>
      </div>

        {/* Bookings Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
            </div>
            {loading && (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0c-4.4 0-8 3.6-8 8v4z"></path>
                </svg>
                Loading...
              </span>
            )}
          </div>

          {error && (
            <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {['User', 'Room', 'Type', 'Check-in', 'Check-out', 'Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-700 text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const room = b.room || roomById.get(b.room_id);
                  const refund = estimateRefundPercent(b.start_time);
                  return (
                    <tr key={b.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 text-sm">{b.user_email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {room?.room_number ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                          room?.type === 'Superior' ? 'bg-purple-100 text-purple-800' :
                          room?.type === 'Deluxe' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {room?.type ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{(() => {
                        const date = new Date(b.start_time);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                      })()}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{(() => {
                        const date = new Date(b.end_time);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                      })()}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-600">₹{b.price}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                          b.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {b.status === 'active' && (
                            <button
                              onClick={() => {
                                setEditingBooking(b);
                                setIsBookingDialogOpen(true);
                              }}
                              className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {b.status === 'active' && (
                            <button
                              onClick={() => setCancelTarget({ id: b.id, estimate: refund, price: b.price })}
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
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
                      }} className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-primary-600 cursor-pointer">
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
    </div>
  );
}
