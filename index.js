process.on("unhandledRejection", (error) => console.log(error));
process.on("uncaughtException", (error) => console.log(error));

const { spawn } = require("child_process");
const log = require("./logger/log");

function start() {
  const bot = spawn("node", ["Assistant.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  bot.on("close", (code) => {
    if (code === 2) {
      log.info("Bot is restarting.");
      start();
    }
  });

  bot.on("error", (err) => {
    log.error(`Error starting bot: ${err.message}`);
  });
}

start();
