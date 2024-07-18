const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config();
const saltRounds = 10;

const app = express();
app.use(express.static("public"));

app.set("view engine", "ejs");
var email = "";

app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String
});

const noteSchema = new mongoose.Schema({
    title: String,
    contents: String,
    email: String
});

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/login.html");
})

app.post("/", async (req, res) => {
    var mail = String(req.body.email);
    var pass = String(req.body.password);

    try {
        const user = await User.findOne({ email: mail });

        if (user) {
            const passwordMatch = await bcrypt.compare(pass, user.password);

            if (passwordMatch) {
                email = mail;
                res.redirect("/home");
            } else {
                res.send("Sorry!!! Unsuccessful, incorrect password");
            }
        } else {
            res.send("User not signed up");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/home", async (req, res) => {
    try {
        const notes = await Note.find({ email: email });

        if (notes.length !== 0) {
            let arr = notes.map(note => ({
                title: note.title,
                content: note.contents
            }));

            res.render("home", { posts: arr });
        } else {
            res.render("home", { posts: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/signup.html");
})

app.post("/signup", async (req, res) => {
    var fName = req.body.firstName;
    email = req.body.email;
    var lName = req.body.lastName;
    var eemail = req.body.email;
    var pass = req.body.password;

    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(pass, salt);

        const newUser = new User({
            firstName: fName,
            lastName: lName,
            email: eemail,
            password: hashedPassword
        });

        await newUser.save();

        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})

app.get("/about", function (req, res) {
    res.render("about");
});

app.get("/contact", function (req, res) {
    res.render("contact");
});

app.get("/compose", function (req, res) {
    res.render("compose");
});

app.post("/compose", async (req, res) => {
    var ttitle = req.body.title;
    var ppost = req.body.post;

    if (email !== "" || ttitle == "") {
        try {
            const newNote = new Note({
                title: ttitle,
                contents: ppost,
                email: email
            });

            await newNote.save();
            res.redirect("/home");
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect("/");
    }
});

app.get("/edit", function (req, res) {
    res.render("edit");
});

app.post("/edit", async (req, res) => {
    var title = String(req.body.title);
    var content = String(req.body.new);

    try {
        await Note.findOneAndUpdate({ title: title }, { contents: content });
        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/delete", function (req, res) {
    res.render("delete");
})

app.post("/delete", async (req, res) => {
    var title = String(req.body.title);

    try {
        await Note.findOneAndDelete({ title: title });
        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

const port = process.env.PORT || 8000
app.listen( port, function () {
    console.log("server active at port 8000");
});
