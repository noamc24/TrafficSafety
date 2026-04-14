const PRODUCT_CART_STORAGE_KEY = "tsc_cart";
const LAST_PRODUCT_KEY = "tsc_last_product_id";
const CUSTOM_DESIGN_RESTORE_KEY = "tsc_custom_design_restore";

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
    : "/assets/Icons/TSCLogoSquared.png";
  const qIdx = safeSrc.indexOf("?");
  const cleanSrc = qIdx >= 0 ? safeSrc.slice(0, qIdx) : safeSrc;
  const dotIdx = cleanSrc.lastIndexOf(".");
  if (dotIdx <= cleanSrc.lastIndexOf("/")) {
    return { full: cleanSrc, thumb: cleanSrc, fallback: cleanSrc };
  }

  // Convention: "<name>-thumb.webp" for thumbnails, "<name>.webp" for larger detail images.
  const stem = cleanSrc.slice(0, dotIdx);
  const normalizedStem = stem.endsWith("-thumb") ? stem.slice(0, -6) : stem;
  return {
    full: `${normalizedStem}.webp`,
    thumb: `${normalizedStem}-thumb.webp`,
    fallback: cleanSrc
  };
}

function normalizeProductImages(images = []) {
  if (!Array.isArray(images) || !images.length) {
    const fallback = "/assets/Icons/TSCLogoSquared.png";
    return [{ full: fallback, thumb: fallback, fallback }];
  }

  return images.map((entry) => {
    if (typeof entry === "string") {
      return buildImageVariants(entry);
    }

    if (entry && typeof entry === "object") {
      const full = entry.full || entry.src || entry.image || entry.thumb || entry.fallback || "/assets/Icons/TSCLogoSquared.png";
      const variants = buildImageVariants(full);
      return {
        full: entry.full || variants.full,
        thumb: entry.thumb || variants.thumb,
        fallback: entry.fallback || variants.fallback
      };
    }

    const fallback = "/assets/Icons/TSCLogoSquared.png";
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
        full: imageFromQuery || "/assets/Icons/TSCLogoSquared.png",
        thumb: thumbFromQuery || imageFromQuery || "/assets/Icons/TSCLogoSquared.png",
        fallback: imageFallbackFromQuery || "/assets/Icons/TSCLogoSquared.png"
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
    "ריבוע": ["20X20 ס\"מ", "50X50 ס\"מ", "60X60 ס\"מ", "100X100 ס\"מ"],
    "עיגול": ["קוטר 60 ס\"מ", "קוטר 80 ס\"מ", "קוטר 100 ס\"מ", "קוטר 120 ס\"מ"],
    "משולש": ["60 ס\"מ", "80 ס\"מ", "100 ס\"מ", "120 ס\"מ"],
    "משולש הפוך": ["60 ס\"מ", "80 ס\"מ", "100 ס\"מ", "120 ס\"מ"],
    "מתומן": ["קוטר 50 ס\"מ", "קוטר 60 ס\"מ", "קוטר 80 ס\"מ"],
    "מרובע": ["20X20 ס\"מ", "20X50 ס\"מ", "20X60 ס\"מ", "20X100 ס\"מ", "50X50 ס\"מ", "50X60 ס\"מ", "50X100 ס\"מ", "60X60 ס\"מ", "60X100 ס\"מ", "100X100 ס\"מ"]
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

function getMountingSubject(productId = "", category = "") {
  if (/^sign-\d+$/.test(productId || "")) return "תמרור";
  const normalizedCategory = String(category || "");
  if (normalizedCategory.includes("שלט")) return "שלט";
  if (normalizedCategory.includes("תמרור")) return "תמרור";
  return "מוצר";
}

function renderOptions(options, productId = "", productCategory = "", productTitle = "", restorePayload = null) {
  const optionsContainer = document.getElementById("productOptions");
  if (!optionsContainer) return [];

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

  options.forEach((option, index) => {
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

  if (shouldApplyMountingOptions(productId, productCategory)) {
    const mountingSubject = getMountingSubject(productId, productCategory);
    const mountingQuestionLabel = `על מה יישב ה${mountingSubject}?`;
    const hasInstallationField = fields.some((field) =>
      /התקנה|שיטת התקנה/.test(field.label || "")
    );

    if (!hasInstallationField) {
      const mountWrapper = document.createElement("div");
      mountWrapper.className = "product-option";
      mountWrapper.innerHTML = `
        <label for="productMountBase">${mountingQuestionLabel}</label>
        <select id="productMountBase" class="form-select">
          <option value="קיר">קיר</option>
          <option value="עמוד">עמוד</option>
        </select>
      `;
      optionsContainer.appendChild(mountWrapper);
      const mountSelect = mountWrapper.querySelector("select");
      fields.push({ label: mountingQuestionLabel, element: mountSelect });

      const connectorWrapper = document.createElement("div");
      connectorWrapper.className = "product-option";
      connectorWrapper.style.display = "none";
      connectorWrapper.innerHTML = `
        <label for="productConnectorUnit">יחידת חיבור</label>
        <select id="productConnectorUnit" class="form-select">
          <option value="ללא">ללא</option>
          <option value="3 צול">3 צול</option>
          <option value="6 צול">6 צול</option>
        </select>
      `;
      optionsContainer.appendChild(connectorWrapper);
      const connectorSelect = connectorWrapper.querySelector("select");
      fields.push({ label: "יחידת חיבור", element: connectorSelect });

      const toggleConnectorUnit = () => {
        connectorWrapper.style.display = mountSelect.value === "עמוד" ? "block" : "none";
      };
      mountSelect.addEventListener("change", toggleConnectorUnit);
      toggleConnectorUnit();
    }
  }

  if (productId === "safety-cones") {
    const colorField = fields.find((field) => field.label === "צבע");
    const heightField = fields.find((field) => field.label === "גובה");

    if (colorField && heightField) {
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

      colorField.element.addEventListener("change", updateConeHeightOptions);
      updateConeHeightOptions();
    }
  }

  if (productId === "custom-design-board") {
    const shapeField = fields.find((field) => field.label === "צורה");
    const sizeField = fields.find((field) => field.label === "גודל");
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
        <textarea id="customTextOptionInput" class="form-control" rows="3" dir="rtl" lang="he" placeholder="הכנס טקסט חופשי לשלט (אפשר גם ירידת שורה)"></textarea>
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
          <label class="custom-control-field" for="customTextFontFamily">
            <span>פונט</span>
            <select id="customTextFontFamily" class="form-select form-select-sm">
              <option value="Arial">Arial</option>
              <option value="'Rubik', Arial, sans-serif">Rubik</option>
              <option value="'Assistant', Arial, sans-serif">Assistant</option>
              <option value="'Noto Sans Hebrew', Arial, sans-serif">Noto Sans Hebrew</option>
            </select>
          </label>
          <label class="custom-control-field" for="customTextFontColor">
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
          <label class="custom-control-field custom-control-field--full" for="customTextOffsetX">
            <span>מיקום אופקי: <strong id="customTextOffsetXValue">0.00</strong> ס\"מ</span>
            <input id="customTextOffsetX" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
          </label>
          <label class="custom-control-field custom-control-field--full" for="customTextOffsetY">
            <span>מיקום אנכי: <strong id="customTextOffsetYValue">0.00</strong> ס\"מ</span>
            <input id="customTextOffsetY" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
          </label>
          <label class="custom-control-field custom-control-field--full" for="customTextLineWidth">
            <span>אורך שורה: <strong id="customTextLineWidthValue">92</strong>%</span>
            <input id="customTextLineWidth" type="range" class="form-range" min="40" max="100" step="1" value="92" />
          </label>
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
      fontFamily: "Arial",
      fontWeight: "700",
      lineWidthPercent: 92
    };

    let imageControlsWrapper = document.getElementById("customImageControlsWrapper");
    if (!imageControlsWrapper) {
      imageControlsWrapper = document.createElement("div");
      imageControlsWrapper.className = "product-option";
      imageControlsWrapper.id = "customImageControlsWrapper";
      imageControlsWrapper.style.display = "none";
      imageControlsWrapper.innerHTML = `
        <label>שליטה על התמונה</label>
        <div class="custom-image-controls__sliders">
          <label class="custom-control-field custom-control-field--full" for="customImageOffsetX">
            <span>רוחב: <strong id="customImageOffsetXValue">0</strong></span>
            <input id="customImageOffsetX" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
          </label>
          <label class="custom-control-field custom-control-field--full" for="customImageOffsetY">
            <span>גובה: <strong id="customImageOffsetYValue">0</strong></span>
            <input id="customImageOffsetY" type="range" class="form-range" min="-220" max="220" step="2" value="0" />
          </label>
          <label class="custom-control-field custom-control-field--full" for="customImageScale">
            <span>גודל תמונה: <strong id="customImageScaleValue">100</strong>%</span>
            <input id="customImageScale" type="range" class="form-range" min="35" max="250" step="5" value="100" />
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
      previewCanvas.style.display = "none";
      mainImage.insertAdjacentElement("afterend", previewCanvas);
    }
    const previewCtx = previewCanvas?.getContext("2d");

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

    function drawShapePath(shape) {
      if (!previewCtx || !previewCanvas) return;
      const ctx = previewCtx;
      const w = previewCanvas.width;
      const h = previewCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const min = Math.min(w, h);

      if (shape === "עיגול") {
        const r = min * 0.34;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        return;
      }
      if (shape === "משולש") {
        const size = min * 0.62;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size / 2);
        ctx.lineTo(cx + size / 2, cy + size / 2);
        ctx.lineTo(cx - size / 2, cy + size / 2);
        ctx.closePath();
        return;
      }
      if (shape === "משולש הפוך") {
        const size = min * 0.62;
        ctx.beginPath();
        ctx.moveTo(cx, cy + size / 2);
        ctx.lineTo(cx + size / 2, cy - size / 2);
        ctx.lineTo(cx - size / 2, cy - size / 2);
        ctx.closePath();
        return;
      }
      if (shape === "מתומן") {
        const r = min * 0.34;
        ctx.beginPath();
        for (let i = 0; i < 8; i += 1) {
          const a = ((Math.PI * 2) / 8) * i - Math.PI / 8;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        return;
      }
      if (shape === "ריבוע") {
        const size = min * 0.66;
        ctx.beginPath();
        ctx.rect(cx - size / 2, cy - size / 2, size, size);
        return;
      }

      const rw = w * 0.72;
      const rh = h * 0.48;
      ctx.beginPath();
      ctx.rect(cx - rw / 2, cy - rh / 2, rw, rh);
    }

    function getShapeContentBounds(shape) {
      if (!previewCanvas) return { x: 120, y: 120, w: 760, h: 510 };
      const w = previewCanvas.width;
      const h = previewCanvas.height;

      if (shape === "עיגול") return { x: w * 0.24, y: h * 0.20, w: w * 0.52, h: h * 0.60 };
      if (shape === "משולש" || shape === "משולש הפוך") return { x: w * 0.28, y: h * 0.24, w: w * 0.44, h: h * 0.52 };
      if (shape === "מתומן") return { x: w * 0.24, y: h * 0.20, w: w * 0.52, h: h * 0.60 };
      if (shape === "ריבוע") return { x: w * 0.24, y: h * 0.18, w: w * 0.52, h: h * 0.64 };
      return { x: w * 0.14, y: h * 0.26, w: w * 0.72, h: h * 0.48 };
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

      if (numericParts.length >= 2) {
        return { widthCm: numericParts[0], heightCm: numericParts[1] };
      }

      const sideCm = numericParts[0] || 60;
      return { widthCm: sideCm, heightCm: sideCm };
    }

    function getTextScaleContext(shape) {
      const sizeValue = sizeField?.element?.value || "";
      const bounds = getShapeContentBounds(shape);
      const dimensions = parseSizeToDimensionsCm(shape, sizeValue);
      const signWidthCm = Math.max(1, Number(dimensions.widthCm) || 1);
      const signHeightCm = Math.max(1, Number(dimensions.heightCm) || 1);
      const contentWidthRatio = bounds.w / previewCanvas.width;
      const contentHeightRatio = bounds.h / previewCanvas.height;
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

    function getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textOffsetY = 0, pxPerCmY = 1) {
      const offsetYcm = Number(textOffsetY || 0) / Math.max(pxPerCmY, 0.001);
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      if (shape === "משולש" || shape === "משולש הפוך") {
        const baseRatio = shape === "משולש" ? 0.62 : 0.38;
        const verticalRatio = clamp(baseRatio + (offsetYcm / Math.max(contentHeightCm, 0.001)), 0.12, 0.88);
        const widthRatio = shape === "משולש" ? verticalRatio : (1 - verticalRatio);
        return Math.max(3, contentWidthCm * widthRatio * 0.92);
      }

      if (shape === "עיגול") return Math.max(3, contentWidthCm * 0.78);
      if (shape === "מתומן") return Math.max(3, contentWidthCm * 0.82);
      return Math.max(3, contentWidthCm * 0.92);
    }

    function getDynamicThicknessMaxCm(shape, contentHeightCm, maxLineCm) {
      if (shape === "משולש" || shape === "משולש הפוך") {
        return Math.max(0.8, Math.min(contentHeightCm * 0.22, maxLineCm * 0.20));
      }
      if (shape === "עיגול" || shape === "מתומן") {
        return Math.max(0.8, Math.min(contentHeightCm * 0.36, maxLineCm * 0.24));
      }
      return Math.max(0.8, Math.min(contentHeightCm * 0.48, maxLineCm * 0.26));
    }

    function drawFallbackBoard(shape) {
      if (!previewCtx || !previewCanvas) return;
      const ctx = previewCtx;
      const { width, height } = previewCanvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 8;
      drawShapePath(shape);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function drawTextOnBoard(textValue, shape) {
      if (!previewCtx || !previewCanvas || !textValue) return;
      const ctx = previewCtx;
      const scaleContext = getTextScaleContext(shape);
      const { bounds, contentWidthCm, contentHeightCm, pxPerCmX, pxPerCmY } = scaleContext;
      const dynamicMaxLineCm = getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textTransform.offsetY, pxPerCmY);
      const dynamicMaxThicknessCm = getDynamicThicknessMaxCm(shape, contentHeightCm, dynamicMaxLineCm);
      const safeLineLengthCm = Math.max(3, Math.min(dynamicMaxLineCm, Number(textTransform.lineLengthCm) || 24));
      const safeThicknessCm = Math.max(0.8, Math.min(dynamicMaxThicknessCm, Number(textTransform.fontThicknessCm) || 3));
      const maxWidth = safeLineLengthCm * pxPerCmX;
      const bounds = getShapeContentBounds(shape);
      const safeLineWidthPercent = Math.max(40, Math.min(100, Number(textTransform.lineWidthPercent) || 92));
      const maxWidth = bounds.w * (safeLineWidthPercent / 100);
      const words = textValue.split(/\s+/).filter(Boolean);
      const lines = [];
      const textRows = String(textValue)
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);
      const safeFontSize = Math.max(16, Math.min(180, safeThicknessCm * pxPerCmY));
      const safeFontFamily = textTransform.fontFamily || "Arial";
      const safeFontWeight = textTransform.fontWeight || "700";
      ctx.font = `${safeFontWeight} ${safeFontSize}px ${safeFontFamily}`;

      const wrapRow = (rowText) => {
        const words = rowText.split(/\s+/).filter(Boolean);
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
        wrapRow(String(textValue).trim());
      }
      if (!lines.length) return;

      ctx.save();
      drawShapePath(shape);
      ctx.clip();
      ctx.fillStyle = textTransform.fontColor || "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = "rtl";
      const lineHeight = Math.floor(safeFontSize * 1.2);
      const maxLines = Math.max(1, Math.floor(bounds.h / lineHeight));
      const fittedLines = lines.slice(0, maxLines);
      const baseCenterYRatio = shape === "משולש" ? 0.56 : (shape === "משולש הפוך" ? 0.40 : 0.33);
      const centerY = bounds.y + bounds.h * baseCenterYRatio + textTransform.offsetY;
      const baseCenterYRatio = shape === "משולש" ? 0.56 : (shape === "משולש הפוך" ? 0.40 : 0.33);
      const centerY = bounds.y + bounds.h * baseCenterYRatio + textTransform.offsetY;
      const centerX = previewCanvas.width / 2 + textTransform.offsetX;
      let startY = centerY - ((fittedLines.length - 1) * lineHeight) / 2;
      const minY = bounds.y + lineHeight * 0.8;
      if (startY < minY) startY = minY;

      fittedLines.forEach((lineText, i) => {
        const rowY = startY + i * lineHeight;
        ctx.fillText(lineText, centerX, rowY, maxWidth);
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
          const bounds = getShapeContentBounds(shape);
          const maxW = bounds.w * 0.85;
          const maxH = bounds.h * 0.5;
          const baseScale = Math.min(maxW / img.width, maxH / img.height, 1);
          const finalScale = baseScale * imageTransform.scale;
          const w = img.width * finalScale;
          const h = img.height * finalScale;
          const x = bounds.x + (bounds.w - w) / 2 + imageTransform.offsetX;
          const y = bounds.y + bounds.h * 0.62 - h / 2 + imageTransform.offsetY;
          previewCtx.save();
          drawShapePath(shape);
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

    function drawBaseImage(shape) {
      return new Promise((resolve) => {
        if (!previewCtx || !previewCanvas) {
          resolve();
          return;
        }
        const src = blankImageByShape[shape];
        if (!src) {
          drawFallbackBoard(shape);
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
          previewCtx.drawImage(img, x, y, w, h);
          resolve();
        };
        img.onerror = () => {
          drawFallbackBoard(shape);
          resolve();
        };
        img.src = src;
      });
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
          previewCtx.drawImage(img, x, y, w, h);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = dataUrl;
      });
    }

    let hasCustomEdits = false;

    async function updateCustomBoardPreview() {
      const shape = shapeField?.element?.value || "מרובע";
      const textEnabled = textField?.element?.value === "כן";
      const imageEnabled = imageField?.element?.value === "כן";
      const textInput = document.getElementById("customTextOptionInput");
      const imageInput = document.getElementById("customImageOptionInput");
      const hasImageFile = Boolean(imageInput?.files?.[0]);

      if (imageControlsWrapper) {
        imageControlsWrapper.style.display = imageEnabled ? "block" : "none";
      }

      if (!hasCustomEdits && restorePayload?.customDesignPreview) {
        await drawStoredPreview(restorePayload.customDesignPreview);
        return;
      }

      await drawBaseImage(shape);
      if (imageEnabled && hasImageFile) {
        const file = imageInput.files[0];
        await drawUserImageOnBoard(file, shape);
      }
      if (textEnabled) {
        const textValue = textInput?.value?.trim() || "";
        drawTextOnBoard(textValue, shape);
      }
    }

    const textFontFamilyInput = document.getElementById("customTextFontFamily");
    const textFontColorInput = document.getElementById("customTextFontColor");
    const textFontThicknessInput = document.getElementById("customTextFontThickness");
    const textLineLengthInput = document.getElementById("customTextLineLength");
    const textOffsetXInput = document.getElementById("customTextOffsetX");
    const textOffsetYInput = document.getElementById("customTextOffsetY");
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    const textLineWidthInput = document.getElementById("customTextLineWidth");
    const textFontSizeValue = document.getElementById("customTextFontSizeValue");
    const textOffsetXValue = document.getElementById("customTextOffsetXValue");
    const textOffsetYValue = document.getElementById("customTextOffsetYValue");
    const textLineWidthValue = document.getElementById("customTextLineWidthValue");

    const imageOffsetXInput = document.getElementById("customImageOffsetX");
    const imageOffsetYInput = document.getElementById("customImageOffsetY");
    const imageScaleInput = document.getElementById("customImageScale");
    const imageOffsetXValue = document.getElementById("customImageOffsetXValue");
    const imageOffsetYValue = document.getElementById("customImageOffsetYValue");
    const imageScaleValue = document.getElementById("customImageScaleValue");
    const pxToCm = (pxValue) => (Number(pxValue || 0) / 37.8).toFixed(2);

    const recalcTextControlRanges = (shape, source = "thickness") => {
      if (!previewCanvas) return;

      const { contentWidthCm, contentHeightCm } = getTextScaleContext(shape);
      const maxThicknessCm = Math.max(0.8, Math.min(contentHeightCm * 0.78, contentWidthCm * 0.42));
      const minThicknessCm = 0.8;
      const maxLineCm = Math.max(4, contentWidthCm * 0.95);
      const minLineCm = 4;

      const { contentWidthCm, contentHeightCm, pxPerCmY } = getTextScaleContext(shape);
      const maxLineCm = getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textTransform.offsetY, pxPerCmY);
      const maxThicknessCm = getDynamicThicknessMaxCm(shape, contentHeightCm, maxLineCm);
      const minThicknessCm = 0.8;
      const minLineCm = 3;

      if (textFontThicknessInput) {
        textFontThicknessInput.min = String(minThicknessCm);
        textFontThicknessInput.max = String(maxThicknessCm);
      }
      if (textLineLengthInput) {
        textLineLengthInput.min = String(minLineCm);
        textLineLengthInput.max = String(maxLineCm);
      }

      const ratio = Math.max(2, Math.min(16, Number(textTransform.linkRatio) || 8));

      if (source === "thickness") {
        textTransform.fontThicknessCm = Math.max(minThicknessCm, Math.min(maxThicknessCm, Number(textTransform.fontThicknessCm) || 3));
        textTransform.lineLengthCm = Math.max(minLineCm, Math.min(maxLineCm, textTransform.fontThicknessCm * ratio));
      } else if (source === "line") {
        textTransform.lineLengthCm = Math.max(minLineCm, Math.min(maxLineCm, Number(textTransform.lineLengthCm) || 24));
        textTransform.fontThicknessCm = Math.max(minThicknessCm, Math.min(maxThicknessCm, textTransform.lineLengthCm / ratio));
      } else {
        textTransform.fontThicknessCm = Math.max(minThicknessCm, Math.min(maxThicknessCm, Number(textTransform.fontThicknessCm) || 3));
        textTransform.lineLengthCm = Math.max(minLineCm, Math.min(maxLineCm, Number(textTransform.lineLengthCm) || (textTransform.fontThicknessCm * ratio)));
      }
    };

    const syncImageControls = () => {
      if (imageOffsetXInput) imageOffsetXInput.value = String(Math.round(imageTransform.offsetX));
      if (imageOffsetYInput) imageOffsetYInput.value = String(Math.round(imageTransform.offsetY));
      if (imageScaleInput) imageScaleInput.value = String(Math.round(imageTransform.scale * 100));
      if (imageOffsetXValue) imageOffsetXValue.textContent = String(Math.round(imageTransform.offsetX));
      if (imageOffsetYValue) imageOffsetYValue.textContent = String(Math.round(imageTransform.offsetY));
      if (imageScaleValue) imageScaleValue.textContent = String(Math.round(imageTransform.scale * 100));
    };

    const syncTextControls = () => {
      const currentShape = shapeField?.element?.value || "מרובע";
      recalcTextControlRanges(currentShape, "none");
      if (textFontThicknessInput) textFontThicknessInput.value = String(textTransform.fontThicknessCm.toFixed(2));
      if (textLineLengthInput) textLineLengthInput.value = String(textTransform.lineLengthCm.toFixed(2));
      if (textOffsetXInput) textOffsetXInput.value = String(Math.round(textTransform.offsetX));
      if (textOffsetYInput) textOffsetYInput.value = String(Math.round(textTransform.offsetY));
      if (textLineWidthInput) textLineWidthInput.value = String(Math.round(textTransform.lineWidthPercent));
      if (textFontColorInput) textFontColorInput.value = textTransform.fontColor;
      if (textFontFamilyInput) textFontFamilyInput.value = textTransform.fontFamily;
      if (textFontSizeValue) textFontSizeValue.textContent = String(Math.round(textTransform.fontSize));
      if (textOffsetXValue) textOffsetXValue.textContent = String(Math.round(textTransform.offsetX));
      if (textOffsetYValue) textOffsetYValue.textContent = String(Math.round(textTransform.offsetY));
      if (textLineWidthValue) textLineWidthValue.textContent = String(Math.round(textTransform.lineWidthPercent));
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    };

    textFontFamilyInput?.addEventListener("change", () => {
      hasCustomEdits = true;
      textTransform.fontFamily = textFontFamilyInput.value;
      updateCustomBoardPreview();
    });
    textFontColorInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      textTransform.fontColor = textFontColorInput.value || "#111827";
      syncTextControls();
      updateCustomBoardPreview();
    });
    textFontThicknessInput?.addEventListener("input", () => {

      hasCustomEdits = true;
      textTransform.fontThicknessCm = Number(textFontThicknessInput.value || 3);
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "thickness");
      syncTextControls();
      updateCustomBoardPreview();
    });
    textLineLengthInput?.addEventListener("input", () => {
      hasCustomEdits = true;

      hasCustomEdits = true;
      textTransform.fontThicknessCm = Number(textFontThicknessInput.value || 3);
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "thickness");
      syncTextControls();
      updateCustomBoardPreview();
    });
    textLineLengthInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      textTransform.lineLengthCm = Number(textLineLengthInput.value || 24);
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
    textLineWidthInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      textTransform.lineWidthPercent = Number(textLineWidthInput.value || 92);
      syncTextControls();
      updateCustomBoardPreview();
    });

    imageOffsetXInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      imageTransform.offsetX = Number(imageOffsetXInput.value || 0);
      syncImageControls();
      updateCustomBoardPreview();
    });
    imageOffsetYInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      imageTransform.offsetY = Number(imageOffsetYInput.value || 0);
      syncImageControls();
      updateCustomBoardPreview();
    });
    imageScaleInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      imageTransform.scale = Math.max(0.35, Math.min(2.5, Number(imageScaleInput.value || 100) / 100));
      syncImageControls();
      updateCustomBoardPreview();
    });

    shapeField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "none");
      syncTextControls();
      updateCustomBoardPreview();
    });
    sizeField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "none");
      syncTextControls();
      updateCustomBoardPreview();
    });
    textField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      updateCustomBoardPreview();
    });
    imageField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      updateCustomBoardPreview();
    });
    document.addEventListener("input", (event) => {
      if (event.target && event.target.id === "customTextOptionInput") {
        hasCustomEdits = true;
        updateCustomBoardPreview();
      }
    });
    document.addEventListener("change", (event) => {
      if (event.target && event.target.id === "customImageOptionInput") {
        hasCustomEdits = true;
        imageTransform.offsetX = 0;
        imageTransform.offsetY = 0;
        imageTransform.scale = 1;
        syncImageControls();
        updateCustomBoardPreview();
      }
    });

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
      if (restorePayload.textFontFamily) textTransform.fontFamily = restorePayload.textFontFamily;
      if (restorePayload.textFontColor) textTransform.fontColor = restorePayload.textFontColor;
      if (restorePayload.textFontThicknessCm) textTransform.fontThicknessCm = Number(restorePayload.textFontThicknessCm) || 3;
      if (restorePayload.textLineLengthCm) textTransform.lineLengthCm = Number(restorePayload.textLineLengthCm) || 24;
      if (restorePayload.textOffsetX) textTransform.offsetX = Number(restorePayload.textOffsetX) || 0;
      if (restorePayload.textOffsetY) textTransform.offsetY = Number(restorePayload.textOffsetY) || 0;
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "none");

      if (restorePayload.textLineWidthPercent) {
        textTransform.lineWidthPercent = Number(restorePayload.textLineWidthPercent) || 92;
      }
 
=======
      if (restorePayload.textLineWidthPercent) {
        textTransform.lineWidthPercent = Number(restorePayload.textLineWidthPercent) || 92;
      }
>>>>>>> theirs
=======
      if (restorePayload.textLineWidthPercent) {
        textTransform.lineWidthPercent = Number(restorePayload.textLineWidthPercent) || 92;
      }
>>>>>>> theirs
=======
      if (restorePayload.textLineWidthPercent) {
        textTransform.lineWidthPercent = Number(restorePayload.textLineWidthPercent) || 92;
      }
>>>>>>> theirs
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
    <select id="productQty" class="form-select">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
    </select>
  `;
  optionsContainer.appendChild(quantityWrapper);

  return fields;
}

function setupAddToCart(productId, product, optionFields) {
  const btn = document.getElementById("addToCartBtn");
  const feedback = document.getElementById("addToCartFeedback");
  const qtyField = document.getElementById("productQty");
  const pxToCm = (pxValue) => (Number(pxValue || 0) / 37.8).toFixed(2);
  if (!btn || !feedback || !qtyField) return;

  const getCartImage = (images) => {
    const first = Array.isArray(images) ? images[0] : null;
    if (!first) return "/assets/Icons/TSCLogoSquared.png";
    return first.fallback || first.full || first.thumb || "/assets/Icons/TSCLogoSquared.png";
  };

  btn.addEventListener("click", () => {
    const selectedOptions = optionFields
      .filter((field) => {
        const wrapper = field.element?.closest(".product-option");
        return wrapper ? wrapper.style.display !== "none" : true;
      })
      .map((field) => ({
        name: field.label,
        value: field.element.value
      }));

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
      const textFontFamilyInput = document.getElementById("customTextFontFamily");
      const textFontThicknessInput = document.getElementById("customTextFontThickness");
      const textLineLengthInput = document.getElementById("customTextLineLength");
      const textFontColorInput = document.getElementById("customTextFontColor");
      const textOffsetXInput = document.getElementById("customTextOffsetX");
      const textOffsetYInput = document.getElementById("customTextOffsetY");
      const textLineWidthInput = document.getElementById("customTextLineWidth");

      if (textFontFamilyInput?.value) {
        selectedOptions.push({ name: "פונט כיתוב", value: textFontFamilyInput.value });
      }
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
        selectedOptions.push({ name: "מיקום אופקי כיתוב", value: `${pxToCm(textOffsetXInput.value)} ס\"מ` });
      }
      if (textOffsetYInput?.value) {
        selectedOptions.push({ name: "מיקום אנכי כיתוב", value: `${pxToCm(textOffsetYInput.value)} ס\"מ` });
      }
      if (textLineWidthInput?.value) {
        selectedOptions.push({ name: "אורך שורה", value: `${textLineWidthInput.value}%` });
      }
      if (textLineWidthInput?.value) {
        selectedOptions.push({ name: "אורך שורה", value: `${textLineWidthInput.value}%` });
      }
      if (textLineWidthInput?.value) {
        selectedOptions.push({ name: "אורך שורה", value: `${textLineWidthInput.value}%` });
      }
      if (textLineWidthInput?.value) {
        selectedOptions.push({ name: "אורך שורה", value: `${textLineWidthInput.value}%` });
      }
    }

    const quantity = Number(qtyField.value || 1);
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
          const previewDataUrl = previewCanvas.toDataURL("image/jpeg", 0.86);
          nextItem.customDesignPreview = previewDataUrl;
          nextItem.image = previewDataUrl;
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

    const connectorOption = selectedOptions.find((opt) => opt.name === "יחידת חיבור");
    const connectorType = connectorOption?.value;
    const shouldAddConnectorProduct = connectorType === "3 צול" || connectorType === "6 צול";
    if (shouldAddConnectorProduct) {
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
<<<<<<< ours
});
=======
});

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
