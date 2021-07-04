const { GameManager } = require("../GameManager");

let gameManagers = [];

const addGameManager = ({ room, characters, players }) => {
  addCharactersToPlayers(players, characters);
  addLifeToPlayers(players);
  addFractionToPlayers(players);
  const newGameManger = new GameManager(room, characters, players);
  gameManagers.push(newGameManger);
  return newGameManger;
};

const removeGameManager = (room) =>
  (gameManagers = gameManagers.filter((manager) => manager.room !== room));

const getGameManager = (room) =>
  gameManagers.find((manager) => manager.room === room);

const addCharactersToPlayers = (players, characters) => {
  const setCharactersAndNumbers = characters.map((character) => [
    character,
    Math.random(),
  ]);
  const shuffledCharactersAndNumbers = setCharactersAndNumbers.sort(
    (a, b) => a[1] - b[1]
  );
  const shuffledCharacters = shuffledCharactersAndNumbers.map(
    (character) => character[0]
  );
  players.forEach((player) => {
    const index = players.indexOf(player);
    player.character = shuffledCharacters[index];
  });
};

const addLifeToPlayers = (players) =>
  players.forEach((player) => (player.isAlive = true));

const addFractionToPlayers = (players) => {
  const mafiaCharacters = [
    "Szybki z Mafii",
    "Terrorysta",
    "Kokietka",
    "Mściciel",
  ];
  players.forEach((player) => {
    if (mafiaCharacters.includes(player.character.name)) {
      player.fraction = "Mafia";
    } else {
      player.fraction = "Miasto";
    }
  });
};

module.exports = { addGameManager, removeGameManager, getGameManager };
