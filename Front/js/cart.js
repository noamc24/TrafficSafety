const CART_STORAGE_KEY = "tsc_cart";
const WHATSAPP_NUMBER = "972548778669";

function readCart() {
  return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function optionText(options = []) {
  if (!options.length) return "ללא אפשרויות נוספות";
  return options.map((opt) => `${opt.name}: ${opt.value}`).join(" | ");
}

function buildCartItemHtml(item, index) {
  return `
    <article class="cart-item" data-index="${index}">
      <div class="cart-item__top">
        <div>
          <h3 class="cart-item__title">${item.title || "מוצר"}</h3>
          <p class="cart-item__category">${item.category || ""}</p>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger cart-remove-btn">הסר</button>
      </div>
      <div class="cart-item__details">
        <strong>אפשרויות:</strong>
        <ul>
          ${(item.options || []).map((opt) => `<li>${opt.name}: ${opt.value}</li>`).join("") || "<li>ללא</li>"}
        </ul>
      </div>
      <div class="cart-item__controls">
        <label class="d-flex align-items-center gap-2">
          <span>כמות</span>
          <input type="number" min="1" class="form-control form-control-sm cart-qty" value="${Number(item.quantity) || 1}" />
        </label>
      </div>
    </article>
  `;
}

function buildWhatsappMessage(cart) {
  const lines = ["שלום, אשמח לקבל הצעת מחיר עבור הפריטים הבאים מהחנות:"];
  cart.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.title || "מוצר"} | כמות: ${item.quantity || 1} | ${optionText(item.options)}`
    );
  });
  return lines.join("\n");
}

function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartSummaryEl = document.getElementById("cartSummary");
  const cartItemsCountEl = document.getElementById("cartItemsCount");

  if (!cartItemsEl || !cartEmptyEl || !cartSummaryEl || !cartItemsCountEl) return;

  const cart = readCart();
  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  cartItemsEl.innerHTML = "";

  if (!cart.length) {
    cartEmptyEl.classList.remove("d-none");
    cartSummaryEl.classList.add("d-none");
    return;
  }

  cartEmptyEl.classList.add("d-none");
  cartSummaryEl.classList.remove("d-none");
  cartItemsCountEl.textContent = String(totalItems);

  cart.forEach((item, index) => {
    cartItemsEl.insertAdjacentHTML("beforeend", buildCartItemHtml(item, index));
  });

  cartItemsEl.querySelectorAll(".cart-remove-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const card = event.target.closest(".cart-item");
      if (!card) return;
      const idx = Number(card.dataset.index);
      const nextCart = readCart();
      nextCart.splice(idx, 1);
      saveCart(nextCart);
      renderCart();
    });
  });

  cartItemsEl.querySelectorAll(".cart-qty").forEach((input) => {
    input.addEventListener("change", (event) => {
      const card = event.target.closest(".cart-item");
      if (!card) return;
      const idx = Number(card.dataset.index);
      const value = Math.max(1, Number(event.target.value) || 1);
      const nextCart = readCart();
      if (!nextCart[idx]) return;
      nextCart[idx].quantity = value;
      saveCart(nextCart);
      renderCart();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const clearCartBtn = document.getElementById("clearCartBtn");
  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");

  renderCart();

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      localStorage.removeItem(CART_STORAGE_KEY);
      renderCart();
    });
  }

  if (sendWhatsappBtn) {
    sendWhatsappBtn.addEventListener("click", () => {
      const cart = readCart();
      if (!cart.length) return;
      const message = encodeURIComponent(buildWhatsappMessage(cart));
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener");
    });
  }
});
