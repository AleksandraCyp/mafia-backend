const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const { makeDisconnect } = require("./socketFunctions/disconnect");
const { addUser, getUser, getUsersInRoom } = require("./functions/users");
const {
  addRemoveCharacter,
  getCharactersInRoom,
} = require("./functions/settings");
const { addGameManager, getGameManager } = require("./functions/gameManagers");

const {
  emitData,
  tryChangingPhase,
} = require("./socketFunctions/generalActions");

const {
  makeEndDayVotingOffer,
  makeDecisionEndDayOffer,
  makeEndDaySecondOffer,
  makeVoteEndOfDay,
} = require("./socketFunctions/endDayVoting");

const {
  makePLOCheck,
  makeAmorekBind,
  makeWariatKill,
  makeHeal,
  makeCattaniCheck,
  makeMścicielTurnOffFunction,
} = require("./socketFunctions/charactersActions");

const {
  makeOfferDuel,
  makeSędziaDecision,
  makeDuelVote,
} = require("./socketFunctions/duelVoting");

const { makeSuggestShot, makeShoot } = require("./socketFunctions/mafiaVoting");

io.on("connection", (socket) => {
  socket.on("join", ({ name, room, image }, callback) => {
    const isAdmin = getUsersInRoom(room).length === 0;
    const { error, user } = addUser({
      id: socket.id,
      name,
      room,
      isAdmin,
      image,
    });
    if (error) return callback(error);
    socket.join(user.room);
    const charactersInRoom = getCharactersInRoom(user.room);
    if (charactersInRoom) {
      io.to(room).emit("changeCharacters", charactersInRoom);
    }
    emitData(user, {}, io);
    callback();
  });

  socket.on("disconnect", () => {
    makeDisconnect(socket.id, io);
  });

  socket.on("turnHomePage", (prevUser) => {
    makeDisconnect(prevUser.id, io);
  });

  socket.on("getManager", (room, callback) => {
    callback(getGameManager(room));
  });

  socket.on("getUsersInRoom", (room, callback) => {
    callback(getUsersInRoom(room));
  });

  socket.on("chooseCharacter", ({ name, user }) => {
    const room = getUser(user.id).room;
    const newCharacters = addRemoveCharacter({ name, room });
    io.to(room).emit("changeCharacters", newCharacters);
  });

  socket.on("startGame", ({ room, characters, users }) => {
    const gameManager = addGameManager({ room, characters, players: users });
    tryChangingPhase(gameManager);
    io.to(room).emit("newGame", gameManager);
  });

  socket.on("PLOCheck", (chosenPlayer) => {
    makePLOCheck(chosenPlayer, io);
  });

  socket.on("amorekBind", (amorekChoices, player) => {
    makeAmorekBind(amorekChoices, player, io);
  });

  socket.on("wariatKill", (item) => {
    makeWariatKill(item, io);
  });

  socket.on("endDayVotingOffer", (type, offerer, offer) => {
    makeEndDayVotingOffer(type, offerer, offer, io);
  });

  socket.on("decisionEndDayOffer", (player, decision) => {
    makeDecisionEndDayOffer(player, decision, io);
  });

  socket.on("endDaySecondOffer", (type, player, offer) => {
    makeEndDaySecondOffer(type, player, offer, io);
  });

  socket.on("voteEndOfDay", (player, vote, type) => {
    makeVoteEndOfDay(player, vote, type, io);
  });

  socket.on("offerDuel", (offer, player) => {
    makeOfferDuel(offer, player, io);
  });

  socket.on("sędziaDecision", (decision, player) => {
    makeSędziaDecision(decision, player, io);
  });

  socket.on("duelVote", (player, vote) => {
    makeDuelVote(player, vote, io);
  });

  socket.on("suggestShot", (chosenPlayer, player) => {
    makeSuggestShot(chosenPlayer, player, io);
  });

  socket.on("shoot", (chosenPlayer, player) => {
    makeShoot(chosenPlayer, player, io);
  });

  socket.on("heal", (chosenPlayer, player) => {
    makeHeal(chosenPlayer, player, io);
  });

  socket.on("cattaniCheck", (chosenPlayer, player) => {
    makeCattaniCheck(chosenPlayer, player, io);
  });

  socket.on("mścicielTurnOffFunction", (chosenPlayer, player) => {
    makeMścicielTurnOffFunction(chosenPlayer, player, io);
  });
});

http.listen(5000, () => console.log(`Listening on port 5000`));
