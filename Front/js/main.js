if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister().catch(() => {}));
    }).catch(() => {});
  } catch (e) {
  }
}

async function mountPartials() {
  const navbarMount = document.getElementById("navbarMount");
  const footerMount = document.getElementById("footerMount");

  if (navbarMount) {
    try {
      const navHtml = await fetch("/partials/navbar.html", { cache: "no-store" }).then(r => {
        if (!r.ok) throw new Error(`navbar load failed: ${r.status}`);
        return r.text();
      });
      navbarMount.innerHTML = navHtml;
      setActiveNavLink();
      updateActiveOnScroll();
      updateCartIndicators();
    } catch (err) {
      console.error("Failed to load navbar:", err);
      navbarMount.innerHTML = "";
    }
  }

  if (footerMount) {
    try {
      const footerHtml = await fetch("/partials/footer.html", { cache: "no-store" }).then(r => {
        if (!r.ok) throw new Error(`footer load failed: ${r.status}`);
        return r.text();
      });
      footerMount.innerHTML = footerHtml;

      const yearEl = document.getElementById("year");
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (err) {
      console.error("Failed to load footer:", err);
      footerMount.innerHTML = "";
    }
  }
}

function normalizePath(p) {
  if (!p) return "/";
  let path = p.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
  if (path !== "/" && path.toLowerCase().endsWith('.html')) {
    path = path.slice(0, -5) || "/";
  }
  return path;
}

function setActiveNavLink() {
  const currentPath = normalizePath(window.location.pathname);
  const currentHash = (window.location.hash || "").replace(/^#/, "");

  const links = document.querySelectorAll('a[href^="#"], a[href^="/"]');

  links.forEach(a => {
    a.classList.remove('active');
    a.classList.remove('fw-bold');
  });

  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (id && id === currentHash) {
        a.classList.add('active');
        if (a.classList.contains('btn') && !a.classList.contains('btn-warning')) a.classList.add('fw-bold');
      }
    } else if (href.startsWith('/')) {
      const targetUrl = new URL(href, window.location.origin);
      const normalized = normalizePath(targetUrl.pathname);
      const targetHash = (targetUrl.hash || "").replace(/^#/, "");

      if (targetHash && normalized === currentPath) {
        if (targetHash === currentHash) {
          a.classList.add('active');
          if (a.classList.contains('btn') && !a.classList.contains('btn-warning')) a.classList.add('fw-bold');
        }
      } else if (normalized === currentPath) {
        a.classList.add('active');
        if (a.classList.contains('btn') && !a.classList.contains('btn-warning')) a.classList.add('fw-bold');
      }
    }
  });
}

function updateActiveOnScroll() {
  const ids = ['home', 'about', 'services', 'projects', 'signs', 'contact'];
  let best = null;
  let bestDist = Infinity;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dist = Math.abs(rect.top - 120);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  });

  if (!best) return;

  document.querySelectorAll('a[href^="#"]').forEach(a => { a.classList.remove('active'); a.classList.remove('fw-bold'); });
  const active = document.querySelector(`a[href="#${best}"]`);
  if (active) {
    active.classList.add('active');
    if (active.classList.contains('btn') && !active.classList.contains('btn-warning')) active.classList.add('fw-bold');
  }
}

let scrollRaf = null;
function onScrollThrottled() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    updateActiveOnScroll();
    scrollRaf = null;
  });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href === '#') return;
  const id = href.slice(1);
  const el = document.getElementById(id);
  if (!el) return;

  // Check if this link is in the mobile offcanvas menu
  const isInOffcanvas = a.closest('#mobileMenu');

  if (isInOffcanvas) {
    // For mobile menu links, let Bootstrap handle the dismiss, then scroll
    e.preventDefault();
    // Close the offcanvas menu
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('mobileMenu'));
    if (offcanvas) {
      offcanvas.hide();
    }
    // Small delay to allow offcanvas to close before scrolling
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
      setTimeout(() => { updateActiveOnScroll(); }, 250);
    }, 300);
  } else {
    // For regular anchor links, prevent default and scroll
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    setTimeout(() => { updateActiveOnScroll(); }, 250);
  }
});

document.addEventListener("click", (e) => {
  const link = e.target.closest && e.target.closest("#mobileMenu a[href]");
  if (!link) return;

  const rawHref = link.getAttribute("href");
  if (!rawHref) return;

  const targetUrl = new URL(rawHref, window.location.origin);
  const targetPath = normalizePath(targetUrl.pathname);
  const currentPath = normalizePath(window.location.pathname);
  const targetHash = (targetUrl.hash || "").replace(/^#/, "");

  const offcanvasEl = document.getElementById("mobileMenu");
  const offcanvas = (offcanvasEl && window.bootstrap)
    ? bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl)
    : null;

  if (targetHash && targetPath === currentPath) {
    e.preventDefault();
    offcanvas?.hide();
    setTimeout(() => {
      const el = document.getElementById(targetHash);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${targetHash}`);
      setTimeout(() => { updateActiveOnScroll(); }, 250);
    }, 250);
    return;
  }

  offcanvas?.hide();
});

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const alertBox = document.getElementById("formAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (alertBox) alertBox.innerHTML = "";

    const payload = Object.fromEntries(new FormData(form).entries());

    if (!payload.fullName || !payload.message || (!payload.email && !payload.phone)) {
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-danger mb-0">נא למלא שם מלא והודעה, וכן אימייל או טלפון.</div>`;
      }
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.error || `שגיאה בשליחה (${res.status})`;
        throw new Error(errMsg);
      }

      form.reset();
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-success mb-0">${data.message || "נשלח בהצלחה"}</div>`;
      }
    } catch (err) {
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-danger mb-0">לא נשלח: ${err.message}</div>`;
      }
      console.error(err);
    }
  });
}

function setupImageLightbox() {
  const modalEl = document.getElementById('lightboxModal');
  if (!modalEl || !window.bootstrap) return;

  const modal = new bootstrap.Modal(modalEl, { keyboard: true });

  const showImageModal = (img) => {
    const headerTitleEl = modalEl.querySelector('#lightboxModalLabel');
    const bodyTitleEl = modalEl.querySelector('#lightboxModalTitle');
    const descEl = modalEl.querySelector('#lightboxModalDesc');
    const imgEl = modalEl.querySelector('#lightboxModalImage');

    const title = (img.closest('.card')?.querySelector('h5')?.textContent || img.alt || '').trim();
    const desc = (img.closest('.card')?.querySelector('p')?.textContent || '').trim();

    if (headerTitleEl) headerTitleEl.textContent = title;
    if (bodyTitleEl) bodyTitleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (imgEl) {
      imgEl.src = img.dataset.full || img.src;
      imgEl.alt = title;
    }

    modal.show();
  };

  document.querySelectorAll('[data-lightbox="true"]').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => showImageModal(img));
  });
}

function setupSectionToggles() {
  document.querySelectorAll('[data-section-toggle]').forEach((button) => {
    const targetId = button.getAttribute('data-toggle-target');
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const icon = button.querySelector('i');

    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;

      target.classList.toggle('d-none', !nextExpanded);
      button.setAttribute('aria-expanded', String(nextExpanded));

      if (icon) {
        icon.classList.toggle('bi-chevron-up', nextExpanded);
        icon.classList.toggle('bi-chevron-down', !nextExpanded);
      }
    });
  });
}


const backToTopButton = document.getElementById('backToTop');
if (backToTopButton) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopButton.classList.add('show');
    } else {
      backToTopButton.classList.remove('show');
    }
  });
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


const COOKIE_CONSENT_STORAGE_KEY = "cookieConsentStatus";
const GOOGLE_ANALYTICS_ID = "G-5S6M1YBCSL";

function loadGoogleAnalytics() {
  if (!GOOGLE_ANALYTICS_ID || window.__tscGaLoaded) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){
    window.dataLayer.push(arguments);
  };

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ANALYTICS_ID)}`;
  analyticsScript.dataset.gaLoader = "true";
  document.head.appendChild(analyticsScript);

  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ANALYTICS_ID);
  window.__tscGaLoaded = true;
}

function buildCookieConsentBanner() {
  if (document.getElementById("cookieConsentBanner")) return;

  const banner = document.createElement("section");
  banner.id = "cookieConsentBanner";
  banner.className = "cookie-consent-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("aria-label", "הודעת שימוש בעוגיות");

  banner.innerHTML = `
    <div class="cookie-consent-banner__content container" dir="rtl">
      <p class="cookie-consent-banner__text mb-0">
        האתר עושה שימוש בעוגיות (Cookies) ובטכנולוגיות דומות לצורך תפעול תקין, ניתוח שימוש ושיפור חוויית המשתמש. ניתן לקרוא עוד במדיניות הפרטיות.
        <a href="/privacy" class="cookie-consent-banner__link">מדיניות פרטיות</a>
      </p>
      <div class="cookie-consent-banner__actions" role="group" aria-label="פעולות הסכמה לעוגיות">
        <button type="button" class="btn btn-warning cookie-consent-accept" data-cookie-consent="accept">אישור</button>
        <button type="button" class="btn btn-outline-secondary cookie-consent-decline" data-cookie-consent="decline">דחייה</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
}

function setCookieBannerVisibility(isVisible) {
  const banner = document.getElementById("cookieConsentBanner");
  if (!banner) return;

  banner.classList.toggle("is-visible", isVisible);
  document.body.classList.toggle("has-cookie-banner", isVisible);
}

function saveCookieConsentStatus(status) {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, status);
  } catch (error) {
    console.error("Failed to save cookie consent status:", error);
  }
}

function getCookieConsentStatus() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to read cookie consent status:", error);
    return null;
  }
}

function initializeCookieConsent() {
  buildCookieConsentBanner();

  const status = getCookieConsentStatus();
  if (status === "accepted") {
    loadGoogleAnalytics();
    setCookieBannerVisibility(false);
    return;
  }

  if (status === "declined") {
    setCookieBannerVisibility(false);
    return;
  }

  setCookieBannerVisibility(true);

  const banner = document.getElementById("cookieConsentBanner");
  if (!banner) return;

  const acceptButton = banner.querySelector('[data-cookie-consent="accept"]');
  const declineButton = banner.querySelector('[data-cookie-consent="decline"]');

  acceptButton?.addEventListener("click", () => {
    saveCookieConsentStatus("accepted");
    setCookieBannerVisibility(false);
    loadGoogleAnalytics();
  });

  declineButton?.addEventListener("click", () => {
    saveCookieConsentStatus("declined");
    setCookieBannerVisibility(false);
  });
}

const CART_STORAGE_KEY = "tsc_cart";

function getCartItemCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  } catch {
    return 0;
  }
}

function updateCartIndicators() {
  const count = getCartItemCount();
  document.querySelectorAll("[data-cart-count-badge]").forEach((el) => {
    el.textContent = String(count);
  });
}
initializeCookieConsent();
mountPartials();
setupContactForm();
setupImageLightbox();
setupSectionToggles();
updateActiveOnScroll();
window.addEventListener('scroll', onScrollThrottled, { passive: true });
window.addEventListener("storage", (event) => {
  if (event.key === CART_STORAGE_KEY) updateCartIndicators();
});
window.addEventListener("tsc-cart-updated", updateCartIndicators);

document.addEventListener("DOMContentLoaded", function () {
  const reveals = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.01,
    rootMargin: "0px 0px -10% 0px"
  });

  reveals.forEach(reveal => {
    observer.observe(reveal);
  });
});
