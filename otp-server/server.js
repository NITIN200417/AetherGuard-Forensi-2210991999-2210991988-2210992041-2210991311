require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── In-memory OTP store ────────────────────────────────────────────────────
// Structure: { email: { otp, expiresAt, attempts } }
const otpStore = new Map();

const OTP_EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_SECONDS) || 300) * 1000;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;

// ─── Nodemailer Transport ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify((err) => {
  if (err) {
    console.error('⚠️  SMTP connection failed:', err.message);
    console.log('   → Running in DEMO MODE (OTP printed to console instead)');
  } else {
    console.log('✅ SMTP connected. Email delivery active.');
  }
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Rate limiter: max 5 OTP requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many OTP requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateOTP() {
  // Cryptographically secure 6-digit OTP
  return crypto.randomInt(100000, 999999).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: `"AetherGuard Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 AetherGuard OTP — Your Secure Access Code',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#02040a;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;background:#0a0e18;border:1px solid rgba(168,85,247,0.2);border-radius:24px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0a2e,#0a0f1e);padding:40px;text-align:center;border-bottom:1px solid rgba(168,85,247,0.15);">
              <div style="display:inline-block;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:16px;margin-bottom:20px;">
                <span style="font-size:32px;">🛡️</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">AETHER<span style="color:#a855f7;">GUARD</span></h1>
              <p style="color:#64748b;margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.3em;">Forensic Security Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px 40px;">
              <p style="color:#94a3b8;font-size:13px;margin:0 0 32px;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;">SECURE ACCESS CODE TRANSMITTED:</p>
              <!-- OTP Box -->
              <div style="background:rgba(168,85,247,0.05);border:2px solid rgba(168,85,247,0.3);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
                <div style="letter-spacing:0.5em;font-size:48px;font-weight:900;color:#a855f7;font-family:monospace;text-shadow:0 0 30px rgba(168,85,247,0.5);">
                  ${otp.split('').join(' ')}
                </div>
              </div>
              <div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <p style="color:#60a5fa;margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;">
                  ⏱ EXPIRES IN ${Math.floor(OTP_EXPIRY_MS / 60000)} MINUTES &nbsp;|&nbsp; MAX ${OTP_MAX_ATTEMPTS} ATTEMPTS
                </p>
              </div>
              <p style="color:#475569;font-size:11px;margin:0;line-height:1.8;">
                If you didn't request this, your account may be under threat. Disregard this message and secure your credentials immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="color:#334155;font-size:10px;margin:0;text-transform:uppercase;letter-spacing:0.3em;">
                AES-256 ENCRYPTED &nbsp;|&nbsp; © 2026 AETHERGUARD ENTERPRISE
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /health — Server healthcheck */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AetherGuard OTP Server',
    uptime: Math.floor(process.uptime()) + 's',
    smtp: process.env.EMAIL_USER ? 'configured' : 'unconfigured (demo mode)',
  });
});

/** POST /send-otp — Generate and send a new OTP to the given email */
app.post('/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  // Generate OTP + store it
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(normalizedEmail, { otp, expiresAt, attempts: 0 });

  // Try to send the email
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'your_email@gmail.com') {
      // DEMO MODE — print to console
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 DEMO MODE — OTP for ${normalizedEmail}`);
      console.log(`   CODE: \x1b[35m\x1b[1m${otp}\x1b[0m`);
      console.log(`   Expires in: ${Math.floor(OTP_EXPIRY_MS / 60000)} minutes`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      await sendOTPEmail(normalizedEmail, otp);
      console.log(`✅ OTP sent to ${normalizedEmail}`);
    }

    return res.json({
      success: true,
      message: 'OTP transmitted successfully.',
      expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
    });
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    otpStore.delete(normalizedEmail);
    return res.status(500).json({
      success: false,
      error: 'Failed to transmit OTP. Check SMTP config.',
      detail: err.message,
    });
  }
});

/** POST /verify-otp — Verify a submitted OTP */
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  // No OTP on record
  if (!record) {
    return res.status(400).json({ success: false, error: 'No OTP requested for this email. Please request a new one.' });
  }

  // Check expiry
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.', code: 'EXPIRED' });
  }

  // Increment attempt counter
  record.attempts += 1;

  // Max attempts exceeded
  if (record.attempts > OTP_MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return res.status(429).json({ success: false, error: 'Maximum attempts exceeded. Request a new OTP.', code: 'MAX_ATTEMPTS' });
  }

  // Wrong OTP
  if (record.otp !== otp.toString().trim()) {
    const remaining = OTP_MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({
      success: false,
      error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      code: 'INVALID',
      attemptsRemaining: remaining,
    });
  }

  // ✅ Success — consume the OTP (one-time use)
  otpStore.delete(normalizedEmail);
  console.log(`🔓 Verified OTP for ${normalizedEmail}`);

  return res.json({
    success: true,
    message: 'Identity verified. Access granted.',
    email: normalizedEmail,
  });
});

// ─── Cleanup: expire stale OTPs every minute ─────────────────────────────────
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email);
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} expired OTP(s)`);
}, 60 * 1000);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n┌─────────────────────────────────────────────┐');
  console.log(`│  🛡️  AetherGuard OTP Server                  │`);
  console.log(`│  🚀  Running on http://localhost:${PORT}         │`);
  console.log(`│  📧  SMTP: ${process.env.EMAIL_USER || 'DEMO MODE (no email)'}`.padEnd(47) + '│');
  console.log(`│  ⏱️   OTP Expiry: ${Math.floor(OTP_EXPIRY_MS / 60000)} min | Max: ${OTP_MAX_ATTEMPTS} tries      │`);
  console.log('│  👁️  Watching for changes (nodemon active)   │');
  console.log('└─────────────────────────────────────────────┘\n');
});

module.exports = app;
