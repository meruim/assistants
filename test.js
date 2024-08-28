function loadAll(callback) {
  const errs = {};
  const commandsPath = path.join(__dirname, "scripts", "cmds");
  const eventsPath = path.join(__dirname, "scripts", "events");

  // Function to load files and handle errors
  function loadFiles(dirPath, type, processFileCallback) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        callback(err);
        return;
      }

      const filteredFiles = files.filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
      let pending = filteredFiles.length;

      if (!pending) {
        callback(null, false);
        return;
      }

      filteredFiles.forEach((file) => {
        try {
          let modFile = require(path.join(dirPath, file));
          if (modFile && modFile.default) {
            modFile = modFile.default;
          }

          if (!modFile) {
            throw new Error(`Error: ${file} does not export anything!`);
          } else if (!modFile.config) {
            throw new Error(`Error: ${file} does not export config!`);
          } else if (type === 'command' && !modFile.onStart) {
            throw new Error(`Error: ${file} does not export onRun!`);
          } else if (type === 'event' && !modFile.onEvent) {
            throw new Error(`Error: ${file} does not export onEvent!`);
          } else {
            processFileCallback(modFile);
          }
        } catch (error) {
          log.error(`Error loading ${type} ${file}: ${error.message}`);
          errs[file] = error;
        }

          if (!--pending) {
            callback(null, Object.keys(errs).length === 0 ? false : errs);
          }
      });
    });
  }

  // Clear require cache
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  // Load commands
  loadFiles(commandsPath, 'command', (cmdFile) => {
    global.client.commands.set(cmdFile.config.name, cmdFile);
  });

  // Load events
  loadFiles(eventsPath, 'event', (evntFile) => {
    global.client.events.set(evntFile.config.name, evntFile);
  });
}