const { getGameManager } = require("../functions/gameManagers");
const { emitData, tryChangingPhase } = require("./generalActions");

const makeSuggestShot = (chosenPlayer, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "day") return;
  const mafiaPlayers = gameManager.players.filter(
    (item) => item.fraction === "Mafia"
  );
  const mafiaCharacters = mafiaPlayers.map((item) => item.character.name);
  const votes = gameManager.mafiaVoting.votes;
  const alreadyCastVoteIndex = votes.findIndex(
    (vote) => vote[0].id === player.id
  );
  if (alreadyCastVoteIndex === -1) {
    votes.push([player, chosenPlayer]);
    gameManager.notifications.unshift({
      text: `Gracz ${player.name} zasugerował strzał w ${
        chosenPlayer.id === player.id ? "siebie" : `gracza ${chosenPlayer.name}`
      }.`,
      to: mafiaCharacters.filter((item) => item !== player.character.name),
    });
    gameManager.notifications.unshift({
      text: `Zasugerowałeś strzał w ${
        chosenPlayer.id === player.id ? "siebie" : `gracza ${chosenPlayer.name}`
      }.`,
      to: mafiaCharacters.filter((item) => item === player.character.name),
    });
    gameManager.notifications.unshift({
      text: `Gracz ${player.name} zasugerował strzał w ciebie.`,
      to: mafiaCharacters.filter(
        (item) =>
          item === chosenPlayer.character.name && player.id !== chosenPlayer.id
      ),
    });
  }
  if (
    alreadyCastVoteIndex > -1 &&
    votes[alreadyCastVoteIndex][1].id !== chosenPlayer.id
  ) {
    votes[alreadyCastVoteIndex] = [player, chosenPlayer];
    gameManager.notifications.unshift({
      text: `Gracz ${player.name} zmienił zdanie. Zasugerował strzał w ${
        chosenPlayer.id === player.id ? "siebie" : `gracza ${chosenPlayer.name}`
      }.`,
      to: mafiaCharacters.filter((item) => item !== player.character.name),
    });
    gameManager.notifications.unshift({
      text: `Zamieniłeś zdanie. Zasugerowałeś strzał w ${
        chosenPlayer.id === player.id ? "siebie" : `gracza ${chosenPlayer.name}`
      }.`,
      to: mafiaCharacters.filter((item) => item === player.character.name),
    });
    gameManager.notifications.unshift({
      text: `Gracz ${player.name} zmienił zdanie. Zasugerował strzał w ciebie.`,
      to: mafiaCharacters.filter(
        (item) =>
          item === chosenPlayer.character.name && player.id !== chosenPlayer.id
      ),
    });
  }
  emitData(player, gameManager, io);
};

const makeShoot = (chosenPlayer, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "day") return;
  if (gameManager.mafiaVoting.chosenPlayer)
    return emitData(player, gameManager, io);
  gameManager.mafiaVoting.chosenPlayer = chosenPlayer;
  const mafiaPlayers = gameManager.players.filter(
    (item) => item.fraction === "Mafia"
  );
  const mafiaCharacters = mafiaPlayers.map((item) => item.character.name);
  gameManager.notifications.unshift({
    text: `Szef Mafii (${player.name}) zadecydował, że oddajecie strzał w ${
      chosenPlayer.id === player.id ? "niego" : `gracza ${chosenPlayer.name}`
    }.`,
    to: mafiaCharacters.filter(
      (item) =>
        item !== player.character.name && item !== chosenPlayer.character.name
    ),
  });
  gameManager.notifications.unshift({
    text: `Zadecydowałeś, że oddajecie strzał w ${
      chosenPlayer.id === player.id ? "ciebie" : `gracza ${chosenPlayer.name}`
    }.`,
    to: mafiaCharacters.filter((item) => item === player.character.name),
  });
  gameManager.notifications.unshift({
    text: `Szef Mafii (${player.name}) zadecydował, że oddajecie strzał w ciebie.`,
    to: mafiaCharacters.filter(
      (item) =>
        item === chosenPlayer.character.name && chosenPlayer.id !== player.id
    ),
  });
  tryChangingPhase(gameManager);
  emitData(player, gameManager, io);
};

module.exports = { makeSuggestShot, makeShoot };
