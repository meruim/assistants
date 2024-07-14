(async () => {
  const utils = require("./utils");

  //Feclare global
  global.Assistant = {
    onReply: new Map(),
  };
  global.utils = utils;

  require("./assistant/login/login");
})();
