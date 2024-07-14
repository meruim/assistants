module.exports = async function ({ api, event }) {
  const path = require("path");
  const fs = require("fs-extra");
  const { exit } = require("process");
  const { twirlTimer, config, log } = global.utils;
  const cmdName = "exampleCommand"; // Replace with your actual command name
  const events = { senderID: "123456" }; // Replace with your actual event object
  const info = { messageID: "abc123" };
  // if (!global.Assistant.onReply.has(info.messageID)) {
  //   global.Assistant.onReply.set(info.messageID, {
  //     cmdName,
  //     author: events.senderID,
  //   });
  //   console.log(global.Assistant.onReply);
  // } else {
  //   // If the message ID already exists, skip logging the data
  //   console.log("Skipping duplicate message ID:", info.messageID);
  // }
  console.log("Sheeeshshh");
};
