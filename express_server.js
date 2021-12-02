const express = require("express");
const app = express(); 
const PORT = 8080; 
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs"); 

// -----------------> Database <----------------------

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
    id: "89d39h", 
    email: "user3@example.com", 
    password: "dishwasher-funk33"
  }
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

// -----------------> Database <----------------------


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

  const userID = req.cookies["user_id"]; 
  const userObject = users[userID];  
  const templateVars = {
    user: userObject,
  };

  if (!userObject) {
    return res.render("urls_login", templateVars)
  }

  
  res.render("urls_new", templateVars);
});


app.get("/urls", (req, res) => {

  const userID = req.cookies["user_id"]; 
  const userObject = users[userID];  
  const filterURL = urlsForUser(userID); 
  console.log("filterURL", filterURL); 

  const templateVars = {
    user: userObject,
    urls: filterURL
  };

  if (!userID) {
    return res.render("urls_login", templateVars)
  }
  
  console.log("urlDatabase", urlDatabase)

  res.render("urls_index", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"]; 
  const userObject = users[userID]
  let userURL = undefined; 
  
  if (userID) {
    const filterURL = urlsForUser(userID);
    //{i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }}
    userURL = filterURL[shortURL]
  } 

  const templateVars = { 
    user: userObject, 
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL] && urlDatabase[shortURL].longURL,
    userURL
  };

    
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(longURL.length);
  const userID = req.cookies['user_id'];
  urlDatabase[shortURL] = { longURL, userID }
  //longURL comes from <form> of urls_new
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  let userURL = undefined; 
  
  if (userID) {
    const filterURL = urlsForUser(userID); //Getting all URLs that are under user that is logged in 
    //{i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }}
    userURL = filterURL[shortURL] //makes sure that shortURL from line 130 falls under logged in user 
    if (userURL) { //if UserURL is present
      delete urlDatabase[shortURL]; // allow to delete
    }
  } 
  
  res.redirect("/urls");
});


app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.cookies["user_id"];
  let userURL = undefined; 
  
  if (userID) {
    const filterURL = urlsForUser(userID); //Getting all URLs that are under user that is logged in 
    //{i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }}
    userURL = filterURL[id] //makes sure that shortURL from line 130 falls under logged in user 
    if (userURL) { //if UserURL is present
      urlDatabase[id].longURL = req.body.longURL; //Allow to update 
      
    }
  } 

  res.redirect("/urls");
});

// -----------------> Dry Functions <----------------------

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

function urlsForUser(id) {
  
  const urlsForUser = {}

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urlsForUser[shortURL] = { longURL: urlDatabase[shortURL].longURL,  userID: urlDatabase[shortURL].userID }
    }
  }
  return urlsForUser;
}
//urlsForUser("user2RandomID") --> https://www.google.com - which is correct 
//console.log(getUserByEmail("user3@example.com"));

// -----------------> Dry Functions <----------------------



app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
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
  const userID = req.cookies["user_id"]; 
  const userObject = users[userID];  

  // if a user is already logged in, should we be showing them the login page? 

  const templateVars = {
    user: userObject
  };
  res.render("urls_login", templateVars);
})

app.post('/logout', (req, res) => { 
  res.clearCookie('user_id')
  res.redirect('/urls')
});


app.get('/register', (req, res) => {
  const userID = req.cookies["user_id"]; 
  const userObject = users[userID];  

  // if a user is already logged in, should we be showing them the register page? 

  const templateVars = {
    user: userObject
  };
  res.render("urls_register", templateVars)
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