const express = require("express");
const app = express(); 
const PORT = 8080; 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs"); 

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
  res.render("urls_new");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(longURL.length);
  //console.log('long & short', longURL, shortURL);
  urlDatabase = {...urlDatabase, [shortURL]: longURL} //copy of urlDatabase
  console.log('urlDatabase', urlDatabase); 
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  console.log(urlDatabase);
  res.redirect("/urls");
});

function generateRandomString(len) {
  return Math.random().toString(20).substr(2, `${len > 6 ? (len = 6) : (len = 6)}`);
}

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
console.log(`Example app listening on port ${PORT}!`);
}); 