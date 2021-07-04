const { getGameManager } = require("../functions/gameManagers");
const { emitData, tryChangingPhase } = require("./generalActions");

const makePLOCheck = (chosenPlayer, io) => {
  const gameManager = getGameManager(chosenPlayer.room) || {};
  if (gameManager.hasPLOActed) return emitData(chosenPlayer, gameManager, io);
  if (gameManager.phase === "day")
    return emitData(chosenPlayer, gameManager, io);
  gameManager.notifications.unshift({
    text: `Sprawdziłeś w nocy funkcję gracza ${chosenPlayer.name}. ${chosenPlayer.name} to ${chosenPlayer.character.name} (${chosenPlayer.fraction}).`,
    to: ["PLO"],
  });
  gameManager.hasPLOActed = true;
  tryChangingPhase(gameManager);
  emitData(chosenPlayer, gameManager, io);
};

const makeAmorekBind = (amorekChoices, player, io) => {
  const gameManager = getGameManager(amorekChoices[0].room) || {};
  if (gameManager.hasAmorekActed) return emitData(player, gameManager, io);
  if (gameManager.phase === "day") return emitData(player, gameManager, io);
  gameManager.notifications.unshift({
    text: `Połączyłeś więzami miłości graczy: ${
      amorekChoices[0].id === player.id ? "ty" : amorekChoices[0].name
    } i ${amorekChoices[1].id === player.id ? "ty" : amorekChoices[1].name}.`,
    to: ["Amorek"],
  });
  gameManager.hasAmorekActed = true;
  gameManager.boundByAmorek = amorekChoices;
  tryChangingPhase(gameManager);
  emitData(amorekChoices[0], gameManager, io);
};

const makeWariatKill = (item, io) => {
  const gameManager = getGameManager(item.room) || {};
  if (gameManager.hasWariatActed) return emitData(item, gameManager, io);
  if (gameManager.phase === "night") return emitData(item, gameManager, io);
  if (!gameManager.hasWariatActed && gameManager.mścicielChoice !== "Wariat") {
    gameManager.notifications.unshift({
      text: `Zabiłeś w szale gracza ${item.name}`,
      to: "Wariat",
    });
    gameManager.killPlayer(item.id);
    gameManager.hasWariatActed = true;
  }
  emitData(item, gameManager, io);
};

const makeHeal = (chosenPlayer, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.healedByLekarz) return emitData(player, gameManager, io);
  if (chosenPlayer.id === player.id && gameManager.hasLekarzHealedHimself)
    return emitData(player, gameManager, io);
  if (chosenPlayer.id === player.id) gameManager.hasLekarzHealedHimself = true;
  gameManager.healedByLekarz = chosenPlayer;
  gameManager.notifications.unshift({
    text: `Uleczyłeś ${
      chosenPlayer.id === player.id
        ? "siebie samego"
        : `gracza ${chosenPlayer.name}`
    }.`,
    to: "Lekarz",
  });
  tryChangingPhase(gameManager);
  emitData(player, gameManager, io);
};

const makeCattaniCheck = (chosenPlayer, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.hasCattaniActed) return emitData(player, gameManager, io);
  gameManager.hasCattaniActed = true;
  gameManager.notifications.unshift({
    text: `Sprawdziłeś w nocy frakcję gracza ${chosenPlayer.name}. ${chosenPlayer.name} to ${chosenPlayer.fraction}.`,
    to: "Komisarz Cattani",
  });
  tryChangingPhase(gameManager);
  emitData(player, gameManager, io);
};

const makeMścicielTurnOffFunction = (chosenPlayer, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.mścicielChoice) return emitData(player, gameManager, io);
  if (gameManager.prevMścicielChoice === chosenPlayer.character.name) return;
  gameManager.mścicielChoice = chosenPlayer.character.name;
  gameManager.notifications.unshift({
    text: `Wyłączyłeś funkcję graczowi ${chosenPlayer.name}.`,
    to: "Mściciel",
  });
  tryChangingPhase(gameManager);
  emitData(player, gameManager, io);
};

module.exports = {
  makePLOCheck,
  makeAmorekBind,
  makeWariatKill,
  makeHeal,
  makeCattaniCheck,
  makeMścicielTurnOffFunction,
};
