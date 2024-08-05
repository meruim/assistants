module.exports = async function (
  api,
  event,
  message,
  prefix,
  hasPrefix,
  botAdmins,
  commands,
  log
) {
  async function onStart() {
    if (event.body) {
      const lowerBody = event.body.toLowerCase();
      let command, args, commandName;

      if (lowerBody.startsWith("prefix")) {
        const pfx = hasPrefix ? prefix : "";
        const output = [
          "┌────[🪶]────⦿",
          `│✨ My Prefix: ${pfx || "No prefix"}`,
          `│ Type "${pfx}help" to show all my available commands.`,
          "└────────⦿",
        ];
        return message.reply(output.join("\n"));
      }

      const hasCmdPrefix = hasPrefix && lowerBody.startsWith(prefix);
      [command, ...args] = lowerBody
        .slice(hasCmdPrefix ? prefix.length : 0)
        .trim()
        .split(/\s+/);
      const cmds = command.toLowerCase();

      if (!commands.has(cmds)) {
        if (hasCmdPrefix) {
          api.sendMessage(
            `⚠️ Command not found. Please type "${prefix}help" to show available commands!`,
            event.threadID,
            event.messageID
          );
        }
        return;
      }

      commandName = cmds;
      api.sendTypingIndicator(event.threadID);

      try {
        api.getUserInfo(event.senderID, (err, ret) => {
          if (err) return console.error(err);
          const senderName = ret[event.senderID].name;
          log.info(
            "CALL-COMMAND",
            `${commandName} | ${senderName} | ${event.senderID} | ${event.threadID} |\n${event.body}`
          );
        });

        await commands.get(commandName).onStart({ api, event, args, message });
      } catch (error) {
        api.sendMessage(
          `Error in command '${commandName}': ${error.stack
            .split("\n")
            .slice(0, 3)
            .join("\n")}`,
          event.threadID
        );
        log.error(error);
      }
    }
  }

  async function onReply() {
    // Codes here
  }

  async function onReaction() {
    if (event.reaction == "😠" && [""].includes(event.userID)) {
      api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
        if (err) return console.log(err);
      });
    } else if (
      event.reaction == "❌" &&
      event.senderID == api.getCurrentUserID() &&
      ["100055592632190", "100057460711194"].includes(event.userID)
    ) {
      message.unsend(event.messageID);
    }
  }

  return {
    onStart,
    onReply,
    onReaction,
  };
};
