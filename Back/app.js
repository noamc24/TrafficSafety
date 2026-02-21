const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static client (disable caching in development)
const clientPath = path.join(__dirname, "..", "Front");
app.use(express.static(clientPath, { etag: false, maxAge: 0 }));

// routes
app.use("/api/contact", require("./routes/contact"));

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
