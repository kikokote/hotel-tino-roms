// api/send-push.js
// Vercel serverless function - sends push notification to a kelner
// Called by Supabase webhook when order status changes to 'ready'

const webpush = require('web-push');

// VAPID keys - these identify our app to Google/Apple push servers
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET;

webpush.setVapidDetails(
  'mailto:roms@hoteltino.mk',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify request is from our Supabase (security)
  const secret = req.headers['x-webhook-secret'];
  if (secret !== SUPABASE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { subscription, title, body, tag } = req.body;

  if (!subscription) {
    return res.status(400).json({ error: 'No subscription provided' });
  }

  const payload = JSON.stringify({ title, body, tag });

  try {
    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Push failed:', err);
    // If subscription expired/invalid, return 410 so app can clean it up
    if (err.statusCode === 410) {
      return res.status(410).json({ error: 'Subscription expired' });
    }
    res.status(500).json({ error: err.message });
  }
};
