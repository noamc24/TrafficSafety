const CART_PAGE_STORAGE_KEY = "tsc_cart";
const WHATSAPP_NUMBER = "972548778669";

function readCart() {
  return JSON.parse(localStorage.getItem(CART_PAGE_STORAGE_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_PAGE_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("tsc-cart-updated"));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function optionText(options = []) {
  if (!options.length) return "ללא אפשרויות נוספות";
  return options.map((opt) => `${opt.name}: ${opt.value}`).join(" | ");
}

function buildCartItemHtml(item, index) {
  const imageSrc = item.image || "/assets/Icons/TSCLogoSquared.png";
  const title = item.title || "מוצר";
  const category = item.category || "";

  return `
    <article class="cart-item" data-index="${index}">
      <div class="cart-item__top">
        <div class="cart-item__head">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(title)}" class="cart-item__image" />
          <div>
            <h3 class="cart-item__title">${escapeHtml(title)}</h3>
            <p class="cart-item__category">${escapeHtml(category)}</p>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger cart-remove-btn">הסר</button>
      </div>

      <div class="cart-item__details">
        <strong>אפשרויות:</strong>
        <ul>
          ${
            (item.options || []).map(
              (opt) => `<li>${escapeHtml(opt.name)}: ${escapeHtml(opt.value)}</li>`
            ).join("") || "<li>ללא</li>"
          }
        </ul>
      </div>

      <div class="cart-item__controls">
        <label class="d-flex align-items-center gap-2">
          <span>כמות</span>
          <input
            type="number"
            min="1"
            class="form-control form-control-sm cart-qty"
            value="${Number(item.quantity) || 1}"
          />
        </label>
      </div>
    </article>
  `;
}

function buildWhatsappMessage(cart) {
  const lines = ["שלום, אשמח לקבל הצעת מחיר עבור הפריטים הבאים:"];
  cart.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.title || "מוצר"} | כמות: ${item.quantity || 1} | ${optionText(item.options)}`
    );
  });
  return lines.join("\n");
}

function buildTelegramQuoteMessage(customer, cart) {
  const lines = [
    "🛒 <b>בקשת הצעת מחיר חדשה מהאתר</b>",
    "",
    `👤 <b>שם:</b> ${escapeHtml(customer.fullName)}`,
    `📞 <b>טלפון:</b> ${escapeHtml(customer.phone)}`,
    `✉️ <b>אימייל:</b> ${escapeHtml(customer.email || "לא הוזן")}`,
    `🏢 <b>חברה:</b> ${escapeHtml(customer.company || "לא הוזן")}`,
    "",
    "📦 <b>מוצרים:</b>"
  ];

  cart.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. <b>${escapeHtml(item.title || "מוצר")}</b>`,
      `כמות: ${escapeHtml(item.quantity || 1)}`,
      `קטגוריה: ${escapeHtml(item.category || "ללא")}`,
      `אפשרויות: ${escapeHtml(optionText(item.options))}`,
      ""
    );
  });

  lines.push(`📝 <b>הערות:</b> ${escapeHtml(customer.notes || "ללא הערות")}`);

  return lines.join("\n");
}

function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartSummaryEl = document.getElementById("cartSummary");
  const cartItemsCountEl = document.getElementById("cartItemsCount");
  const quoteSectionEl = document.getElementById("quoteSection");

  if (!cartItemsEl || !cartEmptyEl || !cartSummaryEl || !cartItemsCountEl || !quoteSectionEl) {
    return;
  }

  const cart = readCart();
  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  cartItemsEl.innerHTML = "";

  if (!cart.length) {
    cartEmptyEl.classList.remove("d-none");
    cartSummaryEl.classList.add("d-none");
    quoteSectionEl.classList.add("d-none");
    return;
  }

  cartEmptyEl.classList.add("d-none");
  cartSummaryEl.classList.remove("d-none");
  quoteSectionEl.classList.remove("d-none");
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

function validateQuoteForm(data) {
  if (!data.fullName.trim()) {
    return "צריך למלא שם מלא.";
  }

  if (!data.phone.trim()) {
    return "צריך למלא מספר טלפון.";
  }

  return "";
}

async function submitQuoteRequest(customer, cart) {
  const message = buildTelegramQuoteMessage(customer, cart);

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      company: customer.company,
      message
    })
  });

  if (!response.ok) {
    throw new Error("שליחת הבקשה נכשלה");
  }

  return response.json().catch(() => ({}));
}

document.addEventListener("DOMContentLoaded", () => {
  const clearCartBtn = document.getElementById("clearCartBtn");
  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
  const quoteForm = document.getElementById("quoteForm");
  const clearFormBtn = document.getElementById("clearFormBtn");
  const quoteFeedback = document.getElementById("quoteFeedback");
  const submitQuoteBtn = document.getElementById("submitQuoteBtn");

  renderCart();

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      localStorage.removeItem(CART_PAGE_STORAGE_KEY);
      window.dispatchEvent(new Event("tsc-cart-updated"));
      renderCart();

      if (quoteFeedback) {
        quoteFeedback.textContent = "";
        quoteFeedback.className = "quote-feedback";
      }
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

  if (clearFormBtn && quoteForm) {
    clearFormBtn.addEventListener("click", () => {
      quoteForm.reset();
      if (quoteFeedback) {
        quoteFeedback.textContent = "";
        quoteFeedback.className = "quote-feedback";
      }
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const cart = readCart();
      if (!cart.length) {
        if (quoteFeedback) {
          quoteFeedback.textContent = "העגלה ריקה. יש להוסיף מוצרים לפני שליחת בקשה.";
          quoteFeedback.className = "quote-feedback quote-feedback--error";
        }
        return;
      }

      const formData = new FormData(quoteForm);
      const customer = {
        fullName: String(formData.get("fullName") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        notes: String(formData.get("notes") || "").trim()
      };

      const validationError = validateQuoteForm(customer);
      if (validationError) {
        if (quoteFeedback) {
          quoteFeedback.textContent = validationError;
          quoteFeedback.className = "quote-feedback quote-feedback--error";
        }
        return;
      }

      try {
        if (submitQuoteBtn) {
          submitQuoteBtn.disabled = true;
          submitQuoteBtn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> שולח...`;
        }

        if (quoteFeedback) {
          quoteFeedback.textContent = "שולח את הבקשה...";
          quoteFeedback.className = "quote-feedback";
        }

        await submitQuoteRequest(customer, cart);

        if (quoteFeedback) {
          quoteFeedback.textContent = "הבקשה נשלחה בהצלחה. נחזור אליך בהקדם.";
          quoteFeedback.className = "quote-feedback quote-feedback--success";
        }

        quoteForm.reset();
        localStorage.removeItem(CART_PAGE_STORAGE_KEY);
        window.dispatchEvent(new Event("tsc-cart-updated"));
        renderCart();
      } catch (error) {
        if (quoteFeedback) {
          quoteFeedback.textContent = "משהו השתבש בשליחה. נסה שוב או צור קשר בטלפון/וואטסאפ.";
          quoteFeedback.className = "quote-feedback quote-feedback--error";
        }
      } finally {
        if (submitQuoteBtn) {
          submitQuoteBtn.disabled = false;
          submitQuoteBtn.innerHTML = `<i class="bi bi-send"></i> שליחת בקשת הצעת מחיר`;
        }
      }
    });
  }
});