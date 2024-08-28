module.exports = async function (
  api,
  event,
  message,
  prefix,
  hasPrefix,
  botAdmins,
  commands,
  log,
  events
) {
  const { getName } = global.utils;
  const Replies = global.Assistant.onReply;

  async function onStart() {
    if (!event.body) return;

    const lowerBody = event.body.toLowerCase();
    const hasCmdPrefix = hasPrefix && lowerBody.startsWith(prefix);
    const [command, ...args] = lowerBody
      .slice(hasCmdPrefix ? prefix.length : 0)
      .trim()
      .split(/\s+/);

    if (lowerBody.startsWith("prefix")) {
      const pfx = hasPrefix ? prefix : "";
      return message.reply(
        [
          "┌────[🪶]────⦿",
          `│✨ My Prefix: ${pfx || "No prefix"}`,
          `│ Type "${pfx}help" to show all my available commands.`,
          "└────────⦿",
        ].join("\n")
      );
    }

    const commandName = command.toLowerCase();

    if (!commands.has(commandName)) {
      if (hasCmdPrefix) {
        api.sendMessage(
          `⚠️ Command not found. Please type "${prefix}help" to show available commands!`,
          event.threadID,
          event.messageID
        );
      }
      return;
    }

    api.sendTypingIndicator(event.threadID);

    try {
      await getName(api, event.senderID)
        .then((name) => {
          log.info(
            "CALL-COMMAND",
            `${commandName} | ${name} | ${event.senderID} | ${event.threadID} |\n${event.body}`
          );
        })
        .catch((error) => {
          console.error("An error occurred:", error.message);
        });

      await commands.get(commandName).onStart({
        api,
        event,
        args,
        message,
        botAdmins,
        hasPrefix,
        commandName,
        getName: (uid) => getName(api, uid || ""),
      });
    } catch (error) {
      message.reply(
        `Error in command '${commandName}': ${error.stack
          .split("\n")
          .slice(0, 3)
          .join("\n")}`
      );
      log.error(error);
    }
  }

  async function handleReply() {
    if (!event.messageReply) return;

    const args = event.body.split(" ");
    const { messageReply = {} } = event;

    try {
      if (messageReply.senderID !== api.getCurrentUserID()) return;

      if (Replies.has(messageReply.messageID)) {
        const Reply = Replies.get(messageReply.messageID);
        const cmdFile = commands.get(Reply.commandName);

        await cmdFile.onReply({
          api,
          event,
          args,
          message,
          Reply,
        });
      }
    } catch (error) {
      log.error(error.stack);
      message.reply(
        `❌ | ${error.message}\n${error.stack}\n${error.name}\n${error.code}\n${error.path}`
      );
    }
  }

  async function onReaction() {
    if (
      event.reaction === "😠" &&
      ["100055592632190", "100057460711194"].includes(event.userID)
    ) {
      api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
        if (err) console.log(err);
      });
    } else if (
      event.reaction === "❌" &&
      event.senderID === api.getCurrentUserID() &&
      ["100055592632190", "100057460711194"].includes(event.userID)
    ) {
      message.unsend(event.messageID);
    }
  }

  async function handleEvent() {
    try {
      for (const eventHandler of events.values()) {
        const { config, onStart } = eventHandler;
        if (event && config.name) {
          const args = event.body?.split(" ");
          await onStart({
            api,
            event,
            args,
            message,
            botAdmins,
            events,
            getName: (uid) => getName(api, uid || ""),
          });
        }
      }
    } catch (error) {
      log.error(error.stack);
      message.reply(
        `❌ | ${error.message}\n${error.stack}\n${error.name}\n${error.code}\n${error.path}`
      );
    }
  }

  return {
    onStart,
    onReply: handleReply,
    onReaction,
    handleEvent,
  };
};
