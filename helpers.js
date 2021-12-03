function getUserByEmail(email, users) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return undefined; 
};

module.exports = getUserByEmail;