
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
     const date = new Date(dt);
     // Convert to IST (UTC+5:30)
     const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
     const day = String(istDate.getUTCDate()).padStart(2, '0');
     const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
     const year = istDate.getUTCFullYear();
     const hours = String(istDate.getUTCHours()).padStart(2, '0');
     const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
     return `${day}/${month}/${year} ${hours}:${minutes}`;
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
             <td style="border-bottom:1px solid #e5e7eb;">Refund Amount</td>
             <td style="border-bottom:1px solid #e5e7eb;color:#059669;font-weight:600;">${refund_amount != null ? `₹${refund_amount}` : '-'} (${refund_percent != null ? refund_percent : '-'}%)</td>
           </tr>
         </table>
         
         <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:24px;">
           <h3 style="margin:0 0 12px 0;color:#065f46;font-size:16px;">Refund Policy</h3>
           <ul style="margin:0;padding-left:20px;color:#047857;font-size:14px;line-height:1.6;">
             <li><strong>48+ hours before check-in:</strong> 100% refund</li>
             <li><strong>24-48 hours before check-in:</strong> 50% refund</li>
             <li><strong>Less than 24 hours:</strong> No refund</li>
           </ul>
           <p style="margin:12px 0 0 0;color:#047857;font-size:13px;font-style:italic;">
             Refunds will be processed within 5-7 business days to your original payment method.
           </p>
         </div>
         
         <p style="color:#6b7280;margin-top:24px;">We hope to serve you again. If you have any questions about your refund, please contact our support team.</p>
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
 
