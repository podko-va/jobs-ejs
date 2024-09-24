const express = require("express");
require("express-async-errors");

const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

require("dotenv").config();

const app = express();

app.use(require("connect-flash")());

app.set("view engine", "ejs");

// Body parser
app.use(require("body-parser").urlencoded({ extended: true }));

// Cookie Parser
const cookieParser = require("cookie-parser");
app.use(cookieParser(process.env.SESSION_SECRET));

// CSRF Protection
const csrf = require("host-csrf");
let csrf_development_mode = true;
if (app.get("env") === "production") {
    csrf_development_mode = false;
    app.set("trust proxy", 1);
}
const csrf_options = {
    protected_operations: ["PATCH"],
    protected_content_types: ["application/json"],
    development_mode: csrf_development_mode,
};

const csrf_middleware = csrf(csrf_options); //initialise and return middlware
// Apply CSRF middleware to all routes
app.use(csrf_middleware);

// Session configuration
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
//Extra protection

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, //15 min
    max: 100 //limit each IP to 100 requests per windowMs
  })
);
app.use(helmet());
app.use(xss());

// Passport initialization
const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());


app.use(require("./middleware/storeLocals"));

// Routes
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

// secret word handling
const secretWordRouter = require("./routes/secretWord");
//app.use("/secretWord", secretWordRouter);
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

const jobs = require("./routes/jobs");
app.use("/jobs", auth, jobs);

// Error handling
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();