const express = require("express");
const app = express();

const session = require("express-session");
const nocache = require("nocache");
const User = require('../models/userModel')
const bcrypt = require('bcrypt');
const config = require("../config/config");

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req, res, next) {
  if (!req.user)
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next();
});

const auth = require("../middleware/auth");

app.set("view engine", "ejs");
app.set("views", "./views/users");

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());

app.get('/', auth.isLogout,async(req, res) => {
  try {
    res.render('login');
  }
  catch (error) {
    console.log(error.message);
  }
})

app.get('/login', auth.isLogout, async(req, res) => {
  try {
    res.render('login');
  }
  catch (error) {
    console.log(error.message);
  }
})

const securePassword = async (password) => {
  try {
      const passwordHash = await bcrypt.hash(password,10);
      return passwordHash;
  }
  catch (error) {
      console.log(error.message)
  }
}

app.post("/login", async(req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email, is_admin: 0 });
    console.log("user:" + userData)
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      
      if (passwordMatch) {
        req.session.user_id = userData._id;
        req.session.user = userData.name;
        req.session.user1 = true
        res.redirect('/home')
      }
      else {
        res.render('login', { message: 'Invalid email and password' })
      }
    }
    else {
      res.render('login', { message: 'Invalid email and password' })
    }
  }
  catch (error) {
    console.log(error.message);
  }
})

app.get("/home", auth.isLogin,async (req, res) => {
  try {
    if (req.session.user) {
      res.render('home', { user: req.session.user })
    }  
  }
  catch (error) {
    console.log(error.message)
  }
})

app.get("/logout", auth.isLogin, (req, res) => {
  try {
        req.session.destroy();
        res.redirect('/login');
  }
  catch (error) {
    console.log(error.message)
  }
})

app.get("/register", auth.isLogout, (req, res) => {
  try {
    res.render('registration')

  }
  catch (error) {
    console.log(error.message)
  }

})

app.post('/register',async(req,res)=>{
  try {

    const spassword = await securePassword(req.body.password);
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mno,
        password: spassword,
        is_admin: 0

    });
    
    const userData = await user.save();
    console.log(userData);

    if (userData) {
        res.render('registration', { message: "your registration is succesful" })
    }
    else {
        res.render('registration', {message:"your registration is failed"})
    }

}
catch (error) {
    console.log(error.message);
}
})

module.exports = app;