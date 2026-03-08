const express = require("express");
const router = express.Router();
const { sendTelegramMessage } = require("../Bot/Sender");

router.post("/", async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    const text =
      `📩 <b>פנייה חדשה</b>\n` +
      `👤 <b>שם:</b> ${fullName || "-"}\n` +
      `📧 <b>אימייל:</b> ${email || "-"}\n` +
      `📞 <b>טלפון:</b> ${phone || "-"}\n\n` +
      `📝 <b>הודעה:</b>\n${message || "-"}`;

    await sendTelegramMessage(text);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Telegram send failed" });
  }
});

module.exports = router;