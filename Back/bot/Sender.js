async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsRaw = process.env.TELEGRAM_CHAT_IDS;

  if (!token || !chatIdsRaw) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS");
  }

  const chatIds = chatIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    throw new Error("No valid Telegram chat IDs found");
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const results = [];

  for (const chatId of chatIds) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`Telegram error for chat_id ${chatId}: ${JSON.stringify(data)}`);
    }

    results.push(data);
  }

  return results;
}

function dataUrlToBlob(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || "image/jpeg";
  const base64 = match[2] || "";
  const buffer = Buffer.from(base64, "base64");
  return new Blob([buffer], { type: mimeType });
}

async function sendTelegramPhoto(dataUrl, caption = "") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsRaw = process.env.TELEGRAM_CHAT_IDS;

  if (!token || !chatIdsRaw) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS");
  }

  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return [];

  const chatIds = chatIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    throw new Error("No valid Telegram chat IDs found");
  }

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  const results = [];

  for (const chatId of chatIds) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", caption || "הדמיית עיצוב מותאם");
    form.append("parse_mode", "HTML");
    form.append("photo", blob, "custom-design-preview.jpg");

    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`Telegram photo error for chat_id ${chatId}: ${JSON.stringify(data)}`);
    }

    results.push(data);
  }

  return results;
}

module.exports = { sendTelegramMessage, sendTelegramPhoto };
