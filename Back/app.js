require("dotenv").config();

const path = require("path");
const express = require("express");
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static client (disable caching in development)
const clientPath = path.join(__dirname, "..", "Front");
app.use(express.static(clientPath, { etag: false, maxAge: 0 }));

// rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 24 * 24 * 60 * 60 * 1000, // 24 days
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'יותר מדי בקשות צור קשר מכתובת IP זו, אנא נסה שוב מאוחר יותר.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
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
