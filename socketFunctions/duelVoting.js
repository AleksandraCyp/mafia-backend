const { getGameManager } = require("../functions/gameManagers");
const { emitData, mapPlayers } = require("./generalActions");

const makeOfferDuel = (offer, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "night") return;
  if (gameManager.duel.finished) return;
  if (gameManager.duel.offeredBy) return;
  gameManager.duel.offeredBy = player;
  gameManager.duel.offer = offer;
  gameManager.notifications.unshift({
    text: `Gracz ${player.name} wyzwał gracza ${offer.name} na pojedynek.`,
    to: gameManager.characters.filter(
      (character) =>
        character !== player.character.name &&
        character !== offer.character.name
    ),
  });
  gameManager.notifications.unshift({
    text: `Gracz ${player.name} wyzwał cię na pojedynek.`,
    to: gameManager.characters.filter(
      (character) => character === offer.character.name
    ),
  });
  gameManager.notifications.unshift({
    text: `Wyzwałeś gracza ${offer.name} na pojedynek.`,
    to: gameManager.characters.filter(
      (character) => character === player.character.name
    ),
  });
  const sędzia = gameManager.players.find(
    (player) => player.character.name === "Sędzia"
  );
  if (gameManager.players.filter((player) => player.isAlive).length < 3) {
    gameManager.duel.finished = true;
    gameManager.duel.offeredBy = undefined;
    gameManager.duel.offer = undefined;
    gameManager.duel.accepted = false;
    gameManager.notifications.unshift({
      text: "Nie oddano żadnego strzału. Nikt nie umiera.",
      to: gameManager.characters,
    });
    emitData(player, gameManager, io);
    return;
  }
  if (!sędzia) {
    gameManager.duel.accepted = true;
  } else {
    if (!sędzia.isAlive || gameManager.mścicielChoice === "Sędzia") {
      const randomNumber = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
      setTimeout(() => {
        gameManager.duel.accepted = true;
        gameManager.notifications.unshift({
          text: `Sędzia wyraził zgodę na pojedynek między graczem ${player.name} a graczem ${offer.name}.`,
          to: gameManager.characters.filter(
            (character) =>
              character !== player.character.name &&
              character !== offer.character.name
          ),
        });
        gameManager.notifications.unshift({
          text: `Sędzia wyraził zgodę na pojedynek między tobą a graczem ${offer.name}.`,
          to: gameManager.characters.filter(
            (character) => character === player.character.name
          ),
        });
        gameManager.notifications.unshift({
          text: `Sędzia wyraził zgodę na pojedynek między graczem ${player.name} a tobą.`,
          to: gameManager.characters.filter(
            (character) => character === offer.character.name
          ),
        });
        emitData(player, gameManager, io);
      }, randomNumber);
    }
  }
  emitData(player, gameManager, io);
};

const makeSędziaDecision = (decision, player, io) => {
  const gameManager = getGameManager(player.room) || {};
  const offeredBy = gameManager.duel.offeredBy;
  const offer = gameManager.duel.offer;
  if (gameManager.phase === "night") return;
  if (gameManager.duel.finished) return;
  if (!gameManager.duel.offeredBy) return;
  if (gameManager.duel.accepted) return;
  gameManager.notifications.unshift({
    text: `Sędzia ${
      decision ? "wyraził zgodę" : "nie wyraził zgody"
    } na pojedynek między graczem ${offeredBy.name} a graczem ${offer.name}.`,
    to:
      gameManager.characters.filter(
        (character) =>
          character !== offeredBy.character.name &&
          character !== offer.character.name &&
          character !== "Sędzia"
      ) || [],
  });
  gameManager.notifications.unshift({
    text: `Sędzia ${
      decision ? "wyraził zgodę" : "nie wyraził zgody"
    } na pojedynek między tobą a graczem ${offer.name}.`,
    to:
      gameManager.characters.filter(
        (character) =>
          character === offeredBy.character.name && character !== "Sędzia"
      ) || [],
  });
  gameManager.notifications.unshift({
    text: `Sędzia ${
      decision ? "wyraził zgodę" : "nie wyraził zgody"
    } na pojedynek między graczem ${offeredBy.name} a tobą.`,
    to:
      gameManager.characters.filter(
        (character) =>
          character === offer.character.name && character !== "Sędzia"
      ) || [],
  });
  gameManager.notifications.unshift({
    text: `${
      decision ? "Wyraziłeś zgodę" : "Nie wyraziłeś zgody"
    } na pojedynek między ${
      offeredBy.id === player.id ? "tobą" : `graczem ${offeredBy.name}`
    } a ${offer.id === player.id ? "tobą" : `graczem ${offer.name}`}.`,
    to: gameManager.characters.filter((character) => character === "Sędzia"),
  }) || [];
  if (!decision) {
    gameManager.duel.offeredBy = undefined;
    gameManager.duel.offer = undefined;
  }
  if (decision) {
    gameManager.duel.accepted = true;
  }
  emitData(player, gameManager, io);
};

const makeDuelVote = (player, vote, io) => {
  const gameManager = getGameManager(player.room) || {};
  if (gameManager.phase === "night") return;
  if (gameManager.duel.finished) return;
  if (!gameManager.duel.offeredBy) return;
  if (!gameManager.duel.offer) return;
  if (!gameManager.duel.accepted) return;
  if (gameManager.duel.votes.some((vote) => vote[0].id === player.id)) return;
  const votes = gameManager.duel.votes;
  if (vote === "noVote") {
    gameManager.notifications.unshift({
      text: "Wstrzymałeś się od głosu.",
      to: player.character.name,
    });
  } else {
    gameManager.notifications.unshift({
      text: `Zagłosowałeś za zabiciem gracza ${vote.name}`,
      to: player.character.name,
    });
  }
  votes.push([player, vote]);
  emitData(player, gameManager, io);
  const numberVotesCast = votes.length;
  const numberDemandedPlayers =
    gameManager.players.filter((item) => item.isAlive).length - 2;
  if (numberVotesCast === numberDemandedPlayers) {
    const offeredBy = gameManager.duel.offeredBy;
    const offer = gameManager.duel.offer;
    const playersProOfferedBy = votes.filter(
      (vote) => vote[1].id === offeredBy.id && vote[0]
    );
    const playersProOffer = votes.filter((vote) => vote[1].id === offer.id);
    const playersNoVote = votes.filter((vote) => vote[1] === "noVote");
    gameManager.notifications.unshift({
      text: `Za zabiciem  gracza ${offeredBy.name} ${
        playersProOfferedBy.length === 1
          ? "był 1 gracz"
          : `było ${playersProOfferedBy.length} graczy`
      }${
        playersProOfferedBy.length !== 0
          ? ` (${mapPlayers(playersProOfferedBy)})`
          : ""
      }. Za zabiciem gracza ${offer.name} ${
        playersProOffer.length === 1
          ? "był 1 gracz"
          : `było ${playersProOffer.length} graczy`
      }${
        playersProOffer.length !== 0 ? ` (${mapPlayers(playersProOffer)})` : ""
      }. ${playersNoVote.length} ${
        playersNoVote.length === 1
          ? "gracz wstrzymał się od głosu"
          : "graczy wstrzymało się od głosu"
      }${playersNoVote.length === 0 ? "" : ` (${mapPlayers(playersNoVote)})`}.`,
      to: gameManager.characters.filter(
        (character) =>
          character !== offeredBy.character.name &&
          character !== offer.character.name
      ),
    });
    gameManager.notifications.unshift({
      text: `Za zabiciem ciebie ${
        playersProOfferedBy.length === 1
          ? "był 1 gracz"
          : `było ${playersProOfferedBy.length} graczy`
      }${
        playersProOfferedBy.length !== 0
          ? ` (${mapPlayers(playersProOfferedBy)})`
          : ""
      }. Za zabiciem gracza ${offer.name} ${
        playersProOffer.length === 1
          ? "był 1 gracz"
          : `było ${playersProOffer.length} graczy`
      }${
        playersProOffer.length !== 0 ? ` (${mapPlayers(playersProOffer)})` : ""
      }. ${playersNoVote.length} ${
        playersNoVote.length === 1
          ? "gracz wstrzymał się od głosu"
          : "graczy wstrzymało się od głosu"
      }${playersNoVote.length === 0 ? "" : ` (${mapPlayers(playersNoVote)})`}.`,
      to: gameManager.characters.filter(
        (character) => character === offeredBy.character.name
      ),
    });
    gameManager.notifications.unshift({
      text: `Za zabiciem  gracza ${offeredBy.name} ${
        playersProOfferedBy.length === 1
          ? "był 1 gracz"
          : `było ${playersProOfferedBy.length} graczy`
      }${
        playersProOfferedBy.length !== 0
          ? ` (${mapPlayers(playersProOfferedBy)})`
          : ""
      }. Za zabiciem ciebie ${
        playersProOffer.length === 1
          ? "był 1 gracz"
          : `było ${playersProOffer.length} graczy`
      }${
        playersProOffer.length !== 0 ? ` (${mapPlayers(playersProOffer)})` : ""
      }. ${playersNoVote.length} ${
        playersNoVote.length === 1
          ? "gracz wstrzymał się od głosu"
          : "graczy wstrzymało się od głosu"
      }${playersNoVote.length === 0 ? "" : ` (${mapPlayers(playersNoVote)})`}.`,
      to: gameManager.characters.filter(
        (character) => character === offer.character.name
      ),
    });
    if (playersProOfferedBy.length === 0 && playersProOffer.length === 0) {
      gameManager.notifications.unshift({
        text: "Nie oddano żadnego strzału. Nikt nie umiera.",
        to: gameManager.characters,
      });
    } else {
      const isOffferedBySzybki =
        (offeredBy.character.name === "Szybki z Miasta" ||
          offeredBy.character.name === "Szybki z Mafii") &&
        gameManager.mścicielChoice !== offeredBy.character.name;
      const isOfferSzybki =
        (offer.character.name === "Szybki z Miasta" ||
          offer.character.name === "Szybki z Mafii") &&
        gameManager.mścicielChoice !== offeredBy.character.name;
      const isNeitherOfferSzybki = !isOffferedBySzybki && !isOfferSzybki;
      const areBothOffersSzybki = isOfferSzybki && isOfferSzybki;
      if (isOffferedBySzybki && !isOfferSzybki) {
        looser = [offer];
      }
      if (!isOffferedBySzybki && isOfferSzybki) {
        looser = [offeredBy];
      }
      if (isNeitherOfferSzybki || areBothOffersSzybki) {
        if (playersProOfferedBy.length > playersProOffer.length)
          looser = [offeredBy];
        if (playersProOfferedBy.length < playersProOffer.length)
          looser = [offer];
        if (playersProOfferedBy.length === playersProOffer.length) {
          looser = [offeredBy, offer];
        }
      }
      gameManager.notifications.unshift({
        text: `Pojedynek przegrywa ${
          looser.length === 1
            ? `gracz ${looser[0].name}`
            : `zarówno gracz ${looser[0].name}, jak i gracz ${looser[1].name}`
        }.`,
        to: gameManager.characters.filter(
          (character) =>
            character !== offeredBy.character.name &&
            character !== offer.character.name
        ),
      });
      gameManager.notifications.unshift({
        text: `${
          looser.some((looser) => looser.id === offeredBy.id)
            ? "Przegrywasz"
            : "Wygrywasz"
        } pojedynek.`,
        to: gameManager.characters.filter(
          (character) => character === offeredBy.character.name
        ),
      });
      gameManager.notifications.unshift({
        text: `${
          looser.some((looser) => looser.id === offer.id)
            ? "Przegrywasz"
            : "Wygrywasz"
        } pojedynek.`,
        to: gameManager.characters.filter(
          (character) => character === offer.character.name
        ),
      });
      looser.forEach((item) => gameManager.killPlayer(item.id));
    }
    gameManager.duel.offeredBy = undefined;
    gameManager.duel.offer = undefined;
    gameManager.duel.accepted = false;
    gameManager.duel.votes = [];
    gameManager.duel.finished = true;
  }
  emitData(player, gameManager, io);
};
module.exports = { makeOfferDuel, makeSędziaDecision, makeDuelVote };
