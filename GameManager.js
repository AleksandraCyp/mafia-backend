class GameManager {
  constructor(room, characters, players) {
    this.room = room;
    this.characters = characters.map((character) => character.name); //tablica z samymi postaciami
    this.players = players; // postaci występują razem z pokojem
    this.notifications = [
      { text: "Zerowa noc.", to: this.characters },
      { text: "Gra rozpoczęła się.", to: this.characters },
    ];
    this.phase = "night";
    this.mafiaLeader = this.findMafiaLeader();
    this.currentDay = 0;
    this.boundByAmorek = [];
    this.terrorystaExplosionNumber = 1;
    this.endDayVoting = {
      type: undefined,
      type2: undefined,
      offeredBy: undefined,
      accepted: false,
      agreements: [], // [player: player1, vote: ]
      offers: [], // [{player1} type: , {player2}]
      votes: [], // [player: player1, vote: ]
    };
    this.duel = {
      finished: false,
      offeredBy: undefined,
      offer: undefined,
      accepted: false,
      votes: [],
    };
    this.mafiaVoting = {
      votes: [],
      chosenPlayer: undefined,
    };
    this.healedByLekarz = undefined;
    this.hasLekarzHealedHimself = false;
    this.mścicielChoice = undefined;
    this.hasPLOActed = false;
    this.hasCattaniActed = false;
    this.hasAmorekActed = false;
    this.hasWariatActed = false;
    this.isGameOver = false;
    this.winningFraction = undefined;
  }

  getAlivePlayers() {
    return this.players.filter((player) => player.isAlive);
  }

  checkIfGameIsOver() {
    const alivePlayers = this.getAlivePlayers();
    const hasFractionWon = (fraction) => {
      return alivePlayers.every((player) => player.fraction === fraction);
    };
    const hasMafiaWon = hasFractionWon("Mafia");
    const hasMiastoWon = hasFractionWon("Miasto");
    if (hasMafiaWon || hasMiastoWon) {
      this.isGameOver = true;
      this.notifications.unshift({
        text: `Koniec gry.`,
        to: this.characters,
      });
      if (hasMiastoWon && hasMafiaWon) {
        this.winningFraction = "Mafia i frakcja Miasto";
        this.notifications.unshift({
          text: `Remis. Wygrała frakcja ${this.winningFraction}.`,
          to: this.characters,
        });
      } else if (hasMiastoWon) {
        this.winningFraction = "Miasto";
        this.notifications.unshift({
          text: `Wygrała frakcja ${this.winningFraction}.`,
          to: this.characters,
        });
      } else if (hasMafiaWon) {
        this.winningFraction = "Mafia";
        this.notifications.unshift({
          text: `Wygrała frakcja ${this.winningFraction}.`,
          to: this.characters,
        });
      }
    }
  }

  findMafiaLeader() {
    const alivePlayers = this.getAlivePlayers();
    if (alivePlayers.find((player) => player.character.name === "Kokietka"))
      return "Kokietka";
    if (alivePlayers.find((player) => player.character.name === "Terrorysta"))
      return "Terrorysta";
    if (
      alivePlayers.find((player) => player.character.name === "Szybki z Mafii")
    )
      return "Szybki z Mafii";
    if (alivePlayers.find((player) => player.character.name === "Mściciel"))
      return "Mściciel";
    return "";
  }

  changePhase() {
    let alivePlayers = this.players.filter((player) => player.isAlive);
    const aliveMiastoPlayers = alivePlayers.filter(
      (player) => player.fraction === "Miasto"
    );
    if (this.phase === "day" && !this.isGameOver) {
      this.phase = "night";
      this.endDayVoting.type = undefined;
      this.endDayVoting.type2 = undefined;
      this.endDayVoting.offeredBy = undefined;
      this.endDayVoting.accepted = false;
      this.endDayVoting.agreements = [];
      this.endDayVoting.votes = [];
      this.endDayVoting.offers = [];
      this.duel.finished = false;
      this.mafiaVoting.votes = [];
      this.mafiaVoting.chosenPlayer = undefined;
      this.healedByLekarz = undefined;
      this.prevMścicielChoice = this.mścicielChoice;
      this.mścicielChoice = undefined;
      this.hasCattaniActed = false;
      this.notifications.unshift({
        text: "Zapada noc.",
        to: this.characters,
      });
      if (
        aliveMiastoPlayers.length < 3 &&
        this.isCharacterAlive(this.prevMścicielChoice) &&
        this.isCharacterAlive("Mściciel")
      )
        this.mścicielChoice = true;
    } else if (this.phase === "night" && !this.isGameOver) {
      if (this.currentDay > 0) {
        if (
          !this.isCharacterAlive("Lekarz") ||
          this.prevMścicielChoice === "Lekarz"
        ) {
          this.killPlayer(this.mafiaVoting.chosenPlayer.id);
        } else {
          if (this.healedByLekarz.id !== this.mafiaVoting.chosenPlayer.id) {
            this.killPlayer(this.mafiaVoting.chosenPlayer.id);
          } else {
            this.notifications.unshift({
              text: "Tej nocy nikt nie umiera.",
              to: this.characters,
            });
          }
        }
      }
      this.phase = "day";
      this.currentDay += 1;
      alivePlayers = this.players.filter((player) => player.isAlive);
      const aliveMafiaCount = alivePlayers.filter(
        (player) => player.fraction === "Mafia"
      ).length;
      const aliveMiastoCount = alivePlayers.filter(
        (player) => player.fraction === "Miasto"
      ).length;
      if (!this.isGameOver) {
        this.notifications.unshift({
          text: `Wstaje nowy dzień. Stan gry: Mafia - ${aliveMafiaCount}, Miasto - ${aliveMiastoCount}.`,
          to: this.characters,
        });
      }
    }
  }

  isCharacterAlive(searchedCharacter) {
    const alivePlayers = this.players.filter((player) => player.isAlive);
    const character = alivePlayers.find(
      (player) => player.character.name === searchedCharacter
    );
    return character ? true : false;
  }

  killPlayer(id) {
    const sendNotification = (player) => {
      this.notifications.unshift({
        text: `${player.name} umiera.`,
        to: this.characters.filter(
          (character) => character !== player.character.name
        ),
      });
      this.notifications.unshift({
        text: "Umierasz.",
        to: this.characters.filter(
          (character) => character === player.character.name
        ),
      });
    };
    const handleBoundPlayer = (killedPlayer) => {
      const isBoundPlayer = this.boundByAmorek.some(
        (amorekBound) => amorekBound.id === killedPlayer.id
      );
      if (isBoundPlayer) {
        let otherBoundPlayer = this.boundByAmorek.find(
          (amorekBound) => amorekBound.id !== killedPlayer.id
        );
        otherBoundPlayer = this.players.find(
          (player) => player.id === otherBoundPlayer.id
        );
        if (otherBoundPlayer.isAlive) sendNotification(otherBoundPlayer);
        otherBoundPlayer.isAlive = false;
        handleTerrorysta(otherBoundPlayer);
      }
    };
    const handleTerrorysta = (killedPlayer) => {
      const isPlayerTerrorysta = killedPlayer.character.name === "Terrorysta";
      if (isPlayerTerrorysta) {
        if (this.terrorystaExplosionNumber === 1) {
          const alivePlayers = this.players.filter((player) => player.isAlive);
          if (alivePlayers.length > 0) {
            const explodingPlayerIndex = this.players.findIndex(
              (player) => player.id === killedPlayer.id
            );
            let explodedPlayer = this.players.find(
              (player, index) => player.isAlive && index > explodingPlayerIndex
            );
            if (!explodedPlayer) {
              explodedPlayer = alivePlayers[0];
            }
            this.notifications.unshift({
              text: `Wybuchasz w gracza ${explodedPlayer.name}.`,
              to: this.characters.filter(
                (character) => character === "Terrorysta"
              ),
            });
            explodedPlayer.isAlive = false;
            sendNotification(explodedPlayer);
            handleBoundPlayer(explodedPlayer);
          }
        }
      }
    };
    const handleŚwięty = (killedPlayer) => {
      const isPlayerŚwięty =
        killedPlayer.character.name === "Święty" &&
        this.mścicielChoice !== "Święty";
      if (!isPlayerŚwięty) return;
      const isItDuel = this.duel.offeredBy;
      const isItEndDayVoting = this.endDayVoting.offeredBy;
      if (isItEndDayVoting) {
        const alivePlayersVotingOnŚwięty = this.endDayVoting.votes.filter(
          (vote) => vote[1].character.name === "Święty" && vote[0].isAlive
        );
        const playerVotingOnŚwięty = alivePlayersVotingOnŚwięty.map(
          (vote) => vote[0]
        );
        playerVotingOnŚwięty.forEach((player) => {
          const properPlayer = this.players.find(
            (item) => item.id === player.id
          );
          properPlayer.isAlive = false;
          sendNotification(player);
          handleTerrorysta(player);
          handleBoundPlayer(player);
        });
      }
      if (isItDuel) {
        const alivePlayersVotingOnŚwięty = this.duel.votes.filter(
          (vote) => vote[1].character.name === "Święty" && vote[0].isAlive
        );
        const playerVotingOnŚwięty = alivePlayersVotingOnŚwięty.map(
          (vote) => vote[0]
        );
        playerVotingOnŚwięty.forEach((player) => {
          const properPlayer = this.players.find(
            (item) => item.id === player.id
          );
          properPlayer.isAlive = false;
          sendNotification(player);
          handleTerrorysta(player);
          handleBoundPlayer(player);
        });
      }
    };
    const killedPlayer = this.players.find((player) => player.id === id);
    killedPlayer.isAlive = false;
    sendNotification(killedPlayer);
    handleTerrorysta(killedPlayer);
    handleBoundPlayer(killedPlayer);
    handleŚwięty(killedPlayer);
    this.checkIfGameIsOver();
    this.mafiaLeader = this.findMafiaLeader();
  }
}

module.exports = { GameManager };
