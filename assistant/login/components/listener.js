module.exports = async function ({ api, event }) {
  const path = require("path");
  const fs = require("fs-extra");
  const { exit } = require("process");

  const handlerEvents = require("./handler/handlerEvents");

  const { twirlTimer, config, log } = global.utils;
  const createFuncMessage = global.utils.message;
  const { prefix, hasPrefix, botAdmins, commands } = global.client;

  const message = createFuncMessage(api, event);
  const handlerChat = await handlerEvents(
    api,
    event,
    message,
    prefix,
    hasPrefix,
    botAdmins,
    commands,
    log
  );

  const { onStart, onReply, onReaction } = handlerChat;
  console.log(event.type);
  switch (event.type) {
    case "message":
    case "message_reply":
    case "message_unsend":
      onStart();
      onReply();
      break;
    case "message_reaction":
      onReaction();
      break;
    case "typ":
      // typ();
      break;
    case "presence":
      // presence();
      break;
    case "read_receipt":
      // read_receipt();
      break;
    default:
      break;
  }
};

/* For my future ref
  if (!global.Assistant.onReply.has(info.messageID)) {
    global.Assistant.onReply.set(info.messageID, {
      cmdName,
      author: events.senderID,
    });
    console.log(global.Assistant.onReply);
  } else {
    // If the message ID already exists, skip logging the data
    console.log("Skipping duplicate message ID:", info.messageID);
  }
  */
