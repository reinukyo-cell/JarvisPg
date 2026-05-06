// Vercel Serverless Function
// Las variables TELEGRAM_TOKEN y TELEGRAM_CHAT_ID se configuran en el dashboard de Vercel
// Settings → Environment Variables. NUNCA en el código.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const { n, em, w, b, m } = req.body || {};

    if (!n || !em || !w) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const txt = `🔥 Nuevo lead Jarvis Agency\n\nNombre: ${n}\nEmail: ${em}\nWhatsApp: ${w}\nNegocio: ${b || '-'}\nMensaje: ${m || '-'}`;

    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: txt })
    });

    if (!r.ok) {
      return res.status(502).json({ error: 'Telegram failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
}
