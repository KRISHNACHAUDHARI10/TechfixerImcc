const express = require('express');
const engine = require("ejs-mate");
const app = express();
const path = require('path');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const dotenv = require('dotenv');
const methodOverride = require('method-override');

const userRoutes = require('./routes/custom.routes/user.routes.js');
const adminRoute = require('./routes/Admin.routes/admin.routes.js');
const electricianRoute = require('./routes/Electrician.routes/electrician.route.js');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.engine("ejs", engine);
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public'));


const dbUrl = process.env.MONGO_URL || `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`;

mongoose.connect(dbUrl)
  .then(() => {
    console.log("🗄️ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });


// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "this_is_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.session = req.session;
  res.locals.isLogged = req.session.user;
  next();
});

// Routes
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.get("/", (req, res) => {
  res.redirect("/user/");
});

app.use("/user", userRoutes);
app.use("/admin", adminRoute);
app.use("/electrician", electricianRoute);

// 404
app.all("*", (req, res) => {
  res.render("custom/pages/pageNotFoun.ejs");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
