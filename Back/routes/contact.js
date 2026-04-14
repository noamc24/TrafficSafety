const express = require("express");
const router = express.Router();
const { sendTelegramMessage, sendTelegramPhoto } = require("../bot/Sender");

function escapeTelegramHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

router.post("/", async (req, res) => {
  try {
    const { fullName, name, email, phone, message, cart } = req.body;
    const senderName = escapeTelegramHtml(fullName || name || "-");
    const senderEmail = escapeTelegramHtml(email || "-");
    const senderPhone = escapeTelegramHtml(phone || "-");
    const senderMessage = escapeTelegramHtml(message || "-");

    const text =
      `📩 <b>פנייה חדשה</b>\n` +
      `👤 <b>שם:</b> ${senderName}\n` +
      `📧 <b>אימייל:</b> ${senderEmail}\n` +
      `📞 <b>טלפון:</b> ${senderPhone}\n\n` +
      `📝 <b>הודעה:</b>\n${senderMessage}`;

    await sendTelegramMessage(text);

    if (Array.isArray(cart) && cart.length) {
      for (const item of cart) {
        const preview = item?.customDesignPreview;
        if (!preview) continue;

        const caption =
          `<b>הדמיית עיצוב מותאם</b>\n` +
          `מוצר: ${escapeTelegramHtml(item?.title || "-")}\n` +
          `כמות: ${escapeTelegramHtml(item?.quantity || 1)}`;

        await sendTelegramPhoto(preview, caption);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "Telegram send failed",
      details: err?.message || String(err),
    });
  }
});

module.exports = router;
