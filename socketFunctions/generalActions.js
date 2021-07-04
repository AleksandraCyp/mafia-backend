const { getUsersInRoom } = require("../functions/users");

const emitData = (user, gameManager, io) => {
  io.to(user.room).emit("roomData", {
    room: user.room,
    users: getUsersInRoom(user.room),
    manager: gameManager,
  });
};

const tryChangingPhase = (gameManager) => {
  if (gameManager.phase === "night") {
    if (gameManager.currentDay === 0) {
      const isPLOReady =
        !gameManager.isCharacterAlive("PLO") || gameManager.hasPLOActed;
      const isAmorekReady =
        !gameManager.isCharacterAlive("Amorek") || gameManager.hasAmorekActed;
      if (isPLOReady && isAmorekReady) gameManager.changePhase();
    }
    if (gameManager.currentDay > 0) {
      const isMafiaVotingReady = gameManager.mafiaVoting.chosenPlayer;
      const isMścicielReady =
        !gameManager.isCharacterAlive("Mściciel") || gameManager.mścicielChoice;
      const isLekarzReady =
        !gameManager.isCharacterAlive("Lekarz") ||
        gameManager.healedByLekarz ||
        gameManager.prevMścicielChoice === "Lekarz";
      const isCattaniReady =
        !gameManager.isCharacterAlive("Komisarz Cattani") ||
        gameManager.hasCattaniActed || gameManager.prevMścicielChoice === "Komisarz Cattani";;
      if (
        isMafiaVotingReady &&
        isMścicielReady &&
        isLekarzReady &&
        isCattaniReady
      )
        gameManager.changePhase();
    }
  }
};

const mapPlayers = (players) => {
  const allPlayers = players.map((onePlayer, index) => {
    const name = onePlayer[0].name;
    if (index === players.length - 1) return name;
    return name + ", ";
  });
  return allPlayers.join("");
};

module.exports = { emitData, tryChangingPhase, mapPlayers };
