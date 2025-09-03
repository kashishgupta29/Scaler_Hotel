import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

function parseDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function hoursRoundedUp(start, end) {
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return 0;
  const HOUR = 60 * 60 * 1000;
  return Math.ceil(ms / HOUR);
}

async function getRoomById(room_id) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, room_number, type, price_per_hour')
    .eq('id', room_id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function hasOverlap({ room_id, start_time, end_time, excludeId }) {
  let query = supabase
    .from('bookings')
    .select('id', { head: true, count: 'exact' })
    .eq('room_id', room_id)
    .eq('status', 'active')
    .lt('start_time', end_time.toISOString())
    .gt('end_time', start_time.toISOString());

  if (excludeId) query = query.neq('id', excludeId);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// POST /bookings
// Body: { user_email, room_id, start_time, end_time }
router.post('/', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });

    const { user_email, room_id, start_time, end_time } = req.body || {};
    const start = parseDate(start_time);
    const end = parseDate(end_time);

    if (!user_email || !room_id || !start || !end) {
      return res.status(400).json({ error: 'Missing or invalid fields: user_email, room_id, start_time, end_time' });
    }
    if (start >= end) return res.status(400).json({ error: 'start_time must be before end_time' });

    const room = await getRoomById(room_id);

    const overlap = await hasOverlap({ room_id, start_time: start, end_time: end });
    if (overlap) return res.status(409).json({ error: 'Overlapping booking exists for this room and time range' });

    const hours = hoursRoundedUp(start, end);
    const price = hours * room.price_per_hour;

    const { data, error } = await supabase
      .from('bookings')
      .insert({ user_email, room_id, start_time: start.toISOString(), end_time: end.toISOString(), price, status: 'active' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ booking: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// PUT /bookings/:id
router.put('/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });

    const { id } = req.params;
    const { user_email, room_id, start_time, end_time, status } = req.body || {};

    // Fetch existing booking
    const { data: existing, error: getErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (getErr) return res.status(404).json({ error: 'Booking not found' });

    const newRoomId = room_id || existing.room_id;
    const start = start_time ? parseDate(start_time) : new Date(existing.start_time);
    const end = end_time ? parseDate(end_time) : new Date(existing.end_time);

    if (!start || !end) return res.status(400).json({ error: 'Invalid dates' });
    if (start >= end) return res.status(400).json({ error: 'start_time must be before end_time' });

    const room = await getRoomById(newRoomId);

    const overlap = await hasOverlap({ room_id: newRoomId, start_time: start, end_time: end, excludeId: id });
    if (overlap) return res.status(409).json({ error: 'Overlapping booking exists for this room and time range' });

    const hours = hoursRoundedUp(start, end);
    const price = hours * room.price_per_hour;

    const updatePayload = {
      user_email: user_email ?? existing.user_email,
      room_id: newRoomId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      price,
      status: status ?? existing.status
    };

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ booking: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

function computeRefundPercent(now, start) {
  const diffMs = start.getTime() - now.getTime();
  const hours = diffMs / (60 * 60 * 1000);
  if (hours >= 48) return 100;
  if (hours >= 24) return 50;
  return 0;
}

// DELETE /bookings/:id - cancel booking and report refund
router.delete('/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });

    const { id } = req.params;

    const { data: existing, error: getErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (getErr) return res.status(404).json({ error: 'Booking not found' });

    const now = new Date();
    const start = new Date(existing.start_time);
    const percent = computeRefundPercent(now, start);
    const refund_amount = Math.round((percent / 100) * (existing.price || 0));

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ booking: data, refund_percent: percent, refund_amount });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /bookings - with optional filters
// Query params: room_number, room_type, start_time, end_time
router.get('/', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });

    const { room_number, room_type, start_time, end_time } = req.query;

    // Filter rooms first (if filters provided) to get eligible room IDs
    let roomsQuery = supabase.from('rooms').select('id, room_number, type, price_per_hour');
    if (room_number) roomsQuery = roomsQuery.eq('room_number', Number(room_number));
    if (room_type) roomsQuery = roomsQuery.eq('type', String(room_type));

    const { data: rooms, error: roomsErr } = await roomsQuery;
    if (roomsErr) return res.status(500).json({ error: roomsErr.message });

    const roomIds = rooms.map(r => r.id);

    let bookingsQuery = supabase.from('bookings').select('*').order('start_time', { ascending: true });

    if (roomIds.length > 0) bookingsQuery = bookingsQuery.in('room_id', roomIds);
    // If filters restrict to zero rooms, return empty set early
    if ((room_number || room_type) && roomIds.length === 0) return res.json({ bookings: [] });

    if (start_time) bookingsQuery = bookingsQuery.gte('start_time', new Date(start_time).toISOString());
    if (end_time) bookingsQuery = bookingsQuery.lte('end_time', new Date(end_time).toISOString());

    const { data: bookings, error } = await bookingsQuery;
    if (error) return res.status(500).json({ error: error.message });

    // Enrich with room info
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const enriched = bookings.map(b => ({
      ...b,
      room: roomMap.get(b.room_id) || null,
    }));

    return res.json({ bookings: enriched });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
