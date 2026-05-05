const webpush = require('web-push');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    const bodySecret = process.env.PUSH_SECRET;
    const headerSecret = process.env.PUSH_HEADER_SECRET || bodySecret;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return json(res, 500, { ok: false, error: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' });
    }

    const headerValue = req.headers['x-webhook-secret'];
    const bodyValue = req.body && req.body.secret;
    const validSecret =
      (bodySecret && bodyValue === bodySecret) ||
      (headerSecret && headerValue === headerSecret) ||
      (bodySecret && headerValue === bodySecret);

    if (!validSecret) {
      return json(res, 401, { ok: false, error: 'Unauthorized' });
    }

    const subscription = req.body && req.body.subscription;
    if (!subscription || !subscription.endpoint) {
      return json(res, 400, { ok: false, error: 'Missing push subscription' });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title: req.body.title || 'Хотел Тино РОМС',
      body: req.body.body || 'Ново известување',
      tag: req.body.tag || ('roms-' + Date.now()),
      url: req.body.url || '/',
      icon: req.body.icon || '/icon.png',
      badge: req.body.badge || '/icon.png',
      vibrate: req.body.vibrate || [300, 100, 300],
      data: req.body.data || {}
    });

    await webpush.sendNotification(subscription, payload);
    return json(res, 200, { ok: true });
  } catch (err) {
    const statusCode = err && err.statusCode ? err.statusCode : 500;
    return json(res, statusCode, {
      ok: false,
      error: err && err.message ? err.message : 'Push failed',
      statusCode
    });
  }
};
