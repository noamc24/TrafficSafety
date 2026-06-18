const express = require("express");
const router = express.Router();
const { sendTelegramMessage, sendTelegramPhoto } = require("../bot/Sender");

const MAX_FULL_NAME_LENGTH = 80;
const MAX_COMPANY_LENGTH = 120;
const MAX_PHONE_LENGTH = 25;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 6000;
const MAX_NOTES_LENGTH = 1000;
const MAX_CART_ITEMS = 30;
const MAX_CART_TITLE_LENGTH = 160;
const MAX_PREVIEW_LENGTH = 10 * 1024 * 1024;
const TELEGRAM_SAFE_MESSAGE_LIMIT = 3900;

const allowedTopLevelFields = new Set([
  "fullName",
  "name",
  "phone",
  "email",
  "message",
  "company",
  "notes",
  "cart",
]);

const nameRegex = /^[\p{L}\p{N}\s.'\-_,()]{2,80}$/u;
const phoneRegex = /^[+()\-.\s0-9]{7,25}$/;
const safeTextRegex = /^[\p{L}\p{N}\p{P}\p{S}\s\n\r]{0,6000}$/u;

function escapeTelegramHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pushError(errors, field, message) {
  errors.push({ field, message });
}

function formatCartOptions(options) {
  if (!Array.isArray(options) || !options.length) return "ללא";
  return options
    .map((opt) => {
      const optionName = escapeTelegramHtml(opt?.name || "אפשרות");
      const optionValue = escapeTelegramHtml(opt?.value || "-");
      return `${optionName}: ${optionValue}`;
    })
    .join(" | ");
}

function buildCartSummary(cart) {
  if (!Array.isArray(cart) || !cart.length) {
    return "\n📦 <b>פריטים בהזמנה:</b>\nאין פריטים בהזמנה.";
  }

  const lines = ["", "📦 <b>פריטים בהזמנה:</b>"];
  cart.forEach((item, idx) => {
    const title = escapeTelegramHtml(item?.title || "מוצר");
    const quantity = escapeTelegramHtml(item?.quantity || 1);
    const category = escapeTelegramHtml(item?.category || "ללא");
    const optionsText = formatCartOptions(item?.options);
    lines.push(
      `${idx + 1}. <b>${title}</b>`,
      `כמות: ${quantity}`,
      `קטגוריה: ${category}`,
      `אפשרויות: ${optionsText}`,
      "",
    );
  });
  return lines.join("\n");
}

function truncateTelegramText(text) {
  const safeText = String(text || "");
  if (safeText.length <= TELEGRAM_SAFE_MESSAGE_LIMIT) return safeText;
  return `${safeText.slice(0, TELEGRAM_SAFE_MESSAGE_LIMIT)}\n\n... (ההודעה קוצרה)`;
}

function validateContactPayload(body) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      errors: [{ field: "body", message: "Invalid request payload." }],
    };
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedTopLevelFields.has(field),
  );

  if (unknownFields.length) {
    pushError(
      errors,
      "body",
      `Unexpected fields were sent: ${unknownFields.join(", ")}.`,
    );
  }

  const normalizedName = body.fullName ?? body.name ?? "";
  const normalizedCompany = body.company ?? "";
  const normalizedPhone = body.phone ?? "";
  const normalizedEmail = body.email ?? "";
  const normalizedMessage = body.message ?? "";
  const normalizedNotes = body.notes ?? "";
  const normalizedCart = body.cart ?? [];

  if (
    typeof normalizedName !== "string" ||
    normalizedName.length < 2 ||
    normalizedName.length > MAX_FULL_NAME_LENGTH ||
    !nameRegex.test(normalizedName)
  ) {
    pushError(
      errors,
      "fullName",
      "Name must be 2-80 characters and contain only letters, numbers, spaces, and common punctuation.",
    );
  }

  if (normalizedCompany !== "") {
    if (
      typeof normalizedCompany !== "string" ||
      normalizedCompany.length > MAX_COMPANY_LENGTH ||
      !safeTextRegex.test(normalizedCompany)
    ) {
      pushError(
        errors,
        "company",
        "Company must be up to 120 characters and include only standard text characters.",
      );
    }
  }

  if (
    typeof normalizedPhone !== "string" ||
    normalizedPhone.length < 7 ||
    normalizedPhone.length > MAX_PHONE_LENGTH ||
    !phoneRegex.test(normalizedPhone)
  ) {
    pushError(
      errors,
      "phone",
      "Phone must be 7-25 characters and include only digits and + ( ) - . symbols.",
    );
  }

  if (normalizedEmail !== "") {
    if (
      typeof normalizedEmail !== "string" ||
      normalizedEmail.length > MAX_EMAIL_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      pushError(errors, "email", "Please provide a valid email address.");
    }
  }

  if (
    typeof normalizedMessage !== "string" ||
    normalizedMessage.length < 5 ||
    normalizedMessage.length > MAX_MESSAGE_LENGTH ||
    !safeTextRegex.test(normalizedMessage)
  ) {
    pushError(
      errors,
      "message",
      "Message must be 5-6000 characters and include standard text symbols.",
    );
  }

  if (normalizedNotes !== "") {
    if (
      typeof normalizedNotes !== "string" ||
      normalizedNotes.length > MAX_NOTES_LENGTH ||
      !safeTextRegex.test(normalizedNotes)
    ) {
      pushError(
        errors,
        "notes",
        "Notes must be up to 1000 characters and include only standard text characters.",
      );
    }
  }

  if (!Array.isArray(normalizedCart)) {
    pushError(errors, "cart", "Cart must be an array.");
  } else if (normalizedCart.length > MAX_CART_ITEMS) {
    pushError(errors, "cart", `Cart can include up to ${MAX_CART_ITEMS} items.`);
  } else {
    normalizedCart.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        pushError(errors, `cart[${index}]`, "Each cart item must be an object.");
        return;
      }

      if (
        typeof item.title !== "string" ||
        !item.title.length ||
        item.title.length > MAX_CART_TITLE_LENGTH
      ) {
        pushError(
          errors,
          `cart[${index}].title`,
          "Item title is required and must be up to 160 characters.",
        );
      }

      if (
        item.quantity !== undefined &&
        (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)
      ) {
        pushError(
          errors,
          `cart[${index}].quantity`,
          "Item quantity must be an integer between 1 and 999.",
        );
      }

      if (item.customDesignPreview !== undefined) {
        const preview = item.customDesignPreview;
        const isString = typeof preview === "string";
        const isDataUri = isString && preview.startsWith("data:image/");
        const isHttpUrl =
          isString && (preview.startsWith("http://") || preview.startsWith("https://"));
        const isValidLength =
          (isHttpUrl && preview.length <= 2048) ||
          (isDataUri && preview.length <= MAX_PREVIEW_LENGTH);
        if (!isValidLength || (!isDataUri && !isHttpUrl)) {
          pushError(
            errors,
            `cart[${index}].customDesignPreview`,
            "Preview must be a valid http(s) URL (up to 2048 chars) or image data URI.",
          );
        }
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

router.post("/", async (req, res) => {
  const validation = validateContactPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      error: "Please review the form fields and try again.",
      validationErrors: validation.errors,
    });
  }

  try {
    const { fullName, name, email, phone, message, company, notes, cart } = req.body;
    const senderName = escapeTelegramHtml(fullName || name || "-");
    const senderEmail = escapeTelegramHtml(email || "-");
    const senderPhone = escapeTelegramHtml(phone || "-");
    const senderMessage = escapeTelegramHtml(message || "-");
    const senderCompany = escapeTelegramHtml(company || "-");
    const senderNotes = escapeTelegramHtml(notes || "-");

    const text =
      `📩 <b>פנייה חדשה</b>\n` +
      `👤 <b>שם:</b> ${senderName}\n` +
      `🏢 <b>חברה:</b> ${senderCompany}\n` +
      `📧 <b>אימייל:</b> ${senderEmail}\n` +
      `📞 <b>טלפון:</b> ${senderPhone}\n\n` +
      `📝 <b>הודעה:</b>\n${senderMessage}\n\n` +
      `📎 <b>הערות:</b>\n${senderNotes}`;

    const finalText = truncateTelegramText(`${text}${buildCartSummary(cart)}`);
    await sendTelegramMessage(finalText);

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
    const errorId = Math.random().toString(36).slice(2, 10);
    console.error(`[contact-route:${errorId}]`, err);
    return res.status(500).json({
      ok: false,
      error: "אירעה שגיאה בעת שליחת הפנייה. נא לנסות שוב מאוחר יותר.",
      errorId,
    });
  }
});

module.exports = router;
