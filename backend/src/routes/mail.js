
 import { Router } from 'express';
 import nodemailer from 'nodemailer';
 
 const router = Router();
 
 // Create Nodemailer transporter (SMTP)
 const transporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: Number(process.env.SMTP_PORT),
   secure: String(process.env.SMTP_PORT) === '465', // true for 465, false for others
   auth: {
     user: process.env.SMTP_USER,
     pass: process.env.SMTP_PASS,
   },
 });
 
 function fmt(dt) {
   try {
     return new Date(dt).toLocaleString();
   } catch {
     return String(dt || '');
   }
 }
 
 // POST /mail/booking-confirm
 // Body: { email, booking: { room_number?, room_type?, start_time?, end_time?, price? } }
 router.post('/booking-confirm', async (req, res) => {
   const { email, booking = {} } = req.body || {};
   if (!email) return res.status(400).json({ error: 'Missing email' });
 
   const {
     room_number,
     room_type,
     start_time,
     end_time,
     price,
   } = booking;
 
   const subject = 'Your booking is confirmed';
   const html = `
   <html>
     <body style="font-family:Arial,sans-serif;background:#f6f8fa;padding:0;margin:0;">
       <div style="max-width:640px;margin:auto;background:#ffffff;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
         <h2 style="margin-top:0;color:#111827;">Booking Confirmed</h2>
         <p style="color:#374151;">Thank you for your booking. Here are your details:</p>
         <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;color:#111827;">
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;width:40%;">Room</td>
             <td style="border-bottom:1px solid #e5e7eb;">${room_number ?? '-'}${room_type ? ` (${room_type})` : ''}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">Start</td>
             <td style="border-bottom:1px solid #e5e7eb;">${fmt(start_time)}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">End</td>
             <td style="border-bottom:1px solid #e5e7eb;">${fmt(end_time)}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">Price</td>
             <td style="border-bottom:1px solid #e5e7eb;">${price != null ? `₹${price}` : '-'}</td>
           </tr>
         </table>
         <p style="color:#6b7280;margin-top:24px;">If you have any questions, reply to this email.</p>
       </div>
     </body>
   </html>`;
 
   try {
     await transporter.sendMail({
       from: `Scaler Hotel <${process.env.SMTP_USER}>`,
       to: email,
       subject,
       html,
     });
     return res.json({ ok: true, message: 'Confirmation email sent.' });
   } catch (err) {
     console.error('SMTP error (confirm):', err);
     return res.status(500).json({ error: 'Failed to send confirmation email.' });
   }
 });
 
 // POST /mail/booking-cancelled
 // Body: { email, booking: { room_number?, start_time?, end_time?, price? }, refund_percent?, refund_amount? }
 router.post('/booking-cancelled', async (req, res) => {
   const { email, booking = {}, refund_percent, refund_amount } = req.body || {};
   if (!email) return res.status(400).json({ error: 'Missing email' });
 
   const { room_number, room_type, start_time, end_time, price } = booking;
   const subject = 'Your booking has been cancelled';
   const html = `
   <html>
     <body style="font-family:Arial,sans-serif;background:#f6f8fa;padding:0;margin:0;">
       <div style="max-width:640px;margin:auto;background:#ffffff;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
         <h2 style="margin-top:0;color:#111827;">Booking Cancelled</h2>
         <p style="color:#374151;">Your booking has been cancelled. Summary is below:</p>
         <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;color:#111827;">
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;width:40%;">Room</td>
             <td style="border-bottom:1px solid #e5e7eb;">${room_number ?? '-'}${room_type ? ` (${room_type})` : ''}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">Start</td>
             <td style="border-bottom:1px solid #e5e7eb;">${fmt(start_time)}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">End</td>
             <td style="border-bottom:1px solid #e5e7eb;">${fmt(end_time)}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">Original Price</td>
             <td style="border-bottom:1px solid #e5e7eb;">${price != null ? `₹${price}` : '-'}</td>
           </tr>
           <tr>
             <td style="border-bottom:1px solid #e5e7eb;">Refund</td>
             <td style="border-bottom:1px solid #e5e7eb;">${refund_percent != null ? refund_percent : '-'}% (${refund_amount != null ? `₹${refund_amount}` : '-'})</td>
           </tr>
         </table>
         <p style="color:#6b7280;margin-top:24px;">We hope to serve you again.</p>
       </div>
     </body>
   </html>`;
 
   try {
     await transporter.sendMail({
       from: `Scaler Hotel <${process.env.SMTP_USER}>`,
       to: email,
       subject,
       html,
     });
     return res.json({ ok: true, message: 'Cancellation email sent.' });
   } catch (err) {
     console.error('SMTP error (cancel):', err);
     return res.status(500).json({ error: 'Failed to send cancellation email.' });
   }
 });
 
 export default router;
 
