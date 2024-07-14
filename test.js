const login = require("../../fca-unofficial");
const log = require("../../logger/log");
const path = require("path");
const fs = require("fs-extra");
const { exit } = require("process");
const { twirlTimer, config } = global.utils;
const appstateFolderPath = path.join("json", "credentials");
const invalidAppStates = new Set();
const userInformation = [];
const loginPromises = [];
let completedLogins = 0;

module.exports = async function () {
  return async function () {
    const files = await fs.readdir(appstateFolderPath);
    const appStates = files.filter((file) => path.extname(file) === ".json");
    const {
      listenEvents,
      selfListen,
      autoMarkRead,
      autoMarkDelivery,
      forceLogin,
    } = config.settings;

    if (appStates.length === 0) {
      // /console.log("No appstate files found.");
      const notFoundTimer = twirlTimer(
        `No Appstate found, preparing to stop the runtime!`
      );

      setTimeout(async () => {
        clearInterval(notFoundTimer);
        process.stdout.write("\r\x1b[K"); // Clear the entire line
        log.error(
          "NOT FOUND",
          "Add an valid appstate in credentials, and try again!"
        );

        process.exit();
      }, 1000);
    }

    for (const appState of appStates) {
      let appStateData;

      try {
        appStateData = JSON.parse(
          await fs.readFile(path.join(appstateFolderPath, appState), "utf8")
        );
      } catch (error) {
        invalidAppStates.add(appState);
        continue;
      }

      const loginPromise = new Promise((resolve) => {
        login({ appState: appStateData }, async (err, api) => {
          if (err) {
            log.error(
              `Failed to login. No credentials found at json/credentials
              `,
              err
            );
            resolve(null);
            return;
          }

          api.setOptions({
            listenEvents: listenEvents,
            selfListen: selfListen,
            autoMarkRead: autoMarkRead,
            autoMarkDelivery: autoMarkDelivery,
            forceLogin: forceLogin,
          });

          api.getUserInfo(api.getCurrentUserID(), (err, ret) => {
            if (err) {
              log.error(
                `❌ Failed to retrieve user information. \nAuthentication record: ${appState}`,
                err,
                api
              );
              invalidAppStates.add(appState);
            }

            if (ret && ret[api.getCurrentUserID()]) {
              const userName = ret[api.getCurrentUserID()].name;
              userInformation.push({ userName, appState });
            }

            completedLogins++;
            if (completedLogins === appStates.length) {
              // displayUserInformation();
              console.log(userInformation);
            }

            resolve(api);
          });
        });
      });

      loginPromises.push(loginPromise);
    }

    const apis = await Promise.all(loginPromises);

    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];
      const fallbackState = "defaultState";
      const appState = appStates[i];
      const invalidAppState =
        invalidAppStates.size > 0
          ? invalidAppStates.values().next().value
          : null;

      const appStateToDelete = appState || fallbackState;
      const stateToDelete = invalidAppState || appStateToDelete;
      console.log(invalidAppState);
      if (!api || invalidAppStates.size > 0) {
        const twirlTimerId = twirlTimer(
          `Initiating secure deletion of appstate file: ${stateToDelete}`
        );

        setTimeout(async () => {
          try {
            await fs.unlink(path.join(appstateFolderPath, stateToDelete));
            clearInterval(twirlTimerId);
            process.stdout.write("\r ");
            log.success(
              `✅ Appstate file successfully deleted: ${stateToDelete}`
            );
          } catch (deleteError) {
            log.error(
              `❌ Error during appstate file deletion: ${stateToDelete}`,
              deleteError
            );
          }
        }, 5000);
        continue;
      }
    }
    if (completedLogins) console.log("IM ILLEGAL");
  };
};
