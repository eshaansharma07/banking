const path = require("path");
const express = require("express");
const app = require("./src/app");

const server = express();
const port = process.env.PORT || 3000;

server.use(express.static(path.join(__dirname)));
server.use(app);

server.listen(port, () => {
  console.log(`Nova Bank is running at http://localhost:${port}`);
});
