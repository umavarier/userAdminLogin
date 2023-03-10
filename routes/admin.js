const express = require("express")
const app = express();
const session = require("express-session");
const nocache = require("nocache")
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const config = require("../config/config");
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
}));

app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

const auth = require("../middleware/adminAuth");

app.set('view engine', 'ejs');
app.set('views', './views/admin');

const bodyParser = require("body-parser");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());

app.get('/', auth.isLogout, async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message);
    }
});

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    }
    catch (error) {
        console.log(error.message)
    }
}

app.post('/', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render("login", { message: "email and password incorrect" });
                } else {
                    req.session.admin_id = userData._id;
                    res.redirect("/admin/home");
                }
            } else {
                res.render("login", { message: "email and password is incorrect" });
            }
        } else {
            res.render("login", { message: "email and password is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
});

app.get('/home', auth.isLogin, async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.admin_id });
        res.render("home", { admin: userData });
    } catch (error) {
        console.log(error.message);
    }
});

app.get('/logout', auth.isLogin, async (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/admin");
    } catch (error) {
        console.log(error.message);
    }
});

app.get('/dashboard', auth.isLogin, async (req, res) => {
    try {
        var search = "";
        if (req.query.search) {
            search = req.query.search;        
        }
        const userData = await User.find({
            is_admin: 0,
            $or: [
                { name: { $regex: ".*" + search + ".*" } },
                { email: { $regex: ".*" + search + ".*" } },
                { mobile: { $regex: ".*" + search + ".*" } },
            ],
        });
        res.render("dashboard", { users: userData });
    } catch (error) {
        console.log(error.message);
    }
});

app.get('/new-user', auth.isLogin, async (req, res) => {
    try {
        res.render("new-user");
    } catch (error) {
        console.log(error.message);
    }
});

app.post('/new-user', async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mno = req.body.mno;
        const password = req.body.password;
        const spassword = await securePassword(password);

        const user = new User({
            name: name,
            email: email,
            mobile: mno,
            password: spassword,
            is_admin: 0,
        });

        const userData = await user.save();
        if (userData) {
            res.redirect("/admin/dashboard");
        } else {
            res.render("new-user", { message: "Something Wrong" });
        }
    } catch (error) {
        console.log(error.message);
    }
});

app.get('/edit-user', auth.isLogin, async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {
            res.render("edit-user", { user: userData });
        } else {
            res.redirect("/admin/dashboard");
        }
    } catch (error) {
        console.log(error.message);
    }
});

app.post('/edit-user', async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id },
            {
                $set: {
                    name: req.body.name,
                    email: req.body.email,
                    mobile: req.body.mno,
                },
            }
        );
        res.redirect("/admin/dashboard");
        console.log(userData)
    } catch (error) {
        console.log(error.message);
    }
});

app.get('/delete-user', async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });
        res.redirect("/admin/dashboard");
    } catch (error) {
        console.log(error.message);
    }
});

app.get('*', function (req, res) {
    res.redirect('/admin');
})

module.exports = app;