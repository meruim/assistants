const express = require("express");

const PORT = process.env.PORT || 3000;
(async () => {
  const app = express();
  app.listen(PORT, () => {
    console.log(`BOT RUNNING IN PORT ${PORT}`);
  });
})();
