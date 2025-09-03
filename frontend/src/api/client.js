const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof body === 'string' ? body : body?.error || 'Request failed';
    throw new Error(message);
  }
  return body;
}

export const api = {
  getRooms: () => request('/rooms'),
  createRoom: (payload) => request('/rooms', { method: 'POST', body: JSON.stringify(payload) }),
  getBookings: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.append(k, v);
    });
    const qs = search.toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  createBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  updateBooking: (id, payload) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
  // Mail endpoints
  sendBookingConfirm: (payload) => request('/mail/booking-confirm', { method: 'POST', body: JSON.stringify(payload) }),
  sendBookingCancelled: (payload) => request('/mail/booking-cancelled', { method: 'POST', body: JSON.stringify(payload) }),
};



export function ceilHoursBetween(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const ms = end - start;
  if (!isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (60 * 60 * 1000));
}
