const { getGameManager } = require("../functions/gameManagers");
const { emitData, mapPlayers } = require("./generalActions");

const makeEndDayVotingOffer = (type, offerer, offer, io) => {
  const gameManager = getGameManager(offerer.room) || {};
  if (gameManager.phase === "night") return;
  if (gameManager.endDayVoting.offeredBy) return;
  gameManager.endDayVoting.type = type;
  gameManager.endDayVoting.offeredBy = offerer;
  gameManager.endDayVoting.offers.push(offer);
  gameManager.endDayVoting.agreements.push([offerer, true]);
  gameManager.notifications.unshift({
    text: `Gracz ${offerer.name} zaproponował
 ${type === "kill" ? "zabicie" : "sprawdzenie"} ${
      offer.id === offerer.id ? "siebie" : `gracza ${offer.name}`
    }.`,
    to: gameManager.characters.filter(
      (character) =>
        character !== offerer.character.name &&
        character !== offer.character.name
    ),
  });
  gameManager.notifications.unshift({
    text: `Gracz ${offerer.name} zaproponował
 ${type === "kill" ? "zabicie" : "sprawdzenie"} ciebie.`,
    to: gameManager.characters.filter(
      (character) =>
        character === offer.character.name && offerer.id !== offer.id
    ),
  });
  gameManager.notifications.unshift({
    text: `Zaproponowałeś
 ${type === "kill" ? "zabicie" : "sprawdzenie"} ${
      offer.id === offerer.id ? "siebie" : `gracza ${offer.name}`
    }.`,
    to: gameManager.characters.filter(
      (character) => character === offerer.character.name
    ),
  });
  emitData(offerer, gameManager, io);
};

const makeDecisionEndDayOffer = (player, decision, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "night") return;
  if (!gameManager.endDayVoting.offeredBy) return;
  const agreements = gameManager.endDayVoting.agreements;
  agreements.push([player, decision]);
  gameManager.notifications.unshift({
    text: `${decision ? "Zgodziłeś" : "Nie zgodziłeś"} się na to, aby ${
      gameManager.endDayVoting.type === "kill" ? "zabicie" : "sprawdzenie"
    } ${
      gameManager.endDayVoting.offers[0].id === player.id
        ? "ciebie"
        : `gracza ${gameManager.endDayVoting.offers[0].name}`
    } było pierwszą propozycją na koniec dnia.`,
    to: player.character.name,
  });
  emitData(player, gameManager, io);
  const numberVotesCast = agreements.length;
  const numberActivePlayers = gameManager.players.filter((item) => item.isAlive)
    .length;
  if (numberVotesCast === numberActivePlayers) {
    const acceptances = agreements.filter(
      (agreeement) => agreeement[1] === true
    );
    const rejections = agreements.filter(
      (agreeement) => agreeement[1] === false
    );
    const isOfferAccepted = acceptances.length >= rejections.length;
    gameManager.notifications.unshift({
      text: `Propozycja ${
        gameManager.endDayVoting.type === "kill" ? "zabicia" : "sprawdzenia"
      } gracza ${gameManager.endDayVoting.offers[0].name}
       ${isOfferAccepted ? "" : "nie "}została przyjęta.`,
      to: gameManager.characters.filter(
        (character) =>
          character !== gameManager.endDayVoting.offers[0].character.name
      ),
    });
    gameManager.notifications.unshift({
      text: `Propozycja ${
        gameManager.endDayVoting.type === "kill" ? "zabicia" : "sprawdzenia"
      } ciebie
         ${isOfferAccepted ? "" : "nie "}została przyjęta.`,
      to: gameManager.characters.filter(
        (character) =>
          character === gameManager.endDayVoting.offers[0].character.name
      ),
    });
    if (isOfferAccepted) {
      gameManager.endDayVoting.accepted = true;
    } else {
      gameManager.endDayVoting.type = undefined;
      gameManager.endDayVoting.offeredBy = undefined;
      gameManager.endDayVoting.accepted = false;
      gameManager.endDayVoting.agreements = [];
      gameManager.endDayVoting.offers = [];
    }
    emitData(player, gameManager, io);
  }
};

const makeEndDaySecondOffer = (type, player, offer, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "night") return;
  if (!gameManager.endDayVoting.offeredBy) return;
  if (gameManager.endDayVoting.offers[0].id !== player.id) return;
  if (gameManager.endDayVoting.offers.length !== 1) return;
  gameManager.endDayVoting.offers.push(offer);
  gameManager.endDayVoting.type2 = type;
  gameManager.notifications.unshift({
    text: `Gracz ${player.name} dał jako drugą propozycję
     ${type === "kill" ? "zabicie" : "sprawdzenie"} ${
      offer.id === player.id ? "ciebie" : `gracza ${offer.name}`
    }.`,
    to: gameManager.characters.filter(
      (character) => character !== player.character.name
    ),
  });
  gameManager.notifications.unshift({
    text: `Dałeś jako drugą propozycję
     ${type === "kill" ? "zabicie" : "sprawdzenie"} gracza ${offer.name}.`,
    to: gameManager.characters.filter(
      (character) => character === player.character.name
    ),
  });
  emitData(player, gameManager, io);
};

const makeVoteEndOfDay = (player, vote, type, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "night") return;
  if (gameManager.endDayVoting.offers.length !== 2) return;
  if (gameManager.endDayVoting.votes.some((vote) => vote[0].id === player.id))
    return;
  gameManager.endDayVoting.votes.push([player, vote]);
  gameManager.notifications.unshift({
    text: `Zagłosowałeś na ${type === "kill" ? "zabicie" : "sprawdzenie"} ${
      vote.id === player.id ? "ciebie" : `gracza ${vote.name}`
    }.`,
    to: player.character.name,
  });
  emitData(player, gameManager, io);
  const votesCast = gameManager.endDayVoting.votes;
  const activePlayers = gameManager.players.filter((item) => item.isAlive);
  if (votesCast.length === activePlayers.length) {
    const playersPro1 = gameManager.endDayVoting.votes.filter(
      (vote) => vote[1].id === gameManager.endDayVoting.offers[0].id
    );
    const playersPro2 = gameManager.endDayVoting.votes.filter(
      (vote) => vote[1].id === gameManager.endDayVoting.offers[1].id
    );
    gameManager.notifications.unshift({
      text: `Za ${
        gameManager.endDayVoting.type === "kill" ? "zabiciem" : "sprawdzeniem"
      } gracza ${gameManager.endDayVoting.offers[0].name} ${
        playersPro1.length === 1
          ? "był 1 gracz"
          : `było ${playersPro1.length} graczy`
      }${playersPro1.length !== 0 ? ` (${mapPlayers(playersPro1)})` : ""}. Za ${
        gameManager.endDayVoting.type2 === "kill" ? "zabiciem" : "sprawdzeniem"
      } 
          gracza ${gameManager.endDayVoting.offers[1].name} ${
        playersPro2.length === 1
          ? "był 1 gracz"
          : `było ${playersPro2.length} graczy`
      }${playersPro2.length !== 0 ? ` (${mapPlayers(playersPro2)})` : ""}.`,
      to: gameManager.characters.filter(
        (character) =>
          character !== gameManager.endDayVoting.offers[0].character.name &&
          character !== gameManager.endDayVoting.offers[1].character.name
      ),
    });
    gameManager.notifications.unshift({
      text: `Za ${
        gameManager.endDayVoting.type === "kill" ? "zabiciem" : "sprawdzeniem"
      } ciebie
      ${
        playersPro1.length === 1
          ? "był 1 gracz"
          : `było ${playersPro1.length} graczy`
      }${playersPro1.length !== 0 ? ` (${mapPlayers(playersPro1)})` : ""}. Za ${
        gameManager.endDayVoting.type2 === "kill" ? "zabiciem" : "sprawdzeniem"
      } gracza ${gameManager.endDayVoting.offers[1].name} ${
        playersPro2.length === 1
          ? "był 1 gracz"
          : `było ${playersPro2.length} graczy`
      }${playersPro2.length !== 0 ? ` (${mapPlayers(playersPro2)})` : ""}.`,
      to: gameManager.characters.filter(
        (character) =>
          character === gameManager.endDayVoting.offers[0].character.name
      ),
    });
    gameManager.notifications.unshift({
      text: `Za ${
        gameManager.endDayVoting.type === "kill" ? "zabiciem" : "sprawdzeniem"
      } gracza ${gameManager.endDayVoting.offers[0].name}
      ${
        playersPro1.length === 1
          ? "był 1 gracz"
          : `było ${playersPro1.length} graczy`
      }${playersPro1.length !== 0 ? ` (${mapPlayers(playersPro1)})` : ""}. Za ${
        gameManager.endDayVoting.type2 === "kill" ? "zabiciem" : "sprawdzeniem"
      } ciebie ${
        playersPro2.length === 1
          ? "był 1 gracz"
          : `było ${playersPro2.length} graczy`
      }${playersPro2.length !== 0 ? ` (${mapPlayers(playersPro2)})` : ""}.`,
      to: gameManager.characters.filter(
        (character) =>
          character === gameManager.endDayVoting.offers[1].character.name
      ),
    });
    let winner;
    if (playersPro1.length > playersPro2.length) winner = "votesOffer1";
    if (playersPro1.length < playersPro2.length) winner = "votesOffer2";
    if (playersPro1.length === playersPro2.length) {
      const randomNumber = Math.random();
      if (randomNumber <= 0.5) winner = "votesOffer1";
      if (randomNumber > 0.5) winner = "votesOffer2";
    }
    if (winner === "votesOffer1") {
      gameManager.notifications.unshift({
        text: `Wygrało ${
          gameManager.endDayVoting.type === "kill" ? "zabicie" : "sprawdzenie"
        } gracza ${gameManager.endDayVoting.offers[0].name}.`,
        to: gameManager.characters.filter(
          (character) =>
            character !== gameManager.endDayVoting.offers[0].character.name
        ),
      });
      gameManager.notifications.unshift({
        text: `Wygrało ${
          gameManager.endDayVoting.type === "kill" ? "zabicie" : "sprawdzenie"
        } ciebie.`,
        to: gameManager.characters.filter(
          (character) =>
            character === gameManager.endDayVoting.offers[0].character.name
        ),
      });
      if (gameManager.endDayVoting.type === "kill") {
        gameManager.killPlayer(gameManager.endDayVoting.offers[0].id);
      } else {
        gameManager.notifications.unshift({
          text: `Dowiadujecie się, że gracz ${
            gameManager.endDayVoting.offers[0].name
          } to ${
            gameManager.endDayVoting.offers[0].character.name === "Kokietka"
              ? "Miasto"
              : gameManager.endDayVoting.offers[0].fraction
          }.`,
          to: gameManager.characters.filter(
            (character) =>
              character !== gameManager.endDayVoting.offers[0].character.name
          ),
        });
        gameManager.notifications.unshift({
          text: `Gracze dowiadują się, że twoja postać to ${
            gameManager.endDayVoting.offers[0].character.name === "Kokietka"
              ? "Miasto"
              : gameManager.endDayVoting.offers[0].fraction
          }.`,
          to: gameManager.characters.filter(
            (character) =>
              character === gameManager.endDayVoting.offers[0].fraction
          ),
        });
      }
    }
    if (winner === "votesOffer2") {
      gameManager.notifications.unshift({
        text: `Wygrało ${
          gameManager.endDayVoting.type2 === "kill" ? "zabicie" : "sprawdzenie"
        } gracza ${gameManager.endDayVoting.offers[1].name}.`,
        to: gameManager.characters.filter(
          (character) =>
            character !== gameManager.endDayVoting.offers[1].character.name
        ),
      });
      gameManager.notifications.unshift({
        text: `Wygrało ${
          gameManager.endDayVoting.type2 === "kill" ? "zabicie" : "sprawdzenie"
        } ciebie.`,
        to: gameManager.characters.filter(
          (character) =>
            character === gameManager.endDayVoting.offers[1].character.name
        ),
      });
      if (gameManager.endDayVoting.type2 === "kill") {
        gameManager.killPlayer(gameManager.endDayVoting.offers[1].id);
      } else {
        gameManager.notifications.unshift({
          text: `Dowiadujecie się, że gracz ${
            gameManager.endDayVoting.offers[1].name
          } to ${
            gameManager.endDayVoting.offers[1].character.name === "Kokietka"
              ? "Miasto"
              : gameManager.endDayVoting.offers[1].fraction
          }.`,
          to: gameManager.characters.filter(
            (character) =>
              character !== gameManager.endDayVoting.offers[1].character.name
          ),
        });
        gameManager.notifications.unshift({
          text: `Gracze dowiadują się, że twoja postać to ${
            gameManager.endDayVoting.offers[1].character.name === "Kokietka"
              ? "Miasto"
              : gameManager.endDayVoting.offers[1].fraction
          }.`,
          to: gameManager.characters.filter(
            (character) =>
              character === gameManager.endDayVoting.offers[1].character.name
          ),
        });
      }
    }
    gameManager.changePhase();
  }
  emitData(player, gameManager, io);
};

module.exports = {
  makeEndDayVotingOffer,
  makeDecisionEndDayOffer,
  makeEndDaySecondOffer,
  makeVoteEndOfDay,
};
