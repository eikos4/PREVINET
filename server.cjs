const express = require("express");
const sirv = require("sirv");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  sirv(path.join(__dirname, "dist"), {
    single: true,
  })
);

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});