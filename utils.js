const path = require("path");
const fs = require("fs");
const configPath = path.join(__dirname, "json", "config.json");
const log = require("./logger/log");
//━━━━━━━━━Read Config━━━━━━━━━━//
const configContent = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configContent);

const twirlTimer = function (loadingMsg = "") {
  const P = ["\\", "|", "/", "-"];
  let x = 0;
  return setInterval(function () {
    process.stdout.write(
      "\r" + P[x++] + (loadingMsg ? " - " + loadingMsg : "")
    );
    x &= 3;
  }, 100);
};

const utils = {
  twirlTimer,
  config,
  log,
};

/*
(async () => {
  console.log(config);
})();
*/

module.exports = utils;
