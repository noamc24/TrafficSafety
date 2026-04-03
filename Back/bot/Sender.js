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

module.exports = { sendTelegramMessage };