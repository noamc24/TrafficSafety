const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static client
const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

// routes
app.use("/api/contact", require("./routes/contact"));

// pages
app.get("/", (req, res) => res.sendFile(path.join(clientPath, "pages", "index.html")));
app.get("/services", (req, res) => res.sendFile(path.join(clientPath, "pages", "services.html")));
app.get("/projects", (req, res) => res.sendFile(path.join(clientPath, "pages", "projects.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(clientPath, "pages", "contact.html")));

// 404
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
