module.exports = {
  config: {
    name: "pending",
    version: "1.0",
    author: "لوفي",
    countDown: 5,
    role: 2,
  },

  onReply: async function ({ api, event, Reply }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    var count = 0;

    if (
      (isNaN(body) && (body.startsWith("c") || body === "cancel")) ||
      body.indexOf("cancel") === 0
    ) {
      const index = body.slice(1, body.length).split(/\s+/);
      for (const singleIndex of index) {
        if (
          isNaN(singleIndex) ||
          singleIndex <= 0 ||
          singleIndex > Reply.pending.length
        ) {
          return api.sendMessage(
            `${singleIndex} is not a valid number`,
            threadID,
            messageID
          );
        }
        api.removeUserFromGroup(
          api.getCurrentUserID(),
          Reply.pending[singleIndex - 1].threadID
        );
        count += 1;
      }
      return api.sendMessage(
        `Refused ${count} thread(s)!`,
        threadID,
        messageID
      );
    } else {
      const index = body.split(/\s+/);
      for (const singleIndex of index) {
        if (
          isNaN(singleIndex) ||
          singleIndex <= 0 ||
          singleIndex > Reply.pending.length
        ) {
          return api.sendMessage(
            `${singleIndex} is not a valid number`,
            threadID,
            messageID
          );
        }
        api.sendMessage(
          `💬Please Type "-help" to show my command."`,
          Reply.pending[singleIndex - 1].threadID
        );
        count += 1;
      }
      return api.sendMessage(
        `Approved successfully ${count} thread(s)!`,
        threadID,
        messageID
      );
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    var msg = "",
      index = 1;

    try {
      var spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      var pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
    } catch (e) {
      return api.sendMessage(
        "Can't get the pending list!",
        threadID,
        messageID
      );
    }

    const list = [...spam, ...pending].filter(
      (group) => group.isSubscribed && group.isGroup
    );

    for (const single of list) {
      msg += `${index++}/ ${single.name} (${single.threadID})\n`;
    }

    if (list.length != 0) {
      return api.sendMessage(
        `»「PENDING」«❮ The total number of threads to approve is: ${list.length} thread(s) ❯\n\n${msg}`,
        threadID,
        (err, info) => {
          global.Assistant.onReply.set(info.messageID, {
            commandName: "pending",
            messageID: info.messageID,
            author: event.senderID,
            pending: list,
          });
        },
        messageID
      );
    } else {
      return api.sendMessage(
        "「PENDING」There is no thread in the pending list",
        threadID,
        messageID
      );
    }
  },
};
