const PRODUCT_CART_STORAGE_KEY = "tsc_cart";
const LAST_PRODUCT_KEY = "tsc_last_product_id";
const CUSTOM_DESIGN_RESTORE_KEY = "tsc_custom_design_restore";
const CUSTOM_DESIGN_TEXT_FONT_FAMILY = "Arial, sans-serif";
const CUSTOM_DESIGN_TEXT_FONT_WEIGHT = "700";

let PRODUCT_CATALOG = {};

function ensureProductShape(product = {}) {
  const normalized = { ...product };
  if (!normalized.description) {
    normalized.description = normalized.shortDescription || normalized.longDescription || "";
  }

  if (Array.isArray(normalized.options)) {
    normalized.options = normalized.options.map((option) => ({
      name: option?.name || "אפשרות",
      values: Array.isArray(option?.values) ? option.values : []
    }));
  } else {
    normalized.options = [];
  }

  normalized.images = normalizeProductImages(normalized.images);
  return normalized;
}

async function loadProductCatalog() {
  try {
    const productsData = await window.loadProductsData?.();
    const rawCatalog = productsData?.productCatalog;
    if (rawCatalog && typeof rawCatalog === "object") {
      PRODUCT_CATALOG = Object.fromEntries(
        Object.entries(rawCatalog).map(([productId, product]) => [productId, ensureProductShape(product)])
      );
      return;
    }
  } catch (error) {
    console.warn("Failed to load /data/products.json", error);
  }

  PRODUCT_CATALOG = {};
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const idFromQuery = params.get("id");
  if (idFromQuery) return idFromQuery;

  const idFromHash = new URLSearchParams((window.location.hash || "").replace(/^#/, "")).get("id");
  if (idFromHash) return idFromHash;

  return sessionStorage.getItem(LAST_PRODUCT_KEY);
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function buildImageVariants(src) {
  const safeSrc = typeof src === "string" && src.trim()
    ? src.trim()
    : "/assets/Icons/TSCLogoSquared.webp";
  const qIdx = safeSrc.indexOf("?");
  const cleanSrc = qIdx >= 0 ? safeSrc.slice(0, qIdx) : safeSrc;
  const dotIdx = cleanSrc.lastIndexOf(".");
  if (dotIdx <= cleanSrc.lastIndexOf("/")) {
    return { full: cleanSrc, thumb: cleanSrc, fallback: cleanSrc };
  }

  const stem = cleanSrc.slice(0, dotIdx);
  const extension = cleanSrc.slice(dotIdx).toLowerCase();
  const isThumbVariant = stem.endsWith("-thumb");
  const normalizedStem = isThumbVariant ? stem.slice(0, -6) : stem;

  if (extension !== ".webp") {
    return { full: cleanSrc, thumb: cleanSrc, fallback: cleanSrc };
  }

  if (isThumbVariant) {
    return {
      full: `${normalizedStem}.webp`,
      thumb: cleanSrc,
      fallback: cleanSrc
    };
  }

  return {
    full: cleanSrc,
    thumb: cleanSrc,
    fallback: cleanSrc
  };
}

function normalizeProductImages(images = []) {
  if (!Array.isArray(images) || !images.length) {
    const fallback = "/assets/Icons/TSCLogoSquared.webp";
    return [{ full: fallback, thumb: fallback, fallback }];
  }

  return images.map((entry) => {
    if (typeof entry === "string") {
      return buildImageVariants(entry);
    }

    if (entry && typeof entry === "object") {
      const full = entry.full || entry.src || entry.image || entry.thumb || entry.fallback || "/assets/Icons/TSCLogoSquared.webp";
      const variants = buildImageVariants(full);
      return {
        full: entry.full || variants.full,
        thumb: entry.thumb || variants.thumb,
        fallback: entry.fallback || variants.fallback
      };
    }

    const fallback = "/assets/Icons/TSCLogoSquared.webp";
    return { full: fallback, thumb: fallback, fallback };
  });
}

function buildDynamicProduct(productId) {
  if (!productId) return null;
  const signName = getQueryParam("name");
  const categoryFromQuery = getQueryParam("category");
  const imageFromQuery = getQueryParam("image");
  const imageFallbackFromQuery = getQueryParam("image_fallback");
  const thumbFromQuery = getQueryParam("thumb");
  const imagesFromQuery = getQueryParam("images");
  const isSign = /^sign-\d+$/.test(productId || "");
  const code = isSign ? String(productId).replace("sign-", "") : "";
  const title = signName && signName.trim()
    ? signName.trim()
    : isSign
      ? `${code} - תמרור`
      : "מוצר";
  const category = categoryFromQuery || (isSign ? "תמרורים" : "");

  let galleryImages = [];
  if (imagesFromQuery) {
    try {
      const parsed = JSON.parse(imagesFromQuery);
      if (Array.isArray(parsed)) {
        galleryImages = parsed.filter((entry) => typeof entry === "string" && entry.trim());
      }
    } catch {
      galleryImages = [];
    }
  }

  const normalizedGallery = galleryImages.length
    ? galleryImages.map((src) => {
        const variants = buildImageVariants(src);
        return {
          full: variants.full,
          thumb: variants.thumb,
          fallback: variants.fallback
        };
      })
    : [{
        full: imageFromQuery || "/assets/Icons/TSCLogoSquared.webp",
        thumb: thumbFromQuery || imageFromQuery || "/assets/Icons/TSCLogoSquared.webp",
        fallback: imageFallbackFromQuery || "/assets/Icons/TSCLogoSquared.webp"
      }];

  return {
    title,
    category,
    description: isSign ? `תמרור ${title}` : title,
    images: normalizedGallery,
    options: [
      { name: "חומר", values: ["פח מגולוון", "PVC קשיח"] },
      { name: "גודל", values: ["50X50", "60X60", "100X100"] }
    ]
  };
}

function getSizeOptionsByShape(shape) {
  const sizeMap = {
    "ריבוע": ["50X50 ס\"מ", "60X60 ס\"מ", "100X100 ס\"מ"],
    "עיגול": ["קוטר 50 ס\"מ", "קוטר 60 ס\"מ", "קוטר 80 ס\"מ", "קוטר 100 ס\"מ", "קוטר 120 ס\"מ"],
    "משולש": ["60 ס\"מ", "80 ס\"מ", "100 ס\"מ", "120 ס\"מ"],
    "משולש הפוך": ["60 ס\"מ", "80 ס\"מ", "100 ס\"מ", "120 ס\"מ"],
    "מתומן": ["קוטר 50 ס\"מ", "קוטר 60 ס\"מ", "קוטר 80 ס\"מ", "קוטר 100 ס\"מ", "קוטר 120 ס\"מ"],
    "מרובע": ["20X50 ס\"מ", "20X60 ס\"מ", "20X100 ס\"מ", "50X50 ס\"מ", "50X60 ס\"מ", "50X100 ס\"מ", "60X60 ס\"מ", "60X100 ס\"מ", "100X100 ס\"מ"]
  };

  return sizeMap[shape] || ["לבחירה לפי צורה"];
}

function inferShapeByProduct(productId = "", productTitle = "", productCategory = "") {
  const title = String(productTitle || "");
  const category = String(productCategory || "");

  const signMatch = String(productId || "").match(/^sign-(\d+)$/);
  if (signMatch) {
    const code = Number(signMatch[1]);

    const inRange = (from, to) => code >= from && code <= to;

    // משולשים: 101-106, 109-111, 114-117, 119-150, 301, 901
    if (
      inRange(101, 106) ||
      inRange(109, 111) ||
      inRange(114, 117) ||
      inRange(119, 150) ||
      code === 301 ||
      code === 901
    ) {
      return "משולש";
    }

    // ריבועים: 220-225, 306, 308, 504-505, 618-626, 628, 633-638, 902, 905-907, 910-914, 935
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
    ) {
      return "ריבוע";
    }

    // עיגולים: 201-215, 218-219, 226-229, 303-304, 307, 401-438, 440-441
    if (
      inRange(201, 215) ||
      inRange(218, 219) ||
      inRange(226, 229) ||
      inRange(303, 304) ||
      code === 307 ||
      inRange(401, 438) ||
      inRange(440, 441)
    ) {
      return "עיגול";
    }

    // מתומן: 302 בלבד
    if (code === 302) {
      return "מתומן";
    }

    // כל השאר: מרובעים
    return "מרובע";
  }

  if (title.includes("מתומן")) return "מתומן";
  if (title.includes("משולש")) return "משולש";
  if (title.includes("עיגול") || title.includes("קוטר")) return "עיגול";
  if (title.includes("ריבוע")) return "ריבוע";
  if (category.includes("שלט")) return "מרובע";
  if (category.includes("תמרור")) return "מרובע";
  return null;
}

function renderGallery(images, title, altBase = title) {
  const mainImage = document.getElementById("mainProductImage");
  const thumbsContainer = document.getElementById("productThumbs");
  if (!mainImage || !thumbsContainer) return;

  const safeImages = normalizeProductImages(images);
  const firstImage = safeImages[0];

  const setMainImage = (image) => {
    mainImage.onerror = () => {
      mainImage.src = image.fallback;
    };
    mainImage.src = image.full;
  };

  setMainImage(firstImage);
  mainImage.loading = "eager";
  mainImage.decoding = "async";
  mainImage.fetchPriority = "high";
  mainImage.alt = altBase;
  thumbsContainer.innerHTML = "";

  safeImages.forEach((image, index) => {
    const thumbBtn = document.createElement("button");
    thumbBtn.type = "button";
    thumbBtn.className = `product-gallery__thumb${index === 0 ? " active" : ""}`;
    thumbBtn.innerHTML = `<img src="${image.thumb}" alt="${altBase} - \u05ea\u05de\u05d5\u05e0\u05d4 ${index + 1}" loading="lazy" decoding="async" width="160" height="160" />`;
    const thumbImg = thumbBtn.querySelector("img");
    if (thumbImg) {
      thumbImg.addEventListener(
        "error",
        () => {
          thumbImg.src = image.fallback;
        },
        { once: true }
      );
    }
    thumbBtn.addEventListener("click", () => {
      setMainImage(image);
      thumbsContainer.querySelectorAll(".product-gallery__thumb").forEach((thumb) => thumb.classList.remove("active"));
      thumbBtn.classList.add("active");
    });
    thumbsContainer.appendChild(thumbBtn);
  });
}

function shouldApplyMountingOptions(productId = "", category = "") {
  if (/^sign-\d+$/.test(productId || "")) return true;
  const normalizedCategory = String(category || "");
  return normalizedCategory.includes("שלט") || normalizedCategory.includes("תמרור");
}

function enableCustomSelectUi(container) {
  if (!container) return;
  const nativeSelects = Array.from(container.querySelectorAll("select.form-select"));
  const openClass = "is-open";
  const initializedFlag = "1";

  const closeAll = () => {
    container.querySelectorAll(".tsc-custom-select").forEach((root) => {
      root.classList.remove(openClass);
      root.querySelector(".tsc-custom-select__trigger")?.setAttribute("aria-expanded", "false");
    });
  };

  document.addEventListener("click", (event) => {
    if (!container.contains(event.target)) closeAll();
  });

  nativeSelects.forEach((select) => {
    if (select.dataset.customSelectInit === initializedFlag) return;
    select.dataset.customSelectInit = initializedFlag;
    select.classList.add("tsc-native-select-hidden");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const customRoot = document.createElement("div");
    customRoot.className = "tsc-custom-select";
    customRoot.setAttribute("dir", "rtl");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "tsc-custom-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", select.closest(".product-option")?.querySelector("label")?.textContent || "בחירת אפשרות");

    const list = document.createElement("ul");
    list.className = "tsc-custom-select__list";
    list.setAttribute("role", "listbox");
    list.id = `${select.id || `productOption${Math.random().toString(36).slice(2)}`}CustomList`;
    trigger.setAttribute("aria-controls", list.id);

    const getItems = () => Array.from(list.querySelectorAll(".tsc-custom-select__item"));

    const openList = (focusSelected = true) => {
      closeAll();
      customRoot.classList.add(openClass);
      trigger.setAttribute("aria-expanded", "true");
      if (!focusSelected) return;
      const items = getItems();
      const selectedItem = items.find((item) => item.dataset.value === select.value) || items[0];
      selectedItem?.focus({ preventScroll: true });
    };

    const closeList = (returnFocus = true) => {
      customRoot.classList.remove(openClass);
      trigger.setAttribute("aria-expanded", "false");
      if (returnFocus) trigger.focus({ preventScroll: true });
    };

    const moveItemFocus = (currentItem, direction) => {
      const items = getItems();
      if (!items.length) return;
      const currentIndex = Math.max(0, items.indexOf(currentItem));
      const nextIndex = (currentIndex + direction + items.length) % items.length;
      items[nextIndex]?.focus({ preventScroll: true });
    };

    const chooseOption = (opt) => {
      select.value = opt.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closeList(true);
    };

    const renderOptions = () => {
      const options = Array.from(select.options);
      list.innerHTML = "";

      options.forEach((opt) => {
        const item = document.createElement("li");
        item.className = "tsc-custom-select__item";
        item.textContent = opt.textContent || opt.value;
        item.dataset.value = opt.value;
        item.setAttribute("role", "option");
        item.tabIndex = -1;

        if (opt.value === select.value) {
          item.classList.add("is-selected");
          item.setAttribute("aria-selected", "true");
        } else {
          item.setAttribute("aria-selected", "false");
        }

        item.addEventListener("click", () => {
          chooseOption(opt);
        });

        item.addEventListener("keydown", (event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveItemFocus(item, 1);
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveItemFocus(item, -1);
            return;
          }
          if (event.key === "Home") {
            event.preventDefault();
            getItems()[0]?.focus({ preventScroll: true });
            return;
          }
          if (event.key === "End") {
            event.preventDefault();
            getItems().at(-1)?.focus({ preventScroll: true });
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            chooseOption(opt);
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            closeList(true);
          }
        });

        list.appendChild(item);
      });

      const selectedOption = options.find((opt) => opt.value === select.value) || options[0];
      trigger.textContent = selectedOption ? (selectedOption.textContent || selectedOption.value) : "";
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const wasOpen = customRoot.classList.contains(openClass);
      if (wasOpen) {
        closeList(false);
      } else {
        openList(false);
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openList(true);
        if (event.key === "ArrowUp") getItems().at(-1)?.focus({ preventScroll: true });
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeList(false);
      }
    });

    select.addEventListener("change", () => {
      renderOptions();
      closeList(false);
    });

    const observer = new MutationObserver(renderOptions);
    observer.observe(select, { childList: true, subtree: true, attributes: true });

    customRoot.appendChild(trigger);
    customRoot.appendChild(list);
    select.insertAdjacentElement("afterend", customRoot);
    renderOptions();
  });
}

function renderOptions(options, productId = "", productCategory = "", productTitle = "", restorePayload = null) {
  const optionsContainer = document.getElementById("productOptions");
  if (!optionsContainer) return [];
  const SIZE_FIELD_LABELS = new Set(["גודל", "אורך צלע", "אורך 2 צלעות", "קוטר"]);
  const isSignProduct = /^sign-\d+$/.test(productId || "");
  const inferredSignShape = isSignProduct
    ? inferShapeByProduct(productId, productTitle, productCategory)
    : null;

  const setSelectValues = (select, values) => {
    if (!select) return;
    select.innerHTML = "";
    values.forEach((value) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    });
  };

  const fields = [];
  optionsContainer.innerHTML = "";
  const hasComplementaryOptions = shouldApplyMountingOptions(productId, productCategory);
  const filteredOptions = hasComplementaryOptions
    ? options.filter((option) => option?.name !== "חומר")
    : options;
  const normalizedOptions = filteredOptions.map((option) => {
    if (isSignProduct && option?.name === "גודל" && inferredSignShape) {
      return {
        ...option,
        values: getSizeOptionsByShape(inferredSignShape)
      };
    }
    return option;
  });

  normalizedOptions.forEach((option, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "product-option";

    const fieldId = `productOption${index}`;
    wrapper.innerHTML = `
      <label for="${fieldId}">${option.name}</label>
      <select id="${fieldId}" class="form-select"></select>
    `;

    const select = wrapper.querySelector("select");
    option.values.forEach((value) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    });

    fields.push({ label: option.name, element: select });
    optionsContainer.appendChild(wrapper);
  });

  if (isSignProduct) {
    const sizeField = fields.find((field) => SIZE_FIELD_LABELS.has(field.label));
    if (sizeField) {
      const inferredShape = inferredSignShape;
      let sizeLabel = "גודל";

      if (inferredShape === "משולש" || inferredShape === "משולש הפוך") {
        sizeLabel = "אורך צלע";
      } else if (inferredShape === "ריבוע" || inferredShape === "מרובע") {
        sizeLabel = "אורך 2 צלעות";
      } else if (inferredShape === "עיגול" || inferredShape === "מתומן") {
        sizeLabel = "קוטר";
      }

      const sizeLabelElement = sizeField.element
        ?.closest(".product-option")
        ?.querySelector("label");
      if (sizeLabelElement) {
        sizeLabelElement.textContent = sizeLabel;
      }
      sizeField.label = sizeLabel;
    }
  }

  if (hasComplementaryOptions) {
    const complementaryWrapper = document.createElement("div");
    complementaryWrapper.className = "product-option";
    complementaryWrapper.innerHTML = `
      <label>מוצרים משלימים</label>
      <div id="complementaryProductsOptions" class="d-flex flex-column gap-2 mt-2">
        <label class="form-check m-0">
          <input class="form-check-input" type="checkbox" value="ללא" checked>
          <span class="form-check-label">ללא</span>
        </label>
        <label class="form-check m-0">
          <input class="form-check-input" type="checkbox" value="עמוד">
          <span class="form-check-label">עמוד 3 צול</span>
        </label>
        <label class="form-check m-0">
          <input class="form-check-input" type="checkbox" value="יחידת חיבור">
          <span class="form-check-label">יחידת חיבור</span>
        </label>
      </div>
    `;
    optionsContainer.appendChild(complementaryWrapper);

    const complementaryContainer = complementaryWrapper.querySelector("#complementaryProductsOptions");
    const complementaryCheckboxes = Array.from(complementaryContainer?.querySelectorAll("input[type='checkbox']") || []);
    const noneCheckbox = complementaryCheckboxes.find((checkbox) => checkbox.value === "ללא");

    const poleLengthWrapper = document.createElement("div");
    poleLengthWrapper.className = "product-option";
    poleLengthWrapper.style.display = "none";
    poleLengthWrapper.innerHTML = `
      <label for="productPoleLength">גובה העמוד</label>
      <select id="productPoleLength" class="form-select">
        <option value="1.5 מטר">1.5 מטר</option>
        <option value="3 מטר">3 מטר</option>
        <option value="3.5 מטר">3.5 מטר</option>
        <option value="4 מטר">4 מטר</option>
      </select>
    `;
    optionsContainer.appendChild(poleLengthWrapper);
    const poleLengthSelect = poleLengthWrapper.querySelector("select");

    const connectorTypeWrapper = document.createElement("div");
    connectorTypeWrapper.className = "product-option";
    connectorTypeWrapper.style.display = "none";
    connectorTypeWrapper.innerHTML = `
      <label for="productConnectorUnit">סוג יחידת חיבור</label>
      <select id="productConnectorUnit" class="form-select">
        <option value="3 צול">3 צול</option>
        <option value="6 צול">6 צול</option>
      </select>
    `;
    optionsContainer.appendChild(connectorTypeWrapper);
    const connectorTypeSelect = connectorTypeWrapper.querySelector("select");

    const updateComplementaryUi = () => {
      const selected = complementaryCheckboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
      poleLengthWrapper.style.display = selected.includes("עמוד") ? "block" : "none";
      connectorTypeWrapper.style.display = selected.includes("יחידת חיבור") ? "block" : "none";
    };

    complementaryCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.value === "ללא" && checkbox.checked) {
          complementaryCheckboxes.forEach((item) => {
            if (item.value !== "ללא") item.checked = false;
          });
        } else if (checkbox.value !== "ללא" && checkbox.checked && noneCheckbox) {
          noneCheckbox.checked = false;
        }

        if (!complementaryCheckboxes.some((item) => item.checked) && noneCheckbox) {
          noneCheckbox.checked = true;
        }

        updateComplementaryUi();
      });
    });

    updateComplementaryUi();
    fields.push({
      label: "מוצרים משלימים",
      element: complementaryContainer,
      getValues: () => complementaryCheckboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => ({ name: "מוצרים משלימים", value: checkbox.value }))
    });
    fields.push({ label: "גובה עמוד 3 צול", element: poleLengthSelect });
    fields.push({ label: "סוג יחידת חיבור", element: connectorTypeSelect });
  }

  if (productId === "safety-cones") {
    const colorField = fields.find((field) => field.label === "צבע");
    const heightField = fields.find((field) => field.label === "גובה");
    const coneImages = normalizeProductImages(PRODUCT_CATALOG["safety-cones"]?.images || []);

    if (colorField && heightField) {
      const pickConeImageByColor = (colorValue = "") => {
        const isWhiteCone = /לבן/.test(String(colorValue || ""));
        const blackConeImage = coneImages.find((image) =>
          /blackcone\.webp$/i.test(image.full || "") ||
          /blackcone\.webp$/i.test(image.thumb || "") ||
          /blackcone\.webp$/i.test(image.fallback || "")
        ) || coneImages[0];
        const whiteConeImage = coneImages.find((image) =>
          /whitecone\.webp$/i.test(image.full || "") ||
          /whitecone\.webp$/i.test(image.thumb || "") ||
          /whitecone\.webp$/i.test(image.fallback || "")
        ) || coneImages[1] || blackConeImage;

        return isWhiteCone ? whiteConeImage : blackConeImage;
      };

      const updateConeImageByColor = () => {
        const selectedImage = pickConeImageByColor(colorField.element.value);
        if (!selectedImage) return;
        renderGallery(
          [selectedImage],
          productTitle || "קונוס",
          productTitle || "קונוס"
        );
      };

      const updateConeHeightOptions = () => {
        const color = colorField.element.value;
        const values = color === "כתום שחור" ? ["75"] : ["50", "75"];
        heightField.element.innerHTML = "";
        values.forEach((value) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = value;
          heightField.element.appendChild(opt);
        });
      };

      colorField.element.addEventListener("change", () => {
        updateConeHeightOptions();
        updateConeImageByColor();
      });
      updateConeHeightOptions();
      updateConeImageByColor();
    }
  }

  if (productId === "custom-design-board") {
    const shapeField = fields.find((field) => field.label === "צורה");
    const sizeField = fields.find((field) => SIZE_FIELD_LABELS.has(field.label));
    const textField = fields.find((field) => field.label === "כיתוב");
    const imageField = fields.find((field) => field.label === "תמונה");
    let textControlsWrapper = null;

    if (shapeField && sizeField) {
      const updateSizeOptionsByShape = () => {
        setSelectValues(sizeField.element, getSizeOptionsByShape(shapeField.element.value));
      };
      shapeField.element.addEventListener("change", updateSizeOptionsByShape);
      updateSizeOptionsByShape();
    }

    if (textField) {
      const customTextWrapper = document.createElement("div");
      customTextWrapper.className = "product-option";
      customTextWrapper.id = "customTextOptionWrapper";
      customTextWrapper.style.display = "none";
      customTextWrapper.innerHTML = `
        <label for="customTextOptionInput">הכנס כיתוב</label>
        <textarea id="customTextOptionInput" class="form-control" rows="3" dir="rtl" lang="he" placeholder="הכנס טקסט"></textarea>
      `;
      optionsContainer.appendChild(customTextWrapper);

      const toggleCustomTextInput = () => {
        customTextWrapper.style.display = textField.element.value === "כן" ? "block" : "none";
      };

      textField.element.addEventListener("change", toggleCustomTextInput);
      toggleCustomTextInput();

      textControlsWrapper = document.createElement("div");
      textControlsWrapper.className = "product-option custom-text-controls";
      textControlsWrapper.id = "customTextControlsWrapper";
      textControlsWrapper.style.display = "none";
      textControlsWrapper.innerHTML = `
        <label>עיצוב טקסט</label>
        <div class="custom-text-controls__grid">
          <label class="custom-control-field custom-control-field--full" for="customTextFontColor">
            <span>צבע טקסט</span>
            <input id="customTextFontColor" type="color" class="form-control form-control-color" value="#111827" />
          </label>
          <label class="custom-control-field custom-control-field--full" for="customTextFontThickness">
            <span>עובי פונט: <strong id="customTextFontThicknessValue">3.00</strong> ס"מ</span>
            <input id="customTextFontThickness" type="range" class="form-range" min="1" max="30" step="0.1" value="3" />
          </label>
          <label class="custom-control-field custom-control-field--full" for="customTextLineLength">
            <span>אורך שורה: <strong id="customTextLineLengthValue">24.00</strong> ס"מ</span>
            <input id="customTextLineLength" type="range" class="form-range" min="4" max="120" step="0.1" value="24" />
          </label>
          <div class="custom-control-field custom-control-field--full custom-control-field--with-reset">
            <label for="customTextOffsetX">
              <span>מיקום אופקי: <strong id="customTextOffsetXValue">0.00</strong> ס\"מ</span>
              <input id="customTextOffsetX" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
            </label>
            <button id="customTextOffsetXReset" type="button" class="btn btn-outline-secondary btn-sm custom-reset-btn" title="אפס מיקום אופקי של הטקסט" aria-label="אפס מיקום אופקי של הטקסט">
              <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
              <span>אפס</span>
            </button>
          </div>
          <div class="custom-control-field custom-control-field--full custom-control-field--with-reset">
            <label for="customTextOffsetY">
              <span>מיקום אנכי: <strong id="customTextOffsetYValue">0.00</strong> ס\"מ</span>
              <input id="customTextOffsetY" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
            </label>
            <button id="customTextOffsetYReset" type="button" class="btn btn-outline-secondary btn-sm custom-reset-btn" title="אפס מיקום אנכי של הטקסט" aria-label="אפס מיקום אנכי של הטקסט">
              <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
              <span>אפס</span>
            </button>
          </div>
        </div>
      `;
      optionsContainer.appendChild(textControlsWrapper);

      const toggleTextControls = () => {
        const show = textField.element.value === "כן";
        textControlsWrapper.style.display = show ? "block" : "none";
      };
      textField.element.addEventListener("change", toggleTextControls);
      toggleTextControls();
    }

    if (imageField) {
      const customImageWrapper = document.createElement("div");
      customImageWrapper.className = "product-option";
      customImageWrapper.id = "customImageOptionWrapper";
      customImageWrapper.style.display = "none";
      customImageWrapper.innerHTML = `
        <label for="customImageOptionInput">צרף תמונה</label>
        <input id="customImageOptionInput" type="file" class="form-control" accept="image/*" />
      `;
      optionsContainer.appendChild(customImageWrapper);

      const toggleCustomImageInput = () => {
        customImageWrapper.style.display = imageField.element.value === "כן" ? "block" : "none";
      };

      imageField.element.addEventListener("change", toggleCustomImageInput);
      toggleCustomImageInput();
    }

    const customNotesWrapper = document.createElement("div");
    customNotesWrapper.className = "product-option";
    customNotesWrapper.id = "customNotesOptionWrapper";
    customNotesWrapper.innerHTML = `
      <label for="customNotesOptionInput">הערות</label>
      <textarea id="customNotesOptionInput" class="form-control" rows="3" placeholder="הערות נוספות להזמנה (אופציונלי)"></textarea>
    `;
    optionsContainer.appendChild(customNotesWrapper);

    const imageTransform = { offsetX: 0, offsetY: 0, scale: 1 };
    const textTransform = {
      offsetX: 0,
      offsetY: 0,
      fontThicknessCm: 3,
      lineLengthCm: 24,
      fontColor: "#111827",
      linkRatio: 8
    };

    let imageControlsWrapper = document.getElementById("customImageControlsWrapper");
    if (!imageControlsWrapper) {
      imageControlsWrapper = document.createElement("div");
      imageControlsWrapper.className = "product-option";
      imageControlsWrapper.id = "customImageControlsWrapper";
      imageControlsWrapper.style.display = "none";
      imageControlsWrapper.innerHTML = `
        <label>עיצוב התמונה</label>
        <div class="custom-image-controls__sliders">
          <div class="custom-control-field custom-control-field--full custom-control-field--with-reset">
            <label for="customImageOffsetX">
              <span>מיקום אופקי: <strong id="customImageOffsetXValue">0.00</strong> ס"מ</span>
              <input id="customImageOffsetX" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
            </label>
            <button id="customImageOffsetXReset" type="button" class="btn btn-outline-secondary btn-sm custom-reset-btn" title="אפס מיקום אופקי של התמונה" aria-label="אפס מיקום אופקי של התמונה">
              <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
              <span>אפס</span>
            </button>
          </div>
          <div class="custom-control-field custom-control-field--full custom-control-field--with-reset">
            <label for="customImageOffsetY">
              <span>מיקום אנכי: <strong id="customImageOffsetYValue">0.00</strong> ס"מ</span>
              <input id="customImageOffsetY" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
            </label>
            <button id="customImageOffsetYReset" type="button" class="btn btn-outline-secondary btn-sm custom-reset-btn" title="אפס מיקום אנכי של התמונה" aria-label="אפס מיקום אנכי של התמונה">
              <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
              <span>אפס</span>
            </button>
          </div>
          <label class="custom-control-field custom-control-field--full" for="customImageScale">
            <span>גודל תמונה: <strong id="customImageScaleValue">100</strong>%</span>
            <input id="customImageScale" type="range" class="form-range" min="20" max="500" step="5" value="100" />
          </label>
        </div>
      `;
      const imageInputWrapper = document.getElementById("customImageOptionWrapper");
      if (imageInputWrapper && imageInputWrapper.parentNode === optionsContainer) {
        imageInputWrapper.insertAdjacentElement("afterend", imageControlsWrapper);
      } else {
        optionsContainer.appendChild(imageControlsWrapper);
      }
    }

    let designResetWrapper = document.getElementById("customDesignResetWrapper");
    if (!designResetWrapper) {
      designResetWrapper = document.createElement("div");
      designResetWrapper.className = "product-option custom-design-reset";
      designResetWrapper.id = "customDesignResetWrapper";
      designResetWrapper.style.display = "none";
      designResetWrapper.innerHTML = `
        <button id="customDesignPlacementReset" type="button" class="btn btn-outline-dark btn-sm custom-reset-btn custom-reset-btn--all" title="אפס את מיקום הטקסט והתמונה" aria-label="אפס את מיקום הטקסט והתמונה">
          <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          <span>אפס הכל</span>
        </button>
      `;
      optionsContainer.appendChild(designResetWrapper);
    }

    const mainImage = document.getElementById("mainProductImage");
    const thumbsContainer = document.getElementById("productThumbs");
    let previewCanvas = document.getElementById("customBoardPreviewCanvas");
    if (!previewCanvas && mainImage?.parentElement) {
      previewCanvas = document.createElement("canvas");
      previewCanvas.id = "customBoardPreviewCanvas";
      previewCanvas.width = 1000;
      previewCanvas.height = 750;
      previewCanvas.className = "product-gallery__main";
      previewCanvas.setAttribute("aria-label", "תצוגה מקדימה של השלט המעוצב");
      previewCanvas.style.width = "min(100%, 46rem)";
      previewCanvas.style.height = "auto";
      previewCanvas.style.maxWidth = "100%";
      previewCanvas.style.maxHeight = "min(70vh, 46rem)";
      previewCanvas.style.aspectRatio = "auto";
      previewCanvas.style.padding = "0";
      previewCanvas.style.margin = "0 auto";
      previewCanvas.style.display = "none";
      mainImage.insertAdjacentElement("afterend", previewCanvas);
      // Ensure the canvas element's pixel dimensions match the preview geometry
      setTimeout(() => {
        try {
          if (typeof resizePreviewCanvasForShape === "function") {
            const currentShape = (typeof shapeField !== 'undefined' && shapeField?.element?.value) ? shapeField.element.value : 'מרובע';
            resizePreviewCanvasForShape(currentShape);
          }
        } catch (e) {
          // ignore
        }
      }, 0);
    }
    const previewCtx = previewCanvas?.getContext("2d");
    let baseImageFrame = previewCanvas
      ? { x: 0, y: 0, w: previewCanvas.width, h: previewCanvas.height }
      : { x: 0, y: 0, w: 1000, h: 750 };

    if (mainImage) mainImage.style.display = "none";
    if (previewCanvas) previewCanvas.style.display = "block";
    if (thumbsContainer) thumbsContainer.style.display = "none";

    let previewNote = document.getElementById("customBoardPreviewNote");
    if (!previewNote && previewCanvas?.parentElement) {
      previewNote = document.createElement("div");
      previewNote.id = "customBoardPreviewNote";
      previewNote.className = "text-muted mt-2";
      previewNote.style.fontSize = "0.9rem";
      previewNote.innerHTML = `
        <div>ניתן לבצע התאמות צבעים, שינויים והחלפות בהתאם לצורך.</div>
        <div>הדוגמה להמחשה בלבד.</div>
      `;
      previewCanvas.insertAdjacentElement("afterend", previewNote);
    } else if (previewNote) {
      previewNote.style.display = "block";
    }

    if (imageControlsWrapper) {
      imageControlsWrapper.classList.add("custom-image-controls-below-preview");
      if (previewNote?.parentElement) {
        previewNote.insertAdjacentElement("afterend", imageControlsWrapper);
      } else if (previewCanvas?.parentElement) {
        previewCanvas.insertAdjacentElement("afterend", imageControlsWrapper);
      }
    }

    if (designResetWrapper) {
      designResetWrapper.classList.add("custom-design-reset-below-preview");
      if (imageControlsWrapper?.parentElement) {
        imageControlsWrapper.insertAdjacentElement("afterend", designResetWrapper);
      } else if (previewNote?.parentElement) {
        previewNote.insertAdjacentElement("afterend", designResetWrapper);
      } else if (previewCanvas?.parentElement) {
        previewCanvas.insertAdjacentElement("afterend", designResetWrapper);
      }
    }
    if (textControlsWrapper) {
      if (imageControlsWrapper?.parentElement) {
        imageControlsWrapper.insertAdjacentElement("afterend", textControlsWrapper);
      } else if (previewNote?.parentElement) {
        previewNote.insertAdjacentElement("afterend", textControlsWrapper);
      } else if (previewCanvas?.parentElement) {
        previewCanvas.insertAdjacentElement("afterend", textControlsWrapper);
      }
    }

    const blankImageByShape = {
      "עיגול": "/assets/signs/circle.webp",
      "משולש": "/assets/signs/triangle.webp",
      "משולש הפוך": "/assets/signs/upsideDtriangle.webp",
      "ריבוע": "/assets/signs/square.webp",
      "מרובע": "/assets/signs/rectangle.webp",
      "מתומן": "/assets/signs/octagon.webp"
    };

    const blankShapeImageCache = new Map();
    const shapeGeometryCache = new Map();
    const imageBoundsCache = new Map();
    const PREVIEW_MAX_WIDTH = 1100;
    const PREVIEW_MAX_HEIGHT = 820;
    const PREVIEW_MIN_WIDTH = 560;
    const PREVIEW_MIN_HEIGHT = 280;

    const clonePoint = (point) => ({ x: point.x, y: point.y });
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const parseNumericValue = (value) => {
      const raw = String(value ?? "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
      return raw ? Number(raw[0]) : NaN;
    };
    function clearPreviewGeometryCaches() {
      shapeGeometryCache.clear();
      imageBoundsCache.clear();
    }

    function getPolygonBounds(vertices) {
      const xs = vertices.map((point) => point.x);
      const ys = vertices.map((point) => point.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys)
      };
    }

    function createRegularPolygon(cx, cy, radius, sides, rotation = 0) {
      const vertices = [];
      for (let i = 0; i < sides; i += 1) {
        const angle = ((Math.PI * 2) / sides) * i + rotation;
        vertices.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      }
      return vertices;
    }

    function insetPolygon(vertices, cx, cy, insetPx) {
      const outerRadius = Math.max(...vertices.map((point) => Math.hypot(point.x - cx, point.y - cy)));
      const safeRadius = Math.max(1, outerRadius - insetPx);
      const scale = safeRadius / outerRadius;
      return vertices.map((point) => ({
        x: cx + (point.x - cx) * scale,
        y: cy + (point.y - cy) * scale
      }));
    }

    function fitBoundsForAspect(canvasWidth, canvasHeight, aspectRatio, padding) {
      const availableWidth = Math.max(1, canvasWidth - padding * 2);
      const availableHeight = Math.max(1, canvasHeight - padding * 2);
      const safeAspect = clamp(Number(aspectRatio) || 1, 0.12, 8);
      let w = availableWidth;
      let h = w / safeAspect;

      if (h > availableHeight) {
        h = availableHeight;
        w = h * safeAspect;
      }

      return {
        x: (canvasWidth - w) / 2,
        y: (canvasHeight - h) / 2,
        w,
        h
      };
    }

    function fitImageInsideRect(imageWidth, imageHeight, rect) {
      const safeImageWidth = Math.max(1, Number(imageWidth) || 1);
      const safeImageHeight = Math.max(1, Number(imageHeight) || 1);
      const scale = Math.min(rect.w / safeImageWidth, rect.h / safeImageHeight);
      const w = safeImageWidth * scale;
      const h = safeImageHeight * scale;
      return {
        x: rect.x + (rect.w - w) / 2,
        y: rect.y + (rect.h - h) / 2,
        w,
        h
      };
    }

    function loadBlankShapeImage(src) {
      if (!src) return Promise.resolve(null);
      if (blankShapeImageCache.has(src)) return blankShapeImageCache.get(src);

      const imagePromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

      blankShapeImageCache.set(src, imagePromise);
      return imagePromise;
    }

    function getPreviewCanvasDimensions(shape) {
      const dimensions = parseSizeToDimensionsCm(shape, sizeField?.element?.value || "");
      const signAspect = clamp(dimensions.widthCm / Math.max(dimensions.heightCm, 0.01), 0.15, 8);
      let width = Math.min(PREVIEW_MAX_WIDTH, Math.round(PREVIEW_MAX_HEIGHT * signAspect));
      let height = Math.round(width / signAspect);

      if (height > PREVIEW_MAX_HEIGHT) {
        height = PREVIEW_MAX_HEIGHT;
        width = Math.round(height * signAspect);
      }

      if (height < PREVIEW_MIN_HEIGHT) {
        height = PREVIEW_MIN_HEIGHT;
        width = Math.min(PREVIEW_MAX_WIDTH, Math.round(height * signAspect));
      }

      if (width < PREVIEW_MIN_WIDTH) {
        width = PREVIEW_MIN_WIDTH;
        height = Math.min(PREVIEW_MAX_HEIGHT, Math.round(width / signAspect));
      }

      width = Math.round(clamp(width, PREVIEW_MIN_WIDTH, PREVIEW_MAX_WIDTH));
      height = Math.round(clamp(height, PREVIEW_MIN_HEIGHT, PREVIEW_MAX_HEIGHT));

      return {
        width,
        height,
        signAspect,
        signWidthCm: dimensions.widthCm,
        signHeightCm: dimensions.heightCm
      };
    }

    function resizePreviewCanvasForShape(shape) {
      if (!previewCanvas) return null;
      const dimensions = getPreviewCanvasDimensions(shape);
      const shouldResize = previewCanvas.width !== dimensions.width || previewCanvas.height !== dimensions.height;
      // Use the element's displayed size (CSS layout) multiplied by devicePixelRatio
      // so the canvas drawing buffer matches the rendered aspect and avoids stretching.
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const displayW = Math.max(1, Math.round((previewCanvas.clientWidth || dimensions.width) * dpr));
      const displayH = Math.max(1, Math.round((previewCanvas.clientHeight || dimensions.height) * dpr));
      const needBufferResize = previewCanvas.width !== displayW || previewCanvas.height !== displayH;

      if (needBufferResize) {
        previewCanvas.width = displayW;
        previewCanvas.height = displayH;
      }

      previewCanvas.style.setProperty("--custom-preview-aspect", `${displayW} / ${displayH}`);
      if (shouldResize) clearPreviewGeometryCaches();
      return dimensions;
    }

    function buildShapeGeometry(shape) {
      if (!previewCanvas) return null;
      const dimensions = getPreviewCanvasDimensions(shape);
      const cacheKey = `${shape}:${sizeField?.element?.value || ""}:${previewCanvas.width}x${previewCanvas.height}`;
      if (shapeGeometryCache.has(cacheKey)) return shapeGeometryCache.get(cacheKey);

      const w = previewCanvas.width;
      const h = previewCanvas.height;
      const min = Math.min(w, h);
      const padding = clamp(min * 0.085, 18, 72);
      const cx = w / 2;
      const cy = h / 2;
      const signAspect = clamp(dimensions.signWidthCm / Math.max(dimensions.signHeightCm, 0.01), 0.15, 8);
      const borderInsetRatio = shape === "מרובע" || shape === "ריבוע" ? 0.085 : 0.13;
      let geometry = null;

      if (shape === "עיגול") {
        const outerBounds = fitBoundsForAspect(w, h, 1, padding);
        const outerRadius = Math.min(outerBounds.w, outerBounds.h) / 2;
        const innerRadius = Math.max(8, outerRadius * (1 - borderInsetRatio));
        geometry = {
          kind: "circle",
          cx,
          cy,
          outerRadius,
          innerRadius,
          outerBounds: { x: cx - outerRadius, y: cy - outerRadius, w: outerRadius * 2, h: outerRadius * 2 },
          innerBounds: { x: cx - innerRadius, y: cy - innerRadius, w: innerRadius * 2, h: innerRadius * 2 },
          signWidthCm: dimensions.signWidthCm,
          signHeightCm: dimensions.signHeightCm
        };
      } else if (shape === "משולש" || shape === "משולש הפוך") {
        const outerBounds = fitBoundsForAspect(w, h, signAspect, padding);
        const outerVertices = shape === "משולש"
          ? [
            { x: outerBounds.x + outerBounds.w / 2, y: outerBounds.y },
            { x: outerBounds.x + outerBounds.w, y: outerBounds.y + outerBounds.h },
            { x: outerBounds.x, y: outerBounds.y + outerBounds.h }
          ]
          : [
            { x: outerBounds.x + outerBounds.w / 2, y: outerBounds.y + outerBounds.h },
            { x: outerBounds.x + outerBounds.w, y: outerBounds.y },
            { x: outerBounds.x, y: outerBounds.y }
          ];
        const borderInset = Math.min(outerBounds.w, outerBounds.h) * borderInsetRatio;
        const innerVertices = insetPolygon(outerVertices, cx, cy, borderInset);
        geometry = {
          kind: "polygon",
          cx,
          cy,
          outerVertices,
          innerVertices,
          outerBounds: getPolygonBounds(outerVertices),
          innerBounds: getPolygonBounds(innerVertices),
          signWidthCm: dimensions.signWidthCm,
          signHeightCm: dimensions.signHeightCm
        };
      } else if (shape === "מתומן") {
        const outerBounds = fitBoundsForAspect(w, h, 1, padding);
        const radius = Math.min(outerBounds.w, outerBounds.h) / 2;
        const outerVertices = createRegularPolygon(cx, cy, radius, 8, -Math.PI / 8);
        const innerVertices = insetPolygon(outerVertices, cx, cy, radius * borderInsetRatio);
        geometry = {
          kind: "polygon",
          cx,
          cy,
          outerVertices,
          innerVertices,
          outerBounds: getPolygonBounds(outerVertices),
          innerBounds: getPolygonBounds(innerVertices),
          signWidthCm: dimensions.signWidthCm,
          signHeightCm: dimensions.signHeightCm
        };
      } else {
        const rectAspect = shape === "ריבוע" ? 1 : signAspect;
        const outerBounds = fitBoundsForAspect(w, h, rectAspect, padding);
        const inset = Math.min(outerBounds.w, outerBounds.h) * borderInsetRatio;
        const innerBounds = {
          x: outerBounds.x + inset,
          y: outerBounds.y + inset,
          w: Math.max(10, outerBounds.w - inset * 2),
          h: Math.max(10, outerBounds.h - inset * 2)
        };
        geometry = {
          kind: "roundedRect",
          cx,
          cy,
          outerBounds,
          innerBounds,
          radius: Math.min(outerBounds.w, outerBounds.h) * 0.055,
          innerRadius: Math.min(innerBounds.w, innerBounds.h) * 0.035,
          signWidthCm: dimensions.signWidthCm,
          signHeightCm: dimensions.signHeightCm
        };
      }

      shapeGeometryCache.set(cacheKey, geometry);
      return geometry;
    }

    function roundedRectPath(ctx, rect, radius) {
      const r = Math.max(0, Math.min(radius, rect.w / 2, rect.h / 2));
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, r);
        return;
      }

      ctx.beginPath();
      ctx.moveTo(rect.x + r, rect.y);
      ctx.lineTo(rect.x + rect.w - r, rect.y);
      ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
      ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
      ctx.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - r, rect.y + rect.h);
      ctx.lineTo(rect.x + r, rect.y + rect.h);
      ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
      ctx.lineTo(rect.x, rect.y + r);
      ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
      ctx.closePath();
    }

    function drawShapePath(shape, mode = "outer") {
      if (!previewCtx || !previewCanvas) return;
      const geometry = buildShapeGeometry(shape);
      if (!geometry) return;
      const ctx = previewCtx;
      const useInner = mode === "inner";

      if (geometry.kind === "circle") {
        const radius = useInner ? geometry.innerRadius : geometry.outerRadius;
        ctx.beginPath();
        ctx.arc(geometry.cx, geometry.cy, radius, 0, Math.PI * 2);
        return;
      }

      if (geometry.kind === "roundedRect") {
        const rect = useInner ? geometry.innerBounds : geometry.outerBounds;
        roundedRectPath(ctx, rect, useInner ? geometry.innerRadius : geometry.radius);
        return;
      }

      const vertices = useInner ? geometry.innerVertices : geometry.outerVertices;
      ctx.beginPath();
      vertices.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
    }

    function getHorizontalSegmentAtY(vertices, y) {
      const xs = [];
      const count = vertices.length;
      for (let i = 0; i < count; i += 1) {
        const a = vertices[i];
        const b = vertices[(i + 1) % count];
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        if (maxY - minY < 1e-6) continue;
        if (y < minY || y >= maxY) continue;
        const t = (y - a.y) / (b.y - a.y);
        xs.push(a.x + (b.x - a.x) * t);
      }
      if (xs.length < 2) return null;
      xs.sort((a, b) => a - b);
      return { left: xs[0], right: xs[xs.length - 1] };
    }

    function findBestRectInPolygon(vertices, aspectRatio) {
      const bounds = getPolygonBounds(vertices);
      const yMin = bounds.y;
      const yMax = bounds.y + bounds.h;
      const sampleCount = 120;
      const yValues = Array.from({ length: sampleCount }, (_, index) => yMin + ((yMax - yMin) * index) / (sampleCount - 1));
      const segments = yValues.map((y) => getHorizontalSegmentAtY(vertices, y));

      const measureAvailableWidth = (top, bottom) => {
        let leftEdge = -Infinity;
        let rightEdge = Infinity;
        for (let i = 0; i < yValues.length; i += 1) {
          const y = yValues[i];
          if (y < top || y > bottom) continue;
          const segment = segments[i];
          if (!segment) return null;
          leftEdge = Math.max(leftEdge, segment.left);
          rightEdge = Math.min(rightEdge, segment.right);
          if (rightEdge <= leftEdge) return null;
        }
        return {
          left: leftEdge,
          right: rightEdge,
          width: rightEdge - leftEdge
        };
      };

      let best = {
        x: bounds.x,
        y: bounds.y,
        w: Math.max(1, bounds.w * 0.5),
        h: Math.max(1, bounds.w * 0.5 / Math.max(aspectRatio, 0.01))
      };
      let bestArea = best.w * best.h;

      yValues.forEach((centerY) => {
        const maxHeight = Math.min(centerY - yMin, yMax - centerY) * 2;
        if (maxHeight <= 1) return;
        let low = 0;
        let high = maxHeight;
        let chosen = null;
        for (let step = 0; step < 16; step += 1) {
          const candidateH = (low + high) / 2;
          const top = centerY - candidateH / 2;
          const bottom = centerY + candidateH / 2;
          const segment = measureAvailableWidth(top, bottom);
          if (!segment) {
            high = candidateH;
            continue;
          }
          if (segment.width >= candidateH * aspectRatio) {
            chosen = { ...segment, h: candidateH, centerY };
            low = candidateH;
          } else {
            high = candidateH;
          }
        }

        if (!chosen) return;
        const h = chosen.h;
        const w = h * aspectRatio;
        const x = chosen.left + (chosen.width - w) / 2;
        const y = chosen.centerY - h / 2;
        const area = w * h;
        if (area > bestArea) {
          best = { x, y, w, h };
          bestArea = area;
        }
      });

      return best;
    }

    function getShapeContentBounds(shape) {
      const geometry = buildShapeGeometry(shape);
      if (!geometry) return { x: 120, y: 120, w: 760, h: 510 };
      const innerBounds = geometry.innerBounds;
      return { x: innerBounds.x, y: innerBounds.y, w: innerBounds.w, h: innerBounds.h };
    }

    function getImageContentBounds(shape, imageAspectRatio) {
      const geometry = buildShapeGeometry(shape);
      if (!geometry) return getShapeContentBounds(shape);
      const safeAspect = Math.max(0.05, Number(imageAspectRatio) || 1);
      const cacheKey = `${shape}:${previewCanvas.width}x${previewCanvas.height}:${safeAspect.toFixed(4)}`;
      if (imageBoundsCache.has(cacheKey)) return imageBoundsCache.get(cacheKey);

      let bounds;
      if (geometry.kind === "roundedRect") {
        const source = geometry.innerBounds;
        let w = source.w;
        let h = w / safeAspect;
        if (h > source.h) {
          h = source.h;
          w = h * safeAspect;
        }
        bounds = { x: source.x + (source.w - w) / 2, y: source.y + (source.h - h) / 2, w, h };
      } else if (geometry.kind === "circle") {
        const h = (2 * geometry.innerRadius) / Math.sqrt(safeAspect * safeAspect + 1);
        const w = h * safeAspect;
        bounds = { x: geometry.cx - w / 2, y: geometry.cy - h / 2, w, h };
      } else {
        // For polygonal shapes (triangles, octagons, etc.) prefer a simple,
        // centered fit inside the innerBounds. The previous heuristic tried
        // to find a largest-area rect which caused images to appear offset
        // in narrow polygons like triangles. Centering inside innerBounds
        // provides a more intuitive result for uploaded images.
        const source = geometry.innerBounds;
        let w = source.w;
        let h = w / safeAspect;
        if (h > source.h) {
          h = source.h;
          w = h * safeAspect;
        }
        const x = source.x + (source.w - w) / 2;
        const y = source.y + (source.h - h) / 2;
        bounds = { x, y, w, h };
      }

      imageBoundsCache.set(cacheKey, bounds);
      return bounds;
    }

    function parseSizeToDimensionsCm(shape, sizeValue) {
      const normalized = String(sizeValue || "").replace(/\s+/g, " ").trim();
      const numericParts = normalized.match(/(\d+(?:\.\d+)?)/g)?.map(Number) || [];
      const hasDiameterWord = normalized.includes("קוטר");

      if (shape === "עיגול" || shape === "מתומן" || hasDiameterWord) {
        const diameter = numericParts[0] || 60;
        return { widthCm: diameter, heightCm: diameter };
      }

      if (shape === "משולש" || shape === "משולש הפוך") {
        const sideCm = numericParts[0] || 60;
        return { widthCm: sideCm, heightCm: (Math.sqrt(3) / 2) * sideCm };
      }

      if (shape === "ריבוע") {
        const sideCm = numericParts[0] || numericParts[1] || 60;
        return { widthCm: sideCm, heightCm: sideCm };
      }

      if (numericParts.length >= 2) {
        const first = numericParts[0];
        const second = numericParts[1];
        return {
          widthCm: Math.max(first, second),
          heightCm: Math.min(first, second)
        };
      }

      const sideCm = numericParts[0] || 60;
      return { widthCm: sideCm, heightCm: sideCm };
    }

    function getTextScaleContext(shape) {
      const geometry = buildShapeGeometry(shape);
      const bounds = geometry?.innerBounds || getShapeContentBounds(shape);
      const outerBounds = geometry?.outerBounds || { w: previewCanvas.width, h: previewCanvas.height };
      const signWidthCm = Math.max(1, Number(geometry?.signWidthCm) || 1);
      const signHeightCm = Math.max(1, Number(geometry?.signHeightCm) || 1);
      const contentWidthRatio = bounds.w / Math.max(outerBounds.w, 1);
      const contentHeightRatio = bounds.h / Math.max(outerBounds.h, 1);
      const contentWidthCm = Math.max(1, signWidthCm * contentWidthRatio);
      const contentHeightCm = Math.max(1, signHeightCm * contentHeightRatio);
      const pxPerCmX = bounds.w / contentWidthCm;
      const pxPerCmY = bounds.h / contentHeightCm;

      return {
        bounds,
        contentWidthCm,
        contentHeightCm,
        pxPerCmX,
        pxPerCmY
      };
    }

    function getSignScaleContext(shape) {
      const geometry = buildShapeGeometry(shape);
      const outerBounds = geometry?.outerBounds || { w: previewCanvas.width, h: previewCanvas.height };
      const signWidthCm = Math.max(1, Number(geometry?.signWidthCm) || 1);
      const signHeightCm = Math.max(1, Number(geometry?.signHeightCm) || 1);

      return {
        outerBounds,
        signWidthCm,
        signHeightCm,
        pxPerCmX: outerBounds.w / signWidthCm,
        pxPerCmY: outerBounds.h / signHeightCm
      };
    }

    function getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textOffsetY = 0, pxPerCmY = 1) {
      const offsetYcm = Number(textOffsetY || 0) / Math.max(pxPerCmY, 0.001);
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      if (shape === "משולש" || shape === "משולש הפוך") {
        const baseRatio = shape === "משולש" ? 0.62 : 0.38;
        const verticalRatio = clamp(baseRatio + (offsetYcm / Math.max(contentHeightCm, 0.001)), 0.12, 0.88);
        const widthRatio = shape === "משולש" ? verticalRatio : (1 - verticalRatio);
        return Math.max(6, contentWidthCm * widthRatio * 1.25);
      }

      if (shape === "עיגול") return Math.max(6, contentWidthCm * 1.18);
      if (shape === "מתומן") return Math.max(6, contentWidthCm * 1.22);
      return Math.max(6, contentWidthCm * 1.45);
    }

    function getDynamicThicknessMaxCm(shape, contentHeightCm, maxLineCm) {
      if (shape === "משולש" || shape === "משולש הפוך") {
        return Math.max(1.4, Math.min(contentHeightCm * 0.34, maxLineCm * 0.28));
      }
      if (shape === "עיגול" || shape === "מתומן") {
        return Math.max(1.4, Math.min(contentHeightCm * 0.54, maxLineCm * 0.32));
      }
      return Math.max(1.4, Math.min(contentHeightCm * 0.76, maxLineCm * 0.34));
    }

    function drawFallbackBoard(shape) {
      if (!previewCtx || !previewCanvas) return;
      resizePreviewCanvasForShape(shape);
      const ctx = previewCtx;
      const { width, height } = previewCanvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const geometry = buildShapeGeometry(shape);
      if (!geometry) return;

      ctx.save();
      if (shape === "מרובע" || shape === "ריבוע") {
        const blue = "#2f4f97";
        const outerLine = clamp(Math.min(geometry.outerBounds.w, geometry.outerBounds.h) * 0.035, 7, 22);
        const innerGap = clamp(outerLine * 2.15, 14, 42);
        const innerLineBounds = {
          x: geometry.outerBounds.x + innerGap,
          y: geometry.outerBounds.y + innerGap,
          w: Math.max(10, geometry.outerBounds.w - innerGap * 2),
          h: Math.max(10, geometry.outerBounds.h - innerGap * 2)
        };

        drawShapePath(shape);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.strokeStyle = blue;
        ctx.lineWidth = outerLine;
        drawShapePath(shape);
        ctx.stroke();

        ctx.lineWidth = Math.max(4, outerLine * 0.55);
        roundedRectPath(ctx, innerLineBounds, Math.max(2, geometry.radius * 0.55));
        ctx.stroke();
      } else {
        drawShapePath(shape);
        ctx.fillStyle = "#ef1717";
        ctx.fill();

        drawShapePath(shape, "inner");
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.strokeStyle = "#111827";
        ctx.lineWidth = clamp(Math.min(geometry.outerBounds.w, geometry.outerBounds.h) * 0.012, 3, 10);
        drawShapePath(shape);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawTextOnBoard(textValue, shape) {
      if (!previewCtx || !previewCanvas || !textValue) return;
      const ctx = previewCtx;
      const trimmedText = String(textValue || "").trim();
      if (!trimmedText) return;

      const { bounds, contentWidthCm, contentHeightCm, pxPerCmX, pxPerCmY } = getTextScaleContext(shape);
      const dynamicMaxLineCm = getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textTransform.offsetY, pxPerCmY);
      const dynamicMaxThicknessCm = getDynamicThicknessMaxCm(shape, contentHeightCm, dynamicMaxLineCm);
      const safeLineLengthCm = Math.max(0.8, Math.min(dynamicMaxLineCm, Number(textTransform.lineLengthCm) || 0));
      const safeThicknessCm = Math.max(0.4, Math.min(dynamicMaxThicknessCm, Number(textTransform.fontThicknessCm) || 0));
      const maxWidth = Math.max(1, safeLineLengthCm * pxPerCmX);

      const safeFontFamily = CUSTOM_DESIGN_TEXT_FONT_FAMILY;
      const safeFontWeight = CUSTOM_DESIGN_TEXT_FONT_WEIGHT;
      const safeFontSize = Math.max(14, Math.min(180, safeThicknessCm * pxPerCmY));
      ctx.font = `${safeFontWeight} ${safeFontSize}px ${safeFontFamily}`;

      const lines = [];
      const textRows = trimmedText
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);

      const wrapRow = (rowText) => {
        const words = rowText.split(/\s+/).filter(Boolean);
        if (!words.length) return;
        let currentLine = "";

        words.forEach((word) => {
          const candidate = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
            currentLine = candidate;
            return;
          }

          lines.push(currentLine);
          if (ctx.measureText(word).width <= maxWidth) {
            currentLine = word;
            return;
          }

          let chunk = "";
          Array.from(word).forEach((char) => {
            const chunkCandidate = `${chunk}${char}`;
            if (ctx.measureText(chunkCandidate).width > maxWidth && chunk) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk = chunkCandidate;
            }
          });
          currentLine = chunk;
        });

        if (currentLine) lines.push(currentLine);
      };

      if (textRows.length) {
        textRows.forEach(wrapRow);
      } else {
        wrapRow(trimmedText);
      }
      if (!lines.length) return;

      ctx.save();
      drawShapePath(shape, "inner");
      ctx.clip();
      ctx.fillStyle = textTransform.fontColor || "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = "rtl";

      const lineHeight = Math.floor(safeFontSize * 1.2);
      const maxLines = Math.max(1, Math.floor(bounds.h / Math.max(lineHeight, 1)));
      const fittedLines = lines.slice(0, maxLines);
      const baseCenterYRatio = shape === "משולש" ? 0.58 : (shape === "משולש הפוך" ? 0.42 : 0.5);
      const centerY = bounds.y + bounds.h * baseCenterYRatio + textTransform.offsetY;
      const centerX = previewCanvas.width / 2 + textTransform.offsetX;
      let startY = centerY - ((fittedLines.length - 1) * lineHeight) / 2;
      const minY = bounds.y + lineHeight * 0.8;
      const maxStartY = bounds.y + bounds.h - Math.max(0, fittedLines.length - 1) * lineHeight - lineHeight * 0.35;
      if (startY < minY) startY = minY;
      if (startY > maxStartY) startY = maxStartY;

      fittedLines.forEach((lineText, i) => {
        const rowY = startY + i * lineHeight;
        ctx.fillText(lineText, centerX, rowY);
      });
      ctx.restore();
    }

    function drawUserImageOnBoard(file, shape) {
      return new Promise((resolve) => {
        if (!previewCtx || !previewCanvas || !file) {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          const imageAspectRatio = img.width / Math.max(img.height, 1);
          const fitRect = getImageContentBounds(shape, imageAspectRatio);
          const baseScale = fitRect.w / Math.max(img.width, 1);
          const finalScale = Math.max(0.01, baseScale * imageTransform.scale);
          const w = img.width * finalScale;
          const h = img.height * finalScale;
          const x = fitRect.x + (fitRect.w - w) / 2 + imageTransform.offsetX;
          const y = fitRect.y + (fitRect.h - h) / 2 + imageTransform.offsetY;
          previewCtx.save();
          drawShapePath(shape, "inner");
          previewCtx.clip();
          previewCtx.drawImage(img, x, y, w, h);
          previewCtx.restore();
          URL.revokeObjectURL(img.src);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = URL.createObjectURL(file);
      });
    }

    async function drawBaseImage(shape, renderId = null) {
      const geometry = buildShapeGeometry(shape);
      const usesTriangleAsset = shape === "משולש" || shape === "משולש הפוך";

      if (usesTriangleAsset && geometry && previewCtx && previewCanvas) {
        const img = await loadBlankShapeImage(blankImageByShape[shape]);
        if (renderId !== null && renderId !== previewRenderId) return;

        if (img) {
          const { width, height } = previewCanvas;
          previewCtx.clearRect(0, 0, width, height);
          previewCtx.fillStyle = "#ffffff";
          previewCtx.fillRect(0, 0, width, height);

          const target = fitImageInsideRect(img.naturalWidth || img.width, img.naturalHeight || img.height, geometry.outerBounds);
          previewCtx.save();
          previewCtx.imageSmoothingEnabled = true;
          previewCtx.imageSmoothingQuality = "high";
          previewCtx.drawImage(img, target.x, target.y, target.w, target.h);
          previewCtx.restore();
          baseImageFrame = target;
          return;
        }
      }

      drawFallbackBoard(shape);
      if (geometry) {
        baseImageFrame = {
          x: geometry.outerBounds.x,
          y: geometry.outerBounds.y,
          w: geometry.outerBounds.w,
          h: geometry.outerBounds.h
        };
      }
    }

    function drawStoredPreview(dataUrl) {
      return new Promise((resolve) => {
        if (!previewCtx || !previewCanvas || !dataUrl) {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          previewCtx.fillStyle = "#ffffff";
          previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
          const scale = Math.min(previewCanvas.width / img.width, previewCanvas.height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (previewCanvas.width - w) / 2;
          const y = (previewCanvas.height - h) / 2;
          baseImageFrame = { x, y, w, h };
          clearPreviewGeometryCaches();
          previewCtx.drawImage(img, x, y, w, h);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = dataUrl;
      });
    }

    function getHasCustomText() {
      const textInput = document.getElementById("customTextOptionInput");
      const textEnabled = textField?.element?.value === "כן";
      const textValue = String(textInput?.value || "").trim();
      return Boolean(textEnabled && textValue);
    }

    function getTextRangeModel(shape) {
      const { contentWidthCm, contentHeightCm, pxPerCmY } = getTextScaleContext(shape);
      const dynamicMaxLineCm = getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textTransform.offsetY, pxPerCmY);
      const dynamicMaxThicknessCm = getDynamicThicknessMaxCm(shape, contentHeightCm, dynamicMaxLineCm);
      return {
        minThicknessCm: 0.4,
        maxThicknessCm: dynamicMaxThicknessCm,
        minLineCm: 0.8,
        maxLineCm: dynamicMaxLineCm
      };
    }

    function getNaturalTextLineLengthCm(shape, thicknessCm, minLineCm, maxLineCm) {
      if (!previewCtx || !previewCanvas) return null;
      const textInput = document.getElementById("customTextOptionInput");
      const textValue = String(textInput?.value || "").trim();
      if (!textValue) return null;

      const { pxPerCmX, pxPerCmY } = getTextScaleContext(shape);
      const safeThicknessCm = Math.max(0.4, Number(thicknessCm) || 3);
      const safeFontSize = Math.max(14, Math.min(180, safeThicknessCm * pxPerCmY));
      const safeFontFamily = CUSTOM_DESIGN_TEXT_FONT_FAMILY;
      const safeFontWeight = CUSTOM_DESIGN_TEXT_FONT_WEIGHT;
      const rows = textValue
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);

      previewCtx.save();
      previewCtx.font = `${safeFontWeight} ${safeFontSize}px ${safeFontFamily}`;
      const longestLinePx = rows.reduce((maxWidth, row) => {
        return Math.max(maxWidth, previewCtx.measureText(row).width);
      }, 0);
      previewCtx.restore();

      if (!longestLinePx) return null;
      const naturalLineCm = (longestLinePx / Math.max(pxPerCmX, 0.001)) * 1.08;
      return Math.max(minLineCm, Math.min(maxLineCm, naturalLineCm));
    }

    function recalcTextControlRanges(shape, source = "none") {
      if (!previewCanvas) return;
      const hasCustomText = getHasCustomText();

      if (!hasCustomText) {
        textTransform.fontThicknessCm = 0;
        textTransform.lineLengthCm = 0;

        if (textFontThicknessInput) {
          textFontThicknessInput.min = "0";
          textFontThicknessInput.max = "0";
          textFontThicknessInput.value = "0";
          textFontThicknessInput.disabled = true;
        }

        if (textLineLengthInput) {
          textLineLengthInput.min = "0";
          textLineLengthInput.max = "0";
          textLineLengthInput.value = "0";
          textLineLengthInput.disabled = true;
        }
        return;
      }

      const { minThicknessCm, maxThicknessCm, minLineCm, maxLineCm } = getTextRangeModel(shape);

      if (textFontThicknessInput) {
        textFontThicknessInput.disabled = false;
        textFontThicknessInput.min = String(minThicknessCm.toFixed(2));
        textFontThicknessInput.max = String(maxThicknessCm.toFixed(2));
      }
      if (textLineLengthInput) {
        textLineLengthInput.disabled = false;
        textLineLengthInput.min = String(minLineCm.toFixed(2));
        textLineLengthInput.max = String(maxLineCm.toFixed(2));
      }

      const linkRatio = Math.max(3, Math.min(18, Number(textTransform.linkRatio) || 8));
      const defaultThicknessCm = Math.max(minThicknessCm, Math.min(maxThicknessCm, 3));

      if (source === "thickness") {
        const safeThickness = Math.max(minThicknessCm, Math.min(maxThicknessCm, Number(textTransform.fontThicknessCm) || defaultThicknessCm));
        const linkedLine = safeThickness * linkRatio;
        textTransform.fontThicknessCm = safeThickness;
        textTransform.lineLengthCm = Math.max(minLineCm, Math.min(maxLineCm, linkedLine));
        return;
      }

      if (source === "line") {
        const safeLine = Math.max(minLineCm, Math.min(maxLineCm, Number(textTransform.lineLengthCm) || minLineCm));
        const linkedThickness = safeLine / linkRatio;
        textTransform.lineLengthCm = safeLine;
        textTransform.fontThicknessCm = Math.max(minThicknessCm, Math.min(maxThicknessCm, linkedThickness));
        return;
      }

      const currentThickness = Number(textTransform.fontThicknessCm) || defaultThicknessCm;
      const safeThickness = Math.max(minThicknessCm, Math.min(maxThicknessCm, currentThickness));
      const linkedDefaultLine = Math.min(maxLineCm, Math.max(minLineCm, safeThickness * linkRatio));
      const naturalLine = getNaturalTextLineLengthCm(shape, safeThickness, minLineCm, maxLineCm);
      const currentLine = Number(textTransform.lineLengthCm) || linkedDefaultLine;

      textTransform.fontThicknessCm = safeThickness;
      textTransform.lineLengthCm = hasManualTextSizing
        ? Math.max(minLineCm, Math.min(maxLineCm, currentLine))
        : Math.max(minLineCm, Math.min(maxLineCm, naturalLine || linkedDefaultLine));
    }

    let hasCustomEdits = false;
    let hasManualTextSizing = false;
    let previewRenderId = 0;

    async function updateCustomBoardPreview() {
      const renderId = ++previewRenderId;
      const shape = shapeField?.element?.value || "מרובע";
      const textEnabled = textField?.element?.value === "כן";
      const imageEnabled = imageField?.element?.value === "כן";
      const textInput = document.getElementById("customTextOptionInput");
      const imageInput = document.getElementById("customImageOptionInput");
      const hasImageFile = Boolean(imageInput?.files?.[0]);
      resizePreviewCanvasForShape(shape);

      if (imageControlsWrapper) {
        imageControlsWrapper.style.display = imageEnabled ? "block" : "none";
      }
      if (designResetWrapper) {
        designResetWrapper.style.display = textEnabled || imageEnabled ? "block" : "none";
      }

      recalcTextControlRanges(shape, "none");

      if (!hasCustomEdits && restorePayload?.customDesignPreview) {
        await drawStoredPreview(restorePayload.customDesignPreview);
        return;
      }

      await drawBaseImage(shape, renderId);
      if (renderId !== previewRenderId) return;
      if (imageEnabled && hasImageFile) {
        const file = imageInput.files[0];
        await drawUserImageOnBoard(file, shape);
        if (renderId !== previewRenderId) return;
      }

      if (textEnabled) {
        const textValue = String(textInput?.value || "").trim();
        if (textValue) drawTextOnBoard(textValue, shape);
      }
    }

    const textFontColorInput = document.getElementById("customTextFontColor");
    const textFontThicknessInput = document.getElementById("customTextFontThickness");
    const textLineLengthInput = document.getElementById("customTextLineLength");
    const textOffsetXInput = document.getElementById("customTextOffsetX");
    const textOffsetYInput = document.getElementById("customTextOffsetY");
    const customTextInput = document.getElementById("customTextOptionInput");
    const customImageInput = document.getElementById("customImageOptionInput");
    const textOffsetXResetButton = document.getElementById("customTextOffsetXReset");
    const textOffsetYResetButton = document.getElementById("customTextOffsetYReset");
    const textFontThicknessValue = document.getElementById("customTextFontThicknessValue");
    const textLineLengthValue = document.getElementById("customTextLineLengthValue");
    const textOffsetXValue = document.getElementById("customTextOffsetXValue");
    const textOffsetYValue = document.getElementById("customTextOffsetYValue");

    const imageOffsetXInput = document.getElementById("customImageOffsetX");
    const imageOffsetYInput = document.getElementById("customImageOffsetY");
    const imageScaleInput = document.getElementById("customImageScale");
    const imageOffsetXResetButton = document.getElementById("customImageOffsetXReset");
    const imageOffsetYResetButton = document.getElementById("customImageOffsetYReset");
    const designPlacementResetButton = document.getElementById("customDesignPlacementReset");
    const imageOffsetXValue = document.getElementById("customImageOffsetXValue");
    const imageOffsetYValue = document.getElementById("customImageOffsetYValue");
    const imageScaleValue = document.getElementById("customImageScaleValue");
    if (imageScaleInput) {
      imageScaleInput.min = "20";
      imageScaleInput.max = "500";
      imageScaleInput.step = "5";
    }

    const formatCm = (value) => Number(value || 0).toFixed(2);

    const syncImageControls = () => {
      const currentShape = shapeField?.element?.value || "מרובע";
      resizePreviewCanvasForShape(currentShape);
      const { outerBounds, pxPerCmX, pxPerCmY } = getSignScaleContext(currentShape);
      const maxOffsetX = Math.max(20, Math.round(outerBounds.w * 0.5));
      const maxOffsetY = Math.max(20, Math.round(outerBounds.h * 0.5));
      imageTransform.offsetX = clamp(imageTransform.offsetX, -maxOffsetX, maxOffsetX);
      imageTransform.offsetY = clamp(imageTransform.offsetY, -maxOffsetY, maxOffsetY);

      if (imageOffsetXInput) {
        imageOffsetXInput.min = String(-maxOffsetX);
        imageOffsetXInput.max = String(maxOffsetX);
        imageOffsetXInput.value = String(Math.round(-imageTransform.offsetX));
      }
      if (imageOffsetYInput) {
        imageOffsetYInput.min = String(-maxOffsetY);
        imageOffsetYInput.max = String(maxOffsetY);
        imageOffsetYInput.value = String(Math.round(-imageTransform.offsetY));
      }
      if (imageScaleInput) imageScaleInput.value = String(Math.round(imageTransform.scale * 100));
      if (imageOffsetXValue) imageOffsetXValue.textContent = formatCm(imageTransform.offsetX / Math.max(pxPerCmX, 0.001));
      if (imageOffsetYValue) imageOffsetYValue.textContent = formatCm(imageTransform.offsetY / Math.max(pxPerCmY, 0.001));
      if (imageScaleValue) imageScaleValue.textContent = String(Math.round(imageTransform.scale * 100));
      if (imageOffsetXInput) imageOffsetXInput.dataset.cmValue = formatCm(imageTransform.offsetX / Math.max(pxPerCmX, 0.001));
      if (imageOffsetYInput) imageOffsetYInput.dataset.cmValue = formatCm(imageTransform.offsetY / Math.max(pxPerCmY, 0.001));
    };

    const syncTextControls = () => {
      const currentShape = shapeField?.element?.value || "מרובע";
      resizePreviewCanvasForShape(currentShape);
      recalcTextControlRanges(currentShape, "none");
      const textContext = getTextScaleContext(currentShape);
      const maxOffsetX = Math.max(20, Math.round(textContext.bounds.w * 0.5));
      const maxOffsetY = Math.max(20, Math.round(textContext.bounds.h * 0.5));
      textTransform.offsetX = clamp(textTransform.offsetX, -maxOffsetX, maxOffsetX);
      textTransform.offsetY = clamp(textTransform.offsetY, -maxOffsetY, maxOffsetY);

      if (textFontThicknessInput) textFontThicknessInput.value = String(textTransform.fontThicknessCm.toFixed(2));
      if (textLineLengthInput) textLineLengthInput.value = String(textTransform.lineLengthCm.toFixed(2));
      if (textOffsetXInput) {
        textOffsetXInput.min = String(-maxOffsetX);
        textOffsetXInput.max = String(maxOffsetX);
        textOffsetXInput.value = String(Math.round(textTransform.offsetX));
      }
      if (textOffsetYInput) {
        textOffsetYInput.min = String(-maxOffsetY);
        textOffsetYInput.max = String(maxOffsetY);
        textOffsetYInput.value = String(Math.round(textTransform.offsetY));
      }
      if (textFontColorInput) textFontColorInput.value = textTransform.fontColor;

      if (textFontThicknessValue) textFontThicknessValue.textContent = formatCm(textTransform.fontThicknessCm);
      if (textLineLengthValue) textLineLengthValue.textContent = formatCm(textTransform.lineLengthCm);
      if (textOffsetXValue) textOffsetXValue.textContent = formatCm(textTransform.offsetX / Math.max(textContext.pxPerCmX, 0.001));
      if (textOffsetYValue) textOffsetYValue.textContent = formatCm(textTransform.offsetY / Math.max(textContext.pxPerCmY, 0.001));
      if (textOffsetXInput) textOffsetXInput.dataset.cmValue = formatCm(textTransform.offsetX / Math.max(textContext.pxPerCmX, 0.001));
      if (textOffsetYInput) textOffsetYInput.dataset.cmValue = formatCm(textTransform.offsetY / Math.max(textContext.pxPerCmY, 0.001));
    };

    textFontColorInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      textTransform.fontColor = textFontColorInput.value || "#111827";
      syncTextControls();
      updateCustomBoardPreview();
    });
    textFontThicknessInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      hasManualTextSizing = true;
      textTransform.fontThicknessCm = Number(textFontThicknessInput.value || 0);
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "thickness");
      syncTextControls();
      updateCustomBoardPreview();
    });
    textLineLengthInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      hasManualTextSizing = true;
      textTransform.lineLengthCm = Number(textLineLengthInput.value || 0);
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "line");
      syncTextControls();
      updateCustomBoardPreview();
    });
    textOffsetXInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      textTransform.offsetX = Number(textOffsetXInput.value || 0);
      syncTextControls();
      updateCustomBoardPreview();
    });
    textOffsetYInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      textTransform.offsetY = Number(textOffsetYInput.value || 0);
      syncTextControls();
      updateCustomBoardPreview();
    });
    textOffsetXResetButton?.addEventListener("click", () => {
      hasCustomEdits = true;
      textTransform.offsetX = 0;
      syncTextControls();
      updateCustomBoardPreview();
    });
    textOffsetYResetButton?.addEventListener("click", () => {
      hasCustomEdits = true;
      textTransform.offsetY = 0;
      syncTextControls();
      updateCustomBoardPreview();
    });

    imageOffsetXInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      imageTransform.offsetX = -Number(imageOffsetXInput.value || 0);
      syncImageControls();
      updateCustomBoardPreview();
    });
    imageOffsetYInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      imageTransform.offsetY = -Number(imageOffsetYInput.value || 0);
      syncImageControls();
      updateCustomBoardPreview();
    });
    imageScaleInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      imageTransform.scale = Math.max(0.2, Math.min(5, Number(imageScaleInput.value || 100) / 100));
      syncImageControls();
      updateCustomBoardPreview();
    });
    imageOffsetXResetButton?.addEventListener("click", () => {
      hasCustomEdits = true;
      imageTransform.offsetX = 0;
      syncImageControls();
      updateCustomBoardPreview();
    });
    imageOffsetYResetButton?.addEventListener("click", () => {
      hasCustomEdits = true;
      imageTransform.offsetY = 0;
      syncImageControls();
      updateCustomBoardPreview();
    });
    designPlacementResetButton?.addEventListener("click", () => {
      hasCustomEdits = true;
      textTransform.offsetX = 0;
      textTransform.offsetY = 0;
      imageTransform.offsetX = 0;
      imageTransform.offsetY = 0;
      syncTextControls();
      syncImageControls();
      updateCustomBoardPreview();
    });

    shapeField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "none");
      syncTextControls();
      syncImageControls();
      updateCustomBoardPreview();
    });
    sizeField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "none");
      syncTextControls();
      syncImageControls();
      updateCustomBoardPreview();
    });
    textField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      syncTextControls();
      updateCustomBoardPreview();
    });
    imageField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      syncImageControls();
      updateCustomBoardPreview();
    });
    customTextInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      syncTextControls();
      updateCustomBoardPreview();
    });
    customImageInput?.addEventListener("change", async () => {
      hasCustomEdits = true;
      // Reset transforms so the uploaded image starts centered
      imageTransform.offsetX = 0;
      imageTransform.offsetY = 0;
      imageTransform.scale = 1;

      // Preload the image to ensure the preview drawing uses correct fit calculations
      const file = customImageInput.files?.[0];
      if (file) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => { URL.revokeObjectURL(url); resolve(); };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            img.src = url;
          });
        } catch (e) {
          // ignore preload errors
        }
      }

      syncImageControls();
      updateCustomBoardPreview();
    });

    const restoreOffsetPx = (rawValue, axis, shape) => {
      if (rawValue === undefined || rawValue === null || rawValue === "") return null;
      const numericValue = typeof rawValue === "number" ? rawValue : parseNumericValue(rawValue);
      if (!Number.isFinite(numericValue)) return null;

      if (typeof rawValue === "string" && rawValue.includes("ס")) {
        const scaleContext = getSignScaleContext(shape);
        return numericValue * (axis === "x" ? scaleContext.pxPerCmX : scaleContext.pxPerCmY);
      }

      return numericValue;
    };

    const collectCustomDesignState = () => {
      const shape = shapeField?.element?.value || "מרובע";
      const textContext = getTextScaleContext(shape);
      const signContext = getSignScaleContext(shape);
      const textInput = document.getElementById("customTextOptionInput");
      const notesInput = document.getElementById("customNotesOptionInput");

      return {
        shape,
        size: sizeField?.element?.value || "",
        textEnabled: textField?.element?.value || "לא",
        imageEnabled: imageField?.element?.value || "לא",
        textValue: String(textInput?.value || ""),
        notes: String(notesInput?.value || ""),
        textFontColor: textTransform.fontColor,
        textFontThicknessCm: Number(textTransform.fontThicknessCm) || 0,
        textLineLengthCm: Number(textTransform.lineLengthCm) || 0,
        textOffsetX: Number(textTransform.offsetX) || 0,
        textOffsetY: Number(textTransform.offsetY) || 0,
        textOffsetXCm: Number(formatCm(textTransform.offsetX / Math.max(textContext.pxPerCmX, 0.001))),
        textOffsetYCm: Number(formatCm(textTransform.offsetY / Math.max(textContext.pxPerCmY, 0.001))),
        imageOffsetX: Number(imageTransform.offsetX) || 0,
        imageOffsetY: Number(imageTransform.offsetY) || 0,
        imageOffsetXCm: Number(formatCm(imageTransform.offsetX / Math.max(signContext.pxPerCmX, 0.001))),
        imageOffsetYCm: Number(formatCm(imageTransform.offsetY / Math.max(signContext.pxPerCmY, 0.001))),
        imageScale: Number(imageTransform.scale) || 1,
        previewWidthPx: previewCanvas?.width || 0,
        previewHeightPx: previewCanvas?.height || 0
      };
    };

    if (previewCanvas) {
      previewCanvas.tscGetCustomDesignState = collectCustomDesignState;
    }

    if (restorePayload) {
      const applyFieldValue = (label, value) => {
        if (!value) return;
        const field = fields.find((f) => f.label === label);
        if (!field?.element) return;
        const option = Array.from(field.element.options).find((opt) => opt.value === value);
        if (option) {
          field.element.value = value;
          field.element.dispatchEvent(new Event("change"));
        }
      };

      hasCustomEdits = false;
      applyFieldValue("צורה", restorePayload.shape);
      applyFieldValue("גודל", restorePayload.size);
      applyFieldValue("כיתוב", restorePayload.textEnabled);
      applyFieldValue("תמונה", restorePayload.imageEnabled);

      const customTextInput = document.getElementById("customTextOptionInput");
      if (customTextInput && restorePayload.textValue) {
        customTextInput.value = restorePayload.textValue;
      }
      const customNotesInput = document.getElementById("customNotesOptionInput");
      if (customNotesInput && restorePayload.notes) {
        customNotesInput.value = restorePayload.notes;
      }
      if (restorePayload.textFontColor) textTransform.fontColor = restorePayload.textFontColor;
      let restoredTextSizing = false;
      if (restorePayload.textFontThicknessCm !== undefined) {
        const restoredThickness = parseNumericValue(restorePayload.textFontThicknessCm);
        if (Number.isFinite(restoredThickness)) {
          textTransform.fontThicknessCm = restoredThickness;
          restoredTextSizing = true;
        }
      }
      if (restorePayload.textLineLengthCm !== undefined) {
        const restoredLineLength = parseNumericValue(restorePayload.textLineLengthCm);
        if (Number.isFinite(restoredLineLength)) {
          textTransform.lineLengthCm = restoredLineLength;
          restoredTextSizing = true;
        }
      }
      if (restoredTextSizing) hasManualTextSizing = true;
      const restoreShape = shapeField?.element?.value || "מרובע";
      const restoredTextOffsetX = restoreOffsetPx(restorePayload.textOffsetX, "x", restoreShape);
      const restoredTextOffsetY = restoreOffsetPx(restorePayload.textOffsetY, "y", restoreShape);
      const restoredImageOffsetX = restoreOffsetPx(restorePayload.imageOffsetX, "x", restoreShape);
      const restoredImageOffsetY = restoreOffsetPx(restorePayload.imageOffsetY, "y", restoreShape);
      if (restoredTextOffsetX !== null) textTransform.offsetX = restoredTextOffsetX;
      if (restoredTextOffsetY !== null) textTransform.offsetY = restoredTextOffsetY;
      if (restoredImageOffsetX !== null) imageTransform.offsetX = restoredImageOffsetX;
      if (restoredImageOffsetY !== null) imageTransform.offsetY = restoredImageOffsetY;
      if (restorePayload.imageScale !== undefined) {
        const restoredScale = parseNumericValue(restorePayload.imageScale);
        const scaleValue = typeof restorePayload.imageScale === "string" && restorePayload.imageScale.includes("%")
          ? restoredScale / 100
          : restoredScale;
        imageTransform.scale = Math.max(0.2, Math.min(5, Number(scaleValue) || 1));
      }

      hasCustomEdits = false;
      syncTextControls();
      syncImageControls();
    }

    syncTextControls();
    syncImageControls();
    updateCustomBoardPreview();
  } else {
    const sizeField = fields.find((field) => field.label === "גודל");
    if (sizeField) {
      const inferredShape = inferShapeByProduct(productId, productTitle, productCategory);
      if (inferredShape) {
        setSelectValues(sizeField.element, getSizeOptionsByShape(inferredShape));
      }

      const sizeNote = document.createElement("div");
      sizeNote.className = "product-option";
      sizeNote.innerHTML = `<small class="text-muted">למידות שונות אנא צרו קשר</small>`;
      const sizeWrapper = sizeField.element.closest(".product-option");
      if (sizeWrapper && sizeWrapper.parentNode === optionsContainer) {
        sizeWrapper.insertAdjacentElement("afterend", sizeNote);
      } else {
        optionsContainer.appendChild(sizeNote);
      }
    }

    const textOptionField = fields.find((field) => field.label === "נוסח");
    if (textOptionField) {
      const customWrapper = document.createElement("div");
      customWrapper.className = "product-option";
      customWrapper.id = "customTextOptionWrapper";
      customWrapper.style.display = "none";
      customWrapper.innerHTML = `
        <label for="customTextOptionInput">הקלד נוסח מותאם</label>
        <input id="customTextOptionInput" type="text" class="form-control" placeholder="הכנס את הנוסח הרצוי" />
      `;
      optionsContainer.appendChild(customWrapper);

      const toggleCustomTextInput = () => {
        customWrapper.style.display =
          textOptionField.element.value === "מותאם אישית" ? "block" : "none";
      };

      textOptionField.element.addEventListener("change", toggleCustomTextInput);
      toggleCustomTextInput();
    }
  }

  const quantityWrapper = document.createElement("div");
  quantityWrapper.className = "product-option";
  quantityWrapper.innerHTML = `
    <label for="productQty">כמות</label>
    <input
      id="productQty"
      class="form-control"
      type="number"
      inputmode="numeric"
      min="1"
      max="50"
      step="1"
      value="1"
    />
  `;
  optionsContainer.appendChild(quantityWrapper);
  enableCustomSelectUi(optionsContainer);

  return fields;
}

function setupAddToCart(productId, product, optionFields) {
  const btn = document.getElementById("addToCartBtn");
  const feedback = document.getElementById("addToCartFeedback");
  const qtyField = document.getElementById("productQty");
  const readControlCm = (input) => {
    const cmValue = Number(input?.dataset?.cmValue);
    if (Number.isFinite(cmValue)) return cmValue.toFixed(2);
    return "0.00";
  };
  if (!btn || !feedback || !qtyField) return;
  qtyField.addEventListener("input", () => {
    const digitsOnly = String(qtyField.value || "").replace(/[^\d]/g, "");
    if (!digitsOnly) {
      qtyField.value = "";
      return;
    }
    const clamped = Math.min(50, Math.max(1, Number(digitsOnly)));
    qtyField.value = String(clamped);
  });

  const getCartImage = (images) => {
    if (productId === "safety-cones") {
      const mainImage = document.getElementById("mainProductImage");
      const selectedSrc = mainImage?.getAttribute("src") || mainImage?.src;
      if (selectedSrc) return selectedSrc;
    }

    const first = Array.isArray(images) ? images[0] : null;
    if (!first) return "/assets/Icons/TSCLogoSquared.webp";
    return first.fallback || first.full || first.thumb || "/assets/Icons/TSCLogoSquared.webp";
  };

  btn.addEventListener("click", () => {
    const selectedOptions = optionFields
      .filter((field) => {
        const wrapper = field.element?.closest(".product-option");
        return wrapper ? wrapper.style.display !== "none" : true;
      })
      .flatMap((field) => {
        if (typeof field.getValues === "function") {
          return field.getValues();
        }
        return [{
          name: field.label,
          value: field.element.value
        }];
      });

    const customTextInput = document.getElementById("customTextOptionInput");
    const customTextValue = customTextInput ? customTextInput.value.trim() : "";
    if (customTextValue) {
      selectedOptions.push({
        name: "נוסח מותאם",
        value: customTextValue
      });
    }

    const customImageInput = document.getElementById("customImageOptionInput");
    const selectedImageFile = customImageInput?.files?.[0];
    if (selectedImageFile) {
      selectedOptions.push({
        name: "תמונה מצורפת",
        value: selectedImageFile.name
      });
    }

    const customNotesInput = document.getElementById("customNotesOptionInput");
    const customNotesValue = customNotesInput ? customNotesInput.value.trim() : "";
    if (customNotesValue) {
      selectedOptions.push({
        name: "הערות",
        value: customNotesValue
      });
    }

    const textEnabledValue = optionFields.find((field) => field.label === "כיתוב")?.element?.value;
    if (textEnabledValue === "כן") {
      const textFontThicknessInput = document.getElementById("customTextFontThickness");
      const textLineLengthInput = document.getElementById("customTextLineLength");
      const textFontColorInput = document.getElementById("customTextFontColor");
      const textOffsetXInput = document.getElementById("customTextOffsetX");
      const textOffsetYInput = document.getElementById("customTextOffsetY");

      if (textFontThicknessInput?.value) {
        selectedOptions.push({ name: "עובי פונט", value: `${Number(textFontThicknessInput.value).toFixed(2)} ס\"מ` });
      }
      if (textLineLengthInput?.value) {
        selectedOptions.push({ name: "אורך שורה", value: `${Number(textLineLengthInput.value).toFixed(2)} ס\"מ` });
      }
      if (textFontColorInput?.value) {
        selectedOptions.push({ name: "צבע כיתוב", value: textFontColorInput.value });
      }
      if (textOffsetXInput?.value) {
        selectedOptions.push({ name: "מיקום אופקי כיתוב", value: `${readControlCm(textOffsetXInput)} ס\"מ` });
      }
      if (textOffsetYInput?.value) {
        selectedOptions.push({ name: "מיקום אנכי כיתוב", value: `${readControlCm(textOffsetYInput)} ס\"מ` });
      }
    }

    const imageEnabledValue = optionFields.find((field) => field.label === "תמונה")?.element?.value;
    if (imageEnabledValue === "כן" && selectedImageFile) {
      const imageOffsetXInput = document.getElementById("customImageOffsetX");
      const imageOffsetYInput = document.getElementById("customImageOffsetY");
      const imageScaleInput = document.getElementById("customImageScale");
      selectedOptions.push(
        { name: "מיקום אופקי תמונה", value: `${readControlCm(imageOffsetXInput)} ס\"מ` },
        { name: "מיקום אנכי תמונה", value: `${readControlCm(imageOffsetYInput)} ס\"מ` },
        { name: "גודל תמונה", value: `${Number(imageScaleInput?.value || 100).toFixed(0)}%` }
      );
    }

    const quantity = Math.min(50, Math.max(1, Number(qtyField.value || 1)));
    const cart = JSON.parse(localStorage.getItem(PRODUCT_CART_STORAGE_KEY) || "[]");
    const nextItem = {
      productId,
      title: product.title,
      category: product.category,
      image: getCartImage(product.images),
      quantity,
      options: selectedOptions,
      addedAt: new Date().toISOString()
    };

    if (productId === "custom-design-board") {
      const previewCanvas = document.getElementById("customBoardPreviewCanvas");
      if (previewCanvas instanceof HTMLCanvasElement) {
        try {
          const customDesignState = typeof previewCanvas.tscGetCustomDesignState === "function"
            ? previewCanvas.tscGetCustomDesignState()
            : null;
          const previewDataUrl = previewCanvas.toDataURL("image/jpeg", 0.86);
          nextItem.customDesignPreview = previewDataUrl;
          nextItem.image = previewDataUrl;
          if (customDesignState) {
            nextItem.customDesignState = customDesignState;
          }
          selectedOptions.push({
            name: "תצוגת עיצוב",
            value: "מצורפת להזמנה"
          });
        } catch {
          // Ignore canvas export failures and continue with regular item payload.
        }
      }
    }
    const existing = cart.find((item) => {
      if (item.productId !== nextItem.productId) return false;
      const a = item.options || [];
      const b = nextItem.options || [];
      if (a.length !== b.length) return false;
      return a.every((opt, idx) => opt.name === b[idx]?.name && opt.value === b[idx]?.value);
    });

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + nextItem.quantity;
    } else {
      cart.push(nextItem);
    }

    const complementarySelections = selectedOptions
      .filter((opt) => opt.name === "מוצרים משלימים")
      .map((opt) => opt.value);
    const shouldAddPoleProduct = complementarySelections.includes("עמוד");
    const shouldAddConnectorProduct = complementarySelections.includes("יחידת חיבור");
    if (shouldAddConnectorProduct) {
      const connectorType = selectedOptions.find((opt) => opt.name === "סוג יחידת חיבור")?.value || "3 צול";
      const connectorProduct = PRODUCT_CATALOG["connector-units-3-6-inch"] || {};
      const connectorItem = {
        productId: "connector-units-3-6-inch",
        title: connectorProduct.title || "יחידת חיבור",
        category: connectorProduct.category || "אביזרי בטיחות",
        image: getCartImage(connectorProduct.images),
        quantity,
        options: [{ name: "סוג יחידה", value: connectorType }],
        addedAt: new Date().toISOString()
      };

      const existingConnector = cart.find((item) => {
        if (item.productId !== connectorItem.productId) return false;
        const a = item.options || [];
        const b = connectorItem.options || [];
        if (a.length !== b.length) return false;
        return a.every((opt, idx) => opt.name === b[idx]?.name && opt.value === b[idx]?.value);
      });

      if (existingConnector) {
        existingConnector.quantity = (Number(existingConnector.quantity) || 1) + connectorItem.quantity;
      } else {
        cart.push(connectorItem);
      }
    }

    if (shouldAddPoleProduct) {
      const poleLength = selectedOptions.find((opt) => opt.name === "גובה עמוד 3 צול")?.value || "3 מטר";
      const poleProduct = PRODUCT_CATALOG["sign-post"] || {};
      const poleItem = {
        productId: "sign-post",
        title: poleProduct.title || "עמוד 3 צול",
        category: poleProduct.category || "אביזרי בטיחות",
        image: getCartImage(poleProduct.images),
        quantity,
        options: [{ name: "גובה", value: poleLength }],
        addedAt: new Date().toISOString()
      };

      const existingPole = cart.find((item) => {
        if (item.productId !== poleItem.productId) return false;
        const a = item.options || [];
        const b = poleItem.options || [];
        if (a.length !== b.length) return false;
        return a.every((opt, idx) => opt.name === b[idx]?.name && opt.value === b[idx]?.value);
      });

      if (existingPole) {
        existingPole.quantity = (Number(existingPole.quantity) || 1) + poleItem.quantity;
      } else {
        cart.push(poleItem);
      }
    }

    localStorage.setItem(PRODUCT_CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("tsc-cart-updated"));

    feedback.textContent = "המוצר נוסף לעגלה";
    setTimeout(() => {
      feedback.textContent = "";
    }, 2200);
  });
}

function renderNotFound() {
  const main = document.getElementById("main-content");
  if (!main) return;
  main.innerHTML = `
    <div class="alert alert-warning">
      המוצר לא נמצא. ניתן לחזור ל<a href="/store" class="alert-link">עמוד החנות</a>.
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductCatalog();

  const productId = getProductIdFromUrl();
  const product = PRODUCT_CATALOG[productId] || buildDynamicProduct(productId);
  let customDesignRestore = null;
  if (productId === "custom-design-board") {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(CUSTOM_DESIGN_RESTORE_KEY) || "null");
      if (parsed && parsed.productId === "custom-design-board") {
        customDesignRestore = parsed;
      }
    } catch {
      customDesignRestore = null;
    }
  }
  if (!productId || !product) {
    renderNotFound();
    return;
  }

  sessionStorage.setItem(LAST_PRODUCT_KEY, productId);

  const categoryEl = document.getElementById("productCategory");
  const titleEl = document.getElementById("productTitle");
  const descriptionEl = document.getElementById("productDescription");

  if (!categoryEl || !titleEl || !descriptionEl) return;

  document.title = `${product.title} | המרכז לבטיחות בתנועה`;
  categoryEl.textContent = product.category;
  titleEl.textContent = product.title;
  descriptionEl.textContent = product.description || "";

  renderGallery(product.images, product.title, product.description || product.title);
  const optionFields = renderOptions(
    product.options || [],
    productId,
    product.category || "",
    product.title || "",
    customDesignRestore
  );
  setupAddToCart(productId, product, optionFields);
});
