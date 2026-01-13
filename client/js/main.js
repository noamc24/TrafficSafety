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
  // Normalize trailing slash and default index
  if (!p) return "/";
  let path = p.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function setActiveNavLink() {
  const current = normalizePath(window.location.pathname);

  // Works for both desktop links (.nav-link) and mobile offcanvas buttons (a.btn)
  const links = document.querySelectorAll('a[href^="/"]');

  links.forEach(a => {
    const href = normalizePath(a.getAttribute("href"));
    if (!href) return;

    // Mark exact match
    if (href === current) {
      a.classList.add("active");
      // If it's a button, give it subtle emphasis
      if (a.classList.contains("btn") && !a.classList.contains("btn-warning")) {
        a.classList.add("fw-bold");
      }
    }
  });
}

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
