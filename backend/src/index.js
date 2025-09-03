import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import healthRouter from './routes/health.js';
import roomsRouter from './routes/rooms.js';
import bookingsRouter from './routes/bookings.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*'}));
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'scalar-backend', time: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
