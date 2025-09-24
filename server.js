// server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = 8080;

app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/templates", express.static(path.join(__dirname, "src/templates")));
app.use("/projects", express.static(path.join(__dirname, "projects")));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 404 handler
app.use((_, res) => {
  res.status(404).send("404 - Not Found");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
