require('dotenv').config()
const express = require('express')
    , session = require('express-session')
    , ejs = require('ejs')
;

const users = require('./controllers/users');
const patterns = require('./controllers/patterns');

const port = process.env.PORT;
const app = express(); 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.json({ limit: '300kb' }));

app.use(
    session({
        secret: process.env.SESSIONSECRET,
        cookie: { maxAge: 10 * 60 * 1000 },
        resave: true,
        saveUninitialized: false,  // critical
    })
);

/////////////////////////////////
//  start server
/////////////////////////////////
const server = app.listen(port, () => {
    console.log(`Server started today on port ${port}`);
});
// Handling Error
process.on("unhandledRejection", err => {
    console.log(`An error occurred: ${err.message}`)
    server.close(() => process.exit(1))
  })


/////////////////////////////////
// routes
/////////////////////////////////
//app.get("/", function (req, res) {users.renderContent(req, res)});
app.get("/", function (req, res) { users.renderHome(res,"")});

app.get("/login", function (req, res) {users.renderLogin(res,"")});
app.post("/login", async function (req, res) {users.login(req,res);});

app.get("/register", function (req, res) {users.renderRegister(res,"")} );
app.post("/register", async function(req, res) {users.register(req, res);});

app.get("/registerpassword", function (req, res) {users.renderRegisterPassword(req, res,"")} );
app.post("/registerpassword", function (req, res) {
    users.registerPassword(req, res,"")
} );

app.get("/resetpassword", function (req, res) {users.renderResetPassword(req, res,"")});
app.post("/resetpassword", async function(req, res) {
    users.resetPassword(req,res);
});

app.get("/changepassword", function (req, res) {users.renderChangePassword(req, res,"")});
app.post("/changepassword", async function(req, res) {
    users.changePassword(req,res);
});

app.get("/resetlink", async function(req, res) {users.renderSendLinkForm(res,"")});
app.post("/resetlink", async function(req, res) {users.sendResetLink(req, res);});

app.get("/logout", function (req, res) {users.logout(req, res);});

app.get("/content", function (req, res) {users.renderContent(req,res, "")});

app.get("/round", function (req, res)  {patterns.renderRound(req,res)});
// no need to hit the server and go back
// app.post("/roundSettings", function(req,res) {
//     console.log('renderRound');
//     patterns.renderRound(req,res)
// });

app.post("/savePattern",   function(req,res) {
    console.log('app.js received savePattern post');
    console.log(req.body);
    patterns.saveCurrentPattern(req,res,"");
});
