document.addEventListener("DOMContentLoaded", () => {
  const CART_STORAGE_KEY = "tsc_cart";
  const LAST_PRODUCT_KEY = "tsc_last_product_id";
  const filterButtons = document.querySelectorAll(".store-filters .store-filter-btn");
  const signSubFilterButtons = document.querySelectorAll(".store-sign-subfilter-btn");
  const signsSubFilters = document.getElementById("signsSubFilters");
  const productItems = document.querySelectorAll(".product-item");
  const emptyState = document.getElementById("emptyState");
  const heroCartLink = document.getElementById("heroCartLink");

  if (!filterButtons.length || !productItems.length || !emptyState) return;

  function readCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
  }

  function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("tsc-cart-updated"));
  }

  function sameOptions(a = [], b = []) {
    if (a.length !== b.length) return false;
    return a.every((opt, idx) => opt.name === b[idx]?.name && opt.value === b[idx]?.value);
  }

  function addToCart(item) {
    const cart = readCart();
    const existing = cart.find(
      (entry) =>
        entry.productId === item.productId &&
        sameOptions(entry.options || [], item.options || [])
    );

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + (Number(item.quantity) || 1);
    } else {
      cart.push(item);
    }

    saveCart(cart);
  }

  productItems.forEach((item) => {
    const productId = item.dataset.productId;
    const detailsLink = item.querySelector(".product-card__btn");
    const title = item.querySelector(".product-card__title")?.textContent?.trim() || "\u05de\u05d5\u05e6\u05e8";
    const category = item.querySelector(".product-card__tag")?.textContent?.trim() || "";
    const image = item.querySelector(".product-card__image")?.getAttribute("src") || "/assets/Icons/TSCLogoSquared.png";
    const footer = item.querySelector(".product-card__footer");

    if (productId && detailsLink) {
      const productHref = `/pages/product.html?id=${encodeURIComponent(productId)}&name=${encodeURIComponent(title)}&category=${encodeURIComponent(category || "")}`;
      detailsLink.setAttribute("href", productHref);
      detailsLink.addEventListener("click", () => {
        sessionStorage.setItem(LAST_PRODUCT_KEY, productId);
      });
    }

    if (footer && productId) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "product-card__add-btn";
      addButton.textContent = "\u05d4\u05d5\u05e1\u05e3 \u05dc\u05e2\u05d2\u05dc\u05d4";
      addButton.addEventListener("click", () => {
        addToCart({
          productId,
          title,
          category,
          image,
          quantity: 1,
          options: [],
          addedAt: new Date().toISOString()
        });

        addButton.classList.add("is-added");
        addButton.textContent = "\u05e0\u05d5\u05e1\u05e3";
        setTimeout(() => {
          addButton.classList.remove("is-added");
          addButton.textContent = "\u05d4\u05d5\u05e1\u05e3 \u05dc\u05e2\u05d2\u05dc\u05d4";
        }, 1200);
      });
      footer.appendChild(addButton);
    }
  });

  function updateHeroCartText() {
    if (!heroCartLink) return;
    const count = readCart().reduce((sum, row) => sum + (Number(row.quantity) || 1), 0);
    heroCartLink.textContent =
      count > 0
        ? `\u05dc\u05e6\u05e4\u05d9\u05d9\u05d4 \u05d1\u05e2\u05d2\u05dc\u05d4 (${count})`
        : "\u05dc\u05e6\u05e4\u05d9\u05d9\u05d4 \u05d1\u05e2\u05d2\u05dc\u05d4";
  }

  updateHeroCartText();
  window.addEventListener("storage", (event) => {
    if (event.key === CART_STORAGE_KEY) updateHeroCartText();
  });
  window.addEventListener("tsc-cart-updated", updateHeroCartText);

  function getSelectedSignSubFilter() {
    const activeBtn = document.querySelector(".store-sign-subfilter-btn.active");
    return activeBtn?.dataset.signFilter || "all";
  }

  function filterProducts(selectedFilter) {
    let visibleCount = 0;
    const selectedSignFilter = getSelectedSignSubFilter();

    productItems.forEach((item) => {
      const itemCategory = item.dataset.category;
      const signSubCategory = item.dataset.signSubcategory || "all";
      const categoryMatch = selectedFilter === "all" || itemCategory === selectedFilter;
      let subCategoryMatch = true;

      if (selectedFilter === "signs") {
        subCategoryMatch = selectedSignFilter === "all" || signSubCategory === selectedSignFilter;
      }

      if (categoryMatch && subCategoryMatch) {
        item.classList.remove("d-none");
        visibleCount++;
      } else {
        item.classList.add("d-none");
      }
    });

    if (visibleCount === 0) {
      emptyState.classList.remove("d-none");
    } else {
      emptyState.classList.add("d-none");
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter;

      filterButtons.forEach((btn) => {
        if (!btn.classList.contains("store-sign-subfilter-btn")) {
          btn.classList.remove("active");
        }
      });
      button.classList.add("active");

      if (selectedFilter === "signs") {
        signsSubFilters?.classList.remove("d-none");
      } else {
        signsSubFilters?.classList.add("d-none");
      }

      filterProducts(selectedFilter);
    });
  });

  signSubFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      signSubFilterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const activeMainFilter = document.querySelector(".store-filter-btn.active:not(.store-sign-subfilter-btn)");
      const selectedMainFilter = activeMainFilter?.dataset.filter || "all";
      filterProducts(selectedMainFilter);
    });
  });
});

