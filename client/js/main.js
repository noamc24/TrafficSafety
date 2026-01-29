// client/js/main.js

async function mountPartials() {
  const navbarMount = document.getElementById("navbarMount");
  const footerMount = document.getElementById("footerMount");

  // Inject navbar
  if (navbarMount) {
    try {
      const navHtml = await fetch("/partials/navbar.html", { cache: "no-store" }).then(r => {
        if (!r.ok) throw new Error(`navbar load failed: ${r.status}`);
        return r.text();
      });
      navbarMount.innerHTML = navHtml;
      setActiveNavLink();
      // ensure scroll-based active updates run after navbar injection
      updateActiveOnScroll();
    } catch (err) {
      console.error("Failed to load navbar:", err);
      navbarMount.innerHTML = ""; // keep clean
    }
  }

  // Inject footer
  if (footerMount) {
    try {
      const footerHtml = await fetch("/partials/footer.html", { cache: "no-store" }).then(r => {
        if (!r.ok) throw new Error(`footer load failed: ${r.status}`);
        return r.text();
      });
      footerMount.innerHTML = footerHtml;

      // Set year if exists
      const yearEl = document.getElementById("year");
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (err) {
      console.error("Failed to load footer:", err);
      footerMount.innerHTML = "";
    }
  }
}

function normalizePath(p) {
  // Normalize trailing slash and default index; strip .html
  if (!p) return "/";
  let path = p.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
  if (path !== "/" && path.toLowerCase().endsWith('.html')) {
    path = path.slice(0, -5) || "/";
  }
  return path;
}

function setActiveNavLink() {
  // Mark link active by pathname or by hash if present
  const currentPath = normalizePath(window.location.pathname);
  const currentHash = (window.location.hash || "").replace(/^#/, "");

  // links that are internal anchors or root-relative
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
      const normalized = normalizePath(href);
      if (normalized === currentPath) {
        a.classList.add('active');
        if (a.classList.contains('btn') && !a.classList.contains('btn-warning')) a.classList.add('fw-bold');
      }
    }
  });
}

// Update active nav item based on scroll position
function updateActiveOnScroll() {
  const ids = ['home', 'services', 'projects', 'signs', 'contact'];
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

  // clear previous
  document.querySelectorAll('a[href^="#"]').forEach(a => { a.classList.remove('active'); a.classList.remove('fw-bold'); });
  const active = document.querySelector(`a[href="#${best}"]`);
  if (active) {
    active.classList.add('active');
    if (active.classList.contains('btn') && !active.classList.contains('btn-warning')) active.classList.add('fw-bold');
  }
}

// throttled scroll handler
let scrollRaf = null;
function onScrollThrottled() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    updateActiveOnScroll();
    scrollRaf = null;
  });
}

// click handler for hash links (smooth scroll + update hash)
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href === '#') return;
  const id = href.slice(1);
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
  // update active immediately
  setTimeout(() => { updateActiveOnScroll(); }, 250);
});

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const alertBox = document.getElementById("formAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (alertBox) alertBox.innerHTML = "";

    const payload = Object.fromEntries(new FormData(form).entries());

    // Quick client-side required check (server still validates)
    if (!payload.fullName || !payload.email || !payload.message) {
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-danger mb-0">נא למלא שם מלא, אימייל והודעה.</div>`;
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
        alertBox.innerHTML = `<div class="alert alert-success mb-0">${data.message || "נשלח בהצלחה 🙌"}</div>`;
      }
    } catch (err) {
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-danger mb-0">לא נשלח: ${err.message}</div>`;
      }
      console.error(err);
    }
  });
}

// Run
mountPartials();
setupContactForm();
updateActiveOnScroll();
window.addEventListener('scroll', onScrollThrottled, { passive: true });
