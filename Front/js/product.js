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
              <option value="Rubik">Rubik</option>
              <option value="Assistant">Assistant</option>
              <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
            </select>
          </label>
          <div class="custom-control-field custom-control-field--color-reset">
            <label for="customTextFontColor">
              <span>צבע טקסט</span>
              <input id="customTextFontColor" type="color" class="form-control form-control-color" value="#111827" />
            </label>
            <button id="customTextResetButton" type="button" class="btn btn-outline-secondary btn-sm custom-text-reset-btn">אפס</button>
          </div>
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
      linkRatio: 8
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

    const shapeGeometryCache = new Map();
    const imageBoundsCache = new Map();
    const clearPreviewGeometryCaches = () => {
      shapeGeometryCache.clear();
      imageBoundsCache.clear();
    };

    const clonePoint = (point) => ({ x: point.x, y: point.y });

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

    function buildShapeGeometry(shape) {
      if (!previewCanvas) return null;
      const cacheKey = `${shape}:${previewCanvas.width}x${previewCanvas.height}:${baseImageFrame.x.toFixed(2)}:${baseImageFrame.y.toFixed(2)}:${baseImageFrame.w.toFixed(2)}:${baseImageFrame.h.toFixed(2)}`;
      if (shapeGeometryCache.has(cacheKey)) return shapeGeometryCache.get(cacheKey);

      const frame = baseImageFrame || { x: 0, y: 0, w: previewCanvas.width, h: previewCanvas.height };
      const w = frame.w;
      const h = frame.h;
      const cx = frame.x + w / 2;
      const cy = frame.y + h / 2;
      const min = Math.min(w, h);
      const borderInset = min * 0.048;

      let geometry = null;
      if (shape === "עיגול") {
        const outerRadius = min * 0.34;
        const innerRadius = Math.max(8, outerRadius - borderInset);
        geometry = {
          kind: "circle",
          cx,
          cy,
          outerRadius,
          innerRadius,
          outerBounds: { x: cx - outerRadius, y: cy - outerRadius, w: outerRadius * 2, h: outerRadius * 2 },
          innerBounds: { x: cx - innerRadius, y: cy - innerRadius, w: innerRadius * 2, h: innerRadius * 2 }
        };
      } else if (shape === "משולש" || shape === "משולש הפוך") {
        const size = min * 0.62;
        const half = size / 2;
        const outerVertices = shape === "משולש"
          ? [
            { x: cx, y: cy - half },
            { x: cx + half, y: cy + half },
            { x: cx - half, y: cy + half }
          ]
          : [
            { x: cx, y: cy + half },
            { x: cx + half, y: cy - half },
            { x: cx - half, y: cy - half }
          ];
        const innerVertices = insetPolygon(outerVertices, cx, cy, borderInset);
        geometry = {
          kind: "polygon",
          cx,
          cy,
          outerVertices,
          innerVertices,
          outerBounds: getPolygonBounds(outerVertices),
          innerBounds: getPolygonBounds(innerVertices)
        };
      } else if (shape === "מתומן") {
        const radius = min * 0.34;
        const outerVertices = createRegularPolygon(cx, cy, radius, 8, -Math.PI / 8);
        const innerVertices = insetPolygon(outerVertices, cx, cy, borderInset);
        geometry = {
          kind: "polygon",
          cx,
          cy,
          outerVertices,
          innerVertices,
          outerBounds: getPolygonBounds(outerVertices),
          innerBounds: getPolygonBounds(innerVertices)
        };
      } else if (shape === "ריבוע") {
        const size = min * 0.66;
        const innerSize = Math.max(10, size - borderInset * 2);
        geometry = {
          kind: "rect",
          cx,
          cy,
          outerBounds: { x: cx - size / 2, y: cy - size / 2, w: size, h: size },
          innerBounds: { x: cx - innerSize / 2, y: cy - innerSize / 2, w: innerSize, h: innerSize }
        };
      } else {
        const rw = w * 0.72;
        const rh = h * 0.48;
        const innerW = Math.max(10, rw - borderInset * 2);
        const innerH = Math.max(10, rh - borderInset * 2);
        geometry = {
          kind: "rect",
          cx,
          cy,
          outerBounds: { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh },
          innerBounds: { x: cx - innerW / 2, y: cy - innerH / 2, w: innerW, h: innerH }
        };
      }

      shapeGeometryCache.set(cacheKey, geometry);
      return geometry;
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

      if (geometry.kind === "rect") {
        const rect = useInner ? geometry.innerBounds : geometry.outerBounds;
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
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
      if (geometry.kind === "rect") {
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
        bounds = findBestRectInPolygon(geometry.innerVertices.map(clonePoint), safeAspect);
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
      const trimmedText = String(textValue || "").trim();
      if (!trimmedText) return;

      const { bounds, contentWidthCm, contentHeightCm, pxPerCmX, pxPerCmY } = getTextScaleContext(shape);
      const dynamicMaxLineCm = getDynamicLineLengthCm(shape, contentWidthCm, contentHeightCm, textTransform.offsetY, pxPerCmY);
      const dynamicMaxThicknessCm = getDynamicThicknessMaxCm(shape, contentHeightCm, dynamicMaxLineCm);
      const safeLineLengthCm = Math.max(0.8, Math.min(dynamicMaxLineCm, Number(textTransform.lineLengthCm) || 0));
      const safeThicknessCm = Math.max(0.4, Math.min(dynamicMaxThicknessCm, Number(textTransform.fontThicknessCm) || 0));
      const maxWidth = Math.max(1, safeLineLengthCm * pxPerCmX);

      const fontFamilyMap = {
        Arial: 'Arial, sans-serif',
        Rubik: '"Rubik", Arial, sans-serif',
        Assistant: '"Assistant", Arial, sans-serif',
        'Noto Sans Hebrew': '"Noto Sans Hebrew", Arial, sans-serif'
      };
      const selectedFont = textTransform.fontFamily || "Arial";
      const safeFontFamily = fontFamilyMap[selectedFont] || fontFamilyMap.Arial;
      const safeFontWeight = textTransform.fontWeight || "700";
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
          baseImageFrame = { x, y, w, h };
          clearPreviewGeometryCaches();
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

      const linkRatio = Math.max(2, Math.min(16, Number(textTransform.linkRatio) || 8));

      if (source === "thickness") {
        const safeThickness = Math.max(minThicknessCm, Math.min(maxThicknessCm, Number(textTransform.fontThicknessCm) || minThicknessCm));
        const safeLine = Math.max(minLineCm, Math.min(maxLineCm, safeThickness * linkRatio));
        textTransform.fontThicknessCm = safeThickness;
        textTransform.lineLengthCm = safeLine;
        return;
      }

      if (source === "line") {
        const safeLine = Math.max(minLineCm, Math.min(maxLineCm, Number(textTransform.lineLengthCm) || minLineCm));
        const safeThickness = Math.max(minThicknessCm, Math.min(maxThicknessCm, safeLine / linkRatio));
        textTransform.lineLengthCm = safeLine;
        textTransform.fontThicknessCm = safeThickness;
        return;
      }

      const currentThickness = Number(textTransform.fontThicknessCm) || minThicknessCm;
      const currentLine = Number(textTransform.lineLengthCm) || (currentThickness * linkRatio);
      textTransform.fontThicknessCm = Math.max(minThicknessCm, Math.min(maxThicknessCm, currentThickness));
      textTransform.lineLengthCm = Math.max(minLineCm, Math.min(maxLineCm, currentLine));
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

      recalcTextControlRanges(shape, "none");

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
        const textValue = String(textInput?.value || "").trim();
        if (textValue) drawTextOnBoard(textValue, shape);
      }
    }

    const textFontFamilyInput = document.getElementById("customTextFontFamily");
    const textFontColorInput = document.getElementById("customTextFontColor");
    const textFontThicknessInput = document.getElementById("customTextFontThickness");
    const textLineLengthInput = document.getElementById("customTextLineLength");
    const textOffsetXInput = document.getElementById("customTextOffsetX");
    const textOffsetYInput = document.getElementById("customTextOffsetY");
    const customTextInput = document.getElementById("customTextOptionInput");
    const customImageInput = document.getElementById("customImageOptionInput");
    const textResetButton = document.getElementById("customTextResetButton");
    const textFontThicknessValue = document.getElementById("customTextFontThicknessValue");
    const textLineLengthValue = document.getElementById("customTextLineLengthValue");
    const textOffsetXValue = document.getElementById("customTextOffsetXValue");
    const textOffsetYValue = document.getElementById("customTextOffsetYValue");

    const imageOffsetXInput = document.getElementById("customImageOffsetX");
    const imageOffsetYInput = document.getElementById("customImageOffsetY");
    const imageScaleInput = document.getElementById("customImageScale");
    const imageOffsetXValue = document.getElementById("customImageOffsetXValue");
    const imageOffsetYValue = document.getElementById("customImageOffsetYValue");
    const imageScaleValue = document.getElementById("customImageScaleValue");
    if (imageScaleInput) {
      imageScaleInput.min = "20";
      imageScaleInput.max = "500";
      imageScaleInput.step = "5";
    }

    const formatCm = (value) => Number(value || 0).toFixed(2);

    const resetTextTransform = () => {
      textTransform.fontColor = "#111827";
      textTransform.fontFamily = "Arial";
      textTransform.offsetX = 0;
      textTransform.offsetY = 0;
      textTransform.fontThicknessCm = 3;
      textTransform.lineLengthCm = 24;
    };

    const syncImageControls = () => {
      if (imageOffsetXInput) imageOffsetXInput.value = String(Math.round(-imageTransform.offsetX));
      if (imageOffsetYInput) imageOffsetYInput.value = String(Math.round(-imageTransform.offsetY));
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
      if (textFontColorInput) textFontColorInput.value = textTransform.fontColor;
      if (textFontFamilyInput) textFontFamilyInput.value = textTransform.fontFamily;

      if (textFontThicknessValue) textFontThicknessValue.textContent = formatCm(textTransform.fontThicknessCm);
      if (textLineLengthValue) textLineLengthValue.textContent = formatCm(textTransform.lineLengthCm);
      if (textOffsetXValue) textOffsetXValue.textContent = formatCm(textTransform.offsetX / 37.8);
      if (textOffsetYValue) textOffsetYValue.textContent = formatCm(textTransform.offsetY / 37.8);
    };

    textFontFamilyInput?.addEventListener("change", async () => {
      hasCustomEdits = true;
      textTransform.fontFamily = textFontFamilyInput.value || "Arial";
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
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
      textTransform.fontThicknessCm = Number(textFontThicknessInput.value || 0);
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "thickness");
      syncTextControls();
      updateCustomBoardPreview();
    });
    textLineLengthInput?.addEventListener("input", () => {
      hasCustomEdits = true;
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
    textResetButton?.addEventListener("click", () => {
      hasCustomEdits = true;
      resetTextTransform();
      recalcTextControlRanges(shapeField?.element?.value || "מרובע", "none");
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
      syncTextControls();
      updateCustomBoardPreview();
    });
    imageField?.element?.addEventListener("change", () => {
      hasCustomEdits = true;
      updateCustomBoardPreview();
    });
    customTextInput?.addEventListener("input", () => {
      hasCustomEdits = true;
      syncTextControls();
      updateCustomBoardPreview();
    });
    customImageInput?.addEventListener("change", () => {
      hasCustomEdits = true;
      imageTransform.offsetX = 0;
      imageTransform.offsetY = 0;
      imageTransform.scale = 1;
      syncImageControls();
      updateCustomBoardPreview();
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
      if (restorePayload.textFontThicknessCm !== undefined) textTransform.fontThicknessCm = Number(restorePayload.textFontThicknessCm) || 0;
      if (restorePayload.textLineLengthCm !== undefined) textTransform.lineLengthCm = Number(restorePayload.textLineLengthCm) || 0;
      if (restorePayload.textOffsetX) textTransform.offsetX = Number(restorePayload.textOffsetX) || 0;
      if (restorePayload.textOffsetY) textTransform.offsetY = Number(restorePayload.textOffsetY) || 0;

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
});
