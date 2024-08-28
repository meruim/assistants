const login = require("fca-unofficial");
const log = require("../../logger/log");
const path = require("path");
const fs = require("fs-extra");
const { exit } = require("process");
const { twirlTimer, config } = global.utils;

const appstateFolderPath = path.join("json", "credentials");
const invalidAppStates = [];
const userInformation = [];
let completedLogins = 0;

(async function () {
  // Read files from the appstate folder
  const files = await fs.readdir(appstateFolderPath);
  const appStates = files.filter((file) => path.extname(file) === ".json");

  // Securely delete all appstate files
  const deleteAppStateFile = async (appState) => {
    const appStatePath = path.join(appstateFolderPath, appState);
    if (await fs.existsSync(appStatePath)) {
      const twirlTimerId = twirlTimer(
        `Initiating secure deletion of appstate file: ${appState}`
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await fs.unlink(appStatePath);
        clearInterval(twirlTimerId);
        process.stdout.write("\r ");
        log.success(`✅ Appstate file successfully deleted: ${appState}`);
      } catch (deleteError) {
        clearInterval(twirlTimerId);
        process.stdout.write("\r ");
        log.error(
          `❌ Error during appstate file deletion: ${appState}`,
          deleteError
        );
      }
    } else {
      log.warn(`File does not exist or has already been deleted: ${appState}`);
    }
  };

  if (appStates.length === 0) {
    const notFoundTimer = twirlTimer(
      `No Appstate found, preparing to stop the runtime`
    );

    setTimeout(async () => {
      clearInterval(notFoundTimer);
      process.stdout.write("\r\x1b[K");
      log.error(
        "NOT FOUND",
        "Add a valid appstate in credentials, and try again!"
      );
      process.exit();
    }, 1000);
    return;
  }

  // Process each appstate file
  const apis = [];
  for (const appState of appStates) {
    let appStateData;

    try {
      appStateData = JSON.parse(
        await fs.readFile(path.join(appstateFolderPath, appState), "utf8")
      );
    } catch (error) {
      log.error(`❌ Failed to parse appstate file: ${appState}`, error);
      invalidAppStates.push(appState);
      continue;
    }

    try {
      const api = await new Promise((resolve, reject) => {
        login({ appState: appStateData }, (err, api) => {
          if (err) {
            log.error(`Failed to login with appstate file: ${appState}`, err);
            invalidAppStates.push(appState);
            return reject(err);
          }
          resolve(api);
        });
      });

      const {
        listenEvents,
        selfListen,
        autoMarkRead,
        autoMarkDelivery,
        forceLogin,
      } = config.settings;

      api.setOptions({
        listenEvents,
        selfListen,
        autoMarkRead,
        autoMarkDelivery,
        forceLogin,
      });

      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(api.getCurrentUserID(), (err, ret) => {
          if (err) {
            log.error(
              `❌ Failed to retrieve user information. \nAuthentication record: ${appState}`,
              err
            );
            invalidAppStates.push(appState);
            return reject(err);
          }
          resolve(ret[api.getCurrentUserID()]);
        });
      });

      if (userInfo) {
        const userName = userInfo.name;
        userInformation.push({ userName, appState });
        completedLogins++;
        log.info(`✅ Logged in as ${userName} using appstate: ${appState}`);
        apis.push(api);
      }
    } catch (err) {
      // Continue to the next appState
      continue;
    }
  }

  // Delete invalid appstate files
  if (invalidAppStates.length > 0) {
    for (const invalidAppState of invalidAppStates) {
      await deleteAppStateFile(invalidAppState);
    }
  }

  if (completedLogins < 1) {
    log.error("No successful logins. Exiting.");
    exit();
  }

  // Attach event listeners to each successful API login
  apis.forEach((api, index) => {
    log.info(`Listening for events on API instance ${index + 1}`);
    api.listenMqtt(async (err, event) => {
      if (err) {
        log.error(`Error in listener for API instance ${index + 1}:`, err);
        return;
      }

      try {
        const listen = require("./components/listener");
        await listen({ api, event });
      } catch (listenerError) {
        log.error(
          `Error handling event in API instance ${index + 1}:`,
          listenerError
        );
      }
    });
  });
})();
