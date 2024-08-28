const Groq = require("groq-sdk");
const { config } = global.utils;
const groqCloudApiKey = config.apiKeys.groqCloudApiKey;

const conversations = {};

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
    const prompt = args.join(" ");

    if (!prompt) {
      return message.reply("Please provide a prompt!");
    }
    if (!groqCloudApiKey) {
      return message.reply("Please provide a groqCloudApiKey in the config.");
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

    const userId = event.senderID;

    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
      ];
    }

    conversations[userId].push({
      role: "user",
      content: prompt,
    });

    try {
      const response = await getGroqChatCompletion(conversations[userId]);

      conversations[userId].push({
        role: "assistant",
        content: response,
      });

      message.reply(response, async (err, info) => {
        global.Assistant.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
        });
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      message.reply("An error occurred while processing your request.");
    }
  },

  onReply: async function ({ message, event, Reply, args, api }) {
    let { author, commandName } = Reply;

    const userId = event.senderID;
    if (userId != author) return;
    const prompt = args.join(" ");
    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
      ];
    }

    conversations[userId].push({
      role: "user",
      content: prompt,
    });

    try {
      const response = await getGroqChatCompletion(conversations[userId]);

      conversations[userId].push({
        role: "assistant",
        content: response,
      });

      message.reply(response, async (err, info) => {
        global.Assistant.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
        });
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      message.reply("An error occurred while processing your request.");
    }
  },
};

const getGroqChatCompletion = async (conversationHistory) => {
  const groq = new Groq({
    apiKey: groqCloudApiKey,
  });

  const completion = await groq.chat.completions.create({
    messages: conversationHistory,
    model: "llama3-8b-8192",
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    stop: null,
    stream: false,
  });

  return completion.choices[0].message.content;
};
