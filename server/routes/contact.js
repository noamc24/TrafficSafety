const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({ ok: false, error: "חסרים שדות חובה" });
    }

    // TODO (later): save to DB + send email notification
    console.log("📩 New Contact:", { fullName, email, phone, message });

    return res.json({ ok: true, message: "קיבלנו! נחזור אליך בהקדם 🙌" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "שגיאת שרת" });
  }
});

module.exports = router;
