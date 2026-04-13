const express = require("express");
const router = express.Router();
const { sendTelegramMessage, sendTelegramPhoto } = require("../bot/Sender");

router.post("/", async (req, res) => {
    console.log("contact payload keys:", Object.keys(req.body || {}));
    console.log("cart items:", Array.isArray(req.body?.cart) ? req.body.cart.length : 0);
  try {
    const { fullName, name, email, phone, message, cart } = req.body;
    const senderName = fullName || name || "-";

    const text =
      `📩 <b>פנייה חדשה</b>\n` +
      `👤 <b>שם:</b> ${senderName}\n` +
      `📧 <b>אימייל:</b> ${email || "-"}\n` +
      `📞 <b>טלפון:</b> ${phone || "-"}\n\n` +
      `📝 <b>הודעה:</b>\n${message || "-"}`;

    await sendTelegramMessage(text);

    if (Array.isArray(cart) && cart.length) {
      for (const item of cart) {
        const preview = item?.customDesignPreview;
        if (!preview) continue;

        const caption =
          `<b>הדמיית עיצוב מותאם</b>\n` +
          `מוצר: ${item?.title || "-"}\n` +
          `כמות: ${item?.quantity || 1}`;

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
