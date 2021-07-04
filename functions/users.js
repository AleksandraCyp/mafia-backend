const users = [];

const addUser = ({ id, name, room, isAdmin, image }) => {
  const existingUser = users.find(
    (user) => user.room === room && user.name === name
  );
  if (!name || !room)
    return { error: "Nazwa użytkownika i numer pokoju są wymagane." };
  if (existingUser) return { error: "Nazwa użytkownika jest zajęta." };
  const user = { id, name, room, isAdmin, image };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
