const express = require("express");
const router = express.Router();
const { sendTelegramMessage, sendTelegramPhoto } = require("../bot/Sender");

router.post("/", async (req, res) => {
  try {
    const { fullName, email, phone, message, cart } = req.body;

    const text =
      `📩 <b>פנייה חדשה</b>\n` +
      `👤 <b>שם:</b> ${fullName || "-"}\n` +
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
    return res.status(500).json({ ok: false, error: "Telegram send failed" });
  }
});

module.exports = router;
