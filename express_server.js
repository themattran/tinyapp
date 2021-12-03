const express = require('express');
const app = express(); 
const PORT = 8080; 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs'); 
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const getUserByEmail = require('./helpers');

app.use(
  cookieSession({
    name: 'session',
    keys: ['Some super-duper key!', 'Another string!']
  }
))

// -----------------> Database <----------------------

let users = { 
  'userRandomID': {
    id: 'userRandomID', 
    email: 'user@example.com', 
    password: 'purple-monkey-dinosaur'
  },
 'user2RandomID': {
    id: 'user2RandomID', 
    email: 'user2@example.com', 
    password: 'dishwasher-funk'
  },
  '89d39h': {
    id: '89d39h', 
    email: 'user3@example.com', 
    password: 'dishwasher-funk33'
  }
}

const urlDatabase = {
  b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'userRandomID' },
  i3BoGr: { longURL: 'https://www.google.ca', userID: 'user2RandomID' }
};

// -----------------> Database END <----------------------

// -----------------> Dry Functions <----------------------

function generateRandomString(len) {
  return Math.random().toString(20).substr(2, `${len > 6 ? (len = 6) : (len = 6)}`);
};

function getUserByPassword(password) {
  for (const userID in users) {
    if (bcrypt.compareSync(password, users[userID].password)) {
      return users[userID];
    }
  }
  return null; 
};

function urlsForUser(id) {
  const urlsForUser = {}

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urlsForUser[shortURL] = { longURL: urlDatabase[shortURL].longURL,  userID: urlDatabase[shortURL].userID }
    }
  }
  return urlsForUser;
}

// -----------------> Dry Functions END <----------------------

app.get('/', (req, res) => {
  res.redirect('/url');
}); 

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  const userID = req.session.user_id; 
  const userObject = users[userID];  
  const templateVars = {
    user: userObject,
  };

  if (!userObject) {
    return res.render('urls_login', templateVars)
  }
  
  res.render('urls_new', templateVars);
});


app.get('/urls', (req, res) => {
  const userID = req.session.user_id; 
  const userObject = users[userID];  
  const filterURL = urlsForUser(userID);
  const templateVars = {
    user: userObject,
    urls: filterURL
  };

  if (!userID) {
    return res.render('urls_login', templateVars);
  }

  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id; 
  const userObject = users[userID];
  let userURL = undefined; 
  
  if (userID) {
    const filterURL = urlsForUser(userID);
    userURL = filterURL[shortURL];
  } 

  const templateVars = { 
    user: userObject, 
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL] && urlDatabase[shortURL].longURL,
    userURL
  };
    
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(longURL.length);
  const userID = req.session.user_id;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  let userURL = undefined; 
  
  if (userID) {
    const filterURL = urlsForUser(userID); //Getting all URLs that are under user that is logged in 
    //{i3BoGr: { longURL: 'https://www.google.ca', userID: 'user2RandomID' }}
    userURL = filterURL[shortURL] //makes sure that shortURL from line 130 falls under logged in user 
    if (userURL) { //if UserURL is present
      delete urlDatabase[shortURL]; // allow to delete
    }
  } 
  res.redirect('/urls');
});


app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  let userURL = undefined; 
  
  if (userID) {
    const filterURL = urlsForUser(userID);
    userURL = filterURL[id] 
    if (userURL) {
      urlDatabase[id].longURL = req.body.longURL;
    }
  } 
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
  

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  const existingUser = getUserByEmail(email, users); 
  const existingPassword = getUserByPassword(password);
  
  console.log({email, password});
  console.log("Login Route existingUser", existingUser);
  console.log("Login Route existingPassword", existingPassword);
  
  if (!existingUser) {
    return res.status(403).send('Error 403: Email cannot be found. Try again.');
  } else if (!existingPassword) {
    return res.status(403).send('Error 403: Password incorrect. Try again.');
  }

  req.session.user_id = existingUser.id;
  res.redirect('/urls');
});

app.get('/login', function (req, res) {
  const userID = req.session.user_id; 
  const userObject = users[userID];  
  
  if (userObject) {
    return res.redirect('/urls')
  }

  const templateVars = {
    user: userObject
  };
  res.render('urls_login', templateVars);
})

app.post('/logout', (req, res) => { 
  res.clearCookie('session.sig');
  res.clearCookie('session');
  res.redirect('/urls');
});


app.get('/register', (req, res) => {
  const userID = req.session.user_id; 
  const userObject = users[userID];  

  if (userObject) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: userObject
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;

  if (email === '' || password === '') {
    return res.status(400).send('Error 400: Email and/or Password Empty');
  } 
  
  const existingUser = getUserByEmail(email, users); 

  if (existingUser) {
    return res.status(400).send('Error 400: Email already exists. Kindly, login to continue!');
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString(email.length);
  
  users = {
    ...users, 
    [id]: {
      id,
      email,
      password: hashedPassword
    }
  };
  
  req.session.user_id = id;
  res.redirect('/urls');
});

app.listen(PORT, () => {
console.log(`Example app listening on port ${PORT}!`);
}); 

module.exports = getUserByEmail;