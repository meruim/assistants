const { onReply } = require("./ai");

module.exports = {
  config: {
    name: "test",
    description: "Interact with an AI to get responses to your questions.",
    usage: "ai <question>",
    author: "VILLAVER",
    role: 0,
    cooldown: 10,
  },
  onStart: async ({ api, event, message, commandName, args }) => {
    message.reply("Prepare", async (err, info) => {
      global.Assistant.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
      });
    });
  },

  onReply: async ({ api, event, message, Reply }) => {
    const { author, commandName } = Reply;

    if (author != event.senderID) {
      return;
    }
    message.reply("Success", async (err, info) => {
      global.Assistant.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
      });
    });
  },
};
