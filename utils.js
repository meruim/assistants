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

function randomString(max, onlyOnce = false, possible) {
  if (!max || isNaN(max)) max = 10;
  let text = "";
  possible =
    possible ||
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < max; i++) {
    let random = Math.floor(Math.random() * possible.length);
    if (onlyOnce) {
      while (text.includes(possible[random]))
        random = Math.floor(Math.random() * possible.length);
    }
    text += possible[random];
  }
  return text;
}

function removeHomeDir(fullPath) {
  if (!fullPath || typeof fullPath !== "string")
    throw new Error("The first argument (fullPath) must be a string");
  while (fullPath.includes(process.cwd()))
    fullPath = fullPath.replace(process.cwd(), "");
  return fullPath;
}

function getExtFromMimeType(mimeType = "") {
  return mimeDB[mimeType]
    ? (mimeDB[mimeType].extensions || [])[0] || "unknow"
    : "unknow";
}

function message(api, event) {
  async function sendMessageError(err) {
    if (typeof err === "object" && !err.stack)
      err = utils.removeHomeDir(JSON.stringify(err, null, 2));
    else err = utils.removeHomeDir(`${err.name || err.error}: ${err.message}`);
    return await api.sendMessage(
      utils.getText("utils", "errorOccurred", err),
      event.threadID,
      event.messageID
    );
  }
  return {
    send: async (form, callback) => {
      try {
        return await api.sendMessage(form, event.threadID, callback);
      } catch (err) {
        if (JSON.stringify(err).includes("spam")) {
          setErrorUptime();
          throw err;
        }
      }
    },
    reply: async (form, callback) => {
      try {
        return await api.sendMessage(
          form,
          event.threadID,
          callback,
          event.messageID
        );
      } catch (err) {
        if (JSON.stringify(err).includes("spam")) {
          throw err;
        }
      }
    },
    edit: async (form, callback) => {
      try {
        return await api.editMessage(
          form,
          event.messageID,
          event.threadID,
          callback
        );
      } catch (err) {
        if (JSON.stringify(err).includes("spam")) {
          throw err;
        }
      }
    },
    unsend: async (messageID, callback) =>
      await api.unsendMessage(messageID, callback),
    reaction: async (emoji, messageID, callback) => {
      try {
        return await api.setMessageReaction(emoji, messageID, callback, true);
      } catch (err) {
        if (JSON.stringify(err).includes("spam")) {
          throw err;
        }
      }
    },
    err: async (err) => await sendMessageError(err),
    error: async (err) => await sendMessageError(err),
  };
}

async function loadScripts() {
  const errs = {};
  const commandsPath = path.join(__dirname, "scripts", "cmds");
  const eventsPath = path.join(__dirname, "scripts", "events");

  try {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
    const commandFiles =
      fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js")) ||
      file.endsWith(".ts");

    commandFiles.forEach((file) => {
      try {
        let cmdFile = require(path.join(commandsPath, file));
        if (cmdFile && cmdFile.default) {
          cmdFile = cmdFile.default;
        }

        if (!cmdFile) {
          throw new Error(`Error: ${file} does not export anything!`);
        } else if (!cmdFile.config) {
          throw new Error(`Error: ${file} does not export config!`);
        } else if (!cmdFile.onStart) {
          throw new Error(`Error: ${file} does not export onRun!`);
        } else {
          global.client.commands.set(cmdFile.config.name, cmdFile);
        }
      } catch (error) {
        log.error(`Error loading command ${file}: ${error.message}`);
        errs[file] = error;
      }
    });

    const eventFiles =
      fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js")) ||
      file.endsWith(".ts");

    eventFiles.forEach((file) => {
      try {
        let evntFile = require(path.join(eventsPath, file));
        if (evntFile && evntFile.default) {
          evntFile = evntFile.default;
        }

        if (!evntFile) {
          throw new Error(`Error: ${file} does not export anything!`);
        } else if (!evntFile.config) {
          throw new Error(`Error: ${file} does not export config!`);
        } else if (!evntFile.onStart) {
          throw new Error(`Error: ${file} does not export onEvent!`);
        } else {
          global.client.events.set(evntFile.config.name, evntFile);
        }
      } catch (error) {
        log.error(`Error loading event ${file}: ${error.message}`);
        errs[file] = error;
      }
    });
  } catch (error) {
    log.error(error.stack);
    errs[file] = error;
  }
  return Object.keys(errs).length === 0 ? false : errs;
}

const utils = {
  twirlTimer,
  config,
  log,
  loadScripts,
  message,
  randomString,
  getExtFromMimeType,
};

/*
(async () => {
  console.log(config);
})();
*/

module.exports = utils;
