document.addEventListener("DOMContentLoaded", async () => {
  const CART_STORAGE_KEY = "tsc_cart";
  const LAST_PRODUCT_KEY = "tsc_last_product_id";
  const STORE_VIEW_STATE_KEY = "tsc_store_view_state";
  const filterButtons = document.querySelectorAll(".store-filters .store-filter-btn");
  const signSubFilterButtons = document.querySelectorAll(".store-sign-subfilter-btn");
  const signsSubFilters = document.getElementById("signsSubFilters");
  const productsGrid = document.getElementById("productsGrid");
  let productItems = Array.from(document.querySelectorAll(".product-item"));
  const emptyState = document.getElementById("emptyState");
  const heroCartLink = document.getElementById("heroCartLink");
  const storeSearchInput = document.getElementById("storeSearchInput");

  if (!filterButtons.length || !productsGrid || !emptyState) return;

  function extractCatalogFromExistingCards() {
    const existingItems = Array.from(productsGrid.querySelectorAll(".product-item"));
    return existingItems.map((item) => {
      const productId = item.dataset.productId || "";
      const category = item.dataset.category || "all";
      const signSubcategory = item.dataset.signSubcategory || "";
      const title = item.querySelector(".product-card__title")?.textContent?.trim() || "מוצר";
      const text = item.querySelector(".product-card__text")?.textContent?.trim() || title;
      const tag = item.querySelector(".product-card__tag")?.textContent?.trim() || "";
      const price = item.querySelector(".product-card__price")?.textContent?.trim() || "לפי מפרט";
      const detailsHref = item.querySelector(".product-card__btn")?.getAttribute("href") || "";
      const existingImage = item.querySelector(".product-card__image")?.getAttribute("src") || "";

      return {
        productId,
        category,
        signSubcategory,
        title,
        text,
        tag,
        price,
        detailsHref,
        existingImage
      };
    });
  }

  function renderCatalogCards(catalog) {
    const fragment = document.createDocumentFragment();

    catalog.forEach((product) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 col-xl-3 product-item";
      col.dataset.category = product.category;
      col.dataset.productId = product.productId;
      if (product.signSubcategory) {
        col.dataset.signSubcategory = product.signSubcategory;
      }

      col.innerHTML = `
        <article class="product-card h-100">
          <div class="product-card__image-wrap">
            <span class="product-card__tag">${product.tag}</span>
          </div>
          <div class="product-card__body">
            <h3 class="product-card__title">${product.title}</h3>
            <p class="product-card__text">${product.text}</p>
            <div class="product-card__footer">
              <span class="product-card__price">${product.price}</span>
              <a href="${product.detailsHref || `/product?id=${encodeURIComponent(product.productId)}`}" class="product-card__btn">לפרטים</a>
            </div>
          </div>
        </article>
      `;

      if (product.existingImage) {
        const imageWrap = col.querySelector(".product-card__image-wrap");
        if (imageWrap) {
          const img = document.createElement("img");
          img.className = "product-card__image";
          img.src = product.existingImage;
          img.alt = product.title;
          imageWrap.prepend(img);
        }
      }

      fragment.appendChild(col);
    });

    productsGrid.innerHTML = "";
    productsGrid.appendChild(fragment);
  }

  let productsData = null;
  try {
    productsData = await window.loadProductsData?.();
  } catch (error) {
    console.warn("Failed to load /data/products.json, falling back to existing cards.", error);
  }

  const productsCatalog = (Array.isArray(productsData?.storeCatalog) && productsData.storeCatalog.length
    ? productsData.storeCatalog
    : extractCatalogFromExistingCards());
  if (productsCatalog.length) {
    renderCatalogCards(productsCatalog);
    productItems = Array.from(productsGrid.querySelectorAll(".product-item"));
  }

  if (!productItems.length) return;

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
        thumb: "/assets/Icons/TSCLogoSquared.webp",
        full: "/assets/Icons/TSCLogoSquared.webp",
        fallback: "/assets/Icons/TSCLogoSquared.webp"
      };
    }

    const qIdx = src.indexOf("?");
    const cleanSrc = qIdx >= 0 ? src.slice(0, qIdx) : src;
    const dotIdx = cleanSrc.lastIndexOf(".");
    if (dotIdx <= cleanSrc.lastIndexOf("/")) {
      return { thumb: cleanSrc, full: cleanSrc, fallback: cleanSrc };
    }

    const stem = cleanSrc.slice(0, dotIdx);
    const extension = cleanSrc.slice(dotIdx).toLowerCase();
    const isThumbVariant = stem.endsWith("-thumb");
    const normalizedStem = isThumbVariant ? stem.slice(0, -6) : stem;

    // Prefer explicit source paths to avoid broken images when PNG/WebP naming is mixed.
    if (extension !== ".webp") {
      return { thumb: cleanSrc, full: cleanSrc, fallback: cleanSrc };
    }

    if (isThumbVariant) {
      return {
        thumb: cleanSrc,
        full: `${normalizedStem}.webp`,
        fallback: cleanSrc
      };
    }

    return {
      thumb: cleanSrc,
      full: cleanSrc,
      fallback: cleanSrc
    };
  }

  function resolveTrafficSignImages(productId) {
    if (!productId || !productId.startsWith("sign-")) return null;

    const code = productId.slice(5);
    if (!/^\d+$/.test(code)) return null;

    const specialImagesByCode = {
      "107": [
        "/assets/TrafficSigns/100/107-1.webp",
        "/assets/TrafficSigns/100/107-2.webp",
        "/assets/TrafficSigns/100/107-3.webp"
      ],
      "108": [
        "/assets/TrafficSigns/100/108-1.webp",
        "/assets/TrafficSigns/100/108-2.webp",
        "/assets/TrafficSigns/100/108-3.webp"
      ],
      "112": [
        "/assets/TrafficSigns/100/112-1.webp",
        "/assets/TrafficSigns/100/112-2.webp",
        "/assets/TrafficSigns/100/112-3.webp",
        "/assets/TrafficSigns/100/112-4.webp"
      ],
      "439": [
        "/assets/TrafficSigns/400/439-1.webp",
        "/assets/TrafficSigns/400/439-2.webp",
        "/assets/TrafficSigns/400/439-3.webp"
      ],
      "632": [
        "/assets/TrafficSigns/600/632-1.webp",
        "/assets/TrafficSigns/600/632-2.webp",
        "/assets/TrafficSigns/900/932-1.webp",
        "/assets/TrafficSigns/900/932-2.webp"
      ],
      "914": [
        "/assets/TrafficSigns/900/914-1.webp",
        "/assets/TrafficSigns/900/914-2.webp"
      ],
      "903": [
        "/assets/TrafficSigns/900/903-1.webp",
        "/assets/TrafficSigns/900/903-2.webp",
        "/assets/TrafficSigns/900/903-3.webp"
      ],
      "908": [
        "/assets/TrafficSigns/900/908-1.webp",
        "/assets/TrafficSigns/900/908-2.webp",
        "/assets/TrafficSigns/900/908-3.webp"
      ],
        "930": [
          "/assets/TrafficSigns/900/930-1.webp",
          "/assets/TrafficSigns/900/930-2.webp",
          "/assets/TrafficSigns/900/930-3.webp"
        ],
        "230": ["/assets/Icons/TSCLogoSquared.webp"],
        "231": ["/assets/Icons/TSCLogoSquared.webp"],
        "501": ["/assets/Icons/TSCLogoSquared.webp"],
        "502": ["/assets/Icons/TSCLogoSquared.webp"],
        "506": ["/assets/Icons/TSCLogoSquared.webp"]
      };

    if (specialImagesByCode[code]) return specialImagesByCode[code];

    const numericCode = Number(code);
    const series = Math.floor(numericCode / 100) * 100;
    return [`/assets/TrafficSigns/${series}/${numericCode}.webp`];
  }

  function resolveSafetyProductImage(productId) {
    const safetyImageByProductId = {
      "safety-cones": "/assets/SafetyEquipment/blackcone.webp",
      "panoramic-mirror": "/assets/SafetyEquipment/panoramicmirror1.webp",
      "lane-dividers": "/assets/SafetyEquipment/laneseparators1.webp",
      "parking-stop": "/assets/SafetyEquipment/parkingstopper1.webp",
      "parking-guard": "/assets/SafetyEquipment/parkingkeeper1.webp",
      "bumper": "/assets/SafetyEquipment/laneseparators2.webp",
      "flexible-post-45-75-100": "/assets/SafetyEquipment/flexiblepost1.webp",
      "barrier-post": "/assets/SafetyEquipment/flexiblepost2.webp",
      "sign-post": "/assets/SafetyEquipment/flexiblepost3.webp",
      "connector-units-3-6-inch": "/assets/SafetyEquipment/signConnector.webp",
      "flag-connector-unit": "/assets/SafetyEquipment/parkingstopper3.webp",
      "solar-lamp": "/assets/SafetyEquipment/solarLight.webp"
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
    const text = item.querySelector(".product-card__text")?.textContent?.trim() || title;
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
        cardImage.alt = text;
        imageWrap.prepend(cardImage);
      } else {
        if (isSignProduct) {
          item.remove();
          return;
        }

        cardImage = document.createElement("img");
        cardImage.className = "product-card__image";
        cardImage.src = "/assets/Icons/TSCLogoSquared.webp";
        cardImage.alt = text;
        imageWrap.prepend(cardImage);
      }
    }

    const sourceImage = cardImage?.getAttribute("src") || "/assets/Icons/TSCLogoSquared.webp";
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

        cardImage.src = "/assets/Icons/TSCLogoSquared.webp";
      });
    }

    if (productId && detailsLink) {
      const signImageSources = resolveTrafficSignImages(productId);
      const imageListFromSign = Array.isArray(signImageSources) ? signImageSources : [];
      const imageList = imageListFromSign.length ? imageListFromSign : [imageVariants.fallback];
      const imagesPayload = encodeURIComponent(JSON.stringify(imageList));
      const productHref = `/product?id=${encodeURIComponent(productId)}&name=${encodeURIComponent(title)}&category=${encodeURIComponent(category || "")}&image=${encodeURIComponent(imageVariants.fallback)}&image_fallback=${encodeURIComponent(imageVariants.fallback)}&thumb=${encodeURIComponent(imageVariants.thumb)}&images=${imagesPayload}`;
      detailsLink.setAttribute("href", productHref);
      const navigateToProduct = () => {
        sessionStorage.setItem(LAST_PRODUCT_KEY, productId);
        window.location.href = productHref;
      };

      detailsLink.addEventListener("click", (event) => {
        event.preventDefault();
        navigateToProduct();
      });

      if (imageWrap) {
        imageWrap.style.cursor = "pointer";
        imageWrap.addEventListener("click", navigateToProduct);
      }

      if (cardImage) {
        cardImage.style.cursor = "pointer";
        cardImage.addEventListener("click", (event) => {
          event.stopPropagation();
          navigateToProduct();
        });
      }
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
        ? `מעבר לעגלה (${count})`
        : "מעבר לעגלה";
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

  function getSelectedMainFilter() {
    const activeBtn = document.querySelector(".store-filter-btn.active:not(.store-sign-subfilter-btn)");
    return activeBtn?.dataset.filter || "all";
  }

  function saveStoreViewState() {
    const payload = {
      mainFilter: getSelectedMainFilter(),
      signFilter: getSelectedSignSubFilter(),
      searchTerm: (storeSearchInput?.value || "").trim()
    };
    localStorage.setItem(STORE_VIEW_STATE_KEY, JSON.stringify(payload));
  }

  function readStoreViewState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_VIEW_STATE_KEY) || "{}");
      return {
        mainFilter: typeof parsed.mainFilter === "string" ? parsed.mainFilter : "all",
        signFilter: typeof parsed.signFilter === "string" ? parsed.signFilter : "all",
        searchTerm: typeof parsed.searchTerm === "string" ? parsed.searchTerm : ""
      };
    } catch {
      return { mainFilter: "all", signFilter: "all", searchTerm: "" };
    }
  }

  function applyStoreViewState() {
    const state = readStoreViewState();
    const mainBtn = document.querySelector(`.store-filters .store-filter-btn[data-filter="${state.mainFilter}"]`)
      || document.querySelector('.store-filters .store-filter-btn[data-filter="all"]');

    filterButtons.forEach((btn) => {
      if (!btn.classList.contains("store-sign-subfilter-btn")) {
        btn.classList.remove("active");
      }
    });
    mainBtn?.classList.add("active");

    const selectedMainFilter = mainBtn?.dataset.filter || "all";
    if (selectedMainFilter === "signs") {
      signsSubFilters?.classList.remove("d-none");
    } else {
      signsSubFilters?.classList.add("d-none");
    }

    signSubFilterButtons.forEach((btn) => btn.classList.remove("active"));
    const signBtn = document.querySelector(`.store-sign-subfilter-btn[data-sign-filter="${state.signFilter}"]`)
      || document.querySelector('.store-sign-subfilter-btn[data-sign-filter="all"]');
    signBtn?.classList.add("active");

    if (storeSearchInput) {
      storeSearchInput.value = state.searchTerm;
    }

    filterProducts(selectedMainFilter);
  }

  function matchesSearchTerm(item, searchTerm) {
    if (!searchTerm) return true;
    const inferShapeByProduct = (productId = "", title = "", category = "") => {
      const normalizedTitle = String(title || "");
      const normalizedCategory = String(category || "");
      const signMatch = String(productId || "").match(/^sign-(\d+)$/);
      if (signMatch) {
        const code = Number(signMatch[1]);
        const inRange = (from, to) => code >= from && code <= to;
        if (
          inRange(101, 106) ||
          inRange(109, 111) ||
          inRange(114, 117) ||
          inRange(119, 150) ||
          code === 301 ||
          code === 901
        ) return "משולש";
        if (
          inRange(220, 225) ||
          code === 306 ||
          code === 308 ||
          inRange(504, 505) ||
          inRange(618, 626) ||
          code === 628 ||
          inRange(633, 638) ||
          code === 902 ||
          inRange(905, 907) ||
          inRange(910, 914) ||
          code === 935
        ) return "ריבוע";
        if (
          inRange(201, 215) ||
          inRange(218, 219) ||
          inRange(226, 229) ||
          inRange(303, 304) ||
          code === 307 ||
          inRange(401, 438) ||
          inRange(440, 441)
        ) return "עיגול";
        if (code === 302) return "מתומן";
        return "מרובע";
      }
      if (normalizedTitle.includes("מתומן")) return "מתומן";
      if (normalizedTitle.includes("משולש")) return "משולש";
      if (normalizedTitle.includes("עיגול") || normalizedTitle.includes("קוטר")) return "עיגול";
      if (normalizedTitle.includes("ריבוע")) return "ריבוע";
      if (normalizedCategory.includes("שלט")) return "מרובע";
      if (normalizedCategory.includes("תמרור")) return "מרובע";
      return "";
    };

    const title = item.querySelector(".product-card__title")?.textContent || "";
    const text = item.querySelector(".product-card__text")?.textContent || "";
    const shape = inferShapeByProduct(item.dataset.productId || "", title, item.dataset.category || "");
    const haystack = [
      item.dataset.productId || "",
      title,
      text,
      shape
    ].join(" ").toLowerCase();
    return haystack.includes(searchTerm);
  }

  function filterProducts(selectedFilter) {
    let visibleCount = 0;
    const selectedSignFilter = getSelectedSignSubFilter();
    const searchTerm = (storeSearchInput?.value || "").trim().toLowerCase();
    const shapeKeywords = ["משולש", "ריבוע", "מרובע", "עיגול", "מתומן"];
    const isShapeSearch = searchTerm.length >= 2 && shapeKeywords.some((keyword) =>
      keyword.includes(searchTerm) || searchTerm.includes(keyword)
    );

    // Keep default catalog order unless we explicitly promote an item.
    productItems.forEach((item) => productsGrid.appendChild(item));

    productItems.forEach((item) => {
      const isCustomDesignBoard = item.dataset.productId === "custom-design-board";
      const itemCategory = item.dataset.category;
      const signSubCategory = item.dataset.signSubcategory || "all";
      const customBoardByShapeSearch = isCustomDesignBoard && isShapeSearch;
      const categoryMatch = customBoardByShapeSearch || selectedFilter === "all" || itemCategory === selectedFilter;
      let subCategoryMatch = true;
      const searchMatch = customBoardByShapeSearch || matchesSearchTerm(item, searchTerm);

      if (selectedFilter === "signs") {
        subCategoryMatch = customBoardByShapeSearch || selectedSignFilter === "all" || signSubCategory === selectedSignFilter;
      }

      if (categoryMatch && subCategoryMatch && searchMatch) {
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

    // Only in shape-search mode: show custom design board first.
    if (isShapeSearch) {
      const customDesignItem = productItems.find((item) => item.dataset.productId === "custom-design-board");
      if (customDesignItem && !customDesignItem.classList.contains("d-none")) {
        productsGrid.prepend(customDesignItem);
      }
    }
  }

  if (storeSearchInput) {
    storeSearchInput.addEventListener("input", () => {
      const activeMainFilter = document.querySelector(".store-filter-btn.active:not(.store-sign-subfilter-btn)");
      filterProducts(activeMainFilter?.dataset.filter || "all");
      saveStoreViewState();
    });
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
      saveStoreViewState();
    });
  });

  signSubFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      signSubFilterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const activeMainFilter = document.querySelector(".store-filter-btn.active:not(.store-sign-subfilter-btn)");
      const selectedMainFilter = activeMainFilter?.dataset.filter || "all";
      filterProducts(selectedMainFilter);
      saveStoreViewState();
    });
  });

  applyStoreViewState();
});




