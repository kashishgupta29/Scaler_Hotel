import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

// GET /rooms - List all rooms with type + price
router.get('/', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });

    const { data, error } = await supabase
      .from('rooms')
      .select('id, room_number, type, price_per_hour')
      .order('room_number', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ rooms: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /rooms - Create a new room
router.post('/', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });

    const { room_number, type, price_per_hour } = req.body || {};

    const num = Number(room_number);
    const price = Number(price_per_hour);
    const validTypes = ['Standard', 'Deluxe', 'Superior'];

    if (!Number.isInteger(num) || num <= 0)
      return res.status(400).json({ error: 'room_number must be a positive integer' });
    if (!validTypes.includes(type))
      return res.status(400).json({ error: "type must be one of 'Standard', 'Deluxe', 'Superior'" });
    if (!Number.isInteger(price) || price <= 0)
      return res.status(400).json({ error: 'price_per_hour must be a positive integer' });

    const { data, error } = await supabase
      .from('rooms')
      .insert({ room_number: num, type, price_per_hour: price })
      .select('id, room_number, type, price_per_hour')
      .single();

    if (error) {
      // Unique violation or other DB errors
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ room: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
