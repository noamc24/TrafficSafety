const PRODUCT_CATALOG = {
  "stop-sign": {
    title: "תמרור עצור",
    category: "תמרורים",
    shortDescription: "תמרור בולט ועמיד לשימוש עירוני ואתרי תנועה.",
    longDescription: "תמרור איכותי מאלומיניום עם ציפוי מחזיר אור, מתאים להתקנה בעמודי תמרור ובכניסות למתחמים.",
    images: ["/assets/photos/sign1.jpg", "/assets/photos/project4.png", "/assets/photos/project14.png"],
    options: [
      { name: "גודל", values: ["סטנדרטי", "גדול"] },
      { name: "סוג מחזיר אור", values: ["רגיל", "מחזיר אור משופר"] }
    ]
  },
  "slow-sign": {
    title: "תמרור האט",
    category: "תמרורים",
    shortDescription: "שילוב נראות גבוהה ועמידות לתנאי חוץ.",
    longDescription: "מתאים לרחובות פנימיים, אזורי מוסדות וחניונים, עם אפשרויות שונות לפי דרישות האתר.",
    images: ["/assets/photos/sign2.jpg", "/assets/photos/project3.png", "/assets/photos/project21.png"],
    options: [{ name: "גודל", values: ["קטן", "בינוני", "גדול"] }]
  },
  "direction-board": {
    title: "שלט הכוונה",
    category: "שלטים",
    shortDescription: "שילוט ברור למתחמים, חניונים ושטחי תפעול.",
    longDescription: "שלט הכוונה בהתאמה לפרויקט, כולל טקסט/חיצים, צבעים ופתרונות תלייה או עמוד.",
    images: ["/assets/photos/board1.jpg", "/assets/photos/project10.png", "/assets/photos/project18.png"],
    options: [{ name: "שיטת התקנה", values: ["על קיר", "על עמוד"] }]
  },
  "private-parking-board": {
    title: "שלט חניה פרטית",
    category: "שלטים",
    shortDescription: "שלט מקצועי למתחמים פרטיים ועסקיים.",
    longDescription: "עמיד לתנאי שמש וגשם, עם אפשרות להתאמת נוסח וסימון לפי דרישת הלקוח.",
    images: ["/assets/photos/board2.jpg", "/assets/photos/project17.png", "/assets/photos/project20.png"],
    options: [{ name: "נוסח", values: ["חניה פרטית", "חניה לדיירים בלבד", "מותאם אישית"] }]
  },
  "active-worksite-sign": {
    title: "שלט אתר עבודה פעיל",
    category: "שלטים לאתרי עבודה",
    shortDescription: "לסימון ברור של אזורי עבודה ותשתית.",
    longDescription: "שלטי אתר עבודה לקריאות גבוהה ביום ובלילה, עם אפשרות לשינוי נוסח בהתאם לסוג הפרויקט.",
    images: ["/assets/photos/worksite1.jpg", "/assets/photos/project13.png", "/assets/photos/project14.png"],
    options: [{ name: "חומר", values: ["פח", "PVC קשיח"] }]
  },
  "roadwork-warning-sign": {
    title: "שלט זהירות עבודות בכביש",
    category: "שלטים לאתרי עבודה",
    shortDescription: "לשיפור בטיחות הנהגים והעובדים בשטח.",
    longDescription: "פתרון נפוץ להסדרי תנועה זמניים, כולל אפשרויות התקנה ניידות וקבועות.",
    images: ["/assets/photos/worksite2.jpg", "/assets/photos/project15.png", "/assets/photos/project16.png"],
    options: [{ name: "סוג", values: ["נייד", "קבוע"] }]
  },
  "safety-cone": {
    title: "קונוס בטיחות",
    category: "אביזרי בטיחות",
    shortDescription: "קונוס בולט ועמיד לעבודות שטח וחניונים.",
    longDescription: "מתאים להסדרי תנועה זמניים, סימון נתיבים ואזורים תפעוליים.",
    images: ["/assets/photos/safety1.jpg", "/assets/photos/project8.png", "/assets/photos/project13.png"],
    options: [{ name: "גובה", values: ['45 ס"מ', '70 ס"מ'] }]
  },
  "panoramic-mirror": {
    title: "מראות פנורמיות",
    category: "אביזרי בטיחות",
    shortDescription: "מראות לשיפור שדה הראייה בצמתים, חניונים ויציאות.",
    longDescription: "המוצר זמין בשני סוגים, וכל סוג זמין בשני גדלים לבחירה לפי תנאי השטח.",
    images: ["/assets/photos/safety2.jpg", "/assets/photos/project2.png", "/assets/photos/project5.png"],
    options: [
      { name: "סוג מראה", values: ["פנימית", "חיצונית"] },
      { name: "גודל", values: ['60 ס"מ', '80 ס"מ'] }
    ]
  },
  "flexible-post": {
    title: "עמודים גמישים",
    category: "אביזרי בטיחות",
    shortDescription: "להפרדה, הכוונה וסימון מסלולים.",
    longDescription: "עמודים גמישים עמידים לפגיעות חוזרות, מתאימים למרחב עירוני ואתרים תפעוליים.",
    images: ["/assets/photos/safety1.jpg", "/assets/photos/project1.png", "/assets/photos/project3.png"],
    options: [{ name: "צבע", values: ["כתום", "לבן", "אדום-לבן"] }]
  },
  "parking-stop": {
    title: "מעצורי חנייה",
    category: "אביזרי בטיחות",
    shortDescription: "לעצירה מדויקת ובטוחה של רכבים בחניה.",
    longDescription: "פתרון מתאים לחניונים פרטיים וציבוריים, עם מגוון אורכים וחומרי ייצור.",
    images: ["/assets/photos/safety2.jpg", "/assets/photos/project2.png", "/assets/photos/project20.png"],
    options: [{ name: "אורך", values: ['90 ס"מ', '120 ס"מ', '180 ס"מ'] }]
  },
  "parking-guard": {
    title: "שומרי חנייה",
    category: "אביזרי בטיחות",
    shortDescription: "ניהול והגנה על מקומות חניה פרטיים.",
    longDescription: "שומרי חניה ידניים/ננעלים בהתאמה לדרישות שימוש יומיומי.",
    images: ["/assets/photos/safety1.jpg", "/assets/photos/project19.png", "/assets/photos/project21.png"],
    options: [{ name: "מנגנון", values: ["ידני", "נעילה עם מפתח"] }]
  },
  "speed-bump": {
    title: "פסי האטה",
    category: "אביזרי בטיחות",
    shortDescription: "האטת מהירות ושיפור בטיחות באזורים רגישים.",
    longDescription: "פסי האטה מודולריים לחניונים, אזורי מוסדות ודרכים פנימיות.",
    images: ["/assets/photos/safety2.jpg", "/assets/photos/project4.png", "/assets/photos/project11.jpg"],
    options: [{ name: "גובה פס", values: ["נמוך", "בינוני"] }]
  },
  "spike-barrier": {
    title: "מחסומי דוקרנים",
    category: "אביזרי בטיחות",
    shortDescription: "בקרת מעבר לרכבים בכיוון מורשה בלבד.",
    longDescription: "מתאים לכניסות מבוקרות, חניונים ומתחמים לוגיסטיים עם דרישות אבטחה.",
    images: ["/assets/photos/safety1.jpg", "/assets/photos/project12.png", "/assets/photos/project14.png"],
    options: [{ name: "כיוון מעבר", values: ["חד-כיווני", "דו-כיווני"] }]
  },
  "lane-divider": {
    title: "מפרידי נתיבים",
    category: "אביזרי בטיחות",
    shortDescription: "הפרדה ברורה בין נתיבים והכוונת תנועה.",
    longDescription: "פתרון עמיד להסדרי תנועה זמניים או קבועים לפי אופי הפרויקט.",
    images: ["/assets/photos/safety2.jpg", "/assets/photos/project15.png", "/assets/photos/project18.png"],
    options: [{ name: "סוג מפריד", values: ["מודולרי", "קשיח"] }]
  },
  "solar-lamp": {
    title: "פנסים סולריים",
    category: "אביזרי בטיחות",
    shortDescription: "תאורה עצמאית לאתרי עבודה ומוקדי סיכון.",
    longDescription: "פנסים סולריים לשיפור נראות והתראה, ללא תלות בתשתית חשמל באתר.",
    images: ["/assets/photos/safety1.jpg", "/assets/photos/project10.png", "/assets/photos/project16.png"],
    options: [{ name: "עוצמת תאורה", values: ["בסיסית", "חזקה"] }]
  },
  "other-safety": {
    title: "אביזרי בטיחות נוספים",
    category: "אביזרי בטיחות",
    shortDescription: "מוצרים משלימים לפי צורך הפרויקט.",
    longDescription: "פתרונות נוספים להתאמה אישית באתר: שילוב אביזרים, סימון, אזהרה ובטיחות.",
    images: ["/assets/photos/safety2.jpg", "/assets/photos/project17.png", "/assets/photos/project19.png"],
    options: [{ name: "סוג מוצר", values: ["מותאם לפרויקט", "מלאי קיים"] }]
  }
};

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderGallery(images, title) {
  const mainImage = document.getElementById("mainProductImage");
  const thumbsContainer = document.getElementById("productThumbs");
  if (!mainImage || !thumbsContainer) return;

  mainImage.src = images[0];
  mainImage.alt = title;
  thumbsContainer.innerHTML = "";

  images.forEach((src, index) => {
    const thumbBtn = document.createElement("button");
    thumbBtn.type = "button";
    thumbBtn.className = `product-gallery__thumb${index === 0 ? " active" : ""}`;
    thumbBtn.innerHTML = `<img src="${src}" alt="${title} - תמונה ${index + 1}" />`;
    thumbBtn.addEventListener("click", () => {
      mainImage.src = src;
      thumbsContainer.querySelectorAll(".product-gallery__thumb").forEach((thumb) => thumb.classList.remove("active"));
      thumbBtn.classList.add("active");
    });
    thumbsContainer.appendChild(thumbBtn);
  });
}

function renderOptions(options) {
  const optionsContainer = document.getElementById("productOptions");
  if (!optionsContainer) return [];

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

  // Conditional custom text input for personalized wording
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
  if (!btn || !feedback || !qtyField) return;

  btn.addEventListener("click", () => {
    const selectedOptions = optionFields.map((field) => ({
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

    const quantity = Number(qtyField.value || 1);
    const cart = JSON.parse(localStorage.getItem("tsc_cart") || "[]");
    cart.push({
      productId,
      title: product.title,
      category: product.category,
      quantity,
      options: selectedOptions,
      addedAt: new Date().toISOString()
    });
    localStorage.setItem("tsc_cart", JSON.stringify(cart));

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

document.addEventListener("DOMContentLoaded", () => {
  const productId = getProductIdFromUrl();
  const product = PRODUCT_CATALOG[productId];
  if (!productId || !product) {
    renderNotFound();
    return;
  }

  const categoryEl = document.getElementById("productCategory");
  const titleEl = document.getElementById("productTitle");
  const shortDescEl = document.getElementById("productShortDesc");
  const longDescEl = document.getElementById("productLongDesc");

  if (!categoryEl || !titleEl || !shortDescEl || !longDescEl) return;

  document.title = `${product.title} | המרכז לבטיחות בתנועה`;
  categoryEl.textContent = product.category;
  titleEl.textContent = product.title;
  shortDescEl.textContent = product.shortDescription;
  longDescEl.textContent = product.longDescription;

  renderGallery(product.images, product.title);
  const optionFields = renderOptions(product.options || []);
  setupAddToCart(productId, product, optionFields);
});
