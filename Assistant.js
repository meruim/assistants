(async () => {
  try {
    const utils = require("./utils");
    const { config, loadScripts, autoRestart } = utils;
    require("./assistant/server/server");

    // Declare globals
    global.utils = utils;
    global.client = {
      startTime: new Date(),
      config: config,
      prefix: config.assistant.prefix,
      hasPrefix: config.assistant.hasPrefix,
      botAdmins: config.admin.adminsBot,
      commands: new Map(),
      events: new Map(),
      cooldowns: new Map(),
    };

    global.Assistant = {
      onReply: new Map(),
    };

    const loadResult = await loadScripts();
    if (loadResult !== false) {
      console.error("Script Loading Errors:", loadResult);
      //process.exit(1);
    }
    const restartResult = await autoRestart();

    console.log("AutoRestart Result:", restartResult);

    require("./assistant/login/login");
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
