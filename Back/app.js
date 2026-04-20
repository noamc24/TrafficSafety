require("dotenv").config();

const path = require("path");
const express = require("express");
const rateLimit = require('express-rate-limit');
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

function resolveClientPath() {
  const candidates = [
    path.resolve(__dirname, "..", "Front"),
    path.resolve(process.cwd(), "Front"),
    path.resolve(process.cwd(), "..", "Front"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, "pages", "main.html"))) {
      return candidate;
    }
  }

  throw new Error(`Front directory not found. Checked: ${candidates.join(", ")}`);
}

// static client (disable caching in development)
const clientPath = resolveClientPath();
console.log(`[static] serving Front from: ${clientPath}`);
app.use(express.static(clientPath, { etag: false, maxAge: 0 }));

// rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: Number(process.env.CONTACT_RATE_LIMIT_MAX || 12),
  message: 'התקבלו יותר מדי פניות מכתובת IP זו. נסו שוב מאוחר יותר או צרו קשר טלפוני.',
  standardHeaders: true,
  legacyHeaders: false,
});

// routes

const pageRouteRedirects = {
  '/pages/main.html': '/',
  '/pages/store.html': '/store',
  '/pages/product.html': '/product',
  '/pages/cart.html': '/cart',
  '/pages/privacy.html': '/privacy',
  '/pages/terms.html': '/terms',
  '/pages/accessibility.html': '/accessibility',
  '/pages/request-confirmation.html': '/request-confirmation',
};

app.get(Object.keys(pageRouteRedirects), (req, res) => {
  const destination = pageRouteRedirects[req.path] || '/';
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(301, `${destination}${query}`);
});

app.use("/api/contact", contactLimiter, require("./routes/contact"));

app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(clientPath, "sitemap.xml"));
});

app.get("/store", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "store.html"));
});

app.get("/product", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "product.html"));
});

app.get("/cart", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "cart.html"));
});

app.get("/privacy", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "terms.html"));
});

app.get("/accessibility", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "accessibility.html"));
});

app.get("/request-confirmation", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "request-confirmation.html"));
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (path.extname(req.path)) return next();
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(clientPath, "pages", "main.html"));
});

// 404
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
