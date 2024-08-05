(async () => {
  const utils = require("./utils");
  const { config, loadScripts } = utils;
  require("./assistant/server/server");
  //Declare globals
  global.utils = utils;
  global.client = new Object({
    startTime: new Date(),
    config: config,
    prefix: config.assistant.prefix,
    hasPrefix: config.assistant.hasPrefix,
    botAdmins: config.admin.adminsBot,
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
  });

  global.Assistant = new Object({
    onReply: new Map(),
  });

  loadScripts();

  require("./assistant/login/login");
})();
