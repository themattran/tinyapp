const express = require("express");
const app = express(); 
const PORT = 8080; 
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs"); 

let users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "89d39h": {
    id: "user3RandomID", 
    email: "user3@example.com", 
    password: "dishwasher-funk33"
  }
}

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
}); 

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: req.cookies['user_id'],
    urls: urlDatabase };
  res.render("urls_new",templateVars);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"]; 
  const userObject = users[userID]; 

  const templateVars = {
    user: userObject,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { 
    user: req.cookies['user_id'], 
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(longURL.length);
  //console.log('long & short', longURL, shortURL);
  urlDatabase = {...urlDatabase, [shortURL]: longURL} //copy of urlDatabase
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

function generateRandomString(len) {
  return Math.random().toString(20).substr(2, `${len > 6 ? (len = 6) : (len = 6)}`);
};

function getUserByEmail(email) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null; 
};

function getUserByPassword(password) {
  for (const userID in users) {
    if (users[userID].password === password) {
      return users[userID];
    }
  }
  return null; 
};

//console.log(getUserByEmail("user3@example.com"));

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.post('/login', (req, res) => {

  const {email, password} = req.body;
  const existingUser = getUserByEmail(email); 
  const existingPassword = getUserByPassword(password);

  console.log({email, password});
  console.log(existingUser);
  console.log(existingPassword);

  if (!existingUser) {
    return res.status(403).send("Error 403: Email cannot be found. Try again.")
  } else if (!existingPassword) {
    return res.status(403).send("Error 403: Password incorrect. Try again.")
  }

  res.cookie('user_id', existingUser.id);
  res.redirect('/urls')
});

app.get('/login', function (req, res) {
  // const userID = req.cookies["user_id"]; 
  // const userObject = usersDatabase[userID]; 

  // const templateVars = {
  //   user: userObject,
  //   urls: urlDatabase
  // };

  // console.log(templateVars);
  res.render("urls_login");
})

app.post('/logout', (req, res) => { 
  res.clearCookie('user_id')
  res.redirect('/urls')
});


app.get('/register', (req, res) => {
  res.render("urls_register")
});

app.post('/register', (req, res) => {

  const {email, password} = req.body;
  
  if (email === '' || password === '') {
    return res.status(400).send("Error 400: Email and/or Password Empty");
  } 
  
  const existingUser = getUserByEmail(email); 
  
  if (existingUser) {
    return res.status(400).send("Error 400: Email already exists. Kindly, login to continue!");
  }
  
  const id = generateRandomString(email.length);
  
  users = {
    ...users, 
    [id]: {
      id,
      email,
      password
    }
  };
  
  res.cookie('user_id', id);
  console.log("Line 146 userdatabase:", users);
  res.redirect('/urls');
});

app.listen(PORT, () => {
console.log(`Example app listening on port ${PORT}!`);
}); 