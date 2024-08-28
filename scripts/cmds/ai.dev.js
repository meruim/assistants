const axios = require("axios");
const { config } = global.utils;
const API = config.admin.api;
module.exports = {
  config: {
    name: "ai",
    description: "Interact with an AI to get responses to your questions.",
    usage: "ai <question>",
    author: "VILLAVER",
    role: 0,
    cooldown: 10,
  },

  onStart: async function ({
    api,
    event,
    args,
    message,
    getName,
    commandName,
  }) {
    try {
      const userID = event.senderID;

      const prompt = args.join(" ");
      if (!prompt) {
        const responses = [
          "Hello, how can I help you?",
          "Hello, ano ang iyong katanungan?",
          "Ano ang maitutulong ko?",
          "What is your question?",
          "Hello! I'm an AI and always ready to chat. How can I assist you today?",
        ];

        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];
        return api.sendMessage(randomResponse, event.threadID, event.messageID);
      }
      const phrases = [
        "🔍 | Just a moment, I'm fetching the best answers for you.",
        "🔍 | Please hold on while I retrieve the information you're looking for.",
        "🔍 | I appreciate your patience as I gather the most relevant answers for you.",
        "✨ | Hang tight, I'm working on finding the appropriate responses.",
        "💫 | Please bear with me as I fetch the answers you need.",
        "🤖 | Almost there! I'm in the process of retrieving the requested information.",
        "✨ | Just a brief pause while I search for the most accurate responses.",
        "🔍 | I'm currently gathering the best answers for you.",
        "✨ | I'm actively fetching the information you're seeking - it won't be long!",
        "(⁠ ⁠╹⁠▽⁠╹⁠ ⁠)| I'm on it! Just a moment while I fetch the most suitable answers for you.",
      ];

      const waitQue = phrases[Math.floor(Math.random() * phrases.length)];

      const waitingMessage = await message.reply(waitQue);
      const name = await getName(userID);

      const response = await axios.get(
        `https://ggwp-yyxy.onrender.com/gpt4?prompt=${prompt}&uid=${userID}`
      );
      const res = response.data.gpt4;
      message.reply(res, async (err, info) => {
        global.Assistant.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
        });
      });
    } catch (error) {
      console.error("Error processing AI request:", error.stack);
      api.sendMessage(
        "Failed to get AI response. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },

  onReply: async function ({ message, event, Reply, args, api }) {
    let { author, commandName } = Reply;

    const uid = event.senderID;
    if (uid != author) return;
    const prompt = args.join(" ");
    try {
      const response = await axios.get(
        `https://ggwp-yyxy.onrender.com/gpt4?prompt=${prompt}&uid=${uid}`
      );
      const res = response.data.gpt4;
      message.reply(res, async (err, info) => {
        global.Assistant.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
        });
      });
    } catch (error) {
      console.error("Error processing AI request:", error);
      api.sendMessage(
        "Failed to get AI response. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },
};
