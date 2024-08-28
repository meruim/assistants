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

  const { onStart, onReply, onReaction, handleEvent } = handlerChat;

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
    case "event":
      handleEvent();
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
