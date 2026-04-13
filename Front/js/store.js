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

  function buildImageVariants(src) {
    if (!src || typeof src !== "string") {
      return {
        thumb: "/assets/Icons/TSCLogoSquared.png",
        full: "/assets/Icons/TSCLogoSquared.png",
        fallback: "/assets/Icons/TSCLogoSquared.png"
      };
    }

    const qIdx = src.indexOf("?");
    const cleanSrc = qIdx >= 0 ? src.slice(0, qIdx) : src;
    const dotIdx = cleanSrc.lastIndexOf(".");
    if (dotIdx <= cleanSrc.lastIndexOf("/")) {
      return { thumb: cleanSrc, full: cleanSrc, fallback: cleanSrc };
    }

    // Convention: "<name>-thumb.webp" for cards, "<name>.webp" for product details.
    const stem = cleanSrc.slice(0, dotIdx);
    const normalizedStem = stem.endsWith("-thumb") ? stem.slice(0, -6) : stem;
    return {
      thumb: `${normalizedStem}-thumb.webp`,
      full: `${normalizedStem}.webp`,
      fallback: cleanSrc
    };
  }

  function resolveTrafficSignImages(productId) {
    if (!productId || !productId.startsWith("sign-")) return null;

    const code = productId.slice(5);
    if (!/^\d+$/.test(code)) return null;

    const specialImagesByCode = {
      "439": [
        "/assets/TrafficSigns/400/439-1.png",
        "/assets/TrafficSigns/400/439-2.png",
        "/assets/TrafficSigns/400/439-3.png"
      ],
      "632": [
        "/assets/TrafficSigns/600/632-1.png",
        "/assets/TrafficSigns/600/632-2.png"
      ],
      "914": [
        "/assets/TrafficSigns/900/914-1.png",
        "/assets/TrafficSigns/900/914-2.png"
      ]
    };

    if (specialImagesByCode[code]) return specialImagesByCode[code];

    const numericCode = Number(code);
    const series = Math.floor(numericCode / 100) * 100;
    return [`/assets/TrafficSigns/${series}/${numericCode}.png`];
  }

  function resolveSafetyProductImage(productId) {
    const safetyImageByProductId = {
      "safety-cones": "/assets/SafetyEquipment/cone1.png",
      "panoramic-mirror": "/assets/SafetyEquipment/panoramicmirror1.png",
      "lane-dividers": "/assets/SafetyEquipment/laneseparators1.png",
      "parking-stop": "/assets/SafetyEquipment/parkingstopper1.png",
      "parking-guard": "/assets/SafetyEquipment/parkingkeeper1.png",
      "bumper": "/assets/SafetyEquipment/laneseparators2.png",
      "flexible-post-45-75-100": "/assets/SafetyEquipment/flexiblepost1.png",
      "barrier-post": "/assets/SafetyEquipment/flexiblepost2.png",
      "sign-post": "/assets/SafetyEquipment/flexiblepost3.png",
      "connector-units-3-6-inch": "/assets/SafetyEquipment/parkingstopper2.png",
      "flag-connector-unit": "/assets/SafetyEquipment/parkingstopper3.png",
      "solar-lamp": "/assets/SafetyEquipment/panoramicmirror2.png"
    };

    return safetyImageByProductId[productId] || null;
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
    const isSignProduct = Boolean(productId && productId.startsWith("sign-"));
    const detailsLink = item.querySelector(".product-card__btn");
    const title = item.querySelector(".product-card__title")?.textContent?.trim() || "\u05de\u05d5\u05e6\u05e8";
    const category = item.querySelector(".product-card__tag")?.textContent?.trim() || "";
    const imageWrap = item.querySelector(".product-card__image-wrap");
    let cardImage = item.querySelector(".product-card__image");

    if (!cardImage && imageWrap) {
      const signImageSources = resolveTrafficSignImages(productId);
      const signImageSrc = Array.isArray(signImageSources) ? signImageSources[0] : null;
      const safetyImageSrc = resolveSafetyProductImage(productId);
      const mappedImageSrc = signImageSrc || safetyImageSrc;

      if (mappedImageSrc) {
        cardImage = document.createElement("img");
        cardImage.className = "product-card__image";
        cardImage.src = mappedImageSrc;
        cardImage.alt = title;
        imageWrap.prepend(cardImage);
      } else {
        if (isSignProduct) {
          item.remove();
          return;
        }

        cardImage = document.createElement("img");
        cardImage.className = "product-card__image";
        cardImage.src = "/assets/Icons/TSCLogoSquared.png";
        cardImage.alt = title;
        imageWrap.prepend(cardImage);
      }
    }

    const sourceImage = cardImage?.getAttribute("src") || "/assets/Icons/TSCLogoSquared.png";
    const imageVariants = buildImageVariants(sourceImage);
    const image = imageVariants.fallback;
    const footer = item.querySelector(".product-card__footer");

    if (cardImage) {
      cardImage.setAttribute("loading", "lazy");
      cardImage.setAttribute("decoding", "async");
      cardImage.setAttribute("fetchpriority", "low");
      if (!cardImage.hasAttribute("width")) cardImage.setAttribute("width", "500");
      if (!cardImage.hasAttribute("height")) cardImage.setAttribute("height", "500");

      cardImage.src = imageVariants.thumb;
      cardImage.addEventListener("error", () => {
        const currentSrc = cardImage.getAttribute("src") || "";
        if (currentSrc !== imageVariants.fallback) {
          cardImage.src = imageVariants.fallback;
          return;
        }

        if (isSignProduct) {
          item.remove();
          return;
        }

        cardImage.src = "/assets/Icons/TSCLogoSquared.png";
      });
    }

    if (productId && detailsLink) {
      const signImageSources = resolveTrafficSignImages(productId);
      const imageListFromSign = Array.isArray(signImageSources) ? signImageSources : [];
      const imageList = imageListFromSign.length ? imageListFromSign : [imageVariants.full];
      const imagesPayload = encodeURIComponent(JSON.stringify(imageList));
      const productHref = `/pages/product.html?id=${encodeURIComponent(productId)}&name=${encodeURIComponent(title)}&category=${encodeURIComponent(category || "")}&image=${encodeURIComponent(imageVariants.full)}&image_fallback=${encodeURIComponent(imageVariants.fallback)}&thumb=${encodeURIComponent(imageVariants.thumb)}&images=${imagesPayload}`;
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

