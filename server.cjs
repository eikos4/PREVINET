const express = require("express");
const path = require("path");
const sirv = require("sirv");

const app = express();
const port = process.env.PORT || 3000;

const distPath = path.join(__dirname, "dist");
app.use(sirv(distPath, { etag: true, gzip: true }));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => console.log("PREVINET running on", port));
