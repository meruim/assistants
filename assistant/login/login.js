const login = require("fca-unofficial");
const log = require("../../logger/log");
const path = require("path");
const fs = require("fs-extra");
const { exit } = require("process");
const { twirlTimer, config } = global.utils;

const appstateFolderPath = path.join("json", "credentials");
const invalidAppStates = [];
const userInformation = [];
const loginPromises = [];
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
  for (const appState of appStates) {
    let appStateData;

    try {
      appStateData = JSON.parse(
        await fs.readFile(path.join(appstateFolderPath, appState), "utf8")
      );
    } catch (error) {
      invalidAppStates.push(appState);
      continue;
    }

    const loginPromise = new Promise((resolve) => {
      login({ appState: appStateData }, async (err, api) => {
        if (err) {
          log.error(
            `Failed to login. No credentials found at json/credentials`,
            err
          );
          invalidAppStates.push(appState);
          resolve(null);
          return;
        }

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

        api.getUserInfo(api.getCurrentUserID(), async (err, ret) => {
          if (err) {
            log.error(
              `❌ Failed to retrieve user information. \nAuthentication record: ${appState}`,
              err,
              api
            );
            invalidAppStates.push(appState);
            resolve(null);
            return;
          }

          if (ret && ret[api.getCurrentUserID()]) {
            const userName = ret[api.getCurrentUserID()].name;
            userInformation.push({ userName, appState });
            completedLogins++;
          }

          if (completedLogins === appStates.length) {
            console.log(userInformation);
          }

          resolve(api);
        });
      });
    });

    loginPromises.push(loginPromise);
  }

  // Await all login promises
  const apis = await Promise.all(loginPromises);

  // Delete invalid and valid appstate files
  if (invalidAppStates.length > 0) {
    for (const invalidAppState of invalidAppStates) {
      await deleteAppStateFile(invalidAppState);
    }
  }

  if (completedLogins < 0) {
    exit();
  }

  apis.forEach((api) => {
    if (api) {
      api.listen(async (err, event) => {
        if (err) {
          log.error("Error in listener:", err, api);
          return;
        }
        const listen = require("./components/listener");
        await listen({ api, event });
      });
    }
  });
})();
