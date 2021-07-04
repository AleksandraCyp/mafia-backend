const {
  removeUser,
  getUsersInRoom,
} = require("../functions/users");
const {
  removeAllCharactersInRoom,
} = require("../functions/settings");
const {
  removeGameManager,
  getGameManager,
} = require("../functions/gameManagers");

const {
  emitData,
} = require("./generalActions");

const makeDisconnect = (myId, io) => {
  const user = removeUser(myId);
  if (user) {
    const usersInRoom = getUsersInRoom(user.room);
    if (usersInRoom.length !== 0) {
      if (user.isAdmin) usersInRoom[0].isAdmin = true;
      let gameManager = getGameManager(user.room);
      if (gameManager) {
        const player =
          gameManager.players.find((playerItem) => playerItem.id === user.id) ||
          {};
        gameManager.notifications.unshift({
          text: `Gracz ${player.name} opuścił grę.`,
          to: gameManager.characters,
        });
        if (player.isAlive) {
          player.isAlive = false;
          gameManager.checkIfGameIsOver();
        }
        if (gameManager.endDayVoting.offeredBy) {
          gameManager.notifications.unshift({
            text: "Głosowanie na koniec dnia zostało przerwane.",
            to: gameManager.characters,
          });
          gameManager.endDayVoting.type = undefined;
          gameManager.endDayVoting.type2 = undefined;
          gameManager.endDayVoting.offeredBy = undefined;
          gameManager.endDayVoting.accepted = false;
          gameManager.endDayVoting.agreements = [];
          gameManager.endDayVoting.votes = [];
          gameManager.endDayVoting.offers = [];
        }
        if (gameManager.duel.offeredBy) {
          gameManager.notifications.unshift({
            text: "Pojedynek został przerwany.",
            to: gameManager.characters,
          });
          gameManager.duel.finished = false;
          gameManager.duel.offeredBy = undefined;
          gameManager.duel.offer = undefined;
          gameManager.duel.accepted = false;
          gameManager.duel.votes = [];
        }
      }
      if (!gameManager) gameManager = {};
      emitData(user, gameManager, io);
    }

    if (usersInRoom.length === 0) {
      removeAllCharactersInRoom(user.room);
      removeGameManager(user.room);
    }
  }
};

module.exports = { makeDisconnect };
