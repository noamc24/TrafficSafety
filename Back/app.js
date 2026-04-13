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
  windowMs: 24 * 24 * 60 * 60 * 1000, // 24 days
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'יותר מדי בקשות צור קשר מכתובת IP זו, אנא נסה שוב מאוחר יותר.',
  standardHeaders: true,
  legacyHeaders: false,
});

// routes
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
