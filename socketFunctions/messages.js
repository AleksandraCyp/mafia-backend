const { getGameManager } = require("../functions/gameManagers");
const { emitData } = require("./generalActions");

const makeNewMessage = (message, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase !== "day") return;
  if (!player.isAlive) return;
  gameManager.messages.unshift({ message, from: player.name });
  emitData(player, gameManager, io);
};

module.exports = { makeNewMessage };
