const LAST_SUBMITTED_CART_KEY = "tsc_last_submitted_cart";
const LAST_SUBMITTED_CART_PERSIST_KEY = "tsc_last_submitted_cart_persist";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeSubmittedItemsFromHash() {
  const hash = String(window.location.hash || "");
  const match = hash.match(/items=([^&]+)/);
  if (!match) return [];
  try {
    const encoded = decodeURIComponent(match[1]);
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function renderSubmittedItems() {
  const wrapEl = document.getElementById("submittedItemsSection");
  const listEl = document.getElementById("submittedItemsList");
  if (!wrapEl || !listEl) return;

  let items = [];
  try {
    const payload =
      sessionStorage.getItem(LAST_SUBMITTED_CART_KEY) ||
      localStorage.getItem(LAST_SUBMITTED_CART_PERSIST_KEY) ||
      "[]";
    items = JSON.parse(payload);
  } catch (_) {
    items = [];
  }

  if (!Array.isArray(items) || items.length === 0) {
    items = decodeSubmittedItemsFromHash();
  }

  if (!Array.isArray(items) || items.length === 0) {
    wrapEl.classList.add("d-none");
    return;
  }

  const html = items.map((item, idx) => {
    const title = escapeHtml(item?.title || "מוצר");
    const qty = escapeHtml(item?.quantity || 1);
    const category = escapeHtml(item?.category || "ללא קטגוריה");
    return `
      <li class="submitted-item">
        <div class="submitted-item__head">
          <span class="submitted-item__index">${idx + 1}.</span>
          <strong>${title}</strong>
        </div>
        <div class="submitted-item__meta">
          <span>כמות: ${qty}</span>
          <span>קטגוריה: ${category}</span>
        </div>
      </li>
    `;
  }).join("");

  listEl.innerHTML = html;
  wrapEl.classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", renderSubmittedItems);
