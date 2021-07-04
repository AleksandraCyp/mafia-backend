let characters = [];

const addRemoveCharacter = ({ name, room }) => {
  const charactersInRoom = getCharactersInRoom(room);
  if (charactersInRoom.some(character => character.name === name)) {
    const newCharacters = characters.filter(
      (character) => character.room !== room || (character.room === room && character.name !== name)
    );
    characters = newCharacters; 
    return getCharactersInRoom(room);
  }
  characters = [...characters, { name, room }];
  return getCharactersInRoom(room);
};

const getCharactersInRoom = room => {
  return characters.filter(character => character.room === room);
}

const removeAllCharactersInRoom = room => {
  characters = characters.filter(character => character.room !== room);
}

module.exports = { addRemoveCharacter, getCharactersInRoom, removeAllCharactersInRoom };
